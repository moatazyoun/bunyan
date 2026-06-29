import React, { useState } from 'react';
import GenericInputModal from './GenericInputModal';

export default function CrmFinancials() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:shadow-none print:border-0" id="financials-table">
        <div className="flex justify-between items-center print:hidden mb-6">
          <h3 className="text-sm font-black text-slate-900">البيانات المالية والعقود</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
            >
              إضافة قيد مالي / عقد
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              طباعة الجدول المالي
            </button>
          </div>
        </div>
        
        {/* Placeholder for financial table */}
        <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-200">
          [جدول المستخلصات، الدفعات، وقيم العقود]
        </div>
      </div>

      <GenericInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة قيد مالي أو عقد جديد"
      >
        <div className="space-y-4">
          <input className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="عنوان القيد/العقد" />
          <input className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" type="number" placeholder="المبلغ (إن وجد)" />
          <textarea className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="التفاصيل" rows={4} />
          <button className="w-full py-3 bg-purple-600 text-white rounded-xl text-xs font-bold">حفظ</button>
        </div>
      </GenericInputModal>
      
      {/* Print styles */}
      <style>{`
        @media print {
          .print:hidden { display: none !important; }
          #financials-table { width: 100%; border: 1px solid #ddd; }
        }
      `}</style>
    </div>
  );
}
