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
  UserCheck,
  Trash2
} from 'lucide-react';
import { Project, DcrRecord, BOQItem, SiteWorker } from '../types';

interface DocumentControlDashboardProps {
  dcrRecords: DcrRecord[];
  setDcrRecords: React.Dispatch<React.SetStateAction<DcrRecord[]>>;
  projects: Project[];
  boqItems: BOQItem[];
  workers: SiteWorker[];
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

export default function DocumentControlDashboard({ 
  dcrRecords,
  setDcrRecords,
  projects, 
  boqItems,
  workers,
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
  const [newAuthorId, setNewAuthorId] = useState('');
  const [newProjId, setNewProjId] = useState<string>(projects[0]?.id || 'all');
  const [newBoqItemId, setNewBoqItemId] = useState<string>('');

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

  // Filtered BOQ items based on selected project in form
  const availableBoqItems = useMemo(() => {
    if (!newProjId || newProjId === 'all') {
      return boqItems;
    }
    return boqItems.filter(item => item.projectId === newProjId);
  }, [boqItems, newProjId]);

  // Set default BOQ item when available items change
  React.useEffect(() => {
    if (availableBoqItems.length > 0) {
      setNewBoqItemId(availableBoqItems[0].id);
    } else {
      setNewBoqItemId('');
    }
  }, [availableBoqItems]);

  // Deletion state
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [deleteCodeInput, setDeleteCodeInput] = useState('');
  const [expectedDeleteCode, setExpectedDeleteCode] = useState('');

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

    const selectedBoq = boqItems.find(item => item.id === newBoqItemId);
    const selectedAuthor = workers.find(w => w.id === newAuthorId);

    const newDoc: DcrRecord = {
      id: 'doc_' + Date.now(),
      code: autoCode,
      title: newTitle,
      discipline: newDiscipline,
      type: newType,
      revision: newRevision,
      status: newStatus,
      date: new Date().toISOString().split('T')[0],
      author: selectedAuthor?.name || 'مدير التحكم بالوثائق',
      projectId: newProjId,
      workflowStep: 'Draft',
      boqItemId: newBoqItemId || undefined,
      boqItemCode: selectedBoq?.code || undefined
    };

    setDcrList([newDoc, ...dcrList]);
    setIsAddingDoc(false);
    setNewTitle('');
    setNewAuthorId('');

    if (addAuditLog) {
      addAuditLog(
        'إضافة مستند جديد', 
        'إدارة الوثائق', 
        `تم ترميز وإصدار المستند ${autoCode} بنجاح وربطه بالبند ${selectedBoq?.code || 'بدون ربط'}.`
      );
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

  // Revert document workflow backward
  const revertWorkflow = (id: string, prevStep: DcrRecord['workflowStep']) => {
    setDcrList(prev => prev.map(doc => {
      if (doc.id === id) {
        if (addAuditLog) {
          addAuditLog('تراجع في مسار المستند', 'إدارة الوثائق', `تراجع عن حالة المستند ${doc.code} إلى ${prevStep}`);
        }
        return { ...doc, workflowStep: prevStep };
      }
      return doc;
    }));
    // Update local preview if selected
    if (selectedDocForWorkflow && selectedDocForWorkflow.id === id) {
      setSelectedDocForWorkflow(prev => prev ? { ...prev, workflowStep: prevStep } : null);
    }
  };

  const handleDeleteDocument = (id: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedDeleteCode(code);
    setDeleteCodeInput('');
    setDocToDelete(id);
  };

  const confirmDeleteDocument = () => {
    if (deleteCodeInput !== expectedDeleteCode) {
      alert('كود التأكيد غير صحيح. يرجى المحاولة مرة أخرى.');
      return;
    }
    const doc = dcrList.find(d => d.id === docToDelete);
    setDcrList(prev => prev.filter(d => d.id !== docToDelete));
    if (addAuditLog && doc) {
      addAuditLog('حذف وثيقة', 'إدارة الوثائق', `تم حذف الوثيقة ${doc.code} نهائياً`);
    }
    setDocToDelete(null);
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
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
            Code A | معتمد بالكامل
          </span>
        );
      case 'B':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
            Code B | معتمد بملاحظات
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-rose-800 bg-rose-50 border border-rose-200 rounded-lg shadow-sm">
            Code C | مرفوض تماماً
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
            Code D | للمراجعة والمعلومات
          </span>
        );
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
    <div className="space-y-6" dir="rtl">
      {/* 1. Header with Title and Quick Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-indigo-600" size={24} />
            <span>إدارة الوثائق والمخططات الهندسية (DCR)</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">تتبع كود الترميز الموحد ومراحل سريان مسارات العمل الهندسية وحالات الاعتماد الرسمية لجميع بنود المشروع</p>
        </div>

        <button 
          onClick={() => setIsAddingDoc(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/10 flex items-center gap-2 transition-all cursor-pointer self-stretch md:self-auto justify-center"
        >
          <Plus size={16} />
          <span>ترميز وإصدار وثيقة جديدة</span>
        </button>
      </div>

      {/* Live Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">إجمالي الوثائق المسجلة</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.total} وثيقة</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FolderGit size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">المخططات الإنشائية (DWG)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.drawings} مخطط</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Send size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">طلبات المعلومات (RFI)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.rfis} طلب</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">معتمد بالكامل (Code A)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.codeA} مستند</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">قيد المراجعة الهندسية</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.pendingReview} وثيقة</span>
          </div>
        </div>
      </div>

      {/* 2. DCR Table Register */}
      <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              <span>جدول مصفوفة تتبع الوثائق الهندسية (DCR Register)</span>
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1">اضغط على "التحكم والموافقة" لمتابعة مسار عمل واعتماد أي مخطط</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-150 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="البحث برمز الوثيقة، العنوان، اسم المعد..." 
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

        {/* Table representation */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-black uppercase text-[10px] tracking-wide border-b-2 border-slate-100">
                <th className="p-5 whitespace-nowrap">كود المستند (STANDARD CODE)</th>
                <th className="p-5 min-w-[200px]">عنوان المستند أو المخطط التفصيلي</th>
                <th className="p-5 text-center whitespace-nowrap">البند المرتبط (BOQ LINK)</th>
                <th className="p-5 text-center whitespace-nowrap">التخصص</th>
                <th className="p-5 text-center whitespace-nowrap">الإصدار (REV)</th>
                <th className="p-5 text-center whitespace-nowrap">كود الاعتماد</th>
                <th className="p-5 text-center whitespace-nowrap">الخطوة بمسار العمل</th>
                <th className="p-5 text-center whitespace-nowrap">تاريخ التسجيل</th>
                <th className="p-5 text-left whitespace-nowrap">إجراءات مسار العمل (WORKFLOW)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {filteredDcr.map((doc) => {
                const linkedBoq = boqItems.find(item => item.id === doc.boqItemId || item.code === doc.boqItemCode);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition duration-200">
                    <td className="p-5 font-mono text-indigo-700 font-black text-xs whitespace-nowrap">{doc.code}</td>
                    <td className="p-5 max-w-sm">
                      <div className="text-slate-900 font-black text-sm truncate" title={doc.title}>{doc.title}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">بواسطة: {doc.author}</div>
                    </td>
                    <td className="p-5 text-center">
                      {linkedBoq ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono text-slate-600 bg-slate-100 rounded-lg">
                            {linkedBoq.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]" title={linkedBoq.description}>
                            {linkedBoq.description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-black">-</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <span className="inline-block bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg text-[10px] whitespace-nowrap">
                        {doc.discipline === 'Civil' && 'هندسة مدنية'}
                        {doc.discipline === 'Survey' && 'رفع مساحي'}
                        {doc.discipline === 'Electrical' && 'شبكات إنارة'}
                        {doc.discipline === 'Mechanical' && 'معدات ميكانيكية'}
                        {doc.discipline === 'HSE' && 'سلامة مهنية'}
                        {doc.discipline === 'Contractual' && 'عقود ومراسلات'}
                      </span>
                    </td>
                    <td className="p-5 text-center font-mono text-slate-700 font-black whitespace-nowrap">{doc.revision}</td>
                    <td className="p-5 text-center whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="p-5 text-center whitespace-nowrap">
                      {getWorkflowBadge(doc.workflowStep)}
                    </td>
                    <td className="p-5 text-center font-mono text-slate-500 font-black whitespace-nowrap">{doc.date}</td>
                    <td className="p-5 text-left">
                      <div className="flex items-center justify-end gap-2">
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer border border-rose-100 hover:border-rose-200"
                            title="حذف نهائياً"
                          >
                            <span>حذف</span>
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedDocForWorkflow(doc)}
                          className="p-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer border border-indigo-100 hover:border-indigo-200"
                        >
                          <div className="flex flex-col text-right">
                            <span className="leading-tight">التحكم</span>
                            <span className="leading-tight">والموافقة</span>
                          </div>
                          <Eye size={14} className="ml-1" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDcr.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileCheck size={32} className="text-slate-300" />
                      <span>لا توجد مستندات مسجلة تطابق محددات البحث والتصفية المحددة.</span>
                    </div>
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
                className="text-slate-400 hover:text-white font-extrabold text-sm flex items-center gap-1 cursor-pointer"
              >
                <span>إغلاق مسار العمل</span>
                <XCircle size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block">لوحة سير العمل التفاعلية المعتمدة (Interactive Workflow Approval Panel)</span>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Cpu size={18} className="text-emerald-400 animate-pulse" />
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
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => advanceWorkflow(selectedDocForWorkflow.id, 'Approved')}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] py-1.5 rounded-lg transition"
                    >
                      اعتماد وإعطاء كود الموافقة
                    </button>
                    <button 
                      onClick={() => revertWorkflow(selectedDocForWorkflow.id, 'Draft')}
                      className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] py-1.5 rounded-lg transition"
                      title="التراجع إلى خطوة مسودة"
                    >
                      تراجع
                    </button>
                  </div>
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
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => advanceWorkflow(selectedDocForWorkflow.id, 'Distributed')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] py-1.5 rounded-lg transition"
                    >
                      توزيع المخططات للموقع (AFC)
                    </button>
                    <button 
                      onClick={() => revertWorkflow(selectedDocForWorkflow.id, 'Under Review')}
                      className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] py-1.5 rounded-lg transition"
                      title="التراجع للخطوة السابقة"
                    >
                      تراجع
                    </button>
                  </div>
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
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="p-3 bg-blue-950/60 border border-blue-900 rounded-lg text-[10px] text-center text-blue-300 font-black">
                      تم توزيع المخطط وهو نشط الآن بالموقع بالكامل
                    </div>
                    <button 
                      onClick={() => revertWorkflow(selectedDocForWorkflow.id, 'Approved')}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] py-1.5 rounded-lg transition"
                      title="التراجع للخطوة السابقة وإلغاء التوزيع"
                    >
                      تراجع عن التوزيع الساري
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ALL INFORMATION & EXPLANATIONS BELOW THE REGISTER TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        {/* Section A: Intro & Vision Block */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl lg:col-span-2">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-widest">
              <Cpu size={14} className="animate-pulse" />
              <span>نظام التحكم المتكامل في المستندات والوثائق الفنية (DCMS)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white font-sans leading-tight">
              حوكمة البيانات الهندسية: تدفق معلومات آمن وموثوق لحماية أصول المشروعات
            </h2>
            <p className="text-slate-300 text-xs max-w-4xl leading-relaxed">
              تمثل إدارة التحكم في المستندات (Document Control) حائط الصد القانوني والفني الأقوى لشركتنا. يضمن النظام أرشفة وحفظ وتداول المخططات التنفيذية والاتفاقيات، وتوليد مسارات عمل آلية تضمن تسليم المعلومات المعتمدة للتنفيذ (Approved for Construction - AFC) مباشرة إلى طواقم العمل الميدانية في الوقت المناسب دون تأخير، مع تفادي استخدام الإصدارات الملغاة والمحافظة التامة على سرية وحماية المستندات الهندسية للمالك والاستشاري العام.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 mt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-indigo-300 font-black block">صفر فاقد بيانات (Zero Data Loss)</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">تشفير وأرشفة رقمية سحابية تضمن استعادة كافة المستندات والوثائق التاريخية بضغطة زر واحدة.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-emerald-300 font-black block">تتبع فوري (Instant Traceability)</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">نظام تكويد موحد للمراسلات، وتحديد مسؤول الفحص، وزمن الرد والاعتماد من المالك.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-blue-300 font-black block">الامتثال للمواصفات الدولية</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">توافق كامل مع معايير جودة إدارة الوثائق الآمنة ونظم الـ ISO 9001 لإدارة العمليات والمشاريع.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Lifecycle */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers size={18} className="text-indigo-600" />
            <span>دورة حياة الوثائق والمخططات الهندسية (Engineering Documentation Lifecycle)</span>
          </h3>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-semibold">
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 text-xs text-indigo-700">● إدارة المخططات الهندسية والمستندات الفنية (Shop Drawings & Submittals):</h4>
              <p>
                يقوم مهندسو المكتب الفني بتحضير وإعداد المخططات التفصيلية، وطلبات تقديم المعلومات (RFI)، وحزم المنهجيات والخطط التنفيذية (Method Statements). ترسل الوثيقة فور إرسالها بمذكرة إرسال رسمية (Transmittal) لمراجعة المهندس الاستشاري المشرف والمالك تمهيداً للتنفيذ.
              </p>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 text-xs text-indigo-700">● نظام تكويد وترميز الوثائق القياسي الموحد (Standard Document Coding):</h4>
              <p>
                نعتمد على ترميز صارم يضمن البحث السريع ومعرفة طبيعة الوثيقة من كودها مباشرة، ويتبع الصيغة التالية: <br/>
                <code className="bg-slate-50 text-slate-800 px-1.5 py-1.5 rounded-xl text-[10px] font-mono border font-black block mt-1.5 border-slate-200 text-center">
                  BUN-BYN - [التخصص الهندسـي] - [نـوع الوثيقـة] - [الرقـم المتسلسـل]
                </code>
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 text-xs text-indigo-700">● مراجعة الإصدارات ومطابقة اللوحات المعتمدة (Revision Control):</h4>
              <p>
                يتتبع نظامنا الرقمي كل مراجعة للمخطط الفني لتفادي قيام طواقم المواقع بالبناء باستخدام لوحات قديمة أو مهملة (Obsolete Drawings). يتأكد مدير الوثائق من توزيع النسخ الموسومة بـ "Approved for Construction (AFC)" حصراً لإلغاء أي هوامش خطأ هندسية بالشارع.
              </p>
            </div>
          </div>
        </div>

        {/* Section C: Digital Automation & Security */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu size={18} className="text-blue-600" />
            <span>الأتمتة الرقمية وأنظمة الـ EDMS الذكية وحماية الأرشفة</span>
          </h3>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-semibold">
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 text-xs text-blue-700">● نظم إدارة المستندات الإلكترونية للمقاولات (EDMS Solutions):</h4>
              <p>
                ندعم ونربط أعمالنا بأنظمة رائدة عالمياً مثل Oracle Aconex و Bentley ProjectWise، مما يتيح إقامة بيئة بيانات مشتركة (CDE) تجمع كل من المقاول، والاستشاري، وهيئات الإشراف، والمالك للمشروع على واجهة موحدة تضمن تدفق سريع للقرارات والموافقات الفنية.
              </p>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 text-xs text-blue-700">● مسارات العمل الآلية الذكية (Automated Workflows):</h4>
              <p>
                بمجرد رفع المخطط الفني أو الخطاب التعاقدي، ينطلق مسار اعتماد آلي مبرمج يمرر الملف تدريجياً لمهندس ضبط الجودة، تمهيداً لاعتماده من الاستشاري، وإعادته كملف رسمي معتمد. يرسل النظام رسائل بريد تنبيهية في حال تأخر أي جهة عن تقديم تعليقها الفني ضمن الزمن التعاقدي.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 text-xs text-blue-700">● الحماية، السرية والأرشفة الرقمية (Data Security & Archiving Governance):</h4>
              <p>
                يتم حظر وإتاحة المستندات وفق مصفوفة صلاحيات بالغة الدقة. يملك مهندسو الموقع صلاحية عرض اللوحات المعتمده للتنفيذ فقط، بينما يملك مدراء المشاريع وإدارة العقود حق مراجعة وتعديل ومصادقة المراسلات والتقارير المالية والتعاقدات السيادية.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REDESIGNED INPUT MODAL - MATCHING THE ATTACHED IMAGE EXACTLY */}
      <AnimatePresence>
        {isAddingDoc && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
              dir="rtl"
            >
              {/* Left Content Area (Col-span-9 or 8) */}
              <div className="md:col-span-8 p-6 md:p-8 space-y-6 flex flex-col justify-between" dir="rtl">
                
                {/* Header of Modal */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <button 
                    onClick={() => setIsAddingDoc(false)}
                    className="text-slate-400 hover:text-slate-900 font-extrabold text-lg flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                  <h2 className="text-lg font-black text-slate-900">إصدار وتكويد وثيقة فنية جديدة</h2>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleCreateDocument} className="space-y-6 text-xs font-bold text-slate-700 flex-1">
                  
                  {/* Section 1: Basic Info & BOQ Link */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-indigo-700 flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
                      <span>البيانات الأساسية والربط بالمقايسة</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-slate-800">عنوان أو مسمى الوثيقة الفنية *</label>
                        <input 
                          type="text" 
                          placeholder="مثال: لوحة تفاصيل تسليح غرف التفتيش والتفتيت قطاع ب"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-500 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-800">المشروع المرتبط بالوثيقة *</label>
                        <select 
                          value={newProjId}
                          onChange={(e) => setNewProjId(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                        >
                          <option value="all">اختر المشروع للمستند...</option>
                          {projects.map((proj) => (
                            <option key={proj.id} value={proj.id}>{proj.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-800">بند المقايسة المرتبط *</label>
                        <select 
                          value={newBoqItemId}
                          onChange={(e) => setNewBoqItemId(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                          required
                        >
                          {availableBoqItems.length === 0 ? (
                            <option value="">لا توجد بنود مقايسة لهذا المشروع</option>
                          ) : (
                            availableBoqItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.code} - {item.description.slice(0, 45)}...
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Discipline and Type */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-emerald-700 flex items-center gap-2 border-r-4 border-emerald-500 pr-2">
                      <span>تخصص وثيقة المشروع والنوع</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-slate-800">التخصص الهندسي (Discipline) *</label>
                        <select 
                          value={newDiscipline}
                          onChange={(e) => setNewDiscipline(e.target.value as any)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                        >
                          <option value="Civil">مدني وطرق (Civil)</option>
                          <option value="Survey">مساحة وأعماق (Survey)</option>
                          <option value="Electrical">كهرباء وطاقة (Electrical)</option>
                          <option value="HSE">سلامة وصحة مهنية (HSE)</option>
                          <option value="Contractual">عقود ومراسلات (Contractual)</option>
                          <option value="Mechanical">معدات ميكانيكية (Mechanical)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-800">نوع الوثيقة الفنية (Document Type) *</label>
                        <select 
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as any)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                        >
                          <option value="Drawing">مخطط تنفيذي (Drawing)</option>
                          <option value="RFI">طلب معلومات فني (RFI)</option>
                          <option value="Method Statement">منهجية عمل (Method Statement)</option>
                          <option value="Transmittal">إرسال واستلام وثائق (Transmittal)</option>
                          <option value="Correspondence">خطابات رسمية (Correspondence)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Revision and Status */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-blue-700 flex items-center gap-2 border-r-4 border-blue-500 pr-2">
                      <span>تفاصيل الإصدار وحالة الاعتماد</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-slate-800">الإصدار الحالي (Revision) *</label>
                        <input 
                          type="text" 
                          placeholder="مثال: Rev 00"
                          value={newRevision}
                          onChange={(e) => setNewRevision(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-800">كود الاعتماد المقترح *</label>
                        <select 
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as any)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                        >
                          <option value="A">معتمد بالكامل (Code A)</option>
                          <option value="B">معتمد بملاحظات (Code B)</option>
                          <option value="C">مرفوض لإعادة الدراسة (Code C)</option>
                          <option value="D">للمعلومات والمطالعة فقط (Code D)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-800">مُعدّ ومنشئ المستند *</label>
                        <select 
                          value={newAuthorId}
                          onChange={(e) => setNewAuthorId(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
                          required
                        >
                          <option value="">اختر العامل...</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setIsAddingDoc(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-6 py-3 rounded-2xl transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      اعتماد وتسجيل المستند
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Sidebar Area (Col-span-4) */}
              <div className="md:col-span-4 bg-slate-50 border-r border-slate-100 p-6 md:p-8 flex flex-col justify-between text-slate-800">
                
                {/* Top Section */}
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-xs">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-tight">تسجيل وتكويد وثيقة</h3>
                    <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-relaxed">
                      نظام الترميز الرقمي الموحد لربط المخططات والمراسلات الفنية بمشروعك ومقايستك تزامناً مع اللوائح الفنية المعتمدة.
                    </p>
                  </div>
                </div>

                {/* Steps/Guidelines List */}
                <div className="space-y-4 pt-8">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">خطوات الأرشفة والترميز:</span>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full mt-0.5"></div>
                      <div>
                        <span className="block font-black text-xs text-indigo-700">1. البيانات والربط</span>
                        <span className="block text-[10px] text-slate-500 font-semibold leading-normal">تجهيز العنوان وربط المستند ببند المقايسة المعتمد فورا للتكلفة.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 opacity-75">
                      <div className="w-1.5 h-6 bg-slate-300 rounded-full mt-0.5"></div>
                      <div>
                        <span className="block font-black text-xs text-slate-700">2. التخصص والنوع</span>
                        <span className="block text-[10px] text-slate-500 font-semibold leading-normal">تحديد Discipline ونوعية الملف لصياغة كود الترميز القياسي الموحد.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 opacity-75">
                      <div className="w-1.5 h-6 bg-slate-300 rounded-full mt-0.5"></div>
                      <div>
                        <span className="block font-black text-xs text-slate-700">3. الإصدار والاعتماد</span>
                        <span className="block text-[10px] text-slate-500 font-semibold leading-normal">تسجيل Revision والمسار الفني تمهيداً لبثه إلى طواقم الميدان بختم الـ AFC.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Tip */}
                <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-start gap-2 text-indigo-700 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-semibold">
                    يتم ترميز الملف فوراً بنمط BUN-BYN لتفادي الأخطاء وتسهيل استرجاع البيانات ومراجعة الأرشيف.
                  </p>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {docToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-rose-100"
            >
              <div className="bg-rose-50 p-6 flex flex-col items-center justify-center border-b border-rose-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-rose-500 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-black text-rose-700 text-center">تأكيد حذف الوثيقة</h3>
                <p className="text-xs font-semibold text-rose-600/70 text-center mt-2 leading-relaxed">
                  هذا الإجراء سيقوم بحذف الوثيقة نهائياً ولا يمكن التراجع عنه.
                  <br />
                  لحذف الوثيقة، يرجى كتابة كود التأكيد أدناه.
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">كود التأكيد المطلوب</span>
                  <span className="text-xl font-black tracking-widest text-slate-900 font-mono">{expectedDeleteCode}</span>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={deleteCodeInput}
                    onChange={(e) => setDeleteCodeInput(e.target.value)}
                    placeholder="اكتب الكود هنا..."
                    className="w-full text-center text-lg tracking-widest font-mono bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => confirmDeleteDocument()}
                  disabled={deleteCodeInput !== expectedDeleteCode}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد الحذف
                </button>
                <button
                  onClick={() => setDocToDelete(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black py-3 rounded-xl transition-all shadow-sm"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
