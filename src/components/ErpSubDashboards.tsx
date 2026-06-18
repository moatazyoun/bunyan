/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  TrendingUp, 
  Users, 
  Wrench, 
  Database, 
  ShieldCheck, 
  Briefcase, 
  Compass, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Coins, 
  HardHat, 
  Gauge, 
  Droplet, 
  Zap, 
  ArrowUpRight, 
  Eye, 
  Users2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  EquipmentSummary,
  Transaction,
  LabTestRecord, 
  HseIncidentRecord, 
  WbsTaskRecord, 
  WarehouseItemRecord,
  AuditTrailRecord,
  MaintenanceOrder,
  FuelLogRecord
} from '../types';
import EquipmentDashboard from './EquipmentDashboard';

interface ErpSubDashboardsProps {
  equipmentList: EquipmentSummary[];
  setEquipmentList: React.Dispatch<React.SetStateAction<EquipmentSummary[]>>;
  transactions: Transaction[];
  maintenanceOrders: MaintenanceOrder[];
  labTests: LabTestRecord[];
  hseIncidents: HseIncidentRecord[];
  wbsTasks: WbsTaskRecord[];
  warehouseItems: WarehouseItemRecord[];
  auditLogs: AuditTrailRecord[];
  totalLedgerSpent: number;
  totalLedgerExecuted: number;
  fuelLogs: FuelLogRecord[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLogRecord[]>>;
  custodyBudget: number;
  setCustodyBudget: React.Dispatch<React.SetStateAction<number>>;
}

export default function ErpSubDashboards({
  equipmentList,
  setEquipmentList,
  transactions,
  maintenanceOrders,
  labTests,
  hseIncidents,
  wbsTasks,
  warehouseItems,
  auditLogs,
  totalLedgerSpent,
  totalLedgerExecuted,
  fuelLogs,
  setFuelLogs,
  custodyBudget,
  setCustodyBudget
}: ErpSubDashboardsProps) {

  const [activePersona, setActivePersona] = useState<string>('executive');

  // Format currency helpers
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amt);
  };

  // Switcher UI
  const personas = [
    { id: 'executive', name: 'مجلس الإدارة العليا (CEO)', subtitle: 'المحفظة والتمويل الموحد', icon: Building, color: 'text-indigo-650bg-indigo-50 border-indigo-200' },
    { id: 'project_manager', name: 'مدير المشروع (PM)', subtitle: 'متابعة WBS والمسار الحرج', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'finance', name: 'مدير الحسابات والعهد', subtitle: 'القيود اليومية وميزانيات اللجان', icon: Coins, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'fleet', name: 'إدارة المعدات والأسطول', subtitle: 'كفاءة التشغيل وحرق السولار', icon: Wrench, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'warehouse', name: 'إدارة المستودعات والمخازن', subtitle: 'تتبع الأصناف ومقاصير التشويد', icon: Database, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'qa_qc', name: 'رئيس قسم ضبط الجودة (QA)', subtitle: 'تحاليل المعمل وسلامة الرصف', icon: Gauge, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { id: 'hse', name: 'أخصائي السلامة والبيئة (HSE)', subtitle: 'ساعات العمل الآمنة والوقاية', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' }
  ];

  return (
    <div className="space-y-6" id="erp-sub-dashboards-root">
      
      {/* Persona Switcher Ribbon */}
      <div className="bg-slate-55 border border-slate-200 rounded-xl p-3.5">
        <span className="block text-[10.5px] font-bold text-slate-400 mb-2.5 text-right uppercase tracking-wider font-mono">
          🗂️ التبديل الفوري بين 7 لوحات تحكم متكاملة مخصصة للأدوار الوظيفية
        </span>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {personas.map(p => {
            const Icon = p.icon;
            const isActive = activePersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePersona(p.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all focus:outline-none ${
                  isActive 
                    ? 'bg-slate-905 border-slate-900 text-white shadow-md scale-[1.02]' 
                    : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                }`}
                id={`persona-btn-${p.id}`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-405'} />
                <span className="block text-[11px] font-bold mt-1.5 truncate w-full">{p.name}</span>
                <span className={`block text-[8px] font-medium leading-none mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{p.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE DASHBOARD */}

      {/* 1. EXECUTIVE MANAGEMENT DASHBOARD */}
      {activePersona === 'executive' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-800">
          
          {/* Executive mini cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">إجمالي قيمة المحفظة المتعاقد عليها</span>
                <span className="text-lg font-black text-slate-900 font-mono mt-0.5 inline-block">{formatCurrency(0)}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-indigo-600">
                <Building size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-201 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">إجمالي المنصرف الفعلي في الموقع (الكاش)</span>
                <span className="text-lg font-black text-rose-600 font-mono mt-0.5 inline-block">{formatCurrency(totalLedgerSpent)}</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg text-rose-600">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-201 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">قيمة الأعمال المنفذة المعتمدة (المستند)</span>
                <span className="text-lg font-black text-indigo-600 font-mono mt-0.5 inline-block">{formatCurrency(totalLedgerExecuted)}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-150 p-2 rounded-lg text-indigo-600">
                <CheckCircle size={18} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-201 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">هامش أرباح محتسب تقديرياً للمشروع</span>
                <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 inline-block">
                  {totalLedgerExecuted > 0 ? (((totalLedgerExecuted - totalLedgerSpent) / totalLedgerExecuted) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-110 p-2 rounded-lg text-emerald-600">
                <Coins size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Multi company & branch analysis */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 lg:col-span-2 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">مؤشر أداء الفروع والشركات الشقيقة المترابطة</h4>
              <p className="text-xs text-slate-500">تمثيل كامل لرأس المال والأشغال لشركات المقاولات وإنشاء الطرق التابعة للمجموعة.</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div className="text-left font-mono">
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(totalLedgerExecuted)}</span>
                    <span className="block text-[10px] text-emerald-600 font-bold font-sans">الأعمال المنفذة</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs block text-slate-800">إجمالي الأشغال الحالية</span>
                    <span className="text-[10px] text-slate-400">جميع القطاعات</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div className="text-left font-mono">
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(totalLedgerSpent)}</span>
                    <span className="block text-[10px] text-indigo-600 font-bold font-sans">المنصرف الفعلي</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs block text-slate-800">إجمالي المصروفات والنفقات</span>
                    <span className="text-[10px] text-slate-400">جميع الفروع</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit trail summary */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">سجل العمليات الأمني المحدث (Audit Trail)</h4>
              <p className="text-xs text-slate-500">مراقبة الـ ERP الحية للعمليات الحساسة التي يجريها موظفو الإدارات والشركات.</p>
              
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-2.5 border-r-2 border-indigo-600 bg-slate-50 rounded-l-md text-[10.5px] leading-relaxed">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-slate-400 font-mono">{log.timestamp}</span>
                      <span className="font-bold text-slate-700">{log.user.split(' ')[0]}</span>
                    </div>
                    <span className="block text-slate-800 font-bold">{log.action} • <span className="text-slate-500 font-medium">{log.module}</span></span>
                    <p className="text-slate-500 mt-0.5 text-[10px]">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. PROJECT MANAGER DASHBOARD */}
      {activePersona === 'project_manager' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-800">
          
          {/* PM Alert panel on critical path */}
          {wbsTasks.some(t => t.actualProgress < t.plannedProgress) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-slate-900 text-xs">تنبيه تأخير (Critical Path Alert)</h4>
                <p className="text-[11px] text-amber-900/90 leading-relaxed mt-1">
                  توجد بنود متأخرة عن النسبة المخططة. يرجى مراجعة المهام المحددة بجدول المسندات لاتخاذ إجراءات فورية وتكثيف الموارد.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gantt & WBS tasks overview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">مستويات وتقدم مراحل الـ WBS للرصف وإنشاء المسارات</h4>
              <p className="text-xs text-slate-500">تمثيل دقيق لتحديثات كراسة القياس والجدول الزمني المدمج مع Primavera P6.</p>

              <div className="space-y-4.5">
                {wbsTasks.map(task => {
                  let statusColor = 'bg-indigo-600';
                  let textColor = 'text-indigo-700';
                  let statusAr = 'ضمن الخطة';
                  
                  if (task.status === 'behind') {
                    statusColor = 'bg-rose-500';
                    textColor = 'text-rose-600';
                    statusAr = 'متأخر';
                  } else if (task.status === 'ahead') {
                    statusColor = 'bg-emerald-500';
                    textColor = 'text-emerald-700';
                    statusAr = 'فوق المعدل';
                  } else if (task.status === 'completed') {
                    statusColor = 'bg-indigo-800';
                    textColor = 'text-indigo-900';
                    statusAr = 'مكتمل';
                  }

                  return (
                    <div key={task.id} className="space-y-1" id={`pm-wbs-${task.id}`}>
                      <div className="flex justify-between text-xs font-bold flex-row-reverse">
                        <span className="text-slate-850 truncate max-w-[280px]">{task.wbsCode} • {task.name}</span>
                        <div className="font-mono flex items-center gap-1.5 ">
                          <span className={task.criticalPath ? 'text-rose-600 text-[10px] bg-rose-50 border border-rose-100 px-1 rounded' : 'hidden'}>مسار حرج</span>
                          <span className={`${textColor} text-[10.5px] bg-slate-50 px-2 py-0.5 rounded-md`}>منجز {task.actualProgress}%</span>
                        </div>
                      </div>
                      
                      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        {/* Planned Progress tracker line */}
                        <div 
                          className="absolute inset-y-0 right-0 bg-slate-300 opacity-60 rounded-full" 
                          style={{ width: `${task.plannedProgress}%` }}
                        />
                        {/* Actual Progress tracker line */}
                        <div 
                          className={`absolute inset-y-0 right-0 rounded-full ${statusColor}`}
                          style={{ width: `${task.actualProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>المخطط التعاقدي: <span className="font-mono font-bold text-slate-600">{task.plannedProgress}%</span></span>
                        <span className="font-bold flex items-center gap-1">{statusAr} <span className="w-1.5 h-1.5 rounded-full bg-current"></span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QA & HSE Summary for Project Managers */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* QA/QC RFI Status */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">موقف طلبات الفحص الفني والاستلام (RFIs)</h4>
                <p className="text-xs text-slate-500 font-medium">سجل مطابقة الاستلام الإستشاري لصب الأساسات وأرصفة الطرق.</p>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <span className="block text-xs text-slate-500">تم استلامها</span>
                    <span className="text-lg font-black text-indigo-700 font-mono mt-0.5 inline-block">{labTests.filter(t => t.resultStatus === 'passed').length} طلب</span>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                    <span className="block text-xs text-slate-500">مرفوضة فحص</span>
                    <span className="text-lg font-black text-rose-600 font-mono mt-0.5 inline-block">{labTests.filter(t => t.resultStatus === 'failed').length} طلب</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                    <span className="block text-xs text-slate-500">قيد الاختبار</span>
                    <span className="text-lg font-black text-slate-600 font-mono mt-0.5 inline-block">{labTests.filter(t => t.resultStatus === 'pending').length} طلب</span>
                  </div>
                </div>
              </div>

              {/* HSE Toolbox safe days */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">مؤشر السلامة ومؤشر البيئة HSE</h4>
                  <p className="text-xs text-slate-500 font-medium">إجمالي سجلات النظام للسلامة والصحة المهنية.</p>
                  <span className="text-lg font-black text-emerald-600 font-mono mt-1 inline-block">
                    {hseIncidents.length === 0 ? "بدون إصابات أو حوادث مسجلة" : `${hseIncidents.length} حوادث مسجلة`}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-110 p-4 rounded-xl text-emerald-600">
                  <ShieldCheck size={28} />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 3. FINANCE AND ACCOUNTING DASHBOARD */}
      {activePersona === 'finance' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-800">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">رصيد حسابات الخزينة المركزية</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 inline-block">{formatCurrency(0)}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-indigo-650">
                <Coins size={18} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-201 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">العهد المصروفة للجان الميدانية</span>
                <span className="text-lg font-extrabold text-indigo-650 font-mono mt-0.5 inline-block">{formatCurrency(totalLedgerSpent)}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-110 p-2 rounded-lg text-indigo-600">
                <Briefcase size={18} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-201 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">صافي القيود والمصروفات المسواة</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 inline-block">{formatCurrency(totalLedgerExecuted)}</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg text-slate-600">
                <CheckCircle size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart of Accounts overview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">مستويات الحسابات العامة (Chart of Accounts Status)</h4>
              <p className="text-xs text-slate-500">مسح سريع للترقيعات المحاسبية وأبواب الصرف الأساسية.</p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
                  <span className="font-bold text-slate-700">1. الأصول والماكينات والمعدات الرأسمالية</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
                  <span className="font-bold text-slate-700">2. الالتزامات والذمم لمقاولي الباطن والموردين</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
                  <span className="font-bold text-slate-700">3. حقوق الملكية ورأس المال المدفوع للشركاء</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-indigo-700">
                  <div className="font-mono font-bold font-black">{formatCurrency(totalLedgerExecuted)}</div>
                  <span className="font-bold">4. الإيرادات المعتمدة من مستخلصات المالك</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-rose-600">
                  <div className="font-mono font-bold font-black">{formatCurrency(totalLedgerSpent)}</div>
                  <span className="font-bold">5. المصروفات الميدانية والوقود وأمر التشغيل</span>
                </div>
              </div>
            </div>

            {/* Financial Double Entry verification */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5">
              <div className="flex items-center gap-2 text-indigo-650 justify-end">
                <span className="text-xs bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold font-mono">AUTOMATED GAAP</span>
                <span className="font-bold text-slate-900 text-sm">آلية القيد المزدوج والترحيل المركزي</span>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                يقوم محرك النظام بتوليد قيد مزدوج عند كل ترشيح مصاريف. فعندما يتم تسوية العهد أو دفع مستخلص المقاول، ترتجل الأجهزة التلقائية قيداً من حساب المصاريف الميدانية إلى حساب أمانات العهد لإثبات الميزانية ومنع إهدار الذمم المالية.
              </p>

              <div className="border border-indigo-150 p-3 rounded-lg bg-indigo-50/20 text-[10.5px] font-mono space-y-1.5 leading-normal">
                <span className="block text-indigo-700 font-bold mb-1 text-right">📄 نموذج قيد تسوية العهدة التلقائي (GL Record):</span>
                <div className="flex justify-between flex-row-reverse text-right">
                  <span>من حـ/ مصاريف الموقع (أعمال ردم وحفر)</span>
                  <span className="text-indigo-600 font-bold">مدين: {formatCurrency(totalLedgerExecuted)}</span>
                </div>
                <div className="flex justify-between flex-row-reverse text-right pr-4">
                  <span>إلى حـ/ عهد المهندسين المشرفين المعلقة</span>
                  <span className="text-slate-600 font-bold">دائن: {formatCurrency(totalLedgerExecuted)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. FLEET AND EQUIPMENT DASHBOARD */}
      {activePersona === 'fleet' && (
        <EquipmentDashboard 
          equipmentList={equipmentList} 
          setEquipmentList={setEquipmentList} 
          transactions={transactions} 
          fuelLogs={fuelLogs}
          setFuelLogs={setFuelLogs}
          custodyBudget={custodyBudget}
          setCustodyBudget={setCustodyBudget}
        />
      )}

      {/* 5. WAREHOUSE & INVENTORY DASHBOARD */}
      {activePersona === 'warehouse' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-800">
          
          {/* Inventory overview alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">إجمالي الأنواع المسجلة بالمستودع</span>
                <span className="text-lg font-black text-slate-900 font-mono mt-0.5 inline-block">{warehouseItems.length} صنف مادة</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-indigo-600">
                <Database size={18} />
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">أصناف منخفضة الرصيد (تحت حد الأمان)</span>
                <span className="text-lg font-black text-rose-500 font-mono mt-0.5 inline-block">
                  {warehouseItems.filter(i => i.currentStock < i.minLimit).length} أصناف تتطلب توريد
                </span>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg text-rose-500 animate-pulse">
                <AlertCircle size={18} />
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold">المستودعات الإنشائية الفعالة</span>
                <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 inline-block">2 مستودع ميداني</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-110 p-2 rounded-lg text-emerald-600">
                <Building size={18} />
              </div>
            </div>
          </div>

          {/* Catalog Listing table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">كشف جرد وفهرسة ممتلكات المخازن والمواد الميدانية (Inventory Catalog)</h4>
            <p className="text-xs text-slate-500">تنبيهات توريد تلقائية في حالة نزول رصيد كميات الطرق وسن الركام والمواسير عن حد الأمان.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                    <th className="p-2.5">كود المادة</th>
                    <th className="p-2.5">اسم الصنف والمواد</th>
                    <th className="p-2.5">الموقع والتخزين</th>
                    <th className="p-2.5 text-left">التصنيف الفني</th>
                    <th className="p-2.5 text-left">الرصيد المتوفر</th>
                    <th className="p-2.5 text-left">حد الأمان</th>
                    <th className="p-2.5 text-center">أمر التوريد الإلزامي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {warehouseItems.map(item => {
                    const isLow = item.currentStock < item.minLimit;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{item.code}</td>
                        <td className="p-2.5 font-bold text-slate-800">{item.name}</td>
                        <td className="p-2.5 text-slate-500 font-medium">{item.warehouseName}</td>
                        <td className="p-2.5 text-left font-medium text-slate-400">{item.categoryAr}</td>
                        <td className="p-2.5 text-left font-mono font-black text-slate-900">{item.currentStock} {item.unit}</td>
                        <td className="p-2.5 text-left font-mono text-slate-500">{item.minLimit} {item.unit}</td>
                        <td className="p-2.5 text-center">
                          {isLow ? (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded text-[9px] font-bold border border-rose-150 animate-pulse">
                              ⚠️ عجز! بادر بطلب شراء
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded text-[9px] font-bold border border-emerald-100">
                              رصيد آمن ومستقر ✓
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

        </div>
      )}

      {/* 6. QA/QC HEALTH DASHBOARD */}
      {activePersona === 'qa_qc' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-800">
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">مجموع العينات الموقعية المسجلة</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-0.5 inline-block">{labTests.length} اختبارات معامل</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">عينات مطابقة للمواصفات وكود الطرق</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 inline-block">
                {labTests.filter(t => t.resultStatus === 'passed').length} عينات مقبولة
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">عينات راسبة لم تطابق الدمك والكود</span>
              <span className="text-lg font-black text-rose-500 font-mono mt-0.5 inline-block">
                {labTests.filter(t => t.resultStatus === 'failed').length} عينات راسبة
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">نسبة نجاح واجتياز الجودة الموقعية</span>
              <span className="text-lg font-black text-indigo-600 font-mono mt-0.5 inline-block">
                {((labTests.filter(t => t.resultStatus === 'passed').length / labTests.length) * 100).toFixed(1)}% نسبة الاستحقاق
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sieve and Marshall technical log */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">سجل الفحوص المعملية ومقاييس (California Bearing / Marshall) </h4>
              <p className="text-xs text-slate-500">نتائج الفحص الهندسي لسمك التربة الركامية وطبقات السن السطحية تحت المراقبة.</p>

              <div className="space-y-3.5">
                {labTests.map(test => (
                  <div key={test.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center flex-row-reverse" id={`qa-test-${test.id}`}>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 block text-[11px]">{test.testNameAr}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{test.rfiCode}</span>
                      </div>
                      
                      <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold ${
                        test.resultStatus === 'passed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-rose-50 text-rose-800 border border-rose-150'
                      }`}>
                        {test.resultStatus === 'passed' ? 'مطابق ومجاز لفرش الأسفلت ✓' : '❌ راسب ويتطلب المعايرة'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-500 flex-row-reverse bg-white p-2 rounded border border-slate-100">
                      <div>المسئول: {test.engineer}</div>
                      <div>
                        {test.testType === 'density' && `الكثافة: ${test.densityValue} g/cm³`}
                        {test.testType === 'marshall' && `ثبات مارشال: ${test.marshallValue} kg`}
                        {test.testType === 'cbr' && `نسبة الـ CBR: ${test.cbrValue}%`}
                        {test.testType === 'grading' && `التدرج: خالف المنحى`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ASTM & AASHTO Technical reference for pavement */}
            <div className="bg-white p-5 rounded-xl border border-slate-205 space-y-4 text-right">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">شروط فنية لمطابقة دمك الأرصفة الإسفلتية المفتوح</h4>
              <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                بموجب الكود الكلاسيكي الفني لرصف الطرق والكباري لضبط التلف والتفسخ والتموج الطولي:
              </p>
              
              <ul className="space-y-2 text-[10.5px] text-slate-600">
                <li className="flex items-center gap-1.5 justify-end">
                  <span>ألا تقل كثافة الدمك الموقعي عن نسبة 98% للمختبر المعزز.</span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                </li>
                <li className="flex items-center gap-1.5 justify-end">
                  <span>ثبات مارشال لخلطة الأسفلت الساخنة لا يقل عن 1000 كجم في المسار السريع.</span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                </li>
                <li className="flex items-center gap-1.5 justify-end">
                  <span>نسبة الـ CBR لفرش السن لا تقل عن 30% لتدعيم قدرة حمل الآليات الثقيلة.</span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                </li>
              </ul>
              <div className="p-3 bg-indigo-50/50 border border-indigo-120 rounded-lg text-indigo-900 text-[10px] leading-relaxed">
                📢 في حالة رسوب عينة الجودة، يقوم النظام بتنبيه رئيس العمال والمهندس المشرف تلقائياً بحظر صرف البيتومين والسن لضمان تجنب تلف الأرصفة مستقبلاً.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. HSE & SAFETY COMPLIANCE DASHBOARD */}
      {activePersona === 'hse' && (
        <div className="space-y-6 animate-fadeIn text-right text-slate-800">
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">إجمالي الحوادث الجسيمة بالموقع</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 inline-block">{hseIncidents.filter(i => i.type === 'injury').length === 0 ? "0 حوادث (خالٍ بالكامل)" : `${hseIncidents.filter(i => i.type === 'injury').length} حوادث`}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">سجل شبه الحوادث الموقعة (Near Miss)</span>
              <span className="text-lg font-black text-rose-500 font-mono mt-0.5 inline-block">
                {hseIncidents.filter(i => i.type === 'near_miss').length} حالات رادار
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">امتثال معدات الوقاية الشخصية (PPE)</span>
              <span className="text-lg font-black text-indigo-600 font-mono mt-0.5 inline-block">{hseIncidents.length === 0 ? "100%" : "98.8%"}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold">حوادث تلف الممتلكات (Property Damage)</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-0.5 inline-block">{hseIncidents.filter(i => i.type === 'property_damage').length} حالة</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Incident tracker list */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">سجل رادار الأحوال والحوادث المسجلة بالموقع (HSE Cases)</h4>
              <p className="text-xs text-slate-500">رصد وتحليل الحالات الميدانية لمنع تفاقم الإصابات المفرزة.</p>

              <div className="space-y-3.5">
                {hseIncidents.map(incident => (
                  <div key={incident.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-xs space-y-2" id={`hse-case-${incident.id}`}>
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="font-bold text-slate-800">{incident.typeNameAr}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        incident.severity === 'high' || incident.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-110' : 'bg-slate-100 text-slate-600'
                      }`}>
                        خطورة {incident.severity === 'low' ? 'خفيفة' : incident.severity === 'medium' ? 'متوسطة' : 'جسيمة'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10.5px] leading-relaxed">{incident.description}</p>
                    <div className="p-2 bg-white rounded border border-slate-100 text-[10px] text-slate-700 leading-normal">
                      <strong>الإجراء الوقائي:</strong> {incident.actionTaken}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold flex-row-reverse">
                      <span>الراصد: {incident.reportedBy}</span>
                      <span>التاريخ: {incident.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Compliance & PPE gear rate */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-right">
              <h4 className="font-bold text-slate-900 text-sm">كفاءة وبتر تفتيش معدات الحماية (PPE Compliance Rate)</h4>
              <p className="text-xs text-slate-500">أرقام التزام العمال لارتداء الخوذة والسترة العاكسة عند الرصف الليلي.</p>

              <div className="space-y-3 font-sans">
                {/* Visual rates progress bars */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-750 flex-row-reverse">
                    <span>خوذات الرأس الميدانية الفوسفاتية (Hard Hats)</span>
                    <span className="font-mono text-emerald-600">98%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-750 flex-row-reverse">
                    <span>سترات عاكسة للضوء لمهندسي الأسفلت ليلاً (Reflective Jackets)</span>
                    <span className="font-mono text-indigo-600">95%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-750 flex-row-reverse">
                    <span>أحذية الأمان المعززة بالمعدن (Steel Toe Boots)</span>
                    <span className="font-mono text-teal-600">89%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: '89%' }} />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-120 rounded-lg text-rose-900 text-[10px] leading-relaxed">
                ⚠️ يمنع عمال اليومية أو مقاولو الباطن من عبور حواجز الكيلومتر المخدم بالأسفلت دون سترة أمان عاكسة كاملة لتفادي حوادث المعدات الثقيلة الدوامة.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
