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
  ResponsiveContainer
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
  CheckCircle,
  MapPin,
  User,
  Phone,
  Edit3,
  Check,
  X,
  AlertCircle,
  Activity,
  Award,
  Info,
  RefreshCw
} from 'lucide-react';
import { 
  FuelLogRecord,
  FuelStation,
  SiteWorker
} from '../types';
import { 
  INITIAL_FUEL_LOGS, 
  INITIAL_FUEL_CUSTODY_BUDGET
} from '../data/fuelInitialData';

export default function FuelDashboard({ 
  fuelLogs, 
  setFuelLogs, 
  custodyBudget, 
  setCustodyBudget, 
  fuelStations,
  setFuelStations,
  equipment, 
  transactions, 
  workers,
  userRole, 
  addAuditLog 
}: {
  fuelLogs: FuelLogRecord[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLogRecord[]>>;
  custodyBudget: number;
  setCustodyBudget: React.Dispatch<React.SetStateAction<number>>;
  fuelStations: FuelStation[];
  setFuelStations: React.Dispatch<React.SetStateAction<FuelStation[]>>;
  equipment: any[];
  transactions: any[];
  workers: SiteWorker[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
}) {
  // --- States ---
  
  // EQUIPMENTS_LIST derived from equipment prop
  const EQUIPMENTS_LIST = equipment.map(e => e.name);

  // --- Fuel Stations Management States ---
  const [stationName, setStationName] = useState('');
  const [stationLocation, setStationLocation] = useState('');
  const [stationDelegateName, setStationDelegateName] = useState('');
  const [stationDelegatePhone, setStationDelegatePhone] = useState('');
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [showStationModal, setShowStationModal] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<{ id: string; name: string } | null>(null);
  const [stationDeleteCodeInput, setStationDeleteCodeInput] = useState('');
  const [expectedStationDeleteCode, setExpectedStationDeleteCode] = useState('');

  // Dynamic Financial Data calculation for any fuel station (recharges minus consumption)
  const getStationFinancialData = (station: FuelStation) => {
    if (station.isInfinite) {
      return {
        balance: Infinity,
        recharges: Infinity,
        consumption: (fuelLogs || [])
          .filter(log => log.stationId === station.id)
          .reduce((sum, log) => sum + (Number(log.cost) || 0), 0),
        ratio: 100
      };
    }

    // 1. Recharges (from Transactions with category === 'fuel' and fuelStationId === station.id)
    const recharges = (transactions || [])
      .filter(tx => tx.category === 'fuel' && tx.fuelStationId === station.id)
      .reduce((sum, tx) => {
        if (tx.type === 'spent') {
          return sum + (Number(tx.amount) || 0);
        } else if (tx.type === 'income') {
          return sum - (Number(tx.amount) || 0);
        }
        return sum;
      }, 0);

    // 2. Consumption (from Fuel Logs where stationId === station.id)
    const consumption = (fuelLogs || [])
      .filter(log => log.stationId === station.id)
      .reduce((sum, log) => sum + (Number(log.cost) || 0), 0);

    const balance = recharges - consumption;
    const ratio = recharges > 0 ? Math.max(0, Math.min(100, Math.round((balance / recharges) * 100))) : 0;

    return {
      balance,
      recharges,
      consumption,
      ratio
    };
  };

  // Initialize default fuel stations if empty
  useEffect(() => {
    if (!fuelStations || fuelStations.length === 0) {
      setFuelStations([
        { 
          id: 'company-caravan', 
          name: 'عربة المحروقات الخاصة بالشركة', 
          location: 'متحرك بموقع العمل تتبع حركة المشروع', 
          delegateName: 'مشرف الحركة العام', 
          delegatePhone: 'جهة داخلية معتمدة',
          isInfinite: true 
        }
      ]);
    }
  }, [fuelStations, setFuelStations]);

  const handleSaveStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim()) {
      alert('يرجى إدخال اسم البنزينة أولاً.');
      return;
    }

    if (editingStationId) {
      setFuelStations(prev => prev.map(s => {
        if (s.id === editingStationId) {
          return {
            ...s,
            name: stationName.trim(),
            location: stationLocation.trim(),
            delegateName: stationDelegateName.trim(),
            delegatePhone: stationDelegatePhone.trim()
          };
        }
        return s;
      }));
      addAuditLog('تعديل بيانات محطة وقود', 'حركة المحروقات', `تم تعديل بيانات محطة: ${stationName}`);
      setEditingStationId(null);
    } else {
      const newStation: FuelStation = {
        id: `station-${Date.now()}`,
        name: stationName.trim(),
        location: stationLocation.trim(),
        delegateName: stationDelegateName.trim(),
        delegatePhone: stationDelegatePhone.trim(),
        isInfinite: false
      };
      setFuelStations(prev => [...prev, newStation]);
      addAuditLog('إضافة محطة وقود جديدة', 'حركة المحروقات', `تم تسجيل محطة جديدة: ${stationName}`);
    }

    // Reset fields
    setStationName('');
    setStationLocation('');
    setStationDelegateName('');
    setStationDelegatePhone('');
    setShowStationModal(false);
  };

  const handleEditStation = (s: FuelStation) => {
    setEditingStationId(s.id);
    setStationName(s.name);
    setStationLocation(s.location || '');
    setStationDelegateName(s.delegateName || '');
    setStationDelegatePhone(s.delegatePhone || '');
    setShowStationModal(true);
  };

  const handleDeleteStation = (id: string, name: string) => {
    const code = `FUEL-${Math.floor(1000 + Math.random() * 9000)}`;
    setExpectedStationDeleteCode(code);
    setStationDeleteCodeInput('');
    setStationToDelete({ id, name });
  };

  const confirmDeleteStation = () => {
    if (!stationToDelete) return;
    if (stationDeleteCodeInput.trim() !== expectedStationDeleteCode) {
      alert('الكود المدخل غير صحيح! يرجى كتابة الكود بشكل مطابق للتأكيد.');
      return;
    }
    setFuelStations(prev => prev.filter(s => s.id !== stationToDelete.id));
    addAuditLog('حذف محطة وقود', 'حركة المحروقات', `تم حذف محطة الوقود: ${stationToDelete.name} وتصفير رصيدها.`);
    setStationToDelete(null);
  };

  // New/Edit Form State
  const [formState, setFormState] = useState<{
    date: string;
    day: string;
    equipmentName: string;
    quantity: number;
    cost: number;
    additionalCost: number;
    recipientName: string;
    notes: string;
    stationId?: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    day: 'الأحد',
    equipmentName: EQUIPMENTS_LIST[0] || '',
    quantity: 0,
    cost: parseFloat(localStorage.getItem('lastFuelCost') || '0') || 0,
    additionalCost: 0,
    recipientName: '',
    notes: '',
    stationId: ''
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
  const [selectedStationFilter, setSelectedStationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Custom confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    expectedCode?: string;
    onConfirm: () => void;
  } | null>(null);
  const [deleteCodeInput, setDeleteCodeInput] = useState('');

  const DAYS_OF_WEEK = [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  // Auto-fill day based on date picker
  const handleDateChange = (dateVal: string) => {
    const d = new Date(dateVal);
    const dayIndex = d.getDay();
    const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    setFormState(prev => ({
      ...prev,
      date: dateVal,
      day: daysArabic[dayIndex]
    }));
  };

  // --- Aggregates and Statistics ---
  // Automatically calculate fuel budget from Transactions (شيت الحركة)
  const calculatedFuelBudget = transactions
    .filter(tx => tx.category === 'fuel')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalQuantity = fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
  const totalSpent = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const currentBalance = calculatedFuelBudget - totalSpent;

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
    if (!formState.equipmentName || !formState.recipientName) {
      alert('يرجى تحديد المعدة والمستلم.');
      return;
    }

    const costPerLiter = Number(formState.cost) || 0;
    const qtyNum = Number(formState.quantity) || 0;
    const additionalCost = Number(formState.additionalCost) || 0;
    const totalCost = (costPerLiter * qtyNum) + additionalCost;
    
    // Remember the last cost per liter
    localStorage.setItem('lastFuelCost', costPerLiter.toString());

    if (editingLogId) {
      setFuelLogs(prev => prev.map(log => {
        if (log.id === editingLogId) {
          return {
            ...log,
            date: formState.date,
            day: formState.day,
            equipmentName: formState.equipmentName,
            quantity: qtyNum,
            cost: totalCost,
            additionalCost: additionalCost,
            recipientName: formState.recipientName,
            notes: formState.notes,
            stationId: formState.stationId || undefined
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
        cost: totalCost,
        additionalCost: additionalCost,
        recipientName: formState.recipientName,
        notes: formState.notes,
        stationId: formState.stationId || undefined
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
      cost: parseFloat(localStorage.getItem('lastFuelCost') || '0') || 0,
      additionalCost: 0,
      recipientName: '',
      notes: '',
      stationId: ''
    });
  };

  const startEditLog = (log: FuelLogRecord) => {
    setEditingLogId(log.id);
    setFormState({
      date: log.date,
      day: log.day,
      equipmentName: log.equipmentName,
      quantity: log.quantity,
      cost: log.cost - log.additionalCost, 
      additionalCost: log.additionalCost,
      recipientName: log.recipientName,
      notes: log.notes || '',
      stationId: log.stationId || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteLog = (id: string, cost: number, eqName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف بون وقود / قيد سولار',
      message: 'يحذر النظام المالي: هل أنت متأكد تماماً من رغبتك في حذف هذا القيد؟',
      expectedCode: Math.floor(1000 + Math.random() * 9000).toString(),
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
    const matchesStationFilter = selectedStationFilter === 'all' || log.stationId === selectedStationFilter;
    
    return matchesSearch && matchesFilter && matchesStationFilter;
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
    '#6366f1', '#1e1b4b', '#4f46e5', '#312e81', 
    '#4338ca', '#111827', '#374151', '#4b5563'
  ];

  return (
    <div className="space-y-8 text-right font-sans p-6 bg-[#fafafa] rounded-3xl border border-slate-200/80 shadow-xs" id="fuel-dashboard-container" dir="rtl">
      
      {/* 1. Elegant Header Banner (Light Theme, Purple & Black) */}
      <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="text-right w-full lg:w-auto relative z-10">
          <span className="p-1.5 px-3.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider rounded-full">
            إدارة الطاقة والمحروقات والمتابعة اللوجستية
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-3 flex items-center gap-3 justify-start">
            <Fuel className="text-indigo-600" size={28} />
            حركة المحروقات والسولار الميداني
          </h3>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2 max-w-2xl">
            سجل حركة الوقود للمصالح والآلات تشغيلياً بمدينة برج العرب الجديدة، متكاملاً بالكامل مع سركيات تشغيل المعدات الثقيلة ودفاتر التحرك العام للسيارات وسندات الصرف المالي.
          </p>
        </div>

        {/* Action button bar */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end relative z-10">
          <button
            onClick={() => window.print()}
            className="px-4.5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 text-xs font-black rounded-xl transition border border-slate-200 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Printer size={15} className="text-indigo-600" /> طباعة الكشف الميداني
          </button>
          <button
            onClick={() => setShowAiIngest(!showAiIngest)}
            className="px-4.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl transition border border-indigo-150 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Sparkles size={15} /> التحليل الذكي للبونات
          </button>
          <button
            onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تسجيل بونات جديدة') : () => {
              setEditingLogId(null);
              setFormState({
                date: new Date().toISOString().split('T')[0],
                day: 'الأحد',
                equipmentName: EQUIPMENTS_LIST[0] || '',
                quantity: 100,
                cost: parseFloat(localStorage.getItem('lastFuelCost') || '0') || 0,
                additionalCost: 0,
                recipientName: '',
                notes: '',
                stationId: ''
              });
              setShowAddModal(true);
            }}
            disabled={userRole === 'viewer'}
            className={`px-5 py-2.5 text-xs font-black rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 ${
              userRole === 'viewer'
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-550 cursor-pointer'
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
            initial={{ opacity: 1, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1, y: -15 }}
            className="bg-white border border-indigo-100 text-slate-900 p-6 rounded-3xl shadow-sm space-y-5 no-print bg-gradient-to-br from-white via-white to-indigo-50/10 font-sans text-right"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">مستشار صرف وقود وبونات السولار بالذكاء الاصطناعي</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-1">ارفع صورة بون تانك الرشاش أو ورقة صرف ميكانيكي، أو انسخ نص الرسالة لإدراكها فوراً وبشكل تلقائي</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700">البيان المنسوخ أو الرسالة الميدانية:</label>
                <textarea
                  rows={4}
                  placeholder="مثال: صرف سولار 150 لتر لجريدر عمرو بقيمة 2647.5 جنيهاً من محطة برج العرب بتاريخ اليوم"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-right text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* File Upload Screen */}
              <div className="flex flex-col justify-between space-y-2">
                <label className="block text-xs font-black text-slate-700">صورة أو لقطة قسيمة الوقود:</label>
                <div 
                  className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 hover:border-indigo-300 transition cursor-pointer relative min-h-[120px]"
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
                    <div className="text-center space-y-2">
                      <span className="p-1.5 px-3.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-150 inline-block">
                        تم تحميل البون البصري بنجاح
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold">انقر للاستبدال بصورة أخرى</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-slate-400">
                      <span className="block text-xs font-black text-slate-700">اسحب صورة قسيمة الوقود أو انقر للتصفح</span>
                      <span className="block text-[9px] text-slate-450">JPEG, PNG حتى 10 ميجا</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-black rounded-xl text-right flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
                    if (!res.ok) {
                      let errData;
                      try { errData = await res.json(); } catch(e) {}
                      throw new Error((errData && errData.error) || 'فشل فحص البون وتفسيره');
                    }

                    const reader = res.body?.getReader();
                    const decoder = new TextDecoder();
                    let resultText = '';
                    if (reader) {
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        resultText += decoder.decode(value, { stream: true });
                      }
                    }
                    
                    let data: any = {};
                    try {
                      data = JSON.parse(resultText);
                    } catch (e) {
                      throw new Error("فشل في تحليل المخرجات الواردة من الذكاء الاصطناعي.");
                    }
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
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-black text-xs text-white rounded-xl transition flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-xs active:scale-95 border border-indigo-550"
              >
                {isAiAnalyzing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>جاري مطابقة بونات السولار وتكشيفها...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>تحليل حركة الوقود بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>

              {aiResultRecords.length > 0 && (
                <button
                  onClick={() => {
                    setAiResultRecords([]);
                    setAiText('');
                    setAiImageBase64(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 transition font-bold"
                >
                  إفراغ الشاشة والتصفير
                </button>
              )}
            </div>

            {/* PREVIEW OF EXTRACTED CODES */}
            {aiResultRecords.length > 0 && (
              <div className="pt-4 border-t border-slate-150 space-y-3">
                <h5 className="text-xs font-black text-indigo-700">بونات الوقود الفورية المكتشفة القابلة للتسجيل:</h5>
                <div className="overflow-x-auto rounded-2xl border border-slate-250 bg-white">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">اليوم</th>
                        <th className="p-3">المعدة المكتشفة في الموقع</th>
                        <th className="p-3">الكمية المقدرة (لتر)</th>
                        <th className="p-3">التكلفة (ج.م)</th>
                        <th className="p-3 text-right">البيان المستخلص</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-800 font-semibold">
                      {aiResultRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono">{rec.date}</td>
                          <td className="p-3">{rec.day}</td>
                          <td className="p-3">
                            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-black text-[10px]">
                              {rec.equipmentName}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-black text-indigo-650">{rec.quantity} لتر</td>
                          <td className="p-3 font-black text-slate-900 font-mono">{(rec.cost).toLocaleString('ar-EG')} ج.م</td>
                          <td className="p-3 text-slate-500 text-right truncate max-w-[200px]" title={rec.notes}>{rec.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
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
                    className={`px-6 py-3 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm active:scale-95 border ${
                      userRole === 'viewer'
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-550 cursor-pointer'
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

      {/* 2. Key Metrics Summary Cards (High Contrast, Custom Shadows, Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: 'مخصص عهدة المحروقات',
            value: calculatedFuelBudget.toLocaleString('ar-EG'),
            unit: 'ج.م',
            subtitle: 'عهد نقدية مخصصة للديزل',
            icon: Coins,
            color: 'indigo'
          },
          {
            title: 'إجمالي المنصرف الفعلي',
            value: totalSpent.toLocaleString('ar-EG'),
            unit: 'ج.م',
            subtitle: 'مكافئ التكلفة الإجمالية للبونات',
            icon: Droplet,
            color: 'slate'
          },
          {
            title: 'رصيد عهدة المحروقات',
            value: currentBalance.toLocaleString('ar-EG'),
            unit: 'ج.م',
            subtitle: currentBalance < 0 ? 'تجاوز وسلفيات' : 'الأمانة النقدية المتوفرة',
            icon: AlertTriangle,
            color: currentBalance < 0 ? 'rose' : 'emerald'
          },
          {
            title: 'إجمالي السولار المستلم',
            value: totalQuantity.toLocaleString('ar-EG'),
            unit: 'لتر',
            subtitle: 'مسحوبات الآلات الموقعية',
            icon: Calendar,
            color: 'indigo'
          },
          {
            title: 'رصيد حساب البنزينات',
            value: (fuelStations || []).filter(s => !s.isInfinite).reduce((sum, s) => sum + getStationFinancialData(s).balance, 0).toLocaleString('ar-EG'),
            unit: 'ج.م',
            subtitle: 'الرصيد المشحون طرف المحطات',
            icon: Fuel,
            color: 'slate'
          }
        ].map((card, idx) => {
          const isEmerald = card.color === 'emerald';
          const isRose = card.color === 'rose';
          const isIndigo = card.color === 'indigo';
          
          let iconBg = 'bg-slate-50 text-slate-700 border-slate-100';
          let borderStyle = 'border-slate-200/80';
          if (isEmerald) {
            iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
          } else if (isRose) {
            iconBg = 'bg-rose-50 text-rose-750 border-rose-100';
            borderStyle = 'border-rose-200';
          } else if (isIndigo) {
            iconBg = 'bg-indigo-50 text-indigo-700 border-indigo-100';
          }

          return (
            <div key={idx} className={`bg-white border ${borderStyle} p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between`}>
              <div className="text-right">
                <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">{card.title}</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <p className="text-2xl font-mono font-black text-slate-900">{card.value}</p>
                  <span className="text-xs text-slate-400 font-black">{card.unit}</span>
                </div>
                <p className={`text-[9px] font-bold mt-1.5 ${isRose ? 'text-rose-600' : isEmerald ? 'text-emerald-600' : 'text-slate-400'}`}>{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl border ${iconBg}`}>
                <card.icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Content Stack */}
      <div className="space-y-8">

        {/* 3.1 Fuel Stations (Gasolines) Management Module (Bento Style) */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/85 shadow-xs space-y-6" id="fuel-stations-module">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-5 gap-4">
            <div className="text-right">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Fuel className="text-indigo-600" size={18} />
                أرصدة وعهود محطات الوقود (البنزينات)
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                قم بإنشاء وتحديث أرصدة العملات الميدانية المسلمة للبنزينات لحسابات تموين المعدات المباشر.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setEditingStationId(null);
                  setStationName('');
                  setStationLocation('');
                  setStationDelegateName('');
                  setStationDelegatePhone('');
                  setShowStationModal(true);
                }}
                disabled={userRole === 'viewer'}
                className={`px-4 py-2.5 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95 ${
                  userRole === 'viewer'
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Plus size={14} />
                <span>تسجيل بنزينة جديدة</span>
              </button>
              <span className="text-[10px] bg-slate-50 text-slate-700 px-3 py-2.5 font-bold rounded-xl border border-slate-200">
                عدد البنزينات المسجلة: {fuelStations.length} محطة
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 text-right uppercase tracking-wider">كروت الأرصدة النشطة للبنزينات والمحطات المعتمدة:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fuelStations.length === 0 ? (
                <div className="lg:col-span-3 bg-slate-50 rounded-2xl border border-dashed border-slate-250 p-12 text-center text-slate-450 text-xs font-bold">
                  لا توجد أرصدة محطات مسجلة حالياً بالمشروع. انقر على "تسجيل بنزينة جديدة" لتهيئة كارت رصيد.
                </div>
              ) : (
                fuelStations.map(station => {
                  const financials = getStationFinancialData(station);
                  const isInf = !!station.isInfinite;
                  const displayBalanceStr = isInf ? 'رصيد مفتوح للمشروع' : `${financials.balance.toLocaleString('ar-EG')} ج.م`;
                  return (
                    <div 
                      key={station.id} 
                      className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition duration-300 flex flex-col justify-between space-y-4 relative ${
                        editingStationId === station.id ? 'ring-2 ring-indigo-500 bg-indigo-50/5 border-indigo-300' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-right flex-1 min-w-0">
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 p-1 px-2.5 rounded-lg inline-block">
                            {isInf ? 'عربة محروقات الشركة (غير محدودة)' : 'كارت رصيد المحطة المعتمدة'}
                          </span>
                          <span className="text-xs font-black text-slate-900 block mt-2 line-clamp-1">{station.name}</span>
                        </div>
                        <div className="p-2.5 bg-indigo-50/40 text-indigo-700 rounded-xl border border-indigo-100/60 flex-shrink-0">
                          <Fuel size={15} />
                        </div>
                      </div>

                      {/* Compact Station Profile Details */}
                      <div className="text-[10px] space-y-1.5 font-bold text-slate-500 text-right pt-1">
                        <p className="flex items-center gap-1.5 justify-start flex-row-reverse text-slate-700 leading-tight">
                          <span className="shrink-0 text-slate-400 font-extrabold">الموقع:</span>
                          <span className="truncate max-w-[180px]">{station.location || 'غير مسجل'}</span>
                          <MapPin size={11} className="text-slate-400" />
                        </p>
                        <p className="flex items-center gap-1.5 justify-start flex-row-reverse text-slate-650 leading-tight">
                          <span className="shrink-0 text-slate-400 font-extrabold">المفوض:</span>
                          <span className="truncate max-w-[180px]">{station.delegateName || 'غير مسجل'} {station.delegatePhone ? `(${station.delegatePhone})` : ''}</span>
                          <User size={11} className="text-slate-400" />
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-[10px] text-slate-400 font-extrabold">الرصيد المالي المتاح:</span>
                          <span className={`text-xs font-black ${isInf ? 'text-indigo-700' : 'text-slate-900 font-mono'}`}>
                            {displayBalanceStr}
                          </span>
                        </div>
                        
                        {/* Progressive status bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isInf ? 'bg-indigo-600 w-full' : financials.ratio < 20 ? 'bg-rose-500' : financials.ratio < 50 ? 'bg-indigo-400' : 'bg-slate-900'
                            }`}
                            style={{ width: `${isInf ? 100 : financials.ratio}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-1.5">
                          {isInf ? (
                            <>
                              <span>نسبة السحب والوفر: غير محدود</span>
                              <span>حركة مستمرة</span>
                            </>
                          ) : (
                            <>
                              <span>رصيد متبقي: {financials.ratio}%</span>
                              <span>شحن مالي: {financials.recharges.toLocaleString('ar-EG')} ج.م</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleEditStation(station)}
                          className="px-2.5 py-1.5 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 size={10} />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          disabled={isInf}
                          onClick={() => handleDeleteStation(station.id, station.name)}
                          className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition flex items-center gap-1 ${
                            isInf 
                              ? 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
                              : 'text-rose-700 bg-rose-50 border border-rose-150 hover:bg-rose-100 cursor-pointer'
                          }`}
                        >
                          <Trash2 size={10} />
                          <span>حذف وسحب</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 3.2 Filter and Journal Table section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          
          {/* Filtering Options */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              
              {/* Search Input */}
              <div className="relative min-w-[220px] flex-1 md:flex-initial">
                <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="البحث بالآلة أو التاريخ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs p-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-right transition-all"
                />
              </div>

              {/* Equipment pick list */}
              <div>
                <select
                  value={selectedEquipmentFilter}
                  onChange={(e) => setSelectedEquipmentFilter(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-right"
                >
                  <option value="all">جميع المعدات والآلات</option>
                  {EQUIPMENTS_LIST.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              
              {/* Station pick list */}
              <div>
                <select
                  value={selectedStationFilter}
                  onChange={(e) => setSelectedStationFilter(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-right"
                >
                  <option value="all">جميع المحطات</option>
                  {fuelStations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Records Counter */}
            <div className="text-xs text-slate-500 font-bold">
              جاري عرض <span className="font-black text-indigo-700">{filteredLogs.length}</span> من أصل <span className="font-black text-slate-900">{fuelLogs.length}</span> بون وقود معتمد
            </div>
          </div>

          {/* The data list */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-800 font-black text-xs border-b border-slate-200 text-center">
                  <th 
                    className="p-4.5 cursor-pointer hover:bg-slate-100 transition text-right"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1.5 justify-start">
                      <span>التاريخ</span>
                      <ArrowUpDown size={11} className="text-indigo-650" />
                    </div>
                  </th>
                  <th className="p-4.5 text-center">اليوم</th>
                  <th className="p-4.5 text-right">الرقم المرجعي</th>
                  <th className="p-4.5 text-right">محطة الاستلام/المصدر</th>
                  <th className="p-4.5 text-right">المستلم</th>
                  <th className="p-4.5 text-right">المعدة</th>
                  <th className="p-4.5 cursor-pointer hover:bg-slate-100 transition text-center" onClick={() => toggleSort('quantity')}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>الكمية (لتر)</span>
                      <ArrowUpDown size={11} className="text-indigo-650" />
                    </div>
                  </th>
                  <th className="p-4.5 text-center">السعر/م</th>
                  <th className="p-4.5 text-center">إضافي</th>
                  <th className="p-4.5 cursor-pointer hover:bg-slate-100 transition text-center" onClick={() => toggleSort('cost')}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>التكلفة (ج.م)</span>
                      <ArrowUpDown size={11} className="text-indigo-650" />
                    </div>
                  </th>
                  <th className="p-4.5 text-right pr-4">ملاحظات</th>
                  <th className="p-4.5 font-sans rounded-tl-xl text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/10 transition text-center text-xs font-semibold text-slate-700">
                    
                    {/* Date, Day, Ref */}
                    <td className="p-4 text-right font-semibold text-slate-500 font-mono text-[11px]">{log.date}</td>
                    <td className="p-4 text-[11px] font-bold text-slate-800 text-center">{log.day}</td>
                    <td className="p-4 font-black text-indigo-700 text-[11px] tracking-wide text-right">{log.referenceNo || '---'}</td>
                    
                    {/* Fuel Station */}
                    <td className="p-4 text-right">
                      {log.stationId ? (
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100/60 text-indigo-700 text-[10px] font-black p-1 px-2.5 rounded-lg">
                          ⛽ {fuelStations.find(s => s.id === log.stationId)?.name || 'البنزينة المسجلة'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 p-1 px-2 rounded-lg">تموين مباشر</span>
                      )}
                    </td>

                    {/* Recipient */}
                    <td className="p-4 text-right text-[11px] font-semibold text-slate-800">
                      {log.recipientName || '---'}
                    </td>

                    {/* Machinery */}
                    <td className="p-4 font-bold text-slate-900 text-right">
                      <span className="p-1 px-2.5 bg-slate-50 text-slate-800 border border-slate-200 text-[10px] font-black rounded-lg leading-none">
                        {log.equipmentName}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="p-4 font-mono font-black text-slate-800 text-[12px] text-center">
                      {(log.quantity || 0).toLocaleString('ar-EG')}
                    </td>

                    {/* Price per unit - derived */}
                    <td className="p-4 font-mono font-black text-slate-500 text-[11px] text-center">
                       {((log.quantity || 0) > 0 ? (((log.cost || 0) - (log.additionalCost || 0)) / (log.quantity || 1)).toFixed(2) : '0.00')}
                    </td>
                    
                    {/* Additional Cost */}
                    <td className="p-4 font-mono font-bold text-slate-500 text-[11px] text-center">
                      {(log.additionalCost || 0).toLocaleString('ar-EG')}
                    </td>
                    
                    {/* Cost */}
                    <td className="p-4 font-mono font-black text-slate-900 text-[12px] text-center">
                      {(log.cost || 0).toLocaleString('ar-EG')}
                    </td>

                    {/* Notes */}
                    <td className="p-4 text-right text-slate-450 font-medium text-[11px] pr-4 max-w-[150px] truncate" title={log.notes}>
                      {log.notes || '-'}
                    </td>

                    {/* Actions */}
                    <td className="p-4 font-sans text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تعديل السجلات') : () => startEditLog(log)}
                          className={`p-1 px-2.5 rounded-lg transition text-[11px] font-black cursor-pointer ${
                            userRole === 'viewer'
                              ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/60'
                          }`}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حذف السجلات') : () => handleDeleteLog(log.id, log.cost, log.equipmentName)}
                          className={`p-1 px-2.5 rounded-lg transition text-[11px] font-black cursor-pointer ${
                            userRole === 'viewer'
                              ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-100/60'
                          }`}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-slate-400 text-xs font-bold font-sans">
                      لا توجد أي قيود أو بونات وقود مطابقة لبحثك الجاري.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer with local page aggregates */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-slate-600 gap-3">
            <p className="text-[10px] text-slate-400 font-semibold text-right">
              * يتم تصفير وتسوية هذا الكشف أسبوعياً مع لجان المراجعة والمستند الاستشاري.
            </p>
            <div className="font-sans flex gap-5 text-slate-800">
              <span>إجمالي الكمية: <span className="font-mono text-indigo-700 font-black">{filteredLogs.reduce((sum, r) => sum + (r.quantity || 0), 0).toLocaleString('ar-EG')} لتر</span></span>
              <span className="border-l border-slate-200"></span>
              <span>القيمة الإجمالية: <span className="font-mono text-slate-950 font-black">{filteredLogs.reduce((sum, r) => sum + (r.cost || 0), 0).toLocaleString('ar-EG')} ج.م</span></span>
            </div>
          </div>
        </div>

        {/* 3.3 Charts & Summaries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Cost breakdown per machinery (Horizontal Bar chart) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="text-right">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">بيان التوزيع المالي للمحروقات على أسطول الآلات</h4>
              <p className="text-[10px] text-slate-400 font-bold">رصد كميات الصرف باللتر وتكلفة التشغيل الفعلي بالجنيه المصري</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={equipmentSummaries}
                  layout="vertical"
                  margin={{ left: 5, right: 5, top: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 'bold' }} width={80} orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString('ar-EG')} ${name === 'cost' ? 'ج.م' : 'لتر'}`,
                      name === 'cost' ? 'التكلفة الإجمالية' : 'الكمية المستهلكة'
                    ]}
                    contentStyle={{ direction: 'rtl', textAlign: 'right', fontSize: 11, borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="cost" fill="#4f46e5" radius={[0, 4, 4, 0]} name="cost" />
                  <Bar dataKey="quantity" fill="#111827" radius={[0, 4, 4, 0]} name="quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side table: exact match with PDF side panel "إجمالي التكلفة" */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-right pb-4 border-b border-slate-150">
                <span className="p-1.5 px-3 bg-indigo-50 text-indigo-750 font-black text-[9px] rounded-lg">
                  ملخص إجمالي التكاليف الموقعية للمحروقات
                </span>
                <h4 className="text-xs font-black text-slate-900 mt-2">مقارنة التكلفة بالحصص المعتمدة</h4>
              </div>

              <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {equipmentSummaries.map((eq, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  const percentage = totalSpent > 0 ? (eq.cost / totalSpent) * 100 : 0;
                  return (
                    <div key={eq.name} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                        <span className="font-bold text-slate-800">{eq.name}</span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="font-black text-slate-950">{eq.cost.toLocaleString('ar-EG')} ج.م</span>
                        <span className="text-[9px] text-slate-400 block font-bold tracking-wide">
                          {eq.quantity.toLocaleString('ar-EG')} لتر ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 text-[10px] text-slate-400 font-bold leading-relaxed text-right flex items-start gap-2">
              <Info size={13} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>يتم موازنة الديزل المستلم من محطة مدينة برج العرب مباشرةً بالتنسيق مع المشرفين الميدانيين لضمان مطابقة العدادات الرقمية.</span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. ADD/EDIT FUEL RECORD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 1 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-right font-sans"
            >
              {/* Sidebar */}
              <div className="hidden md:flex md:w-64 bg-slate-50 p-8 flex-col justify-between border-l border-slate-200 text-right">
                <div>
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-150 mb-6">
                    <Fuel className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-black mb-2 text-slate-900 leading-snug">إضافة بون وقود</h3>
                  <p className="text-[10.5px] text-slate-500 font-bold leading-relaxed">تسجيل حركة صرف الوقود الجديدة للمعدات ومطابقتها مع المستندات الميدانية لضمان دقة التسوية المالية.</p>
                </div>
              </div>

              {/* Form body */}
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white flex-shrink-0">
                  <h3 className="font-black text-sm text-slate-950">
                    {editingLogId ? 'تعديل بون الصرف المحاسبي' : 'تسجيل بون صرف محروقات جديد'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={18} />
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

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">محطة الوقود المستلم منها (البنزينة) *</label>
                      <select
                        value={formState.stationId || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, stationId: e.target.value }))}
                        className="w-full text-xs p-3 bg-white border border-slate-250 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold outline-none text-right transition-all"
                      >
                        <option value="">-- تموين خارجي / مباشر (عهدة بدون محطة) --</option>
                        {fuelStations.map(station => (
                          <option key={station.id} value={station.id}>{station.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">المستلم *</label>
                      <select
                        required
                        value={formState.recipientName}
                        onChange={(e) => setFormState(prev => ({ ...prev, recipientName: e.target.value }))}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold outline-none text-right transition-all"
                      >
                        <option value="">-- اختر المستلم --</option>
                        {workers.map(worker => (
                          <option key={worker.id} value={worker.name}>{worker.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 mr-1">الكمية (لتر) *</label>
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
                        <label className="block text-[10px] font-black text-slate-500 mr-1">سعر اللتر (ج.م) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.0"
                          value={formState.cost || ''}
                          onChange={(e) => {
                            const costPerLiter = parseFloat(e.target.value) || 0;
                            setFormState(prev => ({ ...prev, cost: costPerLiter }));
                          }}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono font-black text-center text-indigo-900 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 mr-1">إضافي (ج.م)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.0"
                          value={formState.additionalCost ?? ''}
                          onChange={(e) => setFormState(prev => ({ ...prev, additionalCost: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }))}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono font-black text-center text-indigo-900 outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-100/60 rounded-2xl text-center border border-slate-200">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">إجمالي التكلفة</p>
                      <p className="text-sm font-black text-indigo-700 mt-1">
                        {(!isNaN(formState.quantity) && !isNaN(formState.cost) && !isNaN(formState.additionalCost) 
                          ? ((formState.quantity * formState.cost) + formState.additionalCost) 
                          : 0
                        ).toLocaleString('ar-EG')} ج.م
                      </p>
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

                  <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-200 flex-row-reverse">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer border border-indigo-550"
                    >
                      {editingLogId ? 'حفظ التعديلات' : 'إدراج بون الوقود'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer border border-slate-200"
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
              <p className="font-mono font-black mt-1 text-sm">{calculatedFuelBudget.toLocaleString('ar-EG')} ج.م</p>
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
                <th className="border border-slate-400 p-1.5">محطة الاستلام</th>
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
                  <td className="border border-slate-400 p-1.5 font-extrabold max-w-[120px] truncate">
                    {log.stationId ? (fuelStations.find(s => s.id === log.stationId)?.name || 'بنزينة معتمدة') : 'تموين مباشر'}
                  </td>
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

      {/* Custom Confirmation Modal */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-7 max-w-md w-full text-right space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <span className="text-indigo-700 font-extrabold flex items-center gap-2 text-xs">
                <AlertTriangle size={15} />
                <span>{confirmState.title}</span>
              </span>
              <button 
                onClick={() => setConfirmState(null)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              {confirmState.message}
            </p>
            {confirmState.expectedCode && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-3 mt-4">
                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
                  أدخل كود التحقق لتأكيد الحذف: <span className="bg-rose-100 px-2 py-0.5 rounded text-rose-700 text-sm ml-1 select-all font-mono tracking-widest">{confirmState.expectedCode}</span>
                </label>
                <input 
                  type="text"
                  value={deleteCodeInput}
                  onChange={(e) => setDeleteCodeInput(e.target.value)}
                  placeholder="أدخل الكود هنا..."
                  className="w-full bg-white border border-rose-200 rounded-lg px-4 py-2 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  autoFocus
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (confirmState.expectedCode && deleteCodeInput !== confirmState.expectedCode) {
                    alert('كود التحقق غير صحيح');
                    return;
                  }
                  confirmState.onConfirm();
                  setConfirmState(null);
                  setDeleteCodeInput('');
                }}
                disabled={!!(confirmState.expectedCode && deleteCodeInput !== confirmState.expectedCode)}
                className={`px-4 py-2 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer ${
                  confirmState.expectedCode && deleteCodeInput !== confirmState.expectedCode
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                تأكيد العملية
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 ADD/EDIT STATION MODAL */}
      <AnimatePresence>
        {showStationModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print" dir="rtl">
            <motion.div 
              initial={{ opacity: 1, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 1, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden font-sans text-right"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center flex-row-reverse">
                <button 
                  onClick={() => {
                    setShowStationModal(false);
                    setEditingStationId(null);
                    setStationName('');
                    setStationLocation('');
                    setStationDelegateName('');
                    setStationDelegatePhone('');
                  }} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 text-lg transition"
                >
                  <X size={16} />
                </button>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 flex-row-reverse">
                    <span>{editingStationId ? 'تعديل بيانات البنزينة' : 'قيد وتسجيل بنزينة جديدة'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">أدخل البيانات الأساسية والمفوض الميداني باختصار</p>
                </div>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveStation} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-extrabold text-slate-700">
                  
                  {/* Name of station */}
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-slate-800 font-black">اسم البنزينة / محطة الوقود <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محطة شل برج العرب"
                      value={stationName}
                      onChange={(e) => setStationName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Location of station */}
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-slate-800 font-black">موقع البنزينة / العنوان <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مدخل المدينة الأول، بجوار صينية المطار"
                      value={stationLocation}
                      onChange={(e) => setStationLocation(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Delegate Name */}
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-black">اسم المفوض <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="اسم المفوض للتعامل"
                      value={stationDelegateName}
                      onChange={(e) => setStationDelegateName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Delegate Phone */}
                  <div>
                    <label className="block mb-1.5 text-slate-800 font-black">رقم هاتف المفوض <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 01012345678"
                      value={stationDelegatePhone}
                      onChange={(e) => setStationDelegatePhone(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all"
                      dir="rtl"
                    />
                  </div>

                </div>

                {/* Footer buttons */}
                <div className="flex gap-2 pt-4 border-t border-slate-150 justify-end">
                  <button
                    type="submit"
                    disabled={userRole === 'viewer'}
                    className={`px-5 py-2.5 text-xs font-black rounded-xl transition cursor-pointer active:scale-95 ${
                      userRole === 'viewer'
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-650 hover:bg-slate-900 text-white shadow-xs border border-indigo-550'
                    }`}
                  >
                    {editingStationId ? 'تحديث البيانات ✓' : 'حفظ وتسجيل المحطة +'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStationModal(false);
                      setEditingStationId(null);
                      setStationName('');
                      setStationLocation('');
                      setStationDelegateName('');
                      setStationDelegatePhone('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer active:scale-95"
                  >
                    إلغاء التغييرات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5.6 DELETE STATION CONFIRMATION MODAL WITH VERIFICATION CODE */}
      <AnimatePresence>
        {stationToDelete && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print" dir="rtl">
            <motion.div 
              initial={{ opacity: 1, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 1, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
                <span className="text-rose-600 font-extrabold flex items-center gap-1.5 text-xs">
                  <AlertTriangle size={15} />
                  <span>تأكيد حذف محطة الوقود</span>
                </span>
                <button 
                  onClick={() => setStationToDelete(null)} 
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                  أنت على وشك حذف بيانات ورصيد محطة الوقود المعتمدة: 
                  <strong className="text-slate-900 block mt-2 bg-rose-50 text-rose-700 p-3 rounded-xl font-black text-center text-xs border border-rose-100">
                    {stationToDelete.name}
                  </strong>
                  سيؤدي هذا الإجراء إلى حذف المحطة وتصفير رصيدها بالكامل من سجلات المشروع بشكل غير قابل للتراجع.
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-[10px] font-black text-slate-500">
                    لتأكيد عملية الحذف، يرجى كتابة كود التحقق التالي:
                  </label>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs tracking-wider text-center">
                    <span className="text-slate-400 text-[10px] font-bold font-sans">كود التحقق:</span>
                    <span className="font-black text-indigo-700 select-all">{expectedStationDeleteCode}</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={`اكتب الكود هنا للتأكيد`}
                    value={stationDeleteCodeInput}
                    onChange={(e) => setStationDeleteCodeInput(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center font-mono text-xs tracking-wider text-slate-800 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={stationDeleteCodeInput.trim() !== expectedStationDeleteCode}
                  onClick={confirmDeleteStation}
                  className={`px-4 py-2.5 text-white text-xs font-black rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                    stationDeleteCodeInput.trim() !== expectedStationDeleteCode
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-rose-600 hover:bg-rose-750'
                  }`}
                >
                  <Trash2 size={13} />
                  <span>تأكيد الحذف النهائي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStationToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer active:scale-95"
                >
                  إلغاء وتراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
