import React, { useState } from 'react';
import { ActivityLog } from '../types';
import GenericInputModal from './GenericInputModal';

interface CrmActivityLogProps {
  logs: ActivityLog[];
}

export default function CrmActivityLog({ logs }: CrmActivityLogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4 print:space-y-0" id="activity-log-table">
      <div className="flex justify-between items-center print:hidden">
        <h3 className="text-sm font-black text-slate-900">سجل النشاطات</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
          >
            إضافة سجل نشاط
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            طباعة السجل
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-black text-white font-black h-12 uppercase">
            <tr>
              <th className="px-6 py-2">رقم مرجعي</th>
              <th className="px-6 py-2">التوقيت</th>
              <th className="px-6 py-2">المستخدم</th>
              <th className="px-6 py-2">الإجراء</th>
              <th className="px-6 py-2">الوحدة</th>
              <th className="px-6 py-2">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 font-mono text-purple-700 font-bold">{log.referenceNo}</td>
                <td className="px-6 py-3 font-mono">{log.timestamp}</td>
                <td className="px-6 py-3 font-bold">{log.user}</td>
                <td className="px-6 py-3">{log.action}</td>
                <td className="px-6 py-3 text-slate-500">{log.module}</td>
                <td className="px-6 py-3 text-slate-700 font-medium">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GenericInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة سجل نشاط جديد"
      >
        <div className="space-y-4">
          <input className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="الإجراء" />
          <input className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="الوحدة" />
          <textarea className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs" placeholder="التفاصيل" rows={4} />
          <button className="w-full py-3 bg-purple-600 text-white rounded-xl text-xs font-bold">حفظ</button>
        </div>
      </GenericInputModal>
      
      {/* Print styles */}
      <style>{`
        @media print {
          .print:hidden { display: none !important; }
          #activity-log-table { width: 100%; }
        }
      `}</style>
    </div>
  );
}
