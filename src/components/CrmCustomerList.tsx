import React, { useState } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { CustomerRecord } from '../types';

interface CrmCustomerListProps {
  customers: CustomerRecord[];
  onSelectCustomer: (customer: CustomerRecord) => void;
  onAddCustomer: () => void;
}

export default function CrmCustomerList({ customers, onSelectCustomer, onAddCustomer }: CrmCustomerListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      <header className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة العملاء</h1>
          <p className="text-sm text-slate-500 mt-1">قائمة بجميع العملاء المسجلين في النظام</p>
        </div>
        <button
          onClick={onAddCustomer}
          className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-2xl text-xs font-black hover:bg-purple-700 transition"
        >
          <Plus size={16} />
          إضافة عميل جديد
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث عن عميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-black text-white font-black h-12">
            <tr>
              <th className="px-6 py-2">اسم العميل</th>
              <th className="px-6 py-2">رقم الهاتف</th>
              <th className="px-6 py-2">البريد الإلكتروني</th>
              <th className="px-6 py-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-bold text-slate-900">{customer.name}</td>
                <td className="px-6 py-4 font-mono">{customer.phone}</td>
                <td className="px-6 py-4">{customer.email}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onSelectCustomer(customer)}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    عرض الملف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
