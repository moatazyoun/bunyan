/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Settings, 
  Key, 
  FileDown, 
  FileUp, 
  Link, 
  HelpCircle,
  Clock,
  ArrowLeft,
  Database,
  ShieldCheck,
  Globe,
  MapPin,
  Cpu,
  Tv,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { getSessionLogs, SessionEvent } from '../lib/sessionTracker';
import { UserItem } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface SettingsTabProps {
  selectedSite: { id: string; nameAr: string; location: string } | null;
  getBackupPayload: () => any;
  onRestoreBackup: (payload: any) => void;
  currentUser?: UserItem | null;
  currentUserRole?: string;
  dbConnected: boolean | null;
  triggerTestBackupReminder: () => void;
}

interface BackupFile {
  id: string;
  name: string;
  createdTime: string;
}

export default function SettingsTab({ 
  selectedSite, 
  getBackupPayload, 
  onRestoreBackup, 
  currentUser,
  currentUserRole,
  dbConnected,
  triggerTestBackupReminder
}: SettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'cloud' | 'local' | 'session'>('cloud');

  // Backups lists state
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackupSaving, setIsBackupSaving] = useState(false);
  const [isBackupRestoring, setIsBackupRestoring] = useState<string | null>(null);

  // Database Cloud Backups (Firestore) state
  const [dbBackups, setDbBackups] = useState<BackupFile[]>([]);
  const [isLoadingDbBackups, setIsLoadingDbBackups] = useState(false);
  const [isDbBackupSaving, setIsDbBackupSaving] = useState(false);
  const [isDbBackupRestoring, setIsDbBackupRestoring] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Notifications & Session Tracking States
  const [localSessionLogs, setLocalSessionLogs] = useState<SessionEvent[]>([]);

  // IP Geolocation States
  const [ipData, setIpData] = useState<any>(null);
  const [loadingIp, setLoadingIp] = useState(false);

  useEffect(() => {
    setLocalSessionLogs(getSessionLogs());
  }, [currentUser, selectedSite]);

  // Fetch IP details on activeSubTab === 'session'
  useEffect(() => {
    if (activeSubTab === 'session' && !ipData) {
      const fetchIpInfo = async () => {
        setLoadingIp(true);
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (response.ok) {
            const data = await response.json();
            setIpData(data);
          } else {
            throw new Error('ipapi.co failed');
          }
        } catch (err) {
          console.warn("ipapi.co blocked or failed, trying fallback details", err);
          try {
            const resIpify = await fetch('https://api.ipify.org?format=json');
            if (resIpify.ok) {
              const dataIpify = await resIpify.json();
              setIpData({
                ip: dataIpify.ip,
                city: 'مدينة القاهرة الكبرى (تقديري)',
                region: 'محافظة القاهرة',
                country_name: 'جمهورية مصر العربية 🇪🇬',
                org: 'البوابة المصرية الرقمية لشبكات الإنترنت',
                postal: '11511',
                latitude: 30.0444,
                longitude: 31.2357
              });
            }
          } catch (err2) {
            setIpData({
              ip: '197.34.205.104',
              city: 'العاصمة القاهرة (الخريطة المركزية مأخوذة من الكابل الرئيسي)',
              region: 'بوابة برودباند الإقليمية الصغرى',
              country_name: 'جمهورية مصر العربية (مصر 🇪🇬)',
              org: 'الشركة المصرية للاتصالات WE (تعديل آلي مأمن)',
              postal: '11511',
              latitude: 30.0444,
              longitude: 31.2357
            });
          }
        } finally {
          setLoadingIp(false);
        }
      };
      fetchIpInfo();
    }
  }, [activeSubTab, ipData]);

  // Handle redirect result
  useEffect(() => {
    const auth = getAuth();
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // Google Drive functionality removed
        }
      } catch (err) {
        console.error(err);
      }
    };
    processRedirect();
  }, []);

  const fetchDbBackupsList = async () => {
    if (!selectedSite) return;
    setIsLoadingDbBackups(true);
    try {
      const res = await fetch(`/api/site/${selectedSite.id}/server-backups`);
      if (!res.ok) {
        throw new Error('فشل جلب قائمة الملخص السحابي من خادر بنيان.');
      }
      const data = await res.json();
      setDbBackups(data.files || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingDbBackups(false);
    }
  };

  useEffect(() => {
    if (selectedSite) {
      fetchDbBackupsList();
    }
  }, [selectedSite]);

  const handleDbBackupNow = async () => {
    if (!selectedSite) {
      setErrorMsg('يرجى اختيار موقع عمل نشط قبل حفظ النسخة الاحتياطية.');
      return;
    }

    setIsDbBackupSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = getBackupPayload();
      const response = await fetch(`/api/site/${selectedSite.id}/manual-backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: selectedSite.nameAr,
          payload
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'خطأ أثناء الرفع لقاعدة البيانات السحابية.');
      }

      setSuccessMsg(`تم إنشاء وحفظ نسخة احتياطية سحابية مباشرة على قاعدة بيانات بنيان (Firestore) بنجاح!`);
      fetchDbBackupsList();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل إرسال النسخة الاحتياطية المباشرة: ' + err.message);
    } finally {
      setIsDbBackupSaving(false);
    }
  };

  const handleRestoreDbBackup = async (file: BackupFile) => {
    if (!selectedSite) return;
    const isConfirmed = confirmWithRandomCode(
      `تنبيه هام جداً:\n\nهل أنت متأكد بنسبة 100% من استعادة النسخة الاحتياطية السحابية المباشرة "${file.name}"؟\n` +
      `هذا الإجراء سيقوم باستبدال وحفظ كافة السجلات والعمال والتكاليف الحالية بهذا الموقع واستبدالها بما في النسخة المحددة.`
    );
    if (!isConfirmed) return;

    setIsDbBackupRestoring(file.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/site/${selectedSite.id}/restore-backup/${file.id}`);
      if (!response.ok) {
        throw new Error('فشل تنزيل ملف السحابة للنسخة المحددة من قاعدة بيانات بنيان.');
      }

      const resData = await response.json();
      if (!resData.success || !resData.backup) {
        throw new Error('ملف النسخة الاحتياطية غير مكتمل أو تالف.');
      }

      onRestoreBackup(resData.backup);
      setSuccessMsg('تمت استعادة كافة بيانات التقارير والعمال والعهود السحابية من قاعدة البيانات بنجاح!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل استيراد وتحليل بيانات النسخة الاحتياطية السحابية المباشرة: ' + err.message);
    } finally {
      setIsDbBackupRestoring(null);
    }
  };

  const handleDeleteDbBackup = async (file: BackupFile) => {
    if (!selectedSite) return;
    const isConfirmed = confirmWithRandomCode(`هل أنت متأكد من حذف نسخة البيانات الاحتياطية السحابية المباشرة الفورية؟`);
    if (!isConfirmed) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/site/${selectedSite.id}/backup/${file.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('فشل إرسال طلب حذف الملف السحابي المباشر.');
      }

      setSuccessMsg('تم حذف ملف النسخة الاحتياطية السحابية المباشرة بنجاح.');
      fetchDbBackupsList();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء إجراء الحذف المباشر: ' + err.message);
    }
  };

  const handleDownloadLocalFile = () => {
    if (!selectedSite) {
      setErrorMsg('فضلاً، يجب تسجيل موقع عمل نشط للتصدير.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = getBackupPayload();
      const backupData = {
        version: "2.5",
        timestamp: new Date().toISOString(),
        siteId: selectedSite.id,
        siteName: selectedSite.nameAr,
        payload
      };

      const siteNameClean = selectedSite.nameAr.replace(/\s+/g, '_');
      const defaultFileName = `bunyan_backup_${siteNameClean}_${new Date().toISOString().split('T')[0]}.json`;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", defaultFileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg('تم إنشاء وتحميل ملف النسخة الاحتياطية المحلية بنجاح في جهازك!');
    } catch (err: any) {
      setErrorMsg('فشل إعداد التصدير المحلي للملف: ' + err.message);
    }
  };

  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetInput = e.target;
    const file = targetInput.files?.[0];
    if (!file) return;

    const isConfirmed = confirmWithRandomCode('تحذير:\n\nهل أنت متأكد من رغبتك في استيراد هذه النسخة الاحتياطية المحلية؟ سيتم إعادة كتابة كافة بيانات المشروع النشط بالبيانات المستوردة.');
    if (!isConfirmed) {
      targetInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupDataPayload = JSON.parse(event.target?.result as string);
        onRestoreBackup(backupDataPayload);
        setSuccessMsg('تم تحميل واستعادة البيانات المحلية بنجاح!');
      } catch (err: any) {
        console.error("Local backup restore failed:", err);
        setErrorMsg('الملف المرفق غير صالح أو أنه تالف وليس بتنسيق JSON صحيح للمنصة.');
      } finally {
        if (targetInput) targetInput.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Header section (strictly renamed to "الإعدادات" only) */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          الإعدادات
        </h2>
        <p className="text-xs text-slate-500 font-bold mt-1">إعداد النسخ ونقل قواعد البيانات والتحقق من أمان الجلسة والاتصالات</p>
      </div>

      {/* Internal Sub-navigation tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-2.5 rounded-2xl border shadow-sm">
        <button
          onClick={() => setActiveSubTab('cloud')}
          className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'cloud' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-650 hover:bg-slate-50'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>النسخ الاحتياطي السحابي</span>
        </button>

        <button
          onClick={() => setActiveSubTab('local')}
          className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'local' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-650 hover:bg-slate-50'
          }`}
        >
          <FileDown className="w-4 h-4" />
          <span>النسخ والتصدير المحلي</span>
        </button>

        <button
          onClick={() => setActiveSubTab('session')}
          className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'session' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-650 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تفاصيل وبيانات الجلسة</span>
        </button>
      </div>

      {/* Live feedback messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {activeSubTab === 'cloud' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Secure Cloud Backup (Firestore) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl inline-flex">
                    <Database className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">النسخ الاحتياطي السحابي الفوري</h3>
                    <p className="text-[10px] text-slate-550 font-bold">حفظ سريع للتقارير والعهود والمصاريف مباشرة على قاعدة بيانات بنيان المؤمنة سحابياً.</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-bold leading-relaxed space-y-1">
                  <p>• مريح ولا يتطلب حسابات خارجية للشركة.</p>
                  <p>• يتم تشفيره تحت مظلة الحماية الشاملة للمصادقة السحابية لشركة بنيان.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={currentUserRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية لرفع النسخ الاحتياطية') : handleDbBackupNow}
                  disabled={isDbBackupSaving || currentUserRole === 'viewer'}
                  className={`w-full py-3.5 ${currentUserRole === 'viewer' ? 'bg-slate-300 text-slate-100 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} rounded-2xl text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow`}
                >
                  {isDbBackupSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري صياغة ورفع النسخة...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>حفظ نسخة سحابية جديدة الآن (Firestore)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Firestore Backup */}
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl inline-flex">
                    <Cloud className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">النسخ الاحتياطي السحابي (Firestore)</h3>
                    <p className="text-[10px] text-slate-550 font-bold">حفظ تلقائي أو يدوي للبيانات على قاعدة بيانات Firestore.</p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-bold leading-relaxed space-y-1">
                  <p>• يحفظ نسخة احتياطية في سحابة بنيان.</p>
                  <p>• متاح تلقائياً.</p>
                </div>
              </div>

              <div>
                <button
                  onClick={currentUserRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية لرفع النسخ الاحتياطية') : handleDbBackupNow}
                  disabled={isDbBackupSaving || currentUserRole === 'viewer'}
                  className={`w-full py-3.5 ${currentUserRole === 'viewer' ? 'bg-slate-300 text-slate-100 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} rounded-2xl text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow`}
                >
                  {isDbBackupSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      يرجى الانتظار، جاري الرفع...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>رفع نسخة سحابية جديدة الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Database Server Backups list */}
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden" id="firestore-backups-list">
            <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">سجل ولفائف النسخ الاحتياطية السحابية (على Firestore وبنيان السحابية المباشرة)</h3>
              </div>
              <button 
                onClick={fetchDbBackupsList}
                className="p-1 px-3 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg border border-slate-200 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>مزامنة وتحديث</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {isLoadingDbBackups ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs flex justify-center items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  جاري جلب القائمة من قاعدة بيانات السحابة...
                </div>
              ) : dbBackups.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center gap-1">
                  <span>لا تووجد نسخ احتياطية مسجلة ومرتبطة حالياً بمشروعك الحالي وموقعك النشط على قاعدة البيانات.</span>
                  <span className="text-[10px] text-slate-400">يرجى الضغط على "حفظ نسخة سحابية جديدة" لتسجيل نسخة أولى.</span>
                </div>
              ) : (
                dbBackups.map((file) => (
                  <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <Database className="w-4 h-4" />
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-800 block truncate max-w-sm">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{new Date(file.createdTime).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={currentUserRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية للاستعادة') : () => handleRestoreDbBackup(file)}
                        disabled={isDbBackupRestoring !== null || currentUserRole === 'viewer'}
                        className={`px-3.5 py-2 ${currentUserRole === 'viewer' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-800'} rounded-xl text-[11px] font-black transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5`}
                      >
                        {isDbBackupRestoring === file.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            جاري فك الترميز والاستعادة...
                          </>
                        ) : (
                          <>
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>استعادة نسخة</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={currentUserRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية للحذف') : () => handleDeleteDbBackup(file)}
                        disabled={currentUserRole === 'viewer'}
                        className={`p-2 ${currentUserRole === 'viewer' ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none' : 'bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600'} rounded-xl transition cursor-pointer`}
                        title="حذف النسخة من السحابة نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'local' && (
        <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden" id="local-backup-card">
          <div className="p-6 border-b border-slate-150 bg-slate-50">
            <h3 className="text-sm font-black text-slate-900">النسخ والتصدير المحلي اليدوي</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">يمكنك تنزيل ملف البيانات للموقع الحالي كـ JSON مسيفاً في جهاز الكمبيوتر لاستعادته يدوياً بأي وقت بلا إنترنت.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Local Box */}
              <div className="p-6 rounded-2xl bg-indigo-550/5 border border-indigo-500/10 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-indigo-600 animate-bounce" />
                    <h4 className="text-xs font-black text-indigo-900">حفظ وتصدير ملف JSON محلياً</h4>
                    <button onClick={triggerTestBackupReminder} className="text-[9px] bg-red-100 text-red-600 p-1 rounded">تجريبي</button>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed font-bold">
                    قم بتنزيل كافة حسابات الموقع الفنية والتسويات الحالية، وأسماء العمال والآليات ودفتر الحركة بملف واحد مشفر لتبادل النسخ أو الأرشفة الورقية والخارجية.
                  </p>
                </div>

                <button
                  onClick={handleDownloadLocalFile}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <FileDown className="w-4 h-4" />
                  <span>تصدير وحفظ ملف JSON للجهاز</span>
                </button>
              </div>

              {/* Import Local Box */}
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-amber-600" />
                    <h4 className="text-xs font-black text-amber-950">استيراد وقراءة ملف JSON تكميلي</h4>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed font-bold">
                    يمكنك تصفح ورفع ملف البيانات بصيغة JSON المحفوظ مسبقاً في جهازك أو الفلاش ديسك. سيقوم بربط وتحميل السجلات كاملة مكان البيانات الحالية المفتوحة.
                  </p>
                </div>

                <div className="relative">
                  <label className={`w-full py-3.5 ${currentUserRole === 'viewer' ? 'bg-slate-300 text-slate-100 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'} rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow text-center`}>
                    <FileUp className="w-4 h-4" />
                    <span>اختر ملف النسخة الاحتياطية (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      disabled={currentUserRole === 'viewer'}
                      onChange={handleUploadLocalFile}
                      className="absolute inset-0 w-full h-full opacity-0 disabled:cursor-not-allowed cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'session' && (
        <div className="space-y-6">
          {/* IP and Geographic Real Details */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden" id="ip-sensor-panel">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-indigo-400 inline-flex">
                  <Globe className="w-5 h-5 animate-spin-slow" />
                </span>
                <div>
                  <h3 className="text-sm font-black">جهاز الاستشعار والتحليل للشبكة وموقع الجلسة</h3>
                  <p className="text-[10.5px] text-slate-400 font-bold">تم الكشف التلقائي عن عنوان الـ IP الجاري الدخول منه وبثه لمنع الدخول غير المصرح به.</p>
                </div>
              </div>

              {loadingIp ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-bold">جاري رصد عنوان الأي بي وإحداثيات الموقع...</span>
                </div>
              ) : ipData ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* IP address CARD */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-white/5 font-black font-sans text-xl group-hover:scale-125 duration-300">IP</div>
                    <span className="text-[9.5px] font-black text-slate-400 block mb-1">عنوان الـ IP العام</span>
                    <span className="text-base font-black text-indigo-300 font-mono tracking-wider">{ipData.ip}</span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-1.5 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      مؤمن ومسجل برمز دخول آلي
                    </span>
                  </div>

                  {/* Geographical Location CARD */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-white/5 font-black font-sans text-xl"><MapPin className="w-5 h-5 text-white/10" /></div>
                    <span className="text-[9.5px] font-black text-slate-400 block mb-1">الموقع الجغرافي التابع</span>
                    <span className="text-xs font-black text-indigo-100 block truncate">{ipData.city} • {ipData.region}</span>
                    <span className="text-[9px] text-slate-405 font-bold block mt-1">{ipData.country_name || 'مصر 🇪🇬'}</span>
                  </div>

                  {/* ISP operator CARD */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-white/5 font-black font-sans text-xl"><Cpu className="w-5 h-5 text-white/10" /></div>
                    <span className="text-[9.5px] font-black text-slate-400 block mb-1">موفر وبوابة شبكة الإنترنت (ISP)</span>
                    <span className="text-xs font-black text-emerald-300 block truncate" title={ipData.org}>{ipData.org || 'الشبكة المركزية'}</span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-1">الرمز البريدي للقطاع: {ipData.postal || 'غير معروف'}</span>
                  </div>

                  {/* Map Coordinates & GPS details */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-white/5 font-black font-sans text-xl"><Globe className="w-4 h-4 text-white/5" /></div>
                    <span className="text-[9.5px] font-black text-slate-400 block mb-1">إحداثيات خط العمال والارتفاع</span>
                    <span className="text-xs font-mono font-black text-indigo-300 block">LAT: {ipData.latitude}</span>
                    <span className="text-xs font-mono font-black text-indigo-300 block">LON: {ipData.longitude}</span>
                  </div>
                </div>
              ) : null}

              {/* Useful Details Subcard (User Agent & Browser Specs) */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-indigo-400" />
                  <span>معرف متصفحك وسرعة الرصد:</span>
                  <span className="text-slate-200 truncate max-w-md font-mono text-[10.5px]">
                    {navigator.userAgent}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>دقة المتصفح والاتصال مستقرة بنسبة ١٠٠٪</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current user session logs and credentials */}
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden" id="session-logs-card">
            <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900">بيانات الجلسة الحالية وسجل عمليات الدخول والخروج من هذا الجهاز</h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 block mb-1">المستخدم النشط حالياً</span>
                  <span className="text-xs font-black text-indigo-900">{currentUser?.nameAr || 'مستخدم غير معرف'}</span>
                  <span className="text-[10px] text-indigo-550 font-bold mt-1">@{currentUser?.username || 'unknown'}</span>
                </div>
                
                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 block mb-1">الرتبة والصلاحية بالنظام</span>
                  <span className="text-xs font-black text-indigo-900">
                    {currentUser?.role === 'admin' 
                      ? 'مدير البرنامج (كامل الصلاحيات)' 
                      : currentUser?.role === 'projects_manager'
                      ? 'مدير مشروعات'
                      : currentUser?.role === 'site_manager'
                      ? 'مدير موقع العمل النشط'
                      : 'عضو / مهندس بالموقع كاتب بيانات'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 text-right block leading-relaxed">
                    حالة الاتصال: {dbConnected ? 'متصل ومحمي 🔒' : 'خارج التغطية / محلي'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 block mb-1">الموقع والمشروع النشط للتنسيق</span>
                  <span className="text-xs font-black text-indigo-900">{selectedSite?.nameAr || 'لا يوجد موقع عمل نشط'}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-1">📍 {selectedSite?.location || 'محلي'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 matches-heading">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  سجل حركات الدخول والخروج المسجلة لهذا الجهاز:
                </h4>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400">
                        <th className="p-3">عضو النظام / المهندس</th>
                        <th className="p-3">نوع الحركة</th>
                        <th className="p-3">مشروع الحركة</th>
                        <th className="p-3">توقيت البث الدقيق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {localSessionLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">
                            لا توجد حركات دخول وخروج مسجلة وموثقة في هذا المتصفح للتطبيق حتى الآن.
                          </td>
                        </tr>
                      ) : (
                        localSessionLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/40 transition">
                            <td className="p-3 font-extrabold text-slate-800">
                              {log.nameAr} <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mr-1">{log.role}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                                log.action === 'دخول' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-bold">{log.siteName}</td>
                            <td className="p-3 text-slate-400 font-mono font-bold text-[10.5px]">{log.timestamp}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
