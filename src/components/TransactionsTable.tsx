/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Building2,
  HardHat,
  Package,
  Tractor,
  Fuel,
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { Transaction, ProjectCategory, TransactionType, TransactionNature, PaymentMethod, FuelStation } from '../types';

interface TransactionsTableProps {
  transactions: Transaction[];
  onAddClick: () => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  userRole?: string;
  selectedSiteName?: string;
  fuelStations?: FuelStation[];
}

export default function TransactionsTable({ 
  transactions, 
  onAddClick, 
  onDeleteTransaction, 
  onUpdateTransaction, 
  userRole,
  selectedSiteName = 'الموقع النشط',
  fuelStations = []
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [custodyFilter, setCustodyFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // States for Category Filter and Edit Category Dropdowns (Removing Emojis, adding SVGs)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById('filter-category-container');
      if (container && !container.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isFilterDropdownOpen]);

  // List of Categories for Filter and Editing
  const FILTER_CATEGORY_ITEMS = [
    { key: 'all', label: 'جميع الأبواب واللجان', icon: Layers, colorClass: 'text-slate-500', bgColorClass: 'bg-slate-50 border-slate-100' },
    { key: 'contractors', label: 'مقاولين الباطن', icon: HardHat, colorClass: 'text-indigo-600', bgColorClass: 'bg-indigo-50 border-indigo-100' },
    { key: 'supplies', label: 'التوريدات والمواد', icon: Package, colorClass: 'text-amber-600', bgColorClass: 'bg-amber-50 border-amber-100' },
    { key: 'equipment', label: 'المعدات', icon: Tractor, colorClass: 'text-emerald-600', bgColorClass: 'bg-emerald-50 border-emerald-100' },
    { key: 'fuel', label: 'المحروقات والسولار', icon: Fuel, colorClass: 'text-rose-600', bgColorClass: 'bg-rose-50 border-rose-100' },
    { key: 'custody', label: 'العهد المالية بالموقع', icon: Briefcase, colorClass: 'text-slate-700', bgColorClass: 'bg-slate-50 border-slate-100' },
    { key: 'other', label: 'مصاريف أخرى وبنود خارجية', icon: HelpCircle, colorClass: 'text-blue-600', bgColorClass: 'bg-blue-50 border-blue-100' },
  ];

  // Advanced autonomous printing config state
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printTitle, setPrintTitle] = useState('تقرير كشف دفتر الحركة المالي والميداني');
  const [printSerial, setPrintSerial] = useState('');
  const [approverName, setApproverName] = useState('مدير التكاليف والمشروع');
  const [includeFiltersInPrint, setIncludeFiltersInPrint] = useState(true);

  const openPrintOptions = () => {
    // Generate an authentic serial number format: BYN-[TX/LDR]-YYMMDD-[RAND4]
    const dateSegment = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const randSegment = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    setPrintSerial(`BYN-TX-${dateSegment}-${randSegment}`);
    setShowPrintOptions(true);
  };

  const executePrint = () => {
    const styleId = 'dynamic-print-paper-styling';
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const printStyle = document.createElement('style');
    printStyle.id = styleId;
    printStyle.innerHTML = `
      @media print {
        @page {
          size: ${paperSize.toLowerCase()} ${printOrientation.toLowerCase()};
          margin: 6mm 6mm !important;
        }
        body {
          direction: rtl !important;
          background: white !important;
          color: black !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        }
        /* Override widths to adapt to selected physical paper */
        #transactions-table-container, .printable-ledger {
          width: 100% !important;
          max-width: 100% !important;
          border: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-top: 10px !important;
        }
        .print-table th, .print-table td {
          border: 1.5px solid #94a3b8 !important;
          padding: ${paperSize === 'A4' ? '4.5px 6px' : '7px 9px'} !important;
          font-size: ${paperSize === 'A4' ? '10px' : '12px'} !important;
          line-height: 1.25 !important;
          word-break: break-word !important;
        }
        /* Color adjustments for neat ink printing */
        .print-table th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: 800 !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(printStyle);
    setShowPrintOptions(false);

    // Give a short timeout for backdrop to close and CSS style element to bind fully
    setTimeout(() => {
      window.print();
    }, 280);
  };

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
      case 'custody': return 'العهد المالية بالموقع';
      case 'other': return 'مصاريف أخرى متنوعة';
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
      case 'other': return 'bg-slate-100/90 text-slate-700 border-slate-300 shadow-sm';
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

  // Summary Metrics based on filtered list to ensure dynamic responsiveness
  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalSpent = filteredTransactions
    .filter(tx => tx.type === 'spent')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const custodySpent = filteredTransactions
    .filter(tx => tx.type === 'spent' && tx.nature === 'inside_custody')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const officeSpent = filteredTransactions
    .filter(tx => tx.type === 'spent' && tx.nature === 'outside_custody')
    .reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" id="transactions-table-container">
      
      {/* Printable Cover/Report Header Segment (Visible only in print mode) */}
      <div className="hidden print:block mb-6 p-4 text-right font-sans" dir="rtl">
        {/* Header banner */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{printTitle}</h1>
            <p className="text-xs font-semibold text-slate-600 mt-1">مشروع العمل: <span className="text-indigo-600 font-bold">{selectedSiteName}</span></p>
          </div>
          
          <div className="text-left font-sans">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="font-bold text-sm text-slate-800">بنيان لإدارة التكاليف ERP</span>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
            </div>
            <p className="text-[10px] font-black text-slate-400">النظام الذكي لإدارة العقارات والمشروعات</p>
          </div>
        </div>

        {/* Serial and date boxes */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-250 p-3 rounded-xl text-xs mb-4">
          <div>
            <span className="block text-slate-500 font-bold text-[9.5px] uppercase">سريال مستند الطباعة:</span>
            <span className="font-mono font-black text-slate-900 text-xs tracking-wider select-all">{printSerial || 'BYN-TEMP-SERIAL'}</span>
          </div>
          <div>
            <span className="block text-slate-500 font-bold text-[9.5px]">تاريخ ووقت الطباعة:</span>
            <span className="font-medium text-slate-900">{new Date().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}</span>
          </div>
          <div>
            <span className="block text-slate-500 font-bold text-[9.5px]">تعديل ملاءمة الطباعة:</span>
            <span className="font-bold text-slate-900 text-[10px] bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300">
              ورقة {paperSize} - {printOrientation === 'landscape' ? 'عرضي' : 'طولي'}
            </span>
          </div>
        </div>

        {/* Active Filters Info if checked */}
        {includeFiltersInPrint && (
          <div className="bg-amber-50/20 border border-amber-150 p-2.5 rounded-lg text-[10px] text-amber-850 font-bold mb-4 flex items-center justify-between">
            <span>⚙️ الفلترة النشطة بالكشف: {selectedCategory === 'all' ? 'جميع الأبواب' : `باب: ${getCategoryNameAr(selectedCategory)}`} | {custodyFilter === 'all' ? 'جميع العهد والمكتب المركزي' : custodyFilter === 'custody' ? 'عهدة الموقع الميدانية فقط' : 'المكتب الرئيسي فقط'}</span>
            <span>عدد البنود المطبوعة: {filteredTransactions.length} حركة مالية</span>
          </div>
        )}

        {/* Financial summary blocks - beautifully formatted blocks with bold figures */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="border border-slate-200 p-2.5 rounded-xl text-center bg-slate-50/50">
            <span className="block text-[9px] text-slate-500 font-black">إجمالي المصروف الفعلي</span>
            <span className="font-mono text-sm font-black text-slate-900 mt-1 block">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="border border-emerald-250 p-2.5 rounded-xl text-center bg-emerald-50/10">
            <span className="block text-[9px] text-emerald-700 font-black">التمويل والوارد المعتمد</span>
            <span className="font-mono text-sm font-black text-emerald-600 mt-1 block">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="border border-amber-250 p-2.5 rounded-xl text-center bg-amber-50/10">
            <span className="block text-[9px] text-amber-700 font-black">منصرف عهدة الموقع</span>
            <span className="font-mono text-sm font-black text-amber-900 mt-1 block">{formatCurrency(custodySpent)}</span>
          </div>
          <div className="border border-purple-250 p-2.5 rounded-xl text-center bg-purple-50/10">
            <span className="block text-[9px] text-purple-700 font-black">منصرف المكتب الرئيسي</span>
            <span className="font-mono text-sm font-black text-purple-900 mt-1 block">{formatCurrency(officeSpent)}</span>
          </div>
        </div>
      </div>

      {/* Header controls section */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">سجل الحركات المالي المفصل</h3>
            <p className="text-xs text-slate-500 font-medium">سجل القيود المزدوجة لكافة معاملات الموقع المالية والميدانية (لضمان المطابقة الكاملة).</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openPrintOptions}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white text-slate-700 font-bold rounded-lg text-xs hover:bg-indigo-50 hover:text-indigo-650 border border-slate-200 active:scale-95 transition no-print cursor-pointer shadow-xs"
              id="print-ledger-btn"
            >
              <Printer size={16} className="text-slate-500 group-hover:text-indigo-600" />
              طباعة وتصدير الكشف (A3/A4)
            </button>
            {userRole !== 'viewer' && (
              <button
                onClick={onAddClick}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-slate-700 border border-indigo-500 active:scale-95 transition no-print cursor-pointer"
                id="add-tx-btn"
              >
                <Plus size={16} />
                إضافة حركة مالية جديدة
              </button>
            )}
          </div>
        </div>

        {/* Financial Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 no-print">
          {/* Card 1: Total Spent */}
          <div className="p-4.5 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between hover:border-indigo-200 hover:bg-indigo-50/5 hover:shadow-xs transition-all duration-300 group">
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-tighter">إجمالي المصروف الفعلي</span>
              <span className="text-xl font-black font-mono text-slate-900 tracking-tight block group-hover:text-indigo-650 transition-colors">
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-[9.5px] text-slate-400 font-semibold block">إجمالي كافة بنود المنصرف المالي</span>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300">
              <TrendingDown size={19} />
            </div>
          </div>

          {/* Card 2: Total Income/Funding */}
          <div className="p-4.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex items-center justify-between hover:border-emerald-250 hover:bg-emerald-50/50 hover:shadow-xs transition-all duration-300 group">
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-extrabold text-emerald-700 block uppercase tracking-tighter">التمويل والوارد المعتمد</span>
              <span className="text-xl font-black font-mono text-emerald-600 tracking-tight block">
                {formatCurrency(totalIncome)}
              </span>
              <span className="text-[9.5px] text-emerald-600/70 font-semibold block">شحن وتحويلات مالية للعهدة</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 group-hover:bg-emerald-100/70 transition-all duration-300">
              <TrendingUp size={19} />
            </div>
          </div>

          {/* Card 3: Custody Spent */}
          <div className="p-4.5 bg-amber-50/20 border border-amber-100/80 rounded-2xl flex items-center justify-between hover:border-amber-250 hover:bg-amber-50/40 hover:shadow-xs transition-all duration-300 group">
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-extrabold text-amber-700 block uppercase tracking-tighter">منصرف عهدة الموقع</span>
              <span className="text-xl font-black font-mono text-amber-900 tracking-tight block">
                {formatCurrency(custodySpent)}
              </span>
              <span className="text-[9.5px] text-amber-600/70 font-semibold block">المنصرف المباشر كاش ميدانياً</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-655 rounded-xl group-hover:scale-105 group-hover:bg-amber-100/75 transition-all duration-300">
              <Coins size={19} />
            </div>
          </div>

          {/* Card 4: Office Spent */}
          <div className="p-4.5 bg-purple-50/20 border border-purple-100/80 rounded-2xl flex items-center justify-between hover:border-purple-250 hover:bg-purple-50/40 hover:shadow-xs transition-all duration-300 group">
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-extrabold text-purple-700 block uppercase tracking-tighter">منصرف المكتب الرئيسي</span>
              <span className="text-xl font-black font-mono text-purple-900 tracking-tight block">
                {formatCurrency(officeSpent)}
              </span>
              <span className="text-[9.5px] text-purple-600/70 font-semibold block">مسدد بشيكات وعهد خارجية مركزية</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 group-hover:bg-purple-100/70 transition-all duration-300">
              <Building2 size={19} />
            </div>
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
          <div className="relative" id="filter-category-container">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 text-right flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const activeItem = FILTER_CATEGORY_ITEMS.find(item => item.key === selectedCategory) || FILTER_CATEGORY_ITEMS[0];
                  const IconComp = activeItem.icon;
                  return (
                    <>
                      <IconComp size={16} className={`${activeItem.colorClass}`} />
                      <span>{activeItem.label}</span>
                    </>
                  );
                })()}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn py-1">
                {FILTER_CATEGORY_ITEMS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = selectedCategory === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(item.key);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2.5 text-right font-semibold text-xs transition duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <IconComp size={14} className={isSelected ? 'text-white' : item.colorClass} />
                      <span className="flex-1 text-right">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
        <table className="w-full text-right border-collapse bg-white print-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 tracking-wider">
              <th className="p-4 w-12 text-center no-print"></th>
              <th className="p-4">بيان الحركة والوصف</th>
              <th className="p-4 text-center">المستفيد / الجهة</th>
              <th className="p-4 text-center">البند</th>
              <th className="p-4 text-center">المبلغ الفعلي</th>
              <th className="p-4 text-center no-print">الإجراءات</th>
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
                                <option value="custody">العهد المالية بالموقع</option>
                                <option value="other">مصاريف أخرى وبنود خارجية</option>
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
                            {editForm.category === 'fuel' && (
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold mb-1">المحطة المستهدفة للشحن:</label>
                                <select
                                  value={editForm.fuelStationId || ''}
                                  onChange={(e) => {
                                    const stId = e.target.value;
                                    const stName = fuelStations.find(s => s.id === stId)?.name || '';
                                    setEditForm(prev => ({ 
                                      ...prev, 
                                      fuelStationId: stId || undefined,
                                      recipient: stName || prev.recipient || ''
                                    }));
                                  }}
                                  className="w-full p-1.5 bg-white border border-slate-350 rounded font-bold text-[10px]"
                                >
                                  <option value="">-- بدون محطة --</option>
                                  {fuelStations.map(station => (
                                    <option key={station.id} value={station.id}>{station.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
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
                        <td className="p-4 text-center align-middle no-print">
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
                        <td className="p-4 align-middle text-center no-print">
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
                      <tr className="bg-indigo-50/10 no-print">
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

      {/* Print Configuration Modal (no-print) */}
      {showPrintOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl p-6 max-w-lg w-full text-right space-y-5 font-sans animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <h3 className="text-slate-900 font-black text-sm flex items-center gap-2">
                🖨️ إعدادات مستند الطباعة والتصدير الذكي
              </h3>
              <button 
                onClick={() => setShowPrintOptions(false)} 
                className="text-slate-400 hover:text-slate-600 transition text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
              قم بضبط خيارات المستند ليطابق متطلبات الصرف والمطابقة بالمشروع. سيتم ملائمة أعمدة ومحتويات الجدول آلياً لتلائم نسبة العرض المحددة.
            </p>

            {/* Config Fields */}
            <div className="space-y-4 text-xs font-semibold">
              
              {/* Paper Size Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">1. حجم الصفحة المستهدفة (تمكين الملاءمة التلقائية):</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaperSize('A4')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      paperSize === 'A4'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-sm font-black">ورقة A4 القياسية</span>
                    <span className="text-[9.5px] opacity-80 font-normal">خط مدمج مواءم للعرض العادي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('A3')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      paperSize === 'A3'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-sm font-black">ورقة A3 العريضة</span>
                    <span className="text-[9.5px] opacity-80 font-normal">عرض موسع ومقروء للمهندسين</span>
                  </button>
                </div>
              </div>

              {/* Orientation Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">2. اتجاه طباعة الصفحة:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      printOrientation === 'landscape'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    عرضي (Landscape) 📱 - موصى به للجداول
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      printOrientation === 'portrait'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    طولي (Portrait) 📄
                  </button>
                </div>
              </div>

              {/* Document Title Customization */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">3. مسمى المستند الترويسي:</label>
                <input
                  type="text"
                  value={printTitle}
                  onChange={(e) => setPrintTitle(e.target.value)}
                  placeholder="مثال: تقرير كشف دفتر الحركة المالي"
                  className="w-full p-3 bg-slate-50 border border-slate-250 rounded-2xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Serial number indicator (read only but customizable) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">الرقم التسلسلي (توليد ERP فريد):</label>
                  <div className="p-3 bg-slate-100 rounded-2xl font-mono text-center text-slate-700 border border-slate-200 text-[10px] font-black tracking-wider select-all">
                    {printSerial}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">توقيع المسؤول المعتمد:</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-700 font-bold"
                  />
                </div>
              </div>

              {/* Include filters in print */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="include-filters"
                  checked={includeFiltersInPrint}
                  onChange={(e) => setIncludeFiltersInPrint(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="include-filters" className="text-[11px] text-slate-600 font-bold cursor-pointer select-none">
                  تضمين الفلاتر النشطة وخلاصة الحسابات المالية في مطبوع التقرير
                </label>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={executePrint}
                className="flex-1 py-3 px-5 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-black rounded-2xl transition shadow-md hover:shadow-lg active:scale-97 cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer size={15} /> تأكيد وخروج لأمر الطباعة المباشر 🖨️
              </button>
              <button
                type="button"
                onClick={() => setShowPrintOptions(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-2xl transition border border-slate-200 cursor-pointer"
              >
                إلغاء الأمر
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
