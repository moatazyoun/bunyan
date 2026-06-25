/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit,
  ChevronDown,
  ChevronUp,
  FileText,
  Percent,
  TrendingDown,
  Coins,
  Lock,
  RefreshCw,
  AlertCircle,
  Info,
  Phone,
  Printer,
  X
} from 'lucide-react';
import { Transaction, Subcontractor, SubcontractorWorkItem, SubcontractorDiscount, Contract } from '../types';

interface SubcontractorsDashboardProps {
  transactions: Transaction[];
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  subcontractors: Subcontractor[];
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
  contracts?: Contract[];
}

export default function SubcontractorsDashboard({ 
  transactions, 
  onAddTransaction,
  subcontractors = [],
  setSubcontractors,
  userRole,
  addAuditLog,
  contracts = []
}: SubcontractorsDashboardProps) {

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Print States
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [printPaperSizeAll, setPrintPaperSizeAll] = useState<'A4' | 'A3'>('A4');
  const [printOrientationAll, setPrintOrientationAll] = useState<'portrait' | 'landscape'>('landscape');

  const [showPrintSingleModal, setShowPrintSingleModal] = useState(false);
  const [printTargetSub, setPrintTargetSub] = useState<Subcontractor | null>(null);
  const [printPaperSizeSingle, setPrintPaperSizeSingle] = useState<'A4' | 'A3'>('A4');
  const [printOrientationSingle, setPrintOrientationSingle] = useState<'portrait' | 'landscape'>('portrait');

  const handlePrintAllSubcontractors = (paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = subcontractors.map((c, index) => {
      const stats = getSubcontractorCalculatedStats(c);
      return `
        <tr class="border-b border-slate-300 text-[10px] text-slate-850 text-center">
          <td class="p-1.5 border border-slate-400 font-bold">${index + 1}</td>
          <td class="p-1.5 border border-slate-400 text-right font-black text-indigo-950">${c.name}</td>
          <td class="p-1.5 border border-slate-400 text-right font-medium text-slate-650">${c.trade || 'عمل رئيسي'}</td>
          <td class="p-1.5 border border-slate-400 font-mono text-slate-600">${c.phone || '---'}</td>
          <td class="p-1.5 border border-slate-400 font-mono text-slate-600">${c.contractNumber || '---'}</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono">${stats.grossValue.toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono text-rose-700">${stats.totalDiscounts.toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono text-sky-800">${stats.netValue.toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono text-purple-700">${stats.paperTotal.toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono text-emerald-800">${stats.finalPaid.toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-black font-mono ${stats.finalRemaining < 0 ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50'}">${stats.finalRemaining.toLocaleString('ar-EG')} ج.م</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب مقاولي الباطن الإجمالي</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Tajawal', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
          }
          body {
            font-family: 'Tajawal', sans-serif;
            background-color: white;
          }
        </style>
      </head>
      <body class="p-2 bg-white text-slate-900">
        <div class="border-4 border-double border-slate-700 p-4 min-h-full flex flex-col justify-between">
          <div>
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div class="text-right space-y-1">
                <h1 class="text-xs font-black text-slate-800">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[9px] font-bold text-slate-500">إدارة المشروعات والرقابة الهندسية والتوريدات</p>
                <p class="text-[8px] text-slate-400">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center">
                <div class="border border-slate-800 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <span class="text-[10px] font-black text-slate-800 block">شعار بنيان</span>
                  <span class="text-[8px] font-bold text-slate-400">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-0.5">
                <p class="font-bold">الموقع: <span class="font-black text-indigo-750">مشروع برج العرب الجديدة</span></p>
                <p class="font-bold text-[10px] text-slate-500">مستند مالي: كشف حساب المقاولين الإجمالي</p>
              </div>
            </div>

            <!-- Title -->
            <div class="text-center my-4">
              <h2 class="text-base font-black text-slate-900 border-b-2 border-indigo-600 inline-block pb-0.5 px-4 uppercase tracking-wider">
                كشف الموقف المالي الإجمالي لمقاولي الباطن بالموقع
              </h2>
              <p class="text-[10px] font-bold text-slate-500 mt-1">
                حالة الأعمال والخصومات والمسحوبات الإجمالية لجميع مقاولي الباطن المسجلين بالمشروع
              </p>
            </div>

            <!-- Table -->
            <div class="mt-2">
              <table class="w-full text-right text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-[10px]">
                    <th class="p-2 border border-slate-400 w-10">م</th>
                    <th class="p-2 border border-slate-400 text-right">اسم المقاول</th>
                    <th class="p-2 border border-slate-400 text-right">التخصص والبنود</th>
                    <th class="p-2 border border-slate-400">رقم الهاتف</th>
                    <th class="p-2 border border-slate-400">رقم العقد</th>
                    <th class="p-2 border border-slate-400">إجمالي الأعمال Gross</th>
                    <th class="p-2 border border-slate-400 text-rose-800">إجمالي الخصومات</th>
                    <th class="p-2 border border-slate-400 text-sky-800">الصافي المعتمد Net</th>
                    <th class="p-2 border border-slate-400 text-purple-800">تسويات ورقية</th>
                    <th class="p-2 border border-slate-400 text-emerald-800">إجمالي المنصرف</th>
                    <th class="p-2 border border-slate-400 text-amber-800">المتبقي النهائي</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <!-- Totals Row -->
                  <tr class="bg-slate-50 border-t-2 border-slate-800 text-[10px] font-black text-center">
                    <td colspan="5" class="p-2 border border-slate-400 text-right text-slate-900">
                      الإجمالي العام للحسابات (${subcontractors.length} مقاول باطن):
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-900">
                      ${totalStatsGross.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-rose-700">
                      ${totalStatsDiscounts.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-sky-900">
                      ${totalStatsNet.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-purple-700">
                      ${subcontractors.reduce((sum, c) => sum + (c.paperSettlements || 0), 0).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-emerald-900">
                      ${totalStatsPaid.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td class="p-2 border border-slate-400 font-mono text-amber-800 bg-amber-50">
                      ${totalStatsRemaining.toLocaleString('ar-EG')} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-4 gap-4 text-center text-[9px] font-black text-slate-700 mt-12 border-t border-slate-300 pt-4">
            <div class="space-y-10">
              <p>إعداد المراجعة والمكتب الفني</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">توقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>مراجعة الحسابات ومراقب التكاليف</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>المدير المالي للمشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>اعتماد مدير عام المشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 500);
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  };

  const handlePrintSingleSubcontractor = (c: Subcontractor, paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const stats = getSubcontractorCalculatedStats(c);

    // Build Work Items Rows
    const itemRows = stats.items.map((item, idx) => {
      const itemGross = item.totalValue;
      const itemDiscs = item.discounts ? item.discounts.reduce((sum, d) => sum + (d.amount || 0), 0) : 0;
      const itemNet = itemGross - itemDiscs;

      const discountsText = item.discounts && item.discounts.length > 0
        ? item.discounts.map(d => `${d.label}: ${d.amount.toLocaleString('ar-EG')} ج.م`).join(' | ')
        : '---';

      return `
        <tr class="border-b border-slate-300 text-[10px] text-slate-850 text-center">
          <td class="p-1.5 border border-slate-400 font-bold">${idx + 1}</td>
          <td class="p-1.5 border border-slate-400 text-right font-bold">${item.trade}</td>
          <td class="p-1.5 border border-slate-400 font-mono">${(item.workVolume || 0).toLocaleString('ar-EG')}</td>
          <td class="p-1.5 border border-slate-400 font-mono">${(item.unitPrice || 0).toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono">${itemGross.toLocaleString('ar-EG')} ج.م</td>
          <td class="p-1.5 border border-slate-400 text-right text-rose-700 font-semibold text-[9px]">${discountsText}</td>
          <td class="p-1.5 border border-slate-400 font-bold font-mono text-indigo-900">${itemNet.toLocaleString('ar-EG')} ج.م</td>
        </tr>
      `;
    }).join('');

    // Build Payments Rows
    const paymentRows = stats.ledgerPayments.length === 0 ? `
      <tr>
        <td colspan="5" class="p-2 border border-slate-400 text-center text-slate-400 italic">لا توجد حركات صرف مالية مسجلة في عهد الموقع أو الدفعات الرئيسية بعد لهذا المقاول.</td>
      </tr>
    ` : stats.ledgerPayments.map((tx, idx) => `
      <tr class="border-b border-slate-300 text-[10px] text-slate-850 text-center">
        <td class="p-1.5 border border-slate-400 font-bold">${idx + 1}</td>
        <td class="p-1.5 border border-slate-400 font-mono">${tx.date}</td>
        <td class="p-1.5 border border-slate-400 text-right">${tx.description}</td>
        <td class="p-1.5 border border-slate-400 font-semibold text-indigo-750">${tx.nature === 'inside_custody' ? 'مسحوبات من عهدة الموقع' : 'دفعة من المكتب الرئيسي'}</td>
        <td class="p-1.5 border border-slate-400 font-black font-mono text-slate-900">${tx.amount.toLocaleString('ar-EG')} ج.م</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>بيان حساب تفصيلي: ${c.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Tajawal', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: 12mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
          }
          body {
            font-family: 'Tajawal', sans-serif;
            background-color: white;
          }
        </style>
      </head>
      <body class="p-2 bg-white text-slate-900">
        <div class="border-4 border-double border-slate-700 p-4 min-h-full flex flex-col justify-between">
          <div>
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div class="text-right space-y-1">
                <h1 class="text-xs font-black text-slate-800">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[9px] font-bold text-slate-500">إدارة المشروعات والرقابة الهندسية والتوريدات</p>
                <p class="text-[8px] text-slate-400">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center">
                <div class="border border-slate-800 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <span class="text-[10px] font-black text-slate-800 block">شعار بنيان</span>
                  <span class="text-[8px] font-bold text-slate-400">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-0.5">
                <p class="font-bold">الموقع: <span class="font-black text-indigo-750">مشروع برج العرب الجديدة</span></p>
                <p class="font-bold text-[10px] text-slate-500">مستند تفصيلي: بيان كشف حساب مقاول باطن</p>
              </div>
            </div>

            <!-- Title -->
            <div class="text-center my-4">
              <h2 class="text-base font-black text-slate-900 border-b-2 border-indigo-600 inline-block pb-0.5 px-4 uppercase tracking-wider">
                كشف الموقف المالي والتسوية التفصيلية للمقاول
              </h2>
              <p class="text-[12px] font-black text-indigo-750 mt-1">
                الاسم: ${c.name}
              </p>
            </div>

            <!-- Profile Info Cards -->
            <div class="grid grid-cols-2 gap-4 my-3 text-xs">
              <div class="border border-slate-300 p-3 rounded-xl bg-slate-50/50 space-y-1.5">
                <h3 class="font-black text-slate-800 border-b pb-1 text-[11px]">بيانات التعاقد والتواصل</h3>
                <p><span class="text-slate-500">رقم الهاتف:</span> <span class="font-bold font-mono">${c.phone || 'غير مسجل'}</span></p>
                <p><span class="text-slate-500">رقم العقد الإطاري:</span> <span class="font-bold font-mono">${c.contractNumber || 'بدون عقد'}</span></p>
                <p><span class="text-slate-500">التخصص الرئيسي للمقاولة:</span> <span class="font-bold text-slate-700">${c.trade || 'أعمال متنوعة'}</span></p>
              </div>

              <div class="border border-slate-300 p-3 rounded-xl bg-indigo-50/20 space-y-1 text-[11px]">
                <h3 class="font-black text-indigo-950 border-b border-indigo-100 pb-1 text-[11px]">ملخص تحليل الحساب المالي للمقاول</h3>
                <div class="grid grid-cols-2 gap-y-1">
                  <span class="text-slate-600">إجمالي قيمة الأعمال (Gross):</span>
                  <span class="font-bold font-mono text-slate-900 text-left">${stats.grossValue.toLocaleString('ar-EG')} ج.م</span>

                  <span class="text-rose-700 font-bold">إجمالي الخصومات والاستقطاعات:</span>
                  <span class="font-bold font-mono text-rose-700 text-left">-${stats.totalDiscounts.toLocaleString('ar-EG')} ج.م</span>

                  <span class="text-indigo-950 font-black">صافي قيمة المستخلص (Net):</span>
                  <span class="font-black font-mono text-indigo-950 text-left underline">${stats.netValue.toLocaleString('ar-EG')} ج.م</span>

                  <span class="text-purple-700">تسويات ورقية مقتطعة:</span>
                  <span class="font-bold font-mono text-purple-700 text-left">-${stats.paperTotal.toLocaleString('ar-EG')} ج.م</span>

                  <span class="text-emerald-800 font-bold">إجمالي المنصرف والمسدد الفعلي:</span>
                  <span class="font-bold font-mono text-emerald-800 text-left">-${(stats.custodyTotal + stats.officeTotal).toLocaleString('ar-EG')} ج.م</span>

                  <span class="text-amber-800 font-black border-t border-dashed pt-0.5">الرصيد المتبقي النهائي المستحق:</span>
                  <span class="font-black font-mono text-amber-800 text-left border-t border-dashed pt-0.5">${stats.finalRemaining.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>
            </div>

            <!-- Block 1: Work Items and Quantities -->
            <div class="mt-4">
              <h3 class="text-xs font-black text-slate-800 mb-2 border-r-4 border-indigo-600 pr-2">أولاً: بيان بنود الأعمال والقياسات المنجزة والخصومات</h3>
              <table class="w-full text-right text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-[10px]">
                    <th class="p-1.5 border border-slate-400 w-10">م</th>
                    <th class="p-1.5 border border-slate-400 text-right">بيان الأعمال / البند</th>
                    <th class="p-1.5 border border-slate-400 w-16">حجم الأعمال</th>
                    <th class="p-1.5 border border-slate-400 w-24">سعر الفئة</th>
                    <th class="p-1.5 border border-slate-400 w-24">الإجمالي (Gross)</th>
                    <th class="p-1.5 border border-slate-400">الخصومات والاستقطاعات للبند</th>
                    <th class="p-1.5 border border-slate-400 w-24">الصافي (Net)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  <tr class="bg-slate-50 font-black text-center text-[10px]">
                    <td colspan="2" class="p-1.5 border border-slate-400 text-right">الإجمالي لجميع البنود:</td>
                    <td colspan="2" class="p-1.5 border border-slate-400">---</td>
                    <td class="p-1.5 border border-slate-400 font-mono">${stats.grossValue.toLocaleString('ar-EG')} ج.م</td>
                    <td class="p-1.5 border border-slate-400 font-mono text-rose-700">-${stats.totalDiscounts.toLocaleString('ar-EG')} ج.م</td>
                    <td class="p-1.5 border border-slate-400 font-mono text-indigo-900">${stats.netValue.toLocaleString('ar-EG')} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Block 2: Site Custody & main office payments -->
            <div class="mt-5">
              <h3 class="text-xs font-black text-slate-800 mb-2 border-r-4 border-indigo-600 pr-2">ثانياً: بيان حركات صرف الدفعات والمسحوبات المالية</h3>
              <table class="w-full text-right text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-[10px]">
                    <th class="p-1.5 border border-slate-400 w-10">م</th>
                    <th class="p-1.5 border border-slate-400 w-24">تاريخ الحركة</th>
                    <th class="p-1.5 border border-slate-400 text-right">بيان ووصف الدفعة / المسحوبات</th>
                    <th class="p-1.5 border border-slate-400 w-44">نوع الدفعة وجهة الصرف</th>
                    <th class="p-1.5 border border-slate-400 w-28">قيمة الدفعة</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentRows}
                  <tr class="bg-slate-50 font-black text-center text-[10px]">
                    <td colspan="3" class="p-1.5 border border-slate-400 text-right">إجمالي المدفوعات المسددة والمنصرفة (من عهدة الموقع والمكتب الرئيسي):</td>
                    <td class="p-1.5 border border-slate-400 text-slate-500 font-medium text-[9px]">c:${stats.custodyTotal.toLocaleString('ar-EG')} | o:${stats.officeTotal.toLocaleString('ar-EG')}</td>
                    <td class="p-1.5 border border-slate-400 font-mono text-slate-900">${(stats.custodyTotal + stats.officeTotal).toLocaleString('ar-EG')} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${c.notes ? `
            <div class="mt-4 p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs text-amber-850">
              <strong>ملاحظات إضافية وشروط خاصة:</strong> ${c.notes}
            </div>
            ` : ''}
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-4 gap-4 text-center text-[9px] font-black text-slate-700 mt-12 border-t border-slate-300 pt-4">
            <div class="space-y-10">
              <p>مراجعة المكتب الفني</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">توقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>مراجعة الحسابات والتسويات</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">توقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>المدير المالي والرقابة الهندسية</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">توقيع: .....................</p>
            </div>
            <div class="space-y-10">
              <p>اعتماد مدير عام المشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1 w-3/4 mx-auto">توقيع: .....................</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 500);
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  };
  
  const [formData, setFormData] = useState({
    name: '',
    paperSettlements: 0,
    notes: '',
    phone: '',
    contractNumber: ''
  });

  const [workItems, setWorkItems] = useState<SubcontractorWorkItem[]>([]);

  // Get matching ledger payments for a subcontractor name
  const getSubcontractorPayments = (subName: string) => {
    if (!subName) return [];
    return transactions.filter(tx => {
      if (tx.type !== 'spent') return false;
      const sName = subName.trim().toLowerCase();
      const txRecipient = (tx.recipient || '').trim().toLowerCase();
      return tx.category === 'contractors' && (txRecipient === sName || txRecipient.includes(sName) || sName.includes(txRecipient));
    });
  };

  // Centralized calculations for a subcontractor
  const getSubcontractorCalculatedStats = (c: Subcontractor) => {
    const items = c.workItems && c.workItems.length > 0 ? c.workItems : [{
      id: 'legacy-item',
      trade: c.trade || 'عمل رئيسي',
      workVolume: c.workVolume || 0,
      unitPrice: c.unitPrice || 0,
      totalValue: (c.workVolume || 0) * (c.unitPrice || 0) || c.totalValue || 0,
      discounts: []
    }];

    let grossValue = 0;
    let totalDiscounts = 0;

    items.forEach(item => {
      grossValue += item.totalValue;
      if (item.discounts) {
        item.discounts.forEach(d => {
          totalDiscounts += d.amount || 0;
        });
      }
    });

    const netValue = grossValue - totalDiscounts;

    const ledgerPayments = getSubcontractorPayments(c.name);
    // Dynamic values according to nature:
    // nature === 'inside_custody' -> مسحوبات عهدة الموقع
    const custodyTotal = ledgerPayments.filter(tx => tx.nature === 'inside_custody').reduce((sum, tx) => sum + tx.amount, 0);
    // nature === 'outside_custody' -> دفعة من المكتب الرئيسي (مسدد)
    const officeTotal = ledgerPayments.filter(tx => tx.nature === 'outside_custody').reduce((sum, tx) => sum + tx.amount, 0);
    const paperTotal = c.paperSettlements || 0;

    const finalPaid = custodyTotal + officeTotal + paperTotal;
    const finalRemaining = netValue - finalPaid;

    return {
      items,
      grossValue,
      totalDiscounts,
      netValue,
      ledgerPayments,
      custodyTotal, // مسحوبات عهدة الموقع
      officeTotal, // دفعة من المكتب الرئيسي (مسدد)
      paperTotal, // تسويات ورقية مقتطعة
      finalPaid,
      finalRemaining
    };
  };

  // Form Work Items manipulation
  const addWorkItem = () => {
    const newItem: SubcontractorWorkItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      trade: '',
      workVolume: 0,
      unitPrice: 0,
      totalValue: 0,
      discounts: [],
      notes: '',
      referenceNo: `REF-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setWorkItems(prev => [...prev, newItem]);
    addAuditLog('إضافة بند عمل', 'بيانات مقاولي الباطن', `تم إضافة بند جديد برقم مرجعي: ${newItem.referenceNo}`);
  };

  const removeWorkItem = (itemId: string) => {
    const itemToRemove = workItems.find(item => item.id === itemId);
    setWorkItems(prev => prev.filter(item => item.id !== itemId));
    if (itemToRemove) {
      addAuditLog('حذف بند عمل', 'بيانات مقاولي الباطن', `تم حذف البند ذو المرجع: ${itemToRemove.referenceNo || 'بدون مرجع'}`);
    }
  };

  const updateWorkItem = (itemId: string, updates: Partial<SubcontractorWorkItem>) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        if ('workVolume' in updates || 'unitPrice' in updates) {
          updated.totalValue = (updated.workVolume || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addDiscount = (itemId: string) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const existingDiscounts = item.discounts || [];
        return {
          ...item,
          discounts: [...existingDiscounts, {
            id: `disc-${Date.now()}-${Math.random()}`,
            label: '',
            amount: 0
          }]
        };
      }
      return item;
    }));
  };

  const removeDiscount = (itemId: string, discountId: string) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          discounts: (item.discounts || []).filter(d => d.id !== discountId)
        };
      }
      return item;
    }));
  };

  const updateDiscount = (itemId: string, discountId: string, label: string, amount: number) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          discounts: (item.discounts || []).map(d => {
            if (d.id === discountId) {
               return { ...d, label, amount };
            }
            return d;
          })
        };
      }
      return item;
    }));
  };

   const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    if (!formData.name) return alert('يرجى تحديد اسم مقاول الباطن');
    if (workItems.length === 0) return alert('يرجى إضافة بند أعمال واحد على الأقل للمقاول');

    // Calculate aggregated totals
    let grossTotal = 0;
    let discountTotal = 0;
    workItems.forEach(item => {
      grossTotal += item.totalValue;
      if (item.discounts) {
        item.discounts.forEach(d => {
          discountTotal += d.amount || 0;
        });
      }
    });

    const netValue = grossTotal - discountTotal;
    const paperSettlements = Number(formData.paperSettlements) || 0;

    const tradeNames = workItems.map(item => item.trade).filter(Boolean);
    const summaryTrade = tradeNames.length > 0 ? tradeNames.join('، ') : 'أعمال متنوعة';

    const contractorId = editingId || `sub-${Date.now()}`;
    const nextSub: Subcontractor = {
      id: contractorId,
      name: formData.name,
      trade: summaryTrade,
      workVolume: workItems.reduce((acc, it) => acc + (it.workVolume || 0), 0),
      unitPrice: workItems.length > 0 ? (grossTotal / (workItems.reduce((acc, it) => acc + (it.workVolume || 1), 0) || 1)) : 0,
      totalValue: netValue, // Use netValue for compatibility
      paidOffice: 0, // No longer manual, computed dynamically
      paidCustody: 0, // No longer manual, computed dynamically
      paperSettlements,
      remaining: netValue - paperSettlements, // Will be computed fully on the fly in stats
      notes: formData.notes,
      workItems: workItems.map(item => ({ ...item, referenceNo: `REF-${contractorId}` })),
      phone: formData.phone || '',
      contractNumber: formData.contractNumber || ''
    };

    if (editingId) {
      setSubcontractors(prev => prev.map(c => c.id === editingId ? nextSub : c));
      addAuditLog('تحديث بيانات مقاول', 'بيانات مقاولي الباطن', `تم تعديل بيانات المقاول: ${formData.name} (REF-${editingId})`);
    } else {
      setSubcontractors(prev => [...prev, nextSub]);
      addAuditLog('إضافة مقاول باطن', 'بيانات مقاولي الباطن', `تم إضافة المقاول الجديد: ${formData.name} (REF-${nextSub.id})`);
    }

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      paperSettlements: 0, 
      notes: '',
      phone: '',
      contractNumber: ''
    });
    setWorkItems([{
      id: `item-${Date.now()}`,
      trade: '',
      workVolume: 0,
      unitPrice: 0,
      totalValue: 0,
      discounts: [],
      notes: '',
      referenceNo: `REF-${Date.now()}`,
      createdAt: new Date().toISOString()
    }]);
  };

  const startEdit = (c: Subcontractor) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      paperSettlements: c.paperSettlements || 0,
      notes: c.notes || '',
      phone: c.phone || '',
      contractNumber: c.contractNumber || ''
    });

    if (c.workItems && c.workItems.length > 0) {
      setWorkItems(JSON.parse(JSON.stringify(c.workItems)));
    } else {
      setWorkItems([{
        id: `it-legacy-${Date.now()}`,
        trade: c.trade || 'عمل رئيسي',
        workVolume: c.workVolume || 0,
        unitPrice: c.unitPrice || 0,
        totalValue: (c.workVolume || 0) * (c.unitPrice || 0) || c.totalValue || 0,
        discounts: [],
        notes: '',
        referenceNo: `REF-${Date.now()}`,
        createdAt: new Date().toISOString()
      }]);
    }
    setShowModal(true);
  };

   const handleDelete = (id: string) => {
    if (userRole === 'viewer') return;
    const subToDelete = subcontractors.find(c => c.id === id);
    if (window.confirm('هل أنت متأكد من حذف حساب هذا المقاول وجميع البنود؟')) {
      setSubcontractors(prev => prev.filter(c => c.id !== id));
      if (subToDelete) {
        addAuditLog('حذف مقاول', 'بيانات مقاولي الباطن', `تم حذف المقاول: ${subToDelete.name}`);
      }
    }
  };

  // Aggregate stats over all subcontractors
  let totalStatsGross = 0;
  let totalStatsDiscounts = 0;
  let totalStatsNet = 0;
  let totalStatsPaid = 0;

  subcontractors.forEach(c => {
    const stats = getSubcontractorCalculatedStats(c);
    totalStatsGross += stats.grossValue;
    totalStatsDiscounts += stats.totalDiscounts;
    totalStatsNet += stats.netValue;
    totalStatsPaid += stats.finalPaid;
  });
  const totalStatsRemaining = totalStatsNet - totalStatsPaid;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة مقاولي الباطن</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">متابعة البنود والخصومات المتعددة مع التزامن التام للقيمة مع الحركة المالية</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full md:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPrintAllModal(true)}
            className="w-full md:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
          >
            <Printer size={18} className="text-slate-600" />
            <span>طباعة الحساب الإجمالي</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: userRole !== 'viewer' ? 1.02 : 1, y: userRole !== 'viewer' ? -2 : 0 }}
            whileTap={{ scale: userRole !== 'viewer' ? 0.98 : 1 }}
            onClick={() => { if (userRole !== 'viewer') { resetForm(); setShowModal(true); } else { alert('غير مسموح لك بإضافة مقاول'); } }}
            className={`w-full md:w-auto px-6 py-3 bg-slate-900 ${userRole === 'viewer' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-all`}
          >
            <Plus size={18} />
            <span>إضافة مقاول جديد</span>
          </motion.button>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">إجمالي الأعمال (Gross)</p>
            <p className="text-lg font-black text-amber-600 font-mono mt-0.5">{totalStatsGross.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">إجمالي الخصومات</p>
            <p className="text-lg font-black text-rose-600 font-mono mt-0.5">{totalStatsDiscounts.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">صافي الأعمال المستحقة (Net)</p>
            <p className="text-lg font-black text-sky-600 font-mono mt-0.5">{totalStatsNet.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold">إجمالي المنصرف والمسدد</p>
            <p className="text-lg font-black text-emerald-600 font-mono mt-0.5">{totalStatsPaid.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span></p>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm md:overflow-visible">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            حسابات مقاولي الباطن والأعمال المنفذة بالتفصيل
          </h2>
        </div>
        
        <div className="overflow-x-auto md:overflow-visible bg-slate-100 rounded-xl p-3 shadow-inner">
          <table className="w-full text-right border-separate border-spacing-x-1 border-spacing-y-1.5">
            <thead>
              <tr className="text-slate-600 font-bold text-[10px] text-center whitespace-nowrap uppercase tracking-tighter">
                <th className="p-3 pr-6 text-right rounded-t-xl bg-slate-200/70">اسم المقاول</th>
                <th className="p-3 rounded-t-xl bg-indigo-100/50">التخصصات والبنود</th>
                <th className="p-3 rounded-t-xl bg-blue-100/50">قيمة الأعمال</th>
                <th className="p-3 rounded-t-xl bg-rose-100/50 text-rose-700">الخصومات</th>
                <th className="p-3 rounded-t-xl bg-sky-100/60 text-sky-800">الصافي (Net)</th>
                <th className="p-3 rounded-t-xl bg-purple-100/50 text-purple-700">تسويات</th>
                <th className="p-3 rounded-t-xl bg-emerald-100/50 text-emerald-800">المسدد</th>
                <th className="p-3 rounded-t-xl bg-amber-100/50 text-amber-800">المتبقي</th>
                <th className="p-3 rounded-t-xl bg-slate-200/50 font-sans">خيارات</th>
              </tr>
            </thead>
            <tbody>
              {subcontractors.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-sm text-slate-500">لا يوجد مقاولين باطن مسجلين بعد.</td></tr>
              ) : (
                subcontractors.map((c) => {
                  const stats = getSubcontractorCalculatedStats(c);

                  return (
                    <React.Fragment key={c.id}>
                      <tr 
                        className="hover:brightness-95 transition-all text-center text-xs cursor-pointer group"
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      >
                        <td className="p-4 pr-6 text-right font-black text-slate-900 bg-white rounded-r-xl border-r border-y border-slate-200/50 shadow-sm">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-sans">
                              <span>{c.name}</span>
                              <div className="relative group/info inline-block" onClick={(e) => e.stopPropagation()}>
                                <Info size={13} className="text-slate-300 group-hover/info:text-indigo-600 cursor-pointer transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-3.5 bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-750 opacity-0 pointer-events-none group-hover/info:opacity-100 transition-all duration-200 z-50 text-right text-[10px] leading-relaxed font-normal">
                                  <div className="font-extrabold text-indigo-300 border-b border-slate-700 pb-1.5 mb-2 flex items-center gap-1">
                                    <Info size={11} className="text-indigo-400" />
                                    <span>بيانات تواصل المقاول</span>
                                  </div>
                                  <div className="space-y-1.5 font-sans">
                                    <p className="flex justify-between gap-3 items-center">
                                      <span className="text-slate-400 font-extrabold text-[9px]">رقم الهاتف:</span>
                                      <span className="font-mono text-white text-left font-semibold select-all" dir="ltr">{c.phone || 'غير مسجل'}</span>
                                    </p>
                                    <p className="flex justify-between gap-3 items-center">
                                      <span className="text-slate-400 font-extrabold text-[9px]">رقم العقد:</span>
                                      <span className="font-mono text-white text-left font-semibold select-all flex items-center gap-1" dir="ltr">
                                        {(() => {
                                          const linkedCon = contracts.find(con => con.counterparty.trim() === c.name.trim());
                                          return linkedCon ? (
                                            <>
                                              {linkedCon.contractNumber}
                                              <span className="bg-indigo-600 text-indigo-100 text-[7px] px-1 py-0.5 rounded-full font-sans font-black scale-90 origin-right">
                                                مربوط
                                              </span>
                                            </>
                                          ) : (
                                            c.contractNumber || 'بدون عقد'
                                          );
                                        })()}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {stats.ledgerPayments.length > 0 && (
                              <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                                ✓ مربوط مالياً
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-600 bg-indigo-50/50 border-y border-slate-200/20">
                          <div className="text-right text-[10px]">
                            <span className="bg-indigo-100/50 text-indigo-700 px-2 py-0.5 rounded-full font-bold ml-1.5 inline-block">
                              {stats.items.length} بنود
                            </span>
                            <span className="text-slate-500 truncate max-w-[150px] inline-block align-middle">{c.trade || 'عمل رئيسي'}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 bg-blue-50/30 border-y border-slate-200/20">
                          {stats.grossValue.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/30 border-y border-slate-200/20">
                          {stats.totalDiscounts.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-black text-sky-900 bg-sky-50/50 border-y border-slate-200/20">
                          {stats.netValue.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono text-purple-700 bg-purple-50/30 border-y border-slate-200/20 font-bold">
                          {stats.paperTotal.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-900 bg-emerald-50/30 border-y border-slate-200/20 text-center">
                          <div className="flex flex-col justify-center items-center">
                            <span>{stats.finalPaid.toLocaleString('ar-EG')}</span>
                            {stats.ledgerPayments.length > 0 && (
                              <span className="text-[8px] text-slate-400 font-normal">
                                c:{stats.custodyTotal.toLocaleString('ar-EG')} | o:{stats.officeTotal.toLocaleString('ar-EG')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`p-3 font-mono font-black border-y border-slate-200/20 ${
                          stats.finalRemaining < 0 
                            ? 'text-rose-600 bg-rose-50/40' 
                            : stats.finalRemaining === 0 
                              ? 'text-slate-400 bg-slate-50/50' 
                              : 'text-amber-700 bg-amber-50/40'
                        }`}>
                          {stats.finalRemaining.toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 bg-slate-50/50 rounded-l-xl border-l border-y border-slate-200/50 shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPrintTargetSub(c); setShowPrintSingleModal(true); }}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded transition animate-pulse"
                              title="طباعة بيان كشف الحساب التفصيلي"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (userRole !== 'viewer') startEdit(c); else alert('غير مسموح لك بالتعديل'); }}
                              className={`p-1.5 ${userRole === 'viewer' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'} rounded transition`}
                              title="تعديل حساب المقاول والبنود"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (userRole !== 'viewer') handleDelete(c.id); else alert('غير مسموح لك بالحذف'); }}
                              className={`p-1.5 ${userRole === 'viewer' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'} rounded transition`}
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded View for multiple Work Items & Discounts */}
                      {expandedId === c.id && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={9} className="p-5 text-right">
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                              {/* Work Items Detail Sheet */}
                              <div>
                                <h4 className="text-xs font-black text-indigo-950 mb-3 flex items-center gap-1.5 border-b border-indigo-50 pb-2">
                                  <FileText size={14} className="text-indigo-650" />
                                  بنود أعمال المقاول وخصوماتها التفصيلية ({stats.items.length} بنود)
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {stats.items.map((item, idx) => {
                                    const itemGross = item.totalValue;
                                    const itemDiscs = item.discounts ? item.discounts.reduce((sum, d) => sum + (d.amount || 0), 0) : 0;
                                    const itemNet = itemGross - itemDiscs;

                                    return (
                                      <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-900 text-xs">{idx + 1}. {item.trade}</span>
                                            <div className="flex flex-col items-end text-[9px] text-slate-440 font-mono gap-0.5">
                                              {item.referenceNo && <span>{item.referenceNo}</span>}
                                              {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>}
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-3 gap-2 mt-2 bg-white p-2.5 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-600 text-center font-mono">
                                            <div>
                                              <p className="text-[10px] text-slate-400 font-sans">الكمية</p>
                                              <p className="font-bold text-slate-800 mt-0.5">{(item.workVolume || 0).toLocaleString('ar-EG')}</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] text-slate-400 font-sans">الفئة</p>
                                              <p className="font-bold text-slate-800 mt-0.5">{(item.unitPrice || 0).toLocaleString('ar-EG')} ج.م</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] text-slate-400 font-sans">القيمة الاجمالية</p>
                                              <p className="font-bold text-slate-800 mt-0.5">{itemGross.toLocaleString('ar-EG')} ج.م</p>
                                            </div>
                                          </div>

                                          {/* Mini Discounts array */}
                                          <div className="mt-2 text-right">
                                            <p className="text-[10px] text-rose-700 font-black mb-1">الخصومات والاستقطاعات للبند:</p>
                                            {!item.discounts || item.discounts.length === 0 ? (
                                              <p className="text-[10px] text-slate-400 italic">لا توجد خصومات على هذا البند</p>
                                            ) : (
                                              <div className="space-y-1 bg-rose-50/30 p-2 rounded-lg border border-rose-100/30">
                                                {item.discounts.map(d => (
                                                  <div key={d.id} className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                                    <span>• {d.label || 'خصم غير مسمى'}</span>
                                                    <span className="font-mono text-rose-700">{d.amount.toLocaleString('ar-EG')} ج.م</span>
                                                  </div>
                                                ))}
                                                <div className="border-t border-rose-100 pt-1 flex justify-between items-center text-[10px] font-black text-rose-800">
                                                  <span>إجمالي خصم البند</span>
                                                  <span className="font-mono">{itemDiscs.toLocaleString('ar-EG')} ج.م</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-slate-100/60 flex justify-between items-center text-xs font-black">
                                          <span className="text-slate-500">صافي قيمة البند:</span>
                                          <span className="text-sky-850 font-mono">{itemNet.toLocaleString('ar-EG')} ج.م</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Direct payments ledger summary */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                  <h5 className="text-[11px] font-black text-indigo-900 mb-2">الحركات المالية المباشرة والمسحوبات للموقع ({stats.ledgerPayments.length})</h5>
                                  {stats.ledgerPayments.length === 0 ? (
                                    <p className="text-xs text-slate-400 font-medium">لا توجد حركات مالية مسجلة للمقاول بسجل العهدة أو حركة الموقع حتى الآن.</p>
                                  ) : (
                                    <div className="space-y-1.5 max-h-[155px] overflow-y-auto">
                                      {stats.ledgerPayments.map(tx => (
                                        <div key={tx.id} className="flex justify-between text-[11px] items-center p-2 rounded-lg bg-indigo-50/50 border border-indigo-50">
                                          <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-800">{tx.date}</span>
                                              <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200/60 px-1 rounded font-mono shrink-0">Ref: {tx.id}</span>
                                              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ${
                                                tx.nature === 'inside_custody' 
                                                  ? 'bg-amber-100 text-amber-800' 
                                                  : 'bg-emerald-100 text-emerald-800'
                                              }`}>
                                                {tx.nature === 'inside_custody' ? 'من العهدة' : 'خارج العهدة'}
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500">{tx.description} - {tx.referenceNo || 'بدون'}</span>
                                          </div>
                                          <span className="font-mono font-black text-indigo-750">
                                            {tx.amount.toLocaleString('ar-EG')} ج.م
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="bg-purple-50/20 p-4 rounded-xl border border-purple-100">
                                  <h5 className="text-[11px] font-black text-purple-900 mb-2">تحليل المسدد والملاحظات الورقية</h5>
                                  <div className="space-y-2 text-xs font-medium text-slate-700">
                                    <div className="flex justify-between items-center bg-white/75 p-2 rounded-lg border border-slate-100">
                                      <span className="font-bold text-slate-800">دفعة من المكتب الرئيسي (مسدَّد خارج العهدة):</span>
                                      <span className="font-mono font-black text-emerald-700">{stats.officeTotal.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/75 p-2 rounded-lg border border-slate-100">
                                      <span className="font-bold text-slate-800">مسحوبات عهدة الموقع (من العهدة):</span>
                                      <span className="font-mono font-black text-amber-700">{stats.custodyTotal.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/75 p-2 rounded-lg border border-purple-100/40">
                                      <span className="font-bold text-purple-950">تسويات ورقية مقتطعة (يدوية):</span>
                                      <span className="font-mono font-black text-purple-700">{stats.paperTotal.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                    {c.notes && (
                                      <div className="mt-3 pt-2 border-t border-purple-100/40">
                                        <p className="text-[10px] text-slate-450 font-bold mb-0.5">ملاحظات الحساب والتعاقد:</p>
                                        <p className="text-xs text-slate-650 bg-white/65 p-2 rounded border border-purple-50">{c.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-right"
            id="subcontractor-modal-inner"
          >
            {/* Sidebar Visual - Matches the requested card style */}
            <div className="hidden md:flex md:w-64 bg-slate-50 p-8 flex-col justify-between border-l border-slate-100 flex-shrink-0 text-right">
              <div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 w-fit mb-6 shadow-sm">
                  <Users className="h-10 w-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-800 leading-tight">
                  {editingId ? 'تعديل مقاول' : 'إضافة مقاول باطن'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  نظام إدارة مقاولي الباطن لربط بنود الأعمال والكميات والأسعار بحسابات المحروقات والعهد والمستخلصات بدقة متكاملة.
                </p>
              </div>

              {/* Stepper indicator matching requested look */}
              <div className="space-y-4 text-[10px] font-black text-slate-400">
                <div className="flex items-center gap-2 border-r-2 pr-2 border-indigo-500 text-indigo-600">
                  1. معلومات المقاول الأساسية
                </div>
                <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${workItems.length > 0 ? 'border-indigo-400 text-slate-700' : 'border-slate-200'}`}>
                  2. بنود الأعمال والفئات
                </div>
                <div className={`flex items-center gap-2 border-r-2 pr-2 transition-colors duration-150 ${formData.notes || formData.paperSettlements ? 'border-indigo-400 text-slate-700' : 'border-slate-200'}`}>
                  3. التسويات والمسحوبات
                </div>
              </div>
            </div>

            {/* Main Content Form Panel */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? 'تعديل بيانات وحساب وبنود المقاول المعتمد' : 'إضافة مقاول باطن جديد وتقييد مستند العقد'}
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition"
                >
                  <span className="text-lg font-black">✕</span>
                </button>
              </div>

              {/* Form Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                <form id="subcontractor-form" onSubmit={handleSave} className="space-y-8">
                  
                  {/* Section 1: البيانات الأساسية */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3">
                      البيانات الأساسية للمقاولة والاتصال
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">اسم المقاول / الشركة *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">رقم هاتف التواصل</label>
                        <input
                          type="text"
                          placeholder="مثال: 0100xxxxxxxx"
                          value={formData.phone}
                          onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 text-center font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">رقم العقد (إن وجد)</label>
                        <input
                          type="text"
                          placeholder="مثال: SUB-2026-003"
                          value={formData.contractNumber}
                          onChange={e => setFormData(p => ({ ...p, contractNumber: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 text-center font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: بنود الأعمال والكميات */}
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center w-full border-r-4 border-indigo-500 pr-3">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        بنود الأعمال المسندة وقيم الفئات الفنية للمقاول ({workItems.length})
                      </h4>
                      <button
                        type="button"
                        onClick={addWorkItem}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all border border-indigo-100 cursor-pointer"
                      >
                        <Plus size={13} />
                        إضافة بند أعمال جديد
                      </button>
                    </div>

                    {workItems.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-xs text-slate-400 font-bold">
                        ⚠️ لم يتم إضافة بنود أعمال. اضغط على الزر بالأعلى لإضافة البند الأول للمقاول.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {workItems.map((item) => {
                          const itemTotal = (item.workVolume || 0) * (item.unitPrice || 0);
                          const discountSum = (item.discounts || []).reduce((acc, d) => acc + (d.amount || 0), 0);

                          return (
                            <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-250 hover:border-slate-300 space-y-4 transition-all relative pt-14 shadow-xs">
                              <div className="absolute left-4 top-4">
                                <button
                                  type="button"
                                  onClick={() => removeWorkItem(item.id)}
                                  className="p-1 px-3 text-rose-650 bg-rose-50 hover:bg-rose-100 rounded-xl text-[10px] font-black transition flex items-center gap-1 border border-rose-150 cursor-pointer"
                                  title="حذف هذا البند"
                                >
                                  <Trash2 size={12} />
                                  حذف البند
                                </button>
                              </div>

                              <div className="absolute top-4 right-6 font-mono text-[10px] text-slate-500 font-bold flex flex-col items-start gap-0.5">
                                {item.referenceNo && <span>{item.referenceNo}</span>}
                                {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 mr-1">وصف البند / نوع العمل المسند *</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="مثال: أعمال صيانة خرسانات، تركيبات صحي..."
                                    value={item.trade}
                                    onChange={e => updateWorkItem(item.id, { trade: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 mr-1">الكمية المقدرة (حجم الأعمال) *</label>
                                  <input
                                    type="number"
                                    step="any"
                                    required
                                    placeholder="الكمية"
                                    value={item.workVolume || ''}
                                    onChange={e => updateWorkItem(item.id, { workVolume: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 text-center font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 mr-1">الفئة / سعر الوحدة (ج.م) *</label>
                                  <input
                                    type="number"
                                    step="any"
                                    required
                                    placeholder="السعر"
                                    value={item.unitPrice || ''}
                                    onChange={e => updateWorkItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-slate-50 border border-slate-250 rounded-2xl p-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 text-center font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row justify-between text-[11px] bg-indigo-50/50 px-4 py-3 rounded-2xl gap-2 border border-indigo-100">
                                <div className="flex gap-2">
                                  <span className="text-slate-600 font-bold">إجمالي البند:</span>
                                  <span className="font-mono font-bold text-slate-800">{itemTotal.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-rose-600 font-bold">الخصومات:</span>
                                  <span className="font-mono font-bold text-rose-700">-{discountSum.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                <div className="flex gap-2 text-indigo-750 font-black bg-white px-2 py-0.5 rounded-lg border border-indigo-100">
                                  <span>الصافي المعتمد:</span>
                                  <span className="font-mono">{(itemTotal - discountSum).toLocaleString('ar-EG')} ج.م</span>
                                </div>
                              </div>

                              {/* Multi Discounts Mini panel */}
                              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                                  <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">
                                    <Percent size={11} className="text-rose-500" />
                                    استقطاعات وخصومات هذا البند ({item.discounts?.length || 0})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => addDiscount(item.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[9px] font-black flex items-center gap-1 transition-all border border-rose-100 cursor-pointer"
                                  >
                                    <Plus size={10} />
                                    إضافة خصم / غرامة للبند
                                  </button>
                                </div>

                                {(!item.discounts || item.discounts.length === 0) ? (
                                  <div className="text-center py-1 text-[10px] text-slate-400 font-bold italic">
                                    لا توجد خصومات على هذا البند
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {item.discounts.map(disc => (
                                      <div key={disc.id} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          placeholder="مثل: تأمين أعمال العقد 5%، خصم غرامة تأخير..."
                                          required
                                          value={disc.label}
                                          onChange={e => updateDiscount(item.id, disc.id, e.target.value, disc.amount)}
                                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2 px-3 text-[11px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500/20"
                                        />
                                        <input
                                          type="number"
                                          step="any"
                                          placeholder="القيمة ج.م"
                                          required
                                          value={disc.amount || ""}
                                          onChange={e => updateDiscount(item.id, disc.id, disc.label, parseFloat(e.target.value) || 0)}
                                          className="w-24 bg-rose-50 border border-rose-150 text-rose-900 rounded-xl p-2 text-center font-mono font-bold text-xs outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeDiscount(item.id, disc.id)}
                                          className="p-2 text-rose-500 hover:text-rose-750 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                                          title="حذف الخصم"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Summary aggregate panel */}
                   {workItems.length > 0 && (
                     <div className="bg-white p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center text-sm font-bold gap-3 border border-indigo-100 shadow-sm">
                       <span className="text-slate-600">إجمالي: <span className="font-mono font-black text-slate-900">{workItems.reduce((acc, it) => acc + (it.workVolume * it.unitPrice || 0), 0).toLocaleString('ar-EG')} ج.م</span></span>
                       <span className="text-rose-600">خصومات: <span className="font-mono font-black text-rose-700">-{workItems.reduce((acc, it) => acc + (it.discounts || []).reduce((s, d) => s + d.amount, 0), 0).toLocaleString('ar-EG')} ج.م</span></span>
                       <span className="text-indigo-800 text-base font-black bg-indigo-50 px-5 py-2 rounded-2xl border border-indigo-100 shrink-0">
                         الصافي: <span className="font-mono font-black">{workItems.reduce((acc, it) => acc + (it.workVolume * it.unitPrice || 0) - (it.discounts || []).reduce((s, d) => s + d.amount, 0), 0).toLocaleString('ar-EG')} ج.م</span>
                       </span>
                     </div>
                   )}

                  {/* Section 3: الملاحظات والمسحوبات */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3 flex items-center gap-1.5">
                      <Lock size={12} className="text-indigo-500 animate-pulse" />
                      <span>المسحوبات المالية المسددة (متزامنة بالكامل مع الدفتر العام)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const currentName = formData.name;
                        const tempLedger = getSubcontractorPayments(currentName);
                        const tempCustody = tempLedger.filter(tx => tx.nature === 'inside_custody').reduce((s, t) => s + t.amount, 0);
                        const tempOffice = tempLedger.filter(tx => tx.nature === 'outside_custody').reduce((s, t) => s + t.amount, 0);

                        return (
                          <>
                            <div className="border border-slate-200 p-4 rounded-[2rem] bg-slate-50/50 space-y-2">
                              <label className="block text-[10px] font-black text-slate-500 mr-1 flex justify-between">
                                <span>دفعة من المكتب الرئيسي (مسدَّد خارج العهدة)</span>
                                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">تلقائي من الدفتر</span>
                              </label>
                              <input
                                type="text"
                                disabled
                                value={`${tempOffice.toLocaleString('ar-EG')} ج.م`}
                                className="w-full text-xs p-4 bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-2xl text-center cursor-not-allowed font-mono"
                              />
                              <p className="text-[9px] text-slate-400 mr-1">أي حركة صرف مرئية من المكتب الرئيسي ومسجلة باسم المقاول</p>
                            </div>

                            <div className="border border-slate-200 p-4 rounded-[2rem] bg-slate-50/50 space-y-2">
                              <label className="block text-[10px] font-black text-slate-500 mr-1 flex justify-between">
                                <span>مسحوبات عهدة الموقع (من العهدة)</span>
                                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">تلقائي من الدفتر</span>
                              </label>
                              <input
                                type="text"
                                disabled
                                value={`${tempCustody.toLocaleString('ar-EG')} ج.م`}
                                className="w-full text-xs p-4 bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-2xl text-center cursor-not-allowed font-mono"
                              />
                              <p className="text-[9px] text-slate-400 mr-1">أي حركة صرف مباشرة من الموقع منسوبة للعهد ومسجلة باسم المقاول</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Manual Paper Settlements (Only Manual Input Allowed!) */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-r-4 border-indigo-500 pr-3">
                      التسويات الخاصة والملاحظات
                    </h4>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1 flex justify-between">
                          <span>تسويات ورقية مقتطعة (إدخال يدوي)</span>
                          <span className="text-[9px] text-purple-650 bg-purple-50 px-2 py-0.5 rounded-full font-bold">الخصم المباشر لمستحقات مقاول الباطن</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.paperSettlements || ''}
                          placeholder="أدخل قيمة التسويات الورقية مباشرة"
                          onChange={e => setFormData(p => ({ ...p, paperSettlements: parseFloat(e.target.value) || 0 }))}
                          className="w-full text-xs p-4 bg-purple-50 hover:bg-purple-50/85 border border-purple-200 focus:border-purple-500/30 font-mono font-black text-center rounded-2xl outline-none transition text-purple-900"
                        />
                        <p className="text-[9px] text-purple-500 font-semibold mr-1">استخدم هذا الحقل لتسجيل المقاصات والمقاولات العائلية أو التسويات الورقية المباشرة</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 mr-1">ملاحظات و شروط المقاولة</label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                          className="w-full text-xs p-4 bg-white border border-slate-200 rounded-2xl h-24 resize-none font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="اكتب أي ملاحظات أو شروط على مقاولة الباطن..."
                        ></textarea>
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer Action Bar */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-4 bg-white flex-shrink-0 flex-row-reverse">
                <button
                  type="submit"
                  form="subcontractor-form"
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-4 bg-slate-105 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer border border-slate-200"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* Print All Subcontractors Modal */}
      {showPrintAllModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                إعدادات طباعة حساب المقاولين الإجمالي
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintAllModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-slate-500 mb-2">نوع التقرير للطباعة:</p>
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-indigo-900">
                  كشف الموقف المالي الإجمالي لمقاولي الباطن بالموقع مع بيان قيم الأعمال والخصومات والمسدد والرصيد المتبقي
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">حجم الورقة:</label>
                  <select
                    value={printPaperSizeAll}
                    onChange={(e: any) => setPrintPaperSizeAll(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="A4">A4 (قياسي)</option>
                    <option value="A3">A3 (كبير جداً - تفصيلي)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">اتجاه الصفحة:</label>
                  <select
                    value={printOrientationAll}
                    onChange={(e: any) => setPrintOrientationAll(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="landscape">أفقي (Landscape - مستحسن)</option>
                    <option value="portrait">رأسي (Portrait)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  handlePrintAllSubcontractors(printPaperSizeAll, printOrientationAll);
                  setShowPrintAllModal(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition text-center text-xs"
              >
                تأكيد وأمر الطباعة
              </button>
              <button
                type="button"
                onClick={() => setShowPrintAllModal(false)}
                className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-3 rounded-xl transition text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Single Subcontractor Modal */}
      {showPrintSingleModal && printTargetSub && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                إعدادات طباعة كشف حساب مقاول
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPrintSingleModal(false);
                  setPrintTargetSub(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-slate-500 mb-1">المقاول المستهدف:</p>
                <p className="text-sm font-black text-indigo-900 bg-indigo-50/50 border border-indigo-150 p-2.5 rounded-xl">
                  {printTargetSub.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-black text-slate-500 mb-2">نوع التقرير للطباعة:</p>
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-indigo-950 leading-relaxed">
                  بيان كشف حركة حساب المقاول التفصيلي متضمناً قياسات البنود والكميات المستحقة، سجل حركات الصرف العينية والنقدية والعهدة، تسوية الرصيد النهائي مع البصمة المعتمدة للتوقيعات.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">حجم الورقة:</label>
                  <select
                    value={printPaperSizeSingle}
                    onChange={(e: any) => setPrintPaperSizeSingle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="A4">A4 (قياسي)</option>
                    <option value="A3">A3 (كبير جداً)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">اتجاه الصفحة:</label>
                  <select
                    value={printOrientationSingle}
                    onChange={(e: any) => setPrintOrientationSingle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="portrait">رأسي (Portrait)</option>
                    <option value="landscape">أفقي (Landscape)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  handlePrintSingleSubcontractor(printTargetSub, printPaperSizeSingle, printOrientationSingle);
                  setShowPrintSingleModal(false);
                  setPrintTargetSub(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition text-center text-xs"
              >
                تأكيد وأمر الطباعة
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPrintSingleModal(false);
                  setPrintTargetSub(null);
                }}
                className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-3 rounded-xl transition text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
