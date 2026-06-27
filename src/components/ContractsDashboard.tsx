import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit, Scroll, FileText, CheckCircle, Clock, AlertTriangle, Search, Filter, 
  Briefcase, Users, User, Landmark, Tag, Calendar, ShieldAlert, ArrowLeftRight, HelpCircle, Info
} from 'lucide-react';
import { Contract, Project, ContractCategory, Subcontractor, SiteWorker } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface ContractsDashboardProps {
  contracts: Contract[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  projects: Project[];
  subcontractors: Subcontractor[];
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
  suppliers: any[]; 
  workers: SiteWorker[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
}

export default function ContractsDashboard({ 
  contracts, 
  setContracts,
  projects,
  subcontractors,
  setSubcontractors,
  suppliers,
  workers,
  userRole,
  addAuditLog
}: ContractsDashboardProps) {

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<ContractCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI states for the form
  const [isManualCounterparty, setIsManualCounterparty] = useState(false);
  const [manualNameInput, setManualNameInput] = useState('');

  const [formData, setFormData] = useState<Omit<Contract, 'id'>>({
    contractNumber: '',
    date: new Date().toISOString().split('T')[0],
    counterparty: '',
    category: 'project',
    value: 0,
    durationMonths: 12,
    status: 'active',
    projectId: '',
    scope: '',
    specifications: '',
    paymentTerms: '',
    attachments: []
  });

  const handleCategoryChange = (cat: ContractCategory) => {
    setIsManualCounterparty(false);
    setManualNameInput('');
    setFormData(prev => ({
      ...prev,
      category: cat,
      counterparty: ''
    }));
  };

  const handleCounterpartySelect = (val: string) => {
    if (val === '__custom__') {
      setIsManualCounterparty(true);
      setFormData(prev => ({ ...prev, counterparty: '' }));
    } else {
      setIsManualCounterparty(false);
      setFormData(prev => ({ ...prev, counterparty: val }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;

    const finalCounterparty = isManualCounterparty ? manualNameInput.trim() : formData.counterparty;
    
    if (!formData.contractNumber.trim()) {
      alert('الرجاء إدخال رقم العقد');
      return;
    }
    if (!finalCounterparty) {
      alert('الرجاء تحديد أو إدخال اسم طرف التعاقد');
      return;
    }
    if (!formData.projectId) {
      alert('الرجاء اختيار المشروع المرتبط بالعقد');
      return;
    }

    const submissionData = {
      ...formData,
      counterparty: finalCounterparty
    };

    // Auto-add if new subcontractor
    if (submissionData.category === 'subcontractor') {
        const exists = subcontractors.some(s => s.name.trim() === finalCounterparty);
        if (!exists) {
            const newSub: Subcontractor = {
                id: `sub-${Date.now()}`,
                name: finalCounterparty,
                trade: formData.scope || 'مقاول باطن مسجل من العقود',
                workVolume: 0,
                unitPrice: 0,
                totalValue: formData.value,
                paidOffice: 0,
                paidCustody: 0,
                paperSettlements: 0,
                remaining: formData.value,
                notes: `تم الإدراج تلقائياً من العقد رقم ${formData.contractNumber}`,
                phone: '',
                contractNumber: formData.contractNumber,
                workItems: []
            };
            setSubcontractors(prev => [...prev, newSub]);
            addAuditLog('إضافة مقاول', 'إدارة المقاولين', `تم إضافة المقاول تلقائياً من العقد: ${finalCounterparty}`);
        }
    }

    if (editingId) {
      setContracts(prev => prev.map(c => c.id === editingId ? { ...submissionData, id: editingId } : c));
      addAuditLog('تعديل عقد', 'إدارة العقود', `تم تعديل العقد رقم: ${submissionData.contractNumber}`);
    } else {
      const newContract: Contract = { ...submissionData, id: `con-${Date.now()}` };
      setContracts(prev => [...prev, newContract]);
      addAuditLog('إضافة عقد', 'إدارة العقود', `تم إضافة العقد الجديد رقم: ${submissionData.contractNumber}`);
    }
    
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setIsManualCounterparty(false);
    setManualNameInput('');
    setFormData({
        contractNumber: '',
        date: new Date().toISOString().split('T')[0],
        counterparty: '',
        category: 'project',
        value: 0,
        durationMonths: 12,
        status: 'active',
        projectId: '',
        scope: '',
        specifications: '',
        paymentTerms: '',
        attachments: []
    });
  };

  const startEdit = (c: Contract) => {
    setEditingId(c.id);
    
    // Check if counterpart is in our predefined lists
    const predefinedNames = [
      ...subcontractors.map(s => s.name), 
      ...suppliers.map(s => s.name), 
      ...workers.map(w => w.name)
    ];
    const isPredefined = predefinedNames.includes(c.counterparty);
    
    if (c.category !== 'other' && !isPredefined && c.counterparty) {
      setIsManualCounterparty(true);
      setManualNameInput(c.counterparty);
    } else {
      setIsManualCounterparty(false);
      setManualNameInput('');
    }

    setFormData({
      contractNumber: c.contractNumber,
      date: c.date,
      counterparty: c.counterparty,
      category: c.category,
      value: c.value,
      durationMonths: c.durationMonths,
      status: c.status,
      projectId: c.projectId || '',
      scope: c.scope || '',
      specifications: c.specifications || '',
      paymentTerms: c.paymentTerms || '',
      attachments: c.attachments || []
    });
    setShowModal(true);
  };

  const deleteContract = (id: string) => {
    if (userRole === 'viewer') return;
    if (confirmWithRandomCode('هل أنت متأكد من حذف هذا العقد نهائياً؟')) {
      setContracts(prev => prev.filter(c => c.id !== id));
      addAuditLog('حذف عقد', 'إدارة العقود', `تم حذف العقد ذو الرقم المرجعي: ${id}`);
    }
  };

  const currentPredefinedList = useMemo(() => {
      switch(formData.category) {
          case 'subcontractor': return subcontractors.map(s => s.name);
          case 'supplier': return suppliers.map(s => s.name);
          case 'employee': return workers.map(w => w.name);
          default: return [];
      }
  }, [formData.category, subcontractors, suppliers, workers]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesCategory = activeCategoryFilter === 'all' || c.category === activeCategoryFilter;
      const matchesSearch = c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.scope && c.scope.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [contracts, activeCategoryFilter, searchQuery]);

  // Metric Stats
  const stats = useMemo(() => {
    const total = contracts.reduce((sum, c) => sum + c.value, 0);
    const active = contracts.filter(c => c.status === 'active').length;
    const completed = contracts.filter(c => c.status === 'completed').length;
    const valueByCat = (cat: ContractCategory) => contracts.filter(c => c.category === cat).reduce((sum, c) => sum + c.value, 0);

    return {
      totalValue: total,
      activeCount: active,
      completedCount: completed,
      subcontractorValue: valueByCat('subcontractor'),
      supplierValue: valueByCat('supplier'),
      employeeValue: valueByCat('employee')
    };
  }, [contracts]);

  return (
    <div className="space-y-6" dir="rtl">
        {/* Upper Banner Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-1 bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-500 w-full" />
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-md text-white">
                    <Scroll size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">منصة إدارة العقود والتعاقدات</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">نظام موحد لتتبع عقود المشروعات، الموظفين، مقاولي الباطن، والموردين</p>
                </div>
            </div>
            
            <button 
                onClick={() => { if (userRole !== 'viewer') { resetForm(); setShowModal(true); } else { alert('غير مسموح لك بإضافة عقود'); } }}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center gap-2.5 transition-all shadow-md hover:shadow-lg hover:scale-[1.01]"
            >
                <Plus size={20} />
                <span>تسجيل مستند تعاقد جديد</span>
            </button>
        </header>

        {/* High-Fidelity Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">إجمالي ميزانية العقود</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2">{(stats.totalValue).toLocaleString('ar-EG')} <span className="text-xs text-slate-500">ج.م</span></h3>
              </div>
              <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Landmark size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>إجمالي العقود النشطة والمكتملة</span>
              <span className="font-mono text-indigo-600 font-bold">{contracts.length} عقود</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">الالتزام بمقاولي الباطن</p>
                <h3 className="text-2xl font-black text-amber-600 mt-2">{(stats.subcontractorValue).toLocaleString('ar-EG')} <span className="text-xs text-slate-500">ج.م</span></h3>
              </div>
              <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>نسبة من الميزانية الكلية</span>
              <span className="font-bold text-amber-600">
                {stats.totalValue ? Math.round((stats.subcontractorValue / stats.totalValue) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">إلتزامات التوريدات والموردين</p>
                <h3 className="text-2xl font-black text-purple-600 mt-2">{(stats.supplierValue).toLocaleString('ar-EG')} <span className="text-xs text-slate-500">ج.م</span></h3>
              </div>
              <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Tag size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>موردين مسجلين في النظام</span>
              <span className="font-bold text-purple-600">{suppliers.length} موردين</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">معدل العقود السارية</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-2">{stats.activeCount} <span className="text-xs text-slate-500">نشط</span></h3>
              </div>
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>معدل الإنجاز والإتمام</span>
              <span className="font-bold text-emerald-600">
                {contracts.length ? Math.round((stats.completedCount / contracts.length) * 100) : 0}% مكتمل
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Filter Layout */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
            {[
              { id: 'all', label: 'كافة العقود' },
              { id: 'project', label: 'عقود المشروعات' },
              { id: 'subcontractor', label: 'مقاولين الباطن' },
              { id: 'supplier', label: 'التوريدات والموردين' },
              { id: 'employee', label: 'شؤون الموظفين' },
              { id: 'other', label: 'عقود أخرى متنوعة' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveCategoryFilter(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeCategoryFilter === tab.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <input 
              type="text" 
              placeholder="ابحث برقم العقد، اسم الطرف الثاني..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          </div>
        </div>

        {/* Logical Dashboard Content List */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            {filteredContracts.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <Scroll size={36} className="stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-black text-slate-700 text-base">لا توجد سجلات مطابقة للبحث</p>
                  <p className="text-xs text-slate-400 mt-1">الرجاء تعديل الفئات النشطة أو تسجيل عقد جديد للبدء</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[900px]">
                    <thead>
                        <tr className="text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-100 bg-slate-50/70">
                            <th className="p-4.5">رقم التعاقد</th>
                            <th className="p-4.5">التصنيف</th>
                            <th className="p-4.5">الطرف الثاني</th>
                            <th className="p-4.5">المشروع المرتبط</th>
                            <th className="p-4.5">تاريخ الإبرام</th>
                            <th className="p-4.5">قيمة التعاقد</th>
                            <th className="p-4.5 text-center">المدة</th>
                            <th className="p-4.5">حالة المستند</th>
                            <th className="p-4.5 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                        {filteredContracts.map(c => {
                            const linkedProj = projects.find(p => p.id === c.projectId);
                            return (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition duration-150">
                                    <td className="p-4.5 font-mono text-indigo-950 font-black text-sm">{c.contractNumber}</td>
                                    <td className="p-4.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/60 border border-slate-200/50 rounded-xl text-[11px]">
                                            {c.category === 'project' && <Briefcase size={12} className="text-sky-600" />}
                                            {c.category === 'employee' && <User size={12} className="text-emerald-600" />}
                                            {c.category === 'subcontractor' && <Users size={12} className="text-amber-600" />}
                                            {c.category === 'supplier' && <Tag size={12} className="text-purple-600" />}
                                            {c.category === 'other' && <Scroll size={12} className="text-slate-600" />}
                                            <span>
                                              {c.category === 'project' ? 'مشروع' : 
                                               c.category === 'employee' ? 'موظف' : 
                                               c.category === 'subcontractor' ? 'مقاول باطن' : 
                                               c.category === 'supplier' ? 'مورد' : 'أخرى'}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="p-4.5 text-slate-900 font-black text-[13px]">{c.counterparty}</td>
                                    <td className="p-4.5 text-slate-600 font-semibold">{linkedProj?.name || '---'}</td>
                                    <td className="p-4.5 text-slate-500 font-medium font-mono">{c.date}</td>
                                    <td className="p-4.5 font-mono text-indigo-700 font-extrabold text-[13px]">
                                      {(c.value).toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="p-4.5 text-slate-600 text-center font-bold">{c.durationMonths} شهر</td>
                                    <td className="p-4.5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block ${
                                            c.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/40' :
                                            c.status === 'completed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/40' :
                                            'bg-rose-100 text-rose-800 border border-rose-200/40'
                                        }`}>
                                            {c.status === 'active' ? 'ساري العمل' : c.status === 'completed' ? 'تم التنفيذ' : 'ملغي / مفسوخ'}
                                        </span>
                                    </td>
                                    <td className="p-4.5 flex gap-1 justify-center">
                                        <button 
                                          onClick={() => startEdit(c)} 
                                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition" 
                                          title="تعديل العقد"
                                        >
                                          <Edit size={16} />
                                        </button>
                                        <button 
                                          onClick={() => deleteContract(c.id)} 
                                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition" 
                                          title="حذف العقد"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
              </div>
            )}
        </div>

        {/* Overhauled, Beautiful, Highly Logical Form Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[92vh] overflow-hidden text-right"
              >
                {/* 1. Dynamic receipt-style Sidebar detailing live summary inputs */}
                <div className="hidden md:flex md:w-80 bg-slate-50 p-8 flex-col justify-between border-l border-slate-100 flex-shrink-0 text-right">
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-[1.75rem] border border-slate-200/60 w-fit shadow-sm">
                      <Scroll className="h-9 w-9 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">
                        {editingId ? 'تعديل وثيقة العقد' : 'تسجيل عقد جديد'}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold leading-relaxed mt-2">
                        يرجى ملء البيانات بدقة لربط الالتزامات المالية والعمالية ومواصفات المشروع بشكل قانوني سليم.
                      </p>
                    </div>

                    {/* Live preview ticket */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-3 shadow-xs">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">الملخص المبدئي للوثيقة</p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">رقم العقد:</span>
                          <span className="font-mono font-bold text-slate-700">{formData.contractNumber || 'غير محدد'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">نوع العقد:</span>
                          <span className="font-bold text-slate-700">
                            {formData.category === 'project' ? 'عقد مشروع' :
                             formData.category === 'subcontractor' ? 'مقاول باطن' :
                             formData.category === 'supplier' ? 'عقد توريد' :
                             formData.category === 'employee' ? 'عقد عمل موظف' : 'أخرى'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">الطرف الثاني:</span>
                          <span className="font-bold text-indigo-600 truncate max-w-[120px]">
                            {isManualCounterparty ? (manualNameInput || 'لم يكتب بعد') : (formData.counterparty || 'غير محدد')}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 text-[13px] font-black">
                          <span className="text-slate-500">القيمة الإجمالية:</span>
                          <span className="text-emerald-600 font-mono">{(formData.value).toLocaleString('ar-EG')} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-400 bg-white p-3 rounded-2xl border border-slate-200/40 text-[10px] font-bold">
                    <Info size={16} className="text-indigo-500 shrink-0" />
                    <span>عند إدخال اسم مقاول باطن جديد، سيتم قيده تلقائياً في قائمة المقاولين المعتمدين.</span>
                  </div>
                </div>

                {/* 2. Main content Form panel with clear explicit labels and logical inputs layout */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                    <h3 className="text-lg font-black text-slate-900">
                      {editingId ? 'تحديث السجل الحالي للتعاقد' : 'تسجيل وتدقيق مستند تعاقد جديد'}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-10 h-10 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition flex items-center justify-center text-xl font-light"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/20">
                    <form onSubmit={handleSave} className="space-y-8">
                      
                      {/* Section A: أساسيات العقد وتصنيفه */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
                          <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">الأركان والبيانات الأساسية للعقد</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* رقم العقد */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">رقم العقد المرجعي *</label>
                            <input 
                              type="text" 
                              placeholder="مثال: CNT-2026-04" 
                              value={formData.contractNumber} 
                              onChange={e => setFormData({...formData, contractNumber: e.target.value})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required 
                            />
                          </div>

                          {/* تاريخ العقد */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">تاريخ إبرام العقد *</label>
                            <input 
                              type="date" 
                              value={formData.date} 
                              onChange={e => setFormData({...formData, date: e.target.value})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required 
                            />
                          </div>

                          {/* فئة العقد */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">فئة وتصنيف العقد *</label>
                            <select 
                              value={formData.category} 
                              onChange={e => handleCategoryChange(e.target.value as ContractCategory)} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required
                            >
                              <option value="project">عقد مشروع (مالك / عميل)</option>
                              <option value="subcontractor">عقد مقاول باطن</option>
                              <option value="supplier">عقد مورد / توريد مواد</option>
                              <option value="employee">عقد عمل موظف</option>
                              <option value="other">أخرى ومتنوعة</option>
                            </select>
                          </div>

                          {/* المشروع المرتبط */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">المشروع الهندسي المنسوب له العقد *</label>
                            <select 
                              value={formData.projectId} 
                              onChange={e => setFormData({...formData, projectId: e.target.value})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required
                            >
                              <option value="">اختر المشروع من القائمة</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section B: تحديد واختيار أطراف التعاقد بالربط المنطقي */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
                          <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">تحديد الطرف الثاني للتعاقد</h4>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 space-y-4">
                          {formData.category !== 'other' ? (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-black text-slate-600">
                                  {formData.category === 'subcontractor' && 'اختر مقاول الباطن من قاعدة البيانات المعتمدة *'}
                                  {formData.category === 'supplier' && 'اختر المورد من قائمة الموردين والمشتروات المعرفين *'}
                                  {formData.category === 'employee' && 'اختر الموظف / العامل من سجل شؤون الموظفين الميدانيين *'}
                                  {formData.category === 'project' && 'اختر اسم العميل أو الجهة المالكة للمشروع *'}
                                </label>
                                
                                <select 
                                  value={isManualCounterparty ? '__custom__' : formData.counterparty} 
                                  onChange={e => handleCounterpartySelect(e.target.value)} 
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                                  required
                                >
                                  <option value="">-- يرجى الاختيار من القائمة --</option>
                                  {currentPredefinedList.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                  <option value="__custom__" className="font-extrabold text-indigo-600 bg-indigo-50/40">➕ إضافة اسم جديد يدوياً (غير مربوط بقاعدة البيانات)</option>
                                </select>
                              </div>

                              {/* Manual Text Input triggers only when choosing manual option or if custom input selected */}
                              {isManualCounterparty && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-1.5 bg-indigo-50/20 border border-indigo-100 p-4 rounded-xl"
                                >
                                  <label className="block text-xs font-black text-indigo-700">ادخل الاسم يدوياً بشكل مخصص *</label>
                                  <input 
                                    type="text" 
                                    placeholder="اكتب الاسم ثلاثياً أو رباعياً بدقة..." 
                                    value={manualNameInput} 
                                    onChange={e => setManualNameInput(e.target.value)} 
                                    className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" 
                                    required 
                                  />
                                  <p className="text-[10px] text-indigo-500 font-medium">سيتم تسجيل هذا الاسم في سجل هذا العقد، وإذا اخترت مقاول باطن فسيتم قيده تلقائياً في قاعدة المقاولين لتسهيل صرف مستخلصاته لاحقاً.</p>
                                </motion.div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="block text-xs font-black text-slate-600">اسم الطرف الثاني / المتعاقد معه *</label>
                              <input 
                                type="text" 
                                placeholder="مثال: جهاز مدينة القاهرة الجديدة للهيئات" 
                                value={formData.counterparty} 
                                onChange={e => setFormData({...formData, counterparty: e.target.value})} 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                                required 
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section C: القيم والمؤشرات المالية للمستند */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
                          <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">القيم والمدد الزمنية وحالة التعاقد</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* القيمة */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">القيمة الإجمالية للعقد (ج.م) *</label>
                            <input 
                              type="number" 
                              placeholder="مثال: 750000" 
                              value={formData.value || ''} 
                              onChange={e => setFormData({...formData, value: Number(e.target.value)})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required 
                            />
                          </div>

                          {/* المدة بالأشهر */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">مدة تنفيذ التعاقد (بالأشهر) *</label>
                            <input 
                              type="number" 
                              placeholder="مثال: 12" 
                              value={formData.durationMonths || ''} 
                              onChange={e => setFormData({...formData, durationMonths: Number(e.target.value)})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required 
                            />
                          </div>

                          {/* الحالة */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">الحالة التشغيلية والمستندية للعقد *</label>
                            <select 
                              value={formData.status} 
                              onChange={e => setFormData({...formData, status: e.target.value as any})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              required
                            >
                              <option value="active">نشط / ساري المفعول</option>
                              <option value="completed">منتهي ومسوى بالكامل</option>
                              <option value="terminated">ملغي / مفسوخ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section D: بنود الأعمال والمسؤوليات */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
                          <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">المواصفات الفنية وبنود ونطاق الأعمال</h4>
                        </div>

                        <div className="space-y-4">
                          {/* نطاق الأعمال */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">نطاق الأعمال والمسؤوليات المسندة للطرف الثاني</label>
                            <textarea 
                              placeholder="اكتب وصفاً للواجبات أو المهام المطلوبة تنفيذها بموجب هذا المستند..." 
                              value={formData.scope} 
                              onChange={e => setFormData({...formData, scope: e.target.value})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              rows={3} 
                            />
                          </div>

                          {/* المواصفات والالتزامات */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-600">المواصفات الفنية والشروط الخاصة وطرق الدفع</label>
                            <textarea 
                              placeholder="مثال: يلتزم الطرف الثاني بتسليم الأعمال طبقاً لمواصفات الكود المصري، ويتم صرف مستخلصات شهرية بخصم 10% تأمين أعمال..." 
                              value={formData.specifications} 
                              onChange={e => setFormData({...formData, specifications: e.target.value})} 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition" 
                              rows={3} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Modal Actions Footer */}
                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button 
                          type="button" 
                          onClick={() => setShowModal(false)} 
                          className="flex-1 py-3.5 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
                        >
                          إلغاء التغييرات
                        </button>
                        <button 
                          type="submit" 
                          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition shadow-md"
                        >
                          {editingId ? 'حفظ وتثبيت التعديلات' : 'تسجيل وتعميد مستند التعاقد'}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
