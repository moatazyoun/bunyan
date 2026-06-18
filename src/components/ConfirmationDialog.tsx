import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    info: 'border-blue-500 text-blue-900',
    warning: 'border-amber-500 text-amber-900',
    danger: 'border-red-500 text-red-900',
    success: 'border-emerald-500 text-emerald-900',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg border-t-4 p-6 w-full max-w-sm ${typeStyles[type]}`}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="mb-4 text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 border rounded font-semibold text-slate-700 hover:bg-slate-50">إلغاء</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded text-white font-semibold ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>تأكيد</button>
        </div>
      </div>
    </div>
  );
}
