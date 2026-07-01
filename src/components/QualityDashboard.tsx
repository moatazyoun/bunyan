import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Award, Plus, Trash2, Search, Info, CheckCircle, 
  XCircle, Award as AwardIcon, Settings, Sparkles, BookOpen, Clock,
  X, FlaskConical
} from 'lucide-react';
import { LabTestRecord, Project } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface QualityDashboardProps {
  labTests: LabTestRecord[];
  setLabTests: React.Dispatch<React.SetStateAction<LabTestRecord[]>>;
  projects: Project[];
  addAuditLog?: (action: string, module: string, details: string) => void;
  userRole?: string;
}

export default function QualityDashboard({
  labTests,
  setLabTests,
  projects,
  addAuditLog,
  userRole
}: QualityDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pdcaStep, setPdcaStep] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for custom laboratory test
  const [newRfiCode, setNewRfiCode] = useState('');
  const [newTestNameAr, setNewTestNameAr] = useState('');
  const [newEngineer, setNewEngineer] = useState('');
  const [newResultStatus, setNewResultStatus] = useState<LabTestRecord['resultStatus']>('passed');
  const [newProjectId, setNewProjectId] = useState('all');

  const pdcaStepsInfo = [
    {
      title: '1. التخطيط (Plan)',
      desc: 'صياغة خطة الجودة الشاملة للمشروع (Project Quality Plan)، وتحديد المعايير المرجعية للمواصفات الفنية وبنود المقايسة، ورسم خرائط التدفق للعمليات قبل البدء الفعلي للتنفيذ الميداني.',
      isoRef: 'ISO 9001 - Clause 6 & 8.1',
      outcome: 'خطة جودة معتمدة، نماذج استلام أعمال، ومواصفات مرجعية واضحة.'
    },
    {
      title: '2. التنفيذ (Do)',
      desc: 'صب الخرسانات، وتركيب حديد التسليح، وتشغيل خطوط التوريد بما يتطابق بدقة مع المخططات المعتمدة، بالتوازي مع قيد وتصوير تقارير ضبط الجودة اليومية والتحقق المباشر من جودة المواد الموردة.',
      isoRef: 'ISO 9001 - Clause 8',
      outcome: 'سجلات صب يومية، تقارير فحص مواد، ومستندات الفحص الميداني.'
    },
    {
      title: '3. الفحص والتحقق (Check)',
      desc: 'إجراء الفحوصات المعملية الشاملة واختبارات تكسير المكعبات الخرسانية، وعمل اختبارات الضغط والموجات فوق الصوتية، وإجراء عمليات التدقيق الداخلي (Internal Audits) لرصد أي انحرافات عن المواصفة.',
      isoRef: 'ISO 9001 - Clause 9',
      outcome: 'شهادات معملية معتمدة، سجلات تدقيق، وقوائم عدم مطابقة مصنفة.'
    },
    {
      title: '4. اتخاذ الإجراء التصحيحي (Act)',
      desc: 'تفعيل نظام الإجراءات التصحيحية والوقائية (CAPA) لمعالجة حالات عدم المطابقة، وتحديد الأسباب الجذرية للأخطاء الميدانية، وتحديث منهجيات التنفيذ لضمان عدم تكرار العيب مستقبلاً.',
      isoRef: 'ISO 9001 - Clause 10',
      outcome: 'تقارير إجراءات تصحيحية مغلقة، تحسين مستمر لكفاءة الأداء الميداني.'
    }
  ];

  const handleAddLabTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfiCode.trim() || !newTestNameAr.trim() || !newEngineer.trim()) {
      alert('الرجاء تعبئة جميع الحقول الإلزامية');
      return;
    }

    const newTest: LabTestRecord = {
      id: 'test-' + Date.now(),
      rfiCode: newRfiCode.trim(),
      testType: 'density',
      testNameAr: newTestNameAr.trim(),
      date: new Date().toISOString().split('T')[0],
      engineer: newEngineer.trim(),
      resultStatus: newResultStatus
    };

    setLabTests(prev => [newTest, ...prev]);

    if (addAuditLog) {
      addAuditLog('إضافة فحص معملي', 'إدارة الجودة الشاملة', `تم تسجيل اختبار: ${newTest.testNameAr} برقم طلب فحص ${newTest.rfiCode}`);
    }

    // Reset Form
    setNewRfiCode('');
    setNewTestNameAr('');
    setNewEngineer('');
    setNewResultStatus('passed');
    setNewProjectId('all');
    setShowAddModal(false);
  };

  const handleDeleteLabTest = async (id: string) => {
    if (userRole === 'viewer') {
      alert('عذراً، لا تملك الصلاحية لحذف السجلات.');
      return;
    }
    if (await confirmWithRandomCode('هل أنت متأكد من حذف هذا الاختبار الفني نهائياً؟')) {
      const target = labTests.find(t => t.id === id);
      setLabTests(prev => prev.filter(t => t.id !== id));
      if (addAuditLog && target) {
        addAuditLog('حذف فحص معملي', 'إدارة الجودة الشاملة', `تم حذف اختبار: ${target.testNameAr}`);
      }
    }
  };

  const toggleTestResult = (id: string) => {
    if (userRole === 'viewer') return;
    setLabTests(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus: LabTestRecord['resultStatus'] = 
          t.resultStatus === 'passed' ? 'failed' : 
          t.resultStatus === 'failed' ? 'pending' : 'passed';
        
        return {
          ...t,
          resultStatus: nextStatus,
          status: nextStatus === 'passed' ? 'Approved' : nextStatus === 'failed' ? 'Rejected' : 'Pending'
        };
      }
      return t;
    }));
  };

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return labTests.filter(t => {
      const matchesSearch = t.testNameAr.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.rfiCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.engineer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.resultStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [labTests, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = labTests.length;
    const passed = labTests.filter(t => t.resultStatus === 'passed').length;
    const failed = labTests.filter(t => t.resultStatus === 'failed').length;
    const pending = labTests.filter(t => t.resultStatus === 'pending').length;
    const complianceRate = total ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, pending, complianceRate };
  }, [labTests]);

  return (
    <div className="space-y-6" dir="rtl" id="quality-management-module">
      {/* Header */}
      <header className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 h-1 bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-600 w-full" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الجودة الشاملة والتحكم المعملي</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">منظومة حوكمة جودة الأعمال الهندسية والامتثال للمواصفات طبقاً لـ ISO 9001:2015</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-md"
        >
          <Plus size={16} />
          <span>تسجيل اختبار فني معملي</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-400 font-bold">إجمالي الاختبارات المعملية</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-emerald-500 font-bold">الفحوصات المطابقة (مقبولة)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">{stats.passed}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-rose-500 font-bold">الفحوصات غير المطابقة (مرفوضة)</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">{stats.failed}</h3>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <XCircle size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-indigo-500 font-bold">معدل الامتثال للمواصفات الفنية</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1 font-mono">{stats.complianceRate}%</h3>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <AwardIcon size={18} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xs">
        <div className="relative w-full sm:max-w-xs">
          <input 
            type="text" 
            placeholder="بحث بكود RFI، اسم الاختبار أو المهندس..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
          />
          <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right w-full sm:w-auto"
        >
          <option value="all">كافة الحالات الهندسية</option>
          <option value="passed">مقبول ومطابق هندسياً</option>
          <option value="failed">مرفوض وغير مطابق</option>
          <option value="pending">قيد الدراسة والمختبر</option>
        </select>
      </div>

      {/* Laboratory Results Register */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">سجل نتائج الفحص والمراقبة المعملية لمكعبات الخرسانة والمواد</h4>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-black">العدد المرصود: {filteredTests.length}</span>
        </div>

        {filteredTests.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
              <AwardIcon size={32} />
            </div>
            <p className="text-sm font-black text-slate-800">لا توجد اختبارات معملية مسجلة</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              لم يتم رصد أي اختبار مطابق للمواصفات حالياً. انقر على "تسجيل اختبار فني معملي" لإدخال أول فحص ومزامنته حياً مع سحابة الموقع.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                  <th className="p-4">كود طلب الفحص RFI</th>
                  <th className="p-4">بيان الفحص الفني والمخبري</th>
                  <th className="p-4">تاريخ الفحص</th>
                  <th className="p-4">المهندس الفاحص (QC)</th>
                  <th className="p-4">النتيجة والمطابقة</th>
                  {userRole !== 'viewer' && <th className="p-4 text-center">الإجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50 transition font-bold">
                    <td className="p-4 font-mono text-indigo-600">{test.rfiCode}</td>
                    <td className="p-4 text-slate-800">{test.testNameAr}</td>
                    <td className="p-4 text-slate-500 font-mono">{test.date}</td>
                    <td className="p-4 text-slate-600">{test.engineer}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleTestResult(test.id)}
                        disabled={userRole === 'viewer'}
                        title="انقر لتبديل نتيجة الاختبار"
                        className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition flex items-center gap-1 w-fit ${
                          test.resultStatus === 'passed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : test.resultStatus === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          test.resultStatus === 'passed' ? 'bg-emerald-500' :
                          test.resultStatus === 'failed' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        {test.resultStatus === 'passed' ? 'مطابق ومقبول' :
                         test.resultStatus === 'failed' ? 'غير مطابق ومرفوض' : 'قيد المختبر'}
                      </button>
                    </td>
                    {userRole !== 'viewer' && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteLabTest(test.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QA vs QC Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/30 p-5 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-900 font-black mb-3">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-mono">QA</span>
            <h4 className="text-sm">تأكيد الجودة (Quality Assurance) - إداري وقائي</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            منهجية مستندية استباقية تهدف لتحديد الإجراءات والمواصفات وطرق العمل والتدريب قبل بدء التنفيذ لمنع الأخطاء.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 mt-3 list-disc list-inside">
            <li>صياغة خطة الجودة المعتمدة للمشروع (PQP).</li>
            <li>مراجعة طريقة التنفيذ الآمنة والقياسية (Method Statement).</li>
            <li>إجراء تقارير عدم المطابقة المنهجية لمعالجة الأسباب الجذرية.</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-5 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-900 font-black mb-3">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-mono">QC</span>
            <h4 className="text-sm">ضبط ومراقبة الجودة (Quality Control) - ميداني تنفيذي</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            عمليات فحص واختبار ميدانية فعلية للمواد الموردة والبنود للتأكد من مطابقتها للمواصفات والكود المعتمد هندسياً.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 mt-3 list-disc list-inside">
            <li>فحص نتائج اختبار تكسير مكعبات الخرسانة (7 و 28 يوماً).</li>
            <li>استلام وتوقيع طلبات فحص أعمال الإنشائية (RFI) بالميدان.</li>
            <li>إجراء اختبارات الهبوط للخرسانة الجاهزة بالموقع فور التوريد.</li>
          </ul>
        </div>
      </div>

      {/* PDCA Interactive Section */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
          <div className="space-y-3 lg:max-w-md text-right">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <span>حلقة التحسين المستمر للجودة (Deming Cycle / PDCA)</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed text-justify">
              إدارة الجودة تقوم على عجلة التحسين المستمر لحوكمة أعمال المقاولات الفنية. انقر على البنود في المخطط لاستعراض آليتها.
            </p>
            <div className="pt-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-black text-indigo-700">{pdcaStepsInfo[pdcaStep].title}</p>
                <p className="text-xs text-slate-600 leading-relaxed text-justify">{pdcaStepsInfo[pdcaStep].desc}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>المرجعية: {pdcaStepsInfo[pdcaStep].isoRef}</span>
                  <span className="text-emerald-600 font-bold">المخرج: {pdcaStepsInfo[pdcaStep].outcome}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-sm shrink-0">
            {pdcaStepsInfo.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setPdcaStep(idx)}
                className={`p-4 rounded-xl border text-right transition flex flex-col justify-between h-28 relative overflow-hidden ${
                  pdcaStep === idx
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-transparent shadow-md scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <span className={`text-[10px] font-black uppercase ${pdcaStep === idx ? 'text-indigo-200' : 'text-slate-400'}`}>الخطوة {idx+1}</span>
                <span className="text-xs font-black mt-2 leading-tight">{s.title.split(' ')[1]} {s.title.split(' ')[2]}</span>
                <div className={`mt-2 font-mono text-[9px] ${pdcaStep === idx ? 'text-indigo-100' : 'text-slate-400'}`}>{s.isoRef}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[95vh] overflow-hidden text-right">
            
            {/* Sidebar Panel - Premium dark theme */}
            <div className="hidden md:flex md:w-64 bg-slate-950 p-8 flex-col justify-between border-l border-slate-800 text-right">
              <div>
                <div className="h-12 w-12 bg-indigo-950/50 rounded-2xl flex items-center justify-center border border-indigo-900 mb-6 animate-pulse">
                  <FlaskConical className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-black mb-2 text-white leading-snug">المختبر الهندسي</h3>
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">
                  تسجيل الاختبارات المخبرية والفحوصات الميدانية الفورية لعينات الخرسانة، مواد التأسيس، والتربة للتحقق من الكود المعتمد.
                </p>
              </div>
              <div className="space-y-4 pt-6 border-t border-slate-800 text-[10px] font-black text-slate-500">
                <div className="flex items-center gap-2 border-r-2 border-indigo-500 pr-2 text-indigo-400">كود RFI ومستند الفحص</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">المواصفة وعينات الاختبار</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">قرار المطابقة والاعتماد</div>
              </div>
            </div>

            {/* Main Content Form Panel */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 flex-shrink-0">
                <h3 className="text-base font-black text-white">تسجيل اختبار فني معملي جديد (ضبط الميدان)</h3>
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
                <form id="add-quality-test-form" onSubmit={handleAddLabTest} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">كود طلب استلام أعمال RFI المرتبط *</label>
                      <input 
                        required
                        type="text"
                        placeholder="مثال: BUN-BYN-CIV-RFI-0089"
                        value={newRfiCode}
                        onChange={e => setNewRfiCode(e.target.value)}
                        className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none text-right font-mono text-left"
                      />
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

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">بيان الاختبار المخبري والمواصفة المطلوبة *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: اختبار تكسير مكعبات الخرسانة المسلحة لبلاتوه سقف الدور الثاني (مقاومة ٣٥٠ كجم)"
                      value={newTestNameAr}
                      onChange={e => setNewTestNameAr(e.target.value)}
                      className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none text-right"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">المهندس الفاحص (QC) *</label>
                      <input 
                        required
                        type="text"
                        placeholder="مثال: م/ مصطفى الجوهري"
                        value={newEngineer}
                        onChange={e => setNewEngineer(e.target.value)}
                        className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase tracking-widest">نتيجة ومطابقة الاختبار الفوري *</label>
                      <select
                        value={newResultStatus}
                        onChange={e => setNewResultStatus(e.target.value as any)}
                        className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                      >
                        <option value="passed" className="bg-slate-900">مطابق ومقبول هندسياً (Passed)</option>
                        <option value="failed" className="bg-slate-900">مرفوض وغير مطابق (Failed)</option>
                        <option value="pending" className="bg-slate-900">قيد المختبر والدراسة (Pending)</option>
                      </select>
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer Action Bar */}
              <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-4 bg-slate-900 flex-shrink-0 flex-row-reverse">
                <button
                  type="submit"
                  form="add-quality-test-form"
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-lg active:scale-95"
                >
                  حفظ وتسجيل بالمزامنة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black border border-slate-700 transition cursor-pointer"
                >
                  تراجع
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
