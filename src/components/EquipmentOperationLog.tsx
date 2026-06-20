import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle,
  Hash,
  Save,
  Check,
  ChevronDown,
  Timer,
  AlertCircle
} from 'lucide-react';
import { OperationalLog, EquipmentSummary, Transaction } from '../types';

interface EquipmentOperationLogProps {
  activeEquipment: EquipmentSummary;
  userRole?: string;
  handleUpdateRecord: (workerId: string, updates: Partial<OperationalLog>, targetDate: string) => void;
  handleAddLog: (e: React.FormEvent) => void;
  handleDeleteLogIndex: (idx: number) => void;
  editingLogIdx: number | null;
  setEditingLogIdx: (idx: number | null) => void;
  editLogForm: Partial<OperationalLog>;
  setEditLogForm: (form: Partial<OperationalLog>) => void;
  handleSaveLogIndex: (idx: number) => void;
  // Shared state for new log row
  newLogDay: string;
  setNewLogDay: (val: string) => void;
  newLogDate: string;
  setNewLogDate: (val: string) => void;
  newLogFrom: string;
  setNewLogFrom: (val: string) => void;
  newLogTo: string;
  setNewLogTo: (val: string) => void;
  newLogDuration: string;
  setNewLogDuration: (val: string) => void;
  newLogDiscount: number;
  setNewLogDiscount: (val: number) => void;
  newLogDeductedHours: number;
  setNewLogDeductedHours: (val: number) => void;
  newLogNotes: string;
  setNewLogNotes: (val: string) => void;
  // Calc helpers
  getEquipmentCost: (eq: EquipmentSummary) => number;
  getEquipmentTotalDuration: (eq: EquipmentSummary) => number;
  getDurationSuffix: (label: string) => string;
}

export default function EquipmentOperationLog({
  activeEquipment,
  userRole,
  handleAddLog,
  handleDeleteLogIndex,
  editingLogIdx,
  setEditingLogIdx,
  editLogForm,
  setEditLogForm,
  handleSaveLogIndex,
  newLogDay,
  setNewLogDay,
  newLogDate,
  setNewLogDate,
  newLogFrom,
  setNewLogFrom,
  newLogTo,
  setNewLogTo,
  newLogDuration,
  setNewLogDuration,
  newLogDiscount,
  setNewLogDiscount,
  newLogDeductedHours,
  setNewLogDeductedHours,
  newLogNotes,
  setNewLogNotes,
  getEquipmentCost,
  getEquipmentTotalDuration,
  getDurationSuffix
}: EquipmentOperationLogProps) {

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
      {/* Header imitation from image 1 */}
      <div className="p-6 border-b-2 border-slate-900 bg-slate-50">
        <div className="text-right">
          <h2 className="text-2xl font-black text-rose-800 tracking-tighter uppercase mb-0.5">سركى تشغيل معدة بالموقع</h2>
          <div className="flex items-center justify-end gap-1.5 flex-row-reverse">
             <p className="text-xs text-slate-650 font-bold">سجلات وتقرير وساعات الحركة اليومية الحسابية</p>
             <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mt-0.5"></span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">المعدة المستهدفة</span>
            <div className="flex items-center justify-center gap-1.5">
               <span className="text-slate-900 font-black text-sm">{activeEquipment.name}</span>
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">كابتن / سائق المعدة</span>
            <span className="text-slate-900 font-black text-sm block">{activeEquipment.driver}</span>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">إجمالي وحدات العمل</span>
            <div className="flex items-center justify-center gap-1 text-indigo-600 font-mono font-black text-sm">
              <Clock size={14} />
              <span>{getEquipmentTotalDuration(activeEquipment).toLocaleString('ar-EG', { minimumFractionDigits: 1 })} {getDurationSuffix(activeEquipment.durationLabel)}</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm text-center space-y-1">
            <span className="text-[10px] text-rose-400 font-black uppercase tracking-tighter">التكلفة المالية (سركي)</span>
            <span className="text-rose-900 font-mono font-black text-sm block">
              {getEquipmentCost(activeEquipment) > 0 
                ? `${getEquipmentCost(activeEquipment).toLocaleString('ar-EG')} ج.م` 
                : 'معدة شركة'}
            </span>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
        <form onSubmit={handleAddLog} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-wider">التاريخ</label>
              <input
                type="date"
                required
                value={newLogDate}
                onChange={(e) => {
                  const date = e.target.value;
                  setNewLogDate(date);
                  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                  setNewLogDay(days[new Date(date).getDay()]);
                }}
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono font-bold transition-all"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-wider">اليوم</label>
              <div className="w-full text-xs p-3 bg-slate-100 border border-slate-200 rounded-xl font-black text-center text-slate-500 select-none">
                {newLogDay}
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-wider">بداية</label>
              <input
                type="text"
                placeholder="8:00 ص"
                value={newLogFrom}
                onChange={(e) => setNewLogFrom(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold text-center"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-wider">نهاية</label>
              <input
                type="text"
                placeholder="4:00 م"
                value={newLogTo}
                onChange={(e) => setNewLogTo(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold text-center"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-rose-500 mb-1.5 mr-1 uppercase tracking-wider">أعطال/خصم</label>
              <input
                type="number"
                step="0.5"
                value={newLogDeductedHours || ""}
                onChange={(e) => setNewLogDeductedHours(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-3 bg-rose-50/50 border border-rose-100 rounded-xl font-black text-center text-rose-700"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-indigo-500 mb-1.5 mr-1 uppercase tracking-wider">صافي العمل</label>
              <div className="w-full text-xs p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-center text-indigo-700">
                {newLogDuration} س
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
             <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-emerald-600 mb-1.5 mr-1 uppercase tracking-wider">منصرف مالي (ج.م)</label>
                <input
                  type="number"
                  value={newLogDiscount || ""}
                  onChange={(e) => setNewLogDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl font-black text-center text-emerald-700"
                />
             </div>
             <div className="md:col-span-8">
               <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-wider">بيان العمل / ملاحظات</label>
               <input
                 type="text"
                 placeholder="مثال: تسوية ترابية للمسار كـ 10 + نقل رتش"
                 value={newLogNotes}
                 onChange={(e) => setNewLogNotes(e.target.value)}
                 className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold"
               />
             </div>
             <div className="md:col-span-2">
               <button
                 type="submit"
                 disabled={userRole === 'viewer'}
                 className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 <Plus size={16} />
                 تسجيل اليومية
               </button>
             </div>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
              <th className="p-4 rounded-r-none">REF #</th>
              <th className="p-4">تاريخ</th>
              <th className="p-4">اليوم</th>
              <th className="p-4 text-center">أوقات العمل</th>
              <th className="p-4 text-center">التوقفات</th>
              <th className="p-4 text-center">الصافي</th>
              <th className="p-4 text-center">المنصرف</th>
              <th className="p-4">الملاحظات</th>
              <th className="p-4 text-left rounded-l-none">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeEquipment.logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400 font-bold">
                  <div className="flex flex-col items-center gap-3">
                    <Timer size={40} className="text-slate-200" />
                    <span>لا توجد سجلات يومية نشطة لهذه المعدة.</span>
                  </div>
                </td>
              </tr>
            ) : (
              [...activeEquipment.logs].reverse().map((log, idx) => {
                const realIdx = activeEquipment.logs.length - 1 - idx;
                const isEditing = editingLogIdx === realIdx;
                const refCode = `REF-EQP-${log.id?.split('-')[1]?.slice(-6) || 'XXXXXX'}`;

                return (
                  <tr key={log.id || realIdx} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-300 font-mono tracking-tighter">{refCode}</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 mt-0.5">
                          <Hash size={8} />
                          <span>SEQ-{realIdx + 1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[11px] font-black text-slate-700 font-mono">{log.date}</td>
                    <td className="p-4 text-xs font-bold text-slate-600">{log.day}</td>
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="text" 
                            value={editLogForm.fromTime || ''} 
                            onChange={e => setEditLogForm({...editLogForm, fromTime: e.target.value})}
                            className="w-16 p-1 text-center bg-white border border-slate-200 rounded-lg text-[10px]"
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                            type="text" 
                            value={editLogForm.toTime || ''} 
                            onChange={e => setEditLogForm({...editLogForm, toTime: e.target.value})}
                            className="w-16 p-1 text-center bg-white border border-slate-200 rounded-lg text-[10px]"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-lg">
                          {log.fromTime} - {log.toTime}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-rose-600 font-black font-mono">
                      {isEditing ? (
                        <input 
                          type="number" 
                          step="0.5"
                          value={editLogForm.deductedHours || 0} 
                          onChange={e => setEditLogForm({...editLogForm, deductedHours: parseFloat(e.target.value) || 0})}
                          className="w-12 p-1 text-center bg-white border border-slate-200 rounded-lg text-[10px]"
                        />
                      ) : (
                        log.deductedHours ? `-${log.deductedHours} س` : '-'
                      )}
                    </td>
                    <td className="p-4 text-center">
                       {isEditing ? (
                         <input 
                           type="text" 
                           value={editLogForm.duration || ''} 
                           onChange={e => setEditLogForm({...editLogForm, duration: e.target.value as any})}
                           className="w-12 p-1 text-center bg-white border border-slate-200 rounded-lg text-[10px]"
                         />
                       ) : (
                         <span className="text-xs font-black text-indigo-700 font-mono tracking-tighter">{log.duration}س</span>
                       )}
                    </td>
                    <td className="p-4 text-center">
                      {isEditing ? (
                         <input 
                           type="number" 
                           value={editLogForm.discount || 0} 
                           onChange={e => setEditLogForm({...editLogForm, discount: parseFloat(e.target.value) || 0})}
                           className="w-16 p-1 text-center bg-white border border-slate-200 rounded-lg text-[10px]"
                         />
                       ) : (
                         <span className="text-xs font-black text-emerald-600">{(log.discount || 0).toLocaleString()} ج</span>
                       )}
                    </td>
                    <td className="p-4 max-w-[240px]">
                       {isEditing ? (
                         <input 
                           type="text" 
                           value={editLogForm.notes || ''} 
                           onChange={e => setEditLogForm({...editLogForm, notes: e.target.value})}
                           className="w-full p-1 bg-white border border-slate-200 rounded-lg text-[10px]"
                         />
                       ) : (
                         <p className="text-[10px] font-bold text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">{log.notes || '-'}</p>
                       )}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <button 
                            onClick={() => handleSaveLogIndex(realIdx)}
                            className="p-1 px-2.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-slate-900 transition-colors flex items-center gap-1"
                          >
                            <Save size={10} />
                            حفظ
                          </button>
                        ) : (
                          <button 
                            disabled={userRole === 'viewer'}
                            onClick={() => {
                              setEditingLogIdx(realIdx);
                              setEditLogForm({...log});
                            }}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <span className="text-[10px] font-black">تعديل</span>
                          </button>
                        )}
                        <button 
                          disabled={userRole === 'viewer'}
                          onClick={() => handleDeleteLogIndex(realIdx)}
                          className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
