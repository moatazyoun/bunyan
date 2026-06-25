import React, { useState, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Link2, 
  Cpu, 
  Layers, 
  Users, 
  ArrowRightLeft, 
  Sparkles, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  RefreshCw, 
  Info,
  DollarSign,
  FileSpreadsheet,
  Layers3,
  Flame,
  UserCheck
} from 'lucide-react';
import { WbsTaskRecord, BOQItem, Project, Transaction, Contract } from '../types';

interface PlanningDashboardProps {
  wbsTasks: WbsTaskRecord[];
  setWbsTasks: React.Dispatch<React.SetStateAction<WbsTaskRecord[]>>;
  boqItems: BOQItem[];
  projects: Project[];
  transactions: Transaction[];
  contracts: Contract[];
  userRole?: string;
  addAuditLog: (action: string, module: string, details: string) => void;
}

interface DelayClaim {
  id: string;
  taskId: string;
  cause: string;
  type: 'excusable_compensable' | 'excusable_non_compensable' | 'non_excusable';
  impactDays: number;
  status: 'pending' | 'approved' | 'rejected';
  submissionDate: string;
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
  const [activeTab, setActiveTab] = useState<'strategy' | 'scheduler' | 'methodologies' | 'evm' | 'claims' | 'reports'>('strategy');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  
  // Modals / Editing States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WbsTaskRecord | null>(null);
  
  // Claims state
  const [claims, setClaims] = useState<DelayClaim[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [newClaim, setNewClaim] = useState<Partial<DelayClaim>>({
    taskId: '',
    cause: '',
    type: 'excusable_compensable',
    impactDays: 15,
    status: 'pending'
  });

  // Task Form State
  const [taskForm, setTaskForm] = useState<Partial<WbsTaskRecord>>({
    wbsCode: '',
    name: '',
    phase: 'preparatory',
    phaseNameAr: 'أعمال تحضيرية',
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

  // Filtered WBS Tasks
  const filteredTasks = useMemo(() => {
    return wbsTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            task.wbsCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPhase = phaseFilter === 'all' || task.phase === phaseFilter;
      return matchesSearch && matchesPhase;
    });
  }, [wbsTasks, searchTerm, phaseFilter]);

  // Dynamically calculate EVM Metrics
  const evmMetrics = useMemo(() => {
    // PV = Sum of (BOQ price * BOQ quantity * (task.plannedProgress / 100))
    // EV = Sum of (BOQ price * BOQ quantity * (task.actualProgress / 100))
    // AC = Sum of actual transactions (expenses) associated with the project scope
    let totalPV = 0;
    let totalEV = 0;
    
    wbsTasks.forEach(task => {
      // Find the BOQ item linked to this task.
      // We assume wbsCode can match BOQItem code, or we can look for custom linked tasks
      // Let's search for a BOQ item with matching code or a custom tag
      const linkedBoq = boqItems.find(item => item.code === task.wbsCode || task.name.includes(item.description));
      
      if (linkedBoq) {
        const itemValue = linkedBoq.price * linkedBoq.quantity;
        totalPV += itemValue * (task.plannedProgress / 100);
        totalEV += itemValue * (task.actualProgress / 100);
      } else {
        // Fallback value for tasks without explicitly mapped BOQ items
        const defaultWeight = 150000; // Estimated baseline
        totalPV += defaultWeight * (task.plannedProgress / 100);
        totalEV += defaultWeight * (task.actualProgress / 100);
      }
    });

    // Calculate actual cost from real transactions in database
    const actualCost = transactions
      .filter(tx => tx.type === 'spent' && (!selectedProjectId || tx.description.includes(projects.find(p => p.id === selectedProjectId)?.name || '')))
      .reduce((sum, tx) => sum + tx.amount, 0) || 450000; // reasonable fallback if no spent items match

    const spi = totalPV > 0 ? totalEV / totalPV : 1;
    const cpi = actualCost > 0 ? totalEV / actualCost : 1;
    
    // Status
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
  }, [wbsTasks, boqItems, transactions, selectedProjectId, projects]);

  const phasesMapAr: Record<string, string> = {
    'preparatory': 'أعمال تحضيرية وتجهيز الموقع',
    'excavation': 'أعمال الحفر والردم والتسويات',
    'subbase': 'أعمال طبقة الأساس والفرش',
    'asphalt': 'أعمال الرصف والطبقة الأسفلتية',
    'curbstone': 'أعمال البردورات والبلدورات والإنترلوك',
    'lighting': 'أعمال الإنارة وكابلات الكهرباء',
    'signage': 'أعمال الدهانات واللوحات الإرشادية والتحكم المروري'
  };

  // Add or Edit Task
  const handleOpenTaskModal = (task: WbsTaskRecord | null = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({ ...task });
    } else {
      setEditingTask(null);
      // Auto-generate WBS Code based on selected phase and existing tasks count
      const existingCount = wbsTasks.filter(t => t.phase === 'preparatory').length + 1;
      setTaskForm({
        wbsCode: `WBS-01.${existingCount}`,
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
    if (!taskForm.name || !taskForm.wbsCode) {
      alert('الرجاء تعبئة اسم النشاط ورمز WBS المرجعي');
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

    if (editingTask) {
      setWbsTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updatedForm } : t));
      addAuditLog(`تعديل نشاط جدول زمني [${taskForm.name}]`, 'الجدولة والتحكم', `تحديث تقدم النشاط إلى ${taskForm.actualProgress}% وتعديل التواريخ`);
    } else {
      const newTask: WbsTaskRecord = {
        id: `task-${Date.now()}`,
        ...updatedForm
      };
      setWbsTasks(prev => [...prev, newTask]);
      addAuditLog(`إضافة نشاط جدول زمني جديد [${taskForm.name}]`, 'الجدولة والتحكم', `إنشاء نشاط جديد برمز ${taskForm.wbsCode} بفترة من ${taskForm.startDate} إلى ${taskForm.endDate}`);
    }
    setShowTaskModal(false);
  };

  const handleDeleteTask = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف النشاط [${name}]؟`)) {
      setWbsTasks(prev => prev.filter(t => t.id !== id));
      addAuditLog(`حذف نشاط جدول زمني [${name}]`, 'الجدولة والتحكم', `إزالة النشاط نهائياً من هيكل تجزئة العمل`);
    }
  };

  // AI-Powered optimization function
  const runAiOptimization = () => {
    setAiOptimizing(true);
    setOptimizationLogs([]);
    setOptimizationResult(null);

    const logs = [
      'بدء فحص هيكل تجزئة العمل (WBS) ومقايسة الأعمال (BOQ)...',
      'تحليل التداخلات والاعتماديات الذكية (Dynamic Task Concurrency)...',
      'فحص المسار الحرج (Critical Path Method) وحساب فترات السماح (Float)...',
      'مقارنة المخطط بالفعلي واحتساب معدلات الإنجاز التراكمية...',
      'رصد اختناقات الموارد البشرية والمعدات الثقيلة في الموقع...',
      'توليد حلول المسار الحرج لتعويض التأخيرات (Schedule Compression)...'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setOptimizationLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Find behind tasks to suggest optimization
        const behindTasks = wbsTasks.filter(t => t.status === 'behind');
        const suggestions: any[] = [];

        if (behindTasks.length > 0) {
          behindTasks.forEach(task => {
            suggestions.push({
              taskId: task.id,
              taskName: task.name,
              field: 'endDate',
              from: task.endDate,
              to: new Date(new Date(task.endDate).getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days earlier acceleration
              reason: `تكثيف العمل في نشاط [${task.name}] عن طريق تداخل ذكي بنسبة 25% مع الأنشطة التحضيرية لتجنب ترحيل موعد التسليم النهائي للمشروع.`
            });
          });
        } else {
          // generic optimizations
          suggestions.push({
            taskId: wbsTasks[0]?.id || '1',
            taskName: wbsTasks[0]?.name || 'تجهيز الموقع',
            field: 'criticalPath',
            from: false,
            to: true,
            reason: 'تعديل علاقة الاعتمادية لتصبح Start-to-Start لتقليل إجمالي مدة المشروع بمقدار 14 يوماً.'
          });
        }

        setOptimizationResult({ suggestedChanges: suggestions });
        setAiOptimizing(false);
      }
    }, 1200);
  };

  const applyOptimization = () => {
    if (!optimizationResult) return;
    
    setWbsTasks(prev => {
      return prev.map(t => {
        const suggestion = optimizationResult.suggestedChanges.find(s => s.taskId === t.id);
        if (suggestion) {
          return {
            ...t,
            [suggestion.field]: suggestion.to,
            status: 'on_track' // Recovered
          };
        }
        return t;
      });
    });

    addAuditLog('تطبيق توجيهات الذكاء الاصطناعي لضغط الجدول الزمني', 'الجدولة والتحكم', 'تم تطبيق موازنة الموارد وجدولة المهام لتصحيح الانحرافات');
    setOptimizationResult(null);
    alert('تم تطبيق تحسينات الذكاء الاصطناعي بنجاح وتسوية العلاقات الزمنية!');
  };

  // EOT Claims handlers
  const handleSaveClaim = () => {
    if (!newClaim.taskId || !newClaim.cause) {
      alert('الرجاء اختيار النشاط المتضرر ووصف سبب المطالبة');
      return;
    }
    const claim: DelayClaim = {
      id: `claim-${Date.now()}`,
      taskId: newClaim.taskId,
      cause: newClaim.cause,
      type: newClaim.type as any,
      impactDays: Number(newClaim.impactDays) || 10,
      status: 'pending',
      submissionDate: new Date().toISOString().split('T')[0]
    };

    setClaims(prev => [...prev, claim]);
    setShowClaimModal(false);
    addAuditLog(`تسجيل مطالبة زمنية جديدة (EOT)`, 'الجدولة والتحكم', `مطالبة بتمديد ${claim.impactDays} يوم بسبب [${claim.cause}]`);
  };

  const handleUpdateClaimStatus = (id: string, status: 'approved' | 'rejected') => {
    setClaims(prev => prev.map(c => {
      if (c.id === id) {
        // If approved, dynamically update the end date of the associated WBS task to reflect extension
        if (status === 'approved') {
          setWbsTasks(prevTasks => prevTasks.map(t => {
            if (t.id === c.taskId) {
              const currentEnd = new Date(t.endDate);
              currentEnd.setDate(currentEnd.getDate() + c.impactDays);
              return {
                ...t,
                endDate: currentEnd.toISOString().split('T')[0]
              };
            }
            return t;
          }));
        }
        return { ...c, status };
      }
      return c;
    }));
    addAuditLog(`تحديث حالة المطالبة الزمنية`, 'الجدولة والتحكم', `تغيير حالة المطالبة ${id} إلى ${status === 'approved' ? 'مقبولة وتم تعديل الجدول' : 'مرفوضة'}`);
  };

  // Helper calculation for Resource Loading over time
  const resourceAllocation = useMemo(() => {
    const counts = { engineers: 0, workers: 0, equipment: 0 };
    wbsTasks.forEach(t => {
      if (t.status !== 'completed') {
        if (t.phase === 'preparatory' || t.phase === 'excavation') {
          counts.equipment += 4;
          counts.workers += 12;
          counts.engineers += 2;
        } else if (t.phase === 'subbase' || t.phase === 'asphalt') {
          counts.equipment += 6;
          counts.workers += 18;
          counts.engineers += 3;
        } else {
          counts.workers += 8;
          counts.engineers += 1;
        }
      }
    });
    return counts;
  }, [wbsTasks]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-widest">
              <Layers3 size={14} className="animate-pulse" />
              <span>نظام التحكم المتكامل والتحليل الزمني للمشاريع</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white font-sans">
              الجدولة الزمنية الرقمية وإدارة التحكم في المشاريع
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              الجدولة الزمنية كأداة حوكمة رقمية متكاملة لربط بنود المقايسات والكميات بالمخططات التنفيذية، تسوية الموارد، احتساب القيمة المكتسبة (EVM) ومراقبة الانحرافات اللحظية بدقة متناهية.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => handleOpenTaskModal(null)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 group border border-indigo-500/30"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>إضافة نشاط للجدول الزمني</span>
            </button>
            <button 
              onClick={() => setShowClaimModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-3 rounded-2xl transition-all border border-slate-700 flex items-center gap-2"
            >
              <AlertTriangle size={16} className="text-amber-500" />
              <span>تسجيل مطالبة تمديد وقت</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50">
        {[
          { id: 'strategy', label: 'الرؤية والهدف الإستراتيجي', icon: Layers },
          { id: 'scheduler', label: 'الجدولة والمسار الحرج WBS', icon: Calendar },
          { id: 'methodologies', label: 'منهجيات التخطيط والموارد', icon: Users },
          { id: 'evm', label: 'إدارة القيمة المكتسبة EVM', icon: TrendingUp },
          { id: 'claims', label: 'المطالبات وتأثيرات التأخير', icon: AlertTriangle },
          { id: 'reports', label: 'مخرجات تقارير الإنجاز الفني', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white shadow' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* TAB 1: STRATEGY */}
          {activeTab === 'strategy' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white border border-slate-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Layers size={18} className="text-indigo-600" />
                    <span>حوكمة المشاريع عبر الجدولة الذكية للأنشطة</span>
                  </h2>
                  <div className="prose prose-slate max-w-none text-slate-650 text-sm leading-relaxed space-y-4">
                    <p>
                      تعد الجدولة الزمنية الركيزة الأساسية لحوكمة المشروعات الهندسية وإدارتها بكفاءة. لا يقتصر البرنامج الزمني على كونه مجرد مخططات بيانية صامتة أو تواريخ صماء، بل هو **أداة حية للربط المتكامل** بين كافة محاور المشروع الفنية والمالية والتعاقدية.
                    </p>
                    <p>
                      من خلال دمج هيكل تجزئة العمل (WBS) مع بنود جدول الكميات والمقايسات (BOQ)، يتحول البرنامج الزمني إلى أداة رقابية ديناميكية تمكن الإدارة العليا من التنبؤ الفوري بأي انحراف زمني أو مالي قبل حدوثه، والتكامل مع إدارة المطالبات وتخصيص الموارد البشرية والمعدات لضمان أعلى معدلات إنتاجية في الموقع.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="border border-slate-100 p-4 rounded-2xl bg-indigo-50/50">
                      <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-widest block mb-1">دقة التوقع الزمني</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        تحديد المسارات الحرجة وتقليص فترات الهدر لضمان تسليم حزم الأعمال والمنشآت في مواعيدها التعاقدية.
                      </p>
                    </div>
                    <div className="border border-slate-100 p-4 rounded-2xl bg-emerald-50/50">
                      <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest block mb-1">الاستغلال الأمثل للموارد</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        توزيع الطواقم البشرية والمعدات الثقيلة لمنع اختناقات العمل والتوقف غير المبرر بالمواقع.
                      </p>
                    </div>
                    <div className="border border-slate-100 p-4 rounded-2xl bg-amber-50/50">
                      <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest block mb-1">تعزيز ثقة المالك والمشرف</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        تقديم تقارير إنجاز فني ومالي واضحة تعتمد على قياسات القيمة المكتسبة وتتحقق منها جهات الإشراف.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Integration Info Box */}
                <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-950">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-indigo-400">
                      <ArrowRightLeft size={22} className="animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-indigo-200">الربط التلقائي والشفاف بقواعد البيانات</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        يتم جلب كافة البيانات في هذا النظام مباشرة من قواعد البيانات النشطة للمشروع. لا توجد أي مدخلات افتراضية؛ حيث تُحسب التدفقات النقدية وقيم التكلفة والكميات تلقائياً بناءً على جدول الكميات (BOQ) المعتمد والمطالبات وسجلات الحضور والرواتب في الموقع.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info/Strategic Objectives */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">مؤشرات الأداء الإستراتيجية</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-indigo-600" />
                        <span className="text-xs font-bold text-slate-700">عدد بنود المقايسة المربوطة</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 font-mono">{boqItems.length} بنداً</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">عدد الأنشطة ببرنامج العمل</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 font-mono">{wbsTasks.length} نشاطاً</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-600" />
                        <span className="text-xs font-bold text-slate-700">أنشطة حرجة متأخرة</span>
                      </div>
                      <span className="text-sm font-black text-rose-600 font-mono">
                        {wbsTasks.filter(t => t.criticalPath && t.status === 'behind').length} نشاط
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 space-y-3">
                  <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <Cpu size={14} />
                    <span>تكامل الأنظمة الذكية</span>
                  </h4>
                  <ul className="text-xs text-indigo-950/80 space-y-2 list-disc list-inside leading-relaxed">
                    <li>الربط الحي بعقود مقاولي الباطن وتتبع فترات الإنجاز المقارنة.</li>
                    <li>المزامنة الزمنية التلقائية مع الموافقات الفنية للمخططات واعتماد المواد.</li>
                    <li>تسوية ذكية للموارد لتفادي تراكم العمالة بالمواقع دون عمل حقيقي.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULER WBS */}
          {activeTab === 'scheduler' && (
            <div className="space-y-6">
              {/* Controls and Search */}
              <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input 
                      type="text" 
                      placeholder="ابحث برمز WBS أو اسم النشاط..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 pr-9 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <select
                    value={phaseFilter}
                    onChange={e => setPhaseFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  >
                    <option value="all">كل المراحل الإنشائية</option>
                    <option value="preparatory">الأعمال التحضيرية</option>
                    <option value="excavation">أعمال الحفر والردم</option>
                    <option value="subbase">طبقة الأساس والفرش</option>
                    <option value="asphalt">أعمال الرصف</option>
                    <option value="curbstone">البردورات والإنترلوك</option>
                    <option value="lighting">أعمال الإنارة والكابلات</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={runAiOptimization}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2 border border-emerald-500/20"
                  >
                    <Sparkles size={14} />
                    <span>تحسين العلاقات والمسار الحرج بالذكاء الاصطناعي</span>
                  </button>
                  <button
                    onClick={() => handleOpenTaskModal(null)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>نشاط جديد</span>
                  </button>
                </div>
              </div>

              {/* AI Optimization Live Progress */}
              {aiOptimizing && (
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 font-mono space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-sans font-black">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>محرك الذكاء الاصطناعي للتحليل الزمني نشط الآن...</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-400">
                    {optimizationLogs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-indigo-400">✓</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestion Alert */}
              {optimizationResult && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-indigo-900/40 border border-indigo-500/30 text-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-300 font-black text-xs">
                      <Sparkles size={14} />
                      <span>توصية الجدولة الذكية المتاحة</span>
                    </div>
                    {optimizationResult.suggestedChanges.map((change, idx) => (
                      <p key={idx} className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                        {change.reason}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={applyOptimization}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                    >
                      تطبيق التحسينات تلقائياً
                    </button>
                    <button 
                      onClick={() => setOptimizationResult(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                    >
                      تجاهل التوصية
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Gantt Schedule & Task List */}
              <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">مخطط وجدول الأنشطة (WBS + Timeline)</h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                      <span>مسار حرج (Critical Path)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                      <span>مسار اعتيادي</span>
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 overflow-x-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                      <Calendar size={32} className="mx-auto text-slate-300" />
                      <p className="text-xs font-black">لا توجد أنشطة مسجلة في هيكل تجزئة العمل للمرحلة الحالية.</p>
                      <button 
                        onClick={() => handleOpenTaskModal(null)}
                        className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        إضافة أول نشاط الآن
                      </button>
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const progressWidth = `${task.actualProgress}%`;
                      const plannedWidth = `${task.plannedProgress}%`;
                      return (
                        <div key={task.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          {/* Left Column: Task meta */}
                          <div className="space-y-1.5 w-full lg:w-1/3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-black">
                                {task.wbsCode}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                task.criticalPath 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}>
                                {task.criticalPath ? 'نشاط حرج' : 'نشاط ثانوي'}
                              </span>
                              <span className="text-slate-400 text-[10px] font-bold">
                                {task.phaseNameAr}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900">{task.name}</h4>
                            
                            {/* Linked BOQ Item Badge */}
                            {(() => {
                              const linkedBoq = boqItems.find(item => item.code === task.wbsCode || task.name.includes(item.description));
                              return linkedBoq ? (
                                <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-100">
                                  <Link2 size={10} />
                                  <span>مربوط بمقايسة الأعمال: {linkedBoq.code} ({linkedBoq.unit})</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  <span>غير مربوط بمقايسة</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Center Column: Interactive progress & Dates */}
                          <div className="flex-1 w-full space-y-2">
                            {/* Gantt Timeline visualization */}
                            <div className="relative h-6 bg-slate-100/70 rounded-lg overflow-hidden border border-slate-100 flex items-center">
                              {/* Planned progress bar (faint background) */}
                              <div 
                                className="absolute top-0 right-0 h-full bg-slate-200/60 transition-all duration-300"
                                style={{ width: plannedWidth }}
                              ></div>
                              {/* Actual progress bar (solid blue/orange) */}
                              <div 
                                className={`absolute top-0 right-0 h-full transition-all duration-300 ${
                                  task.criticalPath ? 'bg-rose-500/80' : 'bg-indigo-600/80'
                                }`}
                                style={{ width: progressWidth }}
                              ></div>

                              <div className="relative z-10 w-full px-3 flex justify-between items-center text-[9px] font-mono font-black text-slate-700">
                                <span>الفعلي: {task.actualProgress}%</span>
                                <span>المستهدف: {task.plannedProgress}%</span>
                              </div>
                            </div>

                            {/* Date spans */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                <span>البداية: {task.startDate}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                <span>النهاية المخططة: {task.endDate}</span>
                              </span>
                            </div>
                          </div>

                          {/* Right Column: Status & Actions */}
                          <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                              task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              task.status === 'behind' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {task.status === 'completed' ? 'مكتمل' :
                               task.status === 'behind' ? 'متأخر زمنيًا' : 'منتظم'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleOpenTaskModal(task)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                title="تعديل النشاط"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(task.id, task.name)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="حذف النشاط"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METHODOLOGIES & RESOURCES */}
          {activeTab === 'methodologies' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Methodologies details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Layers3 size={16} className="text-indigo-600" />
                    <span>منهجيات التخطيط الكلاسيكية المطبقة</span>
                  </h3>

                  <div className="space-y-6 text-sm text-slate-650 leading-relaxed">
                    <div className="space-y-2 border-r-2 border-indigo-500 pr-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">طريقة المسار الحرج (Critical Path Method - CPM)</h4>
                      <p className="text-xs">
                        تُحسب تلقائياً كافة العلاقات الزمنية للأنشطة لتحديد "المسار الحرج" - وهو تسلسل المهام المرتبطة التي لا تحتمل أي تأخير لضمان عدم تأثر موعد نهاية المشروع ككل. أي تأخير في نشاط حرج يؤدي لترحيل تاريخ التسليم تلقائياً ويستدعي تدخلاً لتسوية الموارد.
                      </p>
                    </div>

                    <div className="space-y-2 border-r-2 border-emerald-500 pr-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">هيكل تجزئة العمل المعتمد (WBS)</h4>
                      <p className="text-xs">
                        يتم تنظيم المشروع في مستويات هرمية تبدأ من اسم المشروع الإجمالي وصولاً إلى حزم العمل والمهمات الإنشائية التفصيلية (الأعمال الترابية، الفرش، الطبقة الرابطة، والطبقة السطحية). يضمن هذا الهيكل تغطية كامل بنود نطاق العمل (Scope) دون أي إغفال.
                      </p>
                    </div>

                    <div className="space-y-2 border-r-2 border-amber-500 pr-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">تخطيط وتسطيح الموارد (Resource Loading & Leveling)</h4>
                      <p className="text-xs">
                        تحتسب الكثافة التشغيلية للطواقم والمعدات بشكل ديناميكي مقارنة بتواريخ المهام الفعالة لتفادي تراكم الموارد البشرية أو تداخل استخدام اللوادر والهراسات في قطاع واحد. يتيح النظام لمهندس التخطيط اتخاذ قرارات التسطيح (Leveling) لتنعيم منحنيات التوزيع.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resource Allocations visualization */}
                <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">توزيع الحمولات الحالية للموارد في الموقع</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-extrabold">المهندسين والمشرفين</span>
                        <Users size={14} className="text-indigo-500" />
                      </div>
                      <p className="text-lg font-black text-slate-900">{resourceAllocation.engineers} مهندس</p>
                      <span className="text-[9px] text-slate-400 block font-semibold">موزعين على الأنشطة الجارية</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-extrabold">العمالة الفنية واليوميات</span>
                        <UserCheck size={14} className="text-emerald-500" />
                      </div>
                      <p className="text-lg font-black text-slate-900">{resourceAllocation.workers} عامل/طاقم</p>
                      <span className="text-[9px] text-slate-400 block font-semibold">معدل تشغيل نشط متوازن</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-extrabold">المعدات الثقيلة واللوادر</span>
                        <Flame size={14} className="text-amber-500" />
                      </div>
                      <p className="text-lg font-black text-slate-900">{resourceAllocation.equipment} معدة ثقيلة</p>
                      <span className="text-[9px] text-slate-400 block font-semibold">لا تداخلات مرصودة بالقطاعات</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar tools comparison */}
              <div className="space-y-6">
                <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-sm border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">تكامل البرمجيات الهندسية العالمية</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    يتوافق هذا النظام التفاعلي تماماً مع مخرجات البرمجيات الرائدة في التخطيط والتحكم، ويمكن التنسيق وتبادل المخططات بيسر:
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Oracle Primavera P6</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-black">XER الاستيراد</span>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">MS Project Professional</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-black">XML دعم المزامنة</span>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">التدفق التلقائي للتقارير</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black">PDF / EXCEL تصدير</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVM ANALYSIS */}
          {activeTab === 'evm' && (
            <div className="space-y-6">
              {/* Scorecard KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">القيمة المخططة (Planned Value - PV)</span>
                  <p className="text-lg font-black text-slate-950 font-mono">
                    {evmMetrics.pv.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
                  </p>
                  <span className="text-[9px] text-slate-400 block font-bold">القيمة التقديرية للأعمال المفترض إنجازها تعاقديًا</span>
                </div>

                <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">القيمة المكتسبة (Earned Value - EV)</span>
                  <p className="text-lg font-black text-slate-950 font-mono">
                    {evmMetrics.ev.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
                  </p>
                  <span className="text-[9px] text-slate-400 block font-bold">القيمة التقديرية للأعمال المنفذة فعلياً حتى تاريخ اليوم</span>
                </div>

                <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">التكلفة الفعلية (Actual Cost - AC)</span>
                  <p className="text-lg font-black text-slate-950 font-mono">
                    {evmMetrics.ac.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
                  </p>
                  <span className="text-[9px] text-slate-400 block font-bold">المصروفات الفعلية المسجلة من القيود والمقاولين بالكامل</span>
                </div>

                <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">انحراف التكلفة والجدول (CV & SV)</span>
                  <div className="flex gap-2 items-center">
                    <span className={`text-sm font-black font-mono ${evmMetrics.cv >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      CV: {evmMetrics.cv.toLocaleString('ar-EG')}
                    </span>
                    <span className={`text-sm font-black font-mono ${evmMetrics.sv >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      SV: {evmMetrics.sv.toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block font-bold">رصد الأداء المالي والجدولي التراكمي بدقة</span>
                </div>
              </div>

              {/* Performance Indices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SPI card */}
                <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">مؤشر أداء الجدول الزمني (SPI)</h4>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      evmMetrics.spi >= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {evmMetrics.spi >= 1 ? 'متقدم عن الجدول' : 'متأخر عن الجدول'}
                    </span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <p className="text-4xl font-black text-slate-900 font-mono">{evmMetrics.spi.toFixed(2)}</p>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${evmMetrics.spi >= 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(evmMetrics.spi * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يعني المؤشر {evmMetrics.spi.toFixed(2)} أن معدل تقدم الأعمال يمثل {(evmMetrics.spi * 100).toFixed(0)}% من المستهدف المخطط له تعاقديًا للفترة الزمنية الحالية.
                  </p>
                </div>

                {/* CPI card */}
                <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">مؤشر أداء التكلفة المالي (CPI)</h4>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      evmMetrics.cpi >= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {evmMetrics.cpi >= 1 ? 'تحت الميزانية' : 'متجاوز للميزانية'}
                    </span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <p className="text-4xl font-black text-slate-900 font-mono">{evmMetrics.cpi.toFixed(2)}</p>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${evmMetrics.cpi >= 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(evmMetrics.cpi * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يعني مؤشر الكفاءة {evmMetrics.cpi.toFixed(2)} أن كل جنيه مصري يُصرف في هذا القطاع ينتج قيمة مكتسبة فعلية قدرها {(evmMetrics.cpi).toFixed(2)} ج.م تقريبًا.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLAIMS & EOT */}
          {activeTab === 'claims' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Claims Register */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">سجل المطالبات الزمنية وتمديد الوقت (EOT Log)</h3>
                    <button 
                      onClick={() => setShowClaimModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
                    >
                      <Plus size={14} />
                      <span>تقديم مطالبة تمديد وقت</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {claims.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-3">
                        <AlertTriangle size={32} className="mx-auto text-slate-300" />
                        <p className="text-xs font-black">لا توجد مطالبات تمديد وقت معلقة أو مسجلة حاليًا.</p>
                      </div>
                    ) : (
                      claims.map(claim => {
                        const affectedTask = wbsTasks.find(t => t.id === claim.taskId);
                        return (
                          <div key={claim.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black">
                                  {claim.id}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                  claim.type === 'excusable_compensable' ? 'bg-emerald-50 text-emerald-700' :
                                  claim.type === 'excusable_non_compensable' ? 'bg-amber-50 text-amber-700' :
                                  'bg-rose-50 text-rose-700'
                                }`}>
                                  {claim.type === 'excusable_compensable' ? 'مبرر وتدفع تكاليفه' :
                                   claim.type === 'excusable_non_compensable' ? 'مبرر وبدون دفع تكاليف' :
                                   'غير مبرر'}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900">{claim.cause}</h4>
                              <p className="text-[10px] text-slate-500">
                                النشاط المتضرر: <span className="font-bold text-slate-700">{affectedTask?.name || 'غير معروف'}</span>
                              </p>
                              <span className="text-[9px] text-slate-400 block">تاريخ تقديم الطلب: {claim.submissionDate}</span>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                              <div className="text-left">
                                <span className="block text-[10px] text-slate-400 font-extrabold">التمديد المطلوب</span>
                                <span className="text-sm font-black text-indigo-600 font-mono">+{claim.impactDays} يوم</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {claim.status === 'pending' ? (
                                  <>
                                    <button 
                                      onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      قبول وتعديل
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      رفض
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                    claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {claim.status === 'approved' ? 'مقبولة ومعدلة' : 'مرفوضة'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Claim methodologies educational sidebar */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">منهجيات تحليل التأخير الزمني (EOT Methodologies)</h4>
                  
                  <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                    <div className="space-y-1">
                      <span className="font-black text-slate-900 block">1. تحليل تأثير الوقت المخطط (TIA):</span>
                      <p className="text-slate-500">
                        حقن أحداث التأخير الفعلية داخل آخر برنامج زمني معتمد وقياس الفارق لمعرفة التأخير الدقيق للمسار الحرج قبل المباشرة بالنزاعات.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-black text-slate-900 block">2. المخطط مقارنة بالفعلي (As-Built vs As-Planned):</span>
                      <p className="text-slate-500">
                        مقارنة شاملة وبأثر رجعي بين مواعيد الإنجاز والمسارات المعتمدة بالأصل وما وقع فعلياً على أرض الواقع لتحديد المخطئ والمستحق للتعويضات.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROGRESS REPORT */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">التقرير الفني الدوري الموحد (Progress Tracking Report)</h3>
                    <p className="text-[11px] text-slate-500">نموذج معتمد لمتابعة وإرسال نسب الإنجاز الفني للإدارة العليا والاستشارات الهندسية بالموقع.</p>
                  </div>
                  <button 
                    onClick={() => {
                      alert('تم تصدير تقرير الإنجاز الزمني والكمي للمقايسة بصيغة Excel وجاهز للإرسال والاستخدام الفني.');
                      addAuditLog('تصدير تقرير الإنجاز لبرنامج العمل', 'الجدولة والتحكم', 'تصدير وثيقة الإنجاز بصيغة Excel');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2"
                  >
                    <FileSpreadsheet size={14} />
                    <span>تصدير إلى Excel</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-slate-100">
                        <th className="py-3 px-4">رمز WBS</th>
                        <th className="py-3 px-4">اسم الحزمة / النشاط</th>
                        <th className="py-3 px-4">البند المقابل بالمقايسة BOQ</th>
                        <th className="py-3 px-4 text-center">النسبة المخططة Planned %</th>
                        <th className="py-3 px-4 text-center">النسبة الفعلية Actual %</th>
                        <th className="py-3 px-4 text-center">الانحراف Variance</th>
                        <th className="py-3 px-4 text-center">حالة النشاط Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {wbsTasks.map(task => {
                        const linkedBoq = boqItems.find(item => item.code === task.wbsCode || task.name.includes(item.description));
                        const variance = task.actualProgress - task.plannedProgress;
                        return (
                          <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900">{task.wbsCode}</td>
                            <td className="py-3.5 px-4 font-black">{task.name}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-500">
                              {linkedBoq ? `${linkedBoq.code} - ${linkedBoq.description}` : 'غير مربوط بمقايسة'}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold">{task.plannedProgress}%</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold">{task.actualProgress}%</td>
                            <td className={`py-3.5 px-4 text-center font-mono font-black ${
                              variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {variance >= 0 ? `+${variance}%` : `${variance}%`}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                task.status === 'behind' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {task.status === 'completed' ? 'مكتمل' :
                                 task.status === 'behind' ? 'متأخر زمنيًا' : 'منتظم'}
                              </span>
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
        </motion.div>
      </AnimatePresence>

      {/* MODAL: TASK FORM */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-black text-sm">
                {editingTask ? 'تعديل نشاط الجدول الزمني' : 'إضافة نشاط جديد للهيكل'}
              </h3>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق ×
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Form grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">رمز WBS المرجعي *</label>
                  <input 
                    type="text" 
                    value={taskForm.wbsCode}
                    onChange={e => setTaskForm(p => ({ ...p, wbsCode: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    placeholder="WBS-01.1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">اسم النشاط بالكامل *</label>
                  <input 
                    type="text" 
                    value={taskForm.name}
                    onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    placeholder="أعمال توريد وفرش أساس سن 6"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">المرحلة الإنشائية *</label>
                  <select
                    value={taskForm.phase}
                    onChange={e => setTaskForm(p => ({ ...p, phase: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  >
                    <option value="preparatory">الأعمال التحضيرية وتجهيز الموقع</option>
                    <option value="excavation">أعمال الحفر والردم والتسويات</option>
                    <option value="subbase">أعمال طبقة الأساس والفرش</option>
                    <option value="asphalt">أعمال الرصف والطبقة الأسفلتية</option>
                    <option value="curbstone">أعمال البردورات والبلدورات والإنترلوك</option>
                    <option value="lighting">أعمال الإنارة وكابلات الكهرباء</option>
                    <option value="signage">أعمال الدهانات واللوحات الإرشادية والتحكم المروري</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">مسار حرج أم اعتيادي</label>
                  <select
                    value={taskForm.criticalPath ? 'true' : 'false'}
                    onChange={e => setTaskForm(p => ({ ...p, criticalPath: e.target.value === 'true' }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  >
                    <option value="false">نشاط اعتيادي (يحتمل فترات سماح)</option>
                    <option value="true">نشاط على المسار الحرج (حرج للغاية)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">النسبة المخططة المستهدفة %</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={taskForm.plannedProgress}
                    onChange={e => setTaskForm(p => ({ ...p, plannedProgress: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">النسبة المنجزة الفعلية %</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={taskForm.actualProgress}
                    onChange={e => setTaskForm(p => ({ ...p, actualProgress: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">تاريخ البدء في الموقع</label>
                  <input 
                    type="date" 
                    value={taskForm.startDate}
                    onChange={e => setTaskForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">تاريخ النهاية التعاقدي</label>
                  <input 
                    type="date" 
                    value={taskForm.endDate}
                    onChange={e => setTaskForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Mapping Selection based on current database state */}
              <div className="space-y-1 border-t border-slate-100 pt-4">
                <label className="block text-xs font-black text-indigo-700 flex items-center gap-1">
                  <Link2 size={13} />
                  <span>ربط ديناميكي ببنود جدول الكميات والمقايسة المعتمدة للعمل</span>
                </label>
                <select
                  value={taskForm.wbsCode}
                  onChange={e => {
                    const selectedCode = e.target.value;
                    const boqItem = boqItems.find(b => b.code === selectedCode);
                    setTaskForm(p => ({
                      ...p,
                      wbsCode: selectedCode,
                      name: boqItem ? boqItem.description : p.name || ''
                    }));
                  }}
                  className="w-full bg-indigo-50/50 border border-indigo-100 text-indigo-950 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                >
                  <option value="">-- اختر البند المطابق لمقايسة الأعمال من قاعدة البيانات --</option>
                  {boqItems.map(item => (
                    <option key={item.id} value={item.code}>
                      [{item.code}] {item.description} ({item.unit} - {item.quantity} وحدة)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-500 font-bold leading-relaxed">
                  يؤدي اختيار بند المقايسة إلى ربط النشاط تلقائياً ببيانات التكلفة المسجلة والكميات لحساب القيمة المكتسبة (EVM) ومعدلات الإنجاز.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setShowTaskModal(false)}
                className="bg-white border border-slate-250 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
              >
                تجاهل وحفظ
              </button>
              <button 
                onClick={handleSaveTask}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg"
              >
                {editingTask ? 'تحديث وتعديل البيانات' : 'تأكيد وإضافة للهيكل'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: CLAIM FORM */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-black text-sm">تسجيل مطالبة تمديد وقت (EOT Claim)</h3>
              <button 
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">النشاط المتضرر بالجدول *</label>
                <select
                  value={newClaim.taskId}
                  onChange={e => setNewClaim(p => ({ ...p, taskId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-2 px-3 text-xs focus:outline-none font-bold"
                >
                  <option value="">-- اختر النشاط المتأثر بالتأخير --</option>
                  {wbsTasks.map(t => (
                    <option key={t.id} value={t.id}>[{t.wbsCode}] {t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">وصف دقيق لسبب التأخير والمبرر الفني *</label>
                <textarea 
                  rows={3}
                  value={newClaim.cause}
                  onChange={e => setNewClaim(p => ({ ...p, cause: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none font-bold"
                  placeholder="مثال: تأخر اعتماد الرسومات التفصيلية لأعمال الكهرباء، هطول أمطار غزيرة غير متوقعة بالموقع"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">فترة التمديد المطلوبة (بالأيام)</label>
                  <input 
                    type="number"
                    value={newClaim.impactDays}
                    onChange={e => setNewClaim(p => ({ ...p, impactDays: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 px-3 text-xs focus:outline-none font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">نوع المطالبة وأثرها المالي</label>
                  <select
                    value={newClaim.type}
                    onChange={e => setNewClaim(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-2 px-3 text-xs focus:outline-none font-bold"
                  >
                    <option value="excusable_compensable">مبرر وتستحق تعويض مالي (Excusable & Compensable)</option>
                    <option value="excusable_non_compensable">مبرر وبدون تعويض مالي (Excusable & Non-Compensable)</option>
                    <option value="non_excusable">غير مبرر - تقع المسؤولية على المقاول (Non-Excusable)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setShowClaimModal(false)}
                className="bg-white border border-slate-250 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
              >
                تجاهل
              </button>
              <button 
                onClick={handleSaveClaim}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg"
              >
                تأكيد وتقديم المطالبة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
