import React, { useState } from 'react';
import GenericInputModal from './GenericInputModal';

export default function CrmCorrespondence() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-slate-900">المراسلات والمهام</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
        >
          إضافة مراسلة أو مهمة
        </button>
      </div>
      <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-200">
        [جدول زمني للمكالمات، الاجتماعات، والقرارات]
      </div>

      <GenericInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة مراسلة أو مهمة جديدة"
      >
        <div className="space-y-4">
          <input className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="عنوان المراسلة/المهمة" />
          <textarea className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="التفاصيل" rows={4} />
          <button className="w-full py-3 bg-purple-600 text-white rounded-xl text-xs font-bold">حفظ</button>
        </div>
      </GenericInputModal>
    </div>
  );
}
