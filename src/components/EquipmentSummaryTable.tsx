import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Coins, 
  Droplet, 
  Wrench,
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  Target
} from 'lucide-react';
import { EquipmentSummary, FuelLogRecord } from '../types';

interface EquipmentSummaryTableProps {
  equipmentList: EquipmentSummary[];
  selectedEqId: string;
  setSelectedEqId: (id: string) => void;
  fuelLogs: FuelLogRecord[];
  transactions: any[];
  userRole?: string;
  setShowAddEqModal: (val: boolean) => void;
  handleStartEditEq: (eq: EquipmentSummary) => void;
  handleDeleteEq: (id: string, name: string) => void;
  // Calc helpers
  getEquipmentTotalDuration: (eq: EquipmentSummary) => number;
  getDurationSuffix: (label: string) => string;
  getEquipmentDailyRate: (eq: EquipmentSummary) => number;
  getEquipmentCost: (eq: EquipmentSummary) => number;
  getEquipmentDiscount: (eq: EquipmentSummary) => number;
  getEquipmentSpent: (eq: EquipmentSummary) => number;
  getEquipmentRemaining: (eq: EquipmentSummary) => number;
  totalGeneralEquipmentCost: number;
  totalRentedCost: number;
  totalFuel: number;
  totalRentedRemaining: number;
}

export default function EquipmentSummaryTable({
  equipmentList,
  selectedEqId,
  setSelectedEqId,
  fuelLogs,
  userRole,
  setShowAddEqModal,
  handleStartEditEq,
  handleDeleteEq,
  getEquipmentTotalDuration,
  getDurationSuffix,
  getEquipmentDailyRate,
  getEquipmentCost,
  getEquipmentDiscount,
  getEquipmentSpent,
  getEquipmentRemaining,
  totalGeneralEquipmentCost,
  totalRentedCost,
  totalFuel,
  totalRentedRemaining
}: EquipmentSummaryTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="text-right space-y-1">
          <h3 className="font-black text-slate-900 text-xl tracking-tight">تقرير أداء وحسابات وتكاليف المعدات الإجمالي</h3>
          <p className="text-xs text-slate-500 font-bold">اضغط على أي معدة لتفريغ سركي تشغيلها المفصل وعرض اليوميات بدقة بالجدول أدناه.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الإضافة') : () => setShowAddEqModal(true)}
            disabled={userRole === 'viewer'}
            className={`px-5 py-2.5 ${userRole === 'viewer' ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-slate-900 active:scale-95'} text-white rounded-2xl text-xs font-black transition-all shadow-lg flex items-center gap-2`}
          >
            <Plus size={16} />
            تسجيل معدة جديدة
          </button>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            نظام الحسابات مربوط بـ {equipmentList.length} آلات نشطة
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-inner">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="py-4 px-5">المعدة</th>
              <th className="py-4 px-5 text-center">السائق</th>
              <th className="py-4 px-5 text-center font-sans tracking-tight">اليومية / فئة الساعة</th>
              <th className="py-4 px-5 text-center">مدة العمل</th>
              <th className="py-4 px-5 text-center">التكلفة</th>
              <th className="py-4 px-5 text-center">إجمالي الخصم</th>
              <th className="py-4 px-5 text-center">منصرف / سلفة</th>
              <th className="py-4 px-5 text-center">المتبقي</th>
              <th className="py-4 px-5 text-center">المحروقات</th>
              <th className="py-4 px-5 text-left rounded-l-none">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* COMPANY EQUIPMENT SECTION */}
            <tr className="bg-indigo-50/40 text-indigo-950 font-black border-y border-indigo-100/60 sticky top-0 z-10">
              <td colSpan={10} className="p-3 text-right pr-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <Wrench size={14} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">معدات وآليات المشروع (ملك الشركة)</span>
                </div>
              </td>
            </tr>
            {equipmentList.filter(e => !e.isRental).map((eq) => {
              const totalDur = getEquipmentTotalDuration(eq);
              const discount = getEquipmentDiscount(eq);
              const spent = getEquipmentSpent(eq);
              const isSelected = selectedEqId === eq.id;
              return (
                <tr 
                  key={eq.id}
                  onClick={() => setSelectedEqId(eq.id)}
                  className={`group transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50/50 font-black border-r-4 border-indigo-600 shadow-md ring-1 ring-indigo-200' 
                      : 'hover:bg-slate-50 border-b border-slate-50'
                  }`}
                >
                  <td className="py-4 px-5 font-black text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-indigo-600 scale-125 shadow-sm' : 'bg-slate-300 group-hover:bg-indigo-400'}`}></div>
                      <span>{eq.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-800 text-center font-bold">
                    {eq.driver || <span className="text-slate-300 italic text-[10px]">غير معين</span>}
                  </td>
                  <td className="py-4 px-5 text-slate-300 text-center font-mono italic">-</td>
                  <td className="py-4 px-5 text-slate-900 font-mono font-black text-center">
                    <span className="bg-white text-slate-700 px-3 py-1.5 rounded-xl text-[10px] border border-slate-200 shadow-sm">
                      {totalDur.toLocaleString('ar-EG', { minimumFractionDigits: 1 })} {getDurationSuffix(eq.durationLabel)}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-300 text-center font-mono italic">-</td>
                  <td className="py-4 px-5 text-center font-mono font-black text-emerald-700">
                    {discount ? `${discount.toLocaleString('ar-EG')} ج` : <span className="text-slate-200">-</span>}
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-black text-rose-700">
                    {spent ? `${spent.toLocaleString('ar-EG')} ج` : <span className="text-slate-200">0</span>}
                  </td>
                  <td className="py-4 px-5 text-slate-300 text-center font-mono italic">-</td>
                  <td className="py-4 px-4 text-slate-900 font-mono font-black text-center">
                    {(() => {
                      const fCost = fuelLogs.filter(l => l.equipmentName === eq.name).reduce((sum, l) => sum + l.cost, 0);
                      return fCost ? (
                        <div className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                           <Droplet size={10} className="fill-current" />
                           <span>{fCost.toLocaleString('ar-EG')} ج</span>
                        </div>
                      ) : <span className="text-slate-200">-</span>;
                    })()}
                  </td>
                  <td className="py-4 px-5 text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 pr-2">
                       <button
                         onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditEq(eq)}
                         disabled={userRole === 'viewer'}
                         className={`p-1.5 ${userRole === 'viewer' ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} rounded-xl transition-colors`}
                       >
                         <span className="text-[10px] font-black italic">✎ تعديل</span>
                       </button>
                       <button
                         onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteEq(eq.id, eq.name)}
                         disabled={userRole === 'viewer'}
                         className={`p-1.5 ${userRole === 'viewer' ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'} rounded-xl transition-colors`}
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* RENTED EQUIPMENT SECTION */}
            <tr className="bg-amber-50/40 text-amber-950 font-black border-y border-amber-100/60 sticky top-0 z-10">
              <td colSpan={10} className="p-3 text-right pr-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                    <Coins size={14} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">معدات عهد ومقاولي الإيجار والخدمات الخارجية</span>
                </div>
              </td>
            </tr>
            {equipmentList.filter(e => e.isRental).map((eq) => {
              const totalDur = getEquipmentTotalDuration(eq);
              const cost = getEquipmentCost(eq);
              const discount = getEquipmentDiscount(eq);
              const spent = getEquipmentSpent(eq);
              const remaining = getEquipmentRemaining(eq);
              const isSelected = selectedEqId === eq.id;

              return (
                <tr 
                  key={eq.id}
                  onClick={() => setSelectedEqId(eq.id)}
                  className={`group transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-50/50 font-black border-r-4 border-amber-500 shadow-md ring-1 ring-amber-200' 
                      : 'hover:bg-slate-50 border-b border-slate-50'
                  }`}
                >
                  <td className="py-4 px-5 font-black text-slate-900 pr-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-amber-500 scale-125 shadow-sm' : 'bg-slate-300 group-hover:bg-amber-400'}`}></div>
                      <span>{eq.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-800 text-center font-bold">
                    {eq.driver || <span className="text-slate-300 italic text-[10px]">غير معين</span>}
                  </td>
                  <td className="py-4 px-5 text-slate-850 font-mono font-black text-center">
                    <div className="flex flex-col items-center">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-[10px] font-black border border-indigo-100/80 shadow-sm">
                        {eq.rate.toLocaleString('ar-EG')} / {eq.durationLabel}
                      </span>
                      {(eq.durationLabel !== 'يومية' && eq.durationLabel !== 'ساعة') && (
                        <span className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                          يومية: {Math.round(getEquipmentDailyRate(eq)).toLocaleString()} ج
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-900 font-mono font-black text-center">
                    <span className="bg-white text-slate-700 px-3 py-1.5 rounded-xl text-[10px] border border-slate-200 shadow-sm">
                      {totalDur.toLocaleString('ar-EG', { minimumFractionDigits: 1 })} {getDurationSuffix(eq.durationLabel)}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-blue-800 font-mono font-black text-center">
                    {cost.toLocaleString('ar-EG')} ج
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-black text-emerald-700 italic">
                    {discount ? `${discount.toLocaleString('ar-EG')} ج` : <span className="text-slate-200">-</span>}
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-black text-rose-700">
                    {spent ? `${spent.toLocaleString('ar-EG')} ج` : <span className="text-slate-200">0</span>}
                  </td>
                  <td className={`py-4 px-5 font-mono font-black text-center ${remaining < 0 ? 'text-rose-600 bg-rose-50/30' : 'text-emerald-700 bg-emerald-50/30'}`}>
                    {remaining.toLocaleString('ar-EG', { minimumFractionDigits: 0 })} ج
                  </td>
                  <td className="py-4 px-5 text-slate-900 font-mono font-black text-center">
                     {(() => {
                        const fCost = fuelLogs.filter(l => l.equipmentName === eq.name).reduce((sum, l) => sum + l.cost, 0);
                        return fCost ? fCost.toLocaleString('ar-EG') + " ج" : "-";
                     })()}
                  </td>
                  <td className="py-4 px-5 text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 pr-2">
                       <button
                         onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditEq(eq)}
                         disabled={userRole === 'viewer'}
                         className={`p-1.5 ${userRole === 'viewer' ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} rounded-xl transition-colors`}
                       >
                         <span className="text-[10px] font-black italic">✎ تعديل</span>
                       </button>
                       <button
                         onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteEq(eq.id, eq.name)}
                         disabled={userRole === 'viewer'}
                         className={`p-1.5 ${userRole === 'viewer' ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'} rounded-xl transition-colors`}
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* TOTALS FOOTER SECTION */}
            <tr className="bg-slate-950 text-white font-black text-[11px] border-t-2 border-slate-800 uppercase tracking-widest text-center shadow-2xl">
              <td colSpan={3} className="py-5 px-6 font-black text-amber-400">
                <div className="flex items-center gap-3 justify-center">
                   <Target size={18} />
                   <span>الإجمالي العام للموقع والآليات النشطة</span>
                </div>
              </td>
              <td className="py-5 px-5 bg-slate-900/50">
                 <div className="flex flex-col">
                   <span className="text-indigo-400">{equipmentList.reduce((sum, e) => sum + getEquipmentTotalDuration(e), 0).toLocaleString('ar-EG')}</span>
                   <span className="text-[7px] text-slate-500 tracking-tighter">وحدات تشغيل</span>
                 </div>
              </td>
              <td className="py-5 px-5 text-blue-400">
                 {totalRentedCost.toLocaleString('ar-EG')} ج
              </td>
              <td className="py-5 px-5 text-emerald-400">
                 {equipmentList.reduce((sum, e) => sum + getEquipmentDiscount(e), 0).toLocaleString('ar-EG')} ج
              </td>
              <td className="py-5 px-5 text-rose-400">
                 {equipmentList.reduce((sum, e) => sum + getEquipmentSpent(e), 0).toLocaleString('ar-EG')} ج
              </td>
              <td className="py-5 px-5 text-emerald-500 text-[13px] font-black">
                 {totalRentedRemaining.toLocaleString('ar-EG')} ج
              </td>
              <td className="py-5 px-5 text-amber-500">
                 {totalFuel.toLocaleString('ar-EG')} ج
              </td>
              <td className="py-5 px-5 text-slate-800 bg-slate-900/30 italic">FINAL</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* METRICS SUMMARY BAR */}
      {(() => {
        const totalEquipmentSpent = equipmentList.reduce((sum, e) => sum + getEquipmentSpent(e), 0);
        const remainingLessFuel = totalRentedCost - totalEquipmentSpent;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* 1. التزامات التشغيل */}
            <motion.div 
              whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="p-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg flex flex-col justify-between space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                  إجمالي التزامات التشغيل
                </span>
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {totalRentedCost.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">ج.م</span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium">قيمة تشغيل المعدات المستأجرة بالكامل</p>
              </div>
            </motion.div>

            {/* 2. المحروقات */}
            <motion.div 
              whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="p-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/20 shadow-lg flex flex-col justify-between space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <span className="block text-[10px] text-blue-600 font-black uppercase tracking-widest leading-relaxed">
                  إجمالي المحروقات والديزل
                </span>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Droplet size={18} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-blue-700 leading-none">
                    {totalFuel.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-xs text-blue-500 font-bold uppercase tracking-tight">ج.م</span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium">إجمالي تكلفة تموين بونات المحروقات للموقع</p>
              </div>
            </motion.div>

            {/* 3. المسدد */}
            <motion.div 
              whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="p-5 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 shadow-lg flex flex-col justify-between space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <span className="block text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-relaxed">
                  إجمالي المسدد والمصروف
                </span>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Coins size={18} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-emerald-700 leading-none">
                    {totalEquipmentSpent.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-xs text-emerald-500 font-bold uppercase tracking-tight">ج.م</span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium">سلف السائقين، العهد والمنصرف المالي التراكمي</p>
              </div>
            </motion.div>

            {/* 4. المتبقي */}
            <motion.div 
              whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
              className="p-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-lg flex flex-col justify-between space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <span className="block text-[10px] text-amber-700 font-black uppercase tracking-widest leading-relaxed">
                  صافي المتبقي والمستحق
                </span>
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <Target size={18} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-amber-600 leading-none">
                    {remainingLessFuel.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-tight">ج.م</span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-1">التزامات التشغيل - المسدد (بدون المحروقات)</p>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
