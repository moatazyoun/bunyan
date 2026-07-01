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
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  
  // Custom Dialog State to bypass iFrame restrictions on alert/confirm
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title?: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const customAlert = (message: string, title: string = 'تنبيه') => {
    setDialogConfig({ isOpen: true, type: 'alert', title, message });
  };

  const customConfirm = (message: string, onConfirm: () => void, title: string = 'تأكيد الإجراء') => {
    setDialogConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };

  // WBS Dependencies Management States
  const [dependencies, setDependencies] = useState<{
    id: string;
    taskAId: string;
    taskAName: string;
    taskBId: string;
    taskBName: string;
    type: 'FS' | 'SS' | 'FF' | 'SF';
    lag: number;
    refNo: string;
    createdAt: string;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('wbs_dependencies');
      return saved ? JSON.parse(saved) : [
        {
          id: 'dep-1',
          taskAId: 'task-1',
          taskAName: 'أعمال التجهيز وإخلاء الموقع',
          taskBId: 'task-2',
          taskBName: 'أعمال الحفر والتسوية الميكانيكية',
          type: 'FS',
          lag: 1,
          refNo: 'REF-742910',
          createdAt: new Date().toISOString()
        },
        {
          id: 'dep-2',
          taskAId: 'task-2',
          taskAName: 'أعمال الحفر والتسوية الميكانيكية',
          taskBId: 'task-3',
          taskBName: 'صب الخرسانة العادية لأساسات الطريق',
          type: 'FS',
          lag: 0,
          refNo: 'REF-523104',
          createdAt: new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

  const [depTaskA, setDepTaskA] = useState('');
  const [depTaskB, setDepTaskB] = useState('');
  const [depType, setDepType] = useState<'FS' | 'SS' | 'FF' | 'SF'>('FS');
  const [depLag, setDepLag] = useState<number>(0);
  const [depError, setDepError] = useState<string | null>(null);

  const saveDependencies = (updated: typeof dependencies) => {
    setDependencies(updated);
    localStorage.setItem('wbs_dependencies', JSON.stringify(updated));
  };

  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();
    setDepError(null);

    if (!depTaskA || !depTaskB) {
      setDepError('يرجى تحديد الأنشطة المراد ربطها.');
      return;
    }

    if (depTaskA === depTaskB) {
      setDepError('لا يمكن ربط النشاط بنفسه (تداخل دائري مغلق).');
      return;
    }

    // Check if link already exists
    const exists = dependencies.some(d => d.taskAId === depTaskA && d.taskBId === depTaskB && d.type === depType);
    if (exists) {
      setDepError('هذا الرابط المنطقي معرف بالفعل في جدول التداخلات.');
      return;
    }

    const tA = activeTasks.find(t => t.id === depTaskA) || { name: depTaskA };
    const tB = activeTasks.find(t => t.id === depTaskB) || { name: depTaskB };

    const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const newDep = {
      id: `dep-${Date.now()}`,
      taskAId: depTaskA,
      taskAName: tA.name,
      taskBId: depTaskB,
      taskBName: tB.name,
      type: depType,
      lag: depLag,
      refNo,
      createdAt: new Date().toISOString()
    };

    const updated = [newDep, ...dependencies];
    saveDependencies(updated);

    addAuditLog(
      `ربط علاقة زمنية [${tA.name} ➔ ${tB.name}]`,
      'الجدولة والتحكم',
      `تعريف علاقة تداخل منطقي من النوع (${depType}) مع فترة سماح قدرها ${depLag} أيام`,
      refNo
    );

    // Reset Form
    setDepTaskA('');
    setDepTaskB('');
    setDepLag(0);
  };

  const handleDeleteDependency = async (id: string, taskAName: string, taskBName: string) => {
    if (await confirmWithRandomCode(`هل أنت متأكد من إلغاء وحذف رابط التداخل بين [${taskAName}] و [${taskBName}]؟`)) {
      const updated = dependencies.filter(d => d.id !== id);
      saveDependencies(updated);

      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      addAuditLog(
        `إلغاء علاقة زمنية [${taskAName} ➔ ${taskBName}]`,
        'الجدولة والتحكم',
        `حذف تداخل النشاطين بالكامل من شبكة الأنشطة المعتمدة`,
        refNo
      );
    }
  };

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

  // New: AI Schedule Generation states and handler
  const [aiGeneratingSchedule, setAiGeneratingSchedule] = useState(false);
  const [scheduleGenLogs, setScheduleGenLogs] = useState<string[]>([]);

  // Redesigned Schedule Generation Component (UI Wizard)
  const renderScheduleGenerationSection = () => (
    <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-sm mb-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 rounded-2xl text-purple-700">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-black text-slate-950">توليد الجدول الزمني الذكي (AI Schedule Wizard)</h3>
          <p className="text-xs font-bold text-slate-500 max-w-2xl leading-relaxed">
            محرك الذكاء الاصطناعي يقوم الآن بجلب كافة بنود المقايسة المسجلة (BOQ Items)، وتحليل منطق التبعية الإنشائي (Dependencies)، واحتساب المدد الزمنية المثالية، لتوليد جدول زمني (Gantt Chart) متكامل ومهني.
          </p>
          <button
            onClick={generateScheduleWithAI}
            disabled={aiGeneratingSchedule}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-2xl transition-all flex items-center gap-2 shadow-md disabled:bg-slate-400"
          >
            {aiGeneratingSchedule ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>{aiGeneratingSchedule ? 'جاري التحليل والتوليد...' : 'بدء توليد الجدول الزمني من المقايسة'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const generateScheduleWithAI = () => {
    if (!selectedProjectId) {
      customAlert("يرجى اختيار المشروع أولاً لتوليد جدوله الزمني.");
      return;
    }

    if (!filteredBoqItems || filteredBoqItems.length === 0) {
      customAlert("عذراً! لا توجد بنود مقايسة معتمدة للمشروع المحدد حالياً لتوليد جدول زمني منها. يرجى إدخال أو رفع بنود المقايسة للمشروع أولاً.");
      return;
    }

    customConfirm(
      "هل أنت متأكد من توليد جدول زمني كامل بالذكاء الاصطناعي للمشروع المحدد بناءً على بنود المقايسة الخاصة به؟ سيؤدي ذلك لاستبدال الأنشطة الحالية لهذا المشروع بالجدول المولد الجديد.",
      async () => {
        setAiGeneratingSchedule(true);
        setScheduleGenLogs(["تهيئة موديول التخطيط وتصفية بنود المقايسة لتغذية الذكاء الاصطناعي...", "بدء الاتصال بخادم الذكاء الاصطناعي لـ Gemini وجاري تحليل التبعيات والمدد..."]);

        try {
          const res = await fetch("/api/gemini/generate-schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ boqItems: filteredBoqItems })
          });

          if (!res.ok) {
            let errData;
            try { errData = await res.json(); } catch {}
            throw new Error((errData && errData.error) || "فشل توليد الجدول الزمني بالذكاء الاصطناعي.");
          }

          setScheduleGenLogs(prev => [...prev, "جاري استقبال بيانات الجدول وتصميم شبكة الأنشطة والمراحل المتعاقبة..."]);

          const streamReader = res.body?.getReader();
          const decoder = new TextDecoder();
          let resultText = '';
          if (streamReader) {
            while (true) {
              const { done, value } = await streamReader.read();
              if (done) break;
              resultText += decoder.decode(value, { stream: true });
            }
          }

          setScheduleGenLogs(prev => [...prev, "تحليل مخرجات الذكاء الاصطناعي وبناء سجلات المسار الحرج..."]);

          let data: any = {};
          try {
            data = JSON.parse(resultText);
          } catch (err) {
            throw new Error("فشل في معالجة مخرجات الاستجابة المستلمة من الذكاء الاصطناعي.");
          }

          if (data.tasks && Array.isArray(data.tasks)) {
            const mappedTasks: WbsTaskRecord[] = data.tasks.map((t: any, index: number) => {
              const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
              return {
                id: `ai-task-${Date.now()}-${index}`,
                projectId: selectedProjectId,
                wbsCode: t.wbsCode || '',
                name: t.name || '',
                phase: t.phase || 'preparatory',
                phaseNameAr: t.phaseNameAr || phasesMapAr[t.phase || 'preparatory'] || 'أعمال تحضيرية وتجهيز الموقع',
                plannedProgress: Number(t.plannedProgress) || 100,
                actualProgress: Number(t.actualProgress) || 0,
                startDate: t.startDate || '2026-06-01',
                endDate: t.endDate || '2026-06-15',
                criticalPath: !!t.criticalPath,
                status: t.status || 'on_track',
                referenceNo: refNo
              };
            });

            saveTasksList(mappedTasks);
            setScheduleGenLogs(prev => [...prev, "اكتمل البناء! تم تحديث الجدول الزمني بنجاح وترقية حوكمة المسار الحرج وبنود المقايسة المربوطة."]);
            
            const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
            addAuditLog(
              "توليد جدول زمني كامل بالذكاء الاصطناعي",
              "الجدولة والتحكم",
              `تم تلقائيًا بناء هيكل تجزئة العمل (WBS) وجدولة عدد (${mappedTasks.length}) نشاط بالارتباط مع بنود المقايسة.`,
              refNo
            );

            setTimeout(() => {
              setAiGeneratingSchedule(false);
              customAlert(`تم توليد جدول زمني كامل مكون من (${mappedTasks.length}) نشاط بنجاح واقترانه ببنود المقايسة المعتمدة!`, 'اكتمل التوليد بنجاح');
            }, 1000);

          } else {
            throw new Error("لم يرجع الذكاء الاصطناعي أي أنشطة صالحة للهيكل الزمني.");
          }

        } catch (error: any) {
          console.error(error);
          setScheduleGenLogs(prev => [...prev, `❌ خطأ: ${error.message}`]);
          setTimeout(() => {
            setAiGeneratingSchedule(false);
            customAlert(`فشل التوليد: ${error.message}`, 'خطأ في التوليد الذكي');
          }, 1500);
        }
      }
    );
  };


  const exportScheduleToExcel = () => {
    const dataToExport = filteredTasks.map((task, index) => {
      const durationDays = Math.max(
        1,
        Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      
      return {
        'م': index + 1,
        'رمز WBS': task.wbsCode,
        'اسم النشاط / بند المقايسة المربوط': task.name,
        'المرحلة الإنشائية': task.phaseNameAr || phasesMapAr[task.phase] || task.phase,
        'تاريخ البداية': task.startDate,
        'تاريخ النهاية': task.endDate,
        'المدة (يوم)': durationDays,
        'النسبة المخططة %': `${task.plannedProgress}%`,
        'النسبة الفعلية %': `${task.actualProgress}%`,
        'حالة النشاط': task.status === 'completed' ? 'مكتمل' :
                       task.status === 'behind' ? 'متأخر زمنيًا' : 'منتظم',
        'المسار الحرج': task.criticalPath ? 'نعم (حرج)' : 'لا',
        'الرقم المرجعي (ID)': task.referenceNo || `REF-${task.id}`
      };
    });

    // Create sheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Set text direction to RTL for native Arabic presentation in Excel
    worksheet['!dir'] = 'rtl';

    // Set column widths matching the professional display
    const colWidths = [
      { wch: 6 },   // م
      { wch: 15 },  // رمز WBS
      { wch: 45 },  // اسم النشاط / بند المقايسة المربوط
      { wch: 25 },  // المرحلة الإنشائية
      { wch: 14 },  // تاريخ البداية
      { wch: 14 },  // تاريخ النهاية
      { wch: 12 },  // المدة
      { wch: 16 },  // النسبة المخططة
      { wch: 16 },  // النسبة الفعلية
      { wch: 18 },  // حالة النشاط
      { wch: 14 },  // المسار الحرج
      { wch: 20 }   // الرقم المرجعي
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الجدول الزمني المعتمد WBS');

    // Filename: BYN-Project-Schedule-[Date].xlsx
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `BYN-Project-Schedule-${dateStr}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, filename);

    // Add audit log
    const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    addAuditLog(
      'تصدير الجدول الزمني إلى Excel',
      'الجدولة والتحكم',
      `تم تصدير عدد (${filteredTasks.length}) نشاط مجدول بصيغة Excel فنية مطابقة للعرض`,
      refNo
    );
  };

  // Add project selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const filteredBoqItems = useMemo(() => {
    if (!selectedProjectId) return [];
    return boqItems.filter(item => item.projectId === selectedProjectId);
  }, [boqItems, selectedProjectId]);

  // Directly bind to wbsTasks from props - zero fallback default/dummy data!
  const activeTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return wbsTasks.filter(t => t.projectId === selectedProjectId);
  }, [wbsTasks, selectedProjectId]);

  // Sync back to setWbsTasks
  const saveTasksList = (updatedProjectTasks: WbsTaskRecord[]) => {
    setWbsTasks(prev => {
      const otherProjectTasks = prev.filter(t => t.projectId !== selectedProjectId);
      return [...otherProjectTasks, ...updatedProjectTasks];
    });
  };

  // Filtered WBS Tasks for Gantt
  const filteredTasks = useMemo(() => {
    const list = activeTasks.filter(task => {
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

    // Sort by order of appearance in the BOQ (filteredBoqItems)
    const boqOrderMap = new Map<string, number>();
    filteredBoqItems.forEach((item, idx) => {
      if (item.code) {
        boqOrderMap.set(item.code, idx);
      }
    });

    return [...list].sort((a, b) => {
      const idxA = boqOrderMap.has(a.wbsCode) ? boqOrderMap.get(a.wbsCode)! : 999999;
      const idxB = boqOrderMap.has(b.wbsCode) ? boqOrderMap.get(b.wbsCode)! : 999999;
      
      if (idxA !== idxB) {
        return idxA - idxB;
      }
      return a.wbsCode.localeCompare(b.wbsCode);
    });
  }, [activeTasks, searchTerm, phaseFilter, filterType, filteredBoqItems]);

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
    if (!task && !selectedProjectId) {
      customAlert("يرجى اختيار المشروع أولاً لإضافة نشاط جديد.");
      return;
    }
    setActiveStep(1);
    if (task) {
      setEditingTask(task);
      setTaskForm({ ...task });
    } else {
      setEditingTask(null);
      setTaskForm({
        projectId: selectedProjectId,
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
      customAlert('الرجاء اختيار بند المقايسة المربوط لتأكيد هيكلة تجزئة العمل (WBS).');
      return;
    }
    if (!taskForm.name) {
      customAlert('الرجاء تعبئة اسم النشاط لتسهيل عملية المتابعة الميدانية.');
      return;
    }

    const finalStatus = taskForm.actualProgress === 100 
      ? 'completed' 
      : (taskForm.actualProgress! < taskForm.plannedProgress! ? 'behind' : 'on_track');

    const updatedForm = {
      ...taskForm,
      projectId: taskForm.projectId || selectedProjectId,
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

  const handleDeleteTask = async (id: string, name: string) => {
    if (await confirmWithRandomCode(`هل أنت متأكد من حذف هذا النشاط المجدول [${name}] نهائياً؟`)) {
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
    customAlert('تم تطبيق التوصيات الهندسية لضغط المسار الحرج بنجاح!', 'تم بنجاح');
  };

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-500" dir="rtl">
      {dialogConfig && dialogConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 transform scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-3">{dialogConfig.title || 'تنبيه'}</h3>
            <p className="text-slate-600 text-sm font-bold mb-8 leading-relaxed">
              {dialogConfig.message}
            </p>
            <div className="flex gap-3 justify-end">
              {dialogConfig.type === 'confirm' && (
                <button
                  onClick={() => setDialogConfig(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              )}
              <button
                onClick={() => {
                  if (dialogConfig.type === 'confirm' && dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  }
                  setDialogConfig(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md ${
                  dialogConfig.type === 'confirm' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {dialogConfig.type === 'confirm' ? 'تأكيد الإجراء' : 'حسناً، فهمت'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedProjectId ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500 py-12">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-purple-50 rounded-[30px] flex items-center justify-center mx-auto border-4 border-white shadow-xl">
              <Calendar className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              تخطيط وجدولة المشاريع
            </h2>
            <p className="text-slate-500 text-sm font-bold">
              يرجى اختيار المشروع لعرض وإدارة الجدول الزمني ومخطط Gantt الخاص به
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-purple-300 transition-all group flex flex-col items-start text-right w-full"
              >
                <div className="flex justify-between w-full mb-6">
                  <div className="p-3 bg-purple-50/50 rounded-2xl group-hover:bg-purple-100/50 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-purple-400 group-hover:text-purple-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-widest bg-purple-50 px-2 py-1 rounded-lg">
                    جدول زمني نشط
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">
                  {p.name}
                </h4>
                <div className="space-y-2 w-full">
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    أمر إسناد: {p.assignmentNumber}
                  </p>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    تاريخ استلام الموقع: {p.handoverDate || p.assignmentDate}
                  </p>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    مدة التنفيذ: {p.durationMonths} شهر
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-100 w-full flex justify-between items-center text-[11px] font-black text-purple-600">
                  <span>فتح مخطط Gantt والجدول الزمني</span>
                  <ChevronRight className="w-4 h-4 rotate-180 group-hover:translate-x-[-4px] transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-start gap-4 w-full lg:max-w-[70%]">
                <button
                  onClick={() => setSelectedProjectId("")}
                  className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-2xl transition-all border border-purple-200 shadow-sm no-print shrink-0"
                  title="الرجوع واختيار مشروع آخر"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] uppercase tracking-widest">
                    <Layers3 size={12} className="shrink-0" />
                    <span>نظام الرقابة والتحكم الرقمي بالجدول الزمني والمقايسة</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 font-sans">
                    مخطط Gantt والجدولة الزمنية الرقمية (WBS)
                  </h1>
                  <p className="text-slate-600 text-xs font-bold leading-relaxed break-words">
                    المشروع النشط: <strong className="text-purple-700 font-black">{projects.find(p => p.id === selectedProjectId)?.name}</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 no-print shrink-0 w-full lg:w-auto">
                <span className="text-[10px] text-slate-400 font-black shrink-0 hidden lg:inline">تبديل المشروع:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black rounded-2xl px-4 py-3 outline-none focus:border-purple-500 transition-all w-full lg:w-64 cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 1, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 1, y: -15 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* TAB 1: SCHEDULER */}
          {activeTab === 'scheduler' && (
            <div className="space-y-6">
              {renderScheduleGenerationSection()}
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
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
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
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-600 hover:text-slate-900'
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
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>طباعة</span>
                  </button>

                  <button
                    onClick={exportScheduleToExcel}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <FileSpreadsheet size={14} />
                    <span>إكسل</span>
                  </button>
                </div>
              </div>

              {/* AI Logs */}
              {aiOptimizing && (
                <div className="bg-slate-50 text-slate-900 rounded-2xl p-5 border border-slate-200 font-mono space-y-2 text-xs ai-alert-box">
                  <div className="flex items-center gap-2 text-purple-400 font-sans font-black">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جاري تشغيل محاكي الذكاء الاصطناعي لحساب المسارات وفترات التداخل...</span>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    {optimizationLogs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-purple-400">✓</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Schedule Gen Logs */}
              {aiGeneratingSchedule && (
                <div className="bg-slate-50 text-slate-900 rounded-2xl p-5 border border-slate-200 font-mono space-y-2 text-xs ai-alert-box">
                  <div className="flex items-center gap-2 text-purple-400 font-sans font-black">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جاري توليد جدول زمني كامل بالذكاء الاصطناعي...</span>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    {scheduleGenLogs.map((log, i) => (
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
                  initial={{ scale: 0.98, opacity: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-purple-50 border border-purple-200 text-purple-950 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ai-alert-box no-print"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                      <Sparkles size={14} />
                      <span>توصيات الذكاء الاصطناعي لضغط الجدول الزمني وتفادي فترات التأخير</span>
                    </div>
                    {optimizationResult.suggestedChanges.map((change, idx) => (
                      <p key={idx} className="text-xs text-slate-700 leading-relaxed max-w-4xl">
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
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Main Gantt & Table Workspace - Re-architected for Perfect Alignment & Mobile Optimization */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {/* Table Header Row with Title and Add Button */}
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 no-print">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Layers3 size={16} className="text-purple-600" />
                      <span>قائمة أنشطة الجدول الزمني (WBS)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold">إدارة البنود والتقدم الميداني، والمسارات الحرجة للمشروع</p>
                  </div>
                  <button 
                    onClick={() => handleOpenTaskModal(null)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-purple-100 flex items-center gap-2 self-stretch sm:self-auto justify-center"
                  >
                    <Plus size={16} />
                    <span>إضافة نشاط للجدول</span>
                  </button>
                </div>

                {/* Mobile Scroll Assist Hint */}
                <div className="lg:hidden flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-3 border-b border-purple-100 text-[11px] font-black no-print">
                  <span className="animate-pulse">✨</span>
                  <span>مرر الجدول لليمين أو اليسار لعرض المخطط الزمني الكامل للمشروع (Gantt Chart).</span>
                </div>

                <div id="printable-gantt-section" className="w-full overflow-x-auto custom-scrollbar-gantt">
                  <table className="w-full text-right text-xs border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 h-14">
                        <th className="py-3 px-4 text-slate-800 font-black text-right w-[100px]">رمز WBS</th>
                        <th className="py-3 px-4 text-slate-800 font-black text-right min-w-[280px]">اسم النشاط / بند المقايسة المربوط</th>
                        <th className="py-3 px-4 text-center text-slate-800 font-black w-[150px]">البداية</th>
                        <th className="py-3 px-4 text-center text-slate-800 font-black w-[150px]">النهاية</th>
                        <th className="py-3 px-4 text-center text-slate-800 font-black w-[80px]">المدة (يوم)</th>
                        <th className="py-3 px-4 text-center text-slate-800 font-black w-[100px]">الإنجاز %</th>
                        <th className="py-3 px-4 text-center text-slate-800 font-black w-[120px]">حالة النشاط</th>
                        <th className="py-3 px-4 text-center text-slate-800 font-black w-[80px] no-print">إجراءات</th>
                        <th className="p-0 text-slate-800 font-black w-[350px] min-w-[350px] border-r border-slate-200">
                          {/* Timeline Header embedded directly inside the main table header */}
                          <div className="flex h-14 items-center bg-slate-100 select-none font-sans">
                            {viewMode === 'daily' && (
                              <div className="flex w-full">
                                {(() => {
                                  const cols = [];
                                  const current = new Date(timelineSpan.startDate);
                                  for (let i = 0; i < 21; i++) {
                                    const dayStr = `${current.getDate()}/${current.getMonth() + 1}`;
                                    cols.push(
                                      <div key={i} className="flex-1 text-center text-[9px] font-mono font-black border-l border-slate-200/50 py-4 text-slate-600">
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
                                      <div key={i} className="flex-1 text-center text-[9px] font-black border-l border-slate-200/50 py-4 text-slate-600">
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
                                      className="text-center text-[10px] font-black border-l border-slate-200/50 py-4 text-slate-600 shrink-0 truncate px-1"
                                    >
                                      {m.name}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-24 text-center text-slate-400 font-bold">
                            لا توجد أنشطة مجدولة حالياً مربوطة ببنود المقايسة. اضغط على زر "إضافة نشاط للجدول" لإنشاء أول نشاط فعلي بالموقع.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map(task => {
                          const durationDays = Math.max(1, Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                          const coords = getTaskBarCoords(task);
                          return (
                            <tr key={task.id} className="hover:bg-slate-50/70 transition-colors h-16 align-middle">
                              {/* WBS Code */}
                              <td className="py-2 px-4 font-mono font-black text-slate-900 whitespace-nowrap">{task.wbsCode}</td>
                              
                              {/* Task Name & Phase */}
                              <td className="py-2 px-4 min-w-[280px]">
                                <div className="font-bold text-slate-950 text-xs leading-relaxed max-w-[350px]">{task.name}</div>
                                <div className="text-[10px] text-purple-600 font-bold mt-1 bg-purple-50/60 px-2 py-0.5 rounded h-fit w-fit">{task.phaseNameAr}</div>
                              </td>
                              
                              {/* Dates & Duration */}
                              <td className="py-2 px-4 text-center font-mono text-slate-600 font-bold whitespace-nowrap">{task.startDate}</td>
                              <td className="py-2 px-4 text-center font-mono text-slate-600 font-bold whitespace-nowrap">{task.endDate}</td>
                              <td className="py-2 px-4 text-center font-mono text-slate-900 font-bold">{durationDays}</td>
                              
                              {/* Progress */}
                              <td className="py-2 px-4 text-center font-mono">
                                <span className="font-black text-slate-950 block text-xs">{task.actualProgress}%</span>
                                <span className="text-slate-400 text-[9px] block">المخطط: {task.plannedProgress}%</span>
                              </td>
                              
                              {/* Status */}
                              <td className="py-2 px-4 text-center">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
                                  task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  task.status === 'behind' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {task.status === 'completed' ? 'مكتمل' :
                                   task.status === 'behind' ? 'متأخر زمنيًا' : 'منتظم'}
                                </span>
                              </td>
                              
                              {/* Actions */}
                              <td className="py-2 px-4 text-center no-print whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => handleOpenTaskModal(task)}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="تعديل البند"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTask(task.id, task.name)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="حذف البند"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>

                              {/* Gantt Timeline Column */}
                              <td className="p-0 relative bg-slate-50/20 w-[350px] min-w-[350px] border-r border-slate-200">
                                {/* Gridlines Background spanning full cell height */}
                                <div className="absolute inset-0 flex pointer-events-none select-none">
                                  {viewMode === 'daily' && Array.from({ length: 21 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-l border-slate-200/40 h-full"></div>
                                  ))}
                                  {viewMode === 'weekly' && Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-l border-slate-200/40 h-full"></div>
                                  ))}
                                  {viewMode === 'monthly' && months.map((m, i) => {
                                    const widthPct = (m.daysCount / timelineSpan.totalDays) * 100;
                                    return (
                                      <div key={i} style={{ width: `${widthPct}%` }} className="border-l border-slate-200/40 h-full shrink-0"></div>
                                    );
                                  })}
                                </div>

                                {/* Gantt Bar beautifully centered inside the cell */}
                                {coords.visible && (
                                  <div className="absolute inset-y-0 left-0 right-0 px-2 flex items-center">
                                    <div 
                                      style={{ 
                                        right: `${coords.left}%`, 
                                        width: `${coords.width}%`,
                                        minWidth: '24px'
                                      }} 
                                      className="relative h-7 rounded-lg shadow-xs overflow-hidden flex flex-col justify-center transition-all duration-300 group"
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

                                      <div className="relative z-10 w-full px-2 text-[9px] font-black text-white flex justify-between items-center whitespace-nowrap overflow-hidden">
                                        {coords.width > 24 && (
                                          <>
                                            <span>{task.actualProgress}%</span>
                                            {task.criticalPath && <span className="text-[8px] bg-rose-600 text-white px-1 rounded font-black scale-90">حرج</span>}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic KPI Sidebar Integration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 mb-3">دليل حوكمة الجدولة وبنود المقايسة المربوطة</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    يسهل نظام حوكمة بنيان المقارنة اللحظية بين جداول تقدم المشروع الإنشائية والكميات الفعلية المعتمدة بجدول الكميات والمقايسة. تضمن العلاقات المحدثة تلقائياً منع حدوث انحرافات غير مدروسة في التكاليف أو المدد الزمنية للمشروع.
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
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
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">مؤشرات الأداء الإستراتيجية</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-purple-600" />
                          <span className="text-xs font-bold text-slate-700">بنود المقايسة بالمشروع</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {boqItems.length} بنود معتمدة
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-purple-600" />
                          <span className="text-xs font-bold text-slate-700">الأنشطة المجدولة ببرنامج العمل</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {activeTasks.length} نشاطاً فعالاً
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-600" />
                          <span className="text-xs font-bold text-slate-700">أنشطة حرجة متأخرة</span>
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
              
              {/* Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <GitBranch size={16} className="text-purple-600" />
                    <span>مجدول العلاقات الزمنية وشبكة تداخل الأنشطة (WBS Dependencies Network)</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    قم بربط علاقات التتابع الهندسية بين بنود العمل ومراقبة فترات السماح (Lag/Lead) لضمان اتساق المسار الحرج للمشروع ومنع انحراف التوريدات.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0 shadow-sm"
                >
                  <Printer size={14} />
                  <span>طباعة تقرير العلاقات</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Section A: Form to Add Dependency (Column 1 - Left) */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 h-fit no-print">
                  <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest border-r-4 border-purple-500 pr-3">
                    تعريف رابط تداخل منطقي جديد
                  </h3>

                  <form onSubmit={handleAddDependency} className="space-y-4">
                    {depError && (
                      <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-800 text-xs font-bold leading-relaxed">
                        ⚠️ {depError}
                      </div>
                    )}

                    {/* Predecessor (Task A) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">النشاط المسبق (Predecessor) *</label>
                      <select
                        required
                        value={depTaskA}
                        onChange={e => setDepTaskA(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900"
                      >
                        <option value="">-- اختر النشاط المسبق --</option>
                        {activeTasks.map(task => (
                          <option key={task.id} value={task.id}>
                            [{task.wbsCode}] {task.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Link Type */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">نوع العلاقة الزمنية *</label>
                      <select
                        required
                        value={depType}
                        onChange={e => setDepType(e.target.value as any)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900"
                      >
                        <option value="FS">نهاية إلى بداية (FS) - تقليدي</option>
                        <option value="SS">بداية إلى بداية (SS) - توازي</option>
                        <option value="FF">نهاية إلى نهاية (FF) - تسليم مشترك</option>
                        <option value="SF">بداية إلى نهاية (SF) - تبادلي</option>
                      </select>
                    </div>

                    {/* Successor (Task B) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">النشاط اللاحق (Successor) *</label>
                      <select
                        required
                        value={depTaskB}
                        onChange={e => setDepTaskB(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900"
                      >
                        <option value="">-- اختر النشاط اللاحق --</option>
                        {activeTasks.map(task => (
                          <option key={task.id} value={task.id}>
                            [{task.wbsCode}] {task.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lag / Lead days */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 mr-1">فترة السماح / التداخل بالأيام (Lag) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={depLag}
                        onChange={e => setDepLag(parseInt(e.target.value) || 0)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900 font-mono"
                      />
                      <span className="block text-[9px] text-slate-400 font-bold mr-1">أدخل (0) للتداخل المباشر دون تأخير زمني.</span>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
                    >
                      حفظ وربط العلاقة
                    </button>
                  </form>
                </div>

                {/* Section B: Grid / Table of Dependencies (Column 2 - Right) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-r-4 border-slate-900 pr-3">
                      شبكة العلاقات المعتمدة ({dependencies.length})
                    </h3>
                    <div className="text-[10px] text-slate-400 font-bold no-print">
                      مجدولة تلقائياً
                    </div>
                  </div>

                  {dependencies.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                      لا يوجد علاقات تداخل مسجلة حالياً لهذا المشروع.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black">
                            <th className="p-3.5 font-black">المرجع</th>
                            <th className="p-3.5 font-black">النشاط المسبق (A)</th>
                            <th className="p-3.5 font-black text-center">نوع الرابط</th>
                            <th className="p-3.5 font-black">النشاط اللاحق (B)</th>
                            <th className="p-3.5 font-black text-center">التأخير (أيام)</th>
                            <th className="p-3.5 font-black text-left no-print">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dependencies.map((dep) => (
                            <tr key={dep.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-3.5 font-mono font-extrabold text-purple-600 whitespace-nowrap">{dep.refNo}</td>
                              <td className="p-3.5 font-bold text-slate-900">{dep.taskAName}</td>
                              <td className="p-3.5 text-center">
                                <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-100 font-mono font-black text-[10.5px] rounded-lg">
                                  {dep.type}
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-slate-900">{dep.taskBName}</td>
                              <td className="p-3.5 text-center font-mono font-extrabold text-slate-950">{dep.lag}</td>
                              <td className="p-3.5 text-left no-print whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDependency(dep.id, dep.taskAName, dep.taskBName)}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  title="حذف العلاقة"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Print Notice for compliance */}
                  <div className="hidden print:block text-right pt-6 text-[10px] text-slate-400 font-bold border-t border-slate-100">
                    تم التصدير والطباعة من بنيان الذكي لإدارة المواقع والمشروعات. الرقم المرجعي للتقرير: {`REP-${Math.floor(100000 + Math.random() * 900000)}`}
                  </div>
                </div>

              </div>

            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODAL: TASK FORM (RE-STYLING ACCORDING TO THE SCREENSHOT PROFILES) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100"
          >
            
            {/* Main Interactive Form Workspace (Left Side - 2/3 Width) */}
            <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
              
              {/* Top Header with Close Icon */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-full transition-all"
                  id="close-task-modal-btn"
                >
                  <X size={18} />
                </button>
                <h3 className="text-xl font-black text-slate-900">
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
                      <label className="block text-xs font-black text-slate-600">بند المقايسة المعتمد *</label>
                      <select
                        value={taskForm.wbsCode}
                        onFocus={() => setActiveStep(1)}
                        onChange={e => {
                          const selectedCode = e.target.value;
                          const boqItem = filteredBoqItems.find(b => b.code === selectedCode);
                          setTaskForm(p => ({
                            ...p,
                            wbsCode: selectedCode,
                            name: boqItem ? boqItem.description : p.name || ''
                          }));
                        }}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold transition-all"
                      >
                        <option value="">-- اختر البند المطابق من المقايسة --</option>
                        {filteredBoqItems.map(item => (
                          <option key={item.id} value={item.code}>
                            [{item.code}] {item.description.substring(0, 50)}... ({item.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Text field - Task name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-600">اسم النشاط بالكامل *</label>
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
                      <label className="block text-xs font-black text-slate-600">المرحلة الإنشائية المقترنة *</label>
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
                      <label className="block text-xs font-black text-slate-600">طبيعة المسار الإنشائي *</label>
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
                      <label className="block text-xs font-black text-slate-600">تاريخ البدء في الموقع *</label>
                      <input 
                        type="date" 
                        onFocus={() => setActiveStep(2)}
                        value={taskForm.startDate}
                        onChange={e => setTaskForm(p => ({ ...p, startDate: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold font-mono transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-600">تاريخ النهاية التعاقدي *</label>
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
                      <label className="block text-xs font-black text-slate-600">النسبة المخططة المستهدفة % *</label>
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
                      <label className="block text-xs font-black text-slate-600">النسبة المنجزة الفعلية % *</label>
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
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-sm px-10 py-3.5 rounded-2xl transition-all"
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
                  <h4 className="text-lg font-black text-slate-900">تسجيل وتخطيط النشاط</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    نظام الجدولة الذكي المعتمد لشركة بنيان لربط العمل الفني بالموقع بجداول الكميات والمقايسة لتأكيد سلامة الأداء الميداني والمالي للمشروع.
                  </p>
                </div>
              </div>

              {/* Steps/Section index indicators */}
              <div className="space-y-3.5 mt-8 border-r border-slate-200 pr-4">
                <div className={`flex items-center gap-2 text-xs font-black transition-all ${
                  activeStep === 1 ? 'text-purple-600 font-black scale-102 border-r-2 border-purple-600 -mr-4 pr-3.5' : 'text-slate-400'
                }`}>
                  <span>1. البند والمقايسة</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold transition-all ${
                  activeStep === 2 ? 'text-purple-600 font-black scale-102 border-r-2 border-purple-600 -mr-4 pr-3.5' : 'text-slate-400'
                }`}>
                  <span>2. الفترات الزمنية بالموقع</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold transition-all ${
                  activeStep === 3 ? 'text-purple-600 font-black scale-102 border-r-2 border-purple-600 -mr-4 pr-3.5' : 'text-slate-400'
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200"
          >
            <div className="bg-indigo-600 text-white p-5 flex justify-between items-center">
              <h3 className="font-black text-sm">تسجيل مطالبة تمديد وقت (EOT Claim)</h3>
              <button 
                onClick={() => setShowClaimModal(false)}
                className="text-indigo-200 hover:text-white text-xs font-bold"
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
        </>
      )}
    </div>
  );
}
