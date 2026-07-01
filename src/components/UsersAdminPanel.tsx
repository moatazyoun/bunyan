import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, X, AlertTriangle, UserCircle, 
  Key, Mail, Phone, Settings, Shield, CheckCircle2, Search,
  Filter, MoreVertical, ShieldAlert, ShieldCheck, Plus, Check as CheckIcon,
  History, Clock, Activity, FileText, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserItem, UserModulePermissions, Project, AuditTrailRecord } from '../types';

interface Site {
  id: string;
  nameAr: string;
  location: string;
  description: string;
}

interface UsersAdminPanelProps {
  currentUser: { username: string; nameAr: string; role: string } | null;
  auditLogs: AuditTrailRecord[];
}

const DEFAULT_PERMISSIONS: UserModulePermissions = {
  projects: 'none',
  transactions: 'none',
  extracts: 'none',
  deliveries: 'none',
  boq: 'none',
  supplies: 'none',
  subcontractors: 'none',
  weeklyReport: 'none',
  siteWorkers: 'none',
  fuelDashboard: 'none',
  equipmentDashboard: 'none',
  usersManagement: 'none',
  notifications: 'none'
};

export default function UsersAdminPanel({ currentUser, auditLogs }: UsersAdminPanelProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLoc, setNewProjectLoc] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // User Logs States
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[]>([]);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<UserItem | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const handleOpenLogs = async (user: UserItem) => {
    setSelectedUserForLogs(user);
    setIsLoadingLogs(true);
    // Filter passed auditLogs by nameAr and exclude 'استعراض'
    const userLogs = auditLogs.filter(log => log.user.includes(user.nameAr) && !log.action.includes('استعراض'));
    setSelectedUserLogs(userLogs);
    setIsLoadingLogs(false);
  };

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete || captchaInput.toUpperCase() !== captchaCode) {
      alert('كود الكابتشا غير صحيح.');
      return;
    }

    try {
      const response = await fetch(`/api/sites/${siteToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSitesList();
        setSiteToDelete(null);
      } else {
        alert('فشل حذف الموقع.');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '', 
    password: '', 
    nameAr: '', 
    email: '', 
    phone: '', 
    role: 'engineer' as const,
    assignedProjects: [] as string[]
  });
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !newProjectLoc.trim()) return;

    try {
      const siteId = `site-${Date.now()}`;
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: siteId,
          nameAr: newProjectName.trim(),
          location: newProjectLoc.trim(),
          description: ''
        })
      });

      if (response.ok) {
        fetchSitesList();
        setNewProjectName('');
        setNewProjectLoc('');
        setIsAddingProject(false);
      } else {
        const err = await response.json();
        alert(err.error || 'فشل إضافة الموقع.');
      }
    } catch (error) {
      console.error('Error adding site:', error);
    }
  };

  const fetchSitesList = async () => {
    try {
      const response = await fetch('/api/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const fetchUsersList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
    fetchSitesList();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, boolean> = {};
    if (!/^[a-zA-Z0-9]+$/.test(newUser.username)) errors.username = true;
    if (!newUser.nameAr) errors.nameAr = true;
    if (!newUser.password) errors.password = true;
    if (newUser.assignedProjects.length === 0) errors.sites = true;
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newUser, 
          permissions: DEFAULT_PERMISSIONS 
        }),
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewUser({ username: '', password: '', nameAr: '', email: '', phone: '', role: 'engineer', assignedProjects: [] });
        fetchUsersList();
      }
    } catch (err: any) {
      alert('فشل تسجيل الحساب.');
    }
  };

  const handleUpdateUser = async (username: string, updatedData: Partial<UserItem>) => {
    setIsSaving(true);
    try {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      const baseData = user || editingUser;
      if (!baseData) return;

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...baseData,
          ...updatedData,
          username, // Re-ensure username is sent
        }),
      });

      if (response.ok) {
        setEditingUser(null);
        await fetchUsersList();
        alert('تم حفظ البيانات بنجاح.');
      } else {
        const errData = await response.json();
        alert(errData.error || 'حدث خطأ أثناء تحديث البيانات.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الاتصال بالخادم.');
      console.error('Update user error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users/${userToDelete.username}`, { method: 'DELETE' });
      if (response.ok) {
        setUserToDelete(null);
        fetchUsersList();
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف.');
    }
  };

  const filteredUsers = users.filter(user => {
    const lowerUsername = (user.username || '').toLowerCase().trim();
    if (currentUser?.username?.toLowerCase() !== 'moataz' && lowerUsername === 'moataz') {
      return false; // Strongly hide program director from other admins
    }
    const matchesSearch = 
      user.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'projects_manager')) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 p-8">
        <ShieldAlert size={64} className="text-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black text-slate-800">غير مصرح لك بالدخول</h2>
        <p className="text-slate-500">تواصل مع مدير النظام للحصول على الصلاحيات اللازمة.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 text-slate-800" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight">
            <Users className="text-amber-500 bg-amber-500/10 p-2 rounded-2xl" size={44} />
            إدارة الكادر والصلاحيات
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-2xl">
            نظام التحكم الموحد لتفويض مهندسي المواقع والمشرفين، وتحديد مستويات الوصول وجداول الصلاحيات مع متابعة فورية لسجل تصرفات الكادر.
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)} 
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-amber-900/25 transition-all outline-none"
        >
          <UserPlus size={18}/> 
          إضافة مستخدم وترقيتـه
        </motion.button>
      </div>

      

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white shadow-sm p-4 rounded-[2rem] border border-slate-200 shadow-inner">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم العربي أو اسم المستخدم (الباركود)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-amber-500 outline-none transition placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={18} className="text-slate-500 shrink-0" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto py-3.5 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none cursor-pointer focus:border-amber-500 transition"
          >
            <option value="all">كل الرتب الإدارية</option>
            <option value="admin">مدير نظام (أدمن)</option>
            <option value="projects_manager">مدير مشروعات</option>
            <option value="site_manager">مدير موقع</option>
            <option value="tech_office">مهندس مكتب فني</option>
            <option value="site_engineer">مهندس موقع</option>
            <option value="accountant">محاسب مالي</option>
            <option value="supervisor">مشرف</option>
            <option value="dc">مراقب المخرجات (DC)</option>
            <option value="viewer">مشاهد / مراقب عام (للقراءة فقط)</option>
          </select>
        </div>
      </div>

      {/* User Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-xs animate-pulse">جاري سحب جداول الكادر والتراخيص من الخادم السحابي...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((item) => {
              const isProtected = item.username.toLowerCase() === 'moataz' || (item.role === 'admin' && item.username !== currentUser?.username);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 1, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 1, scale: 0.95 }}
                  key={item.username} 
                  className="group bg-white shadow-sm p-6 rounded-[2rem] border border-slate-200 hover:border-amber-500/20 shadow-2xl space-y-5 hover:bg-slate-50 shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Subtle Top Indicator Gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-amber-500/40 via-transparent to-transparent pointer-events-none"></div>

                  <div className="space-y-4">
                    {/* Header: Avatar, Name, Trash */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${
                          isProtected 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          <UserCircle size={32} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg leading-tight">{item.nameAr}</h4>
                          <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase mt-1.5 ${
                            item.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            item.role === 'projects_manager' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            item.role === 'site_manager' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            item.role === 'tech_office' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            item.role === 'site_engineer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            item.role === 'accountant' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            item.role === 'supervisor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-slate-800 text-slate-700 border border-slate-700/50'
                          }`}>
                            {item.role === 'admin' ? 'مدير نظام' : 
                             item.role === 'projects_manager' ? 'مدير مشروعات' :
                             item.role === 'site_manager' ? 'مدير موقع' :
                             item.role === 'tech_office' ? 'مهندس مكتب فني' :
                             item.role === 'site_engineer' ? 'مهندس موقع' :
                             item.role === 'accountant' ? 'محاسب مالي' :
                             item.role === 'supervisor' ? 'مشرف ميداني' : 
                             item.role === 'dc' ? 'مراقب مخرجات DC' : 
                             item.role === 'viewer' ? 'مشاهد (لا يملك صلاحيات تعديل)' : 'مراقب عام'}
                          </span>
                        </div>
                      </div>
                      
                      {!isProtected && item.username !== currentUser?.username && (
                        <button 
                          onClick={() => setUserToDelete(item)} 
                          className="text-rose-400 p-2.5 hover:bg-rose-500/10 rounded-xl transition"
                          title="حذف حساب المستخدم سحابياً"
                        >
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </div>

                    {/* Permissions Capsule Timeline */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">تفويضات الوصول النشطة:</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {[
                          { key: 'projects', label: 'المواقع' },
                          { key: 'transactions', label: 'الحركات' },
                          { key: 'extracts', label: 'المستخلصات' },
                          { key: 'deliveries', label: 'التسليمات' },
                          { key: 'boq', label: 'المقايسة' },
                          { key: 'supplies', label: 'التوريدات' },
                          { key: 'subcontractors', label: 'المقاولين' },
                          { key: 'weeklyReport', label: 'التقرير' },
                          { key: 'siteWorkers', label: 'العاملين' },
                          { key: 'fuelDashboard', label: 'المحروقات' },
                          { key: 'equipmentDashboard', label: 'المعدات' },
                          { key: 'usersManagement', label: 'الأعضاء' },
                          { key: 'notifications', label: 'الإشعارات' },
                        ].map((p) => {
                          const level = item.role === 'admin' ? 'edit' : (item.permissions?.[p.key as keyof UserModulePermissions] || 'none');
                          if (level === 'none') return null;
                          
                          const colorClass = level === 'edit'
                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                            : 'bg-amber-500/5 text-amber-400 border-amber-500/10';
                          
                          return (
                            <span key={p.key} className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all ${colorClass}`}>
                              {p.label}: {level === 'edit' ? 'تعديل' : 'قراءة'}
                            </span>
                          );
                        })}
                        {item.role === 'admin' && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-black bg-amber-500/5 text-amber-400 border border-amber-500/10">
                            صلاحية تحكم خارقة
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta details */}
                    <div className="space-y-2 bg-slate-50/40 p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 font-bold">
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-500 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{item.email || 'غير مسجل حالياً'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-500 shrink-0" />
                        <span className="font-mono text-[11px]">{item.phone || 'غير مسجل حالياً'}</span>
                      </div>
                      <div className="mt-2 text-slate-600 text-[9px] uppercase font-mono tracking-widest pt-2 border-t border-slate-200 flex justify-between">
                        <span>معرف المستخدم: {item.username}</span>
                        {item.isTrial && <span className="text-amber-500 font-bold">حساب تجريبي (Trial)</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200 mt-auto">
                    <button 
                      onClick={() => handleOpenLogs(item)}
                      className="px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-2xl transition flex items-center justify-center gap-2 text-xs font-black shrink-0"
                      title="آخر حركات المهندس الميدانية"
                    >
                      <History size={15} />
                      <span>سجل النشاط</span>
                    </button>
                    
                    {isProtected ? (
                      <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black text-amber-500 bg-amber-500/10 py-3 rounded-2xl border border-amber-500/20">
                        <Shield size={14} />
                        بروفايل مؤمن
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingUser(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 py-3 rounded-2xl shadow-lg shadow-amber-900/20 transition-all font-bold"
                      >
                        <ShieldCheck size={14} />
                        تعديل الصلاحيات والمواقع
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals Container */}
      <AnimatePresence>
        {/* User Activity Logs Drawer */}
        {selectedUserForLogs && (
          <div className="fixed inset-0 z-[110] flex items-center justify-end p-0 md:p-4 bg-black/80 backdrop-blur-sm">
            {/* Click-outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedUserForLogs(null)}></div>
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full md:h-[calc(100vh-2rem)] bg-slate-50 border-r md:border border-slate-200 md:rounded-[2.5rem] shadow-2xl p-6 flex flex-col z-10 overflow-hidden"
              dir="rtl"
            >
              {/* Glow Accent */}
              <div className="absolute -top-45 -left-45 w-90 h-90 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6 relative">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                    <Activity size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">تفاصيل سجل النشاط الميداني</h3>
                    <p className="text-slate-500 text-xs mt-0.5">المهندس: <span className="text-amber-500 font-bold">{selectedUserForLogs.nameAr}</span> ({selectedUserForLogs.username})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserForLogs(null)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Logs Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 relative">
                {isLoadingLogs ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-3">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-xs font-bold animate-pulse">جاري سحب الحركات المسجلة...</p>
                  </div>
                ) : selectedUserLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                    <History size={40} className="text-slate-600 mb-3" />
                    <p className="text-xs text-slate-500 font-bold">لا يوجد حركات مسجلة حالياً لهذا المستخدم.</p>
                  </div>
                ) : (
                  <div className="relative border-r-2 border-slate-800/80 mr-4 pr-1 space-y-6">
                    {selectedUserLogs.map((log) => {
                      const isAuth = log.type === 'auth';
                      const isDoc = log.type === 'document';
                      const isProj = log.type === 'project';
                      
                      let badgeColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                      if (isAuth) badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                      else if (isDoc) badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      else if (isProj) badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                      
                      return (
                        <div key={log.id} className="relative pr-6">
                          {/* Timeline dot */}
                          <div className={`absolute -right-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                            isAuth ? 'bg-cyan-400 animate-pulse' : isDoc ? 'bg-emerald-400' : isProj ? 'bg-purple-400' : 'bg-slate-400'
                          }`} />
                          
                          <div className={`bg-white/40 border p-4 rounded-3xl space-y-2 hover:bg-white/60 transition-all duration-300 ${
                            (log.action.includes('إزالة') || log.action.includes('حذف')) 
                              ? 'border-rose-200' 
                              : (log.action.includes('تعديل') || log.action.includes('تحديث'))
                                ? 'border-indigo-200'
                                : 'border-slate-200'
                          }`}>
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-sm font-black leading-tight block ${
                                (log.action.includes('إزالة') || log.action.includes('حذف'))
                                  ? 'text-rose-600'
                                  : (log.action.includes('تعديل') || log.action.includes('تحديث'))
                                    ? 'text-indigo-600'
                                    : 'text-slate-800'
                              }`}>
                                {log.action}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider shrink-0 ${badgeColor}`}>
                                {isAuth ? 'أمن وحسابات' : isDoc ? 'مستندات' : isProj ? 'موقع عمل' : 'أخرى'}
                              </span>
                            </div>
                            
                            {log.details && (
                              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                {log.details}
                              </p>
                            )}
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-200">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span>{new Date(log.timestamp).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                                {log.referenceNo && (
                                  <div className="flex items-center gap-1 text-purple-700 font-black bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    <span>{log.referenceNo}</span>
                                  </div>
                                )}
                              </div>
                              {log.ip && (
                                <div className="flex items-center gap-1.5">
                                  <Globe size={11} />
                                  <span>IP: {log.ip}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 text-center mt-auto">
                <button 
                  onClick={() => setSelectedUserForLogs(null)}
                  className="w-full py-4 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-2xl font-bold transition-all text-sm"
                >
                  إغلاق سجل النشاط
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 1, y: 20 }}
              className="bg-white border border-slate-200 p-8 rounded-[3rem] w-full max-w-2xl shadow-3xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>
              
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600/10 text-indigo-500 rounded-2xl">
                    <UserPlus size={24} />
                  </div>
                  <h3 className="text-2xl font-black">إضافة عضو جديد للكادر</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">البيانات الأساسية</h5>
                  <div className="relative">
                    <UserCircle className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${formErrors.nameAr ? 'text-rose-500' : 'text-slate-600'}`} size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="الاسم الكامل باللغة العربية" 
                      value={newUser.nameAr} 
                      onChange={e => {
                        setNewUser({...newUser, nameAr: e.target.value});
                        if (formErrors.nameAr) setFormErrors({...formErrors, nameAr: false});
                      }} 
                      className={`w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl text-sm transition outline-none ${
                        formErrors.nameAr 
                          ? 'border-rose-500 ring-4 ring-rose-500/10' 
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                      }`} 
                    />
                  </div>
                  <div className="relative">
                    <UserCircle className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${formErrors.username ? 'text-rose-500' : 'text-slate-600'}`} size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="اسم المستخدم (Username - EN)" 
                      value={newUser.username} 
                      onChange={e => {
                        // Allow only English letters and numbers
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        setNewUser({...newUser, username: val});
                        if (formErrors.username) setFormErrors({...formErrors, username: false});
                      }} 
                      className={`w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl text-sm font-mono transition outline-none ${
                        formErrors.username 
                          ? 'border-rose-500 ring-4 ring-rose-500/10' 
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                      }`} 
                    />
                  </div>
                  <div className="relative">
                    <Key className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${formErrors.password ? 'text-rose-500' : 'text-slate-600'}`} size={18} />
                    <input 
                      required
                      type="password" 
                      placeholder="كلمة المرور المسجلة" 
                      value={newUser.password} 
                      onChange={e => {
                        setNewUser({...newUser, password: e.target.value});
                        if (formErrors.password) setFormErrors({...formErrors, password: false});
                      }} 
                      className={`w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl text-sm transition outline-none ${
                        formErrors.password 
                          ? 'border-rose-500 ring-4 ring-rose-500/10' 
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                      }`} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">التواصل، الدور، والمواقع المتاحة</h5>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="email" 
                      placeholder="البريد الإلكتروني" 
                      value={newUser.email} 
                      onChange={e => setNewUser({...newUser, email: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="tel" 
                      placeholder="رقم الهاتف للتواصل" 
                      value={newUser.phone} 
                      onChange={e => setNewUser({...newUser, phone: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <select 
                      value={newUser.role} 
                      onChange={e => setNewUser({...newUser, role: e.target.value as any})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 transition outline-none cursor-pointer"
                    >
                      <option value="site_engineer">مهندس موقع</option>
                      <option value="projects_manager">مدير مشروعات</option>
                      <option value="site_manager">مدير موقع</option>
                      <option value="tech_office">مهندس مكتب فني</option>
                      <option value="accountant">محاسب مالي</option>
                      <option value="supervisor">مشرف</option>
                      <option value="dc">مراقب مخرجات DC</option>
                      <option value="viewer">مشاهد / مراقب عام (للقراءة فقط)</option>
                      <option value="admin">مدير نظام</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold transition-colors ${formErrors.sites ? 'text-rose-500' : 'text-slate-500'}`}>
                      المواقع المتاحة للعضو (يجب اختيار موقع واحد على الأقل):
                    </label>
                    <div className={`grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border transition-all ${
                      formErrors.sites 
                        ? 'border-rose-500 ring-4 ring-rose-500/10' 
                        : 'border-slate-200'
                    } max-h-32 overflow-y-auto`}>
                      {sites.map(site => (
                        <label key={site.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={newUser.assignedProjects.includes(site.id)}
                            onChange={(e) => {
                              const newProjs = e.target.checked 
                                ? [...newUser.assignedProjects, site.id]
                                : newUser.assignedProjects.filter(id => id !== site.id);
                              setNewUser({...newUser, assignedProjects: newProjs});
                              if (formErrors.sites && newProjs.length > 0) setFormErrors({...formErrors, sites: false});
                            }}
                            className="accent-indigo-500"
                          />
                          {site.nameAr}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/20 transition-all">
                    تأكيد وتفعيل الحساب
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl font-bold transition">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Permissions Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 1, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 1, scale: 0.95 }}
              className="bg-white border border-slate-200 p-8 rounded-[3rem] w-full max-w-3xl shadow-3xl text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600/10 text-indigo-500 rounded-2xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-sans">إدارة وتعديل بيانات المستخدم</h3>
                    <p className="text-slate-500 text-sm mt-1">{editingUser.nameAr} - {editingUser.role === 'admin' ? 'مدير نظام' : 'عضو كادر'}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                {/* Role and Contact Update */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">الدور الوظيفي / الرتبة</label>
                    <select 
                      value={editingUser.role} 
                      disabled={editingUser.role === 'admin'}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition ${editingUser.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="admin">مدير نظام</option>
                      <option value="projects_manager">مدير مشروعات</option>
                      <option value="site_manager">مدير موقع</option>
                      <option value="tech_office">مهندس مكتب فني</option>
                      <option value="site_engineer">مهندس موقع</option>
                      <option value="accountant">محاسب مالي</option>
                      <option value="supervisor">مشرف</option>
                      <option value="dc">مراقب مخرجات DC</option>
                      <option value="viewer">مشاهد / مراقب عام (للقراءة فقط)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">صلاحيات الوصول التفصيلية للمجهودات</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 max-h-[380px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-indigo-600">
                      {[
                        { key: 'projects', label: 'المشروعات والإسناد', eng: 'Projects' },
                        { key: 'transactions', label: 'دفتر الحركات المالي', eng: 'Ledger' },
                        { key: 'extracts', label: 'المستخلصات الفنية', eng: 'Extracts' },
                        { key: 'deliveries', label: 'التسليمات وفحص الأعمال', eng: 'Inspection & Deliveries' },
                        { key: 'boq', label: 'المقايسة التثمنية', eng: 'BOQ' },
                        { key: 'supplies', label: 'إدارة التوريدات والمخازن', eng: 'Supplies' },
                        { key: 'subcontractors', label: 'مقاولين باطن', eng: 'Subcontractors' },
                        { key: 'weeklyReport', label: 'المنصرف الأسبوعي', eng: 'Weekly Report' },
                        { key: 'siteWorkers', label: 'العاملين والتسويات', eng: 'Site Workers' },
                        { key: 'fuelDashboard', label: 'حساب المحروقات والسولار', eng: 'Fuel Logs' },
                        { key: 'equipmentDashboard', label: 'بيان المعدات والآلات', eng: 'Equipment Dashboard' },
                        { key: 'usersManagement', label: 'حسابات الأعضاء والصلاحيات', eng: 'Users Admin' },
                        { key: 'notifications', label: 'إدارة وبث الإشعارات العاجلة', eng: 'Notifications Broadcast' },
                      ].map((item) => {
                        const isAdmin = editingUser.role === 'admin';
                        const perms = isAdmin
                          ? {
                              projects: 'edit',
                              transactions: 'edit',
                              extracts: 'edit',
                              deliveries: 'edit',
                              boq: 'edit',
                              supplies: 'edit',
                              subcontractors: 'edit',
                              weeklyReport: 'edit',
                              siteWorkers: 'edit',
                              fuelDashboard: 'edit',
                              equipmentDashboard: 'edit',
                              usersManagement: 'edit',
                              notifications: 'edit'
                            }
                          : (editingUser.permissions || DEFAULT_PERMISSIONS);
                        const currentVal = perms[item.key as keyof UserModulePermissions] || 'none';
                        return (
                          <div key={item.key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white/60 rounded-2xl border border-slate-200 hover:border-indigo-500/15 transition-all">
                            <div className="text-right">
                              <span className="block text-xs font-black text-slate-800">{item.label}</span>
                              <span className="block text-[9px] font-bold text-slate-500 uppercase">{item.eng}</span>
                            </div>
                            
                            <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
                              {[
                                { val: 'none', label: 'منع الوصول', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
                                { val: 'view', label: 'مشاهدة فقط', bg: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
                                { val: 'edit', label: 'تعديل كامل', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                              ].map((opt) => {
                                const selected = currentVal === opt.val;
                                return (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    disabled={isAdmin}
                                    onClick={() => {
                                      if (isAdmin) return;
                                      const updatedPerms = { ...perms, [item.key]: opt.val };
                                      setEditingUser({ ...editingUser, permissions: updatedPerms });
                                    }}
                                    className={`px-2.5 py-1 text-[10px] sm:text-xs font-extrabold rounded-lg border transition-all ${
                                      selected ? opt.bg : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
                                    } ${isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Selection */}
                <div className="space-y-3 bg-slate-50/40 p-5 rounded-3xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(!isAddingProject)}
                      className="p-1 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      إضافة موقع
                    </button>
                    <h4 className="text-xs font-black text-slate-500 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      تحديد المواقع المتاحة لهذا المستخدم
                    </h4>
                  </div>

                  {isAddingProject && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-2 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="اسم الموقع الجديد..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 text-right text-xs focus:outline-none focus:border-emerald-500/50"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                           <input
                            type="text"
                            value={newProjectLoc}
                            onChange={(e) => setNewProjectLoc(e.target.value)}
                            placeholder="الموقع الجغرافي..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 text-right text-xs focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddProject}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-800 py-2 rounded-xl transition-colors font-bold text-xs flex items-center justify-center gap-2"
                        >
                          <CheckIcon size={14} />
                          حفظ الموقع الجديد
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {sites.length === 0 && !isAddingProject ? (
                      <div className="text-center py-4">
                        <p className="text-[10px] text-slate-600 italic mb-2">لا توجد مواقع مسجلة حالياً.</p>
                        <button
                          type="button"
                          onClick={() => setIsAddingProject(true)}
                          className="text-emerald-500 text-[10px] font-bold hover:underline"
                        >
                          + إضافة أول موقع
                        </button>
                      </div>
                    ) : (
                      sites.map(proj => {
                        const isAssigned = (editingUser.assignedProjects || []).includes(proj.id);
                        return (
                          <div key={proj.id} className="flex gap-2 group">
                            <button
                              type="button"
                              onClick={() => {
                                const current = editingUser.assignedProjects || [];
                                const updated = isAssigned 
                                  ? current.filter(id => id !== proj.id)
                                  : [...current, proj.id];
                                setEditingUser({ ...editingUser, assignedProjects: updated });
                              }}
                              className={`flex-1 flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                isAssigned 
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-right">
                                {isAssigned ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold leading-none">{proj.nameAr}</span>
                                  <span className="text-[8px] text-slate-500 mt-1">{proj.location}</span>
                                </div>
                              </div>
                              {isAssigned && <CheckCircle2 size={14} />}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setSiteToDelete(proj);
                                generateCaptcha();
                              }}
                              className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2 italic">عند تحديد مواقع معينة ستم إخفاء باقي المواقع عن هذا المستخدم في شاشة اختيار الموقع.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={isSaving}
                  onClick={() => handleUpdateUser(editingUser.username, editingUser)}
                  className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                    isSaving ? 'bg-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/30'
                  }`}
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات الجديدة'}
                </button>
                <button 
                  disabled={isSaving}
                  onClick={() => setEditingUser(null)} 
                  className="px-8 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Delete Confirm Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 1 }}
              className="bg-white border border-rose-900/30 p-10 rounded-[3.5rem] w-full max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-600/50"></div>
              <div className="p-6 bg-rose-500/10 text-rose-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 animate-pulse">
                <AlertTriangle size={48}/>
              </div>
              <h3 className="text-2xl font-black mb-4">أمر بسحب التفويض</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed">
                هل أنت متأكد من حذف الحساب <span className="text-slate-800 font-bold">{userToDelete.nameAr}</span>؟ سيتم مسح كافة الصلاحيات المرتبطة به فوراً.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteUser} className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-slate-800 rounded-3xl font-black text-lg shadow-2xl shadow-rose-900/40 transition-all">
                  سحب الصلاحية والحذف
                </button>
                <button onClick={() => setUserToDelete(null)} className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 text-slate-700 rounded-3xl font-bold transition">
                  تراجع عن الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Site Delete Confirm Modal */}
        {siteToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-rose-500/20 p-8 rounded-[2.5rem] w-full max-w-sm text-center"
            >
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32}/>
              </div>
              <h3 className="text-xl font-black mb-2">حذف موقع العمل</h3>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                سيتم حذف الموقع <span className="text-rose-400 font-bold">{siteToDelete.nameAr}</span> وكافة البيانات المسجلة عليه نهائياً.
              </p>

              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-2xl mb-6">
                <p className="text-[10px] text-slate-500 mb-2">اكتب الرمز الظاهر لتأكيد الحذف:</p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="text-2xl font-mono font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl select-none decoration-line-through">
                    {captchaCode}
                  </span>
                  <button 
                    onClick={generateCaptcha}
                    className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    تغيير
                  </button>
                </div>
                <input 
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="أدخل الرمز هنا..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-center text-slate-800 font-mono tracking-widest focus:outline-none focus:border-rose-500/50"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  disabled={captchaInput.toUpperCase() !== captchaCode}
                  onClick={handleDeleteSite} 
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                    captchaInput.toUpperCase() === captchaCode
                      ? 'bg-rose-600 hover:bg-rose-500 text-slate-800 shadow-lg shadow-rose-900/20'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  تأكيد الحذف النهائي
                </button>
                <button 
                  onClick={() => setSiteToDelete(null)} 
                  className="w-full py-3 text-slate-500 hover:text-slate-800 text-xs transition"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
