/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Settings2, 
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
  CheckCircle
} from 'lucide-react';
import { OperationalLog, EquipmentSummary, Transaction, FuelLogRecord } from '../types';

interface EquipmentDashboardProps {
  equipmentList: EquipmentSummary[];
  setEquipmentList: React.Dispatch<React.SetStateAction<EquipmentSummary[]>>;
  transactions: Transaction[];
  fuelLogs: FuelLogRecord[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLogRecord[]>>;
  custodyBudget: number;
  setCustodyBudget: React.Dispatch<React.SetStateAction<number>>;
}

export default function EquipmentDashboard({ 
  equipmentList, 
  setEquipmentList, 
  transactions,
  fuelLogs,
  setFuelLogs,
  custodyBudget,
  setCustodyBudget
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

  // Custom confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
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
        day: dayName,
        date: txDate,
        fromTime: '8:00 ص',
        toTime: '4:00 م',
        duration: duration,
        cost: 0,
        siteExpense: siteExpense,
        spent: spent,
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
  const [newLogDate, setNewLogDate] = useState<string>('2026-02-16');
  const [newLogFrom, setNewLogFrom] = useState<string>('8:00 ص');
  const [newLogTo, setNewLogTo] = useState<string>('4:00 م');
  const [newLogDuration, setNewLogDuration] = useState<string>('8');
  const [newLogDiscount, setNewLogDiscount] = useState<number>(0);
  const [newLogDeductedHours, setNewLogDeductedHours] = useState<number>(0);
  const [newLogFuelLiters, setNewLogFuelLiters] = useState<number>(0);
  const [newLogFuelCost, setNewLogFuelCost] = useState<number>(0);
  const [newLogNotes, setNewLogNotes] = useState<string>('');

  useEffect(() => {
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      // Normalizing Arabic input for AM/PM
      const normalized = timeStr.replace('ص', 'AM').replace('م', 'PM');
      const match = normalized.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) {
        // Fallback for just numbers
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
      message: `تحذير تعديل معدة: هل أنت متأكد تماماً من رغبتك في تعديل وتحديث بيانات المعدة "${editEqForm.name}"؟ سيقوم النظام بإعادة احتساب التقارير المرتبطة فوراً!`,
      onConfirm: () => {
        const updatedEq = { ...editEqForm } as EquipmentSummary;
        setEquipmentList(prev => prev.map(eq => {
          if (eq.id === editEqForm.id) {
            return updatedEq;
          }
          return eq;
        }));
        setEditingEqId(null);
        setEditEqForm({});
      }
    });
  };

  const handleDeleteEq = (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف معدة وسركيها ميدانياً',
      message: `تحذير قاطع وحذف نهائي: هل أنت متأكد تماماً وبشكل لا يمكن الرجوع عنه من حذف المعدة "${name}" بالكامل من أسطول المشروع مع كامل سجلات السركي وتفاصيل اللوغز؟`,
      onConfirm: () => {
        const remainingList = equipmentList.filter(eq => eq.id !== id);
        setEquipmentList(remainingList);
        if (selectedEqId === id) {
          setSelectedEqId(remainingList[0]?.id || '');
        }
        setEditingEqId(null);
        setEditEqForm({});
      }
    });
  };

  const handleAddEqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim()) return;

    setConfirmState({
      isOpen: true,
      title: 'إدراج معدة جديدة بالأسطول',
      message: `تأكيد إضافة معدة: هل أنت متأكد من تسجيل المعدة "${newEqName.trim()}" الجديدة وإضافتها لجدول الأداء الميداني؟`,
      onConfirm: () => {
        const newId = `eq-${Date.now()}`;
        const newEqData: EquipmentSummary = {
          id: newId,
          name: newEqName.trim(),
          driver: newEqDriver.trim() || 'لا يوجد سائق ومعين',
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
        setSelectedEqId(newId);

        // Reset
        setShowAddEqModal(false);
        setNewEqName('');
        setNewEqDriver('');
        setNewEqIsRental(true);
        setNewEqRate(0);
        setNewEqRateUnit('ساعة');
        setNewEqDailyHours(8);
        setNewEqCarryover(0);
        setNewEqFuel(0);
        setNewEqSpent(0);
        setNewEqDiscount(0);
      }
    });
  };

  const handleStartEditLog = (idx: number, log: OperationalLog) => {
    setEditingLogIdx(idx);
    setEditLogForm({ ...log });
  };

  const handleSaveLogIndex = (idx: number) => {
    if (!activeEquipment) return;
    setConfirmState({
      isOpen: true,
      title: 'تعديل يومية السركي الميدانية',
      message: 'تحذير تعديل يومية: هل أنت متأكد من حفظ التعديلات في السركي لهذا اليوم؟ سيتم ترحيل ساعات العمل وقيمة المصروفات الجديدة فوراً.',
      onConfirm: () => {
        const updatedLogs = [...activeEquipment.logs];
        const rawDuration = editLogForm.duration;
        const finalDuration = rawDuration !== undefined && !isNaN(parseFloat(String(rawDuration))) 
          ? parseFloat(String(rawDuration)) 
          : rawDuration;

        updatedLogs[idx] = {
          ...updatedLogs[idx],
          ...editLogForm,
          duration: finalDuration
        } as OperationalLog;

        // Local state
        setEquipmentList(prev => prev.map(eq => {
          if (eq.id === activeEquipment.id) {
            return {
              ...eq,
              logs: updatedLogs
            };
          }
          return eq;
        }));
        setEditingLogIdx(null);
        setEditLogForm({});
      }
    });
  };

  // Retrieve current active equipment
  const activeEquipment = equipmentList.find(e => e.id === selectedEqId) || equipmentList[0];

  if (!activeEquipment) {
    return (
      <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <p className="text-slate-400 font-bold">يرجى إضافة معدة أولاً لعرض سرك التشغيل.</p>
        <button 
          onClick={() => setShowAddEqModal(true)}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow active:scale-95 cursor-pointer"
        >
          + إضافة معدة جديدة
        </button>

        {/* Render modals inside the early return block so they can function when no equipment is active */}
        <AnimatePresence>
          {showAddEqModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-right"
              >
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between flex-row-reverse border-b border-slate-800">
                  <h3 className="font-extrabold text-sm">تسجيل معدة جديدة بالبرنامج</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddEqModal(false)}
                    className="text-slate-400 hover:text-white transition font-sans text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddEqSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم المعدة / الكود التعريفي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: لودر كاترپيلار 966"
                      value={newEqName}
                      onChange={(e) => setNewEqName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">السائق المعين</label>
                    <input
                      type="text"
                      placeholder="مثال: محمود أبو علي"
                      value={newEqDriver}
                      onChange={(e) => setNewEqDriver(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">نوع الملكية والتبعية</label>
                    <select
                      value={newEqIsRental ? 'rental' : 'company'}
                      onChange={(e) => setNewEqIsRental(e.target.value === 'rental')}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                    >
                      <option value="rental">معدات الإيجار الميدانية ومقاولي التجهيز</option>
                      <option value="company">معدات الشركة (تمتلكها المؤسسة)</option>
                    </select>
                  </div>

                  {newEqIsRental && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">فئة السعر (ج.م) *</label>
                        <input
                          type="number"
                          required
                          placeholder="فئة السعر"
                          value={newEqRate || ''}
                          onChange={(e) => setNewEqRate(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">وحدة الحساب *</label>
                        <select
                          value={newEqRateUnit}
                          onChange={(e) => setNewEqRateUnit(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold"
                        >
                          <option value="ساعة">ساعة</option>
                          <option value="يومية">يومية</option>
                          <option value="أسبوع">أسبوع</option>
                          <option value="شهر">شهر</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-indigo-700 mb-1 text-right">ساعات سابقة متراكمة</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newEqCarryover || ''}
                        onChange={(e) => setNewEqCarryover(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-indigo-700 mb-1 text-right">عدد ساعات اليومية</label>
                      <input
                        type="number"
                        placeholder="8"
                        value={newEqDailyHours || ''}
                        onChange={(e) => setNewEqDailyHours(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 bg-indigo-50/30 border border-indigo-200 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">خصم يدوي مسبق</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newEqDiscount || ''}
                        onChange={(e) => setNewEqDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">رصيد محروقات ابتدائي</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newEqFuel || ''}
                        onChange={(e) => setNewEqFuel(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">منصرف / سلفة يدوية (ج.م)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newEqSpent || ''}
                        onChange={(e) => setNewEqSpent(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-rose-200 rounded-xl focus:border-rose-500 font-bold font-mono text-center text-rose-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 flex-row-reverse">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow transition cursor-pointer"
                    >
                      إضافة هامة وتخزين البند
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEqModal(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      إلغاء الرجوع
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmState && confirmState.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm no-print">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
                  <span className="text-amber-600 font-extrabold flex items-center gap-1.5 text-sm">
                    ⚠️ {confirmState.title}
                  </span>
                  <button 
                    onClick={() => setConfirmState(null)} 
                    className="text-slate-400 hover:text-slate-600 transition text-lg cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
                <p className="text-slate-700 text-[11px] font-semibold leading-relaxed">
                  {confirmState.message}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await confirmState.onConfirm();
                      } catch (err) {
                        console.error("Modal confirmation error:", err);
                      } finally {
                        setConfirmState(null);
                      }
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer"
                  >
                    {confirmState.confirmLabel || 'تأكيد الحفظ والاستمرار'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmState(null)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
                  >
                    {confirmState.cancelLabel || 'إلغاء وتراجع'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Calculations for logs
  const calculateLogsHours = (logs: OperationalLog[] | undefined) => {
    if (!logs) return 0;
    return logs.reduce((sum, log) => {
      const dur = parseFloat(String(log.duration));
      return isNaN(dur) ? sum : sum + dur;
    }, 0);
  };

  const getDurationSuffix = (label: string) => {
    if (label === "ساعة") return "ساعة";
    return "يوم";
  };

  const getDaysInMonthForEq = (eq: EquipmentSummary): number => {
    try {
      const firstLog = eq.logs?.find(l => l.date);
      const dateStr = firstLog ? firstLog.date : new Date().toISOString().split('T')[0];
      const parts = dateStr.split(/[-/]/);
      const year = parseInt(parts[0]) || 2026;
      const month = parseInt(parts[1]) || 6;
      return new Date(year, month, 0).getDate();
    } catch (e) {
      return 30; // standard default
    }
  };

  const getEquipmentDailyRate = (eq: EquipmentSummary): number => {
    const label = eq.durationLabel;
    if (label === "يومية") {
      return eq.rate;
    }
    if (label === "أسبوع" || label === "أسبوعية") {
      return eq.rate / 6;
    }
    if (label === "شهر" || label === "شهرية") {
      return eq.rate / getDaysInMonthForEq(eq);
    }
    return eq.rate;
  };

  const getEquipmentTotalDuration = (eq: EquipmentSummary) => {
    const fromLogs = calculateLogsHours(eq.logs);
    const totalHours = eq.carryoverHours + fromLogs;

    if (eq.durationLabel === "ساعة") {
      return totalHours;
    }

    // For daily, weekly, or monthly, daily duration = totalHours / 8
    return totalHours / 8;
  };

  const getEquipmentCost = (eq: EquipmentSummary) => {
    if (!eq.isRental) return 0;
    
    const fromLogs = calculateLogsHours(eq.logs);
    const totalHours = eq.carryoverHours + fromLogs;

    if (eq.durationLabel === "ساعة") {
      return Math.round(totalHours * eq.rate);
    }

    const totalDays = totalHours / 8;
    const dailyRate = getEquipmentDailyRate(eq);
    return Math.round(totalDays * dailyRate);
  };

  const getLogCost = (eq: EquipmentSummary, duration: number) => {
    if (!eq.isRental || !eq.rate) return 0;
    if (eq.durationLabel === "ساعة") {
      return Math.round(duration * eq.rate);
    }
    const days = duration / 8;
    const dailyRate = getEquipmentDailyRate(eq);
    return Math.round(days * dailyRate);
  };

  const getEquipmentDiscount = (eq: EquipmentSummary) => {
    if (eq.discountOverride !== undefined && eq.discountOverride > 0) {
      return eq.discountOverride;
    }
    // Otherwise sum detailed logs spent amount if any
    const fromLogs = eq.logs.reduce((sum, log) => sum + (log.discount || 0), 0);
    return fromLogs;
  };

  const getEquipmentSpent = (item: EquipmentSummary) => {
    const linkedSum = transactions
      .filter(t => t.equipmentId === item.id && t.type === 'spent')
      .reduce((sum, t) => sum + t.amount, 0);
    return (item.advance || 0) + (item.spentOverride || 0) + linkedSum;
  };

  const getEquipmentRemaining = (item: EquipmentSummary) => {
    const totalCost = getEquipmentCost(item);
    const discount = getEquipmentDiscount(item);
    const spent = getEquipmentSpent(item);
    return totalCost - (discount + spent);
  };

  // Totals for summary table
  const totalFuelFromLogs = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalFuel = equipmentList.reduce((sum, e) => {
    const eqFuel = fuelLogs.filter(log => log.equipmentName === e.name).reduce((s, l) => s + l.cost, 0);
    return sum + eqFuel;
  }, 0);
  const totalRentedCost = equipmentList.filter(e => e.isRental).reduce((sum, e) => sum + getEquipmentCost(e), 0);
  const totalRentedDiscount = equipmentList.reduce((sum, e) => sum + getEquipmentDiscount(e), 0);
  const totalRentedSpent = equipmentList.reduce((sum, e) => sum + getEquipmentSpent(e), 0);
  const totalRentedRemaining = equipmentList.filter(e => e.isRental).reduce((sum, e) => sum + getEquipmentRemaining(e), 0);
  
  // Total general cost = total rented cost + total fuel
  const totalGeneralEquipmentCost = totalRentedCost + totalFuel;

  // Handler to add a raw log row for active Equipment

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEquipment) return;

    const isDurationNumber = !isNaN(parseFloat(newLogDuration));
    const finalDuration = isDurationNumber ? parseFloat(newLogDuration) : newLogDuration;

    const newRow: OperationalLog = {
      day: newLogDay,
      date: newLogDate,
      fromTime: newLogFrom,
      toTime: newLogTo,
      duration: finalDuration,
      cost: 0,
      siteExpense: 0,
      fuelLiters: 0,
      fuelCost: 0,
      discount: newLogDiscount,
      deductedHours: newLogDeductedHours,
      notes: newLogNotes
    };

    // Check for duplicate date
    const existingLogIdx = activeEquipment.logs.findIndex(log => log.date === newLogDate);

    if (existingLogIdx !== -1) {
      setConfirmState({
        isOpen: true,
        title: 'تكرار تاريخ في السركي',
        message: `يوجد بالفعل سجل ليوم ${newLogDay} الموافق ${newLogDate}. هل تريد تحديثه بالبيانات الجديدة (استبدال) أم الإبقاء على القديم؟`,
        confirmLabel: 'تحديث واستبدال',
        cancelLabel: 'إلغاء (إبقاء القديم)',
        onConfirm: () => {
          const updatedLogs = [...activeEquipment.logs];
          updatedLogs[existingLogIdx] = newRow;

          setEquipmentList(prev => prev.map(eq => {
            if (eq.id === activeEquipment.id) {
              return { ...eq, logs: updatedLogs };
            }
            return eq;
          }));
          setNewLogNotes('');
          setNewLogDiscount(0);
          setNewLogDeductedHours(0);
        }
      });
      return;
    }

    const updatedLogs = [...activeEquipment.logs, newRow];

    // Update local state
    setEquipmentList(prev => prev.map(eq => {
      if (eq.id === activeEquipment.id) {
        return {
          ...eq,
          logs: updatedLogs
        };
      }
      return eq;
    }));

    // Reset inputs
    setNewLogNotes('');
    setNewLogDiscount(0);
    setNewLogDeductedHours(0);
  };

  const handleDeleteLogIndex = (idx: number) => {
    if (!activeEquipment) return;
    
    setConfirmState({
      isOpen: true,
      title: 'حذف يوم عمل من سركي المعدة',
      message: 'تحذير : هل أنت متأكد من رغبتك في حذف هذا اليوم من السركي؟ سنقوم بطرح ساعاته وحذف منصرفاته فوراً.',
      onConfirm: () => {
        const logToDelete = activeEquipment.logs[idx];
        const updatedLogs = [...activeEquipment.logs];
        updatedLogs.splice(idx, 1);
        
        // Update local state
        setEquipmentList(prev => prev.map(eq => {
          if (eq.id === activeEquipment.id) {
            return {
              ...eq,
              logs: updatedLogs
            };
          }
          return eq;
        }));
      }
    });
  };

  // Editable summary variables handlers
  const handleUpdateSummaryField = (id: string, field: keyof EquipmentSummary, val: any) => {
    setEquipmentList(prev => prev.map(eq => {
      if (eq.id === id) {
        return { ...eq, [field]: val };
      }
      return eq;
    }));
  };

  const handleResetToDefault = () => {
    setConfirmState({
      isOpen: true,
      title: 'إعادة ضبط بيانات ومعدات المشروع',
      message: 'هل أنت متأكد من إعادة ضبط البيانات لجميع المعدات وحتف التعديلات الحالية لتطابق صور التقارير الأصلية للمشروع؟',
      onConfirm: () => {
        setEquipmentList([]);
        setSelectedEqId(null);
      }
    });
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn text-right text-slate-800 font-sans leading-relaxed">
      
      {/* 1. Header Banner & Utility Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-end sm:justify-start">
            <span className="p-1 px-2.5 bg-indigo-500 text-[10px] font-black rounded-md tracking-wider">سركي الحركة واليومية الذكي</span>
            <span className="p-1 px-2.5 bg-emerald-500 text-[10px] font-black rounded-md tracking-wider">تزامن حي ومباشر</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-1">كشف حركة وتشغيل المعدات</h2>
          <p className="text-slate-400 text-xs">مراجعة وإعداد السركي المالي اليومي وتنسيق حسابات المقاولين والوقود المنصرف</p>
        </div>
        <div className="flex flex-wrap gap-2 self-end sm:self-center">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            ضبط اليوميات لنمط المحاكاة
          </button>
          <button
            onClick={printReport}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            طباعة الكشف
          </button>
          <button
            onClick={() => setShowAiIngest(!showAiIngest)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-755 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>تسجيل بالذكاء الاصطناعي ✨</span>
          </button>
        </div>
      </div>

      {/* AI SMART INGESTION AND SCANNER ASSISTANT FOR MACHINERY DAILY LOGS */}
      <AnimatePresence>
        {showAiIngest && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-4 no-print bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 font-sans text-right"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="text-amber-400" size={20} />
              <div>
                <h4 className="font-extrabold text-sm text-slate-100"> تحليل وإدراج سركيات التشغيل ودفاتر الآليات</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">حلل وأدرج يوميات أو مصروفات الآلات للمعدة المحددة حالياً: ({activeEquipment.name} - السائق: {activeEquipment.driver})</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">البيان الميداني أو خط الزمالة المنسوخ:</label>
                <textarea
                  rows={4}
                  placeholder="مثال: سركي يوم الثلاثاء موافق 2026-01-06 من 8:00 ص إلى 4:00 م عمل 8 ساعات، مصروف 50 جنيهاً، ملاحظة: يوم النقل والتسوية"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-semibold text-right text-slate-100 placeholder-slate-750 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Upload Screen */}
              <div className="flex flex-col justify-between space-y-2">
                <label className="block text-xs font-bold text-slate-300">صورة أو لقطة جدول سركي الحركة الورقي:</label>
                <div 
                  className="flex-1 border-2 border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-950/40 hover:bg-slate-950/85 transition cursor-pointer relative"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAiImageBase64((reader.result as string).split(',')[1]);
                          setAiImageMime(file.type);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {aiImageBase64 ? (
                    <div className="text-center">
                      <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                        تم تحميل الكشف الورقي بنجاح ✓
                      </span>
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5">انقر للاستبدال كلياً</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 text-slate-500">
                      <span className="block text-xs font-bold text-slate-400">اسحب صورة السركي الميداني أو انقر للتصفح</span>
                      <span className="block text-[9px] text-slate-600">JPEG, PNG حتى 10 ميجا</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl text-right">
                {aiError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={async () => {
                  if (!aiText && !aiImageBase64) {
                    setAiError('يرجى كتابة نص السركي أو إرفاق الكشف لليوميات أولاً.');
                    return;
                  }
                  setIsAiAnalyzing(true);
                  setAiError('');
                  try {
                    const res = await fetch('/api/gemini/analyze-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        textContent: aiText,
                        fileBase64: aiImageBase64,
                        mimeType: aiImageMime
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'فشل فحص وتفسير السركي');
                    if (data.transactions && data.transactions.length > 0) {
                      const mapped = mapTransactionsToSarkiLogs(data.transactions);
                      setAiResultRecords(mapped);
                    } else {
                      throw new Error('لم يكتشف كاشف سركيات الآليات أي حركات يومية معتمدة.');
                    }
                  } catch (err: any) {
                    setAiError(err.message || 'حدث خطأ متوقع أثناء تفصيل ومطابقة بيانات السركي.');
                  } finally {
                    setIsAiAnalyzing(false);
                  }
                }}
                disabled={isAiAnalyzing}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-xs text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {isAiAnalyzing ? 'جاري قراءة السركي وتفسيره في الدفاتر... ⚙' : 'تحليل وتدقيق السركي بالذكاء الاصطناعي ✨'}
              </button>

              {aiResultRecords.length > 0 && (
                <button
                  onClick={() => {
                    setAiResultRecords([]);
                    setAiText('');
                    setAiImageBase64(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  إفراغ الشاشة والتصفير
                </button>
              )}
            </div>

            {/* PREVIEW OF EXTRACTED CODES */}
            {aiResultRecords.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-amber-400">سجل اليوميات المكتشف للمعدة النشطة ({activeEquipment.name}):</h5>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-850 text-slate-350 font-bold">
                        <th className="p-3">تاريخ العمل</th>
                        <th className="p-3">اليوم</th>
                        <th className="p-3 text-center">أوقات الورديات المكتشفة</th>
                        <th className="p-3 text-center">عدد الساعات المقدر</th>
                        <th className="p-3">مصروف موقعي (ج.م)</th>
                        <th className="p-3">منصرف مالي (ج.م)</th>
                        <th className="p-3"> المستخلص</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-1000 text-slate-200">
                      {aiResultRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-900/30 text-center">
                          <td className="p-3 text-right font-mono">{rec.date}</td>
                          <td className="p-3 text-right">{rec.day}</td>
                          <td className="p-3 text-center font-mono text-amber-400">{rec.fromTime} - {rec.toTime}</td>
                          <td className="p-3 text-center font-bold text-blue-400 font-mono">{rec.duration} ساعة</td>
                          <td className="p-3 font-mono">{(rec.siteExpense).toLocaleString('ar-EG')} ج.م</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{(rec.discount).toLocaleString('ar-EG')} ج.م</td>
                          <td className="p-3 text-right text-slate-400 truncate max-w-[200px]" title={rec.notes}>{rec.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!activeEquipment) return;
                      
                      const newLogsEntries = aiResultRecords.map(r => ({
                        ...r,
                        cost: typeof r.duration === 'number' ? r.duration * activeEquipment.rate : 0
                      }));
                      
                      const updatedLogs = [...newLogsEntries, ...activeEquipment.logs];
                      
                      setEquipmentList(prev => prev.map(eq => {
                        if (eq.id === activeEquipment.id) {
                          return {
                            ...eq,
                            logs: updatedLogs
                          };
                        }
                        return eq;
                      }));

                      alert(`تم بنجاح حصر وقيد عدد (${aiResultRecords.length}) يوميات سركي للمعدة (${activeEquipment.name}) وتغذية اليوميات والموازين الحية!`);
                      setAiResultRecords([]);
                      setShowAiIngest(false);
                      setAiText('');
                      setAiImageBase64(null);
                    }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-97"
                  >
                    <CheckCircle size={15} />
                    قيد وتثبيت كشف اليوميات بسركي التشغيل المفصل للآلية ✓
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SUMMARY REPORT TABLE (MATCHING IMAGE 2) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 overflow-hidden space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-row-reverse">
          <div className="text-right">
            <h3 className="font-extrabold text-slate-900 text-base">تقرير أداء وحسابات وتكاليف المعدات الإجمالي (جدول المعدات)</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">اضغط على أي معدة لتفريغ سركي تشغيلها المفصل وعرض اليوميات بدقة بالجدول أدناه.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddEqModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              تسجيل معدة جديدة
            </button>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100">
              نشط ومربوط بـ {equipmentList.length} آلات
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-150 shadow-sm bg-white/50 backdrop-blur-md">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-gradient-to-l from-slate-100 to-slate-50 border-b border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                <th className="py-3 px-4 text-right select-none font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span>المعدة</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">السائق</th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">اليومية / فئة الساعة</th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">
                  <div className="flex items-center gap-1 justify-center">
                    <Clock size={12} className="text-slate-400" />
                    <span>مدة العمل</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">
                  <div className="flex items-center gap-1 justify-center">
                    <Coins size={12} className="text-indigo-400" />
                    <span>التكلفة</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">إجمالي الخصم</th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">منصرف / سلفة</th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">المتبقي</th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700">
                  <div className="flex items-center gap-1 justify-center">
                    <Droplet size={11} className="text-blue-400 fill-blue-400/20" />
                    <span>المحروقات</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center select-none font-bold text-slate-700 rounded-tl-lg">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-sans">
              
              {/* Category 1: COMPANY EQUIPMENT */}
              <tr className="bg-indigo-50/20 text-indigo-950 font-bold border-y border-indigo-100/40">
                <td colSpan={10} className="py-2.5 px-4 text-right pr-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 text-indigo-700">
                      <Wrench size={11} />
                    </span>
                    <span className="text-xs font-black tracking-wide font-sans">بيانات وحسابات عهد آليات ومعدات المشروع (ملك الشركة)</span>
                  </div>
                </td>
              </tr>
              {equipmentList.filter(e => !e.isRental).map((eq) => {
                const totalDur = getEquipmentTotalDuration(eq);
                const discount = getEquipmentDiscount(eq);
                const spent = getEquipmentSpent(eq);
                const isSelected = selectedEqId === eq.id;
                return (
                  <tr 
                    key={eq.id}
                    onClick={() => setSelectedEqId(eq.id)}
                    className={`hover:bg-slate-50/70 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-50/45 font-semibold border-r-4 border-indigo-600 shadow-sm' 
                        : 'border-b border-slate-100'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-right">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span>{eq.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 text-center font-bold">
                      {eq.driver || <span className="text-slate-300 italic text-[11px]">غير معين</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-center italic">-</td>
                    <td className="py-3.5 px-4 text-slate-900 font-mono font-bold text-center">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-[11px] border border-slate-150 shadow-sm font-mono">
                        {totalDur.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} {getDurationSuffix(eq.durationLabel)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-center italic">-</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800">
                      {discount ? `${discount.toLocaleString('ar-EG')} ج.م` : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/10">
                      {spent ? `${spent.toLocaleString('ar-EG')} ج.م` : <span className="text-slate-350">0</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-center italic">-</td>
                    <td className="py-3.5 px-4 text-slate-900 font-mono font-bold text-center bg-amber-50/10 font-mono">
                      {(() => {
                        const fCost = fuelLogs.filter(l => l.equipmentName === eq.name).reduce((sum, l) => sum + l.cost, 0);
                        return fCost ? `${fCost.toLocaleString('ar-EG')} ج.م` : <span className="text-slate-300">-</span>;
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditEq(eq)}
                          className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition text-[11px]"
                          title="تعديل بيانات المعدة"
                        >
                          ✎ تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEq(eq.id, eq.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                          title="حذف المعدة وسركيها"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Category 2: RENTED EQUIPMENT */}
              <tr className="bg-amber-50/20 text-amber-950 font-bold border-y border-amber-100/40">
                <td colSpan={10} className="py-2.5 px-4 text-right pr-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 text-amber-700">
                      <Coins size={11} />
                    </span>
                    <span className="text-xs font-black tracking-wide font-sans">بيانات وحسابات معدات وآليات ومقاولي الإيجار الخارجي</span>
                  </div>
                </td>
              </tr>
              {equipmentList.filter(e => e.isRental).map((eq) => {
                const totalDur = getEquipmentTotalDuration(eq);
                const cost = getEquipmentCost(eq);
                const discount = getEquipmentDiscount(eq);
                const spent = getEquipmentSpent(eq);
                const remaining = getEquipmentRemaining(eq);
                const isSelected = selectedEqId === eq.id;

                return (
                  <tr 
                    key={eq.id}
                    onClick={() => setSelectedEqId(eq.id)}
                    className={`hover:bg-amber-50/20 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-amber-50/45 font-semibold border-r-4 border-amber-500 shadow-sm' 
                        : 'border-b border-slate-100'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <span>{eq.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 text-center font-bold">
                      {eq.driver || <span className="text-slate-300 italic text-[11px]">غير معين</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-850 font-mono font-bold text-center">
                      {eq.rate ? (
                        <div className="flex flex-col items-center">
                          <span className="bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-extrabold border border-indigo-100/80">
                            {eq.rate.toLocaleString('ar-EG')} ج.م / {eq.durationLabel}
                          </span>
                          {(eq.durationLabel === 'أسبوع' || eq.durationLabel === 'أسبوعية' || eq.durationLabel === 'شهر' || eq.durationLabel === 'شهرية') && (
                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              (اليومية: {Math.round(getEquipmentDailyRate(eq)).toLocaleString('ar-EG')} ج.م)
                            </span>
                          )}
                        </div>
                      ) : <span className="text-slate-300 italic">مجاناً</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-mono font-bold text-center">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-[11px] text-center border border-slate-150 shadow-sm font-mono">
                        {totalDur.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} {getDurationSuffix(eq.durationLabel)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-950 font-mono font-extrabold text-center text-blue-800 font-mono">
                      {cost.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800 font-mono">
                      {discount ? `${discount.toLocaleString('ar-EG')} ج.م` : <span className="text-slate-350">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700 bg-rose-50/20 font-mono">
                      {spent ? `${spent.toLocaleString('ar-EG')} ج.م` : <span className="text-slate-350">0</span>}
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-extrabold text-center bg-slate-50/50 font-mono ${remaining < 0 ? 'text-rose-600' : 'text-emerald-700 font-black'}`}>
                      {remaining.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-slate-950 font-mono font-bold text-center bg-amber-50/10 font-mono">
                      {fuelLogs.filter(l => l.equipmentName === eq.name).reduce((sum, l) => sum + l.cost, 0).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditEq(eq)}
                          className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition text-[11px]"
                          title="تعديل بيانات المعدة"
                        >
                          ✎ تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEq(eq.id, eq.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                          title="حذف المعدة وسركيها"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* STATISTICAL FOOTER / TOTAL SUMMARY (MATCHING IMAGE 2 TOTALS) */}
              <tr className="bg-slate-900 text-white font-extrabold text-[12px] border-t-2 border-slate-950">
                <td colSpan={3} className="py-4 px-4 font-black text-center text-amber-400">
                  الإجمالي العام للموقع
                </td>
                <td className="py-4 px-4 text-center text-indigo-300 font-mono font-bold">
                  {equipmentList.reduce((sum, e) => sum + getEquipmentTotalDuration(e), 0).toLocaleString('ar-EG')} وحدات تشغيل
                </td>
                <td className="py-4 px-4 text-center font-mono text-blue-300 font-bold">
                  {totalRentedCost.toLocaleString('ar-EG')} ج.م
                </td>
                <td className="py-4 px-4 text-center font-mono text-emerald-300 font-bold">
                  {totalRentedDiscount.toLocaleString('ar-EG')} ج.م
                </td>
                <td className="py-4 px-4 text-center font-mono text-rose-300 font-bold">
                  {totalRentedSpent.toLocaleString('ar-EG')} ج.م
                </td>
                <td className="py-4 px-4 text-center font-mono text-emerald-400 font-black">
                  {totalRentedRemaining.toLocaleString('ar-EG')} ج.م
                </td>
                <td className="py-4 px-4 text-center font-mono text-amber-300 font-bold">
                  {totalFuel.toLocaleString('ar-EG')} ج.م
                </td>
                <td className="py-4 px-4 text-center bg-slate-950/80">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BOTTOM METRICS BAR (663,580 & 137,234) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-right">
            <div>
              <span className="block text-[10.5px] text-slate-500 font-black font-sans">
                إجمالي التزامات تشغيل الموقع + المحروقات (ج.م)
              </span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 inline-block">
                {totalGeneralEquipmentCost.toLocaleString('ar-EG')} ج.م
              </span>
              <p className="text-[10px] text-indigo-650 font-bold mt-0.5">
                (إجمالي تكلفة الإيجار {totalRentedCost.toLocaleString('ar-EG')} + محروقات الأسطول {totalFuel.toLocaleString('ar-EG')})
              </p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/20 flex items-center justify-between text-right">
            <div>
              <span className="block text-[10.5px] text-slate-500 font-black font-sans">
                المتبقي والمستحق (ج.م)
              </span>
              <span className="text-xl font-black text-amber-600 font-mono mt-1 inline-block">
                {totalRentedRemaining.toLocaleString('ar-EG')} ج.م
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
               اجمالى التكاليف
              </p>
            </div>
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Coins size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. DETAILED Equipment Operation Log (Sarki) (MATCHING IMAGE 1) */}
      <div className="bg-white rounded-2xl border border-slate-201 shadow-lg p-6 space-y-6">
        
        {/* Dynamic Header imitating Image 1 styling */}
        <div className="p-6 border-b-2 border-slate-900 bg-slate-50 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Logo placeholder */}
            <div className="flex items-center gap-3">
              <div className="border border-slate-300 p-2 bg-white rounded-lg shadow-sm">
                <span className="text-sm font-black text-indigo-900 tracking-wider">BUNYAN</span>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-500 block font-bold">آخر تحديث: الأحد ٢٠٢٦/٠٦/١٤</span>
                <span className="text-xs font-black text-slate-800">مشروعات مدينة برج العرب الجديدة (تجهيز المسار)</span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center sm:text-right">
              <h2 className="text-xl font-black text-rose-800 tracking-tight">سركى تشغيل معدة بالموقع</h2>
              <p className="text-[11px] text-slate-650 font-bold">سجلات وتقرير وساعات الحركة اليومية الحسابية</p>
            </div>
          </div>

          {/* Quick Stats Banner aligned exactly like image 1's top-header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-semibold pt-2 border-t border-slate-200">
            <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm space-y-0.5">
              <span className="block text-[10px] text-slate-400 font-bold">المعدة الحالية</span>
              <span className="text-slate-850 font-black text-sm">{activeEquipment.name}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm space-y-0.5">
              <span className="block text-[10px] text-slate-400 font-bold">سائق المعدة</span>
              <span className="text-slate-850 font-black text-sm">{activeEquipment.driver}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm space-y-0.5">
              <span className="block text-[10px] text-slate-400 font-bold">
                {activeEquipment.durationLabel === 'ساعة' ? 'إجمالي ساعات العمل' : 'إجمالي أيام العمل'}
              </span>
              <span className="text-indigo-650 font-mono font-bold text-sm">
                {getEquipmentTotalDuration(activeEquipment).toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} {getDurationSuffix(activeEquipment.durationLabel)}
              </span>
            </div>
            <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm space-y-0.5 bg-amber-500/5">
              <span className="block text-[10px] text-amber-700 font-bold">تكلفة تشغيل الكود</span>
              <span className="text-slate-850 font-mono font-black text-sm">
                {getEquipmentCost(activeEquipment) > 0 
                  ? `${getEquipmentCost(activeEquipment).toLocaleString('ar-EG')} ج.م` 
                  : 'معدة شركة (لا تتردد)'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Add Entry Form */}
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-3">
          <form onSubmit={handleAddLog} className="space-y-3.5">
            {/* Row 1: Time and Duration Details */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 mr-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={newLogDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setNewLogDate(date);
                    const dayIndex = new Date(date).getDay();
                    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    setNewLogDay(days[dayIndex]);
                  }}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 font-mono font-bold shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 mr-1">اليوم</label>
                <input
                  type="text"
                  readOnly
                  value={newLogDay}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-sans text-center text-slate-500 opacity-80"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 mr-1">بدء العمل</label>
                <input
                  type="text"
                  placeholder="8:00 ص"
                  value={newLogFrom}
                  onChange={(e) => setNewLogFrom(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 font-bold shadow-sm text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 mr-1">نهاية العمل</label>
                <input
                  type="text"
                  placeholder="4:00 م"
                  value={newLogTo}
                  onChange={(e) => setNewLogTo(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 font-bold shadow-sm text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 mr-1 text-rose-600">ساعات التوقف</label>
                <input
                  type="number"
                  placeholder="0"
                  step="0.5"
                  value={newLogDeductedHours || "" }
                  onChange={(e) => setNewLogDeductedHours(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-rose-100 rounded-xl focus:border-rose-500 font-bold font-mono shadow-sm text-center text-rose-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-indigo-600 mb-1 mr-1">مدة التشغيل</label>
                <div className="w-full text-xs p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl font-black font-mono text-center text-indigo-700 shadow-inner">
                  {newLogDuration} س
                </div>
              </div>
            </div>

            {/* Row 2: Financial and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white/50 p-2.5 rounded-xl border border-dashed border-slate-200">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-rose-600 mb-1 mr-1">قيمة الخصم (ج.م)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newLogDiscount || "" }
                  onChange={(e) => setNewLogDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-rose-50/30 border border-rose-100 rounded-xl focus:border-rose-500 font-bold font-mono text-rose-700"
                />
              </div>

              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 mr-1">ملاحظات العمل</label>
                <input
                  type="text"
                  placeholder="اكتب أي تفاصيل هنا..."
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-black text-xs shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  إضافة للسركى
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Daily Logs grid reproducing Image 1 */}
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300">
                <th className="p-2.5 text-center">اليوم</th>
                <th className="p-2.5 text-center">التاريخ</th>
                <th className="p-2.5 text-center">من</th>
                <th className="p-2.5 text-center">إلى</th>
                <th className="p-2.5 text-center">ساعات توقف</th>
                <th className="p-2.5 text-center">مدة التشغيل</th>
                <th className="p-2.5 text-center">لتر سولار</th>
                <th className="p-2.5 text-center">تكلفة سولار</th>
                <th className="p-2.5 text-center">تكلفة التشغيل</th>
                <th className="p-2.5 text-center">مصروف موقع</th>
                <th className="p-2.5 text-center">قيمة الخصم</th>
                <th className="p-2.5 text-right">ملاحظات العمل</th>
                <th className="p-2.5 text-center w-12">تحرير</th>
              </tr>
            </thead>
            <tbody>
              {/* Carryover helper line so calculations have visibility */}
              <tr className="bg-amber-500/5 font-bold border-b border-slate-200 text-slate-700">
                <td className="p-2 text-center font-black" colSpan={4}>سجل الساعات المتراكمة (carryover)</td>
                <td className="p-2 text-center font-mono font-black text-amber-700">
                  <input
                    type="number"
                    value={activeEquipment.carryoverHours}
                    onChange={(e) => handleUpdateSummaryField(activeEquipment.id, 'carryoverHours', parseFloat(e.target.value) || 0)}
                    className="w-20 text-center bg-transparent focus:bg-white focus:border-indigo-500 outline-none font-bold"
                  />
                </td>
                <td className="p-2 text-center">-</td>
                <td className="p-2 text-center">-</td>
                <td className="p-2 text-center">-</td>
                <td className="p-2 text-right">-</td>
                <td className="p-2 text-center">-</td>
              </tr>

              {activeEquipment.logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs italic">
                    لا توجد يوميات تشغيل مفصلة مسجلة في هذا السركي حتى الآن. استخدم منشئ البنود أعلاه لتعبئتها وسينعكس ذلك على الإجمالي فوراً!
                  </td>
                </tr>
              ) : (
                activeEquipment.logs.map((log, idx) => {
                  const isEditing = editingLogIdx === idx;
                  const isFriday = log.day === 'الجمعة' || String(log.notes).includes('جمعة') || log.duration === 'إجازة';
                  const hasStop = log.duration === 'توقف';

                  if (isEditing) {
                    return (
                      <tr key={idx} className="bg-indigo-50/20 border-b border-indigo-200 font-sans">
                        {/* Day */}
                        <td className="p-1 text-center font-sans">
                          <select
                            value={editLogForm.day || ''}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, day: e.target.value }))}
                            className="w-full text-xs p-1 bg-white border border-slate-300 rounded font-bold text-center"
                          >
                            {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((d, i) => (
                              <option key={i} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        {/* Date */}
                        <td className="p-1 text-center">
                          <input
                            type="date"
                            value={editLogForm.date || ''}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full text-xs p-1 bg-white border border-slate-300 rounded font-mono font-bold text-center animate-pulse"
                          />
                        </td>
                        {/* Start Time */}
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            value={editLogForm.fromTime || ''}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, fromTime: e.target.value }))}
                            className="w-full text-xs p-1 bg-white border border-slate-300 rounded text-center font-bold"
                          />
                        </td>
                        {/* Close Time */}
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            value={editLogForm.toTime || ''}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, toTime: e.target.value }))}
                            className="w-full text-xs p-1 bg-white border border-slate-300 rounded text-center font-bold"
                          />
                        </td>
                        {/* Duration (Hours) */}
                        <td className="p-1 text-center font-sans">
                          <input
                            type="number"
                            step="0.5"
                            value={editLogForm.deductedHours || 0}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, deductedHours: parseFloat(e.target.value) || 0 }))}
                            className="w-16 text-xs p-1 bg-white border border-slate-300 rounded text-center font-bold font-mono text-rose-700"
                          />
                        </td>
                        <td className="p-1 text-center font-sans">
                          <input
                            type="text"
                            value={editLogForm.duration || ''}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, duration: e.target.value }))}
                            className="w-16 text-xs p-1 bg-white border border-slate-300 rounded text-center font-bold font-mono"
                          />
                        </td>
                        {/* Fuel Input */}
                        <td className="p-1 text-center font-mono text-blue-600 font-bold bg-blue-50/10">
                          {(() => {
                            const matchingFuelLogs = fuelLogs.filter(
                              fl => fl.equipmentName === activeEquipment.name && fl.date === editLogForm.date
                            );
                            const dailyFuelLiters = matchingFuelLogs.reduce((sum, fl) => sum + fl.quantity, 0);
                            return dailyFuelLiters || 0;
                          })()}
                        </td>
                        <td className="p-1 text-center font-mono text-blue-600 font-bold bg-blue-50/10">
                          {(() => {
                            const matchingFuelLogs = fuelLogs.filter(
                              fl => fl.equipmentName === activeEquipment.name && fl.date === editLogForm.date
                            );
                            const dailyFuelCost = matchingFuelLogs.reduce((sum, fl) => sum + fl.cost, 0);
                            return dailyFuelCost.toLocaleString('ar-EG');
                          })()}
                        </td>
                        {/* Automatic Cost */}
                        <td className="p-2 text-center text-slate-400 font-mono">
                          مدرج تلقائي
                        </td>
                        {/* Site Expense */}
                        <td className="p-2 text-center text-slate-400 font-mono">-</td>
                        {/* Spent Override */}
                        <td className="p-1 text-center">
                          <input
                            type="number"
                            value={editLogForm.discount || 0}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                            className="w-20 text-xs p-1 bg-white border border-slate-300 rounded text-center font-mono font-bold"
                          />
                        </td>
                        {/* Log Note */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={editLogForm.notes || ''}
                            onChange={(e) => setEditLogForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full text-xs p-1 bg-white border border-slate-300 rounded text-right font-bold"
                          />
                        </td>
                        {/* Editing Actions */}
                        <td className="p-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveLogIndex(idx)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black transition cursor-pointer"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingLogIdx(null); setEditLogForm({}); }}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={idx}
                      className={`hover:bg-slate-55 border-b border-slate-200 transition-colors ${
                        isFriday ? 'bg-rose-50/70 text-slate-800' : hasStop ? 'bg-slate-50 text-slate-500' : ''
                      }`}
                    >
                      <td className={`p-2.5 text-center font-extrabold ${isFriday ? 'text-rose-700' : ''}`}>
                        {log.day}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        {log.date ? log.date.replace(/-/g, '/') : '-'}
                      </td>
                      <td className="p-2.5 text-center font-semibold">
                        {log.fromTime || '-'}
                      </td>
                      <td className="p-2.5 text-center font-semibold">
                        {log.toTime || '-'}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-rose-600/70">
                        {log.deductedHours || 0}
                      </td>
                      <td className={`p-2.5 text-center font-mono font-bold ${isFriday ? 'text-rose-600' : 'text-slate-900'}`}>
                        {typeof log.duration === 'number' 
                          ? log.duration.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) 
                          : log.duration || '-'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-blue-600 font-bold bg-blue-50/5">
                        {(() => {
                          const matchingFuelLogs = fuelLogs.filter(
                            fl => fl.equipmentName === activeEquipment.name && fl.date === log.date
                          );
                          return matchingFuelLogs.reduce((sum, fl) => sum + fl.quantity, 0) || 0;
                        })()}
                      </td>
                      <td className="p-2.5 text-center font-mono text-blue-600 font-bold bg-blue-50/5">
                        {(() => {
                          const matchingFuelLogs = fuelLogs.filter(
                            fl => fl.equipmentName === activeEquipment.name && fl.date === log.date
                          );
                          return matchingFuelLogs.reduce((sum, fl) => sum + fl.cost, 0).toLocaleString('ar-EG');
                        })()}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600">
                        {typeof log.duration === 'number' && activeEquipment.isRental
                          ? `${getLogCost(activeEquipment, log.duration).toLocaleString('ar-EG')} ج.م`
                          : '-'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-450">-</td>
                      <td className="p-2.5 text-center font-mono text-emerald-800 font-bold">
                        {log.discount > 0 ? `${log.discount.toLocaleString('ar-EG')} ج.م` : '-'}
                      </td>
                      <td className={`p-2.5 text-right font-medium ${isFriday ? 'text-rose-600 font-bold' : ''}`}>
                        {log.notes || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleStartEditLog(idx, log)}
                            className="p-1 px-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition duration-150 cursor-pointer text-xs"
                            title="تعديل هذا اليوم"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLogIndex(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="حذف هذا اليوم"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Visual Tip */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <div className="text-right text-[11px] text-amber-900 leading-snug">
            <strong>نظام الترحيل التلقائي:</strong> بمجرد كتابة وتعديل يوميات السركي (مثل الساعات، المصروف، أو اليوميات المعينة) فوق، يقوم محرك النظام فوراً بحساب التكلفة المجمعة ومطابقتها وعرض المستحق في جدول التقرير الرئيسي بالأعلى ومنع الخلل في تسويات عهد وقود المعدات والسيارات.
          </div>
        </div>

      </div>

      {/* 4. MODALS FOR ADDING / EDITING EQUIPMENT SUMMARY */}
      <AnimatePresence>
        {/* ADD EQUIPMENT MODAL */}
        {showAddEqModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-right"
            >
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between flex-row-reverse border-b border-slate-800">
                <h3 className="font-extrabold text-sm">تسجيل معدة جديدة بالبرنامج</h3>
                <button
                  type="button"
                  onClick={() => setShowAddEqModal(false)}
                  className="text-slate-400 hover:text-white transition font-sans text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddEqSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم المعدة / الكود التعريفي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: لودر كاترپيلار 966"
                    value={newEqName}
                    onChange={(e) => setNewEqName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">السائق المعين</label>
                  <input
                    type="text"
                    placeholder="مثال: محمود أبو علي"
                    value={newEqDriver}
                    onChange={(e) => setNewEqDriver(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">نوع الملكية والتبعية</label>
                  <select
                    value={newEqIsRental ? 'rental' : 'company'}
                    onChange={(e) => setNewEqIsRental(e.target.value === 'rental')}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                  >
                    <option value="rental">معدات الإيجار الميدانية ومقاولي التجهيز</option>
                    <option value="company">معدات الشركة (تمتلكها المؤسسة)</option>
                  </select>
                </div>

                {newEqIsRental && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">فئة السعر (ج.م) *</label>
                      <input
                        type="number"
                        required
                        placeholder="فئة السعر"
                        value={newEqRate || ''}
                        onChange={(e) => setNewEqRate(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">وحدة الحساب *</label>
                      <select
                        value={newEqRateUnit}
                        onChange={(e) => setNewEqRateUnit(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold"
                      >
                        <option value="ساعة">ساعة</option>
                        <option value="يومية">يومية</option>
                        <option value="أسبوع">أسبوع</option>
                        <option value="شهر">شهر</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-indigo-700 mb-1 text-right">ساعات سابقة متراكمة</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEqCarryover || ''}
                      onChange={(e) => setNewEqCarryover(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-indigo-700 mb-1 text-right">عدد ساعات اليومية</label>
                    <input
                      type="number"
                      placeholder="8"
                      value={newEqDailyHours || ''}
                      onChange={(e) => setNewEqDailyHours(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-indigo-50/30 border border-indigo-200 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">خصم يدوي مسبق</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEqDiscount || ''}
                      onChange={(e) => setNewEqDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">رصيد محروقات ابتدائي</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEqFuel || ''}
                      onChange={(e) => setNewEqFuel(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">منصرف / سلفة يدوية (ج.م)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEqSpent || ''}
                      onChange={(e) => setNewEqSpent(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-rose-200 rounded-xl focus:border-rose-500 font-bold font-mono text-center text-rose-700"
                    />
                  </div>
                </div>


                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 flex-row-reverse">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow transition cursor-pointer"
                  >
                    إضافة هامة وتخزين البند
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEqModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء الرجوع
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT EQUIPMENT SUMMARY MODAL */}
        {editingEqId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-right"
            >
              <div className="bg-indigo-950 text-white p-4 flex items-center justify-between flex-row-reverse border-b border-indigo-900">
                <h3 className="font-extrabold text-sm">تعديل حسابات وبنود ميزانية المعدة</h3>
                <button
                  type="button"
                  onClick={() => { setEditingEqId(null); setEditEqForm({}); }}
                  className="text-slate-300 hover:text-white transition font-sans text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم المعدة / الكود</label>
                  <input
                    type="text"
                    value={editEqForm.name || ''}
                    onChange={(e) => setEditEqForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم السائق</label>
                  <input
                    type="text"
                    value={editEqForm.driver || ''}
                    onChange={(e) => setEditEqForm(prev => ({ ...prev, driver: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">نوع وحساب الملكية</label>
                  <select
                    value={editEqForm.isRental ? 'rental' : 'company'}
                    onChange={(e) => setEditEqForm(prev => ({ ...prev, isRental: e.target.value === 'rental' }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold text-right"
                  >
                    <option value="rental">معدات الإيجار الميدانية ومقاولي التجهيز</option>
                    <option value="company">معدات الشركة (تمتلكها المؤسسة)</option>
                  </select>
                </div>

                {editEqForm.isRental && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">فئة السعر (ج.م)</label>
                      <input
                        type="number"
                        value={editEqForm.rate || 0}
                        onChange={(e) => setEditEqForm(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">وحدة الحساب</label>
                      <select
                        value={editEqForm.durationLabel || 'ساعة'}
                        onChange={(e) => setEditEqForm(prev => ({ ...prev, durationLabel: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold"
                      >
                        <option value="ساعة">ساعة</option>
                        <option value="يومية">يومية</option>
                        <option value="أسبوع">أسبوع</option>
                        <option value="شهر">شهر</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">ساعات سابقة متراكمة</label>
                    <input
                      type="number"
                      value={editEqForm.carryoverHours || 0}
                      onChange={(e) => setEditEqForm(prev => ({ ...prev, carryoverHours: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-indigo-700 mb-1 text-right">عدد ساعات اليومية</label>
                    <input
                      type="number"
                      value={editEqForm.dailyShiftHours || 0}
                      onChange={(e) => setEditEqForm(prev => ({ ...prev, dailyShiftHours: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs p-2.5 bg-indigo-50/30 border border-indigo-200 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">خصم يدوي شامل (ج.م)</label>
                    <input
                      type="number"
                      value={editEqForm.discountOverride || 0}
                      onChange={(e) => setEditEqForm(prev => ({ ...prev, discountOverride: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 font-bold font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 text-right">منصرف / سلفة يدوية (ج.م)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editEqForm.spentOverride || 0}
                      onChange={(e) => setEditEqForm(prev => ({ ...prev, spentOverride: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-rose-200 rounded-xl focus:border-rose-500 font-bold font-mono text-center text-rose-700"
                    />
                  </div>
                </div>


                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleSaveEqEdit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow transition cursor-pointer"
                  >
                    حفظ وتأكيد التغيير المالي
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingEqId(null); setEditEqForm({}); }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء الرجوع
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal (Bypasses sandboxed iframe native dialog blocks) */}
      <AnimatePresence>
        {confirmState && confirmState.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
                <span className="text-amber-600 font-extrabold flex items-center gap-1.5 text-sm">
                  ⚠️ {confirmState.title}
                </span>
                <button 
                  onClick={() => setConfirmState(null)} 
                  className="text-slate-400 hover:text-slate-600 transition text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <p className="text-slate-700 text-[11px] font-semibold leading-relaxed">
                {confirmState.message}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await confirmState.onConfirm();
                    } catch (err) {
                      console.error("Modal confirmation error:", err);
                    } finally {
                      setConfirmState(null);
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer"
                >
                  {confirmState.confirmLabel || 'تأكيد الحفظ والاستمرار'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
                >
                  {confirmState.cancelLabel || 'إلغاء وتراجع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
