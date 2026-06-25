import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Boxes, Truck, FileSignature, TrendingUp, Compass, ShieldAlert, 
  Barcode, ClipboardList, Archive, Sparkles, Plus, Trash2, 
  Search, Filter, CheckCircle, XCircle, RefreshCw, Layers, AlertCircle,
  Package, Info, ArrowDownLeft, ArrowUpRight, Scale
} from 'lucide-react';
import { WarehouseItemRecord, Project } from '../types';

interface WarehouseDashboardProps {
  warehouseItems: WarehouseItemRecord[];
  setWarehouseItems: React.Dispatch<React.SetStateAction<WarehouseItemRecord[]>>;
  projects: Project[];
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

// Sub-interfaces for simulated yet interactive logs for MRN (Material Requisition Note) and MRIR (Material Receiving & Inspection Report)
interface MRIRRecord {
  id: string;
  code: string;
  date: string;
  poNumber: string;
  itemCode: string;
  itemName: string;
  receivedQty: number;
  supplier: string;
  inspector: string;
  status: 'Approved' | 'Rejected' | 'Pending_Testing';
  notes: string;
}

interface MRNRecord {
  id: string;
  code: string;
  date: string;
  itemCode: string;
  itemName: string;
  requestedQty: number;
  requester: string;
  purpose: string;
  status: 'Approved' | 'Rejected' | 'Pending_Approval';
}

interface AuditCountRecord {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  systemQty: number;
  physicalQty: number;
  discrepancy: number;
  auditor: string;
  actionTaken: string;
}

export default function WarehouseDashboard({
  warehouseItems,
  setWarehouseItems,
  projects,
  userRole,
  addAuditLog
}: WarehouseDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'strategy' | 'ledger' | 'mrir' | 'mrn' | 'audit'>('strategy');

  // Search & Filter state for live ledger
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<string>('all');

  // Forms and Modals state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showMrirModal, setShowMrirModal] = useState(false);
  const [showMrnModal, setShowMrnModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // In-memory states for operations (MRIR, MRN, Audits) to make the dashboard haptic and fully functional
  const [mrirLogs, setMrirLogs] = useState<MRIRRecord[]>([
    {
      id: 'mrir-001',
      code: 'BUN-MRIR-2026-0001',
      date: '2026-06-20',
      poNumber: 'PO-2026-1024',
      itemCode: 'MAT-CMT-01',
      itemName: 'أسمنت بورتلاندي عادي مقاوم للكبريتات (رتبة 52.5)',
      receivedQty: 50,
      supplier: 'الشركة العربية للأسمنت',
      inspector: 'م/ عادل المصري (مدير ضبط الجودة)',
      status: 'Approved',
      notes: 'تم فحص الرطوبة ومطابقة شهادة الاختبار المرفقة لمتطلبات الكود المصري.'
    },
    {
      id: 'mrir-002',
      code: 'BUN-MRIR-2026-0002',
      date: '2026-06-22',
      poNumber: 'PO-2026-1035',
      itemCode: 'MAT-STE-05',
      itemName: 'حديد تسليح عالي المقاومة قطر 16 مم (مشرشر)',
      receivedQty: 30,
      supplier: 'حديد عز الدخيلة',
      inspector: 'م/ كرم عبد العزيز (مهندس الموقع)',
      status: 'Approved',
      notes: 'القطر والوزن الطولي متطابق للحدود القياسية والشهادة معتمدة.'
    }
  ]);

  const [mrnLogs, setMrnLogs] = useState<MRNRecord[]>([
    {
      id: 'mrn-001',
      code: 'BUN-MRN-2026-0012',
      date: '2026-06-21',
      itemCode: 'MAT-CMT-01',
      itemName: 'أسمنت بورتلاندي عادي مقاوم للكبريتات (رتبة 52.5)',
      requestedQty: 10,
      requester: 'م/ مصطفى الجوهري',
      purpose: 'أعمال صب الأساسات لخزان المياه الفرعي',
      status: 'Approved'
    },
    {
      id: 'mrn-002',
      code: 'BUN-MRN-2026-0013',
      date: '2026-06-23',
      itemCode: 'SFT-HEL-01',
      itemName: 'خوذة سلامة رأس قياسية مع حزام مبطن ثنائي الأمان',
      requestedQty: 15,
      requester: 'م/ محمد حسن (منسق الصحة والسلامة)',
      purpose: 'توزيع على طاقم المقاولين من الباطن الجدد بالموقع',
      status: 'Approved'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditCountRecord[]>([
    {
      id: 'audit-001',
      date: '2026-06-18',
      itemCode: 'MAT-CMT-01',
      itemName: 'أسمنت بورتلاندي عادي مقاوم للكبريتات (رتبة 52.5)',
      systemQty: 120,
      physicalQty: 120,
      discrepancy: 0,
      auditor: 'المستشار المالي أدهم يحيى',
      actionTaken: 'مطابقة تامة ولا يوجد أي فروقات مخزنية.'
    }
  ]);

  // Form State for Adding Item
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<WarehouseItemRecord['category']>('materials');
  const [newItemStock, setNewItemStock] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState('طن');
  const [newItemMinLimit, setNewItemMinLimit] = useState(5);
  const [newItemWarehouse, setNewItemWarehouse] = useState<WarehouseItemRecord['warehouseName']>('מخزن المشروع الرئيسي');

  // Form State for MRIR (Receiving)
  const [mrirPo, setMrirPo] = useState('');
  const [mrirItemCode, setMrirItemCode] = useState('');
  const [mrirQty, setMrirQty] = useState(0);
  const [mrirSupplier, setMrirSupplier] = useState('');
  const [mrirInspector, setMrirInspector] = useState('');
  const [mrirStatus, setMrirStatus] = useState<MRIRRecord['status']>('Approved');
  const [mrirNotes, setMrirNotes] = useState('');

  // Form State for MRN (Issuance)
  const [mrnItemCode, setMrnItemCode] = useState('');
  const [mrnQty, setMrnQty] = useState(0);
  const [mrnRequester, setMrnRequester] = useState('');
  const [mrnPurpose, setMrnPurpose] = useState('');

  // Form State for Audit adjustment
  const [auditItemCode, setAuditItemCode] = useState('');
  const [auditPhysicalQty, setAuditPhysicalQty] = useState(0);
  const [auditAuditor, setAuditAuditor] = useState('');

  // Auto populate state defaults when items load
  const categoryMap: Record<WarehouseItemRecord['category'], string> = {
    materials: 'خامات ومواد إنشائية',
    asphalt: 'طبقات أسفلتية ومذيبات',
    aggregates: 'سن وزلط وركام رملي',
    curbstones: 'بلدورات وبلاط إنترلوك',
    pipes: 'مواسير وكوع البنية التحتية',
    safety: 'مهمات سلامة وصحة مهنية',
    spare_parts: 'قطع غيار معدات ثقيلة'
  };

  // Pre-seed some standard items if warehouseItems is empty
  React.useEffect(() => {
    if (warehouseItems.length === 0) {
      const defaultItems: WarehouseItemRecord[] = [
        {
          id: 'wh-item-1',
          code: 'MAT-CMT-01',
          name: 'أسمنت بورتلاندي عادي مقاوم للكبريتات (رتبة 52.5)',
          category: 'materials',
          categoryAr: 'خامات ومواد إنشائية',
          currentStock: 120,
          unit: 'طن',
          minLimit: 20,
          warehouseName: 'מخزن المشروع الرئيسي'
        },
        {
          id: 'wh-item-2',
          code: 'MAT-STE-05',
          name: 'حديد تسليح عالي المقاومة قطر 16 مم (مشرشر)',
          category: 'materials',
          categoryAr: 'خامات ومواد إنشائية',
          currentStock: 45,
          unit: 'طن',
          minLimit: 15,
          warehouseName: 'מخزن المشروع الرئيسي'
        },
        {
          id: 'wh-item-3',
          code: 'AGG-GRA-03',
          name: 'سن متدرج (مقاس اعتباري ٢) لأعمال الرصف',
          category: 'aggregates',
          categoryAr: 'سن وزلط وركام رملي',
          currentStock: 800,
          unit: 'متر مكعب',
          minLimit: 200,
          warehouseName: 'مستودع الميدان الفرعي'
        },
        {
          id: 'wh-item-4',
          code: 'ASP-BIT-60',
          name: 'بيتومين سائل للرش واللصق (M.C.O)',
          category: 'asphalt',
          categoryAr: 'طبقات أسفلتية ومذيبات',
          currentStock: 12,
          unit: 'برميل',
          minLimit: 15, // Low stock on purpose to trigger warning!
          warehouseName: 'מخزن المشروع الرئيسي'
        },
        {
          id: 'wh-item-5',
          code: 'SFT-HEL-01',
          name: 'خوذة سلامة رأس قياسية مع حزام مبطن ثنائي الأمان',
          category: 'safety',
          categoryAr: 'مهمات سلامة وصحة مهنية',
          currentStock: 150,
          unit: 'قطعة',
          minLimit: 30,
          warehouseName: 'מخزن المشروع الرئيسي'
        }
      ];
      setWarehouseItems(defaultItems);
    }
  }, [warehouseItems, setWarehouseItems]);

  // Operations handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode.trim() || !newItemName.trim() || !newItemUnit.trim()) {
      alert('الرجاء تعبئة كافة الحقول الإلزامية لتسجيل المادة.');
      return;
    }

    const itemExists = warehouseItems.some(i => i.code.toUpperCase() === newItemCode.toUpperCase().trim());
    if (itemExists) {
      alert('كود المادة مسجل مسبقاً بقاعدة البيانات، يرجى تعديله أو استخدام كود مختلف.');
      return;
    }

    const newItem: WarehouseItemRecord = {
      id: 'wh-item-' + Date.now(),
      code: newItemCode.trim().toUpperCase(),
      name: newItemName.trim(),
      category: newItemCategory,
      categoryAr: categoryMap[newItemCategory],
      currentStock: Number(newItemStock),
      unit: newItemUnit.trim(),
      minLimit: Number(newItemMinLimit),
      warehouseName: newItemWarehouse
    };

    setWarehouseItems(prev => [newItem, ...prev]);

    if (addAuditLog) {
      addAuditLog(
        'تكويد مادة جديدة',
        'المخازن والمستودعات',
        `تكويد صنف جديد بقاعدة البيانات: ${newItem.name} (كود: ${newItem.code}) برصيد ابتدائي ${newItem.currentStock}`
      );
    }

    // Reset Form
    setNewItemCode('');
    setNewItemName('');
    setNewItemCategory('materials');
    setNewItemStock(0);
    setNewItemUnit('طن');
    setNewItemMinLimit(5);
    setShowAddItemModal(false);
  };

  const handleDeleteItem = (id: string) => {
    if (userRole === 'viewer') {
      alert('صلاحيات العرض فقط لا تسمح بحذف الأصناف المكودة.');
      return;
    }

    if (confirm('تحذير: هل أنت متأكد من إلغاء تكويد هذا الصنف نهائياً من قاعدة البيانات؟ قد يؤثر ذلك على كشوفات الحركة السابقة.')) {
      const target = warehouseItems.find(i => i.id === id);
      setWarehouseItems(prev => prev.filter(i => i.id !== id));
      if (addAuditLog && target) {
        addAuditLog('إلغاء تكويد مادة', 'المخازن والمستودعات', `إزالة تكويد صنف من المخازن: ${target.name} (كود: ${target.code})`);
      }
    }
  };

  const handleMRIRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrirPo.trim() || !mrirItemCode.trim() || mrirQty <= 0 || !mrirInspector.trim()) {
      alert('الرجاء تعبئة كافة بيانات محضر الفحص الفنية بشكل صحيح.');
      return;
    }

    const matchedItem = warehouseItems.find(i => i.code === mrirItemCode);
    if (!matchedItem) {
      alert('كود المادة المدخل غير مسجل بملفات التكويد. يرجى تكويد الخامة أولاً.');
      return;
    }

    const newMRIR: MRIRRecord = {
      id: 'mrir-' + Date.now(),
      code: `BUN-MRIR-2026-${String(mrirLogs.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      poNumber: mrirPo.trim(),
      itemCode: mrirItemCode,
      itemName: matchedItem.name,
      receivedQty: Number(mrirQty),
      supplier: mrirSupplier.trim() || 'مورد عام معتمد',
      inspector: mrirInspector.trim(),
      status: mrirStatus,
      notes: mrirNotes.trim() || 'تمت مطابقة الأبعاد والنوعية وخلو الشحنة من التلف.'
    };

    setMrirLogs(prev => [newMRIR, ...prev]);

    // Update Live Stock if Approved
    if (mrirStatus === 'Approved') {
      setWarehouseItems(prev => prev.map(item => {
        if (item.code === mrirItemCode) {
          return { ...item, currentStock: item.currentStock + Number(mrirQty) };
        }
        return item;
      }));

      if (addAuditLog) {
        addAuditLog(
          'إشعار استلام مواد MRIR',
          'المخازن والمستودعات',
          `قبول وإضافة كمية ${mrirQty} ${matchedItem.unit} للصنف ${matchedItem.name} بموجب أمر التوريد ${mrirPo}`
        );
      }
    } else {
      if (addAuditLog) {
        addAuditLog(
          'فحص شحنة مرفوضة / معلقة',
          'المخازن والمستودعات',
          `تسجيل محضر رفض/تعليق شحنة بمقدار ${mrirQty} لعدم مطابقة المواصفات الفنية.`
        );
      }
    }

    // Reset Form
    setMrirPo('');
    setMrirItemCode('');
    setMrirQty(0);
    setMrirSupplier('');
    setMrirInspector('');
    setMrirNotes('');
    setShowMrirModal(false);
    setActiveTab('ledger'); // transition to view updated ledger
  };

  const handleMRNSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrnItemCode.trim() || mrnQty <= 0 || !mrnRequester.trim() || !mrnPurpose.trim()) {
      alert('يرجى تحديد تفاصيل طلب الصرف والكمية والغرض الهندسي بدقة.');
      return;
    }

    const matchedItem = warehouseItems.find(i => i.code === mrnItemCode);
    if (!matchedItem) {
      alert('كود المادة المدخل غير مسجل بملفات التكويد.');
      return;
    }

    if (matchedItem.currentStock < mrnQty) {
      alert(`رصيد المخزن الحالي (${matchedItem.currentStock} ${matchedItem.unit}) غير كافٍ لصرف الكمية المطلوبة (${mrnQty} ${matchedItem.unit}).`);
      return;
    }

    const newMRN: MRNRecord = {
      id: 'mrn-' + Date.now(),
      code: `BUN-MRN-2026-${String(mrnLogs.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      itemCode: mrnItemCode,
      itemName: matchedItem.name,
      requestedQty: Number(mrnQty),
      requester: mrnRequester.trim(),
      purpose: mrnPurpose.trim(),
      status: 'Approved'
    };

    setMrnLogs(prev => [newMRN, ...prev]);

    // Update Live Stock (Deduct)
    setWarehouseItems(prev => prev.map(item => {
      if (item.code === mrnItemCode) {
        return { ...item, currentStock: item.currentStock - Number(mrnQty) };
      }
      return item;
    }));

    if (addAuditLog) {
      addAuditLog(
        'صرف مادة بموجب MRN',
        'المخازن والمستودعات',
        `صرف كمية ${mrnQty} ${matchedItem.unit} للصنف ${matchedItem.name} بطلب من المهندس ${mrnRequester} لأجل ${mrnPurpose}`
      );
    }

    // Reset Form
    setMrnItemCode('');
    setMrnQty(0);
    setMrnRequester('');
    setMrnPurpose('');
    setShowMrnModal(false);
    setActiveTab('ledger'); // transition to view updated ledger
  };

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditItemCode.trim() || auditPhysicalQty < 0 || !auditAuditor.trim()) {
      alert('يرجى اختيار الصنف وإدخال القراءة الفعلية ومسؤول الجرد.');
      return;
    }

    const matchedItem = warehouseItems.find(i => i.code === auditItemCode);
    if (!matchedItem) {
      alert('كود الصنف غير صحيح.');
      return;
    }

    const systemQty = matchedItem.currentStock;
    const physicalQty = Number(auditPhysicalQty);
    const discrepancy = physicalQty - systemQty;

    const newAudit: AuditCountRecord = {
      id: 'audit-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      itemCode: auditItemCode,
      itemName: matchedItem.name,
      systemQty,
      physicalQty,
      discrepancy,
      auditor: auditAuditor.trim(),
      actionTaken: discrepancy === 0 
        ? 'تسوية تامة ومطابقة للقراءات المحاسبية.' 
        : `تعديل رصيد النظام الفعلي بفرق (${discrepancy > 0 ? '+' : ''}${discrepancy}) لمعالجة فروق المعاينة الميدانية.`
    };

    setAuditLogs(prev => [newAudit, ...prev]);

    // Adjust system stock to reflect actual verified count
    setWarehouseItems(prev => prev.map(item => {
      if (item.code === auditItemCode) {
        return { ...item, currentStock: physicalQty };
      }
      return item;
    }));

    if (addAuditLog) {
      addAuditLog(
        'جرد وتسوية جردية',
        'المخازن والمستودعات',
        `تنفيذ جرد مستمر للصنف ${matchedItem.name}. رصيد دفتري: ${systemQty}، رصيد فعلي: ${physicalQty}، الفرقية: ${discrepancy}`
      );
    }

    // Reset Form
    setAuditItemCode('');
    setAuditPhysicalQty(0);
    setAuditAuditor('');
    setShowAuditModal(false);
    setActiveTab('ledger');
  };

  // Live LEDGER computations & Filtering
  const filteredLedger = useMemo(() => {
    return warehouseItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      let matchesStock = true;
      if (stockLevelFilter === 'low') {
        matchesStock = item.currentStock <= item.minLimit;
      } else if (stockLevelFilter === 'ok') {
        matchesStock = item.currentStock > item.minLimit;
      } else if (stockLevelFilter === 'zero') {
        matchesStock = item.currentStock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [warehouseItems, searchTerm, categoryFilter, stockLevelFilter]);

  // Overall KPIs
  const totalStockItems = warehouseItems.length;
  const criticalItemsCount = warehouseItems.filter(i => i.currentStock <= i.minLimit).length;
  const zeroStockItemsCount = warehouseItems.filter(i => i.currentStock === 0).length;
  const totalEstimatedVolume = warehouseItems.reduce((acc, curr) => acc + curr.currentStock, 0);

  return (
    <div className="space-y-6" dir="rtl" id="smart-warehouse-module">
      
      {/* 1. Header with Gradient Accent */}
      <header className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 h-1 bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-600 w-full" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Boxes size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة المخازن والمستودعات الذكية</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">منظومة حوكمة سلاسل الإمداد، الجرد الفوري ومراقبة جودة حفظ المواد الفنية بالموقع</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowAddItemModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-xs"
          >
            <Plus size={15} />
            <span>تكويد خامة جديدة</span>
          </button>
          
          <button 
            onClick={() => setShowMrirModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-xs"
          >
            <ArrowDownLeft size={15} />
            <span>تسجيل استلام وفحص (MRIR)</span>
          </button>

          <button 
            onClick={() => setShowMrnModal(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-xs"
          >
            <ArrowUpRight size={15} />
            <span>طلب صرف مواد للموقع (MRN)</span>
          </button>
        </div>
      </header>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'strategy' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <Compass size={14} />
          <span>الرؤية الإستراتيجية والدورة المخزنية</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ledger' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <Layers size={14} />
          <span>سجل حركة الأرصدة (Live Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab('mrir')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'mrir' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <FileSignature size={14} />
          <span>تقارير الفحص والاستلام (MRIR)</span>
        </button>

        <button
          onClick={() => setActiveTab('mrn')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'mrn' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <ClipboardList size={14} />
          <span>أذونات الصرف والطلب (MRN)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <Scale size={14} />
          <span>الجرد الدوري والتسويات الميدانية</span>
        </button>
      </div>

      {/* 3. Operational KPIs Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-400 font-bold">عدد الأصناف المكودة</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalStockItems}</h3>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Archive size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-amber-500 font-bold">أصناف تحت حد الطلب الحرج</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1 font-mono">{criticalItemsCount}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldAlert size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-red-500 font-bold">أرصدة منتهية تماماً (صفر)</p>
            <h3 className="text-2xl font-black text-red-600 mt-1 font-mono">{zeroStockItemsCount}</h3>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-emerald-500 font-bold">مجموع كميات المواد المخزنة</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">{totalEstimatedVolume.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* 4. Tab Contents View */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: STRATEGY & SOPS (The master text content requested by the user) */}
        {activeTab === 'strategy' && (
          <motion.div
            key="strategy"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 1.1 Introduction */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b pb-3 border-slate-100 flex items-center gap-2">
                <Compass className="text-indigo-600" size={20} />
                <span>المقدمة والرؤية الإستراتيجية لإدارة المواد وحفظ الأصول</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                تُعد إدارة المخازن والمستودعات العصب الرئيسي والمحرك الأساسي لتدفق السيولة النقدية والمواد الإنشائية في كبرى شركات المقاولات والهندسة المدنية. إن المواد المخزنة لا تُمثل مجرد بضاعة مادية بل هي <strong className="text-slate-900 font-black">أصل مالي إستراتيجي فوري وسرعة حركتها تحكم بشكل مباشر مؤشرات التدفق النقدي ومعدلات ربحية المشاريع</strong>. تهدف هذه المنظومة إلى حوكمة المخزون لضمان صفر هدر، وتحديد دقيق لتوقيتات الطلب بما يمنع توقف خلاطات الإسفلت أو تجميد معدات صب الخرسانة بالميدان، وهو ما يُترجم إلى استمرار عجلة الإنتاج اليومي للموقع بكل كفاءة وسلاسة.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-black text-indigo-700">١. صفر فاقد (Zero Waste)</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">منع تلف الرطوبة في مخازن الأسمنت والمواد الكيميائية وحفظ المواد طبقاً لكتالوجات المصنعين العالمية.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-black text-indigo-700">٢. التتبع اللحظي الفعال</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">تحديث أرصدة المخازن كودياً بمحاضر الفحص والاستلام وربط الصرف بأذونات المهندسين والبرنامج الزمني.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-black text-indigo-700">٣. تخفيض تكاليف التجميد</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">تجنب تكديس كميات فائضة تعطل السيولة المالية، وتطبيق نظرية التوريد الفوري JIT بمجرد تفعيل أنشطة الـ WBS.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-black text-indigo-700">٤. إمداد مستمر دون توقف</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">ضمان وجود مخزون أمان فني كافٍ لمواجهة تغيرات سلاسل الإمداد العالمية وأزمات الأسعار الفجائية.</p>
                </div>
              </div>
            </section>

            {/* 1.2 Warehouse Operational Cycle */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-900 border-b pb-3 border-slate-100 flex items-center gap-2">
                <Truck className="text-emerald-600" size={20} />
                <span>الدورة المخزنية القياسية وحوكمة الاستلام والصرف</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                إن توثيق وضبط كل خطوة في دورة المواد يمثل صمام الأمان لمنع التسريب المالي والمادي. تخضع حركات المستودعات لدينا إلى ثلاثة بروتوكولات فنية صارمة:
              </p>

              <div className="space-y-4">
                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-black">A</span>
                    <h3 className="text-xs font-black text-slate-800">محاضر فحص واستلام المواد الميدانية (MRIR - Material Receiving & Inspection Report)</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed text-justify pr-8">
                    عند وصول شحنات الخامات للموقع من الموردين، يلتزم أمين المخزن بإنشاء مستند فحص فني بالتنسيق المباشر مع مهندس ضبط الجودة (QC Inspector). يتم مطابقة المواصفات ضد أمر الشراء (PO)، والتأكد من عدم تلف العبوات أو تعرض الأسمنت للرطوبة، أو التواء حديد التسليح. لا يتم قيد أي كمية بالرصيد الفعلي للمخازن إلا بعد توقيع محضر الاستلام مع كود طلب الفحص الهندسي المعتمد وتوقيع المهندس الفاحص.
                  </p>
                </div>

                <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black">B</span>
                    <h3 className="text-xs font-black text-slate-800">التكويد المعياري والتخزين الآمن المنظم</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed text-justify pr-8">
                    يتم تقسيم المخازن جغرافياً وهندسياً وفق طبيعة المواد؛ حيث تخصص مساحات مسقوفة ومجهزة ضد الرطوبة للمواد الكيميائية وخامات الأسمنت والدهانات، بينما تخزن كتل الانترلوك والبلدورات والركام الرملي في ساحات خارجية ممهدة وآمنة. يتم تزويد كل بند بكود فرعي معياري (SKU Code) يسهل الوصول إليه وتتبعه رقمياً، مما يسرع عمليات الصرف ويمنع خلط الخامات الإنشائية من رتب ومقاومات مختلفة.
                  </p>
                </div>

                <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-black">C</span>
                    <h3 className="text-xs font-black text-slate-800">أذونات صرف المواد والربط المالي (MRN - Material Requisition Note)</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed text-justify pr-8">
                    يمنع تماماً صرف أي كمية إسمنت أو حديد أو مواسير للميدان إلا بموجب إذن صرف رسمي موقع من مهندس التنفيذ ومدير المشروع، يوضح فيه البند الفرعي المستفيد في المقايسة التقديرية (BOQ Code) والنشاط المرتبط بالجدول الزمني. يساهم هذا الربط في رصد استهلاك كل مهندس ومقارنته بالمعدلات التصميمية المسموحة لردع الفاقد والهدر العشوائي بالموقع.
                  </p>
                </div>
              </div>
            </section>

            {/* 1.3 AI Powered Automation & RFID Tracking */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-900 border-b pb-3 border-slate-100 flex items-center gap-2">
                <Sparkles className="text-purple-600" size={20} />
                <span>التحكم والأتمتة الرقمية المدعومة بالذكاء الاصطناعي</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-black">
                    <Barcode className="text-indigo-600 animate-pulse" size={18} />
                    <h4 className="text-xs">تتبع RFID والباركود المتقدم</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                    ربط الخامات الضخمة والمستوردة بملصقات ذكية لتسجيل حركتها بدقة عند الخروج والدخول من بوابات التخزين الرئيسية للمشاريع تلقائياً.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-black">
                    <TrendingUp className="text-emerald-600" size={18} />
                    <h4 className="text-xs">التنبؤ التلقائي بنقاط إعادة الطلب (JIT)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                    يحلل الذكاء الاصطناعي معدل الاستهلاك الفعلي للموقع ويتوقع زمن توريد الموردين (Lead Time)، ثم يحسب تلقائياً نقطة إعادة الطلب الفنية لتجنب توقف صب الخرسانات.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-black">
                    <Layers className="text-purple-600" size={18} />
                    <h4 className="text-xs">التكامل مع برنامج المقايسات الفعلي (BOQ)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                    مطابقة المسحوبات الفعلية للموقع مع جداول الكميات والأسعار المقدرة بالمقايسة، لكشف أي تجاوز غير مبرر في معدلات استهلاك الاسمنت والمعدن فوراً.
                  </p>
                </div>
              </div>
            </section>

            {/* 1.4 Waste Control & Scrap Mitigation */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b pb-3 border-slate-100 flex items-center gap-2">
                <ShieldAlert className="text-rose-600" size={20} />
                <span>الرقابة، الجرد وتقليل فاقد الخامات بالمواقع</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800">١. الجرد الدوري والمستمر (Cycle Counting)</h4>
                  <p className="text-justify">
                    بدلاً من الجرد السنوي التقليدي الذي يوقف عجلة العمل، تطبق المنظومة سياسة الجرد المستمر العشوائي (Continuous Audits). يتم جرد أصناف مختلفة يومياً لضمان عدم وجود أي فروقات أو عجز مخزني بين دفاتر المحاسبة والواقع الفعلي بالموقع والتحقيق في المسببات بشكل فوري.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800">٢. إدارة الرواكد والكهنة والمواد الفائضة (Surplus Control)</h4>
                  <p className="text-justify">
                    عند انتهاء أحد بنود المشروع وحضور خامات فائضة، تتولى إدارة المستودعات التنسيق لإعادة توجيهها لمواقع العمل الأخرى للشركة بدلاً من تعرضها للتلف بالموقع القديم، أو يتم فرزها وبيع حديد الخردة وكهنة الأخشاب بمزاد دوري لتعظيم العائد والتدفق المالي للشركة.
                  </p>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* TAB 2: LIVE LEDGER & STOCK MANAGEMENT (Highly interactive React State) */}
        {activeTab === 'ledger' && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Search and Advanced Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-3 justify-between items-center shadow-xs">
              <div className="relative w-full md:max-w-md">
                <input 
                  type="text" 
                  placeholder="بحث باسم الخامة، أو كود المادة الفرعي SKU..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right text-slate-800"
                />
                <Search size={14} className="absolute left-2.5 top-3.5 text-slate-400" />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700"
                >
                  <option value="all">كافة أقسام الخامات</option>
                  <option value="materials">خامات ومواد إنشائية</option>
                  <option value="asphalt">طبقات أسفلتية ومذيبات</option>
                  <option value="aggregates">سن وزلط وركام رملي</option>
                  <option value="curbstones">بلدورات وبلاط إنترلوك</option>
                  <option value="pipes">مواسير وكوع البنية التحتية</option>
                  <option value="safety">مهمات سلامة وصحة مهنية</option>
                  <option value="spare_parts">قطع غيار معدات ثقيلة</option>
                </select>

                <select
                  value={stockLevelFilter}
                  onChange={e => setStockLevelFilter(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700"
                >
                  <option value="all">كافة مستويات الرصيد</option>
                  <option value="low">أرصدة حرجة (تحت الحد الأدنى)</option>
                  <option value="ok">أرصدة آمنة (مطابق فُنياً)</option>
                  <option value="zero">أرصدة منتهية (صفرية)</option>
                </select>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">دفتر الأستاذ وحركة أرصدة المخازن للشركة</h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-black">العدد المطابق للفلترة: {filteredLedger.length} صنف</span>
              </div>

              {filteredLedger.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Archive size={32} />
                  </div>
                  <p className="text-sm font-black text-slate-800">لا توجد مواد مخزنة مطابقة للبحث</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    يرجى مراجعة فلاتر البحث أو تكويد صنف خامة جديد لتسجيل حركتها بالموقع وتحديثها رقمياً.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                        <th className="p-4">كود SKU المعتمد</th>
                        <th className="p-4">وصف الخامة الفنية</th>
                        <th className="p-4">التصنيف والفرع</th>
                        <th className="p-4 text-center">الرصيد الفعلي الحالي</th>
                        <th className="p-4 text-center">الحد الأدنى الفني</th>
                        <th className="p-4">المستودع الرئيسي لحفظ الخامة</th>
                        <th className="p-4 text-center">حالة مستوى الطلب</th>
                        <th className="p-4 text-center">خيارات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {filteredLedger.map(item => {
                        const isUnderMin = item.currentStock <= item.minLimit;
                        const isZero = item.currentStock === 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/40 transition">
                            <td className="p-4 font-mono text-indigo-900">{item.code}</td>
                            <td className="p-4 text-slate-900 max-w-xs font-black leading-relaxed">{item.name}</td>
                            <td className="p-4 text-slate-600 font-medium">
                              <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px]">
                                {item.categoryAr || categoryMap[item.category]}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono text-slate-900 text-sm">
                              {item.currentStock.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans font-bold">{item.unit}</span>
                            </td>
                            <td className="p-4 text-center font-mono text-slate-500">
                              {item.minLimit} {item.unit}
                            </td>
                            <td className="p-4 text-indigo-950 font-black">
                              {item.warehouseName.replace('מ', 'م')}
                            </td>
                            <td className="p-4 text-center">
                              {isZero ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block bg-red-100 text-red-800">
                                  منتهي تماماً (إعادة طلب فورية)
                                </span>
                              ) : isUnderMin ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block bg-amber-100 text-amber-800 animate-pulse">
                                  حرج (تحت حد الأمان)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block bg-emerald-100 text-emerald-800">
                                  رصيد آمن ومطابق فُنياً
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                                title="إلغاء تكويد المادة"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: MRIR (Receiving Report) */}
        {activeTab === 'mrir' && (
          <motion.div
            key="mrir"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">منظومة استلام وفحص التوريدات الفنية (MRIR Logs)</h4>
                <p className="text-[11px] text-slate-500">تمثل السجلات المعتمدة لاستقبال المواد ومطابقتها ضد العينات المعتمدة والكود الهندسي.</p>
              </div>
              <button 
                onClick={() => setShowMrirModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition"
              >
                تسجيل مستند استلام MRIR
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500 text-right">
                محاضر استلام المواد للمشاريع الحالية
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                      <th className="p-4">رقم محضر الفحص</th>
                      <th className="p-4">كود صنف SKU</th>
                      <th className="p-4">اسم ووصف الخامة الإنشائية</th>
                      <th className="p-4 text-center">الكمية المقبولة</th>
                      <th className="p-4">المورد والمصدر</th>
                      <th className="p-4">المهندس الفاحص الجودة</th>
                      <th className="p-4 text-center">حالة القبول الإدارية</th>
                      <th className="p-4">تفاصيل الفحص والملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {mrirLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-4 font-mono text-emerald-900">{log.code}</td>
                        <td className="p-4 font-mono text-slate-500">{log.itemCode}</td>
                        <td className="p-4 text-slate-900 font-black leading-relaxed">{log.itemName}</td>
                        <td className="p-4 text-center text-sm font-mono text-slate-800">{log.receivedQty.toLocaleString()}</td>
                        <td className="p-4 text-slate-600">{log.supplier}</td>
                        <td className="p-4 text-indigo-950 font-black">{log.inspector}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            log.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            log.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.status === 'Approved' ? 'مقبول هندسياً ومقيد بالرصيد' : 'مرفوض ومحجوز'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 max-w-xs leading-relaxed text-justify">{log.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: MRN (Material Issuance) */}
        {activeTab === 'mrn' && (
          <motion.div
            key="mrn"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">أذونات ومسحوبات صرف الخامات للموقع (MRN Logs)</h4>
                <p className="text-[11px] text-slate-500">تمثل خط الدفاع الرئيسي لعدم هدر المواد وتوزيع استهلاك الأقسام بالمشروع.</p>
              </div>
              <button 
                onClick={() => setShowMrnModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl transition"
              >
                إنشاء طلب صرف مواد للموقع
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500 text-right">
                سجل أذونات الصرف الفعلي
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                      <th className="p-4">رقم إذن الصرف MRN</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">كود صنف SKU</th>
                      <th className="p-4">وصف الصنف المنصرف</th>
                      <th className="p-4 text-center">الكمية المنصرفة</th>
                      <th className="p-4">المهندس طالب الصرف</th>
                      <th className="p-4">الغرض الهندسي ومكان التركيب</th>
                      <th className="p-4 text-center">الحالة الإدارية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {mrnLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-4 font-mono text-orange-900">{log.code}</td>
                        <td className="p-4 font-mono text-slate-500">{log.date}</td>
                        <td className="p-4 font-mono text-slate-500">{log.itemCode}</td>
                        <td className="p-4 text-slate-900 font-black leading-relaxed">{log.itemName}</td>
                        <td className="p-4 text-center text-sm font-mono text-slate-800">{log.requestedQty.toLocaleString()}</td>
                        <td className="p-4 text-indigo-950 font-black">{log.requester}</td>
                        <td className="p-4 text-slate-500 max-w-xs leading-relaxed text-justify">{log.purpose}</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            تم الخصم والصرف بالموقع
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: AUDITING & ADJUSTMENT */}
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">سجلات الجرد والتسوية السنوية واليومية (Inventory Counts)</h4>
                <p className="text-[11px] text-slate-500">مراجعة ومعاينة الأرصدة الفعلية مع دفاتر النظام لرصد وضبط فروقات العجز والتلف بالموقع.</p>
              </div>
              <button 
                onClick={() => setShowAuditModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition"
              >
                تسجيل حركة تسوية وجرد
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500 text-right">
                سجل التسويات وحالة المطابقة الدفترية
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                      <th className="p-4">تاريخ المطابقة</th>
                      <th className="p-4">كود صنف SKU</th>
                      <th className="p-4">الخامة موضوع الجرد</th>
                      <th className="p-4 text-center">الرصيد الدفتري</th>
                      <th className="p-4 text-center">الرصيد الميداني المالي</th>
                      <th className="p-4 text-center">الفروقات (العجز/الزيادة)</th>
                      <th className="p-4">مسؤول المعاينة الميدانية</th>
                      <th className="p-4">الإجراء التصحيحي المستند مالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-4 font-mono text-slate-500">{log.date}</td>
                        <td className="p-4 font-mono text-indigo-900">{log.itemCode}</td>
                        <td className="p-4 text-slate-900 font-black leading-relaxed">{log.itemName}</td>
                        <td className="p-4 text-center font-mono">{log.systemQty.toLocaleString()}</td>
                        <td className="p-4 text-center font-mono">{log.physicalQty.toLocaleString()}</td>
                        <td className="p-4 text-center font-mono text-sm">
                          {log.discrepancy === 0 ? (
                            <span className="text-emerald-600">متطابق (0)</span>
                          ) : log.discrepancy > 0 ? (
                            <span className="text-emerald-600 font-black">+{log.discrepancy} (زيادة)</span>
                          ) : (
                            <span className="text-rose-600 font-black">{log.discrepancy} (عجز)</span>
                          )}
                        </td>
                        <td className="p-4 text-indigo-950 font-black">{log.auditor}</td>
                        <td className="p-4 text-slate-500 max-w-xs leading-relaxed text-justify">{log.actionTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. ADD ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4.5 bg-gradient-to-l from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">تكويد صنف جديد بقاعدة البيانات المركزية</h3>
              <button onClick={() => setShowAddItemModal(false)} className="p-1 hover:bg-white/20 rounded-lg text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">كود صنف SKU الفريد *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: MAT-STE-06"
                    value={newItemCode}
                    onChange={e => setNewItemCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">تصنيف الخامة الهندسي *</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                  >
                    <option value="materials">خامات ومواد إنشائية</option>
                    <option value="asphalt">طبقات أسفلتية ومذيبات</option>
                    <option value="aggregates">سن وزلط وركام رملي</option>
                    <option value="curbstones">بلدورات وبلاط إنترلوك</option>
                    <option value="pipes">مواسير وكوع البنية التحتية</option>
                    <option value="safety">مهمات سلامة وصحة مهنية</option>
                    <option value="spare_parts">قطع غيار معدات ثقيلة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">اسم ووصف الخامة التفصيلي *</label>
                <input 
                  required
                  type="text"
                  placeholder="مثال: حديد تسليح عالي المقاومة قطر ١٢ مم طول ١٢ متر"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الرصيد الافتتاحي الفعلي *</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={e => setNewItemStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">وحدة القياس الفنية *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: طن، برميل، متر مكعب"
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الحد الفني الأدنى *</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    value={newItemMinLimit}
                    onChange={e => setNewItemMinLimit(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">مستودع التخزين المعتمد *</label>
                <select
                  value={newItemWarehouse}
                  onChange={e => setNewItemWarehouse(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                >
                  <option value="מخزن المشروع الرئيسي">مستودع المشروع الرئيسي</option>
                  <option value="مستودع الميدان الفرعي">مستودع الميدان الفرعي</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition"
                >
                  تراجع
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  حفظ وتسجيل الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MRIR REGISTRATION MODAL */}
      {showMrirModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4.5 bg-gradient-to-l from-emerald-600 to-cyan-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">تسجيل تقرير فحص واستلام شحنة واردة (MRIR)</h3>
              <button onClick={() => setShowMrirModal(false)} className="p-1 hover:bg-white/20 rounded-lg text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleMRIRSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">رقم أمر الشراء PO المالي *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: PO-2026-1045"
                    value={mrirPo}
                    onChange={e => setMrirPo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">اختر الخامة المستلمة للتحديث *</label>
                  <select
                    required
                    value={mrirItemCode}
                    onChange={e => setMrirItemCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                  >
                    <option value="">-- اختر من الأصناف المكودة --</option>
                    {warehouseItems.map(i => (
                      <option key={i.id} value={i.code}>{i.name} ({i.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الكمية الفعلية الموردة *</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={mrirQty}
                    onChange={e => setMrirQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">المورد / شركة الشحن *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: مصانع عز أو مورد الأسمنت"
                    value={mrirSupplier}
                    onChange={e => setMrirSupplier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">مهندس الجودة الفاحص *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: م/ عادل المصري"
                    value={mrirInspector}
                    onChange={e => setMrirInspector(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الحالة الفنية للمستند ومطابقتها للكود *</label>
                  <select
                    value={mrirStatus}
                    onChange={e => setMrirStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                  >
                    <option value="Approved">مطابق ومقبول بالكامل (إقرار توريد)</option>
                    <option value="Rejected">مرفوض لعدم مطابقة العينة والشهادة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">تقرير الفحص وملاحظات ضبط الجودة</label>
                <textarea 
                  rows={2}
                  placeholder="بيان الفحص المعملي للمكعبات، أبعاد التوريد، نسب الخلط والرطوبة..."
                  value={mrirNotes}
                  onChange={e => setMrirNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                />
              </div>

              <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                ملاحظة: بمجرد اعتماد وحفظ التقرير بحالة "مقبول"، سيقوم النظام تلقائياً بزيادة رصيد دفتر الأستاذ الفعلي وتدوين الملاحظات.
              </p>

              <div className="pt-4 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowMrirModal(false)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition"
                >
                  تراجع
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  تسجيل واستلام الشحنة حياً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MRN REGISTRATION MODAL */}
      {showMrnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4.5 bg-gradient-to-l from-orange-600 to-orange-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">إذن صرف مواد للموقع الإنشائي (MRN)</h3>
              <button onClick={() => setShowMrnModal(false)} className="p-1 hover:bg-white/20 rounded-lg text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleMRNSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">اختر صنف المادة المطلوب صرفها *</label>
                  <select
                    required
                    value={mrnItemCode}
                    onChange={e => setMrnItemCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                  >
                    <option value="">-- اختر صنف الخامة --</option>
                    {warehouseItems.map(i => (
                      <option key={i.id} value={i.code}>{i.name} (المتاح: {i.currentStock} {i.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الكمية المطلوبة صرفها للميدان *</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={mrnQty}
                    onChange={e => setMrnQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">المهندس طالب الصرف (المسؤول بالميدان) *</label>
                <input 
                  required
                  type="text"
                  placeholder="مثال: م/ مصطفى الجوهري (مدير التنفيذ)"
                  value={mrnRequester}
                  onChange={e => setMrnRequester(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">الغرض من الصرف ومكان صب/تركيب المادة *</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="أعمال صب حوائط محطة المعالجة، تثبيت البلدورات بطريق الخدمة..."
                  value={mrnPurpose}
                  onChange={e => setMrnPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                />
              </div>

              <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                تنبيه: سيقوم النظام بخصم المادة تلقائياً من الأرصدة وتعديل دفتر الأستاذ لتحديث كفاءة التحكم وتقليل الفاقد فوراً.
              </p>

              <div className="pt-4 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowMrnModal(false)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition"
                >
                  تراجع
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  اعتماد وصرف المواد للميدان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. AUDIT & ADJUSTMENT MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4.5 bg-gradient-to-l from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">تسجيل جرد وتعديل تسويات الأرصدة</h3>
              <button onClick={() => setShowAuditModal(false)} className="p-1 hover:bg-white/20 rounded-lg text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleAuditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">اختر صنف المادة الجاري جردها *</label>
                <select
                  required
                  value={auditItemCode}
                  onChange={e => setAuditItemCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                >
                  <option value="">-- اختر مادة للجرد --</option>
                  {warehouseItems.map(i => (
                    <option key={i.id} value={i.code}>{i.name} (رصيد النظام: {i.currentStock} {i.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الكمية المقاسة فعلياً بالمخزن *</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    placeholder="أدخل عدد القياس الميداني"
                    value={auditPhysicalQty}
                    onChange={e => setAuditPhysicalQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">مسؤول المعاينة والجرد بالموقع *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: أدهم يحيى (الخبير المالي)"
                    value={auditAuditor}
                    onChange={e => setAuditAuditor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                  />
                </div>
              </div>

              <p className="text-[10px] text-red-500 font-black leading-relaxed">
                تحذير: سيقوم النظام بتعديل فوري للكميات لتتطابق تماماً مع رصد المعاينة، مع رصد وضبط الفروقات بسجل الجرد.
              </p>

              <div className="pt-4 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition"
                >
                  تراجع
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  تسجيل وحفظ الفروقات الدفترية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
