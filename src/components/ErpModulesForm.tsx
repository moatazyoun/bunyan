/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  Droplet, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  Calendar, 
  User, 
  Layers, 
  Activity, 
  Truck,
  Gauge,
  Thermometer,
  Shield,
  FileText
} from 'lucide-react';
import { 
  EquipmentRecord, 
  LabTestRecord, 
  HseIncidentRecord, 
  WbsTaskRecord, 
  WarehouseItemRecord,
  MaintenanceOrder
} from '../types';

interface ErpModulesFormProps {
  equipment: EquipmentRecord[];
  wbsTasks: WbsTaskRecord[];
  warehouseItems: WarehouseItemRecord[];
  onAddEquipmentLog: (eqId: string, hours: number, fuel: number) => void;
  onAddMaintenanceOrder: (order: Omit<MaintenanceOrder, 'id'>) => void;
  onAddLabTest: (test: Omit<LabTestRecord, 'id'>) => void;
  onAddHseIncident: (incident: Omit<HseIncidentRecord, 'id'>) => void;
  onUpdateWbsProgress: (taskId: string, progress: number) => void;
  onDispatchWarehouseItem: (itemId: string, qty: number, recipient: string, purpose: string) => void;
}

export default function ErpModulesForm({
  equipment,
  wbsTasks,
  warehouseItems,
  onAddEquipmentLog,
  onAddMaintenanceOrder,
  onAddLabTest,
  onAddHseIncident,
  onUpdateWbsProgress,
  onDispatchWarehouseItem
}: ErpModulesFormProps) {
  
  const [activeFormSection, setActiveFormSection] = useState<string>('equipment');

  // Form local states
  // 1. Equipment Work Hours
  const [selectedEqId, setSelectedEqId] = useState<string>(equipment[0]?.id || '');
  const [workHoursInput, setWorkHoursInput] = useState<string>('');
  const [fuelConsumedInput, setFuelConsumedInput] = useState<string>('');
  const [eqStatusSuccess, setEqStatusSuccess] = useState<boolean>(false);

  // 2. Maintenance Order
  const [maintEqId, setMaintEqId] = useState<string>(equipment[0]?.id || '');
  const [maintType, setMaintType] = useState<'preventive' | 'emergency'>('preventive');
  const [maintCost, setMaintCost] = useState<string>('');
  const [maintDesc, setMaintDesc] = useState<string>('');
  const [maintSuccess, setMaintSuccess] = useState<boolean>(false);

  // 3. QA/QC Laboratory Test
  const [qcRfiCode, setQcRfiCode] = useState<string>('RFI-RD3-SEC1-050');
  const [qcTestType, setQcTestType] = useState<'density' | 'grading' | 'marshall' | 'cbr'>('density');
  const [qcResult, setQcResult] = useState<'passed' | 'failed'>('passed');
  const [qcEngineer, setQcEngineer] = useState<string>('م. يحيى زكريا');
  const [qcMetricValue, setQcMetricValue] = useState<string>('');
  const [qcGradingDesc, setQcGradingDesc] = useState<string>('تطابق كلي مع المواصفة الفنية المعتمدة');
  const [qcSuccess, setQcSuccess] = useState<boolean>(false);

  // 4. HSE Safety Incident Form
  const [hseType, setHseType] = useState<'injury' | 'near_miss' | 'property_damage' | 'environmental'>('near_miss');
  const [hseSeverity, setHseSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [hseDesc, setHseDesc] = useState<string>('');
  const [hseAction, setHseAction] = useState<string>('');
  const [hseReporter, setHseReporter] = useState<string>('أ. سامر الخالدي');
  const [hseSuccess, setHseSuccess] = useState<boolean>(false);

  // 5. WBS Progress Update State
  const [wbsTaskId, setWbsTaskId] = useState<string>(wbsTasks[0]?.id || '');
  const [wbsProgressVal, setWbsProgressVal] = useState<string>('');
  const [wbsSuccess, setWbsSuccess] = useState<boolean>(false);

  // 6. Warehouse Dispatch
  const [whItemId, setWhItemId] = useState<string>(warehouseItems[0]?.id || '');
  const [whQty, setWhQty] = useState<string>('');
  const [whRecipient, setWhRecipient] = useState<string>('');
  const [whPurpose, setWhPurpose] = useState<string>('');
  const [whSuccess, setWhSuccess] = useState<boolean>(false);
  const [whError, setWhError] = useState<string>('');

  // Handlers
  const handleEqWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(workHoursInput);
    const fuel = parseFloat(fuelConsumedInput);
    if (isNaN(hours) || isNaN(fuel)) return;

    onAddEquipmentLog(selectedEqId, hours, fuel);
    setWorkHoursInput('');
    setFuelConsumedInput('');
    setEqStatusSuccess(true);
    setTimeout(() => setEqStatusSuccess(false), 3000);
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(maintCost);
    if (isNaN(cost) || !maintDesc.trim()) return;

    const eq = equipment.find(item => item.id === maintEqId);
    onAddMaintenanceOrder({
      equipmentId: maintEqId,
      equipmentCode: eq ? eq.code : 'UNKNOWN',
      date: new Date().toISOString().split('T')[0],
      type: maintType,
      cost,
      description: maintDesc,
      status: 'pending'
    });

    setMaintCost('');
    setMaintDesc('');
    setMaintSuccess(true);
    setTimeout(() => setMaintSuccess(false), 3000);
  };

  const handleQcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let testNameAr = 'اختبار ضبط جودة الطرق';
    let numericVal = parseFloat(qcMetricValue) || 0;

    let extraParams: any = {};
    if (qcTestType === 'density') {
      testNameAr = 'اختبار الكثافة الحقلية للتربة (سند كون)';
      extraParams.densityValue = numericVal;
    } else if (qcTestType === 'marshall') {
      testNameAr = 'اختبار خلاصة الإسفلت الساخن (ثبات تدفق مارشال)';
      extraParams.marshallValue = numericVal;
    } else if (qcTestType === 'cbr') {
      testNameAr = 'نسبة تحمل كاليفورنيا للتربة التحتية Subgrade (CBR)';
      extraParams.cbrValue = numericVal;
    } else {
      testNameAr = 'التدرج الحبيبي للركام المستعمل (Sieve Analysis)';
      extraParams.sieveGrading = qcGradingDesc;
    }

    onAddLabTest({
      rfiCode: qcRfiCode,
      testType: qcTestType,
      testNameAr,
      date: new Date().toISOString().split('T')[0],
      resultStatus: qcResult,
      engineer: qcEngineer,
      ...extraParams
    });

    setQcMetricValue('');
    setQcSuccess(true);
    setTimeout(() => setQcSuccess(false), 3000);
  };

  const handleHseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hseDesc.trim() || !hseAction.trim()) return;

    let typeNameAr = 'حدث سلامة عام';
    if (hseType === 'injury') typeNameAr = 'إصابة عمل موقعية مفرزة';
    if (hseType === 'near_miss') typeNameAr = 'شبه حادث (Near Miss) رادار';
    if (hseType === 'property_damage') typeNameAr = 'تدمير ممتلكات أو مركبة';
    if (hseType === 'environmental') typeNameAr = 'انسكاب كيميائي / وقود بيئي';

    onAddHseIncident({
      date: new Date().toISOString().split('T')[0],
      type: hseType,
      typeNameAr,
      severity: hseSeverity,
      description: hseDesc,
      actionTaken: hseAction,
      closed: true,
      reportedBy: hseReporter
    });

    setHseDesc('');
    setHseAction('');
    setHseSuccess(true);
    setTimeout(() => setHseSuccess(false), 3000);
  };

  const handleWbsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const progress = parseFloat(wbsProgressVal);
    if (isNaN(progress) || progress < 0 || progress > 100) return;

    onUpdateWbsProgress(wbsTaskId, progress);
    setWbsProgressVal('');
    setWbsSuccess(true);
    setTimeout(() => setWbsSuccess(false), 3000);
  };

  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(whQty);
    if (isNaN(qty) || qty <= 0 || !whRecipient.trim() || !whPurpose.trim()) return;

    // Validate stock
    const item = warehouseItems.find(i => i.id === whItemId);
    if (!item) return;

    if (item.currentStock < qty) {
      setWhError(`الرصيد المتاح غير كافٍ! الرصيد المتوفر الحالي هو ${item.currentStock} ${item.unit}`);
      return;
    }

    setWhError('');
    onDispatchWarehouseItem(whItemId, qty, whRecipient, whPurpose);
    setWhQty('');
    setWhRecipient('');
    setWhPurpose('');
    setWhSuccess(true);
    setTimeout(() => setWhSuccess(false), 3000);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs" id="erp-modules-form-container">
      
      {/* Upper Navigation and Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
        <div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-mono">FIELD OPERATIONS CENTER</span>
          <h3 className="font-bold text-slate-950 text-base mt-1.5 text-right">النماذج التشغيلية ودفاتر القيد الموقعي</h3>
          <p className="text-xs text-slate-500 mt-1 text-right">قم بتسجيل وتعديل الحركات الميدانية مباشرة لتحديث لوحات التحكم (سيارات ومعدات، وقود، جودة ومختبر، حوادث HSE، نسب إنجاز WBS)</p>
        </div>

        {/* Form Selector Buttons */}
        <div className="flex flex-wrap gap-1 md:self-auto self-start">
          <button
            onClick={() => setActiveFormSection('equipment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeFormSection === 'equipment' ? 'bg-indigo-650 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Truck size={13} />
            أعمال المعدات والصيانة
          </button>
          
          <button
            onClick={() => setActiveFormSection('qc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeFormSection === 'qc' ? 'bg-indigo-650 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Gauge size={13} />
            نتائج معامل ضبط الجودة
          </button>

          <button
            onClick={() => setActiveFormSection('hse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeFormSection === 'hse' ? 'bg-indigo-650 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <ShieldAlert size={13} />
            أحداث السلامة والبيئة HSE
          </button>

          <button
            onClick={() => setActiveFormSection('wbs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeFormSection === 'wbs' ? 'bg-indigo-650 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Layers size={13} />
            تعديل نسب إنجاز WBS
          </button>

          <button
            onClick={() => setActiveFormSection('warehouse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeFormSection === 'warehouse' ? 'bg-indigo-650 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Plus size={13} />
            إذن صرف أصناف مستودع
          </button>
        </div>
      </div>

      {/* RENDER FORMS */}

      {/* FORM 1: EQUIPMENT WORK AND MAINTENANCE */}
      {activeFormSection === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn text-right text-slate-800">
          
          {/* Work Hours logging */}
          <form onSubmit={handleEqWorkSubmit} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1.5">
              <Activity size={15} className="text-indigo-600" />
              أمر تشغيل يومي وساعات عمل المعدة
            </h4>
            <p className="text-[10.5px] text-slate-500">لتحديث ساعات التشغيل وحرق السولار الفعلي للمعدة، مما يغذي لوحة تحكم الوقود والتشغيل اليومي.</p>

            {eqStatusSuccess && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold rounded-lg">
                ✓ تم قيد حركة تشغيل المعدة وتحديث لوحات التحكم بنجاح!
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-650 mb-1">اختر المعدة من الأسطول</label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.code} • {eq.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-650 mb-1">ساعات العمل المنجزة اليوم</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="24"
                    placeholder="مثال: 8 ساعات"
                    value={workHoursInput}
                    onChange={(e) => setWorkHoursInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-mono font-bold text-left focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-650 mb-1">الوقود المستهلك (لتر ديرل)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="مثال: 120 لتر"
                    value={fuelConsumedInput}
                    onChange={(e) => setFuelConsumedInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-mono font-bold text-left focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition shadow-xs mt-2"
              >
                اعتماد وتحديث ساعات المعدة
              </button>
            </div>
          </form>

          {/* Maintenance Logging */}
          <form onSubmit={handleMaintSubmit} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1.5">
              <Wrench size={14} className="text-teal-600" />
              تحرير أمر صيانة أو إصلاح طارئ
            </h4>
            <p className="text-[10.5px] text-slate-500">يقيد تكاليف صيانة المعدات في بند المصاريف الإدارية ومركز تكلفة الآلات الثقيلة لتتبع العائد.</p>

            {maintSuccess && (
              <div className="p-2.5 bg-teal-50 border border-teal-150 text-teal-800 text-xs font-bold rounded-lg">
                ✓ تم قيد ومصادقة أمر تفتيش الصيانة والعيوب الدورية!
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-650 mb-1">حدد المعدة المتضررة</label>
                  <select
                    value={maintEqId}
                    onChange={(e) => setMaintEqId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.code} • {eq.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-650 mb-1">نوع الإصلاح</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="preventive">وقائي دوري (شحم وزيوت)</option>
                    <option value="emergency">طارئ (عطل مكابس أو قطع)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-650 mb-1">تكلفة الإصلاح وفواتير قطع الغيار الموقعية (ج.م)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-mono font-bold text-left focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-650 mb-1">بيان المبررات و أسباب العطل الميكانيكي</label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: تلف ذراع القشاطة الهيدروليكي جراء العمل الطويل في الكيلو 4..."
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-sans resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg text-xs hover:bg-teal-555 transition shadow-xs"
              >
                مصادقة وتحرير أمر الصيانة
              </button>
            </div>
          </form>

        </div>
      )}

      {/* FORM 2: QA/QC LAB TESTS */}
      {activeFormSection === 'qc' && (
        <form onSubmit={handleQcSubmit} className="animate-fadeIn max-w-2xl mx-auto border border-slate-150 p-5 rounded-xl bg-slate-50/50 text-right text-slate-800 space-y-4">
          <h4 className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1.5">
            <Gauge size={15} className="text-violet-600" />
            نموذج قيد نتيجة فحص مخبري ومطابقة مواصفات الجودة (AASHTO / ASTM)
          </h4>
          <p className="text-[10.5px] text-slate-500">تمكن مهندس الجودة والاستشاري من توثيق دمك أو صلابة التربة والإسفلت لتجنيد الغرامات ورفض الطبقات المعيوبة.</p>

          {qcSuccess && (
            <div className="p-2.5 bg-violet-50 border border-violet-150 text-violet-850 text-xs font-bold rounded-lg">
              ✓ تم تقييد نتيجة معمل الجودة بنجاح وتحديث لوحة الـ QA/QC!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">رقم كود إذن الفحص (RFI Code)</label>
              <input
                type="text"
                required
                placeholder="RFI-RD3-SEC1-050"
                value={qcRfiCode}
                onChange={(e) => setQcRfiCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">المهندس الفاحص المسئول</label>
              <input
                type="text"
                required
                value={qcEngineer}
                onChange={(e) => setQcEngineer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">نوع التحليل / الاختبار المعملي</label>
              <select
                value={qcTestType}
                onChange={(e) => setQcTestType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
              >
                <option value="density">دمك الكثافة الحقلي (Sand Cone)</option>
                <option value="marshall">ثبات وتدفق مارشال (Marshall Mix)</option>
                <option value="cbr">نسبة تحمل كاليفورنيا (CBR)</option>
                <option value="grading">التدرج الحبيبي للـ Sieve</option>
              </select>
            </div>

            {qcTestType !== 'grading' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-650 mb-1">
                  {qcTestType === 'density' && 'الكثافة الحقلية المقاسة (g/cm³)'}
                  {qcTestType === 'marshall' && 'قيمة ثبات مارشال (kg)'}
                  {qcTestType === 'cbr' && 'نسبة تحمل كاليفورنيا (%)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={qcTestType === 'density' ? 'مثال: 2.15' : qcTestType === 'cbr' ? 'مثال: 32' : 'مثال: 1150'}
                  value={qcMetricValue}
                  onChange={(e) => setQcMetricValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-left focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-650 mb-1">مواصفات التدرج الحبيبي للركام</label>
                <input
                  type="text"
                  required
                  value={qcGradingDesc}
                  onChange={(e) => setQcGradingDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">قرار الاستشاري ونتيجة الاختبار</label>
              <select
                value={qcResult}
                onChange={(e) => setQcResult(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none text-[11px]"
              >
                <option value="passed" className="text-emerald-600">✓ مقبول / مطابقة للمواصفات</option>
                <option value="failed" className="text-rose-600">❌ مرفوض / يتطلب إزالة وإعادة الدمك</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-violet-600 hover:bg-violet-550 text-white font-bold rounded-lg text-xs transition shadow-xs"
          >
            اعتماد وحفظ النتيجة في السجل المعملي
          </button>
        </form>
      )}

      {/* FORM 3: HSE INCIDENTS */}
      {activeFormSection === 'hse' && (
        <form onSubmit={handleHseSubmit} className="animate-fadeIn max-w-2xl mx-auto border border-slate-150 p-5 rounded-xl bg-slate-50/50 text-right text-slate-800 space-y-4">
          <h4 className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1.5">
            <ShieldAlert size={15} className="text-rose-600" />
            نموذج الإبلاغ الموقعي الفوري للتفتيش والسلامة المهنية (R-HSE Case)
          </h4>
          <p className="text-[10.5px] text-slate-500">لتسجيل شبه الحوادث أو المخالفات أو الأحوال المهيجة للأغراض الوقائية تزامناً مع متطلبات السلامة والوقاية (PPE).</p>

          {hseSuccess && (
            <div className="p-2.5 bg-rose-50 border border-rose-154 text-rose-800 text-xs font-bold rounded-lg">
              ✓ تم توثيق تقرير السلامة المهنية ومزامنة مؤشر الحوادث!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">تصنيف الحالة</label>
              <select
                value={hseType}
                onChange={(e) => setHseType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
              >
                <option value="near_miss">شبه حادث (Near Miss)</option>
                <option value="property_damage">تضرر مادي في الممتلكات</option>
                <option value="environmental">انسكاب وقود / ضرر بيئي</option>
                <option value="injury">إصابة عمل (LTI Case)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">درجة الخطورة والحرج المعنوي</label>
              <select
                value={hseSeverity}
                onChange={(e) => setHseSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
              >
                <option value="low">منخفضة الخطورة (لا توقف)</option>
                <option value="medium">متوسطة (علاج فوري)</option>
                <option value="high">مرتفعة (استدعاء طبي)</option>
                <option value="critical">حرجة جداً (توقف المشروع)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">المبلغ أو المفتش المبلّغ</label>
              <input
                type="text"
                required
                value={hseReporter}
                onChange={(e) => setHseReporter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-650 mb-1">التفاصيل الحرفية للحالة الموقعية</label>
            <textarea
              required
              rows={2}
              placeholder="مثال: تسرب زيت فرامل من هوراس الإسفلت أثناء التمهيد الجانبي مما هدد بانزلاق التربة..."
              value={hseDesc}
              onChange={(e) => setHseDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-sans resize-none focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-650 mb-1">الإجراءات والقرارات الفورية المتخذة لإقفال المشكل</label>
            <textarea
              required
              rows={2}
              placeholder="مثال: سحب الهراس لغرفة الصيانة، نشر بودرة ماصة للزيوت لتدعيم قوام المسلك، عقد اجتماع مصغر..."
              value={hseAction}
              onChange={(e) => setHseAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-sans resize-none focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
          >
            إرسال وتبليغ فوري لغرفة السلامة والأمان
          </button>
        </form>
      )}

      {/* FORM 4: WBS AND SCHEDULING */}
      {activeFormSection === 'wbs' && (
        <form onSubmit={handleWbsSubmit} className="animate-fadeIn max-w-xl mx-auto border border-slate-150 p-5 rounded-xl bg-slate-50/50 text-right text-slate-800 space-y-4">
          <h4 className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1.5">
            <Layers size={15} className="text-indigo-650" />
            تعديل وتوجيه نسب الإنجاز للمسار الحرج (WBS Scheduler)
          </h4>
          <p className="text-[10.5px] text-slate-500">تمكن مدير المشروع والمهندس التنفيذي من تحديث نسب الإنجاز المالي والفيزيائي المعتمدة للمقارنة بين المخطط (Planned) والمنفذ (Actual).</p>

          {wbsSuccess && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold rounded-lg">
              ✓ تم تحديث نسبة تقدم المسار الأيمن ومزامنة الجدول الزمني!
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-650 mb-1">اختر البند / المرحلة من مخطط WBS</label>
            <select
              value={wbsTaskId}
              onChange={(e) => setWbsTaskId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
            >
              {wbsTasks.map(task => (
                <option key={task.id} value={task.id}>{task.wbsCode} • {task.name} ({task.actualProgress}%)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-650 mb-1">نسبة الإنجاز الفعلية والمصادق عليها للفقرة الميدانية (%)</label>
            <input
              type="number"
              required
              min="0"
              max="100"
              placeholder="مثال: 85%"
              value={wbsProgressVal}
              onChange={(e) => setWbsProgressVal(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-left focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
          >
            اعتماد ودمج تقدم جدول WBS الكلي للمشروع
          </button>
        </form>
      )}

      {/* FORM 5: WAREHOUSE ITEMS DISPATCH */}
      {activeFormSection === 'warehouse' && (
        <form onSubmit={handleWarehouseSubmit} className="animate-fadeIn max-w-xl mx-auto border border-slate-150 p-5 rounded-xl bg-slate-50/50 text-right text-slate-800 space-y-4">
          <h4 className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1.5">
            <Plus size={15} className="text-amber-600" />
            تحرير إذن صرف كميات ومواد لمقاولي رصف الأرصفة والطرق
          </h4>
          <p className="text-[10.5px] text-slate-500">يتيح صرف الأسمنت، السن، البيتومين، أو دهانات الأمان الفوسفورية للمقاولين بدقة مع خصم الرصيد تلقائياً من المستودع.</p>

          {whSuccess && (
            <div className="p-2.5 bg-amber-50 border border-amber-150 text-amber-805 text-xs font-bold rounded-lg">
              ✓ تم اعتماد صرف المواد وقيد نقص المخزون التلقائي لتحديث المستودع!
            </div>
          )}

          {whError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg leading-relaxed">
              ❌ {whError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">اختر الصنف المتوفر بالمخزن</label>
              <select
                value={whItemId}
                onChange={(e) => setWhItemId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-[11px]"
              >
                {warehouseItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} • (رصيد: {item.currentStock} {item.unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">الكمية المراد سحبها وصرفها</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                placeholder="0.00"
                value={whQty}
                onChange={(e) => setWhQty(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-left focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">اسم المقاول / المستلم للمهام</label>
              <input
                type="text"
                required
                placeholder="مثال: المقاول ممدوح شاهين"
                value={whRecipient}
                onChange={(e) => setWhRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold text-right"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-650 mb-1">الغرض أو القسم المستفيد</label>
              <input
                type="text"
                required
                placeholder="مثال: رصف طبقة الإسمنت كيلو 4"
                value={whPurpose}
                onChange={(e) => setWhPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold text-right"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs"
          >
            اعتماد وصرف كمية الصنف وتحديث المخازن
          </button>
        </form>
      )}

    </div>
  );
}
