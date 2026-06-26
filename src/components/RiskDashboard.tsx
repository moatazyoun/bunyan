import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Plus, Trash2, Filter, Search, Info, ShieldAlert,
  Activity, Check, X, Shield, RefreshCw, BarChart2
} from 'lucide-react';
import { RiskItem, Project, SiteWorker } from '../types';

interface RiskDashboardProps {
  risks: RiskItem[];
  setRisks: React.Dispatch<React.SetStateAction<RiskItem[]>>;
  projects: Project[];
  workers?: SiteWorker[];
  addAuditLog?: (action: string, module: string, details: string) => void;
  userRole?: string;
}

export default function RiskDashboard({
  risks,
  setRisks,
  projects,
  workers = [],
  addAuditLog,
  userRole
}: RiskDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [newType, setNewType] = useState('');
  const [newCategory, setNewCategory] = useState<RiskItem['category']>('technical');
  const [newProbability, setNewProbability] = useState<RiskItem['probability']>('medium');
  const [newImpact, setNewImpact] = useState<RiskItem['impact']>('medium');
  const [newPreventiveAction, setNewPreventiveAction] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [isManualOwner, setIsManualOwner] = useState(() => !workers || workers.length === 0);
  const [newProjectId, setNewProjectId] = useState('all');

  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim() || !newPreventiveAction.trim() || !newOwner.trim()) {
      alert('الرجاء تعبئة كافة الحقول الإلزامية');
      return;
    }

    const newRisk: RiskItem = {
      id: 'risk-' + Date.now(),
      type: newType.trim(),
      category: newCategory,
      probability: newProbability,
      impact: newImpact,
      preventiveAction: newPreventiveAction.trim(),
      owner: newOwner.trim(),
      status: 'active',
      projectId: newProjectId
    };

    setRisks(prev => [newRisk, ...prev]);
    
    if (addAuditLog) {
      addAuditLog('إضافة خطر مخصص', 'إدارة المخاطر', `تم إدراج خطر جديد: ${newRisk.type}`);
    }

    // Reset Form
    setNewType('');
    setNewCategory('technical');
    setNewProbability('medium');
    setNewImpact('medium');
    setNewPreventiveAction('');
    setNewOwner('');
    setNewProjectId('all');
    setShowAddModal(false);
  };

  const handleDeleteRisk = (id: string) => {
    if (userRole === 'viewer') {
      alert('عذراً، لا تملك الصلاحية لحذف السجلات.');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا الخطر من السجل نهائياً؟')) {
      const target = risks.find(r => r.id === id);
      setRisks(prev => prev.filter(r => r.id !== id));
      if (addAuditLog && target) {
        addAuditLog('حذف سجل خطر', 'إدارة المخاطر', `تم إزالة سجل الخطر: ${target.type}`);
      }
    }
  };

  const toggleRiskStatus = (id: string) => {
    if (userRole === 'viewer') return;
    setRisks(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus: RiskItem['status'] = 
          r.status === 'active' ? 'mitigated' : 
          r.status === 'mitigated' ? 'monitoring' : 'active';
        
        if (addAuditLog) {
          addAuditLog('تحديث حالة خطر', 'إدارة المخاطر', `تعديل حالة الخطر "${r.type}" إلى: ${nextStatus}`);
        }
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      const matchesSearch = r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.preventiveAction.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesProject = projectFilter === 'all' || r.projectId === projectFilter;
      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [risks, searchTerm, categoryFilter, projectFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = risks.length;
    const active = risks.filter(r => r.status === 'active').length;
    const mitigated = risks.filter(r => r.status === 'mitigated').length;
    const monitoring = risks.filter(r => r.status === 'monitoring').length;
    const controlRate = total ? Math.round((mitigated / total) * 100) : 0;
    return { total, active, mitigated, monitoring, controlRate };
  }, [risks]);

  return (
    <div className="space-y-6" dir="rtl" id="risk-management-module">
      {/* Header */}
      <header className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 h-1 bg-gradient-to-l from-amber-500 via-orange-500 to-rose-600 w-full" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-rose-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة المخاطر وحوكمة المواقع</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">رصد وحوكمة المخاطر التشغيلية والمالية والهندسية طبقاً للمعيار العالمي ISO 31000</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-md"
        >
          <Plus size={16} />
          <span>إضافة سجل خطر جديد</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-400 font-bold">إجمالي المخاطر المرصودة</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
            <Activity size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-red-500 font-bold">مخاطر نشطة قيد الدراسة</p>
            <h3 className="text-2xl font-black text-red-600 mt-1 font-mono">{stats.active}</h3>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <ShieldAlert size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-emerald-500 font-bold">مخاطر تم الحد منها والتحكم بها</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">{stats.mitigated}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Check size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-indigo-500 font-bold">معدل كفاءة التحكم والمجابهة</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1 font-mono">{stats.controlRate}%</h3>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Shield size={18} />
          </div>
        </div>
      </div>

      {/* 3x3 Heatmap */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-md font-black text-slate-800 mb-2">مصفوفة تقييم الأثر والاحتمالية (Risk Matrix 3x3)</h3>
        <p className="text-xs text-slate-500 mb-6">توزيع المخاطر بيانياً وفق شدة تأثيرها ومعدل تكرارها المتوقع لتسهيل إدارة الأولويات الفورية.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center">
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm text-center font-bold font-mono text-xs">
              <div className="text-slate-400 flex items-center justify-center text-[10px]">أثر \ احتمال</div>
              <div className="text-slate-400 text-[10px]">منخفض</div>
              <div className="text-slate-400 text-[10px]">متوسط</div>
              <div className="text-slate-400 text-[10px]">مرتفع</div>

              {/* High Row */}
              <div className="text-slate-400 flex items-center justify-end text-[10px]">مرتفع</div>
              <div className="bg-amber-100 text-amber-800 p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                <span>متوسط</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'low' && r.impact === 'high').length})</span>
              </div>
              <div className="bg-orange-100 text-orange-800 p-3.5 rounded-xl border border-orange-200 flex flex-col justify-between animate-pulse">
                <span>مرتفع</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'medium' && r.impact === 'high').length})</span>
              </div>
              <div className="bg-red-100 text-red-800 p-3.5 rounded-xl border border-red-200 flex flex-col justify-between font-black">
                <span>حرج</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'high' && r.impact === 'high').length})</span>
              </div>

              {/* Medium Row */}
              <div className="text-slate-400 flex items-center justify-end text-[10px]">متوسط</div>
              <div className="bg-green-100 text-green-800 p-3.5 rounded-xl border border-green-200 flex flex-col justify-between">
                <span>منخفض</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'low' && r.impact === 'medium').length})</span>
              </div>
              <div className="bg-amber-100 text-amber-800 p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                <span>متوسط</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'medium' && r.impact === 'medium').length})</span>
              </div>
              <div className="bg-orange-100 text-orange-800 p-3.5 rounded-xl border border-orange-200 flex flex-col justify-between">
                <span>مرتفع</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'high' && r.impact === 'medium').length})</span>
              </div>

              {/* Low Row */}
              <div className="text-slate-400 flex items-center justify-end text-[10px]">منخفض</div>
              <div className="bg-green-100 text-green-800 p-3.5 rounded-xl border border-green-200 flex flex-col justify-between">
                <span>منخفض</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'low' && r.impact === 'low').length})</span>
              </div>
              <div className="bg-green-100 text-green-800 p-3.5 rounded-xl border border-green-200 flex flex-col justify-between">
                <span>منخفض</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'medium' && r.impact === 'low').length})</span>
              </div>
              <div className="bg-amber-100 text-amber-800 p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                <span>متوسط</span>
                <span className="text-[10px] font-black font-sans mt-1">({filteredRisks.filter(r => r.probability === 'high' && r.impact === 'low').length})</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 text-right">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">آلية التوزيع والحوكمة</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تقوم إدارة المشاريع والتحكم بحساب معامل مستوى الخطورة الإجمالي بضرب درجة الاحتمالية في درجة الأثر المتوقعة. 
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs">
                <span className="font-black text-rose-700 block">منطقة حرجة</span>
                <span className="text-[10px] text-slate-500 mt-1 block">تتطلب تجميد العمل الفوري والتدخل الاستباقي العاجل لإزالة مسبباتها.</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs">
                <span className="font-black text-amber-700 block">منطقة متوسطة</span>
                <span className="text-[10px] text-slate-500 mt-1 block">يتم تفويض مهندسي السلامة لوضع خطة وقائية ومراقبتها دورياً.</span>
              </div>
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs">
                <span className="font-black text-green-700 block">منطقة آمنة</span>
                <span className="text-[10px] text-slate-500 mt-1 block">تُقبل المخاطر مع رصدها المعتاد ضمن جداول تسليم الأعمال اليومية.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xs">
        <div className="relative w-full sm:max-w-xs">
          <input 
            type="text" 
            placeholder="بحث ببيان الخطر أو الإجراء الوقائي..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
          />
          <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          >
            <option value="all">كافة تصنيفات المخاطر</option>
            <option value="technical">مخاطر هندسية وفنية</option>
            <option value="financial">مخاطر مالية وتمويلية</option>
            <option value="supply">مخاطر التوريد والمشتريات</option>
            <option value="safety">مخاطر السلامة والصحة</option>
            <option value="environmental">مخاطر بيئية</option>
          </select>

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          >
            <option value="all">كافة المشروعات</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">سجل حوكمة المخاطر الفعلي للشركة</h4>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-black">عدد السجلات: {filteredRisks.length}</span>
        </div>

        {filteredRisks.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
              <Shield size={32} />
            </div>
            <p className="text-sm font-black text-slate-800">سجل المخاطر خالٍ تماماً</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              لا توجد مخاطر مسجلة حالياً تطابق معايير البحث. اضغط على زر "إضافة سجل خطر جديد" لتسجيل مخاطر الموقع لربطها بقاعدة البيانات السحابية.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-black border-b border-slate-100">
                  <th className="p-4">بيان الخطر وتفاصيله</th>
                  <th className="p-4 text-center">التصنيف</th>
                  <th className="p-4 text-center">الاحتمالية</th>
                  <th className="p-4 text-center">الأثر المتوقع</th>
                  <th className="p-4">الخطة والإجراء الاستجابي</th>
                  <th className="p-4">المسؤول بالموقع</th>
                  <th className="p-4 text-center">حالة المجابهة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredRisks.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-slate-900 max-w-xs font-black leading-relaxed">{r.type}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] text-slate-600">
                        {r.category === 'technical' ? 'هندسي' :
                         r.category === 'financial' ? 'مالي' :
                         r.category === 'supply' ? 'سلاسل توريد' :
                         r.category === 'safety' ? 'سلامة وصحة' : 'بيئي'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block ${
                        r.probability === 'high' ? 'bg-rose-100 text-rose-800' :
                        r.probability === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.probability === 'high' ? 'مرتفع' : r.probability === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block ${
                        r.impact === 'high' ? 'bg-rose-100 text-rose-800' :
                        r.impact === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.impact === 'high' ? 'مرتفع' : r.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium max-w-xs leading-relaxed text-justify">{r.preventiveAction}</td>
                    <td className="p-4 text-indigo-950 font-black">{r.owner}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleRiskStatus(r.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black border transition ${
                          r.status === 'active' ? 'bg-red-50 text-red-600 border-red-200' :
                          r.status === 'mitigated' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'
                        }`}
                        title="انقر لتغيير الحالة دورياً"
                      >
                        {r.status === 'active' ? 'نشط وغير معالج' : r.status === 'mitigated' ? 'تم الحد والمجابهة' : 'تحت المراقبة المستمرة'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteRisk(r.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[95vh] overflow-hidden text-right">
            
            {/* Sidebar Panel - Premium dark theme */}
            <div className="hidden md:flex md:w-64 bg-slate-950 p-8 flex-col justify-between border-l border-slate-800 text-right">
              <div>
                <div className="h-12 w-12 bg-rose-950/50 rounded-2xl flex items-center justify-center border border-rose-900 mb-6 animate-pulse">
                  <ShieldAlert className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-black mb-2 text-white leading-snug">رصد وإدارة المخاطر</h3>
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">
                  نظام استباقي لتسجيل المخاطر الهندسية والمالية، وإصدار خطط الاستجابة والمجابهة الميدانية لضمان استمرارية الأعمال.
                </p>
              </div>
              <div className="space-y-4 pt-6 border-t border-slate-800 text-[10px] font-black text-slate-500">
                <div className="flex items-center gap-2 border-r-2 border-rose-500 pr-2 text-rose-400">توصيف وتحليل الخطر</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">خطة المجابهة الميدانية</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">التوثيق وتعيين المسؤول</div>
              </div>
            </div>

            {/* Main Content Form Panel */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 flex-shrink-0">
                <h3 className="text-base font-black text-white">إضافة خطر مخصص وتحديد خطة الاستجابة</h3>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-950/40">
                <form id="add-risk-form" onSubmit={handleAddRisk} className="space-y-6">
                  
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">وصف الخطر المحتمل فُنياً أو مالياً *</label>
                    <textarea 
                      required
                      rows={2}
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      placeholder="مثال: ظهور مياه جوفية على منسوب غير متوقع..."
                      className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-bold text-white outline-none text-right"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">تصنيف الخطر *</label>
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value as any)}
                        className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                      >
                        <option value="technical" className="bg-slate-900">مخاطر هندسية وفنية</option>
                        <option value="financial" className="bg-slate-900">مخاطر مالية وتمويلية</option>
                        <option value="supply" className="bg-slate-900">مخاطر سلاسل التوريد</option>
                        <option value="safety" className="bg-slate-900">مخاطر السلامة والصحة</option>
                        <option value="environmental" className="bg-slate-900">مخاطر بيئية</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">الاحتمالية المتوقعة *</label>
                      <select
                        value={newProbability}
                        onChange={e => setNewProbability(e.target.value as any)}
                        className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white focus:ring-2 focus:ring-rose-500 outline-none text-right"
                      >
                        <option value="low" className="bg-slate-900">منخفضة</option>
                        <option value="medium" className="bg-slate-900">متوسطة</option>
                        <option value="high" className="bg-slate-900">مرتفعة للغاية</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">الأثر على المشروع *</label>
                      <select
                        value={newImpact}
                        onChange={e => setNewImpact(e.target.value as any)}
                        className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white focus:ring-2 focus:ring-rose-500 outline-none text-right"
                      >
                        <option value="low" className="bg-slate-900">منخفض الأثر</option>
                        <option value="medium" className="bg-slate-900">متوسط الأثر</option>
                        <option value="high" className="bg-slate-900">مرتفع / حرج للغاية</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">خطة الاستجابة والإجراء الوقائي المقترح *</label>
                    <textarea 
                      required
                      rows={2}
                      value={newPreventiveAction}
                      onChange={e => setNewPreventiveAction(e.target.value)}
                      placeholder="مثال: تركيب نظام نزح استباقي مع طلمبات ديزل احتياطية..."
                      className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-bold text-white outline-none text-right"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mr-1 mb-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">المسؤول عن المجابهة والمراقبة *</label>
                        {workers && workers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualOwner(!isManualOwner);
                              setNewOwner('');
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black flex items-center gap-1 transition animate-fade-in"
                          >
                            {isManualOwner ? '← اختيار من طاقم العمل' : '← إدخال يدوي'}
                          </button>
                        )}
                      </div>
                      {!isManualOwner && workers && workers.length > 0 ? (
                        <select 
                          required
                          value={newOwner}
                          onChange={e => setNewOwner(e.target.value)}
                          className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none text-right"
                        >
                          <option value="" className="bg-slate-900">اختر المسؤول من طاقم العمل...</option>
                          {workers.map(worker => (
                            <option key={worker.id} value={`${worker.name} (${worker.jobTitle})`} className="bg-slate-900">
                              {worker.name} - {worker.jobTitle}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          required
                          type="text"
                          value={newOwner}
                          onChange={e => setNewOwner(e.target.value)}
                          placeholder="مثال: م/ مدير التنفيذ والموقع"
                          className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none text-right"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">ارتباط المشروع المباشر</label>
                      <select
                        value={newProjectId}
                        onChange={e => setNewProjectId(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                      >
                        <option value="all" className="bg-slate-900">كافة مشروعات الموقع</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer Action Bar */}
              <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-4 bg-slate-900 flex-shrink-0 flex-row-reverse">
                <button
                  type="submit"
                  form="add-risk-form"
                  className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-lg active:scale-95"
                >
                  حفظ وتسجيل بقاعدة البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black border border-slate-700 transition cursor-pointer"
                >
                  إلغاء التراجع
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
