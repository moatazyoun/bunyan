import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, FileText, Activity, 
  Plus, Printer, Search, Filter, HardHat, Flame, 
  CheckCircle, Trash2, ShieldAlert
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp, where } from 'firebase/firestore';
import { UserItem, Project } from '../types';

interface HSEDashboardProps {
  user: UserItem | null;
  projects: Project[];
  addAuditLog?: (action: string, module: string, details: string, customRefNo?: string) => void;
  auditLogs?: any[];
  selectedSite: { id: string; nameAr: string; location: string; description: string } | null;
}

interface Incident {
  id: string;
  refNumber: string;
  projectId: string;
  date: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'injury' | 'near_miss' | 'property_damage' | 'environmental';
  status: 'active' | 'closed';
  reportedBy: string;
  createdAt: any;
}

interface Audit {
  id: string;
  refNumber: string;
  projectId: string;
  date: string;
  type: 'ppe' | 'equipment' | 'fire_extinguisher';
  score: number;
  status: 'passed' | 'failed' | 'needs_action';
  inspector: string;
  createdAt: any;
}

interface ActivityLog {
  id: string;
  refNumber: string;
  action: string;
  module: string;
  performedBy: string;
  timestamp: any;
  severity?: 'normal' | 'critical';
}

export default function HSEDashboard({ user, projects, addAuditLog, auditLogs, selectedSite }: HSEDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'audits' | 'activity'>('overview');
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const [loading, setLoading] = useState(true);

  // Form states
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showAuditForm, setShowAuditForm] = useState(false);

  const [safeHours, setSafeHours] = useState(0);

  // Fetch data from Firebase
  useEffect(() => {
    setLoading(true);
    const activeSiteId = selectedSite?.id || 'central';

    const qIncidents = query(
      collection(db, 'hse_incidents'),
      where('siteId', '==', activeSiteId)
    );

    const unsubIncidents = onSnapshot(qIncidents, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });
      setIncidents(list);
    }, (error) => { console.error('Error fetching incidents:', error); });

    const qAudits = query(
      collection(db, 'hse_audits'),
      where('siteId', '==', activeSiteId)
    );

    const unsubAudits = onSnapshot(qAudits, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Audit));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });
      setAudits(list);
    }, (error) => { console.error('Error fetching audits:', error); });

    const qActivities = query(
      collection(db, 'hse_activity_logs'),
      where('siteId', '==', activeSiteId)
    );

    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      list.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setActivities(list);
      setLoading(false);
    }, (error) => { 
      console.error('Error fetching activities:', error); 
      setLoading(false);
    });

    return () => {
      unsubIncidents();
      unsubAudits();
      unsubActivities();
    };
  }, [selectedSite]);

  const generateRefNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `HSE-ACT-2026-${random}`;
  };

  const logActivity = async (action: string, module: string, severity: 'normal' | 'critical' = 'normal') => {
    try {
      const refNo = generateRefNumber();
      await addDoc(collection(db, 'hse_activity_logs'), {
        refNumber: refNo,
        action,
        module,
        siteId: selectedSite?.id || 'central',
        performedBy: user?.nameAr || 'مستخدم غير معروف',
        timestamp: serverTimestamp(),
        severity
      });

      if (addAuditLog) {
        addAuditLog(
          action,
          `الصحة والسلامة المهنية - ${module}`,
          `تفاصيل الإجراء الميداني الموثق لقسم السلامة والصحة المهنية [HSE]`,
          refNo
        );
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Dynamic derivation of safe hours based on site handover date or last incident date
    const activeProject = projects.find(p => p.id === selectedSite?.id);
    const handoverStr = activeProject?.handoverDate || activeProject?.assignmentDate || '';
    
    let baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // default 30 days ago fallback if no handover date
    if (handoverStr) {
      const parsed = new Date(handoverStr);
      if (!isNaN(parsed.getTime())) {
        baseTime = parsed.getTime();
      }
    }

    // If there are any incidents on this site, we reset and count from the latest incident date
    if (incidents.length > 0) {
      const latestIncident = incidents[0];
      let incidentTime = 0;
      if (latestIncident.createdAt?.toDate) {
        incidentTime = latestIncident.createdAt.toDate().getTime();
      } else if (latestIncident.date) {
        const parsed = new Date(latestIncident.date);
        if (!isNaN(parsed.getTime())) {
          incidentTime = parsed.getTime();
        }
      }

      if (incidentTime > 0) {
        // Safe hours start counting from the most recent incident
        const diff = Date.now() - incidentTime;
        setSafeHours(Math.max(0, Math.floor(diff / (1000 * 60 * 60))));
        return;
      }
    }

    // If no incidents have occurred, count from the site's handover date
    const diff = Date.now() - baseTime;
    setSafeHours(Math.max(0, Math.floor(diff / (1000 * 60 * 60))));
  }, [incidents, projects, selectedSite]);

  const activeIncidentsCount = incidents.filter(i => i.status === 'active').length;
  const passedAuditsCount = audits.filter(a => a.status === 'passed').length;
  const complianceRate = audits.length > 0 ? Math.round((passedAuditsCount / audits.length) * 100) : 100;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans print:bg-white print:m-0 print:p-0">
      
      {/* Header - Hidden on Print */}
      <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-purple-600" size={28} />
            إدارة الصحة والسلامة المهنية (HSE)
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            مراقبة الحوادث، التفتيش الدوري، وسجل المخالفات الموقعية.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shadow-sm border border-slate-200 flex items-center gap-2 font-bold text-sm"
          >
            <Printer size={18} />
            طباعة السجلات
          </button>
        </div>
      </div>

      {/* Tabs - Hidden on Print */}
      <div className="bg-white border-b border-slate-200 px-6 pt-2 flex gap-6 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-black transition-all border-b-4 ${activeTab === 'overview' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><Activity size={16} /> لوحة المؤشرات</div>
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-4 text-sm font-black transition-all border-b-4 ${activeTab === 'incidents' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><AlertTriangle size={16} /> سجل الحوادث والمخالفات</div>
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-4 text-sm font-black transition-all border-b-4 ${activeTab === 'audits' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><ShieldCheck size={16} /> التفتيش والتدقيق</div>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-4 text-sm font-black transition-all border-b-4 ${activeTab === 'activity' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><FileText size={16} /> سجل النشاطات</div>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 print:block">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-2">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">ساعات آمنة</p>
                      <h3 className="text-3xl font-black text-slate-900">{safeHours.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">حوادث نشطة</p>
                      <h3 className="text-3xl font-black text-slate-900">{activeIncidentsCount}</h3>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">نسبة الالتزام</p>
                      <h3 className="text-3xl font-black text-slate-900">{complianceRate}%</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <Activity size={24} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">جولات تفتيش</p>
                      <h3 className="text-3xl font-black text-slate-900">{audits.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <FileText size={24} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Incidents Summary */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-purple-600" />
                      أحدث الحوادث والمخالفات
                    </h3>
                    <div className="space-y-4">
                      {incidents.slice(0, 5).map(inc => (
                        <div key={inc.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inc.severity === 'critical' ? 'bg-black text-white' : 
                                inc.severity === 'high' ? 'bg-red-100 text-red-700' : 
                                inc.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {inc.severity === 'critical' ? 'حرج' : inc.severity === 'high' ? 'عالي' : inc.severity === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                              <span className="text-xs font-bold text-slate-500">{inc.date}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{inc.description}</p>
                            <p className="text-xs text-slate-500 mt-1">بواسطة: {inc.reportedBy}</p>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded-md ${
                            inc.status === 'active' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {inc.status === 'active' ? 'نشط' : 'مغلق'}
                          </span>
                        </div>
                      ))}
                      {incidents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">لا توجد حوادث مسجلة.</p>}
                    </div>
                  </div>

                  {/* Recent Activity Summary */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Activity size={20} className="text-purple-600" />
                      النشاطات الأخيرة
                    </h3>
                    <div className="space-y-4">
                      {activities.slice(0, 5).map(act => (
                        <div key={act.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                          <div>
                            <p className={`text-sm font-bold ${act.severity === 'critical' ? 'text-purple-700' : 'text-slate-800'}`}>
                              {act.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{act.refNumber}</span>
                              <span className="text-xs text-slate-500">{act.performedBy}</span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleDateString('ar-EG') : ''}
                          </span>
                        </div>
                      ))}
                      {activities.length === 0 && <p className="text-sm text-slate-500 text-center py-4">لا توجد نشاطات مسجلة.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Incidents Log */}
            {activeTab === 'incidents' && (
              <div className="print:block">
                <div className="flex justify-between items-center mb-6 print:hidden">
                  <h3 className="text-xl font-black text-slate-900">سجل الحوادث والمخالفات</h3>
                  <button 
                    onClick={() => setShowIncidentForm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={16} />
                    تسجيل بلاغ جديد
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-black tracking-wider">
                        <th className="p-4">الرقم المرجعي</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">المشروع</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">الخطورة</th>
                        <th className="p-4">الوصف</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 print:hidden">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.map(inc => {
                        const project = projects.find(p => p.id === inc.projectId);
                        return (
                          <tr key={inc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                            <td className="p-4 font-mono text-xs font-bold text-slate-600">{inc.refNumber}</td>
                            <td className="p-4 font-medium text-slate-700">{inc.date}</td>
                            <td className="p-4 font-bold text-slate-900">{project?.name || 'مشروع غير محدد'}</td>
                            <td className="p-4 text-slate-700">
                              {inc.type === 'injury' ? 'إصابة عمل' : 
                               inc.type === 'near_miss' ? 'حادث وشيك' : 
                               inc.type === 'property_damage' ? 'تلف ممتلكات' : 'بيئي'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black ${
                                inc.severity === 'critical' ? 'bg-black text-white' : 
                                inc.severity === 'high' ? 'bg-red-100 text-red-700' : 
                                inc.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {inc.severity === 'critical' ? 'حرج' : inc.severity === 'high' ? 'عالي' : inc.severity === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600 max-w-xs truncate" title={inc.description}>{inc.description}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                                inc.status === 'active' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              }`}>
                                {inc.status === 'active' ? 'نشط' : 'مغلق'}
                              </span>
                            </td>
                            <td className="p-4 print:hidden">
                              {inc.status === 'active' && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, 'hse_incidents', inc.id), { status: 'closed' });
                                      await logActivity(`إغلاق بلاغ مخالفة/حادث: ${inc.refNumber}`, 'الحوادث والمخالفات');
                                    } catch (e) { console.error(e); }
                                  }}
                                  className="text-xs bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition-colors"
                                >
                                  إغلاق
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {incidents.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">لا توجد سجلات حالياً</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Audits */}
            {activeTab === 'audits' && (
              <div className="print:block">
                <div className="flex justify-between items-center mb-6 print:hidden">
                  <h3 className="text-xl font-black text-slate-900">سجل التفتيش والتدقيق الدوري</h3>
                  <button 
                    onClick={() => setShowAuditForm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={16} />
                    تسجيل جولة تفتيش
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-black tracking-wider">
                        <th className="p-4">الرقم المرجعي</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">المشروع</th>
                        <th className="p-4">نوع التفتيش</th>
                        <th className="p-4">المفتش</th>
                        <th className="p-4">التقييم (%)</th>
                        <th className="p-4">النتيجة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map(audit => {
                        const project = projects.find(p => p.id === audit.projectId);
                        return (
                          <tr key={audit.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                            <td className="p-4 font-mono text-xs font-bold text-slate-600">{audit.refNumber}</td>
                            <td className="p-4 font-medium text-slate-700">{audit.date}</td>
                            <td className="p-4 font-bold text-slate-900">{project?.name || 'مشروع غير محدد'}</td>
                            <td className="p-4 text-slate-700">
                              <div className="flex items-center gap-2">
                                {audit.type === 'ppe' && <HardHat size={16} className="text-orange-500" />}
                                {audit.type === 'fire_extinguisher' && <Flame size={16} className="text-red-500" />}
                                {audit.type === 'equipment' && <ShieldCheck size={16} className="text-blue-500" />}
                                <span>
                                  {audit.type === 'ppe' ? 'مهمات وقاية (PPE)' : 
                                   audit.type === 'fire_extinguisher' ? 'طفايات الحريق' : 'معدات وآليات'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-700 font-medium">{audit.inspector}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{audit.score}%</span>
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${audit.score >= 80 ? 'bg-emerald-500' : audit.score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                                    style={{ width: `${audit.score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                                audit.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                audit.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' : 
                                'bg-orange-50 text-orange-600 border-orange-200'
                              }`}>
                                {audit.status === 'passed' ? 'مجتاز' : audit.status === 'failed' ? 'راسب' : 'بحاجة لإجراء'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {audits.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">لا توجد جولات تفتيش حالياً</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Activity Log */}
            {activeTab === 'activity' && (
              <div className="print:block">
                <div className="mb-6 print:hidden">
                  <h3 className="text-xl font-black text-slate-900">سجل النشاطات العام (Audit Log)</h3>
                  <p className="text-sm text-slate-500 mt-1">تتبع جميع الحركات والتعديلات داخل وحدة الصحة والسلامة المهنية.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-black tracking-wider">
                        <th className="p-4">الرقم المرجعي</th>
                        <th className="p-4">التوقيت</th>
                        <th className="p-4">المستخدم</th>
                        <th className="p-4">الوحدة</th>
                        <th className="p-4">نوع الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map(act => (
                        <tr key={act.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                          <td className="p-4 font-mono text-xs font-bold text-slate-600">{act.refNumber}</td>
                          <td className="p-4 font-medium text-slate-700" dir="ltr">
                            {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleString('ar-EG') : ''}
                          </td>
                          <td className="p-4 font-bold text-slate-900">{act.performedBy}</td>
                          <td className="p-4 text-slate-600 font-medium">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs">{act.module}</span>
                          </td>
                          <td className={`p-4 font-bold ${act.severity === 'critical' ? 'text-purple-700' : 'text-slate-800'}`}>
                            {act.action}
                          </td>
                        </tr>
                      ))}
                      {activities.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">لا توجد نشاطات مسجلة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* Incident Modal */}
      {showIncidentForm && (
        <IncidentFormModal 
          onClose={() => setShowIncidentForm(false)} 
          projects={projects}
          user={user}
          onSuccess={async (data) => {
            try {
              const ref = generateRefNumber();
              await addDoc(collection(db, 'hse_incidents'), {
                ...data,
                refNumber: ref,
                siteId: selectedSite?.id || 'central',
                reportedBy: user?.nameAr || 'مستخدم غير معروف',
                status: 'active',
                createdAt: serverTimestamp()
              });
              await logActivity(`تم تسجيل بلاغ ${data.type === 'injury' ? 'إصابة عمل' : 'حادث'}: ${data.description.substring(0, 30)}...`, 'الحوادث والمخالفات', data.severity === 'critical' ? 'critical' : 'normal');
              setShowIncidentForm(false);
            } catch (error) {
              console.error(error);
              alert('حدث خطأ أثناء حفظ البلاغ.');
            }
          }}
        />
      )}

      {/* Audit Modal */}
      {showAuditForm && (
        <AuditFormModal 
          onClose={() => setShowAuditForm(false)} 
          projects={projects}
          user={user}
          onSuccess={async (data) => {
            try {
              const ref = generateRefNumber();
              await addDoc(collection(db, 'hse_audits'), {
                ...data,
                refNumber: ref,
                siteId: selectedSite?.id || 'central',
                inspector: user?.nameAr || 'مستخدم غير معروف',
                createdAt: serverTimestamp()
              });
              await logActivity(`تم إدراج تقرير تفتيش (تقييم ${data.score}%)`, 'التفتيش والتدقيق');
              setShowAuditForm(false);
            } catch (error) {
              console.error(error);
              alert('حدث خطأ أثناء حفظ التقرير.');
            }
          }}
        />
      )}
    </div>
  );
}

// Modals
function IncidentFormModal({ onClose, projects, onSuccess }: { onClose: () => void, projects: Project[], user: UserItem | null, onSuccess: (data: any) => void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [type, setType] = useState('injury');
  const [severity, setSeverity] = useState('low');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-900">تسجيل بلاغ حادث / مخالفة</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">المشروع</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الحادث</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">نوع البلاغ</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none">
                <option value="injury">إصابة عمل</option>
                <option value="near_miss">حادث وشيك (Near Miss)</option>
                <option value="property_damage">تلف ممتلكات</option>
                <option value="environmental">مخالفة بيئية</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">مستوى الخطورة</label>
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none">
              <option value="low">منخفض</option>
              <option value="medium">متوسط</option>
              <option value="high">عالي</option>
              <option value="critical">حرج (جسيم)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">الوصف التفصيلي</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none" placeholder="اشرح تفاصيل ما حدث..."></textarea>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">إلغاء</button>
          <button 
            onClick={() => onSuccess({ projectId, type, severity, description, date })}
            disabled={!description.trim() || !projectId}
            className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
          >
            حفظ البلاغ
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditFormModal({ onClose, projects, onSuccess }: { onClose: () => void, projects: Project[], user: UserItem | null, onSuccess: (data: any) => void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [type, setType] = useState('ppe');
  const [score, setScore] = useState<number>(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const status = score >= 80 ? 'passed' : score >= 50 ? 'needs_action' : 'failed';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-900">تسجيل جولة تفتيش</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">المشروع</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الجولة</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">نوع التفتيش</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none">
                <option value="ppe">مهمات وقاية (PPE)</option>
                <option value="fire_extinguisher">طفايات الحريق</option>
                <option value="equipment">معدات وآليات</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">درجة التقييم (%)</label>
            <input type="number" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-purple-500 outline-none" />
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">النتيجة التلقائية:</span>
            <span className={`px-3 py-1 rounded-lg text-xs font-black ${
              status === 'passed' ? 'bg-emerald-100 text-emerald-700' : 
              status === 'failed' ? 'bg-red-100 text-red-700' : 
              'bg-orange-100 text-orange-700'
            }`}>
              {status === 'passed' ? 'مجتاز' : status === 'failed' ? 'راسب' : 'بحاجة لإجراء تصحيحي'}
            </span>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">إلغاء</button>
          <button 
            onClick={() => onSuccess({ projectId, type, score, date, status })}
            disabled={!projectId}
            className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
          >
            حفظ التقرير
          </button>
        </div>
      </div>
    </div>
  );
}
