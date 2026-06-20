/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  FileCheck, 
  ArrowDownCircle, 
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
  Printer,
  Wallet
} from 'lucide-react';
import { Transaction, ProjectCategory, TransactionType, TransactionNature, PaymentMethod } from '../types';

interface TransactionsTableProps {
  transactions: Transaction[];
  onAddClick: () => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  userRole?: string;
}

export default function TransactionsTable({ transactions, onAddClick, onDeleteTransaction, onUpdateTransaction, userRole }: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [custodyFilter, setCustodyFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Check if transaction is funded/spent from custody
  const isFromCustody = (tx: Transaction) => {
    return tx.nature === 'inside_custody';
  };
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  // Custom confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Category mapping helper
  const getCategoryNameAr = (cat: string) => {
    switch (cat) {
      case 'supplies': return 'التوريدات والمواد';
      case 'equipment': return 'المعدات';
      case 'contractors': return 'مقاولين الباطن';
      case 'fuel': return 'المحروقات والسولار';
      case 'custody': return 'العهد الموقعية';
      default: return cat;
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'supplies': return 'bg-blue-50/80 text-blue-700 border-blue-200/60 shadow-sm';
      case 'equipment': return 'bg-purple-50/80 text-purple-700 border-purple-200/60 shadow-sm';
      case 'contractors': return 'bg-amber-50/80 text-amber-750 border-amber-200/60 shadow-sm';
      case 'fuel': return 'bg-rose-50/80 text-rose-700 border-rose-200/60 shadow-sm';
      case 'custody': return 'bg-emerald-50/80 text-emerald-750 border-emerald-200/60 shadow-sm';
      default: return 'bg-slate-50/80 text-slate-700 border-slate-200/60 shadow-sm';
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.referenceNo && tx.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;

    const matchesCustody = custodyFilter === 'all' ||
      (custodyFilter === 'custody' && isFromCustody(tx)) ||
      (custodyFilter === 'outside' && !isFromCustody(tx));

    return matchesSearch && matchesCategory && matchesCustody;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({ ...tx });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editForm.id) return;
    
    // Warning Dialog before saving configuration changes
    setConfirmState({
      isOpen: true,
      title: 'حفظ التغييرات المالية',
      message: 'تحذير حفظ تعديل: هل أنت متأكد من رغبتك في تعديل وحفظ بيانات هذا البند المالي؟ سيتسبب هذا في إعادة حساب إجماليات الدفاتر فوراً!',
      onConfirm: () => {
        onUpdateTransaction(editForm as Transaction);
        setEditingId(null);
        setEditForm({});
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" id="transactions-table-container">
      {/* Header controls section */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">سجل الحركات المالي المفصل</h3>
            <p className="text-xs text-slate-500 font-medium">سجل القيود المزدوجة لكافة معاملات الموقع المالية والميدانية (لضمان المطابقة الكاملة).</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 border border-slate-200 active:scale-95 transition no-print"
              id="print-ledger-btn"
            >
              <Printer size={16} />
              طباعة الكشف المالي
            </button>
            {userRole !== 'viewer' && (
              <button
                onClick={onAddClick}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-slate-700 border border-indigo-500 active:scale-95 transition no-print"
                id="add-tx-btn"
              >
                <Plus size={16} />
                إضافة حركة مالية جديدة
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-3 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="ابحث بالوصف، المستفيد، رقم المرجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              id="search-input"
            />
          </div>

          {/* Category selection */}
          <div className="relative">
            <Layers className="absolute right-3.5 top-3 text-slate-400" size={17} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 appearance-none"
              id="category-filter"
            >
              <option value="all">جميع الأبواب واللجان</option>
              <option value="supplies">التوريدات والمواد</option>
              <option value="equipment">المعدات</option>
              <option value="contractors">مقاولين الباطن</option>
              <option value="fuel">المحروقات والسولار</option>
              <option value="custody">العهد الموقعية</option>
            </select>
          </div>

          {/* Custody Filter Selection */}
          <div className="relative">
            <Wallet className="absolute right-3.5 top-3 text-slate-400" size={17} />
            <select
              value={custodyFilter}
              onChange={(e) => setCustodyFilter(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 appearance-none text-right"
              id="custody-filter"
            >
              <option value="all">جميع مصادر الصرف (العهد والشركات)</option>
              <option value="custody">عهدة الموقع</option>
              <option value="outside">المكتب الرئيسي</option>
            </select>
          </div>

          {/* Quick numbers indicator */}
          <div className="bg-slate-100 flex items-center justify-between px-4 py-2.5 rounded-lg text-[11px] text-slate-600 font-bold border border-slate-200">
            <span>عدد النتائج:</span>
            <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {filteredTransactions.length} حركة
            </span>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-right border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 tracking-wider">
              <th className="p-4 w-12 text-center"></th>
              <th className="p-4">بيان الحركة والوصف</th>
              <th className="p-4 text-center">المستفيد / الجهة</th>
              <th className="p-4 text-center">البند</th>
              <th className="p-4 text-center">المبلغ الفعلي</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400">
                  <p className="font-bold text-sm">لا توجد حركات مالية مطابقة للبحث</p>
                  <p className="text-xs text-slate-400 mt-1">تأكد من تعديل الفلاتر أو إضافة حركات جديدة.</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isExpanded = expandedRow === tx.id;
                const isEditing = editingId === tx.id;
                return (
                  <React.Fragment key={tx.id}>
                    {isEditing ? (
                      <tr 
                        className="bg-indigo-50/40 hover:bg-indigo-50/50 transition-colors duration-150"
                        id={`tx-row-edit-${tx.id}`}
                      >
                        <td className="p-4 text-center">-</td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-xs shadow-xs text-right mb-2"
                            placeholder="الوصف"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editForm.date || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                              className="p-1 border border-slate-300 rounded text-[11px] font-mono font-bold"
                            />
                            <input
                              type="text"
                              value={editForm.referenceNo || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                              className="p-1 border border-slate-300 rounded text-[11px] font-mono text-right w-full"
                              placeholder="الرقم المرجعي"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={editForm.recipient || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, recipient: e.target.value }))}
                            className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-xs shadow-xs text-right"
                            placeholder="المستفيد"
                          />
                        </td>
                        <td className="p-4 shrink-0">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-1">التصنيف البنيوي:</label>
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as ProjectCategory }))}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold text-[10px]"
                              >
                                <option value="supplies">التوريدات والمواد</option>
                                <option value="equipment">المعدات</option>
                                <option value="contractors">مقاولين الباطن</option>
                                <option value="fuel">المحروقات والسولار</option>
                                <option value="custody">العهد الموقعية</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-1">طبيعة المعاملة:</label>
                              <select
                                value={editForm.nature || 'inside_custody'}
                                onChange={(e) => setEditForm(prev => ({ ...prev, nature: e.target.value as TransactionNature }))}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold text-[10px]"
                              >
                                <option value="inside_custody">عهدة الموقع</option>
                                <option value="outside_custody">المكتب الرئيسي</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-1">نوع القيد:</label>
                              <select
                                value={editForm.type || 'spent'}
                                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as TransactionType }))}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold text-[10px]"
                              >
                                <option value="spent">منصرف مالي</option>
                                <option value="income">وارد / تمويل</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold mb-1">طريقة الدفع:</label>
                              <select
                                value={editForm.paymentMethod || 'نقدى'}
                                onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold text-[10px]"
                              >
                                <option value="نقدى">نقدى</option>
                                <option value="شيك">شيك</option>
                                <option value="تحويل بنكى">تحويل بنكى</option>
                                <option value="انستا">انستا</option>
                                <option value="فودافون كاش">فودافون كاش</option>
                                <option value="اخرى">اخرى</option>
                              </select>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            value={editForm.amount || 0}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-center"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={saveEdit}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              title="حفظ التعديل"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                              title="إلغاء الأمر"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr 
                        className={`hover:bg-slate-50/60 transition-all duration-200 group ${isExpanded ? 'bg-indigo-50/20 shadow-sm border-y border-indigo-100' : ''}`}
                        id={`tx-row-${tx.id}`}
                      >
                        <td className="p-4 text-center align-middle">
                          <button 
                            onClick={() => toggleRow(tx.id)}
                            className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="p-4 max-w-sm align-middle">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {tx.nature === 'inside_custody' ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] border border-emerald-100 shadow-sm shrink-0 whitespace-nowrap">
                                  عهدة الموقع
                                </span>
                               ) : (
                                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px] border border-slate-200 shadow-sm shrink-0 whitespace-nowrap">
                                  المكتب الرئيسي
                                </span>
                               )}
                              <span className="font-bold text-slate-900 truncate leading-snug" title={tx.description}>
                                {tx.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[10.5px]">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Calendar size={13} className="text-slate-400 shrink-0" />
                                <span className="font-mono font-medium tracking-tight text-slate-600">{tx.date}</span>
                              </div>
                              <span className="text-slate-200">|</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-medium">كود الإرسال:</span>
                                <span className="font-mono text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150 select-all shrink-0">
                                  ...{tx.id.substring(tx.id.length - 8)}
                                </span>
                              </div>
                              {tx.referenceNo && (
                                <>
                                  <span className="text-slate-200">|</span>
                                  <span className="font-mono text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm shrink-0">
                                    سند ورقي: <span className="text-slate-700 font-bold">{tx.referenceNo}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <span className="font-semibold text-slate-700 max-w-[150px] truncate inline-block">
                            {tx.recipient}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 text-[10.5px] rounded border font-semibold shadow-sm ${getCategoryBadgeClass(tx.category)}`}>
                            {getCategoryNameAr(tx.category)}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-center">
                          {tx.type === 'income' ? (
                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block font-mono text-[15px] tracking-tight border border-emerald-100 shadow-sm">
                              + {formatCurrency(tx.amount)}
                            </span>
                          ) : (
                            <span className="font-black text-slate-900 font-mono text-[15px] tracking-tight">
                              {formatCurrency(tx.amount)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {userRole !== 'viewer' && (
                              <button
                                onClick={() => startEdit(tx)}
                                className="p-1.5 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="تعديل القيد"
                                id={`tx-edit-${tx.id}`}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {userRole !== 'viewer' && userRole !== 'engineer' && (
                              <button
                                onClick={() => {
                                  setConfirmState({
                                    isOpen: true,
                                    title: 'تأكيد الحذف كلياً من السجلات وبنيان الـ ERP',
                                    message: 'تحذير قاطع: هل أنت متأكد تماماً من رغبتك في حذف هذه الحركة المالية وصاحبها نهائياً من دفاتر القيود؟ لا يمكن استرجاع هذه البيانات بعد إتمام الحذف!',
                                    onConfirm: () => onDeleteTransaction(tx.id)
                                  });
                                }}
                                className="p-1.5 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                title="حذف القيد"
                                id={`tx-delete-${tx.id}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {(userRole === 'viewer' || (userRole === 'engineer' && tx.category === 'custody')) && (
                              <div className="p-1.5 text-emerald-500 rounded-lg flex items-center justify-center pt-2" title="اتصال آمن">
                                <Check size={16} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Collapsible Details Row */}
                    {isExpanded && (
                      <tr className="bg-indigo-50/10">
                        <td colSpan={6} className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right max-w-5xl mx-auto bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                            <div className="space-y-1">
                              <span className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wide">طريقة الدفع المسجلة</span>
                              <span className="block text-xs font-bold text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-fit">{tx.paymentMethod || 'مستند إثبات أعمال'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wide">الرقم المرجعي / السجل</span>
                              <span className="block text-xs font-bold text-slate-900 font-mono bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-fit">{tx.referenceNo || 'غير مسجل'}</span>
                            </div>
                            <div className="lg:col-span-2 space-y-1">
                              <span className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wide">الوصف والنوتة التفصيلية</span>
                              <p className="text-[13px] font-medium text-slate-700 bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg leading-relaxed">{tx.notes || tx.description}</p>
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
