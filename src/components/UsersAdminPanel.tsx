import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, X, AlertTriangle, UserCircle, 
  Key, Mail, Phone, Settings, Shield, CheckCircle2, Search,
  Filter, MoreVertical, ShieldAlert, ShieldCheck, Plus, Check as CheckIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserItem, UserModulePermissions, Project } from '../types';

interface Site {
  id: string;
  nameAr: string;
  location: string;
  description: string;
}

interface UsersAdminPanelProps {
  currentUser: { username: string; nameAr: string; role: string } | null;
}

const DEFAULT_PERMISSIONS: UserModulePermissions = {
  projects: false,
  supplies: false,
  equipment: false,
  contractors: false,
  finance: false,
  usersManagement: false
};

export default function UsersAdminPanel({ currentUser }: UsersAdminPanelProps) {
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
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '', 
    password: '', 
    nameAr: '', 
    email: '', 
    phone: '', 
    role: 'engineer' as const
  });

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
    if (!newUser.username || !newUser.password || !newUser.nameAr) return;
    
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
        setNewUser({ username: '', password: '', nameAr: '', email: '', phone: '', role: 'engineer' });
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
        <h2 className="text-2xl font-black text-white">غير مصرح لك بالدخول</h2>
        <p className="text-slate-400">تواصل مع مدير النظام للحصول على الصلاحيات اللازمة.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-950 text-slate-100" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Users className="text-indigo-500" size={32} />
            إدارة الكادر والصلاحيات
          </h2>
          <p className="text-slate-400 mt-2 text-sm">إدارة حسابات المستخدمين وتحديد مستويات الوصول لكل قسم.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)} 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all"
        >
          <UserPlus size={18}/> 
          إضافـة مستخدم جديد
        </motion.button>
      </div>

      {/* Stats and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المستخدمين', value: users.length, icon: Users, color: 'text-indigo-400' },
          { label: 'مديرين', value: users.filter(u => u.role === 'admin' || u.role === 'manager').length, icon: Shield, color: 'text-amber-400' },
          { label: 'مهندسين', value: users.filter(u => u.role === 'engineer').length, icon: Settings, color: 'text-emerald-400' },
          { label: 'مراقبين', value: users.filter(u => u.role === 'viewer').length, icon: MoreVertical, color: 'text-slate-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-slate-950 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/30 p-4 rounded-3xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو اسم المستخدم..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:border-indigo-500 outline-none transition"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={18} className="text-slate-500" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:flex-none py-3 px-6 bg-slate-950 border border-white/10 rounded-2xl text-sm font-bold outline-none cursor-pointer"
          >
            <option value="all">تصفية حسب الرتبة</option>
            <option value="admin">مدير نظام</option>
            <option value="projects_manager">مدير مشروعات</option>
            <option value="site_manager">مدير موقع</option>
            <option value="tech_office">مهندس مكتب فني</option>
            <option value="site_engineer">مهندس موقع</option>
            <option value="accountant">محاسب مالي</option>
            <option value="supervisor">مشرف</option>
            <option value="dc">DC</option>
          </select>
        </div>
      </div>

      {/* User Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">جاري تحميل سجلات الكادر...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((item) => {
              const isProtected = item.username.toLowerCase() === 'moataz' || (item.role === 'admin' && item.username !== currentUser?.username);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.username} 
                  className="group bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden"
                >
                  {/* Glowing Background Accent */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-500"></div>

                  <div className="flex justify-between items-start relative">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${isProtected ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-950 text-slate-400'}`}>
                        <UserCircle size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-lg">{item.nameAr}</h4>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.role === 'admin' ? 'bg-amber-500/10 text-amber-500' :
                          item.role === 'projects_manager' ? 'bg-indigo-500/10 text-indigo-400' :
                          item.role === 'site_manager' ? 'bg-indigo-500/10 text-indigo-400' :
                          item.role === 'tech_office' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.role === 'site_engineer' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.role === 'accountant' ? 'bg-rose-500/10 text-rose-400' :
                          item.role === 'supervisor' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {item.role === 'admin' ? 'مدير نظام' : 
                           item.role === 'projects_manager' ? 'مدير مشروعات' :
                           item.role === 'site_manager' ? 'مدير موقع' :
                           item.role === 'tech_office' ? 'مهندس مكتب فني' :
                           item.role === 'site_engineer' ? 'مهندس موقع' :
                           item.role === 'accountant' ? 'محاسب مالي' :
                           item.role === 'supervisor' ? 'مشرف' : 
                           item.role === 'dc' ? 'DC' : 'مراقب'}
                        </span>
                        
                        {/* Permissions Badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {[
                            { key: 'projects', label: 'مواقع', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                            { key: 'supplies', label: 'توريدات', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                            { key: 'equipment', label: 'معدات', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                            { key: 'contractors', label: 'مقاولين', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                            { key: 'finance', label: 'مالية', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                            { key: 'usersManagement', label: 'أعضاء', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                          ].map((p) => {
                            const hasPerm = item.permissions?.[p.key as keyof UserModulePermissions];
                            if (!hasPerm && item.role !== 'admin') return null;
                            if (item.role === 'admin' && p.key === 'usersManagement') return null;
                            
                            return (
                              <span key={p.key} className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold border transition-all ${
                                item.role === 'admin' ? 'bg-amber-500/5 text-amber-500/60 border-amber-500/10' : p.color
                              }`}>
                                {p.label}
                              </span>
                            );
                          })}
                          {item.role === 'admin' && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              صلاحية كاملة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isProtected && item.username !== currentUser?.username && (
                      <button 
                        onClick={() => setUserToDelete(item)} 
                        className="text-rose-400 p-3 hover:bg-rose-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 size={20}/>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 bg-slate-950/50 p-4 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail size={14} />
                      <span className="text-xs font-mono">{item.email || 'غير مسجل'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone size={14} />
                      <span className="text-xs font-mono">{item.phone || 'غير مسجل'}</span>
                    </div>
                    <div className="mt-2 text-slate-600 text-[10px] uppercase font-black font-mono">
                      User: {item.username}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isProtected ? (
                      <div className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-amber-500 bg-amber-500/10 py-3 rounded-2xl border border-amber-500/20">
                        <Shield size={18} />
                        حساب محمي بالنظام
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingUser(item)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl shadow-lg shadow-indigo-900/20 transition-all"
                      >
                        <ShieldCheck size={18} />
                        تعديل الصلاحيات
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
        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-2xl shadow-3xl overflow-hidden relative"
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
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">البيانات الأساسية</h5>
                  <div className="relative">
                    <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="الاسم الكامل باللغة العربية" 
                      value={newUser.nameAr} 
                      onChange={e => setNewUser({...newUser, nameAr: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="اسم المستخدم (Username - EN)" 
                      value={newUser.username} 
                      onChange={e => setNewUser({...newUser, username: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm font-mono focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      required
                      type="password" 
                      placeholder="كلمة المرور المسجلة" 
                      value={newUser.password} 
                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">التواصل والرتبة</h5>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="email" 
                      placeholder="البريد الإلكتروني" 
                      value={newUser.email} 
                      onChange={e => setNewUser({...newUser, email: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="tel" 
                      placeholder="رقم الهاتف للتواصل" 
                      value={newUser.phone} 
                      onChange={e => setNewUser({...newUser, phone: e.target.value})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:border-indigo-500 transition outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <select 
                      value={newUser.role} 
                      onChange={e => setNewUser({...newUser, role: e.target.value as any})} 
                      className="w-full pr-12 pl-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm font-bold focus:border-indigo-500 transition outline-none cursor-pointer"
                    >
                      <option value="site_engineer">مهندس موقع</option>
                      <option value="projects_manager">مدير مشروعات</option>
                      <option value="site_manager">مدير موقع</option>
                      <option value="tech_office">مهندس مكتب فني</option>
                      <option value="accountant">محاسب مالي</option>
                      <option value="supervisor">مشرف</option>
                      <option value="dc">DC</option>
                      <option value="admin">مدير نظام</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/20 transition-all">
                    تأكيد وتفعيل الحساب
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition">
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-xl shadow-3xl text-right"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600/10 text-indigo-500 rounded-2xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">إدارة وتعديل بيانات المستخدم</h3>
                    <p className="text-slate-400 text-sm mt-1">{editingUser.nameAr} - {editingUser.role === 'admin' ? 'مدير نظام' : 'عضو كادر'}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                {/* Role and Contact Update */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 mr-2">الدور الوظيفي / الرتبة</label>
                    <select 
                      value={editingUser.role} 
                      disabled={editingUser.username === 'admin'}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                      className={`w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition ${editingUser.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="admin">مدير نظام</option>
                      <option value="projects_manager">مدير مشروعات</option>
                      <option value="site_manager">مدير موقع</option>
                      <option value="tech_office">مهندس مكتب فني</option>
                      <option value="site_engineer">مهندس موقع</option>
                      <option value="accountant">محاسب مالي</option>
                      <option value="supervisor">مشرف</option>
                      <option value="dc">DC</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 mr-2">صلاحيات وصول الأقسام</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'projects', label: 'المواقع', icon: Users },
                        { key: 'supplies', label: 'المخازن', icon: Settings },
                        { key: 'equipment', label: 'المعدات', icon: Key },
                        { key: 'contractors', label: 'المقاولين', icon: Mail },
                        { key: 'finance', label: 'المالية', icon: Shield },
                        { key: 'usersManagement', label: 'الأعضاء', icon: ShieldAlert },
                      ].map((perm) => (
                        <button
                          key={perm.key}
                          disabled={editingUser.role === 'admin' || editingUser.username.toLowerCase() === 'moataz'}
                          onClick={() => {
                            const perms = editingUser.permissions || DEFAULT_PERMISSIONS;
                            const updated = {
                              ...perms,
                              [perm.key]: !perms[perm.key as keyof UserModulePermissions]
                            };
                            setEditingUser({ ...editingUser, permissions: updated });
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                            (editingUser.permissions || DEFAULT_PERMISSIONS)[perm.key as keyof UserModulePermissions]
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                              : 'bg-slate-950 border-white/5 text-slate-500'
                          } ${(editingUser.role === 'admin' || editingUser.username.toLowerCase() === 'moataz') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <perm.icon size={14} />
                          {perm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Selection */}
                <div className="space-y-3 bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(!isAddingProject)}
                      className="p-1 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={12} />
                      إضافة موقع
                    </button>
                    <h4 className="text-xs font-black text-slate-400 flex items-center gap-2">
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
                            className="flex-1 bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-white text-right text-xs focus:outline-none focus:border-emerald-500/50"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                           <input
                            type="text"
                            value={newProjectLoc}
                            onChange={(e) => setNewProjectLoc(e.target.value)}
                            placeholder="الموقع الجغرافي..."
                            className="flex-1 bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-white text-right text-xs focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddProject}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl transition-colors font-bold text-xs flex items-center justify-center gap-2"
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
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => {
                              const current = editingUser.assignedProjects || [];
                              const updated = isAssigned 
                                ? current.filter(id => id !== proj.id)
                                : [...current, proj.id];
                              setEditingUser({ ...editingUser, assignedProjects: updated });
                            }}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              isAssigned 
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'
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
                  onClick={() => handleUpdateUser(editingUser.username, { 
                    permissions: editingUser.permissions,
                    role: editingUser.role,
                    assignedProjects: editingUser.assignedProjects
                  })}
                  className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                    isSaving ? 'bg-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/30'
                  }`}
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات الجديدة'}
                </button>
                <button 
                  disabled={isSaving}
                  onClick={() => setEditingUser(null)} 
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition"
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-rose-900/30 p-10 rounded-[3.5rem] w-full max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-600/50"></div>
              <div className="p-6 bg-rose-500/10 text-rose-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 animate-pulse">
                <AlertTriangle size={48}/>
              </div>
              <h3 className="text-2xl font-black mb-4">أمر بسحب التفويض</h3>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed">
                هل أنت متأكد من حذف الحساب <span className="text-white font-bold">{userToDelete.nameAr}</span>؟ سيتم مسح كافة الصلاحيات المرتبطة به فوراً.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteUser} className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-lg shadow-2xl shadow-rose-900/40 transition-all">
                  سحب الصلاحية والحذف
                </button>
                <button onClick={() => setUserToDelete(null)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-3xl font-bold transition">
                  تراجع عن الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
