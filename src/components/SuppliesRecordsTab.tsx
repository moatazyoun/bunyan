import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  Check, 
  X, 
  Calendar, 
  Truck, 
  FileText, 
  DollarSign, 
  FileSpreadsheet, 
  CheckCircle,
  AlertCircle,
  FileCheck,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Printer,
  Sparkles,
  Cpu,
  FileUp,
  Brain,
  Loader2,
  FolderOpen,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SupplyRecord, SupplyItem } from '../types';
import { parseArabicNumber } from '../utils/numbers';

import ConfirmationDialog from './ConfirmationDialog';

interface SuppliesRecordsTabProps {
  supplyRecords: SupplyRecord[];
  onAddRecord: (rec: SupplyRecord | SupplyRecord[]) => void;
  onUpdateRecord: (id: string, updates: Partial<SupplyRecord>) => void;
  onDeleteRecord: (id: string) => void;
  supplyItems: SupplyItem[];
  suppliers: any[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
  setSupplyItems?: (items: SupplyItem[]) => void;
  setContractorsReport?: (report: any[]) => void;
  setSupplyRecords?: (records: SupplyRecord[]) => void;
}

export default function SuppliesRecordsTab({
  supplyRecords,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  supplyItems,
  suppliers,
  userRole,
  addAuditLog,
  setSupplyItems,
  setContractorsReport,
  setSupplyRecords
}: SuppliesRecordsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterItem, setFilterItem] = useState('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'ticketNo' | 'date', direction: 'asc' | 'desc' } | null>(null);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Direct Excel/CSV Import States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiFile, setAiFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<{
    supplyRecords: any[];
    extractedSuppliers: any[];
    extractedItems: any[];
  } | null>(null);

  const [selectedAIReclList, setSelectedAIReclList] = useState<number[]>([]);
  const [selectedAISuppliers, setSelectedAISuppliers] = useState<string[]>([]);
  const [selectedAIItems, setSelectedAIItems] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // States for excel columns matching
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[][]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [workbookObj, setWorkbookObj] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState({
    ticketNo: '',
    date: '',
    supplierName: '',
    itemCode: '',
    truckPlate: '',
    rawQuantity: '',
    unitPrice: '',
    netQuantity: '',
    discount: '',
    notes: ''
  });

  // Print States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'A3'>('A4');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  const handlePrintRecords = (paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = sortedRecords.map((r, index) => {
      const matchItem = supplyItems.find(i => i.code === r.itemCode);
      return `
        <tr class="border-b border-slate-300 text-[10px] text-slate-850 text-center">
          <td class="p-1.5 border border-slate-400 font-bold">${index + 1}</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono text-indigo-700">${r.ticketNo}</td>
          <td class="p-1.5 border border-slate-400 font-mono">${r.date}</td>
          <td class="p-1.5 border border-slate-400 text-right font-black">${r.supplierName}</td>
          <td class="p-1.5 border border-slate-400 text-right font-medium">${matchItem?.name || r.itemName || r.itemCode}</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono">${r.truckPlate} ${r.trailerPlate ? ' / ' + r.trailerPlate : ''}</td>
          <td class="p-1.5 border border-slate-400 font-mono">${r.rawQuantity.toLocaleString()} م٣</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono text-indigo-900">${r.netQuantity.toLocaleString()} م٣</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono">${(r.unitPrice || 0).toLocaleString()} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono text-slate-900">${(r.totalCost || 0).toLocaleString()} ج.م</td>
        </tr>
      `;
    }).join('');

    const totalRaw = sortedRecords.reduce((sum, r) => sum + r.rawQuantity, 0);
    const totalNet = sortedRecords.reduce((sum, r) => sum + r.netQuantity, 0);
    const totalCost = sortedRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>بيان حركات التوريدات</title>
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
            margin: 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
          }
          body {
            font-family: 'Tajawal', sans-serif;
            background-color: white;
          }
        </style>
      </head>
      <body class="p-2 bg-white text-slate-900">
        <div class="border-4 border-double border-slate-700 p-4 min-h-full flex flex-col justify-between">
          <div>
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div class="text-right space-y-1">
                <h1 class="text-xs font-black text-slate-800">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[9px] font-bold text-slate-500">إدارة المشروعات والرقابة الهندسية والتوريدات</p>
                <p class="text-[8px] text-slate-400">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center">
                <div class="border border-slate-800 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <span class="text-[10px] font-black text-slate-800 block">شعار بنيان</span>
                  <span class="text-[8px] font-bold text-slate-400">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-0.5">
                <p class="font-bold">الموقع: <span class="font-black text-indigo-750">مشروع برج العرب الجديدة</span></p>
                <p class="font-bold text-[10px] text-slate-500">مستند جرد: بيان حركة التوريدات اليومية</p>
              </div>
            </div>

            <!-- Title -->
            <div class="text-center my-4">
              <h2 class="text-base font-black text-slate-900 border-b-2 border-indigo-600 inline-block pb-0.5 px-4 uppercase tracking-wider">
                بيان حركة توريدات الخامات والمواد الموقعية
              </h2>
              <p class="text-[10px] font-bold text-slate-500 mt-1">
                الفلترة النشطة: المورد [${filterSupplier === 'all' ? 'الكل' : filterSupplier}] - الخامة [${filterItem === 'all' ? 'الكل' : filterItem}]
              </p>
            </div>

            <!-- Table -->
            <div class="mt-2">
              <table class="w-full text-right text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-[10px]">
                    <th class="p-2 border border-slate-400 w-10">م</th>
                    <th class="p-2 border border-slate-400">رقم البون</th>
                    <th class="p-2 border border-slate-400">التاريخ</th>
                    <th class="p-2 border border-slate-400 text-right">اسم المورد</th>
                    <th class="p-2 border border-slate-400 text-right">الخامة الموردة</th>
                    <th class="p-2 border border-slate-400">رقم السيارة/المقطورة</th>
                    <th class="p-2 border border-slate-400">الكمية المقدرة</th>
                    <th class="p-2 border border-slate-400">الكمية الصافية</th>
                    <th class="p-2 border border-slate-400">سعر الوحدة</th>
                    <th class="p-2 border border-slate-400">التكلفة الإجمالية</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <!-- Totals Row -->
                  <tr class="bg-slate-50 border-t-2 border-slate-800 text-[10px] font-black text-center">
                    <td colspan="6" class="p-2 border border-slate-400 text-right text-slate-900">
                      الإجمالي العام للحركات المفلترة (${sortedRecords.length} بون توريد):
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-900">
                      ${totalRaw.toLocaleString()} م٣
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-indigo-750">
                      ${totalNet.toLocaleString()} م٣
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-500">
                      ---
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-900">
                      ${totalCost.toLocaleString()} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-4 gap-4 text-center text-[9px] font-black text-slate-700 mt-12 border-t border-slate-300 pt-4">
            <div class="space-y-10">
              <p>مستلم البونات والموقع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>المكتب الفني ومراجع الكميات</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>المدير المالي للموقع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>اعتماد مدير المشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
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

  const [formState, setFormState] = useState({
    date: new Date().toISOString().split('T')[0],
    ticketNo: '',
    truckPlate: '',
    trailerPlate: '',
    driverName: '',
    rawQuantity: '',
    discount: '0',
    unitPrice: '',
    supplierName: '',
    supplyLocation: 'برج العرب الجديدة - قطاع الطرق الموزع',
    itemCode: '',
    supplyMethod: 'truck' as 'truck' | 'ton' | 'piece' | 'cubic',
    isWaterBillApproved: false,
    notes: '',
    ledgerNo: '1',
    selectedDeliveryMethodId: '' 
  });

  const computedNetAndCost = useMemo(() => {
    const raw = parseArabicNumber(formState.rawQuantity);
    const discount = parseArabicNumber(formState.discount);
    const price = parseArabicNumber(formState.unitPrice);

    const net = Math.max(0, raw - discount);
    const cost = net * price;

    return { net, cost };
  }, [formState.rawQuantity, formState.discount, formState.unitPrice]);

  const filteredRecords = useMemo(() => {
    let result = [...supplyRecords];

    if (searchQuery.trim()) {
      const queries = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter(r => {
        return queries.every(q => 
          (r.ticketNo || '').toLowerCase().includes(q) ||
          (r.truckPlate || '').toLowerCase().includes(q) ||
          (r.trailerPlate || '').toLowerCase().includes(q) ||
          (r.driverName || '').toLowerCase().includes(q) ||
          (r.notes || '').toLowerCase().includes(q)
        );
      });
    }

    if (filterSupplier !== 'all') {
      result = result.filter(r => r.supplierName === filterSupplier);
    }

    if (filterItem !== 'all') {
      result = result.filter(r => r.itemCode === filterItem);
    }

    return result;
  }, [supplyRecords, searchQuery, filterSupplier, filterItem]);

  const sortedRecords = useMemo(() => {
    let result = [...filteredRecords];
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.key];
        let bVal: any = b[sortConfig.key];

        // Handle ticketNo as numeric if possible, else string
        if (sortConfig.key === 'ticketNo') {
          const aN = parseInt(aVal);
          const bN = parseInt(bVal);
          if (!isNaN(aN) && !isNaN(bN)) {
            aVal = aN;
            bVal = bN;
          }
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filteredRecords, sortConfig]);

  const requestSort = (key: 'ticketNo' | 'date') => {
    if (!sortConfig || sortConfig.key !== key) {
      setSortConfig({ key, direction: 'asc' });
    } else if (sortConfig.direction === 'asc') {
      setSortConfig({ key, direction: 'desc' });
    } else {
      setSortConfig(null);
    }
  };

  const getSortIcon = (key: 'ticketNo' | 'date') => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 inline text-slate-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 inline text-indigo-600" /> : <ArrowDown className="h-3 w-3 inline text-indigo-600" />;
  };

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(suppliers.map(s => s.name))).sort();
  }, [suppliers]);

  const handleResetQuantities = () => {
    if (userRole === 'viewer') return;
    setShowResetConfirmModal(true);
  };

  const handleExecuteFullClear = () => {
    if (setSupplyRecords) {
      setSupplyRecords([]);
      addAuditLog(
        'تفريغ جدول التوريدات',
        'التوريدات',
        'تم حذف وإخلاء جميع بونات التوريد من الجدول تماماً للبدء في إدخال السجلات من الصفر.'
      );
      setShowResetConfirmModal(false);
    }
  };

  const handleExecuteQuantitiesReset = () => {
    if (setSupplyRecords) {
      const resetRecords = supplyRecords.map(rec => ({
        ...rec,
        rawQuantity: 0,
        discount: 0,
        netQuantity: 0,
        totalCost: 0,
        supplyMethod: 'manual' as any,
        cubicCertificateId: undefined
      }));
      setSupplyRecords(resetRecords);
      addAuditLog(
        'تصفير كميات التوريدات',
        'التوريدات',
        `تم تصفير جميع الكميات والخصومات لعدد (${supplyRecords.length}) بون توريد في الجدول بنجاح.`
      );
      setShowResetConfirmModal(false);
    }
  };

  const handleOpenAdd = () => {
    const lastRec = supplyRecords.length > 0 ? supplyRecords[supplyRecords.length - 1] : null;

    // Find max ticketNo to suggest the next one
    let nextTicketNo = '';
    const numericTickets = supplyRecords
      .map(r => parseInt(r.ticketNo))
      .filter(n => !isNaN(n));
    if (numericTickets.length > 0) {
      nextTicketNo = (Math.max(...numericTickets) + 1).toString();
    }

    setEditingId(null);
    setVehicleSearch('');
    setFormState({
      date: new Date().toISOString().split('T')[0],
      ticketNo: nextTicketNo,
      truckPlate: '',
      trailerPlate: '',
      driverName: '',
      rawQuantity: '',
      discount: '0',
      unitPrice: lastRec ? (supplyItems.find(i => i.code === lastRec.itemCode)?.defaultPrice?.toString() || '') : '',
      supplierName: lastRec ? lastRec.supplierName : '',
      supplyLocation: 'برج العرب الجديدة - قطاع الطرق الموزع',
      itemCode: lastRec ? lastRec.itemCode : '',
      supplyMethod: 'truck',
      isWaterBillApproved: false,
      notes: '',
      ledgerNo: '1',
      selectedDeliveryMethodId: ''
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (rec: SupplyRecord) => {
    setEditingId(rec.id);
    setVehicleSearch('');
    setFormState({
      date: rec.date,
      ticketNo: rec.ticketNo,
      truckPlate: rec.truckPlate || '',
      trailerPlate: rec.trailerPlate || '',
      driverName: rec.driverName || '',
      rawQuantity: rec.rawQuantity.toString(),
      discount: rec.discount.toString(),
      unitPrice: rec.unitPrice.toString(),
      supplierName: rec.supplierName,
      supplyLocation: rec.supplyLocation || 'برج العرب الجديدة - قطاع الطرق الموزع',
      itemCode: rec.itemCode,
      supplyMethod: (rec.supplyMethod as any) || 'truck',
      isWaterBillApproved: rec.isWaterBillApproved || false,
      notes: rec.notes || '',
      ledgerNo: rec.ledgerNo || '1',
      selectedDeliveryMethodId: ''
    });
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    const raw = parseFloat(formState.rawQuantity);
    const price = parseFloat(formState.unitPrice);

    if (isNaN(raw) || raw <= 0) return alert("الرجاء إدخال كمية صحيحة.");
    if (isNaN(price) || price < 0) return alert("الرجاء إدخال سعر صحيح.");

    const itemObj = supplyItems.find(i => i.code === formState.itemCode);
    const refNo = editingId ? (supplyRecords.find(r => r.id === editingId)?.referenceNo || `REC-${Date.now().toString().slice(-6)}`) : `REC-${Date.now().toString().slice(-6)}`;

    // Fallback: if there's no serial number (ticketNo), make the referenceNo act as the serial number
    let finalTicketNo = formState.ticketNo.trim();
    if (!finalTicketNo) {
      finalTicketNo = refNo;
    }

    // Check for duplicate serial/ticket number
    const isDuplicate = supplyRecords.some(r => r.ticketNo.trim() === finalTicketNo && r.id !== editingId);
    if (isDuplicate) {
      alert(`⚠️ عذراً، رقم البون/السيريال (${finalTicketNo}) مكرر ومسجل مسبقاً! يرجى استخدام رقم بون فريد لمنع الازدواجية.`);
      return;
    }

    const recordData: SupplyRecord = {
      id: editingId || `sup-ticket-${Date.now()}`,
      referenceNo: refNo,
      date: formState.date,
      ticketNo: finalTicketNo,
      truckPlate: formState.truckPlate,
      trailerPlate: formState.trailerPlate || undefined,
      driverName: formState.driverName,
      rawQuantity: raw,
      discount: parseFloat(formState.discount) || 0,
      netQuantity: computedNetAndCost.net,
      unitPrice: price,
      totalCost: computedNetAndCost.cost,
      supplierName: formState.supplierName,
      supplyLocation: formState.supplyLocation,
      itemCode: formState.itemCode,
      unit: itemObj?.unit || 'م٣',
      ledgerNo: formState.ledgerNo,
      isWaterBillApproved: formState.isWaterBillApproved,
      supplyMethod: formState.supplyMethod,
      notes: formState.notes,
      cubicCertificateId: editingId ? supplyRecords.find(r => r.id === editingId)?.cubicCertificateId : undefined
    };

    if (editingId) {
      onUpdateRecord(editingId, recordData);
      addAuditLog('تعديل بون توريد', 'التوريدات', `تم تعديل بون توريد ورقي رقم: ${recordData.ticketNo} مرجع: ${refNo} للمورد: ${recordData.supplierName}`);
    } else {
      onAddRecord(recordData);
      addAuditLog('تسجيل بون توريد', 'التوريدات', `تم تسجيل بون توريد جديد ورقي رقم: ${recordData.ticketNo} مرجع: ${refNo} للمورد: ${recordData.supplierName} (كمية: ${recordData.netQuantity} ${recordData.unit})`);
      localStorage.setItem('lastSupplyItemCode', formState.itemCode);
      localStorage.setItem('lastSupplySupplierName', formState.supplierName);
    }

    setShowFormModal(false);
  };

  const confirmDelete = () => {
    if (userRole === 'viewer') return;
    if (deleteConfirmId) {
      onDeleteRecord(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Excel/CSV Direct Import Handlers
  const formatExcelDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    
    const parts = str.split(/[/\-.]/);
    if (parts.length === 3) {
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let day = parseInt(parts[2]);
      
      if (year > 1000) {
        // YYYY-MM-DD
      } else {
        // Assume DD/MM/YYYY
        year = parseInt(parts[2]);
        month = parseInt(parts[1]);
        day = parseInt(parts[0]);
      }
      
      if (year < 100) year += 2000;
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
      }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const parseNumberValue = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const clean = String(val)
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const autoDetectColumns = (headers: string[]) => {
    const mapping = {
      ticketNo: '',
      date: '',
      supplierName: '',
      itemCode: '',
      truckPlate: '',
      rawQuantity: '',
      unitPrice: '',
      netQuantity: '',
      notes: ''
    };

    headers.forEach(h => {
      const val = h.toLowerCase().trim();
      if (!mapping.ticketNo && (val.includes('بون') || val.includes('ايصال') || val.includes('إيصال') || val.includes('ticket') || val.includes('voucher') || val.includes('رقم ب') || val.includes('سند'))) {
        mapping.ticketNo = h;
      } else if (!mapping.date && (val.includes('تاريخ') || val.includes('date') || val.includes('يوم') || val.includes('time'))) {
        mapping.date = h;
      } else if (!mapping.supplierName && (val.includes('مورد') || val.includes('مقاول') || val.includes('supplier') || val.includes('contractor') || val.includes('الشركة') || val.includes('الجهة') || val.includes('اسم الم'))) {
        mapping.supplierName = h;
      } else if (!mapping.itemCode && (val.includes('خامة') || val.includes('مادة') || val.includes('صنف') || val.includes('نوع') || val.includes('item') || val.includes('material') || val.includes('بيان') || val.includes('خامات') || val.includes('اسم الخ'))) {
        mapping.itemCode = h;
      } else if (!mapping.truckPlate && (val.includes('سيارة') || val.includes('لوحة') || val.includes('قلاب') || val.includes('مقطورة') || val.includes('truck') || val.includes('plate') || val.includes('رقم س') || val.includes('رقم ال'))) {
        mapping.truckPlate = h;
      } else if (!mapping.rawQuantity && (val.includes('كمية') || val.includes('كميه') || val.includes('تكعيب') || val.includes('حجم') || val.includes('quantity') || val.includes('raw') || val.includes('حمولة') || val.includes('وزن') || val.includes('كمية ال'))) {
        mapping.rawQuantity = h;
      } else if (!mapping.unitPrice && (val.includes('فئة') || val.includes('سعر') || val.includes('الفئة') || val.includes('price') || val.includes('unitprice') || val.includes('قيمة') || val.includes('سعر الم'))) {
        mapping.unitPrice = h;
      } else if (!mapping.netQuantity && (val.includes('صافي') || val.includes('صافى') || val.includes('net'))) {
        mapping.netQuantity = h;
      } else if (!mapping.notes && (val.includes('ملاحظة') || val.includes('ملاحظات') || val.includes('notes') || val.includes('البيان'))) {
        mapping.notes = h;
      }
    });

    return mapping;
  };

  const handleExcelCSVFileParse = (file: File) => {
    setAiError('');
    setIsAIAnalyzing(true);
    setAiFile({
      base64: '',
      mimeType: file.type || 'application/octet-stream',
      name: file.name
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("لا توجد أوراق عمل (Sheets) في هذا الملف.");
        }
        
        setWorkbookObj(workbook);
        setAvailableSheets(workbook.SheetNames);
        const firstSheetName = workbook.SheetNames[0];
        setSelectedSheet(firstSheetName);
        
        processSheet(workbook, firstSheetName);
      } catch (err: any) {
        console.error(err);
        setAiError(`خطأ في قراءة ملف Excel/CSV: ${err.message}`);
        setIsAIAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setAiError('فشل في قراءة الملف.');
      setIsAIAnalyzing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const processSheet = (workbook: any, sheetName: string) => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (!json || json.length === 0) {
        throw new Error("ورقة العمل المحددة فارغة.");
      }
      
      let headerIdx = 0;
      while (headerIdx < json.length && (!json[headerIdx] || json[headerIdx].length === 0)) {
        headerIdx++;
      }
      
      if (headerIdx >= json.length) {
        throw new Error("لم يتم العثور على أي بيانات في ورقة العمل.");
      }
      
      const headers = json[headerIdx].map((h: any) => String(h || '').trim());
      const rows = json.slice(headerIdx + 1).filter((r: any) => r && r.length > 0);
      
      setExcelHeaders(headers);
      setExcelRows(rows);
      
      const mapping = autoDetectColumns(headers);
      setColumnMapping(mapping);
      setIsAIAnalyzing(false);
    } catch (err: any) {
      setAiError(`خطأ في معالجة ورقة العمل: ${err.message}`);
      setIsAIAnalyzing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!workbookObj) return;
    setSelectedSheet(sheetName);
    setIsAIAnalyzing(true);
    setTimeout(() => {
      processSheet(workbookObj, sheetName);
    }, 50);
  };

  const generateImportPreview = () => {
    if (excelRows.length === 0) {
      setAiError("لا توجد صفوف بيانات لتحليلها.");
      return;
    }

    setAiError('');
    setIsAIAnalyzing(true);

    try {
      const records: any[] = [];
      const extractedSuppliersMap = new Map<string, string>();
      const extractedItemsMap = new Map<string, { name: string; defaultPrice: number }>();

      const getColIdx = (colName: string) => excelHeaders.indexOf(colName);
      
      const idxTicketNo = getColIdx(columnMapping.ticketNo);
      const idxDate = getColIdx(columnMapping.date);
      const idxSupplier = getColIdx(columnMapping.supplierName);
      const idxItemCode = getColIdx(columnMapping.itemCode);
      const idxTruckPlate = getColIdx(columnMapping.truckPlate);
      const idxRawQuantity = getColIdx(columnMapping.rawQuantity);
      const idxUnitPrice = getColIdx(columnMapping.unitPrice);
      const idxDiscount = getColIdx(columnMapping.discount);
      const idxNotes = getColIdx(columnMapping.notes);

      excelRows.forEach((row, rowIdx) => {
        if (!row || row.length === 0) return;

        const rawSupplier = idxSupplier >= 0 ? String(row[idxSupplier] || '').trim() : '';
        if (!rawSupplier && row.every(cell => cell === null || cell === undefined || cell === '')) return;

        const ticketVal = idxTicketNo >= 0 ? String(row[idxTicketNo] || '').trim() : '';
        const dateVal = idxDate >= 0 ? row[idxDate] : null;
        const itemVal = idxItemCode >= 0 ? String(row[idxItemCode] || '').trim() : 'رمل';
        const truckVal = idxTruckPlate >= 0 ? String(row[idxTruckPlate] || '').trim() : 'عامة';
        const rawQtyVal = idxRawQuantity >= 0 ? row[idxRawQuantity] : 0;
        const unitPriceVal = idxUnitPrice >= 0 ? row[idxUnitPrice] : 0;
        const discountVal = idxDiscount >= 0 ? parseNumberValue(row[idxDiscount]) : 0;
        const notesVal = idxNotes >= 0 ? String(row[idxNotes] || '').trim() : 'مستورد من ملف';

        const formattedDate = formatExcelDate(dateVal);
        
        // If ticketNo is empty, we will let it act as AUTO during preview, 
        // but in handleImportAIResults we will use the reference number as its serial!
        const ticketNo = ticketVal || ''; 
        const rawQuantity = parseNumberValue(rawQtyVal);
        const unitPrice = parseNumberValue(unitPriceVal);
        const netQuantity = Math.max(0, rawQuantity - discountVal);
        const totalCost = netQuantity * unitPrice;

        const supplierName = rawSupplier || 'مقاول عام';
        const itemName = itemVal || 'رمل';
        const itemCode = itemName;

        if (supplierName) {
          extractedSuppliersMap.set(supplierName, itemCode);
        }

        if (itemCode) {
          extractedItemsMap.set(itemCode, { name: itemName, defaultPrice: unitPrice });
        }

        records.push({
          ticketNo,
          date: formattedDate,
          supplierName,
          itemName,
          itemCode,
          truckPlate: truckVal || 'عامة',
          rawQuantity,
          unitPrice,
          discount: discountVal,
          netQuantity,
          totalCost,
          notes: notesVal
        });
      });

      if (records.length === 0) {
        throw new Error("لم يتم العثور على أي حركات توريد صالحة للاستيراد. يرجى مراجعة ربط الأعمدة.");
      }

      const extractedSuppliers: any[] = [];
      extractedSuppliersMap.forEach((materialCode, name) => {
        extractedSuppliers.push({ name, materialCode });
      });

      const extractedItems: any[] = [];
      extractedItemsMap.forEach((val, code) => {
        extractedItems.push({ code, name: val.name, defaultPrice: val.defaultPrice });
      });

      setAiResult({
        supplyRecords: records,
        extractedSuppliers,
        extractedItems
      });

      setSelectedAIReclList(records.map((_, i) => i));
      setSelectedAISuppliers(extractedSuppliers.map(s => s.name));
      setSelectedAIItems(extractedItems.map(i => i.code));

      setIsAIAnalyzing(false);
    } catch (err: any) {
      setAiError(err.message || 'حدث خطأ أثناء معالجة الصفوف وتوليد المعاينة.');
      setIsAIAnalyzing(false);
    }
  };

  const handleAIFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleExcelCSVFileParse(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleExcelCSVFileParse(file);
  };

  const handleImportAIResults = () => {
    if (!aiResult) return;

    let addedSuppliersCount = 0;
    let addedItemsCount = 0;
    let addedRecordsCount = 0;

    // 1. Add Suppliers automatically
    if (setContractorsReport && aiResult.extractedSuppliers) {
      const suppliersToImport = aiResult.extractedSuppliers.filter(s => selectedAISuppliers.includes(s.name));
      const currentSuppliers = [...suppliers];
      let updatedSuppliers = [...suppliers];

      suppliersToImport.forEach(newSup => {
        const exists = currentSuppliers.some(s => s.name.trim() === newSup.name.trim());
        if (!exists) {
          const newSupObj = {
            id: `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            referenceNo: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
            name: newSup.name.trim(),
            materialCode: newSup.materialCode || 'رمل',
            phone: newSup.phone || '',
            notes: newSup.notes || 'مستورد ومضاف تلقائياً من ملف',
            deliveryMethods: []
          };
          updatedSuppliers.push(newSupObj);
          addedSuppliersCount++;
        }
      });

      if (addedSuppliersCount > 0) {
        setContractorsReport(updatedSuppliers);
      }
    }

    // 2. Add Supply Items (Materials) automatically
    if (setSupplyItems && aiResult.extractedItems) {
      const itemsToImport = aiResult.extractedItems.filter(i => selectedAIItems.includes(i.code));
      const currentItems = [...supplyItems];
      let updatedItems = [...supplyItems];

      itemsToImport.forEach(newItem => {
        const exists = currentItems.some(i => i.code.trim() === newItem.code.trim());
        if (!exists) {
          const newItemObj = {
            id: `ITEM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            referenceNo: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
            code: newItem.code.trim(),
            name: newItem.name.trim(),
            unit: newItem.unit || 'م٣',
            defaultPrice: newItem.defaultPrice || 0
          };
          updatedItems.push(newItemObj);
          addedItemsCount++;
        }
      });

      if (addedItemsCount > 0) {
        setSupplyItems(updatedItems);
      }
    }

    // 3. Add Supply Records
    const recordsToImport = aiResult.supplyRecords.filter((_, idx) => selectedAIReclList.includes(idx));
    const batchOfNewRecs: SupplyRecord[] = [];
    const existingTicketNos = new Set(supplyRecords.map(r => r.ticketNo.trim()));
    const batchTicketNos = new Set<string>();
    let skippedDuplicateCount = 0;

    recordsToImport.forEach((rec, loopIdx) => {
      const uniqueId = `REC-${Date.now()}-${loopIdx}-${Math.random().toString(36).slice(2, 7)}`;
      const uniqueRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Fallback: If item has no serial/ticket number, use its referenceNo as serial
      let finalTicketNo = String(rec.ticketNo || '').trim();
      if (!finalTicketNo) {
        finalTicketNo = uniqueRef;
      }

      // Prevent duplicate serials (both database duplicates and duplicates in the same import batch)
      if (existingTicketNos.has(finalTicketNo) || batchTicketNos.has(finalTicketNo)) {
        skippedDuplicateCount++;
        return; // skip duplicate serial
      }

      batchTicketNos.add(finalTicketNo);

      const discountVal = Number(rec.discount) || 0;
      const rawQuantity = Number(rec.rawQuantity) || 0;
      const netQuantity = Math.max(0, rawQuantity - discountVal);
      const unitPrice = Number(rec.unitPrice) || 0;
      const totalCost = netQuantity * unitPrice;

      const newRec: SupplyRecord = {
        id: uniqueId,
        referenceNo: uniqueRef,
        date: rec.date || new Date().toISOString().split('T')[0],
        ticketNo: finalTicketNo,
        truckPlate: rec.truckPlate || 'عامة',
        trailerPlate: rec.trailerPlate || '',
        driverName: rec.driverName || 'سائق عام',
        rawQuantity: rawQuantity,
        discount: discountVal,
        netQuantity: netQuantity,
        unitPrice: unitPrice,
        totalCost: totalCost,
        supplierName: rec.supplierName,
        supplyLocation: rec.supplyLocation || 'موقع المشروع الرئيسي',
        itemCode: rec.itemCode,
        ledgerNo: '1',
        isWaterBillApproved: false,
        notes: rec.notes || 'مستورد تلقائياً من ملف',
        unit: rec.unit || 'م٣'
      };
      batchOfNewRecs.push(newRec);
      addedRecordsCount++;
    });

    if (batchOfNewRecs.length > 0) {
      onAddRecord(batchOfNewRecs);
    }

    if (skippedDuplicateCount > 0) {
      alert(`⚠️ تنبيه: تم تجاهل استيراد عدد (${skippedDuplicateCount}) بون بسبب تكرار رقم السيريال/البون لمنع الازدواجية في قاعدة البيانات.`);
    }

    // Write audit log
    addAuditLog(
      'استيراد توريدات من ملف',
      'التوريدات',
      `تم استيراد بيان توريدات بنجاح من ملف Excel/CSV؛ جرى استيراد وتوثيق ${addedRecordsCount} بون توريد جديد، مع تسجيل ${addedSuppliersCount} مورد و${addedItemsCount} خامة في قاعدة البيانات تلقائياً.`
    );

    // Reset state
    setShowAIModal(false);
    setAiFile(null);
    setAiResult(null);
    setExcelHeaders([]);
    setExcelRows([]);
    setSelectedAIReclList([]);
    setSelectedAISuppliers([]);
    setSelectedAIItems([]);
    alert(`🎉 تم بنجاح استيراد وتسجيل البيانات:\n- بونات توريد: ${addedRecordsCount}\n- موردين جدد: ${addedSuppliersCount}\n- خامات ومواد جديدة: ${addedItemsCount}`);
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
              <FileSpreadsheet className="h-7 w-7 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">سجل التوريدات اليومية</h3>
              <p className="text-[11px] text-slate-500 font-medium">متابعة دقيقة لحركة دخول المواد الخام وربطها بالمقاولين</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-4 px-6 rounded-2xl flex items-center gap-2 transition-all shadow active:scale-95 border border-slate-200"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              طباعة البيان المفلتر
            </button>
            <button
              onClick={handleResetQuantities}
              disabled={userRole === 'viewer'}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs py-4 px-6 rounded-2xl flex items-center gap-2 transition-all shadow active:scale-95 border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4 text-rose-600 animate-spin-hover" />
              تصفير / تفريغ الجدول 🔄
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs py-4 px-6 rounded-2xl flex items-center gap-2 transition-all shadow active:scale-95 border border-indigo-150"
            >
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              استيراد مباشر من Excel/CSV 📋
            </button>
            <button 
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تسجيل توريدات جديدة') : handleOpenAdd}
              disabled={userRole === 'viewer'}
              className={`group font-black text-xs py-4 px-8 rounded-2xl flex items-center gap-3 transition-all shadow-lg active:scale-95 ${
                userRole === 'viewer'
                  ? 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              <Plus className="h-4 w-4" />
              إضافة بون جديد
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
            <input
              type="text"
              placeholder="بحث برقم البون أو السيارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-right text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-right text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">جميع المقاولين</option>
            {uniqueSuppliers.map(sName => <option key={sName} value={sName}>{sName}</option>)}
          </select>

          <select
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-right text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">جميع المواد</option>
            {supplyItems.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/90 rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-xl hover:shadow-slate-100/40 transition-all duration-300">
        <div className="overflow-x-auto text-[13px]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/80 text-[11px] uppercase font-black tracking-widest text-slate-700 border-b border-slate-200">
                <th className="py-5 px-6 font-black text-slate-800 text-center cursor-pointer hover:bg-slate-200" onClick={() => requestSort('ticketNo')}>
                  <div className="flex items-center justify-center gap-1">رقم البون {getSortIcon('ticketNo')}</div>
                </th>
                <th className="py-5 px-6 font-black text-slate-800 text-center cursor-pointer hover:bg-slate-200" onClick={() => requestSort('date')}>
                  <div className="flex items-center justify-center gap-1">التاريخ {getSortIcon('date')}</div>
                </th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">المقاول</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">بند التوريد</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">الناقل / رقم السيارة</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">الكمية الكلية</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">الخصم</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">صافي الكمية</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">سعر الوحدة</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">التكلفة</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {sortedRecords.map(rec => {
                const totalDisc = rec.discount || 0;
                
                // Helper to get Arabic name of day of the week
                const getArabicDayName = (dateString: string) => {
                  if (!dateString) return '';
                  try {
                    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return '';
                    return days[date.getDay()];
                  } catch (e) {
                    return '';
                  }
                };

                const dayOfWeek = getArabicDayName(rec.date);

                const isSupMissing = !suppliers.some(s => s.name.trim() === rec.supplierName?.trim());
                const isItemMissing = !supplyItems.some(i => i.code === rec.itemCode || i.name === rec.itemCode);
                const isRowMissing = isSupMissing || isItemMissing;

                const cellBg = (base: string) => isRowMissing ? 'bg-red-50/55 group-hover:bg-red-100/70' : base;

                return (
                  <tr key={rec.id} className={`group transition-all duration-200 border-b border-slate-100 ${isRowMissing ? 'bg-red-50/60 hover:bg-red-100 text-rose-950 font-semibold' : 'hover:bg-slate-200/50 even:bg-slate-50/40'}`}>
                    <td className={`py-3 px-3 text-center ${cellBg('bg-blue-50/20 group-hover:bg-blue-100/30')}`}>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-block text-[10px] font-black font-mono px-2 py-1 rounded-lg border shadow-sm ${isRowMissing ? 'bg-white text-red-750 border-red-200' : 'bg-white text-blue-700 border-blue-100'}`}>
                          #{rec.ticketNo}
                        </span>
                        {rec.referenceNo && (
                          <span className={`text-[8px] font-mono font-bold tracking-tight ${isRowMissing ? 'text-red-400' : 'text-blue-400'}`}>{rec.referenceNo}</span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-center border-r border-slate-100/50 ${cellBg('bg-slate-50/20 group-hover:bg-slate-100/30')}`}>
                      <div className="text-slate-800 font-extrabold font-mono text-[11px] whitespace-nowrap">
                        <span className="text-[9px] text-slate-400 font-sans font-bold block">{dayOfWeek}</span> {rec.date}
                      </div>
                    </td>
                    <td className={`py-3 px-3 font-black text-slate-800 text-[11px] text-center whitespace-nowrap border-r border-indigo-100/30 ${cellBg('bg-indigo-50/20 group-hover:bg-indigo-100/30')}`}>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span>{rec.supplierName}</span>
                        {isSupMissing && (
                          <span className="inline-block bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-red-200 shadow-2xs">
                            غير مسجل ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-center border-r border-emerald-100/30 ${cellBg('bg-emerald-50/20 group-hover:bg-emerald-100/30')}`}>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className={`inline-block text-[11px] font-black px-2 py-1 rounded-lg whitespace-nowrap border shadow-sm ${isRowMissing ? 'bg-white text-red-750 border-red-200' : 'bg-white text-emerald-700 border-emerald-100'}`}>
                          {supplyItems.find(i => i.code === rec.itemCode)?.name || rec.itemCode}
                        </span>
                        {isItemMissing && (
                          <span className="inline-block bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-red-200 shadow-2xs">
                            خامة غير مسجلة ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-3 font-mono font-black text-slate-850 text-[11px] text-center whitespace-nowrap border-r border-amber-100/30 ${cellBg('bg-amber-50/20 group-hover:bg-amber-100/30')}`}>
                      {rec.truckPlate} {rec.trailerPlate && <span className="text-slate-300">/</span>} {rec.trailerPlate}
                    </td>
                    <td className={`py-3 px-3 font-mono text-center font-black text-slate-800 text-[12px] border-r border-slate-100/30 ${cellBg('bg-slate-50/10 group-hover:bg-slate-100/20')}`}>
                      {((rec.rawQuantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      <span className="text-[9px] font-sans font-black text-slate-400 mr-1">م٣</span>
                    </td>
                    <td className={`py-3 px-3 font-mono text-center text-[11px] border-r border-rose-100/30 ${cellBg('bg-rose-50/20 group-hover:bg-rose-100/30')}`}>
                      {totalDisc > 0 ? (
                        <span className="text-rose-600 font-black">-{totalDisc.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300 font-bold">---</span>
                      )}
                    </td>
                    <td className={`py-3 px-3 font-mono text-center font-black text-slate-850 text-[12px] border-r border-sky-100/30 ${cellBg('bg-sky-50/20 group-hover:bg-sky-100/30')}`}>
                      {((rec.netQuantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      <span className="text-[9px] font-sans font-black text-sky-400 mr-1">م٣</span>
                    </td>
                    <td className={`py-3 px-3 font-mono text-center text-[12px] border-r border-slate-100/30 ${cellBg('bg-slate-50/10 group-hover:bg-slate-100/20')}`}>
                      <span className="font-mono font-black text-slate-750">
                        {((rec.unitPrice || 0)).toLocaleString()}
                        <span className="text-[9px] font-sans font-medium text-slate-400 mr-1">ج.م</span>
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-mono text-center text-[12px] border-r border-emerald-200/30 ${cellBg('bg-emerald-50/30 group-hover:bg-emerald-100/40')}`}>
                      <span className="font-mono font-black text-emerald-700">
                        {((rec.totalCost || 0)).toLocaleString()}
                        <span className="text-[9px] font-sans font-black text-emerald-500 mr-1">ج.م</span>
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-center ${cellBg('bg-slate-50/40 group-hover:bg-slate-100/50')}`}>
                      <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-all duration-150">
                        <button 
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تعديل السجلات') : () => handleOpenEdit(rec)} 
                          className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all ${
                            userRole === 'viewer'
                              ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                              : 'text-slate-500 hover:text-indigo-600 bg-slate-100'
                          }`}
                          title="تعديل"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حذف السجلات') : () => handleDelete(rec.id)} 
                          disabled={userRole === 'viewer' || !!rec.cubicCertificateId} 
                          className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all ${
                            userRole === 'viewer'
                              ? 'text-slate-200 bg-slate-50 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 bg-slate-100 disabled:opacity-20'
                          }`}
                          title="حذف"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Flow */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
            
            {/* Sidebar Visual - Lightened */}
            <div className="hidden md:flex md:w-64 bg-slate-50 p-8 flex-col justify-between border-l border-slate-100">
              <div>
                <FileSpreadsheet className="h-10 w-10 mb-6 text-indigo-200" />
                <h3 className="text-xl font-black mb-2 text-slate-800">تسجيل توريد</h3>
                <p className="text-[11px] text-slate-500 font-medium">نظام تسجيل البونات الذكي لربط المقاولين بموقع المشروع بدقة تامة.</p>
              </div>
              <div className="space-y-4 text-[10px] font-black text-slate-400">
                <div className="flex items-center gap-2 border-r-2 border-indigo-500 pr-2 text-indigo-600">1. الأطراف والمادة</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-200 pr-2">2. وسيلة النقل</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-200 pr-2">3. الجرد والماليات</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                <h3 className="text-lg font-black text-slate-900">{editingId ? 'تعديل بون' : 'إضافة بون جديد'}</h3>
                <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                <form id="ticket-form" onSubmit={handleSave} className="space-y-10">
                  {/* Section 1 */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3">المقاول والبند</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">المادة الخام *</label>
                        <select 
                          required 
                          value={formState.itemCode} 
                          onChange={e => {
                            const code = e.target.value;
                            const matches = suppliers.filter(s => s.materialCode === code);
                            setFormState({
                              ...formState, 
                              itemCode: code, 
                              supplierName: matches.length ? matches[0].name : '',
                              selectedDeliveryMethodId: '',
                              unitPrice: supplyItems.find(i => i.code === code)?.defaultPrice?.toString() || ''
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="" disabled>-- اختر المادة --</option>
                          {supplyItems.map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">المقاول المورد *</label>
                        <select 
                          required 
                          disabled={!formState.itemCode}
                          value={formState.supplierName} 
                          onChange={e => setFormState({...formState, supplierName: e.target.value, selectedDeliveryMethodId: ''})}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none disabled:opacity-30 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="" disabled>-- اختر المقاول --</option>
                          {suppliers.filter(s => s.materialCode === formState.itemCode).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className={`space-y-4 transition-all ${!formState.supplierName ? 'opacity-20 pointer-events-none' : ''}`}>
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r-4 border-emerald-500 pr-3">وسيلة النقل</h4>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                      {(() => {
                        const sData = suppliers.find(s => s.materialCode === formState.itemCode && s.name === formState.supplierName);
                        const methods = sData?.deliveryMethods || [];
                        const q = vehicleSearch.toLowerCase().trim();
                        const filtered = q ? methods.filter((m:any) => {
                          const searchable = [m.truckNumber, m.dumperNumber, m.personInCharge, m.driverName].filter(Boolean).join(' ');
                          return searchable.toLowerCase().includes(q);
                        }) : methods;

                        return (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <div className="relative group w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600" />
                                <input 
                                  placeholder="بحث رقم السيارة..." 
                                  value={vehicleSearch} 
                                  onChange={e => setVehicleSearch(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {filtered.map((m: any) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    const isV = ['قلاب', 'عربية'].includes(m.type);
                                    setFormState({
                                      ...formState,
                                      selectedDeliveryMethodId: m.id,
                                      truckPlate: m.type === 'قلاب' ? (m.dumperNumber || '') : (m.truckNumber || ''),
                                      trailerPlate: m.type === 'قلاب' && m.truckNumber !== 'بدون' ? (m.truckNumber || '') : '',
                                      driverName: m.driverName || m.personInCharge || '',
                                      rawQuantity: m.cubicCapacity && m.cubicCapacity !== 'مکعبة' ? m.cubicCapacity : '',
                                      supplyMethod: isV ? 'truck' : 'ton'
                                    });
                                  }}
                                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all min-h-[120px] ${
                                    formState.selectedDeliveryMethodId === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                  }`}
                                >
                                  <span className="text-[11px] font-black opacity-60 mb-2 uppercase tracking-tight">{m.type}</span>
                                  <span className="text-base font-black font-mono flex items-center gap-1.5 flex-wrap justify-center text-center">
                                    {m.type === 'قلاب' ? (
                                      <>
                                        {m.dumperNumber}
                                        {m.truckNumber && m.truckNumber !== 'بدون' && (
                                          <>
                                            <span className="text-slate-300 font-bold mx-0.5 whitespace-nowrap">\</span>
                                            <span className="text-indigo-600 underline underline-offset-4 decoration-indigo-200">{m.truckNumber}</span>
                                          </>
                                        )}
                                      </>
                                    ) : (m.truckNumber || m.dumperNumber || m.personInCharge || m.type)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Section 3 */}
                  {formState.selectedDeliveryMethodId && (
                    <div className="space-y-8 animate-fadeInUp">
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">التاريخ</label>
                            <input 
                              type="date" 
                              required 
                              value={formState.date} 
                              onChange={e => setFormState({...formState, date: e.target.value})} 
                              className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">رقم البون الورقي *</label>
                            <input 
                              type="text" 
                              required 
                              value={formState.ticketNo} 
                              onChange={e => setFormState({...formState, ticketNo: e.target.value})} 
                              className="w-full h-16 bg-amber-50 border border-amber-200 rounded-2xl px-4 text-center text-sm text-amber-700 font-black outline-none focus:ring-2 focus:ring-amber-500/20" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">الكمية الورقية</label>
                            <input 
                              type="text" 
                              required 
                              readOnly={formState.supplyMethod === 'truck'}
                              value={formState.rawQuantity} 
                              onChange={e => {
                                if (formState.supplyMethod !== 'truck') {
                                  setFormState({...formState, rawQuantity: e.target.value.replace(/[^0-9.]/g,'')});
                                }
                              }}
                              className={`w-full h-16 rounded-2xl px-4 text-center text-xl font-black outline-none transition-all ${
                                formState.supplyMethod === 'truck' 
                                  ? 'bg-indigo-50 border border-indigo-100 text-slate-500 cursor-not-allowed' 
                                  : 'bg-white border border-indigo-500 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10'
                              }`} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">السعر / الوحدة</label>
                            <input 
                              type="text" 
                              required 
                              readOnly
                              value={formState.unitPrice} 
                              className="w-full h-16 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 text-center text-xl font-black text-slate-500 cursor-not-allowed outline-none" 
                            />
                          </div>

                          {/* Second Row */}
                          <div className="lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">اسم السائق / المستلم</label>
                            <input 
                              type="text" 
                              readOnly
                              value={formState.driverName} 
                              className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs text-slate-500 cursor-not-allowed outline-none" 
                            />
                          </div>
                          <div className="lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block text-center">مقدار الخصم (م٣ / وحدة)</label>
                            <input 
                              type="text" 
                              placeholder="0"
                              value={formState.discount} 
                              onChange={e => setFormState({...formState, discount: e.target.value.replace(/[^0-9.]/g,'')})} 
                              className="w-full h-16 bg-red-50 border border-red-100 rounded-2xl px-4 text-center text-sm font-black text-red-600 outline-none focus:ring-2 focus:ring-red-500/20" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex bg-white border-2 border-slate-200 p-8 rounded-[2.5rem] justify-between items-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-full bg-slate-50 skew-x-12 translate-x-16"></div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">صافي الجرد الميكانيكي</p>
                          <p className="text-4xl font-black text-slate-900">{computedNetAndCost.net.toLocaleString()} <span className="text-sm font-medium opacity-60">م٣</span></p>
                        </div>
                        <div className="text-left relative z-10">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">تكلفة الشحنة</p>
                          <p className="text-3xl font-black text-emerald-600">{computedNetAndCost.cost.toLocaleString()} <span className="text-xs font-medium opacity-60">ج.م</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                <button type="submit" form="ticket-form" disabled={!formState.selectedDeliveryMethodId} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95">اعتماد وتسجيل البون</button>
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold py-4 rounded-2xl transition-colors">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="حذف البون"
        message="هل تريد حذف هذا البون نهائياً؟"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Print Settings Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                إعدادات طباعة بيان التوريدات
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
                <p className="text-xs font-black text-slate-500 mb-2">نوع التقرير للطباعة:</p>
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-indigo-900">
                  كشف بيان حركة التوريدات اليومية والكلية (المفلترة والمفرزة حالياً)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">حجم الورقة:</label>
                  <select
                    value={printPaperSize}
                    onChange={(e: any) => setPrintPaperSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="A4">A4 (قياسي)</option>
                    <option value="A3">A3 (كبير جداً)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">اتجاه الصفحة:</label>
                  <select
                    value={printOrientation}
                    onChange={(e: any) => setPrintOrientation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="portrait">رأسي (Portrait)</option>
                    <option value="landscape">أفقي (Landscape)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  handlePrintRecords(printPaperSize, printOrientation);
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

      {/* Excel/CSV Direct Import Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl my-8 p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                  <FileSpreadsheet className="h-6 w-6 text-indigo-600 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">الاستيراد البرمجي المباشر من ملفات Excel/CSV</h3>
                  <p className="text-[10px] text-slate-500 font-medium">قم برفع ملف توريدات أو كشف توريدات بونات وسيقوم النظام بتحليلها بالكامل فورياً وبدقة 100% وبدون استخدام للذكاء الاصطناعي.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAIModal(false);
                  setAiResult(null);
                  setAiFile(null);
                  setExcelHeaders([]);
                  setExcelRows([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            {!aiResult ? (
              <div className="space-y-6">
                
                {/* Step 1: Upload File */}
                {excelRows.length === 0 ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50/50' 
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/30'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="ai-file-upload" 
                      className="hidden" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={handleAIFileChange}
                    />
                    <label htmlFor="ai-file-upload" className="cursor-pointer space-y-4 block">
                      <div className="h-16 w-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100">
                        <FileUp className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-800">اسحب وأفلت الملف هنا أو انقر لتصفح جهازك</p>
                        <p className="text-xs text-slate-400 mt-1">يدعم ملفات جداول البيانات Excel (.xlsx, .xls) وكشوفات CSV النصية</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  // Step 2: Column Mapping Interface
                  <div className="space-y-6 animate-fade-in">
                    <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span>تمت قراءة الملف بنجاح: <strong>{aiFile?.name}</strong> (يحتوي على {excelRows.length} صف و {excelHeaders.length} عمود)</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setAiFile(null);
                          setExcelHeaders([]);
                          setExcelRows([]);
                        }}
                        className="text-xs font-black text-rose-600 hover:underline"
                      >
                        تغيير الملف 🔄
                      </button>
                    </div>

                    {/* Sheet Selector (for Excel with multiple sheets) */}
                    {availableSheets.length > 1 && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center gap-4">
                        <span className="text-xs font-black text-slate-700">اختر ورقة العمل المراد استيرادها:</span>
                        <div className="flex gap-2">
                          {availableSheets.map(sheet => (
                            <button
                              key={sheet}
                              type="button"
                              onClick={() => handleSheetChange(sheet)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                selectedSheet === sheet 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'bg-white border text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {sheet}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mapping Form */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-[2rem] p-6 space-y-4">
                      <h4 className="text-sm font-black text-slate-800 border-b pb-2 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        ربط مطابقة أعمدة جدول البيانات ببيانات التوريد:
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
                        
                        {/* 1. Ticket No */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">رقم البون / الإيصال <span className="text-rose-500">*</span></label>
                          <select
                            value={columnMapping.ticketNo}
                            onChange={e => setColumnMapping({...columnMapping, ticketNo: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- اختر العمود --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 2. Date */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">تاريخ التوريد <span className="text-rose-500">*</span></label>
                          <select
                            value={columnMapping.date}
                            onChange={e => setColumnMapping({...columnMapping, date: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- اختر العمود --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 3. Supplier Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">اسم المورد / المقاول <span className="text-rose-500">*</span></label>
                          <select
                            value={columnMapping.supplierName}
                            onChange={e => setColumnMapping({...columnMapping, supplierName: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- اختر العمود --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 4. Item / Material */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">بند التوريد / الخامة <span className="text-rose-500">*</span></label>
                          <select
                            value={columnMapping.itemCode}
                            onChange={e => setColumnMapping({...columnMapping, itemCode: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- اختر العمود --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 5. Truck Plate */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">رقم السيارة / الناقل</label>
                          <select
                            value={columnMapping.truckPlate}
                            onChange={e => setColumnMapping({...columnMapping, truckPlate: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- غير محدد (سيتم تسجيله "عامة") --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 6. Raw Quantity */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">الكمية الكلية / التكعيب <span className="text-rose-500">*</span></label>
                          <select
                            value={columnMapping.rawQuantity}
                            onChange={e => setColumnMapping({...columnMapping, rawQuantity: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- اختر العمود --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 7. Unit Price */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">سعر المتر / الفئة <span className="text-rose-500">*</span></label>
                          <select
                            value={columnMapping.unitPrice}
                            onChange={e => setColumnMapping({...columnMapping, unitPrice: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- اختر العمود --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 8. Net Quantity */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">الكمية الصافية</label>
                          <select
                            value={columnMapping.netQuantity}
                            onChange={e => setColumnMapping({...columnMapping, netQuantity: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- نفس الكمية الكلية --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 8a. Discount */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">مقدار الخصم</label>
                          <select
                            value={columnMapping.discount}
                            onChange={e => setColumnMapping({...columnMapping, discount: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- لا يوجد --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 8a. Discount */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">مقدار الخصم</label>
                          <select
                            value={columnMapping.discount}
                            onChange={e => setColumnMapping({...columnMapping, discount: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- لا يوجد --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                        {/* 9. Notes */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 block">ملاحظات البون</label>
                          <select
                            value={columnMapping.notes}
                            onChange={e => setColumnMapping({...columnMapping, notes: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">-- لا يوجد --</option>
                            {excelHeaders.map((h, idx) => <option key={`${h}-${idx}`} value={h}>{h || `العمود ${idx + 1}`}</option>)}
                          </select>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {aiError && (
                  <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="font-bold leading-relaxed">{aiError}</p>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex gap-3 justify-end pt-4">
                  {excelRows.length > 0 && (
                    <button
                      type="button"
                      disabled={isAIAnalyzing || !columnMapping.ticketNo || !columnMapping.date || !columnMapping.supplierName || !columnMapping.itemCode || !columnMapping.rawQuantity}
                      onClick={generateImportPreview}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg transition-all text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAIAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جاري توليد المعاينة...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          تحليل ومعاينة البيانات المحددة 📋
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAIModal(false);
                      setAiFile(null);
                      setExcelHeaders([]);
                      setExcelRows([]);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Result Overview Header */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between text-indigo-900 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    <span className="font-black">اكتمل تحليل البيانات بنجاح!</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>عدد البونات: <strong>{aiResult.supplyRecords.length}</strong></span>
                    <span>الموردين الجدد: <strong>{aiResult.extractedSuppliers.length}</strong></span>
                    <span>الخامات الجديدة: <strong>{aiResult.extractedItems.length}</strong></span>
                  </div>
                </div>

                {/* Grid of Extracted Suppliers and Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Extracted Suppliers */}
                  <div className="border border-slate-200 rounded-[2rem] p-6 space-y-4 bg-slate-50/30">
                    <h4 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                      <Truck className="h-4 w-4" />
                      الموردين المكتشفين في المستند ({aiResult.extractedSuppliers.length})
                    </h4>
                    {aiResult.extractedSuppliers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">لم يتم رصد موردين جدد</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {aiResult.extractedSuppliers.map((sup, index) => {
                          const alreadyExists = suppliers.some(s => s.name.trim() === sup.name.trim());
                          return (
                            <label key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/20 transition">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  disabled={alreadyExists}
                                  checked={selectedAISuppliers.includes(sup.name) || alreadyExists}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAISuppliers([...selectedAISuppliers, sup.name]);
                                    } else {
                                      setSelectedAISuppliers(selectedAISuppliers.filter(name => name !== sup.name));
                                    }
                                  }}
                                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                                />
                                <div>
                                  <p className="text-xs font-black text-slate-800">{sup.name}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">خامة التوريد المقترحة: {sup.materialCode}</p>
                                </div>
                              </div>
                              {alreadyExists ? (
                                <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-2 py-1 rounded-lg">مسجل مسبقاً</span>
                              ) : (
                                <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-1 rounded-lg">تسجيل تلقائي</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Extracted Items / Materials */}
                  <div className="border border-slate-200 rounded-[2rem] p-6 space-y-4 bg-slate-50/30">
                    <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                      <FolderOpen className="h-4 w-4" />
                      الخامات والمواد المكتشفة ({aiResult.extractedItems.length})
                    </h4>
                    {aiResult.extractedItems.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">لم يتم رصد خامات جديدة</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {aiResult.extractedItems.map((item, index) => {
                          const alreadyExists = supplyItems.some(i => i.code.trim() === item.code.trim());
                          return (
                            <label key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-emerald-50/20 transition">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  disabled={alreadyExists}
                                  checked={selectedAIItems.includes(item.code) || alreadyExists}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAIItems([...selectedAIItems, item.code]);
                                    } else {
                                      setSelectedAIItems(selectedAIItems.filter(code => code !== item.code));
                                    }
                                  }}
                                  className="h-4 w-4 text-emerald-600 border-slate-300 rounded"
                                />
                                <div>
                                  <p className="text-xs font-black text-slate-800">{item.name}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">الكود: {item.code} | السعر: {item.defaultPrice} ج.م</p>
                                </div>
                              </div>
                              {alreadyExists ? (
                                <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-2 py-1 rounded-lg">مسجلة مسبقاً</span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-lg">تسجيل تلقائي</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extracted Supply Records Table */}
                <div className="border border-slate-200 rounded-[2.5rem] overflow-hidden bg-white shadow-sm space-y-4">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-800">تفاصيل بونات التوريد المستخرجة ({aiResult.supplyRecords.length})</h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAIReclList.length === aiResult.supplyRecords.length) {
                          setSelectedAIReclList([]);
                        } else {
                          setSelectedAIReclList(aiResult.supplyRecords.map((_, i) => i));
                        }
                      }}
                      className="text-[10px] font-black text-indigo-600 hover:underline"
                    >
                      {selectedAIReclList.length === aiResult.supplyRecords.length ? "إلغاء تحديد الجميع" : "تحديد جميع البونات"}
                    </button>
                  </div>

                  <div className="overflow-x-auto text-[11px] max-h-80">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-100/50 text-[10px] font-black text-slate-600 border-b">
                          <th className="py-3 px-4">تحديد</th>
                          <th className="py-3 px-4">رقم البون</th>
                          <th className="py-3 px-4">التاريخ</th>
                          <th className="py-3 px-4">المقاول</th>
                          <th className="py-3 px-4">الخامة</th>
                          <th className="py-3 px-4">السيارة</th>
                          <th className="py-3 px-4">الكمية</th>
                          <th className="py-3 px-4">سعر الوحدة</th>
                          <th className="py-3 px-4">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aiResult.supplyRecords.map((rec, index) => {
                          const isSupMissing = !suppliers.some(s => s.name.trim() === rec.supplierName?.trim());
                          const isItemMissing = !supplyItems.some(i => i.code === rec.itemCode || i.name === rec.itemCode || i.name === rec.itemName);
                          const isRowMissing = isSupMissing || isItemMissing;

                          return (
                            <tr key={index} className={`transition-all duration-150 ${isRowMissing ? 'bg-red-50 hover:bg-red-100/80 border-red-250 text-rose-950 font-semibold' : 'hover:bg-slate-50/50'}`}>
                              <td className="py-2.5 px-4">
                                <input
                                  type="checkbox"
                                  checked={selectedAIReclList.includes(index)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAIReclList([...selectedAIReclList, index]);
                                    } else {
                                      setSelectedAIReclList(selectedAIReclList.filter(idx => idx !== index));
                                    }
                                  }}
                                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                                />
                              </td>
                              <td className={`py-2.5 px-4 font-mono font-bold ${isRowMissing ? 'text-red-700' : 'text-indigo-700'}`}>{rec.ticketNo}</td>
                              <td className="py-2.5 px-4 font-mono">{rec.date}</td>
                              <td className="py-2.5 px-4 font-black">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span>{rec.supplierName}</span>
                                  {isSupMissing && (
                                    <span className="inline-block bg-red-100 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-200">
                                      غير مسجل ⚠️
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span>{rec.itemName}</span>
                                  {isItemMissing && (
                                    <span className="inline-block bg-red-100 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-200">
                                      خامة غير مسجلة ⚠️
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-mono">{rec.truckPlate}</td>
                              <td className="py-2.5 px-4 font-mono font-bold">{rec.rawQuantity} {rec.unit || "م٣"}</td>
                              <td className="py-2.5 px-4 font-mono">{rec.unitPrice} ج.م</td>
                              <td className={`py-2.5 px-4 font-mono font-black ${isRowMissing ? 'text-red-800' : 'text-emerald-700'}`}>{rec.totalCost} ج.م</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Error Banner inside results (if any) */}
                {aiError && (
                  <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-800 text-xs">
                    <p className="font-bold">{aiError}</p>
                  </div>
                )}

                {/* Action Row for Import */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleImportAIResults}
                    disabled={selectedAIReclList.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    استيراد وحفظ البيانات المحددة ({selectedAIReclList.length}) بون توريد ✨
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiResult(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl transition"
                  >
                    تعديل المستند / إعادة التحليل
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-[2.5rem] border border-slate-150 p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600" />
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 mb-2">
                <RotateCcw className="h-8 w-8 text-amber-500 animate-spin-hover" />
              </div>
              <h3 className="text-xl font-black text-slate-900">إعادة تعيين وتصفير جدول التوريدات 🔄</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                يرجى تحديد الإجراء المناسب لإعادة تعيين الجدول. يمكنك تصفير الكميات والخصومات مع الحفاظ على هيكل الأسطر، أو مسح الجدول بالكامل للبدء من الصفر.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {/* Option 1: Just Reset Quantities to 0 */}
              <button
                onClick={handleExecuteQuantitiesReset}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all text-right group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">0</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">تصفير كميات البونات الحالية</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">سيتم الحفاظ على البونات الحالية في الجدول مع تصفير الكمية والخصم والتكلفة.</p>
                  </div>
                </div>
                <ArrowUp className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 -rotate-90 transition-transform" />
              </button>

              {/* Option 2: Completely Clear All Records */}
              <button
                onClick={() => {
                  const reallySure = window.confirm("⚠️ هل أنت متأكد تماماً من رغبتك في حذف وإخلاء كافة البونات المسجلة نهائياً؟");
                  if (reallySure) {
                    handleExecuteFullClear();
                  }
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-rose-100 hover:border-rose-500 hover:bg-rose-50/10 transition-all text-right group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">🗑️</div>
                  <div>
                    <h4 className="text-sm font-black text-rose-700">تفريغ وحذف جميع البونات تماماً</h4>
                    <p className="text-[11px] text-rose-400 mt-0.5">سيتم حذف وإخلاء كافة السجلات من الجدول تماماً للبدء من جديد بالكامل.</p>
                  </div>
                </div>
                <ArrowUp className="h-5 w-5 text-slate-300 group-hover:text-rose-600 -rotate-90 transition-transform" />
              </button>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition active:scale-95 text-center"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
