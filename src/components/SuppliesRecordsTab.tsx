import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  Check, 
  X, 
  Calendar, 
  Truck, 
  FileText, 
  DollarSign, 
  FileSpreadsheet, 
  CheckCircle,
  AlertCircle,
  FileCheck,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Printer
} from 'lucide-react';
import { SupplyRecord, SupplyItem } from '../types';
import { parseArabicNumber } from '../utils/numbers';

import ConfirmationDialog from './ConfirmationDialog';

interface SuppliesRecordsTabProps {
  supplyRecords: SupplyRecord[];
  onAddRecord: (rec: SupplyRecord) => void;
  onUpdateRecord: (id: string, updates: Partial<SupplyRecord>) => void;
  onDeleteRecord: (id: string) => void;
  supplyItems: SupplyItem[];
  suppliers: any[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
}

export default function SuppliesRecordsTab({
  supplyRecords,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  supplyItems,
  suppliers,
  userRole,
  addAuditLog
}: SuppliesRecordsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterItem, setFilterItem] = useState('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'ticketNo' | 'date', direction: 'asc' | 'desc' } | null>(null);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Print States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'A3'>('A4');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  const handlePrintRecords = (paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = sortedRecords.map((r, index) => {
      const matchItem = supplyItems.find(i => i.code === r.itemCode);
      return `
        <tr class="border-b border-slate-300 text-[10px] text-slate-850 text-center">
          <td class="p-1.5 border border-slate-400 font-bold">${index + 1}</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono text-indigo-700">${r.ticketNo}</td>
          <td class="p-1.5 border border-slate-400 font-mono">${r.date}</td>
          <td class="p-1.5 border border-slate-400 text-right font-black">${r.supplierName}</td>
          <td class="p-1.5 border border-slate-400 text-right font-medium">${matchItem?.name || r.itemName || r.itemCode}</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono">${r.truckPlate} ${r.trailerPlate ? ' / ' + r.trailerPlate : ''}</td>
          <td class="p-1.5 border border-slate-400 font-mono">${r.rawQuantity.toLocaleString()} م٣</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono text-indigo-900">${r.netQuantity.toLocaleString()} م٣</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono">${(r.unitPrice || 0).toLocaleString()} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono text-slate-900">${(r.totalCost || 0).toLocaleString()} ج.م</td>
        </tr>
      `;
    }).join('');

    const totalRaw = sortedRecords.reduce((sum, r) => sum + r.rawQuantity, 0);
    const totalNet = sortedRecords.reduce((sum, r) => sum + r.netQuantity, 0);
    const totalCost = sortedRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>بيان حركات التوريدات</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Tajawal', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
          }
          body {
            font-family: 'Tajawal', sans-serif;
            background-color: white;
          }
        </style>
      </head>
      <body class="p-2 bg-white text-slate-900">
        <div class="border-4 border-double border-slate-700 p-4 min-h-full flex flex-col justify-between">
          <div>
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div class="text-right space-y-1">
                <h1 class="text-xs font-black text-slate-800">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[9px] font-bold text-slate-500">إدارة المشروعات والرقابة الهندسية والتوريدات</p>
                <p class="text-[8px] text-slate-400">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center">
                <div class="border border-slate-800 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <span class="text-[10px] font-black text-slate-800 block">شعار بنيان</span>
                  <span class="text-[8px] font-bold text-slate-400">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-0.5">
                <p class="font-bold">الموقع: <span class="font-black text-indigo-750">مشروع برج العرب الجديدة</span></p>
                <p class="font-bold text-[10px] text-slate-500">مستند جرد: بيان حركة التوريدات اليومية</p>
              </div>
            </div>

            <!-- Title -->
            <div class="text-center my-4">
              <h2 class="text-base font-black text-slate-900 border-b-2 border-indigo-600 inline-block pb-0.5 px-4 uppercase tracking-wider">
                بيان حركة توريدات الخامات والمواد الموقعية
              </h2>
              <p class="text-[10px] font-bold text-slate-500 mt-1">
                الفلترة النشطة: المورد [${filterSupplier === 'all' ? 'الكل' : filterSupplier}] - الخامة [${filterItem === 'all' ? 'الكل' : filterItem}]
              </p>
            </div>

            <!-- Table -->
            <div class="mt-2">
              <table class="w-full text-right text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-[10px]">
                    <th class="p-2 border border-slate-400 w-10">م</th>
                    <th class="p-2 border border-slate-400">رقم البون</th>
                    <th class="p-2 border border-slate-400">التاريخ</th>
                    <th class="p-2 border border-slate-400 text-right">اسم المورد</th>
                    <th class="p-2 border border-slate-400 text-right">الخامة الموردة</th>
                    <th class="p-2 border border-slate-400">رقم السيارة/المقطورة</th>
                    <th class="p-2 border border-slate-400">الكمية المقدرة</th>
                    <th class="p-2 border border-slate-400">الكمية الصافية</th>
                    <th class="p-2 border border-slate-400">سعر الوحدة</th>
                    <th class="p-2 border border-slate-400">التكلفة الإجمالية</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <!-- Totals Row -->
                  <tr class="bg-slate-50 border-t-2 border-slate-800 text-[10px] font-black text-center">
                    <td colspan="6" class="p-2 border border-slate-400 text-right text-slate-900">
                      الإجمالي العام للحركات المفلترة (${sortedRecords.length} بون توريد):
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-900">
                      ${totalRaw.toLocaleString()} م٣
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-indigo-750">
                      ${totalNet.toLocaleString()} م٣
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-500">
                      ---
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-900">
                      ${totalCost.toLocaleString()} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-4 gap-4 text-center text-[9px] font-black text-slate-700 mt-12 border-t border-slate-300 pt-4">
            <div class="space-y-10">
              <p>مستلم البونات والموقع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>المكتب الفني ومراجع الكميات</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>المدير المالي للموقع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>اعتماد مدير المشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 500);
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  };

  const [formState, setFormState] = useState({
    date: new Date().toISOString().split('T')[0],
    ticketNo: '',
    truckPlate: '',
    trailerPlate: '',
    driverName: '',
    rawQuantity: '',
    qualityDiscount: '0',
    loadDiscount: '0',
    unitPrice: '',
    supplierName: '',
    supplyLocation: 'برج العرب الجديدة - قطاع الطرق الموزع',
    itemCode: '',
    supplyMethod: 'truck' as 'truck' | 'ton' | 'piece' | 'cubic',
    isWaterBillApproved: false,
    notes: '',
    ledgerNo: '1',
    selectedDeliveryMethodId: '' 
  });

  const computedNetAndCost = useMemo(() => {
    const raw = parseArabicNumber(formState.rawQuantity);
    const qualityD = parseArabicNumber(formState.qualityDiscount);
    const loadD = parseArabicNumber(formState.loadDiscount);
    const price = parseArabicNumber(formState.unitPrice);

    const net = Math.max(0, raw - qualityD - loadD);
    const cost = net * price;

    return { net, cost };
  }, [formState.rawQuantity, formState.qualityDiscount, formState.loadDiscount, formState.unitPrice]);

  const filteredRecords = useMemo(() => {
    let result = [...supplyRecords];

    if (searchQuery.trim()) {
      const queries = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter(r => {
        return queries.every(q => 
          (r.ticketNo || '').toLowerCase().includes(q) ||
          (r.truckPlate || '').toLowerCase().includes(q) ||
          (r.trailerPlate || '').toLowerCase().includes(q) ||
          (r.driverName || '').toLowerCase().includes(q) ||
          (r.notes || '').toLowerCase().includes(q)
        );
      });
    }

    if (filterSupplier !== 'all') {
      result = result.filter(r => r.supplierName === filterSupplier);
    }

    if (filterItem !== 'all') {
      result = result.filter(r => r.itemCode === filterItem);
    }

    return result;
  }, [supplyRecords, searchQuery, filterSupplier, filterItem]);

  const sortedRecords = useMemo(() => {
    let result = [...filteredRecords];
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.key];
        let bVal: any = b[sortConfig.key];

        // Handle ticketNo as numeric if possible, else string
        if (sortConfig.key === 'ticketNo') {
          const aN = parseInt(aVal);
          const bN = parseInt(bVal);
          if (!isNaN(aN) && !isNaN(bN)) {
            aVal = aN;
            bVal = bN;
          }
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filteredRecords, sortConfig]);

  const requestSort = (key: 'ticketNo' | 'date') => {
    if (!sortConfig || sortConfig.key !== key) {
      setSortConfig({ key, direction: 'asc' });
    } else if (sortConfig.direction === 'asc') {
      setSortConfig({ key, direction: 'desc' });
    } else {
      setSortConfig(null);
    }
  };

  const getSortIcon = (key: 'ticketNo' | 'date') => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 inline text-slate-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 inline text-indigo-600" /> : <ArrowDown className="h-3 w-3 inline text-indigo-600" />;
  };

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(suppliers.map(s => s.name))).sort();
  }, [suppliers]);

  const handleOpenAdd = () => {
    const lastRec = supplyRecords.length > 0 ? supplyRecords[supplyRecords.length - 1] : null;

    // Find max ticketNo to suggest the next one
    let nextTicketNo = '';
    const numericTickets = supplyRecords
      .map(r => parseInt(r.ticketNo))
      .filter(n => !isNaN(n));
    if (numericTickets.length > 0) {
      nextTicketNo = (Math.max(...numericTickets) + 1).toString();
    }

    setEditingId(null);
    setVehicleSearch('');
    setFormState({
      date: new Date().toISOString().split('T')[0],
      ticketNo: nextTicketNo,
      truckPlate: '',
      trailerPlate: '',
      driverName: '',
      rawQuantity: '',
      qualityDiscount: '0',
      loadDiscount: '0',
      unitPrice: lastRec ? (supplyItems.find(i => i.code === lastRec.itemCode)?.defaultPrice?.toString() || '') : '',
      supplierName: lastRec ? lastRec.supplierName : '',
      supplyLocation: 'برج العرب الجديدة - قطاع الطرق الموزع',
      itemCode: lastRec ? lastRec.itemCode : '',
      supplyMethod: 'truck',
      isWaterBillApproved: false,
      notes: '',
      ledgerNo: '1',
      selectedDeliveryMethodId: ''
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (rec: SupplyRecord) => {
    setEditingId(rec.id);
    setVehicleSearch('');
    setFormState({
      date: rec.date,
      ticketNo: rec.ticketNo,
      truckPlate: rec.truckPlate || '',
      trailerPlate: rec.trailerPlate || '',
      driverName: rec.driverName || '',
      rawQuantity: rec.rawQuantity.toString(),
      qualityDiscount: rec.qualityDiscount.toString(),
      loadDiscount: rec.loadDiscount.toString(),
      unitPrice: rec.unitPrice.toString(),
      supplierName: rec.supplierName,
      supplyLocation: rec.supplyLocation || 'برج العرب الجديدة - قطاع الطرق الموزع',
      itemCode: rec.itemCode,
      supplyMethod: (rec.supplyMethod as any) || 'truck',
      isWaterBillApproved: rec.isWaterBillApproved || false,
      notes: rec.notes || '',
      ledgerNo: rec.ledgerNo || '1',
      selectedDeliveryMethodId: ''
    });
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    const raw = parseFloat(formState.rawQuantity);
    const price = parseFloat(formState.unitPrice);

    if (isNaN(raw) || raw <= 0) return alert("الرجاء إدخال كمية صحيحة.");
    if (isNaN(price) || price < 0) return alert("الرجاء إدخال سعر صحيح.");

    const itemObj = supplyItems.find(i => i.code === formState.itemCode);
    const refNo = editingId ? (supplyRecords.find(r => r.id === editingId)?.referenceNo || `REC-${Date.now().toString().slice(-6)}`) : `REC-${Date.now().toString().slice(-6)}`;

    const recordData: SupplyRecord = {
      id: editingId || `sup-ticket-${Date.now()}`,
      referenceNo: refNo,
      date: formState.date,
      ticketNo: formState.ticketNo,
      truckPlate: formState.truckPlate,
      trailerPlate: formState.trailerPlate || undefined,
      driverName: formState.driverName,
      rawQuantity: raw,
      qualityDiscount: parseFloat(formState.qualityDiscount) || 0,
      loadDiscount: parseFloat(formState.loadDiscount) || 0,
      totalDiscount: (parseFloat(formState.qualityDiscount) || 0) + (parseFloat(formState.loadDiscount) || 0),
      netQuantity: computedNetAndCost.net,
      unitPrice: price,
      totalCost: computedNetAndCost.cost,
      supplierName: formState.supplierName,
      supplyLocation: formState.supplyLocation,
      itemCode: formState.itemCode,
      unit: itemObj?.unit || 'م٣',
      ledgerNo: formState.ledgerNo,
      isWaterBillApproved: formState.isWaterBillApproved,
      supplyMethod: formState.supplyMethod,
      notes: formState.notes,
      cubicCertificateId: editingId ? supplyRecords.find(r => r.id === editingId)?.cubicCertificateId : undefined
    };

    if (editingId) {
      onUpdateRecord(editingId, recordData);
      addAuditLog('تعديل بون توريد', 'التوريدات', `تم تعديل بون توريد ورقي رقم: ${recordData.ticketNo} مرجع: ${refNo} للمورد: ${recordData.supplierName}`);
    } else {
      onAddRecord(recordData);
      addAuditLog('تسجيل بون توريد', 'التوريدات', `تم تسجيل بون توريد جديد ورقي رقم: ${recordData.ticketNo} مرجع: ${refNo} للمورد: ${recordData.supplierName} (كمية: ${recordData.netQuantity} ${recordData.unit})`);
      localStorage.setItem('lastSupplyItemCode', formState.itemCode);
      localStorage.setItem('lastSupplySupplierName', formState.supplierName);
    }

    setShowFormModal(false);
  };

  const confirmDelete = () => {
    if (userRole === 'viewer') return;
    if (deleteConfirmId) {
      onDeleteRecord(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
              <FileSpreadsheet className="h-7 w-7 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">سجل التوريدات اليومية</h3>
              <p className="text-[11px] text-slate-500 font-medium">متابعة دقيقة لحركة دخول المواد الخام وربطها بالمقاولين</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-4 px-6 rounded-2xl flex items-center gap-2 transition-all shadow active:scale-95 border border-slate-200"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              طباعة البيان المفلتر
            </button>
            <button 
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تسجيل توريدات جديدة') : handleOpenAdd}
              disabled={userRole === 'viewer'}
              className={`group font-black text-xs py-4 px-8 rounded-2xl flex items-center gap-3 transition-all shadow-lg active:scale-95 ${
                userRole === 'viewer'
                  ? 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              <Plus className="h-4 w-4" />
              إضافة بون جديد
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
            <input
              type="text"
              placeholder="بحث برقم البون أو السيارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-right text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-right text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">جميع المقاولين</option>
            {uniqueSuppliers.map(sName => <option key={sName} value={sName}>{sName}</option>)}
          </select>

          <select
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-right text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">جميع المواد</option>
            {supplyItems.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/90 rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-xl hover:shadow-slate-100/40 transition-all duration-300">
        <div className="overflow-x-auto text-[13px]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/80 text-[11px] uppercase font-black tracking-widest text-slate-700 border-b border-slate-200">
                <th className="py-5 px-6 font-black text-slate-800 text-center cursor-pointer hover:bg-slate-200" onClick={() => requestSort('ticketNo')}>
                  <div className="flex items-center justify-center gap-1">رقم البون {getSortIcon('ticketNo')}</div>
                </th>
                <th className="py-5 px-6 font-black text-slate-800 text-center cursor-pointer hover:bg-slate-200" onClick={() => requestSort('date')}>
                  <div className="flex items-center justify-center gap-1">التاريخ {getSortIcon('date')}</div>
                </th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">المقاول</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">بند التوريد</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">الناقل / رقم السيارة</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">الكمية</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">الخصم الإجمالي</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">التكلفة</th>
                <th className="py-5 px-6 font-black text-slate-800 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {sortedRecords.map(rec => {
                const totalDisc = (parseArabicNumber(rec.qualityDiscount || '0') || 0) + (parseArabicNumber(rec.loadDiscount || '0') || 0);
                
                // Helper to get Arabic name of day of the week
                const getArabicDayName = (dateString: string) => {
                  if (!dateString) return '';
                  try {
                    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return '';
                    return days[date.getDay()];
                  } catch (e) {
                    return '';
                  }
                };

                const dayOfWeek = getArabicDayName(rec.date);

                return (
                  <tr key={rec.id} className="group hover:bg-slate-200/50 transition-all duration-200 even:bg-slate-50/40">
                    <td className="py-3 px-3 text-center bg-blue-50/20 group-hover:bg-blue-100/30">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-block bg-white text-blue-700 text-[10px] font-black font-mono px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                          #{rec.ticketNo}
                        </span>
                        {rec.referenceNo && (
                          <span className="text-[8px] text-blue-400 font-mono font-bold tracking-tight">{rec.referenceNo}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center bg-slate-50/20 group-hover:bg-slate-100/30 border-r border-slate-100/50">
                      <div className="text-slate-800 font-extrabold font-mono text-[11px] whitespace-nowrap">
                        <span className="text-[9px] text-slate-400 font-sans font-bold block">{dayOfWeek}</span> {rec.date}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-800 text-[11px] text-center whitespace-nowrap bg-indigo-50/20 group-hover:bg-indigo-100/30 border-r border-indigo-100/30">
                      {rec.supplierName}
                    </td>
                    <td className="py-3 px-3 text-center bg-emerald-50/20 group-hover:bg-emerald-100/30 border-r border-emerald-100/30">
                      <span className="inline-block bg-white text-emerald-700 text-[11px] font-black px-2 py-1 rounded-lg whitespace-nowrap border border-emerald-100 shadow-sm">
                        {supplyItems.find(i => i.code === rec.itemCode)?.name || rec.itemCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-slate-850 text-[11px] text-center whitespace-nowrap bg-amber-50/20 group-hover:bg-amber-100/30 border-r border-amber-100/30">
                      {rec.truckPlate} {rec.trailerPlate && <span className="text-slate-300">/</span>} {rec.trailerPlate}
                    </td>
                    <td className="py-3 px-3 font-mono text-center font-black text-slate-850 text-[12px] bg-sky-50/20 group-hover:bg-sky-100/30 border-r border-sky-100/30">
                      {((rec.netQuantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      <span className="text-[9px] font-sans font-black text-sky-400 mr-1">م٣</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-center text-[11px] bg-rose-50/20 group-hover:bg-rose-100/30 border-r border-rose-100/30">
                      {totalDisc > 0 ? (
                        <span className="text-rose-600 font-black">-{totalDisc.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300 font-bold">---</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-center text-[12px] bg-emerald-50/30 group-hover:bg-emerald-100/40 border-r border-emerald-200/30">
                      <span className="font-mono font-black text-emerald-700">
                        {((rec.totalCost || 0)).toLocaleString()}
                        <span className="text-[9px] font-sans font-black text-emerald-500 mr-1">ج.م</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center bg-slate-50/40 group-hover:bg-slate-100/50">
                      <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-all duration-150">
                        <button 
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية تعديل السجلات') : () => handleOpenEdit(rec)} 
                          className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all ${
                            userRole === 'viewer'
                              ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                              : 'text-slate-500 hover:text-indigo-600 bg-slate-100'
                          }`}
                          title="تعديل"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حذف السجلات') : () => handleDelete(rec.id)} 
                          disabled={userRole === 'viewer' || !!rec.cubicCertificateId} 
                          className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all ${
                            userRole === 'viewer'
                              ? 'text-slate-200 bg-slate-50 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 bg-slate-100 disabled:opacity-20'
                          }`}
                          title="حذف"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Flow */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
            
            {/* Sidebar Visual - Lightened */}
            <div className="hidden md:flex md:w-64 bg-slate-50 p-8 flex-col justify-between border-l border-slate-100">
              <div>
                <FileSpreadsheet className="h-10 w-10 mb-6 text-indigo-200" />
                <h3 className="text-xl font-black mb-2 text-slate-800">تسجيل توريد</h3>
                <p className="text-[11px] text-slate-500 font-medium">نظام تسجيل البونات الذكي لربط المقاولين بموقع المشروع بدقة تامة.</p>
              </div>
              <div className="space-y-4 text-[10px] font-black text-slate-400">
                <div className="flex items-center gap-2 border-r-2 border-indigo-500 pr-2 text-indigo-600">1. الأطراف والمادة</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-200 pr-2">2. وسيلة النقل</div>
                <div className="flex items-center gap-2 border-r-2 border-slate-200 pr-2">3. الجرد والماليات</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                <h3 className="text-lg font-black text-slate-900">{editingId ? 'تعديل بون' : 'إضافة بون جديد'}</h3>
                <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                <form id="ticket-form" onSubmit={handleSave} className="space-y-10">
                  {/* Section 1 */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3">المقاول والبند</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">المادة الخام *</label>
                        <select 
                          required 
                          value={formState.itemCode} 
                          onChange={e => {
                            const code = e.target.value;
                            const matches = suppliers.filter(s => s.materialCode === code);
                            setFormState({
                              ...formState, 
                              itemCode: code, 
                              supplierName: matches.length ? matches[0].name : '',
                              selectedDeliveryMethodId: '',
                              unitPrice: supplyItems.find(i => i.code === code)?.defaultPrice?.toString() || ''
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="" disabled>-- اختر المادة --</option>
                          {supplyItems.map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">المقاول المورد *</label>
                        <select 
                          required 
                          disabled={!formState.itemCode}
                          value={formState.supplierName} 
                          onChange={e => setFormState({...formState, supplierName: e.target.value, selectedDeliveryMethodId: ''})}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none disabled:opacity-30 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="" disabled>-- اختر المقاول --</option>
                          {suppliers.filter(s => s.materialCode === formState.itemCode).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className={`space-y-4 transition-all ${!formState.supplierName ? 'opacity-20 pointer-events-none' : ''}`}>
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r-4 border-emerald-500 pr-3">وسيلة النقل</h4>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                      {(() => {
                        const sData = suppliers.find(s => s.materialCode === formState.itemCode && s.name === formState.supplierName);
                        const methods = sData?.deliveryMethods || [];
                        const q = vehicleSearch.toLowerCase().trim();
                        const filtered = q ? methods.filter((m:any) => {
                          const searchable = [m.truckNumber, m.dumperNumber, m.personInCharge, m.driverName].filter(Boolean).join(' ');
                          return searchable.toLowerCase().includes(q);
                        }) : methods;

                        return (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <div className="relative group w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600" />
                                <input 
                                  placeholder="بحث رقم السيارة..." 
                                  value={vehicleSearch} 
                                  onChange={e => setVehicleSearch(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {filtered.map((m: any) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    const isV = ['قلاب', 'عربية'].includes(m.type);
                                    setFormState({
                                      ...formState,
                                      selectedDeliveryMethodId: m.id,
                                      truckPlate: m.type === 'قلاب' ? (m.dumperNumber || '') : (m.truckNumber || ''),
                                      trailerPlate: m.type === 'قلاب' && m.truckNumber !== 'بدون' ? (m.truckNumber || '') : '',
                                      driverName: m.driverName || m.personInCharge || '',
                                      rawQuantity: m.cubicCapacity && m.cubicCapacity !== 'مکعبة' ? m.cubicCapacity : '',
                                      supplyMethod: isV ? 'truck' : 'ton'
                                    });
                                  }}
                                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all min-h-[120px] ${
                                    formState.selectedDeliveryMethodId === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                  }`}
                                >
                                  <span className="text-[11px] font-black opacity-60 mb-2 uppercase tracking-tight">{m.type}</span>
                                  <span className="text-base font-black font-mono flex items-center gap-1.5 flex-wrap justify-center text-center">
                                    {m.type === 'قلاب' ? (
                                      <>
                                        {m.dumperNumber}
                                        {m.truckNumber && m.truckNumber !== 'بدون' && (
                                          <>
                                            <span className="text-slate-300 font-bold mx-0.5 whitespace-nowrap">\</span>
                                            <span className="text-indigo-600 underline underline-offset-4 decoration-indigo-200">{m.truckNumber}</span>
                                          </>
                                        )}
                                      </>
                                    ) : (m.truckNumber || m.dumperNumber || m.personInCharge || m.type)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Section 3 */}
                  {formState.selectedDeliveryMethodId && (
                    <div className="space-y-8 animate-fadeInUp">
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">التاريخ</label>
                            <input 
                              type="date" 
                              required 
                              value={formState.date} 
                              onChange={e => setFormState({...formState, date: e.target.value})} 
                              className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">رقم البون الورقي *</label>
                            <input 
                              type="text" 
                              required 
                              value={formState.ticketNo} 
                              onChange={e => setFormState({...formState, ticketNo: e.target.value})} 
                              className="w-full h-16 bg-amber-50 border border-amber-200 rounded-2xl px-4 text-center text-sm text-amber-700 font-black outline-none focus:ring-2 focus:ring-amber-500/20" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">الكمية الورقية</label>
                            <input 
                              type="text" 
                              required 
                              readOnly={formState.supplyMethod === 'truck'}
                              value={formState.rawQuantity} 
                              onChange={e => {
                                if (formState.supplyMethod !== 'truck') {
                                  setFormState({...formState, rawQuantity: e.target.value.replace(/[^0-9.]/g,'')});
                                }
                              }}
                              className={`w-full h-16 rounded-2xl px-4 text-center text-xl font-black outline-none transition-all ${
                                formState.supplyMethod === 'truck' 
                                  ? 'bg-indigo-50 border border-indigo-100 text-slate-500 cursor-not-allowed' 
                                  : 'bg-white border border-indigo-500 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10'
                              }`} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">السعر / الوحدة</label>
                            <input 
                              type="text" 
                              required 
                              readOnly
                              value={formState.unitPrice} 
                              className="w-full h-16 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 text-center text-xl font-black text-slate-500 cursor-not-allowed outline-none" 
                            />
                          </div>

                          {/* Second Row */}
                          <div className="lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 mr-1">اسم السائق / المستلم</label>
                            <input 
                              type="text" 
                              readOnly
                              value={formState.driverName} 
                              className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs text-slate-500 cursor-not-allowed outline-none" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block text-center">خصم الجودة</label>
                            <input 
                              type="text" 
                              placeholder="0"
                              value={formState.qualityDiscount} 
                              onChange={e => setFormState({...formState, qualityDiscount: e.target.value.replace(/[^0-9.]/g,'')})} 
                              className="w-full h-16 bg-red-50 border border-red-100 rounded-2xl px-4 text-center text-sm font-black text-red-600 outline-none focus:ring-2 focus:ring-red-500/20" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block text-center">خصم الحمولة</label>
                            <input 
                              type="text" 
                              placeholder="0"
                              value={formState.loadDiscount} 
                              onChange={e => setFormState({...formState, loadDiscount: e.target.value.replace(/[^0-9.]/g,'')})} 
                              className="w-full h-16 bg-red-50 border border-red-100 rounded-2xl px-4 text-center text-sm font-black text-red-600 outline-none focus:ring-2 focus:ring-red-500/20" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex bg-white border-2 border-slate-200 p-8 rounded-[2.5rem] justify-between items-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-full bg-slate-50 skew-x-12 translate-x-16"></div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">صافي الجرد الميكانيكي</p>
                          <p className="text-4xl font-black text-slate-900">{computedNetAndCost.net.toLocaleString()} <span className="text-sm font-medium opacity-60">م٣</span></p>
                        </div>
                        <div className="text-left relative z-10">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">تكلفة الشحنة</p>
                          <p className="text-3xl font-black text-emerald-600">{computedNetAndCost.cost.toLocaleString()} <span className="text-xs font-medium opacity-60">ج.م</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                <button type="submit" form="ticket-form" disabled={!formState.selectedDeliveryMethodId} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95">اعتماد وتسجيل البون</button>
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold py-4 rounded-2xl transition-colors">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="حذف البون"
        message="هل تريد حذف هذا البون نهائياً؟"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Print Settings Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                إعدادات طباعة بيان التوريدات
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-slate-500 mb-2">نوع التقرير للطباعة:</p>
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-indigo-900">
                  كشف بيان حركة التوريدات اليومية والكلية (المفلترة والمفرزة حالياً)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">حجم الورقة:</label>
                  <select
                    value={printPaperSize}
                    onChange={(e: any) => setPrintPaperSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="A4">A4 (قياسي)</option>
                    <option value="A3">A3 (كبير جداً)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">اتجاه الصفحة:</label>
                  <select
                    value={printOrientation}
                    onChange={(e: any) => setPrintOrientation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="portrait">رأسي (Portrait)</option>
                    <option value="landscape">أفقي (Landscape)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  handlePrintRecords(printPaperSize, printOrientation);
                  setShowPrintModal(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition text-center text-xs"
              >
                تأكيد وأمر الطباعة
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-3 rounded-xl transition text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
