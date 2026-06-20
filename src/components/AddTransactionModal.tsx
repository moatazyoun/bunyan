/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, CreditCard, ArrowRightLeft, Coins } from 'lucide-react';
import { Transaction, ProjectCategory, TransactionType, TransactionNature, PaymentMethod, Subcontractor, EquipmentSummary } from '../types';

interface AddTransactionModalProps {
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  subcontractors: Subcontractor[];
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
  equipmentList: EquipmentSummary[];
}

export default function AddTransactionModal({ 
  onClose, 
  onSave,
  subcontractors = [],
  setSubcontractors,
  equipmentList = []
}: AddTransactionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ProjectCategory>('contractors');
  const [type, setType] = useState<TransactionType>('spent');
  const [nature, setNature] = useState<TransactionNature>('inside_custody');
  const [amount, setAmount] = useState('');
  
  // Equipment selection state
  const [equipmentId, setEquipmentId] = useState('');
  
  // Beneficiary details
  const [recipient, setRecipient] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [knownSuppliers, setKnownSuppliers] = useState<any[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقدى');
  const [referenceNo, setReferenceNo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing suppliers
    const savedSuppliers = localStorage.getItem('bunyan_contractors_report');
    if (savedSuppliers) {
      setKnownSuppliers(JSON.parse(savedSuppliers));
    } else {
      setKnownSuppliers([
        { id: 'c1', name: 'صلاح العجاري' },
        { id: 'c2', name: 'حكيم' }
      ]);
    }
  }, []);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'supplies': return 'التوريدات والمواد';
      case 'equipment': return 'المعدات';
      case 'contractors': return 'مقاولين الباطن';
      case 'fuel': return 'المحروقات والسولار';
      case 'custody': return 'العهد الموقعية';
      default: return cat;
    }
  };

  const currentRecipient = isNewRecipient ? newRecipientName : recipient;
  const autoDescription = `${getCategoryLabel(category)} | ${currentRecipient || 'بدون محدد'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    let finalRecipient = recipient;
    
    if (isNewRecipient) {
      if (!newRecipientName.trim()) {
        setError('يرجى كتابة اسم المستفيد الجديد.');
        return;
      }
      finalRecipient = newRecipientName.trim();
      
      if (category === 'supplies') {
        const newSupplier = {
          id: `c-dyn-${Date.now()}`,
          name: finalRecipient,
          quantity: 0, cost: 0, paidOffice: 0, paidCustody: 0, paperSettlements: 0, remaining: 0, notes: 'أضيف تلقائياً من شاشة الحركات المباشرة كمورد'
        };
        const updatedList = [...knownSuppliers, newSupplier];
        localStorage.setItem('bunyan_contractors_report', JSON.stringify(updatedList));
        setKnownSuppliers(updatedList);
      } else if (category === 'contractors') {
        const newSubcontractor: Subcontractor = {
          id: `sub-dyn-${Date.now()}`,
          name: finalRecipient,
          trade: '', workVolume: 0, unitPrice: 0, totalValue: 0, paidOffice: 0, paidCustody: 0, paperSettlements: 0, remaining: 0, notes: 'أضيف تلقائياً من شاشة الحركات المباشرة كمقاول باطن'
        };
        const updatedList = [...subcontractors, newSubcontractor];
        setSubcontractors(updatedList);
      }
      
      window.dispatchEvent(new Event('storage'));
    } else {
      if (!finalRecipient.trim()) {
        setError('يرجى تحديد المستفيد أو جهة الصرف.');
        return;
      }
    }

    onSave({
      date,
      category,
      type,
      nature,
      amount: numericAmount,
      recipient: finalRecipient,
      paymentMethod: type === 'spent' ? paymentMethod : undefined,
      referenceNo: referenceNo.trim() || undefined,
      equipmentId: category === 'equipment' ? equipmentId : undefined,
      description: autoDescription
    });
  };

  // Determine current step index for the side stepper (based on user inputs)
  const isStep1Done = date && category && nature;
  const isStep2Done = isStep1Done && amount && (isNewRecipient ? newRecipientName : recipient);
  const isStep3Done = isStep2Done && (type !== 'spent' || paymentMethod);

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
      <div 
        className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-right"
        id="add-transaction-modal-inner"
      >
        
        {/* Sidebar Visual - Matches the requested card style */}
        <div className="hidden md:flex md:w-64 bg-slate-50 p-8 flex-col justify-between border-l border-slate-100 flex-shrink-0">
          <div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 w-fit mb-6 shadow-sm">
              <CreditCard className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black mb-2 text-slate-800 leading-tight">تسجيل حركة</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              نظام الضبط المالي والقيود المباشرة لموازنة حسابات التوريد والعهد بدقة كاملة.
            </p>
          </div>

          {/* Connected Stepper with precise active boundaries */}
          <div className="space-y-4 text-[10px] font-black text-slate-400">
            <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${isStep1Done ? 'border-emerald-500 text-emerald-600' : 'border-indigo-500 text-indigo-600'}`}>
              1. طبيعة وتاريخ الحركة
            </div>
            <div className={`flex items-center gap-2 border-r-2 pr- pr-2 transition-colors duration-150 ${isStep2Done ? 'border-emerald-500 text-emerald-600' : isStep1Done ? 'border-indigo-400 text-slate-700' : 'border-slate-200'}`}>
              2. جهة المستفيد والمبلغ
            </div>
            <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${isStep3Done ? 'border-emerald-500 text-emerald-600' : isStep2Done ? 'border-indigo-400 text-slate-700' : 'border-slate-200'}`}>
              3. طريقة السداد والتكويد
            </div>
          </div>
        </div>

        {/* Main Content Form Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
            <h3 className="text-lg font-black text-slate-900">تسجيل قيد أو حركة مالية جديدة</h3>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            <form id="transaction-form" onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: طبيعة الحركة والبند */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3">
                  تاريخ وطبيعة الحركة المالية
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Transaction Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-1">تاريخ الحركة *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-1">البند / التصنيف الفرعي *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="contractors">مقاولين الباطن</option>
                      <option value="supplies">التوريدات والمواد</option>
                      <option value="equipment">المعدات</option>
                      <option value="fuel">المحروقات والسولار</option>
                      <option value="custody">العهد الموقعية</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Transaction Nature */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-1">طبيعة المعاملة والمصدر الرئيسي *</label>
                    <select
                      value={nature}
                      onChange={(e) => setNature(e.target.value as TransactionNature)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="inside_custody">عهدة الموقع 💼</option>
                      <option value="outside_custody">المكتب الرئيسي 🏛️</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: المستفيد والماليات */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r-4 border-emerald-500 pr-3">
                  المستفيد والماليات
                </h4>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4">
                  
                  {/* Amount of record */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-1">المبلغ وبالتفاصيل الميدانية لإجمالي القيد (ج.م) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 text-left font-mono"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                        جنيه مصري
                      </span>
                    </div>
                  </div>

                  {/* Beneficiary recipient selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-1">المستفيد / جهة الصرف المتأثرة *</label>
                    
                    {category === 'equipment' ? (
                      <div className="flex gap-2">
                        <select
                          required
                          value={equipmentId}
                          onChange={(e) => {
                            setEquipmentId(e.target.value);
                            const eq = equipmentList.find(item => item.id === e.target.value);
                            if (eq) setRecipient(eq.name);
                          }}
                          className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10"
                        >
                          <option value="" disabled>-- اختر المعدة من القائمة --</option>
                          {equipmentList.map((eq) => (
                            <option key={eq.id} value={eq.id}>{eq.name} ({eq.driver})</option>
                          ))}
                        </select>
                      </div>
                    ) : !isNewRecipient ? (
                      <div className="flex gap-2.5">
                        <select
                          required
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          className="flex-1 w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10"
                        >
                          <option value="" disabled>-- اختر من القائمة المرتبطة --</option>
                          {(category === 'contractors' ? subcontractors : category === 'supplies' ? knownSuppliers : [...subcontractors, ...knownSuppliers]).map((c) => (
                            <option key={c.id || c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsNewRecipient(true)}
                          className="flex items-center justify-center gap-1.5 bg-white border border-slate-250 hover:border-emerald-500 hover:text-emerald-700 px-5 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer shadow-xs"
                        >
                          <Plus size={15} /> جهة جديدة
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 relative">
                        <input
                          type="text"
                          required
                          placeholder="اكتب اسم المستفيد الجديد..."
                          value={newRecipientName}
                          onChange={(e) => setNewRecipientName(e.target.value)}
                          className="flex-1 w-full p-4 bg-white border border-emerald-300 rounded-2xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewRecipient(false);
                            setNewRecipientName('');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 rounded-2xl text-xs font-black transition cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mr-1 mt-1">
                      يجري الربط الديناميكي مع كشوف التقرير الرئيسي بالأعلى ودفاتر التسويات الميدانية.
                    </p>
                  </div>

                </div>
              </div>

              {/* Section 3: طريقة الدفع والتأكيد */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3">
                  طريقة السداد والتكويد
                </h4>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Method */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 mr-1">طريقة الدفع *</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="نقدى">نقدى</option>
                        <option value="شيك">شيك</option>
                        <option value="تحويل بنكى">تحويل بنكى</option>
                        <option value="انستا">انستا</option>
                        <option value="فودافون كاش">فودافون كاش</option>
                        <option value="اخرى">اخرى</option>
                      </select>
                    </div>

                    {/* Reference No */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 mr-1">رقم السند / الشيك / الحوالة</label>
                      <input
                        type="text"
                        placeholder="رقم المرجع (اختياري)"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-left"
                      />
                    </div>
                  </div>

                  {/* Auto-Description / Coding */}
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-black text-slate-500 mr-1">التكويد الذكي ووصف المعاملة</label>
                    <input
                      readOnly
                      value={autoDescription}
                      className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-500 focus:outline-none cursor-not-allowed text-center"
                    />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer Action Bar */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-4 bg-white flex-shrink-0 flex-row-reverse">
            <button
              type="submit"
              form="transaction-form"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer border border-slate-200"
            >
              إلغاء التراجع
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
