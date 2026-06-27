/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Calculator,
  Users,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Printer,
  Sliders,
  FileText
} from 'lucide-react';
import { Project, BOQItem, UserItem } from '../types';

interface ProjectsTabProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  boqItems: BOQItem[];
  currentUserRole?: string;
  onRestoreBackup: (payload: any) => void;
  addAuditLog: (action: string, module: string, details: string) => void;
}

export default function ProjectsTab({ 
  projects, 
  setProjects, 
  boqItems, 
  currentUserRole, 
  onRestoreBackup,
  addAuditLog 
}: ProjectsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Deletion Confirmation States
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
  const [generatedConfirmCode, setGeneratedConfirmCode] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingInProgress, setIsDeletingInProgress] = useState(false);

  // User Assignment Modal State
  const [projectForUsers, setProjectForUsers] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    assignmentNumber: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    handoverDate: new Date().toISOString().split('T')[0],
    durationMonths: 12,
    status: 'Active',
    description: ''
  });

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleOpenUserAssignment = (project: Project) => {
    setProjectForUsers(project);
    fetchUsers();
  };

  const handleToggleUserAccess = (username: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.username === username) {
        const assigned = u.assignedProjects || [];
        const isAssigned = assigned.includes(projectForUsers!.id);
        return {
          ...u,
          assignedProjects: isAssigned 
            ? assigned.filter(id => id !== projectForUsers!.id)
            : [...assigned, projectForUsers!.id]
        };
      }
      return u;
    }));
  };

  const handleSaveUserAssignment = async () => {
    if (!projectForUsers) return;
    setIsAssigning(true);
    try {
      const assignedUsernames = allUsers
        .filter(u => (u.assignedProjects || []).includes(projectForUsers.id))
        .map(u => u.username);

      const response = await fetch(`/api/projects/${projectForUsers.id}/assign-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: assignedUsernames })
      });

      if (response.ok) {
        addAuditLog(
          'تعديل صلاحيات المشروع',
          'المشروعات والإسناد',
          `تعديل قائمة المهندسين المخولين للوصول للمشروع ذو المرجع ${projectForUsers.referenceNo || 'غير محدد'} لتشمل ${assignedUsernames.length} مهندساً.`
        );
        setProjectForUsers(null);
      } else {
        alert('فشل حفظ التعديلات.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ.');
    } finally {
      setIsAssigning(false);
    }
  };

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
    if (!formData.name || !formData.assignmentNumber) {
      alert('يرجى ملء الحقول الإجبارية (اسم العملية، ورقم أمر الإسناد).');
      return;
    }

    if (editingId) {
      const existing = projects.find(p => p.id === editingId);
      const finalRef = existing?.referenceNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      const updatedProject = {
        ...(formData as Project),
        id: editingId,
        referenceNo: finalRef
      };
      setProjects(projects.map(p => p.id === editingId ? updatedProject : p));
      addAuditLog(
        'تعديل بيانات مشروع',
        'المشروعات والإسناد',
        `تم تعديل بيانات مشروع "${updatedProject.name}" ذو المرجع المميز ${finalRef} بنجاح.`
      );
    } else {
      const finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      const newProject: Project = {
        ...(formData as Project),
        id: `proj-${Date.now()}`,
        referenceNo: finalRef,
        status: formData.status || 'Active'
      };
      setProjects([...projects, newProject]);
      addAuditLog(
        'إضافة مشروع جديد',
        'المشروعات والإسناد',
        `تم تسجيل مشروع جديد "${newProject.name}" بالرقم المرجعي المميز ${finalRef} ورقم إسناد مالي ${newProject.assignmentNumber}.`
      );
    }
    
    setShowForm(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      assignmentNumber: '', 
      assignmentDate: new Date().toISOString().split('T')[0],
      handoverDate: new Date().toISOString().split('T')[0],
      durationMonths: 12, 
      status: 'Active',
      description: ''
    });
  };

  const handleOpenDeleteModal = (project: Project) => {
    if (currentUserRole !== 'admin') {
      alert('عذراً، صلاحية حذف المشروعات تقتصر على مدير النظام فقط.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedConfirmCode(code);
    setProjectToDelete(project);
    setDeleteConfirmCode('');
    setDeleteAdminPassword('');
    setDeleteError(null);
    setIsDeletingInProgress(false);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    if (deleteConfirmCode !== generatedConfirmCode) {
      setDeleteError('رمز التأكيد غير صحيح.');
      return;
    }

    if (!deleteAdminPassword) {
      setDeleteError('يرجى إدخال الرقم السري لمدير النظام.');
      return;
    }

    setIsDeletingInProgress(true);
    setDeleteError(null);

    try {
      const currentUserJson = localStorage.getItem('bunyan_current_user');
      const currentUserObj = currentUserJson ? JSON.parse(currentUserJson) : null;
      const username = currentUserObj?.username || 'moataz';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: deleteAdminPassword })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        addAuditLog(
          'حذف مشروع نهائي',
          'المشروعات والإسناد',
          `تم حذف مشروع "${projectToDelete.name}" ذو المرجع المميز ${projectToDelete.referenceNo || 'غير محدد'} نهائياً من سجل العمليات.`
        );
        setProjectToDelete(null);
        alert('تم حذف المشروع بنجاح.');
      } else {
        setDeleteError('الرقم السري لمدير النظام غير صحيح.');
      }
    } catch (err) {
      setDeleteError('حدث خطأ أثناء التحقق، يرجى المحاولة لاحقاً.');
    } finally {
      setIsDeletingInProgress(false);
    }
  };

  const handlePrintRegister = () => {
    window.print();
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.assignmentNumber.includes(searchTerm) ||
    (p.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:p-0" dir="rtl">
      
      {/* Printable Report Header */}
      <div className="hidden print:block mb-8 text-center" dir="rtl">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
          <div className="text-right">
            <h1 className="text-xl font-black text-black">شركة بنيان للمقاولات العامة والتطوير العقاري</h1>
            <p className="text-xs text-slate-500 font-bold mt-1">المكتب الفني والتخطيط والمتابعة</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500 font-bold">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
            <p className="text-[10px] text-slate-400 font-bold">نظام بنيان لإدارة الموارد ERP</p>
          </div>
        </div>
        <h2 className="text-lg font-black text-black mt-6">سجل المشروعات الإنشائية المعتمدة وأوامر الإسناد</h2>
      </div>

      {/* Screen Header Actions (Hidden in Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 border-r-4 border-purple-600 pr-3">
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-600" />
              سجل العمليات والمشروعات الإنشائية
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-bold mt-1 mr-3">إدارة بيانات التكليف العام، وأوامر الإسناد المالي، ومواعيد نهو المشروعات</p>
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === 'table' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              عرض الجدول
            </button>
            <button 
              onClick={() => setViewMode('cards')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === 'cards' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              عرض البطاقات
            </button>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="مثال: مجمع المدارس أو الرقم المرجعي..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold outline-none focus:border-purple-400 transition-all w-64 shadow-sm text-slate-900"
            />
          </div>

          <button 
            onClick={handlePrintRegister}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-black transition"
          >
            <Printer className="w-4 h-4" />
            طباعة السجل
          </button>

          {currentUserRole !== 'viewer' && (
            <button 
              onClick={() => { 
                setFormData({
                  name: '',
                  assignmentNumber: '',
                  assignmentDate: new Date().toISOString().split('T')[0],
                  handoverDate: new Date().toISOString().split('T')[0],
                  durationMonths: 12,
                  status: 'Active',
                  description: ''
                });
                setEditingId(null); 
                setShowForm(true); 
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة مشروع جديد
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Panel (Hidden in Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'إجمالي المشروعات الإنشائية', value: projects.length, icon: Briefcase },
          { label: 'عمليات جارية بالمواقع', value: projects.filter(p => p.status === 'Active').length, icon: TrendingUp },
          { label: 'القيمة التعاقدية الكلية', value: `${projects.reduce((s, p) => s + getContractValue(p.id), 0).toLocaleString()} ج.م`, icon: Calculator },
          { label: 'متوسط مدة التنفيذ', value: `${Math.round(projects.reduce((s, p) => s + (p.durationMonths || 0), 0) / (projects.length || 1))} شهر`, icon: Clock }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-purple-100 transition duration-150">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400">{stat.label}</p>
              <p className="text-base font-black text-slate-950 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-bold shadow-sm">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm">لا توجد مشروعات مسجلة تطابق بحثك حالياً.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Perfect for desktop layout & printable pages) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-slate-950 text-white font-black">
                <tr className="border-b border-slate-800">
                  <th className="py-4 px-4 text-center w-12">م</th>
                  <th className="py-4 px-4 text-right">الرقم المرجعي</th>
                  <th className="py-4 px-4 text-right">اسم المشروع والعملية</th>
                  <th className="py-4 px-4 text-right">رقم الإسناد</th>
                  <th className="py-4 px-4 text-center">تاريخ الإسناد</th>
                  <th className="py-4 px-4 text-center">تاريخ الاستلام</th>
                  <th className="py-4 px-4 text-center">المدة</th>
                  <th className="py-4 px-4 text-center">تاريخ النهو</th>
                  <th className="py-4 px-4 text-left">القيمة التعاقدية</th>
                  <th className="py-4 px-4 text-center">الحالة</th>
                  <th className="py-4 px-4 text-center print:hidden">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                {filteredProjects.map((project, index) => {
                  const contractValue = getContractValue(project.id);
                  const endDate = calculateEndDate(project.handoverDate, project.durationMonths);
                  
                  return (
                    <tr key={project.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4 text-center text-slate-400 font-black">{index + 1}</td>
                      <td className="py-4 px-4 font-mono text-purple-700 font-black">{project.referenceNo || 'REF-N/A'}</td>
                      <td className="py-4 px-4 text-slate-950 font-black text-sm">{project.name}</td>
                      <td className="py-4 px-4 text-slate-600 font-mono">{project.assignmentNumber}</td>
                      <td className="py-4 px-4 text-center font-mono">
                        {project.assignmentDate ? new Date(project.assignmentDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        {project.handoverDate ? new Date(project.handoverDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </td>
                      <td className="py-4 px-4 text-center">{project.durationMonths} شهر</td>
                      <td className="py-4 px-4 text-center text-purple-700 font-mono">{endDate}</td>
                      <td className="py-4 px-4 text-left font-black text-slate-900 text-sm">
                        {contractValue.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                          project.status === 'Active' 
                            ? 'bg-purple-100 text-purple-800' 
                            : project.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {project.status === 'Active' ? 'قيد التنفيذ' : project.status === 'Completed' ? 'تم الإنجاز' : 'متوقف'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {currentUserRole !== 'viewer' && (
                            <>
                              <button 
                                onClick={() => handleOpenUserAssignment(project)}
                                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                                title="تعديل صلاحيات الوصول"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { 
                                  setEditingId(project.id); 
                                  setFormData(project); 
                                  setShowForm(true); 
                                }}
                                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {currentUserRole === 'admin' && (
                            <button 
                              onClick={() => handleOpenDeleteModal(project)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW (Clean, beautiful layouts) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:hidden">
          {filteredProjects.map(project => {
            const contractValue = getContractValue(project.id);
            const endDate = calculateEndDate(project.handoverDate, project.durationMonths);
            
            return (
              <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-purple-300 transition-all group border-r-4 border-r-purple-600">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-700">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-950 group-hover:text-purple-700 transition-colors">{project.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        المرجع: <span className="font-mono text-purple-700 font-bold">{project.referenceNo || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  {currentUserRole !== 'viewer' && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenUserAssignment(project)}
                        className="p-2 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                        title="تعديل صلاحيات الوصول"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setEditingId(project.id); setFormData(project); setShowForm(true); }}
                        className="p-2 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {currentUserRole === 'admin' && (
                        <button 
                          onClick={() => handleOpenDeleteModal(project)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 my-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      تاريخ استلام الموقع
                    </div>
                    <p className="text-xs font-black text-slate-800 font-mono">
                      {project.handoverDate ? new Date(project.handoverDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      موعد نهو المشروع
                    </div>
                    <p className="text-xs font-black text-slate-800 font-mono">{endDate}</p>
                  </div>
                  <div className="bg-purple-50/30 p-4 rounded-xl col-span-full border border-purple-100/60 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">القيمة الإجمالية للعقد</span>
                      <span className="text-lg font-black text-purple-950 mt-0.5">{contractValue.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <span className="px-3 py-1 bg-white border border-purple-200 text-purple-700 rounded-lg text-[10px] font-black">
                      محسوب تلقائياً من المقايسة
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> مدة التنفيذ: {project.durationMonths} شهر</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> الإسناد: {project.assignmentDate ? new Date(project.assignmentDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] ${
                    project.status === 'Active' 
                      ? 'bg-purple-100 text-purple-800' 
                      : project.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {project.status === 'Active' ? 'قيد التنفيذ' : project.status === 'Completed' ? 'تم الإنجاز' : 'متوقف'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Signatures Block (Only visible on physical paper printouts) */}
      <div className="hidden print:grid grid-cols-3 gap-8 mt-16 text-center text-xs font-black text-black">
        <div>
          <p>إعداد / مهندس التخطيط والمكتب الفني</p>
          <p className="mt-14 border-t border-slate-400 pt-2 w-40 mx-auto"></p>
        </div>
        <div>
          <p>مراجعة / مدير عام قطاع المشروعات</p>
          <p className="mt-14 border-t border-slate-400 pt-2 w-40 mx-auto"></p>
        </div>
        <div>
          <p>اعتماد / المدير التنفيذي العام</p>
          <p className="mt-14 border-t border-slate-400 pt-2 w-40 mx-auto"></p>
        </div>
      </div>

      {/* Project Form Modal (Add & Edit) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col md:flex-row" dir="rtl">
            
            {/* Premium Informative Right Sidebar inside Modal */}
            <div className="w-full md:w-64 bg-slate-50 p-8 border-l border-slate-150 flex flex-col justify-between hidden md:flex">
              <div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 border border-slate-200 mb-6 shadow-xs">
                  <Briefcase className="w-6 h-6" />
                </div>
                
                <h4 className="text-base font-black text-slate-950">تسجيل وتعديل مشروع</h4>
                <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                  نظام التكويد السحابي الذكي لضبط المخططات والبنود والمقايسات وربطها بمهندسي المواقع بدقة بالغة.
                </p>
              </div>

              {/* Process Stages Tracking Block */}
              <div className="space-y-3 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs font-black text-purple-700">
                  <span className="text-purple-600 font-black">|</span>
                  <span>1. البيانات الأساسية</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                  <span>|</span>
                  <span>2. التواريخ والمدد</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                  <span>|</span>
                  <span>3. المقايسة وتكليف المهندسين</span>
                </div>
              </div>
            </div>

            {/* Main Form Fields Panel (Left/Center) */}
            <div className="flex-1 p-8 flex flex-col justify-between">
              
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-900">
                    {editingId ? 'تعديل بيانات المشروع المعتمد' : 'تسجيل أمر إسناد جديد'}
                  </h3>
                  <button 
                    onClick={() => setShowForm(false)} 
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields Content */}
                <div className="space-y-5">
                  {/* Subsection 1: Basic Info */}
                  <div className="text-xs font-black text-purple-600 flex items-center gap-1.5">
                    <span className="inline-block w-1 h-4 bg-purple-600 rounded-sm"></span>
                    <span>البيانات الأساسية للمشروع</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Project Name */}
                    <div className="space-y-1 col-span-full">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">اسم العملية / المشروع الإنشائي *</label>
                      <input 
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all placeholder-slate-400" 
                        placeholder="مثال: مشروع تطوير وازدواج طريق الإسماعيلية بورسعيد"
                      />
                    </div>

                    {/* Assignment Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">رقم أمر الإسناد / التعاقد *</label>
                      <input 
                        type="text"
                        value={formData.assignmentNumber || ''}
                        onChange={(e) => setFormData({...formData, assignmentNumber: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all placeholder-slate-400" 
                        placeholder="مثال: إسْناد-987/ب-2026"
                      />
                    </div>

                    {/* Project Status */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">حالة المشروع التشغيلية</label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all"
                      >
                        <option value="Active">قيد التنفيذ / جاري</option>
                        <option value="Completed">تم الإنجاز بالكامل</option>
                        <option value="Suspended">متوقف / معلق مؤقتاً</option>
                      </select>
                    </div>
                  </div>

                  {/* Subsection 2: Dates & Durations */}
                  <div className="text-xs font-black text-teal-600 flex items-center gap-1.5 mt-6">
                    <span className="inline-block w-1 h-4 bg-teal-500 rounded-sm"></span>
                    <span>التواريخ والمدد الزمنية للتنفيذ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Assignment Date */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">تاريخ صدور أمر الإسناد</label>
                      <input 
                        type="date"
                        value={formData.assignmentDate || ''}
                        onChange={(e) => setFormData({...formData, assignmentDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all font-mono" 
                      />
                    </div>

                    {/* Handover Date */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">تاريخ استلام الموقع فعلياً</label>
                      <input 
                        type="date"
                        value={formData.handoverDate || ''}
                        onChange={(e) => setFormData({...formData, handoverDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all font-mono" 
                      />
                    </div>

                    {/* Duration Months */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">مدة الأعمال بالشهور</label>
                      <input 
                        type="number"
                        min={1}
                        value={formData.durationMonths || 12}
                        onChange={(e) => setFormData({...formData, durationMonths: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all font-mono" 
                        placeholder="مثال: 12"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1 mt-4">
                    <label className="text-[11px] font-black text-slate-500 block mr-1">ملاحظات فنية ووصف تفصيلي للعملية</label>
                    <textarea
                      rows={2}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all placeholder-slate-400" 
                      placeholder="مثال: يشمل المشروع أعمال تسوية التربة، إنشاء طبقة الأساس، الفرش والأسفلت والبردورات."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={currentUserRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حفظ التغييرات') : handleSave} 
                  disabled={currentUserRole === 'viewer'}
                  className="flex-1 rounded-2xl py-3.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
                >
                  حفظ وتأكيد تفاصيل العملية
                </button>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="px-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl py-3.5 text-xs font-black transition"
                >
                  إلغاء التعديل
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {projectForUsers && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4 print:hidden" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-150">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 border-r-4 border-purple-600 pr-2">
                <div>
                  <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    تحديد المهندسين المخولين للوصول للمشروع
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">العملية: {projectForUsers.name}</p>
                </div>
              </div>
              <button onClick={() => setProjectForUsers(null)} className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 max-h-[350px] overflow-y-auto space-y-2">
              {isUsersLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">جاري تحميل سجل مستخدمي النظام...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 italic">لا يوجد مستخدمين مسجلين في النظام حالياً.</p>
              ) : (
                allUsers.map(u => {
                  const isAssigned = (u.assignedProjects || []).includes(projectForUsers.id);
                  const isAdmin = u.role === 'admin' || u.role === 'projects_manager';
                  
                  return (
                    <button
                      key={u.username}
                      disabled={isAdmin}
                      onClick={() => handleToggleUserAccess(u.username)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isAssigned 
                          ? 'bg-purple-50 border-purple-200 text-purple-900' 
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      } ${isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isAssigned ? 'bg-white text-purple-700 border border-purple-150' : 'bg-slate-50 text-slate-400'
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black">{u.nameAr}</p>
                          <p className="text-[9px] font-bold text-slate-500">
                            {u.role === 'admin' ? 'مدير عام النظام' : 
                             u.role === 'projects_manager' ? 'مدير قطاع التنفيذ للمشاريع' :
                             u.role === 'site_manager' ? 'مدير موقع إنشائي' :
                             u.role === 'site_engineer' ? 'مهندس موقع تنفيذى' : u.role}
                          </p>
                        </div>
                      </div>
                      {isAdmin ? (
                        <span className="text-[8px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-black">مدير (وصول شامل)</span>
                      ) : isAssigned ? (
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                disabled={isAssigning || currentUserRole === 'viewer'}
                onClick={currentUserRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية حفظ التعديلات') : handleSaveUserAssignment} 
                className="flex-1 rounded-xl py-3 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
              >
                {isAssigning ? 'جاري تطبيق الصلاحيات...' : 'تأكيد وحفظ الصلاحيات'}
              </button>
              <button 
                onClick={() => setProjectForUsers(null)} 
                className="px-6 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl py-3 text-xs font-black transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Project Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4 print:hidden" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-150">
            <div className="p-6 bg-red-50 border-b border-red-100 flex justify-between items-center">
              <div className="flex items-center gap-2 border-r-4 border-red-600 pr-2">
                <div>
                  <h3 className="text-base font-black text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
                    تأكيد حذف المشروع بشكل نهائي
                  </h3>
                  <p className="text-[10px] text-red-500 font-bold mt-0.5">تنبيه حرج للسلامة: هذا القرار غير قابل للتراجع</p>
                </div>
              </div>
              <button onClick={() => setProjectToDelete(null)} className="p-1.5 hover:bg-red-100 rounded-full text-red-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-bold">
                أنت على وشك حذف مشروع: <span className="text-slate-950 font-black">"{projectToDelete.name}"</span>. 
                سيؤدي هذا إلى مسح كافة البنود والمقايسات والمستندات والنشاطات التابعة للمشروع نهائياً من النظام السحابي.
              </p>

              {/* Confirmation Code Section */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <label className="block text-[11px] font-black text-slate-600">رمز التأكيد الأمني المطلوب</label>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono">
                  <span className="text-[10px] font-bold text-slate-400">أدخل الرمز التالي بدقة لتأكيد القرار:</span>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-100 select-all">
                    {generatedConfirmCode}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="أدخل رمز التأكيد هنا..."
                  value={deleteConfirmCode}
                  onChange={(e) => setDeleteConfirmCode(e.target.value.trim())}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-center tracking-widest focus:border-purple-400 outline-none transition font-mono text-slate-900"
                />
              </div>

              {/* Password Section */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-600 block mr-1">كلمة المرور الخاصة بمدير الموارد البشرية والنظام</label>
                <input
                  type="password"
                  placeholder="أدخل كلمة مرور مدير النظام..."
                  value={deleteAdminPassword}
                  onChange={(e) => setDeleteAdminPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black focus:border-red-400 outline-none transition text-center text-slate-900"
                />
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-black border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                disabled={isDeletingInProgress || !deleteConfirmCode || !deleteAdminPassword}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl py-3 text-xs font-black bg-red-600 hover:bg-red-700 text-white transition shadow-sm flex items-center justify-center gap-2"
              >
                {isDeletingInProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تدمير السجلات...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الإتلاف النهائي للمشروع</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-6 bg-white border border-slate-200 text-slate-600 rounded-xl py-3 text-xs font-black hover:bg-slate-50 transition"
              >
                إلغاء الإجراء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
