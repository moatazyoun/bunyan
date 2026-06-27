import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Boxes, ShieldAlert, Archive, Plus, Trash2, 
  Search, CheckCircle, XCircle, Layers, AlertCircle,
  TrendingUp, FileSignature, ClipboardList, Scale,
  ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { WarehouseItemRecord, Project, MRIRRecord, MRNRecord, AuditCountRecord } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface WarehouseDashboardProps {
  warehouseItems: WarehouseItemRecord[];
  setWarehouseItems: React.Dispatch<React.SetStateAction<WarehouseItemRecord[]>>;
  mrirLogs: MRIRRecord[];
  setMrirLogs: React.Dispatch<React.SetStateAction<MRIRRecord[]>>;
  mrnLogs: MRNRecord[];
  setMrnLogs: React.Dispatch<React.SetStateAction<MRNRecord[]>>;
  warehouseAuditLogs: AuditCountRecord[];
  setWarehouseAuditLogs: React.Dispatch<React.SetStateAction<AuditCountRecord[]>>;
  projects: Project[];
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

export default function WarehouseDashboard({
  warehouseItems,
  setWarehouseItems,
  mrirLogs,
  setMrirLogs,
  mrnLogs,
  setMrnLogs,
  warehouseAuditLogs,
  setWarehouseAuditLogs,
  projects,
  userRole,
  addAuditLog
}: WarehouseDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'ledger' | 'mrir' | 'mrn' | 'audit'>('ledger');

  // Search & Filter state for live ledger
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<string>('all');

  // Forms and Modals state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showMrirModal, setShowMrirModal] = useState(false);
  const [showMrnModal, setShowMrnModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Form State for Adding Item
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<WarehouseItemRecord['category']>('materials');
  const [newItemStock, setNewItemStock] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemMinLimit, setNewItemMinLimit] = useState(5);
  const [newItemWarehouse, setNewItemWarehouse] = useState<WarehouseItemRecord['warehouseName']>('مخزن المشروع الرئيسي');

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

  const categoryMap: Record<WarehouseItemRecord['category'], string> = {
    materials: 'خامات ومواد إنشائية',
    asphalt: 'طبقات أسفلتية ومذيبات',
    aggregates: 'سن وزلط وركام رملي',
    curbstones: 'بلدورات وبلاط إنترلوك',
    pipes: 'مواسير وكوع البنية التحتية',
    safety: 'مهمات سلامة وصحة مهنية',
    spare_parts: 'قطع غيار معدات ثقيلة'
  };

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
    setNewItemUnit('');
    setNewItemMinLimit(5);
    setShowAddItemModal(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (userRole === 'viewer') {
      alert('صلاحيات العرض فقط لا تسمح بحذف الأصناف المكودة.');
      return;
    }

    const confirmed = await confirmWithRandomCode(
      'هل أنت متأكد من إلغاء تكويد هذا الصنف من المخازن تماماً؟'
    );
    if (confirmed) {
      const target = warehouseItems.find(i => i.id === id);
      setWarehouseItems(prev => prev.filter(i => i.id !== id));
      if (addAuditLog && target) {
        addAuditLog('إلغاء تكويد مادة', 'المخازن والمستودعات', `إزالة تكويد صنف من المخازن: ${target.name} (كود: ${target.code})`);
      }
    }
  };

  const handleDeleteMRIR = async (id: string) => {
    if (userRole === 'viewer') {
      alert('صلاحيات العرض لا تسمح بالحذف.');
      return;
    }
    const confirmed = await confirmWithRandomCode('هل أنت متأكد من حذف محضر الاستلام هذا نهائياً؟');
    if (confirmed) {
      const target = mrirLogs.find(i => i.id === id);
      setMrirLogs(prev => prev.filter(i => i.id !== id));
      if (addAuditLog && target) {
        addAuditLog('حذف محضر استلام', 'المخازن والمستودعات', `حذف محضر MRIR رقم: ${target.code}`);
      }
    }
  };

  const handleDeleteMRN = async (id: string) => {
    if (userRole === 'viewer') {
      alert('صلاحيات العرض لا تسمح بالحذف.');
      return;
    }
    const confirmed = await confirmWithRandomCode('هل أنت متأكد من حذف إذن صرف المواد هذا نهائياً؟');
    if (confirmed) {
      const target = mrnLogs.find(i => i.id === id);
      setMrnLogs(prev => prev.filter(i => i.id !== id));
      if (addAuditLog && target) {
        addAuditLog('حذف إذن صرف', 'المخازن والمستودعات', `حذف إذن صرف MRN رقم: ${target.code}`);
      }
    }
  };

  const handleDeleteAuditLog = async (id: string) => {
    if (userRole === 'viewer') {
      alert('صلاحيات العرض لا تسمح بالحذف.');
      return;
    }
    const confirmed = await confirmWithRandomCode('هل أنت متأكد من حذف التسوية الجردية هذه نهائياً؟');
    if (confirmed) {
      setWarehouseAuditLogs(prev => prev.filter(i => i.id !== id));
      if (addAuditLog) {
        addAuditLog('حذف تسوية جردية', 'المخازن والمستودعات', `تم حذف تسوية جردية من النظام.`);
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
      supplier: mrirSupplier.trim() || 'مورد عام',
      inspector: mrirInspector.trim(),
      status: mrirStatus,
      notes: mrirNotes.trim()
    };

    setMrirLogs(prev => [newMRIR, ...prev]);

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
    setActiveTab('ledger');
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
    setActiveTab('ledger');
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

    setWarehouseAuditLogs(prev => [newAudit, ...prev]);

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
    <div className="space-y-6" dir="rtl">
      
      {/* 1. Header */}
      <header className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">إدارة المخازن والمستودعات</h1>
            <p className="text-sm text-slate-500 mt-1">مراقبة وحوكمة حركة المواد الإنشائية وسلاسل الإمداد</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setShowAddItemModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>تكويد خامة جديدة</span>
          </button>
          
          <button 
            onClick={() => setShowMrirModal(true)}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-2xl flex items-center gap-2 transition-all"
          >
            <ArrowDownLeft size={16} className="text-emerald-600" />
            <span>فحص واستلام (MRIR)</span>
          </button>

          <button 
            onClick={() => setShowMrnModal(true)}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-2xl flex items-center gap-2 transition-all"
          >
            <ArrowUpRight size={16} className="text-orange-600" />
            <span>صرف مواد (MRN)</span>
          </button>
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ledger' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers size={16} />
          <span>سجل أرصدة المخازن</span>
        </button>

        <button
          onClick={() => setActiveTab('mrir')}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'mrir' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileSignature size={16} />
          <span>تقارير الاستلام (MRIR)</span>
        </button>

        <button
          onClick={() => setActiveTab('mrn')}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'mrn' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ClipboardList size={16} />
          <span>أذونات الصرف (MRN)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Scale size={16} />
          <span>التسويات والجرد</span>
        </button>
      </div>

      {/* 3. Operational KPIs Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate-500 font-medium">عدد الأصناف المكودة</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">{totalStockItems}</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
            <Archive size={20} />
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate-500 font-medium">أصناف تحت حد الطلب</p>
            <h3 className="text-3xl font-bold text-amber-600 mt-2 font-mono">{criticalItemsCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate-500 font-medium">أرصدة منتهية (صفر)</p>
            <h3 className="text-3xl font-bold text-rose-600 mt-2 font-mono">{zeroStockItemsCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي كميات المواد</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-2 font-mono">{totalEstimatedVolume.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* 4. Tab Contents View */}
      <AnimatePresence mode="wait">
        
        {/* TAB 2: LIVE LEDGER */}
        {activeTab === 'ledger' && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search and Advanced Filters */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
              <div className="relative w-full md:max-w-md">
                <input 
                  type="text" 
                  placeholder="مثال: بحث باسم الخامة أو كود المادة..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="all">كافة التصنيفات</option>
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
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="all">كافة مستويات الرصيد</option>
                  <option value="low">أرصدة حرجة (تحت الحد)</option>
                  <option value="ok">أرصدة آمنة (متوفر)</option>
                  <option value="zero">أرصدة منتهية (صفر)</option>
                </select>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-800">حركة أرصدة المخازن</h4>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-semibold">المطابق: {filteredLedger.length}</span>
              </div>

              {filteredLedger.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Archive size={40} />
                  </div>
                  <p className="text-base font-bold text-slate-800">لا توجد أصناف تطابق البحث</p>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    لم يتم العثور على أي خامات مطابقة لمحددات التصفية، يرجى المحاولة بكلمات أخرى أو تكويد صنف جديد.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-semibold text-xs border-b border-slate-100">
                        <th className="p-5 whitespace-nowrap">الكود (SKU)</th>
                        <th className="p-5 min-w-[200px]">اسم الصنف</th>
                        <th className="p-5">التصنيف</th>
                        <th className="p-5 text-center">الرصيد الفعلي</th>
                        <th className="p-5 text-center">الحد الأدنى</th>
                        <th className="p-5">المستودع</th>
                        <th className="p-5 text-center">الحالة</th>
                        <th className="p-5 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredLedger.map(item => {
                        const isUnderMin = item.currentStock <= item.minLimit;
                        const isZero = item.currentStock === 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-5 font-mono text-indigo-700 font-semibold">{item.code}</td>
                            <td className="p-5 text-slate-900 font-semibold truncate max-w-xs" title={item.name}>{item.name}</td>
                            <td className="p-5 text-slate-600">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium whitespace-nowrap">
                                {item.categoryAr || categoryMap[item.category]}
                              </span>
                            </td>
                            <td className="p-5 text-center font-mono font-bold text-slate-900 text-base">
                              {item.currentStock.toLocaleString()} <span className="text-xs text-slate-400 font-sans">{item.unit}</span>
                            </td>
                            <td className="p-5 text-center font-mono text-slate-500">
                              {item.minLimit}
                            </td>
                            <td className="p-5 text-slate-700 font-medium">
                              {(item.warehouseName || 'مخزن المشروع الرئيسي').replace('מ', 'م')}
                            </td>
                            <td className="p-5 text-center">
                              {isZero ? (
                                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 whitespace-nowrap">
                                  منتهي تماماً
                                </span>
                              ) : isUnderMin ? (
                                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                                  رصيد حرج
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                                  متوفر ومطابق
                                </span>
                              )}
                            </td>
                            <td className="p-5 text-center">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                title="إلغاء الصنف"
                              >
                                <Trash2 size={16} />
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

        {/* TAB 3: MRIR */}
        {activeTab === 'mrir' && (
          <motion.div
            key="mrir"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">سجلات تقارير الاستلام (MRIR)</h4>
                <p className="text-sm text-slate-500 mt-1">تتبع عمليات الفحص والاستلام وتأثيرها على المخزون.</p>
              </div>
              <button 
                onClick={() => setShowMrirModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span>إضافة محضر جديد</span>
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {mrirLogs.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <FileSignature size={40} />
                  </div>
                  <p className="text-base font-bold text-slate-800">لا توجد محاضر استلام مسجلة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                        <th className="p-5 whitespace-nowrap">رقم المحضر</th>
                        <th className="p-5 whitespace-nowrap">تاريخ الاستلام</th>
                        <th className="p-5 whitespace-nowrap">كود الصنف</th>
                        <th className="p-5 min-w-[200px]">اسم الصنف</th>
                        <th className="p-5 text-center whitespace-nowrap">الكمية المستلمة</th>
                        <th className="p-5 whitespace-nowrap">المورد</th>
                        <th className="p-5 text-center whitespace-nowrap">الحالة الفنية</th>
                        <th className="p-5 text-center whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mrirLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-5 font-mono text-emerald-700 font-semibold whitespace-nowrap">{log.code}</td>
                          <td className="p-5 font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                          <td className="p-5 font-mono text-slate-500 whitespace-nowrap">{log.itemCode}</td>
                          <td className="p-5 text-slate-900 font-semibold">{log.itemName}</td>
                          <td className="p-5 text-center text-base font-mono font-bold text-slate-800">{log.receivedQty.toLocaleString()}</td>
                          <td className="p-5 text-slate-600 font-medium whitespace-nowrap">{log.supplier}</td>
                          <td className="p-5 text-center whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                              log.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              log.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {log.status === 'Approved' ? 'مقبول هندسياً' : log.status === 'Rejected' ? 'مرفوض' : 'قيد الفحص'}
                            </span>
                          </td>
                          <td className="p-5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteMRIR(log.id)}
                              className="p-1.5 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="حذف محضر الاستلام"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: MRN */}
        {activeTab === 'mrn' && (
          <motion.div
            key="mrn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">أذونات صرف المواد (MRN)</h4>
                <p className="text-sm text-slate-500 mt-1">سجل تفصيلي بكافة طلبات الصرف الميدانية المعتمدة.</p>
              </div>
              <button 
                onClick={() => setShowMrnModal(true)}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span>إضافة إذن صرف</span>
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {mrnLogs.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <ClipboardList size={40} />
                  </div>
                  <p className="text-base font-bold text-slate-800">لا توجد أذونات صرف مسجلة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                        <th className="p-5 whitespace-nowrap">رقم إذن الصرف</th>
                        <th className="p-5 whitespace-nowrap">التاريخ</th>
                        <th className="p-5 whitespace-nowrap">كود الصنف</th>
                        <th className="p-5 min-w-[200px]">اسم الصنف</th>
                        <th className="p-5 text-center whitespace-nowrap">الكمية المنصرفة</th>
                        <th className="p-5 whitespace-nowrap">الطالب</th>
                        <th className="p-5 min-w-[150px]">الغرض الميداني</th>
                        <th className="p-5 text-center whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mrnLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-5 font-mono text-orange-700 font-semibold whitespace-nowrap">{log.code}</td>
                          <td className="p-5 font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                          <td className="p-5 font-mono text-slate-500 whitespace-nowrap">{log.itemCode}</td>
                          <td className="p-5 text-slate-900 font-semibold">{log.itemName}</td>
                          <td className="p-5 text-center text-base font-mono font-bold text-slate-800">{log.requestedQty.toLocaleString()}</td>
                          <td className="p-5 text-slate-700 font-medium whitespace-nowrap">{log.requester}</td>
                          <td className="p-5 text-slate-500 leading-relaxed truncate max-w-xs" title={log.purpose}>{log.purpose}</td>
                          <td className="p-5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteMRN(log.id)}
                              className="p-1.5 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="حذف إذن الصرف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 5: AUDITING */}
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">حركة تسويات الأرصدة الميدانية</h4>
                <p className="text-sm text-slate-500 mt-1">مطابقة الأرصدة الدفترية مع الكميات الواقعية بالموقع.</p>
              </div>
              <button 
                onClick={() => setShowAuditModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span>إضافة مطابقة جردية</span>
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {warehouseAuditLogs.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Scale size={40} />
                  </div>
                  <p className="text-base font-bold text-slate-800">لا توجد حركات تسوية مسجلة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                        <th className="p-5 whitespace-nowrap">تاريخ الجرد</th>
                        <th className="p-5 whitespace-nowrap">كود الصنف</th>
                        <th className="p-5 min-w-[200px]">اسم الصنف</th>
                        <th className="p-5 text-center whitespace-nowrap">الرصيد الدفتري</th>
                        <th className="p-5 text-center whitespace-nowrap">الرصيد الفعلي</th>
                        <th className="p-5 text-center whitespace-nowrap">الفروقات</th>
                        <th className="p-5 whitespace-nowrap">لجنة الجرد</th>
                        <th className="p-5 text-center whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {warehouseAuditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-5 font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                          <td className="p-5 font-mono text-indigo-700 font-semibold whitespace-nowrap">{log.itemCode}</td>
                          <td className="p-5 text-slate-900 font-semibold">{log.itemName}</td>
                          <td className="p-5 text-center font-mono text-slate-600">{log.systemQty.toLocaleString()}</td>
                          <td className="p-5 text-center font-mono font-bold text-slate-900">{log.physicalQty.toLocaleString()}</td>
                          <td className="p-5 text-center font-mono font-bold text-base whitespace-nowrap">
                            {log.discrepancy === 0 ? (
                              <span className="text-emerald-600">متطابق (0)</span>
                            ) : log.discrepancy > 0 ? (
                              <span className="text-emerald-600">+{log.discrepancy} (زيادة)</span>
                            ) : (
                              <span className="text-rose-600">{log.discrepancy} (عجز)</span>
                            )}
                          </td>
                          <td className="p-5 text-slate-700 font-medium whitespace-nowrap">{log.auditor}</td>
                          <td className="p-5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteAuditLog(log.id)}
                              className="p-1.5 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="حذف الجرد"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. MODALS */}

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItemModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Boxes size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">| البيانات الأساسية لتكويد صنف</h3>
                </div>
                <button onClick={() => setShowAddItemModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">كود الصنف (SKU) *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: MAT-STE-06"
                      value={newItemCode}
                      onChange={e => setNewItemCode(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">تصنيف الخامة *</label>
                    <select
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value as any)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">اسم وصف الخامة التفصيلي *</label>
                  <input 
                    required
                    type="text"
                    placeholder="مثال: حديد تسليح عالي المقاومة قطر ١٢ مم"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الرصيد الافتتاحي *</label>
                    <input 
                      required
                      type="number"
                      min="0"
                      placeholder="مثال: 100"
                      value={newItemStock || ''}
                      onChange={e => setNewItemStock(Number(e.target.value))}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">وحدة القياس *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: طن، لتر"
                      value={newItemUnit}
                      onChange={e => setNewItemUnit(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الحد الأدنى للطلب *</label>
                    <input 
                      required
                      type="number"
                      min="0"
                      placeholder="مثال: 10"
                      value={newItemMinLimit || ''}
                      onChange={e => setNewItemMinLimit(Number(e.target.value))}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">المستودع الرئيسي لحفظ الخامة *</label>
                  <select
                    value={newItemWarehouse}
                    onChange={e => setNewItemWarehouse(e.target.value as any)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="مستودع المشروع الرئيسي">مستودع المشروع الرئيسي</option>
                    <option value="مستودع الميدان الفرعي">مستودع الميدان الفرعي</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-2xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    <span>حفظ الصنف</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MRIR Modal */}
      <AnimatePresence>
        {showMrirModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ArrowDownLeft size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">| بيانات الاستلام والفحص (MRIR)</h3>
                </div>
                <button onClick={() => setShowMrirModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleMRIRSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">رقم أمر الشراء (PO) *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: PO-1024"
                      value={mrirPo}
                      onChange={e => setMrirPo(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الصنف المستلم *</label>
                    <select
                      required
                      value={mrirItemCode}
                      onChange={e => setMrirItemCode(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">-- اختر الصنف --</option>
                      {warehouseItems.map(i => (
                        <option key={i.id} value={i.code}>{i.name} ({i.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الكمية المستلمة *</label>
                    <input 
                      required
                      type="number"
                      min="1"
                      placeholder="مثال: 50"
                      value={mrirQty || ''}
                      onChange={e => setMrirQty(Number(e.target.value))}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">المورد الشاحن *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: مصنع الراجحي للحديد"
                      value={mrirSupplier}
                      onChange={e => setMrirSupplier(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">مهندس الجودة الفاحص *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: أحمد عبد الله"
                      value={mrirInspector}
                      onChange={e => setMrirInspector(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الحالة الفنية للمواد *</label>
                    <select
                      value={mrirStatus}
                      onChange={e => setMrirStatus(e.target.value as any)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      <option value="Approved">مقبول ومطابق للمواصفات</option>
                      <option value="Rejected">مرفوض وغير مطابق</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">ملاحظات الفحص والتقييم</label>
                  <textarea 
                    rows={3}
                    placeholder="مثال: تم التأكد من مطابقة أبعاد وشهادات الجودة للمنتج..."
                    value={mrirNotes}
                    onChange={e => setMrirNotes(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowMrirModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-2xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    <span>تأكيد الاستلام</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MRN Modal */}
      <AnimatePresence>
        {showMrnModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                    <ArrowUpRight size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">| إذن صرف خامات للموقع (MRN)</h3>
                </div>
                <button onClick={() => setShowMrnModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleMRNSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">الصنف المراد صرفه *</label>
                  <select
                    required
                    value={mrnItemCode}
                    onChange={e => setMrnItemCode(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">-- اختر الصنف --</option>
                    {warehouseItems.map(i => (
                      <option key={i.id} value={i.code}>{i.name} (متاح: {i.currentStock} {i.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الكمية المطلوبة *</label>
                    <input 
                      required
                      type="number"
                      min="1"
                      placeholder="مثال: 15"
                      value={mrnQty || ''}
                      onChange={e => setMrnQty(Number(e.target.value))}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">طالب الصرف الميداني *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: م/ مصطفى سامي"
                      value={mrnRequester}
                      onChange={e => setMrnRequester(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">الغرض الهندسي ومكان التركيب *</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="مثال: أعمال صب الأساسات للمنطقة ج..."
                    value={mrnPurpose}
                    onChange={e => setMrnPurpose(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowMrnModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-2xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    <span>تأكيد الإذن والصرف</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Modal */}
      <AnimatePresence>
        {showAuditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Scale size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">| مطابقة جرد فعلية</h3>
                </div>
                <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAuditSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">الصنف الجاري جرده *</label>
                  <select
                    required
                    value={auditItemCode}
                    onChange={e => setAuditItemCode(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">-- اختر الصنف --</option>
                    {warehouseItems.map(i => (
                      <option key={i.id} value={i.code}>{i.name} (الرصيد النظامي: {i.currentStock} {i.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">الكمية الفعلية المقاسة *</label>
                    <input 
                      required
                      type="number"
                      min="0"
                      placeholder="مثال: 120"
                      value={auditPhysicalQty || ''}
                      onChange={e => setAuditPhysicalQty(Number(e.target.value))}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">مسؤول لجنة الجرد *</label>
                    <input 
                      required
                      type="text"
                      placeholder="مثال: محمد علي"
                      value={auditAuditor}
                      onChange={e => setAuditAuditor(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAuditModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-2xl transition-all"
                  >
                    إلغاء الأمر
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    <span>تأكيد التسوية الجردية</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
