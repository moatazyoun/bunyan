import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Key, Eye, Trash2, CheckCircle2, Lock, AlertTriangle, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserItem {
  username: string;
  nameAr: string;
  role: string;
}

interface UsersAdminPanelProps {
  currentUser: { username: string; nameAr: string; role: string } | null;
}

export default function UsersAdminPanel({ currentUser }: UsersAdminPanelProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for creating a new user
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newRole, setNewRole] = useState('engineer'); // Default site engineer

  const fetchUsersList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        throw new Error(data.error || 'فشل تحميل كشف المستخدمين والرواد.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في الاتصال بالخادم لجلب الحسابات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newUsername.trim() || !newPassword.trim() || !newNameAr.trim()) {
      setErrorMsg('المعذرة، يرجى تعبئة كافة حقول الحساب لإتمام العملية.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          nameAr: newNameAr.trim(),
          role: newRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل حساب المستخدم.');
      }

      setSuccessMsg(`تم تسجيل الحساب الجديد لـ (${newNameAr}) بنجاح وتفعيل رتبة صلاحياته.`);
      setNewUsername('');
      setNewPassword('');
      setNewNameAr('');
      setNewRole('engineer');
      
      // Reload lists
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية الإضافة خطأ السحابة الموزعة.');
    }
  };

  const handleDeleteUser = async (username: string, nameAr: string) => {
    if (username.toLowerCase() === 'moataz') {
      alert('غير مسموح بحذف أو نزع صلاحيات الحساب المالي الجذري Moataz.');
      return;
    }

    const confirmDeletion = window.confirm(`هل أنت واثق تماماً من حذف حساب الرواد لـ (${nameAr}) وسحب الصلاحية منه للأبد؟`);
    if (!confirmDeletion) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`/api/users/${username}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل حذف الحساب المالي والمكود.');
      }

      setSuccessMsg(`حذف ناجح! تم مسح تفويض الحساب لـ ${nameAr} بنجاح من الخادم.`);
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية مسح الحساب تفقد اتصالك بالشبكة.');
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-xl mx-auto my-12 text-right text-slate-100 font-sans shadow-xl">
        <AlertTriangle className="mx-auto mb-4 text-amber-500 animate-bounce" size={40} />
        <h3 className="font-extrabold text-lg text-slate-100">فشل تفويض الدخول والاستعراض ⚠️</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          هذه الشاشة مخصصة فقط وحصرياً لمدير النظام الشامل لشركة بنيان (<span className="text-indigo-400 font-bold font-mono">Moataz</span>). غير مسموح لأي حساب مهندس أو مراقب سحب تفويض الحسابات وصلاحيات الطاقم المالي.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-900 border border-slate-800/80 text-white rounded-3xl shadow-xl bg-gradient-to-br from-slate-900/40 via-indigo-950/20 to-slate-950/50 font-sans text-right" dir="rtl">
      
      {/* Title block */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-100">لوحة حماية وتدرج صلاحيات الكادر الشامل 🔒</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">تحكم حصري لمدير النظام (Moataz) لتوزيع الرتب، الإضافة، وتدقيق الحسابات</p>
        </div>
      </div>

      {/* Success and Error Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Registration form (Left/Right side) */}
        <div className="lg:col-span-5 bg-slate-950/50 border border-slate-850 p-5 rounded-2xl text-right space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="text-indigo-400" size={18} />
            <span className="font-extrabold text-sm text-slate-100">تسجيل وتفويض مستخدم جديد للـ ERP</span>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">الاسم العربي الكامل (يظهر في اليوميات والايصالات):</label>
              <input
                type="text"
                required
                placeholder="مثال: م. أحمد عبد الباسط"
                value={newNameAr}
                onChange={(e) => setNewNameAr(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">اسم الحساب بالإنجليزية (للدخول):</label>
              <input
                type="text"
                required
                placeholder="مثال: ahmad_erp"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full text-xs font-mono p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">رمز المرور السري (Password):</label>
              <input
                type="text"
                required
                placeholder="بحد أدنى 4 رموز"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs font-mono p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">رتبة تفويض الصلاحية (Role / Hierarchy):</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-905 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-right bg-slate-900"
              >
                <option value="engineer">مهندس موقع (إدخال وتعديل / قفل الحذف النهائي) 🛠️</option>
                <option value="manager">مدير مشروع (إدخال، تعديل، حذف لكافة السجلات) 👔</option>
                <option value="viewer">مراقب مشاهدة (استعراض وقراءة السجلات فقط) 👁️</option>
                <option value="admin">مدير النظام (تحكم مالي كامل وتدقيق الكادر) 👑</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1"
            >
              <UserPlus size={15} />
              حفظ وتوثيق المستخدم الجديد للـ ERP
            </button>
          </form>
        </div>

        {/* Existing users catalog table */}
        <div className="lg:col-span-7 bg-slate-950/30 border border-slate-850 p-5 rounded-2xl text-right flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-400" size={18} />
                <span className="font-extrabold text-sm text-slate-100">كادر الحسابات والرواد المسجلين حالياً</span>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold font-mono">
                {users.length} مستخدمين
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12 text-slate-500 font-mono text-xs font-bold">
                 جاري تدقيق الحسابات من الخادم... ⚙
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-900/60 bg-slate-950/80">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-850 font-bold">
                      <th className="p-3">الاسم بالكامل</th>
                      <th className="p-3">اليوزرنيم</th>
                      <th className="p-3">رتبة الصلاحية</th>
                      <th className="p-3 text-center">حذف وتفويض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-200">
                    {users.map((item) => {
                      const isMainAdmin = item.username.toLowerCase() === 'moataz';
                      return (
                        <tr key={item.username} className="hover:bg-slate-900/30">
                          <td className="p-3 font-bold flex items-center gap-2">
                            <UserCircle size={15} className={isMainAdmin ? "text-amber-400" : "text-slate-400"} />
                            <span className={isMainAdmin ? "text-amber-400" : ""}>{item.nameAr}</span>
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-400">{item.username}</td>
                          <td className="p-3 font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                              item.role === 'admin' ? 'bg-amber-550/10 text-amber-400 border border-amber-500/20' :
                              item.role === 'manager' ? 'bg-indigo-550/10 text-indigo-400 border border-indigo-500/20' :
                              item.role === 'engineer' ? 'bg-emerald-550/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {item.role === 'admin' && 'مدير النظام 👑'}
                              {item.role === 'manager' && 'مدير مشروع 👔'}
                              {item.role === 'engineer' && 'مهندس موقع 🛠️'}
                              {item.role === 'viewer' && 'مراقب مشاهدة 👁️'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isMainAdmin ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-500 font-bold font-sans bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/25">
                                <Lock size={10} />
                                محمي
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(item.username, item.nameAr)}
                                className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 text-[10px] rounded-lg transition"
                                title="إلغاء تفويض هذا الحساب"
                              >
                                سحب الصلاحية 🗑
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-2 text-[10.5px] text-slate-400">
            <AlertTriangle size={15} className="text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>ملاحظة هامة:</strong> رتبة مهندس الموقع تمنحه حرية الإدخال لليوميات وبونات التوريد، ولكنها تمنع زر الحذف لحماية بونات وعقود الموردين وسجلات التدفق من الإلغاء التعسفي.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
