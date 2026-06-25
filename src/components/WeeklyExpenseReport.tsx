/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Calendar, 
  Coins, 
  User, 
  Printer, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  RefreshCw,
  Plus,
  Trash2,
  FileEdit,
  ChevronRight,
  ChevronLeft,
  Menu,
  CheckCircle,
  DollarSign,
  Settings
} from 'lucide-react';
import { Transaction, ProjectCategory, TransactionType, TransactionNature, PaymentMethod, SiteWorker } from '../types';

interface WeeklyExpenseReportProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  addAuditLog: (action: string, module: string, details: string) => void;
  userRole?: string;
}

// 16 approved coding categories and specific items extracted directly from the uploaded spreadsheet
const BENOD_TREE: { [categoryNameAr: string]: { coreCategory: ProjectCategory; items: string[] } } = {
  'رواتب': {
    coreCategory: 'custody',
    items: [
      'رواتب مهندسين',
      'عمال يومية',
      'عمال داخليين',
      'عامل خارجي',
      'عمال الاسفلت',
      'عمال نظافة',
      'مساحين'
    ]
  },
  'صيانة': {
    coreCategory: 'equipment',
    items: [
      'صيانة دورية',
      'صيانة طارئة',
      'قطع غيار',
      'مركبات المشروع',
      'صيانة كرفانات'
    ]
  },
  'انتقالات': {
    coreCategory: 'supplies',
    items: [
      'انتقالات عمال',
      'مواصلات'
    ]
  },
  'منصرف موقع': {
    coreCategory: 'supplies',
    items: [
      'أدوات مساحية',
      'أدوات كهربائية',
      'أدوات سباكة',
      'أدوات موقع',
      'مستلزمات مكتب',
      'ضيافة مكتب',
      'ضيافة موقع',
      'تلفيات موقع',
      'فطار عمال',
      'اسمنت',
      'رمل',
      'كهرباء',
      'فاتورة كهرباء',
      'مستلزمات بناء',
      'خلطة اسفلت',
      'سيلر'
    ]
  },
  'معيشة': {
    coreCategory: 'custody',
    items: [
      'مصاريف إعاشة',
      'مأكولات ومشروبات',
      'بدل معيشة للمغتربين'
    ]
  },
  'محروقات': {
    coreCategory: 'fuel',
    items: [
      'بنزين',
      'سولار',
      'سولار جراكن',
      'زيت',
      'حساب البنزينة'
    ]
  },
  'مقاولين معدات': {
    coreCategory: 'equipment',
    items: [
      'مقاولات معدات خارجية',
      'إيجار لوادر',
      'إيجار سيارات',
      'إيجار هراسات'
    ]
  },
  'مقاولين باطن': {
    coreCategory: 'contractors',
    items: [
      'أعمال توريد وتنفيذ',
      'أعمال مصنعيات',
      'مقاولات كهرباء',
      'مقاولات صرف'
    ]
  },
  'علاقات عامة': {
    coreCategory: 'supplies',
    items: [
      'مصروفات عامة',
      'تصاريح',
      'تخليص معاملات'
    ]
  },
  'سهره': {
    coreCategory: 'custody',
    items: [
      'بدل سهرة عمال',
      'بدل سهرة مهندسين'
    ]
  },
  'إيجار': {
    coreCategory: 'equipment',
    items: [
      'استراحة يومية'
    ]
  },
  'اختبارات': {
    coreCategory: 'supplies',
    items: [
      'اختبارات معمل'
    ]
  },
  'عهدة': {
    coreCategory: 'custody',
    items: [
      'تصفية عهدة نقدية',
      'صرف عهد'
    ]
  },
  'اكراميات': {
    coreCategory: 'custody',
    items: [
      'اكراميات موقع',
      'اكرامية مقشطة',
      'اكرامية عمال الاسفلت',
      'اكرامية معمل',
      'اكرامية عمال الكهرباء'
    ]
  }
};

const SAMPLE_REPORT_TEXT = `من: ٢١/١/٢٠٢٦
إلى: ٢٧/١/٢٠٢٦
مرحل المنصرف: ١٠,٤٣٠ ج.م
إجمالي المصروف: ٣٠,٠٦٥ ج.م
مرحل الرصيد: ٤٣٠- ج.م
المسئول: محاسب الموقع

الحركات المالية التي تمت هذا الأسبوع للاستيراد:
- رواتب فريق المساحة بقيمة ٩٠٠ ج.م يوم السبت ٢٠٢٦/٠١/٢٤ تصفية عهدة نقدية
- رواتب حرس الموقع بقيمة ٨٤٠ ج.م يوم السبت ٢٠٢٦/٠١/٢٤ تصفية عهدة نقدية
- رواتب سائق سيارة بقيمة ٨,٣٠٠ ج.م يوم الجمعة ٢٠٢٦/٠١/٢٣ رواتب عهدة نقدية
- رواتب سائق نقل بقيمة ٧٥٠ ج.م يوم السبت ٢٠٢٦/٠١/٢٤ عهدة رواتب
- صيانة سيارة ميكانيكا بقيمة ١,٠٠٠ ج.م الجمعة ٢٠٢٦/٠١/٢٣ وصحح بـ ١,٧٨٠ ج.م السبت ٢٠٢٦/٠١/٢٤ (إجمالي ٢٧٨٠ ج.م صيانة معدات)
- صيانة أدوات كهربائية وعدد فنية بقيمة ١,٨٣٥ ج.م يوم الخميس ٢٠٢٦/٠١/٢٢ صيانة معدات
- انتقالات عمال تشوينات بقيمة ٦٠ ج.م السبت و ١٠٠ ج.م الأحد ٢٠٢٦/٠١/٢٥ تصفية عهدة
- مستلزمات مكتبية وادوات نظافة بقيمة ١,٧٣٠ ج.م الخميس و ٥٠٠ ج.م السبت ٢٠٢٦/٠١/٢٤ منصرف موقع
- مصاريف تحويل نقدية بقيمة ١٠٠ ج.م الجمعة و ٥٠ ج.م الأحد منصرف موقع
- تلفيات موقع وتجهيزات بقيمة ٥٧٠ ج.م السبت و ٢٢٠ ج.م الاثنين ٢٠٢٦/٠١/٢٦ منصرف موقع
- ضيافة شاي وقهوة بقيمة ٥٠٠ ج.م السبت منصرف موقع
- إكراميات عمال خدمات بقيمة ٢٠٠ ج.م الأحد و ٢٠٠ ج.م الاثنين إكراميات عهدة`;

export default function WeeklyExpenseReport({ 
  transactions, 
  onAddTransaction, 
  onUpdateTransaction,
  onDeleteTransaction,
  addAuditLog,
  workers,
  userRole
}: WeeklyExpenseReportProps & { workers: SiteWorker[] }) {
  // 1. Dynamic Benod Tree State
  const [benodTree, setBenodTree] = useState<{ [categoryNameAr: string]: { coreCategory: ProjectCategory; items: string[] } }>(() => {
    const saved = localStorage.getItem('bunyan_benod_tree');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved benod tree", e);
      }
    }
    return BENOD_TREE;
  });

  // Save changes to local storage
  useEffect(() => {
    localStorage.setItem('bunyan_benod_tree', JSON.stringify(benodTree));
  }, [benodTree]);

  // Synchronize Site Workers with the Coding Tree (Items) for labor categories
  useEffect(() => {
    if (workers) {
      const activeWorkerNames = workers.filter(w => w.forceStatus === 'on-site').map(w => w.name);
      
      setBenodTree(prev => {
        const updated = { ...prev };
        const laborCategories = ['رواتب', 'معيشة', 'سهره'];
        let changed = false;

        laborCategories.forEach(cat => {
          if (updated[cat]) {
            const currentItems = [...updated[cat].items];
            
            // 1. Remove names that are not in the active workers list 
            // BUT keep special items like 'عمال يومية', 'عامل خارجي', etc.
            const persistentItems = ['عمال يومية', 'عامل خارجي', 'عمال الاسفلت', 'عمال بمشية', 'عمال نقاشة', 'عمال نظافة', 'عمال بردوة', 'عمال ممسوسة'];
            const filteredItems = currentItems.filter(item => 
              persistentItems.includes(item) || activeWorkerNames.includes(item)
            );

            // 2. Add active workers that are not in the list
            activeWorkerNames.forEach(name => {
              if (!filteredItems.includes(name)) {
                filteredItems.push(name);
              }
            });

            // Check if items changed
            if (filteredItems.length !== currentItems.length || !filteredItems.every((v, i) => v === currentItems[i])) {
              updated[cat] = { ...updated[cat], items: filteredItems };
              changed = true;
            }
          }
        });

        return changed ? updated : prev;
      });
    }
  }, [workers]);

  // Tree Editor Specific States
  const [showTreeEditor, setShowTreeEditor] = useState<boolean>(false);
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('رواتب');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryCore, setNewCategoryCore] = useState<ProjectCategory>('supplies');
  const [newItemName, setNewItemName] = useState<string>('');

  // Tree Editor operational functions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCat = newCategoryName.trim();
    if (!cleanCat) return;
    if (benodTree[cleanCat]) {
      alert('هذا الباب/الفئة موجودة بالفعل في النظام!');
      return;
    }
    setBenodTree(prev => ({
      ...prev,
      [cleanCat]: {
        coreCategory: newCategoryCore,
        items: []
      }
    }));
    setEditSelectedCategory(cleanCat);
    setNewCategoryName('');
    addAuditLog('إرسال وتكويد بند رئيسي', 'شجرة البنود والأبواب', `تمت إضافة فئة رئيسية مكودة جديدة بنجاح باسم: ${cleanCat}.`);
  };

  const handleRemoveCategory = (catName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'إلغاء فئة رئيسية',
      message: `هل أنت متأكد من حذف الفئة الرئيسية "${catName}" وبنودها الفرعية المشفرة بالكامل؟`,
      onConfirm: () => {
        setBenodTree(prev => {
          const copy = { ...prev };
          delete copy[catName];
          return copy;
        });
        const remaining = Object.keys(benodTree).filter(c => c !== catName);
        if (remaining.length > 0) {
          setEditSelectedCategory(remaining[0]);
          if (formCategory === catName) {
            setFormCategory(remaining[0]);
          }
        }
        addAuditLog('حذف فئة رئيسية', 'شجرة البنود والأبواب', `تم حذف فئة التكويد الحسابي "${catName}" بالكامل.`);
      }
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItem = newItemName.trim();
    if (!cleanItem || !editSelectedCategory) return;
    const currentItems = benodTree[editSelectedCategory]?.items || [];
    if (currentItems.includes(cleanItem)) {
      alert('البند الفرعي مضاف ومكود بالفعل تحت هذه الفئة!');
      return;
    }
    setBenodTree(prev => ({
      ...prev,
      [editSelectedCategory]: {
        ...prev[editSelectedCategory],
        items: [...currentItems, cleanItem]
      }
    }));
    setNewItemName('');
    addAuditLog('إضافة بند فرعي مكود', 'شجرة البنود والأبواب', `تم إدراج كود بند جديد "${cleanItem}" تحت فئة التصنيف "${editSelectedCategory}".`);
  };

  const handleRemoveItem = (catName: string, itemName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'إلغاء بند فرعي',
      message: `تحذير هام: هل أنت متأكد من رغبتك في حذف البند الفرعي "${itemName}" من فئة "${catName}"؟`,
      onConfirm: () => {
        setBenodTree(prev => {
          if (!prev[catName]) return prev;
          return {
            ...prev,
            [catName]: {
              ...prev[catName],
              items: prev[catName].items.filter(it => it !== itemName)
            }
          };
        });
        addAuditLog('إزالة كود بند فرعي', 'شجرة البنود والأبواب', `تم حذف البند الفرعي "${itemName}" من فئة "${catName}".`);
      }
    });
  };

  const handleEditCategoryName = (oldName: string) => {
    const newName = prompt('أدخل الاسم الجديد للفئة الرئيسية/الباب:', oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    
    setConfirmState({
      isOpen: true,
      title: 'تعديل فئة رئيسية/الباب كلياً',
      message: `تحذير تعديل بند رئيسي: هل أنت متأكد من رغبتك في تغيير وتعديل المسمى من "${oldName}" إلى "${newName.trim()}"؟ سيؤثر هذا على تصنيفات النظام الفورية!`,
      onConfirm: () => {
        setBenodTree(prev => {
          const copy = { ...prev };
          const data = copy[oldName];
          delete copy[oldName];
          copy[newName.trim()] = data;
          return copy;
        });
        if (editSelectedCategory === oldName) setEditSelectedCategory(newName.trim());
        addAuditLog('تعديل فئة رئيسية', 'شجرة البنود والأبواب', `تم تعديل الفئة "${oldName}" إلى "${newName.trim()}".`);
      }
    });
  };

  const handleEditItemName = (catName: string, oldItemName: string) => {
    const newName = prompt(`أدخل الاسم الجديد للبند المالي الفرعي تحت (${catName}):`, oldItemName);
    if (!newName || !newName.trim() || newName.trim() === oldItemName) return;

    setConfirmState({
      isOpen: true,
      title: 'تعديل كود بند فرعي',
      message: `تحذير تعديل بند فرعي: هل أنت متأكد من تعديل مسمى البند من "${oldItemName}" إلى "${newName.trim()}"؟`,
      onConfirm: () => {
        setBenodTree(prev => {
          if (!prev[catName]) return prev;
          return {
            ...prev,
            [catName]: {
              ...prev[catName],
              items: prev[catName].items.map(it => it === oldItemName ? newName.trim() : it)
            }
          };
        });
        addAuditLog('تعديل كود بند فرعي', 'شجرة البنود والأبواب', `تم تعديل البند "${oldItemName}" إلى "${newName.trim()}".`);
      }
    });
  };

  const handleResetTree = () => {
    setConfirmState({
      isOpen: true,
      title: 'إعادة ضبط وضبط شجرة التكويد الميدانية',
      message: 'هل تأذن بإعادة ضبط شجرة التكويد الميدانية إلى وضعها الافتراضي للمشروع؟ سيمحو هذا كافة تخصيصاتك الفرعية.',
      onConfirm: () => {
        setBenodTree(BENOD_TREE);
        setEditSelectedCategory('رواتب');
        setFormCategory('رواتب');
        addAuditLog('إعادة ضبط شجرة البنود', 'شجرة البنود والأبواب', 'تمت استعادة النسخة المعتمدة الافتراضية بنجاح.');
      }
    });
  };

  // Report configurations
  // Closing day state: 2 corresponds to Tuesday
  const [closingDayIndex, setClosingDayIndex] = useState<number>(() => {
    const saved = localStorage.getItem('bunyan_closing_day_index');
    return saved !== null ? Number(saved) : 2; // Tuesday is default
  });

  useEffect(() => {
    localStorage.setItem('bunyan_closing_day_index', closingDayIndex.toString());
  }, [closingDayIndex]);

  // Signature configs
  const [sig1Title, setSig1Title] = useState(() => localStorage.getItem('bunyan_sig1_title') || 'المحاسب المالي');
  const [sig2Title, setSig2Title] = useState(() => localStorage.getItem('bunyan_sig2_title') || 'مهندس أول المشروع والمراجعة');
  const [sig3Title, setSig3Title] = useState(() => localStorage.getItem('bunyan_sig3_title') || 'مدير عام قطاع التنفيذ للمشاريع');
  
  const [sig1Name, setSig1Name] = useState(() => localStorage.getItem('bunyan_sig1_name') || '');
  const [sig2Name, setSig2Name] = useState(() => localStorage.getItem('bunyan_sig2_name') || '');
  const [sig3Name, setSig3Name] = useState(() => localStorage.getItem('bunyan_sig3_name') || '');

  useEffect(() => {
    localStorage.setItem('bunyan_sig1_title', sig1Title);
    localStorage.setItem('bunyan_sig2_title', sig2Title);
    localStorage.setItem('bunyan_sig3_title', sig3Title);
    localStorage.setItem('bunyan_sig1_name', sig1Name);
    localStorage.setItem('bunyan_sig2_name', sig2Name);
    localStorage.setItem('bunyan_sig3_name', sig3Name);
  }, [sig1Title, sig2Title, sig3Title, sig1Name, sig2Name, sig3Name]);

  const getWeekStartDate = (date: Date, closingDay: number): Date => {
    const startDayIndex = (closingDay + 1) % 7;
    const result = new Date(date);
    let attempts = 0;
    while (result.getDay() !== startDayIndex && attempts < 10) {
      result.setDate(result.getDate() - 1);
      attempts++;
    }
    return result;
  };

  const getAlignedStartDate = (dateStr: string, closingDay: number) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const aligned = getWeekStartDate(d, closingDay);
    return aligned.toISOString().split('T')[0];
  };

  const getWeeksWithTransactions = (txList: any[], closingDay: number) => {
    const weekStarts = new Set<string>();
    txList.forEach(tx => {
      if (tx.date) {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          const start = getWeekStartDate(d, closingDay);
          const startStr = start.toISOString().split('T')[0];
          weekStarts.add(startStr);
        }
      }
    });
    return Array.from(weekStarts).sort((a, b) => b.localeCompare(a));
  };

  const [startDate, setStartDate] = useState<string>(() => {
    return getAlignedStartDate(new Date().toISOString().split('T')[0], 2); // Default to current week
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Align startDate whenever closingDayIndex changes
  useEffect(() => {
    setStartDate(prev => getAlignedStartDate(prev, closingDayIndex));
  }, [closingDayIndex]);

  // Find all weeks that contain transactions
  const weeksWithTransactions = useMemo(() => {
    const list = getWeeksWithTransactions(transactions, closingDayIndex);
    const todayStart = getAlignedStartDate(new Date().toISOString().split('T')[0], closingDayIndex);
    if (!list.includes(todayStart)) {
      list.unshift(todayStart);
    }
    return list;
  }, [transactions, closingDayIndex]);

  const getAlignedEndDate = (startStr: string, closingDay: number) => {
    const d = new Date(startStr);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  };

  const formatDateArabic = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const [responsibleName, setResponsibleName] = useState<string>('محاسب الموقع');
  const [priorSpent, setPriorSpent] = useState<number>(0); // مرحل المنصرف
  const [priorBalance, setPriorBalance] = useState<number>(0); // مرحل الرصيد (deficit -430)
  const [custodyNote, setCustodyNote] = useState<string>('');
  const [balanceNote, setBalanceNote] = useState<string>('');
  const [totalSpentNote, setTotalSpentNote] = useState<string>('');
  
  // Daily Custody inputs (العهدة / وارد) - Map offset days starting from startDate
  const [custodyInputs, setCustodyInputs] = useState<{ [date: string]: number }>({});

  const [custodyDescriptions, setCustodyDescriptions] = useState<{ [date: string]: string }>({});

  // Manual transaction form states with smart matching
  const [formRecordType, setFormRecordType] = useState<'spent' | 'income'>('spent');
  const [formCategory, setFormCategory] = useState<string>('رواتب');
  const [formItem, setFormItem] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formRecipient, setFormRecipient] = useState<string>('');
  const [formIsExecuted, setFormIsExecuted] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // AI Analyzer States
  const [rawText, setRawText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [fileData, setFileData] = useState<{ base64?: string; name?: string; mimeType?: string }>({});
  const [analyzedTransactions, setAnalyzedTransactions] = useState<any[]>([]);
  const [analyzedMetadata, setAnalyzedMetadata] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'view' | 'upload'>('view');
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Generate 7 days starting from startDate
  const getReportDays = () => {
    const days = [];
    const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    for (let i = 0; i < 7; i++) {
      const current = new Date(startDate);
      current.setDate(current.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayIndex = current.getDay();
      days.push({
        date: dateStr,
        dayNameAr: arabicDayNames[dayIndex],
        dateFormatted: current.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })
      });
    }
    return days;
  };

  const reportDays = getReportDays();
  const endDate = reportDays[reportDays.length - 1]?.date || '';

  // State for Editing Row Item
  const [editingItem, setEditingItem] = useState<{
    ids: string[];
    description: string;
    recipient: string;
    category: ProjectCategory;
    type: TransactionType;
    values: { [date: string]: number };
  } | null>(null);

  const [editDescription, setEditDescription] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [editCategory, setEditCategory] = useState<ProjectCategory>('supplies');
  const [editValues, setEditValues] = useState<{ [date: string]: string }>({});

  const handleStartEditRow = (item: any) => {
    setEditingItem(item);
    setEditDescription(item.description);
    setEditRecipient(item.recipient);
    setEditCategory(item.category || 'supplies');
    const initialVals: { [date: string]: string } = {};
    reportDays.forEach(rd => {
      initialVals[rd.date] = item.values[rd.date] !== undefined ? item.values[rd.date].toString() : '';
    });
    setEditValues(initialVals);
  };

  const handleUpdateRecipient = (item: any, newRecipient: string) => {
    item.ids.forEach((id: string) => {
      const tx = transactions.find(t => t.id === id);
      if (tx && onUpdateTransaction) {
        onUpdateTransaction({ ...tx, recipient: newRecipient });
      }
    });
  };

  const handleUpdateNotes = (item: any, newNotes: string) => {
    item.ids.forEach((id: string) => {
      const tx = transactions.find(t => t.id === id);
      if (tx && onUpdateTransaction) {
        onUpdateTransaction({ ...tx, notes: newNotes });
      }
    });
  };

  const generateRefNo = (date: string) => {
    const datePart = date.replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `EXP-${datePart}-${randomPart}`;
  };

  const handleSaveChanges = () => {
    if (!editingItem) return;
    if (!editDescription.trim()) {
      setFormError('يرجى كتابة البيان / الاسم للبند أولاً!');
      return;
    }

    reportDays.forEach(rd => {
      const newValStr = editValues[rd.date];
      const newVal = newValStr !== undefined && newValStr.trim() !== '' ? Number(newValStr) : 0;

      const matchedTx = transactions.find(t => editingItem.ids.includes(t.id) && t.date === rd.date);

      if (matchedTx) {
        if (newVal > 0) {
          if (onUpdateTransaction) {
            onUpdateTransaction({
              ...matchedTx,
              description: editDescription.trim(),
              recipient: editRecipient.trim(),
              category: editCategory,
              amount: newVal
            });
          }
        } else {
          if (onDeleteTransaction) {
            onDeleteTransaction(matchedTx.id);
          }
        }
      } else {
        if (newVal > 0) {
          const refNo = generateRefNo(rd.date);
          onAddTransaction({
            date: rd.date,
            description: editDescription.trim(),
            recipient: editRecipient.trim(),
            category: editCategory,
            amount: newVal,
            type: editingItem.type || 'spent',
            nature: editingItem.nature || 'inside_custody',
            paymentMethod: 'اخرى',
            referenceNo: refNo,
            notes: refNo
          });
        }
      }
    });

    addAuditLog(
      'تحديث بند يدوي بالكشف',
      'كشف المصاريف الأسبوعي',
      `تم تعديل وتطبيق التحديثات على بند "${editingItem.description}" ليصبح باسم "${editDescription.trim()}" مع موازنة خلايا التفرغ بالجدول.`
    );

    setEditingItem(null);
    setFormSuccess('تم تحديث وحفظ كافة تعديلات البند وتفرغاته بنجاح!');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  const handleDeleteRow = (item: any) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف البند بالكامل من الدفاتر الحسابية',
      message: `تحذير هام جداً: هل أنت متأكد من رغبتك في حذف البند "${item.description}" بكافة تسجيلاته وحركاته المالية الموزعة على أيام الأركان بالأسبوع للتصفية (مجموعها ${item.total} ج.م)؟ سيتم محو هذا تماماً من الحسابات ودون تراجع!`,
      onConfirm: () => {
        item.ids.forEach((id: string) => {
          if (onDeleteTransaction) {
            onDeleteTransaction(id);
          }
        });
        addAuditLog(
          'حذف بند مالي من الكشف',
          'كشف المصاريف الأسبوعي',
          `تم إلغاء وحذف بند المصروف "${item.description}" بكامل حركاته المسجلة من الجدول المالي.`
        );
        setFormSuccess('تم حذف البند بالكامل من كشوف الحركات والمحاسبة بنجاح!');
        setTimeout(() => setFormSuccess(''), 4000);
      }
    });
  };

  const handleQuickAddClick = (catName: string) => {
    setFormCategory(catName);
    const firstItem = benodTree[catName]?.items[0] || '';
    setFormItem(firstItem);
    setFormRecipient(firstItem);
    const formElement = document.getElementById('toggle-tree-editor-btn');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Synchronize form values on category or record type selection change
  useEffect(() => {
    if (formRecordType === 'income') {
      setFormCategory('عهدة');
      setFormItem('استلام عهدة مالية / تمويل');
      setFormRecipient('المكتب الرئيسي');
    } else {
      const defaultList = benodTree[formCategory]?.items || [];
      if (defaultList.length > 0) {
        setFormItem(defaultList[0]);
        setFormRecipient(defaultList[0]);
      } else {
        setFormItem('');
        setFormRecipient('');
      }
    }
  }, [formCategory, benodTree, formRecordType]);

  // Synchronize date to start of week if invalid
  useEffect(() => {
    const dates = reportDays.map(rd => rd.date);
    if (!dates.includes(formDate)) {
      setFormDate(startDate);
    }
  }, [startDate]);

  // Week/period navigators
  const handlePrevWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handleJumpToPreset = (preset: string) => {
    if (preset === 'demo') {
      setStartDate('2026-01-21');
    } else if (preset === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
    } else if (preset === 'prev') {
      const prev = new Date();
      prev.setDate(prev.getDate() - 7);
      setStartDate(prev.toISOString().split('T')[0]);
    }
  };

  // Add validation and saving for manual expense items with specific day & date
  const handleAddManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    const qty = Number(formAmount);
    if (!formAmount || isNaN(qty) || qty <= 0) {
      setFormError('يرجى إدخال قيمة مالية صحيحة أكبر من الصفر.');
      return;
    }

    // Generate a reference number
    const refNo = generateRefNo(formDate);

    // Determine the mapped core ProjectCategory
    const mappedCore = benodTree[formCategory]?.coreCategory || 'supplies';
    
    // Construct description containing both the Category name and the Specific coded item
    const fullDescription = `${formCategory}: ${formItem}`;

    // Execute standard addition
    onAddTransaction({
      date: formDate,
      category: formRecordType === 'income' ? 'custody' : mappedCore,
      amount: qty,
      type: formRecordType === 'income' ? 'income' : (formIsExecuted ? 'executed_work' : 'spent'),
      nature: 'inside_custody', // Default to inside_custody for manual
      description: formRecordType === 'income' ? `وارد (إيداع/تمويل): ${fullDescription}` : fullDescription,
      recipient: formRecipient || formItem,
      paymentMethod: 'نقدى', // Default to نقدى
      notes: refNo,
      referenceNo: refNo
    });

    const actionText = formRecordType === 'income' ? 'تسجيل وارد جديد' : 'تسجيل بند مصروف يدوي';
    const dayName = reportDays.find(rd => rd.date === formDate)?.dayNameAr || '';
    addAuditLog(
      actionText,
      'كشف المصاريف الأسبوعي',
      `تم تسجيل بند [${formCategory} - ${formItem}] بقيمة ${qty} ج.م بمرجع ${refNo} ليوم ${dayName} الموافق ${formDate}.`
    );

    // Show success message and clear form
    setFormSuccess(`تم تسجيل القيد [${formItem}] بمرجع ${refNo} بقيمة ${qty} ج.م بنجاح!`);
    setFormAmount('');
  };

  // Classify system transactions inside the 7 days into report lines
  const filterAndClassifyTransactions = () => {
    const activeDates = reportDays.map(d => d.date);
    
    // Get transactions within target dates
    const filteredTxs = transactions.filter(tx => activeDates.includes(tx.date));

    // Grouping presets exactly matching picture categories:
    // 1. رواتب (Salaries Group)
    // 2. صيانة (Maintenance Group)
    // 3. انتقالات (Transport Group)
    // 4. منصرف_موقع (Office & Site Supplies Group)
    // 5. اكراميات (Tips Group)
    // 6. أخرى (Miscellaneous general)

    interface ReportItem {
      ids: string[];
      description: string;
      recipient: string;
      notes?: string;
      values: { [date: string]: number };
      total: number;
      category: ProjectCategory;
      type: TransactionType;
      nature: TransactionNature;
    }

    const categories = {
      salaries: { label: 'رواتب وعمال', items: [] as ReportItem[] },
      maintenance: { label: 'صيانة ومعدات', items: [] as ReportItem[] },
      transport: { label: 'انتقالات', items: [] as ReportItem[] },
      office: { label: 'منصرف_موقع', items: [] as ReportItem[] },
      grants: { label: 'إكراميات', items: [] as ReportItem[] },
      other: { label: 'أخرى ومصاريف عامة', items: [] as ReportItem[] }
    };

    // Helper to bucket transactions and sort them dynamically based on user manual entry descriptors
    filteredTxs.forEach(tx => {
      // ONLY include transactions that are explicitly 'inside_custody' AND NOT 'income'
      if (tx.nature !== 'inside_custody' || tx.type === 'income') return;

      const descLower = tx.description.toLowerCase();
      let targetGroup: keyof typeof categories = 'other';

      if (
        descLower.includes('رواتب') || 
        descLower.includes('راتب') || 
        descLower.includes('سائق') || 
        descLower.includes('حرس') || 
        descLower.includes('مساعد') || 
        descLower.includes('معيشة') || 
        descLower.includes('سهره') || 
        descLower.includes('أجور') ||
        descLower.includes('سهر') ||
        descLower.includes('عهدة')
      ) {
        targetGroup = 'salaries';
      } else if (
        descLower.includes('صيانة') || 
        descLower.includes('تصليح') || 
        descLower.includes('إصلاح') || 
        descLower.includes('سيارة') || 
        descLower.includes('فحص') || 
        descLower.includes('غيار') ||
        descLower.includes('غفرة') ||
        descLower.includes('كرفان') ||
        descLower.includes('إيجار') ||
        descLower.includes('الكرفانات') ||
        descLower.includes('معدات')
      ) {
        targetGroup = 'maintenance';
      } else if (
        descLower.includes('انتقال') || 
        descLower.includes('انتقالات') || 
        descLower.includes('سفر') || 
        descLower.includes('ترحيل') || 
        descLower.includes('توصيل')
      ) {
        targetGroup = 'transport';
      } else if (
        descLower.includes('منصرف') ||
        descLower.includes('موقع') || 
        descLower.includes('مستلزمات') || 
        descLower.includes('روتر') || 
        descLower.includes('نظافة') || 
        descLower.includes('تلفيات') || 
        descLower.includes('ضيافة') || 
        descLower.includes('تحويل') || 
        descLower.includes('متب') || 
        descLower.includes('مكتب') ||
        descLower.includes('علاقات عامة') ||
        descLower.includes('اختبارات') ||
        descLower.includes('باطن') ||
        descLower.includes('مقاولين')
      ) {
        targetGroup = 'office';
      } else if (
        descLower.includes('إكراميات') || 
        descLower.includes('إكرامية') || 
        descLower.includes('كرامية') || 
        descLower.includes('شاي') || 
        descLower.includes('قهوة')
      ) {
        targetGroup = 'grants';
      }

      // Check if we already have an item with this description in this group to consolidate or add unique row
      let existing = categories[targetGroup].items.find(i => i.description === tx.description && i.recipient === tx.recipient && i.notes === tx.notes);
      if (!existing) {
        existing = {
          ids: [],
          description: tx.description,
          recipient: tx.recipient,
          notes: tx.notes,
          values: {},
          total: 0,
          category: tx.category,
          type: tx.type,
          nature: tx.nature
        };
        categories[targetGroup].items.push(existing);
      }

      existing.ids.push(tx.id);
      existing.values[tx.date] = (existing.values[tx.date] || 0) + tx.amount;
      existing.total += tx.amount;
    });

    return categories;
  };

  const classified = filterAndClassifyTransactions();

  // Compute daily and overall totals
  const dailySpentTotals = reportDays.map(rd => {
    let sum = 0;
    Object.values(classified).forEach(group => {
      group.items.forEach(item => {
        sum += (item.values[rd.date] || 0);
      });
    });
    return { date: rd.date, total: sum };
  });

  const totalSpentThisWeek = dailySpentTotals.reduce((sum, d) => sum + d.total, 0);

  // Compute daily incoming custody from transactions
  const dailyIncomeTotals = reportDays.map(rd => {
    const incomeForDay = transactions
      .filter(tx => tx.date === rd.date && tx.type === 'income' && tx.nature === 'inside_custody')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { date: rd.date, total: incomeForDay };
  });

  const totalCustodyThisWeek = reportDays.reduce((sum, rd) => {
    const manualInput = custodyInputs[rd.date] || 0;
    const txIncome = dailyIncomeTotals.find(d => d.date === rd.date)?.total || 0;
    return sum + manualInput + txIncome;
  }, 0);

  // Math exactly replicating PDF page 1:
  // إجمالي المصروف التراكمي = مرحل المنصرف السابق + مصروف هذا الأسبوع
  const totalCumulativeSpent = priorSpent + totalSpentThisWeek;

  // إجمالي وارد العهدة المتاح = إجمالي العهدة الموزع + رصيد مرحل سابق
  const totalCustodyAvailable = totalCustodyThisWeek + priorBalance;

  // رصيد نهاية الأسبوع = إجمالي العهدة المتاح - إجمالي المنصرف لهذا الأسبوع
  const endOfWeekBalance = totalCustodyAvailable - totalSpentThisWeek;

  // Handle Drag-and-Drop file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFileData({
        base64: base64String,
        name: file.name,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini analysis on backend
  const handleAnalyzeReport = async () => {
    if (!rawText && !fileData.base64) {
      setErrorMessage('يرجى كتابة نص التقرير أو رفع صورة التقرير القديم لتحليله.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setImportSuccess(false);

    try {
      const response = await fetch('/api/gemini/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          textContent: rawText,
          fileBase64: fileData.base64,
          mimeType: fileData.mimeType
        })
      });

      if (!response.ok) {
        let errData;
        try { errData = await response.json(); } catch(e) {}
        throw new Error((errData && errData.error) || 'فشل الاتصال بخدمة التحليل المالي بالذكاء الاصطناعي.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let resultText = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          resultText += decoder.decode(value, { stream: true });
        }
      }
      
      let data: any = {};
      try {
        data = JSON.parse(resultText);
      } catch (e) {
        console.error("Failed to parse stream as JSON", e);
        throw new Error("فشل في تحليل المخرجات الواردة من الذكاء الاصطناعي.");
      }

      if (data.transactions) {
        setAnalyzedTransactions(data.transactions);
        if (data.reportMetadata) {
          setAnalyzedMetadata(data.reportMetadata);
          // Auto fill form attributes from analyzed report header if available
          if (data.reportMetadata.fromDate) setStartDate(data.reportMetadata.fromDate);
          if (data.reportMetadata.responsibleName) setResponsibleName(data.reportMetadata.responsibleName);
          if (data.reportMetadata.totalSpent) {
             // Fill default starting buffer
             setPriorSpent(10430); // Or map accordingly if cumulative was found
          }
        }
      } else {
        throw new Error('لم يتمكن المراجع الذكي من استخراج المعاملات بصيغة صحيحة.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء المعالجة.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Insert analyzed transactions into core App Transactions
  const handleImportTransactions = () => {
    if (analyzedTransactions.length === 0) return;

    const spentTxs = analyzedTransactions.filter(tx => 
      tx.type === 'spent' && 
      (tx.category === 'custody' || !!tx.paymentMethod?.includes('عهدة') || !!tx.description?.includes('عهد') || !!tx.recipient?.includes('عهد'))
    );
    spentTxs.forEach(tx => {
      const txDate = tx.date || new Date().toISOString().split('T')[0];
      const refNo = generateRefNo(txDate);
      onAddTransaction({
        date: txDate,
        category: (tx.category as ProjectCategory) || 'custody',
        amount: Number(tx.amount || 0),
        type: tx.type || 'spent',
        nature: 'inside_custody', // Default for imported as per requirement
        description: tx.description || 'مصروف مسجل بالذكاء الاصطناعي',
        recipient: tx.recipient || 'مستفيد مجهول',
        paymentMethod: 'نقدى' as PaymentMethod,
        referenceNo: refNo,
        notes: tx.notes ? `${tx.notes} (مرجع AI: ${refNo})` : `مرجع استيراد ذكي: ${refNo}`
      });
    });

    addAuditLog(
      'استيراد AI للتقرير المالي', 
      'المراجع والمدير الذكي للتقارير', 
      `تم نجاح تصفية واستخراج ${analyzedTransactions.length} حركة مالية من تقرير قديم للمشرف ${analyzedMetadata?.responsibleName || 'الموقع'}.`
    );

    setImportSuccess(true);
    setAnalyzedTransactions([]);
    setActiveSubTab('view');
  };

  // Trigger browser print dialog styled for paper/screen parity
  const handlePrint = () => {
    window.print();
  };

  let globalRowIndex = 0;

  return (
    <div className="bg-slate-50 min-h-screen" id="ai-weekly-report-tab-root">
      
      {/* Sub Tab Buttons */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('view')}
          className={`pb-3 font-bold text-sm text-right flex items-center gap-2 border-b-2 transition ${
            activeSubTab === 'view' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={18} />
          كشف المصاريف الأسبوعي
        </button>
        <button
          onClick={() => setActiveSubTab('upload')}
          className={`pb-3 font-bold text-sm text-right flex items-center gap-2 border-b-2 transition ${
            activeSubTab === 'upload' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={18} />
          تحليل بالذكاء الاصطناعي
        </button>
      </div>

      {activeSubTab === 'upload' ? (
        // AI Report Analysis Section
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={20} />
                المراجع الذكي بالـ AI
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                ارفع تقريراً قديماً ليقوم الذكاء الاصطناعي بتحليله وإدراجه في النظام.
              </p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-100 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              <span>Gemini 3.5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Input Form Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">رفع الملف المالي (صورة/ملف):</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                  <span className="block text-xs font-bold text-slate-700">اضغط للاختيار أو اسحب الملف هنا</span>
                  <span className="block text-[10px] text-slate-500 mt-1">يدعم الصور والمستندات (PDF , Excel , TXT)</span>
                  {fileData.name && (
                    <div className="mt-3 bg-emerald-50 text-emerald-800 text-xs py-1.5 px-3 rounded-lg border border-emerald-200 font-mono flex items-center justify-center gap-1.5">
                      <Check size={14} />
                      تم تحميل: {fileData.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px bg-slate-250 flex-1" />
                <span className="text-xs text-slate-400 font-bold">أو أدخل النص المستخرج</span>
                <div className="h-px bg-slate-250 flex-1" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">محتوى التقرير النصي:</label>
                  <button 
                    onClick={() => setRawText(SAMPLE_REPORT_TEXT)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-805 font-bold flex items-center gap-1"
                  >
                    <Plus size={12} />
                    تحميل تقرير للتجربة
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="انسخ وألصق هنا..."
                  rows={8}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  style={{ direction: 'rtl' }}
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handleAnalyzeReport}
                disabled={isAnalyzing}
                className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    قيد التحليل والمطابقة...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-450" />
                    تحليل ومطابقة بالـ AI
                  </>
                )}
              </button>
            </div>

            {/* Results Preview Column */}
            <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-xs mb-3 text-right">المعاملات المستخرجة ({analyzedTransactions.length} حركة):</h3>
                
                {analyzedTransactions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <Sparkles size={36} className="text-slate-350 stroke-1" />
                    <p className="text-xs font-bold text-slate-500">انتظار المراجعة...</p>
                    <p className="text-[10px] text-slate-400 max-w-xs">
                      ارفع الفاتورة أو انسخ الجدول واضغط "تحليل بالـ AI" لمراجعة الحركات وحفظها.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {analyzedMetadata && (
                      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-3 text-right space-y-1">
                        <p className="font-bold">📋 بيانات التقرير المستخرج:</p>
                        <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px]">
                          <div><strong>المسؤول:</strong> {analyzedMetadata.responsibleName || 'غير مكتوب'}</div>
                          <div><strong>الفترة:</strong> من {analyzedMetadata.fromDate} إلى {analyzedMetadata.toDate}</div>
                          <div><strong>المصروف التراكمي:</strong> {analyzedMetadata.totalSpent || 0} ج.م</div>
                        </div>
                      </div>
                    )}

                    {analyzedTransactions.map((tx, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl flex items-start gap-3 shadow-xs">
                        <div className={`p-1.5 rounded-lg text-xs font-bold leading-none ${
                          tx.category === 'custody' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          tx.category === 'equipment' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          tx.category === 'fuel' ? 'bg-red-50 text-red-700 border border-red-100' :
                          tx.category === 'contractors' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {tx.category === 'custody' && 'العهدة'}
                          {tx.category === 'equipment' && 'معدات'}
                          {tx.category === 'fuel' && 'محروقات'}
                          {tx.category === 'contractors' && 'باطن'}
                          {tx.category === 'supplies' && 'توريدات'}
                        </div>
                        <div className="flex-1 text-right text-xs">
                          <p className="font-bold text-slate-900 leading-normal">{tx.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono flex-wrap">
                            <span>المستفيد: {tx.recipient}</span>
                            <span>•</span>
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              Ref: {tx.id}
                            </span>
                          </div>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-slate-900 font-black text-sm">{tx.amount.toLocaleString('ar-EG')}</span>
                          <span className="text-[10px] text-slate-500 mr-0.5">ج.م</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {analyzedTransactions.length > 0 && (
                <div className="pt-4 border-t border-slate-200 mt-4 space-y-3">
                  <button
                    onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية استيراد الحسابات') : handleImportTransactions}
                    disabled={userRole === 'viewer'}
                    className={`w-full font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                      userRole === 'viewer'
                        ? 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Check size={16} />
                    تأكيد وإدراج هذه الحسابات في دفتر التطبيق المفتوح
                  </button>
                  <button 
                    onClick={() => setAnalyzedTransactions([])}
                    className="w-full bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold py-2 rounded-xl text-[11px] transition text-center"
                  >
                    تجاهل وتطهير الشاشة
                  </button>
                </div>
              )}
            </div>

          </div>

          {importSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 animate-fadeIn font-bold">
              <Check size={16} />
              <span>تهانينا! تمت تصفية وتعبئة الحسابات الإنشائية في كشف الحركات بنجاح. يمكنك الآن مراجعتها في المعاينة المباشرة أو الدفتر الأساسي.</span>
            </div>
          )}
        </div>
      ) : (
        
        // Dynamic Weekly Ledger Replica Viewer
        <div className="space-y-6">
          
          {/* Controls & Date Inputs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Calendar size={18} className="text-indigo-600" />
                  التحكم في الفترة الزمنية للتقرير والأسابيع الجارية
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  استخدم مفاتيح التنقل للتمرير أسبوعاً بأسبوع للخلف أو للأمام، أو اختر فترة جاهزة للمطابقة الفورية.
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-600">
                  <span>يوم تسوية وتقفيل الكشف الأسبوعي الرسمى للأرصدة والمصروفات:</span>
                  <select
                    value={closingDayIndex}
                    onChange={(e) => setClosingDayIndex(Number(e.target.value))}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-indigo-950 font-black rounded-lg p-1 px-1.5 focus:outline-none cursor-pointer text-[10px]"
                  >
                    <option value={0}>الأحد (يبدأ الإثنين)</option>
                    <option value={1}>الإثنين (يبدأ الثلاثاء)</option>
                    <option value={2}>الثلاثاء (يبدأ الأربعاء - الافتراضي)</option>
                    <option value={3}>الأربعاء (يبدأ الخميس)</option>
                    <option value={4}>الخميس (يبدأ الجمعة)</option>
                    <option value={5}>الجمعة (يبدأ السبت)</option>
                    <option value={6}>السبت (يبدأ الأحد)</option>
                  </select>
                </div>
              </div>
              
              {/* Quick Preset Jumper */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">انتقال سريع:</span>
                <button
                  onClick={() => handleJumpToPreset('demo')}
                  type="button"
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-1 rounded transition"
                >
                  كشف العينة (٢٠٢٦/٠١/٢١)
                </button>
                <button
                  onClick={() => handleJumpToPreset('today')}
                  type="button"
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2 py-1 rounded transition"
                >
                  الأسبوع الحالي (اليوم)
                </button>
                <button
                  onClick={() => handleJumpToPreset('prev')}
                  type="button"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded transition"
                >
                  الأسبوع الماضي
                </button>
              </div>
            </div>

            {/* Historical Active Weeks Panel - Placed ABOVE the direct inputs */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs flex-wrap">
              <div className="space-y-0.5 text-right flex-1">
                <span className="font-extrabold text-slate-900 block text-xs">📅 تصفح وتقليب أسابيع المشروع السابقة بالتسجيلات والبنود الميدانية:</span>
                <span className="text-[10px] text-slate-500 font-semibold block">يقوم النظام تلقائياً بتجميع كافة القيود السابقة في الحسابات الميدانية وتقسيمها إلى فترات أسبوعية تبدأ وتنتهي طبقاً ليوم الإغلاق المختار.</span>
              </div>
              <div className="flex items-center gap-2 flex-row-reverse self-stretch md:self-auto">
                <select
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-[11px] font-black rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono w-full md:w-[325px]"
                >
                  {weeksWithTransactions.map((wStart) => {
                    const wEnd = getAlignedEndDate(wStart, closingDayIndex);
                    const formattedStart = formatDateArabic(wStart);
                    const formattedEnd = formatDateArabic(wEnd);
                    const count = transactions.filter(tx => {
                      const txD = new Date(tx.date);
                      const sD = new Date(wStart);
                      const eD = new Date(wEnd);
                      return txD >= sD && txD <= eD;
                    }).length;
                    
                    return (
                      <option key={wStart} value={wStart} className="font-bold text-slate-900">
                        كشف الفترة من {formattedStart} إلى {formattedEnd} ({count} معاملة)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>تاريخ بداية أسبوع التقرير:</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={handlePrevWeek} 
                      title="الأسبوع السابق"
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      type="button"
                    >
                      <ChevronRight size={13} />
                    </button>
                    <button 
                      onClick={handleNextWeek} 
                      title="الأسبوع التالي"
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      type="button"
                    >
                      <ChevronLeft size={13} />
                    </button>
                  </div>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-slate-50 text-slate-800 font-bold font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <User size={14} className="text-slate-400" />
                  المسئول (صيد العهدة):
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-slate-50 text-slate-800 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">مرحل منصرف ج.م:</label>
                  <input
                    type="number"
                    value={priorSpent}
                    onChange={(e) => setPriorSpent(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-slate-50 text-slate-800 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">مرحل رصيد عهدة ج.م:</label>
                  <input
                    type="number"
                    value={priorBalance}
                    onChange={(e) => setPriorBalance(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-slate-50 text-slate-800 font-bold font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-3 rounded-lg text-xs border border-indigo-150 transition flex items-center justify-center gap-1.5 h-[36px]"
                >
                  <Printer size={15} />
                  تصدير وطباعة للتقارير الورقية
                </button>
              </div>
            </div>
          </div>

          {/* NEW: APPROVED CODING & MANUAL EXPENSE REGISTRATION FORM */}
          <div className="bg-[#0b0e14] border border-[#1a2333] rounded-[2rem] p-6 text-right text-slate-100 space-y-6 shadow-2xl relative overflow-hidden isolate">
            
            {/* Background glowing orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#1a2333] gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-2xl shadow-lg shadow-orange-500/20">
                  <Sparkles size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-amber-400 tracking-wide">تكويد وتسجيل منصرف مالي جديد باليوم والتاريخ</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">اختر فئة الباب المكود واليوم التفصيلي لتفرغه تلقائياً بدقة بالجدول الحسابي أدناه.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="px-3 py-1.5 text-[10px] bg-[#1a2333] border border-[#2a3441] text-indigo-300 font-black rounded-lg uppercase tracking-wider backdrop-blur-md">لوحة تحكم مشفرة</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTreeEditor(!showTreeEditor);
                    if (benodTree[formCategory]) {
                      setEditSelectedCategory(formCategory);
                    }
                  }}
                  className="px-4 py-2 bg-[#131b26] hover:bg-[#1a2333] text-amber-400 border border-amber-500/30 text-[11px] font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-black/20"
                  id="toggle-tree-editor-btn"
                >
                  <Settings size={14} className={showTreeEditor ? "rotate-90 transition-transform" : "transition-transform"} /> 
                  {showTreeEditor ? 'إغلاق شجرة الأكواد' : 'تعديل وإدارة شجرة البنود (ترميز الأسعار)'}
                </button>
              </div>
            </div>

            {/* EXPANDED INTERACTIVE BOND DYNAMIC TREE CONFIGURATION PANEL */}
            {showTreeEditor && (
              <div className="p-6 bg-[#131b26] rounded-2xl border border-[#2a3441] space-y-6 animate-scaleUp text-right relative z-10 shadow-inner">
                <div className="flex items-center justify-between pb-4 border-b border-[#2a3441]">
                  <div>
                    <h5 className="text-[13px] font-black text-amber-400">منصة التحكم وتعديل بنود الفهرسة وأبواب التشفير الرسمية</h5>
                    <p className="text-[11px] text-slate-400 mt-1">يمكنك إضافة فئات أبواب جديدة، ربطها بدفتر حسابات الـ ERP، أو إدارة البنود المعتمدة بمرونة.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTree}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold rounded-xl transition-all"
                  >
                    إعادة الشجرة الافتراضية ⟲
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category lists and assignments control */}
                  <div className="md:col-span-1 space-y-4 border-l border-[#2a3441] pl-6">
                    <span className="block text-[12px] text-indigo-300 font-black tracking-wide">1. تعديل الأبواب (الفئات)</span>
                    
                    {/* Tiny Creation line */}
                    <form onSubmit={handleAddCategory} className="space-y-3">
                      <input
                        type="text"
                        placeholder="اسم فئة جديدة (مثلا: بوفيه)"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full text-xs p-3 bg-[#0b0e14] border border-[#2a3441] rounded-xl placeholder-slate-600 text-white font-bold focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newCategoryCore}
                          onChange={(e) => setNewCategoryCore(e.target.value as ProjectCategory)}
                          className="flex-1 text-xs p-3 bg-[#0b0e14] border border-[#2a3441] text-slate-300 rounded-xl focus:outline-none focus:border-amber-400 transition-colors shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[left_0.75rem_center] bg-no-repeat"
                        >
                          <option value="supplies">التوريدات ومواد الموقع</option>
                          <option value="equipment">صيانة وإيجار المعدات</option>
                          <option value="contractors">مقاولي الباطن</option>
                          <option value="fuel">المحروقات والسولار</option>
                          <option value="custody">العهد المالية بالموقع</option>
                        </select>
                        <button
                          type="submit"
                          className="px-4 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg active:scale-95"
                        >
                          + إضافة
                        </button>
                      </div>
                    </form>

                    {/* Scrollable list of categories */}
                    <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2 mt-4">
                      {Object.keys(benodTree).map((catName) => {
                        const isChosen = editSelectedCategory === catName;
                        const coreLabelAr = 
                          benodTree[catName].coreCategory === 'custody' ? 'عهد' :
                          benodTree[catName].coreCategory === 'equipment' ? 'معدات' :
                          benodTree[catName].coreCategory === 'supplies' ? 'توريدات' :
                          benodTree[catName].coreCategory === 'fuel' ? 'وقود' : 'مقاولين';
                        
                        return (
                          <div
                            key={catName}
                            onClick={() => setEditSelectedCategory(catName)}
                            className={`flex items-center justify-between p-2.5 px-3.5 rounded-xl cursor-pointer transition-all text-[11px] font-bold ${
                              isChosen 
                                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm' 
                                : 'bg-[#0b0e14] hover:bg-[#1a2333] text-slate-300 border border-[#2a3441]'
                            }`}
                          >
                            <span className="truncate">{catName}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#1a2333] border border-[#2a3441] text-indigo-300 rounded-md tracking-wider">
                                {coreLabelAr}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCategoryName(catName);
                                }}
                                className="text-slate-500 hover:text-amber-400 text-[12px] font-bold transition-colors"
                                title="تعديل مسمى الباب"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCategory(catName);
                                }}
                                className="text-slate-500 hover:text-rose-500 px-1 font-bold text-[14px] transition-colors"
                                title="حذف الباب بالكامل"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subitems pills manage */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between bg-[#0b0e14] p-3 border border-[#2a3441] rounded-xl">
                      <span className="text-[12px] text-slate-300 font-bold">
                        2. البنود المعتمدة تحت الباب: <span className="text-amber-400 mx-1 px-2 py-0.5 bg-amber-400/10 rounded-md">"{editSelectedCategory}"</span>
                      </span>
                      <span className="text-[11px] text-indigo-400 font-black px-2 py-1 bg-indigo-500/10 rounded-lg">
                        {(benodTree[editSelectedCategory]?.items || []).length} بنود
                      </span>
                    </div>

                    {/* Add new item to selected category form */}
                    <form onSubmit={handleAddItem} className="flex gap-3">
                      <input
                        type="text"
                        required
                        placeholder="اكتب اسم بند جديد بالتحديد (مثال: عمال إضافيين)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1 text-xs p-3 px-4 bg-[#0b0e14] border border-[#2a3441] rounded-xl placeholder-slate-600 text-white font-bold focus:outline-none focus:border-indigo-400 transition-colors shadow-inner"
                      />
                      <button
                        type="submit"
                        className="px-6 bg-[#1a2333] hover:bg-[#2a3441] text-indigo-400 border border-indigo-500/30 text-xs font-black rounded-xl transition-all whitespace-nowrap shadow-lg active:scale-95"
                      >
                        + إدراج كود بند
                      </button>
                    </form>

                    {/* Pill items listing with delete capability */}
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1 mt-4 p-4 bg-[#0b0e14] rounded-xl border border-[#2a3441] min-h-[100px]">
                      {(benodTree[editSelectedCategory]?.items || []).length === 0 ? (
                        <div className="w-full text-center p-8 text-slate-500 text-xs font-medium content-center">
                          لا توجد أكواد أو بنود مضافة تحت هذه الفئة بعد.
                        </div>
                      ) : (
                        (benodTree[editSelectedCategory]?.items || []).map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2333] border border-[#2a3441] rounded-xl text-[11px] font-bold text-slate-200 hover:border-indigo-500/50 transition-colors group"
                          >
                            <span>{it}</span>
                            <div className="flex items-center gap-1.5 border-r border-[#2a3441] pr-2 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleEditItemName(editSelectedCategory, it)}
                                className="text-slate-400 hover:text-indigo-400 font-bold cursor-pointer text-[12px]"
                                title="تعديل مسمى البند الفرعي"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(editSelectedCategory, it)}
                                className="text-slate-500 hover:text-rose-500 font-bold cursor-pointer text-sm leading-none"
                                title="حذف هذا البند بالتحديد"
                              >
                                ×
                              </button>
                            </div>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center text-xs text-emerald-400 font-bold">
                   <CheckCircle className="inline-block w-4 h-4 mr-2 mb-0.5" />
                   تم تفعيل شجرة البنود المعدلة تلقائياً، ستنعكس فورا بجميع الدفاتر.
                </div>
              </div>
            )}

            <form id="expense-form-element" onSubmit={handleAddManualExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end bg-[#131b26]/80 p-6 rounded-[1.5rem] border border-[#2a3441] shadow-2xl relative z-10 backdrop-blur-xl">
              
              {/* Transaction Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1.5">
                  <Menu className="h-3.5 w-3.5 text-orange-400" />
                  1. نوع القيد:
                </label>
                <select
                  value={formRecordType}
                  onChange={(e) => setFormRecordType(e.target.value as 'spent' | 'income')}
                  className="w-full bg-[#0b0e14] border border-[#2a3441] rounded-xl p-3.5 text-right text-[13px] font-bold text-white focus:ring-2 focus:ring-orange-500/20 outline-none focus:border-orange-500 transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[left_0.75rem_center] bg-no-repeat"
                >
                  <option value="spent" className="bg-[#131b26]">سجل منصرف (دفع)</option>
                  <option value="income" className="bg-[#131b26]">تسجيل وارد (تمويل عهدة)</option>
                </select>
              </div>

              {/* Day & Date Selection inside the current week */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  2. التاريخ:
                </label>
                <select
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#2a3441] rounded-xl p-3.5 text-right text-[13px] font-bold text-white focus:ring-2 focus:ring-amber-500/20 outline-none focus:border-amber-500 transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[left_0.75rem_center] bg-no-repeat"
                >
                  {reportDays.map((rd, i) => (
                    <option key={i} value={rd.date} className="bg-[#131b26] text-[13px]">
                      {rd.dayNameAr} ({rd.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* General Category Section - Map items from benodTree */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1.5">
                  <Menu className="h-3.5 w-3.5 text-indigo-400" />
                  3. الفئة:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  disabled={formRecordType === 'income'}
                  className="w-full bg-[#0b0e14] border border-[#2a3441] rounded-xl p-3.5 text-right text-[13px] font-bold text-white focus:ring-2 focus:ring-indigo-500/20 outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none disabled:opacity-50 disabled:cursor-not-allowed bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[left_0.75rem_center] bg-no-repeat"
                >
                  {formRecordType === 'income' ? (
                    <option value="وارد" className="bg-[#131b26] text-[13px] text-right">وارد وتمويلات</option>
                  ) : (
                    Object.keys(benodTree).map((category, idx) => (
                      <option key={idx} value={category} className="bg-[#131b26] text-[13px] text-right">
                        {category}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Dynamic subitems retrieved from dynamic benodTree */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                   4. البند:
                </label>
                <select
                  value={formItem}
                  onChange={(e) => {
                    setFormItem(e.target.value);
                    setFormRecipient(e.target.value);
                  }}
                  disabled={formRecordType === 'income'}
                  className="w-full bg-[#0b0e14] border border-[#2a3441] rounded-xl p-3.5 text-right text-[13px] font-bold text-white focus:ring-2 focus:ring-emerald-500/20 outline-none focus:border-emerald-500 transition-all shadow-inner appearance-none disabled:opacity-50 disabled:cursor-not-allowed bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[left_0.75rem_center] bg-no-repeat"
                >
                  {formRecordType === 'income' ? (
                     <option value="استلام عهدة مالية / تمويل" className="bg-[#131b26] text-[13px] text-right">استلام عهدة مالية / تمويل</option>
                  ) : (
                    (benodTree[formCategory]?.items || []).map((item, idx) => (
                      <option key={idx} value={item} className="bg-[#131b26] text-[13px] text-right">
                        {item}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Amount value */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-rose-400" />
                  5. القيمة:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="٠.٠٠"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[#2a3441] rounded-xl p-3.5 text-center text-[15px] font-mono font-black text-rose-400 focus:ring-2 focus:ring-rose-500/20 outline-none focus:border-rose-500 transition-all shadow-inner"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">ج.م</span>
                </div>
              </div>

              {/* Recipient / Owner of cash */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  6. المستفيد / المصدر:
                </label>
                <input
                  type="text"
                  required
                  placeholder={formRecordType === 'income' ? "المكتب الرئيسي / الصراف..." : "اسم المستفيد..."}
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#2a3441] rounded-xl p-3.5 text-right text-[13px] font-bold text-white focus:ring-2 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all shadow-inner"
                />
              </div>

              {/* Save Button */}
              <div className="relative z-10">
                <button
                  type="submit"
                  disabled={userRole === 'viewer'}
                  onClick={userRole === 'viewer' ? (e) => { e.preventDefault(); alert('عذراً، لا تملك صلاحية التسجيل'); } : undefined}
                  className={`w-full h-[50px] font-black rounded-xl text-[14px] transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 ${
                    userRole === 'viewer'
                      ? 'bg-[#1a2333] text-slate-500 cursor-not-allowed shadow-none border border-[#2a3441]'
                      : 'bg-gradient-to-r from-[#ff5100] to-[#ff7b00] hover:from-[#e64a00] hover:to-[#e66f00] text-white shadow-orange-500/25 shadow-inner'
                  }`}
                >
                  <Plus size={18} className="stroke-[3]" />
                  تسجيل
                </button>
              </div>

            </form>

            {/* Error or Success Toast with Animation */}
            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-[13px] flex items-center gap-3 animate-fadeIn font-extrabold relative z-10 shadow-lg">
                <CheckCircle size={20} className="text-emerald-400 drop-shadow-md" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="bg-rose-900/30 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn font-bold font-sans">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}
          </div>

          {/* PRINT-READY CONTAINER WITH STRICT ACCENT ACCORDANCE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 overflow-x-auto print:border-none print:shadow-none print:p-0" id="print-canvas">
            
            {/* Header Yellow Blocks exactly styled like page 1 image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 border border-slate-300 rounded-lg p-4 bg-slate-50/50 print:border-slate-400 font-sans">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-amber-100 border border-amber-300 text-center py-2 px-1 rounded-sm text-xs font-bold text-amber-900">
                    <span className="block text-[9px] text-amber-700 font-bold">مرحل المنصرف</span>
                    <span className="font-bold font-mono text-xs">{priorSpent.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="bg-emerald-100 border border-emerald-300 text-center py-2 px-1 rounded-sm text-xs font-bold text-emerald-955">
                    <span className="block text-[9px] text-emerald-700 font-bold">إجمالي المصروف التراكمي</span>
                    <span className="font-bold font-mono text-xs">{totalCumulativeSpent.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="bg-red-50 border border-red-300 text-center py-2 px-1 rounded-sm text-xs font-bold text-red-900">
                    <span className="block text-[9px] text-red-700 font-bold">مرحل الرصيد</span>
                    <span className="font-bold font-mono text-xs">{priorBalance.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                </div>
                <div className="bg-amber-100/50 border border-amber-200 py-1.5 px-3 rounded-sm flex justify-between items-center text-xs text-amber-955 font-bold font-sans">
                  <span>اسم المندوب المسؤول:</span>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="bg-transparent border-b border-amber-300 text-right focus:outline-none w-1/2 pr-1 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between items-center border border-slate-200/80 bg-white p-2 rounded-sm text-xs text-slate-700 font-bold font-sans">
                  <span>تاريخ بداية الكشف (من):</span>
                  <span className="bg-amber-400 py-1 px-2.5 rounded-sm font-bold text-slate-950">{startDate}</span>
                </div>
                <div className="flex justify-between items-center border border-slate-200/80 bg-white p-2 rounded-sm text-xs text-slate-700 font-bold font-sans">
                  <span>تاريخ نهاية الكشف (إلى):</span>
                  <span className="bg-amber-400 py-1 px-2.5 rounded-sm font-bold text-slate-950">{endDate}</span>
                </div>
              </div>
            </div>

            {/* Classical Arabic Grid Layout Table */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
              <table className="w-full text-right border-collapse text-xs font-sans" style={{ minWidth: '950px' }}>
                <thead>
                  {/* Row Dates Header */}
                  <tr className="bg-slate-800 text-white font-bold">
                    <th rowSpan={2} className="border border-slate-700 p-3 text-center w-10">م</th>
                    <th rowSpan={2} className="border border-slate-700 p-3 text-center w-64 text-[13px]">البيان</th>
                    <th rowSpan={2} className="border border-slate-700 p-3 text-center w-24 text-[11px] text-slate-300">مرحل البند</th>
                    <th colSpan={7} className="border border-slate-700 p-1.5 text-center text-[11px] bg-slate-900 tracking-wider">التاريخ اليومي التفصيلي</th>
                    <th rowSpan={2} className="border border-slate-700 p-3 text-center w-24 text-[13px] bg-slate-900/50">الإجمالي</th>
                    <th rowSpan={2} className="border border-slate-700 p-3 text-center w-32">ملاحظات</th>
                    <th rowSpan={2} className="border border-slate-700 p-3 text-center w-24 no-print text-[11px] text-slate-400">خيارات</th>
                  </tr>
                  <tr className="bg-slate-800/90 text-slate-200 font-mono text-[10px] text-center border-b-2 border-slate-900">
                    {reportDays.map((rd, idx) => (
                      <th key={idx} className="border border-slate-700 p-2 font-bold hover:bg-slate-700 transition-colors">
                        <span className="block text-white text-[11px] font-sans pb-1">{rd.dayNameAr}</span>
                        <span className="block text-slate-400 font-medium text-[9px]">{rd.dateFormatted}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  
                  {/* Render Salaries Items */}
                  {classified.salaries.items.map((item, index) => {
                    globalRowIndex++;
                    return (
                      <tr key={`sal-${index}`} className="hover:bg-amber-100 transition bg-amber-50/40">
                        <td className="border border-slate-400 p-1.5 text-center text-[10px] text-slate-400 font-mono">{globalRowIndex}</td>
                        <td className="border border-slate-400 p-1.5 font-bold text-slate-800">{item.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-400">-</td>
                        {reportDays.map((rd, i) => (
                          <td key={i} className="border border-slate-400 p-1.5 text-center font-mono">
                            {item.values[rd.date] ? item.values[rd.date].toLocaleString('ar-EG') : ''}
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-slate-900 bg-amber-50/20">{item.total.toLocaleString('ar-EG')}</td>
                        <td className="border border-slate-400 p-0 text-[10px] text-slate-500 font-sans">
                          <input
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item, e.target.value)}
                            className="w-full h-full p-1.5 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-amber-600 cursor-pointer'
                              }`}
                              title="تعديل البند بالكامل"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-rose-600 cursor-pointer'
                              }`}
                              title="حذف البند وتصفية حركاته"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Render Maintenance Items */}
                  {classified.maintenance.items.map((item, index) => {
                    globalRowIndex++;
                    return (
                      <tr key={`maint-${index}`} className="hover:bg-sky-100 transition bg-sky-50/40">
                        <td className="border border-slate-400 p-1.5 text-center text-[10px] text-slate-400 font-mono">{globalRowIndex}</td>
                        <td className="border border-slate-400 p-1.5 font-bold text-slate-800">{item.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-400">-</td>
                        {reportDays.map((rd, i) => (
                          <td key={i} className="border border-slate-400 p-1.5 text-center font-mono">
                            {item.values[rd.date] ? item.values[rd.date].toLocaleString('ar-EG') : ''}
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-slate-900 bg-sky-50/20">{item.total.toLocaleString('ar-EG')}</td>
                        <td className="border border-slate-400 p-0 text-[10px] text-slate-500 font-sans">
                          <input
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item, e.target.value)}
                            className="w-full h-full p-1.5 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-amber-600 cursor-pointer'
                              }`}
                              title="تعديل البند بالكامل"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-rose-600 cursor-pointer'
                              }`}
                              title="حذف البند وتصفية حركاته"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Render Transport Items */}
                  {classified.transport.items.map((item, index) => {
                    globalRowIndex++;
                    return (
                      <tr key={`trans-${index}`} className="hover:bg-emerald-100 transition bg-emerald-50/40">
                        <td className="border border-slate-400 p-1.5 text-center text-[10px] text-slate-400 font-mono">{globalRowIndex}</td>
                        <td className="border border-slate-400 p-1.5 font-bold text-slate-800">{item.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-400">-</td>
                        {reportDays.map((rd, i) => (
                          <td key={i} className="border border-slate-400 p-1.5 text-center font-mono">
                            {item.values[rd.date] ? item.values[rd.date].toLocaleString('ar-EG') : ''}
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-slate-900 bg-emerald-50/20">{item.total.toLocaleString('ar-EG')}</td>
                        <td className="border border-slate-400 p-0 text-[10px] text-slate-500 font-sans">
                          <input
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item, e.target.value)}
                            className="w-full h-full p-1.5 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-amber-600 cursor-pointer'
                              }`}
                              title="تعديل البند بالكامل"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-rose-600 cursor-pointer'
                              }`}
                              title="حذف البند وتصفية حركاته"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Render Office Items */}
                  {classified.office.items.map((item, index) => {
                    globalRowIndex++;
                    return (
                      <tr key={`off-${index}`} className="hover:bg-purple-100 transition bg-purple-50/40">
                        <td className="border border-slate-400 p-1.5 text-center text-[10px] text-slate-400 font-mono">{globalRowIndex}</td>
                        <td className="border border-slate-400 p-1.5 font-bold text-slate-800">{item.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-400">-</td>
                        {reportDays.map((rd, i) => (
                          <td key={i} className="border border-slate-400 p-1.5 text-center font-mono">
                            {item.values[rd.date] ? item.values[rd.date].toLocaleString('ar-EG') : ''}
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-slate-900 bg-purple-50/20">{item.total.toLocaleString('ar-EG')}</td>
                        <td className="border border-slate-400 p-0 text-[10px] text-slate-500 font-sans">
                          <input
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item, e.target.value)}
                            className="w-full h-full p-1.5 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-amber-600 cursor-pointer'
                              }`}
                              title="تعديل البند بالكامل"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-rose-600 cursor-pointer'
                              }`}
                              title="حذف البند وتصفية حركاته"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Render Grants Items */}
                  {classified.grants.items.map((item, index) => {
                    globalRowIndex++;
                    return (
                      <tr key={`grant-${index}`} className="hover:bg-rose-100 transition bg-rose-50/40">
                        <td className="border border-slate-400 p-1.5 text-center text-[10px] text-slate-400 font-mono">{globalRowIndex}</td>
                        <td className="border border-slate-400 p-1.5 font-bold text-slate-800">{item.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-400">-</td>
                        {reportDays.map((rd, i) => (
                          <td key={i} className="border border-slate-400 p-1.5 text-center font-mono">
                            {item.values[rd.date] ? item.values[rd.date].toLocaleString('ar-EG') : ''}
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-slate-900 bg-rose-50/20">{item.total.toLocaleString('ar-EG')}</td>
                        <td className="border border-slate-400 p-0 text-[10px] text-slate-500 font-sans">
                          <input
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item, e.target.value)}
                            className="w-full h-full p-1.5 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-amber-600 cursor-pointer'
                              }`}
                              title="تعديل البند بالكامل"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-rose-600 cursor-pointer'
                              }`}
                              title="حذف البند وتصفية حركاته"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Render Other Items */}
                  {classified.other.items.length > 0 && classified.other.items.map((item, index) => {
                    globalRowIndex++;
                    return (
                      <tr key={`oth-${index}`} className="hover:bg-slate-50 transition">
                        <td className="border border-slate-400 p-1.5 text-center text-[10px] text-slate-400 font-mono">{globalRowIndex}</td>
                        <td className="border border-slate-400 p-1.5 font-bold text-slate-800">{item.description}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono text-slate-400">-</td>
                        {reportDays.map((rd, i) => (
                          <td key={i} className="border border-slate-400 p-1.5 text-center font-mono">
                            {item.values[rd.date] ? item.values[rd.date].toLocaleString('ar-EG') : ''}
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 text-center font-mono font-bold text-slate-900 bg-slate-100">{item.total.toLocaleString('ar-EG')}</td>
                        <td className="border border-slate-400 p-0 text-[10px] text-slate-500 font-sans">
                          <input
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item, e.target.value)}
                            className="w-full h-full p-1.5 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center no-print text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => handleStartEditRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-amber-600 cursor-pointer'
                              }`}
                              title="تعديل البند بالكامل"
                            >
                              <FileEdit size={13} />
                            </button>
                            <button
                              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteRow(item)}
                              className={`p-1 rounded transition ${
                                userRole === 'viewer'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'hover:bg-slate-200/80 text-rose-600 cursor-pointer'
                              }`}
                              title="حذف البند وتصفية حركاته"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty state disclaimer when no entries exist */}
                  {globalRowIndex === 0 && (
                    <tr className="text-slate-400 italic">
                      <td colSpan={12} className="border border-slate-400 p-2 text-center text-[11px]">لا يوجد أي بنود حركة مسجلة هذا الأسبوع في التواريخ المحددة.</td>
                      <td className="border border-slate-400 p-2 no-print text-center text-[11px]">-</td>
                    </tr>
                  )}

                  {/* Row: إجمالي المنصرف (Orange block) */}
                  <tr className="bg-orange-50 text-orange-950 font-black border border-slate-400 font-sans text-xs">
                    <td colSpan={2} className="border border-slate-400 p-2 text-right">إجمالي المنصرف</td>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">-</td>
                    {dailySpentTotals.map((dst, i) => (
                      <td key={i} className="border border-slate-400 p-2 text-center font-mono bg-orange-100/50">
                        {dst.total > 0 ? dst.total.toLocaleString('ar-EG') : '٠'}
                      </td>
                    ))}
                    <td className="border border-slate-400 p-2 text-center font-mono bg-orange-200/50 text-sm font-black underline decoration-double">
                      {totalSpentThisWeek.toLocaleString('ar-EG')}
                    </td>
                    <td className="border border-slate-400 p-0 opacity-80 font-sans text-[10px]">
                      <input
                        value={totalSpentNote}
                        onChange={(e) => setTotalSpentNote(e.target.value)}
                        className="w-full h-full p-1.5 bg-transparent focus:outline-none text-right"
                      />
                    </td>
                    <td className="border border-slate-400 p-1.5 no-print text-center font-mono font-bold bg-orange-100/50">-</td>
                  </tr>

                  {/* Row: إجمالي العهدة والوارد (Green Block) - Read-only from Tx */}
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border border-emerald-200 text-[13px] shadow-sm">
                    <td colSpan={2} className="border border-emerald-200 p-3 text-right">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-800">إجمالي العهدة السابقة والوارد المالي</span>
                        <Coins size={14} className="text-emerald-500" />
                      </div>
                    </td>
                    <td className="border border-emerald-200 p-0 font-mono text-center bg-emerald-100/60 transition-colors">
                      <input
                        type="number"
                        value={priorBalance || ''}
                        onChange={(e) => setPriorBalance(Number(e.target.value))}
                        className="w-full h-full p-2 text-center bg-transparent focus:outline-none focus:bg-emerald-100/80 text-emerald-950 font-black"
                        placeholder="السابق..."
                      />
                    </td>
                    {reportDays.map((rd, i) => {
                      const txIncome = dailyIncomeTotals.find(d => d.date === rd.date)?.total || 0;
                      return (
                        <td key={i} className="border border-emerald-200 p-2 text-center font-mono bg-emerald-50/50 font-bold text-emerald-900 border-x border-emerald-100">
                          {txIncome > 0 ? txIncome.toLocaleString('ar-EG') : <span className="text-emerald-300">-</span>}
                        </td>
                      );
                    })}
                    <td className="border border-emerald-200 p-3 text-center font-mono bg-emerald-600 text-white text-[15px] font-black shadow-inner">
                      {totalCustodyAvailable.toLocaleString('ar-EG')}
                    </td>
                    <td className="border border-emerald-200 p-0 opacity-90 text-[11px] bg-emerald-50/30">
                      <input
                        value={custodyNote}
                        onChange={(e) => setCustodyNote(e.target.value)}
                        className="w-full h-full p-2 bg-transparent focus:outline-none text-right placeholder:text-emerald-300"
                        placeholder="ملاحظات العهدة..."
                      />
                    </td>
                    <td className="border border-emerald-200 p-2 no-print text-center font-mono font-bold bg-emerald-100/40">
                      <CheckCircle size={14} className="mx-auto text-emerald-500" />
                    </td>
                  </tr>

                  {/* Row: رصيد نهاية الأسبوع */}
                  <tr className="bg-sky-50/60 text-sky-950 font-black border border-slate-400 text-xs text-center">
                    <td colSpan={2} className="border border-slate-400 p-2.5 text-right text-sm">رصيد نهاية الأسبوع</td>
                    <td className="border border-slate-400 p-2.5 font-mono text-center text-slate-400">-</td>
                    <td colSpan={7} className="border border-slate-400 p-2.5 font-bold text-center">-</td>
                    <td className="border border-slate-400 p-2.5 font-mono text-base font-black bg-sky-100/40">
                      {endOfWeekBalance.toLocaleString('ar-EG')}
                    </td>
                    <td className="border border-slate-400 p-0 text-center font-bold text-sm bg-sky-200/20">
                      <input
                        value={balanceNote || ''}
                        onChange={(e) => setBalanceNote(e.target.value)}
                        className="w-full h-full p-1.5 bg-transparent focus:outline-none text-center"
                      />
                    </td>
                    <td className="border border-slate-400 p-2.5 no-print text-center font-mono font-bold text-sky-600/40">-</td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Classical signature blocks exact layout at footer of image */}
            <div className="grid grid-cols-3 gap-6 text-center mt-8 border-t border-slate-200 pt-6 font-sans text-slate-800">
              <div className="space-y-4">
                <input 
                  type="text"
                  value={sig1Title}
                  onChange={(e) => setSig1Title(e.target.value)}
                  className="block w-full text-center font-black text-xs text-slate-900 bg-slate-100/50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-400 py-1.5 rounded-md outline-none transition-all print:bg-slate-100 print:border-none"
                />
                <input 
                  type="text"
                  value={sig1Name}
                  onChange={(e) => setSig1Name(e.target.value)}
                  placeholder="......................."
                  className="block w-full text-center text-xs font-bold text-indigo-700 bg-transparent hover:bg-slate-50 focus:bg-slate-50 border border-transparent focus:border-indigo-200 py-1 rounded outline-none transition-all placeholder:text-slate-400 print:placeholder:text-transparent print:bg-transparent print:border-none"
                />
                <div className="border-b border-dashed border-slate-300 w-2/3 mx-auto h-2" />
                <span className="block text-[10px] text-slate-400 font-bold">التوقيع والختم</span>
              </div>
              <div className="space-y-4">
                <input 
                  type="text"
                  value={sig2Title}
                  onChange={(e) => setSig2Title(e.target.value)}
                  className="block w-full text-center font-black text-xs text-slate-900 bg-slate-100/50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-400 py-1.5 rounded-md outline-none transition-all print:bg-slate-100 print:border-none"
                />
                <input 
                  type="text"
                  value={sig2Name}
                  onChange={(e) => setSig2Name(e.target.value)}
                  placeholder="......................."
                  className="block w-full text-center text-xs font-bold text-indigo-700 bg-transparent hover:bg-slate-50 focus:bg-slate-50 border border-transparent focus:border-indigo-200 py-1 rounded outline-none transition-all placeholder:text-slate-400 print:placeholder:text-transparent print:bg-transparent print:border-none"
                />
                <div className="border-b border-dashed border-slate-300 w-2/3 mx-auto h-2" />
                <span className="block text-[10px] text-slate-400 font-bold">التوقيع والاعتماد الهندسي</span>
              </div>
              <div className="space-y-4">
                <input 
                  type="text"
                  value={sig3Title}
                  onChange={(e) => setSig3Title(e.target.value)}
                  className="block w-full text-center font-black text-xs text-slate-900 bg-slate-100/50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-400 py-1.5 rounded-md outline-none transition-all print:bg-slate-100 print:border-none"
                />
                <input 
                  type="text"
                  value={sig3Name}
                  onChange={(e) => setSig3Name(e.target.value)}
                  placeholder="......................."
                  className="block w-full text-center text-xs font-bold text-indigo-700 bg-transparent hover:bg-slate-50 focus:bg-slate-50 border border-transparent focus:border-indigo-200 py-1 rounded outline-none transition-all placeholder:text-slate-400 print:placeholder:text-transparent print:bg-transparent print:border-none"
                />
                <div className="border-b border-dashed border-slate-300 w-2/3 mx-auto h-2" />
                <span className="block text-[10px] text-slate-400 font-bold">اعتماد ومطابقة الإدارة الإنشائية</span>
              </div>
            </div>

          </div>

          {/* Quick info alert on print-layout replica */}
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl p-4 flex items-start gap-3">
            <HelpCircle size={18} className="text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1 text-right w-full">
              <h5 className="font-bold">💡 معلومات حول كشف المراجعة التراكمية:</h5>
              <p className="leading-relaxed">
                يتم ربط خلايا هذا الكشف <strong>مباشرة وتلقائياً</strong> بدفتر الحركات العام للمشروع. أي معاملة تضيفها في منصة العمليات الموقعية، أو تودعها في كشف العهد، أو تقرها من مستخلصات مقاولي الباطن ضمن النطاق الزمني المحدد تظهر مباشرة في الأيام والبنود المقابلة لها دون أي حاجة للتدخل اليدوي المتكرر!
              </p>
            </div>
          </div>
          
        </div>
      )}

      {/* Custom Edit Modal for editing a row's entire distributed daily values */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-2xl w-full text-right space-y-5 font-sans animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <span className="text-amber-600 font-extrabold flex items-center gap-1.5 text-base">
                ✏️ تعديل بيانات البند الحسابي بالكامل
              </span>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-slate-400 hover:text-slate-600 transition text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البيان / الوصف الرئيسي:</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 text-slate-900 border border-slate-250 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستفيد / الجهة:</label>
                <input
                  type="text"
                  value={editRecipient}
                  onChange={(e) => setEditRecipient(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 text-slate-900 border border-slate-250 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الفئة المحاسبية الأساسية:</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ProjectCategory)}
                  className="w-full text-xs p-2.5 bg-slate-50 text-slate-900 border border-slate-250 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="salaries">١. رواتب وأجور أسبوعية</option>
                  <option value="maintenance">٢. صيانة معدات وأشغال</option>
                  <option value="transport">٣. انتقالات وحراسات كبرى</option>
                  <option value="supplies">٤. منصرف وضيافة موقعية</option>
                  <option value="grants">٥. إكراميات وجهود يومية</option>
                </select>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 text-[11px] text-amber-800 leading-normal flex items-center justify-center border border-amber-100 font-bold">
                <span>تعديل هذا البند سيقوم بتحديث قيم المعاملات المتوزعة على مدار أيام الكشف للأسبوع تلقائياً ومطابقتها بالدفاتر!</span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-800 mb-2 border-r-2 border-amber-500 pr-2">القيم المالية اليومية الموزعة (ج.م):</h5>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5">
                {reportDays.map((rd, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold">{rd.dayNameAr}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">{rd.dateFormatted}</span>
                    <input
                      type="number"
                      placeholder="٠"
                      value={editValues[rd.date] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditValues(prev => ({ ...prev, [rd.date]: val }));
                      }}
                      className="w-full text-xs text-center border-b border-slate-350 focus:outline-none mt-1 font-mono font-bold text-emerald-850 bg-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-5 py-2.5 bg-amber-550 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center gap-1"
              >
                💾 حفظ التعديلات تزامناً
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-205 cursor-pointer"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (Bypasses sandboxed iframe native dialog blocks) */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 max-w-md w-full text-right space-y-4 font-sans animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-row-reverse">
              <span className="text-indigo-600 font-extrabold flex items-center gap-1.5 text-sm">
                ⚠️ {confirmState.title}
              </span>
              <button 
                onClick={() => setConfirmState(null)} 
                className="text-slate-400 hover:text-slate-600 transition text-lg"
              >
                &times;
              </button>
            </div>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              {confirmState.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                تأكيد العملية
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
