import React from 'react';

export default function CrmFinancials() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:shadow-none print:border-0" id="financials-table">
        <div className="flex justify-between items-center print:hidden mb-6">
          <h3 className="text-sm font-black text-slate-900">البيانات المالية والعقود</h3>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            طباعة الجدول المالي
          </button>
        </div>
        
        {/* Placeholder for financial table */}
        <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-200">
          [جدول المستخلصات، الدفعات، وقيم العقود]
        </div>
      </div>
      
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
