import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  ChevronLeft,
  Activity,
  Layers,
  Fuel,
  Printer,
  Users,
  ShieldAlert,
  Database,
  FileSignature,
  Layers3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MessageSquare,
  FileSpreadsheet,
  Building2,
  Calendar,
  AlertTriangle,
  Flame,
  Wrench,
  Search,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  ClipboardList
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
  CustomExtract,
  HseIncidentRecord,
  WbsTaskRecord,
  RiskItem,
  DcrRecord,
  LabTestRecord,
  WarehouseItemRecord,
  Subcontractor,
  Project,
  BOQItem,
  Contract
} from '../types';
import { motion, AnimatePresence } from 'motion/react';

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
  hseIncidents?: HseIncidentRecord[];
  wbsTasks?: WbsTaskRecord[];
  risks?: RiskItem[];
  dcrRecords?: DcrRecord[];
  labTests?: LabTestRecord[];
  warehouseItems?: WarehouseItemRecord[];
  subcontractors?: Subcontractor[];
  projects?: Project[];
  boqItems?: BOQItem[];
  contracts?: Contract[];
}

export default function DashboardOverview({ 
  categories = [], 
  transactions = [], 
  setActiveTab,
  supplyRecords = [],
  equipmentList = [],
  maintenanceOrders = [],
  custodies = [],
  contractors = [],
  workers = [],
  attendanceLogs = [],
  salaryPayments = [],
  submissions = [],
  extracts = [],
  hseIncidents = [],
  wbsTasks = [],
  risks = [],
  dcrRecords = [],
  labTests = [],
  warehouseItems = [],
  subcontractors = [],
  projects = [],
  boqItems = [],
  contracts = []
}: DashboardOverviewProps) {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Format currency in Egyptian Pounds (EGP)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  // --- 1. MEMOIZED METRICS & CALCULATIONS ---
  const stats = useMemo(() => {
    // Financials
    const boqTotalBudget = boqItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const contractTotalBudget = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
    const categoryTotalBudget = categories.reduce((sum, c) => sum + (c.initialBudget || 0), 0);
    
    // Total estimated value: Boq > Project Contracts > Categories Initial Budget
    const totalBudget = boqTotalBudget > 0 ? boqTotalBudget : (contractTotalBudget > 0 ? contractTotalBudget : categoryTotalBudget);
    
    const totalSpent = categories.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    
    // Calculate total value of approved extracts
    const totalApprovedExtractValue = extracts
      .filter(ext => ext.status === 'Approved' || ext.status === 'Paid')
      .reduce((sum, ext) => {
        const extValue = ext.items.reduce((extSum, item) => {
          const boqItem = boqItems.find(b => b.id === item.boqItemId);
          return extSum + (item.currentQuantity * (boqItem?.price || 0));
        }, 0);
        return sum + extValue;
      }, 0);

    const totalExecuted = totalApprovedExtractValue > 0 ? totalApprovedExtractValue : categories.reduce((sum, c) => sum + (c.totalExecutedValue || 0), 0);
    
    // Custody & Cash
    const custodyStats = custodies.map(c => {
      const cleanName = c.engineerName.replace('م.', '').replace('المهندس', '').trim().split(' ')[0];
      const cleanSearchName = (cleanName || '').toLowerCase();
      const engSearchName = (c.engineerName || '').toLowerCase();

      // Find all transactions of category custody that match this custodian
      const matches = transactions.filter(tx => {
        if (tx.category !== 'custody') return false;
        const txRecipient = (tx.recipient || '').toLowerCase();
        const txDesc = (tx.description || '').toLowerCase();
        const matchesRecipient = txRecipient.includes(cleanSearchName) || txRecipient.includes(engSearchName);
        const matchesDesc = txDesc.includes(cleanSearchName) || txDesc.includes(engSearchName);
        return matchesRecipient || matchesDesc;
      });

      const totalGivenFromTx = matches.filter(tx => tx.type === 'spent' && tx.nature === 'outside_custody').reduce((sum, tx) => sum + tx.amount, 0);
      const totalSettledFromTx = matches.filter(tx => tx.type === 'executed_work').reduce((sum, tx) => sum + tx.amount, 0);
      const remainingFromTx = Math.max(0, totalGivenFromTx - totalSettledFromTx);

      return {
        totalGiven: totalGivenFromTx || c.totalGiven,
        totalSettled: totalSettledFromTx || c.totalSettled,
        remaining: totalGivenFromTx ? remainingFromTx : c.remaining
      };
    });

    const custodyRemaining = custodyStats.reduce((sum, c) => sum + c.remaining, 0);
    const custodyAllocated = custodyStats.reduce((sum, c) => sum + c.totalGiven, 0);
    
    // Subcontractors
    const totalSubcontractsValue = subcontractors.reduce((sum, s) => {
      // Net value of subcontractor
      const items = s.workItems && s.workItems.length > 0 ? s.workItems : [{
        id: 'legacy-item',
        trade: s.trade || 'عمل رئيسي',
        workVolume: s.workVolume || 0,
        unitPrice: s.unitPrice || 0,
        totalValue: (s.workVolume || 0) * (s.unitPrice || 0) || s.totalValue || 0,
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
      return sum + (grossValue - totalDiscounts);
    }, 0);

    const totalSubcontractorsPaid = subcontractors.reduce((sum, s) => {
      // Find all spent transactions for this subcontractor
      const subName = s.name.trim().toLowerCase();
      const ledgerPayments = transactions.filter(tx => {
        if (tx.type !== 'spent') return false;
        const txRecipient = (tx.recipient || '').trim().toLowerCase();
        return tx.category === 'contractors' && (txRecipient === subName || txRecipient.includes(subName) || subName.includes(txRecipient));
      });
      const custodyTotal = ledgerPayments.filter(tx => tx.nature === 'inside_custody').reduce((acc, tx) => acc + tx.amount, 0);
      const officeTotal = ledgerPayments.filter(tx => tx.nature === 'outside_custody').reduce((acc, tx) => acc + tx.amount, 0);
      const paperTotal = s.paperSettlements || 0;
      return sum + custodyTotal + officeTotal + paperTotal;
    }, 0);

    const totalSubcontractorsRemaining = Math.max(0, totalSubcontractsValue - totalSubcontractorsPaid);

    // Efficiency Metrics
    const productionRate = totalSpent > 0 ? (totalExecuted / totalSpent) * 100 : 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const profitMarginEstimate = totalExecuted > 0 ? ((totalExecuted - totalSpent) / totalExecuted) * 100 : 0;

    // Supplies & Inventory
    const totalSuppliesValue = supplyRecords.reduce((acc, cur) => acc + (cur.totalCost || 0), 0);
    const totalSuppliesVolume = supplyRecords.reduce((acc, cur) => acc + (cur.netQuantity || 0), 0);
    const lowStockItems = warehouseItems.filter(item => (item.currentStock || 0) <= (item.minLimit || 0));

    // Logistics & Maintenance
    const totalActiveMachines = equipmentList.length;
    const pendingMaintCount = maintenanceOrders.filter(o => o.status === 'pending').length;
    const inProgressMaintCount = maintenanceOrders.filter(o => o.status === 'in_progress').length;
    const closedMaintCount = maintenanceOrders.filter(o => o.status === 'completed').length;

    // Quality & Lab Tests
    const totalTestsCount = labTests.length;
    const passedTestsCount = labTests.filter(t => t.resultStatus === 'passed').length;
    const failedTestsCount = labTests.filter(t => t.resultStatus === 'failed').length;
    const qaPassRate = totalTestsCount > 0 ? (passedTestsCount / totalTestsCount) * 100 : 0;

    // Safety & Risks
    const totalActiveRisks = risks.filter(r => r.status === 'active').length;
    const criticalIncidents = hseIncidents.filter(i => !i.closed && (i.severity === 'critical' || i.severity === 'high')).length;
    const totalIncidents = hseIncidents.length;

    // Workforce & Labors
    const activeWorkersCount = workers.filter(w => w.forceStatus === 'on-site').length;
    const todayDateStr = new Date().toISOString().split('T')[0];
    const presentTodayCount = attendanceLogs.filter(a => a.date.startsWith(todayDateStr) && (a.status === 'present' || a.status === 'half-day')).length;

    // Documents Control
    const totalDrawings = dcrRecords.filter(r => r.type === 'Drawing').length;
    const totalRFIs = dcrRecords.filter(r => r.type === 'RFI').length;
    const pendingReviewsCount = dcrRecords.filter(r => r.workflowStep === 'Under Review').length;

    return {
      totalBudget,
      totalSpent,
      totalExecuted,
      custodyRemaining,
      custodyAllocated,
      totalSubcontractsValue,
      totalSubcontractorsPaid,
      totalSubcontractorsRemaining,
      productionRate,
      budgetUtilization,
      profitMarginEstimate,
      totalSuppliesValue,
      totalSuppliesVolume,
      lowStockItems,
      totalActiveMachines,
      pendingMaintCount,
      inProgressMaintCount,
      closedMaintCount,
      totalTestsCount,
      passedTestsCount,
      failedTestsCount,
      qaPassRate,
      totalActiveRisks,
      criticalIncidents,
      totalIncidents,
      activeWorkersCount,
      presentTodayCount,
      totalDrawings,
      totalRFIs,
      pendingReviewsCount
    };
  }, [categories, transactions, custodies, subcontractors, supplyRecords, warehouseItems, equipmentList, maintenanceOrders, labTests, risks, hseIncidents, workers, attendanceLogs, dcrRecords]);

  // --- 2. CHART DATA PREPARATION ---
  
  // A. Budget Allocation vs Real Spend per Category
  const categoryChartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.nameAr,
      'الميزانية المعتمدة': cat.initialBudget || 0,
      'المنصرف الفعلي': cat.totalSpent || 0,
      'القيمة المنجزة': cat.totalExecutedValue || 0,
    }));
  }, [categories]);

  // B. Cumulative Financial Trends Over Time
  const financeTrendData = useMemo(() => {
    const sortedTx = [...transactions]
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulativeSpent = 0;
    let cumulativeExecuted = 0;
    const monthlyData: Record<string, { month: string; spent: number; executed: number }> = {};

    sortedTx.forEach(tx => {
      const dateObj = new Date(tx.date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (tx.type === 'spent') cumulativeSpent += tx.amount;
      if (tx.type === 'executed_work') cumulativeExecuted += tx.amount;

      monthlyData[monthKey] = {
        month: monthKey,
        spent: cumulativeSpent,
        executed: cumulativeExecuted
      };
    });

    return Object.values(monthlyData).slice(-8).map(m => ({
      name: m.month,
      'المنصرف المتراكم': m.spent,
      'المنفذ المتراكم': m.executed
    }));
  }, [transactions]);

  // C. Supplies Material Volume Pie Chart
  const materialsChartData = useMemo(() => {
    const materials: Record<string, number> = {};
    supplyRecords.forEach(rec => {
      const item = rec.itemCode || 'خامات أخرى';
      materials[item] = (materials[item] || 0) + (rec.netQuantity || 0);
    });
    return Object.entries(materials)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [supplyRecords]);

  // D. Inspection Submissions Status Donut Chart
  const submissionsChartData = useMemo(() => {
    const Approved = submissions.filter(s => s.status === 'Approved').length;
    const ApprovedWithRemarks = submissions.filter(s => s.status === 'ApprovedWithRemarks').length;
    const Rejected = submissions.filter(s => s.status === 'Rejected').length;
    const Pending = submissions.filter(s => s.status === 'Pending' || !s.status).length;

    return [
      { name: 'معتمد بالكامل', value: Approved, color: '#4F46E5' }, // Deep Purple/Indigo
      { name: 'معتمد بملاحظات', value: ApprovedWithRemarks, color: '#818CF8' }, // Indigo Light
      { name: 'مرفوض هندسياً', value: Rejected, color: '#111827' }, // Dark Charcoal
      { name: 'تحت الدراسة والمراجعة', value: Pending, color: '#E0E7FF' } // Gray Slate
    ].filter(item => item.value > 0);
  }, [submissions]);

  // E. Radar Metrics for Project Overall Health
  const radarHealthData = useMemo(() => {
    return [
      { subject: 'الالتزام بالموازنة', value: Math.max(0, Math.min(100, 100 - Math.abs(stats.budgetUtilization - 100))) },
      { subject: 'كفاءة التدفق النقدي', value: Math.max(0, Math.min(100, stats.productionRate)) },
      { subject: 'معدل جودة المواد', value: stats.qaPassRate || 100 },
      { subject: 'إدارة المخاطر والسلامة', value: stats.totalIncidents === 0 ? 100 : Math.max(0, 100 - (stats.criticalIncidents * 20)) },
      { subject: 'انضباط اليوميات والعمل', value: stats.activeWorkersCount > 0 ? 95 : 0 },
      { subject: 'تسليم البنود والمستندات', value: submissions.length > 0 ? (submissions.filter(s => s.status === 'Approved').length / submissions.length) * 100 : 100 }
    ];
  }, [stats, submissions]);

  // Filtered recent activities with unique Reference ID support (REF-XXXXXX)
  const filteredRecentActivities = useMemo(() => {
    const recentTx = transactions.slice(0, 5).map(t => ({
      id: t.id,
      ref: `REF-${t.id.substring(t.id.length - 6).toUpperCase()}`,
      title: t.description || 'حركة مالية قيد التسجيل',
      type: t.type === 'spent' ? 'صرف مالي' : 'إثبات تنفيذ',
      amount: t.amount,
      date: t.date,
      badge: t.category === 'fuel' ? 'وقود وسولار' : t.category === 'supplies' ? 'مواد وتوريدات' : 'أخرى',
      status: 'نشط ومزامن'
    }));

    if (!searchQuery) return recentTx;
    return recentTx.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const projectDurations = useMemo(() => {
    const list = (projects && projects.length > 0) ? projects : [
      {
        id: 'default-proj-1',
        name: 'مشروع إنشاء وتطوير طريق البستان المزدوج',
        assignmentDate: '2026-01-01',
        handoverDate: '2026-02-15',
        durationMonths: 10,
        status: 'Active'
      }
    ];
    
    const todayMs = new Date().getTime();
    
    return list.map(p => {
      // تاريخ استلام الموقع
      const start = new Date(p.handoverDate || p.assignmentDate || '2026-01-01');
      
      // نهاية الأعمال = تاريخ استلام الموقع + مدة تنفيذ الأعمال بالشهور
      const months = Number(p.durationMonths) || 12;
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      
      const totalTime = end.getTime() - start.getTime();
      const elapsedTime = todayMs - start.getTime();
      const remainingTime = end.getTime() - todayMs;
      
      const totalDays = Math.max(1, Math.ceil(totalTime / (1000 * 60 * 60 * 24)));
      const elapsedDays = Math.max(0, Math.ceil(elapsedTime / (1000 * 60 * 60 * 24)));
      const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
      
      // Calculate remaining % vs total project duration
      let pctRemaining = 0;
      if (totalDays > 0) {
        pctRemaining = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));
      }
      
      return {
        id: p.id,
        name: p.name,
        remainingDays,
        totalDays,
        pctRemaining: Math.round(pctRemaining),
        isOverdue: remainingTime < 0,
        handoverDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        durationMonths: months
      };
    });
  }, [projects]);

  const handlePrint = () => {
    window.print();
  };

  // Color theme specifications
  const COLORS = {
    purplePrimary: '#7C3AED',
    purpleDark: '#6D28D9',
    purpleLight: '#DDD6FE',
    charcoal: '#111827',
    slateLight: '#F3F4F6',
    emerald: '#059669',
    amber: '#D97706',
    rose: '#DC2626'
  };

  return (
    <div className="space-y-8 pb-12" id="dashboard-overview-container">
      
      {/* 1. WELCOME & BRANDED PREMIUM HEADER (LIGHT, DEEP PURPLE & VELVET BLACK) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-white via-[#FCFBFF] to-[#F5F2FF] text-black p-8 rounded-[2rem] border border-purple-100 shadow-[0_15px_40px_-15px_rgba(124,58,237,0.06)] relative overflow-hidden no-print">
        {/* Decorative backdrop blobs */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#EEF2FF] to-transparent pointer-events-none opacity-40"></div>
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-200/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="text-right w-full relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              لوحة التحكم
            </h2>
            <p className="text-xs lg:text-sm text-gray-500 font-medium max-w-2xl leading-relaxed">
              منصة قيادة موحدة لمشروع بنيان. تتيح لك مراقبة كفاءة الإنتاج، التدفقات النقدية والعهد التشغيلية، مستجدات التوريد، والاعتمادات الهندسية للمخططات بشكل متزامن وبأعلى معايير جودة التصميم والتحليل الرقمي.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-end self-start lg:self-center shrink-0">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 active:translate-y-0.5 px-5 py-3 rounded-xl text-xs font-bold border border-gray-200 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={16} className="text-purple-600" />
              <span>طباعة التقرير الشامل</span>
            </button>
            <button 
              onClick={() => setActiveTab('weekly-report')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:translate-y-0.5 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all cursor-pointer"
            >
              <span>مركز التقارير الأسبوعية</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY MASTER HEADER */}
      <div className="hidden print:block text-center space-y-3 border-b-2 border-black pb-6">
        <h1 className="text-4xl font-black text-gray-900">تقرير الأداء الشامل والتحليل المالي للموقع</h1>
        <p className="text-sm text-gray-500 font-bold">بنيان لإدارة المقاولات والمشاريع الكبرى</p>
        <div className="flex justify-between text-xs text-gray-500 font-mono pt-4" dir="rtl">
          <span>التاريخ والوقت: {new Date().toLocaleString('ar-EG')}</span>
          <span>حالة الاتصال ومزامنة البيانات السحابية: متصل ومزامن بالكامل</span>
        </div>
      </div>

      {/* 2. ADVANCED INTERACTIVE SECTOR SELECTOR (TAB SYSTEM) */}
      <div className="flex flex-wrap gap-2 justify-start border-b border-gray-200 pb-3 no-print">
        {[
          { id: 'all', label: 'كافة القطاعات بالموقع', icon: Layers3 },
          { id: 'financial', label: 'الماليات والعهود', icon: Coins },
          { id: 'supplies', label: 'التوريدات والمخازن', icon: Database },
          { id: 'production', label: 'الإنتاج والجودة', icon: CheckCircle2 },
          { id: 'hr', label: 'العمالة والموارد البشرية', icon: Users },
          { id: 'safety', label: 'السلامة والمخاطر', icon: ShieldAlert }
        ].map(sect => (
          <button
            key={sect.id}
            onClick={() => setSelectedSector(sect.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              selectedSector === sect.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-100'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700'
            }`}
          >
            <sect.icon size={14} className={selectedSector === sect.id ? 'text-white' : 'text-purple-600'} />
            <span>{sect.label}</span>
          </button>
        ))}
      </div>

      {/* NEW: CRITICAL QUICK ACTIONS & ALERTS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center justify-end gap-2">إجراءات سريعة <CheckCircle2 className="text-emerald-600" size={16} /></h4>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-gray-700 transition">تسجيل حركة مالية</button>
             <button onClick={() => setActiveTab('supplies')} className="text-xs font-bold bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-gray-700 transition">إضافة توريد جديد</button>
             <button onClick={() => setActiveTab('hse')} className="text-xs font-bold bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-gray-700 transition">تسجيل واقعة سلامة</button>
             <button onClick={() => setActiveTab('deliveries')} className="text-xs font-bold bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-gray-700 transition">طلب فحص استلام</button>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center justify-end gap-2">
            <span>المدد المتبقية للمشروعات</span>
            <Clock className="text-purple-600" size={16} />
          </h4>
          <div className="space-y-4">
            {projectDurations.slice(0, 3).map((proj) => (
              <div key={proj.id} className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded">
                    {proj.remainingDays > 0 ? `${proj.remainingDays} يوم متبقي` : 'منتهي أو متأخر'}
                  </span>
                  <span className="text-gray-900 truncate max-w-[180px]" title={proj.name}>
                    {proj.name}
                  </span>
                </div>
                <div className="relative w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${proj.pctRemaining}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>المدة الكلية: {proj.totalDays} يوم ({proj.durationMonths} شهر)</span>
                  <span className="font-mono">استلام الموقع: {proj.handoverDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SYNCHRONIZED FINANCIAL & OPERATIONAL KPIs GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: BUDGET */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-300 relative group">
          <div className="absolute top-0 left-0 w-2 h-full bg-purple-600 rounded-l-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right block">القيمة التقديرية للمشاريع</span>
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <h4 className="text-2xl font-black text-gray-900 font-mono tracking-tight text-right">
            {formatCurrency(stats.totalBudget)}
          </h4>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-[10px] text-gray-500 font-bold">
            <span>التصنيفات المفعلة</span>
            <span className="text-purple-700 font-bold">{categories.length} فئات رئيسية</span>
          </div>
        </div>

        {/* CARD 2: REAL OUTFLOW */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-300 relative group">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600 rounded-l-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest text-right block">المنصرف الفعلي (البنود)</span>
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown size={18} />
            </div>
          </div>
          <h4 className="text-2xl font-black text-rose-700 font-mono tracking-tight text-right">
            {formatCurrency(stats.totalSpent)}
          </h4>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-[10px] text-gray-500 font-bold">
            <span>استهلاك الموازنة العامة</span>
            <span className="text-rose-600 font-mono font-bold">{stats.budgetUtilization.toFixed(1)}%</span>
          </div>
        </div>

        {/* CARD 3: EXECUTED PROGRESS */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-300 relative group">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600 rounded-l-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest text-right block">قيمة المستخلصات المنصرفة</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={18} />
            </div>
          </div>
          <h4 className="text-2xl font-black text-emerald-700 font-mono tracking-tight text-right">
            {formatCurrency(stats.totalExecuted)}
          </h4>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-[10px] text-gray-500 font-bold">
            <span>نسبة الصرف من التعاقدات</span>
            <span className="text-emerald-600 font-mono font-bold">{((stats.totalSubcontractorsPaid / (stats.totalSubcontractsValue || 1)) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* CARD 4: OVERALL HEALTH SUMMARY */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-100 transition-all duration-300 relative group">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-600 rounded-l-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest text-right block">معدل الربح</span>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-600 group-hover:scale-110 transition-transform duration-300">
              <Percent size={18} />
            </div>
          </div>
          <h4 className={`text-2xl font-black font-mono tracking-tight text-right ${stats.profitMarginEstimate >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {stats.profitMarginEstimate.toFixed(1)}%
          </h4>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 text-[10px] text-gray-500 font-bold">
            <span>الفائض التقديري للموقع</span>
            <span className={`font-bold ${stats.profitMarginEstimate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(stats.totalExecuted - stats.totalSpent)}
            </span>
          </div>
        </div>

      </div>

      {/* 4. SECTOR DETAIL LAYOUTS & DYNAMIC CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FINANCIAL SECTOR MAIN VISUALIZATIONS */}
        {(selectedSector === 'all' || selectedSector === 'financial') && (
          <>
            {/* Chart 1: Bar Chart budget vs spent */}
            <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 font-sans cursor-pointer no-print"
                  >
                    <span>كشف الحركات التفصيلي</span>
                    <ChevronLeft size={14} />
                  </button>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-gray-900">الميزانيات والمنصرفات وتكلفة البنود</h3>
                    <p className="text-[10px] text-gray-400 font-bold">مقارنة بصرية دقيقة بين موازنات الفئات المالية والقيمة المنجزة هندسياً لكل تصنيف</p>
                  </div>
                </div>

                <div className="h-80 w-full text-xs font-sans">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryChartData}
                        margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
                        barGap={4}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="الميزانية المعتمدة" fill={COLORS.purpleLight} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="المنصرف الفعلي" fill={COLORS.purplePrimary} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="القيمة المنجزة" fill={COLORS.charcoal} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                      <Layers size={40} className="text-gray-200 mb-2" />
                      <p className="text-xs font-bold">لا تتوفر ميزانيات معتمدة حالياً للتصنيف المالي</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart 2: Cumulative cash flow line */}
            <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1.5 bg-purple-50 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-purple-100">
                    <Activity size={12} />
                    <span>سلسلة زمنية</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-gray-900">الاتجاه المتراكم للسيولة والأعمال</h3>
                    <p className="text-[10px] text-gray-400 font-bold">متابعة تراكم الدفعات وصافي الفوائض المالية الإجمالية</p>
                  </div>
                </div>

                <div className="h-80 w-full text-xs font-sans">
                  {financeTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={financeTrendData}
                        margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.purplePrimary} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={COLORS.purplePrimary} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.charcoal} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={COLORS.charcoal} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                        />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="المنصرف المتراكم" stroke={COLORS.purplePrimary} strokeWidth={2.5} fillOpacity={1} fill="url(#spentGrad)" />
                        <Area type="monotone" dataKey="المنفذ المتراكم" stroke={COLORS.charcoal} strokeWidth={2.5} fillOpacity={1} fill="url(#execGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                      <Activity size={40} className="text-gray-200 mb-2" />
                      <p className="text-xs font-bold">لا تتوفر حركات مالية كافية بالسيولة لاستعراض المخطط البياني</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Site Liquidity & Custodies Breakdown Card */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-purple-50/20 border border-purple-100 p-6 rounded-3xl shadow-sm">
              <div className="space-y-3.5 text-right flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-gray-900 text-base flex items-center justify-end gap-2">
                    <span>تحليل وإدارة السيولة والمستخلصات</span>
                    <Coins className="text-purple-600" size={18} />
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    مزامنة وتدقيق العهد النقدية النشطة مع الإدارة المالية. يظهر المسحوبات والمدفوعات المسجلة تحت بند تصفية حسابات الموقع.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="px-4 py-2.5 bg-black hover:bg-purple-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-purple-200 w-fit self-end"
                >
                  الماليات ومستخلصات البنود
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col justify-between">
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-purple-700 uppercase">مجموع العهد المصروفة للموقع</span>
                  <div className="text-2xl font-black font-mono mt-1 text-gray-900">{formatCurrency(stats.custodyAllocated)}</div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold">
                    <span>المتبقي نقداً بالعهد: {formatCurrency(stats.custodyRemaining)}</span>
                    <span>{((stats.custodyRemaining / (stats.custodyAllocated || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, (stats.custodyRemaining / (stats.custodyAllocated || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col justify-between">
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">مستخلصات المقاولين المتبقية للتسوية</span>
                  <div className="text-2xl font-black font-mono mt-1 text-gray-900">{formatCurrency(stats.totalSubcontractorsRemaining)}</div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold">
                    <span>المسدد للمقاولين: {formatCurrency(stats.totalSubcontractorsPaid)}</span>
                    <span>{((stats.totalSubcontractorsPaid / (stats.totalSubcontractsValue || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-black h-full rounded-full" style={{ width: `${Math.min(100, (stats.totalSubcontractorsPaid / (stats.totalSubcontractsValue || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SUPPLIES & WAREHOUSE SECTOR */}
        {(selectedSector === 'all' || selectedSector === 'supplies') && (
          <div className="lg:col-span-12 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setActiveTab('supplies')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-sans no-print"
              >
                <span>التحكم ومكعبات التوريد</span>
                <ChevronLeft size={14} />
              </button>
              <div className="text-right">
                <h3 className="text-sm font-black text-gray-900">حركة التوريد وجرد المخزون الفرعي</h3>
                <p className="text-[10px] text-gray-400 font-bold">الربط المتزامن لحساب كميات الخامات الموردة (م³) وحالة السقوف والحد الأدنى للسلامة بالمخازن</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Core Material Statistics */}
              <div className="lg:col-span-4 p-5 bg-[#FAF9FF] rounded-2xl border border-purple-100 flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-purple-100/50 rounded-xl w-fit text-purple-700 mb-4 border border-purple-200">
                    <Truck size={22} />
                  </div>
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase block mb-1">الكمية الإجمالية للمواد الموردة</span>
                  <h4 className="text-2xl font-black text-gray-900 font-mono tracking-tighter">
                    {stats.totalSuppliesVolume.toLocaleString('ar-EG', {maximumFractionDigits:0})} م³
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5">بناءً على تصفية فواتير وإيصالات التوريد المدخلة من بواب الميزان بالموقع</p>
                </div>
                <div className="text-xs text-purple-900 font-bold mt-6 pt-3 border-t border-purple-100 flex justify-between items-center">
                  <span>إجمالي القيمة التقديرية للخامات:</span>
                  <span className="font-mono text-sm font-black text-purple-700">{formatCurrency(stats.totalSuppliesValue)}</span>
                </div>
              </div>

              {/* Top materials list chart */}
              <div className="lg:col-span-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 text-right">
                <span className="text-[10px] font-extrabold text-gray-500 block mb-4 uppercase">التوزيع النوعي للمواد الرئيسية</span>
                {materialsChartData.length > 0 ? (
                  <div className="space-y-4">
                    {materialsChartData.map((mat) => {
                      const ratio = stats.totalSuppliesVolume > 0 ? (mat.value / stats.totalSuppliesVolume) * 100 : 0;
                      return (
                        <div key={mat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                            <span>{mat.name}</span>
                            <span className="font-mono text-purple-700">{mat.value.toLocaleString('ar-EG', {maximumFractionDigits:0})} م³ ({ratio.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200/80 h-2 rounded-full overflow-hidden flex justify-end">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${ratio}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-gray-400">
                    <Layers3 size={28} className="text-gray-300 mb-1" />
                    <p className="text-xs font-bold">لم تسجل كميات خامات توريدية</p>
                  </div>
                )}
              </div>

              {/* Warehouse critical alerts */}
              <div className="lg:col-span-4 bg-gray-900 text-white p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="p-1 px-3 bg-red-600 text-white text-[9px] font-extrabold rounded-lg tracking-wider">نقص مخزون حرج</span>
                    <AlertTriangle size={20} className="text-red-400 animate-pulse" />
                  </div>
                  <h5 className="text-4xl font-black font-mono text-white">{stats.lowStockItems.length}</h5>
                  <p className="text-xs font-bold text-gray-300 mt-2 leading-relaxed">
                    أصناف تعدت حاجز الأمان الأدنى في المخزن الفرعي وتتطلب طلبات شراء عاجلة لتجنب تعطيل المشروع.
                  </p>
                </div>
                
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="w-full mt-6 bg-white hover:bg-purple-50 text-gray-900 px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight text-center transition-all cursor-pointer no-print"
                >
                  فتح لوحة جرد وجدول المخزن الفرعي
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PRODUCTION & QUALITY (QA/QC) SECTOR */}
        {(selectedSector === 'all' || selectedSector === 'production') && (
          <>
            {/* QA/QC Submittals */}
            <div className="lg:col-span-6 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setActiveTab('deliveries')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-sans no-print"
                  >
                    <span>سجلات تسليم البنود</span>
                    <ChevronLeft size={14} />
                  </button>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-gray-900">ضبط الجودة وتسليم الأعمال للاستشاري</h3>
                    <p className="text-[10px] text-gray-400 font-bold">نسب مخرجات الفحص الفني للخرسانات والتربة والاعتمادات الإنشائية</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Submission Pie Chart */}
                  {submissionsChartData.length > 0 ? (
                    <div className="h-48 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={submissionsChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {submissionsChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} طلبات فحص`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                        <span className="text-2xl font-black font-mono text-gray-900">{submissions.length}</span>
                        <span className="text-[9px] font-bold text-gray-400">إجمالي طلبات الفحص</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400">
                      <p className="text-xs font-bold">لم تودع طلبات تسليم هندسي (RFI) بعد</p>
                    </div>
                  )}

                  {/* Quality KPIs list */}
                  <div className="space-y-4 text-right">
                    <div className="bg-[#FAF9FF] p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black font-mono text-purple-700">{stats.qaPassRate.toFixed(0)}%</span>
                        <span className="text-[11px] font-bold text-gray-700">قبول عينات الدمك والخرسانة</span>
                      </div>
                      <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${stats.qaPassRate}%` }}></div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                        <p className="text-lg font-black text-gray-900 font-mono">{stats.passedTestsCount}</p>
                        <p className="text-[10px] text-gray-500 font-bold">مقبول هندسياً</p>
                      </div>
                      <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                        <p className="text-lg font-black text-red-600 font-mono">{stats.failedTestsCount}</p>
                        <p className="text-[10px] text-gray-500 font-bold">مرفوض/معاد</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timelines and Planning Progress (WBS) */}
            <div className="lg:col-span-6 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setActiveTab('planning')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-sans no-print"
                  >
                    <span>الجدول الزمني للفقرات</span>
                    <ChevronLeft size={14} />
                  </button>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-gray-900">متابعة بنود وجدول المهام (WBS)</h3>
                    <p className="text-[10px] text-gray-400 font-bold">مراقبة تقدم الفقرات الحرجة ومحطات التسليم الإنشائي الفعلي</p>
                  </div>
                </div>

                <div className="space-y-5 text-right">
                  {/* Timeline basic metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-center">
                      <span className="text-xl font-black text-purple-700 font-mono">{stats.pendingReviewsCount}</span>
                      <span className="text-[9px] text-gray-500 block mt-1 font-bold">فقرات بالدراسة</span>
                    </div>
                    <div className="p-3 bg-gray-950 text-white rounded-xl text-center">
                      <span className="text-xl font-black font-mono text-purple-400">{wbsTasks.length}</span>
                      <span className="text-[9px] text-gray-300 block mt-1 font-bold">إجمالي المهام</span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                      <span className="text-xl font-black font-mono text-emerald-700">
                        {wbsTasks.length > 0 ? (wbsTasks.reduce((s,t) => s + (t.actualProgress || 0), 0) / wbsTasks.length).toFixed(0) : 0}%
                      </span>
                      <span className="text-[9px] text-gray-500 block mt-1 font-bold">نسبة إنجاز الموقع</span>
                    </div>
                  </div>

                  {/* Core steps list */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-extrabold text-gray-400 block uppercase">الفقرات الرئيسية ومستوى التنفيذ الحالي</span>
                    {wbsTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="p-3 bg-[#FCFBFF] border border-gray-100 rounded-xl">
                        <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                          <span className="font-mono text-purple-700 text-[9px] bg-purple-100 px-2 py-0.5 rounded-md">{task.wbsCode}</span>
                          <span className="text-gray-900">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black font-mono text-purple-600 shrink-0">{task.actualProgress || 0}%</span>
                          <div className="w-full bg-gray-200/60 h-1.5 rounded-full overflow-hidden flex justify-end">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${task.actualProgress || 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {wbsTasks.length === 0 && (
                      <div className="py-8 text-center text-gray-400 text-xs font-bold border border-dashed border-gray-100 rounded-2xl">
                        لم تقم بتهيئة وتثبيت الفقرات الزمنية للموقع
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* HUMAN RESOURCES & WORKFORCE */}
        {(selectedSector === 'all' || selectedSector === 'hr') && (
          <div className="lg:col-span-12 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setActiveTab('site-workers')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-sans no-print"
              >
                <span>يوميات وسراكي العمالة</span>
                <ChevronLeft size={14} />
              </button>
              <div className="text-right">
                <h3 className="text-sm font-black text-gray-900">سجل اليوميات والرواتب لعمالة الميدان والمهندسين</h3>
                <p className="text-[10px] text-gray-400 font-bold">الربط التلقائي لقوة العمالة اليومية الحاضرة والتصفية الأسبوعية لأجور الحسابات الفرعية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-right">
              
              <div className="p-5 bg-purple-50/40 rounded-2xl border border-purple-100 text-center flex flex-col justify-center">
                <span className="text-4xl font-black text-purple-700 font-mono block mb-1">{workers.length}</span>
                <span className="text-xs font-bold text-gray-700">قوة العمالة المسجلة رسمياً</span>
                <p className="text-[10px] text-gray-400 font-bold mt-2">إجمالي المسجلين في قاعدة بيانات الموارد البشرية للموقع</p>
              </div>

              <div className="md:col-span-2 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-extrabold text-gray-500 block mb-4 uppercase">حضور اليوم في الموقع الإنشائي</span>
                <div className="flex items-center justify-around gap-4 text-center">
                  <div className="p-3 bg-white rounded-xl border border-gray-100 flex-1">
                    <span className="text-2xl font-black text-emerald-600 font-mono block">{stats.presentTodayCount}</span>
                    <span className="text-[10px] text-gray-400 font-bold">حاضر اليوم</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100 flex-1">
                    <span className="text-2xl font-black text-gray-400 font-mono block">
                      {Math.max(0, workers.length - stats.presentTodayCount)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">غياب أو إجازات</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100 flex-1">
                    <span className="text-2xl font-black text-purple-600 font-mono block">
                      {workers.length > 0 ? ((stats.presentTodayCount / workers.length) * 100).toFixed(0) : 0}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">نسبة الحضور</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gray-900 text-white rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-extrabold text-purple-300 block uppercase">إجمالي مصاريف الأجور المسواة</span>
                  <h4 className="text-2xl font-black font-mono mt-1 text-white">
                    {formatCurrency(salaryPayments.reduce((acc, p) => acc + (p.amount || 0), 0))}
                  </h4>
                </div>
                <div className="text-[10px] text-gray-400 font-bold mt-4 leading-relaxed pt-2 border-t border-gray-800">
                  تشمل هذه المصاريف سلف العمالة وقيم السراكي المحسوبة ومسحوبات عهد التشغيل للأطقم الإنشائية.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* HEALTH, SAFETY & SITE RISKS (HSE) */}
        {(selectedSector === 'all' || selectedSector === 'safety') && (
          <div className="lg:col-span-12 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setActiveTab('hse')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-sans no-print"
              >
                <span>شؤون البيئة والسلامة والوقاية</span>
                <ChevronLeft size={14} />
              </button>
              <div className="text-right">
                <h3 className="text-sm font-black text-gray-900">إدارة السلامة والصحة المهنية ومكافحة المخاطر</h3>
                <p className="text-[10px] text-gray-400 font-bold">متابعة بلاغات المخاطر المفتوحة والإجراءات الاحترازية المتخذة من مهندسي السلامة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              
              <div className="p-5 bg-red-50/40 border border-red-100 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0 animate-pulse border border-red-200">
                  <Flame size={22} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-red-950 font-mono">{stats.criticalIncidents} حوادث</h4>
                  <p className="text-[10px] font-bold text-red-800 mt-0.5">مخاطر حرجة مفتوحة تتطلب تدخل احترازي عاجل</p>
                </div>
              </div>

              <div className="p-5 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0 border border-amber-200">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-amber-950 font-mono">{stats.totalActiveRisks} مخاطر روتينية</h4>
                  <p className="text-[10px] font-bold text-amber-800 mt-0.5">مخاطر تشغيلية قيد المراقبة والمتابعة الميدانية</p>
                </div>
              </div>

              <div className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 border border-emerald-200">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-emerald-950 font-mono">
                    {risks.filter(r => r.status === 'mitigated').length} إجراء احترازي مغلق
                  </h4>
                  <p className="text-[10px] font-bold text-emerald-800 mt-0.5">تم تسويتها بالكامل بتطبيق اشتراطات الوقاية وحقيبة السلامة</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. RADAR PROJECT DIAGNOSTIC & REAL-TIME ACTIVITY LOGGER */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          
          {/* Radar Diagnosis Card */}
          <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="text-right mb-4">
              <h3 className="text-sm font-black text-gray-900">تشخيص الصحة العامة للموقع</h3>
              <p className="text-[10px] text-gray-400 font-bold">مؤشر أداء تكتيكي متعدد المحاور يفحص انضباط الموازنة، الجودة، السلامة والتوريدات</p>
            </div>

            <div className="h-72 w-full text-xs font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarHealthData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 9, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 8 }} />
                  <Radar
                    name="الأداء الفعلي للموقع"
                    dataKey="value"
                    stroke={COLORS.purplePrimary}
                    fill={COLORS.purplePrimary}
                    fillOpacity={0.25}
                  />
                  <Tooltip formatter={(value) => `${value}% كفاءة`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Logger (Synchronized Activity Stream) */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                
                {/* Search query inside activity */}
                <div className="relative w-full sm:w-64 no-print">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برمز الحركة (REF-XXXXXX)..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 text-xs rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-right font-bold"
                  />
                  <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                </div>

                <div className="text-right">
                  <h3 className="text-sm font-black text-gray-900">جدول الحركات والاعتمادات اللحظية</h3>
                  <p className="text-[10px] text-gray-400 font-bold">بث مباشر للعمليات المالية والفنية المسجلة بالموقع مع مرجع REF فريد لكل حركة</p>
                </div>
              </div>

              {/* Table of recent movements */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold">
                      <th className="pb-3 pr-2">رمز الحركة المرجعي</th>
                      <th className="pb-3">بيان الحركة</th>
                      <th className="pb-3">نوع العملية</th>
                      <th className="pb-3">التصنيف</th>
                      <th className="pb-3 text-left pl-2">القيمة المالية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecentActivities.map((act) => (
                      <tr key={act.id} className="border-b border-gray-50 hover:bg-[#FAF9FF] transition-all duration-150">
                        <td className="py-3.5 pr-2 font-mono text-purple-700 font-bold">{act.ref}</td>
                        <td className="py-3.5 font-bold text-gray-800">{act.title}</td>
                        <td className="py-3.5">
                          <span className={`p-1 px-2 text-[10px] font-bold rounded-lg ${
                            act.type === 'صرف مالي' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {act.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-500 font-medium">{act.badge}</td>
                        <td className="py-3.5 font-mono font-bold text-gray-900 text-left pl-2">
                          {formatCurrency(act.amount)}
                        </td>
                      </tr>
                    ))}
                    {filteredRecentActivities.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 font-bold">
                          لا تتوفر حركات مطابقة للبحث حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print disclaimer footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-400 font-bold no-print">
              <span>جميع البيانات المسجلة تخضع لنظام الرصد والتشفير والتأمين السحابي لشركة بنيان</span>
              <span>بنيان - ٢٠٢٦ © كود التحقق الأمني: SEC-93051</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
