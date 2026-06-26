import React from 'react';
import { CustomerRecord } from '../types';

interface CrmOverviewProps {
  customer: CustomerRecord;
}

export default function CrmOverview({ customer }: CrmOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase">إجمالي العقود</h4>
          <p className="text-3xl font-black text-indigo-950 mt-2">{customer.contracts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase">المشاريع القائمة</h4>
          <p className="text-3xl font-black text-indigo-950 mt-2">{customer.projects.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase">المسؤول</h4>
          <p className="text-lg font-black text-slate-900 mt-2">{customer.contactPerson}</p>
        </div>
      </div>
      
      {/* Add Visual Pipeline and KPI Cards placeholder */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-900">المسار الزمني للعلاقة</h3>
        <div className="mt-6 h-32 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
          [المسار الزمني العائم - Visual Pipeline]
        </div>
      </div>
    </div>
  );
}
