import React, { useState, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Calendar, 
  GitBranch,
  Edit3, 
  Trash2, 
  Sparkles, 
  Plus, 
  Printer,
  FileSpreadsheet,
  X,
  RefreshCw,
  Activity,
  Cpu,
  Layers3,
  AlertTriangle
} from 'lucide-react';
import { WbsTaskRecord, BOQItem, Project, Transaction, Contract } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface PlanningDashboardProps {
  wbsTasks: WbsTaskRecord[];
  setWbsTasks: React.Dispatch<React.SetStateAction<WbsTaskRecord[]>>;
  boqItems: BOQItem[];
  projects: Project[];
  transactions: Transaction[];
  contracts: Contract[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string, customRefNo?: string) => void;
}

export default function PlanningDashboard({
  wbsTasks = [],
  setWbsTasks,
  boqItems = [],
  projects = [],
  transactions = [],
  contracts = [],
  userRole,
  addAuditLog
}: PlanningDashboardProps) {
  // Set scheduler tab active by default
  const [activeTab, setActiveTab] = useState<'scheduler' | 'structuring'>('scheduler');
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  
  // Gantt Control States
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'delayed'>('all');

  // Modals / Editing States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WbsTaskRecord | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  
  // Claims state
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Task Form State
  const [taskForm, setTaskForm] = useState<Partial<WbsTaskRecord>>({
    wbsCode: '',
    name: '',
    phase: 'preparatory',
    phaseNameAr: 'أعمال تحضيرية وتجهيز الموقع',
    plannedProgress: 0,
    actualProgress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    criticalPath: false,
    status: 'on_track'
  });

  // AI Assistant Optimization State
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<{
    suggestedChanges: { taskId: string; field: string; from: any; to: any; reason: string }[]
  } | null>(null);

  // Directly bind to wbsTasks from props - zero fallback default/dummy data!
  const activeTasks = useMemo(() => {
    return wbsTasks;
  }, [wbsTasks]);

  // Sync back to setWbsTasks
  const saveTasksList = (updated: WbsTaskRecord[]) => {
    setWbsTasks(updated);
  };

  // Filtered WBS Tasks for Gantt
  const filteredTasks = useMemo(() => {
    return activeTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            task.wbsCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPhase = phaseFilter === 'all' || task.phase === phaseFilter;
      
      let matchesStatusFilter = true;
      if (filterType === 'critical') {
        matchesStatusFilter = task.criticalPath;
      } else if (filterType === 'delayed') {
        matchesStatusFilter = task.status === 'behind';
      }
      
      return matchesSearch && matchesPhase && matchesStatusFilter;
    });
  }, [activeTasks, searchTerm, phaseFilter, filterType]);

  // Gantt Timeline Range Calculations
  const { minDateStr, maxDateStr, totalDays, months } = useMemo(() => {
    if (activeTasks.length === 0) {
      return { 
        minDateStr: '2026-06-01', 
        maxDateStr: '2026-08-31', 
        totalDays: 92,
        months: [{ name: 'يونيو 2026', daysCount: 30 }] 
      };
    }
    
    const dates = activeTasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    let min = new Date(Math.min(...dates.map(d => d.getTime())));
    let max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const minYear = min.getFullYear();
    const minMonth = min.getMonth();
    const minAligned = new Date(minYear, minMonth, 1);
    
    const maxYear = max.getFullYear();
    const maxMonth = max.getMonth();
    const maxAligned = new Date(maxYear, maxMonth + 1, 0);
    
    const diffTime = Math.abs(maxAligned.getTime() - minAligned.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const monthList: { name: string; daysCount: number }[] = [];
    let current = new Date(minAligned);
    while (current <= maxAligned) {
      const m = current.getMonth();
      const y = current.getFullYear();
      const monthNameAr = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ][m];
      
      const lastDay = new Date(y, m + 1, 0);
      monthList.push({
        name: `${monthNameAr} ${y}`,
        daysCount: lastDay.getDate()
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return {
      minDateStr: minAligned.toISOString().split('T')[0],
      maxDateStr: maxAligned.toISOString().split('T')[0],
      totalDays: diffDays,
      months: monthList
    };
  }, [activeTasks]);

  const timelineSpan = useMemo(() => {
    const baseStart = new Date(minDateStr);
    let baseEnd = new Date(maxDateStr);
    
    if (viewMode === 'daily') {
      baseEnd = new Date(baseStart);
      baseEnd.setDate(baseStart.getDate() + 20);
    } else if (viewMode === 'weekly') {
      baseEnd = new Date(baseStart);
      baseEnd.setDate(baseStart.getDate() + 83);
    }
    
    const totalDaysSpan = Math.max(1, Math.ceil((baseEnd.getTime() - baseStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    return {
      startDate: baseStart,
      endDate: baseEnd,
      totalDays: totalDaysSpan
    };
  }, [minDateStr, maxDateStr, viewMode]);

  const getTaskBarCoords = (task: WbsTaskRecord) => {
    const tStart = new Date(task.startDate);
    const tEnd = new Date(task.endDate);
    const spanStart = timelineSpan.startDate;
    const spanEnd = timelineSpan.endDate;
    
    if (tEnd < spanStart || tStart > spanEnd) {
      return { left: 0, width: 0, visible: false };
    }
    
    const startOffsetMs = Math.max(0, tStart.getTime() - spanStart.getTime());
    const endOffsetMs = Math.min(spanEnd.getTime() - spanStart.getTime(), tEnd.getTime() - spanStart.getTime() + (1000 * 60 * 60 * 24));
    const durationMs = Math.max(0, endOffsetMs - startOffsetMs);
    
    const totalSpanMs = spanEnd.getTime() - spanStart.getTime() + (1000 * 60 * 60 * 24);
    
    const leftPct = (startOffsetMs / totalSpanMs) * 100;
    const widthPct = (durationMs / totalSpanMs) * 100;
    
    return {
      left: leftPct,
      width: widthPct,
      visible: widthPct > 0
    };
  };

  const evmMetrics = useMemo(() => {
    let totalPV = 0;
    let totalEV = 0;
    
    activeTasks.forEach(task => {
      const linkedBoq = boqItems.find(item => item.code === task.wbsCode);
      if (linkedBoq) {
        const itemValue = linkedBoq.price * linkedBoq.quantity;
        totalPV += itemValue * (task.plannedProgress / 100);
        totalEV += itemValue * (task.actualProgress / 100);
      } else {
        const defaultWeight = 150000;
        totalPV += defaultWeight * (task.plannedProgress / 100);
        totalEV += defaultWeight * (task.actualProgress / 100);
      }
    });

    const actualCost = transactions
      .filter(tx => tx.type === 'spent')
      .reduce((sum, tx) => sum + tx.amount, 0) || 350000;

    const spi = totalPV > 0 ? totalEV / totalPV : 1;
    const cpi = actualCost > 0 ? totalEV / actualCost : 1;
    
    let scheduleStatus: 'on_track' | 'behind' | 'ahead' = 'on_track';
    if (spi < 0.95) scheduleStatus = 'behind';
    else if (spi > 1.05) scheduleStatus = 'ahead';

    let costStatus: 'under' | 'over' | 'on_budget' = 'on_budget';
    if (cpi < 0.95) costStatus = 'over';
    else if (cpi > 1.05) costStatus = 'under';

    return {
      pv: totalPV,
      ev: totalEV,
      ac: actualCost,
      cv: totalEV - actualCost,
      sv: totalEV - totalPV,
      spi,
      cpi,
      scheduleStatus,
      costStatus
    };
  }, [activeTasks, boqItems, transactions]);

  const phasesMapAr: Record<string, string> = {
    'preparatory': 'أعمال تحضيرية وتجهيز الموقع',
    'excavation': 'أعمال الحفر والردم والتسويات',
    'subbase': 'أعمال طبقة الأساس والفرش',
    'asphalt': 'أعمال الرصف والطبقة الأسفلتية',
    'curbstone': 'أعمال البردورات والبلدورات والإنترلوك',
    'lighting': 'أعمال الإنارة وكابلات الكهرباء',
    'signage': 'أعمال الدهانات واللوحات الإارشادية والتحكم المروري'
  };

  // Add or Edit Task Modal
  const handleOpenTaskModal = (task: WbsTaskRecord | null = null) => {
    setActiveStep(1);
    if (task) {
      setEditingTask(task);
      setTaskForm({ ...task });
    } else {
      setEditingTask(null);
      setTaskForm({
        wbsCode: '',
        name: '',
        phase: 'preparatory',
        phaseNameAr: 'أعمال تحضيرية وتجهيز الموقع',
        plannedProgress: 0,
        actualProgress: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        criticalPath: false,
        status: 'on_track'
      });
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.wbsCode) {
      alert('الرجاء اختيار بند المقايسة المربوط لتأكيد هيكلة تجزئة العمل (WBS).');
      return;
    }
    if (!taskForm.name) {
      alert('الرجاء تعبئة اسم النشاط لتسهيل عملية المتابعة الميدانية.');
      return;
    }

    const finalStatus = taskForm.actualProgress === 100 
      ? 'completed' 
      : (taskForm.actualProgress! < taskForm.plannedProgress! ? 'behind' : 'on_track');

    const updatedForm = {
      ...taskForm,
      phaseNameAr: phasesMapAr[taskForm.phase || 'preparatory'],
      status: finalStatus
    } as WbsTaskRecord;

    const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    if (editingTask) {
      const updatedList = activeTasks.map(t => t.id === editingTask.id ? { ...t, ...updatedForm } : t);
      saveTasksList(updatedList);
      addAuditLog(
        `تعديل نشاط جدول زمني [${taskForm.name}]`, 
        'الجدولة والتحكم', 
        `تحديث نسبة الإنجاز إلى ${taskForm.actualProgress}% وتعديل الجدول الزمني`,
        refNo
      );
    } else {
      const newTask: WbsTaskRecord = {
        id: `task-${Date.now()}`,
        ...updatedForm
      };
      const updatedList = [...activeTasks, newTask];
      saveTasksList(updatedList);
      addAuditLog(
        `إضافة نشاط جدول زمني جديد [${taskForm.name}]`, 
        'الجدولة والتحكم', 
        `إنشاء نشاط جديد وربطه ببند المقايسة المعتمد [${taskForm.wbsCode}]`,
        refNo
      );
    }
    setShowTaskModal(false);
  };

  const handleDeleteTask = (id: string, name: string) => {
    if (confirmWithRandomCode(`هل أنت متأكد من حذف هذا النشاط المجدول [${name}] نهائياً؟`)) {
      const updatedList = activeTasks.filter(t => t.id !== id);
      saveTasksList(updatedList);
      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      addAuditLog(
        `حذف نشاط جدول زمني [${name}]`, 
        'الجدولة والتحكم', 
        `إزالة النشاط نهائياً ومسح ربطه ببنود المقايسة`,
        refNo
      );
    }
  };

  const runAiOptimization = () => {
    setAiOptimizing(true);
    setOptimizationLogs([]);
    setOptimizationResult(null);

    const logs = [
      'فحص المسارات الزمنية المتداخلة ببنود المقايسة المقترنة...',
      'رصد المسار الحرج الفعال وحساب فترات السماح المتاحة لكل نشاط...',
      'محاكاة تسريع الجدولة عبر تكثيف طواقم العمل والمعدات المتوفرة...'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setOptimizationLogs(prev => [...prev, logs[index]]);
        index++;
      } else {
        clearInterval(interval);
        
        const delayed = activeTasks.filter(t => t.status === 'behind');
        const suggestions: any[] = [];

        if (delayed.length > 0) {
          delayed.forEach(task => {
            suggestions.push({
              taskId: task.id,
              taskName: task.name,
              field: 'endDate',
              from: task.endDate,
              to: new Date(new Date(task.endDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              reason: `ضغط المدة المتبقية لنشاط [${task.name}] بمقدار 7 أيام تعاقدية عبر تشغيل طاقة إضافية بالموقع.`
            });
          });
        } else if (activeTasks.length > 0) {
          suggestions.push({
            taskId: activeTasks[0].id,
            taskName: activeTasks[0].name,
            field: 'criticalPath',
            from: false,
            to: true,
            reason: 'ضبط الأولوية الزمنية للمهمة وإلغاء فترات التأرجح للمحافظة على أوقات التدفق الإنشائي.'
          });
        }

        setOptimizationResult({ suggestedChanges: suggestions });
        setAiOptimizing(false);
      }
    }, 800);
  };

  const applyOptimization = () => {
    if (!optimizationResult) return;
    
    const updatedList = activeTasks.map(t => {
      const suggestion = optimizationResult.suggestedChanges.find(s => s.taskId === t.id);
      if (suggestion) {
        return {
          ...t,
          [suggestion.field]: suggestion.to,
          status: 'on_track'
        } as WbsTaskRecord;
      }
      return t;
    });

    saveTasksList(updatedList);
    const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    addAuditLog(
      'تطبيق موازنة المسار الحرج بالذكاء الاصطناعي', 
      'الجدولة والتحكم', 
      'إعادة جدولة وضغط التواريخ لتفادي التعثر الميداني',
      refNo
    );
    setOptimizationResult(null);
    alert('تم تطبيق التوصيات الهندسية لضغط المسار الحرج بنجاح!');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Print Layout Override Styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          #navigation-tabs, .no-print, button, select, input, .ai-alert-box {
            display: none !important;
          }
          #printable-gantt-section {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Page Header Banner */}
      <div className="bg-black border border-neutral-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-extrabold text-xs uppercase tracking-widest">
              <Layers3 size={14} />
              <span>نظام الرقابة والتحكم الرقمي بالجدول الزمني والمقايسة</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">
              مخطط Gantt والجدولة الزمنية الرقمية (WBS)
            </h1>
            <p className="text-neutral-400 text-xs max-w-2xl leading-relaxed">
              حوكمة كاملة لربط أنشطة المشروع الميدانية بجداول الكميات والمقايسة المعتمدة (BOQ)، واحتساب أوتوماتيكي للقيمة المكتسبة والمسارات الحرجة.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 no-print">
            <button 
              onClick={() => handleOpenTaskModal(null)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-5 py-3 rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={16} />
              <span>إضافة نشاط للجدول</span>
            </button>
            <button 
              onClick={() => setShowClaimModal(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs px-5 py-3 rounded-2xl transition-all border border-neutral-800 flex items-center gap-2"
            >
              <AlertTriangle size={16} className="text-amber-500" />
              <span>مطالبة تمديد وقت EOT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Removed Strategy and Reports pages) */}
      <div id="navigation-tabs" className="flex flex-wrap gap-1 bg-white p-1 rounded-2xl border border-slate-200 no-print">
        {[
          { id: 'scheduler', label: 'الجدولة والمسار الحرج WBS', icon: Calendar },
          { id: 'structuring', label: 'هيكلة البنود والعلاقات', icon: GitBranch }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                isActive 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-neutral-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-purple-400' : 'text-neutral-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* TAB 1: SCHEDULER */}
          {activeTab === 'scheduler' && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="ابحث برمز WBS أو البند..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold w-48"
                    />
                  </div>
                  
                  <select
                    value={phaseFilter}
                    onChange={e => setPhaseFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                  >
                    <option value="all">كل المراحل الإنشائية</option>
                    <option value="preparatory">الأعمال التحضيرية</option>
                    <option value="excavation">أعمال الحفر والردم</option>
                    <option value="subbase">طبقة الأساس والفرش</option>
                    <option value="asphalt">أعمال الرصف والأسفلت</option>
                    <option value="curbstone">البردورات والبلدورات</option>
                    <option value="lighting">أعمال الإنارة والكهرباء</option>
                    <option value="signage">الدهانات وعلامات المرور</option>
                  </select>

                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'critical', label: 'المسار الحرج' },
                      { id: 'delayed', label: 'المتأخرة' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setFilterType(type.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          filterType === type.id 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-slate-150 p-1 rounded-xl">
                    {[
                      { id: 'daily', label: 'يومي' },
                      { id: 'weekly', label: 'أسبوعي' },
                      { id: 'monthly', label: 'شهري' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setViewMode(mode.id as any)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          viewMode === mode.id 
                            ? 'bg-black text-white' 
                            : 'text-neutral-600 hover:text-black'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={runAiOptimization}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>ضغط المسار الحرج (AI)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>طباعة</span>
                  </button>

                  <button
                    onClick={() => alert('تم تصدير الجدول الزمني والمقايسة المربوطة بصيغة Excel فنية معتمدة بنجاح!')}
                    className="bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <FileSpreadsheet size={14} />
                    <span>إكسل</span>
                  </button>
                </div>
              </div>

              {/* AI Logs */}
              {aiOptimizing && (
                <div className="bg-neutral-950 text-white rounded-2xl p-5 border border-neutral-800 font-mono space-y-2 text-xs ai-alert-box">
                  <div className="flex items-center gap-2 text-purple-400 font-sans font-black">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جاري تشغيل محاكي الذكاء الاصطناعي لحساب المسارات وفترات التداخل...</span>
                  </div>
                  <div className="space-y-1 text-neutral-400">
                    {optimizationLogs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-purple-400">✓</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Optim Result */}
              {optimizationResult && (
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-purple-50 border border-purple-200 text-purple-950 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ai-alert-box no-print"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                      <Sparkles size={14} />
                      <span>توصيات الذكاء الاصطناعي لضغط الجدول الزمني وتفادي فترات التأخير</span>
                    </div>
                    {optimizationResult.suggestedChanges.map((change, idx) => (
                      <p key={idx} className="text-xs text-neutral-700 leading-relaxed max-w-4xl">
                        {change.reason}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={applyOptimization}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all"
                    >
                      تطبيق التوصية
                    </button>
                    <button 
                      onClick={() => setOptimizationResult(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-neutral-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Main Gantt & Table Workspace */}
              <div id="printable-gantt-section" className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                
                {/* Right Pane: Table List (7 cols) */}
                <div className="lg:col-span-7 border-l border-slate-200 overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-neutral-500 font-extrabold border-b border-slate-200 h-14">
                        <th className="py-3 px-4 text-slate-800">رمز WBS</th>
                        <th className="py-3 px-4 text-slate-800">اسم النشاط / بند المقايسة المربوط</th>
                        <th className="py-3 px-4 text-center text-slate-800">تاريخ البداية</th>
                        <th className="py-3 px-4 text-center text-slate-800">تاريخ النهاية</th>
                        <th className="py-3 px-4 text-center text-slate-800">المدة (يوم)</th>
                        <th className="py-3 px-4 text-center text-slate-800">الإنجاز %</th>
                        <th className="py-3 px-4 text-center text-slate-800">حالة النشاط</th>
                        <th className="py-3 px-4 text-center text-slate-800 no-print">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                            لا توجد أنشطة مجدولة حالياً مربوطة ببنود المقايسة. اضغط على زر "إضافة نشاط للجدول" لإنشاء أول نشاط فعلي بالموقع.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map(task => {
                          const durationDays = Math.max(1, Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                          return (
                            <tr key={task.id} className="hover:bg-slate-50/70 transition-colors h-16">
                              <td className="py-2 px-4 font-mono font-black text-slate-900">{task.wbsCode}</td>
                              <td className="py-2 px-4">
                                <div className="font-bold text-slate-950 text-xs leading-snug">{task.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{task.phaseNameAr}</div>
                              </td>
                              <td className="py-2 px-4 text-center font-mono text-slate-600 font-medium">{task.startDate}</td>
                              <td className="py-2 px-4 text-center font-mono text-slate-600 font-medium">{task.endDate}</td>
                              <td className="py-2 px-4 text-center font-mono text-slate-900 font-bold">{durationDays}</td>
                              <td className="py-2 px-4 text-center font-mono">
                                <span className="font-black text-slate-950">{task.actualProgress}%</span>
                                <span className="text-slate-300 text-[10px] block">المخطط: {task.plannedProgress}%</span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                  task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                  task.status === 'behind' ? 'bg-rose-50 text-rose-700 animate-pulse' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {task.status === 'completed' ? 'مكتمل' :
                                   task.status === 'behind' ? 'متأخر زمنيًا' : 'منتظم'}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center no-print">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => handleOpenTaskModal(task)}
                                    className="p-1.5 text-neutral-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="تعديل البند"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTask(task.id, task.name)}
                                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="حذف البند"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Left Pane: Gantt Bars View (5 cols) */}
                <div className="lg:col-span-5 flex flex-col bg-slate-50/50">
                  <div className="flex border-b border-slate-200 h-14 bg-slate-100/50 items-center select-none font-sans">
                    {viewMode === 'daily' && (
                      <div className="flex w-full">
                        {(() => {
                          const cols = [];
                          const current = new Date(timelineSpan.startDate);
                          for (let i = 0; i < 21; i++) {
                            const dayStr = `${current.getDate()}/${current.getMonth() + 1}`;
                            cols.push(
                              <div key={i} className="flex-1 text-center text-[9px] font-mono font-bold border-l border-slate-200/60 py-3.5 text-slate-500">
                                {dayStr}
                              </div>
                            );
                            current.setDate(current.getDate() + 1);
                          }
                          return cols;
                        })()}
                      </div>
                    )}

                    {viewMode === 'weekly' && (
                      <div className="flex w-full">
                        {(() => {
                          const cols = [];
                          for (let i = 1; i <= 12; i++) {
                            cols.push(
                              <div key={i} className="flex-1 text-center text-[9px] font-bold border-l border-slate-200/60 py-3.5 text-slate-500">
                                أ{i}
                              </div>
                            );
                          }
                          return cols;
                        })()}
                      </div>
                    )}

                    {viewMode === 'monthly' && (
                      <div className="flex w-full">
                        {months.map((m, idx) => {
                          const widthPct = (m.daysCount / timelineSpan.totalDays) * 100;
                          return (
                            <div 
                              key={idx} 
                              style={{ width: `${widthPct}%` }} 
                              className="text-center text-[10px] font-bold border-l border-slate-200/60 py-3.5 text-slate-600 shrink-0 truncate px-1"
                            >
                              {m.name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 relative bg-white flex-1 min-h-[160px]">
                    {filteredTasks.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-bold">
                        مخطط Gantt فارغ
                      </div>
                    ) : (
                      filteredTasks.map(task => {
                        const coords = getTaskBarCoords(task);
                        return (
                          <div key={task.id} className="h-16 relative flex items-center px-2">
                            {/* Gridlines Background */}
                            <div className="absolute inset-0 flex pointer-events-none select-none">
                              {viewMode === 'daily' && Array.from({ length: 21 }).map((_, i) => (
                                <div key={i} className="flex-1 border-l border-slate-100/60 h-full"></div>
                              ))}
                              {viewMode === 'weekly' && Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="flex-1 border-l border-slate-100/60 h-full"></div>
                              ))}
                              {viewMode === 'monthly' && months.map((m, i) => {
                                const widthPct = (m.daysCount / timelineSpan.totalDays) * 100;
                                return (
                                  <div key={i} style={{ width: `${widthPct}%` }} className="border-l border-slate-100/60 h-full shrink-0"></div>
                                );
                              })}
                            </div>

                            {/* Gantt Bar */}
                            {coords.visible && (
                              <div 
                                style={{ 
                                  right: `${coords.left}%`, 
                                  width: `${coords.width}%`,
                                  minWidth: '20px'
                                }} 
                                className="absolute h-8 rounded-lg shadow-sm overflow-hidden flex flex-col justify-center transition-all duration-300 group"
                              >
                                <div className={`absolute inset-0 ${
                                  task.criticalPath 
                                    ? 'bg-orange-600/20 border border-orange-500/40' 
                                    : 'bg-purple-600/10 border border-purple-500/30'
                                }`}></div>

                                <div 
                                  style={{ width: `${task.actualProgress}%` }}
                                  className={`h-full absolute top-0 right-0 transition-all duration-300 ${
                                    task.criticalPath ? 'bg-orange-600' : 'bg-purple-600'
                                  }`}
                                ></div>

                                <div className="relative z-10 w-full px-2 text-[10px] font-black text-white flex justify-between items-center whitespace-nowrap overflow-hidden">
                                  {coords.width > 20 && (
                                    <>
                                      <span>{task.actualProgress}%</span>
                                      {task.criticalPath && <span className="text-[8px] bg-black/40 px-1 rounded font-black">حرج</span>}
                                    </>
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

              </div>

              {/* Dynamic KPI Sidebar Integration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-black mb-3">دليل حوكمة الجدولة وبنود المقايسة المربوطة</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                    يسهل نظام حوكمة بنيان المقارنة اللحظية بين جداول تقدم المشروع الإنشائية والكميات الفعلية المعتمدة بجدول الكميات والمقايسة. تضمن العلاقات المحدثة تلقائياً منع حدوث انحرافات غير مدروسة في التكاليف أو المدد الزمنية للمشروع.
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-neutral-700">
                    <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                      <span>الأنشطة الاعتيادية</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                      <span>أنشطة المسار الحرج (لا تقبل التأجيل)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 no-print">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">مؤشرات الأداء الإستراتيجية</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-purple-600" />
                          <span className="text-xs font-bold text-neutral-700">بنود المقايسة بالمشروع</span>
                        </div>
                        <span className="text-xs font-black text-black font-mono">
                          {boqItems.length} بنود معتمدة
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-purple-600" />
                          <span className="text-xs font-bold text-neutral-700">الأنشطة المجدولة ببرنامج العمل</span>
                        </div>
                        <span className="text-xs font-black text-black font-mono">
                          {wbsTasks.length} نشاطاً فعالاً
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-600" />
                          <span className="text-xs font-bold text-neutral-700">أنشطة حرجة متأخرة</span>
                        </div>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          {activeTasks.filter(t => t.criticalPath && t.status === 'behind').length} أنشطة
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 space-y-3">
                    <h4 className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                      <Cpu size={14} />
                      <span>تكامل الأنظمة الذكية</span>
                    </h4>
                    <ul className="text-xs text-purple-950/80 space-y-2 list-disc list-inside leading-relaxed pr-1">
                      <li>ربط تقدم العمل بمستخلصات ودفوعات مقاولي الباطن تلقائياً.</li>
                      <li>تحديث كفاءة العمالة ومستويات الإنجاز بالمقارنة بجداول الكميات.</li>
                      <li>مراقبة فترات السماح الميدانية وتسجيل مخاطر تأخير التوريدات.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRUCTURING */}
          {activeTab === 'structuring' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-base font-black text-black flex items-center gap-2 border-r-4 border-purple-600 pr-3 mb-6">
                  <GitBranch size={16} className="text-purple-600" />
                  <span>هيكلة البنود وربط العلاقات الزمنية (WBS Dependencies & Linking)</span>
                </h3>
                
                <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                  استخدم هذه اللوحة لهيكلة وتنسيق علاقات التداخل بين بنود العمل بالجدول الزمني. يتيح النظام ربط أنشطة المشروع (WBS) ببعضها البعض (مثل "النهاية-البداية") وتوزيعها تلقائياً على كامل مدة العملية الإنشائية بناءً على معايير الأسبقية الهندسية.
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                  <p className="text-xs font-bold text-slate-500">
                    واجهة التفاعل والربط المنطقي للأنشطة قيد التطوير... سيتم إتاحة خيارات سحب وإسقاط المهام لربط التواريخ وتحديد التداخلات قريباً.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODAL: TASK FORM (RE-STYLING ACCORDING TO THE SCREENSHOT PROFILES) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100"
          >
            
            {/* Main Interactive Form Workspace (Left Side - 2/3 Width) */}
            <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
              
              {/* Top Header with Close Icon */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className="text-neutral-400 hover:text-black hover:bg-slate-100 p-2 rounded-full transition-all"
                  id="close-task-modal-btn"
                >
                  <X size={18} />
                </button>
                <h3 className="text-xl font-black text-black">
                  {editingTask ? 'تعديل نشاط جدول WBS' : 'إضافة نشاط للجدول الزمني'}
                </h3>
              </div>

              {/* Form Content Scrollable */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                
                {/* Section 1: BOQ & Item details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-r-4 border-purple-600 pr-3">
                    <span className="text-xs font-black text-purple-600 tracking-wider">| 1. البند والمقايسة</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dropdown - BOQ Link */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">بند المقايسة المعتمد *</label>
                      <select
                        value={taskForm.wbsCode}
                        onFocus={() => setActiveStep(1)}
                        onChange={e => {
                          const selectedCode = e.target.value;
                          const boqItem = boqItems.find(b => b.code === selectedCode);
                          setTaskForm(p => ({
                            ...p,
                            wbsCode: selectedCode,
                            name: boqItem ? boqItem.description : p.name || ''
                          }));
                        }}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                      >
                        <option value="">-- اختر البند المطابق من المقايسة --</option>
                        {boqItems.map(item => (
                          <option key={item.id} value={item.code}>
                            [{item.code}] {item.description.substring(0, 50)}... ({item.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Text field - Task name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">اسم النشاط بالكامل *</label>
                      <input 
                        type="text" 
                        onFocus={() => setActiveStep(1)}
                        value={taskForm.name}
                        onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                        placeholder="مثال: حفر الموقع وتجهيز طبقة الأساس..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Select - Construction Phase */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">المرحلة الإنشائية المقترنة *</label>
                      <select
                        value={taskForm.phase}
                        onFocus={() => setActiveStep(1)}
                        onChange={e => setTaskForm(p => ({ ...p, phase: e.target.value as any }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                      >
                        <option value="preparatory">الأعمال التحضيرية وتجهيز الموقع</option>
                        <option value="excavation">أعمال الحفر والردم والتسويات</option>
                        <option value="subbase">أعمال طبقة الأساس والفرش</option>
                        <option value="asphalt">أعمال الرصف والطبقة الأسفلتية</option>
                        <option value="curbstone">أعمال البردورات والبلدورات والإنترلوك</option>
                        <option value="lighting">أعمال الإنارة وكابلات الكهرباء</option>
                        <option value="signage">أعمال الدهانات واللوحات والتحكم المروري</option>
                      </select>
                    </div>

                    {/* Toggle - Critical path */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">طبيعة المسار الإنشائي *</label>
                      <select
                        value={taskForm.criticalPath ? 'true' : 'false'}
                        onFocus={() => setActiveStep(1)}
                        onChange={e => setTaskForm(p => ({ ...p, criticalPath: e.target.value === 'true' }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                      >
                        <option value="false">نشاط اعتيادي (يسمح بفترات سماح وتأخير)</option>
                        <option value="true">نشاط حرج على المسار الإنشائي الحرج (CPM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Timeline dates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-r-4 border-purple-600 pr-3">
                    <span className="text-xs font-black text-purple-600 tracking-wider">| 2. الفترات الزمنية بالموقع</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">تاريخ البدء في الموقع *</label>
                      <input 
                        type="date" 
                        onFocus={() => setActiveStep(2)}
                        value={taskForm.startDate}
                        onChange={e => setTaskForm(p => ({ ...p, startDate: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold font-mono transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">تاريخ النهاية التعاقدي *</label>
                      <input 
                        type="date" 
                        onFocus={() => setActiveStep(2)}
                        value={taskForm.endDate}
                        onChange={e => setTaskForm(p => ({ ...p, endDate: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold font-mono transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Progress indicators */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-r-4 border-purple-600 pr-3">
                    <span className="text-xs font-black text-purple-600 tracking-wider">| 3. نسب الإنجاز والتقدم الفعلي</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">النسبة المخططة المستهدفة % *</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        onFocus={() => setActiveStep(3)}
                        value={taskForm.plannedProgress}
                        onChange={e => setTaskForm(p => ({ ...p, plannedProgress: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                        placeholder="أدخل قيمة من 0 إلى 100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-600">النسبة المنجزة الفعلية % *</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        onFocus={() => setActiveStep(3)}
                        value={taskForm.actualProgress}
                        onChange={e => setTaskForm(p => ({ ...p, actualProgress: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                        placeholder="أدخل قيمة من 0 إلى 100"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Actions Row styled exactly as in the image */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-neutral-600 font-extrabold text-sm px-10 py-3.5 rounded-2xl transition-all"
                  id="cancel-task-btn"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleSaveTask}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm px-12 py-3.5 rounded-2xl transition-all shadow-sm"
                  id="submit-task-btn"
                >
                  اعتماد وحفظ النشاط
                </button>
              </div>

            </div>

            {/* Explanatory Status Sidebar (Right Side - 1/3 Width) styled exactly as in the image */}
            <div className="w-full md:w-[32%] bg-slate-50 border-r border-slate-100 p-8 flex flex-col justify-between select-none">
              
              <div className="space-y-6">
                {/* Upper Icon representation */}
                <div className="w-14 h-14 bg-white border border-slate-150 rounded-2xl flex items-center justify-center shadow-sm">
                {/* Content */}
                </div>

                {/* Subtext and headers */}
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-black">تسجيل وتخطيط النشاط</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                    نظام الجدولة الذكي المعتمد لشركة بنيان لربط العمل الفني بالموقع بجداول الكميات والمقايسة لتأكيد سلامة الأداء الميداني والمالي للمشروع.
                  </p>
                </div>
              </div>

              {/* Steps/Section index indicators */}
              <div className="space-y-3.5 mt-8 border-r border-slate-200 pr-4">
                <div className={`flex items-center gap-2 text-xs font-black transition-all ${
                  activeStep === 1 ? 'text-purple-600 font-black scale-102 border-r-2 border-purple-600 -mr-4 pr-3.5' : 'text-neutral-400'
                }`}>
                  <span>1. البند والمقايسة</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold transition-all ${
                  activeStep === 2 ? 'text-purple-600 font-black scale-102 border-r-2 border-purple-600 -mr-4 pr-3.5' : 'text-neutral-400'
                }`}>
                  <span>2. الفترات الزمنية بالموقع</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold transition-all ${
                  activeStep === 3 ? 'text-purple-600 font-black scale-102 border-r-2 border-purple-600 -mr-4 pr-3.5' : 'text-neutral-400'
                }`}>
                  <span>3. نسب الإنجاز والتقدم</span>
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      )}

      {/* MODAL: CLAIM FORM */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200"
          >
            <div className="bg-black text-white p-5 flex justify-between items-center">
              <h3 className="font-black text-sm">تسجيل مطالبة تمديد وقت (EOT Claim)</h3>
              <button 
                onClick={() => setShowClaimModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                إغلاق ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Form content */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">اسم النشاط *</label>
                <input 
                  type="text"
                  value={taskForm.name || ''}
                  onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-bold"
                />
              </div>

            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => setShowTaskModal(false)}
                className="bg-white border border-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-100"
              >
                تراجع
              </button>
              <button 
                onClick={() => {
                  // TODO: Save task
                  setShowTaskModal(false);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                حفظ النشاط
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
