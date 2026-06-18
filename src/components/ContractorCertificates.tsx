/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  HardHat, 
  Plus, 
  Coins, 
  FileCheck2, 
  TrendingUp, 
  Maximize2, 
  UserPlus, 
  AlertCircle 
} from 'lucide-react';
import { ContractorCertificate } from '../types';

interface ContractorCertificatesProps {
  contractors: ContractorCertificate[];
  onAddSubcontractor: (name: string, trade: string, totalValue: number) => void;
  onAddWorkCertificate: (id: string, amount: number, description: string) => void;
  onPayContractor: (id: string, amount: number, method: string, ref: string, description: string) => void;
}

export default function ContractorCertificates({ 
  contractors, 
  onAddSubcontractor, 
  onAddWorkCertificate,
  onPayContractor
}: ContractorCertificatesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subTrade, setSubTrade] = useState('');
  const [subValue, setSubValue] = useState('');

  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'work' | 'pay' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('تحويل نقدي');
  const [referenceNo, setReferenceNo] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(subValue);
    if (!subName.trim() || !subTrade.trim() || isNaN(val) || val <= 0) {
      alert('يرجى ملء جميع الخانات بشكل صحيح وقيمة عقد صالحة.');
      return;
    }
    onAddSubcontractor(subName.trim(), subTrade.trim(), val);
    setSubName('');
    setSubTrade('');
    setSubValue('');
    setShowAddForm(false);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubId || !actionType) return;

    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0 || !notesInput.trim()) {
      alert('يرجى كتابة مبلغ صحيح ووصف مبرر فني للعملية.');
      return;
    }

    if (actionType === 'work') {
      onAddWorkCertificate(activeSubId, amt, notesInput.trim());
    } else {
      onPayContractor(activeSubId, amt, paymentMethod, referenceNo.trim(), notesInput.trim());
    }

    setActiveSubId(null);
    setActionType(null);
    setAmountInput('');
    setNotesInput('');
    setReferenceNo('');
  };

  const selectedSub = contractors.find(c => c.id === activeSubId);

  return (
    <div className="space-y-6" id="contractor-certificates-container">
      {/* Upper info panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">دفتر مستخلصات ومقاسات مقاولي الباطن</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">تتبع دقيق للعقود الحالية وأعمال الحفر، الهيكل الخرساني والتشغيل، لحل وإثبات الحسابات المتبقية.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition self-start lg:self-auto"
          id="new-sub-btn"
        >
          <UserPlus size={15} />
          {showAddForm ? 'إلغاء النافذة' : 'تسجيل مقاول باطن جديد'}
        </button>
      </div>

      {/* Grid of contractors & forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subcontractor list view */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">قائمة المقاولين المعتمدين بالموقع</h4>

          {showAddForm && (
            <form onSubmit={handleCreateSub} className="p-4 bg-slate-50 border border-slate-250 rounded-lg space-y-3.5 animate-fadeIn">
              <h5 className="font-bold text-xs text-slate-800">إضافة مقاول باطن واعتماد قيمة العقد الأساسي</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-550 font-bold mb-1">اسم المقاول / الشركة</label>
                  <input
                    type="text"
                    required
                    placeholder="مجموعة الفارعة للإنشاءات"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-550 font-bold mb-1">التخصص والأعمال الموكلة</label>
                  <input
                    type="text"
                    required
                    placeholder="نجارة وحدادة وخرسانة مسلحة"
                    value={subTrade}
                    onChange={(e) => setSubTrade(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-550 font-bold mb-1">القيمة الإجمالية للعقد المبرم</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={subValue}
                    onChange={(e) => setSubValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 text-left font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition"
                >
                  حفظ وتسجيل المقاول
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {contractors.map((sub) => {
              // Remaining progress calculation
              const remainingToPay = sub.executedWorkValue - sub.totalPaid;
              return (
                <div 
                  key={sub.id} 
                  className="p-4 border border-slate-200 rounded-xl hover:border-slate-350 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  id={`sub-card-${sub.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-650">
                        <HardHat size={16} />
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm">{sub.contractorName}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{sub.trade}</p>
                    <p className="text-[10px] text-slate-400">
                      القيمة الكلية للعقد الاسترشادي: <span className="font-mono font-bold text-slate-600">{formatCurrency(sub.totalValue)}</span>
                    </p>
                  </div>

                  {/* Financial levels */}
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="text-right">
                      <span className="block text-[9.5px] text-slate-400 font-bold mb-0.5">القيمة المنفذة (مستخلصات)</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(sub.executedWorkValue)}</span>
                    </div>

                    <div className="text-right border-r border-slate-100 pr-4">
                      <span className="block text-[9.5px] text-slate-400 font-bold mb-0.5">المنصرف الفعلي (الكاش)</span>
                      <span className="font-mono font-bold text-slate-700">{formatCurrency(sub.totalPaid)}</span>
                    </div>

                    <div className="text-right border-r border-slate-100 pr-4">
                      <span className="block text-[9.5px] text-slate-400 font-bold mb-0.5">الرصيد المتبقي له طرفنا</span>
                      <span className={`font-mono font-bold ${remainingToPay > 0 ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}`}>
                        {formatCurrency(remainingToPay)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Triggers */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveSubId(sub.id);
                        setActionType('work');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-semibold hover:bg-indigo-600 hover:text-white transition"
                      id={`action-work-${sub.id}`}
                    >
                      <FileCheck2 size={13} />
                      تنزيل أعمال
                    </button>
                    <button
                      onClick={() => {
                        setActiveSubId(sub.id);
                        setActionType('pay');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                      id={`action-pay-${sub.id}`}
                    >
                      <Coins size={13} />
                      صرف دفعة كاش
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating details form for registering works/receipts */}
        <div>
          {activeSubId && actionType ? (
            <div className="bg-white text-slate-805 p-5 rounded-xl border border-indigo-200 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-indigo-700 flex items-center gap-2">
                {actionType === 'work' ? 'إثبات أعمال منفذة جديدة بالموقع' : 'تحرير وصرف دفعة لوزانة الحساب'}
              </h4>
              <p className="text-[11px] text-slate-500">
                المقاول المحدد: <span className="font-bold text-slate-800 block mt-0.5">{selectedSub?.contractorName}</span>
              </p>

              <form onSubmit={handleActionSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-650 mb-1">
                    {actionType === 'work' ? 'قيمة المستخلص المنجز (جنيه)' : 'مبلغ الدفعة المصروفة (جنيه)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 text-left font-mono"
                  />
                </div>

                {actionType === 'pay' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">طريقة الدفع</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-105 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="نقدًا">نقدًا كاش</option>
                        <option value="شيك بنكي">شيك بنكي</option>
                        <option value="تحويل نقدي">تحويل نقدي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">رقم المرجع / الشيك</label>
                      <input
                        type="text"
                        placeholder="CHQ-..."
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-105 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 focus:outline-none font-mono text-left"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">البيان:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="الأعمال المنفذة المعتمدة..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-650 text-white font-bold rounded-lg text-xs hover:bg-indigo-600 hover:shadow-sm transition"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubId(null);
                      setActionType(null);
                      setAmountInput('');
                      setNotesInput('');
                    }}
                    className="px-3.5 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-indigo-50/40 p-5 rounded-xl border border-indigo-150 space-y-3.5 text-right">
              <div className="bg-indigo-100 p-2 text-indigo-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">منهجية المطابقة التلقائية</h5>
              <p className="text-[11px] text-slate-600 leading-normal">
                بموجب كود النظام المالي المتكامل، عند تسجيل مستند أعمال جديد (أعمال منفذة) لمقاولي الباطن، يتم مباشرة زيادة بند <strong>"مقاولين الباطن"</strong> في تكلفة مشروع البناء. وعند صرف دفعة كاش، يتم تجسيدها في حسابات المنصرف الفاعل لكلا كشف اللجان ودفتر الحركات المالي.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
