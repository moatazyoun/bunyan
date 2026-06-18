import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Plus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Printer, 
  Layers, 
  FileSpreadsheet, 
  AlertCircle 
} from 'lucide-react';
import { SupplyRecord, SupplyItem } from '../types';

interface SupplierPayment {
  id: string;
  supplierName: string;
  date: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank' | 'custody';
  referenceNo: string;
  notes: string;
}

interface SuppliesAccountTabProps {
  suppliers: any[];
  supplyRecords: SupplyRecord[];
  supplierPayments: SupplierPayment[];
  supplyItems: SupplyItem[];
  onAddTransaction?: (tx: any) => void;
  onAddRecord?: (rec: SupplyRecord) => void;
}

export default function SuppliesAccountTab({
  suppliers,
  supplyRecords,
  supplierPayments,
  supplyItems,
  onAddTransaction,
  onAddRecord
}: SuppliesAccountTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [showAddRecordFor, setShowAddRecordFor] = useState<string | null>(null);
  const [newRecordState, setNewRecordState] = useState({
    date: new Date().toISOString().split('T')[0],
    ticketNo: '',
    truckPlate: '',
    trailerPlate: '',
    driverName: '',
    rawQuantity: '',
    cubicCertificateId: '',
    notes: ''
  });

  const handleQuickAddRecord = (e: React.FormEvent, supplier: any) => {
    e.preventDefault();
    if (!onAddRecord) return;
    
    const material = supplyItems.find(i => i.code === supplier.materialCode);
    const unitPrice = material ? material.defaultPrice : 0;
    const rawQty = parseFloat(newRecordState.rawQuantity) || 0;

    const record: SupplyRecord = {
      id: `sup-ticket-${Date.now()}`,
      date: newRecordState.date,
      ticketNo: newRecordState.ticketNo,
      truckPlate: newRecordState.truckPlate,
      trailerPlate: newRecordState.trailerPlate,
      driverName: newRecordState.driverName,
      rawQuantity: rawQty,
      qualityDiscount: 0,
      loadDiscount: 0,
      totalDiscount: 0,
      netQuantity: rawQty,
      unitPrice: unitPrice,
      totalCost: rawQty * unitPrice,
      supplierName: supplier.name,
      supplyLocation: 'الموقع المستهدف',
      itemCode: supplier.materialCode || '',
      supplyMethod: 'truck',
      cubicCertificateId: newRecordState.cubicCertificateId || undefined,
      isWaterBillApproved: false,
      ledgerNo: 'عام',
      notes: newRecordState.notes
    };

    onAddRecord(record);
    setShowAddRecordFor(null);
    setNewRecordState({
      date: new Date().toISOString().split('T')[0],
      ticketNo: '',
      truckPlate: '',
      trailerPlate: '',
      driverName: '',
      rawQuantity: '',
      cubicCertificateId: '',
      notes: ''
    });
  };

  // Calculate detailed financials for each supplier
  const supplierCalculations = useMemo(() => {
    const grouped = suppliers.reduce((acc, s) => {
      if (!acc[s.name]) {
        acc[s.name] = {
          ids: [s.id],
          name: s.name,
          phone: s.phone,
          materials: []
        };
      } else {
        acc[s.name].ids.push(s.id);
      }
      
      const records = supplyRecords.filter(r => r.supplierName === s.name && r.itemCode === s.materialCode);
      const totalQuantity = records.reduce((sum, r) => sum + r.netQuantity, 0);
      const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);

      acc[s.name].materials.push({
        materialCode: s.materialCode,
        records,
        totalQuantity,
        totalCost
      });
      
      return acc;
    }, {} as any);
    
    return Object.values(grouped).map((group: any) => {
      const payments = supplierPayments.filter(p => p.supplierName === group.name);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      
      const totalCost = group.materials.reduce((sum: any, m: any) => sum + m.totalCost, 0);
      const totalQuantity = group.materials.reduce((sum: any, m: any) => sum + m.totalQuantity, 0);
      const balance = totalCost - totalPaid;
      
      return { ...group, payments, totalPaid, totalCost, totalQuantity, balance };
    });
  }, [suppliers, supplyRecords, supplierPayments]);

  const totalSuppliesCost = supplierCalculations.reduce((sum, s) => sum + s.totalCost, 0);
  const totalPaidToSuppliers = supplierCalculations.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalOutstandingBalance = supplierCalculations.reduce((sum, s) => sum + s.balance, 0);

  // Filter based on search query
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return supplierCalculations;
    const q = searchQuery.toLowerCase().trim();
    return supplierCalculations.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.notes || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  }, [supplierCalculations, searchQuery]);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً عهدة موقع';
      case 'check': return 'شيك بنكي مؤجل';
      case 'bank': return 'تحويل بنكي / حساب';
      case 'custody': return 'من خلال عهدة مهندس';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500">إجمالي مستحقات التوريد</p>
            <Coins className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5 font-mono">{totalSuppliesCost.toLocaleString()} <span className="text-xs text-indigo-400">ج.م</span></p>
          <div className="text-[10px] text-slate-400 mt-1">تراكمي التوريدات الهندسية بالموقع</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500">إجمالي المسدد والمصروف للموردين</p>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5 font-mono">{totalPaidToSuppliers.toLocaleString()} <span className="text-xs text-emerald-400">ج.م</span></p>
          <div className="text-[10px] text-slate-400 mt-1">كافة الدفعات البنكية والعينية وحسابات العهدة</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500">المتبقي / المديونية القائمة</p>
            <CreditCard className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5 font-mono">{totalOutstandingBalance.toLocaleString()} <span className="text-xs text-red-400">ج.م</span></p>
          <div className="text-[10px] text-slate-400 mt-1">المستحق للدفع وتصفية أرصدة الجرد</div>
        </div>
      </div>

      {/* Supplier Account management section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              كشف الأرصدة وحساب الموردين تصفية نهائية
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة كميات التوريد، التكاليف المحملة والمدفوعات المتتالية لكل مقاول توريد باطن
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="بحث باسم المورد، المذكرة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-4 pr-10 text-right text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 placeholder-slate-400"
            />
            <Search className="absolute left-auto right-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="space-y-3">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3">
              <User className="h-10 w-10 text-slate-300" />
              <div className="text-slate-500 font-bold text-sm">لا يوجد موردين مضافين</div>
              <div className="text-slate-400 text-xs">قم بإضافة موردين من علامة تبويب "إعدادات التوريدات" للبدء</div>
            </div>
          ) : (
            filteredSuppliers.map((s: any) => {
              const isExpanded = expandedSupplierId === s.ids[0]; // expand by first ID
              return (
                <div 
                  key={s.ids[0]} 
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all overflow-hidden ${
                    isExpanded ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                {/* Header Row */}
                <div 
                  onClick={() => setExpandedSupplierId(isExpanded ? null : s.ids[0])}
                  className="p-4 grid grid-cols-1 md:grid-cols-[2fr,auto,auto] gap-4 items-center cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-500 hidden md:block">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                          يورد: {s.materials.length} بنود
                        </span>
                        <span>رقم الهاتف: {s.phone || 'غير مسجل'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-8 text-center font-mono w-full px-2">
                    <div className="w-24 mx-auto border-l border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 text-center">كمية إجمالية</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{s.totalQuantity.toLocaleString()} م٣</div>
                    </div>
                    <div className="w-24 mx-auto border-l border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 text-center">القيمة الكلية</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{s.totalCost.toLocaleString()} ج.م</div>
                    </div>
                    <div className="w-24 mx-auto">
                      <div className="text-[10px] font-bold text-slate-500 text-center">رصيد مستحق</div>
                      <div className="text-xs font-black text-red-600 mt-0.5">{s.balance.toLocaleString()} ج.م</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end md:justify-center hidden md:flex">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Account Panels */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-6">
                    {/* Materials loop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                       {s.materials.map((m: any) => (
                         <div key={m.materialCode} className="bg-white p-4 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-xs text-indigo-700 mb-3">{supplyItems.find(i => i.code === m.materialCode)?.name}</h5>
                            {/* Materials records loop */}
                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                              {m.records.map((r: any) => (
                                 <div key={r.id} className="text-[10px] flex justify-between">
                                    <span>بون: {r.ticketNo}</span>
                                    <span>{r.netQuantity}</span>
                                 </div>
                              ))}
                            </div>
                         </div>
                       ))}
                    </div>
                    
                    {/* Payments */}
                    <div>
                      <h5 className="font-bold text-xs text-emerald-700 mb-2">الدفعات</h5>
                      <div className="text-xs font-bold text-slate-500">
                        المدفوعات: <span className="text-emerald-700 font-mono">{s.payments.length} دفعة</span>
                        <span className="ml-2">المسدد لليوم: <span className="text-emerald-700 font-mono">{s.totalPaid.toLocaleString()} ج.م</span></span>
                      </div>
                      <div className="max-h-[150px] overflow-y-auto mt-2 border border-slate-200 bg-white rounded-xl divide-y divide-slate-100 p-2">
                        {s.payments.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center text-xs gap-2 py-1">
                            <div className="font-black text-slate-900">{p.amount.toLocaleString()} ج.م</div>
                            <div className="text-[10px] text-slate-500">تاريخ: {p.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })
          )}
      </div>
      </div>
    </div>
  );
}
