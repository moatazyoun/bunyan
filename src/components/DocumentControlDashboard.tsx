import React, { useState, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  FileText, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ShieldAlert, 
  Database, 
  Cpu, 
  FolderGit, 
  Send, 
  Download, 
  Layers, 
  Eye, 
  FileCheck,
  RefreshCw,
  Clock,
  UserCheck
} from 'lucide-react';
import { Project, DcrRecord } from '../types';

interface DocumentControlDashboardProps {
  dcrRecords: DcrRecord[];
  setDcrRecords: React.Dispatch<React.SetStateAction<DcrRecord[]>>;
  projects: Project[];
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

export default function DocumentControlDashboard({ 
  dcrRecords,
  setDcrRecords,
  projects, 
  userRole, 
  addAuditLog 
}: DocumentControlDashboardProps) {
  
  const dcrList = dcrRecords;
  const setDcrList = setDcrRecords;
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Form state for creating a new document
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDiscipline, setNewDiscipline] = useState<DcrRecord['discipline']>('Civil');
  const [newType, setNewType] = useState<DcrRecord['type']>('Drawing');
  const [newRevision, setNewRevision] = useState('Rev 00');
  const [newStatus, setNewStatus] = useState<DcrRecord['status']>('A');
  const [newAuthor, setNewAuthor] = useState('');
  const [newProjId, setNewProjId] = useState('all');

  // Interactive flow state
  const [selectedDocForWorkflow, setSelectedDocForWorkflow] = useState<DcrRecord | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = dcrList.length;
    const drawings = dcrList.filter(d => d.type === 'Drawing').length;
    const rfis = dcrList.filter(d => d.type === 'RFI').length;
    const codeA = dcrList.filter(d => d.status === 'A').length;
    const pendingReview = dcrList.filter(d => d.workflowStep === 'Under Review').length;

    return { total, drawings, rfis, codeA, pendingReview };
  }, [dcrList]);

  // Handle Add Document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('يرجى كتابة عنوان الوثيقة أو المخطط الهندسي');
      return;
    }

    // Auto-generate project standard code
    const discCode = 
      newDiscipline === 'Civil' ? 'CIV' :
      newDiscipline === 'Survey' ? 'SUR' :
      newDiscipline === 'Mechanical' ? 'MEC' :
      newDiscipline === 'Electrical' ? 'ELE' :
      newDiscipline === 'HSE' ? 'HSE' : 'CON';

    const typeCode = 
      newType === 'Drawing' ? 'DWG' :
      newType === 'RFI' ? 'RFI' :
      newType === 'Method Statement' ? 'MST' :
      newType === 'Transmittal' ? 'TRN' : 'COR';

    const sequentialNumber = String(dcrList.length + 13).padStart(4, '0');
    const autoCode = `BUN-BYN-${discCode}-${typeCode}-${sequentialNumber}`;

    const newDoc: DcrRecord = {
      id: 'doc_' + Date.now(),
      code: autoCode,
      title: newTitle,
      discipline: newDiscipline,
      type: newType,
      revision: newRevision,
      status: newStatus,
      date: new Date().toISOString().split('T')[0],
      author: newAuthor || 'مدير التحكم بالوثائق',
      projectId: newProjId,
      workflowStep: 'Draft'
    };

    setDcrList([newDoc, ...dcrList]);
    setIsAddingDoc(false);
    setNewTitle('');
    setNewAuthor('');

    if (addAuditLog) {
      addAuditLog('إضافة مستند جديد', 'إدارة الوثائق', `تم ترميز وإصدار المستند ${autoCode} بنجاح.`);
    }
  };

  // Move document workflow forward
  const advanceWorkflow = (id: string, nextStep: DcrRecord['workflowStep']) => {
    setDcrList(prev => prev.map(doc => {
      if (doc.id === id) {
        if (addAuditLog) {
          addAuditLog('تحديث مسار المستند', 'إدارة الوثائق', `تغيير حالة المستند ${doc.code} إلى ${nextStep}`);
        }
        return { ...doc, workflowStep: nextStep };
      }
      return doc;
    }));
    // Update local preview if selected
    if (selectedDocForWorkflow && selectedDocForWorkflow.id === id) {
      setSelectedDocForWorkflow(prev => prev ? { ...prev, workflowStep: nextStep } : null);
    }
  };

  // Filter Document Control Register list
  const filteredDcr = useMemo(() => {
    return dcrList.filter(doc => {
      const matchesSearch = 
        doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDiscipline = disciplineFilter === 'All' || doc.discipline === disciplineFilter;
      const matchesType = typeFilter === 'All' || doc.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
      const matchesProj = selectedProjectId === 'all' || doc.projectId === selectedProjectId;

      return matchesSearch && matchesDiscipline && matchesType && matchesStatus && matchesProj;
    });
  }, [dcrList, searchTerm, disciplineFilter, typeFilter, statusFilter, selectedProjectId]);

  const getStatusBadge = (status: DcrRecord['status']) => {
    switch (status) {
      case 'A':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-emerald-850 bg-emerald-50 border border-emerald-150 rounded-lg shadow-sm">Code A | معتمد بالكامل</span>;
      case 'B':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-amber-850 bg-amber-50 border border-amber-150 rounded-lg shadow-sm">Code B | معتمد بملاحظات</span>;
      case 'C':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-rose-850 bg-rose-50 border border-rose-150 rounded-lg shadow-sm">Code C | مرفوض تماماً</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-indigo-850 bg-indigo-50 border border-indigo-150 rounded-lg shadow-sm">Code D | للمراجعة والمعلومات</span>;
    }
  };

  const getWorkflowBadge = (step: DcrRecord['workflowStep']) => {
    switch (step) {
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">مسودة مسجلة</span>;
      case 'Under Review':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">قيد المراجعة الفنية</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">تم الاعتماد والموافقة</span>;
      case 'Distributed':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">موزع للموقع (AFC)</span>;
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* 1. المقدمة والرؤية الإستراتيجية لحوكمة البيانات (Introduction & Strategic Value) */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-widest">
            <Cpu size={14} className="animate-pulse" />
            <span>نظام التحكم المتكامل في المستندات والوثائق الفنية (DCMS)</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white font-sans leading-tight">
            حوكمة البيانات الهندسية: تدفق معلومات آمن وموثوق لحماية أصول المشروعات
          </h1>
          <p className="text-slate-300 text-sm max-w-4xl leading-relaxed">
            تمثل إدارة التحكم في المستندات (Document Control) حائط الصد القانوني والفني الأقوى لشركتنا. يضمن النظام أرشفة وحفظ وتداول المخططات التنفيذية والاتفاقيات، وتوليد مسارات عمل آلية تضمن تسليم المعلومات المعتمدة للتنفيذ (Approved for Construction - AFC) مباشرة إلى طواقم العمل الميدانية في الوقت المناسب دون تأخير، مع تفادي استخدام الإصدارات الملغاة والمحافظة التامة على سرية وحماية المستندات الهندسية للمالك والاستشاري العام.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 mt-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-indigo-300 font-black block">صفر فاقد بيانات (Zero Data Loss)</span>
              <p className="text-xs text-slate-400 leading-relaxed">تشفير وأرشفة رقمية سحابية تضمن استعادة كافة المستندات والوثائق التاريخية بضغطة زر واحدة.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-emerald-300 font-black block">تتبع فوري (Instant Traceability)</span>
              <p className="text-xs text-slate-400 leading-relaxed">نظام تكويد موحد للمراسلات، وتحديد مسؤول الفحص، وزمن الرد والاعتماد من المالك.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-blue-300 font-black block">الامتثال للمواصفات الدولية</span>
              <p className="text-xs text-slate-400 leading-relaxed">توافق كامل مع معايير جودة إدارة الوثائق الآمنة ونظم الـ ISO 9001 لإدارة العمليات والمشاريع.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">إجمالي الوثائق المسجلة</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.total} وثيقة ومخطط</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FolderGit size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">المخططات الإنشائية (DWG)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.drawings} ملف</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Send size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">طلبات تقديم المعلومات (RFI)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.rfis} طلب معلق</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">مستندات معتمدة بالكامل (Code A)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.codeA} مستند</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">وثائق قيد المراجعة الهندسية</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.pendingReview} وثيقة</span>
          </div>
        </div>
      </div>

      {/* 2. دورة حياة الوثائق والمخططات الهندسية & 3. الأتمتة الرقمية وأنظمة الـ EDMS الذكية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 2: Lifecycle */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers size={18} className="text-indigo-600" />
            <span>دورة حياة الوثائق والمخططات الهندسية (Engineering Documentation Lifecycle)</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● إدارة المخططات الهندسية والمستندات الفنية (Shop Drawings & Submittals):</h3>
              <p>
                يقوم مهندسو المكتب الفني بتحضير وإعداد المخططات التفصيلية، وطلبات تقديم المعلومات (RFI)، وحزم المنهجيات والخطط التنفيذية (Method Statements). ترسل الوثيقة فور إرسالها بمذكرة إرسال رسمية (Transmittal) لمراجعة المهندس الاستشاري المشرف والمالك تمهيداً للتنفيذ.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● نظام تكويد وترميز الوثائق القياسي الموحد (Standard Document Coding):</h3>
              <p>
                نعتمد على ترميز صارم يضمن البحث السريع ومعرفة طبيعة الوثيقة من كودها مباشرة، ويتبع الصيغة التالية: <br/>
                <code className="bg-slate-50 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono border font-black block mt-1.5 border-slate-200">
                  [رمز المشروع] - [جهة الإصدار] - [التخصص الفني] - [نوع الوثيقة] - [الرقم التسلسلي]
                </code>
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● مراجعة الإصدارات ومطابقة اللوحات المعتمدة (Revision Control):</h3>
              <p>
                يتتبع نظامنا الرقمي كل مراجعة للمخطط الفني لتفادي قيام طواقم المواقع بالبناء باستخدام لوحات قديمة أو مهملة (Obsolete Drawings). يتأكد مدير الوثائق من توزيع النسخ الموسومة بـ "Approved for Construction (AFC)" حصراً لإلغاء أي هوامش خطأ هندسية بالشارع.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Digital Automation */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu size={18} className="text-blue-600" />
            <span>الأتمتة الرقمية وأنظمة الـ EDMS الذكية (Digital Automation)</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● نظم إدارة المستندات الإلكترونية للمقاولات (EDMS Solutions):</h3>
              <p>
                ندعم ونربط أعمالنا بأنظمة رائدة عالمياً مثل Oracle Aconex و Bentley ProjectWise، مما يتيح إقامة بيئة بيانات مشتركة (CDE) تجمع كل من المقاول، والاستشاري، وهيئات الإشراف، والمالك للمشروع على واجهة موحدة تضمن تدفق سريع للقرارات والموافقات الفنية.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● مسارات العمل الآلية الذكية (Automated Workflows):</h3>
              <p>
                بمجرد رفع المخطط الفني أو الخطاب التعاقدي، ينطلق مسار اعتماد آلي مبرمج يمرر الملف تدريجياً لمهندس ضبط الجودة، تمهيداً لاعتماده من الاستشاري، وإعادته كملف رسمي معتمد. يرسل النظام رسائل بريد تنبيهية في حال تأخر أي جهة عن تقديم تعليقها الفني ضمن الزمن التعاقدي.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● محرك البحث والميتا داتا والذكاء الاصطناعي (Advanced OCR):</h3>
              <p>
                يقوم النظام بتحليل المستندات الممسوحة ضوئياً والـ PDFs، وقراءة الحروف بدقة (OCR)، وتثبيت كلمات مفتاحية (Metadata Tags) مثل القطاع، والمنسوب، والشركة الفرعية، مما يتيح مراجعة بنود التعاقدات واللوحات واسترجاعها خلال أجزاء من الثانية.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. الحماية والسرية والأرشفة الرقمية */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert size={18} className="text-rose-600" />
          <span>الحماية، السرية والأرشفة الرقمية (Data Security & Archiving Governance)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <h3 className="font-extrabold text-slate-950 text-xs flex items-center gap-1.5 text-indigo-700">
              <UserCheck size={14} />
              <span>مصفوفة الصلاحيات المقيدة (Access Matrix)</span>
            </h3>
            <p>
              يتم حظر وإتاحة المستندات وفق مصفوفة صلاحيات بالغة الدقة. يملك مهندسو الموقع صلاحية عرض اللوحات المعتمده للتنفيذ فقط، بينما يملك مدراء المشاريع وإدارة العقود حق مراجعة وتعديل ومصادقة المراسلات والتقارير المالية والتعاقدات السيادية.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <h3 className="font-extrabold text-slate-950 text-xs flex items-center gap-1.5 text-emerald-700">
              <RefreshCw size={14} />
              <span>النسخ الاحتياطي والتعافي من الكوارث</span>
            </h3>
            <p>
              يتم إجراء عمليات نسخ احتياطي دوري متزامن وتلقائي (Hourly Backups) لخوادم وقاعدة بيانات المستندات لضمان المحافظة التامة على حقوق الشركة وأصولها المعرفية ضد هجمات الفدية الإلكترونية أو التلف الفيزيائي للأوراق في غرف الحفظ التقليدية.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <h3 className="font-extrabold text-slate-950 text-xs flex items-center gap-1.5 text-amber-700">
              <FileCheck size={14} />
              <span>الأرشفة النهائية والتسليم (As-Built Handover)</span>
            </h3>
            <p>
              عند بلوغ المشروع مرحلة التسليم والتشغيل، ينشئ مهندس الوثائق حزمة متكاملة ومفهرسة للمخططات المنفذة فعلياً على الطبيعة (As-Built Drawings) ومحاضر الاختبار والتشغيل لتقديمها بسلاسة وبشكل فوري للجهات المستلمة والمالك.
            </p>
          </div>
        </div>
      </div>

      {/* 5. مصفوفة تتبع وحالة الوثائق والمراسلات (Document Status Matrix Guide) */}
      <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600 animate-pulse" />
              <span>مصفوفة التحكم وتتبع الوثائق الفنية (DCR Register Matrix)</span>
            </h3>
            <p className="text-slate-500 text-xs font-bold mt-1">تتبع كود الترميز الموحد ومراحل سريان مسارات العمل الهندسية وحالات الاعتماد الرسمية</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsAddingDoc(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-600/10 flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} />
              <span>ترميز وإصدار وثيقة جديدة</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-150 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="البحث برمز الوثيقة، العنوان..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-4 pr-9 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <select 
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="w-full bg-white px-3 py-2 border border-slate-200 rounded-xl text-xs font-black focus:outline-none"
            >
              <option value="All">كل التخصصات (Discipline)</option>
              <option value="Civil">المدني والطرق (Civil)</option>
              <option value="Survey">المساحة والطبوغرافيا (Survey)</option>
              <option value="Electrical">الكهرباء والإنارة (Electrical)</option>
              <option value="HSE">السلامة والصحة المهنية (HSE)</option>
              <option value="Contractual">العقود والمراسلات (Contract)</option>
            </select>
          </div>

          <div>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white px-3 py-2 border border-slate-200 rounded-xl text-xs font-black focus:outline-none"
            >
              <option value="All">كل أنواع الوثائق (Type)</option>
              <option value="Drawing">مخطط تفصيلي (Drawing)</option>
              <option value="RFI">طلب معلومات (RFI)</option>
              <option value="Method Statement">منهجية عمل (MST)</option>
              <option value="Transmittal">إيصال استلام (TRN)</option>
            </select>
          </div>

          <div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white px-3 py-2 border border-slate-200 rounded-xl text-xs font-black focus:outline-none"
            >
              <option value="All">كل أكواد الاعتماد (Status)</option>
              <option value="A">معتمد كلياً (Code A)</option>
              <option value="B">معتمد بملاحظات (Code B)</option>
              <option value="C">مرفوض كلياً (Code C)</option>
              <option value="D">للمعلومات والمطالعة (Code D)</option>
            </select>
          </div>
        </div>

        {/* Modal/Form Overlay for adding document */}
        <AnimatePresence>
          {isAddingDoc && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600" />
                    <span>ترميز وإصدار وثيقة فنية جديدة بالنظام الموحد</span>
                  </h3>
                  <button 
                    onClick={() => setIsAddingDoc(false)}
                    className="text-slate-400 hover:text-slate-900 font-extrabold text-sm"
                  >
                    إغلاق ×
                  </button>
                </div>

                <form onSubmit={handleCreateDocument} className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="space-y-1">
                    <label className="block text-slate-800">مسمى أو عنوان الوثيقة الفنية:</label>
                    <input 
                      type="text" 
                      placeholder="مثال: لوحة تفاصيل غرف التفتيش والتفتيت قطاع ب"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-800">التخصص الهندسي (Discipline):</label>
                      <select 
                        value={newDiscipline}
                        onChange={(e) => setNewDiscipline(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-black"
                      >
                        <option value="Civil">مدني وطرق (Civil)</option>
                        <option value="Survey">مساحة وأعماق (Survey)</option>
                        <option value="Electrical">كهرباء وطاقة (Electrical)</option>
                        <option value="HSE">سلامة وصحة مهنية (HSE)</option>
                        <option value="Contractual">عقود ومراسلات (Contractual)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-800">نوع الوثيقة الفنية (Document Type):</label>
                      <select 
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-black"
                      >
                        <option value="Drawing">مخطط تنفيذي (Drawing)</option>
                        <option value="RFI">طلب معلومات فني (RFI)</option>
                        <option value="Method Statement">منهجية عمل (Method Statement)</option>
                        <option value="Transmittal">إرسال واستلام وثائق (Transmittal)</option>
                        <option value="Correspondence">خطابات رسمية (Correspondence)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-800">الإصدار (Revision):</label>
                      <input 
                        type="text" 
                        value={newRevision}
                        onChange={(e) => setNewRevision(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-800">كود الاعتماد المقترح (Status Code):</label>
                      <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-black"
                      >
                        <option value="A">معتمد بالكامل (Code A)</option>
                        <option value="B">معتمد بملاحظات (Code B)</option>
                        <option value="C">مرفوض لإعادة الدراسة (Code C)</option>
                        <option value="D">للمعلومات والمطالعة فقط (Code D)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-800">مُعدّ ومُنشئ المستند (Author):</label>
                    <input 
                      type="text" 
                      placeholder="مثال: م/ مصطفى الجوهري"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl space-y-1">
                    <span className="text-[10px] text-indigo-700 font-extrabold block">● نظام التكويد الرقمي الموحد تلقائيًا:</span>
                    <p className="text-[10px] text-indigo-650 leading-relaxed font-mono">
                      سيتم ترميز الملف فوراً بنمط BUN-BYN-[Discipline]-[Type]-[Seq] لتسجيله في الدفتر ومصفوفة التتبع.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white p-3 rounded-xl font-black text-xs transition"
                  >
                    تكويد وحفظ المستند الفني
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-500 font-extrabold uppercase border-b border-slate-150">
                <th className="p-4">كود المستند (Standard Code)</th>
                <th className="p-4">عنوان المستند أو المخطط التفصيلي</th>
                <th className="p-4">التخصص</th>
                <th className="p-4 text-center">الإصدار (Rev)</th>
                <th className="p-4 text-center">كود الاعتماد</th>
                <th className="p-4 text-center">الخطوة بمسار العمل</th>
                <th className="p-4">تاريخ التسجيل</th>
                <th className="p-4 text-center">إجراءات مسار العمل (Workflow)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
              {filteredDcr.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-mono text-indigo-600 font-black">{doc.code}</td>
                  <td className="p-4 max-w-sm truncate text-slate-900 font-extrabold">
                    <div>{doc.title}</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5 font-mono">بواسطة: {doc.author}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                      {doc.discipline === 'Civil' && 'هندسة مدنية'}
                      {doc.discipline === 'Survey' && 'رفع مساحي'}
                      {doc.discipline === 'Electrical' && 'شبكات إنارة'}
                      {doc.discipline === 'Mechanical' && 'معدات ميكانيكية'}
                      {doc.discipline === 'HSE' && 'سلامة مهنية'}
                      {doc.discipline === 'Contractual' && 'عقود ومراسلات'}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-650">{doc.revision}</td>
                  <td className="p-4 text-center">{getStatusBadge(doc.status)}</td>
                  <td className="p-4 text-center">{getWorkflowBadge(doc.workflowStep)}</td>
                  <td className="p-4 font-mono text-slate-500">{doc.date}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedDocForWorkflow(doc)}
                        className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-100 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>التحكم والموافقة</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDcr.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد مستندات مسجلة تطابق محددات البحث والتصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded interactive Workflow Review Panel when a document is clicked */}
      <AnimatePresence>
        {selectedDocForWorkflow && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6 shadow-2xl relative"
          >
            <div className="absolute top-4 left-4">
              <button 
                onClick={() => setSelectedDocForWorkflow(null)}
                className="text-slate-400 hover:text-white font-extrabold text-sm"
              >
                إغلاق مسار العمل ×
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block">لوحة سير العمل التفاعلية المعتمدة (Interactive Workflow Approval Panel)</span>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Cpu size={18} className="text-emerald-400 animate-spin-slow" />
                <span>محاكي مسار الاعتماد والموافقة الفنية للوثيقة: {selectedDocForWorkflow.code}</span>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
                بصفتك مديراً للتحكم بالوثائق واستشاري الجودة الفنية، يمكنك هنا محاكاة دورة حياة المخطط وتنقيلها زمنياً بين المكاتب الاستشارية والموقع للتأكد من ربط الاعتماد وتدوير الموافقات.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              {/* Step 1 */}
              <div className={`p-4 rounded-2xl border transition-all ${selectedDocForWorkflow.workflowStep === 'Draft' ? 'bg-indigo-600/25 border-indigo-500' : 'bg-slate-950/40 border-slate-800 opacity-60'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-extrabold">المرحلة الأولى</span>
                  {selectedDocForWorkflow.workflowStep === 'Draft' && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>}
                </div>
                <span className="block font-black text-xs text-white">1- تسجيل وإرسال الوثيقة</span>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">تجهيز المخطط وتكويده بواسطة مهندس المكتب الفني وحفظه كمسودة للتدقيق الفني.</p>
                {selectedDocForWorkflow.workflowStep === 'Draft' && (
                  <button 
                    onClick={() => advanceWorkflow(selectedDocForWorkflow.id, 'Under Review')}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] py-1.5 rounded-lg transition"
                  >
                    تقديم للمراجعة الفنية
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-2xl border transition-all ${selectedDocForWorkflow.workflowStep === 'Under Review' ? 'bg-amber-600/25 border-amber-500' : 'bg-slate-950/40 border-slate-800 opacity-60'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-extrabold">المرحلة الثانية</span>
                  {selectedDocForWorkflow.workflowStep === 'Under Review' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                </div>
                <span className="block font-black text-xs text-white">2- الفحص والتقييم الاستشاري</span>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">فحص مستند RFI والمخطط مع المالك والاستشاري وإعطاء كود الموافقة النهائي.</p>
                {selectedDocForWorkflow.workflowStep === 'Under Review' && (
                  <button 
                    onClick={() => advanceWorkflow(selectedDocForWorkflow.id, 'Approved')}
                    className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] py-1.5 rounded-lg transition"
                  >
                    اعتماد وإعطاء كود الموافقة
                  </button>
                )}
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-2xl border transition-all ${selectedDocForWorkflow.workflowStep === 'Approved' ? 'bg-emerald-600/25 border-emerald-500' : 'bg-slate-950/40 border-slate-800 opacity-60'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-extrabold">المرحلة الثالثة</span>
                  {selectedDocForWorkflow.workflowStep === 'Approved' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                </div>
                <span className="block font-black text-xs text-white">3- توقيع وختم الموافقات</span>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">توقيع المستند رقمياً وختمه بالاعتماد لجعله وثيقة قانونية صالحة للتنفيذ بالموقع.</p>
                {selectedDocForWorkflow.workflowStep === 'Approved' && (
                  <button 
                    onClick={() => advanceWorkflow(selectedDocForWorkflow.id, 'Distributed')}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] py-1.5 rounded-lg transition"
                  >
                    توزيع المخططات للموقع (AFC)
                  </button>
                )}
              </div>

              {/* Step 4 */}
              <div className={`p-4 rounded-2xl border transition-all ${selectedDocForWorkflow.workflowStep === 'Distributed' ? 'bg-blue-600/25 border-blue-500' : 'bg-slate-950/40 border-slate-800 opacity-60'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400 font-extrabold">المرحلة النهائية</span>
                  {selectedDocForWorkflow.workflowStep === 'Distributed' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>}
                </div>
                <span className="block font-black text-xs text-white">4- تعميم وتوزيع المخططات</span>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">توزيع الملف المعتمد على طواقم الإشراف والمنفذ الموقعي وإلغاء الطبعات القديمة.</p>
                {selectedDocForWorkflow.workflowStep === 'Distributed' && (
                  <div className="mt-4 p-2 bg-blue-950 border border-blue-900 rounded-lg text-[9px] text-center text-blue-300 font-black">
                    ✓ الوثيقة موزعة ونشطة بالموقع بالكامل!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
