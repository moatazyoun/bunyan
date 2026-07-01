/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectCategory = 'supplies' | 'equipment' | 'contractors' | 'fuel' | 'custody' | 'other';

export type PaymentMethod = 'نقدى' | 'شيك' | 'تحويل بنكى' | 'انستا' | 'فودافون كاش' | 'اخرى';

export type TransactionNature = 'inside_custody' | 'outside_custody';

export interface CategoryMetric {
  id: ProjectCategory;
  nameAr: string;
  nameEn: string;
  initialBudget: number; // التكلفة التقديرية للأعمال
  totalSpent: number;    // المنصرف الفعلي من الموقع
  totalExecutedValue: number; // إجمالي تكلفة الأعمال المنفذة والمعتمدة حتى الآن
  color: string;
}

export type TransactionType = 'spent' | 'executed_work' | 'income'; 

export interface Transaction {
  id: string;
  date: string;
  category: ProjectCategory;
  amount: number;
  type: TransactionType;
  nature: TransactionNature;
  description: string;
  recipient: string; // المقاول / المورد / المهندس صاحب العهدة
  paymentMethod?: PaymentMethod;
  referenceNo?: string;
  equipmentId?: string; // ID of the linked equipment if category is equipment
  fuelStationId?: string; // ID of the linked fuel station for adding balance
  notes?: string;
}

export interface CustodyRecord {
  id: string;
  engineerName: string;
  totalGiven: number; // العهدة المستلمة
  totalSettled: number; // العهدة المسواة بفواتير
  remaining: number; // المتبقي طرف المهندس
  notes?: string;
  referenceNo?: string;
}

export interface ContractorCertificate {
  id: string;
  contractorName: string;
  trade: string; // التخصص (مثلا أعمال حفر، بناء، إلخ)
  totalValue: number; // إجمالي قيمة العقد الأساسي
  executedWorkValue: number; // قيمة الأعمال المنفذة والمستحقة (مستخلصات)
  totalPaid: number; // إجمالي الدفعات المسلمة له فعلياً
  remainingBalance: number; // المتبقي له طرف المشروع
  referenceNo?: string;
}

export type ModulePermissionType = 'none' | 'view' | 'edit';

export interface UserModulePermissions {
  projects: ModulePermissionType;
  transactions: ModulePermissionType;
  extracts: ModulePermissionType;
  deliveries: ModulePermissionType;
  boq: ModulePermissionType;
  supplies: ModulePermissionType;
  subcontractors: ModulePermissionType;
  weeklyReport: ModulePermissionType;
  siteWorkers: ModulePermissionType;
  fuelDashboard: ModulePermissionType;
  equipmentDashboard: ModulePermissionType;
  usersManagement: ModulePermissionType;
  notifications: ModulePermissionType;
}

export interface UserItem {
  username: string;
  nameAr: string;
  role: 'admin' | 'projects_manager' | 'site_manager' | 'tech_office' | 'site_engineer' | 'accountant' | 'supervisor' | 'dc';
  email?: string;
  phone?: string;
  permissions: UserModulePermissions;
  assignedProjects?: string[]; // List of project IDs the user can access
  isTrial?: boolean;
  trialStartedAt?: string; // ISO string when the 1-hour trial began
  createdAt?: string; // ISO string when user was created
  themeId?: string;
  bgType?: 'none' | 'waves' | 'particles' | 'matrix' | 'bubbles' | 'vortex';
}

export type EquipmentStatus = 'active' | 'under_maintenance' | 'idle' | 'out_of_service';
export type EquipmentType = 'لودر' | 'جريدر' | 'هراس' | 'بلدوزر' | 'حفار' | 'فنشر' | 'قشاطة' | 'تانك نيات' | 'نقل ثقيل';

export interface EquipmentRecord {
  id: string;
  code: string;
  name: string;
  type: EquipmentStatus; // Status indicator
  model: string;
  plateNo: string;
  status: EquipmentStatus;
  hoursWorked: number;
  fuelConsumed: number; // Liters
  operator: string;
  lastServiceDate: string;
  referenceNo?: string;
}

export interface MaintenanceOrder {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  date: string;
  type: 'preventive' | 'emergency';
  cost: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  referenceNo?: string;
}

export interface LabTestRecord {
  id: string;
  rfiCode: string;
  testType: 'density' | 'grading' | 'marshall' | 'cbr';
  testNameAr: string;
  date: string;
  resultStatus: 'passed' | 'failed' | 'pending';
  densityValue?: number; // الكثافة g/cm3
  marshallValue?: number; // ثبات مارشال kg
  cbrValue?: number; // نسبة تحمل كالفورنيا %
  sieveGrading?: string; // التدرج الحبيبي (مقبول / غير مقبول)
  engineer: string;
  referenceNo?: string;
}

export interface HseIncidentRecord {
  id: string;
  date: string;
  type: 'injury' | 'near_miss' | 'property_damage' | 'environmental';
  typeNameAr: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actionTaken: string;
  closed: boolean;
  reportedBy: string;
  referenceNo?: string;
}

export interface WbsTaskRecord {
  id: string;
  projectId?: string;
  wbsCode: string;
  name: string;
  phase: 'preparatory' | 'excavation' | 'subbase' | 'asphalt' | 'curbstone' | 'lighting' | 'signage';
  phaseNameAr: string;
  plannedProgress: number; // %
  actualProgress: number; // %
  startDate: string;
  endDate: string;
  criticalPath: boolean;
  status: 'behind' | 'on_track' | 'ahead' | 'completed';
  referenceNo?: string;
}

export interface MRIRRecord {
  id: string;
  code: string;
  date: string;
  poNumber: string;
  itemCode: string;
  itemName: string;
  receivedQty: number;
  supplier: string;
  inspector: string;
  status: 'Approved' | 'Rejected' | 'Pending_Testing';
  notes: string;
}

export interface MRNRecord {
  id: string;
  code: string;
  date: string;
  itemCode: string;
  itemName: string;
  requestedQty: number;
  requester: string;
  purpose: string;
  status: 'Approved' | 'Rejected' | 'Pending_Approval';
}

export interface AuditCountRecord {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  systemQty: number;
  physicalQty: number;
  discrepancy: number;
  auditor: string;
  actionTaken: string;
}

export interface WarehouseItemRecord {
  id: string;
  code: string;
  name: string;
  category: 'materials' | 'asphalt' | 'aggregates' | 'curbstones' | 'pipes' | 'safety' | 'spare_parts';
  categoryAr: string;
  currentStock: number;
  unit: string;
  minLimit: number;
  warehouseName: 'מخزن المشروع الرئيسي' | 'مستودع الميدان الفرعي';
  referenceNo?: string;
}

export type WorkerEmploymentType = 'appointed' | 'saraky' | 'laborer';

export interface SiteWorker {
  id: string;
  name: string;
  jobTitle: string;
  type: WorkerEmploymentType;
  baseRate: number; // Monthly for appointed, Daily for others
  livingAllowance: number;
  startDate: string;
  forceStatus: 'on-site' | 'external';
  nationalId: string;
  phone1: string;
  phone2?: string;
  whatsAppOn: 'none' | 'phone1' | 'phone2' | 'both';
  governorate: string;
  salaryTransferNo?: string;
  
  // HR & Performance
  performanceRating?: number; // 1-5
  trainingCompleted?: string[];
  hrNotes?: string;
  referenceNo?: string;
}

export interface WorkerAttendance {
  id: string;
  workerId: string;
  date: string;
  status: 'present' | 'half-day' | 'absent' | 'vacation';
  overtimeHours: number;
  overtimeValue: number;
  livingExpenseTaken: number;
  deductions: number;
  advances: number;
  notes: string;
  isSettled: boolean;
  referenceNo?: string;
}

export interface WorkerSalaryPayment {
  id: string;
  workerId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  nature: TransactionNature;
  referenceNo?: string;
  notes?: string;
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  ip: string;
  details: string;
  referenceNo?: string;
}

export interface FuelLogRecord {
  id: string;
  referenceNo?: string;
  date: string;
  day: string;
  equipmentName: string;
  quantity: number; // باللتر
  cost: number;     // إجمالي التكلفة (بالجنيه المصري)
  additionalCost: number; // تكلفة إضافية
  recipientName: string; // اسم المستلم
  stationId?: string; // ID of the linked fuel station
  notes?: string;
}

export interface FuelStation {
  id: string;
  name: string;
  location: string;
  delegateName: string;
  delegatePhone: string;
  isInfinite?: boolean;
  referenceNo?: string;
}

export interface OperationalLog {
  id?: string;
  day: string;
  date: string;
  fromTime: string;
  toTime: string;
  duration: number | string; // e.g. 8.0, "توقف", "إجازة"
  cost: number;
  siteExpense: number; // مصروف موقع
  fuelLiters?: number; // لترات السولار
  fuelCost?: number; // تكلفة السولار
  discount: number; // خصم
  deductedHours: number; // ساعات التوقف/الخصم
  notes: string;
}

export interface EquipmentSummary {
  id: string;
  name: string;
  driver: string;
  isRental: boolean;
  rate: number; // اليومية أو الساعة
  durationLabel: string; // "ساعة" | "يومية" | "أسبوعية" | "شهرية"
  dailyShiftHours?: number; // عدد ساعات اليومية (معدل التحويل)
  carryoverHours: number; // ساعات السركي السابقة
  discountOverride?: number; // manual discount override
  spentOverride?: number; // Manual spent override (requested by user)
  advance: number;
  fuelCodeSpent: number; // تكلفة المحروقات
  logs: OperationalLog[];
}

export interface Project {
  id: string;
  name: string;
  assignmentNumber: string;
  assignmentDate: string;
  handoverDate: string;
  durationMonths: number;
  description?: string;
  status?: 'Active' | 'Completed' | 'Suspended';
  referenceNo?: string;
}

export interface BOQItem {
  id: string;
  projectId: string;
  code: string;
  description: string;
  unit: string;
  price: number;
  quantity: number;
}

export interface CompanyEntity {
  id: string;
  nameAr: string;
}

export interface OwnerEntity {
  id: string;
  nameAr: string;
}

export interface SupervisorEntity {
  id: string;
  nameAr: string;
}

export interface SubcontractorDiscount {
  id: string;
  label: string; // نوع الخصم (مثل تأمين، ضرائب، غرامات)
  amount: number; // القيمة ج.م
}

export interface SubcontractorWorkItem {
  id: string;
  trade: string; // التخصص أو بند العمل
  workVolume: number; // حجم الأعمال (كمية)
  unitPrice: number; // سعر الوحدة / الفئة
  totalValue: number; // القيمة الإجمالية للبند = حجم الأعمال * سعر الوحدة
  discounts: SubcontractorDiscount[]; // الخصومات المتعددة للبند الواحد
  notes?: string; // ملاحظات البند
  referenceNo?: string; // رقم مرجعي للبند
  createdAt?: string; // تاريخ الإدراج
}

export interface Subcontractor {
  id: string;
  name: string;
  trade: string; // التخصص الرئيسي (للتوافق)
  workVolume: number; // إجمالي كمية الأعمال (للتوافق)
  unitPrice: number; // متوسط سعر الوحدة (للتوافق)
  totalValue: number; // إجمالي القيمة (للتوافق)
  paidOffice: number;
  paidCustody: number;
  paperSettlements: number;
  remaining: number;
  notes: string;
  workItems?: SubcontractorWorkItem[]; // بنود الأعمال الجديدة
  phone?: string; // رقم هاتف التواصل
  contractNumber?: string; // رقم عقد المقاولة
}

export interface SignatoryItem {
  id: string;
  role: string;  
  name: string;  
}

export interface ExtractItem {
  boqItemId: string;
  previousQuantity: number;
  currentQuantity: number;
  retentionPercent: number; 
  pageNumber?: string;
  bookNumber?: string;
}

export interface CustomExtract {
  id: string;
  projectId: string;
  extractNumber: number;
  periodStart: string;
  periodEnd: string;
  status: 'Draft' | 'Approved' | 'Paid';
  extractType?: 'current' | 'final' | 'no_works';
  showZeroItems?: boolean;
  generalRetentionPercent: number;
  withholdingNotes: string;
  items: ExtractItem[];
  subcontractorId?: string;
  referenceNo?: string;
}

// ==========================================
// SUPPLIES MODULE (التوريدات وبوابات التكعيب والبلونات)
// ==========================================

export interface SupplyItem {
  id: string;        // ID for persistence
  referenceNo?: string; // رقم مرجعي للبند
  code: string;       // كود البند (مثلا: "سن-1", "رمل-أ", "خرسانة- جاهزة")
  name: string;       // اسم البند (مثال: سن طبقة 1، سن طبقة 2، خرسانة، رمل)
  unit: string;       // الوحدة (م٣، طن، عدد، إلخ)
  defaultPrice: number; // السعر الافتراضي للوحدة للطن أو المتر المكعب
}

export interface DeliveryMethod {
  id: string;
  referenceNo?: string;
  type: string; // قلاب، عربية، قطعة، طن، متر
  truckNumber?: string;
  dumperNumber?: string;
  driverName?: string;
  driverPhone?: string;
  cubicCapacity?: string;
  cubicRecordId?: string;
  personInCharge?: string;
  personPhone?: string;
}

export interface Supplier {
  id: string;
  referenceNo?: string;
  name: string;
  materialCode: string;
  phone?: string;
  contractNumber?: string;
  notes?: string;
  deliveryMethods?: DeliveryMethod[];
}

export interface CubicCertificate {
  id: string;             // رقم محضر التكعيب / تكويد المحضر
  referenceNo?: string;   // رقم مرجعي
  title: string;          // موضوع المحضر
  date: string;           // تاريخ اعتماد المحضر
  attachedTicketIds: string[]; // أرقام البونات (legacy)
  
  // New fields
  dumperId?: string;       // معرف القلاب (linked to SupplyMethod id)
  dumperCubic?: number;    // تكعيب القلاب
  trailerCubic?: number;   // تكعيب المقطورة
  totalCubic?: number;     // التكعيب الكلي (تلقائي)
  discounts?: number;      // الخصومات
  netCubic?: number;       // التكعيب الكلي بعد الخصم (مقفول)
  personPerformingMeasurement?: string; // القائم بالتكعيب (من العاملين بالموقع)
  approverOfMeasurement?: string;       // معتمد التكعيب (من العاملين بالموقع)

  startDate?: string;       // تاريخ بدء سريان المحضر (من بداية العمل)
  endDate?: string;         // تاريخ نهاية سريان المحضر (للفترات المتعاقبة)
  oldCertIdToTerminate?: string; // معرف المحضر القديم الذي سيتم إنهاء العمل به (اختياري للربط)
  oldCertTerminationDate?: string; // تاريخ نهاية العمل بالمحضر القديم (اختياري)

  calculatedVolume: number; // إجمالي الحجم المحسوب (legacy or sum)
  approvedVolume: number;   // الحجم التكعيبي المعتمد هندسياً (maps to netCubic usually)
  engineerName: string;     // المهندس الاستشاري / المشرف المعتمد
  notes?: string;           // ملاحظات هندسية
}

export interface SupplyRecord {
  id: string;            // معرف فريد للسجل
  referenceNo?: string;  // رقم مرجعي للبون
  date: string;          // تاريخ البون
  ticketNo: string;      // رقم البون / الإيصال الورقي
  truckPlate: string;    // رقم القلاب
  trailerPlate?: string; // رقم المقطورة (اختياري)
  driverName: string;    // اسم السائق
  rawQuantity: number;   // الكمية الاوراقة (الواردة بالبون)
  qualityDiscount: number; // خصم نوعية (متر مكعب أو طن أو خصم مباشر)
  loadDiscount: number;    // خصم حمولة أو عجز
  totalDiscount: number;   // إجمالي الخصم
  netQuantity: number;     // صافي الكمية بعد الخصومات
  unitPrice: number;       // سعر الوحدة المعتمد
  totalCost: number;       // التكلفة الإجمالية (صافي الكمية * سعر الوحدة)
  supplierName: string;    // مقاول التوريد / المورد المعتمد
  supplyLocation: string;  // مكان التوريد (المحطة / قطاع الطرق)
  itemCode: string;        // كود ومسمى البند المورد من التكويدات
  unit?: string;           // الوحدة (اختياري)
  ledgerNo: string;        // الدفتر المالي / المرحلة المربوط عليها
  notes?: string;          // ملاحظات إضافية
  cubicCertificateId?: string; // معلق برقم محضر التكعيب المعتمد (إن وجد)
  isWaterBillApproved: boolean; // اعتماد البون المائي/الورقي بديلاً للتكعيب في حال عدم توفره
  supplyMethod?: string; // طريقة التوريد: عربية/قطعة/طن/متر
}

// ==========================================
// SUBMISSIONS & WORK INSPECTIONS MODULE (التسليمات وطلب فحص الأعمال)
// ==========================================

export interface SubmissionWorkDetails {
  surveyLevels: 'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending';
  materialSuitability: 'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending';
  executionOperations: 'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending';
  sectionWidth: 'accepted' | 'accepted_with_remarks' | 'rejected' | 'pending';
  currentWidth?: string;
}

export interface SubmissionSignatories {
  contractorEngineer: string;
  surveyConsultant: string;
  qaEngineer: string;
  generalConsultant: string;
}

export type InspectionStatus = 'accepted' | 'rejected' | 'remarked' | 'none';
export type ConsultantInspectionStatus = 'accepted' | 'rejected' | 'remarked';
export type WorkCategory = 'مدنى' | 'كهربا' | 'معمارى' | 'أخرى';
export type DirectionCategory = 'شمال (North)' | 'جنوب (South)' | 'شرق (East)' | 'غرب (West)' | 'شمال شرق' | 'شمال غرب' | 'جنوب شرق' | 'جنوب غرب' | 'قبلي' | 'بحرى' | 'اخرى';

// ... in Submission ...
export interface Submission {
  id: string;
  projectId: string; // id of the site/project
  submissionNumber: string; // رقم الطلب (e.g. "M-001")
  date: string; // تاريخ تقديم البيان
  inspectionDate: string; // تاريخ الفحص المطلوب
  inspectionTime: string; // الميعاد المطلوب للفحص
  itemDescription: string; // البند
  locationDetails?: string; // مكان وتفاصيل الأعمال
  levelElevation?: string; // المنسوب
  direction: DirectionCategory; // الاتجاه
  length?: string; // الطول
  areaArea?: string; // المسطح
  submissionCount: number; // عدد مرات تقديم الطلب / التكرار (الأول، الثاني، الثالث)
  remarks?: string; // ملاحظات عامة
  
  // NEW FIELDS
  engineerName: string;
  surveyorName?: string;
  surveyStatus: InspectionStatus;
  qualityStatus: InspectionStatus;
  consultantStatus: ConsultantInspectionStatus;
  workCategory: WorkCategory;

  status: 'Approved' | 'ApprovedWithRemarks' | 'Rejected' | 'Pending' | 'SurveyRejected'; // نتيجة أعمال الفحص النهائي
  workDetails?: SubmissionWorkDetails;
  surveyNotes?: string; // ملاحظات مساحية
  labNotes?: string; // ملاحظات معملية
  signatories: SubmissionSignatories;
}

export type ContractStatus = 'active' | 'completed' | 'terminated';
export type ContractCategory = 'project' | 'employee' | 'subcontractor' | 'supplier' | 'other';

export interface ContractAttachment {
  id: string;
  name: string;
  url: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  date: string;
  counterparty: string;
  category: ContractCategory;
  value: number;
  durationMonths: number;
  status: ContractStatus;
  projectId: string;
  subcontractorId?: string;
  scope: string; // الأعمال
  specifications: string; // المواصفات
  paymentTerms: string; // شروط الدفع
  attachments: ContractAttachment[];
}

export interface RiskRecord {
  id: string;
  projectId: string;
  type: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationPlan: string;
  status: 'active' | 'mitigated' | 'closed';
}

export interface QualityReport {
  id: string;
  projectId: string;
  date: string;
  result: 'passed' | 'failed' | 'needs_improvement';
  inspectionDetails: string;
  attachments: ContractAttachment[];
  correctiveAction?: string;
}

export interface HrRecord {
  id: string;
  employeeId: string;
  type: 'salary' | 'bonus' | 'penalty';
  amount: number;
  date: string;
  notes: string;
}

export interface ScheduleActivity {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  plannedResources: string[];
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  title: string;
  type: 'drawing' | 'spec' | 'correspondence';
  url: string;
  date: string;
}

export interface ActivityLog {
  id: string;
  referenceNo: string; // REF-XXXXXX
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  contracts: string[]; // List of Contract IDs
  projects: string[]; // List of Project IDs
  activityLogs: ActivityLog[];
}

export interface DcrRecord {
  id: string;
  code: string;
  title: string;
  discipline: 'Civil' | 'Survey' | 'Mechanical' | 'Electrical' | 'HSE' | 'Contractual';
  type: 'Drawing' | 'RFI' | 'Method Statement' | 'Transmittal' | 'Correspondence';
  revision: string;
  status: 'A' | 'B' | 'C' | 'D'; // A: Approved, B: Approved with Remarks, C: Rejected, D: For Info
  date: string;
  author: string;
  projectId: string;
  workflowStep: 'Draft' | 'Under Review' | 'Approved' | 'Distributed';
  boqItemId?: string;
  boqItemCode?: string;
}

export interface RiskItem {
  id: string;
  type: string; // نوع الخطر
  category: 'technical' | 'financial' | 'supply' | 'safety' | 'environmental';
  probability: 'high' | 'medium' | 'low'; // احتمالية الحدوث
  impact: 'high' | 'medium' | 'low'; // الأثر
  preventiveAction: string; // الإجراء الوقائي / الاستجابة
  owner: string; // المسؤول
  status: 'active' | 'mitigated' | 'monitoring';
  projectId: string;
}


