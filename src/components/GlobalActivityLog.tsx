/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Activity, Search, Filter, Printer, Calendar, ShieldAlert, CheckCircle2, 
  Database, RefreshCw, Layers, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { AuditTrailRecord } from '../types';

interface GlobalActivityLogProps {
  auditLogs: AuditTrailRecord[];
  onClearLogs?: () => void;
  currentUserRole?: string;
}

export default function GlobalActivityLog({ auditLogs, onClearLogs, currentUserRole }: GlobalActivityLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Distinct modules for filtering
  const modulesList = useMemo(() => {
    const modulesSet = new Set<string>();
    auditLogs.forEach(log => {
      if (log.module) modulesSet.add(log.module);
    });
    return Array.from(modulesSet);
  }, [auditLogs]);

  // Distinct action types for filtering (or categorize them based on keywords)
  const actionTypesList = [
    { value: 'all', label: 'كل أنواع الإجراءات' },
    { value: 'add', label: 'إضافة وإدراج (+)' },
    { value: 'update', label: 'تعديل وتحديث (✎)' },
    { value: 'delete', label: 'حذف وإزالة (🗑)' },
    { value: 'auth', label: 'دخول وأمن (🔒)' }
  ];

  // Helper to check action category
  const getActionCategory = (action: string): 'add' | 'update' | 'delete' | 'auth' | 'other' => {
    const act = action.toLowerCase();
    if (act.includes('دخول') || act.includes('خروج') || act.includes('تسجيل الدخول') || act.includes('صلاحية') || act.includes('ترخيص')) return 'auth';
    if (act.includes('إضافة') || act.includes('إدراج') || act.includes('تسجيل مقاول') || act.includes('قيد تسليم') || act.includes('إرسال')) return 'add';
    if (act.includes('تحديث') || act.includes('تعديل') || act.includes('تسوية') || act.includes('تشغيل') || act.includes('توجيه')) return 'update';
    if (act.includes('حذف') || act.includes('إزالة') || act.includes('تفريغ')) return 'delete';
    return 'other';
  };

  // Filter & Sort logic
  const filteredAndSortedLogs = useMemo(() => {
    return auditLogs
      .filter(log => {
        const matchesSearch = 
          (log.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.user || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesModule = selectedModule === 'all' || log.module === selectedModule;

        const cat = getActionCategory(log.action);
        const matchesActionType = selectedActionType === 'all' || cat === selectedActionType;

        return matchesSearch && matchesModule && matchesActionType;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [auditLogs, searchTerm, selectedModule, selectedActionType, sortOrder]);

  // Statistics indicators
  const stats = useMemo(() => {
    const total = auditLogs.length;
    let additions = 0;
    let updates = 0;
    let deletions = 0;
    let security = 0;

    auditLogs.forEach(log => {
      const cat = getActionCategory(log.action);
      if (cat === 'add') additions++;
      else if (cat === 'update') updates++;
      else if (cat === 'delete') deletions++;
      else if (cat === 'auth') security++;
    });

    return { total, additions, updates, deletions, security };
  }, [auditLogs]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#fdfdfd] text-slate-900" id="global-activity-log-view">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black pb-6 no-print">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight text-black font-sans">
            <Activity className="text-purple-650 bg-purple-50 p-2 rounded-2xl border border-purple-200" size={44} />
            سجل النشاطات والأثر الرقمي
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-bold leading-relaxed max-w-2xl">
            سجل مالي وإداري موحد ومقاوم للتعديل لجميع الحركات، المدفوعات، التوريدات، وسجلات دوام الكادر مع مراقبة تفويضات المستخدمين بدقة هندسية.
          </p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handlePrint}
            id="print-activity-log-btn"
            className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg hover:bg-slate-900 transition-all border-2 border-black outline-none cursor-pointer"
          >
            <Printer size={16} />
            طباعة السجل بالكامل
          </button>
          
          {onClearLogs && currentUserRole === 'admin' && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-2 bg-white text-rose-650 px-5 py-3 rounded-xl text-xs font-black border-2 border-rose-250 hover:bg-rose-50 transition-all"
            >
              مسح السجلات السحابية
            </button>
          )}
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block mb-8 border-b-4 border-black pb-4 text-right">
        <h1 className="text-2xl font-black text-black">بنيان الذكي — نظام المتابعة المالية والتشغيلية للمشروعات</h1>
        <h2 className="text-lg font-bold text-slate-800 mt-1">سجل النشاطات الرقابي العام الموحد (Audit Trail)</h2>
        <div className="flex justify-between text-xs text-slate-500 font-mono mt-4">
          <span>تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</span>
          <span>إجمالي العمليات المسجلة: {filteredAndSortedLogs.length} حركة</span>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <div className="bg-white p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <p className="text-xs font-bold text-slate-500 uppercase">إجمالي الحركات</p>
          <p className="text-3xl font-black mt-1 text-black font-sans">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border-2 border-purple-650 shadow-[4px_4px_0px_0px_rgba(124,58,237,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(124,58,237,1)] transition-all">
          <p className="text-xs font-bold text-slate-500">عمليات الإضافة (+)</p>
          <p className="text-3xl font-black mt-1 text-purple-650 font-sans">{stats.additions}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <p className="text-xs font-bold text-slate-500">عمليات التعديل (✎)</p>
          <p className="text-3xl font-black mt-1 text-slate-800 font-sans">{stats.updates}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border-2 border-rose-650 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] transition-all">
          <p className="text-xs font-bold text-slate-500">عمليات الإزالة (🗑)</p>
          <p className="text-3xl font-black mt-1 text-rose-650 font-sans">{stats.deletions}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <p className="text-xs font-bold text-slate-500">عمليات الأمن والأدوار (🔒)</p>
          <p className="text-3xl font-black mt-1 text-black font-sans">{stats.security}</p>
        </div>
      </div>

      {/* Filtering Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-5 rounded-3xl border-2 border-black shadow-sm no-print">
        {/* Search Field */}
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث بالرقم المرجعي (REF)، التفاصيل، اسم المستخدم أو الإجراء..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs focus:border-purple-650 outline-none transition placeholder-slate-450 font-bold"
          />
        </div>

        {/* Module Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Layers size={16} className="text-purple-650 shrink-0" />
          <select 
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full md:w-auto py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer focus:border-purple-650 transition"
          >
            <option value="all">كل وحدات النظام</option>
            {modulesList.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-700 shrink-0" />
          <select 
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="w-full md:w-auto py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer focus:border-purple-650 transition"
          >
            {actionTypesList.map(act => (
              <option key={act.value} value={act.value}>{act.label}</option>
            ))}
          </select>
        </div>

        {/* Sort Button */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-800 transition border border-slate-200 cursor-pointer"
          title="عكس اتجاه الترتيب الزمني"
        >
          <ArrowUpDown size={14} className="text-purple-650" />
          <span>{sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
        </button>
      </div>

      {/* Main Table Display */}
      <div className="border-2 border-black rounded-[2rem] overflow-hidden bg-white shadow-md relative">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-black text-white font-black h-14 uppercase border-b-2 border-black">
              <tr>
                <th className="px-6 py-4 border-l border-slate-850">رقم مرجعي فريد</th>
                <th className="px-6 py-4 border-l border-slate-850">التاريخ والوقت</th>
                <th className="px-6 py-4 border-l border-slate-850">المستخدم المسؤول</th>
                <th className="px-6 py-4 border-l border-slate-850">نوع الإجراء</th>
                <th className="px-6 py-4 border-l border-slate-850">الموديل/الوحدة</th>
                <th className="px-6 py-4">بيان التفاصيل الكاملة للأثر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredAndSortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold text-sm">
                    لا توجد سجلات مطابقة للبحث أو التصفية الحالية.
                  </td>
                </tr>
              ) : (
                filteredAndSortedLogs.map((log) => {
                  const cat = getActionCategory(log.action);
                  
                  // Style colors based on action category
                  let badgeStyles = 'bg-slate-50 text-slate-700 border-slate-200';
                  if (cat === 'auth') badgeStyles = 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold';
                  else if (cat === 'add') badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                  else if (cat === 'update') badgeStyles = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
                  else if (cat === 'delete') badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/75 transition-colors duration-150">
                      {/* Reference Number */}
                      <td className="px-6 py-4 font-mono text-purple-700 font-black whitespace-nowrap border-l border-slate-100">
                        {log.referenceNo || 'REF-000000'}
                      </td>
                      
                      {/* Timestamp */}
                      <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap border-l border-slate-100">
                        {log.timestamp}
                      </td>
                      
                      {/* User */}
                      <td className="px-6 py-4 font-black text-slate-850 border-l border-slate-100">
                        {log.user}
                      </td>
                      
                      {/* Action */}
                      <td className="px-6 py-4 border-l border-slate-100">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] border ${badgeStyles}`}>
                          {log.action}
                        </span>
                      </td>
                      
                      {/* Module */}
                      <td className="px-6 py-4 text-slate-700 font-black border-l border-slate-100">
                        {log.module}
                      </td>
                      
                      {/* Details */}
                      <td className="px-6 py-4 text-slate-600 leading-relaxed font-bold font-sans">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom pagination / indicator */}
      <div className="flex justify-between items-center text-xs text-slate-500 font-bold no-print px-4">
        <span>عرض {filteredAndSortedLogs.length} من أصل {auditLogs.length} عملية أثر رقابي مسجلة</span>
        <span>تأمين قاعدة البيانات نشط 🔒</span>
      </div>
    </div>
  );
}
