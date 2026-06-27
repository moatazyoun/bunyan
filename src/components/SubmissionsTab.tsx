import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Printer, 
  X,
  ArrowRight, 
  Check, 
  CheckCircle,
  AlertTriangle, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  FileCheck,
  Building,
  ShieldCheck,
  LayoutGrid,
  Calendar,
  Save,
  ClipboardCheck,
  BookOpen,
  Award,
  Layers,
  Zap,
  CheckSquare,
  Database,
  Camera,
  BarChart3,
  XCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Submission, SubmissionWorkDetails, SubmissionSignatories, InspectionStatus, ConsultantInspectionStatus, WorkCategory, DirectionCategory } from '../types';

interface SubmissionsTabProps {
  projectId: string;
  submissions: Submission[];
  setSubmissions: (subs: Submission[]) => void;
  userRole?: string;
  userNameAr?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
  workers?: any[];
}

const DEFAULT_WORK_TYPES = [
  "قاع حفر / أرض طبيعية عمق",
  "طبقة دمك رقم (سرير التراب)",
  "طبقة الفرمة (مستوى التأسيس)",
  "طبقة سن أولى (B1)",
  "طبقة سن ثانية (B2)",
  "طبقة تشريب إسفلتية (M.C)",
  "طبقة إسفلت رابطة (b)",
  "طبقة جيوتكستيل (GEO)",
  "طبقة رمل فلتر (S)",
  "طبقة سن فلتر (F.B)",
  "طبقة دبش فلتر (D)"
];

const DEFAULT_SOIL_TYPES = [
  "تربة صالحة",
  "تربة غير صالحة",
  "قطع في صخر"
];

export default function SubmissionsTab({ 
  projectId, 
  submissions, 
  setSubmissions,
  userRole,
  userNameAr,
  addAuditLog,
  workers = []
}: SubmissionsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Editing / Form states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isNew, setIsNew] = useState(false);
  
  // Printing state
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSub, setPrintSub] = useState<Submission | null>(null);

  // Custom confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    id?: string;
    randomCode?: string;
    onConfirm: () => void;
  } | null>(null);
  const [deleteCode, setDeleteCode] = useState('');

  // Form Fields
  const [submissionNumber, setSubmissionNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionTime, setInspectionTime] = useState('12:00 م');
  const [itemDescription, setItemDescription] = useState('');
  const [levelElevation, setLevelElevation] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [direction, setDirection] = useState<DirectionCategory>('قبلي');
  
  // NEW FIELDS
  const [engineerName, setEngineerName] = useState(userNameAr || '');
  const [surveyorName, setSurveyorName] = useState('');
  const [surveyStatus, setSurveyStatus] = useState<InspectionStatus>('none');
  const [qualityStatus, setQualityStatus] = useState<InspectionStatus>('none');
  const [consultantStatus, setConsultantStatus] = useState<ConsultantInspectionStatus>('accepted');
  const [workCategory, setWorkCategory] = useState<WorkCategory>('مدنى');

  const [length, setLength] = useState('');
  const [areaArea, setAreaArea] = useState('');
  const [submissionCount, setSubmissionCount] = useState<number>(1);
  const [remarks, setRemarks] = useState('');
  
  const [surveyNotes, setSurveyNotes] = useState('');
  const [labNotes, setLabNotes] = useState('');
  
  const [status, setStatus] = useState<'Approved' | 'ApprovedWithRemarks' | 'Rejected' | 'Pending' | 'SurveyRejected'>('Pending');
  
  // Signatories
  const [contractorEngineer, setContractorEngineer] = useState('');
  const [surveyConsultant, setSurveyConsultant] = useState('');
  const [qaEngineer, setQaEngineer] = useState('أ.د / خالد قنديل');
  const [generalConsultant, setGeneralConsultant] = useState('');

  // Filter actual site submissions
  const filteredSubs = submissions.filter(s => {
    const searchStr = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (s.itemDescription || '').toLowerCase().includes(searchStr) ||
      (s.submissionNumber || '').toLowerCase().includes(searchStr);
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && s.status === statusFilter;
  });

  const handleAddNewClick = () => {
    // Determine next submission number based on existing
    const nextNum = submissions.length + 1;
    const formattedNum = `SUB-${String(nextNum).padStart(3, '0')}`;
    
    setSubmissionNumber(formattedNum);
    setDate(new Date().toISOString().split('T')[0]);
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setInspectionTime('12:00 م');
    setItemDescription('');
    setLevelElevation('');
    setLocationDetails('');
    setDirection('اليمين');
    setLength('');
    setAreaArea('');
    setSubmissionCount(1);
    setRemarks('');
    setSurveyNotes('');
    setLabNotes('');
    setStatus('Pending');
    setContractorEngineer(userNameAr || '');
    setSurveyConsultant('');
    setQaEngineer('أ.د / خالد قنديل');
    setGeneralConsultant('');
    
    // NEW FIELDS
    setEngineerName(userNameAr || '');
    setSurveyorName('');
    setSurveyStatus('none');
    setQualityStatus('none');
    setConsultantStatus('accepted');
    setWorkCategory('مدنى');
    
    setIsNew(true);
    setSelectedSub(null);
    setIsEditing(true);
  };

  const handleEditClick = (sub: Submission) => {
    setSelectedSub(sub);
    setSubmissionNumber(sub.submissionNumber);
    setDate(sub.date);
    setInspectionDate(sub.inspectionDate);
    setInspectionTime(sub.inspectionTime);
    setItemDescription(sub.itemDescription);
    setLevelElevation(sub.levelElevation || '');
    setLocationDetails(sub.locationDetails || '');
    setDirection(sub.direction);
    
    // NEW FIELDS
    setEngineerName(sub.engineerName);
    setSurveyorName(sub.surveyorName || '');
    setSurveyStatus(sub.surveyStatus);
    setQualityStatus(sub.qualityStatus);
    setConsultantStatus(sub.consultantStatus);
    setWorkCategory(sub.workCategory);

    setLength(sub.length || '');
    setAreaArea(sub.areaArea || '');
    setSubmissionCount(sub.submissionCount);
    setRemarks(sub.remarks || '');
    setSurveyNotes(sub.surveyNotes || '');
    setLabNotes(sub.labNotes || '');
    setStatus(sub.status);
    
    setContractorEngineer(sub.signatories?.contractorEngineer || '');
    setSurveyConsultant(sub.signatories?.surveyConsultant || '');
    setQaEngineer(sub.signatories?.qaEngineer || 'أ.د / خالد قنديل');
    setGeneralConsultant(sub.signatories?.generalConsultant || '');
    
    setIsNew(false);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemDescription || !locationDetails) {
      alert('يرجى ملء البيانات الأساسية: بند الأعمال، ومكان وتفاصيل الأعمال');
      return;
    }

    const payload: Submission = {
      id: isNew ? 'sub_' + Date.now() : (selectedSub?.id || ''),
      projectId,
      submissionNumber,
      date,
      inspectionDate,
      inspectionTime,
      itemDescription,
      levelElevation,
      locationDetails,
      direction,
      length,
      areaArea,
      submissionCount,
      remarks,
      status,
      surveyNotes,
      labNotes,
      signatories: {
        contractorEngineer,
        surveyConsultant,
        qaEngineer,
        generalConsultant
      },
      // NEW FIELDS
      engineerName,
      surveyorName,
      surveyStatus,
      qualityStatus,
      consultantStatus,
      workCategory
    };

    let updatedList: Submission[];
    if (isNew) {
      updatedList = [...submissions, payload];
    } else {
      updatedList = submissions.map(s => s.id === payload.id ? payload : s);
    }

    setSubmissions(updatedList);
    
    if (addAuditLog) {
      const details = `${isNew ? 'إضافة' : 'تعديل'} طلب فحص أعمال برقم [${submissionNumber}] - ${itemDescription}`;
      addAuditLog(isNew ? 'إضافة' : 'تعديل', 'التسليمات وفحص الأعمال', details);
    }

    setItemDescription('');
    setLevelElevation('');
    setLocationDetails('');
    setLength('');
    setAreaArea('');
    setRemarks('');
    setSelectedSub(null);
    setIsEditing(false);
    setIsNew(false);
  };

  const handleDelete = (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    // Generate a random 4-digit code
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();

    setConfirmState({
      isOpen: true,
      title: `تأكيد حذف الطلب [${sub.submissionNumber || 'N/A'}]`,
      message: `هل أنت متأكد من حذف طلب فحص الأعمال (${sub.itemDescription || 'بدون وصف'})؟ لا يمكن التراجع عن هذا الإجراء وسيتم تسجيل العملية في السجل العام.`,
      id: id,
      randomCode: generatedCode,
      onConfirm: () => {
        setSubmissions(submissions.filter(s => s.id !== id));
        if (addAuditLog) {
          addAuditLog('حذف', 'التسليمات وفحص الأعمال', `حذف طلب فحص الأعمال رقم [${sub.submissionNumber || 'N/A'}] - ${sub.itemDescription || 'بدون وصف'}`);
        }
        if (selectedSub?.id === id) {
          setIsEditing(false);
          setSelectedSub(null);
        }
      }
    });
    setDeleteCode('');
  };

  const printDocument = (sub: Submission) => {
    setPrintSub(sub);
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Status badge style helper
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg shadow-xs">
          <CheckCircle size={12} className="text-emerald-500" />
          <span>معتمد وموافق كلياً</span>
        </span>;
      case 'ApprovedWithRemarks':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 rounded-lg shadow-xs">
          <AlertTriangle size={12} className="text-amber-500 animate-pulse" />
          <span>موافق بملاحظات هندسية</span>
        </span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-rose-800 bg-rose-50 border border-rose-200 rounded-lg shadow-xs">
          <XCircle size={12} className="text-rose-500" />
          <span>مرفوض ويعاد تقديمه</span>
        </span>;
      case 'SurveyRejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-red-800 bg-red-50 border border-red-200 rounded-lg shadow-xs">
          <MapPin size={12} className="text-red-500" />
          <span>مرفوض مساحياً</span>
        </span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-purple-800 bg-purple-50 border border-purple-200 rounded-lg shadow-xs">
          <Clock size={12} className="text-purple-500 animate-spin" />
          <span>قيد الانتظار والتدقيق</span>
        </span>;
    }
  };

  // Embedded print format view that stays hidden except when printing
  if (isPrinting && printSub) {
    return (
      <div className="bg-white text-slate-900 font-sans p-6 min-h-screen text-[11px] leading-tight print-view" dir="rtl">
        {/* Print controls floating on screen but hidden on print */}
        <div className="fixed top-4 left-4 z-50 print:hidden flex gap-2">
          <button 
            onClick={() => { setIsPrinting(false); setPrintSub(null); }}
            className="px-4 py-2 bg-slate-950 text-white font-bold rounded-lg hover:bg-slate-800 shadow-md transition"
          >
            رجوع للوحة التحكم
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 shadow-md transition"
          >
            اطبع الآن
          </button>
        </div>

        {/* -------------------- DOCUMENT START -------------------- */}
        
        {/* Header Block 1: Executive Information */}
        <div className="border-4 border-slate-950 p-4 mb-4">
          <div className="grid grid-cols-3 items-center text-center gap-2">
            <div>
              <p className="font-extrabold text-[12px]">المالك</p>
              <p className="font-black text-[13px] text-indigo-900 mt-1">الهيئة الهندسية للقوات المسلحة</p>
              <p className="text-[10px] text-slate-500">إدارة المهندسين العسكريين</p>
              <p className="text-[9px] text-slate-400">اللواء ١٩ طرق - الكتيبة ٧٠ طرق</p>
            </div>
            <div className="flex flex-col items-center justify-center border-r-2 border-slate-300 px-2 col-span-2">
              <div className="border-2 border-blue-600 p-1.5 rounded-md mb-1 bg-blue-50/50">
                <Building size={24} className="text-blue-600" />
              </div>
              <p className="font-black text-[14px] leading-none mb-1 text-slate-900">مكتب هندسي استشاري</p>
              <p className="font-black text-[11px] text-indigo-700">أ . د / خالد قنديل</p>
            </div>
          </div>

          <div className="border-t-2 border-slate-950 mt-3 pt-3 text-center">
            <h2 className="text-[16px] font-black tracking-wide text-slate-900 underline underline-offset-4">
              مشروع تطوير قطاع الطرق والأعمال الموقعية المشتركة
            </h2>
            <p className="font-mono text-[10px] text-slate-600 mt-1">
              تاريخ الطباعة المعتمد: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Deliveries Log Statement Table Modeled on PDF 1 */}
        <div className="text-center mb-4">
          <span className="inline-block px-8 py-2 border-2 border-slate-950 bg-slate-100 font-black text-[14px] shadow-sm rounded-md">
            بيان بطلب تسليم الأعمال بالموقع (طلب رقم: {printSub.submissionNumber})
          </span>
        </div>

        <table className="w-full border-collapse border-2 border-slate-950 text-center mb-6">
          <thead>
            <tr className="bg-slate-100 font-extrabold h-9 text-slate-900 border-b-2 border-slate-950">
              <th className="border-2 border-slate-950 w-32">البند المراد فحصه</th>
              <th className="border-2 border-slate-950 w-32">مكان وتفاصيل الأعمال</th>
              <th className="border-2 border-slate-950 w-16">المنسوب</th>
              <th className="border-2 border-slate-950 w-16">الإتجاه</th>
              <th className="border-2 border-slate-950 w-16">الطول</th>
              <th className="border-2 border-slate-950 w-16">المسطح</th>
              <th className="border-2 border-slate-950 w-28" colSpan={2}>موعد الفحص</th>
              <th className="border-2 border-slate-950 w-14">تقديم الطلب</th>
              <th className="border-2 border-slate-950 w-20">ملاحظات</th>
            </tr>
            <tr className="bg-slate-55 text-[9.5px] h-6 font-bold text-slate-700">
              <td className="border-2 border-slate-950" colSpan={6}></td>
              <td className="border-2 border-slate-950 font-black">التاريخ</td>
              <td className="border-2 border-slate-950 font-black">الوقت</td>
              <td className="border-2 border-slate-950" colSpan={2}></td>
            </tr>
          </thead>
          <tbody>
            <tr className="h-12 font-black text-slate-800">
              <td className="border-2 border-slate-950 p-2 text-right leading-tight">{printSub.itemDescription}</td>
              <td className="border-2 border-slate-950 p-2 text-right leading-tight">{printSub.locationDetails || '-'}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.levelElevation || '-'}</td>
              <td className="border-2 border-slate-950">{printSub.direction}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.length ? `${printSub.length} م` : '-'}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.areaArea ? `${printSub.areaArea} م٢` : '-'}</td>
              <td className="border-2 border-slate-950 font-mono text-[10px]">{printSub.inspectionDate}</td>
              <td className="border-2 border-slate-950 font-mono text-[10px]">{printSub.inspectionTime}</td>
              <td className="border-2 border-slate-950 text-indigo-700">
                {printSub.submissionCount === 1 && 'الأول'}
                {printSub.submissionCount === 2 && 'الثاني (Re-2)'}
                {printSub.submissionCount === 3 && 'الثالث (Re-3)'}
                {printSub.submissionCount > 3 && `تكرار ${printSub.submissionCount}`}
              </td>
              <td className="border-2 border-slate-950 p-1 text-slate-600 font-medium text-[9.5px] leading-tight">
                {printSub.remarks || 'مطابق أصول الصناعة'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section: Final Authorization Assessment Result */}
        <div className="border-4 border-slate-950 p-4 mb-6 bg-slate-50 rounded-lg">
          <div className="flex justify-between items-center bg-slate-100 p-2.5 border border-slate-950">
            <span className="text-[13px] font-black text-slate-900">نتيجة وموقف استلام هذه الأعمال النهائية:</span>
            <div className="flex gap-6 font-black text-[12px]">
              <span className={`inline-flex items-center gap-1.5 ${printSub.status === 'Approved' ? 'bg-emerald-600 text-white border-2 border-slate-950 font-black rounded-lg px-3 py-1' : 'opacity-35'}`}>
                🟢 موافق ومعتمد كلياً
              </span>
              <span className={`inline-flex items-center gap-1.5 ${printSub.status === 'ApprovedWithRemarks' ? 'bg-amber-500 text-white border-2 border-slate-950 font-black rounded-lg px-3 py-1' : 'opacity-35'}`}>
                🟡 موافق بملاحظات مذكورة
              </span>
              <span className={`inline-flex items-center gap-1.5 ${printSub.status === 'Rejected' ? 'bg-[#dd2222] text-white border-2 border-slate-950 font-black rounded-lg px-3 py-1' : 'opacity-35'}`}>
                🔴 مرفوض ويعاد تقديمه
              </span>
              <span className={`inline-flex items-center gap-1.5 ${printSub.status === 'SurveyRejected' ? 'bg-red-700 text-white border-2 border-slate-950 font-black rounded-lg px-3 py-1' : 'opacity-35'}`}>
                🚩 مرفوض مساحياً
              </span>
            </div>
          </div>
        </div>

        {/* Section: Signatories */}
        <div className="grid grid-cols-4 gap-2 text-center border-2 border-slate-950 p-3 mt-4 text-[10px] page-break-avoid">
          {/* Sign 1 */}
          <div className="border-r border-slate-250 pr-2">
            <p className="font-extrabold bg-slate-950 text-white py-1 mb-1 shadow-sm rounded-sm">مهندس الشركة المنفذة</p>
            <p className="font-mono mt-2 font-black">{printSub.signatories?.contractorEngineer || '-'}</p>
            <p className="text-[9px] text-slate-400 mt-5">التوقيع: ..........................</p>
          </div>
          {/* Sign 2 */}
          <div className="border-r border-slate-250 pr-2">
            <p className="font-extrabold bg-slate-950 text-white py-1 mb-1 shadow-sm rounded-sm">استشاري الأعمال المساحية</p>
            <p className="font-mono mt-2 font-black">{printSub.signatories?.surveyConsultant || '-'}</p>
            <p className="text-[9px] text-slate-400 mt-5">التوقيع: ..........................</p>
          </div>
          {/* Sign 3 */}
          <div className="border-r border-slate-250 pr-2">
            <p className="font-extrabold bg-slate-950 text-white py-1 mb-1 shadow-sm rounded-sm">المهندس الاستشاري لضبط الجودة</p>
            <p className="font-mono mt-2 font-black">{printSub.signatories?.qaEngineer || 'أ.د / خالد قنديل'}</p>
            <p className="text-[9px] text-slate-400 mt-5">التوقيع: ..........................</p>
          </div>
          {/* Sign 4 */}
          <div>
            <p className="font-extrabold bg-slate-950 text-white py-1 mb-1 shadow-sm rounded-sm">الاستشاري العام للمشروع</p>
            <p className="font-mono mt-2 font-black">{printSub.signatories?.generalConsultant || '-'}</p>
            <p className="text-[9px] text-slate-400 mt-5">التوقيع: ..........................</p>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-400 mt-6 border-t border-dashed border-slate-300 pt-3">
          وثيقة رسمية صادرة عن بنية نظام بنيان لإدارة مشروعات الطرق - ERP 2.5
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="cloud-extracts-submissions-tab">
      {/* Header at the top (only shown when not editing) */}
      {!isEditing && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" dir="rtl">
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" size={22} />
              <span>نظام إدارة ولوج طلبات فحص الموقع وتسليمات الأعمال</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              البوابة الشاملة للتحكم في جودة البنية التحتية، حوكمة استلامات البنود، وتكامل الفحوصات الهندسية (IR/WIR) حياً مع المقايسة
            </p>
          </div>
        </div>
      )}

      {!isEditing ? (
        <>
          {/* Top action dashboard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="sub-management-controls">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input 
                type="text"
                placeholder="البحث برقم الطلب، أو البند، أو تفاصيل الموقع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-xl text-xs md:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition text-right"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 text-xs font-semibold ml-1">تصفية الحالة:</span>
              {['All', 'Pending', 'Approved', 'ApprovedWithRemarks', 'Rejected', 'SurveyRejected'].map(s => {
                const label = 
                  s === 'All' ? 'الكل' :
                  s === 'Pending' ? 'قيد الانتظار' :
                  s === 'Approved' ? 'معتمد وموافق' :
                  s === 'ApprovedWithRemarks' ? 'موافق بملاحظات' :
                  s === 'Rejected' ? 'مرفوض' : 'مرفوض مساحياً';
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                      statusFilter === s 
                        ? 'bg-slate-900 text-white shadow-sm border border-slate-900' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية إضافة طلبات فحص جديدة') : handleAddNewClick}
              disabled={userRole === 'viewer'}
              className={`flex items-center gap-1.5 px-4 py-2 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition-all duration-250 self-start md:self-auto ${
                userRole === 'viewer' 
                  ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                  : 'bg-purple-700 hover:bg-purple-800 shadow-purple-600/10 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <Plus size={16} />
              <span>تسجيل طلب فحص / تسليم جديد</span>
            </button>
          </div>

          {/* Main Listing View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-1">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="border-r-4 border-purple-700 pr-4 py-1">
                <h2 className="font-black text-base md:text-lg text-black flex items-center gap-3">
                  <div className="p-1.5 bg-purple-700 rounded-lg shadow-md">
                    <FileCheck className="text-white" size={18} />
                  </div>
                  <span>سجل طلبات تسليمات الأعمال وفحص الجودة بالموقع (IR / WIR)</span>
                  <span className="bg-white text-purple-700 text-[11px] font-black px-3 py-1 rounded-full border border-purple-200 shadow-sm">
                    {filteredSubs.length} سجلات معتمدة
                  </span>
                </h2>
              </div>
            </div>

            {filteredSubs.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 border border-slate-100 shadow-inner">
                  <FileText size={40} />
                </div>
                <p className="text-black text-lg font-black tracking-tight">لا توجد طلبات تسليم مسجلة حالياً</p>
                <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto font-bold leading-relaxed">ابدأ بالنقر على الزر أعلاه لإضافة أول طلب فحص هندسي معتمد للمشروع</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-black text-white font-black text-[11px] h-14 uppercase tracking-wider">
                      <th className="pr-8 py-2 text-right">رقم الطلب (REF)</th>
                      <th className="py-2 text-right">بند الأعمال والمواصفة</th>
                      <th className="py-2 text-center">المهندس المسؤول</th>
                      <th className="py-2 text-center">الاتجاه</th>
                      <th className="py-2 text-center">تاريخ الفحص</th>
                      <th className="py-2 text-center">تكرار التقديم</th>
                      <th className="py-2 text-center">الحالة النهائية</th>
                      <th className="pl-8 py-2 text-center w-44">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-black">
                    {filteredSubs.map((sub) => (
                      <tr key={sub.id} className="group h-20 hover:bg-slate-50 transition-all duration-300">
                        <td className="pr-8 py-2">
                          <span className="font-mono text-black bg-white px-3 py-2 rounded-xl border-2 border-black text-xs font-black shadow-sm group-hover:bg-purple-50 group-hover:border-purple-700 group-hover:text-purple-700 transition-all">
                            {sub.submissionNumber}
                          </span>
                        </td>
                        <td className="py-2">
                          <div className="max-w-xs space-y-1">
                            <div className="text-[14px] font-black leading-tight text-black group-hover:text-purple-700 transition-colors">
                              {sub.itemDescription}
                            </div>
                            {sub.locationDetails && (
                              <div className="font-mono text-[10px] text-purple-700 font-bold flex items-center gap-1.5 bg-purple-50 w-fit px-2 py-0.5 rounded-md border border-purple-100">
                                <MapPin size={10} className="text-purple-400" />
                                {sub.locationDetails}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center text-[11px] text-slate-600 font-bold">
                          {sub.engineerName}
                        </td>
                        <td className="py-2 text-center">
                          <span className="text-[11px] font-black text-black bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 group-hover:bg-purple-100 group-hover:border-purple-200 transition-colors">
                            {sub.direction}
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-xs text-black font-black">{sub.date}</span>
                            <span className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {sub.inspectionTime}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 shadow-sm ${
                            sub.submissionCount > 1 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-white text-black border-black group-hover:border-purple-700 group-hover:text-purple-700'
                          }`}>
                            {sub.submissionCount === 1 ? 'التقديم الأول' : `تكرار رقم ${sub.submissionCount}`}
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          {getStatusBadge(sub.status)}
                        </td>
                        <td className="pl-8 py-2">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تعديل الطلبات') : () => handleEditClick(sub)}
                              className={`p-2.5 rounded-xl transition-all shadow-sm border-2 ${
                                userRole === 'viewer' 
                                  ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50' 
                                  : 'text-black bg-white border-black hover:text-purple-700 hover:border-purple-700 hover:shadow-lg active:scale-90'
                              }`}
                              title="تعديل تفاصيل الطلب"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => printDocument(sub)}
                              className="p-2.5 bg-white border-2 border-black text-black hover:text-emerald-700 hover:border-emerald-600 rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-90"
                              title="تصدير وطباعة طلب الفحص المعتمد"
                            >
                              <Printer size={16} />
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => handleDelete(sub.id)}
                                className="p-2.5 bg-white border-2 border-black text-slate-400 hover:text-rose-600 hover:border-rose-600 rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-90"
                                title="حذف نهائياً"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Unified Add/Edit Form Overlay Interface */
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print animate-fade-in animate-duration-300" dir="rtl">
          <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl flex overflow-hidden min-h-[620px] max-h-[92vh]">
            {/* Left side: Main Content & Inputs */}
            <div className="flex-1 p-10 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Header inside left panel */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                  <h3 className="font-black text-2xl text-slate-900">
                    {isNew ? 'إضافة طلب جديد' : `تعديل الطلب: ${submissionNumber}`}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => { setIsEditing(false); setIsNew(false); setSelectedSub(null); }} 
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form id="submission-form" onSubmit={handleSave} className="space-y-8">
                  {/* Section 1: الأطراف والبند */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-xs font-black text-[#8676FF]">
                      <span className="text-lg font-black">|</span>
                      <span>المقاول والبند</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">نوع الأعمال / المادة *</label>
                        <select 
                          value={workCategory} 
                          onChange={(e) => setWorkCategory(e.target.value as WorkCategory)} 
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition appearance-none cursor-pointer outline-none"
                        >
                          <option value="مدنى">مدنى</option>
                          <option value="كهربا">كهربا</option>
                          <option value="معمارى">معمارى</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">المهندس المسؤول / المقاول *</label>
                        <select 
                          value={engineerName} 
                          onChange={(e) => setEngineerName(e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition appearance-none cursor-pointer outline-none"
                          required
                        >
                          <option value="">-- اختر المهندس / المقاول --</option>
                          {engineerName && !workers.some(w => w.name === engineerName) && (
                            <option value={engineerName}>{engineerName}</option>
                          )}
                          {workers.map(w => (
                            <option key={w.id} value={w.name}>{w.name} - {w.jobTitle}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: تفاصيل الموقع */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 mb-4 text-xs font-black text-teal-500">
                      <span className="text-lg font-black">|</span>
                      <span>تفاصيل الموقع</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">المساح المسؤول *</label>
                        <select 
                          value={surveyorName} 
                          onChange={(e) => setSurveyorName(e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition appearance-none cursor-pointer outline-none"
                          required
                        >
                          <option value="">-- اختر المساح --</option>
                          <option value="بدون أعمال مساحية">بدون أعمال مساحية</option>
                          {surveyorName && surveyorName !== 'بدون أعمال مساحية' && !workers.some(w => w.name === surveyorName) && (
                            <option value={surveyorName}>{surveyorName}</option>
                          )}
                          {workers.filter(w => w.jobTitle?.includes('مساح') || w.jobTitle?.includes('المساح')).map(w => (
                            <option key={w.id} value={w.name}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">مكان وتفاصيل الأعمال / الزون *</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="بحث رقم المنطقة أو الزون..." 
                            value={locationDetails} 
                            onChange={(e) => setLocationDetails(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded-[20px] py-4 pr-12 pl-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none" 
                            required 
                          />
                          <MapPin size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: المخططات والوصف */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 mb-4 text-xs font-black text-purple-500">
                      <span className="text-lg font-black">|</span>
                      <span>المخططات والوصف والماليات</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">رقم الطلب / الاستمارة *</label>
                        <input 
                          type="text" 
                          value={submissionNumber}
                          onChange={(e) => setSubmissionNumber(e.target.value)}
                          placeholder="IR-202X-XXX"
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">تاريخ تقديم البيان *</label>
                        <input 
                          type="date" 
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">وصف العمل / البند بالكامل *</label>
                        <input 
                          type="text" 
                          value={itemDescription}
                          onChange={(e) => setItemDescription(e.target.value)}
                          placeholder="مثال: طبقة الأساس المساعد المدموكة..."
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">رقم تكرار التقديم *</label>
                        <select
                          value={submissionCount}
                          onChange={(e) => setSubmissionCount(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition appearance-none cursor-pointer outline-none"
                        >
                          <option value={1}>التقديم الأول (Original Submission)</option>
                          <option value={2}>إعادة تقديم رقم 2</option>
                          <option value={3}>إعادة تقديم رقم 3</option>
                          <option value={4}>إعادة تقديم رقم 4</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">المنسوب الفعلي (أو المرجع)</label>
                        <input 
                          type="text" 
                          value={levelElevation}
                          onChange={(e) => setLevelElevation(e.target.value)}
                          placeholder="مثال: +42.000"
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">الطول (م ط)</label>
                        <input 
                          type="text" 
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                          placeholder="متر طولي..."
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">المسطح (م٢)</label>
                        <input 
                          type="text" 
                          value={areaArea}
                          onChange={(e) => setAreaArea(e.target.value)}
                          placeholder="متر مربع..."
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">تاريخ الفحص المطلوب</label>
                        <input 
                          type="date" 
                          value={inspectionDate}
                          onChange={(e) => setInspectionDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">الميعاد / التوقيت المفضل</label>
                        <input 
                          type="text" 
                          value={inspectionTime}
                          onChange={(e) => setInspectionTime(e.target.value)}
                          placeholder="12:00 م"
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">الاتجاه</label>
                        <select
                          value={direction}
                          onChange={(e) => setDirection(e.target.value as DirectionCategory)}
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition appearance-none cursor-pointer outline-none"
                        >
                          <option value="شمال (North)">شمال (North)</option>
                          <option value="جنوب (South)">جنوب (South)</option>
                          <option value="شرق (East)">شرق (East)</option>
                          <option value="غرب (West)">غرب (West)</option>
                          <option value="شمال شرق">شمال شرق</option>
                          <option value="شمال غرب">شمال غرب</option>
                          <option value="جنوب شرق">جنوب شرق</option>
                          <option value="جنوب غرب">جنوب غرب</option>
                          <option value="قبلي">قبلي</option>
                          <option value="بحرى">بحرى</option>
                          <option value="اخرى">اخرى</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-1">القرار الهندسي / الحالة النهائية</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 text-sm font-bold text-slate-700 focus:border-[#C8C2F5] focus:ring-1 focus:ring-[#C8C2F5] transition appearance-none cursor-pointer outline-none"
                        >
                          <option value="Pending">قيد الفحص والانتظار</option>
                          <option value="Approved">معتمد وموافق كلياً</option>
                          <option value="ApprovedWithRemarks">موافق بملاحظات هندسية</option>
                          <option value="Rejected">مرفوض ويعاد تقديمه</option>
                          <option value="SurveyRejected">مرفوض مساحياً</option>
                        </select>
                      </div>

                      {/* QA & Verification Fields nested elegantly */}
                      <div className="col-span-2 mt-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <span className="text-xs font-black text-slate-500 block">تدقيق الجودة والفحوصات الفنية (الرصد والملاحظات)</span>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1">أعمال مساحية</label>
                            <select value={surveyStatus} onChange={(e) => setSurveyStatus(e.target.value as InspectionStatus)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none">
                              <option value="none">بدون أعمال مساحية</option>
                              <option value="accepted">مقبول</option>
                              <option value="remarked">مقبول بملاحظات</option>
                              <option value="rejected">مرفوض</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1">جودة واختبارات</label>
                            <select value={qualityStatus} onChange={(e) => setQualityStatus(e.target.value as InspectionStatus)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none">
                              <option value="none">لا يوجد</option>
                              <option value="accepted">مقبول</option>
                              <option value="remarked">مقبول بملاحظات</option>
                              <option value="rejected">مرفوض</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1">اعتماد استشاري</label>
                            <select value={consultantStatus} onChange={(e) => setConsultantStatus(e.target.value as ConsultantInspectionStatus)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none">
                              <option value="accepted">مقبول</option>
                              <option value="remarked">مقبول بملاحظات</option>
                              <option value="rejected">مرفوض</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1">ملاحظات المسّاح</label>
                            <input type="text" value={surveyNotes} onChange={(e) => setSurveyNotes(e.target.value)} placeholder="ملاحظات المسّاح الفنية..." className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-1 mr-1">ملاحظات مختبر الجودة</label>
                            <input type="text" value={labNotes} onChange={(e) => setLabNotes(e.target.value)} placeholder="نتائج الدمك والكسر الفنية..." className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Action Buttons at the Bottom of Left Content Panel */}
              <div className="flex justify-between items-center gap-4 mt-10 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsEditing(false); setIsNew(false); setSelectedSub(null); }} 
                  className="w-48 py-4 bg-[#F8F9FB] text-slate-600 rounded-[24px] text-sm font-bold hover:bg-slate-100 transition duration-200 text-center border border-slate-100"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  form="submission-form" 
                  className="flex-1 py-4 bg-[#C8C2F5] text-white rounded-[24px] text-sm font-black hover:bg-[#B5ADF0] shadow-sm transition duration-200 text-center"
                >
                  اعتماد وتسجيل الطلب
                </button>
              </div>
            </div>

            {/* Right side: Beautiful Sidebar Status Panel */}
            <div className="w-96 bg-[#F8F9FB] border-r border-slate-100 p-10 flex flex-col justify-between">
              <div className="space-y-6 mt-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-[#E8E6FC] text-[#8676FF] rounded-3xl flex items-center justify-center rotate-3 mb-4 shadow-sm">
                  <FileCheck size={36} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-black text-2xl text-slate-900 mb-3">تسجيل تسليم</h4>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[260px] mx-auto font-medium">
                    نظام تسجيل طلبات تسليم الأعمال لربط المهندسين وموقع المشروع بدقة تامة.
                  </p>
                </div>
              </div>

              {/* Progression Tracker Steps */}
              <div className="mt-16 space-y-5 px-4 pb-12">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-[#8676FF]">1. الأطراف والبند</div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="w-1.5 h-4 bg-[#8676FF] rounded-full"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-slate-400">2. تفاصيل الموقع</div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-slate-400">3. المخططات والوصف</div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden font-sans animate-scale-up">
            {/* Modal Header - Matching Form Header Style */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-700 rounded-lg shadow-md shadow-purple-200">
                  <Trash2 className="text-white" size={20} />
                </div>
                <h3 className="text-black font-black text-lg">
                  {confirmState.title}
                </h3>
              </div>
              <button 
                onClick={() => { setConfirmState(null); setDeleteCode(''); }}
                className="text-slate-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Section style like the form */}
              <div className="border-r-4 border-purple-700 pr-4 py-1">
                <p className="text-slate-900 text-sm font-black leading-relaxed">
                  {confirmState.message}
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-purple-700 font-black flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                    <ShieldCheck size={12} />
                    كود التحقق المطلوب:
                  </span>
                  <span className="text-2xl font-black tracking-widest text-black select-none opacity-80">
                    {confirmState.randomCode}
                  </span>
                </div>
                
                <div className="relative">
                  <input 
                    type="text"
                    value={deleteCode}
                    onChange={(e) => setDeleteCode(e.target.value)}
                    placeholder="أدخل الكود الموضح أعلاه"
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 text-center font-black text-black text-xl outline-none focus:ring-4 focus:ring-purple-700/10 transition-all placeholder:text-slate-300 shadow-sm"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold text-center">يرجى كتابة الكود بدقة لتأكيد الحذف النهائي</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (deleteCode === confirmState.randomCode) {
                      confirmState.onConfirm();
                      setConfirmState(null);
                      setDeleteCode('');
                    } else {
                      alert('عذراً، كود التحقق غير صحيح. يرجى إدخال الكود الموضح باللون الأسود أعلاه.');
                    }
                  }}
                  className="py-4 bg-black hover:bg-slate-900 text-white text-sm font-black rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  تأكيد الحذف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmState(null);
                    setDeleteCode('');
                  }}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-black rounded-xl transition-all border border-slate-200 active:scale-95"
                >
                  إلغاء الأمر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
