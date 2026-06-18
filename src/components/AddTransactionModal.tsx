/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus } from 'lucide-react';
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
  const [description, setDescription] = useState('');
  
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
      
      // Dispatch storage event to trigger cross tab / component updates if needed
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-right"
        id="add-transaction-modal-inner"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-base">تسجيل قيد أو حركة مالية جديدة</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200/60 p-3 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Transaction Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الحركة</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">البند</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="supplies">التوريدات والمواد</option>
                <option value="equipment">المعدات</option>
                <option value="contractors">مقاولين الباطن</option>
                <option value="fuel">المحروقات والسولار</option>
                <option value="custody">العهد الموقعية</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Transaction Nature */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">طبيعة المعاملة (التصنيف الأساسي)</label>
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value as TransactionNature)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="inside_custody">داخل العهدة 💼</option>
                <option value="outside_custody">خارج العهدة 🏛️</option>
              </select>
            </div>
          </div>

          {/* Amount and Additional info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المبلغ وبالتفاصيل الميدانية لإجمالي القيد</label>
            <div className="flex gap-4">
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-left font-mono"
              />
            </div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المستفيد / جهة التوريد أو مقول الباطن</label>
            {category === 'equipment' ? (
              <div className="flex gap-2">
                <select
                  value={equipmentId}
                  onChange={(e) => {
                    setEquipmentId(e.target.value);
                    const eq = equipmentList.find(item => item.id === e.target.value);
                    if (eq) setRecipient(eq.name);
                  }}
                  className="flex-1 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>-- اختر المعدة من القائمة --</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.driver})</option>
                  ))}
                </select>
              </div>
            ) : !isNewRecipient ? (
              <div className="flex gap-2">
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>-- اختر من القائمة المرتبطة --</option>
                  {(category === 'contractors' ? subcontractors : category === 'supplies' ? knownSuppliers : [...subcontractors, ...knownSuppliers]).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsNewRecipient(true)}
                  className="flex items-center gap-1 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap"
                >
                  <Plus size={14} /> جديد
                </button>
              </div>
            ) : (
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  placeholder="اكتب اسم المستفيد الجديد..."
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="flex-1 w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRecipient(false);
                    setNewRecipientName('');
                  }}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">الربط مع شيت التوريدات ومقاولي الباطن لسهولة الفلترة والترحيل.</p>
          </div>

          {/* Spent optional fields */}
          {type === 'spent' && (
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="نقدى">نقدى</option>
                  <option value="شيك">شيك</option>
                  <option value="تحويل بنكى">تحويل بنكى</option>
                  <option value="انستا">انستا</option>
                  <option value="فودافون كاش">فودافون كاش</option>
                  <option value="اخرى">اخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم السند / الشيك / الحوالة</label>
                <input
                  type="text"
                  placeholder="رقم المرجع (اختياري)"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 font-mono text-left"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">التكويد</label>
            <input
              readOnly
              value={autoDescription}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
            >
              إلغاء التراجع
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 border border-emerald-400 active:scale-95 transition"
            >
              <Save size={15} />
              حفظ وتعميد المعاملة
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
