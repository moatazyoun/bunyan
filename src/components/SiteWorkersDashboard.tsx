import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserPlus, Calendar, DollarSign, Save, Trash2, Check, X, FileText, AlertCircle, Edit, ArrowDownToLine, Clock, Search, Briefcase, UserCheck, Timer, Wallet, Calculator, ChevronRight, ChevronLeft, MapPin, Info, ChevronDown, CheckCircle2, XCircle, Home, Banknote, Building2, Ticket, MoreHorizontal, ShieldCheck, ExternalLink, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, SiteWorker, WorkerAttendance, WorkerEmploymentType, WorkerSalaryPayment } from '../types';
import { INITIAL_WORKERS } from '../data/initialData';
import HrStrategyTab from './HrStrategyTab';

const GOVERNORATES = [
  "القاهرة", "الإسكندرية", "الجيزة", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "الشرقية", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الأقصر", "قنا", "شمال سيناء", "سوهاج", "جنوب سيناء", "كفر الشيخ", "مطروح"
];

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  disabled, 
  className = "" 
}: { 
  options: { value: string, label: string, icon: React.ReactNode, colorClass?: string }[], 
  value: string, 
  onChange: (val: string) => void,
  disabled?: boolean,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-2 py-1.5 rounded-xl text-[10px] font-black transition border shadow-sm ${
          disabled ? 'bg-slate-200 text-slate-400 border-slate-100 cursor-not-allowed' : 
          (selectedOption.colorClass || 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-100')
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="flex-shrink-0">{selectedOption.icon}</span>
          <span className="truncate">{selectedOption.label}</span>
        </div>
        {!disabled && <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />}
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute z-[70] mt-1 w-full min-w-[120px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-[10px] font-black transition group text-right justify-start ${
                    value === opt.value 
                      ? (opt.colorClass ? opt.colorClass : 'bg-indigo-50 text-indigo-700') 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`${value === opt.value ? '' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors`}>
                    {opt.icon}
                  </span>
                  <span className="truncate flex-1">{opt.label}</span>
                  {value === opt.value && <Check className="w-3 h-3 text-current ml-auto" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SiteWorkersDashboard({ 
  transactions, 
  onAddTransaction,
  workers,
  setWorkers,
  attendanceLogs,
  setAttendanceLogs,
  salaryPayments,
  setSalaryPayments,
  userRole,
  addAuditLog,
  contracts = [],
  defaultTab = 'workers'
}: { 
  transactions: Transaction[], 
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void,
  workers: SiteWorker[],
  setWorkers: React.Dispatch<React.SetStateAction<SiteWorker[]>>,
  attendanceLogs: WorkerAttendance[],
  setAttendanceLogs: React.Dispatch<React.SetStateAction<WorkerAttendance[]>>,
  salaryPayments: WorkerSalaryPayment[],
  setSalaryPayments: React.Dispatch<React.SetStateAction<WorkerSalaryPayment[]>>,
  userRole?: string,
  addAuditLog?: (action: string, module: string, details: string) => void,
  contracts?: any[],
  defaultTab?: 'workers' | 'settlements' | 'hr-strategy'
}) {
  const [activeTab, setActiveTab] = useState<'workers' | 'settlements' | 'hr-strategy'>(defaultTab);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkerType, setSelectedWorkerType] = useState<WorkerEmploymentType | 'all'>('all');

  // Form States
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<SiteWorker | null>(null);
  const firstDayOfMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], []);

  const [workerForm, setWorkerForm] = useState<Omit<SiteWorker, 'id'>>({ 
    name: '', 
    jobTitle: '', 
    type: 'laborer',
    baseRate: 0, 
    livingAllowance: 0,
    startDate: firstDayOfMonth,
    forceStatus: 'on-site',
    nationalId: '',
    phone1: '',
    phone2: '',
    whatsAppOn: 'none',
    governorate: 'القاهرة',
    salaryTransferNo: ''
  });

  // Details Modal
  const [selectedWorker, setSelectedWorker] = useState<SiteWorker | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [detailsSubTab, setDetailsSubTab] = useState<'attendance' | 'payments' | 'history'>('attendance');

  const [paymentForm, setPaymentForm] = useState<Omit<WorkerSalaryPayment, 'id' | 'workerId'>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'نقدى',
    nature: 'inside_custody',
    referenceNo: '',
    notes: ''
  });

  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleteVerificationInput, setDeleteVerificationInput] = useState('');
  const [expectedDeleteCode, setExpectedDeleteCode] = useState('');

  const generateRefNo = (prefix: string = 'W') => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${today}-${random}`;
  };

  const handleDeleteWorker = (id: string, name: string) => {
    if (deleteVerificationInput !== expectedDeleteCode) {
      alert('⚠️ كود التحقق غير صحيح. يرجى المحاولة مرة أخرى.');
      return;
    }

    const refNo = generateRefNo('DEL-W');
    setWorkers(prev => prev.filter(w => w.id !== id));
    setAttendanceLogs(prev => prev.filter(l => l.workerId !== id));
    if (selectedWorker?.id === id) setShowDetailsModal(false);
    
    addAuditLog?.(
      'حذف سجل عامل',
      'العمالة الموقع',
      `تم حذف العامل [${name}] نهائياً من السجلات بمرجع: ${refNo}`
    );
    
    setConfirmDelete(null);
  };

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayStr = today.toISOString().split('T')[0];
    
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().split('T')[0];
    }).filter(dateStr => {
      if (!selectedWorker) return true;
      // Show only from worker's start date (default to first of month if missing) AND up to today
      const start = selectedWorker.startDate || firstDayOfMonth;
      return dateStr >= start && dateStr <= todayStr;
    });
  }, [viewDate, selectedWorker, firstDayOfMonth]);

  // Daily processing
  const activeWorkers = useMemo(() => workers.filter(w => w.forceStatus === 'on-site' || attendanceLogs.some(a => a.workerId === w.id && a.date === selectedDate)), [workers, attendanceLogs, selectedDate]);
  
  const handleUpdateRecord = (workerId: string, updates: Partial<WorkerAttendance>, targetDate?: string) => {
    if (userRole === 'viewer') return;
    const dateToUpdate = targetDate || selectedDate;
    
    // Find worker and existing log for audit purposes
    const worker = workers.find(w => w.id === workerId);
    const existingLog = attendanceLogs.find(a => a.workerId === workerId && a.date === dateToUpdate);

    const statusMap: Record<string, string> = {
      'present': 'حاضر',
      'half-day': 'نصف يوم',
      'absent': 'غائب',
      'vacation': 'إجازة'
    };

    if (existingLog) {
      const refCode = `REF-ATN-${existingLog.id.split('-')[1]?.slice(-6) || '000000'}`;
      if (updates.status && updates.status !== existingLog.status) {
        addAuditLog?.(
          `تحديث حضور: ${worker?.name || 'عامل'}`,
          'سجلات العمالة',
          `تغيير الحالة من (${statusMap[existingLog.status] || existingLog.status}) إلى (${statusMap[updates.status] || updates.status}) - كود: ${refCode} - بتاريخ ${dateToUpdate}`
        );
      }
      if (updates.overtimeValue !== undefined && updates.overtimeValue !== existingLog.overtimeValue) {
        addAuditLog?.(
          `تحديث سهرة: ${worker?.name || 'عامل'}`,
          'سجلات العمالة',
          `تعديل القيمة إلى (${updates.overtimeValue} ج.م) - كود: ${refCode} - بتاريخ ${dateToUpdate}`
        );
      }
    } else {
      const logStatus = updates.status || 'present';
      const tempId = `att-${Date.now()}-${workerId}`;
      const refCode = `REF-ATN-${tempId.split('-')[1]?.slice(-6) || 'XXXXXX'}`;
      addAuditLog?.(
        `تسجيل حضور: ${worker?.name || 'عامل'}`,
        'سجلات العمالة',
        `تسجيل حالة (${statusMap[logStatus] || logStatus}) - كود: ${refCode} - بتاريخ ${dateToUpdate}`
      );
    }

    setAttendanceLogs(prev => {
      const existingIdx = prev.findIndex(a => a.workerId === workerId && a.date === dateToUpdate);
      if (existingIdx >= 0) {
        const newLogs = [...prev];
        newLogs[existingIdx] = { ...newLogs[existingIdx], ...updates };
        return newLogs;
      }
      return [...prev, {
        id: `att-${Date.now()}-${workerId}`,
        workerId,
        date: dateToUpdate,
        status: 'present',
        overtimeHours: 0,
        overtimeValue: 0,
        livingExpenseTaken: 0,
        deductions: 0,
        advances: 0,
        notes: '',
        isSettled: false,
        ...updates
      } as WorkerAttendance];
    });
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    
    // Validation: Job Title and Salary are mandatory
    if (!workerForm.jobTitle.trim()) {
      alert('⚠️ تنبيه: حقل "المسمى الوظيفي" إلزامي.');
      return;
    }

    if (workerForm.baseRate <= 0) {
      alert('⚠️ تنبيه: حقل "الراتب/اليومية" إلزامي ويجب أن يكون أكبر من صفر.');
      return;
    }

    if (!workerForm.nationalId || workerForm.nationalId.length !== 14) {
      alert('⚠️ تنبيه: الرقم القومي يجب أن يتكون من 14 رقم بالتمام.');
      return;
    }

    if (!workerForm.phone1) {
      alert('⚠️ تنبيه: رقم المحمول الأول إلزامي.');
      return;
    }

    if (!workerForm.governorate) {
      alert('⚠️ تنبيه: يجب اختيار المحافظة.');
      return;
    }

    if (editingWorker) {
      const refNo = generateRefNo(`${editingWorker.jobTitle.includes('مهندس') ? 'ENG' : 'W'}-UPD`);
      setWorkers(prev => prev.map(w => w.id === editingWorker.id ? { ...w, ...workerForm } : w));
      addAuditLog?.(
        'تعديل بيانات عامل',
        'العمالة الموقع',
        `تم تحديث بيانات [${workerForm.name}] بمرجع: ${refNo}. المسمى: ${workerForm.jobTitle}.`
      );
    } else {
      // Ensure startDate is set to default if empty
      const finalForm = { 
        ...workerForm, 
        startDate: workerForm.startDate || firstDayOfMonth 
      };
      const refNo = generateRefNo(`${workerForm.jobTitle.includes('مهندس') ? 'ENG' : 'W'}-ADD`);
      setWorkers(prev => [...prev, { id: `w-${Date.now()}`, ...finalForm }]);
      addAuditLog?.(
        'إضافة عامل جديد',
        'العمالة الموقع',
        `تم تسجيل عامل جديد [${workerForm.name}] بمرجع: ${refNo}. الوظيفة: ${workerForm.jobTitle}.`
      );
    }
    setShowWorkerModal(false);
    setWorkerForm({ 
      name: '', 
      jobTitle: '', 
      type: 'laborer', 
      baseRate: 0, 
      livingAllowance: 0, 
      startDate: firstDayOfMonth,
      forceStatus: 'on-site',
      nationalId: '',
      phone1: '',
      phone2: '',
      whatsAppOn: 'none',
      governorate: 'القاهرة',
      salaryTransferNo: ''
    });
    setEditingWorker(null);
  };

  // Settlements logic
  const handleSettleWorker = (workerId: string, unsavedLogs: WorkerAttendance[]) => {
    if (userRole === 'viewer') return;
    const worker = workers.find(w => w.id === workerId);
    if (!worker || unsavedLogs.length === 0) return;

    let totalEarned = 0;
    let totalAdvances = 0;
    let totalDeductions = 0;
    
    unsavedLogs.forEach(log => {
      let shiftValue = 0;
      if (worker.type === 'appointed') {
        // Appointed salaries are monthly, but we might track daily attendance
        // For simplicity in site management, we assume baseRate is monthly 
        // and we calculate a daily equivalent for settlement if needed, 
        // or just settle the variable parts (overtime, deductions).
        // Let's assume site settlement for appointed covers variable parts only 
        // while base salary is handled in payroll.
        shiftValue = 0; 
      } else {
        if (log.status === 'present') shiftValue = worker.baseRate;
        else if (log.status === 'half-day') shiftValue = worker.baseRate / 2;
      }

      totalEarned += shiftValue + log.overtimeValue;
      totalDeductions += log.deductions;
      totalAdvances += log.advances + log.livingExpenseTaken;
    });

    const netAmount = totalEarned - totalDeductions - totalAdvances;
    const refNo = generateRefNo('SETTL');

    // Create a transaction mapping
    onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      amount: netAmount,
      type: 'spent',
      nature: 'inside_custody',
      category: 'custody',
      description: `تصفية حساب (${worker.type === 'appointed' ? 'متغيرات' : 'يوميات'}): ${worker.jobTitle}`,
      recipient: worker.name,
      paymentMethod: 'نقدى',
      referenceNo: refNo,
      notes: `تصفية حسابات بمرجع: ${refNo}`
    });

    addAuditLog?.(
      'تصفية وترحيل حساب عامل',
      'سجلات الدوام',
      `تم تصفية حساب [${worker.name}] بمبلغ ${netAmount} ج.م بمرجع: ${refNo}`
    );

    // Mark as settled
    setAttendanceLogs(prev => prev.map(log => 
      (log.workerId === workerId && unsavedLogs.some(u => u.id === log.id)) ? { ...log, isSettled: true } : log
    ));

    alert(`تم ترحيل قيد بصافي المستحق (${netAmount} ج.م) للعامل ${worker.name} بنجاح.`);
  };

  const getWeeklyAttendance = (logs: WorkerAttendance[]) => {
    const weeks: { [key: string]: WorkerAttendance[] } = {};
    logs.forEach(log => {
      const d = new Date(log.date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6:1);
      const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];
      if (!weeks[monday]) weeks[monday] = [];
      weeks[monday].push(log);
    });
    return Object.keys(weeks).sort().reverse().map(monday => ({
      weekStarting: monday,
      logs: weeks[monday].sort((a,b) => b.date.localeCompare(a.date))
    }));
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    if (!selectedWorker || paymentForm.amount <= 0) return;

    const refNo = paymentForm.referenceNo || generateRefNo('PAY');
    const newPayment: WorkerSalaryPayment = {
      id: `pay-${Date.now()}`,
      workerId: selectedWorker.id,
      ...paymentForm,
      referenceNo: refNo
    };

    setSalaryPayments(prev => [...prev, newPayment]);

    // Add to main transactions ledger too
    onAddTransaction({
      date: paymentForm.date,
      amount: paymentForm.amount,
      type: 'spent',
      nature: paymentForm.nature,
      category: paymentForm.nature === 'inside_custody' ? 'custody' : 'other',
      description: `دفعة استلام راتب: ${selectedWorker.name}`,
      recipient: selectedWorker.name,
      paymentMethod: paymentForm.paymentMethod as any,
      referenceNo: refNo,
      notes: paymentForm.notes ? `${paymentForm.notes} (مرجع: ${refNo})` : `استلام راتب مرجع: ${refNo}`
    });

    addAuditLog?.(
      'صرف راتب/دفعة لعامل',
      'مسيرات الرواتب',
      `تم صرف مبلغ ${paymentForm.amount} ج.م للعامل [${selectedWorker.name}] بمرجع: ${refNo}`
    );

    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'نقدى',
      nature: 'inside_custody',
      referenceNo: '',
      notes: ''
    });
  };

  const handleDeletePayment = (id: string) => {
    if (userRole === 'viewer') {
      alert('عذراً، لا تملك صلاحية حذف الدفعات');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف هذه الدفعة [${id}] من السجل؟`)) {
      const payment = salaryPayments.find(p => p.id === id);
      setSalaryPayments(prev => prev.filter(p => p.id !== id));
      addAuditLog?.(
        'حذف دفعة راتب',
        'مسيرات الرواتب',
        `تم حذف قيد صرف راتب بقيمة ${payment?.amount || 0} ج.م بمرجع: ${payment?.referenceNo || id}`
      );
    }
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = w.name.includes(searchTerm) || w.jobTitle.includes(searchTerm);
      const matchesType = selectedWorkerType === 'all' || w.type === selectedWorkerType;
      return matchesSearch && matchesType;
    });
  }, [workers, searchTerm, selectedWorkerType]);

  const getTypeName = (type: WorkerEmploymentType) => {
    switch(type) {
      case 'appointed': return 'معين (شهري)';
      case 'saraky': return 'سراكى (يومية)';
      case 'laborer': return 'عامل يومية';
      default: return '';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full" dir="rtl" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" />
            إدارة العاملين بالموقع (اليوميات)
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">حصر الحضور، الغياب، السلف، والسهرات وتصفية أجور العمالة المباشرة.</p>
        </div>
        <button
          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية إضافة عاملين') : () => {
            setEditingWorker(null);
            setWorkerForm({ 
              name: '', 
              jobTitle: '', 
              type: 'laborer', 
              baseRate: 0, 
              livingAllowance: 0, 
              startDate: firstDayOfMonth,
              forceStatus: 'on-site',
              nationalId: '',
              phone1: '',
              phone2: '',
              whatsAppOn: 'none',
              governorate: 'القاهرة',
              salaryTransferNo: ''
            });
            setShowWorkerModal(true);
          }}
          disabled={userRole === 'viewer'}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow transition flex items-center gap-2 ${
            userRole === 'viewer'
              ? 'bg-slate-300 text-slate-100 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
          }`}
        >
          <UserPlus size={16} /> اضافة عامل جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setActiveTab('workers')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'workers' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <FileText size={16} /> سجل العاملين بالموقع
        </button>
        <button onClick={() => setActiveTab('settlements')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'settlements' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <Calculator size={16} /> المنصرف الأسبوعي والتقطيع
        </button>
        <button onClick={() => setActiveTab('hr-strategy')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'hr-strategy' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <ShieldCheck size={16} /> الإدارة الاستراتيجية للموارد البشرية
        </button>
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'settlements' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
             <div className="bg-gradient-to-l from-indigo-50 to-white border border-indigo-100/60 p-4 rounded-xl text-xs font-bold text-indigo-900 flex items-start gap-3 shadow-sm">
               <AlertCircle className="shrink-0 text-indigo-600" />
               <p className="leading-relaxed">يمكنك تصفية حسابات العاملين بصورة مستقلة لكل عامل. بالضغط على "تصفية وترحيل"، سيتم إنشاء قيد صرف آلي بصافي المستحقات عن الأيام المدرجة وتوجيهها للمنصرف الأسبوعي.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {workers.map(worker => {
                 const unsavedLogs = attendanceLogs.filter(a => a.workerId === worker.id && !a.isSettled);
                 if (unsavedLogs.length === 0) return null;

                 let days = 0, advances = 0, deductions = 0, overtime = 0, earned = 0;
                 unsavedLogs.forEach(log => {
                   if (worker.type !== 'appointed') {
                     if (log.status === 'present') { days += 1; earned += worker.baseRate; }
                     if (log.status === 'half-day') { days += 0.5; earned += worker.baseRate / 2; }
                   } else {
                     if (log.status === 'present') days += 1;
                   }
                   advances += log.advances + log.livingExpenseTaken;
                   deductions += log.deductions;
                   overtime += log.overtimeValue;
                 });
                 earned += overtime;
                 const netAmount = (earned - deductions) - advances;

                 return (
                   <div key={worker.id} className="bg-white border flex flex-col justify-between border-slate-200 p-5 rounded-2xl shadow-sm">
                      <div>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                          <div>
                            <h4 className="font-extrabold text-slate-800 tracking-tight">{worker.name}</h4>
                            <p className="text-[10.5px] text-slate-500 font-bold mt-0.5">{worker.jobTitle}</p>
                          </div>
                          <span className="text-[10px] font-black bg-indigo-50/50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md">
                            {getTypeName(worker.type)}: {worker.baseRate} ج
                          </span>
                        </div>
                        <div className="space-y-2 text-xs font-bold bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <div className="flex justify-between text-slate-600"><span>أيام {worker.type === 'appointed' ? 'الحضور المسجلة' : 'العمل المقررة'}:</span> <span>{days} {worker.type === 'appointed' ? 'يوم' : 'يومية كاملة'}</span></div>
                          <div className="flex justify-between text-slate-600"><span>{worker.type === 'appointed' ? 'قيمة المتغيرات (+ سهرات):' : 'إجمالي الاستحقاق (+ سهرات):'}</span> <span className="text-emerald-650">{earned} ج.م</span></div>
                          {deductions > 0 && <div className="flex justify-between text-slate-600"><span>الخصومات والمجازاة:</span> <span className="text-rose-600">- {deductions} ج.م</span></div>}
                          <div className="flex justify-between text-slate-600"><span>مسحوبات (سلف + معيشة):</span> <span className="text-amber-600">- {advances} ج.م</span></div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                         <div>
                           <span className="block text-[10px] text-slate-500 font-black">الصافي المطلوب صرفه للمقاول أو العامل</span>
                           <span className="text-lg font-black text-slate-900 tracking-tight">{netAmount} <span className="text-xs text-slate-500">ج.م</span></span>
                         </div>
                         <button 
                           onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تصفية القيود') : () => handleSettleWorker(worker.id, unsavedLogs)} 
                           className={`px-3 py-2 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 shadow-sm ${
                             userRole === 'viewer' 
                               ? 'bg-slate-300 text-slate-100 cursor-not-allowed' 
                               : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                           }`}
                         >
                           <ArrowDownToLine size={13} /> تصفية القيد
                         </button>
                      </div>
                   </div>
                 );
               })}
               {workers.every(worker => attendanceLogs.filter(a => a.workerId === worker.id && !a.isSettled).length === 0) && (
                 <div className="col-span-full py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                     <Check className="text-emerald-500" size={24} />
                   </div>
                   <div>
                     <p className="text-slate-800 font-extrabold text-sm">مدهش! لا توجد حسابات قيد التصفية</p>
                     <p className="text-slate-500 text-xs font-bold mt-1 max-w-sm">جميع العاملين تم تصفية حساباتهم وصرف رواتبهم، وتم ترحيل القيود إلى لوحة المصروفات بنجاح.</p>
                   </div>
                 </div>
               )}
             </div>
          </motion.div>
        )}

        {activeTab === 'workers' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث باسم العامل أو الوظيفة..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring focus:ring-indigo-100 outline-none transition"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <select 
                  value={selectedWorkerType}
                  onChange={(e) => setSelectedWorkerType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring focus:ring-indigo-100"
                >
                  <option value="all">كل الفئات العاملة</option>
                  <option value="appointed">المعينين (مهندسين وإداريين)</option>
                  <option value="saraky">مقاولين السراكى</option>
                  <option value="laborer">عمال اليومية المباشرة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(w => (
                <motion.div 
                  layoutId={w.id}
                  key={w.id} 
                  onClick={() => { setSelectedWorker(w); setShowDetailsModal(true); setShowBasicInfo(false); }}
                  className="bg-white border-2 border-transparent hover:border-indigo-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition group cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${w.type === 'appointed' ? 'bg-indigo-500' : w.type === 'saraky' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                      <Users size={24} />
                    </div>
                    <div className="flex gap-2">
                        <button 
                          onClick={userRole === 'viewer' ? (e) => { e.stopPropagation(); alert('عذراً، لا تملك صلاحية الحذف'); } : (e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            setConfirmDelete({ id: w.id, name: w.name }); 
                            setDeleteVerificationInput('');
                            setExpectedDeleteCode(Math.floor(1000 + Math.random() * 9000).toString());
                          }} 
                          disabled={userRole === 'viewer'}
                          className={`p-2 rounded-lg transition-all active:scale-95 shadow-sm border ${
                            userRole === 'viewer'
                              ? 'bg-slate-200 text-slate-100 cursor-not-allowed border-slate-100'
                              : 'bg-rose-50 text-rose-500 hover:bg-rose-100 border-rose-100'
                          }`}
                          title="حذف العامل نهائياً"
                        >
                          <Trash2 size={15} />
                        </button>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${w.forceStatus === 'on-site' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {w.forceStatus === 'on-site' ? 'على قوة الموقع' : 'خارج القوة'}
                        </span>
                     </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">{w.name}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                      <Briefcase size={12} className="text-slate-400" />
                      {w.jobTitle}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-black mb-1">{w.type === 'appointed' ? 'الراتب الشهري' : 'اليومية الصافية'}</span>
                      <span className="font-black text-slate-900 text-sm font-mono">{w.baseRate} <span className="text-[10px] text-slate-500">ج</span></span>
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] text-slate-400 font-black mb-1">فئة التعاقد</span>
                      <span className={`text-[10px] font-black ${w.type === 'appointed' ? 'text-indigo-600' : w.type === 'saraky' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {getTypeName(w.type)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredWorkers.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold">لا يوجد نتائج تطابق بحثك أو تصنيفك.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'hr-strategy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <HrStrategyTab
              workers={workers}
              attendanceLogs={attendanceLogs}
              salaryPayments={salaryPayments}
              contracts={contracts}
              userRole={userRole}
              addAuditLog={addAuditLog}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Worker Details Modal */}
      {showDetailsModal && selectedWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
              <div className="bg-white p-6 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                       <Users size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        {selectedWorker.name}
                        <button 
                          onClick={() => setShowBasicInfo(!showBasicInfo)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${showBasicInfo ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                          title="عرض البيانات الأساسية (الرقم القومي، الموبايل، المحافظة)"
                        >
                          <Info size={16} />
                        </button>
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1"><Briefcase size={14} /> {selectedWorker.jobTitle}</span>
                        <span className="text-xs font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg">{getTypeName(selectedWorker.type)}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${selectedWorker.forceStatus === 'on-site' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {selectedWorker.forceStatus === 'on-site' ? 'على قوة الموقع' : 'خارج القوة'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => { 
                        setEditingWorker(selectedWorker); 
                        setWorkerForm({
                          name: selectedWorker.name || '',
                          jobTitle: selectedWorker.jobTitle || '',
                          type: selectedWorker.type || 'laborer',
                          baseRate: selectedWorker.baseRate || 0,
                          livingAllowance: selectedWorker.livingAllowance || 0,
                          startDate: selectedWorker.startDate || firstDayOfMonth,
                          forceStatus: selectedWorker.forceStatus || 'on-site',
                          nationalId: selectedWorker.nationalId || '',
                          phone1: selectedWorker.phone1 || '',
                          phone2: selectedWorker.phone2 || '',
                          whatsAppOn: selectedWorker.whatsAppOn || 'none',
                          governorate: selectedWorker.governorate || 'القاهرة',
                          salaryTransferNo: selectedWorker.salaryTransferNo || ''
                        }); 
                        setShowWorkerModal(true); 
                      }} 
                      disabled={userRole === 'viewer'}
                      className={`p-2 rounded-xl transition ${
                        userRole === 'viewer'
                          ? 'bg-slate-200 text-slate-100 cursor-not-allowed'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`} 
                      title="تعديل بيانات العامل"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => {
                        setConfirmDelete({ id: selectedWorker.id, name: selectedWorker.name });
                        setDeleteVerificationInput('');
                        setExpectedDeleteCode(Math.floor(1000 + Math.random() * 9000).toString());
                      }} 
                      disabled={userRole === 'viewer'}
                      className={`p-2 rounded-xl transition ${
                        userRole === 'viewer'
                          ? 'bg-slate-200 text-slate-100 cursor-not-allowed'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer'
                      }`} 
                      title="حذف نهائي"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button onClick={() => { setShowDetailsModal(false); setShowBasicInfo(false); }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-xl transition"><X size={18} /></button>
                  </div>
                </div>

                <AnimatePresence>
                  {showBasicInfo && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 border-t border-slate-100 pt-6">
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                          <span className="block text-[10px] text-slate-400 font-extrabold mb-1">الرقم القومى</span>
                          <span className="text-sm font-black text-slate-900 font-mono">{selectedWorker.nationalId || 'غير مسجل'}</span>
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                          <span className="block text-[10px] text-slate-400 font-extrabold mb-1">المحافظة</span>
                          <span className="text-sm font-black text-slate-900">{selectedWorker.governorate || 'غير مسجل'}</span>
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                          <span className="block text-[10px] text-slate-400 font-extrabold mb-1">المحمول (1)</span>
                          <span className="text-sm font-black text-slate-900 font-mono flex items-center gap-1">
                            {selectedWorker.phone1 || 'غير مسجل'}
                            {(selectedWorker.whatsAppOn === 'phone1' || selectedWorker.whatsAppOn === 'both') && <Check size={12} className="text-emerald-500" title="واتساب متاح" />}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                          <span className="block text-[10px] text-slate-400 font-extrabold mb-1">المحمول (2)</span>
                          <span className="text-sm font-black text-slate-900 font-mono flex items-center gap-1">
                            {selectedWorker.phone2 || '-'}
                            {(selectedWorker.whatsAppOn === 'phone2' || selectedWorker.whatsAppOn === 'both') && <Check size={12} className="text-emerald-500" title="واتساب متاح" />}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                          <span className="block text-[10px] text-slate-400 font-extrabold mb-1">تحويل الراتب</span>
                          <span className="text-sm font-black text-indigo-600 font-mono truncate" title={selectedWorker.salaryTransferNo}>{selectedWorker.salaryTransferNo || '-'}</span>
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                          <span className="block text-[10px] text-slate-400 font-extrabold mb-1">رقم العقد</span>
                          {(() => {
                            const linkedCon = contracts.find(con => con.counterparty.trim() === selectedWorker.name.trim());
                            return linkedCon ? (
                              <span className="text-xs font-black text-indigo-600 font-mono flex items-center gap-1" title="مربوط بشيت العقود">
                                {linkedCon.contractNumber}
                                <span className="bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-sans font-black scale-90">مربوط</span>
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 font-sans">بدون عقد</span>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
                  <div className="bg-indigo-600 p-4 rounded-2xl shadow-md lg:col-span-2 flex flex-col justify-center">
                    <span className="block text-[10px] text-white/70 font-extrabold mb-1">الرصيد المتبقي</span>
                    <span className="text-base font-black text-white font-mono leading-none">
                      {(() => {
                        const logs = attendanceLogs.filter(l => l.workerId === selectedWorker.id);
                        let earned = 0;
                        let attendanceDays = 0;
                        
                        logs.forEach(l => {
                          if (selectedWorker.type !== 'appointed') {
                            if (l.status === 'present') earned += selectedWorker.baseRate;
                            else if (l.status === 'half-day') earned += selectedWorker.baseRate / 2;
                          }
                          if (l.status === 'present' || l.status === 'half-day') attendanceDays++;
                          earned += (l.overtimeValue || 0) - (l.deductions || 0);
                        });
                        
                        const totalEarned = (selectedWorker.type === 'appointed' ? selectedWorker.baseRate : earned) + (attendanceDays * selectedWorker.livingAllowance);
                        const spent = transactions.filter(tx => tx.recipient === selectedWorker.name && tx.type === 'spent').reduce((sum, tx) => sum + tx.amount, 0);
                        
                        return (totalEarned - spent).toLocaleString();
                      })()} <span className="text-[10px] text-white/50">ج</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-extrabold mb-1">{selectedWorker.type === 'appointed' ? 'راتب شهرى' : 'فئة اليومية'}</span>
                    <span className="text-sm font-black text-slate-900 font-mono">{selectedWorker.baseRate} <span className="text-[10px] text-slate-500">ج</span></span>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-extrabold mb-1">{selectedWorker.type === 'appointed' ? 'معيشة وبدلات' : 'بدل معيشة مقرر'}</span>
                    <span className="text-sm font-black text-slate-900 font-mono">{selectedWorker.livingAllowance} <span className="text-[10px] text-slate-500">ج</span></span>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-extrabold mb-1">إجمالي أيام العمل</span>
                    <span className="text-sm font-black text-slate-900 font-mono">{attendanceLogs.filter(l => l.workerId === selectedWorker.id && (l.status === 'present' || l.status === 'half-day')).length} <span className="text-[10px] text-slate-500">يوم</span></span>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-extrabold mb-1">إجمالي الإضافي</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">{attendanceLogs.filter(l => l.workerId === selectedWorker.id).reduce((sum, l) => sum + (l.overtimeValue || 0), 0)} <span className="text-[10px] text-slate-500">ج</span></span>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-extrabold mb-1">إجمالي المعيشة المستحقة</span>
                    <span className="text-sm font-black text-amber-600 font-mono">
                      {attendanceLogs.filter(l => l.workerId === selectedWorker.id && (l.status === 'present' || l.status === 'half-day')).length * selectedWorker.livingAllowance} 
                      <span className="text-[10px] text-slate-500"> ج</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                    <button 
                      onClick={() => setDetailsSubTab('attendance')} 
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${detailsSubTab === 'attendance' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                    >
                      <Calendar size={14} /> سجل الحضور (السركي)
                    </button>
                    <button 
                      onClick={() => setDetailsSubTab('payments')} 
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${detailsSubTab === 'payments' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                    >
                      <DollarSign size={14} /> دفعات استلام الراتب
                    </button>
                    <button 
                      onClick={() => setDetailsSubTab('history')} 
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${detailsSubTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                    >
                      <Wallet size={14} /> المسحوبات والمنصرفات
                    </button>
                </div>
              </div>

              <div className="p-6">
                {detailsSubTab === 'attendance' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        سركي الدوام واليوميات (شهري)
                      </h4>
                      <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg transition"><ChevronRight size={18} /></button>
                        <span className="text-sm font-black text-slate-700 min-w-[120px] text-center font-mono">
                          {viewDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg transition"><ChevronLeft size={18} /></button>
                      </div>
                    </div>
                
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      <table className="w-full text-right">
                        {/* Table header and body content remains the same but inside this motion.div */}
                        <thead className="bg-slate-100/50 text-[10px] font-black text-slate-500 sticky top-0 z-10">
                          <tr>
                            <th className="p-3 rounded-r-xl">اليوم</th>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3 text-center">الحالة والكود</th>
                            <th className="p-3 text-center">قيمة المعيشة</th>
                            <th className="p-3 text-center">ساعات إضافية</th>
                            <th className="p-3 text-center">قيمة السهرة</th>
                            <th className="p-3 text-left rounded-l-xl">الإجمالي اليومي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {daysInMonth.map(dateStr => {
                            const log = attendanceLogs.find(l => l.workerId === selectedWorker.id && l.date === dateStr) || {
                              status: 'absent',
                              overtimeHours: 0,
                              overtimeValue: 0,
                              isSettled: false
                            };
                            const isPresent = log.status === 'present' || log.status === 'half-day';
                            const dayLiving = isPresent ? selectedWorker.livingAllowance : 0;
                            const dailyEarned = (selectedWorker.type === 'appointed' ? 0 : 
                              (log.status === 'present' ? selectedWorker.baseRate : (log.status === 'half-day' ? selectedWorker.baseRate/2 : 0))) 
                              + (log.overtimeValue || 0) + dayLiving;
                            
                            const d = new Date(dateStr);
                            const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
                            const isFriday = d.getDay() === 5;

                            return (
                              <tr key={dateStr} className={`hover:bg-white transition group ${isFriday ? 'bg-indigo-50/20' : ''}`}>
                                <td className="p-3">
                                  <span className={`text-[10px] font-black ${isFriday ? 'text-indigo-600' : 'text-slate-500'}`}>{dayName}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-xs font-black text-slate-700 font-mono">{dateStr}</span>
                                </td>
                                <td className="p-3 text-center border-l border-slate-50">
                                  <div className="flex flex-col items-center gap-1.5">
                                    <CustomSelect 
                                      disabled={log.isSettled || userRole === 'viewer'}
                                      value={log.status}
                                      onChange={(val) => handleUpdateRecord(selectedWorker.id, { status: val as any }, dateStr)}
                                      className="w-28 mx-auto"
                                      options={[
                                        { value: 'present', label: 'حاضر', icon: <CheckSquare className="w-3 h-3" />, colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                                        { value: 'half-day', label: 'نصف يوم', icon: <Timer className="w-3 h-3" />, colorClass: 'bg-amber-50 text-amber-700 border-amber-100' },
                                        { value: 'absent', label: 'غائب', icon: <XCircle className="w-3 h-3" />, colorClass: 'bg-rose-50 text-rose-700 border-rose-100' },
                                        { value: 'vacation', label: 'إجازة', icon: <Home className="w-3 h-3" />, colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                                      ]}
                                    />
                                    <div className="flex flex-col items-center">
                                      {log.isSettled ? (
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">MOVED TO ACCOUNTS</span>
                                      ) : (
                                        'id' in log ? (
                                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter font-mono">
                                            REF-ATN-{(log as any).id.split('-')[1]?.slice(-6) || '000000'}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">غير مسجل</span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[11px] font-bold ${dayLiving > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                    {dayLiving} ج
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-1">
                                    <input 
                                      type="number" 
                                      step="0.5"
                                      disabled={log.isSettled || userRole === 'viewer'}
                                      value={log.overtimeHours || ''}
                                      onChange={(e) => handleUpdateRecord(selectedWorker.id, { overtimeHours: parseFloat(e.target.value) || 0 }, dateStr)}
                                      className="w-10 text-center text-[11px] font-black text-indigo-600 bg-transparent outline-none focus:ring-0"
                                      placeholder="0"
                                    />
                                    <span className="text-[9px] text-slate-400 font-black">س</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <input 
                                      type="number"
                                      disabled={log.isSettled || userRole === 'viewer'}
                                      value={log.overtimeValue || ''}
                                      onChange={(e) => handleUpdateRecord(selectedWorker.id, { overtimeValue: Number(e.target.value) }, dateStr)}
                                      className={`w-20 border rounded-lg px-2 py-1 text-[11px] font-black text-center outline-none transition ${
                                        userRole === 'viewer'
                                          ? 'bg-slate-200 text-slate-400 border-slate-100 cursor-not-allowed'
                                          : 'bg-slate-50 border-slate-100 text-indigo-700 focus:bg-white focus:border-indigo-300'
                                      }`}
                                      placeholder="سهرة..."
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-left">
                                  <div className="flex flex-col items-start lg:items-end">
                                    <span className="text-xs font-black text-slate-900 font-mono">{dailyEarned.toLocaleString()} ج</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {detailsSubTab === 'payments' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Add Payment Form */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <h5 className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-wider">تسجيل دفعة استلام راتب جديدة</h5>
                       <form 
                        onSubmit={userRole === 'viewer' ? (e) => { e.preventDefault(); alert('عذراً، لا تملك صلاحية تسجيل دفعات'); } : handleSavePayment} 
                        className="grid grid-cols-1 md:grid-cols-6 gap-3"
                      >
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">التاريخ</label>
                          <input 
                            type="date" 
                            required 
                            value={paymentForm.date} 
                            onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-indigo-300" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">المبلغ (ج.م)</label>
                          <input 
                            type="number" 
                            required 
                            value={paymentForm.amount || ''} 
                            onChange={e => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-indigo-300 font-mono" 
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 mb-1">طريقة الدفع</label>
                          <CustomSelect 
                            value={paymentForm.paymentMethod} 
                            onChange={val => setPaymentForm(prev => ({ ...prev, paymentMethod: val as any }))}
                            options={[
                              { value: 'نقدى', label: 'نقدى', icon: <Banknote className="w-3 h-3" /> },
                              { value: 'تحويل بنكى', label: 'تحويل بنكى', icon: <Building2 className="w-3 h-3" /> },
                              { value: 'شيك', label: 'شيك', icon: <Ticket className="w-3 h-3" /> },
                              { value: 'اخرى', label: 'اخرى', icon: <MoreHorizontal className="w-3 h-3" /> },
                            ]}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 mb-1">مصدر التمويل</label>
                          <CustomSelect 
                            value={paymentForm.nature} 
                            onChange={val => setPaymentForm(prev => ({ ...prev, nature: val as any }))}
                            options={[
                              { value: 'inside_custody', label: 'من العهدة', icon: <ShieldCheck className="w-3 h-3" />, colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                              { value: 'outside_custody', label: 'خارج العهدة', icon: <ExternalLink className="w-3 h-3" />, colorClass: 'bg-amber-50 text-amber-700 border-amber-100' },
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">ملاحظات / مرجع</label>
                          <input 
                            type="text" 
                            value={paymentForm.notes} 
                            onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="دفعة شهر..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-indigo-300" 
                          />
                        </div>
                         <div className="flex items-end">
                           <button 
                            type="submit" 
                            disabled={userRole === 'viewer'}
                            className={`w-full p-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm ${
                              userRole === 'viewer'
                                ? 'bg-slate-300 text-slate-100 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                            }`}
                           >
                             <Save size={14} /> حفظ الدفعة
                           </button>
                         </div>
                      </form>
                    </div>

                    {/* Payments List */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-right text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black">
                          <tr>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3">المبلغ</th>
                            <th className="p-3">الطريقة</th>
                            <th className="p-3">ملاحظات</th>
                            <th className="p-3 text-left">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {salaryPayments.filter(p => p.workerId === selectedWorker.id).length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لا يوجد دفعات مسجلة حتى الآن.</td></tr>
                          ) : (
                            salaryPayments.filter(p => p.workerId === selectedWorker.id).sort((a,b) => b.date.localeCompare(a.date)).map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                                <td className="p-3 font-mono font-bold text-slate-700">{p.date}</td>
                                <td className="p-3 font-black text-indigo-700 font-mono text-xs">{p.amount.toLocaleString()} ج.م</td>
                                <td className="p-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black">{p.paymentMethod}</span>
                                </td>
                                <td className="p-3 text-slate-500 font-medium">{p.notes || '-'}</td>
                                <td className="p-3 text-left">
                                 <button 
                                  onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حذف الدفعات') : () => handleDeletePayment(p.id)} 
                                  disabled={userRole === 'viewer'}
                                  className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                    userRole === 'viewer'
                                      ? 'text-slate-200 cursor-not-allowed'
                                      : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer'
                                  }`}
                                >
                                  <Trash2 size={14} />
                                </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {detailsSubTab === 'history' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Wallet size={18} className="text-rose-600" />
                        المسحوبات والمنصرفات المسجلة له
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">هذه الحركات مسجلة تلقائياً من عمليات التصفية الأسبوعية أو العهد.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-right text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black">
                          <tr>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3">البيان</th>
                            <th className="p-3">طريقة الدفع</th>
                            <th className="p-3 text-left">المبلغ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.filter(tx => tx.recipient === selectedWorker.name && tx.type === 'spent').length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-bold">لا يوجد مسحوبات مسجلة.</td></tr>
                          ) : (
                            transactions.filter(tx => tx.recipient === selectedWorker.name && tx.type === 'spent').sort((a,b) => b.date.localeCompare(a.date)).map(tx => (
                              <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                <td className="p-3 font-mono">
                                  <div>{tx.date}</div>
                                  <div className="text-[9px] text-indigo-500 font-bold">Ref: {tx.id}</div>
                                </td>
                                <td className="p-3 font-bold text-slate-700">{tx.description}</td>
                                <td className="p-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black">{tx.paymentMethod}</span>
                                </td>
                                <td className="p-3 text-left font-black text-rose-600 font-mono">-{tx.amount} ج</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
           </motion.div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden relative text-right flex flex-col md:flex-row">
            
            {/* Sidebar Branding / Decorative for Modal */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 md:w-1/3 p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
               <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
               
               <div className="relative z-10">
                 <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                    <UserPlus className="h-8 w-8 text-white" />
                 </div>
                 <h2 className="text-2xl font-black text-white mb-3">
                   {editingWorker ? 'تعديل بيانات عامل' : 'تسجيل وإدراج عامل جديد للقوة'}
                 </h2>
                 <p className="text-indigo-100/70 text-xs font-medium leading-relaxed font-sans">
                   قم بإضافة بيانات العاملين والمقاولين الباطن لتنظيم سجلات الحضور والغياب واليوميات والعهد المالية الخاصة بهم بدقة عالية.
                 </p>
               </div>

               <div className="relative z-10 pt-10 border-t border-white/10 font-sans">
                 <div className="flex items-center gap-3 text-indigo-100/50 text-[10px] font-bold">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    نظام إدارة العمالة والشؤون الإدارية
                 </div>
               </div>
            </div>

            <div className="flex-1 p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar bg-slate-900">
              <div className="flex justify-between items-center mb-8">
                <div className="h-1 w-20 bg-indigo-500/20 rounded-full" />
                <button 
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 cursor-pointer"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSaveWorker} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">
                      اسم العامل الرباعي / اللقب <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={workerForm.name} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, name: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                      placeholder="مثال: أحمد محمود عباس" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">
                      الرقم القومي (14 رقم) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      maxLength={14}
                      required 
                      value={workerForm.nationalId} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, nationalId: e.target.value.replace(/\D/g, '') }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                      placeholder="29001010100000" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">
                      المحافظة <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={workerForm.governorate} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, governorate: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%200%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                    >
                      {GOVERNORATES.map(g => (
                        <option key={g} value={g} className="bg-slate-900">{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">تاريخ الالتحاق بالموقع</label>
                    <input 
                      type="date" 
                      required 
                      value={workerForm.startDate} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, startDate: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mr-1 font-sans">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        رقم المحمول الأول <span className="text-rose-500">*</span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          setWorkerForm(prev => {
                            const current = prev.whatsAppOn;
                            let next: any = 'none';
                            if (current === 'none') next = 'phone1';
                            else if (current === 'phone1') next = 'none';
                            else if (current === 'phone2') next = 'both';
                            else if (current === 'both') next = 'phone2';
                            return { ...prev, whatsAppOn: next };
                          });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black transition-all border ${
                          (workerForm.whatsAppOn === 'phone1' || workerForm.whatsAppOn === 'both') 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Check size={10} /> واتساب
                      </button>
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={workerForm.phone1} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, phone1: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                      placeholder="01xxxxxxxxx" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mr-1 font-sans">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">رقم المحمول الثاني (اختياري)</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setWorkerForm(prev => {
                            const current = prev.whatsAppOn;
                            let next: any = 'none';
                            if (current === 'none') next = 'phone2';
                            else if (current === 'phone2') next = 'none';
                            else if (current === 'phone1') next = 'both';
                            else if (current === 'both') next = 'phone1';
                            return { ...prev, whatsAppOn: next };
                          });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black transition-all border ${
                          (workerForm.whatsAppOn === 'phone2' || workerForm.whatsAppOn === 'both') 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Check size={10} /> واتساب
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={workerForm.phone2 || ''} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, phone2: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                      placeholder="01xxxxxxxxx" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">رقم تحويل الراتب (محفظة / انستا باي)</label>
                    <input 
                      type="text" 
                      value={workerForm.salaryTransferNo || ''} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, salaryTransferNo: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                      placeholder="رقم المحفظة أو العنوان الإلكتروني" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">
                      المسمى الوظيفي <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={workerForm.jobTitle} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, jobTitle: e.target.value }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm" 
                      placeholder="مثال: نجار مسلح" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">فئة التوظيف</label>
                    <select 
                      value={workerForm.type} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, type: e.target.value as any }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%200%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                    >
                      <option value="appointed" className="bg-slate-900">معين (شهري)</option>
                      <option value="saraky" className="bg-slate-900">سراكى (يومية)</option>
                      <option value="laborer" className="bg-slate-900">عمال يومية</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">قوة العمل</label>
                    <select 
                      value={workerForm.forceStatus} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, forceStatus: e.target.value as any }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none focus:border-indigo-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%200%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                    >
                      <option value="on-site" className="bg-slate-900">على قوة الموقع</option>
                      <option value="external" className="bg-slate-900">خارج القوة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">
                      {workerForm.type === 'appointed' ? 'الراتب (شهري)' : 'اليومية (ج.م)'} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={workerForm.baseRate === 0 ? '' : workerForm.baseRate} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, baseRate: e.target.value === '' ? 0 : Number(e.target.value) }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-mono font-bold text-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 transition-all shadow-sm"
                      placeholder={workerForm.type === 'appointed' ? 'الراتب الشهري' : '0'} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1 font-sans">قيمة المعيشة</label>
                    <input 
                      type="number" 
                      value={workerForm.livingAllowance === 0 ? '' : workerForm.livingAllowance} 
                      onChange={e => setWorkerForm(prev => ({ ...prev, livingAllowance: e.target.value === '' ? 0 : Number(e.target.value) }))} 
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm font-mono font-bold text-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none focus:border-amber-500 transition-all shadow-sm" 
                      placeholder="0" 
                    />
                  </div>
                </div>
                
                <div className="pt-8 flex gap-4 font-sans">
                   <button
                    type="button"
                    onClick={() => setShowWorkerModal(false)}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-2xl transition-all active:scale-95 cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-950 shadow-inner active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="h-5 w-5" />
                    {editingWorker ? 'حفظ التعديلات في السجل' : 'حفظ كقوة موقع جديدة'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-rose-100 shadow-2xl p-6 max-w-sm w-full text-right"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-rose-100 text-rose-600 rounded-full mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">حذف سجل العامل نهائياً؟</h3>
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg mb-4 text-rose-700 text-[11px] font-bold leading-relaxed">
              🚨 تحذير: سيتم مسح كافة سجلات الحضور والبيانات المالية المرتبطة بالعامل <span className="underline">[{confirmDelete.name}]</span> ولا يمكن التراجع أو استعادة البيانات المحذوفة.
            </div>
            
            <div className="mb-4 space-y-2">
              <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">كود التحقق لتأكيد الحذف: <span className="text-rose-600 text-sm ml-2 select-all font-mono tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{expectedDeleteCode}</span></label>
              <input 
                type="text"
                value={deleteVerificationInput}
                onChange={(e) => setDeleteVerificationInput(e.target.value)}
                placeholder="أدخل كود التحقق..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-black tracking-widest text-slate-700 outline-none focus:border-rose-300 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDeleteWorker(confirmDelete.id, confirmDelete.name)}
                disabled={deleteVerificationInput !== expectedDeleteCode}
                className={`w-full py-3 font-black rounded-xl transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  deleteVerificationInput === expectedDeleteCode
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                  : 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none'
                }`}
              >
                تأكيد وبدء الحذف
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
              >
                إلغاء التراجع
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
