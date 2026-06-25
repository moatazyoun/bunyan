/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  Droplet, 
  Wrench,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Building,
  Target,
  History,
  ShieldAlert,
  Save,
  Check,
  Fuel,
  Info,
  CalendarDays,
  LayoutDashboard,
  Truck,
  Hash
} from 'lucide-react';
import { OperationalLog, EquipmentSummary, Transaction, FuelLogRecord, MaintenanceOrder } from '../types';
import EquipmentOperationLog from './EquipmentOperationLog';
import EquipmentSummaryTable from './EquipmentSummaryTable';
import EquipmentModals from './EquipmentModals';

interface EquipmentDashboardProps {
  equipmentList: EquipmentSummary[];
  setEquipmentList: React.Dispatch<React.SetStateAction<EquipmentSummary[]>>;
  transactions: Transaction[];
  fuelLogs: FuelLogRecord[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLogRecord[]>>;
  custodyBudget: number;
  setCustodyBudget: React.Dispatch<React.SetStateAction<number>>;
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
  maintenanceOrders?: MaintenanceOrder[];
  setMaintenanceOrders?: React.Dispatch<React.SetStateAction<MaintenanceOrder[]>>;
  initialTab?: 'operation' | 'maintenance';
}

export default function EquipmentDashboard({ 
  equipmentList, 
  setEquipmentList, 
  transactions,
  fuelLogs,
  setFuelLogs,
  custodyBudget,
  setCustodyBudget,
  userRole,
  addAuditLog,
  maintenanceOrders,
  setMaintenanceOrders,
  initialTab = 'operation'
}: EquipmentDashboardProps) {
  const [selectedEqId, setSelectedEqId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'operation' | 'maintenance'>(initialTab);

  // Defensive fallback state for maintenance orders if not passed by parent
  const [localMaintOrders, setLocalMaintOrders] = useState<MaintenanceOrder[]>([]);
  const currentMaintOrders = maintenanceOrders || localMaintOrders;
  const currentSetMaintOrders = setMaintenanceOrders || setLocalMaintOrders;

  // Sync tab with initialTab prop if it changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Set default selected ID if list exists
  useEffect(() => {
    if (equipmentList.length > 0 && !selectedEqId) {
      setSelectedEqId(equipmentList[0].id);
    }
  }, [equipmentList, selectedEqId]);

  // --- Maintenance State ---
  const [showMaintModal, setShowMaintModal] = useState<boolean>(false);
  const [maintEqId, setMaintEqId] = useState<string>('');
  const [maintDate, setMaintDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [maintType, setMaintType] = useState<'preventive' | 'emergency'>('preventive');
  const [maintCost, setMaintCost] = useState<number>(0);
  const [maintDesc, setMaintDesc] = useState<string>('');
  const [maintStatus, setMaintStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  const [filterEqId, setFilterEqId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Set default selected equipment for maintenance form if list exists
  useEffect(() => {
    if (equipmentList.length > 0 && !maintEqId) {
      setMaintEqId(equipmentList[0].id);
    }
  }, [equipmentList, maintEqId]);

  const handleAddMaintOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintEqId) {
      alert('الرجاء اختيار المعدة المعنية بالصيانة.');
      return;
    }
    if (!maintDesc.trim()) {
      alert('الرجاء كتابة تفاصيل ووصف أعمال الصيانة.');
      return;
    }

    const selectedEq = equipmentList.find(eq => eq.id === maintEqId);
    if (!selectedEq) return;

    const newOrder: MaintenanceOrder = {
      id: `maint-${Date.now()}`,
      equipmentId: selectedEq.id,
      equipmentCode: selectedEq.name,
      date: maintDate,
      type: maintType,
      cost: Number(maintCost) || 0,
      description: maintDesc.trim(),
      status: maintStatus
    };

    setConfirmState({
      isOpen: true,
      title: 'إدراج أمر صيانة جديد',
      message: `تأكيد تسجيل أمر صيانة لـ "${selectedEq.name}" بتكلفة تقديرية ${maintCost} ج.م؟`,
      onConfirm: () => {
        currentSetMaintOrders(prev => [newOrder, ...prev]);

        addAuditLog?.(
          `أمر صيانة: ${selectedEq.name}`,
          'صيانة المعدات',
          `تم تسجيل أمر صيانة [${newOrder.type === 'preventive' ? 'وقائي' : 'طارئ'}] بحالة [${maintStatus}] وتكلفة ${maintCost} ج.م`
        );

        // Reset form
        setMaintCost(0);
        setMaintDesc('');
        setMaintStatus('pending');
        setShowMaintModal(false);
      }
    });
  };

  const handleUpdateMaintStatus = (orderId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    currentSetMaintOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    }));

    const order = currentMaintOrders.find(o => o.id === orderId);
    if (order) {
      addAuditLog?.(
        `تحديث حالة صيانة: ${order.equipmentCode}`,
        'صيانة المعدات',
        `تم تغيير حالة أمر الصيانة [${orderId}] إلى [${newStatus}]`
      );
    }
  };

  const handleDeleteMaintOrder = (orderId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف أمر صيانة',
      message: 'هل أنت متأكد من حذف هذا السجل الفني للصيانة نهائياً؟',
      onConfirm: () => {
        currentSetMaintOrders(prev => prev.filter(o => o.id !== orderId));
        addAuditLog?.(`حذف سجل صيانة`, 'صيانة المعدات', `تم حذف أمر صيانة رقم [${orderId}] من النظام`);
      }
    });
  };

  // --- AI States ---
  const [showAiIngest, setShowAiIngest] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiImageMime, setAiImageMime] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiResultRecords, setAiResultRecords] = useState<any[]>([]);

  const [deleteVerificationInput, setDeleteVerificationInput] = useState('');
  const [expectedDeleteCode, setExpectedDeleteCode] = useState('');

  // Custom confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDeleteAction?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Map parsed transactions to sarki daily logs
  const mapTransactionsToSarkiLogs = (txs: any[]) => {
    return txs.map((tx, idx) => {
      const desc = tx.description || '';
      
      let duration = 8;
      const hoursMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:ساعات|ساعة|س)/);
      if (hoursMatch) {
         duration = parseFloat(hoursMatch[1]) || 8;
      }
      
      const siteExpense = desc.includes('مصروف') ? 50 : 0;
      const spent = tx.amount || 0;

      const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const txDate = tx.date || new Date().toISOString().split('T')[0];
      const d = new Date(txDate);
      const dayName = daysArabic[d.getDay()] || 'الأحد';

      return {
        id: `log-ai-${Date.now()}-${idx}`,
        day: dayName,
        date: txDate,
        fromTime: '8:00 ص',
        toTime: '4:00 م',
        duration: duration,
        cost: 0,
        siteExpense: siteExpense,
        spent: spent,
        discount: 0,
        deductedHours: 0,
        notes: tx.description || 'تم تسجيل السركي الذاتي تلقائياً بمساعد الذكاء الاصطناعي'
      };
    });
  };

  // Equipment list-wide Editing and Creation State
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [editEqForm, setEditEqForm] = useState<Partial<EquipmentSummary>>({});
  
  const [showAddEqModal, setShowAddEqModal] = useState<boolean>(false);
  const [newEqName, setNewEqName] = useState<string>('');
  const [newEqDriver, setNewEqDriver] = useState<string>('');
  const [newEqIsRental, setNewEqIsRental] = useState<boolean>(true);
  const [newEqRate, setNewEqRate] = useState<number>(0);
  const [newEqRateUnit, setNewEqRateUnit] = useState<string>('ساعة');
  const [newEqCarryover, setNewEqCarryover] = useState<number>(0);
  const [newEqFuel, setNewEqFuel] = useState<number>(0);
  const [newEqSpent, setNewEqSpent] = useState<number>(0);
  const [newEqDiscount, setNewEqDiscount] = useState<number>(0);
  const [newEqDailyHours, setNewEqDailyHours] = useState<number>(8);

  // Sarki log inline editing state
  const [editingLogIdx, setEditingLogIdx] = useState<number | null>(null);
  const [editLogForm, setEditLogForm] = useState<Partial<OperationalLog>>({});

  // Handler to add a raw log row for active Equipment
  const [newLogDay, setNewLogDay] = useState<string>('السبت');
  const [newLogDate, setNewLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLogFrom, setNewLogFrom] = useState<string>('8:00 ص');
  const [newLogTo, setNewLogTo] = useState<string>('4:00 م');
  const [newLogDuration, setNewLogDuration] = useState<string>('8');
  const [newLogDiscount, setNewLogDiscount] = useState<number>(0);
  const [newLogDeductedHours, setNewLogDeductedHours] = useState<number>(0);
  const [newLogNotes, setNewLogNotes] = useState<string>('');

  useEffect(() => {
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const normalized = timeStr.replace('ص', 'AM').replace('م', 'PM');
      const match = normalized.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) {
        const num = parseFloat(timeStr);
        return isNaN(num) ? null : num;
      };
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };

    const fromVal = parseTime(newLogFrom);
    const toVal = parseTime(newLogTo);

    if (fromVal !== null && toVal !== null) {
      let diff = toVal - fromVal;
      if (diff < 0) diff += 24; 
      const finalDur = Math.max(0, diff - newLogDeductedHours);
      setNewLogDuration(finalDur.toFixed(1));
    }
  }, [newLogFrom, newLogTo, newLogDeductedHours]);

  const handleStartEditEq = (eq: EquipmentSummary) => {
    setEditingEqId(eq.id);
    setEditEqForm({ ...eq });
  };

  const handleSaveEqEdit = () => {
    if (!editEqForm.id) return;
    setConfirmState({
      isOpen: true,
      title: 'حفظ تعديل بيانات المعدة',
      message: `تأكيد تعديل: هل تريد تحديث بيانات المعدة "${editEqForm.name}"؟`,
      onConfirm: () => {
        setEquipmentList(prev => prev.map(eq => eq.id === editEqForm.id ? { ...eq, ...editEqForm } : eq));
        addAuditLog?.(`تعديل معدة: ${editEqForm.name}`, 'المعدات', `تم تحديث البيانات الأساسية للمعدة [${editEqForm.id}]`);
        setEditingEqId(null);
        setEditEqForm({});
      }
    });
  };

  const handleDeleteEq = (id: string, name: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedDeleteCode(code);
    setDeleteVerificationInput('');
    setConfirmState({
      isOpen: true,
      title: 'حذف معدة قاطع',
      message: `هل أنت متأكد من حذف المعدة "${name}" وكافة سجلاتها؟ هذا الإجراء نهائي ولا يمكن التراجع عنه.`,
      isDeleteAction: true,
      onConfirm: () => {
        const remainingList = equipmentList.filter(eq => eq.id !== id);
        setEquipmentList(remainingList);
        addAuditLog?.(`حذف معدة: ${name}`, 'المعدات', `تم حذف المعدة [${id}] من النظام`);
        if (selectedEqId === id) setSelectedEqId(remainingList[0]?.id || '');
      }
    });
  };

  const handleAddEqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim()) return;

    setConfirmState({
      isOpen: true,
      title: 'إدراج معدة جديدة',
      message: `تأكيد إضافة المعدة "${newEqName.trim()}"؟`,
      onConfirm: () => {
        const newId = `eq-${Date.now()}`;
        const newEqData: EquipmentSummary = {
          id: newId,
          name: newEqName.trim(),
          driver: newEqDriver.trim() || 'غير معين',
          isRental: newEqIsRental,
          rate: newEqRate,
          durationLabel: newEqRateUnit,
          dailyShiftHours: newEqDailyHours,
          carryoverHours: newEqCarryover,
          advance: 0,
          spentOverride: newEqSpent,
          fuelCodeSpent: newEqFuel,
          logs: []
        };
        if (newEqDiscount > 0) (newEqData as any).discountOverride = newEqDiscount;
        
        setEquipmentList(prev => [...prev, newEqData]);
        addAuditLog?.(`إضافة معدة: ${newEqName}`, 'المعدات', `تم تسجيل معدة جديدة بكود [${newId}]`);
        setSelectedEqId(newId);
        setShowAddEqModal(false);
        // Reset
        setNewEqName(''); setNewEqDriver(''); setNewEqRate(0); setNewEqCarryover(0);
      }
    });
  };

  const activeEquipment = equipmentList.find(e => e.id === selectedEqId) || equipmentList[0];

  // Calculations
  const calculateLogsHours = (logs: OperationalLog[] | undefined) => logs?.reduce((sum, log) => sum + (parseFloat(String(log.duration)) || 0), 0) || 0;
  const getDurationSuffix = (label: string) => label === "ساعة" ? "ساعة" : "يوم";
  const getDaysInMonthForEq = (eq: EquipmentSummary): number => 30;
  
  const getEquipmentDailyRate = (eq: EquipmentSummary): number => {
    if (eq.durationLabel === "يومية") return eq.rate;
    if (eq.durationLabel.includes("أسبوع")) return eq.rate / 6;
    if (eq.durationLabel.includes("شهر")) return eq.rate / getDaysInMonthForEq(eq);
    return eq.rate;
  };

  const getEquipmentTotalDuration = (eq: EquipmentSummary) => {
    const totalHours = eq.carryoverHours + calculateLogsHours(eq.logs);
    return eq.durationLabel === "ساعة" ? totalHours : totalHours / 8;
  };

  const getEquipmentCost = (eq: EquipmentSummary) => {
    if (!eq.isRental) return 0;
    const totalHours = eq.carryoverHours + calculateLogsHours(eq.logs);
    if (eq.durationLabel === "ساعة") return Math.round(totalHours * eq.rate);
    return Math.round((totalHours / 8) * getEquipmentDailyRate(eq));
  };

  const getEquipmentDiscount = (eq: EquipmentSummary) => (eq as any).discountOverride || eq.logs?.reduce((sum, log) => sum + (log.discount || 0), 0) || 0;
  
  const getEquipmentSpent = (item: EquipmentSummary) => {
    const linkedSum = transactions.filter(t => t.equipmentId === item.id && t.type === 'spent').reduce((sum, t) => sum + t.amount, 0);
    return (item.advance || 0) + (item.spentOverride || 0) + linkedSum;
  };

  const getEquipmentRemaining = (item: EquipmentSummary) => getEquipmentCost(item) - (getEquipmentDiscount(item) + getEquipmentSpent(item));

  const totalFuel = equipmentList.reduce((sum, e) => sum + fuelLogs.filter(log => log.equipmentName === e.name).reduce((s, l) => s + l.cost, 0), 0);
  const totalRentedCost = equipmentList.filter(e => e.isRental).reduce((sum, e) => sum + getEquipmentCost(e), 0);
  const totalRentedRemaining = equipmentList.filter(e => e.isRental).reduce((sum, e) => sum + getEquipmentRemaining(e), 0);
  const totalGeneralEquipmentCost = totalRentedCost + totalFuel;

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEquipment) return;
    const finalDuration = parseFloat(newLogDuration) || 0;
    const logId = `log-${Date.now()}`;
    const newRow: OperationalLog = {
      id: logId, day: newLogDay, date: newLogDate, fromTime: newLogFrom, toTime: newLogTo,
      duration: finalDuration, cost: 0, siteExpense: 0, fuelLiters: 0, fuelCost: 0,
      discount: newLogDiscount, deductedHours: newLogDeductedHours, notes: newLogNotes
    };

    const existingLogIdx = activeEquipment.logs.findIndex(log => log.date === newLogDate);
    if (existingLogIdx !== -1) {
      setConfirmState({
        isOpen: true, title: 'تكرار تاريخ', message: `تاريخ ${newLogDate} موجود بالفعل. هل تريد تحديثه؟`,
        confirmLabel: 'تحديث',
        onConfirm: () => {
          const updatedLogs = [...activeEquipment.logs];
          updatedLogs[existingLogIdx] = { ...newRow, id: updatedLogs[existingLogIdx].id || logId };
          setEquipmentList(prev => prev.map(eq => eq.id === activeEquipment.id ? { ...eq, logs: updatedLogs } : eq));
          addAuditLog?.(`تحديث يومية: ${activeEquipment.name}`, 'سركى المعدات', `تعديل يومية تاريخ ${newLogDate}`);
        }
      });
      return;
    }

    setEquipmentList(prev => prev.map(eq => eq.id === activeEquipment.id ? { ...eq, logs: [...eq.logs, newRow] } : eq));
    addAuditLog?.(`تسجيل يومية: ${activeEquipment.name}`, 'سركى المعدات', `إضافة يومية جديدة بتاريخ ${newLogDate} - كود مرجع: REF-EQP-${logId.slice(-6)}`);
    setNewLogNotes(''); setNewLogDiscount(0);
  };

  const handleDeleteLogIndex = (idx: number) => {
    if (!activeEquipment) return;
    setConfirmState({
      isOpen: true, title: 'حذف يومية', message: 'هل تريد حذف هذا اليوم من السركي؟',
      onConfirm: () => {
        const log = activeEquipment.logs[idx];
        const updatedLogs = [...activeEquipment.logs];
        updatedLogs.splice(idx, 1);
        setEquipmentList(prev => prev.map(eq => eq.id === activeEquipment.id ? { ...eq, logs: updatedLogs } : eq));
        addAuditLog?.(`حذف يومية: ${activeEquipment.name}`, 'سركى المعدات', `تم حذف يومية تاريخ ${log.date}`);
      }
    });
  };

  const handleSaveLogIndex = (idx: number) => {
    if (!activeEquipment) return;
    const updatedLogs = [...activeEquipment.logs];
    updatedLogs[idx] = { ...updatedLogs[idx], ...editLogForm };
    setEquipmentList(prev => prev.map(eq => eq.id === activeEquipment.id ? { ...eq, logs: updatedLogs } : eq));
    addAuditLog?.(`تعديل يومية: ${activeEquipment.name}`, 'سركى المعدات', `تم حفظ تعديلات يومية بتاريخ ${updatedLogs[idx].date}`);
    setEditingLogIdx(null);
  };

  const renderConfirmDialog = () => (
    <AnimatePresence>
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full text-right space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-row-reverse">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                    <AlertCircle size={18} />
                 </div>
                 <h4 className="font-black text-lg text-slate-900 tracking-tight">{confirmState.title}</h4>
              </div>
              <button onClick={() => setConfirmState(null)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            <p className="text-slate-600 text-xs font-bold leading-relaxed">{confirmState.message}</p>
            
            {confirmState.isDeleteAction && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-3">
                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">أدخل كود التحقق لتأكيد الحذف: <span className="bg-rose-100 px-2 py-0.5 rounded text-rose-700 text-sm ml-1 select-all font-mono tracking-widest">{expectedDeleteCode}</span></label>
                <input 
                  type="text"
                  value={deleteVerificationInput}
                  onChange={(e) => setDeleteVerificationInput(e.target.value)}
                  placeholder="أدخل الكود المكون من 4 أرقام"
                  className="w-full px-4 py-3 text-center bg-white border border-rose-200 rounded-xl text-lg font-black tracking-[0.5em] text-rose-600 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:tracking-normal placeholder:text-[10px] placeholder:font-bold"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 flex-row-reverse">
              <button
                type="button"
                disabled={confirmState.isDeleteAction && deleteVerificationInput !== expectedDeleteCode}
                onClick={async () => { 
                  if (confirmState.isDeleteAction && deleteVerificationInput !== expectedDeleteCode) return;
                  try { await confirmState.onConfirm(); } finally { setConfirmState(null); } 
                }}
                className={`px-8 py-3.5 text-xs font-black rounded-2xl transition-all shadow-xl active:scale-95 flex-1 md:flex-none ${
                  confirmState.isDeleteAction 
                    ? (deleteVerificationInput === expectedDeleteCode ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none')
                    : 'bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-100'
                }`}
              >
                {confirmState.confirmLabel || (confirmState.isDeleteAction ? 'تأكيد الحذف النهائي' : 'تأكيد واستمرار')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black rounded-2xl transition-all flex-1 md:flex-none"
              >
                {confirmState.cancelLabel || 'تراجع'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!activeEquipment) {
     return (
       <div className="p-20 text-center bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200">
         <Truck className="mx-auto text-slate-200 mb-6" size={80} />
         <h2 className="text-2xl font-black text-slate-400 mb-6 tracking-tight italic uppercase">أسطول المشروع فارغ حالياً</h2>
         <button onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الإضافة') : () => setShowAddEqModal(true)} disabled={userRole === 'viewer'} className={`px-8 py-4 ${userRole === 'viewer' ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-slate-900 active:scale-95'} text-white rounded-2xl text-sm font-black shadow-2xl transition-all flex items-center gap-3 mx-auto`}>
           <Plus size={20} />
           تسجيل أول معدة بالموقع
         </button>
         <EquipmentModals 
           showAddEqModal={showAddEqModal} setShowAddEqModal={setShowAddEqModal} handleAddEqSubmit={handleAddEqSubmit}
           newEqName={newEqName} setNewEqName={setNewEqName} newEqDriver={newEqDriver} setNewEqDriver={setNewEqDriver}
           newEqIsRental={newEqIsRental} setNewEqIsRental={setNewEqIsRental} newEqRate={newEqRate} setNewEqRate={setNewEqRate}
           newEqRateUnit={newEqRateUnit} setNewEqRateUnit={setNewEqRateUnit} newEqCarryover={newEqCarryover} setNewEqCarryover={setNewEqCarryover}
           newEqFuel={newEqFuel} setNewEqFuel={setNewEqFuel} newEqSpent={newEqSpent} setNewEqSpent={setNewEqSpent}
           newEqDiscount={newEqDiscount} setNewEqDiscount={setNewEqDiscount} newEqDailyHours={newEqDailyHours} setNewEqDailyHours={setNewEqDailyHours}
           editingEqId={editingEqId} setEditingEqId={setEditingEqId} editEqForm={editEqForm} setEditEqForm={setEditEqForm} handleSaveEqEdit={handleSaveEqEdit}
         />
         {renderConfirmDialog()}
       </div>
     );
  }

  const maintStats = useMemo(() => {
    const totalCost = currentMaintOrders.reduce((sum, order) => sum + (order.cost || 0), 0);
    const activeJobs = currentMaintOrders.filter(order => order.status === 'in_progress').length;
    const preventiveCount = currentMaintOrders.filter(order => order.type === 'preventive').length;
    const emergencyCount = currentMaintOrders.filter(order => order.type === 'emergency').length;
    return { totalCost, activeJobs, preventiveCount, emergencyCount };
  }, [currentMaintOrders]);

  const filteredMaintOrders = useMemo(() => {
    return currentMaintOrders.filter(order => {
      const matchEq = filterEqId === 'all' || order.equipmentId === filterEqId;
      const matchType = filterType === 'all' || order.type === filterType;
      const matchStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchEq && matchType && matchStatus;
    });
  }, [currentMaintOrders, filterEqId, filterType, filterStatus]);

  return (
    <div className="space-y-12 animate-fadeIn text-right font-sans overflow-hidden pb-12">
      {/* Top Banner */}
      <div className="relative group overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-rose-900/20 mix-blend-overlay"></div>
         <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-3 justify-end md:justify-start flex-row-reverse">
                  <span className="bg-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-900/40">التحكم في الأسطول والصيانة</span>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">تزامن حي (Live)</span>
               </div>
               <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">إدارة وتشغيل وصيانة المعدات</h2>
               <p className="text-slate-400 text-sm font-bold max-w-md">متابعة السركي اليومي، حسابات المحروقات، وبرامج الصيانة الوقائية والطارئة للآلات</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
               <button onClick={() => window.print()} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black shadow-xl hover:bg-slate-100 transition-all flex items-center gap-2">
                 <Printer size={16} />
                 طباعة التقرير
               </button>
               <button onClick={() => setShowAiIngest(!showAiIngest)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl hover:bg-slate-900 transition-all flex items-center gap-2 border border-indigo-400/20">
                 <Sparkles size={16} className="animate-pulse text-amber-300" />
                 المساعد الذكي (AI)
               </button>
            </div>
         </div>
      </div>

      {/* Elegant Sub-Tab Selectors */}
      <div className="flex items-center justify-center p-1.5 bg-slate-100 rounded-3xl max-w-lg mx-auto border border-slate-200">
        <button
          onClick={() => setActiveTab('operation')}
          className={`flex items-center justify-center gap-3 py-3 px-6 rounded-2xl text-xs font-black transition-all duration-300 flex-1 ${
            activeTab === 'operation'
              ? 'bg-slate-900 text-white shadow-lg scale-[1.02]'
              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
          }`}
        >
          <Truck size={16} />
          يوميات وتشغيل المعدات (السركي)
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center justify-center gap-3 py-3 px-6 rounded-2xl text-xs font-black transition-all duration-300 flex-1 ${
            activeTab === 'maintenance'
              ? 'bg-slate-900 text-white shadow-lg scale-[1.02]'
              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
          }`}
        >
          <Wrench size={16} />
          جدول الصيانة والأعطال الوقائية
        </button>
      </div>

      {/* AI Ingest */}
      <AnimatePresence>
        {showAiIngest && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 bg-slate-900 rounded-3xl border border-slate-800 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[80px] pointer-events-none"></div>
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
                   <Sparkles className="text-white" size={24} />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight italic uppercase">محرك تحليل البيانات البصري</h4>
                   <p className="text-xs text-slate-400 font-bold">حلل صور السركي الورقي أو نصوص الصيانة لإدراج الحركات تلقائياً</p>
                </div>
             </div>
             <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-700 rounded-[2rem] bg-slate-950/40">
                <span className="text-slate-500 font-black text-sm uppercase italic">قريباً: تكامل Gemini 2.0 Pro للفهم العميق للمستندات والفواتير</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'operation' ? (
        <div className="grid grid-cols-1 gap-12">
          <EquipmentSummaryTable 
            equipmentList={equipmentList} selectedEqId={selectedEqId} setSelectedEqId={setSelectedEqId}
            fuelLogs={fuelLogs} transactions={transactions} userRole={userRole}
            setShowAddEqModal={setShowAddEqModal} handleStartEditEq={handleStartEditEq} handleDeleteEq={handleDeleteEq}
            getEquipmentTotalDuration={getEquipmentTotalDuration} getDurationSuffix={getDurationSuffix}
            getEquipmentDailyRate={getEquipmentDailyRate} getEquipmentCost={getEquipmentCost}
            getEquipmentDiscount={getEquipmentDiscount} getEquipmentSpent={getEquipmentSpent}
            getEquipmentRemaining={getEquipmentRemaining} totalGeneralEquipmentCost={totalGeneralEquipmentCost}
            totalRentedCost={totalRentedCost} totalFuel={totalFuel} totalRentedRemaining={totalRentedRemaining}
          />

          <EquipmentOperationLog 
            activeEquipment={activeEquipment} userRole={userRole} handleUpdateRecord={() => {}}
            handleAddLog={handleAddLog} handleDeleteLogIndex={handleDeleteLogIndex}
            editingLogIdx={editingLogIdx} setEditingLogIdx={setEditingLogIdx}
            editLogForm={editLogForm} setEditLogForm={setEditLogForm} handleSaveLogIndex={handleSaveLogIndex}
            newLogDay={newLogDay} setNewLogDay={setNewLogDay} newLogDate={newLogDate} setNewLogDate={setNewLogDate}
            newLogFrom={newLogFrom} setNewLogFrom={setNewLogFrom} newLogTo={newLogTo} setNewLogTo={setNewLogTo}
            newLogDuration={newLogDuration} setNewLogDuration={setNewLogDuration}
            newLogDiscount={newLogDiscount} setNewLogDiscount={setNewLogDiscount}
            newLogDeductedHours={newLogDeductedHours} setNewLogDeductedHours={setNewLogDeductedHours}
            newLogNotes={newLogNotes} setNewLogNotes={setNewLogNotes}
            getEquipmentCost={getEquipmentCost} getEquipmentTotalDuration={getEquipmentTotalDuration} getDurationSuffix={getDurationSuffix}
          />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Maintenance KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold text-xs">إجمالي تكاليف الصيانة</span>
                <h4 className="text-2xl font-black text-slate-900">{maintStats.totalCost.toLocaleString('ar-EG')} ج.م</h4>
              </div>
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Coins size={24} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold text-xs">أعطال نشطة قيد الإصلاح</span>
                <h4 className="text-2xl font-black text-amber-600">{maintStats.activeJobs} معدات</h4>
              </div>
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock size={24} className="animate-spin-slow" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold text-xs">أعمال صيانة وقائية</span>
                <h4 className="text-2xl font-black text-emerald-600">{maintStats.preventiveCount} عمليات</h4>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Wrench size={24} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold text-xs">أعمال إصلاحات طارئة</span>
                <h4 className="text-2xl font-black text-rose-600">{maintStats.emergencyCount} بلاغات</h4>
              </div>
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>

          <div className="w-full space-y-6">
            {/* List and History of Maintenance Orders */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">سجل وبوابات عمليات الصيانة الفنية</h3>
                  <p className="text-[11px] text-slate-500 font-bold">عرض وتصفية جميع الفحوصات والتدخلات الميكانيكية الحية للأسطول</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto flex-row-reverse">
                  {/* Trigger Button for the new Maintenance Order Modal */}
                  <button
                    type="button"
                    onClick={() => setShowMaintModal(true)}
                    className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>صياغة أمر صيانة وقائية / طارئة</span>
                  </button>

                  {/* Real-time statistics badge */}
                  <div className="bg-slate-100 text-slate-800 text-[10px] font-black px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    إجمالي السجلات: {filteredMaintOrders.length} من {currentMaintOrders.length}
                  </div>
                </div>
              </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500">تصفية بالمعدة</label>
                    <select
                      value={filterEqId}
                      onChange={(e) => setFilterEqId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-800 font-bold outline-none focus:ring-2 focus:ring-slate-500/10 transition-all"
                    >
                      <option value="all">الكل (كافة الآلات)</option>
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500">نوع الصيانة</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-800 font-bold outline-none focus:ring-2 focus:ring-slate-500/10 transition-all"
                    >
                      <option value="all">كل الأنواع</option>
                      <option value="preventive">وقائية دورية</option>
                      <option value="emergency">إصلاح طارئ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500">حالة الإصلاح</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-800 font-bold outline-none focus:ring-2 focus:ring-slate-500/10 transition-all"
                    >
                      <option value="all">كل الحالات</option>
                      <option value="pending">في الانتظار / معلق</option>
                      <option value="in_progress">قيد الإصلاح بورشة العمل</option>
                      <option value="completed">مكتمل وتم التشغيل</option>
                    </select>
                  </div>
                </div>

                {/* Orders Content */}
                {filteredMaintOrders.length === 0 ? (
                  <div className="p-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Wrench className="mx-auto text-slate-200 mb-4 animate-bounce" size={48} />
                    <h4 className="text-sm font-black text-slate-500">لا توجد سجلات صيانة مطابقة للتصفية الحالية</h4>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">قم بتغيير خيارات الفلترة أو صياغة أمر صيانة جديد للآلات بالمشروع</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMaintOrders.map((order) => {
                      const isEmergency = order.type === 'emergency';
                      return (
                        <div
                          key={order.id}
                          className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                            isEmergency 
                              ? 'border-rose-100 bg-rose-50/10' 
                              : 'border-slate-150 bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {/* Main Details */}
                            <div className="space-y-2 text-right">
                              <div className="flex flex-wrap items-center gap-2 flex-row-reverse">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                                  order.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : order.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {order.status === 'completed' ? '✓ مكتمل وتم الإصلاح' : order.status === 'in_progress' ? '⚙ قيد الإصلاح' : '⏱ معلق في الانتظار'}
                                </span>

                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                                  isEmergency
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}>
                                  {isEmergency ? 'عطل طارئ' : 'صيانة وقائية'}
                                </span>

                                <h4 className="font-black text-slate-900 text-sm">{order.equipmentCode}</h4>
                              </div>

                              <p className="text-xs text-slate-600 font-semibold leading-relaxed pr-2">
                                {order.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold flex-row-reverse pr-2 pt-1">
                                <span className="flex items-center gap-1">
                                  <CalendarDays size={12} />
                                  {order.date}
                                </span>
                                <span className="flex items-center gap-1 font-mono text-indigo-600">
                                  ID: {order.id}
                                </span>
                              </div>
                            </div>

                            {/* Cost and Actions */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-bold">التكلفة الفعلية</span>
                                <span className="text-base font-black text-slate-900 font-mono">{order.cost.toLocaleString('ar-EG')} ج.م</span>
                              </div>

                              {userRole !== 'viewer' && (
                                <div className="flex items-center gap-2">
                                  {order.status === 'pending' && (
                                    <button
                                      onClick={() => handleUpdateMaintStatus(order.id, 'in_progress')}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all shadow-sm"
                                    >
                                      بدء الإصلاح
                                    </button>
                                  )}
                                  {order.status === 'in_progress' && (
                                    <button
                                      onClick={() => handleUpdateMaintStatus(order.id, 'completed')}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all shadow-sm"
                                    >
                                      إغلاق السجل
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteMaintOrder(order.id)}
                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                                    title="حذف أمر صيانة"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Standalone Maintenance Order Modal */}
      <AnimatePresence>
        {showMaintModal && (
          <div dir="rtl" className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto text-right font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden"
            >
              {/* Sidebar Panel */}
              <div className="hidden md:flex md:w-72 bg-slate-950 p-8 flex-col justify-between border-l border-slate-800">
                <div>
                  <div className="h-12 w-12 bg-indigo-950/50 rounded-2xl flex items-center justify-center border border-indigo-900 mb-6">
                    <Wrench className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black mb-2 text-white leading-snug">صياغة أمر صيانة</h3>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                    تسجيل الأعطال المفاجئة وعمليات الصيانة الوقائية الدورية لتحديث كفاءة الأسطول والحفاظ على سير العمل بالموقع.
                  </p>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-800 text-[10px] font-black text-slate-500">
                  <div className="flex items-center gap-2 border-r-2 border-indigo-500 pr-2 text-indigo-400">تفاصيل الطلب والمعدة</div>
                  <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">تقدير التكاليف المالية</div>
                  <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">توصيف العطل والأعمال</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-900">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center flex-row-reverse bg-slate-900 flex-shrink-0">
                  <h3 className="text-base font-black text-white">صياغة أمر صيانة وقائية / طارئة</h3>
                  <button 
                    type="button"
                    onClick={() => setShowMaintModal(false)}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleAddMaintOrder} className="flex-1 overflow-y-auto p-8 bg-slate-950/40 space-y-6">
                  
                  {/* Select Equipment */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">المعدة المعنية</label>
                    <select
                      value={maintEqId}
                      onChange={(e) => setMaintEqId(e.target.value)}
                      className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none"
                    >
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id} className="bg-slate-900 text-white font-bold">{eq.name} ({eq.driver})</option>
                      ))}
                    </select>
                  </div>

                  {/* Operation Type & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">نوع العملية</label>
                      <select
                        value={maintType}
                        onChange={(e) => setMaintType(e.target.value as any)}
                        className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none"
                      >
                        <option value="preventive" className="bg-slate-900 text-white font-bold">صيانة وقائية دورية</option>
                        <option value="emergency" className="bg-slate-900 text-white font-bold">إصلاح طارئ (عطل)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">التاريخ</label>
                      <input
                        type="date"
                        value={maintDate}
                        onChange={(e) => setMaintDate(e.target.value)}
                        className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Cost & Initial Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">التكلفة المتوقعة (ج.م)</label>
                      <input
                        type="number"
                        value={maintCost || ''}
                        onChange={(e) => setMaintCost(Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-black text-white text-center font-mono outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">الحالة الابتدائية</label>
                      <select
                        value={maintStatus}
                        onChange={(e) => setMaintStatus(e.target.value as any)}
                        className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none"
                      >
                        <option value="pending" className="bg-slate-900 text-white font-bold">في الانتظار (جديد)</option>
                        <option value="in_progress" className="bg-slate-900 text-white font-bold">قيد الإصلاح بورشة الموقع</option>
                        <option value="completed" className="bg-slate-900 text-white font-bold">مكتمل ومصرح للتشغيل</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">وصف وتفاصيل أعمال الصيانة</label>
                    <textarea
                      rows={4}
                      value={maintDesc}
                      onChange={(e) => setMaintDesc(e.target.value)}
                      placeholder="مثال: تغيير طقم فلاتر هيدروليك كامل وفلتر الزيت مع فحص دورة التبريد..."
                      className="w-full text-xs p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white outline-none leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Submit and Cancel Buttons */}
                  <div className="flex gap-4 justify-end pt-6 border-t border-slate-800 flex-row-reverse">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Save size={16} />
                      تسجيل وإصدار أمر الصيانة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMaintModal(false)}
                      className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black border border-slate-700 transition-colors cursor-pointer"
                    >
                      تراجع
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EquipmentModals 
        showAddEqModal={showAddEqModal} setShowAddEqModal={setShowAddEqModal} handleAddEqSubmit={handleAddEqSubmit}
        newEqName={newEqName} setNewEqName={setNewEqName} newEqDriver={newEqDriver} setNewEqDriver={setNewEqDriver}
        newEqIsRental={newEqIsRental} setNewEqIsRental={setNewEqIsRental} newEqRate={newEqRate} setNewEqRate={setNewEqRate}
        newEqRateUnit={newEqRateUnit} setNewEqRateUnit={setNewEqRateUnit} newEqCarryover={newEqCarryover} setNewEqCarryover={setNewEqCarryover}
        newEqFuel={newEqFuel} setNewEqFuel={setNewEqFuel} newEqSpent={newEqSpent} setNewEqSpent={setNewEqSpent}
        newEqDiscount={newEqDiscount} setNewEqDiscount={setNewEqDiscount} newEqDailyHours={newEqDailyHours} setNewEqDailyHours={setNewEqDailyHours}
        editingEqId={editingEqId} setEditingEqId={setEditingEqId} editEqForm={editEqForm} setEditEqForm={setEditEqForm} handleSaveEqEdit={handleSaveEqEdit}
      />

      {renderConfirmDialog()}
    </div>
  );
}
