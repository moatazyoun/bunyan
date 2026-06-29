import React, { useState } from 'react';
import { Plus, Search, User } from 'lucide-react';
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
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div 
            key={customer.id} 
            onClick={() => onSelectCustomer(customer)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-2xl text-purple-600">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900">{customer.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{customer.email}</p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl">
              {customer.phone}
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 font-bold">
            لا توجد نتائج بحث
          </div>
        )}
      </div>
    </div>
  );
}
