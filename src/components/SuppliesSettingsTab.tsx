import React, { useState } from 'react';
import { Plus, Trash2, Tag, User, Edit2, Check, X, Settings, Truck, CheckCircle, Hash, Type, DollarSign, Phone, FileText, Smartphone, Layout } from 'lucide-react';
import { SupplyItem, CubicCertificate } from '../types';
import GenericInputModal from './GenericInputModal';

interface SuppliesSettingsTabProps {
  suppliers: any[];
  setContractorsReport: React.Dispatch<React.SetStateAction<any[]>>;
  supplyItems: SupplyItem[];
  setSupplyItems: React.Dispatch<React.SetStateAction<SupplyItem[]>>;
  cubicCertificates?: CubicCertificate[];
}

export default function SuppliesSettingsTab({ 
  suppliers, 
  setContractorsReport, 
  supplyItems, 
  setSupplyItems,
  cubicCertificates = []
}: SuppliesSettingsTabProps) {
  // --- Materials State ---
  const [activeMaterialCode, setActiveMaterialCode] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('م٣');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItemCode, setEditingItemCode] = useState<string | null>(null);
  const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<Partial<SupplyItem>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // --- Suppliers State ---
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierContractNumber, setNewSupplierContractNumber] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false);
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editSupplierPhone, setEditSupplierPhone] = useState('');
  const [editSupplierContractNumber, setEditSupplierContractNumber] = useState('');
  
  // Modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDeliveryMethodModalOpen, setIsDeliveryMethodModalOpen] = useState(false);
  const [editingDeliveryMethod, setEditingDeliveryMethod] = useState<any | null>(null);
  const [selectedDetailMethod, setSelectedDetailMethod] = useState<any | null>(null);
  const [deliveryType, setDeliveryType] = useState<string>('قلاب');
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  
  // Truck fields
  const [truckNumber, setTruckNumber] = useState('');
  const [dumperNumber, setDumperNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [cubicCapacity, setCubicCapacity] = useState('');
  const [cubicRecordId, setCubicRecordId] = useState('');
  
  // Meter fields
  const [personInCharge, setPersonInCharge] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [hasTrailer, setHasTrailer] = useState(true);

  const activeMaterial = supplyItems.find(i => i.code === activeMaterialCode);
  
  // Group ALL suppliers by name first
  const allGroupedSuppliers = (suppliers || []).reduce((acc: any[], s) => {
    const existing = acc.find(item => item.name === s.name);
    if (!existing) {
      acc.push({ 
        ...s, 
        supplierIds: [s.id], 
        materialCodes: [s.materialCode],
        // Keep a map of materialCode -> supplierId for quick lookup when clicking the group
        materialToId: { [s.materialCode]: s.id }
      });
    } else {
      existing.supplierIds.push(s.id);
      existing.materialToId[s.materialCode] = s.id;
      if (!existing.materialCodes.includes(s.materialCode)) {
        existing.materialCodes.push(s.materialCode);
      }
    }
    return acc;
  }, []);

  // Filter groups to display: 
  // If activeMaterialCode is set, only show groups that supply that material
  // Otherwise show all groups
  const groupedSuppliers = activeMaterialCode 
    ? allGroupedSuppliers.filter(group => group.materialCodes.includes(activeMaterialCode))
    : allGroupedSuppliers;

  const activeSupplier = (suppliers || []).find(s => s.id === selectedSupplierId) || 
                        (groupedSuppliers.length > 0 ? (suppliers.find(s => s.id === groupedSuppliers[0].id) || groupedSuppliers[0]) : null);

  // --- Confirmation State ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const customConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  const updateSuppliers = (newList: any[] | ((prev: any[]) => any[])) => {
    setContractorsReport(newList);
  };

  const updateItems = (newList: SupplyItem[] | ((prev: SupplyItem[]) => SupplyItem[])) => {
    setSupplyItems(newList);
  };

  const updateActiveSupplierSpecs = (key: string, value: any) => {
    if (!activeSupplier) return;
    updateSuppliers(prev => (prev || []).map(s => {
      if (s.id === activeSupplier.id) {
        return { ...s, [key]: value };
      }
      return s;
    }));
  };

  const addDeliveryMethod = () => {
    const errors = {
      truckNumber: (deliveryType === 'عربية') && !truckNumber.trim(),
      dumperNumber: (deliveryType === 'قلاب') && !dumperNumber.trim(),
      driverName: !driverName.trim(),
      cubicCapacity: (['قلاب', 'عربية'].includes(deliveryType)) && !cubicRecordId && !cubicCapacity.trim()
    };
    
    setValidationErrors(errors);
    
    if (!activeSupplier || errors.truckNumber || errors.dumperNumber || (['قلاب', 'عربية'].includes(deliveryType) && errors.driverName) || errors.cubicCapacity) {
      alert("يرجى ملء الحقول الإجبارية");
      return;
    }
    
    const newMethod = { 
      id: editingDeliveryMethod ? editingDeliveryMethod.id : `dm-${Date.now()}`,
      type: deliveryType,
      truckNumber: ['قلاب', 'عربية'].includes(deliveryType) ? truckNumber : '',
      dumperNumber: deliveryType === 'قلاب' ? dumperNumber : '',
      driverName,
      driverPhone,
      cubicCapacity: cubicRecordId ? 'مکعبة' : cubicCapacity.trim(),
      cubicRecordId,
      personInCharge,
      personPhone
    };

    const updatedMethods = editingDeliveryMethod 
      ? (activeSupplier.deliveryMethods || []).map((dm: any) => dm.id === editingDeliveryMethod.id ? newMethod : dm)
      : [...(activeSupplier.deliveryMethods || []), newMethod];
    
    updateActiveSupplierSpecs('deliveryMethods', updatedMethods);
    alert(editingDeliveryMethod ? "تم تعديل طريقة التوريد بنجاح" : "تم إضافة طريقة التوريد بنجاح");
    
    // Reset fields
    setEditingDeliveryMethod(null);
    setDeliveryType('قلاب');
    setTruckNumber('');
    setDumperNumber('');
    setHasTrailer(true);
    setDriverName('');
    setDriverPhone('');
    setCubicCapacity('');
    setCubicRecordId('');
    setPersonInCharge('');
    setPersonPhone('');
    setValidationErrors({});
    setIsDeliveryMethodModalOpen(false);
  };

  const deleteDeliveryMethod = (methodId: string) => {
    if (!activeSupplier) return;
    customConfirm(
      'حذف طريقة التوريد',
      'هل أنت متأكد من حذف طريقة التوريد هذه؟',
      () => {
        updateSuppliers(prev => {
          return (prev || []).map(s => {
            if (s.id === activeSupplier.id) {
              return {
                ...s,
                deliveryMethods: (s.deliveryMethods || []).filter((dm: any) => dm.id !== methodId)
              };
            }
            return s;
          });
        });
      }
    );
  };

  const startEditDeliveryMethod = (dm: any) => {
    setEditingDeliveryMethod(dm);
    setDeliveryType(dm.type);
    setTruckNumber(dm.truckNumber || '');
    setDumperNumber(dm.dumperNumber || '');
    setHasTrailer(dm.type === 'قلاب' ? (dm.truckNumber !== 'بدون') : true);
    setDriverName(dm.driverName || '');
    setDriverPhone(dm.driverPhone || '');
    setCubicCapacity(dm.cubicCapacity === 'مکعبة' ? '' : dm.cubicCapacity || '');
    setCubicRecordId(dm.cubicRecordId || '');
    setPersonInCharge(dm.personInCharge || '');
    setPersonPhone(dm.personPhone || '');
    setIsDeliveryMethodModalOpen(true);
  };

  // --- Materials Handlers ---
  const updateActiveMaterialSpecs = (key: string, value: any) => {
    if (!activeMaterialCode) return;
    setSupplyItems((supplyItems || []).map(i => {
      if (i.code === activeMaterialCode) {
        return { ...i, [key]: value };
      }
      return i;
    }));
  };
  const addSupplyItem = () => {
    const newErrors = {
      code: !newItemCode.trim(),
      name: !newItemName.trim(),
      price: !newItemPrice.trim() || isNaN(parseFloat(newItemPrice))
    };
    setErrors(newErrors);
    if (newErrors.code || newErrors.name || newErrors.price) {
      return;
    }
    const newItem: SupplyItem = {
      code: newItemCode.trim(),
      name: newItemName.trim(),
      unit: newItemUnit,
      defaultPrice: parseFloat(newItemPrice) || 0
    };
    
    updateItems(prev => [...(prev || []), newItem]);
    alert("تم إضافة المادة الجديدة بنجاح");
    setNewItemName('');
    setNewItemCode('');
    setNewItemPrice('');
    setNewItemUnit('م٣');
    setErrors({});
    
    if (!activeMaterialCode) {
      setActiveMaterialCode(newItemCode);
    }
    setIsMaterialModalOpen(false);
  };

  const startEditItem = (e: React.MouseEvent, item: SupplyItem) => {
    e.stopPropagation();
    setEditingItemCode(item.code);
    setEditItemData(item);
    setIsEditMaterialModalOpen(true);
  };

  const saveEditItem = () => {
    if (!editItemData.name?.trim() || !editItemData.code?.trim() || !editItemData.defaultPrice) return;
    updateItems(prev => (prev || []).map(i => i.code === editingItemCode ? editItemData as SupplyItem : i));
    alert("تم تعديل المادة بنجاح");
    setEditingItemCode(null);
    setIsEditMaterialModalOpen(false);
  };

  const deleteSupplyItem = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    customConfirm(
      'حذف المادة',
      'هل أنت متأكد من حذف هذه المادة؟ سيؤدي ذلك لحذفها من قائمة المواد الموردة.',
      () => {
        updateItems(prev => (prev || []).filter(i => i.code !== code));
        if (activeMaterialCode === code) {
          setActiveMaterialCode(null);
        }
      }
    );
  };

  // --- Suppliers Handlers ---
  const handleSelectSupplier = (s: any) => {
    setNewSupplierName(s.name);
    setNewSupplierPhone(s.phone || '');
    setNewSupplierContractNumber(s.contractNumber || '');
  };

  const addSupplier = () => {
    if (!newSupplierName.trim()) return;
    if (!activeMaterialCode) {
      alert("يرجى اختيار مادة من القائمة الجانبية أولاً لتحديد نوع التوريد لهذا المورد");
      return;
    }
    
    const trimmedName = newSupplierName.trim();
    
    // Check if EXACT combination exists
    const duplicate = (suppliers || []).find(s => s.name === trimmedName && s.materialCode === activeMaterialCode);
    if (duplicate) {
      alert(`المورد "${trimmedName}" مضاف بالفعل لهذه المادة`);
      return;
    }

    // Check if supplier name exists for OTHER materials to copy basic info
    const existingHuman = (suppliers || []).find(s => s.name === trimmedName);
    
    const newSupplier = {
      id: `sup-${Date.now()}`,
      name: trimmedName,
      materialCode: activeMaterialCode,
      phone: existingHuman ? (existingHuman.phone || '') : newSupplierPhone,
      contractNumber: existingHuman ? (existingHuman.contractNumber || '') : newSupplierContractNumber,
      notes: existingHuman ? (existingHuman.notes || '') : '',
      deliveryMethods: existingHuman ? (existingHuman.deliveryMethods || []) : []
    };
    
    updateSuppliers(prev => [...(prev || []), newSupplier]);
    alert("تم إضافة المورد بنجاح");
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierContractNumber('');
    setIsSupplierModalOpen(false);
  };

  const startEditSupplier = (s: any) => {
    setEditingSupplier(s);
    setEditSupplierName(s.name);
    setEditSupplierPhone(s.phone || '');
    setEditSupplierContractNumber(s.contractNumber || '');
    setIsEditSupplierModalOpen(true);
  };

  const saveEditSupplier = () => {
    if (!editSupplierName.trim() || !editingSupplier) return;
    updateSuppliers(prev => (prev || []).map(s => s.id === editingSupplier.id ? { 
      ...s, 
      name: editSupplierName,
      phone: editSupplierPhone,
      contractNumber: editSupplierContractNumber
    } : s));
    setEditingSupplier(null);
    alert("تم تعديل بيانات المورد بنجاح");
    setIsEditSupplierModalOpen(false);
  };

  const deleteSupplier = (id: string) => {
    const supplierToDelete = suppliers.find(s => s.id === id);
    if (!supplierToDelete) return;

    customConfirm(
      'حذف المورد',
      `هل أنت متأكد من حذف المورد "${supplierToDelete.name}" بجميع خاماته؟`,
      () => {
        updateSuppliers(prev => (prev || []).filter(s => s.name !== supplierToDelete.name));
      }
    );
  };

  const getUnitDisplay = (unit?: string) => {
    if (!unit) return '';
    const u = unit.trim();
    if (u === 'م٣') return 'بالمتر المكعب (م٣)';
    if (u === 'م٢') return 'بالمتر المربع (م٢)';
    if (u === 'طن') return 'بالطن (طن)';
    if (u === 'عدد') return 'بالعدد';
    if (u === 'نقلة' || u === 'نقلة / سيارة' || u === 'عربية') return 'بالقلابات / النقلة';
    return `بالـ ${u}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">إعداد الموردين والخامات</h2>
          <p className="text-slate-500 text-sm mt-1">إدارة قائمة الخامات الأساسية وربط المقاولين بمعدات التوريد</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsMaterialModalOpen(true)}
             className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
           >
             <Plus className="h-4 w-4" />
             إضافة مادة
           </button>
           <button 
             onClick={() => setIsSupplierModalOpen(true)}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
           >
             <Plus className="h-4 w-4" />
             إضافة مورد
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* 1. Materials Management - The Catalog */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full ring-4 ring-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <Tag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">كتالوج الأصناف</h3>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Materials Catalog</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
            {(!supplyItems || supplyItems.length === 0) ? (
              <div className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <Tag className="h-8 w-8 text-slate-300 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400 text-xs font-medium">لا توجد مواد مضافة بعد</p>
              </div>
            ) : (
              supplyItems.map(item => (
                <div 
                  key={item.code} 
                  onClick={() => setActiveMaterialCode(activeMaterialCode === item.code ? null : item.code)}
                  className={`group relative flex flex-col p-4 border rounded-[1.75rem] transition-all cursor-pointer ${
                    activeMaterialCode === item.code 
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className={`font-black text-sm transition-colors ${activeMaterialCode === item.code ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {item.name}
                      </div>
                      <span className="inline-block mt-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200/50 uppercase tracking-tighter">
                        {item.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={(e) => startEditItem(e, item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => deleteSupplyItem(e, item.code)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100/50 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-emerald-600 font-mono">{item.defaultPrice.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">ج.م / {item.unit}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${activeMaterialCode === item.code ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200 group-hover:bg-emerald-200'}`}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Suppliers Management - The Personnel Directory */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full ring-4 ring-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">دليل المقاولين</h3>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Contractors Hub</p>
              </div>
            </div>
            {activeMaterialCode && (
              <button 
                onClick={() => setActiveMaterialCode(null)}
                className="text-[9px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-all border border-indigo-100/50 flex items-center gap-1.5"
              >
                <X className="h-3 w-3" />
                الكل
              </button>
            )}
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
            {(!groupedSuppliers || groupedSuppliers.length === 0) ? (
              <div className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <User className="h-8 w-8 text-slate-300 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400 text-xs font-medium">لا يوجد موردين مضافين لهذه المادة</p>
              </div>
            ) : (
              groupedSuppliers.map(group => {
                const isActive = group.supplierIds.includes(activeSupplier?.id);
                
                return (
                  <div 
                    key={group.id} 
                    onClick={() => {
                      const targetId = activeMaterialCode 
                        ? (group.materialToId[activeMaterialCode] || group.id)
                        : group.id;
                      setSelectedSupplierId(targetId);
                    }}
                    className={`group relative flex flex-col p-4 border rounded-[1.75rem] transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-50/50 border-indigo-500 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className={`font-black text-sm transition-colors flex items-center gap-2 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {group.name}
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></span>}
                        </div>
                        {group.phone && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{group.phone}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => startEditSupplier(group)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors shadow-sm">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteSupplier(group.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-colors shadow-sm">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2 overflow-hidden">
                      {group.materialCodes.map((mCode: string) => {
                        const material = supplyItems.find(i => i.code === mCode);
                        const isPrimary = mCode === activeMaterialCode;
                        return (
                          <span 
                            key={mCode} 
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border transition-all ${
                              isPrimary 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            <Tag className={`h-2.5 w-2.5 ${isPrimary ? 'text-indigo-200' : 'text-slate-400'}`} />
                            {material?.name || mCode}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Delivery Method and Specs - The Configuration Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-lg flex flex-col h-full ring-4 ring-indigo-50/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/50">
                <Settings className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">وسائل التوريد</h3>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Logistics Setup</p>
              </div>
            </div>
            {activeSupplier && (
              <button 
                onClick={() => setIsDeliveryMethodModalOpen(true)} 
                className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-all border border-amber-200/50"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-4">
            {!activeSupplier ? (
              <div className="flex flex-col items-center justify-center text-center py-20 px-8 bg-amber-50/30 rounded-[2rem] border border-dashed border-amber-200">
                <div className="w-16 h-16 bg-white border border-amber-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <User className="h-8 w-8 text-amber-200" />
                </div>
                <h4 className="text-amber-900 font-black text-sm mb-2">اختر مورداً أولاً</h4>
                <p className="text-amber-700/60 text-[11px] font-medium leading-relaxed">
                  برجاء النقر على المورد من القائمة لتعديل سياراته وطرق توريده الخاصة.
                </p>
              </div>
            ) : (
                <div className="space-y-4">
                  {/* Summary Card for Active Supplier */}
                  <div className="p-4 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-16"></div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المقاول النشط</p>
                      <h4 className="text-xl font-black truncate">{activeSupplier.name}</h4>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold border border-white/5">
                          {activeSupplier.deliveryMethods?.length || 0} وسيلة
                        </div>
                        {activeSupplier.contractNumber && (
                          <div className="text-slate-400 text-[10px] font-bold">عقد #{activeSupplier.contractNumber}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(activeSupplier.deliveryMethods || []).map((dm: any) => {
                      const matchCert = cubicCertificates.find((c: any) => c.dumperId === dm.id);
                      const resolvedCubic = matchCert ? (matchCert.netCubic ?? matchCert.totalCubic) : dm.cubicCapacity;
                      const resolvedRecordId = matchCert ? matchCert.id : dm.cubicRecordId;

                      return (
                        <div key={dm.id} className="group flex flex-col p-4 bg-white border border-slate-100 rounded-[1.75rem] hover:border-amber-200 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-amber-50">
                                <Truck className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                              </div>
                              <span className="text-sm font-black text-slate-800">
                                {dm.type === 'قلاب' ? `قلاب: ${dm.dumperNumber}` : 
                                dm.type === 'عربية' ? `عربية: ${dm.truckNumber}` : 
                                dm.personInCharge || dm.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditDeliveryMethod(dm)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteDeliveryMethod(dm.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>

                          <div className="space-y-2">
                             <div className="flex flex-wrap gap-3">
                                {dm.driverName && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                    {dm.driverName}
                                  </div>
                                )}
                                {resolvedCubic && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                    {resolvedCubic} م٣
                                  </div>
                                )}
                             </div>

                             {matchCert && (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-[9px] font-black">
                                  <CheckCircle className="h-3 w-3" />
                                  السيارة مكعبة هندسياً (محضر #{matchCert.id})
                                </div>
                             )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {(activeSupplier.deliveryMethods || []).length === 0 && (
                      <div className="text-center py-10 px-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                        <Truck className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-[10px] font-bold">لا يوجد أسطول مضاف حالياً</p>
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals and Overlays */}
      <GenericInputModal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="إضافة مادة جديدة">
        <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">كود الصنف</label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  value={newItemCode}
                  onChange={(e) => { setNewItemCode(e.target.value); setErrors(prev => ({ ...prev, code: !e.target.value.trim() })); }}
                  placeholder="مثال: سن-1"
                  className={`w-full bg-slate-50 border rounded-2xl pr-10 pl-4 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all ${errors.code ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500'}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">اسم المادة</label>
              <div className="relative">
                <Type className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  value={newItemName}
                  onChange={(e) => { setNewItemName(e.target.value); setErrors(prev => ({ ...prev, name: !e.target.value.trim() })); }}
                  placeholder="مثال: سن طبقة أساس"
                  className={`w-full bg-slate-50 border rounded-2xl pr-10 pl-4 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">السعر الافتراضي</label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    value={newItemPrice}
                    onChange={(e) => { setNewItemPrice(e.target.value); setErrors(prev => ({ ...prev, price: !e.target.value.trim() || isNaN(parseFloat(e.target.value)) })); }}
                    placeholder="0.00"
                    type="number"
                    className={`w-full bg-slate-50 border rounded-2xl pr-10 pl-4 py-3 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all ${errors.price ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500'}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">وحدة القياس</label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all focus:border-emerald-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                >
                  <option value="م٣">متر مكعب (م٣)</option>
                  <option value="طن">طن</option>
                  <option value="عدد">عدد / قطعة</option>
                  <option value="م٢">متر مربع (م٢)</option>
                  <option value="نقلة">نقلة / سيارة</option>
                </select>
              </div>
            </div>

            <button onClick={addSupplyItem} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-2 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              إضافة المادة للكتالوج
            </button>
        </div>
      </GenericInputModal>

      <GenericInputModal isOpen={isEditMaterialModalOpen} onClose={() => setIsEditMaterialModalOpen(false)} title="تعديل بيانات المادة">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">كود الصنف</label>
            <div className="relative">
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                value={editItemData.code || ''} onChange={e => setEditItemData({...editItemData, code: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" placeholder="الكود"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">اسم المادة</label>
            <div className="relative">
              <Type className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                value={editItemData.name || ''} onChange={e => setEditItemData({...editItemData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" placeholder="الاسم"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">السعر</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="number" value={editItemData.defaultPrice || ''} onChange={e => setEditItemData({...editItemData, defaultPrice: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" placeholder="السعر"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">الوحدة</label>
              <select
                value={editItemData.unit || 'م٣'} onChange={e => setEditItemData({...editItemData, unit: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="م٣">م٣</option>
                <option value="طن">طن</option>
                <option value="عدد">عدد</option>
                <option value="م٢">م٢</option>
                <option value="نقلة">نقلة / سيارة</option>
              </select>
            </div>
          </div>
            <button onClick={saveEditItem} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-2">
              <Check className="h-4 w-4" />
              حفظ التغييرات
            </button>
        </div>
      </GenericInputModal>

      <GenericInputModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="إضافة مقاول / مورد جديد">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">اسم المقاول</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="اسم المورد الجديد..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500"
              />
              {(newSupplierName && newSupplierName.length > 0) && (
                <div className="absolute w-full bg-white border border-slate-200 rounded-2xl shadow-xl mt-2 max-h-40 overflow-y-auto z-20 overflow-hidden ring-1 ring-slate-100">
                  {Array.from(new Map(suppliers.map(s => [s.name, s])).values())
                    .filter(s => s.name.includes(newSupplierName) && s.name !== newSupplierName)
                    .map(s => (
                      <div key={s.id} onClick={() => handleSelectSupplier(s)} className="px-5 py-3 hover:bg-indigo-50 cursor-pointer text-xs font-black text-slate-700 border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors">
                        {s.name}
                        <Plus className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم التواصل</label>
              <div className="relative">
                <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم العقد</label>
              <div className="relative">
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  value={newSupplierContractNumber}
                  onChange={(e) => setNewSupplierContractNumber(e.target.value)}
                  placeholder="عقد توريد..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

            <button onClick={() => addSupplier()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-2 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              تسجيل المورد بالدليل
            </button>
        </div>
      </GenericInputModal>

      <GenericInputModal isOpen={isEditSupplierModalOpen} onClose={() => setIsEditSupplierModalOpen(false)} title={`تحديث بيانات: ${editingSupplier?.name || ''}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">اسم المقاول</label>
            <input 
              value={editSupplierName}
              onChange={(e) => setEditSupplierName(e.target.value)}
              placeholder="اسم المورد..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم التليفون</label>
              <input 
                value={editSupplierPhone}
                onChange={(e) => setEditSupplierPhone(e.target.value)}
                placeholder="رقم تليفون المورد..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم العقد</label>
              <input 
                value={editSupplierContractNumber}
                onChange={(e) => setEditSupplierContractNumber(e.target.value)}
                placeholder="رقم عقد التوريد..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500"
              />
            </div>
          </div>
            <button onClick={saveEditSupplier} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              <Check className="h-4 w-4" />
              حفظ التعديلات النهائية
            </button>
        </div>
      </GenericInputModal>

      <GenericInputModal isOpen={isDeliveryMethodModalOpen} onClose={() => { setIsDeliveryMethodModalOpen(false); setEditingDeliveryMethod(null); }} title={editingDeliveryMethod ? "تعديل " : "إضافة وسيلة توريد"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">نوع الوسيلة</label>
             <select 
              value={deliveryType} 
              onChange={(e) => setDeliveryType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
            >
              <option value="قلاب">قلاب / ديمبر</option>
              <option value="عربية">عربية نقل / تريلا</option>
              <option value="م٣">متر مكعب (مباشر)</option>
              <option value="عدد">بالعدد / القطعة</option>
              <option value="م.ط">متر طولي</option>
              <option value="م٢">متر مربع</option>
              <option value="طن">طن</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          {deliveryType === 'قلاب' && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl ring-1 ring-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setHasTrailer(true);
                  if (truckNumber === 'بدون') setTruckNumber('');
                }}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${hasTrailer ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <Layout className="h-3.5 w-3.5" />
                بمقـطورة
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasTrailer(false);
                  setTruckNumber('بدون');
                }}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${!hasTrailer ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <Truck className="h-3.5 w-3.5" />
                بـدون مقطورة
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {deliveryType === 'قلاب' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم القلاب</label>
                  <input value={dumperNumber} onChange={(e) => { setDumperNumber(e.target.value); setValidationErrors(prev => ({...prev, dumperNumber: !e.target.value.trim()})) }} placeholder="000 | ا ب ج" className={`w-full bg-slate-50 border ${validationErrors.dumperNumber ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-2xl px-5 py-3 text-sm font-black transition-all outline-none focus:border-indigo-500`} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم المقطورة</label>
                  <input 
                    value={truckNumber} 
                    onChange={(e) => setTruckNumber(e.target.value)} 
                    disabled={!hasTrailer}
                    placeholder={hasTrailer ? "000 | ا ب ج" : "بدون"} 
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black transition-all outline-none ${!hasTrailer ? 'opacity-40 cursor-not-allowed bg-slate-100 border-dashed' : 'focus:border-indigo-500'}`} 
                  />
                </div>
              </>
            )}
            {deliveryType === 'عربية' && (
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم العربية / اللوري</label>
                <input value={truckNumber} onChange={(e) => { setTruckNumber(e.target.value); setValidationErrors(prev => ({...prev, truckNumber: !e.target.value.trim()})) }} placeholder="رقم اللوحة المعدنية..." className={`w-full bg-slate-50 border ${validationErrors.truckNumber ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-2xl px-5 py-3 text-sm font-black transition-all outline-none focus:border-indigo-500`} />
              </div>
            )}
          </div>

          {(deliveryType === 'قلاب' || deliveryType === 'عربية') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">اسم السائق</label>
                <input value={driverName} onChange={(e) => { setDriverName(e.target.value); setValidationErrors(prev => ({...prev, driverName: !e.target.value.trim()})) }} placeholder="اسم السائق..." className={`w-full bg-slate-50 border ${validationErrors.driverName ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none focus:border-indigo-500`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">تليفون السائق</label>
                <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="01xxxxxxxxx" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black transition-all outline-none focus:border-indigo-500" />
              </div>
            </div>
          )}
          
          {(['قلاب', 'عربية'].includes(deliveryType)) && (
            <div className="col-span-2 space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">التكعيب المعتمد (م٣)</label>
              {cubicRecordId ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-[11px] font-black text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  السيارة مكعبة هندسياً بالمحضر رقم: <span className="text-indigo-600 font-mono tracking-tighter">#{cubicRecordId}</span>
                </div>
              ) : (
                <div className="relative">
                   <Layout className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                   <input value={cubicCapacity} onChange={(e) => { setCubicCapacity(e.target.value); setValidationErrors(prev => ({...prev, cubicCapacity: !e.target.value.trim()})) }} placeholder="ادخل سعة السيارة بالمتر المكعب..." className={`w-full bg-slate-50 border ${validationErrors.cubicCapacity ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-2xl pr-10 pl-4 py-3 text-sm font-black transition-all outline-none focus:border-indigo-500`} />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">المسؤول عن التوريد</label>
              <input value={personInCharge} onChange={(e) => setPersonInCharge(e.target.value)} placeholder="الاسم..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم تليفونه</label>
              <input value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} placeholder="رقم تليفونه..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black transition-all outline-none focus:border-indigo-500" />
            </div>
          </div>
          
          <button onClick={addDeliveryMethod} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-2 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              تأكيد إضافة وسيلة التوريد
          </button>
        </div>
      </GenericInputModal>

      {selectedDetailMethod && (() => {
        const modalCert = cubicCertificates.find((c: any) => c.dumperId === selectedDetailMethod.id);
        const modalResolvedCubic = modalCert ? (modalCert.netCubic ?? modalCert.totalCubic) : selectedDetailMethod.cubicCapacity;
        const modalRecordId = modalCert ? modalCert.id : selectedDetailMethod.cubicRecordId;

        return (
          <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setSelectedDetailMethod(null)}>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-full h-2 bg-indigo-600"></div>
              <h3 className="font-black text-xl mb-6 text-slate-900 flex items-center gap-2">
                <Truck className="h-6 w-6 text-indigo-600" />
                تفاصيل وسيلة التوريد
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                   <span className="text-slate-400 font-bold">نوع التوريد</span>
                   <span className="text-slate-900 font-black">{selectedDetailMethod.type}</span>
                </div>
                {['قلاب', 'عربية'].includes(selectedDetailMethod.type) ? (
                  <>
                    {selectedDetailMethod.type === 'قلاب' && (
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-400 font-bold">رقم القلاب</span>
                        <span className="text-slate-900 font-black">{selectedDetailMethod.dumperNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                       <span className="text-slate-400 font-bold">{selectedDetailMethod.type === 'قلاب' ? 'رقم المقطورة' : 'رقم العربية'}</span>
                       <span className="text-slate-900 font-black">{selectedDetailMethod.truckNumber || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                       <span className="text-slate-400 font-bold">اسم السائق</span>
                       <span className="text-slate-900 font-black">{selectedDetailMethod.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                       <span className="text-slate-400 font-bold">التكعيب المعتمد</span>
                       <span className="text-emerald-600 font-black">{modalResolvedCubic} م٣</span>
                    </div>
                    {modalCert && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          اعتماد هندسي نهائي
                        </div>
                        <p className="text-[10px] text-emerald-600/70 font-bold">محضر رقم: {modalCert.id} بتاريخ {modalCert.date}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p><strong>المسؤول:</strong> {selectedDetailMethod.personInCharge || 'غير محدد'}</p>
                    <p><strong>رقم التليفون:</strong> {selectedDetailMethod.personPhone || 'غير محدد'}</p>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedDetailMethod(null)} className="w-full mt-8 bg-slate-900 text-white font-black py-3 rounded-2xl hover:bg-slate-800 transition shadow-lg shadow-slate-200">إغلاق</button>
            </div>
          </div>
        );
      })()}

      {/* Reusable Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100">
             <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="h-8 w-8 text-red-500" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">{confirmConfig.title}</h3>
             <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{confirmConfig.message}</p>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors">إلغاء</button>
               <button onClick={() => { confirmConfig.onConfirm(); setConfirmConfig({ ...confirmConfig, isOpen: false }); }} className="py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg shadow-red-100">تأكيد الحذف</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
