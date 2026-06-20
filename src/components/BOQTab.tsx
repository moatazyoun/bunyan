/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Upload,
  Sparkles,
  Loader2
} from 'lucide-react';
import { BOQItem, Project } from '../types';

interface BOQTabProps {
  projectId: string; // Site ID
  projects: Project[];
  setProjects?: (projects: Project[]) => void;
  boqItems: BOQItem[];
  setBoqItems: (items: BOQItem[]) => void;
  userRole?: string;
}

export default function BOQTab({ projectId, projects, setProjects, boqItems, setBoqItems, userRole }: BOQTabProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Sync selectedProjectId whenever the list of projects updates/loads
  React.useEffect(() => {
    if (projects.length > 0) {
      const exists = projects.some(p => p.id === selectedProjectId);
      if (!selectedProjectId || !exists) {
        setSelectedProjectId(projects[0].id);
      }
    } else {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);
  
  // AI-powered BOQ upload states
  const [showAiUploader, setShowAiUploader] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [editingExtractedId, setEditingExtractedId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Partial<BOQItem>>({
    code: '',
    description: '',
    unit: 'م٣',
    quantity: 0,
    price: 0
  });

  const activeProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const activeBoqItems = boqItems.filter(item => item.projectId === selectedProjectId);
  
  const filteredItems = activeBoqItems.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ensureDefaultProject = (): string => {
    if (projects.length > 0) {
      return selectedProjectId || projects[0].id;
    }
    
    // Ensure default project if projects list is empty
    const defaultProjId = `proj-default`;
    if (setProjects) {
      const defaultProject: Project = {
        id: defaultProjId,
        name: 'العملية الافتراضية للموقع',
        assignmentNumber: 'إسناد داخلي مباشر / 01',
        assignmentDate: new Date().toISOString().split('T')[0],
        handoverDate: new Date().toISOString().split('T')[0],
        durationMonths: 12,
        status: 'Active'
      };
      setProjects([defaultProject]);
      setSelectedProjectId(defaultProjId);
    }
    return defaultProjId;
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.code) return;
    
    let targetProjectId = selectedProjectId;
    if (!targetProjectId) {
      targetProjectId = ensureDefaultProject();
    }
    
    const itemToAdd: BOQItem = {
      id: `boq-${Date.now()}`,
      projectId: targetProjectId,
      code: newItem.code || '',
      description: newItem.description || '',
      unit: newItem.unit || 'م٣',
      quantity: newItem.quantity || 0,
      price: newItem.price || 0
    };
    
    setBoqItems([...boqItems, itemToAdd]);
    setNewItem({ code: '', description: '', unit: 'م٣', quantity: 0, price: 0 });
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البند من المقايسة؟ قد يؤثر ذلك على المستخلصات المرتبطة.')) {
      setBoqItems(boqItems.filter(item => item.id !== id));
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<BOQItem>) => {
    setBoqItems(boqItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setExtractedItems([]);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch("/api/gemini/analyze-boq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64String,
            mimeType: file.type
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "فشل تحليل المستند.");
        }

        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          const mapped = data.items.map((it: any, index: number) => ({
            id: `temp-${Date.now()}-${index}`,
            code: it.code || '',
            description: it.description || '',
            unit: it.unit || 'م٣',
            quantity: Number(it.quantity) || 0,
            price: Number(it.price) || 0
          }));
          setExtractedItems(mapped);
        } else {
          throw new Error("لم يتم العثور على بنود صالحة في المقايسة.");
        }
      } catch (err: any) {
        console.error(err);
        setAnalysisError(err.message || 'حدث خطأ أثناء تواصل نظام الذكاء الاصطناعي مع الخدمة السحابية.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setAnalysisError("فشل قراءة ملف الـ PDF.");
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateExtracted = (id: string, updates: any) => {
    setExtractedItems(extractedItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSaveExtractedItems = () => {
    let targetProjectId = selectedProjectId || (projects[0] && projects[0].id);
    if (!targetProjectId) {
      targetProjectId = ensureDefaultProject();
    }
    if (extractedItems.length === 0) return;

    const itemsToAdd: BOQItem[] = extractedItems.map(it => ({
      id: `boq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      projectId: targetProjectId,
      code: it.code,
      description: it.description,
      unit: it.unit,
      quantity: it.quantity,
      price: it.price
    }));

    setBoqItems([...boqItems, ...itemsToAdd]);
    setExtractedItems([]);
    setShowAiUploader(false);
  };

  const totalBoqValue = activeBoqItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Summary Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">Active BOQ / Project Operation</label>
            {projects.length === 0 ? (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-slate-800">
                <span className="text-xs font-bold">
                  ⚠️ لا توجد مشاريع مسجلة بعد.
                </span>
                {setProjects && (
                  <button 
                    onClick={ensureDefaultProject}
                    className="bg-amber-600 font-sans text-white font-black text-[10px] rounded-lg px-2.5 py-1.5 hover:bg-amber-700 transition"
                  >
                    تفويض عملية افتراضية
                  </button>
                )}
              </div>
            ) : (
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-black outline-none focus:border-indigo-400 transition-all cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ({p.assignmentNumber})</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="h-12 w-[1px] bg-slate-100 hidden md:block" />
        <div className="flex gap-8 px-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">قيمة العملية</p>
            <p className="text-xl font-black text-slate-900 mt-1">{totalBoqValue.toLocaleString()} <span className="text-xs">ج.م</span></p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">تاريخ الإسناد</p>
            <p className="text-sm font-black text-slate-700 mt-1">{activeProject ? new Date(activeProject.assignmentDate).toLocaleDateString('ar-EG') : '---'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black">إجمالي قيمة المقايسة</h3>
          </div>
          <div className="text-3xl font-black mb-1 tabular-nums">
            {totalBoqValue.toLocaleString('en-US')}
            <span className="text-sm font-bold opacity-60 mr-2">ج.م</span>
          </div>
          <p className="text-[10px] font-bold opacity-70">القيمة التقديرية لكافة البنود المدرجة</p>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm border-b-4 border-b-blue-600">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800">عدد البنود</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {activeBoqItems.length}
            <span className="text-sm font-bold text-slate-400 mr-2">بند</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-1">مسجلة في قاعدة بيانات الموقع</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm border-b-4 border-b-emerald-600">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800">الحالة التعاقدية</h3>
          </div>
          <div className="text-xl font-black text-emerald-700">
            مقايسة معتمدة
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-1">جاهزة لسحب مستخلصات جارية</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث برقم البند أو الوصف..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية إضافة بنود') : () => {
                setShowAddForm(!showAddForm);
                setShowAiUploader(false);
              }}
              disabled={userRole === 'viewer'}
              className={`p-2.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-xs font-black
                ${userRole === 'viewer' ? 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none' : (showAddForm ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-indigo-600 text-white hover:bg-indigo-700')}
              `}
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'إلغاء' : 'إضافة بند جديد'}
            </button>

            <button 
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية استخدام الذكاء الاصطناعي') : () => {
                setShowAiUploader(!showAiUploader);
                setShowAddForm(false);
              }}
              disabled={userRole === 'viewer'}
              className={`p-2.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-xs font-black
                ${userRole === 'viewer' ? 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none' : (showAiUploader ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95')}
              `}
            >
              {showAiUploader ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
              {showAiUploader ? 'إلغاء الذكاء الاصطناعي' : 'رفع وتحليل بالذكاء الاصطناعي ✦'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 px-3 py-1.5 bg-slate-50 rounded-xl">
             <AlertCircle className="w-3.5 h-3.5" />
             تعديل سعر البند يؤثر آلياً على كافه المستخلصات غير المصروفة
          </div>
        </div>

        {showAiUploader && (
          <div className="p-6 bg-purple-50/40 border-b border-purple-100 animate-in slide-in-from-top duration-300">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600 rounded-xl text-white">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">تحليل ورفع المقايسة الذكي (PDF / صور)</h3>
                    <p className="text-[10px] font-semibold text-slate-500">قم برفع ملف المقايسة المسعرة لاستخراج البنود بالكامل وإدخالها تلقائياً</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAiUploader(false);
                    setExtractedItems([]);
                    setAnalysisError(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {extractedItems.length === 0 ? (
                <div className="border-2 border-dashed border-purple-200 rounded-2xl p-8 bg-white text-center hover:border-purple-400 transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isAnalyzing}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                        <div className="text-sm font-black text-slate-700 mt-2">جاري قراءة وتحليل ملف المقايسة بالذكاء الاصطناعي...</div>
                        <p className="text-[10px] font-bold text-slate-400 max-w-md leading-relaxed animate-pulse mt-0.5">
                          يقوم مراجع التكاليف الذكي بقراءة مستند المقايسة واستخراج البنود وتحديد التوصيفات الفنية، وحدات القياس، الكميات التعاقدية والأسعار، وتنسيقها تلقائياً لك. قد يستغرق ذلك بضع ثوانٍ...
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-purple-600 animate-bounce" />
                        <span className="text-xs font-black text-slate-800">اسحب وأفلت مستند المقايسة PDF هنا، أو اضغط لتحديد الملف</span>
                        <span className="text-[10px] font-bold text-slate-400">يدعم مستندات الـ PDF وصور المقايسات الممسوحة ضوئياً</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] bg-purple-50 text-purple-900 px-4 py-3 rounded-xl font-bold gap-4">
                    <span>✦ تم استخراج ({extractedItems.length}) بنداً بنجاح! يرجى مراجعة البنود أدناه لإجراء أي تعديلات قبل الحفظ النهائي.</span>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية اعتماد البنود') : handleSaveExtractedItems}
                        disabled={userRole === 'viewer'}
                        className={`rounded-xl px-6 py-2.5 font-black flex items-center gap-2 text-xs transition-all whitespace-nowrap border border-emerald-500/10 shadow-lg ${
                          userRole === 'viewer'
                            ? 'bg-slate-300 text-slate-100 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white shadow-emerald-500/20 cursor-pointer'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        اعتماد البنود وإدخالها للمقايسة
                      </button>
                      <button 
                        onClick={() => setExtractedItems([])}
                        className="bg-white border border-purple-200 text-purple-900 rounded-lg px-3 py-1.5 font-black hover:bg-purple-50 transition-all text-[11px] cursor-pointer"
                      >
                        إعادة الرفع
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm max-h-[400px] overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-slate-500 font-black">الكود</th>
                          <th className="p-3 text-slate-500 font-black w-[40%]">بيان الأعمال التوصيفي</th>
                          <th className="p-3 text-center text-slate-500 font-black">الوحدة</th>
                          <th className="p-3 text-center text-slate-500 font-black">الكمية</th>
                          <th className="p-3 text-center text-slate-500 font-black">السعر</th>
                          <th className="p-3 text-center text-slate-500 font-black">المجموع</th>
                          <th className="p-3 text-center text-slate-500 font-black">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {extractedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-purple-50/10 transition-colors">
                            <td className="p-3">
                              {editingExtractedId === item.id ? (
                                <input 
                                  value={item.code}
                                  onChange={(e) => handleUpdateExtracted(item.id, { code: e.target.value })}
                                  className="w-16 p-1 border border-purple-200 rounded text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="font-black text-purple-800">{item.code}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {editingExtractedId === item.id ? (
                                <textarea 
                                  value={item.description}
                                  onChange={(e) => handleUpdateExtracted(item.id, { description: e.target.value })}
                                  className="w-full p-1 border border-purple-200 rounded text-xs"
                                  rows={2}
                                />
                              ) : (
                                <div className="font-bold text-slate-800 leading-relaxed">{item.description}</div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingExtractedId === item.id ? (
                                <input 
                                  value={item.unit}
                                  onChange={(e) => handleUpdateExtracted(item.id, { unit: e.target.value })}
                                  className="w-12 p-1 border border-purple-200 rounded text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-black">{item.unit}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingExtractedId === item.id ? (
                                <input 
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateExtracted(item.id, { quantity: Number(e.target.value) })}
                                  className="w-20 p-1 border border-purple-200 rounded text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-slate-800">{item.quantity.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingExtractedId === item.id ? (
                                <input 
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => handleUpdateExtracted(item.id, { price: Number(e.target.value) })}
                                  className="w-20 p-1 border border-purple-200 rounded text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-emerald-600">{item.price.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-black text-slate-900">
                              {(item.quantity * item.price).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {editingExtractedId === item.id ? (
                                  <button onClick={() => setEditingExtractedId(null)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button onClick={() => setEditingExtractedId(item.id)} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setExtractedItems(extractedItems.filter(it => it.id !== item.id))}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-bold leading-relaxed flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black mb-1">عذراً! واجهت الذكاء الاصطناعي مشكلة أثناء تحليل مقايسة الـ PDF:</div>
                    <p>{analysisError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="p-6 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-1 md:grid-cols-5 gap-4 animate-in slide-in-from-top duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 mr-2">كود البند</label>
              <input 
                type="text" 
                placeholder="مثال: 1/1"
                value={newItem.code}
                onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 mr-2">توصيف البند</label>
              <input 
                type="text" 
                placeholder="وصف فني دقيق للبند..."
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">الوحدة</label>
                <input 
                  type="text" 
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">الكمية</label>
                <input 
                  type="number" 
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">سعر الوحدة</label>
                <input 
                  type="number" 
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button 
              onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حفظ البنود') : handleAddItem}
              className={`md:col-start-5 text-white rounded-xl font-bold text-xs transition h-11 ${
                userRole === 'viewer'
                  ? 'bg-slate-300 text-slate-100 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              حفظ البند في المقايسة
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-slate-500">رقم البند</th>
                <th className="p-4 text-slate-500 w-[40%]">بيان الأعمال</th>
                <th className="p-4 text-center text-slate-500">الوحدة</th>
                <th className="p-4 text-center text-slate-500">الكمية التعاقدية</th>
                <th className="p-4 text-center text-slate-500">سعر الفئة</th>
                <th className="p-4 text-center text-slate-500">إجمالي القيمة</th>
                <th className="p-4 text-center text-slate-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-black text-indigo-600">
                    {editingId === item.id ? (
                      <input 
                        className="w-16 p-1 border rounded" 
                        value={item.code} 
                        onChange={(e) => handleUpdateItem(item.id, { code: e.target.value })}
                      />
                    ) : (
                      item.code
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === item.id ? (
                      <textarea 
                        className="w-full p-1 border rounded text-[11px]" 
                        rows={2}
                        value={item.description} 
                        onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                      />
                    ) : (
                      <div className="font-bold text-slate-800 leading-relaxed">{item.description}</div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === item.id ? (
                      <input 
                        className="w-12 p-1 border rounded text-center" 
                        value={item.unit} 
                        onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                      />
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-500 font-black">{item.unit}</span>
                    )}
                  </td>
                  <td className="p-4 text-center font-mono">
                    {editingId === item.id ? (
                      <input 
                        type="number"
                        className="w-20 p-1 border rounded text-center" 
                        value={item.quantity} 
                        onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="font-bold">{item.quantity.toLocaleString('en-US')}</span>
                    )}
                  </td>
                  <td className="p-4 text-center font-mono">
                    {editingId === item.id ? (
                      <input 
                        type="number"
                        className="w-20 p-1 border rounded text-center" 
                        value={item.price} 
                        onChange={(e) => handleUpdateItem(item.id, { price: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="font-black text-emerald-600">{item.price.toLocaleString('en-US')}</span>
                    )}
                  </td>
                  <td className="p-4 text-center font-mono font-black text-slate-900">
                    {(item.quantity * item.price).toLocaleString('en-US')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {editingId === item.id ? (
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية التعديل') : () => setEditingId(item.id)} 
                          className={`p-1.5 rounded-lg transition ${
                            userRole === 'viewer'
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية الحذف') : () => handleDeleteItem(item.id)} 
                        className={`p-1.5 rounded-lg transition ${
                          userRole === 'viewer'
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center opacity-20 flex flex-col items-center">
                    <FileText className="w-12 h-12 mb-2" />
                    <p className="text-sm font-black">المقايسة خالية تماماً</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
