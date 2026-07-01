/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Check, 
  Clock, 
  Trash2, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  User, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from '../lib/firebase';
import { UserItem } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface NotificationsTabProps {
  currentUser: UserItem | null;
  selectedSite: { id: string; nameAr: string; location: string } | null;
  dbConnected: boolean | null;
}

export default function NotificationsTab({ currentUser, selectedSite, dbConnected }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'send'>('received');
  
  // Custom states for sending notifications
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifScope, setNotifScope] = useState('all');
  const [targetUsers, setTargetUsers] = useState(''); // New state
  const [isSending, setIsSending] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if current user has the authority to send notifications
  const canSend = currentUser?.role === 'admin' || currentUser?.permissions?.notifications === 'edit';

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Set default send scope on mount or site changes
  useEffect(() => {
    if (currentUser?.role !== 'admin' && selectedSite) {
      setNotifScope(selectedSite.id);
    }
  }, [currentUser, selectedSite]);

  // Real-time listener for ALL notifications
  useEffect(() => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        setNotifications(list);
        setIsLoading(false);
      }, (err) => {
        console.error("Firebase notifications subscription error", err);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not subscribe to notifications", e);
      setIsLoading(false);
    }
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) {
      setErrorMsg('الرجاء كتابة عنوان وبث مضمون الإشعار');
      return;
    }

    setIsSending(true);
    try {
      const newNotif = {
        title: notifTitle.trim(),
        content: notifContent.trim(),
        siteId: notifScope,
        senderName: currentUser?.nameAr || 'إدارة البرنامج',
        senderUsername: currentUser?.username || 'system',
        timestamp: new Date().toISOString(),
        dismissedBy: [],
        targetUsers: targetUsers.trim() ? targetUsers.split(',').map(u => u.trim()) : []
      };

      await addDoc(collection(db, 'notifications'), newNotif);
      setSuccessMsg('تم بث الإشعار الإداري العاجل بنجاح تام! سيظهر للمستهدفين فوراً ولا يختفي حتى تصفحه والإقرار بالفهم.');
      setNotifTitle('');
      setNotifContent('');
      setTargetUsers('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل إرسال الإشعار: ' + (err.message || err));
    } finally {
      setIsSending(false);
    }
  };

  const handleDismissNotification = async (id: string, currentlyDismissed: string[]) => {
    if (!currentUser) return;
    
    // Save to local dismissed storage first for instant feedback
    let locallyDismissed: string[] = [];
    try {
      const stored = localStorage.getItem('bunyan_dismissed_notifications');
      if (stored) locallyDismissed = JSON.parse(stored);
    } catch {}
    if (!locallyDismissed.includes(id)) {
      locallyDismissed.push(id);
      localStorage.setItem('bunyan_dismissed_notifications', JSON.stringify(locallyDismissed));
    }

    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, {
        dismissedBy: arrayUnion(currentUser.username)
      });
    } catch (err: any) {
      console.warn("Failed to sync dismissal to database:", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!await confirmWithRandomCode('هل أنت متأكد من حذف هذا التعميم نهائياً من قاعدة البيانات السحابية؟')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setSuccessMsg('تم حذف التعميم الإداري نهائياً وبنجاح.');
    } catch (err: any) {
      setErrorMsg('فشل الحذف: ' + (err.message || err));
    }
  };

  // Helper to read local storage in addition to DB tracking
  const isRead = (notif: any) => {
    if (!currentUser) return false;
    let locallyDismissed: string[] = [];
    try {
      const stored = localStorage.getItem('bunyan_dismissed_notifications');
      if (stored) locallyDismissed = JSON.parse(stored);
    } catch {}
    return (notif.dismissedBy && notif.dismissedBy.includes(currentUser.username)) || locallyDismissed.includes(notif.id);
  };

  // Filter notifications for display
  const targetedNotifications = notifications.filter(n => {
    // Show only the ones relevant to this user's current site (or 'all' global ones)
    let isSiteRelevant = n.siteId === 'all' || (selectedSite && n.siteId === selectedSite.id);
    
    // Filter out notifications created before user was created
    let isCreatedAfterUser = true;
    if (currentUser?.createdAt && n.timestamp) {
       isCreatedAfterUser = new Date(n.timestamp).getTime() >= new Date(currentUser.createdAt).getTime();
    }
    
    // If specific users are targeted, only show if current user is one of them
    let isTargeted = true;
    if (n.targetUsers && n.targetUsers.length > 0) {
        isTargeted = currentUser ? n.targetUsers.includes(currentUser.username) : false;
    }
    
    return isSiteRelevant && isCreatedAfterUser && isTargeted;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title block */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-indigo-500/10 text-indigo-300 rounded-xl">
                <Bell className="w-6 h-6 animate-swing" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight" id="notif-center-title">مركز الإشعارات والتعاميم الإدارية</h2>
            </div>
            <p className="text-xs text-slate-305 font-bold">بث التعليمات الملزمة للمهندسين ومتابعة التوجيهات الفنية الفورية بالمواقع</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold font-sans">
            <span className={`w-2.5 h-2.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span>بث السحابة: {dbConnected ? 'متصل ونشط ⚡' : 'محلي ومحفوظ مؤقتاً'}</span>
          </div>
        </div>
      </div>

      {/* Tabs list inside notifications page */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-2.5 rounded-2xl border shadow-sm">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'received' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>الإشعارات والتعاميم الواردة ({targetedNotifications.length})</span>
        </button>

        {canSend && (
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'send' 
                ? 'bg-indigo-650 text-white shadow-md' 
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>لوحة إرسال وبث الإشعارات 📣</span>
            <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-1">صلاحية خاصة</span>
          </button>
        )}
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 1, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 1, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1 }}
            className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subpage screens */}
      <div className="space-y-6">
        {activeTab === 'received' && (
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden" id="received-notifications-subcard">
            <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">التعاميم والتنبيهات الموجهة لك</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">تظهر لك في هذه القائمة التعاميم المستهدفة لمشروعك الحالي أو التعاميم العامة على مستوى الشركة.</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-xl font-bold">
                المشروع النشط: {selectedSite?.nameAr || 'عام'}
              </span>
            </div>

            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-500 font-bold">جاري تحميل الإشعارات من السحابة...</span>
                </div>
              ) : targetedNotifications.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-black text-slate-700">لا توجد إشعارات أو تعاميم نشطة حالياً</h4>
                  <p className="text-[10.5px] text-slate-400 font-bold">عندما تقوم إدارة المشروع أو مهندس مراقبة الجلسة ببث تعميم، ستراه هنا فوراً.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {targetedNotifications.map((notif) => {
                    const dismissed = isRead(notif);
                    return (
                      <div 
                        key={notif.id} 
                        className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                          dismissed 
                            ? 'bg-slate-50/55 border-slate-150 opacity-65' 
                            : 'bg-white border-amber-200/60 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {!dismissed && (
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 text-right">
                            <div className="flex flex-wrap items-center gap-2">
                              {!dismissed && (
                                <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-md flex items-center gap-1">
                                  <Radio className="w-2.5 h-2.5 animate-ping" />
                                  عاجل وغير مقروء
                                </span>
                              )}
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-md border border-slate-200">
                                {notif.siteId === 'all' ? 'لكافة المواقع 🌍' : 'للموقع الحالي فقط 📍'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold font-sans flex items-center gap-1 mr-auto md:mr-0">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(notif.timestamp).toLocaleString('ar-EG')}
                              </span>
                            </div>

                            <h4 className="text-base font-black text-slate-900">{notif.title}</h4>
                            <p className="text-xs text-slate-650 leading-relaxed font-bold whitespace-pre-wrap">{notif.content}</p>

                            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-bold bg-slate-50 w-fit px-3 py-1.5 rounded-xl border border-slate-100 mt-2">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>المرسل:</span>
                              <span className="text-slate-800 font-black">{notif.senderName}</span>
                              <span className="text-[9.5px] text-indigo-650">@{notif.senderUsername}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                            {!dismissed ? (
                              <button
                                onClick={() => handleDismissNotification(notif.id, notif.dismissedBy || [])}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center gap-1 shadow transition"
                              >
                                <Check className="w-4 h-4" />
                                <span>أؤكد الفهم والقراءة 👍</span>
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10.5px] font-bold rounded-xl border border-slate-150 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                تم الإقرار بالفهم
                              </span>
                            )}

                            {(currentUser?.role === 'admin' || notif.senderUsername === currentUser?.username) && (
                              <button
                                onClick={() => handleDeleteNotification(notif.id)}
                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl transition cursor-pointer"
                                title="حذف هذا البث الإداري نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {dismissed && notif.dismissedBy && notif.dismissedBy.length > 0 && currentUser?.role === 'admin' && (
                          <div className="mt-3 pt-3 border-t border-slate-150 text-[10px] text-slate-400 font-bold flex flex-wrap items-center gap-1.5">
                            <span>الأعضاء الذين أقروا بالقراءة:</span>
                            {notif.dismissedBy.map((u: string) => (
                              <span key={u} className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 font-sans">@{u}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'send' && canSend && (
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden" id="send-notifications-subcard">
            <div className="p-8 border-b border-slate-100 bg-white flex items-center gap-4">
              <span className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Database className="w-6 h-6 text-indigo-500" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">بث تعميم وتوجيهات إدارية عاجلة</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  يمكنك بث تعميم ملزم للجميع أو لمشروع بعينه. سيظهر البث فوراً للمستهدفين.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">عنوان التعميم والمشكلة المستهدفة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: التفتيش المفاجئ وإجراءات السلامة لصب خرسانة الأسبوع القادم"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">المهندسين والمواقع المستهدفة بالبث</label>
                  <select
                    value={notifScope}
                    onChange={(e) => setNotifScope(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition shadow-sm"
                  >
                    {currentUser?.role === 'admin' && (
                      <option value="all">الجميع (كافة فروع ومواقع مشروعات بنيان 🌍)</option>
                    )}
                    {selectedSite && (
                      <option value={selectedSite.id}>موقع ومشروع ({selectedSite.nameAr}) الحالي فقط 📍</option>
                    )}
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-2">المستخدمين المستهدفين (اسم المستخدم، مفصولين بفاصلة. اتركها فارغة للجميع)</label>
                   <input
                    type="text"
                    placeholder="مثال: ahmed, mohamed"
                    value={targetUsers}
                    onChange={(e) => setTargetUsers(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition shadow-sm"
                   />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">مضمون الإحاطة والتوجيه المباشر</label>
                <textarea
                  required
                  rows={5}
                  placeholder="اكتب التوجيه الإداري بوضوح شديد. سيمنع المهندسين المستهدفين من استخدام البرنامج حتى يقرأوه ويؤكدوا الموافقة..."
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition shadow-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100 w-full sm:w-auto">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>التعميم ينشئ حظر شاشة فوري للمستخدمين النشطين حتى تأكيد القراءة</span>
                </div>
                
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>جاري البث...</span>
                    </>
                  ) : (
                    <>
                      <span>بث وإرسال التعميم فوراً 📣</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
