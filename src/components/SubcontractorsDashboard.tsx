/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit,
  ChevronDown,
  ChevronUp,
  FileText,
  Percent,
  TrendingDown,
  Coins,
  Lock,
  RefreshCw,
  AlertCircle,
  Info,
  Phone
} from 'lucide-react';
import { Transaction, Subcontractor, SubcontractorWorkItem, SubcontractorDiscount } from '../types';

interface SubcontractorsDashboardProps {
  transactions: Transaction[];
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  subcontractors: Subcontractor[];
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
}

export default function SubcontractorsDashboard({ 
  transactions, 
  onAddTransaction,
  subcontractors = [],
  setSubcontractors
}: SubcontractorsDashboardProps) {

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    paperSettlements: 0,
    notes: '',
    phone: '',
    contractNumber: ''
  });

  const [workItems, setWorkItems] = useState<SubcontractorWorkItem[]>([]);

  // Get matching ledger payments for a subcontractor name
  const getSubcontractorPayments = (subName: string) => {
    if (!subName) return [];
    return transactions.filter(tx => {
      if (tx.type !== 'spent') return false;
      const sName = subName.trim().toLowerCase();
      const txRecipient = (tx.recipient || '').trim().toLowerCase();
      return tx.category === 'contractors' && (txRecipient === sName || txRecipient.includes(sName) || sName.includes(txRecipient));
    });
  };

  // Centralized calculations for a subcontractor
  const getSubcontractorCalculatedStats = (c: Subcontractor) => {
    const items = c.workItems && c.workItems.length > 0 ? c.workItems : [{
      id: 'legacy-item',
      trade: c.trade || 'عمل رئيسي',
      workVolume: c.workVolume || 0,
      unitPrice: c.unitPrice || 0,
      totalValue: (c.workVolume || 0) * (c.unitPrice || 0) || c.totalValue || 0,
      discounts: []
    }];

    let grossValue = 0;
    let totalDiscounts = 0;

    items.forEach(item => {
      grossValue += item.totalValue;
      if (item.discounts) {
        item.discounts.forEach(d => {
          totalDiscounts += d.amount || 0;
        });
      }
    });

    const netValue = grossValue - totalDiscounts;

    const ledgerPayments = getSubcontractorPayments(c.name);
    // Dynamic values according to nature:
    // nature === 'inside_custody' -> مسحوبات عهدة الموقع
    const custodyTotal = ledgerPayments.filter(tx => tx.nature === 'inside_custody').reduce((sum, tx) => sum + tx.amount, 0);
    // nature === 'outside_custody' -> دفعة من المكتب الرئيسي (مسدد)
    const officeTotal = ledgerPayments.filter(tx => tx.nature === 'outside_custody').reduce((sum, tx) => sum + tx.amount, 0);
    const paperTotal = c.paperSettlements || 0;

    const finalPaid = custodyTotal + officeTotal + paperTotal;
    const finalRemaining = netValue - finalPaid;

    return {
      items,
      grossValue,
      totalDiscounts,
      netValue,
      ledgerPayments,
      custodyTotal, // مسحوبات عهدة الموقع
      officeTotal, // دفعة من المكتب الرئيسي (مسدد)
      paperTotal, // تسويات ورقية مقتطعة
      finalPaid,
      finalRemaining
    };
  };

  // Form Work Items manipulation
  const addWorkItem = () => {
    setWorkItems(prev => [...prev, {
      id: `item-${Date.now()}-${Math.random()}`,
      trade: '',
      workVolume: 0,
      unitPrice: 0,
      totalValue: 0,
      discounts: [],
      notes: ''
    }]);
  };

  const removeWorkItem = (itemId: string) => {
    setWorkItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateWorkItem = (itemId: string, updates: Partial<SubcontractorWorkItem>) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        if ('workVolume' in updates || 'unitPrice' in updates) {
          updated.totalValue = (updated.workVolume || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addDiscount = (itemId: string) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const existingDiscounts = item.discounts || [];
        return {
          ...item,
          discounts: [...existingDiscounts, {
            id: `disc-${Date.now()}-${Math.random()}`,
            label: '',
            amount: 0
          }]
        };
      }
      return item;
    }));
  };

  const removeDiscount = (itemId: string, discountId: string) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          discounts: (item.discounts || []).filter(d => d.id !== discountId)
        };
      }
      return item;
    }));
  };

  const updateDiscount = (itemId: string, discountId: string, label: string, amount: number) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          discounts: (item.discounts || []).map(d => {
            if (d.id === discountId) {
               return { ...d, label, amount };
            }
            return d;
          })
        };
      }
      return item;
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('يرجى تحديد اسم مقاول الباطن');
    if (workItems.length === 0) return alert('يرجى إضافة بند أعمال واحد على الأقل للمقاول');

    // Calculate aggregated totals
    let grossTotal = 0;
    let discountTotal = 0;
    workItems.forEach(item => {
      grossTotal += item.totalValue;
      if (item.discounts) {
        item.discounts.forEach(d => {
          discountTotal += d.amount || 0;
        });
      }
    });

    const netValue = grossTotal - discountTotal;
    const paperSettlements = Number(formData.paperSettlements) || 0;

    const tradeNames = workItems.map(item => item.trade).filter(Boolean);
    const summaryTrade = tradeNames.length > 0 ? tradeNames.join('، ') : 'أعمال متنوعة';

    const nextSub: Subcontractor = {
      id: editingId || `sub-${Date.now()}`,
      name: formData.name,
      trade: summaryTrade,
      workVolume: workItems.reduce((acc, it) => acc + (it.workVolume || 0), 0),
      unitPrice: workItems.length > 0 ? (grossTotal / (workItems.reduce((acc, it) => acc + (it.workVolume || 1), 0) || 1)) : 0,
      totalValue: netValue, // Use netValue for compatibility
      paidOffice: 0, // No longer manual, computed dynamically
      paidCustody: 0, // No longer manual, computed dynamically
      paperSettlements,
      remaining: netValue - paperSettlements, // Will be computed fully on the fly in stats
      notes: formData.notes,
      workItems: workItems,
      phone: formData.phone || '',
      contractNumber: formData.contractNumber || ''
    };

    if (editingId) {
      setSubcontractors(prev => prev.map(c => c.id === editingId ? nextSub : c));
    } else {
      setSubcontractors(prev => [...prev, nextSub]);
    }

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      paperSettlements: 0, 
      notes: '',
      phone: '',
      contractNumber: ''
    });
    setWorkItems([{
      id: `item-${Date.now()}`,
      trade: '',
      workVolume: 0,
      unitPrice: 0,
      totalValue: 0,
      discounts: [],
      notes: ''
    }]);
  };

  const startEdit = (c: Subcontractor) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      paperSettlements: c.paperSettlements || 0,
      notes: c.notes || '',
      phone: c.phone || '',
      contractNumber: c.contractNumber || ''
    });

    if (c.workItems && c.workItems.length > 0) {
      setWorkItems(JSON.parse(JSON.stringify(c.workItems)));
    } else {
      setWorkItems([{
        id: `it-legacy-${Date.now()}`,
        trade: c.trade || 'عمل رئيسي',
        workVolume: c.workVolume || 0,
        unitPrice: c.unitPrice || 0,
        totalValue: (c.workVolume || 0) * (c.unitPrice || 0) || c.totalValue || 0,
        discounts: [],
        notes: ''
      }]);
    }
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف حساب هذا المقاول وجميع البنود؟')) {
      setSubcontractors(prev => prev.filter(c => c.id !== id));
    }
  };

  // Aggregate stats over all subcontractors
  let totalStatsGross = 0;
  let totalStatsDiscounts = 0;
  let totalStatsNet = 0;
  let totalStatsPaid = 0;

  subcontractors.forEach(c => {
    const stats = getSubcontractorCalculatedStats(c);
    totalStatsGross += stats.grossValue;
    totalStatsDiscounts += stats.totalDiscounts;
    totalStatsNet += stats.netValue;
    totalStatsPaid += stats.finalPaid;
  });
  const totalStatsRemaining = totalStatsNet - totalStatsPaid;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة مقاولي الباطن</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">متابعة البنود والخصومات المتعددة مع التزامن التام للقيمة مع الحركة المالية</p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="relative z-10 w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-all"
        >
          <Plus size={18} />
          <span>إضافة مقاول جديد</span>
        </motion.button>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">إجمالي الأعمال (Gross)</p>
            <p className="text-lg font-black text-amber-600 font-mono mt-0.5">{totalStatsGross.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">إجمالي الخصومات</p>
            <p className="text-lg font-black text-rose-600 font-mono mt-0.5">{totalStatsDiscounts.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">صافي الأعمال المستحقة (Net)</p>
            <p className="text-lg font-black text-sky-600 font-mono mt-0.5">{totalStatsNet.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">إجمالي المنصرف والمسدد</p>
            <p className="text-lg font-black text-emerald-600 font-mono mt-0.5">{totalStatsPaid.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm md:overflow-visible">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            حسابات مقاولي الباطن والأعمال المنفذة بالتفصيل
          </h2>
        </div>
        
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-100 font-bold text-[11px] border-b border-slate-800 text-center whitespace-nowrap">
                <th className="p-3 text-right pr-5">اسم المقاول</th>
                <th className="p-3">التخصصات والبنود المسندة</th>
                <th className="p-3">قيمة الأعمال (Gross)</th>
                <th className="p-3 text-rose-300">الخصومات للبند</th>
                <th className="p-3 text-sky-300 bg-slate-800">صافي الأعمال (Net)</th>
                <th className="p-3 text-purple-300">تسويات ورقية</th>
                <th className="p-3">إجمالي المسدد (مالي ورقي)</th>
                <th className="p-3">المتبقي الصافي</th>
                <th className="p-3 font-sans">خيارات</th>
              </tr>
            </thead>
            <tbody>
              {subcontractors.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-sm text-slate-500">لا يوجد مقاولين باطن مسجلين بعد.</td></tr>
              ) : (
                subcontractors.map((c) => {
                  const stats = getSubcontractorCalculatedStats(c);

                  return (
                    <React.Fragment key={c.id}>
                      <tr className="border-b border-slate-150 hover:bg-slate-50/60 transition text-center text-xs">
                        <td className="p-3 pr-5 text-right font-black text-slate-900">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span>{c.name}</span>
                              <div className="relative group inline-block">
                                <Info size={13} className="text-slate-400 hover:text-indigo-650 cursor-pointer transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3.5 bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-750 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-250 z-50 text-right text-[11px] leading-relaxed font-normal">
                                  <div className="font-extrabold text-indigo-300 border-b border-slate-700 pb-1.5 mb-2 flex items-center gap-1">
                                    <Info size={11} className="text-indigo-400" />
                                    <span>بيانات تواصل المقاول</span>
                                  </div>
                                  <div className="space-y-1.5 font-sans">
                                    <p className="flex justify-between gap-3 items-center">
                                      <span className="text-slate-400 font-extrabold text-[10px]">رقم الهاتف:</span>
                                      <span className="font-mono text-white text-left font-semibold select-all" dir="ltr">{c.phone || 'غير مسجل'}</span>
                                    </p>
                                    <p className="flex justify-between gap-3 items-center">
                                      <span className="text-slate-400 font-extrabold text-[10px]">رقم العقد:</span>
                                      <span className="font-mono text-white text-left font-semibold select-all" dir="ltr">{c.contractNumber || 'بدون عقد'}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {stats.ledgerPayments.length > 0 && (
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                                ✓ مربوط مالياً بالحركات
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-600 bg-slate-50/30">
                          <div className="text-right text-[10px]">
                            <span className="bg-slate-200/60 text-slate-800 px-2 py-0.5 rounded-full font-bold ml-1.5 inline-block">
                              {stats.items.length} بنود
                            </span>
                            <span className="text-slate-500 truncate max-w-[200px] inline-block align-middle">{c.trade || 'عمل رئيسي'}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 bg-slate-50/50">
                          {stats.grossValue.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/20">
                          {stats.totalDiscounts.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-black text-sky-850 bg-sky-50/30 border-l border-r border-slate-150">
                          {stats.netValue.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-3 font-mono text-purple-700 bg-purple-50/40 font-bold">
                          {stats.paperTotal.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-800 bg-emerald-50/40 text-center">
                          <div className="flex flex-col justify-center items-center">
                            <span>{stats.finalPaid.toLocaleString('ar-EG')} <span className="text-[9px] text-emerald-600">ج.م</span></span>
                            {stats.ledgerPayments.length > 0 && (
                              <span className="text-[9px] text-slate-450 font-normal mt-0.5">
                                ( عهدة: {stats.custodyTotal.toLocaleString('ar-EG')} | رئيسي: {stats.officeTotal.toLocaleString('ar-EG')} )
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`p-3 font-mono font-black ${
                          stats.finalRemaining < 0 
                            ? 'text-rose-600 bg-rose-50/30' 
                            : stats.finalRemaining === 0 
                              ? 'text-slate-400 bg-slate-50' 
                              : 'text-amber-700 bg-amber-50/30'
                        }`}>
                          {stats.finalRemaining.toLocaleString('ar-EG')} <span className="text-[9px]">ج.م</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition"
                              title="تعديل حساب المقاول والبنود"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                              title="تفاصيل البنود والخصومات"
                            >
                              {expandedId === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition"
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded View for multiple Work Items & Discounts */}
                      {expandedId === c.id && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={9} className="p-5 text-right">
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                              {/* Work Items Detail Sheet */}
                              <div>
                                <h4 className="text-xs font-black text-indigo-950 mb-3 flex items-center gap-1.5 border-b border-indigo-50 pb-2">
                                  <FileText size={14} className="text-indigo-650" />
                                  بنود أعمال المقاول وخصوماتها التفصيلية ({stats.items.length} بنود)
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {stats.items.map((item, idx) => {
                                    const itemGross = item.totalValue;
                                    const itemDiscs = item.discounts ? item.discounts.reduce((sum, d) => sum + (d.amount || 0), 0) : 0;
                                    const itemNet = itemGross - itemDiscs;

                                    return (
                                      <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-900 text-xs">{idx + 1}. {item.trade}</span>
                                            <span className="text-[10px] text-slate-440 font-mono">ID: {item.id.substring(0, 8)}</span>
                                          </div>
                                          
                                          <div className="grid grid-cols-3 gap-2 mt-2 bg-white p-2.5 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-600 text-center font-mono">
                                            <div>
                                              <p className="text-[10px] text-slate-400 font-sans">الكمية</p>
                                              <p className="font-bold text-slate-800 mt-0.5">{(item.workVolume || 0).toLocaleString('ar-EG')}</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] text-slate-400 font-sans">الفئة</p>
                                              <p className="font-bold text-slate-800 mt-0.5">{(item.unitPrice || 0).toLocaleString('ar-EG')} ج.م</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] text-slate-400 font-sans">القيمة الاجمالية</p>
                                              <p className="font-bold text-slate-800 mt-0.5">{itemGross.toLocaleString('ar-EG')} ج.م</p>
                                            </div>
                                          </div>

                                          {/* Mini Discounts array */}
                                          <div className="mt-2 text-right">
                                            <p className="text-[10px] text-rose-700 font-black mb-1">الخصومات والاستقطاعات للبند:</p>
                                            {!item.discounts || item.discounts.length === 0 ? (
                                              <p className="text-[10px] text-slate-400 italic">لا توجد خصومات على هذا البند</p>
                                            ) : (
                                              <div className="space-y-1 bg-rose-50/30 p-2 rounded-lg border border-rose-100/30">
                                                {item.discounts.map(d => (
                                                  <div key={d.id} className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                                    <span>• {d.label || 'خصم غير مسمى'}</span>
                                                    <span className="font-mono text-rose-700">{d.amount.toLocaleString('ar-EG')} ج.م</span>
                                                  </div>
                                                ))}
                                                <div className="border-t border-rose-100 pt-1 flex justify-between items-center text-[10px] font-black text-rose-800">
                                                  <span>إجمالي خصم البند</span>
                                                  <span className="font-mono">{itemDiscs.toLocaleString('ar-EG')} ج.م</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-slate-100/60 flex justify-between items-center text-xs font-black">
                                          <span className="text-slate-500">صافي قيمة البند:</span>
                                          <span className="text-sky-850 font-mono">{itemNet.toLocaleString('ar-EG')} ج.م</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Direct payments ledger summary */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                  <h5 className="text-[11px] font-black text-indigo-900 mb-2">الحركات المالية المباشرة والمسحوبات للموقع ({stats.ledgerPayments.length})</h5>
                                  {stats.ledgerPayments.length === 0 ? (
                                    <p className="text-xs text-slate-400 font-medium">لا توجد حركات مالية مسجلة للمقاول بسجل العهدة أو حركة الموقع حتى الآن.</p>
                                  ) : (
                                    <div className="space-y-1.5 max-h-[155px] overflow-y-auto">
                                      {stats.ledgerPayments.map(tx => (
                                        <div key={tx.id} className="flex justify-between text-[11px] items-center p-2 rounded-lg bg-indigo-50/50 border border-indigo-50">
                                          <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-800">{tx.date}</span>
                                              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ${
                                                tx.nature === 'inside_custody' 
                                                  ? 'bg-amber-100 text-amber-800' 
                                                  : 'bg-emerald-100 text-emerald-800'
                                              }`}>
                                                {tx.nature === 'inside_custody' ? 'من العهدة' : 'خارج العهدة'}
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500">{tx.description} - مرجع {tx.referenceNo || 'بدون'}</span>
                                          </div>
                                          <span className="font-mono font-black text-indigo-750">
                                            {tx.amount.toLocaleString('ar-EG')} ج.م
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="bg-purple-50/20 p-4 rounded-xl border border-purple-100">
                                  <h5 className="text-[11px] font-black text-purple-900 mb-2">تحليل المسدد والملاحظات الورقية</h5>
                                  <div className="space-y-2 text-xs font-medium text-slate-700">
                                    <div className="flex justify-between items-center bg-white/75 p-2 rounded-lg border border-slate-100">
                                      <span className="font-bold text-slate-800">دفعة من المكتب الرئيسي (مسدَّد خارج العهدة):</span>
                                      <span className="font-mono font-black text-emerald-700">{stats.officeTotal.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/75 p-2 rounded-lg border border-slate-100">
                                      <span className="font-bold text-slate-800">مسحوبات عهدة الموقع (من العهدة):</span>
                                      <span className="font-mono font-black text-amber-700">{stats.custodyTotal.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/75 p-2 rounded-lg border border-purple-100/40">
                                      <span className="font-bold text-purple-950">تسويات ورقية مقتطعة (يدوية):</span>
                                      <span className="font-mono font-black text-purple-700">{stats.paperTotal.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                    {c.notes && (
                                      <div className="mt-3 pt-2 border-t border-purple-100/40">
                                        <p className="text-[10px] text-slate-450 font-bold mb-0.5">ملاحظات الحساب والتعاقد:</p>
                                        <p className="text-xs text-slate-650 bg-white/65 p-2 rounded border border-purple-50">{c.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-sm font-black flex items-center gap-2">
                <Users size={16} />
                {editingId ? 'تعديل بيانات وحساب وبنود المقاول' : 'إضافة مقاول باطن جديد'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <span className="text-slate-400 hover:text-white">✕</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5 text-right max-h-[85vh] overflow-y-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المقاول / الشركة</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم هاتف التواصل</label>
                  <input
                    type="text"
                    placeholder="مثال: 0100xxxxxxx"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold font-mono text-center"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم العقد (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="مثال: SUB-2026-003"
                    value={formData.contractNumber}
                    onChange={e => setFormData(p => ({ ...p, contractNumber: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold font-mono text-center"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Work Items Manager Section */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-indigo-900 flex items-center gap-1">
                    <FileText size={14} />
                    بنود الأعمال المسندة وقيم الفئات الفنية للمقاول ({workItems.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addWorkItem}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus size={14} />
                    إضافة بند أعمال جديد
                  </button>
                </div>

                {workItems.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-xs text-slate-400 font-bold">
                    ⚠️ لم يتم إضافة بنود أعمال. اضغط على الزر بالجانب لإضافة البند الأول.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {workItems.map((item, index) => {
                      const itemTotal = (item.workVolume || 0) * (item.unitPrice || 0);
                      const discountSum = (item.discounts || []).reduce((acc, d) => acc + (d.amount || 0), 0);

                      return (
                        <div key={item.id} className="p-4 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-200 relative transition-all">
                          <div className="absolute left-3 top-3">
                            <button
                              type="button"
                              onClick={() => removeWorkItem(item.id)}
                              className="p-1 px-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5"
                              title="حذف هذا البند"
                            >
                              <Trash2 size={12} />
                              حذف البند
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 pt-5 md:pt-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">وصف البند / نوع العمل المسند</label>
                              <input
                                type="text"
                                required
                                placeholder="مثال: أعمال صيانة خرسانات، تركيبات صحي..."
                                value={item.trade}
                                onChange={e => updateWorkItem(item.id, { trade: e.target.value })}
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">الكمية المقدرة (حجم الأعمال)</label>
                              <input
                                type="number"
                                step="any"
                                required
                                placeholder="الكمية"
                                value={item.workVolume || ''}
                                onChange={e => updateWorkItem(item.id, { workVolume: parseFloat(e.target.value) || 0 })}
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-mono font-bold text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">الفئة / سعر الوحدة (ج.م)</label>
                              <input
                                type="number"
                                step="any"
                                required
                                placeholder="السعر"
                                value={item.unitPrice || ''}
                                onChange={e => updateWorkItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-mono font-bold text-center"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between text-[11px] bg-slate-100 px-3 py-2 rounded-xl mb-3 gap-1">
                            <div className="flex gap-2">
                              <span className="text-slate-500 font-bold">إجمالي قيمة البند :</span>
                              <span className="font-mono font-black text-slate-850">{itemTotal.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-rose-600 font-bold">إجمالي الخصومات المقتطعة:</span>
                              <span className="font-mono font-black text-rose-700">-{discountSum.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex gap-2 text-sky-850 font-black">
                              <span>صافي البند المعتمد:</span>
                              <span>{(itemTotal - discountSum).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                          </div>

                          {/* Multi Discounts Mini panel */}
                          <div className="bg-white p-3 rounded-xl border border-slate-150">
                            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                              <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                                <Percent size={11} className="text-rose-500" />
                                استقطاعات وخصومات هذا البند ({item.discounts?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => addDiscount(item.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[9px] font-black flex items-center gap-0.5 transition"
                              >
                                <Plus size={10} />
                                إضافة خصم / غرامة للبند
                              </button>
                            </div>

                            {(!item.discounts || item.discounts.length === 0) ? (
                              <div className="text-center py-1 text-[10px] text-slate-400 font-bold italic">
                                لا توجد خصومات على هذا البند
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {item.discounts.map(disc => (
                                  <div key={disc.id} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      placeholder="مثل: تأمين أعمال العقد 5%، خصم غرامة تأخير..."
                                      required
                                      value={disc.label}
                                      onChange={e => updateDiscount(item.id, disc.id, e.target.value, disc.amount)}
                                      className="flex-1 text-[11px] px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 outline-none font-bold"
                                    />
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder="القيمة ج.م"
                                      required
                                      value={disc.amount || ''}
                                      onChange={e => updateDiscount(item.id, disc.id, disc.label, parseFloat(e.target.value) || 0)}
                                      className="w-24 text-[11px] px-2 py-1 bg-rose-50 border border-rose-150 text-rose-900 rounded font-mono font-bold text-center"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeDiscount(item.id, disc.id)}
                                      className="p-1 px-1.5 text-rose-500 hover:text-rose-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                                      title="حذف الخصم"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Overall aggregation view */}
              {workItems.length > 0 && (
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center text-xs font-bold font-mono">
                  <span>إجمالي المقاولة (قبل الخصم): {workItems.reduce((acc, it) => acc + (it.workVolume * it.unitPrice || 0), 0).toLocaleString('ar-EG')} ج.م</span>
                  <span className="text-rose-300">إجمالي الخصومات: {workItems.reduce((acc, it) => acc + (it.discounts || []).reduce((s, d) => s + d.amount, 0), 0).toLocaleString('ar-EG')} ج.م</span>
                  <span className="text-emerald-300 text-sm font-black">الصافي المعتمد: {workItems.reduce((acc, it) => acc + (it.workVolume * it.unitPrice || 0) - (it.discounts || []).reduce((s, d) => s + d.amount, 0), 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}

              {/* Monitored payments from transactions (READONLY) */}
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Lock size={12} className="text-slate-400" />
                  <span>المسحوبات المالية المسددة (متزامنة بالكامل مع الدفتر العام)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const currentName = formData.name;
                    const tempLedger = getSubcontractorPayments(currentName);
                    const tempCustody = tempLedger.filter(tx => tx.nature === 'inside_custody').reduce((s, t) => s + t.amount, 0);
                    const tempOffice = tempLedger.filter(tx => tx.nature === 'outside_custody').reduce((s, t) => s + t.amount, 0);

                    return (
                      <>
                        <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex justify-between">
                            <span>دفعة من المكتب الرئيسي (مسدَّد خارج العهدة)</span>
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-sans">تلقائي من الدفتر</span>
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`${tempOffice.toLocaleString('ar-EG')} ج.م`}
                            className="w-full text-xs p-2 bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-lg text-center cursor-not-allowed font-mono"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">أي حركة صرف مرئية من المكتب الرئيسي ومسجلة باسم المقاول</p>
                        </div>

                        <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex justify-between">
                            <span>مسحوبات عهدة الموقع (من العهدة)</span>
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-sans">تلقائي من الدفتر</span>
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`${tempCustody.toLocaleString('ar-EG')} ج.م`}
                            className="w-full text-xs p-2 bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-lg text-center cursor-not-allowed font-mono"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">أي حركة صرف مباشرة من الموقع منسوبة للعهد ومسجلة باسم المقاول</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Manual Paper Settlements (Only Manual Input Allowed!) */}
              <div className="border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                    <span>تسويات ورقية مقتطعة (إدخال يدوي)</span>
                    <span className="text-[10px] text-purple-650 bg-purple-50 px-2 py-0.5 rounded-full">الوحيد القابل للتعديل اليدوي</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.paperSettlements || ''}
                    placeholder="أدخل قيمة التسويات الورقية كخصم مباشر لمستحقات مقاول الباطن"
                    onChange={e => setFormData(p => ({ ...p, paperSettlements: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs p-2.5 bg-purple-50 hover:bg-purple-50/80 border border-purple-200 focus:border-purple-500 hover:border-purple-300 text-purple-900 rounded-xl font-mono font-bold text-center outline-none transition"
                  />
                  <p className="text-[9px] text-purple-500 font-semibold mt-1">استخدم هذا الحقل لتسجيل المقاصات والمقاولات العائلية أو التسويات الورقية المباشرة</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات و شروط المقاولة</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-20 resize-none font-bold outline-none focus:border-indigo-500"
                  placeholder="اكتب أي ملاحظات أو شروط على مقاولة الباطن..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition text-sm shadow-md shadow-indigo-600/20"
                >
                  حفظ الحساب والبنود المعتمدة
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
