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
import { OperationalLog, EquipmentSummary, Transaction, FuelLogRecord } from '../types';
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
  addAuditLog
}: EquipmentDashboardProps) {
  const [selectedEqId, setSelectedEqId] = useState<string>('');

  // Set default selected ID if list exists
  useEffect(() => {
    if (equipmentList.length > 0 && !selectedEqId) {
      setSelectedEqId(equipmentList[0].id);
    }
  }, [equipmentList, selectedEqId]);

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

  return (
    <div className="space-y-12 animate-fadeIn text-right font-sans overflow-hidden pb-12">
      {/* Top Banner */}
      <div className="relative group overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-rose-900/20 mix-blend-overlay"></div>
         <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-3 justify-end md:justify-start">
                  <span className="bg-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-900/40">سركي الحركة الذكي</span>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">تزامن حي (Live)</span>
               </div>
               <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">كشف حركة وتشغيل المعدات</h2>
               <p className="text-slate-400 text-sm font-bold max-w-md">إدارة السركي المالي اليومي وتنسيق حسابات المقاولين والمحروقات بلمسة عصرية</p>
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

      {/* AI Ingest - Placeholder for brevity but keep trigger logic */}
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
                   <p className="text-xs text-slate-400 font-bold">حلل صور السركي الورقي أو النصوص الميدانية لإدراج الحركات تلقائياً</p>
                </div>
             </div>
             <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-700 rounded-[2rem] bg-slate-950/40">
                <span className="text-slate-500 font-black text-sm uppercase italic">قريباً: تكامل Gemini 2.0 Pro للفهم العميق للمستندات</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

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
