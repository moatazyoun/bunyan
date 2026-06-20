import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, User, Building, Coins, History, Clock, Fuel, ShieldAlert, Save } from 'lucide-react';
import { EquipmentSummary } from '../types';

interface EquipmentModalsProps {
  showAddEqModal: boolean;
  setShowAddEqModal: (val: boolean) => void;
  handleAddEqSubmit: (e: React.FormEvent) => void;
  newEqName: string;
  setNewEqName: (val: string) => void;
  newEqDriver: string;
  setNewEqDriver: (val: string) => void;
  newEqIsRental: boolean;
  setNewEqIsRental: (val: boolean) => void;
  newEqRate: number;
  setNewEqRate: (val: number) => void;
  newEqRateUnit: string;
  setNewEqRateUnit: (val: string) => void;
  newEqCarryover: number;
  setNewEqCarryover: (val: number) => void;
  newEqFuel: number;
  setNewEqFuel: (val: number) => void;
  newEqSpent: number;
  setNewEqSpent: (val: number) => void;
  newEqDiscount: number;
  setNewEqDiscount: (val: number) => void;
  newEqDailyHours: number;
  setNewEqDailyHours: (val: number) => void;
  // Edit
  editingEqId: string | null;
  setEditingEqId: (id: string | null) => void;
  editEqForm: Partial<EquipmentSummary>;
  setEditEqForm: (form: Partial<EquipmentSummary>) => void;
  handleSaveEqEdit: () => void;
}

export default function EquipmentModals({
  showAddEqModal,
  setShowAddEqModal,
  handleAddEqSubmit,
  newEqName,
  setNewEqName,
  newEqDriver,
  setNewEqDriver,
  newEqIsRental,
  setNewEqIsRental,
  newEqRate,
  setNewEqRate,
  newEqRateUnit,
  setNewEqRateUnit,
  newEqCarryover,
  setNewEqCarryover,
  newEqFuel,
  setNewEqFuel,
  newEqSpent,
  setNewEqSpent,
  newEqDiscount,
  setNewEqDiscount,
  newEqDailyHours,
  setNewEqDailyHours,
  editingEqId,
  setEditingEqId,
  editEqForm,
  setEditEqForm,
  handleSaveEqEdit
}: EquipmentModalsProps) {
  return (
    <>
      {/* Add Equipment Modal */}
      <AnimatePresence>
        {showAddEqModal && (
          <div dir="rtl" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-row"
            >
              {/* Sidebar Side */}
              <div className="w-1/3 bg-indigo-600 p-8 text-white flex flex-col justify-between">
                 <div>
                    <Truck size={48} className="text-indigo-200 mb-6" />
                    <h4 className="text-xl font-black mb-2">بيانات المعدات</h4>
                    <p className="text-sm text-indigo-100 leading-relaxed">
                       إضافة معدة جديدة للنظام. يرجى التأكد من دقة البيانات المدخلة لضمان صحة تقارير الحركة والاستهلاك اليومي.
                    </p>
                 </div>
                 <div className="text-[10px] text-indigo-300">
                    نظام إدارة المعدات
                 </div>
              </div>

              {/* Form Side */}
              <div className="w-2/3 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-xl text-white">تسجيل معدة جديدة</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddEqModal(false)}
                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl"
                    >
                      ✕
                    </button>
                </div>

                <form onSubmit={handleAddEqSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">اسم المعدة / الكود التعريفي</label>
                       <div className="relative">
                         <input
                           type="text"
                           required
                           placeholder="مثال: لودر كاترپيلار 966"
                           value={newEqName}
                           onChange={(e) => setNewEqName(e.target.value)}
                           className="w-full text-xs p-3.5 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-white pr-10"
                         />
                         <Truck className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                       </div>
                     </div>

                     <div className="col-span-1">
                       <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">السائق المعين</label>
                       <div className="relative">
                         <input
                           type="text"
                           placeholder="اسم السائق"
                           value={newEqDriver}
                           onChange={(e) => setNewEqDriver(e.target.value)}
                           className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl pr-10 font-bold text-white"
                         />
                         <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                       </div>
                     </div>

                     <div className="col-span-1">
                       <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">نوع التبعية</label>
                       <select
                         value={newEqIsRental ? 'rental' : 'company'}
                         onChange={(e) => setNewEqIsRental(e.target.value === 'rental')}
                         className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-black text-white"
                       >
                         <option value="rental">إيجار خارجي</option>
                         <option value="company">ملك الشركة</option>
                       </select>
                     </div>

                     {newEqIsRental && (
                       <>
                         <div className="col-span-1">
                           <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">فئة السعر (ج.م)</label>
                           <div className="relative">
                             <input
                               type="number"
                               required
                               value={newEqRate || ''}
                               onChange={(e) => setNewEqRate(parseFloat(e.target.value) || 0)}
                               className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl pr-10 font-black font-mono text-center text-white"
                             />
                             <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500" size={14} />
                           </div>
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">وحدة الحساب</label>
                           <select
                             value={newEqRateUnit}
                             onChange={(e) => setNewEqRateUnit(e.target.value)}
                             className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-2xl font-black text-white"
                           >
                             <option value="ساعة">ساعة</option>
                             <option value="يومية">يومية</option>
                             <option value="أسبوع">أسبوع</option>
                             <option value="شهر">شهر</option>
                           </select>
                         </div>
                       </>
                     )}

                     <div className="col-span-1">
                       <label className="block text-[10px] font-black text-indigo-400 mb-1.5 mr-1 uppercase tracking-widest">ساعات سابقة</label>
                       <div className="relative">
                          <input
                            type="number"
                            value={newEqCarryover || ''}
                            onChange={(e) => setNewEqCarryover(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-3 bg-indigo-950/30 border border-indigo-900 rounded-2xl font-black font-mono text-center text-white"
                          />
                          <History className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400" size={14} />
                       </div>
                     </div>

                     <div className="col-span-1">
                       <label className="block text-[10px] font-black text-indigo-400 mb-1.5 mr-1 uppercase tracking-widest">ساعات اليومية</label>
                       <div className="relative">
                          <input
                            type="number"
                            value={newEqDailyHours || ''}
                            onChange={(e) => setNewEqDailyHours(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-3 bg-indigo-950/30 border border-indigo-900 rounded-2xl font-black font-mono text-center text-white"
                          />
                          <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400" size={14} />
                       </div>
                     </div>

                  </div>

                  <div className="flex gap-3 justify-end pt-6 border-t border-slate-700 flex-row-reverse">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Save size={16} />
                      تسجيل المعدة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEqModal(false)}
                      className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black border border-slate-700 transition-colors"
                    >
                      تراجع
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Equipment Modal */}
      <AnimatePresence>
        {editingEqId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right font-sans">
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
             >
               <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-row-reverse">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-xl">
                       <ShieldAlert size={18} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-wider italic">تعديل بيانات المعدة النشطة</h3>
                 </div>
                 <button onClick={() => setEditingEqId(null)} className="text-slate-400 hover:text-white transition-colors">✕</button>
               </div>

               <div className="p-6 space-y-5 bg-slate-50/30">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">اسم المعدة</label>
                       <input
                         type="text"
                         value={editEqForm.name || ''}
                         onChange={(e) => setEditEqForm({...editEqForm, name: e.target.value})}
                         className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-2xl font-black"
                       />
                    </div>
                    <div className="col-span-1">
                       <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">السائق</label>
                       <input
                         type="text"
                         value={editEqForm.driver || ''}
                         onChange={(e) => setEditEqForm({...editEqForm, driver: e.target.value})}
                         className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl font-bold"
                       />
                    </div>
                    <div className="col-span-1">
                       <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">فئة السعر</label>
                       <input
                         type="number"
                         value={editEqForm.rate || 0}
                         onChange={(e) => setEditEqForm({...editEqForm, rate: parseFloat(e.target.value) || 0})}
                         className="w-full text-xs p-3 bg-white border border-slate-200 rounded-2xl font-black font-mono text-center"
                       />
                    </div>
                 </div>

                 <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 flex-row-reverse">
                    <button
                      onClick={handleSaveEqEdit}
                      className="px-6 py-3 bg-amber-500 hover:bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl transition-all active:scale-95"
                    >
                      حفظ التعديلات الحية
                    </button>
                    <button
                      onClick={() => setEditingEqId(null)}
                      className="px-6 py-3 bg-white text-slate-500 rounded-2xl text-xs font-black border border-slate-200"
                    >
                      إلغاء
                    </button>
                 </div>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
