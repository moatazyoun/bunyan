import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldCheck, FileText, Sparkles, Award, MessageSquare, 
  Search, Filter, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp,
  BrainCircuit, MailOpen, FileSpreadsheet, RefreshCw, Send, ChevronLeft,
  Coins, Briefcase, HelpCircle, ArrowUpRight, Ban, MessageCircle, FileCheck
} from 'lucide-react';
import { Project } from '../types';

interface CrmDashboardProps {
  projects: Project[];
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

interface ClientItem {
  id: string;
  name: string;
  project: string;
  consultant: string;
  aiSatScore: number;
  financialStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  financialStatusAr: string;
  contractValue: string;
  approvedClaimsRate: number;
  totalClaimsCount: number;
  preQualStatus: 'Approved' | 'In Progress' | 'Renewing';
  preQualStatusAr: string;
  lastCorrespondence: {
    subject: string;
    date: string;
    type: 'Incoming' | 'Outgoing';
    status: 'Replied' | 'Under Study' | 'Action Needed';
    statusAr: string;
  };
  aiAnalysis: string;
}

export default function CrmDashboard({
  projects,
  userRole,
  addAuditLog
}: CrmDashboardProps) {
  // Navigation Tabs for different strategic zones
  const [activeSubTab, setActiveSubTab] = useState<'strategy' | 'lifecycle' | 'ai' | 'stakeholders' | 'matrix'>('strategy');
  
  // Search & Filtering States for Client Portfolio Matrix
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  // Correspondence Generator State (Simulating B2B messaging)
  const [corrSubject, setCorrSubject] = useState('');
  const [corrRecipient, setCorrRecipient] = useState('');
  const [corrBody, setCorrBody] = useState('');
  const [corrType, setCorrType] = useState<'Incoming' | 'Outgoing'>('Outgoing');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Change Order AI Simulator State
  const [boqCost, setBoqCost] = useState<string>('500000');
  const [changeType, setChangeType] = useState<string>('Scope Expansion');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [analyzingChange, setAnalyzingChange] = useState(false);

  // Static Seed B2B Client Portfolio Dataset
  const [clients, setClients] = useState<ClientItem[]>([
    {
      id: 'client-1',
      name: 'هيئة المجتمعات العمرانية الجديدة (NUCA)',
      project: 'أبراج العلمين الجديدة - المرحلة الثانية (Al Alamein Towers)',
      consultant: 'جماعة المهندسين الاستشاريين (ECG)',
      aiSatScore: 94,
      financialStatus: 'Excellent',
      financialStatusAr: 'ممتاز - دفعات منتظمة ومستخلصات معتمدة بنسبة 98%',
      contractValue: '4,200,000,000 ج.م',
      approvedClaimsRate: 92,
      totalClaimsCount: 14,
      preQualStatus: 'Approved',
      preQualStatusAr: 'مؤهل ومعتمد بفئة أ (A-Class Ready)',
      lastCorrespondence: {
        subject: 'اعتماد عينات رخام الواجهات الخارجية للبرج الهلالي الغربي',
        date: '2026-06-20',
        type: 'Incoming',
        status: 'Replied',
        statusAr: 'تم الرد والإغلاق هندسياً'
      },
      aiAnalysis: 'العميل يظهر مستوى مرونة مرتفع في قبول أوامر التغيير الهيكلية الناتجة عن تعديل الكود الهندسي للأحمال والرياح. التنبؤات تشير إلى التزام مالي بنسبة 100% في الربع السنوي الحالي مع استقرار في التوريدات.'
    },
    {
      id: 'client-2',
      name: 'شركة إعمار مصر للتنمية والاستثمار العقاري',
      project: 'تطوير المجمع السكني الفاخر "بيل في" (Belle Vie Complex)',
      consultant: 'مكتب دار الهندسة (Dar Al-Handasah)',
      aiSatScore: 88,
      financialStatus: 'Good',
      financialStatusAr: 'جيد جداً - تمويل مستقر مع تدقيق مالي صارم لمطابقة البنود',
      contractValue: '1,850,000,000 ج.م',
      approvedClaimsRate: 85,
      totalClaimsCount: 8,
      preQualStatus: 'Approved',
      preQualStatusAr: 'مؤهل ومعتمد ومجدد التوثيق الدوري',
      lastCorrespondence: {
        subject: 'إشعار تأخر توريد حديد التسليح عالي المقاومة من المصانع المحلية',
        date: '2026-06-18',
        type: 'Outgoing',
        status: 'Under Study',
        statusAr: 'قيد الدراسة الفنية من استشاري المالك'
      },
      aiAnalysis: 'توصي خوارزمية الذكاء الاصطناعي بتكثيف حضور منسق الجودة بالموقع نظراً لتدقيق دار الهندسة الحازم على جودة التشطيبات النهائية للخرسانات الظاهرة لمنع رصد أي تفاوتات بصرية.'
    },
    {
      id: 'client-3',
      name: 'شركة طلعت مصطفى القابضة للتطوير العقاري (TMG)',
      project: 'البنية التحتية الذكية لمدينة نور (Noor City Infrastructure)',
      consultant: 'صبور للاستشارات الهندسية (Sabbour Consulting)',
      aiSatScore: 79,
      financialStatus: 'Needs Attention',
      financialStatusAr: 'متأخر جزئياً - وجود مستخلصين معلقين للمراجعة التثمنية',
      contractValue: '2,900,000,000 ج.م',
      approvedClaimsRate: 71,
      totalClaimsCount: 19,
      preQualStatus: 'Renewing',
      preQualStatusAr: 'مستندات التأهيل قيد التجديد السنوي والتوثيق المالي',
      lastCorrespondence: {
        subject: 'طلب أمر تغيير مالي وزمني لإضافة شبكة كابلات ألياف ضوئية فائقة السرعة',
        date: '2026-06-24',
        type: 'Outgoing',
        status: 'Action Needed',
        statusAr: 'بحاجة لإجراء عاجل ومفاوضات تجارية'
      },
      aiAnalysis: 'التحليل التنبئي يحدد مخاطر تأخر في تحصيل التدفقات النقدية خلال الـ 45 يوماً القادمة بسبب خلاف فني حول تسعير متر التمرير الطولي للكابلات. ينصح بعقد ورشة عمل هندسية ثنائية عاجلة للتوافق.'
    },
    {
      id: 'client-4',
      name: 'الهيئة الهندسية للقوات المسلحة (Engineering Authority)',
      project: 'شبكة الكباري والأنفاق بمحور الفريق شريف صبور الأثري',
      consultant: 'محرم باخوم للاستشارات الهندسية (ACE)',
      aiSatScore: 96,
      financialStatus: 'Excellent',
      financialStatusAr: 'ممتاز - صرف فوري مباشر للمستخلصات عقب اعتماد الاستشاري',
      contractValue: '1,150,000,000 ج.م',
      approvedClaimsRate: 98,
      totalClaimsCount: 5,
      preQualStatus: 'Approved',
      preQualStatusAr: 'مؤهل معتمد دائم (امتياز وطني)',
      lastCorrespondence: {
        subject: 'طلب اعتماد مخططات ورش العمل الشاملة للأنفاق السطحية بميدان الحجاز',
        date: '2026-06-22',
        type: 'Incoming',
        status: 'Replied',
        statusAr: 'تم الرد بالقبول مع ملاحظات طفيفة'
      },
      aiAnalysis: 'نسبة رضا قياسية وتطابق تام مع الجداول الزمنية للصب. الذكاء الاصطناعي ينصح باستغلال هذه العلاقة الاستراتيجية للحصول على إسناد مباشر في حزم الأعمال التكميلية لربط الطرق والمحاور المجاورة.'
    },
    {
      id: 'client-5',
      name: 'شركة ماجد الفطيم العقارية بمصر (MAF)',
      project: 'توسعة وتطوير سيتي سنتر الإسكندرية (Mall Expansion)',
      consultant: 'شاكر للاستشارات الهندسية (Shaker Group)',
      aiSatScore: 68,
      financialStatus: 'Critical',
      financialStatusAr: 'حرج - مستندات محتجزة لوجود خلاف مالي حول نسب الهدر في المواد',
      contractValue: '780,000,000 ج.م',
      approvedClaimsRate: 59,
      totalClaimsCount: 12,
      preQualStatus: 'In Progress',
      preQualStatusAr: 'قيد المراجعة والتدقيق القانوني المسبق',
      lastCorrespondence: {
        subject: 'إشعار بوقف استلام بنود العزل المائي للأسقف لمخالفة العلامة التجارية المعتمدة',
        date: '2026-06-15',
        type: 'Incoming',
        status: 'Action Needed',
        statusAr: 'بحاجة لإجراء عاجل ومفاوضات تجارية'
      },
      aiAnalysis: 'العميل يتبنى سياسة صفر تسامح مع تعديلات المواصفات الفنية غير المعتمدة كتابياً بشكل مسبق. خطر وشيك بفرض غرامات تأخير أو تسييل خطاب الضمان في حال تعثر استبدال مواد العزل بماركة مطابقة للكود.'
    }
  ]);

  // Handle simulated message delivery to client portal
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrSubject || !corrRecipient || !corrBody) {
      alert('الرجاء كتابة موضوع الخطاب والجهة المستلمة ونص المراسلة.');
      return;
    }

    // Add audit log
    if (addAuditLog) {
      addAuditLog(
        `إصدار مراسلة لعميل: ${corrRecipient}`,
        'إدارة علاقات العملاء والشركاء',
        `تم تحرير وإرسال خطاب رسمي رقمي بعنوان: [${corrSubject}] بمطابقة شروط التعاقد والجدول الزمني.`
      );
    }

    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setCorrSubject('');
      setCorrBody('');
    }, 4000);
  };

  // Simulated AI Change Order Engine
  const handleAnalyzeChangeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzingChange(true);

    setTimeout(() => {
      const parsedCost = parseFloat(boqCost);
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      let confidenceRate = 95;
      let actionRecomm = '';
      let clauseRef = '';

      if (parsedCost > 1000000) {
        riskLevel = 'High';
        confidenceRate = 78;
        clauseRef = 'مادة 18 من العقد الموحد (شروط التعديلات الجوهرية)';
        actionRecomm = 'تكلفة التعديل تتجاوز 10% من الحزمة الفرعية للمشروع. يوصى بعدم البدء في التنفيذ الفعلي نهائياً إلا بعد صدور أمر التغيير الفني معتمداً رسمياً وموقعاً من ممثل العمال والممثل المالي للعميل لتجنب مخاطر ضياع الحقوق.';
      } else if (parsedCost > 300000) {
        riskLevel = 'Medium';
        confidenceRate = 86;
        clauseRef = 'مادة 14 (أوامر التكليف الميداني المحدودة)';
        actionRecomm = 'التغيير يقع ضمن الصلاحيات المشتركة للاستشاري والمقاول. يوصى بإعداد مذكرة تحليل أسعار ومطابقتها لمعدلات الهدر القياسية قبل توجيه المهندسين للموقع.';
      } else {
        riskLevel = 'Low';
        confidenceRate = 97;
        clauseRef = 'البند الإضافي العام للمستلزمات الطارئة';
        actionRecomm = 'التكلفة آمنة وضمن الاحتياطي العام لبنود التنفيذ. يمكن المباشرة بالتنفيذ الفوري لضمان حماية المسار الحرج مع توثيق البند بالصور وسجل الزيارات اليومي للجنة الفحص.';
      }

      setAiAnalysisResult({
        riskLevel,
        confidenceRate,
        clauseRef,
        actionRecomm,
        impactOnSat: changeType === 'Scope Expansion' ? -2 : 4,
        dateAnalyzed: new Date().toISOString().split('T')[0]
      });
      setAnalyzingChange(false);
    }, 1500);
  };

  // Client filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.consultant.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.financialStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  return (
    <div className="space-y-6" dir="rtl" id="crm-strategic-management-module">
      
      {/* 1. Header & Visionary Area */}
      <header className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 h-1.5 bg-gradient-to-l from-indigo-600 via-indigo-500 to-amber-500 w-full" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة علاقات العملاء والشركاء (B2B CRM)</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">بوابة الشراكة الاستراتيجية وحوكمة علاقات المطورين وأصحاب المصلحة في المشروعات القومية والإنشائية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">آخر مزامنة ذكية: اليوم 01:05 م</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </header>

      {/* Strategic Zone Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('strategy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'strategy'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award size={15} />
          <span>1. الرؤية الإستراتيجية للشراكة</span>
        </button>
        <button
          onClick={() => setActiveSubTab('lifecycle')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'lifecycle'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText size={15} />
          <span>2. دورة حياة العميل والتكامل الرقمي</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles size={15} />
          <span>3. الذكاء الاصطناعي لخدمة العملاء</span>
        </button>
        <button
          onClick={() => setActiveSubTab('stakeholders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'stakeholders'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={15} />
          <span>4. إدارة أصحاب المصلحة والتوقعات</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('matrix');
            setSelectedClient(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>5. مصفوفة تتبع مشاريع العملاء</span>
        </button>
      </div>

      {/* Main Strategic Panels Layout */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: الرؤية الإستراتيجية للشراكة */}
          {activeSubTab === 'strategy' && (
            <motion.div
              key="strategy-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-right"
            >
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-indigo-700 font-black">
                  <Award size={18} />
                  <h2 className="text-lg">حوكمة العلاقات والشراكات الاستراتيجية بعيدة المدى</h2>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                  إن إدارة علاقات العملاء في قطاع الإنشاءات الهندسية الكبرى ومشاريع البنية التحتية والمقاولات العامة تتعدى مفهوم البرمجيات التقليدية وإشعارات البيع بالتجزئة. في <strong>بنيان لخدمات الإنشاء الذكية</strong>، نقف على أرضية صلبة ترتكز على مبدأ أساسي: <strong>"العميل ليس مجرد مستفيد من عقد مرحلي، بل هو شريك نجاح استراتيجي ومستثمر طويل الأجل"</strong>.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                  تقوم رؤيتنا على تأسيس شراكات مستدامة تتصف بـ <strong>الشفافية الهندسية المطلقة والنزاهة التعاقدية</strong>، والعمل ككتلة واحدة مدمجة تضمن تحقيق أعلى كفاءة مالية وتصميمية ممكنة دون الإخلال بالمواصفة الفنية أو التفريط بالجدول الزمني المعتمد للمشروعات.
                </p>
              </div>

              {/* الالتزام المؤسسي للعملاء */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-3">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-xs font-black text-indigo-950 mb-2">1. الشفافية والنزاهة التعاقدية</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                      نلتزم بمشاركة البيانات الفورية وحجم التوريدات وجداول صب الخرسانات ونتائج عينات المختبرات مع ممثلي العملاء والاستشاريين لحظة بلحظة. لا تستر على الأخطاء، بل تصحيح فوري هندسي جماعي يحمي توازن المشروع.
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-600 mt-4 font-mono">B2B Standard - Clause 4.1</span>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-3">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-xs font-black text-emerald-950 mb-2">2. الاستجابة الفورية والامتثال الفني</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                      الاستجابة لطلبات فحص الأعمال (RFIs) والخطابات الرسمية تتم وفقاً لمؤشر أداء صارم (SLA) لا يتعدى 24 ساعة للبنود الحرجة في المسار الزمني، لضمان استقرار الإنتاجية الميدانية ومنع تأخر الأطقم الفنية.
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 mt-4 font-mono">SLA Response Speed: &lt; 24h</span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-3">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-xs font-black text-amber-950 mb-2">3. الالتزام المطلق بالجودة والمسار الزمني</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                      المطابقة التامة لمواصفات الكود المصري والعالمي في كافة الصبات والمواد الإنشائية الموردة، مع تقديم خطة عمل تداركي استباقية عند رصد أدنى احتمالية لحياد الجدول الزمني المعتمد للمايلستونز.
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-amber-600 mt-4 font-mono">Precision Quality Guarantee</span>
                </div>

              </div>

              {/* Quotes or Corporate Guidelines */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
                <div className="absolute left-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">النهج الذهبي في إدارة الشركاء</h4>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed text-justify">
                      "إن بناء الكباري وتشييد الأبراج ومحطات المياه لا يرتكز فقط على جودة الخرسانة والحديد، بل يقوم بالدرجة الأولى على أساس متين من الثقة الفنية المتبادلة والاحترام المشترك لبنود العقود ومواصفات التحكم بالهدر والزمن المتبادل."
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-slate-850 border border-slate-800 rounded-xl text-center shrink-0">
                    <p className="text-[9px] text-slate-400 font-bold">مهندس رائد</p>
                    <p className="text-xs font-black text-indigo-300">الرئيس التنفيذي للتجارة والتعاقدات</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: دورة حياة العميل والتكامل الرقمي */}
          {activeSubTab === 'lifecycle' && (
            <motion.div
              key="lifecycle-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-right"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Pre-qualification */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-black">
                    <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-indigo-700">01</span>
                    <h3 className="text-xs">مرحلة ما قبل التعاقد والتأهيل فئة أ</h3>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                    تبدأ حوكمة العلاقة مع الجهات والمطورين بإعداد ملفات التأهيل المسبق (Pre-qualification File) الدقيقة والتي تضم الملاءة المالية، قائمة المشروعات السابقة المنجزة بنجاح، شهادات الأيزو، والسير الذاتية لأطقم القيادة الهندسية لضمان الثقة والنزاهة التامة في المناقصات والعطاءات (RFPs).
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>مراجعة المستندات المالية للمناقصة</span>
                      <span className="text-emerald-600">منجز 100%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>مطابقة الكود الفني للأجهزة</span>
                      <span className="text-emerald-600">منجز 100%</span>
                    </div>
                  </div>
                </div>

                {/* 2. Unified Client Portal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-black">
                    <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-indigo-700">02</span>
                    <h3 className="text-xs">لوحة تحكم العميل الموحدة (Unified Portal)</h3>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                    يحظى عملاؤنا بحسابات وصول آمنة متكاملة في لوحة تحكمهم الموحدة. تتيح هذه البوابة للمالك واستشارييه مراقبة تطور بنود الأعمال ومعدلات صب اليوم ومراحل التدفق النقدي والمستخلصات المعتمدة ونتائج المختبر في شاشة لحظية واحدة.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>بوابة الاستشاري لمراجعة الـ RFIs</span>
                      <span className="text-indigo-600 font-black">نشط ومحدث</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>إشعارات الاعتمادات المالي التلقائية</span>
                      <span className="text-indigo-600 font-black">نشط ومحدث</span>
                    </div>
                  </div>
                </div>

                {/* 3. Correspondence Governance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-black">
                    <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-indigo-700">03</span>
                    <h3 className="text-xs">إدارة المراسلات والخطابات الرسمية</h3>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                    تنظيم وتوثيق المراسلات الرسمية هندسياً هو حجر الزاوية في تجنب الخلافات والنزاعات القانونية. يسجل النظام كافة المخاطبات والخطابات الواردة والصادرة والإنذارات الزمنية بدقة متناهية لحفظ حقوق الطرفين طبقاً للقوانين السائدة وعقود الفيديك (FIDIC).
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>أرشفة خطابات المالك والمطالبات</span>
                      <span className="text-indigo-600 font-black">مؤرشف رقمياً برقم مرجعي</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>توقيت الرد المعتمد تعاقدياً</span>
                      <span className="text-amber-600 font-black">مراقب بمؤقت زمني</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Interactive Correspondence Generator (Simulated Portal) */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Form */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">صياغة مراسلة تعاقدية رسمية ومزامنتها مع بوابة العميل</h4>
                      <p className="text-[11px] text-slate-500 mt-1">قم بتحرير خطاب رسمي فني لإبلاغ ممثل المالك أو استشاريه بتطور هام بالمشروع لحفظ الحق التعاقدي.</p>
                    </div>

                    <form onSubmit={handleSendMessage} className="space-y-3 text-right">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-700 block">الموضوع / العنوان الرسمي للخطاب *</label>
                          <input
                            required
                            type="text"
                            placeholder="مثال: طلب عاجل لمعاينة حديد تسليح أساسات الجزء الجنوبي"
                            value={corrSubject}
                            onChange={e => setCorrSubject(e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-700 block">الجهة / المطور العقاري المستهدف *</label>
                          <select
                            value={corrRecipient}
                            onChange={e => setCorrRecipient(e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-right"
                          >
                            <option value="">-- حدد المطور العقاري --</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-700 block">نوع الخطاب الموجه</label>
                          <select
                            value={corrType}
                            onChange={e => setCorrType(e.target.value as any)}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-right"
                          >
                            <option value="Outgoing">صادر من المقاول الرئيسي للمالك (Outgoing)</option>
                            <option value="Incoming">وارد من المالك/الاستشاري إلينا (Incoming)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-700 block">مستوى الإلحاح الفني</label>
                          <select
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-right"
                          >
                            <option value="Normal">طبيعي - استعلام روتيني</option>
                            <option value="Urgent">عاجل - يؤثر على صب خرسانة اليوم</option>
                            <option value="Critical">حرج للغاية - يعوق بنداً بالمسار الحرج</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-700 block">نص الخطاب الفني والطلبات الهندسي بالتفصيل *</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="مثال: يرجى التكرم بتوجيه استشاري جودة الموقع لمطابقة حديد التسليح واعتماده اليوم تمهيداً لجدولة الصبة الخرسانية في تمام السابعة صباحاً وتجنب تأخر سيارات توريد خرسانة المقاومة..."
                          value={corrBody}
                          onChange={e => setCorrBody(e.target.value)}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-right leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Send size={14} />
                        <span>تحرير وإرسال الخطاب الموثق فوراً لعميل</span>
                      </button>
                    </form>
                  </div>

                  {/* Simulated Output View */}
                  <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <span className="text-[10px] font-black text-indigo-600">بنيان ERP - نظام الخطابات</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      
                      {submittedMessage ? (
                        <div className="text-center py-8 space-y-3">
                          <CheckCircle2 size={36} className="text-emerald-500 mx-auto animate-bounce" />
                          <p className="text-xs font-black text-slate-800">تم إرسال المراسلة بنجاح !</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">تم تسجيل الخطاب في الأرشيف المالي والوثائقي للمشروع، ومزامنته فوراً في لوحة تحكم الاستشاري برقم كودي مشفر.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 text-right">
                          <p className="text-[10px] font-black text-slate-400">معاينة الخطاب التعاقدي الصادر:</p>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <p className="text-[11px] font-black text-slate-900 leading-snug">{corrSubject || 'العنوان يظهر هنا...'}</p>
                            <p className="text-[9px] text-slate-400">المستقبل: {corrRecipient || 'جهة المطور العقاري...'}</p>
                            <p className="text-[10px] text-slate-650 leading-relaxed line-clamp-4">{corrBody || 'محتوى الخطاب الفني والطلبات الهندسية تظهر هنا للمراجعة التلقائية وتدقيق بنود الفيديك...'}</p>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono space-y-1">
                            <div>المرجع: BUN-CRM-LTR-2026-06</div>
                            <div>المرسل: مهندس فني / مكتب بنيان التعاقدي</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>صادر معتمد فني</span>
                      <span>سكيور SSL 256</span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: الذكاء الاصطناعي في خدمة العملاء */}
          {activeSubTab === 'ai' && (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-right"
            >
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-2 text-indigo-700 font-black">
                  <BrainCircuit size={18} className="text-indigo-600" />
                  <h2 className="text-lg">دمج الذكاء الاصطناعي والتحليلات التنبؤية في حوكمة الشراكات الإنشائية</h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                  يضم نظام <strong>بنيان ERP</strong> نموذج ذكاء اصطناعي داخلي مخصص ومحسّن لتحليل البيانات التشغيلية والمستندية للمشروعات. يقوم النموذج بمعالجة المدخلات من سجلات حضور العمالة، وسرعة صب الخرسانات، وتوقيت الرد على الـ RFIs، ومعدل إغلاق تقارير حالات عدم المطابقة لتقديم توقعات دقيقة لحالة العميل وقراراته.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-150 space-y-2">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-indigo-600" />
                      <span>التنبؤ برضا العملاء (Predictive Sat-Score)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                      تقوم لوحة تحكمنا بتحليل الفحوصات الفاشلة وعدد الاستفسارات الموجهة لتتوقع نسبة رضا المالك بدقة. نمنحك تدخلاً استباقياً يعالج العثرة الفنية قبل أن تسبب تراجعاً حقيقياً في ثقة الجهة المطورة.
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-150 space-y-2">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <RefreshCw size={14} className="text-indigo-600 animate-spin-slow" />
                      <span>التحديثات التلقائية للمشاريع (Auto Progress)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                      إرسال آلي وتلقائي للتقارير والمايلستونز الهندسية المعتمدة لبريد المطور وإتاحتها في حسابه الرقمي فور الانتهاء والتحقق من اختبارات تكسير المكعبات لمصداقية تامة وحماية الشراكة.
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-150 space-y-2">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>التحليل الذكي للمطالبات وتعديلات BOQ</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                      تقييم فوري لأوامر التغيير المطلوبة (Variations) ومطابقتها بأسعار العقد الأصلي والكميات ومعدلات التضخم لتقديم صياغة متوازنة ومقبولة لدى مستشاري العملاء لحفظ حقوقنا المالية والتشغيلية.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Simulator Engine Interactivity */}
              <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-550/10 blur-3xl rounded-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Left input form for change order simulation */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-950 border border-indigo-900 text-indigo-400 rounded-lg text-[10px] font-mono">BUN-AI ENGINE</span>
                      <h3 className="text-sm font-black text-white">محاكي الذكاء الاصطناعي لتقييم أوامر التغيير والمطالبات (Claims Simulator)</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      أدخل التكلفة المقدرة لأمر التغيير الطارئ أو المخطط الذي تم طلبه من جهة العميل، ليقوم النظام بتحليل الخطورة القانونية والمالية وتأثيرها على رضا العميل بناءً على بنود العقود المعتمدة مسبقاً.
                    </p>

                    <form onSubmit={handleAnalyzeChangeOrder} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-405 block font-bold">التكلفة التقديرية للبند المستحدث (بالجنيه المصري) *</label>
                          <input
                            type="number"
                            value={boqCost}
                            onChange={e => setBoqCost(e.target.value)}
                            placeholder="مثال: 500000"
                            className="w-full text-xs p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none text-left font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-405 block font-bold">نوع التعديل المطلوب من المالك</label>
                          <select
                            value={changeType}
                            onChange={e => setChangeType(e.target.value)}
                            className="w-full text-xs p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                          >
                            <option value="Scope Expansion" className="bg-slate-950 text-white">توسيع نطاق العمل والمواصفات (Scope Expansion)</option>
                            <option value="Material Substitution" className="bg-slate-950 text-white">استبدال خامات معتمدة بأخرى متوفرة (Substitution)</option>
                            <option value="Timeline Acceleration" className="bg-slate-950 text-white">تسريع الجدول الزمني والمايلستونز (Acceleration)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={analyzingChange}
                        className="px-6 py-3 bg-gradient-to-l from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-750 text-white text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {analyzingChange ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>جاري معالجة الكود التعاقدي وتحليل المخاطر...</span>
                          </>
                        ) : (
                          <>
                            <BrainCircuit className="h-4 w-4 text-white" />
                            <span>تحليل المطالبة بالذكاء الاصطناعي الآن</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right result display */}
                  <div className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-black text-indigo-400 mb-3 border-b border-slate-800 pb-2">سجل التحليل والتوصية الهندسية الفورية</h4>
                      
                      {aiAnalysisResult ? (
                        <div className="space-y-3 text-right">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">مستوى مخاطر المطالبة:</span>
                            <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${
                              aiAnalysisResult.riskLevel === 'High' ? 'bg-rose-950 text-rose-400 border border-rose-900' :
                              aiAnalysisResult.riskLevel === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                              'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            }`}>
                              {aiAnalysisResult.riskLevel === 'High' ? 'خطورة مرتفعة' :
                               aiAnalysisResult.riskLevel === 'Medium' ? 'خطورة متوسطة' : 'آمن ومطابق'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">معدل ثقة الخوارزمية (Accuracy):</span>
                            <span className="text-white font-mono font-bold">{aiAnalysisResult.confidenceRate}%</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">البند والمرجعية في العقد:</span>
                            <span className="text-indigo-300 font-bold max-w-[160px] truncate" title={aiAnalysisResult.clauseRef}>{aiAnalysisResult.clauseRef}</span>
                          </div>

                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                            <span className="text-[9px] text-indigo-400 block font-black">التوصية الهندسية الصادرة:</span>
                            <p className="text-[10px] text-slate-300 leading-relaxed text-justify">{aiAnalysisResult.actionRecomm}</p>
                          </div>

                          <div className="text-[9px] text-slate-550 font-mono flex justify-between items-center">
                            <span>تاريخ التحليل: {aiAnalysisResult.dateAnalyzed}</span>
                            <span className="text-emerald-500 font-bold">تطابق الكود</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-3">
                          <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center mx-auto text-slate-500">
                            <BrainCircuit size={24} />
                          </div>
                          <p className="text-xs text-slate-450">في انتظار إرسال بيانات المطالبة لإطلاق المعالج التنبئي وتحليل بنود الفيديك...</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: إدارة أصحاب المصلحة وتلبية التوقعات */}
          {activeSubTab === 'stakeholders' && (
            <motion.div
              key="stakeholders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-right"
            >
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-2 text-indigo-700 font-black">
                  <MessageSquare size={18} />
                  <h2 className="text-lg">مواءمة أصحاب المصلحة وتلبية توقعات ممثلي العملاء والاستشاريين</h2>
                </div>
                
                <p className="text-xs text-slate-650 leading-relaxed text-justify">
                  المشروعات الهندسية الكبرى تشهد تنوعاً واسعاً في أصحاب المصلحة (Stakeholders): من المطورين الماليين للمشروع، الجهات التنظيمية والحكومية المانحة للتراخيص، الاستشاريين المشرفين على الجودة والبنود (Consultants / PMCs)، والمهندسين والعمال بالموقع. إن الإدارة الذكية للأطراف المتداخلة تتطلب فك الطلاسم الفنية والمواءمة المستمرة لضمان وحدة الرؤية.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-indigo-600" />
                      <span>مواءمة التوقعات (Expectation Match)</span>
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                      ربط وتكامل ممثلي المطورين فستري في الموقع مع أطقم التوريد بموقع العمل. يتم تحديث التغيرات اليومية لتنسجم المشتريات والصبات والتشطيبات مع رغبات وتطلعات أصحاب القرار مسبقاً وبصورة منهجية لحظر تكرار تعديل البنود.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <MessageSquare size={15} className="text-indigo-600" />
                      <span>إشعار واستطلاع الرأي (Feedback Loops)</span>
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                      تطبيق دورات مراجعة وتقييم دورية (Post-Project & Mid-Project Audits) تبحث في مدى كفاءة التواصل وسرعة الرد واستيعاب المتغيرات الطارئة. يتم تقييم التعليقات وترجمتها فوراً إلى نقاط تدريبية للأطقم الفنية.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-indigo-600" />
                      <span>إدارة الأزمات وحل النزاعات ودياً</span>
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                      تبني نظام الإجراءات الودية المسبقة لفض النزاعات الفنية أو التجارية (Amicable Dispute Resolution) لتفادي اللجوء للتحكيم أو القضاء وحماية استمرارية العمل وصحة العلاقات الاستراتيجية والتعاقدية بين الطرفين.
                    </p>
                  </div>

                </div>
              </div>

              {/* Dispute Resolution and Grievances Framework */}
              <div className="bg-gradient-to-br from-amber-500/5 via-amber-600/5 to-transparent p-6 rounded-3xl border border-amber-200">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Strategic Chart / Path */}
                  <div className="flex-1 space-y-3">
                    <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="text-amber-700" size={16} />
                      <span>مخطط الإجراءات الثلاثية للتعامل مع الخلافات الهندسية الطارئة (Dispute Framework)</span>
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed text-justify">
                      عند حدوث اختلاف في تفسير بند هندسي أو مواصفة تشطيب معينة بين المقاول واستشاري المالك، يتم تفعيل الآلية التالية ودياً بدلاً من تعطيل أعمال الصب:
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0">1</span>
                        <div>
                          <h5 className="text-[11px] font-black text-slate-900">المعاينة الفنية الثلاثية المشتركة (Tripartite Joint Inspection)</h5>
                          <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">نزول لجنة فنية فورية تضم رئيس قطاع جودة المقاول، واستشاري المالك، والمهندس الفاحص لمعاينة العيب أو البند رصداً هندسياً محايداً بالصور والتحليل المجهري.</p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0">2</span>
                        <div>
                          <h5 className="text-[11px] font-black text-slate-900">الاحتكام لمكتب استشاري ثالث مستقل (Independent Adjudicator)</h5>
                          <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">في حال تعثر الوصول لتوافق حول معدلات هدر البند أو الكفاءة، يتم إرسال عينات مكعبات الخرسانة أو المواد لمختبر جامعي حكومي مستقل لاعتماد النتيجة كقرار فني قاطع غير متحيز.</p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0">3</span>
                        <div>
                          <h5 className="text-[11px] font-black text-slate-900">التوافق التجاري والتسوية الودية (Amicable Settlement Settlement)</h5>
                          <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">اجتماع الرئيس التنفيذي للتجارة والتعاقدات مع الرئيس المالي لجهة التطوير للوصول لتسوية ودية متوازنة لخصم جزء من القيمة أو عمل تسوية بديلة بمناطق إنشائية تالية دون إثارة نزاعات قضائية معقدة.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grievances Protocol Panel */}
                  <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="h-10 w-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">بروتوكول حماية السمعة المؤسسية</h4>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed text-justify">
                        يُمنع منعاً باتاً من كافة المهندسين الإنشائيين الدخول في نقاشات حادة أو مشادات كلامية مع ممثلي الاستشاري في الميدان. يتم تسجيل أي تعليق سلبي في "سجل رصد الخلافات" مع تفعيل لجنة الفحص الفوري بالمسارات الودية الثلاث لحماية سمعة شركة بنيان والحفاظ على توازن مشروعاتنا.
                      </p>
                    </div>
                    
                    <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>إصدار بروتوكول: v2.0</span>
                      <span className="text-amber-600 font-bold">بنيان للنزاهة</span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: مصفوفة تتبع بوابات ومشاريع العملاء */}
          {activeSubTab === 'matrix' && (
            <motion.div
              key="matrix-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-right"
            >
              
              {/* Filter controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-xs">
                
                <div className="relative w-full md:max-w-md">
                  <input 
                    type="text" 
                    placeholder="بحث باسم العميل، المطور، اسم المشروع أو الاستشاري..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[11px] font-black text-slate-400 shrink-0">حالة التمويل:</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right w-full md:w-48 outline-none"
                  >
                    <option value="all">كافة مستويات التمويل</option>
                    <option value="Excellent">ممتاز (Excellent)</option>
                    <option value="Good">جيد (Good)</option>
                    <option value="Needs Attention">بحاجة لمتابعة (Needs Attention)</option>
                    <option value="Critical">حرج (Critical)</option>
                  </select>
                </div>

              </div>

              {/* Interactive Client Dashboard Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-row-reverse">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-black">العملاء النشطين: {filteredClients.length} جهات مطورة</span>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">لوحة المراقبة الاستراتيجية ومصفوفة رضا العملاء المدعومة بالذكاء الاصطناعي</h4>
                </div>

                {filteredClients.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                      <Users size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-800">لا توجد جهات مطابقة للبحث</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">يرجى تعديل مصطلح البحث أو فلتر حالة التمويل والاعتمادات لإظهار بيانات المطورين.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-150">
                          <th className="p-4">اسم العميل / الجهة المطورة</th>
                          <th className="p-4">المشروع الحالي النشط</th>
                          <th className="p-4">الممثل الفني للعميل (PMC / Consultant)</th>
                          <th className="p-4 text-center">نسبة الرضا المتوقعة (AI Sat-Score)</th>
                          <th className="p-4">حالة المدفوعات والاعتمادات المالي</th>
                          <th className="p-4 text-center">الإجراءات والبيانات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClients.map((client) => (
                          <tr key={client.id} className="hover:bg-slate-50/80 transition font-bold">
                            <td className="p-4 text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-xs shrink-0 font-mono">
                                  {client.id.split('-')[1]}
                                </div>
                                <div>
                                  <span className="block font-black">{client.name}</span>
                                  <span className="block text-[9px] text-slate-400 mt-0.5">التأهيل: {client.preQualStatusAr}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 leading-tight">
                              <div>
                                <span>{client.project}</span>
                                <span className="block text-[9.5px] text-indigo-600 mt-1 font-mono">قيمة العقد الإجمالية: {client.contractValue}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600">{client.consultant}</td>
                            <td className="p-4">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <span className={`text-xs font-black font-mono ${
                                  client.aiSatScore >= 90 ? 'text-emerald-600' :
                                  client.aiSatScore >= 75 ? 'text-indigo-600' : 'text-rose-600'
                                }`}>{client.aiSatScore}%</span>
                                
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      client.aiSatScore >= 90 ? 'bg-emerald-500' :
                                      client.aiSatScore >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${client.aiSatScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-[10.5px]">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black ${
                                client.financialStatus === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                client.financialStatus === 'Good' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                client.financialStatus === 'Needs Attention' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                'bg-rose-50 text-rose-700 border border-rose-150'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${
                                  client.financialStatus === 'Excellent' ? 'bg-emerald-500' :
                                  client.financialStatus === 'Good' ? 'bg-indigo-500' :
                                  client.financialStatus === 'Needs Attention' ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                                {client.financialStatusAr.split(' - ')[0]}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedClient(client)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[10.5px] font-black rounded-lg transition"
                              >
                                عرض تفاصيل الشراكة &larr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Interactive Detail Slide-over / Modal for selected Client */}
              <AnimatePresence>
                {selectedClient && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
                  >
                    <motion.div 
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden text-right"
                    >
                      {/* Modal Header */}
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-row-reverse">
                        <button 
                          onClick={() => setSelectedClient(null)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-800 transition"
                        >
                          إغلاق النافذة
                        </button>
                        <div>
                          <h3 className="text-base font-black text-slate-900">{selectedClient.name}</h3>
                          <p className="text-[11px] text-slate-400 mt-1">تفاصيل وحوكمة الشراكة والبيانات التعاقدية الشاملة</p>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                            <span className="text-[9.5px] text-indigo-700 block font-black uppercase">التحليل الإستراتيجي والذكاء الاصطناعي (AI Analysis)</span>
                            <p className="text-xs text-slate-700 leading-relaxed text-justify">{selectedClient.aiAnalysis}</p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <span className="text-[9.5px] text-slate-500 block font-black uppercase">البيانات الفنية والمالية للتعاقد</span>
                            
                            <div className="space-y-1.5 text-xs text-slate-650">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold">المشروع النشط:</span>
                                <span className="font-black text-slate-900">{selectedClient.project.split(' - ')[0]}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold">استشاري المالك:</span>
                                <span className="font-black text-slate-900">{selectedClient.consultant}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold">حجم التعاقد الإجمالي:</span>
                                <span className="font-black text-indigo-700 font-mono">{selectedClient.contractValue}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold">حالة التمويل والمستخلصات:</span>
                                <span className="font-black text-slate-900 text-[10px]">{selectedClient.financialStatusAr}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Correspondence Log */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <MailOpen size={14} className="text-indigo-600" />
                            <span>آخر الخطابات والمراسلات المسجلة مع هذا المطور</span>
                          </h4>
                          
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                              <div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  selectedClient.lastCorrespondence.type === 'Incoming'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {selectedClient.lastCorrespondence.type === 'Incoming' ? 'وارد من المطور' : 'صادر للمطور'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{selectedClient.lastCorrespondence.date}</span>
                            </div>

                            <p className="text-xs font-black text-slate-950">{selectedClient.lastCorrespondence.subject}</p>
                            
                            <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400">
                              <span>حالة الرد: <strong className="text-slate-700 font-bold">{selectedClient.lastCorrespondence.statusAr}</strong></span>
                              <span>المرجع: BUN-LTR-REV-09</span>
                            </div>
                          </div>
                        </div>

                        {/* Claims & Submissions Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-center">
                            <span className="text-[9.5px] text-slate-450 block font-bold">إجمالي المطالبات</span>
                            <span className="text-base font-black text-slate-850 font-mono mt-1 block">{selectedClient.totalClaimsCount} طلبات</span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-center">
                            <span className="text-[9.5px] text-slate-450 block font-bold">معدل اعتماد المطالبات</span>
                            <span className="text-base font-black text-emerald-600 font-mono mt-1 block">{selectedClient.approvedClaimsRate}%</span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-center">
                            <span className="text-[9.5px] text-slate-450 block font-bold">حالة التأهيل المسبق</span>
                            <span className="text-xs font-black text-indigo-600 mt-1.5 block">{selectedClient.preQualStatusAr.split(' (')[0]}</span>
                          </div>
                        </div>

                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 flex-row-reverse">
                        <button
                          onClick={() => setSelectedClient(null)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          العودة للمصفوفة العامة
                        </button>
                      </div>

                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
