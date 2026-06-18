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
      case 'supplies': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'equipment': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'contractors': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'fuel': return 'bg-red-50 text-red-700 border-red-200';
      case 'custody': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
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
              <option value="custody">حركات المنصرف من العهدة 💼</option>
              <option value="outside">معاملات من خارج العهدة 🏛️</option>
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
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 tracking-wider">
              <th className="p-4 w-12 text-center"></th>
              <th className="p-4">بيان الحركة والوصف</th>
              <th className="p-4">المستفيد / الجهة</th>
              <th className="p-4">البند</th>
              <th className="p-4">المبلغ الفعلي</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400">
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
                                <option value="inside_custody">داخل العهدة 💼</option>
                                <option value="outside_custody">خارج العهدة 🏛️</option>
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
                        className={`hover:bg-slate-50/80 transition-colors duration-150 ${isExpanded ? 'bg-slate-50/50' : ''}`}
                        id={`tx-row-${tx.id}`}
                      >
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => toggleRow(tx.id)}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-150 hover:text-slate-600 transition"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="p-4 max-w-sm">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5" title={tx.description}>
                            {tx.nature === 'inside_custody' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-black text-[9.5px] border border-emerald-100/60 shrink-0 select-none">
                                داخل العهدة 💼
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[9.5px] border border-slate-200 shrink-0 select-none">
                                خارج العهدة 🏛️
                              </span>
                            )}
                            <span className="truncate">{tx.description}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <Calendar size={12} />
                            <span className="font-mono">{tx.date}</span>
                            {tx.referenceNo && (
                              <>
                                <span className="text-slate-200">•</span>
                                <span className="font-mono">مرجع: {tx.referenceNo}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          {tx.recipient}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 text-[10.5px] rounded-lg font-semibold border ${getCategoryBadgeClass(tx.category)}`}>
                            {getCategoryNameAr(tx.category)}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-slate-950 font-mono text-sm">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {userRole !== 'viewer' && (
                              <button
                                onClick={() => startEdit(tx)}
                                className="p-1.5 text-indigo-650 rounded-lg hover:bg-indigo-50 hover:text-indigo-800 transition"
                                title="تعديل القيد"
                                id={`tx-edit-${tx.id}`}
                              >
                                <Edit2 size={13} />
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
                                className="p-1.5 text-rose-500 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition"
                                title="حذف القيد"
                                id={`tx-delete-${tx.id}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            {(userRole === 'viewer' || (userRole === 'engineer' && tx.category === 'custody')) && (
                              <span className="text-[10px] text-slate-400 font-medium px-1.5">اتصال آمن</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Collapsible Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={6} className="p-4 border-t border-slate-150">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-right text-slate-600 leading-relaxed max-w-5xl mx-auto">
                            <div>
                              <span className="block text-[10px] text-slate-400 font-bold">طريقة الدفع المسجلة:</span>
                              <span className="text-xs font-semibold text-slate-800">{tx.paymentMethod || 'مستند إثبات أعمال (بلا دفع كاش مباشر)'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-400 font-bold">الرقم المرجعي / السجل:</span>
                              <span className="text-xs font-semibold text-slate-800 font-mono">{tx.referenceNo || 'غير مسجل'}</span>
                            </div>
                            <div className="lg:col-span-2">
                              <span className="block text-[10px] text-slate-400 font-bold">الوصف والتفاصيل الميدانية الكاملة:</span>
                              <p className="text-xs font-semibold text-slate-800 mt-1 leading-normal">{tx.description}</p>
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
