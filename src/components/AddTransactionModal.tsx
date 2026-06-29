/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, CreditCard, ArrowRightLeft, Coins, HardHat, Package, Tractor, Fuel, Briefcase, HelpCircle, ChevronDown } from 'lucide-react';
import { Transaction, ProjectCategory, TransactionType, TransactionNature, PaymentMethod, Subcontractor, EquipmentSummary, SiteWorker, FuelStation } from '../types';

interface AddTransactionModalProps {
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  subcontractors: Subcontractor[];
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
  equipmentList: EquipmentSummary[];
  contractorsReport?: any[];
  setContractorsReport?: React.Dispatch<React.SetStateAction<any[]>>;
  workers?: SiteWorker[];
  fuelStations?: FuelStation[];
}

export default function AddTransactionModal({ 
  onClose, 
  onSave,
  subcontractors = [],
  setSubcontractors,
  equipmentList = [],
  contractorsReport = [],
  setContractorsReport,
  workers = [],
  fuelStations = []
}: AddTransactionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ProjectCategory>('contractors');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('contractors');

  // Custom Category Dropdown Menu States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById('category-select-container');
      if (container && !container.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  // List of Categories with SVG/Lucide Icons
  const CATEGORY_ITEMS = [
    { key: 'contractors', label: 'مقاولين الباطن', category: 'contractors', icon: HardHat, colorClass: 'text-indigo-600', bgColorClass: 'bg-indigo-50 border-indigo-100' },
    { key: 'supplies', label: 'التوريدات والمواد', category: 'supplies', icon: Package, colorClass: 'text-amber-600', bgColorClass: 'bg-amber-50 border-amber-100' },
    { key: 'equipment', label: 'المعدات', category: 'equipment', icon: Tractor, colorClass: 'text-emerald-600', bgColorClass: 'bg-emerald-50 border-emerald-100' },
    { key: 'fuel', label: 'المحروقات والسولار', category: 'fuel', icon: Fuel, colorClass: 'text-rose-600', bgColorClass: 'bg-rose-50 border-rose-100' },
    { key: 'custody', label: 'العهد المالية بالموقع', category: 'custody', icon: Briefcase, colorClass: 'text-slate-700', bgColorClass: 'bg-slate-50 border-slate-100' },
    { key: 'other', label: 'مصاريف أخرى متنوعة', category: 'other', icon: HelpCircle, colorClass: 'text-blue-600', bgColorClass: 'bg-blue-50 border-blue-100' },
    { key: 'custom_external', label: 'بند خارجى مخصص', category: 'other', icon: Plus, colorClass: 'text-purple-600', bgColorClass: 'bg-purple-50 border-purple-100' },
  ];
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [type, setType] = useState<TransactionType>('spent');
  const [nature, setNature] = useState<TransactionNature>('inside_custody');
  const [amount, setAmount] = useState('');
  
  // Equipment selection state
  const [equipmentId, setEquipmentId] = useState('');
  
  // Fuel station selection state (for adding balance to a gas station)
  const [fuelStationId, setFuelStationId] = useState('');
  
  // Beneficiary details
  const [recipient, setRecipient] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [knownSuppliers, setKnownSuppliers] = useState<any[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقدى');
  const [referenceNo, setReferenceNo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing suppliers from the Firestore database state
    if (contractorsReport && contractorsReport.length > 0) {
      setKnownSuppliers(contractorsReport);
    } else {
      setKnownSuppliers([
        { id: 'sup-c1', name: 'صلاح العجاري', referenceNo: 'REF-837209' },
        { id: 'sup-c2', name: 'حكيم', referenceNo: 'REF-298371' }
      ]);
    }
  }, [contractorsReport]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'supplies': return 'التوريدات والمواد';
      case 'equipment': return 'المعدات';
      case 'contractors': return 'مقاولين الباطن';
      case 'fuel': return 'المحروقات والسولار';
      case 'custody': return 'العهد المالية بالموقع';
      case 'other': return 'مصاريف أخرى متنوعة';
      default: return cat;
    }
  };

  const currentRecipient = isNewRecipient ? newRecipientName : recipient;
  const categoryLabelWithCustom = selectedCategoryKey === 'custom_external' ? `بند خارجي: ${customCategoryName}` : getCategoryLabel(category);
  const autoDescription = `${categoryLabelWithCustom} | ${currentRecipient || 'بدون محدد'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    if (selectedCategoryKey === 'custom_external' && !customCategoryName.trim()) {
      setError('يرجى تحديد وكتابة اسم البند الخارجي المخصص.');
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
          id: `sup-${Date.now()}`,
          referenceNo: `SUP-${Date.now().toString().slice(-6)}`,
          name: finalRecipient,
          materialCode: '',
          phone: '',
          contractNumber: '',
          notes: 'أضيف تلقائياً من شاشة الحركات المباشرة كمورد',
          deliveryMethods: []
        };
        const updatedList = [...knownSuppliers, newSupplier];
        setKnownSuppliers(updatedList);
        if (setContractorsReport) {
          setContractorsReport(updatedList);
        }
      } else if (category === 'contractors') {
        const newSubcontractor: Subcontractor = {
          id: `sub-dyn-${Date.now()}`,
          name: finalRecipient,
          trade: '', workVolume: 0, unitPrice: 0, totalValue: 0, paidOffice: 0, paidCustody: 0, paperSettlements: 0, remaining: 0, notes: 'أضيف تلقائياً من شاشة الحركات المباشرة كمقاول باطن'
        };
        const updatedList = [...subcontractors, newSubcontractor];
        setSubcontractors(updatedList);
      }
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
      fuelStationId: category === 'fuel' && fuelStationId ? fuelStationId : undefined,
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
        className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[95vh] overflow-hidden text-right"
        id="add-transaction-modal-inner"
      >
        
        {/* Sidebar Visual - Matches the requested card style */}
        <div className="w-full md:w-64 bg-slate-50 p-8 flex flex-col justify-between border-l border-slate-100 flex-shrink-0">
          <div>
            <CreditCard size={40} className="text-purple-400 mb-6" />
            <h4 className="text-xl font-black mb-2 text-slate-900">تسجيل حركة مالية</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              نظام الضبط المالي والقيود المباشرة لموازنة حسابات التوريد والعهد بدقة كاملة.
            </p>
          </div>

          {/* Connected Stepper with precise active boundaries */}
          <div className="space-y-4 text-xs font-black text-slate-400 my-6">
            <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${isStep1Done ? 'border-purple-600 text-purple-600' : 'border-slate-200 text-slate-400'}`}>
              1. طبيعة وتاريخ الحركة
            </div>
            <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${isStep2Done ? 'border-purple-600 text-purple-600' : isStep1Done ? 'border-slate-300 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              2. جهة المستفيد والمبلغ
            </div>
            <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${isStep3Done ? 'border-purple-600 text-purple-600' : isStep2Done ? 'border-slate-300 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              3. طريقة السداد والتكويد
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-bold">
            نظام الضبط المالي الذكي
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
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/20">
            <form id="transaction-form" onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: طبيعة الحركة والبند */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest border-r-4 border-purple-500 pr-3">
                  تاريخ وطبيعة الحركة المالية
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Transaction Date */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">تاريخ الحركة *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold text-slate-900 outline-none"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1 relative" id="category-select-container">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">البند / التصنيف الفرعي *</label>
                    
                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {(() => {
                          const activeItem = CATEGORY_ITEMS.find(item => item.key === selectedCategoryKey) || CATEGORY_ITEMS[0];
                          const IconComp = activeItem.icon;
                          return (
                            <>
                              <span className={`p-1 rounded-md ${activeItem.bgColorClass} flex items-center justify-center`}>
                                <IconComp size={16} className={activeItem.colorClass} />
                              </span>
                              <span>{activeItem.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>

                    {/* Popover List */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn py-1">
                        {CATEGORY_ITEMS.map((item) => {
                          const IconComp = item.icon;
                          const isSelected = selectedCategoryKey === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                setSelectedCategoryKey(item.key);
                                if (item.key === 'custom_external') {
                                  setCategory('other');
                                } else {
                                  setCategory(item.key as ProjectCategory);
                                }
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 p-3.5 text-right font-black text-xs transition duration-150 cursor-pointer ${
                                isSelected 
                                  ? 'bg-purple-600 text-white' 
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`p-1.5 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-purple-700 text-white' : item.bgColorClass
                              }`}>
                                <IconComp size={15} className={isSelected ? 'text-white' : item.colorClass} />
                              </span>
                              <span className="flex-1 text-right">{item.label}</span>
                              {isSelected && <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded-md font-bold">نشط</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Category Input if selected */}
                {selectedCategoryKey === 'custom_external' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-[10px] font-black text-purple-600 mb-1.5 mr-1 uppercase tracking-widest">اسم البند الخارجي المخصص *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رسوم تراخيص، إكراميات استثنائية، صيانة طارئة..."
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold text-slate-900 outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {/* Transaction Nature */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">طبيعة المعاملة والمصدر الرئيسي *</label>
                    <select
                      value={nature}
                      onChange={(e) => setNature(e.target.value as TransactionNature)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="inside_custody" className="bg-white text-slate-900">عهدة الموقع</option>
                      <option value="outside_custody" className="bg-white text-slate-900">المكتب الرئيسي للشركة</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: المستفيد والماليات */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest border-r-4 border-purple-500 pr-3">
                  المستفيد والماليات
                </h4>

                <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-100 space-y-4">
                  
                  {/* Amount of record */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">المبلغ وبالتفاصيل الميدانية لإجمالي القيد (ج.م) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-sm p-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-black text-slate-900 outline-none text-left font-mono pr-20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                        جنيه مصري
                      </span>
                    </div>
                  </div>

                  {/* Beneficiary recipient selection */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">المستفيد / جهة الصرف المتأثرة *</label>
                    
                    {category === 'equipment' ? (
                      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl">
                        <select
                          required
                          value={equipmentId}
                          onChange={(e) => {
                            setEquipmentId(e.target.value);
                            const eq = equipmentList.find(item => item.id === e.target.value);
                            if (eq) setRecipient(eq.name);
                          }}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="" disabled className="bg-white text-slate-900">-- اختر المعدة من القائمة --</option>
                          {equipmentList.map((eq) => (
                            <option key={eq.id} value={eq.id} className="bg-white text-slate-900">{eq.name} ({eq.driver})</option>
                          ))}
                        </select>
                      </div>
                    ) : category === 'fuel' ? (
                      <div className="flex gap-2.5">
                        {!isNewRecipient ? (
                          <div className="flex-1 flex gap-2.5">
                            <select
                              required
                              value={fuelStationId}
                              onChange={(e) => {
                                setFuelStationId(e.target.value);
                                const st = fuelStations.find(station => station.id === e.target.value);
                                if (st) setRecipient(st.name);
                              }}
                              className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="" disabled className="bg-white text-slate-900">-- اختر محطة الوقود للشحن / الإيداع --</option>
                              {fuelStations.map((station) => (
                                <option key={station.id} value={station.id} className="bg-white text-slate-900">{station.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setIsNewRecipient(true);
                                setFuelStationId('');
                                setRecipient('');
                              }}
                              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-purple-500 text-slate-600 hover:text-purple-700 px-5 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer"
                            >
                              <Plus size={15} /> جهة أخرى
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex gap-2.5 relative">
                            <input
                              type="text"
                              required
                              placeholder="اكتب مستفيد غير مدرج بالمحطات..."
                              value={newRecipientName}
                              onChange={(e) => setNewRecipientName(e.target.value)}
                              className="flex-1 w-full p-3.5 bg-white border border-purple-500 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
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
                              المحطات المسجلة
                            </button>
                          </div>
                        )}
                      </div>
                    ) : category === 'custody' ? (
                      <div className="flex gap-2.5">
                        {!isNewRecipient ? (
                          <div className="flex-1 flex gap-2.5">
                            <select
                              required
                              value={recipient}
                              onChange={(e) => setRecipient(e.target.value)}
                              className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="" disabled className="bg-white text-slate-900">-- اختر المسؤول عن العهدة من العاملين بالقرية/الموقع --</option>
                              {workers.map((w) => (
                                <option key={w.id} value={w.name} className="bg-white text-slate-900">{w.name} ({w.jobTitle})</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setIsNewRecipient(true)}
                              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-purple-500 text-slate-600 hover:text-purple-700 px-5 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer"
                            >
                              <Plus size={15} /> جهة أخرى
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex gap-2.5 relative">
                            <input
                              type="text"
                              required
                              placeholder="اكتب اسم المستلم الجديد للعهدة..."
                              value={newRecipientName}
                              onChange={(e) => setNewRecipientName(e.target.value)}
                              className="flex-1 w-full p-3.5 bg-white border border-purple-500 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
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
                              المسؤولين المسجلين
                            </button>
                          </div>
                        )}
                      </div>
                    ) : !isNewRecipient ? (
                      <div className="flex gap-2.5">
                        <select
                          required
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="" disabled className="bg-white text-slate-900">-- اختر من القائمة المرتبطة --</option>
                          {(category === 'contractors' 
                            ? subcontractors 
                            : category === 'supplies' 
                              ? knownSuppliers 
                              : [...subcontractors, ...knownSuppliers, ...workers.map(w => ({ id: w.id, name: w.name }))]
                          ).map((c) => (
                            <option key={c.id || c.name} value={c.name} className="bg-white text-slate-900">{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsNewRecipient(true)}
                          className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-purple-500 text-slate-600 hover:text-purple-700 px-5 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer shadow-sm"
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
                          className="flex-1 w-full p-3.5 bg-white border border-purple-500 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
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
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest border-r-4 border-purple-500 pr-3">
                  طريقة السداد والتكويد
                </h4>
 
                <div className="bg-slate-5/60 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Method */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">طريقة الدفع *</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="نقدى" className="bg-white text-slate-900">نقدى</option>
                        <option value="شيك" className="bg-white text-slate-900">شيك</option>
                        <option value="تحويل بنكى" className="bg-white text-slate-900">تحويل بنكى</option>
                        <option value="انستا" className="bg-white text-slate-900">انستا</option>
                        <option value="فودافون كاش" className="bg-white text-slate-900">فودافون كاش</option>
                        <option value="اخرى" className="bg-white text-slate-900">اخرى</option>
                      </select>
                    </div>
 
                    {/* Reference No */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">رقم السند / الشيك / الحوالة</label>
                      <input
                        type="text"
                        placeholder="رقم المرجع (اختياري)"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-left"
                      />
                    </div>
                  </div>
 
                  {/* Auto-Description / Coding */}
                  <div className="space-y-1 pt-2">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">التكويد الذكي ووصف المعاملة</label>
                    <input
                      readOnly
                      value={autoDescription}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 focus:outline-none cursor-not-allowed text-center"
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
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              حفظ واعتماد المعاملة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-black border border-slate-200 transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
 
        </div>

      </div>
    </div>
  );
}

