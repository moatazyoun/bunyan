import React, { useState } from 'react';
import { X, User, Phone, Mail, UserCheck, AlertCircle } from 'lucide-react';
import { CustomerRecord } from '../types';
import { db, doc, setDoc } from '../lib/firebase';

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('يرجى تعبئة اسم العميل بالكامل.');
      return;
    }

    setIsSubmitting(true);
    const newCustomer: CustomerRecord = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      contracts: [],
      projects: [],
      activityLogs: []
    };
    
    try {
      await setDoc(doc(db, 'customers', newCustomer.id), newCustomer);
      onSave(newCustomer);
      onClose();
    } catch (err: any) {
      console.error("Error adding customer:", err);
      setError('حدث خطأ أثناء حفظ بيانات العميل في قاعدة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
      <div 
        className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-right animate-fadeIn"
        id="add-customer-modal-inner"
      >
        
        {/* Sidebar Visual - Matches the requested card style */}
        <div className="w-full md:w-64 bg-slate-50 p-8 flex flex-col justify-between border-l border-slate-100 flex-shrink-0">
          <div>
            <User size={40} className="text-purple-600 mb-6" />
            <h4 className="text-xl font-black mb-2 text-slate-900">تسجيل عميل جديد</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              إدخال بيانات العملاء والجهات المالكة وتوحيد الاتصال لإسناد المشروعات والمتابعة القانونية والمالية.
            </p>
          </div>

          <div className="text-[10px] text-slate-400 font-bold">
            نظام إدارة علاقات العملاء CRM
          </div>
        </div>

        {/* Main Content Form Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
            <h3 className="text-lg font-black text-slate-900">إضافة عميل جديد</h3>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/20">
            <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest border-r-4 border-purple-500 pr-3">
                  بيانات العميل والاتصال الرئيسي
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer/Company Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">اسم الجهة أو الشركة العميلة *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: شركة النيل للتطوير العقاري"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-xs p-3.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900"
                      />
                      <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">رقم الهاتف للاتصال المباشر *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="01xxxxxxxxx"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full text-xs p-3.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900 text-left font-mono"
                      />
                      <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">البريد الإلكتروني المعتمد *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="info@company.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-xs p-3.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900 text-left font-mono"
                      />
                      <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1 uppercase tracking-widest">اسم مسؤول الاتصال والمتابعة *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: م. أحمد الشافعي"
                        value={formData.contactPerson}
                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full text-xs p-3.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900"
                      />
                      <UserCheck size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer Action Bar */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-4 bg-white flex-shrink-0 flex-row-reverse">
            <button
              type="submit"
              form="customer-form"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتسجيل العميل'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-black border border-slate-200 transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
