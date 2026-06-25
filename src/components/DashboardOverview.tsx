import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Coins, 
  Briefcase, 
  FileCheck, 
  AlertCircle,
  Percent,
  TrendingDown,
  Receipt,
  Truck,
  FileText,
  LayoutDashboard,
  ChevronLeft,
  Activity,
  Layers,
  Fuel,
  Printer,
  Users
} from 'lucide-react';
import { 
  CategoryMetric, 
  Transaction, 
  SupplyRecord, 
  EquipmentSummary, 
  MaintenanceOrder, 
  CustodyRecord, 
  ContractorCertificate, 
  SiteWorker,
  WorkerAttendance,
  WorkerSalaryPayment,
  Submission,
  CustomExtract
} from '../types';
import { motion } from 'motion/react';

interface DashboardOverviewProps {
  categories: CategoryMetric[];
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
  supplyRecords: SupplyRecord[];
  equipmentList: EquipmentSummary[];
  maintenanceOrders: MaintenanceOrder[];
  custodies: CustodyRecord[];
  contractors: ContractorCertificate[];
  workers: SiteWorker[];
  attendanceLogs: WorkerAttendance[];
  salaryPayments: WorkerSalaryPayment[];
  submissions: Submission[];
  extracts: CustomExtract[];
}

export default function DashboardOverview({ 
  categories, 
  transactions, 
  setActiveTab,
  supplyRecords,
  equipmentList,
  maintenanceOrders: maintOrders,
  custodies: custodiesList,
  contractors: contractorsList,
  workers: workersList,
  attendanceLogs,
  salaryPayments,
  submissions,
  extracts
}: DashboardOverviewProps) {
  // Compute overall financial summaries
  const totalExecuted = categories.reduce((sum, c) => sum + c.totalExecutedValue, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.totalSpent, 0);
  const custodySpent = transactions.filter(t => t.type === 'spent' && t.nature === 'inside_custody').reduce((sum, t) => sum + t.amount, 0);
  const officeSpent = transactions.filter(t => t.type === 'spent' && t.nature === 'outside_custody').reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate custody & clearances
  const custodyCat = categories.find(c => c.id === 'custody');

  const supplyCount = supplyRecords.length;
  const contractorCount = contractorsList.length;
  const equipmentCount = equipmentList.length;
  const workerCount = workersList.length;

  // Formatting utility
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  // Computations safely
  const fuelTransactions = transactions.filter(t => t.category === 'fuel');
  const fuelTotalSpent = fuelTransactions.reduce((acc, t) => acc + t.amount, 0);
  const fuelTotalLiters = fuelTotalSpent / 50; // Mock rate for demonstration
  
  // Attendance logic
  const todayDateString = new Date().toISOString().split('T')[0];
  const presentTodayCount = attendanceLogs.filter(a => a.date.startsWith(todayDateString) && (a.status === 'present' || a.status === 'half-day' || a.status === 'vacation')).length;
  const absentTodayCount = attendanceLogs.filter(a => a.date.startsWith(todayDateString) && a.status === 'absent').length;
  const vacationTodayCount = attendanceLogs.filter(a => a.date.startsWith(todayDateString) && a.status === 'vacation').length;
  
  // Real present count excluding vacations
  const actualPresentCount = presentTodayCount - vacationTodayCount;

  // Submissions Logic
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const lastWeekSubmissionsCount = submissions.filter(s => new Date(s.inspectionDate) >= oneWeekAgo).length;
  const previousWeekSubmissionsCount = submissions.filter(s => {
    const sDate = new Date(s.inspectionDate);
    return sDate >= twoWeeksAgo && sDate < oneWeekAgo;
  }).length;

  const deliveriesDiff = lastWeekSubmissionsCount - previousWeekSubmissionsCount;
  const deliveriesComparisonLabel = deliveriesDiff >= 0 
    ? `+${deliveriesDiff} عن الأسبوع السابق`
    : `${deliveriesDiff} عن الأسبوع السابق`;
  const isDeliveriesPositive = deliveriesDiff >= 0;

  const totalSuppliesValue = supplyRecords.reduce((acc, cur) => acc + (cur.totalCost || 0), 0);
  const totalSuppliesVolume = supplyRecords.reduce((acc, cur) => acc + (cur.netQuantity || 0), 0);
  
  const suppliesByItem = supplyRecords.reduce((acc, current) => {
    const code = current.itemCode || 'Uncoded';
    acc[code] = (acc[code] || 0) + (current.netQuantity || 0);
    return acc;
  }, {} as Record<string, number>);
  const suppliesDistribution = Object.entries(suppliesByItem).sort((a, b) => b[1] - a[1]);

  const totalEqHours = equipmentList.reduce((acc, eq) => {
    const logsHours = eq.logs?.reduce((sum, log) => {
      const dur = parseFloat(String(log.duration));
      return sum + (isNaN(dur) ? 0 : dur);
    }, 0) || 0;
    return acc + (eq.carryoverHours || 0) + logsHours;
  }, 0);

  return (
    <div className="space-y-8" id="dashboard-overview-container">
      {/* Welcome & Dashboard Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white text-slate-900 p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px]"></div>
        
        <div className="text-right w-full relative z-10">
          <div className="flex items-center gap-3 justify-end mb-4">
            <div className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
              <Activity className="h-5 w-5 text-indigo-500" />
            </div>
            <span className="p-1 px-4 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[10px] font-black rounded-full uppercase tracking-widest">
              Executive Control Hub
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-none tracking-tighter">مركز البيانات والتحكم</h2>
          <p className="text-sm md:text-base text-slate-500 font-bold mt-4 max-w-2xl ml-auto leading-relaxed opacity-90">
            رؤية بانورامية متكاملة لكافة عمليات الموقع الإنشائي. نجمع لك البيانات المالية، الهندسية، والتشغيلية في شاشة واحدة لاتخاذ قرارات دقيقة مبنية على الحقائق اللحظية.
          </p>
        </div>
      </div>

      {/* PRIMARY KPIS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المنصرف', value: formatCurrency(totalSpent), icon: Coins, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'أعمال منفذة', value: formatCurrency(totalExecuted), icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'رصيد العهدة', value: formatCurrency(custodyCat?.totalSpent || 0), icon: Layers, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'معدل الإنتاج', value: `${((totalExecuted / (totalSpent || 1)) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
             <div className="flex items-center justify-between mb-3">
               <div className={`p-2 rounded-xl ${kpi.bg}`}>
                 <kpi.icon size={18} className={kpi.color} />
               </div>
             </div>
             <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">{kpi.label}</p>
             <h4 className="text-lg font-black text-slate-900 font-mono tracking-tight">{kpi.value}</h4>
          </div>
        ))}
      </div>

      {/* SYNCHRONIZED DASHBOARD GRID (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-12">
        
        {/* 1. الموقف المالي العام (Expanded) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <button 
              onClick={() => setActiveTab('weekly-report')}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-black px-5 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest transition border border-slate-200"
            >
              Report Central →
            </button>
            <div className="text-right flex items-center justify-end gap-3">
              <div>
                <h4 className="font-black text-slate-900 text-xl tracking-tight">التحليل المالي للميزانية</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Budget Allocation & Expenditure</p>
              </div>
              <div className="h-12 w-12 bg-indigo-500/5 rounded-2xl flex items-center justify-center border border-indigo-500/10">
                <FileText size={22} className="text-indigo-500" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 relative z-10">
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl text-right group hover:border-indigo-500/30 transition-all">
              <span className="text-[10px] text-indigo-600 font-black block mb-2 uppercase tracking-tighter opacity-60">سيولة العُهدة</span>
              <span className="text-2xl font-black font-mono text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tighter">{formatCurrency(custodySpent)}</span>
            </div>
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl text-right group hover:border-emerald-500/30 transition-all">
              <span className="text-[10px] text-emerald-600 font-black block mb-2 uppercase tracking-tighter opacity-60">تحويلات المكتب</span>
              <span className="text-2xl font-black font-mono text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tighter">{formatCurrency(officeSpent)}</span>
            </div>
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl text-right group hover:border-amber-500/30 transition-all">
              <span className="text-[10px] text-amber-600 font-black block mb-2 uppercase tracking-tighter opacity-60">إجمالي المسدد</span>
              <span className="text-2xl font-black font-mono text-slate-900 group-hover:text-amber-400 transition-colors tracking-tighter">{formatCurrency(totalSpent)}</span>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between px-2 mb-2">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Efficiency Status</span>
               <span className="text-[10px] text-slate-500 font-black" dir="rtl">توزيع السيولة النقدية على الأنشطة:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.slice(0, 4).map((cat) => {
                const ratio = cat.totalExecutedValue > 0 
                  ? (cat.totalSpent / cat.totalExecutedValue) * 100 
                  : (cat.totalSpent > 0 ? 100 : 0);
                const displayRatio = Math.min(100, ratio);
                return (
                  <div key={cat.id} className="p-5 bg-slate-50 border border-slate-200/50 rounded-3xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="font-mono text-xs font-black text-slate-900" dir="ltr">
                        {formatCurrency(cat.totalSpent)}
                        <span className="text-slate-400 mx-1.5">\</span>
                        {formatCurrency(cat.totalExecutedValue)}
                        <span className={`text-[10px] ml-1.5 ${ratio > 90 ? 'text-rose-600' : 'text-slate-400'}`}>({Math.round(ratio)}%)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-slate-700 text-[11px]">{cat.nameAr}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}40` }}></div>
                      </div>
                    </div>
                    <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${displayRatio}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. حالة المستخلصات كرت عمودي */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-500/5 rounded-full blur-[80px]"></div>
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setActiveTab('contractors')} className="h-8 w-8 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all"><ChevronLeft size={16} /></button>
              <div className="text-right flex items-center gap-3">
                <h4 className="font-black text-slate-900 text-sm">المستخلصات</h4>
                <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20"><Receipt size={18} className="text-sky-600" /></div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'إجمالي المستندات', value: extracts.length, color: 'text-sky-600', sub: 'وثيقة مسجلة' },
                { label: 'بانتظار الصرف', value: extracts.filter(e => e.status !== 'Paid').length, color: 'text-amber-600', sub: 'طلب قيد المراجعة' },
                { label: 'فواتير مسددة', value: extracts.filter(e => e.status === 'Paid').length, color: 'text-emerald-600', sub: 'تم التحويل البنكي' }
              ].map((item, id) => (
                <div key={id} className="flex flex-row-reverse items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{item.sub}</p>
                  </div>
                  <span className={`text-2xl font-black font-mono ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-indigo-500/30 rounded-[2.5rem] p-7 shadow-sm relative overflow-hidden ring-1 ring-indigo-500/10">
            <div className="flex items-center justify-between mb-6">
              <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${isDeliveriesPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                {isDeliveriesPositive ? 'Growth Optimized' : 'Attention Needed'}
              </div>
              <div className="text-right flex items-center gap-3">
                <h4 className="font-black text-slate-900 text-sm">كفاءة الإنتاج</h4>
                <Activity size={18} className="text-indigo-600" />
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-4">
              <div className="text-right flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">انتاجية الأسبوع</p>
                <div className="flex items-center justify-end gap-2 text-3xl font-black text-slate-900 font-mono">
                   {lastWeekSubmissionsCount}
                   <TrendingUp size={24} className={isDeliveriesPositive ? 'text-emerald-500' : 'text-rose-500'} />
                </div>
                <p className={`text-[10px] font-black mt-1 ${isDeliveriesPositive ? 'text-emerald-600' : 'text-rose-600'}`} dir="rtl">
                   {deliveriesComparisonLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. التوريدات والمعدات (Small Bento Cards) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px]"></div>
          <div className="flex items-center justify-between mb-8">
             <button onClick={() => setActiveTab('supplies')} className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline">Logins & Yards →</button>
             <Truck size={20} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 font-mono tracking-tighter mb-1">{totalSuppliesVolume.toLocaleString('ar-EG', {maximumFractionDigits:0})} م³</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">إجمالي التوريدات الخالصة</p>
            
            <div className="space-y-4">
              {suppliesDistribution.slice(0, 3).map(([itemName, vol], idx) => {
                const ratio = totalSuppliesVolume > 0 ? (vol / totalSuppliesVolume) * 100 : 0;
                return (
                  <div key={itemName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-600" dir="rtl">
                      <span>{itemName}</span>
                      <span className="font-mono text-emerald-600">{ratio.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex justify-end">
                      <motion.div initial={{width:0}} animate={{width: `${ratio}%`}} className="bg-emerald-500 h-full rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px]"></div>
          <div className="flex items-center justify-between mb-8">
             <button onClick={() => setActiveTab('equipment-dashboard')} className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline">Fleet Status →</button>
             <LayoutDashboard size={20} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <h4 className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{equipmentCount}</h4>
              <span className="text-xs text-slate-400 font-black mb-1">مركبة</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">أسطول الآلات المعتمد</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                 <span className="text-lg font-black text-slate-900 font-mono">{totalEqHours}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase">ساعة عمل</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                 <span className="text-lg font-black text-amber-600 font-mono">{maintOrders.length}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase">أوامر صيانة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-cyan-500/30 rounded-[2.5rem] p-7 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
             <Users size={20} className="text-cyan-600" />
             <div className="text-right">
                <h4 className="text-xs font-black text-slate-900 tracking-widest uppercase">HR SITE PULSE</h4>
                <p className="text-[9px] text-slate-400 font-bold">بوابة العمالة المباشرة</p>
             </div>
          </div>
          
          <div className="space-y-5">
            <div className="text-center py-6 bg-cyan-50/50 rounded-3xl border border-cyan-100">
               <h5 className="text-5xl font-black text-slate-900 font-mono mb-2 tracking-tighter">{workerCount}</h5>
               <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest font-mono">Total workforce</p>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              {[
                { label: 'حضور', value: actualPresentCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'غياب', value: absentTodayCount, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'إجازة', value: vacationTodayCount, color: 'text-sky-600', bg: 'bg-sky-50' }
              ].map((hr, idx) => (
                <div key={idx} className={`flex-1 p-3 rounded-2xl flex flex-col items-center ${hr.bg}`}>
                   <span className={`text-sm font-black font-mono ${hr.color}`}>{hr.value}</span>
                   <span className="text-[8px] font-black text-slate-500 uppercase">{hr.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
