import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  XCircle, 
  Eye,
  RefreshCw,
  MoreVertical,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Assuming setup is in lib/firebase
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface ActivityLogItem {
  id: string;
  refNo: string;
  timestamp: string;
  user: string;
  actionType: 'Submission' | 'Approval' | 'Rejection' | 'Comment' | 'Sign-off';
  description: string;
}

interface IRAttachment {
  name: string;
  size: string;
  date: string;
}

interface InspectionRequest {
  id: string;
  refNo: string;
  projectName: string;
  locationZoneLevel: string;
  discipline: 'Civil' | 'Architectural' | 'Mechanical' | 'Electrical' | 'Plumbing' | 'Fire Fighting';
  workDescription: string;
  drawingRefNo: string;
  specificationClause: string;
  requestedInspectionDate: string;
  requestedInspectionTime: string;
  contractorRepresentative: string;
  consultantInspector: string;
  surveyConsultant?: string;
  structuralConsultant?: string;
  surveyorRepresentative?: string;
  attachments: IRAttachment[];
  status: 'Pending' | 'Approved' | 'Approved as Noted' | 'Rejected';
  reviewComments?: string;
  signOffName?: string;
  signOffSignature?: string;
  activityHistory: ActivityLogItem[];
  dateCreated: string;
  projectId?: string;
}

interface SiteInspectionRequestsProps {
  projectId: string;
  submissions: any[];
  setSubmissions: (subs: any[]) => void;
  userRole?: string;
  userNameAr?: string;
  workers?: any[];
  projects?: any[];
  addAuditLog?: (action: string, module: string, details: string) => void;
}

const getArabicDayName = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return dayNames[date.getDay()];
  } catch (e) {
    return '';
  }
};

export default function SiteInspectionRequests({
  projectId,
  submissions,
  setSubmissions,
  userRole,
  userNameAr,
  workers = [],
  projects = [],
  addAuditLog
}: SiteInspectionRequestsProps) {
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [refNoToDelete, setRefNoToDelete] = useState<string | null>(null);
  
  const [selectedIR, setSelectedIR] = useState<InspectionRequest | null>(null);
  const [isPrintingSingle, setIsPrintingSingle] = useState(false);
  const [isPrintingTable, setIsPrintingTable] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [formDiscipline, setFormDiscipline] = useState<InspectionRequest['discipline']>('Civil');
  const [formProjectName, setFormProjectName] = useState('مشروع بنيان السكني المتكامل');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDrawingRef, setFormDrawingRef] = useState('');
  const [formSpecClause, setFormSpecClause] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('10:00');
  const [formContractorRep, setFormContractorRep] = useState(userNameAr || 'م. معتز يونس');
  const [formConsultant, setFormConsultant] = useState('');
  const [formSurveyorConsultant, setFormSurveyorConsultant] = useState('');
  const [formStructuralConsultant, setFormStructuralConsultant] = useState('');
  const [formSurveyorRepresentative, setFormSurveyorRepresentative] = useState('بدون أعمال مساحية');
  const [uploadedFiles, setUploadedFiles] = useState<IRAttachment[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [reviewStatus, setReviewStatus] = useState<InspectionRequest['status']>('Approved');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewSignOffName, setReviewSignOffName] = useState('');
  const [signatureDrawn, setSignatureDrawn] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'inspectionRequests'), where('projectId', '==', projectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests: InspectionRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InspectionRequest));
      setRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, [projectId]);


  const totalSubmitted = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved' || r.status === 'Approved as Noted').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const filteredRequests = requests.filter(r => {
    const refNoStr = r.refNo ? String(r.refNo) : '';
    const locStr = r.locationZoneLevel ? String(r.locationZoneLevel) : '';
    const descStr = r.workDescription ? String(r.workDescription) : '';
    const repStr = r.contractorRepresentative ? String(r.contractorRepresentative) : '';
    const dwgStr = r.drawingRefNo ? String(r.drawingRefNo) : '';

    const matchesSearch = 
      refNoStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dwgStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDiscipline = selectedDiscipline === 'All' || r.discipline === selectedDiscipline;
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;

    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const generateNextRefNo = (discipline: string) => {
    const codeMap: Record<string, string> = {
      Civil: 'CIV',
      Architectural: 'ARC',
      Mechanical: 'MEC',
      Electrical: 'ELC',
      Plumbing: 'PLB',
      'Fire Fighting': 'FFG'
    };
    const code = codeMap[discipline] || 'GEN';
    const currentYear = new Date().getFullYear();
    
    const matching = requests.filter(r => r.refNo && r.refNo.startsWith(`IR-${currentYear}-${code}-`));
    let nextNum = 1;
    if (matching.length > 0) {
      const numbers = matching.map(r => {
        const parts = r.refNo!.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart, 10) || 0;
      });
      nextNum = Math.max(...numbers) + 1;
    }
    return `IR-${currentYear}-${code}-${String(nextNum).padStart(3, '0')}`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).map((file: any) => ({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toISOString().split('T')[0]
      }));
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files).map((file: any) => ({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toISOString().split('T')[0]
      }));
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleCreateIR = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formLocation || !formDescription || !formDrawingRef || !formSpecClause) {
      alert('يرجى تعبئة كافة الحقول الأساسية لطلب الفحص الموقعي.');
      return;
    }

    const nextRef = generateNextRefNo(formDiscipline);
    const newIRId = 'ir-' + Date.now();
    const actionRef = `REF-ACT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRequest: InspectionRequest = {
      id: newIRId,
      refNo: nextRef,
      projectName: formProjectName,
      locationZoneLevel: formLocation,
      discipline: formDiscipline,
      workDescription: formDescription,
      drawingRefNo: formDrawingRef,
      specificationClause: formSpecClause,
      requestedInspectionDate: formDate,
      requestedInspectionTime: formTime,
      contractorRepresentative: formContractorRep,
      consultantInspector: formConsultant,
      surveyConsultant: formSurveyorConsultant,
      structuralConsultant: formStructuralConsultant,
      surveyorRepresentative: formSurveyorRepresentative,
      attachments: uploadedFiles,
      status: 'Pending',
      activityHistory: [
        {
          id: `act-${Date.now()}-init`,
          refNo: actionRef,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: formContractorRep,
          actionType: 'Submission',
          description: `تم إعداد وتصدير طلب فحص أعمال الموقع وإرفاق المستندات والمخططات التنفيذية.`
        }
      ],
      dateCreated: new Date().toISOString().split('T')[0],
      projectId: projectId // Ensure projectId is stored for the query
    };

    try {
      await setDoc(doc(db, 'inspectionRequests', newIRId), newRequest);
      // Log interaction
      console.log('Inspection request created successfully.');
    } catch (error) {
      console.error('Error creating inspection request:', error);
      alert('حدث خطأ أثناء حفظ الطلب.');
      return;
    }

    setFormLocation('');
    setFormDescription('');
    setFormDrawingRef('');
    setFormSpecClause('');
    setFormConsultant('');
    setFormSurveyorConsultant('');
    setFormStructuralConsultant('');
    setFormSurveyorRepresentative('بدون أعمال مساحية');
    setUploadedFiles([]);
    setShowCreateModal(false);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIR) return;

    const actionRef = `REF-ACT-${Math.floor(100000 + Math.random() * 900000)}`;
    const userDisplay = userNameAr || 'المهندس الاستشاري';
    
    let actionType: ActivityLogItem['actionType'] = 'Comment';
    let actionLabel = 'تعليق ومراجعة';
    if (reviewStatus === 'Approved') {
      actionType = 'Approval';
      actionLabel = 'اعتماد وموافقة كليّة';
    } else if (reviewStatus === 'Approved as Noted') {
      actionType = 'Approval';
      actionLabel = 'اعتماد وموافقة مشروطة بملاحظات';
    } else if (reviewStatus === 'Rejected') {
      actionType = 'Rejection';
      actionLabel = 'رفض ومطالبة بإعادة التقديم';
    }

    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}-rev`,
      refNo: actionRef,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: reviewSignOffName || userDisplay,
      actionType: actionType,
      description: `تم إخضاع الطلب للمراجعة الفنية واتخاذ قرار: [${actionLabel}]. الملاحظات: ${reviewComments || 'لا يوجد ملاحظات إضافية'}`
    };

    try {
      const irRef = doc(db, 'inspectionRequests', selectedIR.id);
      await updateDoc(irRef, {
        status: reviewStatus,
        reviewComments: reviewComments,
        signOffName: reviewSignOffName || userDisplay,
        signOffSignature: signatureDrawn ? 'SIGNED_DIGITAL_QC' : selectedIR.signOffSignature,
        activityHistory: [newActivity, ...selectedIR.activityHistory]
      });
      console.log('Inspection request updated successfully.');
    } catch (error) {
      console.error('Error updating inspection request:', error);
      alert('حدث خطأ أثناء حفظ التعديلات.');
      return;
    }

    setReviewComments('');
    setReviewSignOffName('');
    setSignatureDrawn(false);
    setShowReviewModal(false);
    setSelectedIR(null);
  };

  const handleDeleteIR = async (id: string, refNo: string) => {
    if (confirmWithRandomCode(`هل أنت متأكد من حذف طلب فحص الموقع ذو الرقم المرجعي ${refNo} نهائياً؟`)) {
      try {
        await deleteDoc(doc(db, 'inspectionRequests', id));
        console.log('Inspection request deleted successfully.');
      } catch (error) {
        console.error('Error deleting inspection request:', error);
        alert('حدث خطأ أثناء حذف الطلب.');
      }
    }
  };

  const triggerPrintTable = () => {
    setIsPrintingTable(true);
    setTimeout(() => {
      window.print();
      setIsPrintingTable(false);
    }, 200);
  };

  const triggerPrintIR = (ir: InspectionRequest) => {
    setSelectedIR(ir);
    setIsPrintingSingle(true);
    setTimeout(() => {
      window.print();
      setIsPrintingSingle(false);
      setSelectedIR(null);
    }, 200);
  };

  const getDisciplineColor = (disc: string) => {
    switch (disc) {
      case 'Civil': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Architectural': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Mechanical': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Electrical': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Plumbing': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Fire Fighting': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  const getDisciplineAr = (disc: string) => {
    const map: Record<string, string> = {
      Civil: 'إنشائي / مدني',
      Architectural: 'معماري',
      Mechanical: 'ميكانيكا',
      Electrical: 'كهرباء',
      Plumbing: 'أعمال صحية / سباكة',
      'Fire Fighting': 'مكافحة الحريق'
    };
    return map[disc] || disc;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
            <span>معتمد وموافق</span>
          </span>
        );
      case 'Approved as Noted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <AlertTriangle size={12} className="text-amber-500 shrink-0 animate-pulse" />
            <span>موافق بملاحظات</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <XCircle size={12} className="text-rose-500 shrink-0" />
            <span>مرفوض ويعاد</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
            <Clock size={12} className="text-indigo-500 shrink-0 animate-spin" />
            <span>قيد الانتظار</span>
          </span>
        );
    }
  };

  if (isPrintingSingle && selectedIR) {
    return (
      <div className="bg-white text-slate-900 font-sans p-8 text-right print-view min-h-screen" dir="rtl" id="print-layout-ir">
        <div className="fixed top-4 left-4 z-50 print:hidden flex gap-2">
          <button 
            onClick={() => { setIsPrintingSingle(false); setSelectedIR(null); }}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-md transition"
          >
            إلغاء والعودة
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 shadow-md transition"
          >
            اطبع فوراً
          </button>
        </div>

        <div className="border-4 border-slate-950 p-5 mb-6">
          <div className="grid grid-cols-3 items-center text-center gap-4">
            <div className="text-right">
              <h3 className="font-extrabold text-[12px] text-slate-950">المالك وجهة الإشراف</h3>
              <p className="font-black text-[13px] text-indigo-900 mt-1">الهيئة الهندسية للقوات المسلحة</p>
              <p className="text-[10px] text-slate-500">إدارة المهندسين العسكريين</p>
            </div>
            <div className="flex flex-col items-center justify-center border-x-2 border-slate-350 px-2">
              <Building2 size={24} className="text-indigo-600 mb-1" />
              <p className="font-black text-[14px] leading-none mb-1 text-slate-900">المكتب الاستشاري العام</p>
              <p className="font-bold text-[12px] text-indigo-700">أ . د / خالد قنديل لضبط الجودة</p>
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-[12px] text-slate-950">الشركة الإنشائية المنفذة</h3>
              <p className="font-black text-[13px] text-purple-900 mt-1">شركة بنيان الكبرى للمقاولات</p>
              <p className="text-[10px] text-slate-500">قسم إدارة الجودة والمطابقة الفنية</p>
            </div>
          </div>

          <div className="border-t-2 border-slate-950 mt-4 pt-3 text-center">
            <h2 className="text-[17px] font-black tracking-wide text-slate-900 underline underline-offset-4">
              تقرير تسليم الأعمال واستمارة فحص الموقع (IR / WIR)
            </h2>
            <p className="font-mono text-[10px] text-slate-500 mt-1">
              تاريخ إصدار الاستمارة الرسمي: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="border-2 border-slate-950 p-4 mb-6 bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-[11px] leading-relaxed">
            <div>
              <span className="font-extrabold text-slate-500 block">الرقم المرجعي لطلب الفحص:</span>
              <strong className="font-mono text-[12px] text-indigo-750 font-black">{selectedIR.refNo}</strong>
            </div>
            <div>
              <span className="font-extrabold text-slate-500 block">التخصص الهندسي / القسم:</span>
              <strong className="font-bold text-slate-900">{getDisciplineAr(selectedIR.discipline)} ({selectedIR.discipline})</strong>
            </div>
            <div>
              <span className="font-extrabold text-slate-500 block">تاريخ التقديم والتسجيل:</span>
              <strong className="font-bold text-slate-900">{selectedIR.dateCreated}</strong>
            </div>
            <div>
              <span className="font-extrabold text-slate-500 block">توقيت الفحص المطلوب:</span>
              <strong className="font-bold text-slate-900">{selectedIR.requestedInspectionDate} في تمام الساعة {selectedIR.requestedInspectionTime}</strong>
            </div>
            <div className="col-span-2">
              <span className="font-extrabold text-slate-500 block">اسم المشروع النشط بالموقع:</span>
              <strong className="font-bold text-slate-900">{selectedIR.projectName}</strong>
            </div>
            <div className="col-span-2">
              <span className="font-extrabold text-slate-500 block">الموقع الإنشائي / الزون / المنسوب:</span>
              <strong className="font-bold text-indigo-900">{selectedIR.locationZoneLevel}</strong>
            </div>
          </div>
        </div>

        <div className="border-2 border-slate-950 p-4 mb-6">
          <h4 className="font-black text-[12px] border-b border-slate-300 pb-1.5 mb-3 text-slate-900 bg-slate-100 px-2 py-1">
            وصف وتفاصيل الأعمال الإنشائية المطلوب فحصها
          </h4>
          <div className="space-y-4 text-[11px]">
            <p className="leading-relaxed font-semibold">
              <span className="font-extrabold text-slate-500 block mb-1">وصف الأعمال المطلوب تسليمها ومعاينتها:</span>
              <span className="text-slate-900 bg-white p-2 block border border-slate-350 rounded-sm font-black text-right">{selectedIR.workDescription}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-extrabold text-slate-500 block">رقم المخطط التنفيذي (Shop Drawing Ref):</span>
                <strong className="font-mono text-slate-900 bg-slate-50 p-1.5 block border border-slate-200 mt-1 text-center font-bold">{selectedIR.drawingRefNo}</strong>
              </div>
              <div>
                <span className="font-extrabold text-slate-500 block">بند المواصفات الفنية الحاكمة (Spec Clause):</span>
                <strong className="font-mono text-slate-900 bg-slate-50 p-1.5 block border border-slate-200 mt-1 text-center font-bold">{selectedIR.specificationClause}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border-2 border-slate-950 p-3 text-[11px]">
            <span className="font-extrabold text-slate-500 block">مهندسو وشهود الفحص الموقعي:</span>
            <ul className="mt-2 space-y-1.5 font-bold">
              <li>• مهندس المقاول المسؤول: <span className="text-slate-900 font-black">{selectedIR.contractorRepresentative}</span></li>
              <li>• مهندس الاستشاري الفاحص: <span className="text-indigo-850 font-black">{selectedIR.consultantInspector || 'غير محدد'}</span></li>
              {selectedIR.surveyConsultant && (
                <li>• استشاري الأعمال المساحية: <span className="text-slate-900 font-black">{selectedIR.surveyConsultant}</span></li>
              )}
              {selectedIR.structuralConsultant && (
                <li>• استشاري الأعمال الإنشائية: <span className="text-slate-900 font-black">{selectedIR.structuralConsultant}</span></li>
              )}
              {selectedIR.surveyorRepresentative && (
                <li>• المساح المسؤول عن التسليم: <span className="text-slate-900 font-black">{selectedIR.surveyorRepresentative}</span></li>
              )}
            </ul>
          </div>
          <div className="border-2 border-slate-950 p-3 text-[11px]">
            <span className="font-extrabold text-slate-500 block">الوثائق والملفات المرفقة بالطلب فحصاً:</span>
            {selectedIR.attachments.length === 0 ? (
              <p className="text-slate-400 mt-2">لا توجد مخططات مرفقة ورقياً، الفحص بموجب اللوحة العامة.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {selectedIR.attachments.map((at, idx) => (
                  <li key={idx} className="font-mono">• {at.name} ({at.size})</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-4 border-slate-950 p-4 mb-6 bg-slate-50 rounded-xs">
          <h4 className="font-black text-[13px] border-b-2 border-slate-950 pb-2 mb-3 text-slate-950">
            قرار المهندس الاستشاري وجهاز الإشراف النهائي
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-[12px] font-black my-4">
            <div className={`p-2 border-2 ${selectedIR.status === 'Approved' ? 'bg-emerald-600 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-250 opacity-40'}`}>
              🟢 معتمد وموافق تماماً (Approved)
            </div>
            <div className={`p-2 border-2 ${selectedIR.status === 'Approved as Noted' ? 'bg-amber-500 text-white border-slate-950 font-bold' : 'bg-white text-slate-400 border-slate-250 opacity-40'}`}>
              🟡 معتمد بملاحظات (Approved as Noted)
            </div>
            <div className={`p-2 border-2 ${selectedIR.status === 'Rejected' ? 'bg-[#dd2222] text-white border-slate-950' : 'bg-white text-slate-400 border-slate-250 opacity-40'}`}>
              🔴 مرفوض ويعاد تقديمه (Rejected)
            </div>
          </div>
          
          <div className="mt-4 text-[11px]">
            <span className="font-extrabold text-slate-600 block mb-1">تقرير المعاينة وملاحظات الفحص الهندسي:</span>
            <p className="bg-white p-3 border border-slate-400 min-h-16 text-slate-950 font-black leading-relaxed">
              {selectedIR.reviewComments || 'لا توجد تعليقات إضافية، تم مطابقة الأعمال مع كود التصميم وتصاريح الصب والإنشاء الموقعية.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center border-2 border-slate-950 p-4 text-[11px] font-black">
          <div>
            <p className="bg-slate-950 text-white py-1 mb-2">توقيع مهندس المقاول المنفذ</p>
            <p className="mt-3 text-slate-800">{selectedIR.contractorRepresentative}</p>
            <p className="text-[10px] text-slate-400 mt-6">التوقيع: .......................................</p>
          </div>
          <div className="border-x-2 border-slate-350 px-2">
            <p className="bg-slate-950 text-white py-1 mb-2">اعتماد مهندس جودة الاستشاري</p>
            <p className="mt-3 text-indigo-900">{selectedIR.signOffName || selectedIR.consultantInspector}</p>
            <div className="my-2 text-[10px] text-emerald-650 bg-emerald-50 inline-block px-2 py-0.5 border border-emerald-200">
              ✓ تم التوقيع رقمياً بالنظام الآمن
            </div>
            <p className="text-[10px] text-slate-400 mt-2">التوقيع: .......................................</p>
          </div>
          <div>
            <p className="bg-slate-950 text-white py-1 mb-2">المستشار العام لإدارة المشروع</p>
            <p className="mt-3 text-slate-700">أ.د / خالد قنديل</p>
            <p className="text-[10px] text-slate-400 mt-6">التوقيع والختم المعتمد</p>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 mt-8 border-t border-dashed border-slate-300 pt-3 font-mono">
          بنيان لإدارة مشروعات الطرق والتشييد - استمارة فحص موقع رسمية رقمية (IR Document - REF-{selectedIR.refNo})
        </div>
      </div>
    );
  }

  if (isPrintingTable) {
    return (
      <div className="bg-white text-slate-900 font-sans p-8 text-right print-view min-h-screen" dir="rtl" id="print-layout-table">
        <div className="text-center mb-6">
          <h2 className="text-[18px] font-black tracking-wide text-slate-950 underline underline-offset-4">
            سجل طلبات فحص الموقع وتسليمات الأعمال الفنية (IR / WIR Master Log)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            كشف معتمد بجميع الطلبات المرفوعة للفحص وأطوار العمل بمشروع بنيان
          </p>
          <p className="font-mono text-[10px] text-slate-450 mt-1">
            تاريخ استخراج السجل: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <table className="w-full border-collapse border-2 border-slate-950 text-[11px] text-center">
          <thead>
            <tr className="bg-slate-100 font-extrabold h-9 text-slate-900 border-b-2 border-slate-950">
              <th className="border border-slate-950 w-24">الرقم المرجعي</th>
              <th className="border border-slate-950 w-20">تاريخ الطلب</th>
              <th className="border border-slate-950 w-24">القسم / التخصص</th>
              <th className="border border-slate-950 w-40">الموقع / زون العمل</th>
              <th className="border border-slate-950 text-right px-2">وصف بند الأعمال المطلوب معاينتها</th>
              <th className="border border-slate-950 w-28">الحالة النهائية</th>
              <th className="border border-slate-950 w-32">المقاول وممثله</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((r) => (
              <tr key={r.id} className="h-9 font-bold text-slate-800">
                <td className="border border-slate-950 font-mono font-black">{r.refNo}</td>
                <td className="border border-slate-950 font-mono">{r.dateCreated}</td>
                <td className="border border-slate-950">{getDisciplineAr(r.discipline)}</td>
                <td className="border border-slate-950 text-right px-2">{r.locationZoneLevel}</td>
                <td className="border border-slate-950 text-right px-2 leading-tight font-medium max-w-sm truncate">{r.workDescription}</td>
                <td className="border border-slate-950">
                  {r.status === 'Approved' && '🟢 معتمد وموافق'}
                  {r.status === 'Approved as Noted' && '🟡 موافق بملاحظات'}
                  {r.status === 'Rejected' && '🔴 مرفوض بالكامل'}
                  {r.status === 'Pending' && '⏱️ قيد المراجعة'}
                </td>
                <td className="border border-slate-950 text-[10px]">{r.contractorRepresentative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6 no-print" dir="rtl" id="ir-wir-management-module">
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg mb-2">
            <ShieldCheck size={12} className="text-indigo-600 animate-pulse" />
            <span>وحدة رقابة جودة الفحص واستلام الأعمال</span>
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-indigo-600 shrink-0" size={24} />
            <span>نظام إدارة طلبات فحص الموقع وتسليم الأعمال (IR / WIR)</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormDiscipline('Civil');
              setFormLocation('');
              setFormDescription('');
              setFormDrawingRef('');
              setFormSpecClause('');
              setUploadedFiles([]);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all duration-200"
          >
            <Plus size={16} />
            <span>إنشاء طلب فحص</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-extrabold block">إجمالي طلبات الفحص</span>
          <strong className="text-2xl font-black text-slate-900 font-mono mt-1 block">{totalSubmitted}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-extrabold block">طلبات قيد التدقيق</span>
          <strong className="text-2xl font-black text-slate-900 font-mono mt-1 block">{pendingCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-extrabold block">طلبات معتمدة</span>
          <strong className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{approvedCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-extrabold block">طلبات مرفوضة</span>
          <strong className="text-2xl font-black text-rose-600 font-mono mt-1 block">{rejectedCount}</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-right border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-700 font-bold">
              <th className="px-4 py-3">رقم الطلب</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">التخصص</th>
              <th className="px-4 py-3">الموقع</th>
              <th className="px-4 py-3">المسؤول</th>
              <th className="px-4 py-3">الوصف</th>
              <th className="px-4 py-3 text-center">القرار</th>
              <th className="px-4 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors text-slate-900">
                <td className="px-4 py-3">
                  <button 
                    onClick={() => { setSelectedIR(r); setShowReviewModal(true); }} 
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    {r.refNo}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium">{r.dateCreated}</td>
                <td className="px-4 py-3 font-medium">{getDisciplineAr(r.discipline)}</td>
                <td className="px-4 py-3 font-medium">{r.locationZoneLevel}</td>
                <td className="px-4 py-3 font-medium">{r.contractorRepresentative}</td>
                <td className="px-4 py-3 font-medium text-slate-600">{r.workDescription}</td>
                <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => { setSelectedIR(r); setShowReviewModal(true); }} className="p-1 text-slate-400 hover:text-indigo-600"><Eye size={18} /></button>
                    <button onClick={() => triggerPrintIR(r)} className="p-1 text-slate-400 hover:text-emerald-600"><Printer size={18} /></button>
                    {userRole === 'admin' && (
                      <button onClick={() => { setIdToDelete(r.id); setRefNoToDelete(r.refNo); setShowDeleteModal(true); }} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl flex overflow-hidden min-h-[600px]" dir="rtl">
            <div className="flex-1 p-10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                  <h3 className="font-black text-2xl text-slate-900">إضافة طلب فحص جديد</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form id="create-ir-form" onSubmit={handleCreateIR} className="space-y-8">
                  {/* Section 1 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm font-black text-indigo-500">الأطراف والبند</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-2">بند العمل *</label>
                            <select value={formDiscipline} onChange={(e) => setFormDiscipline(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none">
                                <option value="Civil">إنشائي / مدني</option>
                                <option value="Architectural">معماري</option>
                                <option value="Mechanical">ميكانيكا</option>
                                <option value="Electrical">كهرباء</option>
                                <option value="Plumbing">سباكة</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-2">المهندس المسؤول / المقاول *</label>
                            <select value={formContractorRep} onChange={(e) => setFormContractorRep(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none">
                                <option value="" className="text-slate-400">-- اختر المقاول --</option>
                                {workers.filter(w => w.type === 'appointed' || w.type === 'saraky').map(w => (
                                    <option key={w.id} value={w.name}>{w.name} - {w.jobTitle}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mt-8">
                      <div className="w-1 h-5 bg-teal-400 rounded-full"></div>
                      <span className="text-sm font-black text-teal-400">الموقع والتفاصيل</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-2">المساح المسؤول *</label>
                            <select value={formSurveyorRepresentative} onChange={(e) => setFormSurveyorRepresentative(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition appearance-none">
                                <option value="بدون أعمال مساحية" className="text-slate-400">-- بدون أعمال مساحية --</option>
                                {workers.filter(w => w.jobTitle.includes('مساح')).map(w => (
                                    <option key={w.id} value={w.name}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-2">الموقع / الزون *</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="بحث رقم المنطقة أو الزون..." value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition" required />
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Section 3 Hidden/Compact for required fields */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 mt-8">
                        <div className="w-1 h-5 bg-purple-400 rounded-full"></div>
                        <span className="text-sm font-black text-purple-400">المخططات والوصف</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                            <input type="text" placeholder="رقم المخطط (Drawing Ref) *" value={formDrawingRef} onChange={(e) => setFormDrawingRef(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-purple-500 transition" required />
                        </div>
                        <div>
                            <input type="text" placeholder="بند المواصفات (Spec Clause) *" value={formSpecClause} onChange={(e) => setFormSpecClause(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-purple-500 transition" required />
                        </div>
                        <div className="col-span-2">
                            <input type="text" placeholder="وصف الأعمال المطلوب فحصها *" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-purple-500 transition" required />
                        </div>
                      </div>
                  </div>
                </form>
              </div>
              
              <div className="flex justify-between items-center gap-4 mt-12 pt-8 border-t border-slate-100">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="w-48 py-4 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition border border-slate-100">
                      إلغاء
                  </button>
                  <button type="submit" form="create-ir-form" className="flex-1 py-4 bg-[#C8C2F5] text-white rounded-2xl text-sm font-black hover:bg-[#B5ADF0] shadow-sm transition">
                      اعتماد وتسجيل الطلب
                  </button>
              </div>
            </div>

            <div className="w-96 bg-slate-50/50 border-r border-slate-100 p-10 flex flex-col">
                <div className="space-y-6 mt-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-[#E8E6FC] text-[#8676FF] rounded-3xl flex items-center justify-center rotate-3">
                        <FileText size={36} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h4 className="font-black text-2xl text-slate-900 mb-3">تسجيل فحص موقعي</h4>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-[260px] mx-auto font-medium">
                            نظام تسجيل الفحوصات الموقعية الذكي لربط المهندسين والمقاولين بموقع المشروع بدقة تامة.
                        </p>
                    </div>
                </div>
                <div className="mt-20 space-y-5 px-4">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-black text-indigo-500">1. الأطراف والبند</div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-black text-slate-400">2. تفاصيل الموقع</div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-black text-slate-400">3. المخططات والوصف</div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedIR && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
            <h3 className="font-black text-base mb-4">دورة المراجعة: {selectedIR.refNo}</h3>
            <p className="mb-4 text-sm">{selectedIR.workDescription}</p>
            <form onSubmit={handleSaveReview} className="space-y-4">
              <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as any)} className="w-full border p-2 rounded-lg">
                <option value="Approved">معتمد</option>
                <option value="Approved as Noted">معتمد بملاحظات</option>
                <option value="Rejected">مرفوض</option>
              </select>
              <textarea placeholder="التعليقات" value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} className="w-full border p-2 rounded-lg"></textarea>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">حفظ القرار</button>
              <button type="button" onClick={() => setShowReviewModal(false)} className="bg-slate-200 px-4 py-2 rounded-lg mr-2">إغلاق</button>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-base mb-4 text-rose-600">تأكيد حذف الطلب {refNoToDelete}</h3>
            <p className="mb-4 text-sm text-slate-700">يرجى إدخال كود الحذف:</p>
            <input 
              type="password" 
              value={deleteCode} 
              onChange={(e) => setDeleteCode(e.target.value)} 
              className="w-full border p-2 rounded-lg mb-4"
              placeholder="أدخل الكود"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (deleteCode === '1234') {
                    handleDeleteIR(idToDelete!, refNoToDelete!);
                    setShowDeleteModal(false);
                    setDeleteCode('');
                  } else {
                    alert('كود غير صحيح');
                  }
                }}
                className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-lg"
              >
                حذف نهائي
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-slate-200 px-4 py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
