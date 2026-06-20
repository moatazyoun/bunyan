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
  Database
} from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface SettingsTabProps {
  selectedSite: { id: string; nameAr: string; location: string } | null;
  getBackupPayload: () => any;
  onRestoreBackup: (payload: any) => void;
  currentUserRole?: string;
  dbConnected: boolean | null;
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
  currentUserRole,
  dbConnected
}: SettingsTabProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Backups lists state
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackupSaving, setIsBackupSaving] = useState(false);
  const [isBackupRestoring, setIsBackupRestoring] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-connect on mount if authenticated with Google providers in Firebase
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      // Look for google provider info
      const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
      if (googleProvider) {
        setGoogleUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        });
      }
    }
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential || !credential.accessToken) {
        throw new Error('لم يتم استلام رمز الوصول والمصادقة من جوجل درايف للنسخ الاحتياطي.');
      }
      
      setAccessToken(credential.accessToken);
      setGoogleUser({
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      });
      setSuccessMsg('تم ربط حساب Google بنجاح وإتاحة الوصول لجوجل درايف!');
      
      // Load backups list immediately after connection
      fetchBackupsList(credential.accessToken);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'فشل التوصيل بحساب Google المصرح به.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBackupsList = async (token = accessToken) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    setIsLoadingBackups(true);
    setErrorMsg(null);
    try {
      const q = encodeURIComponent("name contains 'bunyan_backup_' and trashed = false");
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id, name, createdTime)&orderBy=createdTime desc`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      
      if (!res.ok) {
        throw new Error('فشل جلب قائمة الملخص السحابي من Google Drive.');
      }
      
      const data = await res.json();
      setBackups(data.files || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('خطأ أثناء مزامنة وقراءة قائمة النسخ السحابية: ' + err.message);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleBackupNow = async () => {
    if (!accessToken) {
      setErrorMsg('يرجى توصيل حساب Google الخاص بك أولاً لتفعيل التخزين السحابي.');
      return;
    }
    if (!selectedSite) {
      setErrorMsg('يرجى اختيار موقع عمل نشط قبل حفظ النسخة الاحتياطية.');
      return;
    }

    setIsBackupSaving(true);
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
      const fileName = `bunyan_backup_${siteNameClean}_${new Date().toISOString().split('T')[0]}.json`;

      const boundary = 'bunyan_backup_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(backupData) +
        closeDelimiter;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`خطأ بجوجل درايف أثناء الرفع: ${errText}`);
      }

      setSuccessMsg(`تم رفع النسخة الاحتياطية "${fileName}" بنجاح إلى حسابك في Google Drive!`);
      // Update the backup file list
      fetchBackupsList();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل إعداد وإرسال حزمة النسخ السحابية: ' + err.message);
    } finally {
      setIsBackupSaving(false);
    }
  };

  const handleRestoreCloud = async (file: BackupFile) => {
    if (!accessToken) return;
    
    const isConfirmed = window.confirm(
      `تنبيه هام جداً:\n\nهل أنت متأكد بنسبة 100% من استعادة النسخة الاحتياطية "${file.name}"؟\n` +
      `هذا الإجراء سيقوم باستبدال وحذف وسحب كافة البيانات وسجلات العمال والمعدات والعهود والمقايسات الحالية للموقع الحالي واستبدالها بما في النسخة السحابية.`
    );
    if (!isConfirmed) return;

    setIsBackupRestoring(file.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل تنزيل ملف السحابة للنسخة المحددة من Google Drive.');
      }

      const backupData = await response.json();
      onRestoreBackup(backupData);
      setSuccessMsg('تمت استعادة كافة البيانات والملفات والتقارير من السحابة بنجاح!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل استيراد وتحليل بيانات النسخة الاحتياطية السحابية: ' + err.message);
    } finally {
      setIsBackupRestoring(null);
    }
  };

  const handleDeleteCloudFile = async (file: BackupFile) => {
    if (!accessToken) return;
    const isConfirmed = window.confirm(`هل أنت متأكد من حذف ملف النسخة الاحتياطية سحابياً "${file.name}" من جوجل درايف؟`);
    if (!isConfirmed) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error('فشل إرسال طلب حذف الملف السحابي.');
      }

      setSuccessMsg('تم حذف ملف النسخة الاحتياطية من جوجل درايف بنجاح.');
      fetchBackupsList();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء إجراء الحذف: ' + err.message);
    }
  };

  // Local File Fallbacks
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
    const file = e.target.files?.[0];
    if (!file) return;

    const isConfirmed = window.confirm('تحذير:\n\nهل أنت متأكد من رغبتك في استيراد هذه النسخة الاحتياطية المحلية؟ سيتم إعادة كتابة كافة بيانات المشروع النشط بالبيانات المستوردة.');
    if (!isConfirmed) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupDataPayload = JSON.parse(event.target?.result as string);
        onRestoreBackup(backupDataPayload);
        setSuccessMsg('تم تحميل واستعادة البيانات المحلية بنجاح!');
      } catch (err: any) {
        setErrorMsg('الملف المرفق غير صالح أو أنه تالف وليس بتنسيق JSON صحيح للمنصة.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          إعدادات النظام والنسخ الاحتياطي السحابي
        </h2>
        <p className="text-xs text-slate-500 font-bold mt-1">ضبط التخزين السحابي الآمن، مزامنة الملفات واستيراد بيانات المشروع</p>
      </div>

      {/* Live feedback messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Google Drive Authorization Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl inline-flex">
                <Cloud className="w-5 h-5" />
              </span>
              <h3 className="text-sm font-black text-slate-900">1. الربط السحابي (Google Drive)</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
              يتم ربط تطبيق بنيان بحساب Google الخاص بك لتخزين نسخ احتياطية كاملة ومجانية بالكامل على مجلد تطبيق خاص بك على جوجل درايف تلقائياً وبأقصى درجات الأمان.
            </p>
          </div>

          {googleUser ? (
            <div className={`p-4 rounded-2xl border space-y-3 text-right ${accessToken ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex items-center gap-3">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt={googleUser.displayName} className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">G</div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-slate-800 truncate">{googleUser.displayName || 'حساب غوغل'}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{googleUser.email}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-black ${accessToken ? 'text-emerald-600' : 'text-rose-600'}`}>
                {accessToken ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    متصل بخدمة Google Drive بنجاح
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    جلسة درايف منتهية، يرجى تفعيل الاتصال
                  </>
                )}
              </div>
              <button 
                onClick={handleConnectGoogle}
                className="w-full text-center py-2.5 text-[10.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md flex justify-center items-center gap-2"
              >
                <CloudUpIcon className="w-3.5 h-3.5" />
                {accessToken ? 'تغيير الحساب المربوط' : 'تفعيل وتجديد الاتصال بجوجل درايف'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-slate-950 font-black text-xs text-white rounded-2xl hover:bg-slate-850 transition shadow-lg shrink-0"
            >
              <CloudUpIcon className="w-4.5 h-4.5" />
              {isConnecting ? 'جاري الاتصال السحابي...' : (googleUser ? 'تفعيل الاتصال بجوجل درايف' : 'ربط الحساب بجوجل درايف')}
            </button>
          )}
        </div>

        {/* Step 2: Instant Operations actions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl inline-flex">
                <CloudUpload className="w-5 h-5" />
              </span>
              <h3 className="text-sm font-black text-slate-900">2. النسخ الفوري والاستيراد المباشر</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
              اضغط لحفظ نسخة متزامنة وبثها للسحابة، أو استخدم الخيارات المتقدمة للتصدير والاستيراد من جهازك مباشرة بصيغة JSON.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              disabled={!accessToken || isBackupSaving}
              onClick={handleBackupNow}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black shadow-md transition ${
                !accessToken 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-250 shadow-none' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isBackupSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري رفع النسخة السحابية...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  إنشاء نسخة احتياطية سحابية الآن
                </>
              )}
            </button>

            {/* Offline Local Fallback tools */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadLocalFile}
                className="flex items-center justify-center gap-1.5 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-[10.5px] font-black hover:bg-slate-100 transition"
                title="تنزيل نسخة احتياطية محلية لجهازك"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                تصدير ملف محلي
              </button>
              
              <label className="flex items-center justify-center gap-1.5 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-[10.5px] font-black hover:bg-slate-100 transition cursor-pointer">
                <FileUp className="w-3.5 h-3.5 text-emerald-600" />
                استيراد ملف محلي
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleUploadLocalFile} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>

        {/* Database Status indicator widget */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              حالة وقوة اتصال قاعدة البيانات
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal font-bold">
              يراقب نظام بنيان المزامنة التلقائية مع فروع ومواقع المشروعات باستمرار لضمان بيئة عمل سحابية مستقرة.
            </p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">حالة شبكة Firebase:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                dbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {dbConnected ? 'قيد الاتصال السحابي' : 'متصل محلياً (غير متسق)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">موقع التخزين المعتمد:</span>
              <span className="font-mono text-slate-700 font-bold">Firestore DB Client</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backups List from Google Drive */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden min-h-[250px]">
        <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">سجل ولفائف النسخ الاحتياطية على السحابة (Google Drive)</h3>
          </div>
          {accessToken && (
            <button
              onClick={() => fetchBackupsList()}
              disabled={isLoadingBackups}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10.5px] font-black hover:bg-slate-100 transition text-slate-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoadingBackups ? 'animate-spin' : ''}`} />
              تحديث السجل
            </button>
          )}
        </div>

        {!accessToken ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full">
              <Cloud className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-xs font-black text-slate-505 max-w-sm leading-relaxed">
              يرجى توصيل حساب Google Drive الخاص بكم لعرض واستعادة وحذف النسخ الاحتياطية المتوفرة ومراقبة تفاصيل البيانات أولاً بأول.
            </p>
          </div>
        ) : isLoadingBackups ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400">جاري قراءة وفرز النسخ المتاحة من جوجل درايف الخاص بكم...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-slate-300" />
            <p className="text-xs font-black text-slate-400 font-sans">لا توجد أي نسخ احتياطية مسجلة باسم التطبيق في حسابك بعد.</p>
            <p className="text-[10px] font-bold text-slate-400">اضغط على زر (إنشاء نسخة احتياطية سحابية الآن) بالأعلى لبدء الأرشفة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10.5px] font-black text-slate-400 bg-slate-50">
                  <th className="p-4">اسم ملف النسخة الاحتياطية</th>
                  <th className="p-4">تاريخ ووقت الأرشفة</th>
                  <th className="p-4">رقم تعريف الملف (ID)</th>
                  <th className="p-4 text-center">خيارات التحكم والتحميل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {backups.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-black text-slate-800 flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-indigo-500 shrink-0" />
                      {file.name}
                    </td>
                    <td className="p-4 text-slate-500 font-bold flex-row items-center gap-2">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(file.createdTime).toLocaleString('ar-EG')}</span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400 font-bold">{file.id}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={isBackupRestoring !== null}
                          onClick={() => handleRestoreCloud(file)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] font-black transition ${
                            isBackupRestoring === file.id
                              ? 'bg-amber-100 text-amber-700 animate-pulse'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isBackupRestoring === file.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              جاري الاستعادة...
                            </>
                          ) : (
                            <>
                              <CloudDownload className="w-3 h-3" />
                              استعادة هذه النسخة
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteCloudFile(file)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف النسخة من الدرايف"
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
        )}
      </div>
    </div>
  );
}

// Google SVG Icon Helper for consistent beautiful interface
function CloudUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={props.className} style={{ display: "block" }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  );
}
