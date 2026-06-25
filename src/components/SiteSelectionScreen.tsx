import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Plus, ArrowRight, Loader2, Sparkles, FolderPlus, Compass, 
  Edit, Trash2, Wifi, WifiOff, Database, AlertTriangle, UserCheck, Shield, 
  ChevronLeft, Layers, Landmark, Briefcase, Download, Search, Calendar, 
  CheckCircle2, Users, ChevronRight, Eye, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BunyanLogo from './BunyanLogo';

interface Site {
  id: string;
  nameAr: string;
  location: string;
  description: string;
  tenantId?: string;
  projects?: any[];
}

interface SiteSelectionScreenProps {
  user: { username: string; nameAr: string; role: string; tenantId?: string; assignedProjects?: string[] } | null;
  onSiteSelected: (site: Site) => void;
  onLogout: () => void;
  dbConnected?: boolean | null;
  dbLatency?: number;
  forceOfflineBypass?: boolean;
  onToggleOfflineBypass?: () => void;
}

export default function SiteSelectionScreen({ 
  user, 
  onSiteSelected, 
  onLogout, 
  dbConnected, 
  dbLatency, 
  forceOfflineBypass, 
  onToggleOfflineBypass 
}: SiteSelectionScreenProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Hierarchy Navigation States
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>(
    user?.username.toLowerCase() === 'moataz' ? 'hierarchy' : 'grid'
  );
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [selectedAdminUsername, setSelectedAdminUsername] = useState<string>(user?.tenantId || user?.username.toLowerCase() || 'moataz');
  const [selectedSiteIdForHierarchy, setSelectedSiteIdForHierarchy] = useState<string>('');
  
  // Hierarchy search and filter states
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');

  // Form State
  const [newSiteId, setNewSiteId] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLoc, setNewSiteLoc] = useState('');
  const [newSiteDesc, setNewSiteDesc] = useState('');
  const [newSiteTenantId, setNewSiteTenantId] = useState(user?.tenantId || user?.username.toLowerCase() || 'moataz');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState('');

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePayload, setRestorePayload] = useState<any>(null);
  const [restoreSiteId, setRestoreSiteId] = useState('');
  const [restoreSiteName, setRestoreSiteName] = useState('');
  const [restoreSiteDesc, setRestoreSiteDesc] = useState('');
  const [restoreSiteLoc, setRestoreSiteLoc] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Add Admin Modal states (Program Director ONLY)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminNameAr, setAdminNameAr] = useState('');
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // DB Reorganization Dashboard States (Program Director ONLY)
  const [showReorgControlCenter, setShowReorgControlCenter] = useState(false);
  const [reorgStatus, setReorgStatus] = useState<any>(null);
  const [isLoadingReorg, setIsLoadingReorg] = useState(false);
  const [transferSiteId, setTransferSiteId] = useState('');
  const [transferAdmin, setTransferAdmin] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Site Deletion Confirmation Modal States
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleteCaptcha, setDeleteCaptcha] = useState('');
  const [deleteCaptchaInput, setDeleteCaptchaInput] = useState('');
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
  const [isDeletingSite, setIsDeletingSite] = useState(false);

  const generateCaptcha = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Utility to generate the next sequential site ID automatically
  const generateNextSiteId = (existingSites: Site[]) => {
    if (!existingSites || existingSites.length === 0) {
      return 'site-101';
    }
    let maxNum = 0;
    let prefix = 'site-';
    
    existingSites.forEach(s => {
      const id = s.id || '';
      // Matches strings like "site-101" or pure "101"
      const match = id.match(/^(.*?)(-?\d+)$/);
      if (match) {
        const p = match[1];
        const n = parseInt(match[2].replace('-', ''), 10);
        if (!isNaN(n)) {
          if (n > maxNum) {
            maxNum = n;
            prefix = p || 'site-';
          }
        }
      } else {
        // Fallback search for pure digits anywhere
        const numOnlyMatch = id.match(/\d+/g);
        if (numOnlyMatch) {
          const lastNum = parseInt(numOnlyMatch[numOnlyMatch.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });

    if (maxNum > 0) {
      // Ensure we keep the trailing sequential dash cleanly
      const cleanPrefix = prefix.endsWith('-') ? prefix : `${prefix}-`;
      return `${cleanPrefix}${maxNum + 1}`;
    }
    
    // Default fallback pattern based on list size
    return `site-${101 + existingSites.length}`;
  };

  const fetchReorgStatus = async () => {
    setIsLoadingReorg(true);
    try {
      const response = await fetch('/api/database/reorg-status');
      const data = await response.json();
      if (response.ok) {
        setReorgStatus(data.data || data);
      } else {
        console.error("[DEBUG] Reorg status fetch error:", data);
        setErrorMsg(data.error || 'فشل جلب ملف معالجة البيانات.');
      }
    } catch (e) {
      console.error("[DEBUG] Reorg status network error:", e);
      setErrorMsg('خطأ في شبكة الاتصال لتحليل هيكلة قاعدة البيانات.');
    } finally {
      setIsLoadingReorg(false);
    }
  };

  const handleExecuteReorg = async () => {
    setIsLoadingReorg(true);
    try {
      const res = await fetch('/api/database/reorg-execute', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`بنجاح تام! تم ترتيب وتوجيه البيانات السحابية.\nعدد الحسابات القديمة المحذوفة: ${data.deletedUsersCount}\nعدد مواقع العمل التي تم إصلاحها وتعميمها: ${data.alignedSitesCount}`);
        await fetchSitesAndAdmins();
        await fetchReorgStatus();
      } else {
        console.error("[DEBUG] Execute reorg error:", data);
        setErrorMsg(data.error || 'فشلت عملية إعادة الترتيب.');
      }
    } catch (e) {
      console.error("[DEBUG] Execute reorg network error:", e);
      setErrorMsg('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsLoadingReorg(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSiteId || !transferAdmin) {
      setErrorMsg('فضلاً، يرجى اختيار موقع عمل والمدير المستهدف لنقل الملكية.');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch('/api/database/transfer-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: transferSiteId, targetAdmin: transferAdmin })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('تم نقل المشروع ومواقع العمل بنجاح تام إلى مدير النظام المحدد!');
        setTransferSiteId('');
        await fetchSitesAndAdmins();
        await fetchReorgStatus();
      } else {
        console.error("[DEBUG] Transfer site error:", data);
        setErrorMsg(data.error || 'فشل نقل ملكية الموقع.');
      }
    } catch (e) {
      console.error("[DEBUG] Transfer site network error:", e);
      setErrorMsg('خطأ في الاتصال أثناء نقل ملكية الموقع.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminNameAr.trim() || (!isEditingAdmin && !adminPassword.trim())) {
      setErrorMsg('فضلاً، يرجى ملء كافة الحقول الأساسية لمدير النظام الجديد.');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim().toLowerCase(),
          password: adminPassword.trim() || undefined,
          nameAr: adminNameAr.trim(),
          role: 'admin',
          permissions: {
            projects: 'edit',
            transactions: 'edit',
            extracts: 'edit',
            deliveries: 'edit',
            boq: 'edit',
            supplies: 'edit',
            subcontractors: 'edit',
            weeklyReport: 'edit',
            siteWorkers: 'edit',
            fuelDashboard: 'edit',
            equipmentDashboard: 'edit',
            usersManagement: 'edit',
            notifications: 'edit'
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية حفظ بيانات مدير النظام.');
      }

      setAdminUsername('');
      setAdminPassword('');
      setAdminNameAr('');
      setIsEditingAdmin(false);
      setShowAddAdminModal(false);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ بيانات مدير النظام.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupDoc = JSON.parse(event.target?.result as string);
        if (!backupDoc || typeof backupDoc !== 'object') {
          setErrorMsg('ملف البيانات غير صالح الاستيراد.');
          setRestoreFile(null);
          return;
        }
        
        let siteId = backupDoc.siteId || backupDoc.id || '';
        let siteName = backupDoc.siteName || backupDoc.nameAr || '';
        let payload = backupDoc.payload || backupDoc;
        let siteLoc = backupDoc.location || 'غير محدد';
        let siteDesc = backupDoc.description || 'موقع مستورد من نسخة احتياطية';
        
        setRestorePayload(payload);
        setRestoreSiteId(siteId);
        setRestoreSiteName(siteName);
        setRestoreSiteLoc(siteLoc);
        setRestoreSiteDesc(siteDesc);
      } catch (err: any) {
        setErrorMsg('حدث خطأ في قراءة ملف النسخ الاحتياطي: ' + err.message);
        setRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorePayload) {
      setErrorMsg('يرجى اختيار ملف صحيح للمتابعة.');
      return;
    }
    if (!restoreSiteId.trim() || !restoreSiteName.trim()) {
      setErrorMsg('يرجى تعبئة رمز واسم الموقع.');
      return;
    }
    
    setIsRestoring(true);
    try {
      const cleanSiteId = restoreSiteId.trim().toLowerCase().replace(/\s+/g, '-');
      const siteExists = sites.some(s => s.id === cleanSiteId);
      if (!siteExists) {
        const createRes = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cleanSiteId,
            nameAr: restoreSiteName.trim(),
            location: restoreSiteLoc.trim(),
            description: restoreSiteDesc.trim(),
            tenantId: user?.tenantId || (user?.username || '').toLowerCase().trim() || 'moataz'
          })
        });
        if (!createRes.ok) throw new Error('فشل تسجيل موقع العمل الجديد على السيرفر.');
      }
      
      const cleanPayload = JSON.parse(JSON.stringify(restorePayload));
      const saveRes = await fetch(`/api/site/${cleanSiteId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cleanPayload })
      });
      
      if (!saveRes.ok) throw new Error('فشل حفظ بيانات الموقع المستورد على السيرفر.');
      
      setSuccessMsg(`تم استيراد بيانات موقع "${restoreSiteName}" بنجاح!`);
      await fetchSitesAndAdmins();
      setShowRestoreModal(false);
      setRestoreFile(null);
      setRestorePayload(null);
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء الاستيراد: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleEditAdminClick = (adm: any) => {
    setAdminUsername(adm.username);
    setAdminPassword('');
    setAdminNameAr(adm.nameAr);
    setIsEditingAdmin(true);
    setShowAddAdminModal(true);
  };

  const handleDeleteAdmin = async (usernameToDelete: string) => {
    try {
      const response = await fetch(`/api/users/${usernameToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchSitesAndAdmins();
        if (selectedAdminUsername === usernameToDelete.toLowerCase()) {
          setSelectedAdminUsername('moataz');
        }
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'فشل حذف مدير النظام.');
      }
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم لحذف مدير النظام.');
    }
  };

  const fetchSitesAndAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      if (response.ok) {
        setSites(data);
        
        const currentTenantId = user?.tenantId || user?.username.toLowerCase() || 'moataz';
        const initialAdmin = currentTenantId;
        setSelectedAdminUsername(initialAdmin);

        const activeSitesOpt = data.filter((s: any) => (s.tenantId || 'moataz') === initialAdmin);
        if (activeSitesOpt.length > 0) {
          setSelectedSiteIdForHierarchy(activeSitesOpt[0].id);
        } else if (data.length > 0) {
          setSelectedSiteIdForHierarchy(data[0].id);
        }
      } else {
        throw new Error(data.error || 'فشل جلب مواقع العمل الإنزلاقية.');
      }

      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const admins = usersData.filter((u: any) => u.role === 'admin' && u.username.toLowerCase() !== 'moataz');
        setAdminsList(admins);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في جلب مواقع العمل ومدراء النظام.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesAndAdmins();
  }, []);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteId.trim() || !newSiteName.trim() || !newSiteLoc.trim()) {
      setErrorMsg('فضلاً، يرجى ملء كافة الحقول الأساسية.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/sites/${editingSiteId}` : '/api/sites';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newSiteId.trim().toLowerCase().replace(/\s+/g, '-'),
          nameAr: newSiteName.trim(),
          location: newSiteLoc.trim(),
          description: newSiteDesc.trim(),
          tenantId: user?.username.toLowerCase() === 'moataz' ? newSiteTenantId : (user?.tenantId || 'moataz')
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية حفظ موقع العمل.');
      }

      setNewSiteId('');
      setNewSiteName('');
      setNewSiteLoc('');
      setNewSiteDesc('');
      setNewSiteTenantId('moataz');
      setIsEditMode(false);
      setEditingSiteId('');
      setShowAddSiteModal(false);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم لحفظ الموقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (site: Site) => {
    if (dbConnected === false) {
      setErrorMsg('عذراً، تم تعطيل تعديل السجلات مؤقتاً لعدم وجود اتصال نشط بقاعدة البيانات السحابية.');
      return;
    }
    setIsEditMode(true);
    setEditingSiteId(site.id);
    setNewSiteId(site.id);
    setNewSiteName(site.nameAr);
    setNewSiteLoc(site.location);
    setNewSiteDesc(site.description || '');
    setNewSiteTenantId(site.tenantId || 'moataz');
    setShowAddSiteModal(true);
  };

  const handleDeleteClick = (site: Site) => {
    if (user?.role !== 'admin') {
      setErrorMsg('عذراً! إجراء حذف مواقع العمل مقتصر كلياً على صلاحيات مدير النظام الرئيسي فقط.');
      return;
    }
    setSiteToDelete(site);
    const code = generateCaptcha();
    setDeleteCaptcha(code);
    setDeleteCaptchaInput('');
    setDeleteAdminPassword('');
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteToDelete) return;

    if (deleteCaptchaInput.trim() !== deleteCaptcha) {
      setErrorMsg('رمز التحقق كابتشر غير صحيح. يرجى كتابة الرموز الأربعة المتطابقة وإعادة المحاولة.');
      return;
    }

    if (!deleteAdminPassword.trim()) {
      setErrorMsg('فضلاً، يرجى كتابة رمز مرور مدير النظام لتخويل الحذف السحابي للمشروع.');
      return;
    }

    setIsDeletingSite(true);
    try {
      const response = await fetch(`/api/sites/${siteToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminUsername: user?.username || 'moataz',
          adminPassword: deleteAdminPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'عذراً! فشل التحقق السحابي لحساب مدير النظام أو رمز المرور غير سليم.');
      }
      setSuccessMsg(`تم بنجاح تام شطب وإزالة موقع العمل "${siteToDelete.nameAr}" نهائياً من قاعدة البيانات.`);
      setShowDeleteConfirmModal(false);
      setSiteToDelete(null);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      console.error('Delete site connection/auth error', err);
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء التصديق وحذف موقع العمل.');
    } finally {
      setIsDeletingSite(false);
    }
  };

  const filteredSites = sites.filter(site => {
    if (user?.role === 'admin' || user?.role === 'projects_manager') return true;
    if (user?.assignedProjects && user.assignedProjects.length > 0) {
      return user.assignedProjects.includes(site.id);
    }
    return true;
  });

  // Get localized user's initials for avatars (e.g. "م ع" for محمد عاصم)
  const getAvatarInitials = (name: string) => {
    if (!name) return 'م';
    const clean = name.replace(/\(.*\)/g, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).substring(0, 2);
    }
    return parts[0].substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-right text-slate-800 flex flex-col p-4 md:p-8 relative overflow-hidden font-sans" dir="rtl">
      
      {/* Soft dynamic ambient highlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-sky-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-10 w-80 h-80 bg-gradient-to-br from-amber-500/5 to-rose-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-gradient-to-tr from-emerald-500/5 to-teal-400/80 rounded-full blur-3xl opacity-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a04_1px,transparent_1px),linear-gradient(to_bottom,#0f172a04_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Main Header / Command Bar */}
      <header className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-5 z-10 text-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center p-2 shadow-sm">
            <BunyanLogo 
              className="w-9 h-9" 
              iconClassName="fill-slate-800" 
              barsClassName="fill-indigo-600" 
              dotClassName="fill-amber-500" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-slate-900 font-sans tracking-tight">بنيان</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full">نسخة الحوكمة الموحدة</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide">المنظومة الاحترافية المتكاملة لإدارة التكاليف والمواقع الإنشائية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto">
          {/* Cloud DB Connection Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-sans shadow-sm">
            <Database size={13} className="text-slate-400" />
            <span className="text-slate-500 font-bold hidden sm:inline">الحالة السحابية:</span>
            {dbConnected === null ? (
              <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                جاري الفحص...
              </span>
            ) : dbConnected ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi size={12} className="text-emerald-500 animate-pulse" />
                <span>متصلة وآمنة</span>
              </span>
            ) : (
              <button 
                onClick={onToggleOfflineBypass}
                type="button"
                className="text-rose-600 hover:text-rose-500 font-bold flex items-center gap-1 cursor-pointer transition border-none bg-transparent p-0"
              >
                <WifiOff size={12} className="text-rose-500" />
                <span>عمل محلي (اضغط للربط)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-700 font-black text-xs">
              {getAvatarInitials(user?.nameAr || 'مدير')}
            </div>
            <div className="text-right leading-none hidden sm:block">
              <p className="text-xs font-black text-slate-800">{user?.nameAr?.replace(/\s*\(?مدير التكاليف\)?/g, '')}</p>
              <span className="text-[9px] font-bold text-indigo-600 block mt-0.5">
                {user?.role === 'admin' ? 'مدير عام البرنامج (سطح الرقابة الموحد)' : 'أخصائي بيانات مالي فني'}
              </span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            خروج
          </button>
        </div>
      </header>

      {/* Main Container Dashboard Board */}
      <main className="max-w-7xl w-full mx-auto flex-1 flex flex-col justify-center z-10">
        
        {/* Upper Title Section */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Briefcase size={22} />
              </div>
              مقر ومستكشف مواقع العمل المعتمدة
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-3xl">
              يرجى اختيار أحد المقار أو مواقع العمل أدناه لبدء استعراض الكشوف السولار واليوميات والعهد المالية ومقايسات البنود المباشرة.
            </p>
          </div>

          {/* View Mode Switching Controls */}
          {user?.username.toLowerCase() === 'moataz' && (
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start border border-slate-200 shadow-inner">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'hierarchy' 
                    ? 'bg-white shadow-md text-indigo-700 border border-slate-200/50' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <Compass size={14} />
                <span>الهيكل الهرمي والمشرفين</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-md text-indigo-700 border border-slate-200/50' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <Building size={14} />
                <span>شبكة المواقع التقليدية</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Warnings / Messages */}
        <AnimatePresence mode="popLayout">
          {errorMsg && (
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="p-3.5 mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl max-w-2xl flex items-center gap-2"
            >
              <AlertTriangle size={15} className="text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="p-3.5 mb-5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-2xl max-w-2xl flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 animate-bounce" />
              <span className="whitespace-pre-line">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Master Site and Backup Trigger Section */}
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-2.5 mb-6">
            {dbConnected === false ? (
              <div className="flex items-center gap-3 p-3.5 bg-rose-50/75 border border-rose-150 rounded-2xl w-full">
                <AlertTriangle className="text-rose-600 shrink-0 animate-pulse" size={18} />
                <div className="text-right">
                  <p className="font-extrabold text-xs text-rose-700">وضع العمل بدون إنترنت (أوفلاين) نشط</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                    تم إيقاف إضافة أو تعديل الهياكل التنظيمية أو الفروع مؤقتاً لحماية الاتساق السحابي لحين إعادة الاتصال.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full flex-wrap gap-3 p-2 bg-white border border-slate-200/85 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingSiteId('');
                      const nextCodeSuggested = generateNextSiteId(sites);
                      setNewSiteId(nextCodeSuggested);
                      setNewSiteName('');
                      setNewSiteLoc('');
                      setNewSiteDesc('');
                      setNewSiteTenantId(user?.tenantId || (user?.username || '').toLowerCase().trim() || 'moataz');
                      setShowAddSiteModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>تأسيس موقع عمل جديد +</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(true)}
                    className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>استعادة ملف احتياطي</span>
                  </button>
                </div>

                {/* Database Health Badge */}
                <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] bg-slate-50 px-3 py-1.5 border rounded-xl font-bold text-slate-500">
                  <span>إجمالي المواقع المسجلة بالفروع: {sites.length} موقع عمل</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE SCREEN */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-slate-150-rounded-3xl shadow-sm rounded-3xl relative z-10">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
            <div className="text-center space-y-1">
              <p className="text-xs font-black text-slate-700 animate-pulse">جاري جلب ومواءمة الهياكل التنظيمية...</p>
              <p className="text-[10px] text-slate-400 font-semibold">بنيان تقوم بالربط وتأمين قنوات التشفير السحابية الفيدرالية</p>
            </div>
          </div>
        ) : viewMode === 'hierarchy' ? (
          
          /* LEVEL REDESIGN: PREMIUM 4-COLUMN HIERARCHY TREE EXPLORER */
          <div className="w-full relative z-10 space-y-5 font-sans">
            
            {/* Visual Header Info */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/65 via-white to-blue-50/50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/10 shrink-0">
                  <Compass size={18} />
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 leading-none">
                    <Layers className="text-indigo-600" size={15} />
                    مستكشف الهياكل الهرمية والربط والمشاريع
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-none">تصفح الفروع الإدارية للطبقة الثانية والوقوف على البيانات التفصيلية والتكاليف لكل مهندس وموقع</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 font-mono text-[10px] bg-white border px-3 py-1.5 rounded-xl text-slate-500 font-extrabold shrink-0 shadow-sm">
                <span>المسؤولين: {adminsList.length + 1}</span>
                <span className="text-slate-200">/</span>
                <span>المواقع النشطة: {sites.length}</span>
              </div>
            </div>

            {/* Core Interactive Hierarchy Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white/70 backdrop-blur-md border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm min-h-[580px] relative overflow-hidden">
              
              {/* LEVEL 1 CARD (ROOT - PROGRAM DIRECTOR) */}
              <div className="flex flex-col bg-slate-50/50 p-4 rounded-2xl border border-slate-150 text-right space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center font-mono">١</span>
                    <span className="text-xs font-black text-slate-900">مدير عام البرنامج</span>
                  </div>
                  <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">صلاحية مطلقة</span>
                </div>

                {/* Director Premium Identity Widget */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4.5 rounded-2xl text-white shadow-xl border border-slate-850 flex-1 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 border border-white/20">
                        <Landmark size={20} />
                      </div>
                      <div className="leading-tight">
                        <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-white transition-colors">م. معتز يونس</h4>
                        <span className="text-[9px] text-indigo-400 font-extrabold uppercase mt-0.5 block tracking-wider">moataz • المدير الرئيسي</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-300 leading-normal font-semibold">
                      المشرف والمسؤول العام لمشروعات بنيان. يُشرف على إدارة الصلاحيات وميزان المراجعات المالي المركزي لكامل مواقع الطبقة الثانية والثالثة.
                    </p>

                    {/* Stats mini grid */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 text-[10px] font-bold text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">الفروع الإدارية:</span>
                        <span className="font-mono text-amber-300">{adminsList.length + 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">مواقع الفروع:</span>
                        <span className="font-mono text-amber-300">{sites.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-emerald-400 pt-1 border-t border-white/5">
                        <span>قناة البيانات النشطة:</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={10} /> آمن وموثق</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 relative z-10">
                    {user?.username.toLowerCase() === 'moataz' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowReorgControlCenter(true);
                          fetchReorgStatus();
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2 active:scale-95 border border-indigo-500/30"
                      >
                        <Shield size={14} className="text-indigo-200" />
                        <span>لوحة حوكمة وصيانة قاعدة البيانات</span>
                      </button>
                    )}
                    <p className="text-[9px] text-slate-450 leading-relaxed font-semibold text-right">
                      * حدد أي مدير نظام بالعمود التالي لاستعراض مواقعه المعزولة المعتمدة ومشاريعها وأعضائها.
                    </p>
                  </div>
                </div>
              </div>


              {/* LEVEL 2 CARD: BRANCH ADMINISTRATORS MANAGEMENT */}
              <div className="flex flex-col bg-slate-50/30 p-4 rounded-2xl border border-slate-150 text-right space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-650 text-white text-[10px] font-black flex items-center justify-center font-mono">٢</span>
                    <span className="text-xs font-black text-slate-900">مدراء الفروع والمكاتب</span>
                  </div>
                  
                  {user?.username.toLowerCase() === 'moataz' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAdmin(false);
                        setAdminUsername('');
                        setAdminPassword('');
                        setAdminNameAr('');
                        setShowAddAdminModal(true);
                      }}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9.5px] font-extrabold rounded-lg inline-flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Plus size={11} className="stroke-[3]" />
                      <span>إضافة مدّير</span>
                    </button>
                  )}
                </div>

                {/* Quick Search For Level 2 */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث عن مدير نظام..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-right font-bold text-slate-700 placeholder:text-slate-400"
                  />
                  {adminSearchQuery && (
                    <button 
                      onClick={() => setAdminSearchQuery('')} 
                      className="absolute inset-y-0 left-2.5 flex items-center text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Administrators Stack Scroll Area */}
                <div className="space-y-2 overflow-y-auto pr-0.5 flex-1 max-h-[440px] scrollbar-thin">
                  {(() => {
                    const isMoatazVisible = 
                      'معتز يونس'.includes(adminSearchQuery.trim()) ||
                      'moataz'.includes(adminSearchQuery.toLowerCase().trim()) ||
                      adminSearchQuery.trim() === '';
                    
                    const moatazSitesCount = sites.filter((site: any) => (site.tenantId || 'moataz') === 'moataz').length;

                    const filteredAdminsList = adminsList.filter((adm: any) => 
                      adm.nameAr?.includes(adminSearchQuery.trim()) ||
                      adm.username?.toLowerCase().includes(adminSearchQuery.toLowerCase().trim())
                    );

                    return (
                      <>
                        {/* Moataz Default Owner Card */}
                        {isMoatazVisible && (
                          <div 
                            onClick={() => {
                              setSelectedAdminUsername('moataz');
                              const defaultAdminSites = sites.filter((s: any) => (s.tenantId || 'moataz') === 'moataz');
                              if (defaultAdminSites.length > 0) {
                                setSelectedSiteIdForHierarchy(defaultAdminSites[0].id);
                              } else {
                                setSelectedSiteIdForHierarchy('');
                              }
                            }}
                            className={`p-3 rounded-xl border text-right cursor-pointer transition-all duration-200 flex items-center justify-between ${
                              selectedAdminUsername === 'moataz'
                                ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 font-black shadow-sm ring-1 ring-indigo-400/20'
                                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${selectedAdminUsername === 'moataz' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                م ي
                              </div>
                              <div className="text-right min-w-0">
                                <h5 className="text-[11.5px] font-extrabold text-slate-900 truncate">مكتب معتز يونس الافتراضي</h5>
                                <p className="text-[9.5px] text-slate-400 font-mono font-bold mt-0.5">moataz • مكتب رئيسي</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black font-mono px-1.5 py-0.5 bg-slate-100/80 text-slate-600 border rounded-md shrink-0">
                              {moatazSitesCount} مواقع
                            </span>
                          </div>
                        )}

                        {/* Branch Administrator Cards */}
                        {filteredAdminsList.map((adm, idx) => {
                          const admSitesCount = sites.filter((s: any) => (s.tenantId || 'moataz') === adm.username.toLowerCase()).length;
                          const isSelected = selectedAdminUsername === adm.username.toLowerCase();
                          return (
                            <div 
                              key={adm.docId || `${adm.username}_${idx}`}
                              onClick={() => {
                                setSelectedAdminUsername(adm.username.toLowerCase());
                                const adminSites = sites.filter((s: any) => (s.tenantId || 'moataz') === adm.username.toLowerCase());
                                if (adminSites.length > 0) {
                                  setSelectedSiteIdForHierarchy(adminSites[0].id);
                                } else {
                                  setSelectedSiteIdForHierarchy('');
                                }
                              }}
                              className={`p-3 rounded-xl border text-right cursor-pointer transition-all duration-200 relative group/admin ${
                                isSelected
                                  ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 font-black shadow-sm ring-1 ring-indigo-400/20'
                                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2 min-w-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {getAvatarInitials(adm.nameAr)}
                                  </div>
                                  <div className="text-right min-w-0">
                                    <h5 className="text-[11.5px] font-black text-slate-900 truncate">{adm.nameAr}</h5>
                                    <p className="text-[9.5px] text-slate-400 font-mono font-bold mt-0.5">{adm.username} • فرع إداري</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9px] font-black font-mono px-1.5 py-0.5 bg-slate-100/90 text-slate-600 border rounded-lg">
                                    {admSitesCount} مواقع
                                  </span>

                                  {/* Fast Actions for Director ONLY */}
                                  {user?.username.toLowerCase() === 'moataz' && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/admin:opacity-100 transition-opacity duration-150">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditAdminClick(adm);
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 cursor-pointer"
                                        title="تعديل الحساب"
                                      >
                                        <Edit size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAdmin(adm.username);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                        title="إلغاء الترخيص"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredAdminsList.length === 0 && !isMoatazVisible && (
                          <div className="text-center py-10 text-xs text-slate-400 font-medium leading-relaxed font-sans border-2 border-dashed border-slate-150 rounded-2xl">
                            لا يوجد نتائج للبحث
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>


              {/* LEVEL 3 CARD: BRANCH CONSTRUCTION SITES (مواقع هذا المدير) */}
              <div className="flex flex-col bg-slate-50/30 p-4 rounded-2xl border border-slate-150 text-right space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٣</span>
                    <span className="text-xs font-black text-slate-900">مواقع عمل المسؤول المعتمدة</span>
                  </div>
                  <span className="text-[9px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded-md border font-extrabold">
                    {sites.filter((s: any) => (s.tenantId || 'moataz') === selectedAdminUsername).length} مسجل
                  </span>
                </div>

                {/* Search Bar for Level 3 */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث في مواقع هذا المسؤول..."
                    value={siteSearchQuery}
                    onChange={(e) => setSiteSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-right font-bold text-slate-700 placeholder:text-slate-400"
                  />
                  {siteSearchQuery && (
                    <button 
                      onClick={() => setSiteSearchQuery('')} 
                      className="absolute inset-y-0 left-2.5 flex items-center text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Construction sites list with connection indicators */}
                <div className="space-y-2 overflow-y-auto pr-0.5 flex-1 max-h-[440px] scrollbar-thin">
                  {(() => {
                    const rawMySites = sites.filter((site: any) => (site.tenantId || 'moataz') === selectedAdminUsername);
                    const filteredHierarchySites = rawMySites.filter((site: any) => 
                      site.nameAr?.includes(siteSearchQuery.trim()) ||
                      site.location?.includes(siteSearchQuery.trim()) ||
                      site.id?.toLowerCase().includes(siteSearchQuery.toLowerCase().trim())
                    );

                    return (
                      <>
                        {filteredHierarchySites.map((site, idx) => {
                          const isSelected = selectedSiteIdForHierarchy === site.id;
                          const projectsCount = (site.projects || []).length;
                          return (
                            <div 
                              key={site.id || `site_${idx}`}
                              onClick={() => setSelectedSiteIdForHierarchy(site.id)}
                              className={`p-3 rounded-xl border text-right cursor-pointer transition-all duration-200 relative group/site active:scale-98 flex flex-col justify-between min-h-[95px] ${
                                isSelected
                                  ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 font-bold shadow-sm ring-1 ring-emerald-400/25'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-center gap-2 min-w-0 text-right">
                                    <Building size={13} className={`${isSelected ? 'text-emerald-600' : 'text-slate-400'} shrink-0`} />
                                    <h5 className="text-[11.5px] font-extrabold truncate text-slate-900 leading-snug">{site.nameAr}</h5>
                                  </div>
                                  <span className="text-[9px] font-black font-mono px-1.5 py-0.5 bg-emerald-100/50 text-emerald-800 border border-emerald-200 rounded-md shrink-0">
                                    {projectsCount} مشاريع
                                  </span>
                                </div>
                                
                                <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                  <MapPin size={11} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{site.location}</span>
                                </p>
                              </div>

                              <div className="pt-1.5 mt-1 border-t border-slate-100/80 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                                <span>كود: {site.id}</span>
                                {isSelected && (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <span>مفتوح ومحدد</span>
                                    <ChevronLeft size={10} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {filteredHierarchySites.length === 0 && (
                          <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 bg-slate-50/20 rounded-2xl p-5">
                            <p className="font-extrabold text-slate-600 text-[10.5px] mb-1 flex items-center justify-center gap-1">
                              <AlertTriangle size={13} className="text-amber-500" />
                              لا يوجد مواقع لهذا المسؤول
                            </p>
                            <p className="text-[9.5px]">يرجى تعديل الفرز أو تأسيس كود جديد.</p>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  setIsEditMode(false);
                                  const nextCodeSuggested = generateNextSiteId(sites);
                                  setNewSiteId(nextCodeSuggested);
                                  setNewSiteName('');
                                  setNewSiteLoc('');
                                  setNewSiteDesc('');
                                  setNewSiteTenantId(selectedAdminUsername);
                                  setShowAddSiteModal(true);
                                }}
                                className="mt-3.5 text-[9.5px] font-black bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1 shadow-sm"
                              >
                                <span>تأسيس موقع جديد +</span>
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>


              {/* LEVEL 4 CONFIGURATION AND ACTIVE DETAILED PROJECTS BLOCK */}
              <div className="flex flex-col bg-slate-50/50 p-4 rounded-2xl border border-slate-150 text-right space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٤</span>
                    <span className="text-xs font-black text-slate-900">مشاريع ومعاوضات الموقع</span>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto pr-0.5 flex-1 max-h-[500px] scrollbar-thin">
                  {(() => {
                    const activeSite = sites.find(s => s.id === selectedSiteIdForHierarchy);
                    const activeProjects = activeSite?.projects || [];
                    
                    if (!selectedSiteIdForHierarchy) {
                      return (
                        <div className="text-center py-16 text-xs text-slate-400 border border-dashed border-slate-200 bg-white/50 rounded-2xl p-6">
                          <Compass size={24} className="mx-auto text-slate-400 mb-2" />
                          <p className="font-extrabold text-slate-600 text-[11px]">بانتظار تحديد موقع العمل</p>
                          <p className="text-[10px] leading-relaxed mt-1 text-slate-400">حدد أحد العناوين المعتمدة بالعمود الإداري الثالث لقراءة الدفاتر.</p>
                        </div>
                      );
                    }

                    // Filter search inside activeProjects
                    const filteredHierarchyProjects = activeProjects.filter((p: any) => 
                      p.name?.includes(projectSearchQuery.trim()) ||
                      p.id?.toLowerCase().includes(projectSearchQuery.toLowerCase().trim()) ||
                      p.assignmentNumber?.includes(projectSearchQuery.trim())
                    );

                    return (
                      <div className="space-y-3 flex flex-col h-full">
                        {/* Selected Active Site Header with entering button */}
                        <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl space-y-3 shadow-md border border-emerald-500 relative">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-black text-emerald-100 bg-white/10 px-2 py-0.5 rounded-md inline-block">موقع العمل المفتوح</span>
                            <h4 className="text-xs font-black truncate">{activeSite?.nameAr}</h4>
                            <p className="text-[10px] text-emerald-100 flex items-center gap-1 font-semibold leading-none mt-1">
                              <MapPin size={10} /> {activeSite?.location}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              if (activeSite) {
                                onSiteSelected(activeSite);
                              }
                            }}
                            className="w-full py-2.5 bg-white hover:bg-slate-50 text-emerald-950 font-black text-xs rounded-xl transition-all duration-200 shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <FolderPlus size={13} className="text-emerald-700" />
                            <span>دخول لوحة السجلات بالكامل</span>
                            <ArrowRight size={12} className="rotate-180 text-emerald-700 font-bold" />
                          </button>
                        </div>

                        {/* Search Bar for level 4 Projects */}
                        <div className="relative">
                          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                            <Search size={11} />
                          </span>
                          <input
                            type="text"
                            placeholder="البحث في مشاريع هذا الموقع..."
                            value={projectSearchQuery}
                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-right font-medium text-slate-700 placeholder:text-slate-405"
                          />
                          {projectSearchQuery && (
                            <button 
                              onClick={() => setProjectSearchQuery('')} 
                              className="absolute inset-y-0 left-2.5 flex items-center text-[10px] text-slate-400 hover:text-slate-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* List of Projects */}
                        <div className="space-y-2 pb-4">
                          {filteredHierarchyProjects.map((p: any, idx: number) => {
                            const statusLabel = p.status || 'نشط';
                            const statusColor = statusLabel === 'نشط' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                              : statusLabel === 'مكتمل'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-250';

                            return (
                              <div 
                                key={p.id || `proj_${idx}`} 
                                className="p-3 bg-white hover:bg-slate-50/55 border border-slate-200 text-right rounded-xl space-y-2 relative transition-all duration-150 hover:shadow-xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-black rounded ${statusColor}`}>
                                    {statusLabel === 'نشط' ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>نشط</span>
                                      </>
                                    ) : (
                                      <span>{statusLabel}</span>
                                    )}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">كود: {p.id}</span>
                                </div>

                                <div className="space-y-1 text-right">
                                  <div className="flex items-center gap-1.5">
                                    <h6 className="text-[11px] font-bold text-slate-900 leading-snug">{p.name}</h6>
                                  </div>
                                  <p className="text-[9.5px] text-slate-500 font-semibold bg-slate-50 border px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <span>رقم التكليف:</span>
                                    <span className="font-mono text-slate-800 font-black">{p.assignmentNumber || 'غير كود'}</span>
                                  </p>
                                </div>

                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                                  <div>تاريخ البدء: <span className="font-mono text-slate-800 font-bold">{p.assignmentDate || 'مستمر'}</span></div>
                                  <div>التسليم: <span className="font-mono text-slate-800 font-bold">{p.handoverDate || 'مستمر'}</span></div>
                                </div>
                              </div>
                            );
                          })}

                          {filteredHierarchyProjects.length === 0 && (
                            <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 bg-slate-50/20 rounded-2xl leading-relaxed text-right p-5">
                              <p className="font-bold text-slate-500 text-[10.5px] mb-1">لم يتم إرفاق أي مشروعات بالبحث</p>
                              <p className="text-[9.5px]">دخول لوحة السجلات بالكامل يتيح لك إضافة المشروعات وبنود BOQ بالكامل.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        ) : (
          
          /* TRADITIONAL BENTO FILTER GRID VIEW (مدراء آخرون أو العرض التقليدي) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {filteredSites.map((site, idx) => (
              <motion.div
                key={site.id || `site_${idx}`}
                whileHover={{ scale: 1.015, y: -2 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSiteSelected(site)}
                className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-indigo-400 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer text-right flex flex-col justify-between min-h-[180px] relative group transition font-sans"
              >
                {/* Modern subtle arrow block */}
                <div className="absolute top-4 left-4 w-8 h-8 bg-slate-50 border border-slate-200/50 group-hover:border-indigo-150 text-slate-400 group-hover:text-indigo-600 rounded-xl flex items-center justify-center shadow-xs transition duration-200">
                  <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building size={15} className="text-indigo-600 shrink-0" />
                    <h3 className="font-extrabold text-slate-900 text-[13px] leading-tight pr-1 truncate max-w-[200px]">{site.nameAr}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-650 font-bold block">
                    <MapPin size={12} className="text-indigo-500 inline shrink-0" />
                    <span>{site.location}</span>
                  </div>
                  
                  <p className="text-[10.5px] text-slate-500 pr-0.5 line-clamp-2 leading-relaxed font-sans">{site.description || 'لم يتم كتابة تفاصيل تشغيلية مميزة لهذا الكود للموقع.'}</p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center z-10">
                  <span className="text-[10px] text-slate-450 font-bold font-mono bg-slate-50 border px-2 py-0.5 rounded-lg">كود: {site.id}</span>
                  
                  {user?.role === 'admin' && (
                    <div className="flex gap-1.5 no-print" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(site);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-amber-700 hover:text-amber-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition shadow-xs"
                      >
                        <Edit size={10} />
                        <span>تعديل</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(site);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition shadow-xs"
                      >
                        <Trash2 size={10} />
                        <span>حذف</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredSites.length === 0 && (
              <div className="col-span-full border border-dashed border-slate-200 bg-white/50 rounded-3xl p-12 text-center text-slate-400">
                <Compass size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-sm text-slate-800">لم يتم العثور على أي مواقع عمل مسجلة</p>
                <p className="text-xs text-slate-500 mt-1">تأكد من تراخيص صلاحيتك أو تواصل مع المشرف العام "معتز يونس".</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer System Credits */}
      <footer className="mt-16 text-center text-[10.5px] text-slate-400 max-w-7xl w-full mx-auto border-t border-slate-250 pt-5 relative z-10 font-sans font-semibold">
        جميع الحقوق محفوظة لنظام بنيان الذكي لإدارة المشروعات والتدقيق الإنشائي © 2026.
      </footer>

      {/* CREATE / EDIT SITE MODAL WITH NEXT SEQUENTIAL CODE AUTOINDICATOR */}
      <AnimatePresence>
        {showAddSiteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-3xl p-6 w-full max-w-md relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <FolderPlus size={20} className="text-indigo-600 shrink-0" />
                <h3 className="font-black text-sm text-slate-900">
                  {isEditMode ? 'تعديل بيانات موقع عمل قيد التشغيل' : 'تأسيس وإنشاء رمز موقع عمل ومشروع جديد'}
                </h3>
              </div>

              <form onSubmit={handleSaveSite} className="space-y-4">
                
                {/* NEW CODE INPUT: DYNAMIC SEQUENTIAL NEXT SITE ID BADGE (اريد عند انشاء موقع جديد ان يعطى له كود تلقائي لرقم الموقع التالى) */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">رمز / كود المشروع (توليد متتالي تلقائي):</label>
                    {!isEditMode && (
                      <span className="text-[9.5px] font-black bg-emerald-500/10 text-emerald-700 border border-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                        <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                        الترتيب التالي التلقائي
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    placeholder="مثال: site-103"
                    value={newSiteId}
                    onChange={(e) => setNewSiteId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                    pattern="[a-zA-Z0-9-]+"
                    title="يرجى استخدام الحروف الإنجليزية والأرقام والشرطات فقط."
                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left ${
                      isEditMode ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-800'
                    }`}
                    dir="ltr"
                  />
                  {!isEditMode && (
                    <p className="text-[9.5px] text-slate-400 leading-normal font-medium">
                      * تم استنتاج تسلسل الكود تلقائياً بناءً على آخر موقع عمل تم إنشاؤه لضمان عدم التداخل. يمكنك تعديله إذا أردت.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">اسم موقع العمل (باللغة العربية):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: موقع كوبري الإسكندرية الفرعي"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">المركز والموقع الجغرافي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: طريق السويس قطاع الهايكستب"
                    value={newSiteLoc}
                    onChange={(e) => setNewSiteLoc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">تفاصيل أو مبررات التخصيص (اختياري):</label>
                  <textarea
                    rows={3}
                    placeholder="أدخل مقتطف تعريفي لمواقع العمل أو البنود الخاصة بمجال الأعمال..."
                    value={newSiteDesc}
                    onChange={(e) => setNewSiteDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-405 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                {/* Branch Administrator Assignment (Only visible for Program Director moataz) */}
                {user?.username.toLowerCase() === 'moataz' && (
                  <div className="space-y-1.5 text-right font-sans">
                    <label className="text-xs font-bold text-slate-700 font-bold">المدير المسؤول عن هذا الموقع (الطبقة الثانية):</label>
                    <select
                      value={newSiteTenantId}
                      onChange={(e) => setNewSiteTenantId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    >
                      <option value="moataz">مدير البرنامج معتز (المكتب العام)</option>
                      {adminsList.map((adm, idx) => (
                        <option key={adm.docId || `${adm.username}_${idx}`} value={adm.username.toLowerCase()}>
                          {adm.nameAr} ({adm.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-3.5 flex gap-2 justify-end text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingSiteId('');
                      setShowAddSiteModal(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition active:scale-95"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري التأسيس والربط السحابي...' : isEditMode ? 'تعديل وحفظ البيانات' : 'حفظ وإنشاء الموقع'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT ACCOUNT ADMIN MODAL */}
      <AnimatePresence>
        {showAddAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Shield size={20} />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {isEditingAdmin ? 'تعديل بيانات مدير نظام الفرع' : 'تأسيس وترقية مدير نظام جديد بالفرع'}
                </h3>
              </div>

              <form onSubmit={handleSaveAdmin} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">اسم مستخدم مدير النظام (إنجليزية وأرقام فقط):</label>
                  <input
                    type="text"
                    required
                    disabled={isEditingAdmin}
                    placeholder="مثال: osama"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left ${
                      isEditingAdmin ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-850'
                    }`}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">الاسم الشخصي والصفة المعتمدة باللغة العربية:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أسامة الشريف"
                    value={adminNameAr}
                    onChange={(e) => setAdminNameAr(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">
                    {isEditingAdmin ? 'كلمة المرور الجديدة (اترك فارغاً لعدم التغيير):' : 'كلمة مرور الدخول:'}
                  </label>
                  <input
                    type="text"
                    required={!isEditingAdmin}
                    placeholder="رمز مشفر للدخول"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>

                <div className="pt-3.5 flex gap-2 justify-end text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAdmin(false);
                      setShowAddAdminModal(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition active:scale-95"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingAdmin ? 'جاري الحفظ والإنفاذ...' : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLOUD DB REORGANIZATION AND OWNERSHIP TRANSFER CONTROL CENTER */}
      <AnimatePresence>
        {showReorgControlCenter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-3xl p-6 w-full max-w-2xl relative font-sans text-right shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setShowReorgControlCenter(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-5 text-indigo-700 border-b border-slate-150 pb-3">
                <Database size={24} />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">أداة حوكمة وإعادة هيكلة البيانات السحابية</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">صلاحية سيادية مرخصة لمدير البرنامج معتز لمواءمة الأوعية وتطهير الحسابات</p>
                </div>
              </div>

              {isLoadingReorg ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 size={32} className="text-indigo-650 animate-spin" />
                  <p className="text-xs font-bold text-slate-600 animate-pulse">جاري فحص ومواءمة مكونات قاعدة البيانات السحابية...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-450">مستعملي النظام</h4>
                      <p className="text-lg font-black text-slate-800 mt-1 font-mono">{reorgStatus?.totalUsers ?? '...'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-450">مواقع الفروع</h4>
                      <p className="text-lg font-black text-slate-800 mt-1 font-mono">{reorgStatus?.totalSites ?? '...'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-rose-600">المتروكة القديمة</h4>
                      <p className="text-lg font-black text-rose-700 mt-1 font-mono">{reorgStatus?.legacyUsersCount ?? '...'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-700 font-bold">مواقع معلّقة</h4>
                      <p className="text-lg font-black text-amber-700 mt-1 font-mono">{reorgStatus?.orphanedSitesCount ?? '...'}</p>
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  <div className="space-y-2 text-xs">
                    {reorgStatus?.legacyUsersCount > 0 && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                        <h4 className="font-extrabold text-rose-800 flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={14} />
                          تم رصد حسابات معلّقة قديمة تشغل الأوعية!
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          قد تؤدي السجلات القديمة المترتبة إلى تداخل البيانات بين المشرفين الجدد. يمكنك تطهيرها ومسحها بنقرة واحدة.
                        </p>
                      </div>
                    )}

                    {reorgStatus?.orphanedSitesCount > 0 && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                        <h4 className="font-extrabold text-amber-800 flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={14} />
                          أعمال ومواقع معلّقة (بدون مالك فرعي):
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          يسند هذا المعالج فورياً المواقع الغريبة إلى ملكية حسابك مؤقتاً لتتمكن من إعادة توزيعها بشكل آمن.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Clean block */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">1. الفحص الفوري والمواءمة الشاملة</h4>
                    <p className="text-[10px] text-slate-550 leading-relaxed">تطلق هذه التشغيل السحابي مسحاً فورياً لحذف مخلفات البني الإدارية القديمة وتوحيد الأوعية.</p>
                    <button
                      type="button"
                      onClick={handleExecuteReorg}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles size={13} />
                      <span>تشغيل معالج التطهير والمواءمة المركزي للفروع</span>
                    </button>
                  </div>

                  {/* Transfer Form block */}
                  <form onSubmit={handleTransferOwnership} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">2. نقل وإعادة توزيع ملكية المواقع والمقايسات</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">اختر أحد العناوين والبنود من قاعدة البيانات السحابية واختصر الصلاحيات لنقلها فورياً إلى ملكية مدير فرع آخر:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">قطاع العمل أو الموقع المستهدف:</label>
                        <select
                          required
                          value={transferSiteId}
                          onChange={(e) => setTransferSiteId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- اختر موقع العمل السحابي --</option>
                          {sites.map((s, idx) => (
                            <option key={s.id || `site_opt_${idx}`} value={s.id}>{s.nameAr} ({s.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">مدير النظام المستلم الجديد:</label>
                        <select
                          required
                          value={transferAdmin}
                          onChange={(e) => setTransferAdmin(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- اختر الطرف المناسب للاستلام --</option>
                          <option value="moataz">المكتب العام (موئل معتز يونس)</option>
                          {adminsList.map((adm, idx) => (
                            <option key={adm.docId || `${adm.username}_${idx}`} value={adm.username.toLowerCase()}>{adm.nameAr} ({adm.username})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-semibold leading-none flex items-center gap-1">
                        <AlertTriangle size={11} className="text-amber-500" />
                        ستنعكس تغييرات الصلاحية للأعضاء فورياً.
                      </span>
                      <button
                        type="submit"
                        disabled={isTransferring}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition active:scale-95"
                      >
                        {isTransferring ? 'جاري معالجة النقل...' : 'تأكيد وإعادة توجيه الصلاحيات'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED RESTORE BACKUP MODAL */}
      <AnimatePresence>
        {showRestoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-3xl p-6 w-full max-w-lg relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreFile(null);
                  setRestorePayload(null);
                }}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer font-sans"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-5 text-emerald-700 border-b border-slate-150 pb-3">
                <Download size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">استعادة واستيراد بنود ووثائق النسخ الاحتياطي</h3>
                  <p className="text-[10px] text-slate-500">رفع وقراءة السجلات المحلية لحفظها بالكامل على المخدم السحابي المعزول</p>
                </div>
              </div>

              {!restorePayload ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <FolderPlus size={44} className="text-slate-300 mb-3" />
                  <p className="text-xs font-bold text-slate-650 text-center mb-4">يُرجى سحب أو رفع ملف النسخة الاحتياطية بصيغة (JSON)</p>
                  
                  <label className="px-5 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-md">
                    تصفح الملفات
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleRestoreFileSelect}
                    />
                  </label>
                </div>
              ) : (
                <form onSubmit={handleConfirmRestore} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      تم فحص ملف الاسترداد بنجاح!
                    </span>
                    <button 
                      type="button"
                      onClick={() => { setRestoreFile(null); setRestorePayload(null); }}
                      className="text-[10px] underline hover:text-emerald-600 font-bold"
                    >
                      إلغاء الملف
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    سيقوم النظام بإنشاء وتوطين موقع العمل الجديد واستيراد كافة الكشوف من السجل المرفق فوراً. يرجى تأكيد اسم وعنوان الرمز:
                  </p>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-600">اسم موقع العمل العربي:</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      value={restoreSiteName}
                      onChange={(e) => setRestoreSiteName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-600">الرمز الخاص الإنجليزي (ID):</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-left"
                      value={restoreSiteId}
                      onChange={(e) => setRestoreSiteId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      disabled={sites.some(s => s.id === restoreSiteId)}
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-600">المركز الجغرافي للموقع:</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      value={restoreSiteLoc}
                      onChange={(e) => setRestoreSiteLoc(e.target.value)}
                    />
                  </div>

                  <div className="pt-3.5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isRestoring}
                      className="px-6 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl font-extrabold cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      {isRestoring ? 'جاري الكتابة والمزامنة السحابية...' : 'تأكيد واستيراد الملف كموقع عمل'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOVEREIGN SITE DELETION CONFIRMATION MODAL WITH CAPTCHA & PASSWORD */}
      <AnimatePresence>
        {showDeleteConfirmModal && siteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSiteToDelete(null);
                }}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer font-sans"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5 mb-4 text-rose-650 border-b border-slate-100 pb-3">
                <AlertTriangle size={24} className="text-rose-650 shrink-0 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">تأكيد إجراء الحذف السيادي لموقع العمل</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">صلاحية أمنية مخصصة لمدير النظام الرئيسي فقط</p>
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-slate-200 rounded-2xl text-right space-y-1.5 mb-4">
                <p className="text-[10px] text-rose-800 font-bold leading-none">تنبيه حرج وغير قابل للتراجع:</p>
                <p className="text-xs font-extrabold text-slate-900 leading-snug">
                  أنت على وشك مسح وإزالة موقع الإجراء المعتمد:
                  <span className="block mt-1 font-black text-rose-700">"{siteToDelete.nameAr}"</span>
                </p>
                <div className="flex justify-between text-[9.5px] text-slate-550 pt-1 border-t border-rose-100/50 font-mono">
                  <span>كود: {siteToDelete.id}</span>
                  <span>الموقع: {siteToDelete.location}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmDeleteSite} className="space-y-4">
                
                {/* CAPTCHA SECTION */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700">رمز التحقق الأمني (الكابتشر):</label>
                    <button
                      type="button"
                      onClick={() => setDeleteCaptcha(generateCaptcha())}
                      className="text-[10px] font-bold text-indigo-650 hover:underline cursor-pointer"
                    >
                      تحديث الرمز ↻
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Visual Captcha Sign */}
                    <div className="select-none font-mono font-black text-lg bg-indigo-50 border border-indigo-150 text-indigo-650 tracking-widest px-4 py-2 rounded-xl skew-x-3 rotate-1 flex items-center justify-center border-dashed shrink-0 shadow-inner w-24">
                      {deleteCaptcha}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="أدخل الأرقام الأربعة"
                        value={deleteCaptchaInput}
                        onChange={(e) => setDeleteCaptchaInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-mono font-black placeholder-slate-400 focus:outline-none focus:border-rose-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* PASSWORD SECTION */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-700">كلمة مرور مدير النظام (للتأكيد):</label>
                    <span className="text-[9px] text-rose-650 font-bold">مطلوبة *</span>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="أدخل كلمة مرور حسابك لتأكيد الحذف"
                    value={deleteAdminPassword}
                    onChange={(e) => setDeleteAdminPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right tracking-tight focus:outline-none focus:bg-white focus:border-rose-500 placeholder-slate-400 text-left placeholder:text-right"
                    dir="ltr"
                  />
                </div>

                <div className="pt-2 flex gap-2 justify-end text-xs font-bold font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setSiteToDelete(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition active:scale-95"
                  >
                    إلغاء الحذف
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingSite}
                    className="px-5 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md shadow-rose-600/10"
                  >
                    {isDeletingSite ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الحذف بأمان...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>تأكيد الحذف النهائي</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
