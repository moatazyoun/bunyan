import React from 'react';
import { X, Landmark } from 'lucide-react';

interface GenericInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sidebarTitle?: string;
  sidebarDesc?: string;
  children: React.ReactNode;
}

export default function GenericInputModal({ 
  isOpen, 
  onClose, 
  title, 
  sidebarTitle, 
  sidebarDesc, 
  children 
}: GenericInputModalProps) {
  if (!isOpen) return null;

  const resolvedSidebarTitle = sidebarTitle || title;
  const resolvedSidebarDesc = sidebarDesc || "نظام بنيان لإدارة ومطابقة البيانات وتأمين الحركة المالية ومستندات الإنشاء اليومي.";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-right">
        
        {/* Sidebar Panel - Premium dark theme matching AddTransactionModal */}
        <div className="hidden md:flex md:w-64 bg-slate-950 p-8 flex-col justify-between border-l border-slate-800 text-right">
          <div>
            <div className="h-12 w-12 bg-indigo-950/50 rounded-2xl flex items-center justify-center border border-indigo-900 mb-6">
              <Landmark className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-black mb-2 text-white leading-snug">{resolvedSidebarTitle}</h3>
            <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">{resolvedSidebarDesc}</p>
          </div>
          <div className="space-y-4 pt-6 border-t border-slate-800 text-[10px] font-black text-slate-500">
            <div className="flex items-center gap-2 border-r-2 border-indigo-500 pr-2 text-indigo-400">القيد والمراجعة</div>
            <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">حفظ التغييرات</div>
            <div className="flex items-center gap-2 border-r-2 border-slate-800 pr-2">تأكيد الأثر المالي</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-900">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 flex-shrink-0">
            <h3 className="text-base font-black text-white">{title}</h3>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body - Premium dark theme */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-950/40">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
