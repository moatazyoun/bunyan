import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  TrendingDown, 
  Award, 
  CheckCircle,
  FileText,
  Calculator,
  Truck,
  Hash,
  Users,
  X
} from 'lucide-react';
import { CubicCertificate, SupplyRecord, SupplyItem, SiteWorker } from '../types';

import ConfirmationDialog from './ConfirmationDialog';

interface SuppliesCubicTabProps {
  certificates: CubicCertificate[];
  supplyRecords: SupplyRecord[];
  onAddCertificate: (cert: CubicCertificate, attachedTicketIds: string[]) => void;
  onUpdateCertificate: (id: string, cert: CubicCertificate, attachedTicketIds: string[]) => void;
  onDeleteCertificate: (id: string) => void;
  suppliers: any[];
  setContractorsReport: React.Dispatch<React.SetStateAction<any[]>>;
  supplyItems: SupplyItem[];
  workers: SiteWorker[];
}

export default function SuppliesCubicTab({
  certificates,
  supplyRecords,
  onAddCertificate,
  onDeleteCertificate,
  suppliers,
  setContractorsReport,
  supplyItems,
  workers,
  onUpdateCertificate
}: SuppliesCubicTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newCert, setNewCert] = useState({
    id: '', // تكويد المحضر
    title: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    dumperId: '',
    dumperCubic: '' as string | number,
    trailerCubic: '' as string | number,
    discounts: '0' as string | number,
    personPerformingMeasurement: '',
    approverOfMeasurement: '',
    engineerName: '',
    notes: ''
  });

  // Keep track of checked ticket IDs in the custom creation view
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  // All delivery methods across all suppliers for lookups
  const allDeliveryMethods = useMemo(() => 
    suppliers.flatMap(s => s.deliveryMethods || []), 
    [suppliers]
  );

  // Find all unattached (un-cubed) tickets of the chosen supplier
  const availableTickets = useMemo(() => {
    if (!newCert.supplierName) return [];
    return supplyRecords.filter(r => 
      r.supplierName === newCert.supplierName && 
      (!r.cubicCertificateId || r.cubicCertificateId === editingId)
    );
  }, [supplyRecords, newCert.supplierName, editingId]);

  // Derived: delivery methods (dumpers) for selected supplier
  const selectedSupplier = suppliers.find(s => s.name === newCert.supplierName);
  const deliveryMethods = selectedSupplier?.deliveryMethods || [];
  const selectedDumper = deliveryMethods.find((dm: any) => dm.id === newCert.dumperId);

  // Pre-fill selection when supplier changes
  useEffect(() => {
    // Select all available tickets of the selected supplier by default
    setSelectedTicketIds(availableTickets.map(t => t.id));
    if (newCert.supplierName) {
      // Create a default title like "محضر تكعيب سن - صلاح العجاري - 11 يونيو"
      const dateStr = new Date(newCert.date).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' });
      const certCode = `CERT-${certificates.length + 1}-${Date.now().toString().slice(-4)}`;
      
      setNewCert(prev => ({
        ...prev,
        id: prev.id || certCode,
        title: selectedDumper 
          ? `محضر تكعيب قلاب رقم ${selectedDumper.dumperNumber} - ${dateStr}`
          : `محضر تكعيب وتسويه - ${prev.supplierName} - ${dateStr}`
      }));
    }
  }, [newCert.supplierName, availableTickets, certificates.length, selectedDumper, newCert.date]);

  // Update dumper/trailer cubic when dumper changes
  useEffect(() => {
    if (selectedDumper) {
      const isDumperCubicNumeric = !isNaN(parseFloat(selectedDumper.cubicCapacity));
      const dateStr = new Date(newCert.date).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' });
      
      setNewCert(prev => ({
        ...prev,
        dumperCubic: isDumperCubicNumeric ? selectedDumper.cubicCapacity.toString() : '',
        trailerCubic: selectedDumper.truckNumber === 'بدون' ? '0' : '',
        // Update title to requested format: محضر تكعيب قلاب رقم [رقم القلاب] - [التاريخ]
        title: `محضر تكعيب قلاب رقم ${selectedDumper.dumperNumber} - ${dateStr}`
      }));
    }
  }, [selectedDumper, newCert.date]);

  // Helper function to parse any number
  const parseArabicNumber = (str: string | number | undefined) => {
    if (str === null || str === undefined || str === '') return 0;
    let s = str.toString().replace(/,/g, '.').replace(/٫/g, '.');
    s = s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculations
  const calculations = useMemo(() => {
    const dc = parseArabicNumber(newCert.dumperCubic);
    const tc = selectedDumper?.truckNumber === 'بدون' ? 0 : parseArabicNumber(newCert.trailerCubic);
    const total = dc + tc;
    const disc = parseArabicNumber(newCert.discounts);
    const net = Math.max(0, total - disc);

    const chosenTickets = availableTickets.filter(t => selectedTicketIds.includes(t.id));
    const ticketsVolume = chosenTickets.reduce((sum, t) => sum + t.netQuantity, 0);

    return {
      total,
      net,
      ticketsVolume,
      count: chosenTickets.length
    };
  }, [newCert.dumperCubic, newCert.trailerCubic, newCert.discounts, availableTickets, selectedTicketIds, selectedDumper]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const nextCode = `CERT-${certificates.length + 1}-${Date.now().toString().slice(-4)}`;
    setNewCert({
      id: nextCode,
      title: '',
      date: new Date().toISOString().split('T')[0],
      supplierName: suppliers[0]?.name || '',
      dumperId: '',
      dumperCubic: '',
      trailerCubic: '',
      discounts: '0',
      personPerformingMeasurement: workers[0]?.name || '',
      approverOfMeasurement: workers[1]?.name || workers[0]?.name || '',
      engineerName: '',
      notes: ''
    });
    setSelectedTicketIds([]);
    setShowAddModal(true);
  };

  const handleOpenEdit = (cert: CubicCertificate) => {
    setEditingId(cert.id);
    setNewCert({
      id: cert.id,
      title: cert.title,
      date: cert.date,
      supplierName: supplyRecords.find(r => r.cubicCertificateId === cert.id)?.supplierName || '',
      dumperId: cert.dumperId || '',
      dumperCubic: cert.dumperCubic || '',
      trailerCubic: cert.trailerCubic || '',
      discounts: cert.discounts || '0',
      personPerformingMeasurement: cert.personPerformingMeasurement || '',
      approverOfMeasurement: cert.approverOfMeasurement || '',
      engineerName: cert.engineerName || '',
      notes: cert.notes || ''
    });
    setSelectedTicketIds(cert.attachedTicketIds);
    setShowAddModal(true);
  };

  const handleToggleTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === availableTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(availableTickets.map(t => t.id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving certificate:", newCert);
    
    if (!newCert.id.trim()) {
      alert("الرجاء إدخال كود المحضر.");
      return;
    }

    if (!newCert.supplierName) {
      alert("الرجاء اختيار مقاول التوريد.");
      return;
    }

    if (!newCert.dumperId) {
      alert("الرجاء اختيار القلاب.");
      return;
    }

    if (!editingId || (editingId && certificates.find(c => c.id === editingId)?.dumperId !== newCert.dumperId)) {
      const exists = certificates.find(c => c.dumperId === newCert.dumperId);
      if (exists) {
        alert("تنبيه: لقد تم تسجيل محضر تكعيب لهذا القلاب مسبقاً (محضر رقم " + exists.id + "). لا يمكن إضافة أكثر من محضر لنفس القلاب.");
        return;
      }
    }

    try {
      // "Clean" data object: only include requested fields, remove anything else
      const finalCert: CubicCertificate = {
        id: newCert.id.trim(),
        title: newCert.title || (editingId ? `محضر تكعيب معدل رقم #${newCert.id}` : `محضر تكعيب معتمد رقم #${certificates.length + 1}`),
        date: newCert.date,
        attachedTicketIds: selectedTicketIds,
        calculatedVolume: calculations.ticketsVolume,
        approvedVolume: calculations.net,
        
        dumperId: newCert.dumperId,
        dumperCubic: parseArabicNumber(newCert.dumperCubic),
        trailerCubic: selectedDumper?.truckNumber === 'بدون' ? 0 : parseArabicNumber(newCert.trailerCubic),
        totalCubic: calculations.total,
        discounts: parseArabicNumber(newCert.discounts),
        netCubic: calculations.net,
        personPerformingMeasurement: newCert.personPerformingMeasurement,
        approverOfMeasurement: newCert.approverOfMeasurement,

        engineerName: newCert.engineerName,
        notes: newCert.notes || `تم تسوية بونات التوريد عدد (${selectedTicketIds.length}) بنجاح.`
      };

      console.log("Final Cert to save:", finalCert);
      
      if (editingId) {
        onUpdateCertificate(editingId, finalCert, selectedTicketIds);
      } else {
        onAddCertificate(finalCert, selectedTicketIds);
      }

      // Update the dumper in suppliers data
      setContractorsReport(prev => prev.map(supplier => {
        if (!supplier.deliveryMethods) return supplier;
        
        const hasDumper = supplier.deliveryMethods.some((dm: any) => dm.id === finalCert.dumperId);
        if (!hasDumper) return supplier;

        return {
          ...supplier,
          deliveryMethods: supplier.deliveryMethods.map((dm: any) => {
            if (dm.id === finalCert.dumperId) {
              return {
                ...dm,
                cubicRecordId: finalCert.id,
                cubicCapacity: finalCert.netCubic?.toString() // Update the capacity from net cubic
              };
            }
            return dm;
          })
        };
      }));
      
      setShowAddModal(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving certificate:", err);
      alert("حدث خطأ أثناء حفظ المحضر.");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteCertificate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Intro section & Action Button */}
      <div className="bg-indigo-600 p-6 rounded-3xl border border-indigo-400/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-indigo-100 relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <FileCheck className="h-5 w-5 text-indigo-100" />
            </div>
            إدارة محاضر التكعيب والقياس الهندسي
          </h3>
          <p className="text-xs text-indigo-100/80 mt-1.5 max-w-xl font-medium leading-relaxed">
            تسجيل محاضر تصفية وجرد كميات التوريد الواردة بالمقارنة مع المساحة المنفذة هندسياً لتسوية فروقات العجز
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="relative z-10 bg-white hover:bg-slate-50 text-indigo-600 font-black text-xs py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95 group"
        >
          <span className="text-base group-hover:scale-110 transition-transform">+</span>
          إصدار محضر تكعيب جديد
        </button>
      </div>

      {/* List of certificates */}
      {certificates.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-2 shadow-sm">
          <FileCheck className="h-12 w-12 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-500">لا توجد محاضر تكعيب مسجلة حالياً.</p>
          <p className="text-xs text-slate-400">انقر فوق "إصدار محضر تكعيب جديد" لتجميع بونات التوريدات لكل مورد في مستند تسوية رسمي ومطابق هندسياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map(c => {
            const difference = (c.netCubic ?? c.approvedVolume) - c.calculatedVolume;
            const diffPercent = c.calculatedVolume > 0 ? (difference / c.calculatedVolume) * 100 : 0;
            const hasDeficit = difference < 0;
            const dumper = allDeliveryMethods.find(dm => dm.id === c.dumperId);

            return (
              <div 
                key={c.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-indigo-500/25 transition-all shadow-sm hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black font-mono px-2 py-0.5 rounded border border-indigo-100">
                      محضر #{c.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {c.date}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-relaxed mb-1">
                      {dumper 
                        ? `محضر تكعيب قلاب رقم ${dumper.dumperNumber} ${dumper.truckNumber && dumper.truckNumber !== 'بدون' ? `/ ${dumper.truckNumber}` : ''}`
                        : c.title}
                    </h4>
                    <div className="flex flex-col gap-1 mt-2">
                        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          المقاول: {suppliers.find(s => s.deliveryMethods?.some((dm: any) => dm.id === c.dumperId))?.name || 'غير محدد'}
                        </p>
                        {dumper?.driverName && (
                           <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                             <User className="h-3 w-3" />
                             السائق: {dumper.driverName}
                           </p>
                        )}
                    </div>
                  </div>

                  {/* Volume breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-slate-400">قلاب</p>
                        <p className="text-[10px] font-mono font-black text-slate-600">{c.dumperCubic?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                        <p className="text-[8px] font-bold text-slate-400">مقطورة</p>
                        <p className="text-[10px] font-mono font-black text-slate-600">{c.trailerCubic?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-slate-400">الخصم</p>
                        <p className="text-[10px] font-mono font-black text-red-500">-{c.discounts?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                    <div className="text-center border-l border-slate-100 last:border-0 pr-1">
                      <p className="text-[9px] text-slate-400 font-bold mb-0.5">إجمالي البونات</p>
                      <p className="text-xs font-black text-slate-900 font-mono">{c.calculatedVolume.toFixed(2)} م٣</p>
                    </div>
                    <div className="text-center text-left">
                      <p className="text-[9px] text-slate-400 font-bold mb-0.5">التكعيب المعتمد</p>
                      <p className="text-xs font-black text-emerald-600 font-mono">{(c.netCubic ?? c.approvedVolume).toFixed(2)} م٣</p>
                    </div>
                  </div>

                   <div className="flex justify-between items-center px-1">
                      <div className="flex flex-col">
                         <span className="text-[8px] text-slate-400">القائم بالتكعيب</span>
                         <span className="text-[9px] font-bold text-slate-600">{c.personPerformingMeasurement || 'غير محدد'}</span>
                      </div>
                      <div className="flex flex-col text-left items-end">
                         <span className="text-[8px] text-slate-400">معتمد التكعيب</span>
                         <span className="text-[9px] font-bold text-slate-600">{c.approverOfMeasurement || 'غير محدد'}</span>
                      </div>
                   </div>

                  {/* Difference badge */}
                  <div className={`p-2 rounded-lg text-[10px] font-bold flex items-center justify-between font-mono ${
                    hasDeficit ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    <span className="flex items-center gap-1">
                       {hasDeficit ? <TrendingDown size={12} /> : <Award size={12} />}
                       فرق القياس:
                    </span>
                    <span>
                      {hasDeficit ? '' : '+'}{difference.toFixed(2)} م٣ 
                      ({diffPercent.toFixed(2)}%)
                    </span>
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-slate-400 border-t border-slate-50 pt-2 italic leading-normal truncate">
                      {c.notes}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-500">
                      تم تسوية {c.attachedTicketIds.length} بون توريد
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      title="تعديل المحضر"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      title="إلغاء وفك المحضر"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issuing New Certificate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-0 shadow-2xl relative overflow-hidden my-8">
            
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                {editingId ? `تعديل محضر تكعيب هندسي وتسويه رقم #${editingId}` : 'إصدار محضر تكعيب هندسي وتسويه جديد'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }} 
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Coding */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Hash className="h-3 w-3 text-indigo-500" />
                    تكويد المحضر *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCert.id}
                    onChange={(e) => setNewCert({...newCert, id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right text-xs font-bold text-indigo-600 focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                {/* Reporting Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-indigo-500" />
                    تاريخ المحضر
                  </label>
                  <input
                    type="date"
                    required
                    value={newCert.date}
                    onChange={(e) => setNewCert({...newCert, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right text-xs font-bold text-slate-700 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Award className="h-3 w-3 text-indigo-500" />
                    مقاول التوريد المعتمد *
                  </label>
                  <select
                    required
                    value={newCert.supplierName}
                    onChange={(e) => setNewCert({...newCert, supplierName: e.target.value, dumperId: ''})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right text-xs font-bold text-slate-700 focus:outline-none shadow-sm appearance-none"
                  >
                    <option value="" disabled>اختر مورد...</option>
                    {suppliers.map(s => {
                      const isDuplicate = suppliers.filter(sup => sup.name === s.name).length > 1;
                      const materialName = supplyItems.find(i => i.code === s.materialCode)?.name || s.materialCode;
                      const displayName = isDuplicate ? `${s.name} (${materialName})` : s.name;
                      return <option key={s.id} value={s.name}>{displayName}</option>;
                    })}
                  </select>
                </div>

                {/* Dumper Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Truck className="h-3 w-3 text-indigo-500" />
                    رقم القلاب المربوط *
                  </label>
                  <select
                    required
                    disabled={!newCert.supplierName}
                    value={newCert.dumperId}
                    onChange={(e) => setNewCert({...newCert, dumperId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right text-xs font-bold text-slate-700 focus:outline-none disabled:opacity-40 shadow-sm appearance-none"
                  >
                    <option value="" disabled>اختر القلاب/المقطورة...</option>
                    {deliveryMethods.filter((dm: any) => dm.type === 'قلاب').map((dm: any) => (
                      <option key={dm.id} value={dm.id}>
                        {dm.dumperNumber} - {dm.truckNumber === 'بدون' ? 'بدون مقطورة' : `مقطورة: ${dm.truckNumber}`} - {dm.driverName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Box for Cubic Calculations */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 shadow-inner">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Calculator className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-black text-slate-700">بيانات التكعيب الهندسية وصافي القياس</span>
                </div>

                {/* Desktop: Logical Horizontal Flow | Mobile: Stacked */}
                <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-2 justify-between">
                  
                  {/* Dumper Input */}
                  <div className="w-full lg:w-40">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 text-center">تكعيب القلاب (م٣)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      required
                      value={newCert.dumperCubic}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,٠-٩٫]/g, '');
                        setNewCert({...newCert, dumperCubic: val});
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-center text-sm font-mono font-black text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>

                  {/* Math Operator: + */}
                  <div className="hidden lg:flex items-center justify-center font-black text-slate-300 pointer-events-none pb-3">
                    +
                  </div>

                  {/* Trailer Input */}
                  <div className="w-full lg:w-40">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 text-center">تكعيب المقطورة (م٣)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required={selectedDumper?.truckNumber !== 'بدون'}
                      disabled={selectedDumper?.truckNumber === 'بدون'}
                      placeholder="0.00"
                      value={newCert.trailerCubic}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,٠-٩٫]/g, '');
                        setNewCert({...newCert, trailerCubic: val});
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-center text-sm font-mono font-black text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 disabled:bg-slate-100 shadow-sm transition-all"
                    />
                  </div>

                  {/* Math Operator: = */}
                  <div className="hidden lg:flex items-center justify-center font-black text-slate-300 pointer-events-none pb-3">
                    =
                  </div>

                  {/* Total Cubic (Read-Only) */}
                  <div className="w-full lg:w-40">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 text-center">التكعيب الكلي (م٣)</label>
                    <div className="w-full bg-slate-200 border border-slate-300 rounded-xl p-3 text-center text-sm font-mono font-black text-slate-700 shadow-inner">
                      {calculations.total.toFixed(2)}
                    </div>
                  </div>

                  {/* Math Operator: - */}
                  <div className="hidden lg:flex items-center justify-center font-black text-red-300 pointer-events-none pb-3">
                    -
                  </div>

                  {/* Discounts Input */}
                  <div className="w-full lg:w-40">
                    <label className="block text-[11px] font-bold text-red-600 mb-1.5 text-center">خصومات (م٣ / طن)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={newCert.discounts}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,٠-٩٫]/g, '');
                        setNewCert({...newCert, discounts: val});
                      }}
                      className="w-full bg-red-50/30 border border-red-200 rounded-xl p-3 text-center text-sm font-mono font-black text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-sm"
                    />
                  </div>

                  {/* Math Operator: = */}
                  <div className="hidden lg:flex items-center justify-center font-black text-emerald-400 pointer-events-none pb-3">
                    =
                  </div>

                  {/* Net Cubic (Final Result) */}
                  <div className="w-full lg:w-48 lg:flex-shrink-0">
                    <label className="block text-[12px] font-black text-emerald-700 mb-1.5 text-center">الصافي المعتمد (م٣)</label>
                    <div className="w-full bg-emerald-600 border border-emerald-700 rounded-xl p-3 text-center text-lg font-mono font-black text-white shadow-lg shadow-emerald-900/20 transform hover:scale-[1.02] transition-transform">
                      {calculations.net.toFixed(2)}
                    </div>
                  </div>

                </div>
              </div>

              {/* Personnel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <User className="h-3 w-3 text-indigo-500" />
                    القائم بالتكعيب *
                  </label>
                  <select
                    required
                    value={newCert.personPerformingMeasurement}
                    onChange={(e) => setNewCert({...newCert, personPerformingMeasurement: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right text-xs font-bold text-slate-700 focus:outline-none shadow-sm appearance-none"
                  >
                    <option value="" disabled>اختر موظف...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.name}>{w.name} ({w.jobTitle})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Users className="h-3 w-3 text-indigo-500" />
                    معتمد التكعيب *
                  </label>
                  <select
                    required
                    value={newCert.approverOfMeasurement}
                    onChange={(e) => setNewCert({...newCert, approverOfMeasurement: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-right text-xs font-bold text-slate-700 focus:outline-none shadow-sm appearance-none"
                  >
                    <option value="" disabled>اختر المسؤول المعتمِد...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.name}>{w.name} ({w.jobTitle})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tickets sub-selection */}
              {newCert.supplierName && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">ربط بونات التوريد ({availableTickets.length} بون متاح):</span>
                    <button 
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-indigo-600 hover:text-indigo-700 font-black transition-all text-[11px]"
                    >
                      {selectedTicketIds.length === availableTickets.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>

                  <div className="max-h-[140px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {availableTickets.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-slate-400 italic font-sans">لا توجد بونات توريد حرة لهذا المورد</div>
                    ) : (
                      availableTickets.map(t => {
                        const isChecked = selectedTicketIds.includes(t.id);
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => handleToggleTicket(t.id)}
                            className={`p-2.5 flex items-center justify-between text-[11px] cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? <CheckSquare className="h-3.5 w-3.5 text-indigo-600" /> : <Square className="h-3.5 w-3.5 text-slate-300" />}
                              <span className="font-bold text-slate-700 underline decoration-indigo-200 underline-offset-2">بون #{t.ticketNo}</span>
                              <span className="text-slate-400">• {t.date}</span>
                            </div>
                            <div className="font-mono font-black text-indigo-600">
                              {t.netQuantity.toLocaleString()} م٣
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 mr-1">مذكرات القياس والمطابقة الهندسية</label>
                <textarea
                  placeholder="ملاحظات اختيارية عن محضر التكعيب..."
                  value={newCert.notes}
                  onChange={(e) => setNewCert({...newCert, notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-right text-xs text-slate-700 h-16 focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm py-3 rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                >
                  {editingId ? 'حفظ التعديلات' : 'حفظ واعتماد محضر التكعيب'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                  }}
                  className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-sm py-3 rounded-2xl transition-all"
                >
                  إلغاء الأمر
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="إلغاء المحضر"
        message="هل تريد بالتأكيد إلغاء محضر التكعيب؟ سيتم فك ارتباط البونات وتكون قابلة للتكعيب مجدداً."
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
