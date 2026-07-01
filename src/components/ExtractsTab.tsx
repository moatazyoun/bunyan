/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSpreadsheet,
  Plus,
  Printer,
  UserCheck,
  BadgePercent,
  Building,
  Calendar,
  Coins,
  FileText,
  FileCheck,
  ChevronRight,
  Edit3,
  Save,
  Check,
  X,
  PlusCircle,
  Clock,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  Percent,
  ArrowUp,
  ArrowDown,
  Trash2,
  ShieldCheck,
  CheckCircle,
  History,
  Briefcase,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Share2,
} from "lucide-react";
import {
  Project,
  BOQItem,
  CompanyEntity,
  OwnerEntity,
  SupervisorEntity,
  Subcontractor,
  SignatoryItem,
  CustomExtract,
  ExtractItem,
} from "../types";
import ConfirmationDialog from "./ConfirmationDialog";
import {
  db,
  auth,
  doc,
  onSnapshot,
  setDoc,
  onAuthStateChanged,
} from "../lib/firebase";

interface ExtractsTabProps {
  siteId: string; // Add siteId for Firestore operations
  projectId: string;
  projects: Project[];
  extracts: CustomExtract[];
  setExtracts: (extracts: CustomExtract[]) => void;
  boqItems: BOQItem[];
  branding: {
    companyName: string;
    companyLogoUrl?: string;
    ownerLogoUrl?: string;
    consultantLogoUrl?: string;
    ownerName?: string;
    consultantName?: string;
  };
  companies?: CompanyEntity[];
  owners?: OwnerEntity[];
  supervisors?: SupervisorEntity[];
  subcontractors?: Subcontractor[];
  extractType: "Owner" | "Subcontractor";
  userRole?: string;
  addAuditLog: (
    action: string,
    module: string,
    details: string,
    customRefNo?: string,
  ) => void;
}

export default function ExtractsTab({
  siteId, // New prop
  projectId,
  projects,
  extracts,
  setExtracts,
  boqItems,
  branding,
  companies = [],
  owners = [],
  supervisors = [],
  subcontractors = [],
  extractType,
  userRole,
  addAuditLog,
}: ExtractsTabProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return projects.some((p) => p.id === projectId) ? projectId : "";
  });
  const [selectedExtract, setSelectedExtract] = useState<CustomExtract | null>(
    null,
  );
  const [settings, setSettings] = useState<any>(null);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    isOpen: boolean;
    message: string;
    details?: string;
  }>({ isOpen: false, message: "" });
  const [saveSuccess, setSaveSuccess] = useState<{ ref: string } | null>(null);
  const [signatorySaveSuccess, setSignatorySaveSuccess] = useState(false);
  const [localSignatories, setLocalSignatories] = useState<any[]>([]);

  useEffect(() => {
    if (settings?.signatories) {
      setLocalSignatories(Array.isArray(settings.signatories) ? settings.signatories : []);
    }
  }, [settings?.signatories]);

  const showError = (message: string, details?: string) => {
    setErrorInfo({ isOpen: true, message, details });
  };

  // Derived properties
  // FIX: Use selectedProjectId, otherwise fall back to the projectId prop.
  const activeProjectId = selectedProjectId || projectId;

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId],
  );

  const projectExtracts = useMemo(
    () => extracts.filter((e) => e.projectId === activeProjectId),
    [extracts, activeProjectId],
  );

  const activeBoqItems = useMemo(() => {
    return boqItems.filter((item) => item.projectId === activeProjectId);
  }, [boqItems, activeProjectId]);

  const linkedProject = activeProject;

  useEffect(() => {
    if (!activeProjectId) {
      setIsSettingsLoaded(true);
      return;
    }
    const initialSettings = {
      signatories: [],
      pageBookInfo: {},
      headerTexts: {
        ministry: "",
        authority: "",
        device: "",
        title: "",
        projectName: "",
        reference: "",
        period: "",
        contractor: "",
        contractorDetails: "",
      },
    };

    let unsubSnapshot: (() => void) | null = null;
    let isSubscribed = false;

    // Safety timeout to ensure that if firebase is offline or has permissions issues,
    // we still load default/initial settings in 1000ms instead of hanging the UI.
    const safetyTimer = setTimeout(() => {
      setSettings((current: any) => current || initialSettings);
      setIsSettingsLoaded(true);
    }, 1000);

    const startListening = () => {
      if (isSubscribed) return;
      isSubscribed = true;

      try {
        unsubSnapshot = onSnapshot(
          doc(db, "extractSettings", activeProjectId),
          (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data());
            } else {
              setSettings(initialSettings);
              setDoc(
                doc(db, "extractSettings", activeProjectId),
                initialSettings,
              ).catch((e) => {
                console.warn(
                  "Could not write default settings to Firestore (expected if read-only or auth pending):",
                  e,
                );
              });
            }
            setIsSettingsLoaded(true);
          },
          (error) => {
            console.warn(
              "Firestore onSnapshot error, continuing with default local settings:",
              error,
            );
            setSettings((current: any) => current || initialSettings);
            setIsSettingsLoaded(true);
          },
        );
      } catch (err) {
        console.error(
          "Synchronous error during Firestore onSnapshot subscription:",
          err,
        );
        setSettings((current: any) => current || initialSettings);
        setIsSettingsLoaded(true);
      }
    };

    // Start listening unconditionally on mount so it doesn't get stuck during Auth initialization
    startListening();

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubSnapshot) {
          try {
            unsubSnapshot();
          } catch (e) {
            console.error("Error closing previous snapshot:", e);
          }
          unsubSnapshot = null;
        }
        isSubscribed = false;
        startListening();
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      if (unsubSnapshot) {
        try {
          unsubSnapshot();
        } catch (e) {
          console.error("Error in snapshot unsubscribe clean-up:", e);
        }
      }
      unsubAuth();
    };
  }, [activeProjectId, extractType, activeProject]);

  const saveSettings = async (updates: any) => {
    if (!activeProjectId) return;
    try {
      await setDoc(
        doc(db, "extractSettings", activeProjectId),
        { ...settings, ...updates },
        { merge: true },
      );
    } catch (err) {
      console.error("Error saving cloud settings:", err);
    }
  };

  // UI Helpers matching Arabic accounting norms
  const getPriceParts = (rate: number) => {
    if (rate === 0 || !rate) return { pounds: "-", piastres: "-" };
    const pounds = Math.floor(rate);
    const piastresVal = Math.round((rate - pounds) * 100);
    return {
      pounds: pounds.toLocaleString("en-US"),
      piastres: piastresVal > 0 ? piastresVal : "-",
    };
  };

  const formatQty = (qty: number | undefined) =>
    qty === 0 || !qty
      ? "-"
      : qty.toLocaleString("en-US", { maximumFractionDigits: 3 });
  const formatVal = (val: number | undefined) =>
    val === 0 || !val
      ? "-"
      : val.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<"A4" | "A3">("A4");
  const [printOrientation, setPrintOrientation] = useState<
    "portrait" | "landscape"
  >("landscape");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingSignatories, setIsEditingSignatories] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingSignatoryNames, setIsEditingSignatoryNames] = useState(false);
  const [selectedSubcontractorId, setSelectedSubcontractorId] =
    useState<string>(() => subcontractors[0]?.id || "");

  const handleAddSignatory = () => {
    const newSignatory = {
      id: Date.now().toString(),
      role: "",
      name: "",
    };
    setLocalSignatories((prev) => [...prev, newSignatory]);
  };

  const handleRemoveSignatory = (id: string) => {
    const updatedSignatories = localSignatories.filter((s: any) => s.id !== id);
    setLocalSignatories(updatedSignatories);
    saveSettings({ signatories: updatedSignatories });
  };

  const handleUpdateSignatory = (
    id: string,
    updates: Partial<SignatoryItem>,
  ) => {
    setLocalSignatories((prev) =>
      prev.map((s: any) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const handleSaveSignatory = (id: string) => {
    saveSettings({ signatories: localSignatories });
    setSignatorySaveSuccess(true);
    setTimeout(() => setSignatorySaveSuccess(false), 3000);
  };

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "danger" | "success";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: () => {},
  });

  const triggerConfirmation = (
    title: string,
    message: string,
    type: "info" | "warning" | "danger" | "success",
    onAgree: () => void,
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onAgree();
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  useEffect(() => {
    const matching = extracts.filter((e) => {
      if (extractType === "Subcontractor") {
        return (
          e.projectId === activeProjectId &&
          e.subcontractorId === selectedSubcontractorId
        );
      }
      return e.projectId === activeProjectId;
    });
    setSelectedExtract((prev) => {
      if (prev) {
        const fresh = matching.find((e) => e.id === prev.id);
        if (fresh) return fresh;
      }
      return matching[0] || null;
    });
  }, [activeProjectId, extracts, extractType, selectedSubcontractorId]);

  // Automatic matching/synchronization of BOQ items whenever the selected extract is modified/selected
  useEffect(() => {
    if (!selectedExtract || !activeBoqItems.length) return;
    const currentItemsIds = new Set(
      (selectedExtract.items || []).map((i) => i.boqItemId),
    );
    const missingItems = activeBoqItems.filter(
      (item) => !currentItemsIds.has(item.id),
    );

    if (missingItems.length > 0) {
      const newItems = missingItems.map((item) => ({
        boqItemId: item.id,
        previousQuantity: getAutoPreviousQuantity(
          selectedExtract.extractNumber,
          item.id,
          extractType === "Subcontractor" ? selectedSubcontractorId : undefined,
        ),
        currentQuantity: 0,
        retentionPercent: 0,
      }));
      const updatedItems = [...(selectedExtract.items || []), ...newItems];
      const updatedExt = { ...selectedExtract, items: updatedItems };

      setSelectedExtract(updatedExt);
      setExtracts(
        extracts.map((e) => (e.id === selectedExtract.id ? updatedExt : e)),
      );
    }
  }, [
    selectedExtract?.id,
    activeBoqItems,
    extractType,
    selectedSubcontractorId,
  ]);

  const getAutoPreviousQuantity = (
    currentExtractNum: number,
    boqItemId: string,
    subId?: string,
  ): number => {
    let relevant = extracts.filter(
      (e) =>
        e.projectId === activeProjectId && e.extractNumber < currentExtractNum,
    );
    if (extractType === "Subcontractor" && subId) {
      relevant = relevant.filter((e) => e.subcontractorId === subId);
    }
    return relevant.reduce((sum, ext) => {
      const match = (ext.items || []).find((it) => it.boqItemId === boqItemId);
      return sum + (match ? match.currentQuantity : 0);
    }, 0);
  };

  const [isCreatingNewExtract, setIsCreatingNewExtract] = useState(false);
  const [newExtForm, setNewExtForm] = useState({
    number:
      projectExtracts.length > 0
        ? Math.max(...projectExtracts.map((e) => e.extractNumber)) + 1
        : 1,
    date: new Date().toISOString().split("T")[0],
    type: "current" as "current" | "final" | "no_works",
    showZeroItems: true,
  });

  const saveExtracts = async (
    newExtracts: CustomExtract[],
    actionDetails: string,
  ) => {
    if (!siteId) {
      showError("خطأ في الاتصال بقاعدة البيانات", "لا يوجد رقم موقع معرف.");
      return false;
    }

    try {
      const sanitizedExtracts = JSON.parse(JSON.stringify(newExtracts));

      // Use the reliable server-side save API to ensure write permissions and connection
      const response = await fetch(`/api/site/${siteId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { extracts: sanitizedExtracts } }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل السيرفر في معالجة طلب الحفظ.");
      }

      setExtracts(newExtracts);
      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      addAuditLog("تحديث", "المستخلصات", actionDetails, refNo);
      return true;
    } catch (e: any) {
      console.error("Error saving extracts:", e);
      showError(
        "فشل حفظ البيانات في قاعدة البيانات",
        e.message ||
          "يرجى التأكد من اتصال الإنترنت أو صلاحيات الوصول وإعادة المحاولة.",
      );
      return false;
    }
  };

  const handleAddNewExtract = async () => {
    // Check for duplicate number
    if (projectExtracts.some((e) => e.extractNumber === newExtForm.number)) {
      alert("رقم المستخلص هذا موجود مسبقاً لهذا المشروع. يرجى اختيار رقم آخر.");
      return;
    }

    const boundItems = activeBoqItems.map((item) => ({
      boqItemId: item.id,
      previousQuantity: getAutoPreviousQuantity(
        newExtForm.number,
        item.id,
        extractType === "Subcontractor" ? selectedSubcontractorId : undefined,
      ),
      currentQuantity: 0,
      retentionPercent: 0,
    }));

    const newExt: CustomExtract = {
      id: `ext-${Date.now()}`,
      projectId: activeProjectId,
      extractNumber: newExtForm.number,
      periodStart: new Date().toISOString().split("T")[0],
      periodEnd: newExtForm.date,
      status: "Draft",
      extractType: newExtForm.type as any,
      showZeroItems: newExtForm.showZeroItems,
      generalRetentionPercent: 0,
      withholdingNotes: "",
      items: boundItems,
      subcontractorId:
        extractType === "Subcontractor" ? selectedSubcontractorId : undefined,
    };

    const success = await saveExtracts(
      [...extracts, newExt],
      `إضافة مستخلص جديد رقم ${newExt.extractNumber} للمشروع ${activeProjectId}`,
    );
    if (success) {
      setSelectedExtract(newExt);
      setIsCreatingNewExtract(false);
      // Reset form for next time
      setNewExtForm({
        number: newExtForm.number + 1,
        date: new Date().toISOString().split("T")[0],
        type: "current",
        showZeroItems: true,
      });
    }
  };

  const handleUpdateItemQuantity = async (
    boqItemId: string,
    currentQty: number,
  ) => {
    if (!selectedExtract) return;
    const updatedItems = (selectedExtract.items || []).map((it) =>
      it.boqItemId === boqItemId ? { ...it, currentQuantity: currentQty } : it,
    );
    const updatedExt = { ...selectedExtract, items: updatedItems };
    setSelectedExtract(updatedExt);
    await saveExtracts(
      extracts.map((e) => (e.id === selectedExtract.id ? updatedExt : e)),
      `تحديث كمية بند رقم ${boqItemId} في مستخلص رقم ${selectedExtract.extractNumber}`,
    );
  };

  const handleUpdateItemRetention = async (
    boqItemId: string,
    retPct: number,
  ) => {
    if (!selectedExtract) return;
    const updatedItems = (selectedExtract.items || []).map((it) =>
      it.boqItemId === boqItemId ? { ...it, retentionPercent: retPct } : it,
    );
    const updatedExt = { ...selectedExtract, items: updatedItems };
    setSelectedExtract(updatedExt);
    await saveExtracts(
      extracts.map((e) => (e.id === selectedExtract.id ? updatedExt : e)),
      `تحديث نسبة الخصم للبند رقم ${boqItemId} في مستخلص رقم ${selectedExtract.extractNumber}`,
    );
  };

  const handleUpdateExtractParams = async (params: Partial<CustomExtract>) => {
    if (!selectedExtract) return;
    const updatedExt = { ...selectedExtract, ...params };
    setSelectedExtract(updatedExt);
    await saveExtracts(
      extracts.map((e) => (e.id === selectedExtract.id ? updatedExt : e)),
      `تحديث بيانات المستخلص رقم ${selectedExtract.extractNumber}`,
    );
  };

  const handleDeleteExtract = (id: string) => {
    const extToDelete = extracts.find((e) => e.id === id);
    triggerConfirmation(
      "حذف المستخلص",
      "هل أنت متأكد؟ لا يمكن تراجع عن الحذف السحابي.",
      "danger",
      async () => {
        const filtered = extracts.filter((e) => e.id !== id);
        const success = await saveExtracts(
          filtered,
          `حذف المستخلص رقم ${extToDelete?.extractNumber}`,
        );
        if (success && selectedExtract?.id === id)
          setSelectedExtract(filtered[0] || null);
      },
    );
  };

  const splitPrice = (price: number) => {
    const pounds = Math.floor(price);
    const piastres = Math.round((price - pounds) * 100);
    return { pounds, piastres: piastres.toString().padStart(2, "0") };
  };

  const extractCalculations = useMemo(() => {
    if (!selectedExtract)
      return {
        grossValue: 0,
        previousPaid: 0,
        totalDiscount: 0,
        netValue: 0,
        prevPaidTotal: 0,
        finalItemTotal: 0,
        itemsCalculated: [],
      };

    // Filter BOQ items specifically for the extract's project
    const currentProjectBoqItems = boqItems.filter(
      (item) => item.projectId === selectedExtract.projectId,
    );

    let grossTotalTotal = 0;
    let discountTotalTotal = 0;
    let prevPaidTotalTotal = 0;
    let finalItemTotalTotal = 0;

    const itemsCalculated = (selectedExtract.items || []).map((it) => {
      const matchBOQ = currentProjectBoqItems.find(
        (item) => item.id === it.boqItemId,
      );
      const rate = matchBOQ?.price || 0;
      const totalQty = it.previousQuantity + it.currentQuantity;

      const currentVal = (it.currentQuantity || 0) * rate;
      const totalGross = totalQty * rate;
      const discountVal = currentVal * ((it.retentionPercent || 0) / 100);
      const netValTotal = currentVal - discountVal;

      // Calculate "سابق المستحق صرفه في المستخلصات السابقة"
      let prevNetPaid = 0;
      let relevantExtracts = extracts.filter(
        (e) =>
          e.projectId === activeProjectId &&
          e.extractNumber < selectedExtract.extractNumber,
      );
      if (extractType === "Subcontractor" && selectedExtract.subcontractorId) {
        relevantExtracts = relevantExtracts.filter(
          (e) => e.subcontractorId === selectedExtract.subcontractorId,
        );
      }
      prevNetPaid = relevantExtracts.reduce((sum, ext) => {
        const match = (ext.items || []).find(
          (prevIt) => prevIt.boqItemId === it.boqItemId,
        );
        if (match) {
          const prevCurrentVal = (match.currentQuantity || 0) * rate;
          const prevDiscountVal =
            prevCurrentVal * ((match.retentionPercent || 0) / 100);
          return sum + (prevCurrentVal - prevDiscountVal);
        }
        return sum;
      }, 0);

      const itemTotal = prevNetPaid + netValTotal;

      grossTotalTotal += currentVal; // Base totals on current work as per user request
      discountTotalTotal += discountVal;
      prevPaidTotalTotal += prevNetPaid;
      finalItemTotalTotal += itemTotal;

      return {
        ...it,
        code: matchBOQ?.code || "-",
        description: matchBOQ?.description || "-",
        unit: matchBOQ?.unit || "-",
        boqQty: matchBOQ?.quantity || 0,
        rate,
        totalQty,
        totalGross,
        currentVal,
        discountVal,
        netValTotal,
        prevNetPaid,
        itemTotal,
      };
    });

    const filteredItems =
      selectedExtract.showZeroItems === false
        ? itemsCalculated.filter(
            (it) => it.totalQty > 0 || it.currentQuantity > 0,
          )
        : itemsCalculated;

    return {
      grossValue: grossTotalTotal,
      totalDiscount: discountTotalTotal,
      netValue: grossTotalTotal - discountTotalTotal,
      prevPaidTotal: prevPaidTotalTotal,
      finalItemTotal: finalItemTotalTotal,
      itemsCalculated: filteredItems,
    };
  }, [selectedExtract, boqItems, extracts, activeProjectId, extractType]);

  const handlePrintTechnicalExtract = (
    ext: CustomExtract,
    paperSize: "A4" | "A3",
    orientation: "portrait" | "landscape",
  ) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    let targetMinHeight = "180mm";
    if (paperSize === "A4") {
      targetMinHeight = orientation === "landscape" ? "180mm" : "262mm";
    } else if (paperSize === "A3") {
      targetMinHeight = orientation === "landscape" ? "262mm" : "385mm";
    }

    const dateStr =
      ext.periodEnd && !isNaN(new Date(ext.periodEnd).getTime())
        ? new Date(ext.periodEnd).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "غير محدد";
    const assignmentDateStr = activeProject?.assignmentDate
      ? new Date(activeProject.assignmentDate).toLocaleDateString("ar-EG")
      : ".......";

    // Generate table rows
    const rows = extractCalculations.itemsCalculated
      .map((item, index) => {
        const { pounds, piastres } = splitPrice(item.rate || 0);
        const isExceeded = item.totalQty > (item.boqQty || 0);
        return `
        <tr class="border-b border-slate-950 text-[10px] text-slate-950 text-center h-10 ${isExceeded ? "bg-amber-50/50" : ""}" style="page-break-inside: avoid; break-inside: avoid;">
          <td class="p-1 border border-slate-950 font-mono text-[11px] font-black">${item.code}</td>
          <td class="p-1.5 border border-slate-950 text-right font-black leading-tight text-[9px]">
            <div>${item.description}</div>
            ${isExceeded ? `<div class="text-[8px] text-rose-600 font-extrabold mt-0.5">⚠️ يتخطى المقايسة (${item.boqQty})</div>` : ""}
          </td>
          <td class="p-1 border border-slate-950">${item.unit}</td>
          <td class="p-1 border border-slate-950 font-mono">${item.boqQty}</td>
          <td class="p-1 border border-slate-950 font-mono">${piastres}</td>
          <td class="p-1 border border-slate-950 font-mono">${pounds}</td>
          <td class="p-1 border border-slate-950 font-mono text-slate-550">${formatQty(item.previousQuantity)}</td>
          <td class="p-1 border border-slate-950 font-mono font-black ${isExceeded ? "text-rose-700 bg-amber-100/50" : "bg-emerald-50/20"}">${formatQty(item.currentQuantity)}</td>
          <td class="p-1 border border-slate-950 font-mono font-black ${isExceeded ? "text-rose-700" : ""}">${formatQty(item.totalQty)}</td>
          <td class="p-1 border border-slate-950 font-mono">${formatVal(item.currentVal)}</td>
          <td class="p-1 border border-slate-950 font-mono text-rose-600">${item.retentionPercent}%</td>
          <td class="p-1 border border-slate-950 font-mono text-rose-700">${formatVal(item.discountVal)}</td>
          <td class="p-1 border border-slate-950 font-mono font-black bg-slate-50">${formatVal(item.netValTotal)}</td>
          <td class="p-1 border border-slate-950 font-mono text-slate-500">${formatVal(item.prevNetPaid)}</td>
          <td class="p-1 border border-slate-950 font-mono font-black bg-indigo-50/30 text-indigo-950">${formatVal(item.itemTotal)}</td>
        </tr>
      `;
      })
      .join("");

    // Prepare signatory rows
    const signatories1 = [
      { role: "ملاحظات", name: "", id: "notes" },
      ...(localSignatories[0] ? [localSignatories[0]] : []),
      ...(localSignatories[2] ? [localSignatories[2]] : []),
      ...(localSignatories[4] ? [localSignatories[4]] : []),
    ];

    const signatories2 = [
      { role: "المكتب الفنى", name: "", id: "tech_office" },
      ...(localSignatories[1] ? [localSignatories[1]] : []),
      ...(localSignatories[3] ? [localSignatories[3]] : []),
      ...(localSignatories[5] ? [localSignatories[5]] : []),
    ];

    const renderSigCol = (sig: any) => `
      <div class="flex flex-col items-center justify-start min-h-[80px] w-full p-1 mx-1">
        <div class="text-[9px] font-black text-slate-800 text-center w-full pb-0.5">${sig.role}</div>
        ${
          sig.id !== "notes" && sig.id !== "tech_office" && sig.name
            ? `
          <div class="text-[10px] font-bold text-slate-950 text-center mt-1">${sig.name}</div>
          <div class="h-8 w-full"></div>
        `
            : `<div class="h-12 w-full"></div>`
        }
      </div>
    `;

    const sigsHtmlRow1 = signatories1.map((s) => renderSigCol(s)).join("");
    const sigsHtmlRow2 = signatories2.map((s) => renderSigCol(s)).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة مستخلص فني - رقم ${ext.extractNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Tajawal', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: ${orientation === "landscape" ? "12mm 15mm 12mm 15mm" : "15mm 12mm 15mm 12mm"};
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
          }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Tajawal', sans-serif;
            background-color: white;
            box-sizing: border-box;
          }
          .border-double-custom {
            border-style: double;
          }
        </style>
      </head>
      <body class="p-1 bg-white text-slate-950">
        <div class="border-[4px] border-double-custom border-slate-950 p-5 flex flex-col justify-between box-border text-right rounded-3xl" dir="rtl" style="min-height: ${targetMinHeight}; max-width: 100%;">
          <div>
            <!-- Header section with 3 columns -->
            <div class="grid grid-cols-3 items-start mb-6 text-[10px] font-bold leading-relaxed border-b-2 border-slate-950 pb-4">
              <div class="space-y-1 text-center font-bold">
                ${
                  settings?.headerTexts?.ownerLogo
                    ? `
                  <div class="flex flex-col items-center mb-1">
                    <img src="${settings.headerTexts.ownerLogo}" class="h-14 w-auto object-contain" />
                  </div>
                `
                    : ""
                }
                <div>${settings?.headerTexts?.ministry || ""}</div>
                <div>${settings?.headerTexts?.authority || ""}</div>
                <div>${settings?.headerTexts?.device || ""}</div>
              </div>

              <div class="text-center space-y-2">
                <h1 class="text-xl font-black border-b-[2.5px] border-slate-950 inline-block px-6 pb-1">
                  ${ext.extractType === "final" ? "مستخلص ختامي" : ext.extractType === "no_works" ? "مستخلص صفري" : "مستخلص جاري"} (${ext.extractNumber})
                </h1>
                <p class="text-xs font-black text-slate-900">${linkedProject?.name || ""}</p>
                <div class="text-[9px] space-y-0.5 font-bold">
                  <p>بأمر إسناد رقم: ${activeProject?.assignmentNumber || "......."} بتاريخ: ${assignmentDateStr}</p>
                  <p class="text-slate-600">من بداية الأعمال وحتى ${dateStr}</p>
                </div>
              </div>

              <div class="space-y-1 text-center font-bold">
                ${
                  settings?.headerTexts?.contractorLogo
                    ? `
                  <div class="flex flex-col items-center mb-1">
                    <img src="${settings.headerTexts.contractorLogo}" class="h-14 w-auto object-contain" />
                  </div>
                `
                    : ""
                }
                <div class="font-black">${settings?.headerTexts?.contractor || ""}</div>
                <div>${settings?.headerTexts?.contractorDetails || ""}</div>
                <div>${settings?.headerTexts?.contractorDetails2 || ""}</div>
              </div>
            </div>

            <!-- Table of works -->
            <div class="mt-4 overflow-x-auto">
              <table class="w-full border-collapse border-[1.2px] border-slate-950 text-[9px] text-center font-bold">
                <thead class="bg-slate-100">
                  <tr>
                    <th rowspan="2" class="w-[4%] border border-slate-950 p-1">رقم</th>
                    <th rowspan="2" class="w-[21%] border border-slate-950 p-1.5">بيان الأعمال بالتفصيل ومواصفة البند</th>
                    <th rowspan="2" class="w-[3%] border border-slate-950 p-1">الوحدة</th>
                    <th rowspan="2" class="w-[5%] border border-slate-950 p-1">الكمية بالمناقصة</th>
                    <th colspan="2" class="w-[8%] border border-slate-950 p-1 border-b-[0.5px]">سعر الوحدة</th>
                    <th colspan="3" class="w-[18%] border border-slate-950 p-1">كميات الأعمال المنجزة</th>
                    <th rowspan="2" class="w-[8%] border border-slate-950 p-1 bg-slate-50/50">قيمة الاعمال الحالية</th>
                    <th rowspan="2" class="w-[4%] border border-slate-950 p-1 text-rose-600">الخصم</th>
                    <th rowspan="2" class="w-[6%] border border-slate-950 p-1 text-rose-600">قيمة الخصم</th>
                    <th rowspan="2" class="w-[8%] border border-slate-950 p-1 bg-slate-100">صافى المستحق صرفه</th>
                    <th rowspan="2" class="w-[8%] border border-slate-950 p-1">السابق صرفه</th>
                    <th rowspan="2" class="w-[8%] border border-slate-950 p-1 bg-indigo-50/30">الإجمالى</th>
                  </tr>
                  <tr>
                    <td class="w-[4%] border border-slate-950 p-1 font-semibold">قرش</td>
                    <td class="w-[4%] border border-slate-950 p-1 font-semibold">جنيه</td>
                    <td class="w-[6%] border border-slate-950 p-1">السابق</td>
                    <td class="w-[6%] border border-slate-950 p-1 bg-indigo-50/20">الحالي</td>
                    <td class="w-[6%] border border-slate-950 p-1">الإجمالي</td>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <!-- Totals Row -->
                  <tr class="bg-slate-100 font-black h-12 border-t-2 border-slate-950 text-[10px]">
                    <td colspan="9" class="border border-slate-950 px-4 text-center text-slate-900">الاجمالى العام</td>
                    <td class="border border-slate-950 font-mono">${formatVal(extractCalculations.grossValue)}</td>
                    <td class="border border-slate-950"></td>
                    <td class="border border-slate-950 font-mono text-rose-700">${formatVal(extractCalculations.totalDiscount)}</td>
                    <td class="border border-slate-950 font-mono bg-slate-200">${formatVal(extractCalculations.netValue)}</td>
                    <td class="border border-slate-950 font-mono text-slate-600">${formatVal(extractCalculations.prevPaidTotal)}</td>
                    <td class="border border-slate-950 font-mono text-[11px] bg-slate-300 text-indigo-950 underline">${formatVal(extractCalculations.finalItemTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Signature block -->
          <div class="mt-8 pt-4 border-t border-slate-300">
            <div class="grid grid-cols-4 gap-4">
              ${sigsHtmlRow1}
            </div>
            <div class="grid grid-cols-4 gap-4 mt-4">
              ${sigsHtmlRow2}
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 500);
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  };

  const calculateExtractValue = (ext: CustomExtract) => {
    return (ext.items || []).reduce((sum, item) => {
      const boqItem = boqItems.find((b) => b.id === item.boqItemId);
      const rate = boqItem?.price || 0;
      const val = (item.currentQuantity || 0) * rate;
      const discount = val * ((item.retentionPercent || 0) / 100);
      return sum + (val - discount);
    }, 0);
  };

  const handleSaveAll = async () => {
    let dataToSave = extracts;
    if (selectedExtract) {
      dataToSave = extracts.map((e) =>
        e.id === selectedExtract.id ? selectedExtract : e,
      );
    }
    const success = await saveExtracts(
      dataToSave,
      `حفظ جميع المستخلصات في المشروع ${activeProjectId}`,
    );
    if (success) {
      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      setSaveSuccess({ ref: refNo });
    }
  };

  const handlePrint = () => {
    if (selectedExtract) {
      setShowPrintModal(true);
    } else {
      alert("الرجاء اختيار مستخلص أولاً للطباعة");
    }
  };

  if (!isSettingsLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        <p className="mr-3 text-xs font-bold text-slate-500">
          جاري تحميل بيانات السحابة...
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center px-4 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-indigo-50 rounded-[30px] flex items-center justify-center mx-auto border-4 border-white shadow-xl">
          <Briefcase className="w-10 h-10 text-indigo-600" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            لا توجد مشروعات مسجلة في هذا الموقع
          </h2>
          <p className="text-slate-500 text-sm font-bold leading-relaxed">
            يرجى التوجه لعلامة تبويب{" "}
            <span className="text-indigo-600 font-black">
              "المشروعات والإسناد"
            </span>{" "}
            لإنشاء وتسجيل أول مشروع/عملية حتى تتمكن من عرض وإصدار المستخلصات
            الفنية الخاصة بها بشكل متزامن مع قاعدة البيانات السحابية.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="cloud-extracts-tab">
      <ConfirmationDialog
        {...confirmState}
        onCancel={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
      />

      {errorInfo.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border-t-4 border-red-500 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-red-900">
              {errorInfo.message}
            </h3>
            {errorInfo.details && (
              <p className="mb-4 text-sm text-red-700">{errorInfo.details}</p>
            )}
            <button
              onClick={() => setErrorInfo({ isOpen: false, message: "" })}
              className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 w-full"
            >
              موافق
            </button>
          </div>
        </div>
      )}

      {/* Project Selector (Enhanced Selection Screen) */}
      {!selectedProjectId ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-indigo-50 rounded-[30px] flex items-center justify-center mx-auto border-4 border-white shadow-xl">
              <Briefcase className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              اختيار العملية والمشروع
            </h2>
            <p className="text-slate-500 text-sm font-bold">
              يرجى اختيار المشروع لعرض واصدار المستخلصات الفنية الخاصة به
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all group flex flex-col items-start text-right"
              >
                <div className="flex justify-between w-full mb-6">
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">
                    Active Ops
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2">
                  {p.name}
                </h4>
                <div className="space-y-2 w-full">
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5" /> أمر إسناد:{" "}
                    {p.assignmentNumber}
                  </p>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {new Date(p.assignmentDate).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-50 w-full flex justify-between items-center text-[11px] font-black text-indigo-600">
                  <span>فتح السجل الفني</span>
                  <ArrowUp className="w-4 h-4 rotate-90" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Top Bar: Active Project Info + Add Extract */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 non-printable mb-6">
            <div className="flex items-center gap-5 flex-1">
              <button
                onClick={() => {
                  setSelectedProjectId("");
                  setSelectedExtract(null);
                }}
                className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all border border-slate-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    {linkedProject?.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    مشروع نشط • {projectExtracts.length} مستخلصات مصدرة
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-[20px] border border-slate-200">
                <button
                  onClick={
                    userRole === "viewer"
                      ? () => alert("عذراً، لا تملك صلاحية إصدار مستخلص جديد")
                      : () => setIsCreatingNewExtract(!isCreatingNewExtract)
                  }
                  disabled={userRole === "viewer"}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[11px] font-black transition-all ${userRole === "viewer" ? "bg-slate-300 text-slate-100 cursor-not-allowed border-none" : isCreatingNewExtract ? "bg-white text-rose-600 shadow-sm" : "text-indigo-600 hover:bg-white hover:shadow-sm"}`}
                >
                  {isCreatingNewExtract ? (
                    <>
                      <X className="w-4 h-4" /> إلغاء
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> مستخلص جديد
                    </>
                  )}
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-[18px] text-[11px] font-black shadow-lg hover:shadow-slate-200 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" /> طباعة التقارير
                </button>
              </div>
            </div>
          </div>

          {/* New Extract Inline Form */}
          <AnimatePresence>
            {isCreatingNewExtract && (
              <motion.div
                initial={{ opacity: 1, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 1, y: -20 }}
                className="mb-8 p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 rounded-3xl text-white shadow-xl border border-indigo-500/20 non-printable relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 p-8 opacity-10 text-indigo-505">
                  <PlusCircle className="w-64 h-64" />
                </div>
                <div className="relative z-10 text-right">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold tracking-tight">
                          إصدار مستخلص جديد
                        </h3>
                        <p className="text-[11px] text-indigo-200/60 mt-0.5">
                          أدخل تفاصيل المستخلص الجديد لإدارته ومطابقة الكميات
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6"
                    style={{ direction: "rtl" }}
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-indigo-200/85 block pr-1">
                        رقم المستخلص
                      </label>
                      <input
                        type="number"
                        value={newExtForm.number}
                        onChange={(e) =>
                          setNewExtForm({
                            ...newExtForm,
                            number: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-center text-sm font-bold text-white focus:border-indigo-400 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        placeholder="00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-indigo-200/85 block pr-1">
                        تاريخ المستخلص
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                        <input
                          type="date"
                          value={newExtForm.date}
                          onChange={(e) =>
                            setNewExtForm({
                              ...newExtForm,
                              date: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-10 text-center text-sm font-bold text-white focus:border-indigo-400 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-indigo-200/85 block pr-1">
                        نوع المستخلص
                      </label>
                      <select
                        value={newExtForm.type}
                        onChange={(e) =>
                          setNewExtForm({
                            ...newExtForm,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-center text-sm font-bold text-white focus:border-indigo-400 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none"
                      >
                        <option
                          value="current"
                          className="text-slate-900 bg-white font-bold"
                        >
                          جاري (Current)
                        </option>
                        <option
                          value="final"
                          className="text-slate-900 bg-white font-bold"
                        >
                          ختامي (Final)
                        </option>
                        <option
                          value="no_works"
                          className="text-slate-900 bg-white font-bold"
                        >
                          صفري (Zero)
                        </option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setNewExtForm({
                            ...newExtForm,
                            showZeroItems: !newExtForm.showZeroItems,
                          })
                        }
                        className={`flex items-center justify-between w-full p-3 rounded-2xl border transition-all text-xs font-bold ${
                          newExtForm.showZeroItems
                            ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                            : "bg-white/5 border-white/10 text-indigo-200/60 hover:bg-white/10 hover:border-white/15"
                        }`}
                      >
                        <span>عرض البنود الصفرية</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            newExtForm.showZeroItems
                              ? "bg-indigo-500 text-white"
                              : "border border-white/20 bg-white/5"
                          }`}
                        >
                          {newExtForm.showZeroItems && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewExtract(false)}
                      className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-100 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      تراجع
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewExtract}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-[0.98] border border-indigo-400/30"
                    >
                      <CheckCircle className="w-4 h-4" /> تأكيد وتوليد المستخلص
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Bar: Horizontal Extracts List */}
          <div
            className="flex items-center justify-start gap-4 overflow-x-auto pb-6 non-printable custom-scrollbar px-2 mb-8"
            style={{ direction: "rtl" }}
          >
            {projectExtracts
              .sort((a, b) => a.extractNumber - b.extractNumber)
              .map((ext, idx) => {
                const isSelected = selectedExtract?.id === ext.id;
                return (
                  <motion.div
                    key={ext.id}
                    initial={{ opacity: 1, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.04,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    onClick={() => setSelectedExtract(ext)}
                    className={`flex-shrink-0 w-56 p-4 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      isSelected
                        ? "bg-slate-900 border-indigo-600 shadow-xl shadow-indigo-950/10 scale-[1.02] text-white"
                        : "bg-white hover:bg-slate-50/70 border-slate-200/70 hover:border-indigo-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Subtle Elegant Background Icon */}
                    <FileText
                      className={`absolute -right-3 -bottom-3 w-16 h-16 opacity-[0.04] transform -rotate-12 transition-transform duration-500 group-hover:rotate-0 ${isSelected ? "text-white" : "text-slate-900"}`}
                    />

                    <div className="relative z-10 text-right h-full flex flex-col justify-between">
                      {/* Top Action & Badge Row */}
                      <div className="flex justify-between items-center mb-3">
                        <button
                          onClick={
                            userRole === "viewer"
                              ? () =>
                                  alert("عذراً، لا تملك صلاحية حذف المستخلصات")
                              : (e) => {
                                  e.stopPropagation();
                                  handleDeleteExtract(ext.id);
                                }
                          }
                          className={`p-1.5 rounded-lg transition-all ${
                            userRole === "viewer"
                              ? "text-slate-200 cursor-not-allowed"
                              : isSelected
                                ? "text-indigo-300/80 hover:text-rose-400 hover:bg-white/10"
                                : "text-slate-350 hover:text-rose-600 hover:bg-rose-50/80 opacity-0 group-hover:opacity-100 cursor-pointer"
                          }`}
                          title="حذف المستخلص"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md shadow-sm border ${
                            isSelected
                              ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"
                              : "bg-indigo-50/50 border-indigo-150 text-indigo-600"
                          }`}
                        >
                          {ext.extractType === "final"
                            ? "ختامي"
                            : ext.extractType === "no_works"
                              ? "صفري"
                              : "جاري"}
                        </div>
                      </div>

                      {/* Middle Info */}
                      <div className="space-y-1 mb-4">
                        <h4
                          className={`text-sm font-extrabold tracking-tight ${isSelected ? "text-white" : "text-slate-900"}`}
                        >
                          مستخلص {ext.extractNumber}
                        </h4>
                        <p
                          className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${isSelected ? "text-indigo-200/70" : "text-slate-400"}`}
                        >
                          <Calendar className="w-3 h-3 text-current opacity-70" />
                          <span>
                            {ext.periodEnd &&
                            !isNaN(new Date(ext.periodEnd).getTime())
                              ? new Date(ext.periodEnd).toLocaleDateString(
                                  "ar-EG",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )
                              : "غير محدد"}
                          </span>
                        </p>
                      </div>

                      {/* Bottom Status & Count Badges */}
                      <div
                        className={`flex items-center justify-between border-t pt-2.5 ${isSelected ? "border-white/10" : "border-slate-100"}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                              ext.status === "Paid"
                                ? isSelected
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-55/20"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : ext.status === "Approved"
                                  ? isSelected
                                    ? "bg-amber-500/20 text-amber-300 border-amber-55/20"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                  : isSelected
                                    ? "bg-indigo-500/20 text-indigo-200 border-indigo-55/20"
                                    : "bg-slate-50 text-slate-500 border-slate-200/80"
                            }`}
                          >
                            {ext.status === "Paid"
                              ? "تم الصرف"
                              : ext.status === "Approved"
                                ? "معتمد"
                                : "مسودة"}
                          </div>
                          <div
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${isSelected ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}
                          >
                            {calculateExtractValue(ext).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 0 },
                            )}{" "}
                            ج.م
                          </div>
                        </div>
                        <div
                          className={`text-[10px] font-extrabold ${isSelected ? "text-white" : "text-indigo-600"}`}
                        >
                          {
                            (ext.items || []).filter(
                              (item) =>
                                (item.currentQuantity || 0) *
                                  (boqItems.find((b) => b.id === item.boqItemId)
                                    ?.price || 0) !==
                                0,
                            ).length
                          }{" "}
                          <span className="text-[9px] font-medium opacity-70">
                            بند
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            {projectExtracts.length === 0 && (
              <div className="bg-slate-50 px-10 py-4 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm font-bold flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-200 rounded-full" />
                لا يوجد سجل مستخلصات سابق لهذا المشروع
              </div>
            )}
          </div>

          {/* Main Content: Editor & Preview */}
          <div className="space-y-6">
            {selectedExtract ? (
              <>
                {/* Editor Toolbar (Repositioned & Re-architected with Premium Design) */}
                <div
                  className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-[28px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 non-printable mb-8"
                  style={{ direction: "rtl" }}
                >
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Status Indicator Select */}
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-200/50 shadow-sm transition-all">
                      <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                        حالة المستخلص:
                      </span>
                      <select
                        value={selectedExtract.status}
                        onChange={(e) =>
                          handleUpdateExtractParams({
                            status: e.target.value as any,
                          })
                        }
                        className="bg-transparent text-[13px] font-bold text-indigo-600 outline-none cursor-pointer focus:ring-0"
                      >
                        <option value="Draft">مسودة (Draft)</option>
                        <option value="Approved">معتمد (Approved)</option>
                        <option value="Paid">تم الصرف (Paid)</option>
                      </select>
                    </div>

                    {/* Type Indicator Select */}
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-200/50 shadow-sm transition-all">
                      <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                        النوع:
                      </span>
                      <select
                        value={selectedExtract.extractType || "current"}
                        onChange={(e) =>
                          handleUpdateExtractParams({
                            extractType: e.target.value as any,
                          })
                        }
                        className="bg-transparent text-[13px] font-bold text-indigo-650 outline-none cursor-pointer focus:ring-0"
                      >
                        <option value="current">جاري</option>
                        <option value="final">ختامي</option>
                        <option value="no_works">صفري</option>
                      </select>
                    </div>

                    {/* Date Picker Input */}
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-200/50 shadow-sm transition-all">
                      <Calendar className="w-4 h-4 text-indigo-400 pointer-events-none" />
                      <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap text-right">
                        تاريخ المستخلص:
                      </span>
                      <input
                        type="date"
                        value={selectedExtract.periodEnd}
                        onChange={(e) =>
                          handleUpdateExtractParams({
                            periodEnd: e.target.value,
                          })
                        }
                        className="text-[13px] font-bold text-slate-650 bg-transparent focus:outline-none cursor-pointer select-none"
                      />
                    </div>

                    {/* Show Zero Value Items Checked Pill */}
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateExtractParams({
                          showZeroItems: !selectedExtract.showZeroItems,
                        })
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-[11px] font-bold shadow-sm ${
                        selectedExtract.showZeroItems
                          ? "bg-indigo-50/70 border-indigo-200/60 text-indigo-600"
                          : "bg-slate-50/50 border-slate-200/50 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                          selectedExtract.showZeroItems
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-200"
                        }`}
                      >
                        {selectedExtract.showZeroItems ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : null}
                      </div>
                      عرض البنود الصفرية
                    </button>

                    {/* Pulsing automatic sync banner to substitute manual button */}
                    <div
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100/80 rounded-2xl text-[11px] font-bold shadow-sm select-none"
                      title="تتم مزامنة كافة بنود المقايسة مع المستخلص تلقائياً فور تعديلها"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>مزامنه تلقائية للبنود</span>
                    </div>
                  </div>

                  {/* Edit Header and Reviewers action buttons */}
                  <div className="flex gap-2 items-center justify-end">
                    <div className="hidden md:block w-[1px] h-6 bg-slate-200 mx-2" />

                    <button
                      type="button"
                      onClick={
                        userRole === "viewer"
                          ? () => alert("عذراً، لا تملك صلاحية التعديل")
                          : () => setIsEditingHeader(!isEditingHeader)
                      }
                      disabled={userRole === "viewer"}
                      className={`p-2.5 transition-all rounded-2xl border flex items-center gap-1.5 text-[11px] font-black ${
                        userRole === "viewer"
                          ? "bg-slate-300 text-slate-100 cursor-not-allowed border-none"
                          : isEditingHeader
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                            : "bg-white text-slate-400 border-slate-100 hover:text-indigo-600 hover:bg-slate-50 hover:shadow-sm"
                      }`}
                      title="بيانات ترويسة التقرير"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>الترويسة</span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        userRole === "viewer"
                          ? () => alert("عذراً، لا تملك صلاحية التعديل")
                          : () =>
                              setIsEditingSignatoryNames(
                                !isEditingSignatoryNames,
                              )
                      }
                      disabled={userRole === "viewer"}
                      className={`p-2.5 transition-all rounded-2xl border flex items-center gap-1.5 text-[11px] font-black ${
                        userRole === "viewer"
                          ? "bg-slate-300 text-slate-100 cursor-not-allowed border-none"
                          : isEditingSignatoryNames
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                            : "bg-white text-slate-400 border-slate-100 hover:text-indigo-600 hover:bg-slate-50 hover:shadow-sm"
                      }`}
                      title="تعديل أسماء المقررين المخولين بالتوقيع"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>الموقعون</span>
                    </button>
                  </div>
                </div>
                {/* Header Editor */}
                {isEditingHeader && (
                  <div className="bg-slate-900 text-white p-6 rounded-2xl mb-6 non-printable border border-slate-700 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-black flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-blue-400" />
                        تعديل ترويسة التقرير الرسمي
                      </h3>
                      <button
                        onClick={() => setIsEditingHeader(false)}
                        className="text-slate-500 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500">
                          اسم الوزارة
                        </label>
                        <input
                          value={settings.headerTexts.ministry}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                ministry: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500">
                          اسم الهيئة
                        </label>
                        <input
                          value={settings.headerTexts.authority}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                authority: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500">
                          اسم الجهاز
                        </label>
                        <input
                          value={settings.headerTexts.device}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                device: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-500">
                          اسم المشروع بالكامل
                        </label>
                        <input
                          value={settings.headerTexts.projectName}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                projectName: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500">
                          رقم أمر الإسناد والتاريخ
                        </label>
                        <input
                          value={settings.headerTexts.reference}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                reference: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500">
                          اسم الشركة المنفذة
                        </label>
                        <input
                          value={settings.headerTexts.contractor}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                contractor: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-500">
                          تفاصيل المقاول
                        </label>
                        <input
                          value={settings.headerTexts.contractorDetails}
                          onChange={(e) =>
                            saveSettings({
                              headerTexts: {
                                ...settings.headerTexts,
                                contractorDetails: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Signatories Editor */}
                {isEditingSignatoryNames && (
                  <div className="bg-slate-900 text-white p-6 rounded-2xl mb-6 non-printable border border-slate-700 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-black flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        تعديل بيانات طاقم المراجعة والاعتماد (Signatories)
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddSignatory}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition"
                        >
                          <Plus className="w-3 h-3" /> إضافة توقيع
                        </button>
                        <button
                          onClick={() => setIsEditingSignatoryNames(false)}
                          className="text-slate-500 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {localSignatories.map((sig: any, idx: number) => (
                        <div
                          key={sig?.id || `sig0_${idx}`}
                          className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3 relative group"
                        >
                          <button
                            onClick={() => handleRemoveSignatory(sig.id)}
                            className="absolute top-2 left-2 text-slate-500 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500">
                              المسمى الوظيفي
                            </label>
                            <input
                              value={sig.role}
                              onChange={(e) =>
                                handleUpdateSignatory(sig.id, {
                                  role: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-[11px] font-bold"
                              placeholder="الوظيفة..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500">
                              الاسم الكامل
                            </label>
                            <input
                              value={sig.name}
                              onChange={(e) =>
                                handleUpdateSignatory(sig.id, {
                                  name: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-[11px] font-bold text-blue-400"
                              placeholder="الاسم..."
                            />
                          </div>
                          <button
                            onClick={() => handleSaveSignatory(sig.id)}
                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <Save className="w-3 h-3" /> حفظ التوقيع
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
                      ملاحظة: سيتم تحديث هذه البيانات في جميع المستخلصات
                      المرتبطة بهذا المشروع آلياً.
                    </p>
                  </div>
                )}

                {/* Official View (Interactive / In-Place Editing) */}
                <div className="flex justify-end mb-4 non-printable">
                  <button
                    onClick={handleSaveAll}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-[20px] text-[13px] font-black shadow-lg hover:shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <Save className="w-5 h-5" /> حفظ المستخلص
                  </button>
                </div>
                <div className="relative">
                  <div
                    className="printable-report bg-white shadow-2xl mx-auto font-sans text-slate-950 rounded-[40px] overflow-hidden border border-slate-200 print:p-0 print:shadow-none print:m-0 print:border-none print:rounded-none w-full max-w-full"
                    style={{ direction: "rtl", minHeight: "21cm" }}
                  >
                    <div className="border-[1.2px] border-slate-950 p-6 min-h-[20.6cm] flex flex-col m-1 rounded-[38px] print:m-0 print:border-[1.2px] print:rounded-none relative">
                      {/* Header Section */}
                      <div className="grid grid-cols-3 items-start mb-8 text-[11px] font-bold leading-relaxed">
                        <div className="space-y-1 text-center">
                          {/* Owner Logo */}
                          <div className="flex flex-col items-center mb-3">
                            {settings?.headerTexts?.ownerLogo ? (
                              <div className="relative group">
                                <img
                                  src={settings.headerTexts.ownerLogo}
                                  alt="Owner Logo"
                                  className="h-14 w-auto object-contain mb-1"
                                />
                                <button
                                  onClick={() =>
                                    saveSettings({
                                      headerTexts: {
                                        ...settings.headerTexts,
                                        ownerLogo: "",
                                      },
                                    })
                                  }
                                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity non-printable"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="non-printable">
                                <label className="cursor-pointer text-[8px] text-indigo-400 hover:text-indigo-600 flex flex-col items-center gap-1 border border-dashed border-indigo-100 p-2 rounded-lg">
                                  <Plus className="w-3 h-3" />
                                  <span>شعار المالك</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          saveSettings({
                                            headerTexts: {
                                              ...settings.headerTexts,
                                              ownerLogo: event.target
                                                ?.result as string,
                                            },
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                          <input
                            value={settings?.headerTexts?.ministry || ""}
                            onChange={(e) =>
                              saveSettings({
                                headerTexts: {
                                  ...settings.headerTexts,
                                  ministry: e.target.value,
                                },
                              })
                            }
                            className="w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 rounded p-0.5"
                            placeholder="السطر الأول"
                          />
                          <input
                            value={settings?.headerTexts?.authority || ""}
                            onChange={(e) =>
                              saveSettings({
                                headerTexts: {
                                  ...settings.headerTexts,
                                  authority: e.target.value,
                                },
                              })
                            }
                            className="w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 rounded p-0.5"
                            placeholder="السطر الثاني"
                          />
                          <input
                            value={settings?.headerTexts?.device || ""}
                            onChange={(e) =>
                              saveSettings({
                                headerTexts: {
                                  ...settings.headerTexts,
                                  device: e.target.value,
                                },
                              })
                            }
                            className="w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 rounded p-0.5"
                            placeholder="السطر الثالث"
                          />
                        </div>
                        <div className="text-center space-y-2">
                          <h1 className="text-2xl font-black border-b-[2.5px] border-slate-950 inline-block px-8 pb-1.5 mb-2">
                            {(selectedExtract.extractType === "final"
                              ? "مستخلص ختامي"
                              : selectedExtract.extractType === "no_works"
                                ? "مستخلص صفري"
                                : "مستخلص جاري") +
                              ` (${selectedExtract.extractNumber})`}
                          </h1>
                          <p className="text-[14px] font-black text-blue-900 px-4">
                            {linkedProject?.name}
                          </p>
                          <div className="mt-2 text-[10px] space-y-0.5 font-black">
                            <p>
                              بأمر إسناد رقم:{" "}
                              {activeProject?.assignmentNumber || "......."}{" "}
                              بتاريخ:{" "}
                              {activeProject?.assignmentDate
                                ? new Date(
                                    activeProject.assignmentDate,
                                  ).toLocaleDateString("ar-EG")
                                : "......."}
                            </p>
                            <p className="text-slate-600">
                              من بداية الاعمال وحتى{" "}
                              {new Date(
                                selectedExtract.periodEnd,
                              ).toLocaleDateString("ar-EG", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-center">
                          {/* Contractor Logo */}
                          <div className="flex flex-col items-center mb-3">
                            {settings?.headerTexts?.contractorLogo ? (
                              <div className="relative group">
                                <img
                                  src={settings.headerTexts.contractorLogo}
                                  alt="Contractor Logo"
                                  className="h-14 w-auto object-contain mb-1"
                                />
                                <button
                                  onClick={() =>
                                    saveSettings({
                                      headerTexts: {
                                        ...settings.headerTexts,
                                        contractorLogo: "",
                                      },
                                    })
                                  }
                                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity non-printable"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="non-printable">
                                <label className="cursor-pointer text-[8px] text-indigo-400 hover:text-indigo-600 flex flex-col items-center gap-1 border border-dashed border-indigo-100 p-2 rounded-lg">
                                  <Plus className="w-3 h-3" />
                                  <span>شعار المنفذ</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          saveSettings({
                                            headerTexts: {
                                              ...settings.headerTexts,
                                              contractorLogo: event.target
                                                ?.result as string,
                                            },
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                          <input
                            value={settings?.headerTexts?.contractor || ""}
                            onChange={(e) =>
                              saveSettings({
                                headerTexts: {
                                  ...settings.headerTexts,
                                  contractor: e.target.value,
                                },
                              })
                            }
                            className="w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 rounded p-0.5 font-black"
                            placeholder="السطر الأول"
                          />
                          <input
                            value={
                              settings?.headerTexts?.contractorDetails || ""
                            }
                            onChange={(e) =>
                              saveSettings({
                                headerTexts: {
                                  ...settings.headerTexts,
                                  contractorDetails: e.target.value,
                                },
                              })
                            }
                            className="w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 rounded p-0.5"
                            placeholder="السطر الثاني"
                          />
                          <input
                            value={
                              settings?.headerTexts?.contractorDetails2 || ""
                            }
                            onChange={(e) =>
                              saveSettings({
                                headerTexts: {
                                  ...settings.headerTexts,
                                  contractorDetails2: e.target.value,
                                },
                              })
                            }
                            className="w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 rounded p-0.5"
                            placeholder="السطر الثالث"
                          />
                        </div>
                      </div>

                      {/* Table with In-Place Editing */}
                      <div className="overflow-x-auto w-full pb-4">
                        <table className="official-table w-full border-collapse border-[1.2px] border-slate-950 text-[10px] text-center font-bold">
                          <thead className="bg-[#f5f5f5]">
                            <tr>
                              <th
                                rowSpan={2}
                                className="w-[4%] border border-slate-950 p-1"
                              >
                                رقم
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[21%] border border-slate-950 p-2 min-w-[250px]"
                              >
                                بيان الأعمال بالتفصيل ومواصفة البند
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[3%] border border-slate-950 p-1"
                              >
                                الوحدة
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[5%] border border-slate-950 p-1"
                              >
                                الكمية
                                <br />
                                بالمناقصة
                              </th>
                              <th
                                colSpan={2}
                                className="w-[8%] border border-slate-950 p-1 border-b-[0.5px]"
                              >
                                سعر الوحدة
                              </th>
                              <th
                                colSpan={3}
                                className="w-[18%] border border-slate-950 p-1"
                              >
                                كميات الأعمال المنجزة
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[8%] border border-slate-950 p-1"
                              >
                                قيمة الاعمال الحالية
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[4%] border border-slate-950 p-1 text-rose-600"
                              >
                                الخصم
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[6%] border border-slate-950 p-1 text-rose-600"
                              >
                                قيمة الخصم
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[8%] border border-slate-950 p-1 bg-slate-100"
                              >
                                صافى المستحق صرفه
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[8%] border border-slate-950 p-1"
                              >
                                السابق صرفه
                              </th>
                              <th
                                rowSpan={2}
                                className="w-[8%] border border-slate-950 p-1 bg-indigo-50/30"
                              >
                                الإجمالى
                              </th>
                            </tr>
                            <tr>
                              <td className="w-[4%] border border-slate-950 p-1">
                                قرش
                              </td>
                              <td className="w-[4%] border border-slate-950 p-1">
                                جنيه
                              </td>
                              <td className="w-[6%] border border-slate-950 p-1">
                                السابق
                              </td>
                              <td className="w-[6%] border border-slate-950 p-1 bg-indigo-50/50">
                                الحالي
                              </td>
                              <td className="w-[6%] border border-slate-950 p-1">
                                الإجمالي
                              </td>
                            </tr>
                          </thead>
                          <tbody>
                            {extractCalculations.itemsCalculated.map(
                              (item, idx) => {
                                const { pounds, piastres } = splitPrice(
                                  item.rate || 0,
                                );
                                const isExceeded =
                                  item.totalQty > (item.boqQty || 0);
                                return (
                                  <tr
                                    key={item.boqItemId}
                                    className={`h-10 hover:bg-indigo-50/20 group transition-colors ${isExceeded ? "bg-amber-50/25" : ""}`}
                                  >
                                    <td className="border border-slate-950 p-1 font-mono text-[11px] font-black">
                                      {item.code}
                                    </td>
                                    <td className="border border-slate-950 p-2 text-right text-[9px] font-black leading-tight">
                                      <div>{item.description}</div>
                                      {isExceeded && (
                                        <div className="text-[10px] text-rose-600 font-extrabold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md mt-1 inline-flex items-center gap-1 animate-pulse">
                                          <span>
                                            ⚠️ يتخطى المقايسة ({item.boqQty})
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="border border-slate-950 p-1">
                                      {item.unit}
                                    </td>
                                    <td className="border border-slate-950 p-1">
                                      {item.boqQty}
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono">
                                      {piastres}
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono">
                                      {pounds}
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono text-slate-400">
                                      {formatQty(item.previousQuantity)}
                                    </td>
                                    <td
                                      className={`border border-slate-950 p-0 overflow-hidden transition-colors ${isExceeded ? "bg-amber-100/70 text-amber-900" : "bg-emerald-50/20 group-hover:bg-emerald-50/40"}`}
                                    >
                                      <input
                                        type="number"
                                        value={item.currentQuantity || ""}
                                        onChange={(e) =>
                                          handleUpdateItemQuantity(
                                            item.boqItemId,
                                            Number(e.target.value),
                                          )
                                        }
                                        disabled={userRole === "viewer"}
                                        className={`w-full h-full text-center font-mono font-black border-none focus:outline-none bg-transparent ${isExceeded ? "text-rose-700 bg-amber-50" : "focus:bg-emerald-100"} print:bg-transparent transition-all placeholder:text-slate-300 ${userRole === "viewer" ? "cursor-not-allowed opacity-70" : ""}`}
                                        placeholder="0.00"
                                      />
                                    </td>
                                    <td
                                      className={`border border-slate-950 p-1 font-mono font-black transition-colors ${isExceeded ? "bg-rose-50 text-rose-700 font-extrabold" : ""}`}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {isExceeded && (
                                          <span
                                            className="text-rose-600 text-[11px]"
                                            title="تجاوز المقايسة"
                                          >
                                            ⚠️
                                          </span>
                                        )}
                                        <span>{formatQty(item.totalQty)}</span>
                                      </div>
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono">
                                      {formatVal(item.currentVal)}
                                    </td>
                                    <td className="border border-slate-950 p-0 overflow-hidden bg-rose-50/20 text-rose-600 group-hover:bg-rose-50/40 transition-colors">
                                      <div
                                        className="flex items-center justify-center gap-0 w-full h-full"
                                        dir="ltr"
                                      >
                                        <input
                                          type="number"
                                          value={item.retentionPercent}
                                          onChange={(e) =>
                                            handleUpdateItemRetention(
                                              item.boqItemId,
                                              Number(e.target.value),
                                            )
                                          }
                                          disabled={userRole === "viewer"}
                                          className={`w-10 h-full text-right font-mono font-black border-none focus:outline-none bg-transparent focus:bg-rose-100 text-rose-600 print:bg-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${userRole === "viewer" ? "cursor-not-allowed opacity-70" : ""}`}
                                        />
                                        <span className="text-rose-600 font-black text-xs select-none pr-1">
                                          %
                                        </span>
                                      </div>
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono text-rose-700">
                                      {formatVal(item.discountVal)}
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono font-black bg-slate-50">
                                      {formatVal(item.netValTotal)}
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono text-slate-500">
                                      {formatVal(item.prevNetPaid)}
                                    </td>
                                    <td className="border border-slate-950 p-1 font-mono font-black bg-indigo-50/20 text-indigo-950">
                                      {formatVal(item.itemTotal)}
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                            {/* Totals Row */}
                            <tr className="bg-slate-100 font-black h-12 border-t-2 border-slate-950">
                              <td
                                colSpan={9}
                                className="border border-slate-950 px-4 text-sm text-center"
                              >
                                الاجمالى العام
                              </td>
                              <td className="border border-slate-950 font-mono">
                                {formatVal(extractCalculations.grossValue)}
                              </td>
                              <td className="border border-slate-950"></td>
                              <td className="border border-slate-950 font-mono text-rose-700">
                                {formatVal(extractCalculations.totalDiscount)}
                              </td>
                              <td className="border border-slate-950 font-mono text-base bg-slate-200">
                                {formatVal(extractCalculations.netValue)} ج.م
                              </td>
                              <td className="border border-slate-950 font-mono text-slate-600">
                                {formatVal(extractCalculations.prevPaidTotal)}
                              </td>
                              <td className="border border-slate-950 font-mono text-base bg-slate-300 text-indigo-950 underline">
                                {formatVal(extractCalculations.finalItemTotal)}{" "}
                                ج.م
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Signatures */}
                      <div className="mt-auto pt-8 px-4">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {/* Row 1 */}
                          {[
                            { role: "ملاحظات", name: "", id: "notes" },
                            ...(localSignatories[0]
                              ? [localSignatories[0]]
                              : []),
                            ...(localSignatories[2]
                              ? [localSignatories[2]]
                              : []),
                            ...(localSignatories[4]
                              ? [localSignatories[4]]
                              : []),
                          ].map((sig: any, idx) => (
                            <div
                              key={sig?.id || `sig1_${idx}`}
                              className="flex flex-col items-center justify-between min-h-[80px] p-1 w-full mx-1 relative group"
                            >
                              <input
                                value={sig.role}
                                onChange={(e) => {
                                  if (sig.id === "notes") return;
                                  const updatedSigs = localSignatories.map(
                                    (s: any) =>
                                      s.id === sig.id
                                        ? { ...s, role: e.target.value }
                                        : s,
                                  );
                                  setLocalSignatories(updatedSigs);
                                }}
                                className="w-full text-center bg-transparent border-none outline-none focus:bg-white rounded-none p-0.5 pb-0.5 text-[9px] font-black text-slate-900 mb-0.5"
                                readOnly={sig.id === "notes"}
                              />
                              {sig.id !== "notes" ? (
                                <>
                                  <input
                                    value={sig.name}
                                    onChange={(e) => {
                                      const updatedSigs = localSignatories.map(
                                        (s: any) =>
                                          s.id === sig.id
                                            ? { ...s, name: e.target.value }
                                            : s,
                                      );
                                      setLocalSignatories(updatedSigs);
                                    }}
                                    className="w-full text-center bg-transparent border-none outline-none focus:bg-white rounded p-0.5 text-[10px] font-bold text-slate-950 mt-1 mb-1"
                                  />
                                  <div className="w-full h-8"></div>
                                </>
                              ) : (
                                <div className="w-full h-12"></div>
                              )}
                              {sig.id !== "notes" && (
                                <button
                                  onClick={() => handleSaveSignatory(sig.id)}
                                  className="absolute top-0 right-0 p-1 bg-emerald-100 text-emerald-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-sm z-10"
                                >
                                  <Save className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Row 2 */}
                          {[
                            {
                              role: "المكتب الفنى",
                              name: "",
                              id: "tech_office",
                            },
                            ...(localSignatories[1]
                              ? [localSignatories[1]]
                              : []),
                            ...(localSignatories[3]
                              ? [localSignatories[3]]
                              : []),
                            ...(localSignatories[5]
                              ? [localSignatories[5]]
                              : []),
                          ].map((sig: any, idx) => (
                            <div
                              key={sig?.id || `sig2_${idx}`}
                              className="flex flex-col items-center justify-between min-h-[80px] p-1 w-full mx-1 relative group"
                            >
                              <input
                                value={sig.role}
                                onChange={(e) => {
                                  if (sig.id === "tech_office") return;
                                  const updatedSigs = localSignatories.map(
                                    (s: any) =>
                                      s.id === sig.id
                                        ? { ...s, role: e.target.value }
                                        : s,
                                  );
                                  setLocalSignatories(updatedSigs);
                                }}
                                className="w-full text-center bg-transparent border-none outline-none focus:bg-white rounded-none p-0.5 pb-0.5 text-[9px] font-black text-slate-900 mb-0.5"
                                readOnly={sig.id === "tech_office"}
                              />
                              {sig.id !== "tech_office" ? (
                                <>
                                  <input
                                    value={sig.name}
                                    onChange={(e) => {
                                      const updatedSigs = localSignatories.map(
                                        (s: any) =>
                                          s.id === sig.id
                                            ? { ...s, name: e.target.value }
                                            : s,
                                      );
                                      setLocalSignatories(updatedSigs);
                                    }}
                                    className="w-full text-center bg-transparent border-none outline-none focus:bg-white rounded p-0.5 text-[10px] font-bold text-slate-950 mt-1 mb-1"
                                  />
                                  <div className="w-full h-8"></div>
                                </>
                              ) : (
                                <div className="w-full h-12"></div>
                              )}
                              {sig.id !== "tech_office" && (
                                <button
                                  onClick={() => handleSaveSignatory(sig.id)}
                                  className="absolute top-0 right-0 p-1 bg-emerald-100 text-emerald-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-sm z-10"
                                >
                                  <Save className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-700 non-printable">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 mb-2">
                  <Clock className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-slate-500 tracking-tight">
                  سجل المستخلصات والمراجعة الفنية
                </h3>
                <p className="text-sm text-slate-400 font-bold max-w-sm">
                  يرجى اختيار مستخلص من القائمة العلوية أو إصدار مستخلص جديد
                  لبدء تسجيل ومطابقة كميات الأعمال المنفذة
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Print Technical Extract Settings Modal */}
      {showPrintModal && selectedExtract && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right"
          dir="rtl"
        >
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                إعدادات طباعة المستخلص الفني
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-slate-500 mb-1">
                  المستخلص المستهدف:
                </p>
                <p className="text-sm font-black text-indigo-900 bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl">
                  مستخلص رقم {selectedExtract.extractNumber} (
                  {selectedExtract.extractType === "final"
                    ? "مستخلص ختامي"
                    : selectedExtract.extractType === "no_works"
                      ? "مستخلص صفري"
                      : "مستخلص جاري"}
                  )
                </p>
              </div>

              <div>
                <p className="text-xs font-black text-slate-500 mb-2">
                  نوع التقرير للطباعة:
                </p>
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-indigo-950 leading-relaxed">
                  بيان كشف حركة حساب المستخلص الفني متضمناً قياسات البنود، قيم
                  الاعمال الحالية، نسب ومبالغ الخصم وصافي المبالغ المستحق صرفها
                  للمشروع.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-bold">
                    حجم الورقة:
                  </label>
                  <select
                    value={printPaperSize}
                    onChange={(e: any) => setPrintPaperSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="A4">A4 (قياسي)</option>
                    <option value="A3">A3 (كبير جداً - تفصيلي)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-bold">
                    اتجاه الصفحة:
                  </label>
                  <select
                    value={printOrientation}
                    onChange={(e: any) => setPrintOrientation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="landscape">أفقي (Landscape - مستحسن)</option>
                    <option value="portrait">رأسي (Portrait)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  handlePrintTechnicalExtract(
                    selectedExtract,
                    printPaperSize,
                    printOrientation,
                  );
                  setShowPrintModal(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition text-center text-xs"
              >
                تأكيد وأمر الطباعة
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-3 rounded-xl transition text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {saveSuccess && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border-t-4 border-emerald-500 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-emerald-900">
              تم الحفظ بنجاح
            </h3>
            <p className="mb-4 text-slate-600">
              تم حفظ المستخلص بنجاح. رقم مرجع العملية:{" "}
              <span className="font-mono font-bold text-slate-900">
                {saveSuccess.ref}
              </span>
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setSaveSuccess(null)}
                className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signatory Success Toast */}
      {signatorySaveSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">تم حفظ بيانات التوقيع بنجاح</span>
        </div>
      )}
    </div>
  );
}
