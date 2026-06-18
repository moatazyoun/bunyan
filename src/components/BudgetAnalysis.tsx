/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  Layers, 
  CheckCircle, 
  HelpCircle, 
  ArrowLeftRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { CategoryMetric, Transaction } from '../types';

interface BudgetAnalysisProps {
  categories: CategoryMetric[];
  transactions: Transaction[];
  onResetData: () => void;
}

export default function BudgetAnalysis({ categories, transactions, onResetData }: BudgetAnalysisProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  // Export CSV helper
  const handleExportCSV = () => {
    // Header Row
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for proper Excel Arabic rendering
    
    // Summary Headers
    csvContent += "المشروع,بنيان الذكي لإدارة تكاليف التشييد والبناء\n";
    csvContent += "تاريخ التصدير," + new Date().toLocaleDateString('ar-EG') + "\n\n";

    // Categories Table Header
    csvContent += "البند,قيمة الأعمال المنفذة (التكلفة),المنصرف الفعلي (الكاش),المتبقي (الفرق)\n";
    categories.forEach(c => {
      const diff = c.totalExecutedValue - c.totalSpent;
      csvContent += `"${c.nameAr}",${c.totalExecutedValue},${c.totalSpent},${diff}\n`;
    });
    
    csvContent += "\n\n";
    
    // Transactions Table Header
    csvContent += "التاريخ,البند الرئيسي,الجهة / المستفيد,نوع المعاملة,القيمة بالجنيه,الوصف التفصيلي\n";
    transactions.forEach(t => {
      const typeLabel = t.type === 'spent' ? "منصرف فعلي كاش" : "أعمال فيزيائية منفذة";
      csvContent += `"${t.date}","${t.category}","${t.recipient}","${typeLabel}",${t.amount},"${t.description}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_تكاليف_مشروع_بناء_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6" id="budget-analysis-container">
      {/* Banner */}
      <div className="bg-white text-slate-800 p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-indigo-700">قسم التحليلات وتصدير التقارير الميدانية</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">قم بمراجعة البنود والبيانات المتقاطعة واستخرج كشوفات حساب موثقة بصيغة Excel/CSV متوافقة مع الأجهزة المكتبيّة والمحمولة.</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 border border-indigo-700 transition shadow-xs"
              id="export-csv-btn"
            >
              <Download size={15} />
              تحميل التقرير الإجمالي (CSV Excel)
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-200 border border-slate-200 transition"
              id="reset-data-btn"
            >
              <RefreshCw size={15} />
              إعادة تهيئة البيانات الافتراضية
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <span className="text-amber-600 font-extrabold flex items-center gap-1.5 text-sm">
                ⚠️ تأكيد إعادة تهيئة البيانات
              </span>
              <button 
                onClick={() => setConfirmOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition text-lg"
              >
                &times;
              </button>
            </div>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              تحذير هام: هل تود بالفعل إعادة تعيين جميع الحركات والقيود للبيانات المصنعة الأساسية للمشروع؟ سيمحو هذا كافة إضافاتك وتعديلاتك وتعود الحسابات للوضع الافتراضي للموقع.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setConfirmOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                تأكيد ومحو كامل
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured report table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <h4 className="font-bold text-slate-900 text-base">المطابقة الرياضية للحسابات</h4>
        <p className="text-xs text-slate-500 font-medium">مطابقة دقيقة وشاملة لمدخلات كراسة القياس والمنصرفات وتحديد الفوارق المالية والتكفل بالعهد المالية.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-right divide-y divide-slate-200 text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold text-[11px] border-b border-slate-200">
                <th className="p-3">اسم اللجنة / البند في كشوفات العمل</th>
                <th className="p-3">إجمالي تكلفة الأعمال المنفذة (المستند)</th>
                <th className="p-3">إجمالي المنصرف الفعلي في الموقع (الكاش)</th>
                <th className="p-3">الفجوة المالية للفصل</th>
                <th className="p-3">الحالة والمؤشر الفني</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => {
                const diff = cat.totalSpent - cat.totalExecutedValue;
                const percent = cat.totalExecutedValue > 0 
                  ? Math.round((cat.totalSpent / cat.totalExecutedValue) * 100) 
                  : 0;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/50" id={`analysis-row-${cat.id}`}>
                    <td className="p-3 font-bold text-slate-800">{cat.nameAr}</td>
                    <td className="p-3 font-mono text-slate-900 font-semibold">{formatCurrency(cat.totalExecutedValue)}</td>
                    <td className="p-3 font-mono text-slate-900 font-semibold">{formatCurrency(cat.totalSpent)}</td>
                    <td className="p-3 font-mono">
                      <span className={diff > 0 ? 'text-red-500 font-bold' : diff < 0 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}>
                        {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                      </span>
                    </td>
                    <td className="p-3">
                      {diff > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-800 font-medium rounded-lg text-[10px] border border-rose-200/40">
                          <TrendingUp size={11} className="text-rose-600" />
                          سلفيات معلّقة ومواد مدفوعة
                        </span>
                      ) : diff < 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-800 font-medium rounded-lg text-[10px] border border-indigo-100">
                          <TrendingDown size={11} className="text-indigo-600" />
                          أعمال منفذة لم يتم سداد فارقها
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-55 text-slate-600 font-medium rounded-lg text-[10px] border border-slate-200">
                          <CheckCircle size={11} className="text-slate-500" />
                          حسابات مقفلة وتامة
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Guide Box regarding the Egyptian Construction costing structure */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-base">دليل قراءة ومعادلات البرنامج الدقيق المفتوح</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="text-xs bg-indigo-50 text-indigo-800 border border-indigo-100 px-2 py-0.5 rounded-md font-bold text-[10px] inline-block">الأعمال المنفذة</span>
            <p className="text-xs text-slate-600 leading-normal font-semibold">
              تمثل القيمة الإجمالية المصادق عليها للأعمال الفيزيائية التي تمت فعلياً بالموقع (الحفر، صب القوالب، الخرسانة). هذه القيمة هي إثبات للملكية والتشغيل المادي.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="text-xs bg-slate-205 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-md font-bold text-[10px] inline-block">المنصرف الفعلي في الموقع</span>
            <p className="text-xs text-slate-600 leading-normal font-semibold">
              تمثل السيولة النقدية والمصاريف الشاملة الكلية الخارجة من الصندوق ومسؤولي الإدارة للموردين والعهد كدفعات أولية وسلف، وهذا سبب زيادة المنصرف عن الأعمال المنفذة في المراحل الأساسية الأولى للمشروع.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-bold text-[10px] inline-block">آلية تصفية العهد المتبقية</span>
            <p className="text-xs text-slate-600 leading-normal font-semibold">
              عندما يغلق المهندس المشرف الفواتير المقدمة بالكامل، يتم تحويل القيمة من رصيد العهد الممنوحة غير المصفاة إلى قائمة "الأعمال المنفذة" مع تسويتها بالكامل في السجلات لضمان الالتزام بالأمانة التامة والرقابة الميدانية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
