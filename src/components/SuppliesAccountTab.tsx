/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Plus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Printer, 
  Layers, 
  FileSpreadsheet, 
  AlertCircle,
  ShieldCheck,
  Check,
  Wallet,
  ArrowDownCircle,
  FileText,
  TrendingDown,
  Info,
  X
} from 'lucide-react';
import { SupplyRecord, SupplyItem } from '../types';

interface SupplierPayment {
  id: string;
  supplierName: string;
  date: string;
  amount: number;
  paymentMethod: string;
  referenceNo: string;
  notes: string;
}

interface SuppliesAccountTabProps {
  suppliers: any[];
  supplyRecords: SupplyRecord[];
  supplierPayments: SupplierPayment[];
  supplyItems: SupplyItem[];
  onAddTransaction?: (tx: any) => void;
  onAddRecord?: (rec: SupplyRecord) => void;
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
  custodies?: any[];
}

export default function SuppliesAccountTab({
  suppliers,
  supplyRecords,
  supplierPayments,
  supplyItems,
  onAddTransaction,
  onAddRecord,
  userRole,
  addAuditLog,
  custodies = []
}: SuppliesAccountTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [showAddRecordFor, setShowAddRecordFor] = useState<string | null>(null);
  
  // New States for registering standard payments directly into Transactions Ledger (شيت الحركة)
  const [payingSupplierName, setPayingSupplierName] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('نقدى');
  const [payRefNo, setPayRefNo] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payIsInsideCustody, setPayIsInsideCustody] = useState<boolean>(false);
  const [payCustodyId, setPayCustodyId] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const [newRecordState, setNewRecordState] = useState({
    date: new Date().toISOString().split('T')[0],
    ticketNo: '',
    truckPlate: '',
    trailerPlate: '',
    driverName: '',
    rawQuantity: '',
    cubicCertificateId: '',
    notes: ''
  });

  // Print States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<'overview' | 'detailed'>('overview');
  const [printTargetSupplier, setPrintTargetSupplier] = useState<any | null>(null);
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'A3'>('A4');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // helper to convert number to Arabic words (Tafqit)
  const tafqitArabic = (num: number): string => {
    if (num === 0) return 'صفر جنيه مصري';
    if (num < 0) return 'سالب ' + tafqitArabic(Math.abs(num));
    
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    const getUnderThousand = (n: number): string => {
      let result = '';
      const h = Math.floor(n / 100);
      const rem = n % 100;
      
      if (h > 0) {
        result += hundreds[h];
      }
      
      if (rem > 0) {
        if (result) result += ' و ';
        if (rem < 20) {
          result += ones[rem];
        } else {
          const t = Math.floor(rem / 10);
          const o = rem % 10;
          if (o > 0) {
            result += ones[o] + ' و ' + tens[t];
          } else {
            result += tens[t];
          }
        }
      }
      return result;
    };

    const parts: string[] = [];
    let temp = Math.floor(num);
    
    // Millions
    const millions = Math.floor(temp / 1000000);
    temp %= 1000000;
    if (millions > 0) {
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else if (millions >= 3 && millions <= 10) parts.push(getUnderThousand(millions) + ' ملايين');
      else parts.push(getUnderThousand(millions) + ' مليون');
    }
    
    // Thousands
    const thousands = Math.floor(temp / 1000);
    temp %= 1000;
    if (thousands > 0) {
      if (thousands === 1) parts.push('ألف');
      else if (thousands === 2) parts.push('ألفان');
      else if (thousands >= 3 && thousands <= 10) parts.push(getUnderThousand(thousands) + ' آلاف');
      else parts.push(getUnderThousand(thousands) + ' ألف');
    }
    
    // Ones
    if (temp > 0) {
      parts.push(getUnderThousand(temp));
    }
    
    let formatted = parts.join(' و ');
    const piastres = Math.round((num % 1) * 100);
    let piastresText = '';
    if (piastres > 0) {
      piastresText = ` و ${getUnderThousand(piastres)} قرشاً`;
    }
    
    return 'فقط وقدره ' + formatted + ' جنيهاً مصرياً لا غير' + piastresText;
  };

  const handlePrintOverview = (paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
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

    const rows = filteredSuppliers.map((s: any, index: number) => `
      <tr class="border-b border-slate-300 text-slate-850 text-xs">
        <td class="p-2.5 text-center font-bold border border-slate-400">${index + 1}</td>
        <td class="p-2.5 text-right font-black border border-slate-400">${s.name}</td>
        <td class="p-2.5 text-center font-mono border border-slate-400">${s.phone || '---'}</td>
        <td class="p-2.5 text-center font-bold border border-slate-400 font-mono">${s.totalQuantity.toLocaleString()} م٣</td>
        <td class="p-2.5 text-center font-bold border border-slate-400 text-slate-900 font-mono">${s.totalCost.toLocaleString()} ج.م</td>
        <td class="p-2.5 text-center font-bold border border-slate-400 text-emerald-700 font-mono">${(s.totalPaid || 0).toLocaleString()} ج.م</td>
        <td class="p-2.5 text-center font-black border border-slate-400 ${s.balance > 0 ? 'text-red-700' : 'text-emerald-700'} font-mono">${s.balance.toLocaleString()} ج.م</td>
      </tr>
    `).join('');

    const totalCostAll = filteredSuppliers.reduce((sum, s) => sum + s.totalCost, 0);
    const totalPaidAll = filteredSuppliers.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const totalBalanceAll = filteredSuppliers.reduce((sum, s) => sum + s.balance, 0);

    const writtenTotal = tafqitArabic(totalBalanceAll);

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب الموردين الإجمالي</title>
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
            margin: 15mm;
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
      <body class="p-4 bg-white text-slate-900">
        <div class="border-4 border-double border-slate-700 p-6 min-h-full flex flex-col justify-between">
          <div>
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div class="text-right space-y-1">
                <h1 class="text-sm font-black text-slate-800">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[10px] font-bold text-slate-500">إدارة المشروعات والرقابة الهندسية والتوريدات</p>
                <p class="text-[9px] text-slate-400">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center">
                <div class="border-2 border-slate-800 px-4 py-2 bg-slate-50 rounded-lg">
                  <span class="text-xs font-black text-slate-800 block">شعار بنيان</span>
                  <span class="text-[10px] font-bold text-slate-400">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-1">
                <p class="font-bold">الموقع: <span class="font-black text-indigo-750">مشروع برج العرب الجديدة</span></p>
                <p class="font-bold text-[10px] text-slate-500">مستند مالي: كشف أرصدة الموردين</p>
              </div>
            </div>

            <!-- Title -->
            <div class="text-center my-6">
              <h2 class="text-lg font-black text-slate-900 border-b-4 border-indigo-600 inline-block pb-1 px-6 uppercase tracking-wider">
                كشف الأرصدة والمطابقات المالية الإجمالية للموردين
              </h2>
              <p class="text-[11px] font-bold text-slate-500 mt-2">بيان تفصيلي بجميع المقاولين وموردي الخامات بالمشروع</p>
            </div>

            <!-- Table -->
            <div class="mt-4">
              <table class="w-full text-right text-xs border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-xs">
                    <th class="p-3 border border-slate-400 w-12">م</th>
                    <th class="p-3 border border-slate-400 text-right">اسم المقاول المورد</th>
                    <th class="p-3 border border-slate-400">رقم الهاتف</th>
                    <th class="p-3 border border-slate-400">إجمالي الكمية الموردة</th>
                    <th class="p-3 border border-slate-400">إجمالي قيمة التوريد</th>
                    <th class="p-3 border border-slate-400">إجمالي المسدد</th>
                    <th class="p-3 border border-slate-400">صافي المديونية القائمة</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <!-- Totals Row -->
                  <tr class="bg-slate-50 border-t-2 border-slate-800 text-xs font-black text-center">
                    <td colspan="3" class="p-3 border border-slate-400 text-right text-slate-900">
                      الإجمالي العام لجميع الموردين النشطين
                    </td>
                    <td class="p-3 border border-slate-400 font-mono text-slate-900">
                      ${filteredSuppliers.reduce((sum, s) => sum + s.totalQuantity, 0).toLocaleString()} م٣
                    </td>
                    <td class="p-3 border border-slate-400 font-mono text-slate-900">
                      ${totalCostAll.toLocaleString()} ج.م
                    </td>
                    <td class="p-3 border border-slate-400 font-mono text-emerald-700">
                      ${totalPaidAll.toLocaleString()} ج.م
                    </td>
                    <td class="p-3 border border-slate-400 font-mono text-red-700">
                      ${totalBalanceAll.toLocaleString()} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tafqit -->
            <div class="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-xl">
              <p class="text-xs font-black text-slate-800 leading-relaxed">
                <span class="text-indigo-700 font-black">إجمالي المديونية المطلوبة للموردين كتابةً:</span> ${writtenTotal}
              </p>
            </div>
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-4 gap-4 text-center text-[10px] font-black text-slate-700 mt-16 border-t border-slate-300 pt-6">
            <div class="space-y-12">
              <p>مسؤول جرد التوريدات والموقع</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p>المكتب الفني ومراجع الحسابات</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p>المدير المالي للمشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p>اعتماد مدير عام المشروعات</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
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

  const handlePrintDetailed = (s: any, paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
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

    // Materials Rows
    const materialsRows = s.materials.map((m: any, idx: number) => {
      const matchItem = supplyItems.find(i => i.code === m.materialCode);
      return `
        <tr class="border-b border-slate-300 text-xs text-slate-850 text-center">
          <td class="p-2 border border-slate-400 font-bold">${idx + 1}</td>
          <td class="p-2 border border-slate-400 text-right font-black">${matchItem?.name || m.materialCode}</td>
          <td class="p-2 border border-slate-400 font-mono">${m.totalQuantity.toLocaleString()} م٣</td>
          <td class="p-2 border border-slate-400 font-mono">${(matchItem?.defaultPrice || 0).toLocaleString()} ج.م</td>
          <td class="p-2 border border-slate-400 font-black font-mono text-slate-900">${m.totalCost.toLocaleString()} ج.م</td>
        </tr>
      `;
    }).join('');

    // Payments Rows
    const paymentsRows = s.payments.length === 0 ? `
      <tr>
        <td colspan="5" class="p-4 border border-slate-400 text-center text-slate-500 font-bold">لا يوجد مدفوعات مسجلة لهذا المورد بشيت الحركة.</td>
      </tr>
    ` : s.payments.map((p: any, idx: number) => `
      <tr class="border-b border-slate-300 text-xs text-slate-850 text-center">
        <td class="p-2 border border-slate-400 font-bold">${idx + 1}</td>
        <td class="p-2 border border-slate-400 font-mono">${p.date}</td>
        <td class="p-2 border border-slate-400 font-black">${getPayMethodArabic(p.paymentMethod)}</td>
        <td class="p-2 border border-slate-400 text-right max-w-xs truncate">${p.notes || 'تصفية حساب توريد'}</td>
        <td class="p-2 border border-slate-400 font-black font-mono text-emerald-700">${parseFloat(p.amount || 0).toLocaleString()} ج.م</td>
      </tr>
    `).join('');

    const writtenTotal = tafqitArabic(s.balance);

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب تفصيلي - ${s.name}</title>
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
            margin: 15mm;
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
      <body class="p-4 bg-white text-slate-900">
        <div class="border-4 border-double border-slate-700 p-6 min-h-full flex flex-col justify-between">
          <div>
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div class="text-right space-y-1">
                <h1 class="text-sm font-black text-slate-800">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[10px] font-bold text-slate-500">إدارة المشروعات والرقابة الهندسية والتوريدات</p>
                <p class="text-[9px] text-slate-400">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center">
                <div class="border-2 border-slate-800 px-4 py-2 bg-slate-50 rounded-lg">
                  <span class="text-xs font-black text-slate-800 block">شعار بنيان</span>
                  <span class="text-[10px] font-bold text-slate-400">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-1">
                <p class="font-bold">الموقع: <span class="font-black text-indigo-750">مشروع برج العرب الجديدة</span></p>
                <p class="font-bold text-[10px] text-slate-500">رقم هاتف المورد: ${s.phone || '---'}</p>
              </div>
            </div>

            <!-- Title -->
            <div class="text-center my-6">
              <h2 class="text-lg font-black text-slate-900 border-b-4 border-indigo-600 inline-block pb-1 px-6 uppercase tracking-wider">
                كشف حساب تفصيلي ومطابقة مالية للمورد
              </h2>
              <p class="text-[13px] font-black text-slate-700 mt-2">المقاول المعتمد: <span class="text-indigo-700 underline font-black text-sm">${s.name}</span></p>
            </div>

            <!-- Block 1: Supplies Summary Table -->
            <div class="mt-4">
              <h3 class="text-xs font-black text-slate-800 border-r-4 border-indigo-500 pr-2 mb-2">أولاً: بيان الكميات والمواد الخام الموردة (المستحق المالي)</h3>
              <table class="w-full text-right text-xs border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-xs">
                    <th class="p-2 border border-slate-400 w-12">م</th>
                    <th class="p-2 border border-slate-400 text-right">المادة الخام</th>
                    <th class="p-2 border border-slate-400">الكمية الإجمالية</th>
                    <th class="p-2 border border-slate-400">السعر الافتراضي</th>
                    <th class="p-2 border border-slate-400">القيمة الإجمالية للمطالبة</th>
                  </tr>
                </thead>
                <tbody>
                  ${materialsRows}
                  <tr class="bg-slate-50 font-black text-center">
                    <td colspan="2" class="p-2 border border-slate-400 text-right">إجمالي مستحقات التوريد:</td>
                    <td class="p-2 border border-slate-400 font-mono">${s.totalQuantity.toLocaleString()} م٣</td>
                    <td class="p-2 border border-slate-400">---</td>
                    <td class="p-2 border border-slate-400 font-mono text-slate-900">${s.totalCost.toLocaleString()} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Block 2: Payments Summary Table -->
            <div class="mt-8">
              <h3 class="text-xs font-black text-slate-800 border-r-4 border-emerald-500 pr-2 mb-2">ثانياً: بيان الدفعات والمسددات المقيدة في الدفتر العام (المسدد المالي)</h3>
              <table class="w-full text-right text-xs border-collapse border border-slate-400">
                <thead>
                  <tr class="bg-slate-100 text-slate-900 font-black text-center text-xs">
                    <th class="p-2 border border-slate-400 w-12">م</th>
                    <th class="p-2 border border-slate-400">التاريخ</th>
                    <th class="p-2 border border-slate-400">طريقة السداد</th>
                    <th class="p-2 border border-slate-400 text-right">البيان المذكور بالسند</th>
                    <th class="p-2 border border-slate-400">القيمة المسددة فعلياً</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentsRows}
                  <tr class="bg-slate-50 font-black text-center">
                    <td colspan="4" class="p-2 border border-slate-400 text-right">إجمالي المبالغ المسددة والمصفاة:</td>
                    <td class="p-2 border border-slate-400 font-mono text-emerald-700">${s.totalPaid.toLocaleString()} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Financial Summary Box -->
            <div class="mt-8 p-4 bg-slate-50 border-2 border-dashed border-slate-400 rounded-2xl grid grid-cols-3 gap-4 text-center items-center">
              <div>
                <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">إجمالي التوريدات (المستحق)</p>
                <p class="text-base font-black text-slate-900 font-mono">${s.totalCost.toLocaleString()} ج.م</p>
              </div>
              <div class="border-x border-slate-300">
                <p class="text-[10px] font-bold text-emerald-700 uppercase mb-1">إجمالي المسدد والمصروف</p>
                <p class="text-base font-black text-emerald-600 font-mono">${s.totalPaid.toLocaleString()} ج.م</p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-red-700 uppercase mb-1">صافي الرصيد القائم (المتبقي)</p>
                <p class="text-lg font-black text-red-600 font-mono">${s.balance.toLocaleString()} ج.م</p>
              </div>
            </div>

            <!-- Tafqit -->
            <div class="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-xl">
              <p class="text-xs font-black text-slate-800 leading-relaxed">
                <span class="text-indigo-700 font-black">صافي المستحق القائم للمورد كتابةً:</span> ${writtenTotal}
              </p>
            </div>
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-4 gap-4 text-center text-[10px] font-black text-slate-700 mt-16 border-t border-slate-300 pt-6">
            <div class="space-y-12">
              <p>مسؤول جرد التوريدات والموقع</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p>المكتب الفني ومراجع الحسابات</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p>المدير المالي للمشروع</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p>اعتماد مدير عام المشروعات</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-3/4 mx-auto">الاسم والتوقيع: .....................</p>
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

  const handleQuickAddRecord = (e: React.FormEvent, supplier: any) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    if (!onAddRecord) return;
    
    const material = supplyItems.find(i => i.code === supplier.materialCode);
    const unitPrice = material ? material.defaultPrice : 0;
    const rawQty = parseFloat(newRecordState.rawQuantity) || 0;

    const record: SupplyRecord = {
      id: `sup-ticket-${Date.now()}`,
      date: newRecordState.date,
      ticketNo: newRecordState.ticketNo,
      truckPlate: newRecordState.truckPlate,
      trailerPlate: newRecordState.trailerPlate,
      driverName: newRecordState.driverName,
      rawQuantity: rawQty,
      qualityDiscount: 0,
      loadDiscount: 0,
      totalDiscount: 0,
      netQuantity: rawQty,
      unitPrice: unitPrice,
      totalCost: rawQty * unitPrice,
      supplierName: supplier.name,
      supplyLocation: 'الموقع المستهدف',
      itemCode: supplier.materialCode || '',
      supplyMethod: 'truck',
      cubicCertificateId: newRecordState.cubicCertificateId || undefined,
      isWaterBillApproved: false,
      ledgerNo: 'عام',
      notes: newRecordState.notes
    };

    onAddRecord(record);
    setShowAddRecordFor(null);
    setNewRecordState({
      date: new Date().toISOString().split('T')[0],
      ticketNo: '',
      truckPlate: '',
      trailerPlate: '',
      driverName: '',
      rawQuantity: '',
      cubicCertificateId: '',
      notes: ''
    });

    addAuditLog(
      'تسجيل بون سريع', 
      'إدارة الحسابات والتوريدات', 
      `تسجيل بون توريد سريع رقم ${record.ticketNo} للمورد ${supplier.name} خامة ${material?.name || ''}.`
    );
  };

  const handleRegisterPayment = (e: React.FormEvent, supplierName: string) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    if (!onAddTransaction) return;

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    // Capture engineer custody details if nature is inside_custody
    const selectedCustody = custodies?.find(c => c.id === payCustodyId);
    let engNotes = '';
    if (payIsInsideCustody && selectedCustody) {
      engNotes = `خصماً من عهدة المهندس: ${selectedCustody.engineerName}`;
    } else {
      engNotes = 'صرف مباشر من الصندوق الرئيسي للشركة';
    }

    const payMethodLabels: Record<string, string> = {
      'نقدى': 'نقدي كاش',
      'شيك': 'شيك بنكي معجل',
      'تحويل بنكى': 'تحويل بنكي مباشر',
      'انستا': 'انستاباي InstaPay',
      'فودافون كاش': 'فودافون كاش ومحافظ جول',
      'اخرى': 'أخرى (عهد موقعية)'
    };
    
    const finalDescription = `سداد دفعة مالية للمورد: ${supplierName} [طريقة الدفع: ${payMethodLabels[payMethod] || payMethod}] (${engNotes}) - البيان: ${payNotes || 'تصفية جزئية للتوريدات الموقعية'}`;

    onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'supplies',
      amount: amountNum,
      type: 'spent',
      nature: payIsInsideCustody ? 'inside_custody' : 'outside_custody',
      recipient: supplierName, // MUST be supplier name so it links to this supplier in the ledger!
      paymentMethod: payMethod as any,
      referenceNo: payRefNo || undefined,
      description: finalDescription,
      notes: payNotes || undefined
    });

    // Log the audit trial
    addAuditLog(
      'صرف دفعة للمورد', 
      'إدارة التوريدات والحسابات', 
      `صرف دفعة مالية بقيمة ${amountNum.toLocaleString()} ج.م للمورد ${supplierName} (${payMethodLabels[payMethod] || payMethod}) - مرجع: ${payRefNo || 'N/A'}.`
    );

    // Reset Form & show success banner
    setActionSuccessMsg(`تم بنجاح تام ترحيل دفعة السداد بقيمة ${amountNum.toLocaleString()} ج.م للمورد "${supplierName}" وإثبات الحركة في شيت الحركة بالدفتر العام.`);
    
    // Auto-scroll or clear after 6 seconds
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 6000);
    
    setPayAmount('');
    setPayRefNo('');
    setPayNotes('');
    setPayCustodyId('');
    setPayingSupplierName(null);
  };

  // Calculate detailed financials for each supplier
  const supplierCalculations = useMemo(() => {
    const grouped = suppliers.reduce((acc, s) => {
      if (!acc[s.name]) {
        acc[s.name] = {
          ids: [s.id],
          name: s.name,
          phone: s.phone,
          materials: []
        };
      } else {
        acc[s.name].ids.push(s.id);
      }
      
      const records = supplyRecords.filter(r => r.supplierName === s.name && r.itemCode === s.materialCode);
      const totalQuantity = records.reduce((sum, r) => sum + r.netQuantity, 0);
      const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);

      acc[s.name].materials.push({
        materialCode: s.materialCode,
        records,
        totalQuantity,
        totalCost
      });
      
      return acc;
    }, {} as any);
    
    return Object.values(grouped).map((group: any) => {
      const payments = supplierPayments.filter(p => p.supplierName === group.name);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      
      const totalCost = group.materials.reduce((sum: any, m: any) => sum + m.totalCost, 0);
      const totalQuantity = group.materials.reduce((sum: any, m: any) => sum + m.totalQuantity, 0);
      const balance = totalCost - totalPaid;
      
      return { ...group, payments, totalPaid, totalCost, totalQuantity, balance };
    });
  }, [suppliers, supplyRecords, supplierPayments]);

  const totalSuppliesCost = supplierCalculations.reduce((sum, s) => sum + s.totalCost, 0);
  const totalPaidToSuppliers = supplierCalculations.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalOutstandingBalance = supplierCalculations.reduce((sum, s) => sum + s.balance, 0);

  // Filter based on search query
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return supplierCalculations;
    const q = searchQuery.toLowerCase().trim();
    return supplierCalculations.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.notes || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  }, [supplierCalculations, searchQuery]);

  const getPayMethodArabic = (method: string) => {
    const table: Record<string, string> = {
      'نقدى': 'نقدى عهدة موقع',
      'شيك': 'شيك بنكي معجل',
      'تحويل بنكى': 'تحويل بنكي / حساب جاري',
      'انستا': 'انستاباي InstaPay',
      'فودافون كاش': 'محفظة إلكترونية',
      'اخرى': 'أخرى / عهد مالي'
    };
    return table[method] || method;
  };

  return (
    <div className="space-y-6">
      
      {/* Succession Banner Alert */}
      {actionSuccessMsg && (
        <div className="p-4.5 bg-emerald-50 border-r-4 border-emerald-550 rounded-2xl flex items-start gap-3 shadow-md animate-fade-in text-right">
          <ShieldCheck className="h-6 w-6 text-emerald-650 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-extrabold text-xs text-emerald-900">ربط مالي ومطابقة سحابية مكتملة</h5>
            <p className="text-xs font-bold text-emerald-700 leading-snug">{actionSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI: Total Cost from Supply Bills */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-bold text-slate-500">إجمالي مصروف التوريدات (البونات المقبولة)</p>
            <Coins className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1.5 font-mono">
            {totalSuppliesCost.toLocaleString()} <span className="text-sm text-indigo-400">ج.م</span>
          </p>
          <div className="text-xs text-slate-400 mt-1">تراكمي التوريدات الموقعية المطابقة مع بونات الجرد</div>
        </div>

        {/* KPI: Total Paid linked to the Ledger */}
        <div className="bg-white border border-slate-250 p-5 rounded-3xl shadow-md ring-2 ring-emerald-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse inline-block"></span>
                إجمالي المسدد للموردين (شيت الحركة)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">مطابق تماماً مع سجل القيود العام</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-1.5 font-mono">
            {totalPaidToSuppliers.toLocaleString()} <span className="text-sm text-emerald-500">ج.م</span>
          </p>
          <div className="text-xs text-slate-500 font-bold mt-1.5 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100 flex justify-between">
            <span>عدد دفعات السند الإجمالي:</span>
            <span className="font-bold text-emerald-800">{supplierPayments.length} حركة دفع</span>
          </div>
        </div>

        {/* KPI: Current Outstanding balance */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-bold text-slate-500">مجموع المديونية المتبقية للموردين</p>
            <CreditCard className="h-5 w-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1.5 font-mono">
            {totalOutstandingBalance.toLocaleString()} <span className="text-sm text-red-400">ج.م</span>
          </p>
          <div className="text-xs text-slate-400 mt-1">رصيد التصفية المالية الجارية المستحقة</div>
        </div>
      </div>

      {/* Supplier Account management section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              كشف الأرصدة والاقتران المالي مع شيت الحركة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة كميات التوريد، التكاليف المحملة (المصروف)، والمدفوعات المتتالية (المسدد) المرتبطة مباشرة بدفتر قيود الموقع
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                setPrintType('overview');
                setPrintTargetSupplier(null);
                setShowPrintModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl text-xs font-black transition shadow-sm"
            >
              <Printer className="h-4 w-4" />
              طباعة كشف الموردين
            </button>
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="بحث باسم المورد، المذكرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-4 pr-10 text-right text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 placeholder-slate-400"
              />
              <Search className="absolute left-auto right-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3">
              <User className="h-10 w-10 text-slate-300" />
              <div className="text-slate-500 font-bold text-sm">لا يوجد موردين مضافين مطابقين</div>
              <div className="text-slate-400 text-xs">قم بإضافة موردين من علامة تبويب "إعدادات التوريدات" للبدء</div>
            </div>
          ) : (
            filteredSuppliers.map((s: any) => {
              const isExpanded = expandedSupplierId === s.ids[0]; // expand by first ID
              return (
                <div 
                  key={s.ids[0]} 
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all overflow-hidden ${
                    isExpanded ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    onClick={() => setExpandedSupplierId(isExpanded ? null : s.ids[0])}
                    className="p-4 grid grid-cols-1 md:grid-cols-[1.5fr,2.5fr,auto] gap-4 items-center cursor-pointer hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-3 bg-slate-100 rounded-xl text-slate-500 hidden md:block">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
                        <div className="text-[10px] text-slate-550 font-bold mt-1 flex items-center gap-2">
                          <span className="font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                            يورد: {s.materials.length} بنود
                          </span>
                          <span>رقم الهاتف: {s.phone || 'غير مسجل'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 md:grid-cols-4 text-center font-mono w-full px-2">
                      <div className="border-l border-slate-200">
                        <div className="text-[9px] font-bold text-slate-500">كمية إجمالية</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{s.totalQuantity.toLocaleString()} م٣</div>
                      </div>
                      <div className="border-l border-slate-200">
                        <div className="text-[9px] font-bold text-slate-500">إجمالي المصروف</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{s.totalCost.toLocaleString()} ج.م</div>
                      </div>
                      <div className="border-l border-slate-250 bg-emerald-50/20 p-1 rounded-lg">
                        <div className="text-[9px] font-extrabold text-emerald-700">المسدد (الحركة)</div>
                        <div className="text-xs font-black text-emerald-600 mt-0.5">{(s.totalPaid || 0).toLocaleString()} ج.م</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-500">المتبقي المطلوب</div>
                        <div className="text-xs font-black text-red-650 mt-0.5">{s.balance.toLocaleString()} ج.m</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end md:justify-center hidden md:flex">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Account Panels */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-6 text-right">
                      
                      {/* Financial Detail Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Supply Quantity Analysis */}
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 space-y-2">
                          <h5 className="font-extrabold text-xs text-indigo-700 flex items-center gap-1.5 border-b pb-2">
                            <Layers className="h-3.5 w-3.5" />
                            تفاصيل الكميات والمواد الموردة (المصروف المقابل)
                          </h5>
                          <div className="space-y-2">
                            {s.materials.map((m: any) => {
                              const matchItem = supplyItems.find(i => i.code === m.materialCode);
                              return (
                                <div key={m.materialCode} className="text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-right">
                                  <div>
                                    <div className="font-black text-slate-900">{matchItem?.name || m.materialCode}</div>
                                    <div className="text-[10px] text-slate-500">السعر الافتراضي للوحدة: {(matchItem?.defaultPrice || 0).toLocaleString()} ج.م</div>
                                  </div>
                                  <div className="text-left">
                                    <div className="font-mono font-black text-indigo-650">{m.totalQuantity.toLocaleString()} م٣</div>
                                    <div className="text-[10px] font-bold text-slate-500 font-mono">{(m.totalCost || 0).toLocaleString()} ج.م</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Financial Ledger matching info */}
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                          <div>
                            <h5 className="font-extrabold text-xs text-emerald-700 flex items-center justify-between border-b pb-2 mb-2">
                              <span className="flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5" />
                                الاقتران المالي بدفتر الحركات العام
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintType('detailed');
                                  setPrintTargetSupplier(s);
                                  setShowPrintModal(true);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black transition"
                              >
                                <Printer className="h-3 w-3" />
                                طباعة كشف تفصيلي
                              </button>
                            </h5>
                            <p className="text-xs text-slate-600 leading-snug">
                              المبالغ المدفوعة والمنصرفة للمورد <span className="font-extrabold text-slate-900">"{s.name}"</span> تخضع للتطابق الكامل مع شيت حركات الموقع العام بالوقت الحقيقي.
                            </p>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 mt-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">إجمالي التوريد (المستحق):</span>
                              <span className="font-mono font-bold text-slate-900">{s.totalCost.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex justify-between text-xs text-emerald-600">
                              <span>إجمالي الدفعات المسددة:</span>
                              <span className="font-mono font-black text-emerald-700">{s.totalPaid.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex justify-between text-xs font-extrabold text-slate-800 border-t border-slate-200/50 pt-1">
                              <span>صافي الرصيد القائم:</span>
                              <span className={`font-mono ${s.balance > 0 ? 'text-red-650' : 'text-emerald-700'}`}>{s.balance.toLocaleString()} ج.م</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Payment form directly in ledger */}
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200">
                          <h5 className="font-extrabold text-xs text-amber-600 flex items-center gap-1.5 border-b pb-2 mb-2">
                            <Plus className="h-4 w-4" />
                            صرف سداد مباشر وترحيل لشيت الحركة
                          </h5>
                          {userRole === 'viewer' ? (
                            <div className="text-xs text-slate-400 p-4 text-center">عذراً، لا تمتلك صلاحيات لتسجيل قيود السداد.</div>
                          ) : payingSupplierName === s.name ? (
                            <form onSubmit={(e) => handleRegisterPayment(e, s.name)} className="space-y-2 text-right">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المبلغ المدفوع (ج.م):</label>
                                  <input 
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="أدخل القيمة"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className="w-full text-xs font-mono font-bold p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-left"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">طريقة الدفع:</label>
                                  <select
                                    value={payMethod}
                                    onChange={(e) => setPayMethod(e.target.value)}
                                    className="w-full text-[11px] font-bold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                                  >
                                    <option value="نقدى">نقدا مالي</option>
                                    <option value="شيك">شيك بنكي مؤجل</option>
                                    <option value="تحويل بنكى">تحويل مباشر</option>
                                    <option value="انستا">انستاباي InstaPay</option>
                                    <option value="فودافون كاش">فودافون كاش</option>
                                    <option value="اخرى">طريقة أخرى</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-150">
                                <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    checked={payIsInsideCustody}
                                    onChange={(e) => {
                                      setPayIsInsideCustody(e.target.checked);
                                      if (!e.target.checked) setPayCustodyId('');
                                    }}
                                    className="h-3 w-3 accent-indigo-600 rounded"
                                  />
                                  <span>من عهدة مهندس موقع (تصفية عهدة)</span>
                                </label>

                                {payIsInsideCustody && (
                                  <div className="pt-1 select-none animate-fade-in">
                                    <select
                                      required
                                      value={payCustodyId}
                                      onChange={(e) => setPayCustodyId(e.target.value)}
                                      className="w-full text-[10px] font-bold p-1 bg-white border border-slate-200 rounded"
                                    >
                                      <option value="">-- اختر المهندس صاحب العهدة --</option>
                                      {custodies?.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.engineerName} (متاح: {c.remaining.toLocaleString()} ج.م)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">رقم السند المالي / الشيك:</label>
                                <input 
                                  type="text"
                                  placeholder="أي رقم مرجعي للتأكيد"
                                  value={payRefNo}
                                  onChange={(e) => setPayRefNo(e.target.value)}
                                  className="w-full text-xs p-1 rounded-lg border border-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">البيان والملاحظات:</label>
                                <input 
                                  type="text"
                                  placeholder="مثل: جزء من حساب رصيد السن المورد..."
                                  value={payNotes}
                                  onChange={(e) => setPayNotes(e.target.value)}
                                  className="w-full text-xs p-1 rounded-lg border border-slate-200"
                                />
                              </div>

                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setPayingSupplierName(null)}
                                  className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                                >
                                  إلغاء
                                </button>
                                <button
                                  type="submit"
                                  className="px-3 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 shadow-sm"
                                >
                                  <Check size={12} />
                                  ترحيل المعاملة
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                              <p className="text-[10px] font-medium text-slate-500 leading-snug">صرف دفعة مالية للمورد فوراً مع إنشاء حركة مصرفية تلقائية بشيت الحركة المالي.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setPayingSupplierName(s.name);
                                  setPayAmount('');
                                  setPayRefNo('');
                                  setPayNotes('');
                                  setPayIsInsideCustody(false);
                                  setPayCustodyId('');
                                }}
                                className="w-full py-1.5 text-[10px] font-extrabold bg-indigo-50 border border-indigo-150 text-indigo-650 hover:bg-indigo-600 hover:text-white rounded-lg transition active:scale-95 flex items-center justify-center gap-1"
                              >
                                <DollarSign size={13} />
                                تسجيل وصرف دفعة لـ {s.name}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detailed Linked Payments Table From Transactions Sheet */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                            القيود المالية والدفعات الفعلية المسجلة بشيت الحركة لهذا المورد
                          </h5>
                          <span className="text-[10px] bg-slate-105 px-2 py-0.5 rounded-full font-mono text-slate-550 font-bold border border-slate-200">
                            مطابقة مع شيت الحركة المعتمد
                          </span>
                        </div>

                        {s.payments.length === 0 ? (
                          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                            <Info className="h-6 w-6 text-slate-400" />
                            <p className="text-xs font-bold text-slate-500">لا توجد دفعات مالية مقيدة في شيت الحركة لهذا المورد حتى الآن.</p>
                            <p className="text-[10px] text-slate-400">يمكنك استخدام صندوق الصرف السريع على اليسار لترحيل وتأكيد أول دفعة لمطابقة السجل العام.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-650 font-extrabold border-b border-slate-100">
                                  <th className="p-2 text-[10px]">تاريخ القيد</th>
                                  <th className="p-2 text-[10px] text-center">رقم الحركة</th>
                                  <th className="p-2 text-[10px]">طريقة السداد</th>
                                  <th className="p-2 text-[10px]">مرجع السند</th>
                                  <th className="p-2 text-[10px]">البيان التفصيلي بشيت الحركة</th>
                                  <th className="p-2 text-[10px] text-left">مجموع المسدد</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.payments.map((p: any, idx: number) => (
                                  <tr key={p.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                                    <td className="p-2 font-mono text-[10.5px] text-slate-500">{p.date}</td>
                                    <td className="p-2 font-mono text-[11px] text-slate-700 font-extrabold text-center">
                                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px]">
                                        {p.id ? String(p.id).replace('tx-', '#') : `#${idx + 1}`}
                                      </span>
                                    </td>
                                    <td className="p-2 font-bold text-slate-700">{getPayMethodArabic(p.paymentMethod)}</td>
                                    <td className="p-2 font-mono font-bold text-slate-500">{p.referenceNo || 'بدون مرجع'}</td>
                                    <td className="p-2 text-slate-600 text-[11px] font-bold leading-normal truncate max-w-xs" title={p.notes}>
                                      {p.notes}
                                    </td>
                                    <td className="p-2 text-left font-mono font-black text-emerald-650 text-xs">
                                      {parseFloat(p.amount || 0).toLocaleString()} ج.م
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Print Settings Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" />
                إعدادات طباعة كشف الحساب
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-slate-500 mb-2">نوع التقرير للطباعة:</p>
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-indigo-900">
                  {printType === 'overview' ? 'كشف حساب الموردين الإجمالي (جميع الموردين)' : `كشف الحساب التفصيلي للمورد: ${printTargetSupplier?.name || ''}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">حجم الورقة:</label>
                  <select
                    value={printPaperSize}
                    onChange={(e: any) => setPrintPaperSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="A4">A4 (قياسي)</option>
                    <option value="A3">A3 (كبير جداً)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">اتجاه الصفحة:</label>
                  <select
                    value={printOrientation}
                    onChange={(e: any) => setPrintOrientation(e.target.value)}
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
                  if (printType === 'overview') {
                    handlePrintOverview(printPaperSize, printOrientation);
                  } else if (printTargetSupplier) {
                    handlePrintDetailed(printTargetSupplier, printPaperSize, printOrientation);
                  }
                  setShowPrintModal(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition text-center text-xs"
              >
                تأكيد وأمر الطباعة
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
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
