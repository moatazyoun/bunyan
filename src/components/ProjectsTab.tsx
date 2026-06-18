/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  FileCheck,
  TrendingUp,
  X,
  Search,
  Calculator
} from 'lucide-react';
import { Project, BOQItem } from '../types';

interface ProjectsTabProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  boqItems: BOQItem[];
}

export default function ProjectsTab({ projects, setProjects, boqItems }: ProjectsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    assignmentNumber: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    handoverDate: new Date().toISOString().split('T')[0],
    durationMonths: 12,
    status: 'Active'
  });

  const calculateEndDate = (startDate: string, months: number) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + Number(months));
    return date.toLocaleDateString('ar-EG');
  };

  const getContractValue = (projectId: string) => {
    return boqItems
      .filter(item => item.projectId === projectId)
      .reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSave = () => {
    if (!formData.name || !formData.assignmentNumber) return;

    if (editingId) {
      setProjects(projects.map(p => p.id === editingId ? { ...p, ...formData as Project } : p));
    } else {
      const newProject: Project = {
        ...(formData as Project),
        id: `proj-${Date.now()}`
      };
      setProjects([...projects, newProject]);
    }
    
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', assignmentNumber: '', durationMonths: 12, status: 'Active' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟ سيتم حذف كافة البيانات المرتبطة به.')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.assignmentNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            سجل العمليات والمشروعات الإنشائية
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">إدارة بيانات التكليف وأوامر الإسناد والمدد الزمنية</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث بالمشروع..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2 text-xs font-bold outline-none focus:border-indigo-400 transition-all w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            مشروع جديد
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المشروعات', value: projects.length, icon: Briefcase, color: 'indigo' },
          { label: 'عمليات جارية', value: projects.filter(p => p.status === 'Active').length, icon: TrendingUp, color: 'emerald' },
          { label: 'القيمة التعاقدية الكلية', value: projects.reduce((s, p) => s + getContractValue(p.id), 0).toLocaleString(), icon: Calculator, color: 'blue' },
          { label: 'متوسط مدة التنفيذ', value: Math.round(projects.reduce((s, p) => s + (p.durationMonths || 0), 0) / (projects.length || 1)), icon: Clock, color: 'amber' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 bg-${stat.color}-50 rounded-2xl`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400">{stat.label}</p>
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                {editingId ? 'تعديل بيانات المشروع' : 'تسجيل أمر إسناد جديد'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-[11px] font-black text-slate-500 mr-2">اسم العملية / المشروع</label>
                  <input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:border-indigo-400 outline-none transition" 
                    placeholder="أدخل اسم المشروع بالكامل..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 mr-2">رقم أمر الإسناد</label>
                  <input 
                    value={formData.assignmentNumber}
                    onChange={(e) => setFormData({...formData, assignmentNumber: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:border-indigo-400 outline-none transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 mr-2">تاريخ أمر الإسناد</label>
                  <input 
                    type="date"
                    value={formData.assignmentDate}
                    onChange={(e) => setFormData({...formData, assignmentDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:border-indigo-400 outline-none transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 mr-2">تاريخ استلام الموقع</label>
                  <input 
                    type="date"
                    value={formData.handoverDate}
                    onChange={(e) => setFormData({...formData, handoverDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:border-indigo-400 outline-none transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 mr-2">مدة الأعمال (بالشهور)</label>
                  <input 
                    type="number"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({...formData, durationMonths: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:border-indigo-400 outline-none transition" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-black shadow-lg hover:bg-indigo-700 transition">حفظ البيانات</button>
                <button onClick={() => setShowForm(false)} className="px-8 bg-slate-100 text-slate-600 rounded-2xl py-4 font-black hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects List Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredProjects.map(project => {
          const contractValue = getContractValue(project.id);
          const endDate = calculateEndDate(project.handoverDate, project.durationMonths);
          
          return (
            <div key={project.id} className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 hover:shadow-xl transition-all group border-b-4 border-b-indigo-500">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                    <p className="text-xs text-slate-400 font-bold flex items-center gap-2 mt-1">
                       <FileCheck className="w-3.5 h-3.5" />
                       أمر إسناد رقم: {project.assignmentNumber}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingId(project.id); setFormData(project); setShowForm(true); }}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    تاريخ استلام الموقع
                  </div>
                  <p className="text-sm font-black text-slate-800">{new Date(project.handoverDate).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-emerald-50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    موعد نهو المشروع
                  </div>
                  <p className="text-sm font-black text-emerald-700">{endDate}</p>
                </div>
                <div className="bg-indigo-50/30 p-4 rounded-2xl col-span-full border-2 border-indigo-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Project Contract Value</span>
                    <span className="text-xl font-black text-indigo-700 mt-1">{contractValue.toLocaleString()} <span className="text-xs">ج.م</span></span>
                  </div>
                  <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black">
                    محسوب من المقايسة آلياً
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> مدة التنفيذ: {project.durationMonths} شهر</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> الإسناد: {new Date(project.assignmentDate).toLocaleDateString('ar-EG')}</span>
                </div>
                <span className={`px-3 py-1 rounded-full font-black text-[10px] ${
                  project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {project.status === 'Active' ? 'قيد التنفيذ' : 'متوقف'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
