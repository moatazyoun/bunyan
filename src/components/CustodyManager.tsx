/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  UserPlus, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  User,
  Check,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { CustodyRecord, Transaction } from '../types';

interface CustodyManagerProps {
  custodies: CustodyRecord[];
  transactions: Transaction[];
  onAddCustody: (name: string, amount: number, notes?: string) => void;
  onSettleCustody: (id: string, amount: number, notes: string) => void;
}

export default function CustodyManager({ custodies, transactions, onAddCustody, onSettleCustody }: CustodyManagerProps) {
  // Manual petty cash creation states
  const [newEngineer, setNewEngineer] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Settlement states
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // Search & Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('all');
  
  // Detail selection - defaults to the first custodian if available
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localResetCounter, setLocalResetCounter] = useState(0);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Set default selection when custodies load
  useEffect(() => {
    if (custodies.length > 0 && !selectedEngineerId) {
      setSelectedEngineerId(custodies[0].id);
    }
  }, [custodies]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amt = parseFloat(newAmount);
    if (!newEngineer.trim() || isNaN(amt) || amt <= 0) {
      setError('يرجى كتابة اسم المهندس وإدخال مبلغ عهدة صحيح أكبر من الصفر.');
      return;
    }

    onAddCustody(newEngineer.trim(), amt, newNotes.trim());
    setSuccess(`تم بنجاح صرف واعتماد عهدة بقيمة ${formatCurrency(amt)} للمهندس/المشرف: ${newEngineer.trim()}.`);
    setNewEngineer('');
    setNewAmount('');
    setNewNotes('');

    // Select the new engineer to show their ledger statement
    setTimeout(() => {
      const latest = custodies[custodies.length - 1];
      if (latest) setSelectedEngineerId(latest.id);
    }, 100);
  };

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingId) return;

    const amt = parseFloat(settleAmount);
    const target = custodies.find(c => c.id === settlingId);
    
    if (isNaN(amt) || amt <= 0 || !settleNotes.trim()) {
      alert('يرجى كتابة مبلغ تسوية صحيحة ومبررات ومستندات الفحص.');
      return;
    }

    const proceedSettle = () => {
      onSettleCustody(settlingId, amt, settleNotes.trim());
      setSuccess(`تم تسجيل تصفية مستندية بمبلغ ${formatCurrency(amt)} بنجاح لمصلحة حساب العهدة.`);
      setSettlingId(null);
      setSettleAmount('');
      setSettleNotes('');
    };

    if (target && amt > target.remaining) {
      setConfirmState({
        isOpen: true,
        title: 'تجاوز رصيد العهدة المتبقي',
        message: `تحذير: مبلغ التسوية (${formatCurrency(amt)}) أكبر من المتبقي المالي في ذمة المهندس (${formatCurrency(target.remaining)}). هل تريد الاستمرار في حفظ هذا التصفية بالكامل؟`,
        onConfirm: proceedSettle
      });
    } else {
      proceedSettle();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  // Calculations for overall overview
  const totalGiven = custodies.reduce((sum, c) => sum + c.totalGiven, 0);
  const totalSettled = custodies.reduce((sum, c) => sum + c.totalSettled, 0);
  const totalRemaining = custodies.reduce((sum, c) => sum + c.remaining, 0);
  const settlementPercentage = totalGiven > 0 ? Math.round((totalSettled / totalGiven) * 100) : 0;

  // Filter & Search Logic
  const filteredCustodies = custodies.filter(cust => {
    const matchesSearch = cust.engineerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (cust.notes && cust.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'active') {
      return matchesSearch && cust.remaining > 0;
    }
    if (statusFilter === 'settled') {
      return matchesSearch && cust.remaining === 0;
    }
    return matchesSearch;
  });

  // Load selected engineer details
  const currentSelectedEngineer = custodies.find(c => c.id === selectedEngineerId) || custodies[0];

  // Generate dynamic statement of account from global transactions
  const getSelectedEngineerStatement = () => {
    if (!currentSelectedEngineer) return [];
    const engName = currentSelectedEngineer.engineerName;
    
    // Clean search name for partial match
    const cleanName = engName.replace('م.', '').replace('المهندس', '').trim().split(' ')[0];

    // Read custody transactions related to that engineer
    return transactions.filter(tx => {
      const isCustodyCat = tx.category === 'custody';
      const cleanSearchName = (cleanName || '').toLowerCase();
      const engSearchName = (engName || '').toLowerCase();
      const txRecipient = (tx.recipient || '').toLowerCase();
      const txDesc = (tx.description || '').toLowerCase();

      const matchesRecipient = txRecipient.includes(cleanSearchName) || 
                               txRecipient.includes(engSearchName);
      const matchesDesc = txDesc.includes(cleanSearchName) || 
                          txDesc.includes(engSearchName);
      
      return isCustodyCat && (matchesRecipient || matchesDesc);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first
  };

  const statementTransactions = getSelectedEngineerStatement();

  return (
    <div className="space-y-6" id="custody-manager-redesigned-dashboard">
      
      {/* Dynamic Summary KPIs & Settlement Visual Progress */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl translate-x-16 translate-y-16"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 md:max-w-xl text-right">
            <span className="px-2.5 py-1 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-full font-bold border border-indigo-500/30">شريط رقابة التدفقات النقدية</span>
            <h3 className="font-black text-xl md:text-2xl mt-2 tracking-tight">منظومة تدقيق العهد والتصفية المستندية المقاصة</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تحليل وتسوية عهد المهندسين المشرفين ميدانياً والمرحلة تِباقاً بالموقع. نقوم هنا بمقاصة المدفوعات المسلّمة مقابل فواتير الأشغال المنفذة لتحقيق الشفافية الفورية.
            </p>
          </div>

          {/* Core Settlement Progress Indicator */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[200px] text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-bold mb-1">معدل التصفية بالموقع (Settlement Ratio)</span>
            <div className="relative flex items-center justify-center">
              {/* Sleek gauge styling */}
              <div className="text-3xl font-black text-emerald-400 font-mono sm:text-4xl">
                {settlementPercentage}%
              </div>
            </div>
            <div className="w-full mt-3 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000" 
                style={{ width: `${settlementPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-2 font-medium">تسوية فواتير مطابقة لقيم العهد الكلية</span>
          </div>
        </div>

        {/* 3 High-density counter metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 relative z-10">
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">إجمالي العهد المصروفة للمشرفين</span>
              <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg"><Briefcase size={14} /></span>
            </div>
            <span className="block text-2xl font-black text-slate-100 font-mono mt-2">{formatCurrency(totalGiven)}</span>
            <span className="block text-[10px] text-slate-400 mt-1">مسجلة في الدفاتر منذ إطلاق المشروع</span>
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold">إجمالي المصفى والمسوى مستندياً</span>
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle2 size={14} /></span>
            </div>
            <span className="block text-2xl font-black text-emerald-400 font-mono mt-2">{formatCurrency(totalSettled)}</span>
            <span className="block text-[10px] text-slate-400 mt-1">فواتير شراء ومستندات أعمال تم اعتمادها</span>
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-indigo-400 font-bold">باقي السيولة المعلقة في الموقع</span>
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><RefreshCw size={14} className="animate-spin-slow" /></span>
            </div>
            <span className="block text-2xl font-black text-indigo-350 font-mono mt-2">{formatCurrency(totalRemaining)}</span>
            <span className={`block text-[10px] mt-1 ${totalRemaining > 150000 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
              {totalRemaining > 150000 ? '⚠️ تنبيه: مطلوب مراجعة تصفية عاجلة' : 'الرصيد المفتوح ضمن النطاق الآمن'}
            </span>
          </div>
        </div>
      </div>

      {/* Info messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl flex items-center gap-2.5 text-emerald-800 font-semibold text-xs animate-fadeIn text-right justify-start">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Board Split Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Column 1: Left Pane - Custodian lists, search and card widgets */}
        <div className="xl:col-span-1 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Title & Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <BookOpen size={16} className="text-slate-500" />
                  قائمة حسابات العهد والذمم
                </h4>
                <span className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-600 font-black rounded-full">
                  {filteredCustodies.length} ذمة
                </span>
              </div>

              {/* Dynamic Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم المهندس أو البيان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-2.5 pr-8 border border-slate-200 rounded-lg text-right text-slate-800 focus:outline-none focus:border-indigo-600"
                />
                <Search size={14} className="absolute right-2.5 top-3.5 text-slate-400" />
              </div>

              {/* Filtering tabs */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-150">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 text-[10.5px] font-bold py-1.5 px-2 rounded-md transition ${statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 text-[10.5px] font-bold py-1.5 px-2 rounded-md transition ${statusFilter === 'active' ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-100'}`}
                >
                  العهد المفتوحة
                </button>
                <button
                  onClick={() => setStatusFilter('settled')}
                  className={`flex-1 text-[10.5px] font-bold py-1.5 px-2 rounded-md transition ${statusFilter === 'settled' ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-100'}`}
                >
                  تمت التصفية
                </button>
              </div>
            </div>

            {/* Engineer Profile Cards View */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredCustodies.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">لا يوجد حسابات تطابق خيارات الاستعلام</p>
                </div>
              ) : (
                filteredCustodies.map(cust => {
                  const isSelected = selectedEngineerId === cust.id;
                  const percent = cust.totalGiven > 0 ? Math.round((cust.totalSettled / cust.totalGiven) * 100) : 0;
                  
                  // Extract initials
                  const initials = cust.engineerName.replace('م.', '').replace('المهندس', '').trim().substring(0, 2);

                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedEngineerId(cust.id)}
                      className={`p-4 rounded-xl border transition-all text-right cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? 'bg-indigo-50/70 border-indigo-300/80 shadow-md ring-1 ring-indigo-500/10' 
                          : 'bg-white border-slate-200 hover:bg-slate-50/40 hover:border-slate-200'
                      }`}
                    >
                      {/* Avatar & Identifiers */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          {/* Intials avatar bubble */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] border leading-none ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-700' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <span className="block text-xs font-black text-slate-800 leading-tight">{cust.engineerName}</span>
                            {cust.remaining > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded mt-1">
                                عهدة نشطة معلقة
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 rounded mt-1">
                                تمت التسوية ✓
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight size={14} className={`text-slate-400 transition-transform ${isSelected ? 'translate-x--1 text-indigo-600' : 'group-hover:translate-x--1'}`} />
                      </div>

                      {/* Financial visual bar */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="font-mono">تم التصفية: {percent}%</span>
                          <span>المتبقي طرف المهندس</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] font-black font-mono text-slate-900">{formatCurrency(cust.remaining)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">من أصل {formatCurrency(cust.totalGiven)}</span>
                        </div>

                        {/* Small micro bar */}
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full transition-all ${cust.remaining === 0 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Notes snippet */}
                      {cust.notes && (
                        <p className="text-[9.5px] text-slate-400 font-medium mt-2 bg-slate-50/60 p-1.5 rounded truncate">
                          {cust.notes}
                        </p>
                      )}

                      {/* Direct Clickable Quick Buttons on Card */}
                      <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-slate-100/80">
                        {cust.remaining > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSettlingId(cust.id);
                              setSettleAmount(String(cust.remaining));
                              setSettleNotes(`مستندات تصفية العهدة المعلقة لـ ${cust.engineerName}`);
                            }}
                            type="button"
                            className="flex-1 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold rounded-lg select-none transition text-center"
                          >
                            تصفية فورية
                          </button>
                        ) : (
                          <span className="flex-1 text-[9px] text-emerald-600 font-bold bg-emerald-50/50 py-1 rounded inline-block text-center border border-emerald-100">
                            حساب مصفى تماماً ✓
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setError('');
                            setNewEngineer(cust.engineerName);
                            setNewAmount('50000');
                            setNewNotes('شحن إضافي لتغطية نفقات بند التوريدات...');
                            // scroll or alert to guide focus
                          }}
                          type="button"
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition"
                        >
                          تمويل +
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Quick Cash injection form / Creation form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center gap-1.5">
              <UserPlus size={16} className="text-indigo-600" />
              صرف عهدة نقدية للمشرفين
            </h4>

            {error && (
              <div className="bg-rose-50 border border-rose-150 p-2.5 rounded-lg flex items-center gap-2 text-rose-700 text-[10.5px] font-bold mb-3 text-right">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">اسم المشرف أو المهندس المسؤول</label>
                <input
                  type="text"
                  required
                  placeholder="م. أحمد السيد"
                  value={newEngineer}
                  onChange={(e) => setNewEngineer(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">القيمة المالية المصروفة (جنيه مصري)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-left font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">الغرض:</label>
                <textarea
                  rows={2}
                  placeholder="مثال: عهدة طوارئ عاجلة..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 resize-none focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white font-black rounded-lg text-xs hover:bg-slate-800 active:scale-95 transition shadow-xs"
              >
                <Plus size={14} />
                صرف وتسليم رزمة العهدة
              </button>
            </form>
          </div>

        </div>

        {/* Column 2 & 3: Middle & Right Pane - Dynamic Statement & Reset Forms */}
        <div className="xl:col-span-2 space-y-4">
          
          {currentSelectedEngineer ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Profile details header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 text-right">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></div>
                    <h3 className="font-black text-slate-900 text-base">{currentSelectedEngineer.engineerName}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">البيان الحالي للذمة: {currentSelectedEngineer.notes || 'لا يوجد ملاحظات إضافية'}</p>
                </div>

                {/* mini numerical items */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-center font-mono max-w-full md:max-w-md">
                  <div className="px-2">
                    <span className="block text-[9px] text-slate-400 font-bold">المستلم</span>
                    <span className="text-xs font-bold text-slate-800">{formatCurrency(currentSelectedEngineer.totalGiven)}</span>
                  </div>
                  <div className="px-2 border-r border-slate-200">
                    <span className="block text-[9px] text-slate-400 font-bold">المسوى</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(currentSelectedEngineer.totalSettled)}</span>
                  </div>
                  <div className="px-2 border-r border-slate-200">
                    <span className="block text-[9px] text-slate-400 font-bold">المتبقي</span>
                    <span className="text-xs font-extrabold text-indigo-700">{formatCurrency(currentSelectedEngineer.remaining)}</span>
                  </div>
                </div>
              </div>

              {/* Bank-Style Statement Log (كشف الحركة المستندي والتسويات) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 font-black border border-indigo-100 rounded">دفتر الأستاذ التفصيلي للعهدة</span>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <FileText size={16} className="text-slate-400" />
                    كشف حركة وتسويات العهدة الموقعية
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right divide-y divide-slate-100 text-[11.5px] font-sans">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">نوع الحركة ومستند الصيد</th>
                        <th className="p-3">تفاصيل المعاملة والأعمال</th>
                        <th className="p-3 text-left">خصم من الذمة ( clearance )</th>
                        <th className="p-3 text-left">قيد مالي للعهدة ( funding )</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {statementTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">
                             لا يوجد حركات متممة أو إيصالات تسوية مسجلة باسم هذا المشرف بعد.
                             <p className="text-[10px] text-slate-300 font-normal mt-1">أي تسوية يدوية تتم في الأسبوع سيتم تفريغها ونمذجتها هنا تلقائياً.</p>
                          </td>
                        </tr>
                      ) : (
                        statementTransactions.map((tx) => {
                          const isSettledBill = tx.type === 'executed_work';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500">
                                <div>{tx.date}</div>
                                <div className="text-[9px] text-indigo-550/85 mt-0.5" title="الرمز المرجعي">Ref: {tx.id}</div>
                              </td>
                              <td className="p-3">
                                {isSettledBill ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                                    <ArrowDownLeft size={10} />
                                    تصفية أوراق فواتير
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                                    <ArrowUpRight size={10} />
                                    شحن صك العهدة
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-800 font-bold leading-relaxed">
                                <div>{tx.description}</div>
                                {tx.paymentMethod && <span className="block text-[9px] text-slate-400 mt-0.5 font-sans">طريقة التحصيل: {tx.paymentMethod}</span>}
                              </td>
                              <td className="p-3 font-mono font-bold text-left text-emerald-600 text-xs">
                                {isSettledBill ? `+ ${formatCurrency(tx.amount)}` : '—'}
                              </td>
                              <td className="p-3 font-mono font-bold text-left text-slate-800 text-xs">
                                {!isSettledBill ? `- ${formatCurrency(tx.amount)}` : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-[11px] text-slate-600 leading-normal text-right">
                  <span>
                     💡 كشف حساب العهدة مصمم لمحاكاة السجلات الورقية الرسمية للتأكد من مطابقة جميع الفواتير والمصروفات المقدمة من اللجان المشتركة.
                  </span>
                  <span className="font-bold text-indigo-700 font-mono whitespace-nowrap mr-2">تحديث فوري</span>
                </div>
              </div>

              {/* Settlement submission pane */}
              {settlingId ? (
                <div className="bg-amber-50/20 border border-amber-300 p-5 rounded-2xl space-y-4 animate-scaleUp">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-amber-600" />
                      إتمام تصفية مستندية للذمة المالية
                    </h4>
                    <span className="text-[10px] text-amber-800 font-bold">نموذج تصفية معتمد</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تقوم الآن بإغلاق وتسجيل مبالغ تسوية لفواتير قدمها المهندس: <span className="font-bold text-slate-900">{custodies.find(c => c.id === settlingId)?.engineerName}</span>. يرجى إدخال المبلغ تصفية دقيق لتوثيقه بجدول الحركات المالي.
                  </p>

                  <form onSubmit={handleSettle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">المبلغ المراد غلقه وتسويته بفواتير (جنيه)</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        placeholder="0.00"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 text-left font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">البيان:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثل: تصفية فواتير أو مصاريف..."
                        value={settleNotes}
                        onChange={(e) => setSettleNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500 text-slate-800"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSettlingId(null)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs border border-slate-200 transition"
                      >
                        إلغاء التصفية
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition active:scale-95 shadow-sm"
                      >
                        اعتماد وتزحيف التصفية المستندية
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-500 font-mono text-xs">
                   انقر فوق زر "تصفية فورية" على أي بطاقة مشرف مالي لفتح نافذة التسوية المباشرة.
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Briefcase size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">يرجى تسجيل وصرف عهدة نقدية للمشرفين أولاً ليظهر بيان الحركات</p>
            </div>
          )}

        </div>

      </div>

      {/* Custom Confirmation Modal (Bypasses sandboxed iframe native dialog blocks) */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <span className="text-indigo-600 font-extrabold flex items-center gap-1.5 text-sm">
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                تأكيد وبدء التصفية
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
