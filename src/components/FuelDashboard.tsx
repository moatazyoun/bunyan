/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Fuel, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Layers,
  Sparkles,
  Droplet,
  ArrowUpDown,
  Coins,
  CheckCircle
} from 'lucide-react';
import { 
  FuelLogRecord 
} from '../types';
import { 
  INITIAL_FUEL_LOGS, 
  INITIAL_FUEL_CUSTODY_BUDGET
} from '../data/fuelInitialData';

export default function FuelDashboard({ fuelLogs, setFuelLogs, custodyBudget, setCustodyBudget, equipment, userRole, addAuditLog }: {
  fuelLogs: FuelLogRecord[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLogRecord[]>>;
  custodyBudget: number;
  setCustodyBudget: React.Dispatch<React.SetStateAction<number>>;
  equipment: any[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
}) {
  // --- States ---
  
  // EQUIPMENTS_LIST derived from equipment prop
  const EQUIPMENTS_LIST = equipment.map(e => e.name);

  // New/Edit Form State
  const [formState, setFormState] = useState({
    date: new Date().toISOString().split('T')[0],
    day: 'الأحد',
    equipmentName: EQUIPMENTS_LIST[0] || '',
    quantity: 100,
    cost: 1765,
    notes: ''
  });

  // Sync default equipment name when equipment list loads
  useEffect(() => {
    if (!formState.equipmentName && EQUIPMENTS_LIST.length > 0) {
      setFormState(prev => ({ ...prev, equipmentName: EQUIPMENTS_LIST[0] }));
    }
  }, [EQUIPMENTS_LIST, formState.equipmentName]);

  // --- AI States ---
  const [showAiIngest, setShowAiIngest] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiImageMime, setAiImageMime] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiResultRecords, setAiResultRecords] = useState<any[]>([]);

  // Map parsed transactions to FuelLogRecords
  const mapTransactionsToFuelRecords = (txs: any[]) => {
    return txs.map((tx, idx) => {
      let equipmentName = EQUIPMENTS_LIST[0] || ''; 
      const desc = tx.description || '';
      
      // Try to find a match in the actual equipment list
      for (const eqName of EQUIPMENTS_LIST) {
        if (desc.includes(eqName) || eqName.includes(desc)) {
          equipmentName = eqName;
          break;
        }
      }

      let quantity = 100;
      const qtyMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:لتر|ليتر|ل)/);
      if (qtyMatch) {
        quantity = parseFloat(qtyMatch[1]) || 100;
      } else {
        quantity = tx.amount && tx.amount > 0 ? Math.round(tx.amount / 17.65) : 100;
      }

      const cost = tx.amount || Math.round(quantity * 17.65);

      const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const txDate = tx.date || new Date().toISOString().split('T')[0];
      const d = new Date(txDate);
      const dayName = daysArabic[d.getDay()] || 'الأحد';

      return {
        id: `fuel-ai-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        date: txDate,
        day: dayName,
        equipmentName: equipmentName,
        quantity: quantity,
        cost: cost,
        notes: tx.description || 'تم قيد بون الوقود تلقائياً عبر مستشعر الذكاء الاصطناعي'
      };
    });
  };

  // --- CRUD States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Custom confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // New/Edit Form State

  const DAYS_OF_WEEK = [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  // Auto-fill day based on date picker
  const handleDateChange = (dateVal: string) => {
    const d = new Date(dateVal);
    const dayIndex = d.getDay();
    // In javascript, 0 is Sunday, 1 is Monday...
    const dayNames = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']; 
    // Adjust mapping to correct Arabic days
    const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    setFormState(prev => ({
      ...prev,
      date: dateVal,
      day: daysArabic[dayIndex]
    }));
  };

  // --- Aggregates and Statistics ---
  const totalQuantity = fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
  const totalSpent = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const currentBalance = custodyBudget - totalSpent;

  // Aggregate Fuel Cost by Equipment for the side table (matching OCR)
  const equipmentSummaries = EQUIPMENTS_LIST.map(eqName => {
    const records = fuelLogs.filter(log => log.equipmentName === eqName);
    const cost = records.reduce((sum, r) => sum + r.cost, 0);
    const quantity = records.reduce((sum, r) => sum + r.quantity, 0);
    return { name: eqName, cost, quantity };
  }).sort((a, b) => b.cost - a.cost);

  // --- Handlers ---
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.equipmentName) {
      alert('يرجى تحديد المعدة المستلمة للسولار.');
      return;
    }

    const costNum = Number(formState.cost) || 0;
    const qtyNum = Number(formState.quantity) || 0;

    if (editingLogId) {
      setFuelLogs(prev => prev.map(log => {
        if (log.id === editingLogId) {
          return {
            id: log.id,
            referenceNo: log.referenceNo,
            date: formState.date,
            day: formState.day,
            equipmentName: formState.equipmentName,
            quantity: qtyNum,
            cost: costNum,
            notes: formState.notes
          };
        }
        return log;
      }));
      addAuditLog('تعديل بون وقود', 'حركة المحروقات', `تم تعديل بون وقود مرجع: ${editingLogId}`);
      setEditingLogId(null);
    } else {
      const refNo = `FUEL-${Date.now().toString().slice(-6)}`;
      const newRecord: FuelLogRecord = {
        id: `fuel-${Date.now()}`,
        referenceNo: refNo,
        date: formState.date,
        day: formState.day,
        equipmentName: formState.equipmentName,
        quantity: qtyNum,
        cost: costNum,
        notes: formState.notes
      };
      setFuelLogs(prev => [newRecord, ...prev]);
      addAuditLog('إضافة بون وقود', 'حركة المحروقات', `تم تسجيل بون وقود جديد رقم: ${refNo} للمعدة: ${formState.equipmentName} بكمية: ${qtyNum} لتر.`);
    }

    setShowAddModal(false);
    // Reset Form
    setFormState({
      date: new Date().toISOString().split('T')[0],
      day: 'الأحد',
      equipmentName: EQUIPMENTS_LIST[0] || '',
      quantity: 100,
      cost: 1765,
      notes: ''
    });
  };

  const startEditLog = (log: FuelLogRecord) => {
    setEditingLogId(log.id);
    setFormState({
      date: log.date,
      day: log.day,
      equipmentName: log.equipmentName,
      quantity: log.quantity,
      cost: log.cost,
      notes: log.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteLog = (id: string, cost: number, eqName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف بون وقود / قيد سولار',
      message: 'يحذر النظام المالي: هل أنت متأكد تماماً من رغبتك في حذف هذا القيد؟',
      onConfirm: () => {
        setFuelLogs(prev => prev.filter(log => log.id !== id));
      }
    });
  };

  const handleResetData = () => {
    setConfirmState({
      isOpen: true,
      title: 'إعادة ضبط كشف المحروقات والسولار',
      message: 'هل ترغب حقاً في تصفير التعديلات وإرجاع كشف السولار إلى القيم الأصلية؟',
      onConfirm: () => {
        setFuelLogs(INITIAL_FUEL_LOGS);
        setCustodyBudget(INITIAL_FUEL_CUSTODY_BUDGET);
      }
    });
  };

  // --- Filtering & Sorting ---
  const filteredLogs = fuelLogs.filter(log => {
    const matchesSearch = 
      log.equipmentName.includes(searchTerm) || 
      (log.notes && log.notes.includes(searchTerm)) ||
      log.date.includes(searchTerm) ||
      log.day.includes(searchTerm);
    
    const matchesFilter = selectedEquipmentFilter === 'all' || log.equipmentName === selectedEquipmentFilter;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'date') {
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * factor;
    }
    if (sortBy === 'cost') {
      return (a.cost - b.cost) * factor;
    }
    if (sortBy === 'quantity') {
      return (a.quantity - b.quantity) * factor;
    }
    return 0;
  });

  const toggleSort = (field: 'date' | 'cost' | 'quantity') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // --- Charts colors ---
  const CHART_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
  ];

  return (
    <div className="space-y-6 text-right font-sans p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100" id="fuel-dashboard-container">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="text-right w-full lg:w-auto">
          <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-full">
            إدارة الطاقة والمحروقات والمتابعة اللوجستية
          </span>
          <h3 className="text-xl font-black mt-2 flex items-center gap-2 justify-start">
            <Fuel className="text-indigo-500" size={24} />
            بيان ومستندات صرف المحروقات (سولار وبنزين)
          </h3>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-1.5 max-w-2xl">
            سجل حركة الوقود للمصالح والآلات تشغيلياً بمدينة برج العرب الجديدة، متكاملاً بالكامل مع سركيات تشغيل المعدات الثقيلة ودفاتر التحرك العام للسيارات وسندات الصرف المالي.
          </p>
        </div>

        {/* Action button bar */}
        <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية إعادة تعيين البيانات') : handleResetData}
            disabled={userRole === 'viewer'}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition border flex items-center gap-1.5 ${
              userRole === 'viewer'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 cursor-pointer'
            }`}
            title="إعادة ضبط الحسابات إلى قيم الـ PDF الموجه"
          >
            إعادة للقيم الأصلية ↺
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50 text-xs font-black rounded-xl transition border border-indigo-800/40 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} /> طباعة كشف المحروقات
          </button>
          <button
            onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية استخدام المسح الذكي') : () => setShowAiIngest(!showAiIngest)}
            disabled={userRole === 'viewer'}
            className={`px-3.5 py-2 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition border active:scale-95 ${
              userRole === 'viewer'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                : 'bg-slate-800 hover:bg-slate-750 text-amber-400 cursor-pointer border-slate-700'
            }`}
          >
            <Sparkles size={14} className={userRole === 'viewer' ? 'text-slate-500' : 'text-amber-400 animate-pulse'} />
            <span>تسجيل وقيد بالذكاء الاصطناعي ✨</span>
          </button>
          <button
            onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تسجيل بونات جديدة') : () => {
              setEditingLogId(null);
              setFormState({
                date: new Date().toISOString().split('T')[0],
                day: 'الأحد',
                equipmentName: EQUIPMENTS_LIST[0] || '',
                quantity: 100,
                cost: 1765,
                notes: ''
              });
              setShowAddModal(true);
            }}
            disabled={userRole === 'viewer'}
            className={`px-4 py-2 text-xs font-black rounded-xl transition shadow-lg flex items-center gap-1.5 ${
              userRole === 'viewer'
                ? 'bg-indigo-300 text-indigo-50 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
            }`}
          >
            <Plus size={16} /> تسجيل بون وقود جديد
          </button>
        </div>
      </div>

      {/* AI SMART INGESTION AND SCANNER ASSISTANT FOR FUEL */}
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
                <h4 className="font-extrabold text-sm text-slate-100">مستشار صرف وقود وبونات السولار بالذكاء الاصطناعي</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">ارفع صورة بون تانك الرشاش أو ورقة صرف ميكانيكي، أو انسخ نص الرسالة لإدراكها فوراً وبشكل تلقائي</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">البيان المنسوخ أو الرسالة الميدانية:</label>
                <textarea
                  rows={4}
                  placeholder="مثال: صرف سولار 150 لتر لجريدر عمرو بقيمة 2647.5 جنيهاً من محطة برج العرب بتاريخ اليوم"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-semibold text-right text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Upload Screen */}
              <div className="flex flex-col justify-between space-y-2">
                <label className="block text-xs font-bold text-slate-300">صورة أو لقطة قسيمة الوقود:</label>
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
                        تم تحميل البون البصري بنجاح ✓
                      </span>
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5">انقر للاستبدال بصورة أخرى</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 text-slate-500">
                      <span className="block text-xs font-bold text-slate-400">اسحب صورة قسيمة الوقود أو انقر للتصفح</span>
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
                    setAiError('يرجى كتابة نص أو إرفاق صورة لكشف الوقود أولاً في استمارة الفحص.');
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
                    if (!res.ok) throw new Error(data.error || 'فشل فحص البون وتفسيره');
                    if (data.transactions && data.transactions.length > 0) {
                      const mapped = mapTransactionsToFuelRecords(data.transactions);
                      setAiResultRecords(mapped);
                    } else {
                      throw new Error('لم يكتشف كاشف بونات السولار أي عمليات صرف وقود معتمدة.');
                    }
                  } catch (err: any) {
                    setAiError(err.message || 'حدث خطأ غير متوقع أثناء معالجة بيانات السولار.');
                  } finally {
                    setIsAiAnalyzing(false);
                  }
                }}
                disabled={isAiAnalyzing}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-xs text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {isAiAnalyzing ? 'جاري مطابقة بونات السولار وتكشيفها... ⚙' : 'تحليل حركة الوقود بالذكاء الاصطناعي ✨'}
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
                <h5 className="text-xs font-bold text-amber-400">بونات الوقود الفورية المكتشفة القابلة للتسجيل:</h5>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-850 text-slate-350 font-bold">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">اليوم</th>
                        <th className="p-3">المعدة المكتشفة في الموقع</th>
                        <th className="p-3">الكمية المقدرة (لتر)</th>
                        <th className="p-3">التكلفة (ج.م)</th>
                        <th className="p-3">البيان المستخلص</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-1000 text-slate-200">
                      {aiResultRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-900/30">
                          <td className="p-3 font-mono">{rec.date}</td>
                          <td className="p-3">{rec.day}</td>
                          <td className="p-3">
                            <span className="p-1 px-2.5 bg-amber-500/10 text-amber-400 rounded-md font-bold text-[10px]">
                              {rec.equipmentName}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-400">{rec.quantity} لتر</td>
                          <td className="p-3 font-bold text-emerald-400 font-mono">{(rec.cost).toLocaleString('ar-EG')} ج.م</td>
                          <td className="p-3 text-slate-400 truncate max-w-[200px]" title={rec.notes}>{rec.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية قيد السجلات من المسح الذكي') : () => {
                      setFuelLogs(prev => [...aiResultRecords, ...prev]);
                      alert(`تم بنجاح حصر وقيد عدد (${aiResultRecords.length}) بونات فحص سولار في السركي الميداني!`);
                      setAiResultRecords([]);
                      setShowAiIngest(false);
                      setAiText('');
                      setAiImageBase64(null);
                    }}
                    disabled={userRole === 'viewer'}
                    className={`px-6 py-3 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg active:scale-97 ${
                      userRole === 'viewer'
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                    }`}
                  >
                    <CheckCircle size={15} />
                    قيد وتثبيت كشف بونات السولار بحسابات السركي الميداني ✓
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. إجمالي العهدة المخصصة للوقود */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-slate-400 font-bold text-[10px]">مخصص عهدة المحروقات</span>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                value={custodyBudget}
                disabled={userRole === 'viewer'}
                onChange={(e) => setCustodyBudget(Number(e.target.value) || 0)}
                className={`text-lg font-mono font-black w-28 text-center rounded-lg py-0.5 focus:border-indigo-500 transition-all ${
                  userRole === 'viewer'
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 border-slate-200'
                }`}
                title={userRole === 'viewer' ? 'لا تملك صلاحية تعديل الميزانية' : 'اضغط لتغيير مخصص العهدة'}
              />
              <span className="text-xs text-slate-400 font-bold">ج.م</span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">عهد نقدية مخصصة للديزل</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-150">
            <Coins size={20} />
          </div>
        </div>

        {/* 2. إجمالي المنصرف - المحروقات */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-slate-400 font-bold text-[10px]">إجمالي المنصرف الفعلي</span>
            <p className="text-lg font-mono font-black text-rose-650 mt-1">
              {totalSpent.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
            </p>
            <p className="text-[9px] text-rose-500 font-bold mt-1">مكافئ التكلفة الإجمالية للبونات</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 border border-rose-150">
            <Droplet size={20} />
          </div>
        </div>

        {/* 3. رصيد العهدة (الرصيد المتبقي طرف الإدارة) */}
        <div className={`border p-5 rounded-2xl shadow-sm flex items-center justify-between ${
          currentBalance < 0 ? 'bg-amber-50/10 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="text-right">
            <span className="text-slate-400 font-bold text-[10px]">رصيد عهدة المحروقات</span>
            <p className={`text-lg font-mono font-black mt-1 ${currentBalance < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {currentBalance.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
            </p>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">
              {currentBalance < 0 ? 'تجاوز وسلفيات جارية (-)' : 'الأمانة النقدية المتوفرة'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl border ${
            currentBalance < 0 
              ? 'bg-amber-100/60 border-amber-200 text-amber-700' 
              : 'bg-emerald-50 border-emerald-150 text-emerald-600'
          }`}>
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* 4. إجمالي الكمية المستلمة باللتر */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-slate-400 font-bold text-[10px]">إجمالي السولار المستلم</span>
            <p className="text-lg font-mono font-black text-indigo-950 mt-1">
              {totalQuantity.toLocaleString('ar-EG')} <span className="text-xs">لتر</span>
            </p>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">مسحوبات الآلات الموقعية كلياً</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-slate-600">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* 3. Analysis Charts & Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cost breakdown per machinery (Horizontal Bar chart) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="text-right">
            <h4 className="text-xs font-black text-slate-800">بيان التوزيع المالي للمحروقات على أسطول الآلات</h4>
            <p className="text-[10px] text-slate-400 font-bold">رصد كميات الصرف باللتر وتكلفة التشغيل الفعلي بالجنيه المصري</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={equipmentSummaries}
                layout="vertical"
                margin={{ left: 0, right: 0, top: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 'bold' }} width={90} orientation="right" />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString('ar-EG')} ${name === 'cost' ? 'ج.م' : 'لتر'}`,
                    name === 'cost' ? 'التكلفة الإجمالية' : 'الكمية المستهلكة'
                  ]}
                  contentStyle={{ direction: 'rtl', textAlign: 'right', fontSize: 11 }}
                />
                <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} name="cost" />
                <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} name="quantity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side table: exact match with PDF side panel "إجمالي التكلفة" */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-right pb-3 border-b border-slate-100">
              <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 font-extrabold text-[9px] rounded-full">
                ملخص إجمالي التكاليف الموقعية للمحروقات
              </span>
              <h4 className="text-xs font-black text-slate-800 mt-1.5">مقارنة التكلفة بالحصص المعتمدة</h4>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {equipmentSummaries.map((eq, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                const percentage = totalSpent > 0 ? (eq.cost / totalSpent) * 100 : 0;
                return (
                  <div key={eq.name} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                      <span className="font-extrabold text-slate-750">{eq.name}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="font-black text-slate-900">{eq.cost.toLocaleString('ar-EG')} ج.م</span>
                      <span className="text-[9px] text-slate-400 block tracking-wide">
                        {eq.quantity.toLocaleString('ar-EG')} لتر ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-150 text-[11px] text-slate-500 font-semibold leading-relaxed">
            * يتم موازنة الديزل المستلم من محطة مدينة برج العرب مباشرةً بالتنسيق مع المشرفين الميدانيين لضمان مطابقة العدادات الرقمية.
          </div>
        </div>
      </div>

      {/* 4. Filter and Journal Table section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between">
        
        {/* Filtering Options */}
        <div className="p-5 border-b border-slate-150 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 md:flex-initial">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="البحث بالآلة أو التاريخ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs p-2 pr-9 bg-white border border-slate-200 rounded-xl focus:border-indigo-550 font-bold text-right"
              />
            </div>

            {/* Equipment pick list */}
            <div>
              <select
                value={selectedEquipmentFilter}
                onChange={(e) => setSelectedEquipmentFilter(e.target.value)}
                className="text-xs p-2 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-550"
              >
                <option value="all">جميع المعدات والآلات</option>
                {EQUIPMENTS_LIST.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Records Counter */}
          <div className="text-xs text-slate-500 font-bold">
            جاري عرض <span className="font-black text-indigo-650">{filteredLogs.length}</span> من أصل <span className="font-black text-slate-900">{fuelLogs.length}</span> بون وقود معتمد
          </div>
        </div>

        {/* The data list */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-100 font-extrabold text-xs border-b border-slate-800 text-center">
                <th 
                  className="p-3 text-right pr-6 cursor-pointer hover:bg-slate-800 transition"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center justify-start gap-1">
                    <span>التاريخ</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3">اليوم</th>
                <th className="p-3">المعدة</th>
                <th 
                  className="p-3 cursor-pointer hover:bg-slate-800 transition"
                  onClick={() => toggleSort('quantity')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>الكمية (لتر)</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  className="p-3 cursor-pointer hover:bg-slate-800 transition"
                  onClick={() => toggleSort('cost')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>التكلفة (ج.م)</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="p-3 text-right pr-4">ملاحظات</th>
                <th className="p-3 font-sans rounded-tl-xl text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-150 hover:bg-indigo-50/15 transition text-center text-xs">
                  
                  {/* Date */}
                  <td className="p-3 pr-6 text-right font-semibold text-slate-600 font-mono">
                    <span className="block">{log.date}</span>
                    {log.referenceNo && <span className="block text-[8px] text-indigo-500 font-black">{log.referenceNo}</span>}
                  </td>

                  {/* Day */}
                  <td className="p-3 font-black text-slate-800">
                    {log.day}
                  </td>

                  {/* Machinery */}
                  <td className="p-3 font-black text-slate-900 text-right">
                    <span className="p-1 px-2.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg leading-none">
                      {log.equipmentName}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td className="p-3 font-mono font-black text-slate-750">
                    {log.quantity.toLocaleString('ar-EG')}
                  </td>

                  {/* Cost */}
                  <td className="p-3 font-mono font-black text-indigo-950">
                    {log.cost.toLocaleString('ar-EG')} <span className="text-[9px] text-slate-400">ج.م</span>
                  </td>

                  {/* Notes */}
                  <td className="p-3 text-right text-slate-500 font-medium text-[11px] pr-4 max-w-[200px] truncate" title={log.notes}>
                    {log.notes || '-'}
                  </td>

                  {/* Actions */}
                  <td className="p-3 font-sans">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تعديل السجلات') : () => startEditLog(log)}
                        className={`p-1 px-2.5 rounded transition text-[11px] font-black ${
                          userRole === 'viewer'
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        تعديل
                      </button>
                      <button
                        onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حذف السجلات') : () => handleDeleteLog(log.id, log.cost, log.equipmentName)}
                        className={`p-1.5 transition ${
                          userRole === 'viewer'
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-bold font-sans">
                    لا توجد أي قيود أو بونات وقود مطابقة لبحثك الجاري.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with local page aggregates */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-slate-600 gap-3">
          <p className="text-[10px] text-slate-400">
            * يتم تصفير وتسوية هذا الكشف أسبوعياً مع لجان المراجعة والمستند الاستشاري.
          </p>
          <div className="font-sans flex gap-4 text-slate-800">
            <span>إجمالي الصفحة: <span className="font-mono text-indigo-650">{filteredLogs.reduce((sum, r) => sum + r.quantity, 0).toLocaleString('ar-EG')} لتر</span></span>
            <span className="border-l border-slate-200"></span>
            <span>القيمة الإجمالية: <span className="font-mono text-indigo-650">{filteredLogs.reduce((sum, r) => sum + r.cost, 0).toLocaleString('ar-EG')} ج.م</span></span>
          </div>
        </div>
      </div>

      {/* 5. ADD/EDIT FUEL RECORD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-right font-sans"
            >
              {/* Sidebar */}
              <div className="hidden md:flex md:w-64 bg-slate-50 p-8 flex-col justify-between border-l border-slate-100 text-right">
                <div>
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-150 mb-6">
                    <Fuel className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-black mb-2 text-slate-800 leading-snug">إضافة بون وقود</h3>
                  <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">تسجيل حركة صرف الوقود الجديدة للمعدات ومطابقتها مع المستندات الميدانية لضمان دقة التسوية المالية.</p>
                </div>
              </div>

              {/* Form body */}
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                  <h3 className="font-extrabold text-sm">
                    {editingLogId ? 'تعديل بون الصرف المحاسبي' : 'تسجيل بون صرف محروقات جديد'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveLog} className="flex-1 overflow-y-auto p-8 bg-slate-50/20 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 mr-1">التاريخ *</label>
                        <input
                          type="date"
                          required
                          value={formState.date}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-center outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 mr-1">اليوم</label>
                        <select
                          value={formState.day}
                          onChange={(e) => setFormState(prev => ({ ...prev, day: e.target.value }))}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold outline-none text-right transition-all"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">المعدة المستحقة *</label>
                      <select
                        value={formState.equipmentName}
                        onChange={(e) => setFormState(prev => ({ ...prev, equipmentName: e.target.value }))}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold outline-none text-right transition-all"
                      >
                        {EQUIPMENTS_LIST.map(eq => (
                          <option key={eq} value={eq}>{eq}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 mr-1">الكمية المصروفة (لتر) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.0"
                          value={formState.quantity || ''}
                          onChange={(e) => setFormState(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-center outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 mr-1">التكلفة (ج.م) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.0"
                          value={formState.cost || ''}
                          onChange={(e) => setFormState(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono font-black text-center text-amber-900 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">الملاحظات ومستند الصرف (موقع، محطة)</label>
                      <textarea
                        placeholder="مثال: صرف بمستند رقم ٣٣٢٨ الميداني..."
                        value={formState.notes}
                        onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl h-24 resize-none text-right focus:border-indigo-500 outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 flex-row-reverse">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      {editingLogId ? 'حفظ التعديلات' : 'إدراج بون الوقود'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      إلغاء الرجوع
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLONE OF PRINT LAYOUT FOR HIGH FIDELITY PDF PRINTING */}
      <div className="hidden print:block bg-white p-6 text-slate-900 font-sans leading-relaxed text-right text-xs" style={{ direction: 'rtl' }}>
        <div className="border border-slate-350 p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <p className="font-black text-sm">شركة م/ فوزي محمود محمد الرفاعي وشركاه</p>
              <p className="text-[10px] text-slate-500">للمقاولات العامة ورصف وإنشاء الطرق</p>
              <p className="text-[9px] text-indigo-600 mt-1">مشروعات مدينة برج العرب الجديدة</p>
            </div>
            <div className="text-center font-black">
              <h2 className="text-lg font-black tracking-wide border-b border-black pb-1">بيان المحروقات</h2>
              <p className="text-[9px] text-slate-500 mt-1">المطابقة الموقعية لعهد ديزل المعدات</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 border p-3 bg-slate-50 rounded text-center">
            <div>
              <p className="text-[9px] text-slate-500 font-bold">إجمالي العهدة</p>
              <p className="font-mono font-black mt-1 text-sm">{custodyBudget.toLocaleString('ar-EG')} ج.م</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold">إجمالي المنصرف</p>
              <p className="font-mono font-black mt-1 text-sm">{totalSpent.toLocaleString('ar-EG')} ج.م</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold">الرصيد</p>
              <p className="font-mono font-black mt-1 text-sm">{currentBalance.toLocaleString('ar-EG')} ج.م</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold">إجمالي الكمية</p>
              <p className="font-mono font-black mt-1 text-sm">{totalQuantity.toLocaleString('ar-EG')} لتر</p>
            </div>
          </div>

          {/* Core print table */}
          <table className="w-full text-center border-collapse border border-slate-400 mt-4 text-[10px]">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-450 border">
                <th className="border border-slate-400 p-1.5">التاريخ</th>
                <th className="border border-slate-400 p-1.5">اليوم</th>
                <th className="border border-slate-400 p-1.5">المعدة</th>
                <th className="border border-slate-400 p-1.5">الكمية (لتر)</th>
                <th className="border border-slate-400 p-1.5">التكلفة (ج.م)</th>
                <th className="border border-slate-400 p-1.5">الملاحظات والسند</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map(log => (
                <tr key={log.id} className="border-b border-slate-400">
                  <td className="border border-slate-400 p-1.5 font-mono">{log.date}</td>
                  <td className="border border-slate-400 p-1.5">{log.day}</td>
                  <td className="border border-slate-400 p-1.5 font-bold">{log.equipmentName}</td>
                  <td className="border border-slate-400 p-1.5 font-mono">{log.quantity.toLocaleString('ar-EG')}</td>
                  <td className="border border-slate-400 p-1.5 font-mono">{log.cost.toLocaleString('ar-EG')}</td>
                  <td className="border border-slate-400 p-1.5 text-right">{log.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Aggregates per machine print */}
          <div className="mt-6 border-t pt-4">
            <h5 className="font-bold mb-2">خلاصة توزيع التكاليف بالجنيه المصري لكل آلة:</h5>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              {equipmentSummaries.map(eq => (
                <div key={eq.name} className="border p-2 bg-slate-50 rounded">
                  <p className="font-bold">{eq.name}</p>
                  <p className="font-mono mt-1 font-black">{eq.cost.toLocaleString('ar-EG')} ج.م</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">{eq.quantity} لتر</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-12 flex justify-between text-[11px] font-bold">
            <div>
              <p>مراقب العهدة والوقود والمحروقات</p>
              <p className="mt-8 text-slate-400">.................................</p>
            </div>
            <div>
              <p>كبير مهندسي المراجعة والتكاليف</p>
              <p className="mt-8 text-slate-400">.................................</p>
            </div>
            <div>
              <p>اعتماد مدير قطاع الطرق بالمدينة</p>
              <p className="mt-8 text-slate-400">.................................</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal (Bypasses sandboxed iframe native dialog blocks) */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <span className="text-amber-600 font-extrabold flex items-center gap-1.5 text-sm">
                ⚠️ {confirmState.title}
              </span>
              <button 
                onClick={() => setConfirmState(null)} 
                className="text-slate-400 hover:text-slate-600 transition text-lg"
              >
                &times;
              </button>
            </div>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              {confirmState.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                تأكيد وبدء النقل الفوري
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
