import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { CustomerRecord } from '../types';

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: CustomerRecord) => void;
}

export default function AddCustomerModal({ onClose, onSave }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    contactPerson: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      contracts: [],
      projects: [],
      activityLogs: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-900">إضافة عميل جديد</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input type="text" placeholder="اسم العميل" className="w-full p-3 border border-slate-200 rounded-xl" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="text" placeholder="رقم الهاتف" className="w-full p-3 border border-slate-200 rounded-xl" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="email" placeholder="البريد الإلكتروني" className="w-full p-3 border border-slate-200 rounded-xl" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="text" placeholder="اسم المسؤول" className="w-full p-3 border border-slate-200 rounded-xl" required value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
          <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-xl font-black">حفظ العميل</button>
        </form>
      </div>
    </div>
  );
}
