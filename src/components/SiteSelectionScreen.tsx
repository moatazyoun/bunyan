import React, { useState, useEffect } from 'react';
import { Building, MapPin, Plus, ArrowRight, Loader2, Sparkles, FolderPlus, Compass, Edit, Trash2, Wifi, WifiOff, Database, AlertTriangle, UserCheck, Shield, ChevronLeft, Layers, Landmark, Briefcase, Download, Search, Calendar, CheckCircle2 } from 'lucide-react';
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
    // Confirm block removed to avoid iframe blocking
    // if (!window.confirm('⚠️ تأكيد هام وجادّ:\nهل أنت متأكد من رغبتك في تشغيل المعالجة الآلية لإعادة الهيكلة؟ ذلك سيقوم بتطهير الحسابات المتروكة من النظام القديم تلقائياً، وإقران جميع مواقع العمل بالمسؤولين الجدد أو المكتب الرئيسي.')) {
    //   return;
    // }
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

    // Confirm block removed
    // if (!window.confirm('⚠️ تأكيد نقل الملكية:\nهل أنت متأكد من نقل ملكية هذا الموقع وكافة مشروعاته التابعة وصلاحيات بنود المقايسة (BOQ) لهذا المدير؟ سيؤدي ذلك فوراً إلى إعادة هيكلة التراخيص ومستكشف العرض.')) {
    //  return;
    // }

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

  const handleEditAdminClick = (adm: any) => {
    setAdminUsername(adm.username);
    setAdminPassword(''); // Leave blank to keep existing
    setAdminNameAr(adm.nameAr);
    setIsEditingAdmin(true);
    setShowAddAdminModal(true);
  };

  const handleDeleteAdmin = async (usernameToDelete: string) => {
    // Confirm block removed
    // if (!window.confirm(`⚠️ تحذير أمني هام:\nهل أنت متأكد من رغبتك في حذف وإزالة حساب مدير النظام (${usernameToDelete}) بالكامل وسحب كافة تراخيص التشفير لفرعه؟`)) {
    //   return;
    // }
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
      // 1. Fetch sites with projects
      const response = await fetch('/api/sites');
      const data = await response.json();
      if (response.ok) {
        setSites(data);
        
        // Setup initial selected admin & site for hierarchy explorer view
        const currentTenantId = user?.tenantId || user?.username.toLowerCase() || 'moataz';
        const isDefaultMoataz = user?.username.toLowerCase() === 'moataz';
        
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

      // 2. Fetch admins
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

      // Reset form & reload
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

  const handleDeleteClick = async (site: Site) => {
    const confirmed = true; // window.confirm(`هل أنت متأكد من حذف موقع العمل "${site.nameAr}" نهائياً؟ سيتم مسح كافة سجلاته بالكامل وبشكل غير قابل للاسترجاع.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل حذف موقع العمل.');
      }
      await fetchSitesAndAdmins();
    } catch (err: any) {
      console.error('Delete error', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم لحفظ الموقع.');
    }
  };

  const filteredSites = sites.filter(site => {
    // Admin and Projects Manager see everything
    if (user?.role === 'admin' || user?.role === 'projects_manager') return true;
    
    // If user has assigned projects, only show those
    if (user?.assignedProjects && user.assignedProjects.length > 0) {
      return user.assignedProjects.includes(site.id);
    }
    
    // Otherwise show all (default legacy behavior, or if no restrictions set)
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-right text-slate-820 flex flex-col p-6 md:p-12 relative overflow-hidden font-sans" dir="rtl">
      
      {/* Interactive moving gradient background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft floating circle 1 */}
        <motion.div
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -40, 50, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-12 -left-12 w-72 h-72 bg-gradient-to-tr from-indigo-200/40 to-sky-200/40 rounded-full blur-3xl"
        />

        {/* Soft floating circle 2 */}
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 60, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-br from-amber-100/50 to-pink-100/50 rounded-full blur-3xl"
        />

        {/* Soft floating circle 3 */}
        <motion.div
          animate={{
            x: [0, 30, -40, 0],
            y: [0, 50, -40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-20 left-1/4 w-80 h-80 bg-gradient-to-tr from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl"
        />

        {/* Delicate structural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:24px_24px] opacity-65" />
      </div>

      {/* Navigation Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between mb-12 border-b border-slate-200 pb-5 no-print z-10 text-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm transition">
            <BunyanLogo 
              className="w-10 h-10" 
              iconClassName="fill-slate-800" 
              barsClassName="fill-indigo-600" 
              dotClassName="fill-amber-500" 
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">بنيان</h1>
            <p className="text-[10px] text-slate-500 font-bold">نظام بنيان الذكي لإدارة المشروعات والتكاليف</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Real-time DB Status Indicator inside Site Selector header of Bunyan ERP */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-sans shadow-sm">
            <Database size={13} className="text-slate-500" />
            <span className="text-slate-600 font-semibold hidden lg:inline">قاعدة البيانات:</span>
            {dbConnected === null ? (
              <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                جاري الفحص...
              </span>
            ) : dbConnected ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi size={12} className="text-emerald-500" />
                <span>{forceOfflineBypass ? 'نشط محلياً ⚠️' : 'متصلة سحابياً'}</span>
              </span>
            ) : (
              <button 
                onClick={onToggleOfflineBypass}
                type="button"
                className="text-rose-600 hover:text-rose-500 font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 border-none bg-transparent p-0"
                title="اضغط للعمل في وضع العمل المحلي دون إنترنت"
              >
                <WifiOff size={12} className="text-rose-500 animate-pulse" />
                <span>أوفلاين (اضغط للتفعيل ⚠️)</span>
              </button>
            )}
          </div>

          <div className="text-left md:text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">مرحباً بك، {user?.nameAr?.replace(/\s*\(?مدير التكاليف\)?/g, '')}</p>
            <span className="text-[9.5px] font-bold text-indigo-600">
              {user?.role === 'admin' ? 'مدير البرنامج' : 'مخوّل لاستعراض قواعد البيانات'}
            </span>
          </div>
          <button 
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-800 rounded-lg text-xs font-semibold cursor-pointer transition active:scale-95 shadow-sm"
          >
            خروج آمن
          </button>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-center z-10">
        
        <div className="mb-6 space-y-2 relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">اختر موقع العمل المطلوب لمراجعته 📁</h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium max-w-2xl">
            كل موقع عمل إنشائي في شركة بنيان له قاعدة بيانات منفصلة تماماً ومعزولة لحفظ اليوميات والتوريدات وكشوف السولار والمنصرف الأسبوعي مائي وميكانيكي. يرجى اختيار الموقع للدخول وقراءة السجلات.
          </p>
        </div>

        {/* View Mode Toggle (Available ONLY to Program Director - moataz) */}
        {user?.username.toLowerCase() === 'moataz' && (
          <div className="flex gap-2 mb-6 bg-slate-150/80 p-1 rounded-xl self-start relative z-10 font-sans border border-slate-200">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-4 py-2 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-2 ${
                viewMode === 'hierarchy' 
                  ? 'bg-white shadow-sm text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass size={14} />
              <span>مستكشف الهيكل الهرمي والمشاريع (4 مستويات) 🌿</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-2 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building size={14} />
              <span>عرض شبكة المواقع التقليدية</span>
            </button>
          </div>
        )}

        {/* Info or error alerts */}
        {errorMsg && (
          <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-750 text-[11.5px] font-bold rounded-xl max-w-md relative z-10 text-right">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-750 text-[11.5px] font-bold rounded-xl max-w-md relative z-10 text-right">
            {successMsg}
          </div>
        )}

        {/* Create site control block */}
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-3 mb-6 relative z-10">
            {dbConnected === false ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full">
                <AlertTriangle className="text-rose-600 shrink-0 animate-pulse" size={18} />
                <div className="text-right">
                  <p className="font-extrabold text-xs text-rose-700">تم قطع الاتصال بقاعدة البيانات السحابية (أوفلاين)</p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed font-semibold">لتجنب تباين السجلات واختلاف البيانات بين أجهزة المهندسين، تم إيقاف إضافة، تعديل، أو حذف مواقع العمل مؤقتاً لحين استعادة الاتصال السحابي.</p>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingSiteId('');
                    setNewSiteId('site-default');
                    setNewSiteName('');
                    setNewSiteLoc('');
                    setNewSiteDesc('');
                    setNewSiteTenantId(user?.tenantId || (user?.username || '').toLowerCase().trim() || 'moataz');
                    setShowAddSiteModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition cursor-pointer font-sans"
                >
                  <Plus size={16} />
                  تأسيس موقع عمل ومشروع جديد +
                </button>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition cursor-pointer font-sans">
                  <Download className="w-4 h-4 shrink-0" />
                  <span>استعادة نسخة احتياطية لموقع 📥</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const backupDoc = JSON.parse(event.target?.result as string);
                          if (!backupDoc || typeof backupDoc !== 'object') {
                            alert('ملف البيانات غير صالح الاستيراد.');
                            return;
                          }
                          
                          let siteId = backupDoc.siteId || backupDoc.id || '';
                          let siteName = backupDoc.siteName || backupDoc.nameAr || '';
                          let payload = backupDoc.payload || backupDoc;
                          
                          if (!siteId) {
                            const promptedId = window.prompt("لم يتم العثور على معرّف موقع العمل في ملف النسخ الاحتياطي. يرجى إدخال معرّف بالإنجليزية (مثال: cairo-site):");
                            if (!promptedId) return;
                            siteId = promptedId.trim().toLowerCase().replace(/\s+/g, '-');
                          }
                          
                          if (!siteName) {
                            const promptedName = window.prompt("يرجى إدخال اسم موقع العمل المراد الاستعادة إليه:");
                            if (!promptedName) return;
                            siteName = promptedName.trim();
                          }
                          
                          const isConfirmed = window.confirm(`سيتم استيراد نسخة احتياطية ومزامنة كافة سجلات الموقع "${siteName}" (معرّف: ${siteId}) سحابياً.\n\nهل أنت متأكد؟ قد يؤدي هذا للكتابة فوق أي بيانات حالية لهذا الموقع على الخادم.`);
                          if (!isConfirmed) return;
                          
                          setIsLoading(true);
                          
                          // Check if site exists
                          const siteExists = sites.some(s => s.id === siteId);
                          if (!siteExists) {
                            const createRes = await fetch('/api/sites', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: siteId,
                                nameAr: siteName,
                                location: backupDoc.location || 'غير محدد',
                                description: backupDoc.description || 'موقع مستورد من نسخة احتياطية',
                                tenantId: 'moataz'
                              })
                            });
                            if (!createRes.ok) {
                              throw new Error('فشل تسجيل موقع العمل الجديد على السيرفر.');
                            }
                          }
                          
                          // Save target payload
                          const cleanPayload = JSON.parse(JSON.stringify(payload));
                          const saveRes = await fetch(`/api/site/${siteId}/save`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: cleanPayload })
                          });
                          
                          if (!saveRes.ok) {
                            throw new Error('فشل حفظ بيانات الموقع المستورد على السيرفر.');
                          }
                          
                          setSuccessMsg(`تم استيراد بيانات موقع "${siteName}" بنجاح وتحديث النظام!`);
                          await fetchSitesAndAdmins();
                        } catch (err: any) {
                          setErrorMsg('حدث خطأ أثناء استيراد النسخة الاحتياطية: ' + err.message);
                        } finally {
                          setIsLoading(false);
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {/* Sites Grid / Hierarchy Toggle View */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 relative z-10">
            <Loader2 className="animate-spin text-indigo-650" size={36} />
            <p className="text-xs text-slate-500 font-bold font-mono">جاري تأمين وتحميل السجلات الإنشائية من الخادم...</p>
          </div>
        ) : viewMode === 'hierarchy' ? (
          /* Redesigned Premium Organization Hierarchy Explorer (RTL Structure) */
          <div className="w-full relative z-10 space-y-6 font-sans">
            
            {/* Visual Header Indicator */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
                  <Compass size={18} className="animate-spin-slow" />
                </div>
                <div className="text-right">
                  <h3 className="font-black text-slate-900 text-sm md:text-base">مستكشف الهيكل التنظيمي والمشاريع اللامركزي 🌿</h3>
                  <p className="text-[11px] text-slate-500 font-medium">بنية تحكم رباعية الأبعاد لفصل البيانات وإدارة المسؤولين ومطابقة حسابات المعاوضات</p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-650 shrink-0 shadow-inner">
                <span>إجمالي الفروع النشطة: {adminsList.length + 1}</span>
                <span className="text-slate-300">|</span>
                <span>المشاريع: {sites.length}</span>
              </div>
            </div>

            {/* Tree Map Grid Dashboard Redesign */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 bg-gradient-to-b from-white/90 to-slate-50/50 border border-slate-200 rounded-3xl p-6 shadow-md overflow-hidden min-h-[580px]">
              
              {/* LEVEL 1: Program Director (مدير البرنامج) */}
              <div className="space-y-4 border-l border-slate-150/70 pl-4 text-right flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] font-black flex items-center justify-center font-mono">١</span>
                    <span className="text-xs font-black text-slate-900">مدير عام البرنامج</span>
                  </div>
                  <span className="text-[9px] bg-amber-100/75 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">صلاحية مطلقة</span>
                </div>
                
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden group border border-slate-800 flex-1 flex flex-col justify-between">
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-all">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">معتز يونس (moataz)</h4>
                        <span className="text-[9px] text-amber-400 tracking-wide font-black uppercase mt-0.5 block">Program Director</span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
                      مؤسس والمشرف العام لمنظومة بنيان السحابية. يتمتع بكافة التراخيص الفيدرالية والإرساء المركزي، وله الحق المطلق بفحص الذمم المالية والحسابات ومطابقتها.
                    </p>
                    
                    <div className="bg-white/[0.03] border border-white/10 p-3 rounded-xl space-y-2 text-[10px] font-bold text-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">إجمالي مدراء الفروع:</span>
                        <span className="font-mono text-amber-300">{adminsList.length + 1}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">المواقع المعتمدة:</span>
                        <span className="font-mono text-amber-300">{sites.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">حالة الربط السحابي:</span>
                        <span className="font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={10} /> نشط وآمن
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 relative z-10">
                    {user?.username.toLowerCase() === 'moataz' && (
                      <button
                        type="button"
                        onClick={() => {
                          console.log("[DEBUG] Reorg button clicked");
                          setShowReorgControlCenter(true);
                          fetchReorgStatus();
                        }}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-[10.5px] font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-indigo-500/20 active:scale-95"
                      >
                        <span>⚙️ لوحة حوكمة وصيانة البيانات</span>
                      </button>
                    )}
                    
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[9px] text-slate-400 leading-normal font-medium text-right">
                      💡 حدد أيّاً من مدراء النظام بالعمود التالي لفرز مواقعه الخاضعة لرقابته، وتحميل اليوميات ومقايسات BOQ الخاصة بها بالكامل.
                    </div>
                  </div>
                </div>
              </div>

              {/* LEVEL 2: System Admins (مدراء النظام) */}
              <div className="space-y-4 border-l border-slate-150/70 pl-4 text-right flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٢</span>
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
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9.5px] font-black rounded-lg flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer font-sans"
                    >
                      <Plus size={11} />
                      <span>إضافة مسؤول +</span>
                    </button>
                  )}
                </div>

                {/* Search Bar for level 2 Admins */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث عن مدير نظام..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-right font-semibold text-slate-800 placeholder:text-slate-400"
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
                
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[460px] scrollbar-thin">
                  
                  {/* Filter default main root Admin user moataz also behaves as root admin option */}
                  {(() => {
                    const isMoatazVisible = 
                      'معتز يونس'.includes(adminSearchQuery.trim()) ||
                      'moataz'.includes(adminSearchQuery.toLowerCase().trim()) ||
                      'مكتب معتز يونس'.includes(adminSearchQuery.trim()) ||
                      adminSearchQuery.trim() === '';
                    
                    const moatazSitesCount = sites.filter((site: any) => (site.tenantId || 'moataz') === 'moataz').length;

                    const filteredAdminsList = adminsList.filter((adm: any) => 
                      adm.nameAr?.includes(adminSearchQuery.trim()) ||
                      adm.username?.toLowerCase().includes(adminSearchQuery.toLowerCase().trim())
                    );

                    return (
                      <>
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
                            className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all duration-200 active:scale-98 ${
                              selectedAdminUsername === 'moataz'
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black shadow-md ring-1 ring-indigo-500/20'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedAdminUsername === 'moataz' ? 'bg-indigo-650 animate-pulse' : 'bg-slate-350'}`} />
                                <div className="text-right min-w-0">
                                  <h5 className="text-xs font-bold leading-tight text-slate-900 truncate">مكتب معتز يونس الافتراضي</h5>
                                  <p className="text-[10px] text-slate-500 mt-1 font-mono font-bold">moataz • الإدارة المباشرة</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg shrink-0">
                                {moatazSitesCount} مواقع
                              </span>
                            </div>
                          </div>
                        )}

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
                              className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all duration-200 relative group/card active:scale-98 ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black shadow-md ring-1 ring-indigo-500/20'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2 min-w-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-indigo-650 animate-pulse' : 'bg-slate-350'}`} />
                                  <div className="text-right min-w-0">
                                    <h5 className="text-xs font-extrabold leading-tight text-slate-900 truncate">{adm.nameAr}</h5>
                                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{adm.username} • مدير فرعي</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg">
                                    {admSitesCount} مواقع
                                  </span>

                                  {/* Actions for Program Director ONLY */}
                                  {user?.username.toLowerCase() === 'moataz' && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditAdminClick(adm);
                                        }}
                                        className="p-1 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-indigo-100/50 transition cursor-pointer"
                                        title="تعديل الحساب"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAdmin(adm.username);
                                        }}
                                        className="p-1 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                        title="إلغاء الترخيص"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredAdminsList.length === 0 && !isMoatazVisible && (
                          <div className="text-center py-10 text-xs text-slate-400 font-medium leading-relaxed font-sans border border-dashed border-slate-200 rounded-2xl">
                            لا يوجد نتائج متطابقة للبحث.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* LEVEL 3: Sites (مواقع هذا المدير) */}
              <div className="space-y-4 border-l border-slate-150/70 pl-4 text-right flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٣</span>
                    <span className="text-xs font-black text-slate-900">مواقع عمل المسؤول المعتمدة</span>
                  </div>
                  <span className="text-[9.5px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded-lg border font-bold">
                    {sites.filter((s: any) => (s.tenantId || 'moataz') === selectedAdminUsername).length} مسجل
                  </span>
                </div>

                {/* Search Bar for level 3 Sites */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث في مواقع هذا المدير..."
                    value={siteSearchQuery}
                    onChange={(e) => setSiteSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-right font-semibold text-slate-800 placeholder:text-slate-400"
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
                
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[460px] scrollbar-thin">
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
                              className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all duration-200 relative group/site active:scale-98 flex flex-col justify-between min-h-[92px] ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-md ring-1 ring-emerald-500/20'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-center gap-2 min-w-0 text-right">
                                    <Building size={14} className="text-slate-500 group-hover/site:text-emerald-650 transition-colors shrink-0" />
                                    <h5 className="text-xs font-black truncate text-slate-900">{site.nameAr}</h5>
                                  </div>
                                  <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-100/55 text-emerald-900 border border-emerald-250 rounded-lg shrink-0 font-extrabold">
                                    {projectsCount} مشاريع
                                  </span>
                                </div>
                                
                                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                  <MapPin size={11} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{site.location}</span>
                                </p>
                              </div>

                              <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[8px] font-mono font-bold text-slate-400">
                                <span>كود: {site.id}</span>
                                <span className="opacity-0 group-hover/site:opacity-100 text-emerald-650 transition-opacity font-bold">تحديد واستعراض 👁️</span>
                              </div>
                            </div>
                          );
                        })}

                        {filteredHierarchySites.length === 0 && (
                          <div className="text-center py-10 text-xs text-slate-400 font-medium leading-relaxed font-sans border border-dashed border-slate-200 rounded-3xl p-5">
                            <p className="font-extrabold text-slate-500 text-[11px] mb-2">⚠️ لا يوجد مواقع لهذا المدير</p>
                            <p className="text-[9.5px] leading-relaxed">لم يتم العثور على مواقع مطابقة للبحث أو معززة لهذا الحساب.</p>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  setIsEditMode(false);
                                  setNewSiteId('site-default');
                                  setNewSiteName('');
                                  setNewSiteLoc('');
                                  setNewSiteDesc('');
                                  setNewSiteTenantId(selectedAdminUsername);
                                  setShowAddSiteModal(true);
                                }}
                                className="mt-4 text-[10px] font-black bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                              >
                                <span>تأسيس موقع عمل جديد +</span>
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* LEVEL 4: Projects of Selected Site (مشاريع هذا الموقع) */}
              <div className="space-y-4 text-right flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٤</span>
                    <span className="text-xs font-black text-slate-900">المصفوفة المقررة والمشاريع التكميلية</span>
                  </div>
                </div>

                <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 max-h-[520px] scrollbar-thin">
                  {(() => {
                    const activeSite = sites.find(s => s.id === selectedSiteIdForHierarchy);
                    const activeProjects = activeSite?.projects || [];
                    
                    if (!selectedSiteIdForHierarchy) {
                      return (
                        <div className="text-center py-16 text-xs text-slate-400 font-sans leading-relaxed border border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50">
                          <Compass size={28} className="mx-auto text-slate-350 mb-3 animate-pulse" />
                          <p className="font-extrabold text-slate-600 text-[11px]">بانتظار تحديد موقع العمل 🔍</p>
                          <p className="text-[9.5px] mt-1.5 leading-relaxed text-slate-450">يرجى اختيار أحد مواقع العمل المتاحة بالعمود الثالث لعرض خطط المشروع، التكاليف، وإبرام الدفاتر اليومية.</p>
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
                      <div className="space-y-4 flex flex-col h-full">
                        {/* Selected Active Site Header with entering button */}
                        <div className="p-4 bg-gradient-to-br from-emerald-650 to-teal-700 text-white rounded-2xl space-y-3 shadow-md border border-emerald-600">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-black tracking-wide text-emerald-100 bg-white/10 px-2 py-0.5 rounded-md inline-block">الموقع المحدد لإدارة الحسابات</span>
                            <h4 className="text-sm font-black truncate">{activeSite?.nameAr}</h4>
                            <p className="text-[10px] text-emerald-100 flex items-center gap-1 font-medium leading-none mt-1">
                              <MapPin size={10} /> {activeSite?.location}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              if (activeSite) {
                                onSiteSelected(activeSite);
                              }
                            }}
                            className="w-full py-2 bg-white hover:bg-slate-50 text-emerald-950 font-black text-[11px] rounded-xl transition-all duration-200 shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 leading-none"
                          >
                            <span>دخول لوحة السجلات بالكامل 📂</span>
                            <ArrowRight size={13} className="rotate-180" />
                          </button>
                        </div>

                        {/* Search Bar for level 4 Projects */}
                        <div className="relative">
                          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                            <Search size={13} />
                          </span>
                          <input
                            type="text"
                            placeholder="البحث في مشاريع هذا الموقع..."
                            value={projectSearchQuery}
                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-right font-semibold text-slate-800 placeholder:text-slate-400"
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
                        <div className="space-y-3 pb-4">
                          {filteredHierarchyProjects.map((p: any, idx: number) => {
                            const statusLabel = p.status || 'نشط';
                            const statusColor = statusLabel === 'نشط' 
                              ? 'bg-emerald-100/70 text-emerald-900 border-emerald-200' 
                              : statusLabel === 'مكتمل'
                              ? 'bg-indigo-100/70 text-indigo-900 border-indigo-200'
                              : 'bg-amber-100/70 text-amber-900 border-amber-200';

                            return (
                              <div 
                                key={p.id || `proj_${idx}`} 
                                className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-right rounded-2xl space-y-3 relative hover:border-indigo-400 transition-all duration-200 hover:shadow-md"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`inline-block px-2.5 py-0.5 border text-[9px] font-black rounded-lg ${statusColor}`}>
                                    {statusLabel === 'نشط' ? '🟢 نشط' : statusLabel === 'مكتمل' ? '✅ مكتمل' : '⏳ تحت المراجعة'}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">كود: {p.id}</span>
                                </div>

                                <div className="space-y-1 pr-0.5 text-right">
                                  <div className="flex items-center gap-1.5">
                                    <Briefcase size={13} className="text-indigo-650 shrink-0" />
                                    <h6 className="text-[11.5px] font-extrabold text-slate-950 leading-snug">{p.name}</h6>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <p className="text-[9.5px] text-slate-500 font-semibold bg-slate-100 border px-2 py-0.5 rounded-lg flex items-center gap-1">
                                      <span>رقم التكليف:</span>
                                      <span className="font-mono font-black text-slate-800">{p.assignmentNumber || 'غير محدد'}</span>
                                    </p>
                                  </div>
                                  
                                  {p.description && (
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-2 border-r-2 border-slate-200 pr-2">{p.description}</p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-150 grid grid-cols-2 gap-3 text-[9px] font-semibold text-slate-600 font-sans text-right">
                                  <div className="space-y-0.5">
                                    <span className="block text-slate-400 font-bold flex items-center gap-1"><Calendar size={9} /> تاريخ التكليف:</span>
                                    <span className="text-slate-700 font-bold">{p.assignmentDate || 'مستمر'}</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="block text-slate-400 font-bold flex items-center gap-1"><Calendar size={9} /> تاريخ التسليم:</span>
                                    <span className="text-slate-700 font-bold">{p.handoverDate || 'مستمر'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {filteredHierarchyProjects.length === 0 && (
                            <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl leading-relaxed text-right p-5 bg-slate-50/50">
                              <p className="font-extrabold text-slate-500 text-[11px] mb-1">لم يتم العثور على أي مشاريع</p>
                              <p className="text-[9.5px]">يرجى تعديل مصطلحات البحث أو الدخول لموقع العمل لتعيين مشاريع جديدة.</p>
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
          /* Traditional Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {filteredSites.map((site, idx) => (
              <motion.div
                key={site.id || `site_${idx}`}
                whileHover={{ scale: 1.025, y: -4 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSiteSelected(site)}
                className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 p-6 rounded-2xl shadow-md hover:shadow-xl cursor-pointer text-right flex flex-col justify-between min-h-[170px] relative group transition font-sans"
              >
                <div className="absolute top-4 left-4 w-9 h-9 bg-white border border-slate-100 group-hover:border-indigo-200 text-slate-400 group-hover:text-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition">
                  <ArrowRight size={16} className="rotate-180 transition-transform group-hover:-translate-x-1" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm leading-none pr-1 truncate max-w-[180px]">{site.nameAr}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold text-right">
                    <MapPin size={13} className="text-indigo-500 shrink-0" />
                    <span>{site.location}</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 pr-0.5 line-clamp-2 leading-relaxed font-sans">{site.description || 'لم يتم تسجيل وصف معتمد لكفاءة المشروع حالياً.'}</p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center z-10">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">كود: {site.id}</span>
                  {user?.role === 'admin' && (
                    <div className="flex gap-1.5 no-print" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(site);
                        }}
                        className="px-2 py-1 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-amber-700 hover:text-amber-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm font-sans"
                      >
                        <Edit size={11} />
                        تعديل
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(site);
                        }}
                        className="px-2 py-1 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-rose-700 hover:text-rose-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm font-sans"
                      >
                        <Trash2 size={11} />
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredSites.length === 0 && (
              <div className="col-span-full border border-dashed border-slate-200 bg-white/50 backdrop-blur-md rounded-3xl p-12 text-center text-slate-400 animate-pulse">
                <Compass size={40} className="mx-auto mb-4 text-slate-400" />
                <p className="font-bold text-sm text-slate-800">لم يتم العثور على أي مواقع عمل مسجلة</p>
                <p className="text-xs text-slate-500 mt-1">تأكد من صلاحيات الوصول أو تأسيس موقعك الأول.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer credits */}
      <footer className="mt-16 text-center text-[11px] text-slate-400 max-w-6xl w-full mx-auto border-t border-slate-200 pt-5 relative z-10 font-sans font-medium leading-relaxed">
         جميع الحقوق محفوظة لنظام بنيان الذكي لإدارة المشروعات والتكاليف © 2026.
      </footer>

      {/* Create Site Modal overlay */}
      <AnimatePresence>
        {showAddSiteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <FolderPlus size={22} />
                <h3 className="font-extrabold text-base text-slate-900">
                  {isEditMode ? 'تعديل بيانات موقع عمل قيد التشغيل' : 'سجل وحوّل موقع عمل ومشروع جديد'}
                </h3>
              </div>

              <form onSubmit={handleSaveSite} className="space-y-4">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">رمز / كود المشروع (يجب أن يكون بالإنجليزية فقط، مثال: site-01):</label>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    placeholder="مثال: site-cairo-bypass"
                    value={newSiteId}
                    onChange={(e) => setNewSiteId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                    pattern="[a-zA-Z0-9-]+"
                    title="يرجى استخدام الحروف الإنجليزية والأرقام والشرطات فقط."
                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left ${
                      isEditMode ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-800'
                    }`}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">اسم موقع العمل (باللغة العربية):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: موقع كوبري الإسكندرية الدولي"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">المركز والموقع الجغرافي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قطاع العامرية غرب الإسكندرية"
                    value={newSiteLoc}
                    onChange={(e) => setNewSiteLoc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">نبذة تعريفية أو تفاصيل البنود (اختياري):</label>
                  <textarea
                    rows={3}
                    placeholder="مثال: أعمال التشوين والتوريد للسن 65 وأعمال تسوية المقاطع الترابية والبلدورات."
                    value={newSiteDesc}
                    onChange={(e) => setNewSiteDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                {user?.username.toLowerCase() === 'moataz' && (
                  <div className="space-y-1 text-right font-sans">
                    <label className="text-xs font-bold text-slate-700">المدير المسؤول عن هذا الموقع (الطبقة الثانية):</label>
                    <select
                      value={newSiteTenantId}
                      onChange={(e) => setNewSiteTenantId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
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

                <div className="pt-3 flex gap-2 justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingSiteId('');
                      setShowAddSiteModal(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition active:scale-95"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري حفظ التغيرات...' : isEditMode ? 'تعديل وحفظ البيانات' : 'حفظ وإنشاء الموقع'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Admin Modal Overlay (Program Director ONLY) */}
      <AnimatePresence>
        {showAddAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Shield size={20} />
                <h3 className="font-extrabold text-base text-slate-900">
                  {isEditingAdmin ? 'تعديل بيانات مدير النظام' : 'تأسيس وترقية مدير نظام جديد'}
                </h3>
              </div>

              <form onSubmit={handleSaveAdmin} className="space-y-4">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">اسم مستخدم مدير النظام (أحرف إنجليزية وأرقام):</label>
                  <input
                    type="text"
                    required
                    disabled={isEditingAdmin}
                    placeholder="مثال: moataz_admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left ${
                      isEditingAdmin ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-400'
                    }`}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">الاسم الشخصي لمدير النظام (بالعربي):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: المهندس محمد علي"
                    value={adminNameAr}
                    onChange={(e) => setAdminNameAr(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-700">
                    {isEditingAdmin ? 'كلمة المرور الجديدة (اتركه فارغاً لعدم التغيير):' : 'كلمة المرور لمدير النظام الجديد:'}
                  </label>
                  <input
                    type="text"
                    required={!isEditingAdmin}
                    placeholder="مثال: p@ssword123"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>

                <div className="pt-3 flex gap-2 justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAdmin(false);
                      setShowAddAdminModal(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition active:scale-95"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingAdmin ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cloud DB Reorg and Ownership Transfer Control Center (Program Director ONLY) */}
      <AnimatePresence>
        {showReorgControlCenter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl relative font-sans text-right shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowReorgControlCenter(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-6 text-indigo-700 border-b border-slate-100 pb-3">
                <Database size={24} className="animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">أداة إدارة وهيكلة قاعدة البيانات السحابية</h3>
                  <p className="text-[11px] text-slate-500">ميزة سيادية لمدير البرنامج (معتز) لتطهير المخلفات وترتيب ملكيات البنود</p>
                </div>
              </div>

              {isLoadingReorg ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 size={32} className="text-indigo-650 animate-spin" />
                  <p className="text-xs font-bold text-slate-600 animate-pulse">جاري فحص ومواءمة مكونات قاعدة البيانات...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-slate-500 font-sans">إجمالي مستخدمي النظام</h4>
                      <p className="text-xl font-black text-slate-800 mt-1 font-mono">{reorgStatus?.totalUsers ?? '...'}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-slate-500 font-sans">إجمالي مواقع العمل</h4>
                      <p className="text-xl font-black text-slate-800 mt-1 font-mono">{reorgStatus?.totalSites ?? '...'}</p>
                    </div>
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-rose-600 font-sans">حسابات الهيكل القديم</h4>
                      <p className="text-xl font-black text-rose-700 mt-1 font-mono">{reorgStatus?.legacyUsersCount ?? '...'}</p>
                    </div>
                    <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-amber-700 font-sans">مواقع عمل بدون مالك</h4>
                      <p className="text-xl font-black text-amber-700 mt-1 font-mono">{reorgStatus?.orphanedSitesCount ?? '...'}</p>
                    </div>
                  </div>

                  {/* Diagnostic warnings and alerts */}
                  <div className="space-y-3 font-sans">
                    {/* Legacy users found warning */}
                    {reorgStatus?.legacyUsersCount > 0 && (
                      <div className="p-4 bg-rose-500/5 border border-rose-200 rounded-2xl text-right space-y-2">
                        <div className="flex items-center gap-1.5 text-rose-700">
                          <AlertTriangle size={15} />
                          <h4 className="text-xs font-black">تم رصد حسابات قديمة متروكة تشغل مساحة بالبنية!</h4>
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-normal">
                          تعيق هذه السجلات تصفية البيانات بشكل معزول ومحصن لمدراء النظام الجدد. يمكنك مسحها بنقرة واحدة أدناه.
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {reorgStatus?.legacyUsers?.map((u: any, idx: number) => (
                            <span key={u.docId || `${u.username}_${idx}`} className="px-2 py-0.5 bg-rose-100/80 text-rose-700 rounded-md text-[9px] font-mono font-bold border border-rose-250">
                              {u.username} ({u.nameAr})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orphaned sites found warning */}
                    {reorgStatus?.orphanedSitesCount > 0 && (
                      <div className="p-4 bg-amber-500/5 border border-amber-200 rounded-2xl text-right space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle size={15} />
                          <h4 className="text-xs font-black">أعمال ومواقع معلّقة (بدون مدير مسؤول):</h4>
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-normal">
                          مواقع من البنية القديمة لم تُسند إلى حساب أي مدير نظام معتمد. سيقوم معالج الهيكلة بنقلها تلقائياً إلى ملكية حسابك مؤقتاً لتتمكن من إسنادها.
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {reorgStatus?.orphanedSites?.map((s: any, idx: number) => (
                            <span key={s.id || `orphan_site_${idx}`} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[9px] font-bold border border-amber-200/65">
                              {s.nameAr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {reorgStatus?.legacyUsersCount === 0 && reorgStatus?.orphanedSitesCount === 0 && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-200 rounded-2xl text-right">
                        <p className="text-[11px] font-black text-emerald-850">✨ بنية السحابة مطابقة بالكامل ومتوافقة مع المعايير الأمنية الجديدة بنسبة 100%! لا حاجة لإجراء تسوية حالياً.</p>
                      </div>
                    )}
                  </div>

                  {/* Section 1: Quick Cleanup */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2.5 font-sans">
                    <h4 className="text-xs font-extrabold text-slate-800">1. معالجة وتطهير فوري تلقائي</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">المعالجة الشاملة ستحذف حسابات مخلفات الهيكل القديم نهائياً (الحسابات المتروكة)، وتقوم بتعديل كافة حقول الملكية للمواقع والبيانات للتأكد من عدم وجود بيانات تائهة.</p>
                    <button
                      type="button"
                      onClick={handleExecuteReorg}
                      className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                    >
                      🚀 تشغيل معالج إصلاح الهيكلة الشامل لقاعدة البيانات
                    </button>
                  </div>

                  {/* Section 2: Site & Project Ownership Re-assignment Form */}
                  <form onSubmit={handleTransferOwnership} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3 font-sans">
                    <h4 className="text-xs font-extrabold text-slate-800">2. إعادة توزيع ونقل المواقع والمشروعات بين مدراء الطبقة الـ 2</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">اختر أي موقع عمل قيد التشغيل حالياً وانقل تبعيته وملكيته ومقايساته بالكامل بضغطة زر واحدة إلى حساب مدير نظام آخر مع عزلها تاماً عن بقية الفروع والمكاتب:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">موقع العمل المراد نقل تبعيته:</label>
                        <select
                          required
                          value={transferSiteId}
                          onChange={(e) => setTransferSiteId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- اختر موقع العمل من السحابة --</option>
                          {sites.map((s, idx) => (
                            <option key={s.id || `site_opt_${idx}`} value={s.id}>{s.nameAr} ({s.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">المسؤول المستهدف الجديد (المدير):</label>
                        <select
                          required
                          value={transferAdmin}
                          onChange={(e) => setTransferAdmin(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- اختر مدير النظام المستلم --</option>
                          <option value="moataz">المكتب العام الرئيسي (معتز)</option>
                          {adminsList.map((adm, idx) => (
                            <option key={adm.docId || `${adm.username}_${idx}`} value={adm.username.toLowerCase()}>{adm.nameAr} ({adm.username})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-semibold leading-none">⚠️ نقل الملكية يغير صلاحية دخول المشرفين بشكل فوري.</span>
                      <button
                        type="submit"
                        disabled={isTransferring}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        {isTransferring ? 'جاري نقل الملكية...' : 'تأكيد نقل وصلاحية الموقع 🔄'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
