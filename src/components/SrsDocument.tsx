/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Database, 
  Key, 
  Cpu, 
  GitBranch, 
  Grid, 
  Terminal, 
  MapPin, 
  Check, 
  Layers, 
  ShieldCheck, 
  Network, 
  HelpCircle,
  Code,
  Building,
  RefreshCw,
  Info
} from 'lucide-react';

export default function SrsDocument() {
  const [srsSection, setSrsSection] = useState<string>('architecture');
  const [selectedTable, setSelectedTable] = useState<string>('Projects');
  const [searchTableTerm, setSearchTableTerm] = useState<string>('');

  // 1. Database Table schemas & relations ( Primavera + SAP Construction aligned)
  const dbTables = [
    {
      name: 'Users',
      category: 'الإدارة والخصوصية',
      description: 'جدول حسابات الموظفين والمستخدمين للنظام بفروعه المتعددة.',
      columns: [
        { name: 'id', type: 'UUID', desc: 'المعرف الفريد للمستخدم (Primary Key)' },
        { name: 'username', type: 'VARCHAR(100)', desc: 'اسم المستخدم فريد لتسجيل الدخول' },
        { name: 'email', type: 'VARCHAR(255)', desc: 'البريد الإلكتروني' },
        { name: 'password_hash', type: 'VARCHAR(512)', desc: 'كلمة المرور المشفرة عشوائياً' },
        { name: 'role_id', type: 'UUID', desc: 'العلاقة مع صلاحيات الدور (Foreign Key -> Roles.id)' },
        { name: 'company_id', type: 'UUID', desc: 'محدد الشركة الفوقي للحماية المتعددة (FK -> Companies.id)' },
        { name: 'branch_id', type: 'UUID', desc: 'فرع العمل المباشر (FK -> Branches.id)' },
        { name: 'status', type: 'VARCHAR(20)', desc: 'نشط، معطل، إيقاف مؤقت' }
      ]
    },
    {
      name: 'Projects',
      category: 'إدارة المشروعات والتعاقدات',
      description: 'الجدول الرئيسي لجميع عقود مشاريع الطرق والمقاولات تحت المراقبة والمتابعة.',
      columns: [
        { name: 'id', type: 'UUID', desc: 'معرف المشروع الفريد (PK)' },
        { name: 'code', type: 'VARCHAR(50)', desc: 'كود المشروع الحسابي والهندسي (مثل PRJ-RD-2026)' },
        { name: 'name', type: 'VARCHAR(255)', desc: 'الاسم الرسمي للمشروع المقيد بكراسة الشروط' },
        { name: 'owner_id', type: 'UUID', desc: 'معرف مالك المشروع (الجهة المالكة مثلا وزارة النقل)' },
        { name: 'consultant_id', type: 'UUID', desc: 'معرف الاستشاري الفني المشرف على الجودة والربط' },
        { name: 'contract_value', type: 'DECIMAL(18,2)', desc: 'القيمة الشاملة الكلية للمشروع' },
        { name: 'insurance_value', type: 'DECIMAL(15,2)', desc: 'قيمة الضمان البنكي والتامين الابتدائي' },
        { name: 'start_date', type: 'DATE', desc: 'تاريخ بداية صب الأساسات والمباشرة' },
        { name: 'end_date', type: 'DATE', desc: 'تاريخ نهاية التعاقد الفعلي قبل غرامات التأخير' },
        { name: 'progress_percent', type: 'DECIMAL(5,2)', desc: 'نسبة الإنجاز الفعلية من واقع الـ WBS' }
      ]
    },
    {
      name: 'Equipment',
      category: 'الأسطول والمعدات الثقيلة',
      description: 'تتبع شامل لجميع معدات رصف الطرق (جريدر، لودر، قشاطة إسفلت، فنشر).',
      columns: [
        { name: 'id', type: 'UUID', desc: 'المعرف الفريد للمعدة (PK)' },
        { name: 'code', type: 'VARCHAR(50)', desc: 'كود المعدة الداخلي بالمخازن (مثل EQ-GRD205)' },
        { name: 'name', type: 'VARCHAR(150)', desc: 'اسم المعدة وماركتها الفنية' },
        { name: 'type', type: 'VARCHAR(50)', desc: 'نوع المعدة (لودر، هراس، بلدوزر، فنشر... الخ)' },
        { name: 'plate_no', type: 'VARCHAR(30)', desc: 'رقم لوحة المركبة بمصلحة المرور للدولة' },
        { name: 'status', type: 'VARCHAR(30)', desc: 'نشط، صيانة دورية، صيانة طارئة، معطل' },
        { name: 'fuel_rate_per_hour', type: 'DECIMAL(8,2)', desc: 'معدل حرق اللترات لكل ساعة عمل ميدانية لضبط الهدر' }
      ]
    },
    {
      name: 'FuelTransactions',
      category: 'إدارة الوقود والزيوت',
      description: 'سجل حركات خزان الديزل والسولار والمنصرف منه لكل معدة باللتر وسعر تكلفته اليومية.',
      columns: [
        { name: 'id', type: 'UUID', desc: 'معرف الحركة الفريد (PK)' },
        { name: 'fuel_station_id', type: 'UUID', desc: 'المحطة الفرعية أو الخزان المتنقل المصروف منه الزيوت (FK)' },
        { name: 'equipment_id', type: 'UUID', desc: 'المعدة المستلمة للوقود لضبط معدلات الاستهلاك (FK)' },
        { name: 'quantity_liters', type: 'DECIMAL(10,2)', desc: 'سعة المنصرف باللترات الدقيقة' },
        { name: 'cost_per_liter', type: 'DECIMAL(8,2)', desc: 'سعر التكلفة لكل لتر لتحديث مركز التكلفة فوراً' },
        { name: 'driver_id', type: 'UUID', desc: 'السائق المستلم للوقود والمسؤول عنه قانونيا' },
        { name: 'project_id', type: 'UUID', desc: 'المشروع الذي استنفذت به كميات الوقود لربط الربحية' }
      ]
    },
    {
      name: 'LabTests',
      category: 'الجودة والتحاليل والمواصفات QA/QC',
      description: 'سجلات جودة إسفلت الطرق واختبارات التربة ومقاييس مارشال والكثافة ومقاومة القص الطولي.',
      columns: [
        { name: 'id', type: 'UUID', desc: 'معرف الاختبار (PK)' },
        { name: 'rfi_id', type: 'UUID', desc: 'طلب الفحص الإنشائي المرتبط بالاختبار (FK -> RFIs.id)' },
        { name: 'test_type', type: 'VARCHAR(50)', desc: 'نوع الاختبار (كثافة حقلية، تدرج حبيبي، ثبات مارشال، CBR)' },
        { name: 'result_status', type: 'VARCHAR(20)', desc: 'مقبول (Passed) / مرفوض (Failed) / معلق بالفحص (Pending)' },
        { name: 'density_value', type: 'DECIMAL(6,3)', desc: 'قيمة الكثافة g/cm³ في حالة اختبارات دمك التربة' },
        { name: 'marshall_stability', type: 'DECIMAL(10,2)', desc: 'ثبات اختبار مارشال بالرطل لطبقات الإسفلت الساخن' },
        { name: 'sieve_analysis_json', type: 'TEXT', desc: 'بيانات التدرج الحبيبي للمنخل ومقاس الركام المستعمل' },
        { name: 'engineer_id', type: 'UUID', desc: 'المهندس أو فني المعمل الذي قام بأخذ وفحص العينات' }
      ]
    },
    {
      name: 'HseIncidents',
      category: 'السلامة والصحة المهنية HSE',
      description: 'سجل الحوادث والسلامة لضمان بيئة عمل خالية من الحوادث ومطابقة لمواصفات الأيزو 45001.',
      columns: [
        { name: 'id', type: 'UUID', desc: 'معرف الحادث الفريد (PK)' },
        { name: 'project_id', type: 'UUID', desc: 'الموقع أو المشروع الذي وقع به الحادث أو الإجراء (FK)' },
        { name: 'incident_date', type: 'TIMESTAMP', desc: 'التوقيت الفعلي للاكتشاف' },
        { name: 'type', type: 'VARCHAR(50)', desc: 'إصابة عمل، شبه حادث (Near Miss)، أضرار مادية، بيئي' },
        { name: 'severity', type: 'VARCHAR(20)', desc: 'خفيف، متوسط، جسيم، كارثي' },
        { name: 'description', type: 'TEXT', desc: 'تفاصيل الحادث والظروف الميدانية وقت الحدوث' },
        { name: 'action_taken', type: 'TEXT', desc: 'الإجراءات التصحيحية الفورية المتخذة لإقفال الملف' },
        { name: 'closed_status', type: 'BOOLEAN', desc: 'عرض هل تم إغلاق القضية والتحقيق أم لا' }
      ]
    },
    {
      name: 'CustodyTransactions',
      category: 'الحسابات والمالية العامة',
      description: 'تتبع حركة العهد الموقعية وتسليم الكاش النقدي للأبواب الخمس وإقفال الفواتير الدقيق.',
      columns: [
        { name: 'id', type: 'UUID', desc: 'معرف المعاملة (PK)' },
        { name: 'treasury_id', type: 'UUID', desc: 'الخزينة المفرجة عن الكاش المالي للمهندس (FK)' },
        { name: 'engineer_id', type: 'UUID', desc: 'المهندس صاحب العهدة المشرف بالميدان (FK)' },
        { name: 'amount', type: 'DECIMAL(15,2)', desc: 'المبلغ المالي المفرج عنه للصرف للمقاولين الصغار' },
        { name: 'status', type: 'VARCHAR(30)', desc: 'معلق بالصفي، تم التسوية فواتير بالكامل، مصفى جزئياً' },
        { name: 'audit_log_id', type: 'UUID', desc: 'ربط المعاملة بالقيد اليومي التلقائي لتوثيق السند' }
      ]
    }
  ];

  // Filters for searching tables
  const filteredTables = dbTables.filter(t => 
    t.name.toLowerCase().includes(searchTableTerm.toLowerCase()) ||
    t.category.includes(searchTableTerm)
  );

  // 2. Interactive Role-Based Access Control Matrix
  const [roleMatrix, setRoleMatrix] = useState([
    { module: 'تهيئة الشركات والفروع والعملات', admin: true, exec: true, pm: false, accountant: false, qa: false, hse: false },
    { module: 'شجرة الحسابات والقيود اليومية والترحيل', admin: true, exec: false, pm: false, accountant: true, qa: false, hse: false },
    { module: 'اعتماد المستخلصات والموافقة المالية وعقود المالك', admin: true, exec: true, pm: true, accountant: true, qa: false, hse: false },
    { module: 'صرف وقود وعمليات تشغيل وإيجار المعدات', admin: true, exec: false, pm: true, accountant: true, qa: false, hse: false },
    { module: 'تعديل الجدول الزمني WBS والمسار الحرج', admin: true, exec: false, pm: true, accountant: false, qa: false, hse: false },
    { module: 'إدخال نتائج تحاليل الجودة (مارشال، كثافة الأرصفة)', admin: true, exec: false, pm: true, accountant: false, qa: true, hse: false },
    { module: 'تسجيل وتبليغ حوادث ومخالفات السلامة HSE', admin: true, exec: false, pm: true, accountant: false, qa: false, hse: true },
    { module: 'كشوف الحضور والغياب للعمال والموظفين واليوميات', admin: true, exec: false, pm: true, accountant: true, qa: false, hse: false }
  ]);

  const togglePermission = (index: number, role: 'admin' | 'exec' | 'pm' | 'accountant' | 'qa' | 'hse') => {
    // Make RBAC interactive for supreme UI polish
    setRoleMatrix(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [role]: !copy[index][role]
      };
      return copy;
    });
  };

  // 3. API blueprints for integration
  const apiBlueprints = [
    {
      method: 'POST',
      endpoint: '/api/v1/projects',
      desc: 'إنشاء مشروع إنشاء طريق أو تشييد بنية تحتية جديد مع ربط المالك والاستشاري والقيمة التصديرية.',
      request: `{
  "code": "PRJ-RD3-NEW2026",
  "name": "طريق مرسى علم - شلاتين الإستراتيجي المزدوج",
  "ownerId": "7db01290-77a8-12ee-b962-0242ac120002",
  "consultantId": "9f9a11a2-11b2-22c3-c2c3-112233445566",
  "contractValue": 142500000.00,
  "insuranceValue": 1425000.00,
  "startDate": "2026-07-01",
  "endDate": "2027-12-31",
  "budgetLines": [
    {"category": "supplies", "allocation": 45000000.00},
    {"category": "equipment", "allocation": 35000000.00}
  ]
}`,
      response: `{
  "status": "success",
  "statusCode": 201,
  "message": "Project Created Successfully",
  "data": {
    "projectId": "8da823c0-33bf-488b-a7e8-e24c5b369c0d",
    "ganttId": "GNT-2026-9901",
    "createdAt": "2026-06-14T09:37:08Z"
  }
}`
    },
    {
      method: 'POST',
      endpoint: '/api/v1/qc/lab-tests',
      desc: 'تسجيل فوري لنتيجة مخبرية فنية لدمك السن أو استواء الأسفلت لمدير الجودة لإصدار إذن الفحص الفني.',
      request: `{
  "rfiCode": "RFI-RD3-SEC1-029",
  "testType": "density",
  "densityValue": 2.18,
  "compactionPercentage": 98.4,
  "inspectorId": "usr-889102-qa",
  "notes": "الكثافة مطابقة للكود المصري للطرق وتمت في درجة حرارة حرجة مناسبة."
}`,
      response: `{
  "status": "passed",
  "testId": "tst-2281890-a",
  "authorizedForAsphaltLaying": true,
  "logTimestamp": "2026-06-14T09:38:00Z"
}`
    }
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs" id="srs-document-root">
      
      {/* Top Section Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-mono">SYSTEM SPECIFICATION</span>
          <h2 className="text-xl font-bold font-sans text-slate-900 mt-2 flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" />
            وثيقة التحليل الفني والـ SRS للنظام العملاق "بنيان الذكي"
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">وثيقة البناء الهيكلي المقترحة لشركات الطرق والمقاولات مطابقة لمعايير SAP + Oracle Primavera</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          <button
            onClick={() => setSrsSection('architecture')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              srsSection === 'architecture' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu size={14} />
            معمارية النظام والترابط
          </button>
          
          <button
            onClick={() => setSrsSection('erd')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              srsSection === 'erd' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database size={14} />
            قواعد البيانات والـ ERD
          </button>

          <button
            onClick={() => setSrsSection('rbac')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              srsSection === 'rbac' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck size={14} />
            مصفوفة الصلاحيات T-RBAC
          </button>

          <button
            onClick={() => setSrsSection('apis')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              srsSection === 'apis' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal size={14} />
            واجهات API للتكامل
          </button>

          <button
            onClick={() => setSrsSection('roadmap')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              srsSection === 'roadmap' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GitBranch size={14} />
            خطة التطوير والمراحل
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      
      {/* SECTION 1: ARCHITECTURE PROFILE */}
      {srsSection === 'architecture' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-700">
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-start gap-3">
            <Info className="text-indigo-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-bold text-slate-900 text-xs text-right">رؤية تصميم معمارية المؤسسات (Enterprise Architecture)</h4>
              <p className="text-[11.5px] text-indigo-900/90 leading-relaxed mt-1 text-right">
                يعتمد نظام <strong>بنيان الذكي</strong> على بنية برمجية مفصولة بالكامل (Decoupled Full-Stack Architecture) تجمع بين سرعة الاستجابة الميدانية والتحكم المالي المركزي. تم تصميم النظام ليحاكي أسلوب الـ Headless ERP مدمجاً بدعم الأجهزة الذكية والأوفلاين في المواقع البعيدة لتمكين مهندسي الطرق من رفع البيانات فورياً ومزامنة الكيلومترات المنجزة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
              <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center">
                <Layers size={18} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">البنية الخدمية (Microservices Ready)</h4>
              <p className="text-xs text-slate-500 leading-normal">
                تقسيم النظام إلى خوادم تشغيل منفصلة ومترابطة (Docker containers): خادم المدفوعات والقيود، خادم تتبع أسطول النقل والمعدات الموقعية، خادم الجودة الفنية وتحاليل التربة، وخادم مراقبة المخزون، مما يسمح بتحمل الأحمال العالية دون أي نقاط فشل مفاجئة.
              </p>
            </div>

            <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
              <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center">
                <Network size={18} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">المستأجرين المتعددين (Multi-Tenancy)</h4>
              <p className="text-xs text-slate-500 leading-normal">
                دعم الشركات المتعددة (Multi-Company) والفروع المتعددة (Multi-Branch) برمز عزل منطقي على قاعدة البيانات (Tenant Isolation Model). يتيح دمج شركاء التحالف أو المقاولين المشتركين في مشروع واحد برخص منفصلة وتقارير موحدة للإدارة العليا.
              </p>
            </div>

            <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
              <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-lg flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">الحماية وتتبع العمليات (Audit Trail)</h4>
              <p className="text-xs text-slate-500 leading-normal">
                سجل تتبع أمني كامل (Full Access Logs) يوثق كل معاملة، إدخال نتيجة معمل الجودة، ريادة سحب وقود، أو تعديل في جدول WBS مع تسجيل اسم المستخدم، الطابع الزمني، الآي بي، والبيانات قبل وبعد التعديل لمنع التلاعب وتكذيب المعاملات.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Code size={16} className="text-indigo-600" />
              حزمة التقنيات المقترحة للتطبيق الفعلي (Perfect Tech Stack)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-55 border border-slate-100 rounded-lg">
                <span className="font-bold text-slate-900 block mb-1">واجهة المستخدم (Frontend)</span>
                <p className="text-[11px] text-slate-500">React 18 / Vue 3 + Tailwind CSS مدمجة بنهج Responsive مخصص للوحات وأجهزة الجوال الميدانية للمهندسين.</p>
              </div>
              <div className="p-3 bg-slate-55 border border-slate-100 rounded-lg">
                <span className="font-bold text-slate-900 block mb-1">الخلفية والمحرك (Backend)</span>
                <p className="text-[11px] text-slate-500">Node.js (TypeScript/Express) أو Go lang لأداء ثنائي مميز وسرعة هائلة في معالجة إشارات الـ GPS من الصهاريج والمعدات.</p>
              </div>
              <div className="p-3 bg-slate-55 border border-slate-100 rounded-lg">
                <span className="font-bold text-slate-900 block mb-1">قاعدة البيانات (Database)</span>
                <p className="text-[11px] text-slate-500">PostgreSQL (مع ملحق TimescaleDB لتتبع حرق وقود المعدات الزمني وموقعها) + Redis لتخزين جلسات العمل.</p>
              </div>
              <div className="p-3 bg-slate-55 border border-slate-100 rounded-lg">
                <span className="font-bold text-slate-900 block mb-1">التكامل والمزامنة (Integrations)</span>
                <p className="text-[11px] text-slate-500">مزامنة ممتازة ومباشرة لجداول Gantt من Primavera P6 وملفات SAP الحسابية عبر صيغ XER و REST APIs.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ERD & DATABASE */}
      {srsSection === 'erd' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Table search and list */}
            <div className="w-full lg:w-1/3 bg-slate-50 p-4 border border-slate-200 rounded-lg shrink-0">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">محرك استعلام شجرة الجداول الإنشائية (50+ جدول)</label>
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو التصنيف..."
                  value={searchTableTerm}
                  onChange={(e) => setSearchTableTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {filteredTables.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                      selectedTable === t.name 
                        ? 'bg-indigo-650 text-white shadow-sm' 
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-150'
                    }`}
                  >
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium group-hover:bg-indigo-700">{t.category}</span>
                    <span className="font-mono">{t.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-405 mt-4 text-right">
                💡 يحاكي هذا التصميم شجرة الحسابات والعهد والمستخلصات في كبرى الأنظمة ERP لضبط العلاقات والترابط الدقيق.
              </p>
            </div>

            {/* Selected table columns browser */}
            <div className="flex-1 border border-slate-200 rounded-lg p-5">
              {(() => {
                const tbl = dbTables.find(t => t.name === selectedTable);
                if (!tbl) return <p className="text-center text-xs text-slate-400 py-10">اختر للتفتيش السريع على الحقول والروابط الخارجية</p>;
                return (
                  <div className="space-y-4 text-right">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-row-reverse">
                      <div>
                        <h4 className="font-mono font-bold text-lg text-indigo-700">{tbl.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">{tbl.description}</p>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold font-mono">
                        Primary Key: id (UUID)
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 mb-2">أعمدة وحقول الجدول البرمجية والـ Data Types:</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-slate-700 text-right">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                            <th className="p-2.5">اسم الحقل (Column Name)</th>
                            <th className="p-2.5">النوع (DataType)</th>
                            <th className="p-2.5">البيان الهندسي/الحسابي وشروط الربط</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {tbl.columns.map(col => (
                            <tr key={col.name} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-mono font-bold text-slate-900">{col.name}</td>
                              <td className="p-2.5 font-mono text-indigo-650 font-bold">{col.type}</td>
                              <td className="p-2.5 text-slate-500 font-medium">{col.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ERD Relationship Visualiser Box */}
                    <div className="bg-indigo-50/30 p-4 border border-indigo-100 rounded-lg space-y-2 mt-4 text-xs">
                      <span className="font-bold text-indigo-700 block text-[11px]">رابط الـ ERD والعلاقات التعددية:</span>
                      {selectedTable === 'Projects' && (
                        <p className="text-[11px] leading-relaxed text-indigo-900/80">
                          - علاقة <strong>(1 to Many)</strong> مع جدول <code>WbsTasks</code> لإسناد مهام الجدول الزمني لتنفيذ المسارات.<br />
                          - علاقة <strong>(1 to Many)</strong> مع جدول <code>Contractors</code> لتتبع المقاولين الذين يعملون على المسارات المحددة.<br />
                          - علاقة <strong>(Many to 1)</strong> مع جدول <code>Companies</code> و <code>Branches</code> لتوجيه ومصادقة مستويات ومرافق المراجعة الأعلى.
                        </p>
                      )}
                      {selectedTable === 'Equipment' && (
                        <p className="text-[11px] leading-relaxed text-indigo-900/80">
                          - علاقة <strong>(1 to Many)</strong> مع جدول <code>FuelTransactions</code> لرصد كميات الديزل والسولار المستهلكة.<br />
                          - علاقة <strong>(1 to Many)</strong> مع جدول <code>EquipmentMaintenance</code> لتوثيق فواتير الصيانة والعمل الممنوح لمنع هدر الأسطول.
                        </p>
                      )}
                      {selectedTable === 'LabTests' && (
                        <p className="text-[11px] leading-relaxed text-indigo-900/80">
                          - علاقة <strong>(Many to 1)</strong> مع جدول <code>RFIs</code> (طلب الفحص الموقعي) لمنع رصف أي طبقة إسفلت بموقع الطريق دون نجاح مخبري كامل ومعتمد.<br />
                          - علاقة <strong>(Many to 1)</strong> مع جدول <code>Users</code> لتوثيق المهندس الفاحص للمسؤولية الجنائية والهندسية للدمك.
                        </p>
                      )}
                      {selectedTable !== 'Projects' && selectedTable !== 'Equipment' && selectedTable !== 'LabTests' && (
                        <p className="text-[11px] leading-relaxed text-indigo-900/80">
                          يرتبط هذا الكيان ارتباطاً علائقياً تزامناً مع القيود المحاسبية التلقائية بمجرد اعتماد الحركات التشغيلية (فواتير، تشوين مواد، صرف عهد).
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: INTERACTIVE RBAC */}
      {srsSection === 'rbac' && (
        <div className="space-y-6 animate-fadeIn text-right">
          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl flex items-start gap-2.5">
            <Key className="text-indigo-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-slate-600 leading-normal">
              <strong>جدول الصلاحيات المبني على الأدوار (T-RBAC):</strong> قم بالنقر على أي مربع لتفعيل أو تعطيل صلاحيات الدور التشغيلي لمطابقة الرؤية الصارمة للمالية والجودة. التعديلات تحفظ وتنعكس تزامناً على النظام لحجب الحسابات عن غير العاملين على الأبواب المخصصة.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3 text-right">الوحدة البرمجية / الصلاحية والوظيفة</th>
                  <th className="p-3 text-center">أدمن النظام</th>
                  <th className="p-3 text-center">إدارة عليا (CEO/Executive)</th>
                  <th className="p-3 text-center">مدير مشروع (PM)</th>
                  <th className="p-3 text-center">محاسب المشروعات</th>
                  <th className="p-3 text-center">مهندس جودة QC</th>
                  <th className="p-3 text-center">أخصائي سلامة HSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {roleMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 text-right">{row.module}</td>
                    
                    {/* Admin */}
                    <td className="p-3.5 text-center">
                      <button onClick={() => togglePermission(idx, 'admin')} className="mx-auto block focus:outline-none">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          row.admin ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {row.admin && <Check size={12} />}
                        </div>
                      </button>
                    </td>

                    {/* Exec */}
                    <td className="p-3.5 text-center">
                      <button onClick={() => togglePermission(idx, 'exec')} className="mx-auto block focus:outline-none">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          row.exec ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {row.exec && <Check size={12} />}
                        </div>
                      </button>
                    </td>

                    {/* PM */}
                    <td className="p-3.5 text-center">
                      <button onClick={() => togglePermission(idx, 'pm')} className="mx-auto block focus:outline-none">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          row.pm ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {row.pm && <Check size={12} />}
                        </div>
                      </button>
                    </td>

                    {/* Accountant */}
                    <td className="p-3.5 text-center">
                      <button onClick={() => togglePermission(idx, 'accountant')} className="mx-auto block focus:outline-none">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          row.accountant ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {row.accountant && <Check size={12} />}
                        </div>
                      </button>
                    </td>

                    {/* QA */}
                    <td className="p-3.5 text-center">
                      <button onClick={() => togglePermission(idx, 'qa')} className="mx-auto block focus:outline-none">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          row.qa ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {row.qa && <Check size={12} />}
                        </div>
                      </button>
                    </td>

                    {/* HSE */}
                    <td className="p-3.5 text-center">
                      <button onClick={() => togglePermission(idx, 'hse')} className="mx-auto block focus:outline-none">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          row.hse ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {row.hse && <Check size={12} />}
                        </div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: ENTERPRISE APIS BLUEPRINTS */}
      {srsSection === 'apis' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-right">
            {apiBlueprints.map((api, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center flex-row-reverse border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-[10px] font-black rounded-md ${
                      api.method === 'POST' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {api.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-800">{api.endpoint}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">API ROUTE v1</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{api.desc}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1 text-right">Request Body JSON:</span>
                    <pre className="p-3 bg-slate-900 text-emerald-400 text-[10.5px] rounded-lg overflow-x-auto font-mono max-h-[180px] h-[180px]">
                      {api.request}
                    </pre>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1 text-right">Response JSON (200 OK / 201 Created):</span>
                    <pre className="p-3 bg-slate-950 text-sky-400 text-[10.5px] rounded-lg overflow-x-auto font-mono max-h-[180px] h-[180px]">
                      {api.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: IMPLEMENTATION ROADMAP */}
      {srsSection === 'roadmap' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-700">
          <div className="p-5 border border-slate-200 rounded-xl space-y-5">
            <h4 className="font-sans font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              خارطة طريق التطوير التقني والتنزيل الميداني (Product Roadmap)
            </h4>

            <div className="relative border-r border-indigo-200 mr-4 pr-6 space-y-8 font-sans">
              
              {/* Step 1 */}
              <div className="relative">
                {/* Visual marker dot */}
                <div className="absolute top-1 -right-[31px] w-5 h-5 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center shadow-xs" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold">المرحلة الحالية (مكتملة وصالحة للاختبار)</span>
                    <h5 className="font-bold text-slate-900 text-sm">المرحلة الأولى: حزمة المحاكاة والمطابقة المالية (MVP)</h5>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                    بناء النواة المركزية للتكاليف لضبط الفجوة المالية للودائع والأشغال المنجزة، إدارة كشوفات مقاولي الباطن، مطابقة العهد الميدانية، والتحاليل الفورية للمصاريف تزامناً مع 7 لوحات تحكم ديناميكية للشامل الموقعي.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute top-1 -right-[31px] w-5 h-5 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center shadow-xs" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">الجدولة الافتراضية (الربع القادم v2.0)</span>
                    <h5 className="font-bold text-slate-900 text-sm">المرحلة الثانية: الربط السحابي ومزامنة الخرائط والصهاريج</h5>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                    تفعيل واجهات الـ REST API لربط صمامات محطات الوقود بالمعدات وتفعيل تتبع مسار الشاحنات ومعدات التمهيد والدمك بالـ GPS، وتطوير خاصية مسح الباركود للمواد الإنشائية الواصلة للمشروع.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute top-1 -right-[31px] w-5 h-5 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center shadow-xs" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">التوسع المؤسي (النسخة المتقدمة Enterprise ERP)</span>
                    <h5 className="font-bold text-slate-900 text-sm">المرحلة الثالثة: الإدماج الكلي للذكاء الاصطناعي وتقدير التكاليف Primavera</h5>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                    إتاحة التنبؤ بهدر الوقود باستخدام نماذج التعلم الآلي، استيراد مباشر لملفات كبائن الخلط الخرساني، استماع مباشر لجداول Primavera المتقدمة وعقد المقاصات الرياضية للمشروعات الشقيقة لتوليد كشوف حساب مدمجة لكامل فروع الشركة.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
