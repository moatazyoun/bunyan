import React, { useState, useEffect } from 'react';
import { Building, MapPin, Plus, ArrowRight, Loader2, Sparkles, FolderPlus, Compass, Edit, Trash2, Wifi, WifiOff, Database, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BunyanLogo from './BunyanLogo';

interface Site {
  id: string;
  nameAr: string;
  location: string;
  description: string;
}

interface SiteSelectionScreenProps {
  user: { username: string; nameAr: string; role: string; assignedProjects?: string[] } | null;
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

  // Form State
  const [newSiteId, setNewSiteId] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLoc, setNewSiteLoc] = useState('');
  const [newSiteDesc, setNewSiteDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState('');

  const fetchSites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      if (response.ok) {
        setSites(data);
      } else {
        throw new Error(data.error || 'فشل جلب مواقع العمل الإنزلاقية.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في جلب مواقع العمل.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteId.trim() || !newSiteName.trim() || !newSiteLoc.trim()) {
      alert('فضلاً، يرجى ملء كافة الحقول الأساسية.');
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
          description: newSiteDesc.trim()
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
      setIsEditMode(false);
      setEditingSiteId('');
      setShowAddSiteModal(false);
      await fetchSites();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الاتصال بالخادم لحفظ الموقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (site: Site) => {
    if (dbConnected === false) {
      alert('عذراً، تم تعطيل تعديل السجلات مؤقتاً لعدم وجود اتصال نشط بقاعدة البيانات السحابية.');
      return;
    }
    setIsEditMode(true);
    setEditingSiteId(site.id);
    setNewSiteId(site.id);
    setNewSiteName(site.nameAr);
    setNewSiteLoc(site.location);
    setNewSiteDesc(site.description || '');
    setShowAddSiteModal(true);
  };

  const handleDeleteClick = async (site: Site) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف موقع العمل "${site.nameAr}" نهائياً؟ سيتم مسح كافة سجلاته بالكامل وبشكل غير قابل للاسترجاع.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل حذف موقع العمل.');
      }
      await fetchSites();
    } catch (err: any) {
      console.error('Delete error', err);
      alert(err.message || 'حدث خطأ أثناء الاتصال بالخادم لحذف الموقع.');
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
            <p className="text-xs font-bold text-slate-800">مرحباً بك، {user?.nameAr}</p>
            <span className="text-[9.5px] font-bold text-indigo-600">
              {user?.role === 'admin' ? 'المدير المالي العام (أدمن)' : 'مخوّل لاستعراض قواعد البيانات'}
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
        
        <div className="mb-8 space-y-2 relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">اختر موقع العمل المطلوب لمراجعته 📁</h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium max-w-2xl">
            كل موقع عمل إنشائي في شركة بنيان له قاعدة بيانات منفصلة تماماً ومعزولة لحفظ اليوميات والتوريدات وكشوف السولار والمنصرف الأسبوعي مائي وميكانيكي. يرجى اختيار الموقع للدخول وقراءة السجلات.
          </p>
        </div>

        {/* Info or error alerts */}
        {errorMsg && (
          <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-750 text-xs font-bold rounded-xl max-w-md relative z-10">
            {errorMsg}
          </div>
        )}

        {/* Create site control block */}
        <div className="flex justify-start mb-6 relative z-10">
          {dbConnected === false ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full">
              <AlertTriangle className="text-rose-600 shrink-0 animate-pulse" size={18} />
              <div className="text-right">
                <p className="font-extrabold text-xs text-rose-700">تم قطع الاتصال بقاعدة البيانات السحابية (أوفلاين)</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed font-semibold">لتجنب تباين السجلات واختلاف البيانات بين أجهزة المهندسين، تم إيقاف إضافة، تعديل، أو حذف مواقع العمل مؤقتاً لحين استعادة الاتصال السحابي.</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingSiteId('');
                setNewSiteId('site-default');
                setNewSiteName('');
                setNewSiteLoc('');
                setNewSiteDesc('');
                setShowAddSiteModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus size={16} />
              تأسيس موقع عمل ومشروع جديد +
            </button>
          )}
        </div>

        {/* Sites grid output */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 relative z-10">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
            <p className="text-xs text-slate-500 font-bold font-mono">جاري تأمين وتحميل السجلات الإنشائية من الخادم...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {filteredSites.map((site) => (
              <motion.div
                key={site.id}
                whileHover={{ scale: 1.025, y: -4 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSiteSelected(site)}
                className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 p-6 rounded-2xl shadow-md hover:shadow-xl cursor-pointer text-right flex flex-col justify-between min-h-[170px] relative group transition"
              >
                <div className="absolute top-4 left-4 w-9 h-9 bg-white border border-slate-100 group-hover:border-indigo-200 text-slate-400 group-hover:text-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition">
                  <ArrowRight size={16} className="rotate-180 transition-transform group-hover:-translate-x-1" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm leading-none pr-1 truncate max-w-[180px]">{site.nameAr}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <MapPin size={13} className="text-indigo-500 shrink-0" />
                    <span>{site.location}</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 pr-0.5 line-clamp-2 leading-relaxed font-sans">{site.description || 'لم يتم تسجيل وصف معتمد لكفاءة المشروع حالياً.'}</p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center z-10">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">كود: {site.id}</span>
                  <div className="flex gap-1.5 no-print" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(site);
                      }}
                      className="px-2 py-1 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-amber-700 hover:text-amber-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Edit size={11} />
                      تعديل
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(site);
                      }}
                      className="px-2 py-1 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-rose-700 hover:text-rose-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Trash2 size={11} />
                      حذف
                    </button>
                  </div>
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
    </div>
  );
}
