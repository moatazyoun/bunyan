import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Printer, 
  ArrowRight, 
  Check, 
  CheckCircle,
  AlertTriangle, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  FileCheck,
  Building
} from 'lucide-react';
import { Submission, SubmissionWorkDetails, SubmissionSignatories } from '../types';

interface SubmissionsTabProps {
  projectId: string;
  submissions: Submission[];
  setSubmissions: (subs: Submission[]) => void;
  userRole?: string;
  userNameAr?: string;
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
  userNameAr 
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

  // Form Fields
  const [submissionNumber, setSubmissionNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionTime, setInspectionTime] = useState('12:00 م');
  const [itemDescription, setItemDescription] = useState('');
  const [levelElevation, setLevelElevation] = useState('');
  const [executingContractor, setExecutingContractor] = useState('م/ فوزي الرفاعي');
  const [direction, setDirection] = useState('القبلي');
  const [length, setLength] = useState('');
  const [areaArea, setAreaArea] = useState('');
  const [stationFrom, setStationFrom] = useState('');
  const [stationTo, setStationTo] = useState('');
  const [submissionCount, setSubmissionCount] = useState<number>(1);
  const [remarks, setRemarks] = useState('');
  
  // Checkbox/Radio selections
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [selectedSoilType, setSelectedSoilType] = useState<string>('تربة صالحة');
  const [customWorkType, setCustomWorkType] = useState('');
  const [workTypesList, setWorkTypesList] = useState<string[]>(DEFAULT_WORK_TYPES);
  
  // Technical Inspection Details
  const [visualInspection, setVisualInspection] = useState<'accepted' | 'rejected' | 'pending'>('pending');
  const [visualInspectionNotes, setVisualInspectionNotes] = useState('');
  
  const [surveyLevels, setSurveyLevels] = useState<'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending'>('pending');
  const [materialSuitability, setMaterialSuitability] = useState<'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending'>('pending');
  const [executionOperations, setExecutionOperations] = useState<'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending'>('pending');
  const [sectionWidth, setSectionWidth] = useState<'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending'>('pending');
  const [currentWidth, setCurrentWidth] = useState('');
  
  const [surveyNotes, setSurveyNotes] = useState('');
  const [labNotes, setLabNotes] = useState('');
  
  const [status, setStatus] = useState<'Approved' | 'ApprovedWithRemarks' | 'Rejected' | 'Pending'>('Pending');
  
  // Signatories
  const [contractorEngineer, setContractorEngineer] = useState('');
  const [surveyConsultant, setSurveyConsultant] = useState('');
  const [qaEngineer, setQaEngineer] = useState('أ.د / خالد قنديل');
  const [generalConsultant, setGeneralConsultant] = useState('');

  // Filter actual site submissions
  const filteredSubs = submissions.filter(s => {
    const matchesSearch = 
      s.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.submissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.executingContractor.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    setExecutingContractor(submissions[0]?.executingContractor || 'م/ فوزي الرفاعي');
    setDirection('القبلي');
    setLength('');
    setAreaArea('');
    setStationFrom('');
    setStationTo('');
    setSubmissionCount(1);
    setRemarks('');
    setSelectedWorkTypes([]);
    setSelectedSoilType('تربة صالحة');
    setVisualInspection('pending');
    setVisualInspectionNotes('');
    setSurveyLevels('pending');
    setMaterialSuitability('pending');
    setExecutionOperations('pending');
    setSectionWidth('pending');
    setCurrentWidth('');
    setSurveyNotes('');
    setLabNotes('');
    setStatus('Pending');
    setContractorEngineer(userNameAr || '');
    setSurveyConsultant('');
    setQaEngineer('أ.د / خالد قنديل');
    setGeneralConsultant('');
    
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
    setExecutingContractor(sub.executingContractor);
    setDirection(sub.direction);
    setLength(sub.length || '');
    setAreaArea(sub.areaArea || '');
    setStationFrom(sub.stationFrom);
    setStationTo(sub.stationTo);
    setSubmissionCount(sub.submissionCount);
    setRemarks(sub.remarks || '');
    setSelectedWorkTypes(sub.workTypes || []);
    setSelectedSoilType(sub.soilType || 'تربة صالحة');
    setVisualInspection(sub.visualInspection || 'pending');
    setVisualInspectionNotes(sub.visualInspectionNotes || '');
    
    setSurveyLevels(sub.workDetails?.surveyLevels || 'pending');
    setMaterialSuitability(sub.workDetails?.materialSuitability || 'pending');
    setExecutionOperations(sub.workDetails?.executionOperations || 'pending');
    setSectionWidth(sub.workDetails?.sectionWidth || 'pending');
    setCurrentWidth(sub.workDetails?.currentWidth || '');
    
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
    
    if (!itemDescription || !stationFrom || !stationTo) {
      alert('يرجى ملء البيانات الأساسية: بند الأعمال، والمحطات (من - إلى)');
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
      executingContractor,
      direction,
      length,
      areaArea,
      stationFrom,
      stationTo,
      submissionCount,
      remarks,
      workTypes: selectedWorkTypes,
      soilType: selectedSoilType,
      visualInspection,
      visualInspectionNotes,
      status,
      workDetails: {
        surveyLevels,
        materialSuitability,
        executionOperations,
        sectionWidth,
        currentWidth
      },
      surveyNotes,
      labNotes,
      signatories: {
        contractorEngineer,
        surveyConsultant,
        qaEngineer,
        generalConsultant
      }
    };

    let updatedList: Submission[];
    if (isNew) {
      updatedList = [...submissions, payload];
    } else {
      updatedList = submissions.map(s => s.id === payload.id ? payload : s);
    }

    setSubmissions(updatedList);
    setIsEditing(false);
    setSelectedSub(null);
    setIsNew(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
      setSubmissions(submissions.filter(s => s.id !== id));
      if (selectedSub?.id === id) {
        setIsEditing(false);
        setSelectedSub(null);
      }
    }
  };

  const handleAddCustomWorkType = () => {
    if (customWorkType.trim() && !workTypesList.includes(customWorkType.trim())) {
      setWorkTypesList([...workTypesList, customWorkType.trim()]);
      setSelectedWorkTypes([...selectedWorkTypes, customWorkType.trim()]);
      setCustomWorkType('');
    }
  };

  const toggleWorkType = (type: string) => {
    if (selectedWorkTypes.includes(type)) {
      setSelectedWorkTypes(selectedWorkTypes.filter(t => t !== type));
    } else {
      setSelectedWorkTypes([...selectedWorkTypes, type]);
    }
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-150 rounded-lg shadow-sm">✔️ معتمد وموافق</span>;
      case 'ApprovedWithRemarks':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black text-amber-800 bg-amber-50 border border-amber-150 rounded-lg shadow-sm">⚠️ موافق بملاحظات</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black text-rose-800 bg-rose-50 border border-rose-150 rounded-lg shadow-sm">❌ مرفوض ويعاد تقديمه</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black text-indigo-800 bg-indigo-50 border border-indigo-150 rounded-lg shadow-sm">⏱️ قيد الانتظار</span>;
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
            <div className="flex flex-col items-center justify-center border-x-2 border-slate-300 px-2">
              <div className="border-2 border-blue-600 p-1.5 rounded-md mb-1 bg-blue-50/50">
                <Building size={24} className="text-blue-600" />
              </div>
              <p className="font-black text-[14px] leading-none mb-1 text-slate-900">مكتب هندسي استشاري</p>
              <p className="font-black text-[11px] text-indigo-700">أ . د / خالد قنديل</p>
            </div>
            <div>
              <p className="font-extrabold text-[12px]">الشركة المنفذة</p>
              <p className="font-black text-[13px] text-[#cc1111]">{printSub.executingContractor}</p>
              <p className="text-[10px] text-slate-500">للأعمال الإنشائية ومقاولات الطرق</p>
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
              <th className="border-2 border-slate-950 w-28">البند المراد فحصه</th>
              <th className="border-2 border-slate-950 w-16">المنسوب</th>
              <th className="border-2 border-slate-950 w-24">الشركة المنفذة</th>
              <th className="border-2 border-slate-950 w-16">الإتجاه</th>
              <th className="border-2 border-slate-950 w-16">الطول</th>
              <th className="border-2 border-slate-950 w-16">المسطح</th>
              <th className="border-2 border-slate-950 w-28" colSpan={2}>المحطة (الاستيشن)</th>
              <th className="border-2 border-slate-950 w-14">تقديم الطلب</th>
              <th className="border-2 border-slate-950 w-16">موعد الفحص</th>
              <th className="border-2 border-slate-950 w-20">ملاحظات</th>
            </tr>
            <tr className="bg-slate-55 text-[9.5px] h-6 font-bold text-slate-700">
              <td className="border-2 border-slate-950" colSpan={6}></td>
              <td className="border-2 border-slate-950 font-black">من</td>
              <td className="border-2 border-slate-950 font-black">إلى</td>
              <td className="border-2 border-slate-950 font-black" colSpan={3}></td>
            </tr>
          </thead>
          <tbody>
            <tr className="h-12 font-black text-slate-800">
              <td className="border-2 border-slate-950 p-2 text-right leading-tight">{printSub.itemDescription}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.levelElevation || '-'}</td>
              <td className="border-2 border-slate-950">{printSub.executingContractor}</td>
              <td className="border-2 border-slate-950">{printSub.direction}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.length ? `${printSub.length} م` : '-'}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.areaArea ? `${printSub.areaArea} م٢` : '-'}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.stationFrom}</td>
              <td className="border-2 border-slate-950 font-mono">{printSub.stationTo}</td>
              <td className="border-2 border-slate-950 text-indigo-700">
                {printSub.submissionCount === 1 && 'الأول'}
                {printSub.submissionCount === 2 && 'الثاني (Re-2)'}
                {printSub.submissionCount === 3 && 'الثالث (Re-3)'}
                {printSub.submissionCount > 3 && `تكرار ${printSub.submissionCount}`}
              </td>
              <td className="border-2 border-slate-950 font-mono">
                <div>{printSub.inspectionDate}</div>
                <div className="text-[10px] text-slate-650 mt-0.5">{printSub.inspectionTime}</div>
              </td>
              <td className="border-2 border-slate-950 p-1 text-slate-600 font-medium text-[9.5px] leading-tight">
                {printSub.remarks || 'مطابق أصول الصناعة'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Detail Inspection Form Block Modeled on PDF 2 */}
        <div className="border-4 border-slate-950 p-4 mb-4 page-break-avoid">
          <div className="text-center font-black text-[12px] underline mb-4">
            طلب إستلام أعمال (تفاصيل الاستمارة الهندسية المعتمدة لقطاع الطرق)
          </div>

          {/* Section: Work Type Grid (مع نوع الأعمال) */}
          <div className="mb-4">
            <span className="font-extrabold text-[11px] bg-slate-950 text-white px-2 py-0.5 ml-2">نوع الأعمال المراد استلامها:</span>
            <div className="grid grid-cols-3 gap-y-2 mt-3 p-3 bg-slate-50 border border-slate-950 text-[10px]">
              {(printSub.workTypes && printSub.workTypes.length > 0 ? printSub.workTypes : DEFAULT_WORK_TYPES).map((wt) => {
                const checked = printSub.workTypes?.includes(wt);
                return (
                  <div key={wt} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 border border-slate-950 rounded flex items-center justify-center font-bold font-mono text-[9px] ${checked ? 'bg-slate-900 text-white' : 'bg-transparent'}`}>
                      {checked ? '✓' : ''}
                    </div>
                    <span className={checked ? 'font-black text-slate-900' : 'text-slate-600'}>{wt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Section: Soil Type */}
            <div className="border border-slate-950 p-3 bg-slate-50/50">
              <span className="font-extrabold bg-slate-800 text-white px-2 py-0.5">نوع وحالة التربة:</span>
              <div className="flex gap-4 mt-2 font-black">
                {DEFAULT_SOIL_TYPES.map(st => {
                  const active = printSub.soilType === st;
                  return (
                    <div key={st} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-slate-900' : ''}`}>
                        {active && <span className="block w-1.5 h-1.5 bg-white rounded-full"></span>}
                      </div>
                      <span>{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section: Visual Inspection */}
            <div className="border border-slate-950 p-3 bg-slate-50/50">
              <span className="font-extrabold bg-slate-800 text-white px-2 py-0.5">أعمال الفحص البصري بالموقع:</span>
              <div className="flex gap-4 mt-2 font-black">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${printSub.visualInspection === 'accepted' ? 'bg-emerald-100 text-emerald-900 border border-emerald-950' : 'opacity-40'}`}>
                  ☑️ مقبول مبدئياً
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${printSub.visualInspection === 'rejected' ? 'bg-rose-100 text-rose-900 border border-slate-950 font-black' : 'opacity-40'}`}>
                  ☒ مرفوض بالعين المجردة
                </span>
              </div>
              {printSub.visualInspectionNotes && (
                <p className="mt-2 text-[10px] text-rose-600 font-bold border-t border-slate-200 pt-1.5">ملاحظة: {printSub.visualInspectionNotes}</p>
              )}
            </div>
          </div>

          {/* Section: Technical Works Matrix (وصف الأعمال) */}
          <div className="mb-4">
            <span className="font-extrabold text-[11px] bg-slate-950 text-white px-2 py-0.5">المعايير الهندسية الأربعة لوصف الأعمال وإثباتها:</span>
            <table className="w-full border-collapse border border-slate-950 text-center mt-2.5">
              <thead>
                <tr className="bg-slate-100 font-extrabold h-8">
                  <th className="border border-slate-950 w-2/5">المعيار الفني الهندسي والوصفي للعمل</th>
                  <th className="border border-slate-950">مستوفى ومقبول</th>
                  <th className="border border-slate-950">مستوفى بملاحظات</th>
                  <th className="border border-slate-950">غير مستوفى / مرفوض</th>
                  <th className="border border-slate-950">ملاحظات وقياسات الفاحص</th>
                </tr>
              </thead>
              <tbody className="font-black">
                {/* Row 1: Survey Levels */}
                <tr className="h-8">
                  <td className="border border-slate-950 text-right px-2 font-bold bg-slate-50">1- مناسيب الأعمال المساحية والطوبوغرافية</td>
                  <td className="border border-slate-950">{printSub.workDetails?.surveyLevels === 'accepted' ? '✅' : ''}</td>
                  <td className="border border-slate-950">{printSub.workDetails?.surveyLevels === 'accepted_with_remarks' ? '✔️' : ''}</td>
                  <td className="border border-slate-950">{printSub.workDetails?.surveyLevels === 'rejected' ? '❌' : ''}</td>
                  <td className="border border-slate-950 font-normal font-mono">{printSub.workDetails?.surveyLevels === 'pending' ? 'جاري الفحص الموقعي للميزان' : 'مطابق للوح'}</td>
                </tr>
                {/* Row 2: Material Suitability */}
                <tr className="h-8">
                  <td className="border border-slate-950 text-right px-2 font-bold bg-slate-50">2- صلاحية المواد ومطابقتها للمواصفات ومخدر السحق</td>
                  <td className="border border-slate-900">{printSub.workDetails?.materialSuitability === 'accepted' ? '✅' : ''}</td>
                  <td className="border border-slate-900">{printSub.workDetails?.materialSuitability === 'accepted_with_remarks' ? '✔️' : ''}</td>
                  <td className="border border-slate-900">{printSub.workDetails?.materialSuitability === 'rejected' ? '❌' : ''}</td>
                  <td className="border border-slate-900 font-normal">{printSub.workDetails?.materialSuitability === 'pending' ? 'انتظار الفحص المختبري' : 'تم مراجعة الشهادات المعتمدة'}</td>
                </tr>
                {/* Row 3: Operation Quality */}
                <tr className="h-8">
                  <td className="border border-slate-950 text-right px-2 font-bold bg-slate-50">3- أعمال التشغيل والدمك والرش بالماء للموقع</td>
                  <td className="border border-slate-950">{printSub.workDetails?.executionOperations === 'accepted' ? '✅' : ''}</td>
                  <td className="border border-slate-950">{printSub.workDetails?.executionOperations === 'accepted_with_remarks' ? '✔️' : ''}</td>
                  <td className="border border-slate-950">{printSub.workDetails?.executionOperations === 'rejected' ? '❌' : ''}</td>
                  <td className="border border-slate-950 font-normal text-[9.5px]">بنسبة دمك تزيد عن ٩٥٪ جاف قياسي</td>
                </tr>
                {/* Row 4: Section Width */}
                <tr className="h-8">
                  <td className="border border-slate-950 text-right px-2 font-bold bg-slate-50">4- عـرض القطاع المتصل من كتف الطريق لكتفه</td>
                  <td className="border border-slate-950">{printSub.workDetails?.sectionWidth === 'accepted' ? '✅' : ''}</td>
                  <td className="border border-slate-950">{printSub.workDetails?.sectionWidth === 'accepted_with_remarks' ? '✔️' : ''}</td>
                  <td className="border border-slate-950">{printSub.workDetails?.sectionWidth === 'rejected' ? '❌' : ''}</td>
                  <td className="border border-slate-950 font-mono font-bold text-center bg-indigo-50/50">
                    {printSub.workDetails?.currentWidth ? `العرض الفعلي: ${printSub.workDetails.currentWidth} م` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Survey & Lab Logs */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="border border-slate-950 p-2.5 bg-slate-50">
              <span className="font-extrabold text-[10px] text-slate-800">ملاحظات ونتائج الرفع المساحي الموقعي:</span>
              <p className="mt-1 font-black text-slate-700 min-h-12 border-t border-slate-200 pt-1">
                {printSub.surveyNotes || '✓ تم مطابقة المناسيب مع نقاط الربط المرجعية بنجاح دون عجز.'}
              </p>
            </div>
            <div className="border border-slate-950 p-2.5 bg-slate-50">
              <span className="font-extrabold text-[10px] text-slate-800">ملاحظات مختبر ضبط الجودة والمعمل الفني:</span>
              <p className="mt-1 font-black text-slate-700 min-h-12 border-t border-slate-200 pt-1">
                {printSub.labNotes || '✓ موقف العينة مقبول هندسياً ومطابق للمواصفات الفنية العسكرية.'}
              </p>
            </div>
          </div>
        </div>

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
                🔴 مرفوض تماماً ويعاد تقديمه
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
      {/* Top action dashboard */}
      {!isEditing && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="sub-management-controls">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text"
              placeholder="البحث برقم الطلب، أو البند، أو الشركة المنفذة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl text-xs md:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 text-xs font-semibold ml-1">تصفية الحالة:</span>
            {['All', 'Pending', 'Approved', 'ApprovedWithRemarks', 'Rejected'].map(s => {
              const label = 
                s === 'All' ? 'الكل' :
                s === 'Pending' ? 'قيد الانتظار' :
                s === 'Approved' ? 'معتمد وموافق' :
                s === 'ApprovedWithRemarks' ? 'موافق بملاحظات' : 'مرفوض';
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
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <Plus size={16} />
            <span>تسجيل طلب فحص / تسليم جديد</span>
          </button>
        </div>
      )}

      {/* Main Listing View */}
      {!isEditing ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-1">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2">
              <FileCheck className="text-indigo-600" size={18} />
              <span>جدول طلبات تسليمات الأعمال وفحص الجودة بالموقع</span>
              <span className="bg-indigo-50 text-indigo-700 text-[11px] font-black px-2 py-0.5 rounded-md border border-indigo-100">
                {filteredSubs.length} سجلات
              </span>
            </h2>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-4 border border-indigo-150">
                <FileText size={26} />
              </div>
              <p className="text-slate-500 text-sm font-bold">لا توجد طلبات تسليم مسجلة حالياً.</p>
              <p className="text-slate-400 text-xs mt-1">ابدأ بالنقر على "تسجيل طلب فحص / تسليم جديد" لإضافة أحدث الأعمال الموقعية.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold h-11 border-b border-slate-200">
                    <th className="pr-4 py-2 text-right">رقم الطلب</th>
                    <th className="py-2 text-right">بند العمل</th>
                    <th className="py-2 text-center">المحطة (الاستيشن)</th>
                    <th className="py-2 text-center">الاتجاه</th>
                    <th className="py-2 text-center">التاريخ</th>
                    <th className="py-2 text-center">التكرار</th>
                    <th className="py-2 text-center">الحالة النهائية</th>
                    <th className="pl-4 py-2 text-center w-36">التحكم والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-black">
                  {filteredSubs.map((sub) => (
                    <tr key={sub.id} className="h-14 hover:bg-slate-50/50 transition">
                      <td className="pr-4 py-2 font-mono text-indigo-600">{sub.submissionNumber}</td>
                      <td className="py-2 max-w-xs truncate font-bold text-slate-800">
                        <div>{sub.itemDescription}</div>
                        <div className="font-mono text-[9px] text-slate-400 font-normal mt-0.5">{sub.executingContractor}</div>
                      </td>
                      <td className="py-2 text-center font-mono text-slate-705">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">من {sub.stationFrom}</span>
                        <span className="mx-1 font-normal text-slate-400">إلى</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{sub.stationTo}</span>
                      </td>
                      <td className="py-2 text-center">
                        <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {sub.direction}
                        </span>
                      </td>
                      <td className="py-2 text-center font-mono text-slate-500">{sub.date}</td>
                      <td className="py-2 text-center">
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 font-black px-1.5 py-0.5 rounded-md border border-indigo-100/40">
                          {sub.submissionCount === 1 ? 'الأولى' : `تكرار ${sub.submissionCount}`}
                        </span>
                      </td>
                      <td className="py-2 text-center">{getStatusBadge(sub.status)}</td>
                      <td className="pl-4 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تعديل الطلبات') : () => handleEditClick(sub)}
                            className={`p-1.5 rounded-lg transition ${
                              userRole === 'viewer' 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title="تعديل تفاصيل الطلب"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => printDocument(sub)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="تصدير وطباعة طلب الفحص المعتمد"
                          >
                            <Printer size={14} />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف نهائياً"
                            >
                              <Trash2 size={14} />
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
      ) : (
        /* Edit / Add New Form View */
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-6" id="sub-form">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setSelectedSub(null); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition ml-2"
              >
                <ArrowRight size={18} />
              </button>
              <h1 className="text-base md:text-lg font-black text-slate-900">
                {isNew ? 'تسجيل وإرسال طلب تسليم وفحص أعمال جديد' : `تعديل طلب تسليم جاري: ${submissionNumber}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-bold">حالة الطلب:</span>
              <select
                value={status}
                disabled={userRole === 'viewer'}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200 ${
                  userRole === 'viewer'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 text-indigo-700'
                }`}
              >
                <option value="Pending">⏱️ قيد الفحص والانتظار</option>
                <option value="Approved">✔️ موافق ومعتمد كلياً</option>
                <option value="ApprovedWithRemarks">⚠️ معتمد مع عمل الملاحظات</option>
                <option value="Rejected">❌ مرفوض ويعاد تقديمه</option>
              </select>
            </div>
          </div>

          {/* Section A: Basic project metadata */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 flex items-center gap-1.5">
              <Building size={16} className="text-indigo-600" />
              <span>بيانات المشروع والعملية الأساسية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">رقم الاستمارة / الطلب:</label>
                <input 
                  type="text"
                  value={submissionNumber}
                  onChange={(e) => setSubmissionNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm bg-slate-50 font-mono font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">الشركة المنفذة:</label>
                <input 
                  type="text"
                  value={executingContractor}
                  onChange={(e) => setExecutingContractor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">تاريخ تقديم البيان:</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-mono font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">رقم تكرار التقديم:</label>
                <select
                  value={submissionCount}
                  onChange={(e) => setSubmissionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-black bg-white"
                >
                  <option value={1}>التقديم الأول (Original Submission)</option>
                  <option value={2}>إعادة تقديم ثانية (Re-Submission 2)</option>
                  <option value={3}>إعادة تقديم ثالثة (Re-Submission 3)</option>
                  <option value={4}>إعادة تقديم رابعة (Re-Submission 4)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Block Location & Target details */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 flex items-center gap-1.5">
              <MapPin size={16} className="text-indigo-600" />
              <span>موضع ونوع الأعمال المراد فحصها</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">وصف العمل / البند بالكامل:</label>
                <input 
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="مثال: إطماء ميول وصندوق / توريد سن طبقة أساسية"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">المنسوب الفعلي (أو المرجع):</label>
                <input 
                  type="text"
                  value={levelElevation}
                  onChange={(e) => setLevelElevation(e.target.value)}
                  placeholder="مثال: القبلي / منسوب قاع الحفر"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">من محطة (الاستيشن):</label>
                <input 
                  type="text"
                  value={stationFrom}
                  onChange={(e) => setStationFrom(e.target.value)}
                  placeholder="مثال: 41+780"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-mono font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">إلى محطة (الاستيشن):</label>
                <input 
                  type="text"
                  value={stationTo}
                  onChange={(e) => setStationTo(e.target.value)}
                  placeholder="مثال: 41+840"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-mono font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">الطول بالمتر الخطي:</label>
                <input 
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="مثال: 40 م"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-mono font-black"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">المسطح بالمتر المربع:</label>
                <input 
                  type="text"
                  value={areaArea}
                  onChange={(e) => setAreaArea(e.target.value)}
                  placeholder="مثال: 120 م٢"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-mono font-black"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">الاتجاه الجغرافي:</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-black bg-white"
                >
                  <option value="القبلي">القبلي (قبلي)</option>
                  <option value="البحري">البحري (بحري)</option>
                  <option value="الرئيسي">اليمين الرئيسي</option>
                  <option value="اليسار الفرعي">اليسار الفرعي</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">التاريخ المطلوب للفحص:</label>
                <input 
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-mono font-black"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">الميعاد / التوقيت المفضل للفحص:</label>
                <input 
                  type="text"
                  value={inspectionTime}
                  onChange={(e) => setInspectionTime(e.target.value)}
                  placeholder="مثال: 12:00 م"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs md:text-sm font-black"
                />
              </div>
            </div>
          </div>

          {/* Section C: Project-wise specific options like workType & soilType */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 flex items-center justify-between">
              <span>الفحص والتدقيق الموقعي (خاص بالمشاريع)</span>
              <span className="text-[10px] text-slate-400 font-bold">يمكنك تحديد خيارات الجودة أدناه</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checkboxes: Work Types */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <span className="block text-xs font-black text-indigo-700">توصيف عناصر الأعمال للفحص البصري:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-48 overflow-y-auto pr-1">
                  {workTypesList.map(type => {
                    const checked = selectedWorkTypes.includes(type);
                    return (
                      <label key={type} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-100 transition">
                        <input 
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWorkType(type)}
                          className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 rounded"
                        />
                        <span className="text-[11px] font-bold text-slate-700">{type}</span>
                      </label>
                    );
                  })}
                </div>
                {/* Custom Work Type Adder */}
                <div className="flex gap-2 border-t border-slate-250 pt-2">
                  <input 
                    type="text"
                    value={customWorkType}
                    onChange={(e) => setCustomWorkType(e.target.value)}
                    placeholder="إضافة نوع عمل مخصص للعملية..."
                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomWorkType}
                    className="px-3 py-1 bg-indigo-600 text-white font-extrabold text-[11px] rounded hover:bg-indigo-700 transition"
                  >
                    أضف
                  </button>
                </div>
              </div>

              {/* Radios: Soil Type */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-black text-indigo-700 mb-2">نوع عينات التربة الحالية:</span>
                  <div className="flex gap-4">
                    {DEFAULT_SOIL_TYPES.map(st => (
                      <label key={st} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio"
                          name="soilType"
                          value={st}
                          checked={selectedSoilType === st}
                          onChange={(e) => setSelectedSoilType(e.target.value)}
                          className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Visual inspection controls */}
                <div className="border-t border-slate-200 pt-3">
                  <label className="block text-xs font-black text-indigo-700 mb-2">أعمال الفحص البصري الفوري بالموقع:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio"
                        name="visualInspection"
                        value="accepted"
                        checked={visualInspection === 'accepted'}
                        onChange={() => setVisualInspection('accepted')}
                        className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">☑️ مقبول مبدئياً</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio"
                        name="visualInspection"
                        value="rejected"
                        checked={visualInspection === 'rejected'}
                        onChange={() => setVisualInspection('rejected')}
                        className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-700">☒ مرفوض بالعين المجردة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio"
                        name="visualInspection"
                        value="pending"
                        checked={visualInspection === 'pending'}
                        onChange={() => setVisualInspection('pending')}
                        className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700">⏱️ قيد التفتيش</span>
                    </label>
                  </div>
                  <input 
                    type="text"
                    value={visualInspectionNotes}
                    onChange={(e) => setVisualInspectionNotes(e.target.value)}
                    placeholder="ملاحظات وشروط الفحص البصري للموقع..."
                    className="w-full mt-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Detailed Work Checklist (وصف الأعمال) */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 flex items-center justify-between">
              <span>الفحص الفني التفصيلي واستيفاء الشروط الموقعية للسلامة والجودة</span>
              <span className="text-[10px] text-[#cc1111] font-black">أدخل تقييم الفحوصات الطوبوغرافية والهندسية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl">
                <span className="block text-xs font-black text-indigo-800">1- طوبوغرافيا ومناسيب الأعمال المساحية:</span>
                <select
                  value={surveyLevels}
                  onChange={(e) => setSurveyLevels(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-black bg-white"
                >
                  <option value="pending">⏱️ جاري الفحص والمطابقة</option>
                  <option value="accepted">✅ مستوفى ومقبول تماماً</option>
                  <option value="accepted_with_remarks">✔️ مستوفى بملاحظات طفيفة</option>
                  <option value="rejected">❌ غير مستوفى / مرفوض</option>
                </select>
              </div>

              <div className="space-y-3 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl">
                <span className="block text-xs font-black text-indigo-800">2- صلاحية وتصاميم المواد الموردة وحالات المحجر:</span>
                <select
                  value={materialSuitability}
                  onChange={(e) => setMaterialSuitability(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-black bg-white"
                >
                  <option value="pending">⏱️ جاري الفحص والاختيار</option>
                  <option value="accepted">✅ مستوفى ومقبول تماماً</option>
                  <option value="accepted_with_remarks">✔️ مستوفى بملاحظات طفيفة</option>
                  <option value="rejected">❌ غير مستوفى / مرفوض</option>
                </select>
              </div>

              <div className="space-y-3 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl">
                <span className="block text-xs font-black text-indigo-800">3- جودة وخطوات التشغيل والرش بالماء والدمك:</span>
                <select
                  value={executionOperations}
                  onChange={(e) => setExecutionOperations(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-black bg-white"
                >
                  <option value="pending">⏱️ جاري الفحص وسركي الدمك</option>
                  <option value="accepted">✅ مستوفى ومقبول تماماً</option>
                  <option value="accepted_with_remarks">✔️ مستوفى بملاحظات طفيفة</option>
                  <option value="rejected">❌ غير مستوفى / مرفوض</option>
                </select>
              </div>

              <div className="space-y-3 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl">
                <span className="block text-xs font-black text-indigo-800">4- عـرض القطاع العرضي والتحقق الميداني:</span>
                <div className="flex gap-2">
                  <select
                    value={sectionWidth}
                    onChange={(e) => setSectionWidth(e.target.value as any)}
                    className="flex-1 px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-black bg-white"
                  >
                    <option value="pending">⏱️ جاري الفحص للقطاعات</option>
                    <option value="accepted">✅ مستوفى ومقبول تماماً</option>
                    <option value="accepted_with_remarks">✔️ مستوفى بملاحظات طفيفة</option>
                    <option value="rejected">❌ غير مستوفى / مرفوض</option>
                  </select>
                  <input 
                    type="text"
                    value={currentWidth}
                    onChange={(e) => setCurrentWidth(e.target.value)}
                    placeholder="العرض الحالي (بالمتر)..."
                    className="w-36 px-2 py-1 px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-mono font-black"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">ملاحظات ونتائج الرفع المساحي الميداني:</label>
                <textarea
                  value={surveyNotes}
                  onChange={(e) => setSurveyNotes(e.target.value)}
                  placeholder="مثال: تم مراجعة المناسيب ومطابقتها بمحضر ميزان القامة..."
                  className="w-full h-16 p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">تقرير مختبر ضبط جودة المواد والتربة والمعمل:</label>
                <textarea
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  placeholder="مثال: نتيجة الاختبار مقبولة بنسبة دمك أعلى من 95% جاف قياسي ومقاومة سحق..."
                  className="w-full h-16 p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section E: Engineering Signatories */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 flex items-center gap-1.5">
              <User size={16} className="text-indigo-600" />
              <span>المدراء والفاحصون المسجلون للتواقيع والاعتمادات</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">مهندس الشركة المنفذة:</label>
                <input 
                  type="text"
                  value={contractorEngineer}
                  onChange={(e) => setContractorEngineer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">استشاري الأعمال المساحية:</label>
                <input 
                  type="text"
                  value={surveyConsultant}
                  onChange={(e) => setSurveyConsultant(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">المهندس الاستشاري لضبط الجودة:</label>
                <input 
                  type="text"
                  value={qaEngineer}
                  onChange={(e) => setQaEngineer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold text-[11px] mb-1">الاستشاري العام للمشروع:</label>
                <input 
                  type="text"
                  value={generalConsultant}
                  onChange={(e) => setGeneralConsultant(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setIsEditing(false); setSelectedSub(null); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl"
            >
              إلغاء وتراجع
            </button>
            <button
              type={userRole === 'viewer' ? 'button' : 'submit'}
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حفظ التعديلات') : undefined}
              className={`px-6 py-2 text-white font-extrabold text-xs rounded-xl shadow-md transition ${
                userRole === 'viewer'
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              حفظ التفاصيل ومزامنة البيانات
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
