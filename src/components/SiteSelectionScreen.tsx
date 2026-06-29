import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Plus, ArrowRight, Loader2, Sparkles, FolderPlus, Compass, 
  Edit, Trash2, Wifi, WifiOff, Database, AlertTriangle, UserCheck, Shield, 
  ChevronLeft, Layers, Landmark, Briefcase, Download, Search, Calendar, 
  CheckCircle2, Users, ChevronRight, Eye, Settings, Printer, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BunyanLogo from './BunyanLogo';

interface Site {
  id: string;
  nameAr: string;
  location: string;
  description: string;
  tenantId?: string;
  projects?: any[];
}

interface SiteSelectionScreenProps {
  user: { username: string; nameAr: string; role: string; tenantId?: string; assignedProjects?: string[] } | null;
  onSiteSelected: (site: Site) => void;
  onLogout: () => void;
  dbConnected?: boolean | null;
  dbLatency?: number;
  forceOfflineBypass?: boolean;
  onToggleOfflineBypass?: () => void;
}

export default function SiteSelectionScreen({ 
  user, 
  onSiteSelected, 
  onLogout, 
  dbConnected, 
  dbLatency, 
  forceOfflineBypass, 
  onToggleOfflineBypass 
}: SiteSelectionScreenProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Hierarchy Navigation States
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>(
    user?.username.toLowerCase() === 'moataz' ? 'hierarchy' : 'grid'
  );
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [selectedAdminUsername, setSelectedAdminUsername] = useState<string>(user?.tenantId || user?.username.toLowerCase() || 'moataz');
  const [selectedSiteIdForHierarchy, setSelectedSiteIdForHierarchy] = useState<string>('');
  
  // Hierarchy search and filter states
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');

  // Form State
  const [newSiteId, setNewSiteId] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLoc, setNewSiteLoc] = useState('');
  const [newSiteDesc, setNewSiteDesc] = useState('');
  const [newSiteTenantId, setNewSiteTenantId] = useState(user?.tenantId || user?.username.toLowerCase() || 'moataz');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState('');

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePayload, setRestorePayload] = useState<any>(null);
  const [restoreSiteId, setRestoreSiteId] = useState('');
  const [restoreSiteName, setRestoreSiteName] = useState('');
  const [restoreSiteDesc, setRestoreSiteDesc] = useState('');
  const [restoreSiteLoc, setRestoreSiteLoc] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Add Admin Modal states (Program Director ONLY)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminNameAr, setAdminNameAr] = useState('');
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // DB Reorganization Dashboard States (Program Director ONLY)
  const [showReorgControlCenter, setShowReorgControlCenter] = useState(false);
  const [reorgStatus, setReorgStatus] = useState<any>(null);
  const [isLoadingReorg, setIsLoadingReorg] = useState(false);
  const [transferSiteId, setTransferSiteId] = useState('');
  const [transferAdmin, setTransferAdmin] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Site Deletion Confirmation Modal States
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleteCaptcha, setDeleteCaptcha] = useState('');
  const [deleteCaptchaInput, setDeleteCaptchaInput] = useState('');
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
  const [isDeletingSite, setIsDeletingSite] = useState(false);

  // Redesigned Hierarchy & Linking Explorer Inline States
  const [showAddProjectInline, setShowAddProjectInline] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newProjectAssignmentNo, setNewProjectAssignmentNo] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectHandoverDate, setNewProjectHandoverDate] = useState('');
  const [isSavingProjectInline, setIsSavingProjectInline] = useState(false);
  const [isReassigningManager, setIsReassigningManager] = useState<string | null>(null); // siteId currently being re-assigned

  const generateCaptcha = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Utility to generate the next sequential site ID automatically
  const generateNextSiteId = (existingSites: Site[]) => {
    if (!existingSites || existingSites.length === 0) {
      return 'site-101';
    }
    let maxNum = 0;
    let prefix = 'site-';
    
    existingSites.forEach(s => {
      const id = s.id || '';
      // Matches strings like "site-101" or pure "101"
      const match = id.match(/^(.*?)(-?\d+)$/);
      if (match) {
        const p = match[1];
        const n = parseInt(match[2].replace('-', ''), 10);
        if (!isNaN(n)) {
          if (n > maxNum) {
            maxNum = n;
            prefix = p || 'site-';
          }
        }
      } else {
        // Fallback search for pure digits anywhere
        const numOnlyMatch = id.match(/\d+/g);
        if (numOnlyMatch) {
          const lastNum = parseInt(numOnlyMatch[numOnlyMatch.length - 1], 10);
          if (!isNaN(lastNum) && lastNum > maxNum) {
            maxNum = lastNum;
          }
        }
      }
    });

    if (maxNum > 0) {
      // Ensure we keep the trailing sequential dash cleanly
      const cleanPrefix = prefix.endsWith('-') ? prefix : `${prefix}-`;
      return `${cleanPrefix}${maxNum + 1}`;
    }
    
    // Default fallback pattern based on list size
    return `site-${101 + existingSites.length}`;
  };

  const fetchReorgStatus = async () => {
    setIsLoadingReorg(true);
    try {
      const response = await fetch('/api/database/reorg-status');
      const data = await response.json();
      if (response.ok) {
        setReorgStatus(data.data || data);
      } else {
        console.error("[DEBUG] Reorg status fetch error:", data);
        setErrorMsg(data.error || 'فشل جلب ملف معالجة البيانات.');
      }
    } catch (e) {
      console.error("[DEBUG] Reorg status network error:", e);
      setErrorMsg('خطأ في شبكة الاتصال لتحليل هيكلة قاعدة البيانات.');
    } finally {
      setIsLoadingReorg(false);
    }
  };

  const handleExecuteReorg = async () => {
    setIsLoadingReorg(true);
    try {
      const res = await fetch('/api/database/reorg-execute', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`بنجاح تام! تم ترتيب وتوجيه البيانات السحابية.\nعدد الحسابات القديمة المحذوفة: ${data.deletedUsersCount}\nعدد مواقع العمل التي تم إصلاحها وتعميمها: ${data.alignedSitesCount}`);
        await fetchSitesAndAdmins();
        await fetchReorgStatus();
      } else {
        console.error("[DEBUG] Execute reorg error:", data);
        setErrorMsg(data.error || 'فشلت عملية إعادة الترتيب.');
      }
    } catch (e) {
      console.error("[DEBUG] Execute reorg network error:", e);
      setErrorMsg('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsLoadingReorg(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSiteId || !transferAdmin) {
      setErrorMsg('فضلاً، يرجى اختيار موقع عمل والمدير المستهدف لنقل الملكية.');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch('/api/database/transfer-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: transferSiteId, targetAdmin: transferAdmin })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('تم نقل المشروع ومواقع العمل بنجاح تام إلى مدير النظام المحدد!');
        setTransferSiteId('');
        await fetchSitesAndAdmins();
        await fetchReorgStatus();
      } else {
        console.error("[DEBUG] Transfer site error:", data);
        setErrorMsg(data.error || 'فشل نقل ملكية الموقع.');
      }
    } catch (e) {
      console.error("[DEBUG] Transfer site network error:", e);
      setErrorMsg('خطأ في الاتصال أثناء نقل ملكية الموقع.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminNameAr.trim() || (!isEditingAdmin && !adminPassword.trim())) {
      setErrorMsg('فضلاً، يرجى ملء كافة الحقول الأساسية لمدير النظام الجديد.');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim().toLowerCase(),
          password: adminPassword.trim() || undefined,
          nameAr: adminNameAr.trim(),
          role: 'admin',
          permissions: {
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
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية حفظ بيانات مدير النظام.');
      }

      setAdminUsername('');
      setAdminPassword('');
      setAdminNameAr('');
      setIsEditingAdmin(false);
      setShowAddAdminModal(false);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ بيانات مدير النظام.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupDoc = JSON.parse(event.target?.result as string);
        if (!backupDoc || typeof backupDoc !== 'object') {
          setErrorMsg('ملف البيانات غير صالح الاستيراد.');
          setRestoreFile(null);
          return;
        }
        
        let siteId = backupDoc.siteId || backupDoc.id || '';
        let siteName = backupDoc.siteName || backupDoc.nameAr || '';
        let payload = backupDoc.payload || backupDoc;
        let siteLoc = backupDoc.location || 'غير محدد';
        let siteDesc = backupDoc.description || 'موقع مستورد من نسخة احتياطية';
        
        setRestorePayload(payload);
        setRestoreSiteId(siteId);
        setRestoreSiteName(siteName);
        setRestoreSiteLoc(siteLoc);
        setRestoreSiteDesc(siteDesc);
      } catch (err: any) {
        setErrorMsg('حدث خطأ في قراءة ملف النسخ الاحتياطي: ' + err.message);
        setRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorePayload) {
      setErrorMsg('يرجى اختيار ملف صحيح للمتابعة.');
      return;
    }
    if (!restoreSiteId.trim() || !restoreSiteName.trim()) {
      setErrorMsg('يرجى تعبئة رمز واسم الموقع.');
      return;
    }
    
    setIsRestoring(true);
    try {
      const cleanSiteId = restoreSiteId.trim().toLowerCase().replace(/\s+/g, '-');
      const siteExists = sites.some(s => s.id === cleanSiteId);
      if (!siteExists) {
        const createRes = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cleanSiteId,
            nameAr: restoreSiteName.trim(),
            location: restoreSiteLoc.trim(),
            description: restoreSiteDesc.trim(),
            tenantId: user?.tenantId || (user?.username || '').toLowerCase().trim() || 'moataz'
          })
        });
        if (!createRes.ok) throw new Error('فشل تسجيل موقع العمل الجديد على السيرفر.');
      }
      
      const cleanPayload = JSON.parse(JSON.stringify(restorePayload));
      const saveRes = await fetch(`/api/site/${cleanSiteId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cleanPayload })
      });
      
      if (!saveRes.ok) throw new Error('فشل حفظ بيانات الموقع المستورد على السيرفر.');
      
      setSuccessMsg(`تم استيراد بيانات موقع "${restoreSiteName}" بنجاح!`);
      await fetchSitesAndAdmins();
      setShowRestoreModal(false);
      setRestoreFile(null);
      setRestorePayload(null);
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء الاستيراد: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleEditAdminClick = (adm: any) => {
    setAdminUsername(adm.username);
    setAdminPassword('');
    setAdminNameAr(adm.nameAr);
    setIsEditingAdmin(true);
    setShowAddAdminModal(true);
  };

  const handleDeleteAdmin = async (usernameToDelete: string) => {
    try {
      const response = await fetch(`/api/users/${usernameToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchSitesAndAdmins();
        if (selectedAdminUsername === usernameToDelete.toLowerCase()) {
          setSelectedAdminUsername('moataz');
        }
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'فشل حذف مدير النظام.');
      }
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم لحذف مدير النظام.');
    }
  };

  const fetchSitesAndAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      if (response.ok) {
        setSites(data);
        
        const currentTenantId = user?.tenantId || user?.username.toLowerCase() || 'moataz';
        const initialAdmin = currentTenantId;
        setSelectedAdminUsername(initialAdmin);

        const activeSitesOpt = data.filter((s: any) => (s.tenantId || 'moataz') === initialAdmin);
        if (activeSitesOpt.length > 0) {
          setSelectedSiteIdForHierarchy(activeSitesOpt[0].id);
        } else if (data.length > 0) {
          setSelectedSiteIdForHierarchy(data[0].id);
        }
      } else {
        throw new Error(data.error || 'فشل جلب مواقع العمل الإنزلاقية.');
      }

      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const admins = usersData.filter((u: any) => u.role === 'admin' && u.username.toLowerCase() !== 'moataz');
        setAdminsList(admins);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في جلب مواقع العمل ومدراء النظام.');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-assign manager of a site
  const handleReassignSiteManager = async (siteId: string, newManager: string) => {
    const siteToReassign = sites.find(s => s.id === siteId);
    if (!siteToReassign) return;

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: siteToReassign.nameAr,
          location: siteToReassign.location,
          description: siteToReassign.description || '',
          tenantId: newManager
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل تحديث تبعية موقع العمل.');
      }

      // Generate a unique reference number
      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

      // Post audit log
      await fetch('/api/users/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'moataz',
          actionAr: `إعادة هيكلة تبعية موقع العمل`,
          type: 'site',
          detailsAr: `تم نقل تبعية موقع العمل "${siteToReassign.nameAr}" (كود: ${siteId}) إلى مدير الفرع "${newManager}". (الرقم المرجعي: ${refNo})`
        })
      }).catch(console.error);

      setSuccessMsg(`تم إعادة هيكلة تبعية موقع العمل "${siteToReassign.nameAr}" بنجاح! رقم العملية: ${refNo}`);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء نقل تبعية موقع العمل.');
    }
  };

  // Link a project to selected site
  const handleLinkProjectInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteIdForHierarchy) {
      setErrorMsg('فضلاً، يرجى تحديد موقع العمل أولاً للربط.');
      return;
    }
    if (!newProjectId.trim() || !newProjectName.trim()) {
      setErrorMsg('فضلاً، يرجى ملء حقول كود واسم المشروع.');
      return;
    }

    setIsSavingProjectInline(true);
    try {
      const activeSite = sites.find(s => s.id === selectedSiteIdForHierarchy);
      if (!activeSite) throw new Error('موقع العمل المحدد غير موجود.');

      const existingProjects = activeSite.projects || [];
      const cleanProjId = newProjectId.trim().toLowerCase().replace(/\s+/g, '-');
      if (existingProjects.some((p: any) => p.id === cleanProjId)) {
        throw new Error('رمز المشروع مكرر ومسجل بالفعل في هذا الموقع.');
      }

      const newProjectObj = {
        id: cleanProjId,
        name: newProjectName.trim(),
        assignmentNumber: newProjectAssignmentNo.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        assignmentDate: newProjectStartDate.trim() || new Date().toISOString().split('T')[0],
        handoverDate: newProjectHandoverDate.trim() || '',
        status: 'نشط'
      };

      const updatedProjects = [...existingProjects, newProjectObj];

      const saveRes = await fetch(`/api/site/${selectedSiteIdForHierarchy}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { projects: updatedProjects } })
      });

      if (!saveRes.ok) {
        throw new Error('فشل تسجيل وحفظ المشروع في قاعدة البيانات.');
      }

      // Unique reference number for audit trail
      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

      // Post audit log
      await fetch('/api/users/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'moataz',
          actionAr: `ربط مشروع جديد بموقع العمل`,
          type: 'site',
          detailsAr: `تم تأسيس وربط مشروع جديد باسم "${newProjectName.trim()}" (كود: ${cleanProjId}) بموقع العمل "${activeSite.nameAr}". (الرقم المرجعي: ${refNo})`
        })
      }).catch(console.error);

      setSuccessMsg(`تم تأسيس وربط المشروع بنجاح! الرقم المرجعي: ${refNo}`);
      setShowAddProjectInline(false);
      setNewProjectId('');
      setNewProjectName('');
      setNewProjectAssignmentNo('');
      setNewProjectStartDate('');
      setNewProjectHandoverDate('');
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في معالجة ربط المشروع.');
    } finally {
      setIsSavingProjectInline(false);
    }
  };

  // Unlink/Delete a project from selected site
  const handleUnlinkProjectInline = async (projectId: string) => {
    if (!selectedSiteIdForHierarchy) return;

    try {
      const activeSite = sites.find(s => s.id === selectedSiteIdForHierarchy);
      if (!activeSite) throw new Error('موقع العمل المحدد غير موجود.');

      const existingProjects = activeSite.projects || [];
      const projectToUnlink = existingProjects.find((p: any) => p.id === projectId);
      if (!projectToUnlink) return;

      const updatedProjects = existingProjects.filter((p: any) => p.id !== projectId);

      const saveRes = await fetch(`/api/site/${selectedSiteIdForHierarchy}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { projects: updatedProjects } })
      });

      if (!saveRes.ok) {
        throw new Error('فشل شطب وحفظ التحديث في قاعدة البيانات.');
      }

      // Unique reference number for audit trail
      const refNo = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

      // Post audit log
      await fetch('/api/users/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'moataz',
          actionAr: `فك ربط مشروع من موقع العمل`,
          type: 'site',
          detailsAr: `تم شطب وفك ربط مشروع "${projectToUnlink.name}" (كود: ${projectId}) من موقع العمل "${activeSite.nameAr}". (الرقم المرجعي: ${refNo})`
        })
      }).catch(console.error);

      setSuccessMsg(`تم فك ربط المشروع وإزالته بنجاح! الرقم المرجعي: ${refNo}`);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في معالجة شطب المشروع.');
    }
  };

  useEffect(() => {
    fetchSitesAndAdmins();
  }, []);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteId.trim() || !newSiteName.trim() || !newSiteLoc.trim()) {
      setErrorMsg('فضلاً، يرجى ملء كافة الحقول الأساسية.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/sites/${editingSiteId}` : '/api/sites';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newSiteId.trim().toLowerCase().replace(/\s+/g, '-'),
          nameAr: newSiteName.trim(),
          location: newSiteLoc.trim(),
          description: newSiteDesc.trim(),
          tenantId: user?.username.toLowerCase() === 'moataz' ? newSiteTenantId : (user?.tenantId || 'moataz')
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية حفظ موقع العمل.');
      }

      setNewSiteId('');
      setNewSiteName('');
      setNewSiteLoc('');
      setNewSiteDesc('');
      setNewSiteTenantId('moataz');
      setIsEditMode(false);
      setEditingSiteId('');
      setShowAddSiteModal(false);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم لحفظ الموقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (site: Site) => {
    if (dbConnected === false) {
      setErrorMsg('عذراً، تم تعطيل تعديل السجلات مؤقتاً لعدم وجود اتصال نشط بقاعدة البيانات السحابية.');
      return;
    }
    setIsEditMode(true);
    setEditingSiteId(site.id);
    setNewSiteId(site.id);
    setNewSiteName(site.nameAr);
    setNewSiteLoc(site.location);
    setNewSiteDesc(site.description || '');
    setNewSiteTenantId(site.tenantId || 'moataz');
    setShowAddSiteModal(true);
  };

  const handleDeleteClick = (site: Site) => {
    if (user?.role !== 'admin') {
      setErrorMsg('عذراً! إجراء حذف مواقع العمل مقتصر كلياً على صلاحيات مدير النظام الرئيسي فقط.');
      return;
    }
    setSiteToDelete(site);
    const code = generateCaptcha();
    setDeleteCaptcha(code);
    setDeleteCaptchaInput('');
    setDeleteAdminPassword('');
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteToDelete) return;

    if (deleteCaptchaInput.trim() !== deleteCaptcha) {
      setErrorMsg('رمز التحقق كابتشر غير صحيح. يرجى كتابة الرموز الأربعة المتطابقة وإعادة المحاولة.');
      return;
    }

    if (!deleteAdminPassword.trim()) {
      setErrorMsg('فضلاً، يرجى كتابة رمز مرور مدير النظام لتخويل الحذف السحابي للمشروع.');
      return;
    }

    setIsDeletingSite(true);
    try {
      const response = await fetch(`/api/sites/${siteToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminUsername: user?.username || 'moataz',
          adminPassword: deleteAdminPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'عذراً! فشل التحقق السحابي لحساب مدير النظام أو رمز المرور غير سليم.');
      }
      setSuccessMsg(`تم بنجاح تام شطب وإزالة موقع العمل "${siteToDelete.nameAr}" نهائياً من قاعدة البيانات.`);
      setShowDeleteConfirmModal(false);
      setSiteToDelete(null);
      await fetchSitesAndAdmins();
    } catch (err: any) {
      console.error('Delete site connection/auth error', err);
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء التصديق وحذف موقع العمل.');
    } finally {
      setIsDeletingSite(false);
    }
  };

  const filteredSites = sites.filter(site => {
    if (user?.role === 'admin' || user?.role === 'projects_manager') return true;
    if (user?.assignedProjects && user.assignedProjects.length > 0) {
      return user.assignedProjects.includes(site.id);
    }
    return true;
  });

  // Get localized user's initials for avatars (e.g. "م ع" for محمد عاصم)
  const getAvatarInitials = (name: string) => {
    if (!name) return 'م';
    const clean = name.replace(/\(.*\)/g, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).substring(0, 2);
    }
    return parts[0].substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-right text-slate-800 flex flex-col p-4 md:p-8 relative overflow-hidden font-sans" dir="rtl">
      
      {/* Soft dynamic ambient highlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-sky-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-10 w-80 h-80 bg-gradient-to-br from-amber-500/5 to-rose-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-gradient-to-tr from-emerald-500/5 to-teal-400/80 rounded-full blur-3xl opacity-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a04_1px,transparent_1px),linear-gradient(to_bottom,#0f172a04_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Main Header / Command Bar */}
      <header className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-5 z-10 text-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white border border-slate-200/60 rounded-3xl flex items-center justify-center p-4 shadow-md hover:shadow-lg transition duration-500 relative group overflow-hidden">
            {/* Glowing backdrop layer inside the container */}
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <BunyanLogo 
              className="w-16 h-16 relative z-10" 
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto">
          {/* Cloud DB Connection Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-sans shadow-sm">
            <Database size={13} className="text-slate-400" />
            <span className="text-slate-500 font-bold hidden sm:inline">الحالة السحابية:</span>
            {dbConnected === null ? (
              <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                جاري الفحص...
              </span>
            ) : dbConnected ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi size={12} className="text-emerald-500 animate-pulse" />
                <span>متصلة وآمنة</span>
              </span>
            ) : (
              <button 
                onClick={onToggleOfflineBypass}
                type="button"
                className="text-rose-600 hover:text-rose-500 font-bold flex items-center gap-1 cursor-pointer transition border-none bg-transparent p-0"
              >
                <WifiOff size={12} className="text-rose-500" />
                <span>عمل محلي (اضغط للربط)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-700 font-black text-xs">
              {getAvatarInitials(user?.nameAr || 'مدير')}
            </div>
            <div className="text-right leading-none hidden sm:block">
              <p className="text-xs font-black text-slate-800">{user?.nameAr?.replace(/\s*\(?مدير التكاليف\)?/g, '')}</p>
              <span className="text-[9px] font-bold text-indigo-600 block mt-0.5">
                {user?.role === 'admin' ? 'مدير عام البرنامج (سطح الرقابة الموحد)' : 'أخصائي بيانات مالي فني'}
              </span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            خروج
          </button>
        </div>
      </header>

      {/* Main Container Dashboard Board */}
      <main className="max-w-7xl w-full mx-auto flex-1 flex flex-col justify-center z-10">
        
        {/* Upper Title Section */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Briefcase size={22} />
              </div>
              مقر ومستكشف مواقع العمل المعتمدة
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-3xl">
              يرجى اختيار أحد المقار أو مواقع العمل أدناه لبدء استعراض الكشوف السولار واليوميات والعهد المالية ومقايسات البنود المباشرة.
            </p>
          </div>

          {/* View Mode Switching Controls */}
          {user?.username.toLowerCase() === 'moataz' && (
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start border border-slate-200 shadow-inner">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'hierarchy' 
                    ? 'bg-white shadow-md text-indigo-700 border border-slate-200/50' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <Compass size={14} />
                <span>الهيكل الهرمي والمشرفين</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-md text-indigo-700 border border-slate-200/50' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <Building size={14} />
                <span>شبكة المواقع التقليدية</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Warnings / Messages */}
        <AnimatePresence mode="popLayout">
          {errorMsg && (
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="p-3.5 mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl max-w-2xl flex items-center gap-2"
            >
              <AlertTriangle size={15} className="text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="p-3.5 mb-5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-2xl max-w-2xl flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 animate-bounce" />
              <span className="whitespace-pre-line">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Master Site and Backup Trigger Section */}
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-2.5 mb-6">
            {dbConnected === false ? (
              <div className="flex items-center gap-3 p-3.5 bg-rose-50/75 border border-rose-150 rounded-2xl w-full">
                <AlertTriangle className="text-rose-600 shrink-0 animate-pulse" size={18} />
                <div className="text-right">
                  <p className="font-extrabold text-xs text-rose-700">وضع العمل بدون اتصال نشط</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                    تم إيقاف إضافة أو تعديل الهياكل التنظيمية أو الفروع مؤقتاً لحماية الاتساق السحابي لحين إعادة الاتصال.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full flex-wrap gap-3 p-2 bg-white border border-slate-200/85 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingSiteId('');
                      const nextCodeSuggested = generateNextSiteId(sites);
                      setNewSiteId(nextCodeSuggested);
                      setNewSiteName('');
                      setNewSiteLoc('');
                      setNewSiteDesc('');
                      setNewSiteTenantId(user?.tenantId || (user?.username || '').toLowerCase().trim() || 'moataz');
                      setShowAddSiteModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>تأسيس موقع عمل جديد +</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(true)}
                    className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>استعادة ملف احتياطي</span>
                  </button>
                </div>

                {/* Database Health Badge */}
                <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] bg-slate-50 px-3 py-1.5 border rounded-xl font-bold text-slate-500">
                  <span>إجمالي المواقع المسجلة بالفروع: {sites.length} موقع عمل</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE SCREEN */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-slate-150-rounded-3xl shadow-sm rounded-3xl relative z-10">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
            <div className="text-center space-y-1">
              <p className="text-xs font-black text-slate-700 animate-pulse">جاري جلب ومواءمة الهياكل التنظيمية...</p>
              <p className="text-[10px] text-slate-400 font-semibold">بنيان تقوم بالربط وتأمين قنوات التشفير السحابية الفيدرالية</p>
            </div>
          </div>
        ) : viewMode === 'hierarchy' ? (
          
          /* LEVEL REDESIGN: PREMIUM 4-COLUMN HIERARCHY TREE EXPLORER */
          <div className="w-full relative z-10 space-y-6 font-sans text-right" dir="rtl" id="print-section-hierarchy">
            {/* Custom Print Styles for Independent Table Printing */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  background: white !important;
                  color: #000 !important;
                }
                #bunyan-sidebar, .no-print, header, footer, .modal, button, select, input {
                  display: none !important;
                }
                #print-section-hierarchy {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  position: absolute !important;
                  right: 0 !important;
                  top: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: transparent !important;
                }
                .print-card-container {
                  grid-template-cols: 1fr !important;
                  display: block !important;
                }
                .print-full-width {
                  width: 100% !important;
                  display: block !important;
                  margin-bottom: 2rem !important;
                }
                .print-table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }
                .print-table th, .print-table td {
                  border: 1px solid #1e293b !important;
                  padding: 8px !important;
                  text-align: right !important;
                }
                .print-header-title {
                  font-size: 18px !important;
                  font-weight: bold !important;
                  text-align: center !important;
                  margin-bottom: 20px !important;
                  border-bottom: 2px solid #000 !important;
                  padding-bottom: 10px !important;
                }
              }
            ` }} />

            {/* Visual Header Info */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm no-print">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-600/15 shrink-0">
                  <Compass size={22} className="text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 leading-none">
                    <Layers className="text-purple-600" size={18} />
                    مستكشف الهياكل الهرمية والربط والتحكم بالمشاريع
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-semibold leading-relaxed">
                    منصة التحكم الفيدرالية لإعادة هيكلة الفروع وتفويض الصلاحيات، وربط المشاريع الإنشائية بمواقع العمل وسجل النشاط الموثق.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 font-mono text-xs bg-purple-50 border border-purple-100 px-3.5 py-2 rounded-xl text-purple-700 font-bold shadow-xs">
                  <span>المسؤولين النشطين: {adminsList.length + 1}</span>
                  <span className="text-purple-200">/</span>
                  <span>المواقع: {sites.length}</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  title="طباعة الهيكل كاملاً"
                >
                  <Printer size={14} />
                  <span>طباعة التقارير الهيكلية</span>
                </button>
              </div>
            </div>

            {/* Print Header ONLY visible when printing */}
            <div className="hidden print:block print-header-title">
              <h1 className="text-center text-xl font-bold">بنيان - التقرير الفيدرالي لمواقع العمل الإنشائية وهياكل الربط الهرمية</h1>
              <p className="text-center text-xs text-slate-500 mt-1">تاريخ طباعة التقرير: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}</p>
            </div>

            {/* Core Interactive Hierarchy Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-200 rounded-3xl p-4 md:p-5 shadow-xs min-h-[620px] relative overflow-hidden print-card-container">
              
              {/* LEVEL 1: SUPER-ADMIN / GENERAL DIRECTOR */}
              <div className="flex flex-col bg-white p-4 rounded-2xl border border-slate-200 text-right space-y-4 shadow-sm print-full-width">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center font-mono">١</span>
                    <span className="text-xs font-extrabold text-slate-900">مدير عام البرنامج</span>
                  </div>
                  <span className="text-[9px] bg-purple-50 border border-purple-150 text-purple-700 px-2 py-0.5 rounded-full font-bold">صلاحية مطلقة</span>
                </div>

                <div className="bg-slate-950 p-4.5 rounded-2xl text-white shadow-xl border border-slate-800 flex-1 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-600/15 rounded-full blur-2xl group-hover:bg-purple-600/25 transition-all duration-500" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-purple-400 border border-white/25 shadow-inner">
                        <Landmark size={20} />
                      </div>
                      <div className="leading-tight">
                        <h4 className="text-sm font-black tracking-wide text-white">{user?.nameAr || 'م. معتز يونس'}</h4>
                        <p className="text-[10px] text-purple-300 font-bold mt-1">المطور والمدير العام التنفيذي للبرنامج</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/10 text-[11px] text-slate-300">
                      <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg">
                        <span>قناة الربط:</span>
                        <span className="font-mono font-bold text-white text-xs">سحابة فيدرالية</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg">
                        <span>أمان البيانات:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          مؤمن بالكامل
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg">
                        <span>الفروع التابعة:</span>
                        <span className="font-mono font-bold text-white">{adminsList.length} فروع</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 no-print">
                    <button
                      onClick={() => {
                        setSelectedAdminUsername('moataz');
                        setSuccessMsg('تم اختيار الإدارة العليا كمحور البحث الحالي');
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
                        selectedAdminUsername === 'moataz' 
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20' 
                          : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      <UserCheck size={13} />
                      <span>اختيار الإدارة العليا</span>
                    </button>
                  </div>
                </div>
              </div>


              {/* LEVEL 2: BRANCH MANAGERS */}
              <div className="flex flex-col bg-white p-4 rounded-2xl border border-slate-200 text-right space-y-3.5 shadow-sm print-full-width">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٢</span>
                    <span className="text-xs font-extrabold text-slate-900">مدراء قطاعات الفروع</span>
                  </div>
                  {user?.username.toLowerCase() === 'moataz' && (
                    <button
                      onClick={() => {
                        setIsEditingAdmin(false);
                        setAdminUsername('');
                        setAdminPassword('');
                        setAdminNameAr('');
                        setShowAddAdminModal(true);
                      }}
                      className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="تسجيل مسؤول فرع جديد"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative no-print">
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="ابحث عن مدير فرع..."
                    className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white text-right font-medium"
                  />
                  <Search size={13} className="absolute right-2.5 top-2.5 text-slate-400" />
                </div>

                {/* Managers List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] pr-0.5">
                  {/* Root Admin Option */}
                  <div 
                    onClick={() => {
                      setSelectedAdminUsername('moataz');
                      const defaultAdminSites = sites.filter((s: any) => (s.tenantId || 'moataz') === 'moataz');
                      if (defaultAdminSites.length > 0) {
                        setSelectedSiteIdForHierarchy(defaultAdminSites[0].id);
                      } else {
                        setSelectedSiteIdForHierarchy('');
                      }
                    }}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      selectedAdminUsername === 'moataz'
                        ? 'bg-purple-50 border-purple-300 shadow-xs'
                        : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-xs font-black text-slate-900">م. معتز يونس (الإدارة)</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">المدير العام والمنسق الفيدرالي</p>
                      </div>
                      <span className="text-[9px] bg-slate-900 text-white font-black px-2 py-0.5 rounded font-mono">ROOT</span>
                    </div>
                  </div>

                  {adminsList
                    .filter(a => 
                      (a.nameAr || '').toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                      (a.username || '').toLowerCase().includes(adminSearchQuery.toLowerCase())
                    )
                    .map((adm, idx) => {
                      const adminSites = sites.filter(s => (s.tenantId || 'moataz') === adm.username.toLowerCase());
                      const isSelected = selectedAdminUsername === adm.username.toLowerCase();
                      
                      return (
                        <div 
                          key={adm.username || idx}
                          onClick={() => {
                            setSelectedAdminUsername(adm.username.toLowerCase());
                            const adminSites = sites.filter((s: any) => (s.tenantId || 'moataz') === adm.username.toLowerCase());
                            if (adminSites.length > 0) {
                              setSelectedSiteIdForHierarchy(adminSites[0].id);
                            } else {
                              setSelectedSiteIdForHierarchy('');
                            }
                          }}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer relative group/admin ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-slate-950 group-hover:text-purple-700 transition">
                                {adm.nameAr}
                              </h5>
                              <p className="text-[9.5px] text-slate-500 font-mono mt-0.5">@{adm.username}</p>
                            </div>
                            
                            {/* Quick edit/delete controls */}
                            {user?.username.toLowerCase() === 'moataz' && (
                              <div className="flex items-center gap-1 no-print opacity-0 group-hover/admin:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAdminClick(adm);
                                  }}
                                  className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-slate-100 transition"
                                  title="تعديل الحساب"
                                >
                                  <Edit size={11} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`هل أنت متأكد من رغبتك في حذف حساب مدير الفرع "${adm.nameAr}" بشكل نهائي؟`)) {
                                      handleDeleteAdmin(adm.username);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100 transition"
                                  title="حذف الحساب"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex justify-between items-center text-[10px] font-semibold text-slate-500 border-t border-slate-100/70 pt-1.5">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">مدير فرعي</span>
                            <span>المواقع: <strong className="text-purple-600 font-mono">{adminSites.length}</strong></span>
                          </div>
                        </div>
                      );
                    })}

                  {adminsList.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 bg-slate-50/20 rounded-xl p-3">
                      لا يوجد مدراء فروع مسجلين حالياً.
                    </div>
                  )}
                </div>
              </div>


              {/* LEVEL 3: ACTIVE CONSTRUCTION SITES */}
              <div className="flex flex-col bg-white p-4 rounded-2xl border border-slate-200 text-right space-y-3.5 shadow-sm print-full-width">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٣</span>
                    <span className="text-xs font-extrabold text-slate-900">مواقع العمل الإنشائية</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setNewSiteId(generateNextSiteId(sites));
                      setNewSiteName('');
                      setNewSiteLoc('');
                      setNewSiteDesc('');
                      setNewSiteTenantId(selectedAdminUsername);
                      setShowAddSiteModal(true);
                    }}
                    className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    title="تأسيس موقع عمل جديد"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Search Sites */}
                <div className="relative no-print">
                  <input
                    type="text"
                    value={siteSearchQuery}
                    onChange={(e) => setSiteSearchQuery(e.target.value)}
                    placeholder="ابحث عن موقع عمل..."
                    className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white text-right font-medium"
                  />
                  <Search size={13} className="absolute right-2.5 top-2.5 text-slate-400" />
                </div>

                {/* Sites List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] pr-0.5">
                  {sites
                    .filter(s => {
                      const belongsToSelectedAdmin = (s.tenantId || 'moataz') === selectedAdminUsername;
                      const matchesSearch = (s.nameAr || '').toLowerCase().includes(siteSearchQuery.toLowerCase()) ||
                                            (s.id || '').toLowerCase().includes(siteSearchQuery.toLowerCase());
                      return belongsToSelectedAdmin && matchesSearch;
                    })
                    .map((st, idx) => {
                      const isSelected = selectedSiteIdForHierarchy === st.id;
                      const projCount = (st.projects || []).length;
                      
                      return (
                        <div
                          key={st.id || idx}
                          onClick={() => setSelectedSiteIdForHierarchy(st.id)}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                <Building size={12} className={isSelected ? 'text-purple-600' : 'text-slate-400'} />
                                <span>{st.nameAr}</span>
                              </h5>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <MapPin size={9} />
                                <span>{st.location}</span>
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSiteId(st.id);
                                  setNewSiteId(st.id);
                                  setNewSiteName(st.nameAr);
                                  setNewSiteLoc(st.location);
                                  setNewSiteDesc(st.description || '');
                                  setNewSiteTenantId(st.tenantId || 'moataz');
                                  setIsEditMode(true);
                                  setShowAddSiteModal(true);
                                }}
                                className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-slate-100 transition"
                                title="تعديل بيانات الموقع"
                              >
                                <Edit size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSiteToDelete(st);
                                  setDeleteCaptcha(generateCaptcha());
                                  setDeleteCaptchaInput('');
                                  setDeleteAdminPassword('');
                                  setShowDeleteConfirmModal(true);
                                }}
                                className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100 transition"
                                title="حذف وإسقاط الموقع"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Restructuring Dropdown for Tenant/Branch Assignment */}
                          <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 no-print">
                            <span className="text-[9.5px] font-bold text-slate-400">نقل التبعية:</span>
                            <div className="relative">
                              <select
                                value={st.tenantId || 'moataz'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`هل أنت متأكد من نقل ملكية ومسؤولية الموقع الإنشائي "${st.nameAr}" بالكامل؟`)) {
                                    handleReassignSiteManager(st.id, e.target.value);
                                  }
                                }}
                                className="text-[9.5px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded px-1.5 py-1 focus:outline-none cursor-pointer"
                              >
                                <option value="moataz">الإدارة العليا (معتز)</option>
                                {adminsList.map(a => (
                                  <option key={a.username} value={a.username.toLowerCase()}>{a.nameAr}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mt-2.5 flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-100/50 pt-1.5">
                            <span className="font-mono text-slate-500">كود: {st.id}</span>
                            <span className="bg-purple-100/70 text-purple-700 px-2 py-0.5 rounded-full font-black font-mono">
                              {projCount} مشاريع
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {sites.filter(s => (s.tenantId || 'moataz') === selectedAdminUsername).length === 0 && (
                    <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 bg-slate-50/20 rounded-xl p-3">
                      لا يوجد أي مواقع عمل تحت إشراف هذا المدير حالياً.
                    </div>
                  )}
                </div>
              </div>


              {/* LEVEL 4: PROJECTS & CONTRACTUAL LINKING */}
              <div className="flex flex-col bg-white p-4 rounded-2xl border border-slate-200 text-right space-y-3.5 shadow-sm lg:col-span-1 print-full-width">
                {(() => {
                  const activeSite = sites.find(s => s.id === selectedSiteIdForHierarchy);
                  const activeProjects = activeSite?.projects || [];
                  const filteredProjects = activeProjects.filter((p: any) => 
                    (p.name || '').toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                    (p.id || '').toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                    (p.assignmentNumber || '').toLowerCase().includes(projectSearchQuery.toLowerCase())
                  );

                  return (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center font-mono">٤</span>
                          <span className="text-xs font-extrabold text-slate-900">المشاريع والمستندات</span>
                        </div>
                        {activeSite && (
                          <button
                            onClick={() => setShowAddProjectInline(!showAddProjectInline)}
                            className={`p-1 rounded-lg transition ${showAddProjectInline ? 'bg-red-50 text-red-600' : 'text-purple-600 hover:bg-purple-50'}`}
                            title={showAddProjectInline ? "إلغاء الإضافة" : "ربط مشروع جديد"}
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>

                      {/* Display Selected Site Title for Print */}
                      <div className="hidden print:block mb-4 border-b pb-2">
                        <p className="text-xs text-slate-500">موقع العمل المختار:</p>
                        <h3 className="text-base font-bold text-slate-900">{activeSite ? activeSite.nameAr : "غير محدد"}</h3>
                        <p className="text-[10px] text-slate-500">الفرع المسؤول: {adminsList.find(a => a.username.toLowerCase() === activeSite?.tenantId?.toLowerCase())?.nameAr || 'الإدارة العليا'}</p>
                      </div>

                      {activeSite && (
                        <div className="space-y-3 flex flex-col">
                          {/* Active Site Premium Banner */}
                          <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-3.5 shadow-md border border-slate-800 relative overflow-hidden no-print">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-xl" />
                            <div className="space-y-1 relative z-10">
                              <span className="text-[9px] font-black text-purple-400 bg-purple-950 border border-purple-900/50 px-2 py-0.5 rounded-md inline-block">
                                موقع العمل النشط
                              </span>
                              <h4 className="text-xs font-black truncate text-white">{activeSite.nameAr}</h4>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                                <MapPin size={10} className="text-purple-500" />
                                <span className="truncate">{activeSite.location}</span>
                              </p>
                            </div>

                            <button
                              onClick={() => onSiteSelected(activeSite)}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>دخول لوحة السجلات بالكامل</span>
                              <ChevronLeft size={13} />
                            </button>
                          </div>

                          {/* Inline Form to Add & Link Project */}
                          {showAddProjectInline && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-right space-y-2.5 no-print animate-fade-in">
                              <h6 className="text-[11px] font-black text-slate-800">تأسيس وربط مشروع جديد بالموقع</h6>
                              
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500">كود المشروع (إنجليزي فريد):</label>
                                <input
                                  type="text"
                                  required
                                  value={newProjectId}
                                  onChange={(e) => setNewProjectId(e.target.value)}
                                  placeholder="مثال: proj-301"
                                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-semibold"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500">اسم المشروع بالعربي:</label>
                                <input
                                  type="text"
                                  required
                                  value={newProjectName}
                                  onChange={(e) => setNewProjectName(e.target.value)}
                                  placeholder="اسم المشروع الإنشائي..."
                                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-semibold"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500">رقم التكليف / العقد الإداري:</label>
                                <input
                                  type="text"
                                  value={newProjectAssignmentNo}
                                  onChange={(e) => setNewProjectAssignmentNo(e.target.value)}
                                  placeholder="أدخل رقم الإسناد التعاقدي..."
                                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-semibold"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500">تاريخ الإسناد:</label>
                                  <input
                                    type="date"
                                    value={newProjectStartDate}
                                    onChange={(e) => setNewProjectStartDate(e.target.value)}
                                    className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-lg font-semibold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500">تاريخ التسليم:</label>
                                  <input
                                    type="date"
                                    value={newProjectHandoverDate}
                                    onChange={(e) => setNewProjectHandoverDate(e.target.value)}
                                    className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-lg font-semibold"
                                  />
                                </div>
                              </div>

                              <div className="pt-1.5 flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleLinkProjectInline(e);
                                  }}
                                  disabled={isSavingProjectInline}
                                  className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 disabled:opacity-50 transition cursor-pointer"
                                >
                                  {isSavingProjectInline ? "جاري الحفظ..." : "حفظ وربط"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAddProjectInline(false)}
                                  className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-300 transition"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Search Projects */}
                          {!showAddProjectInline && (
                            <div className="relative no-print">
                              <input
                                type="text"
                                value={projectSearchQuery}
                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                                placeholder="ابحث في مشاريع الموقع..."
                                className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white text-right font-medium"
                              />
                              <Search size={13} className="absolute right-2.5 top-2.5 text-slate-400" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Projects View */}
                      <div className="flex-1 overflow-y-auto space-y-2 max-h-[440px] pr-0.5 print:max-h-none print:overflow-visible mt-3">
                        {activeSite ? (
                          filteredProjects.map((p: any, idx) => {
                            const statusColor = 
                              p.status === 'نشط' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                              : p.status === 'مكتمل'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-250';

                            return (
                              <div
                                key={p.id || idx}
                                className="p-3 bg-white border border-slate-200 rounded-xl text-right space-y-2.5 relative group shadow-xs hover:border-purple-300 transition-all print:border-slate-800 print:mb-4"
                              >
                                <div className="flex justify-between items-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-black rounded ${statusColor}`}>
                                    {p.status === 'نشط' ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>نشط</span>
                                      </>
                                    ) : (
                                      <span>{p.status || 'معلق'}</span>
                                    )}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9.5px] font-mono text-slate-400 font-bold">كود: {p.id}</span>
                                    
                                    {/* Quick Unlink Action */}
                                    <button
                                      onClick={() => {
                                        if (confirm(`هل أنت متأكد من فك ارتباط المشروع "${p.name}" (كود: ${p.id}) وإزالته من موقع العمل "${activeSite.nameAr}" بالكامل؟`)) {
                                          handleUnlinkProjectInline(p.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition opacity-0 group-hover:opacity-100 no-print"
                                      title="شطب وفك ارتباط المشروع"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <h6 className="text-xs font-extrabold text-slate-900 leading-snug">{p.name}</h6>
                                  <p className="text-[10px] text-slate-500 font-semibold bg-slate-50 border px-2 py-0.5 rounded flex items-center gap-1 w-max print:bg-transparent">
                                    <span>رقم التكليف:</span>
                                    <span className="font-mono text-slate-800 font-black">{p.assignmentNumber || 'غير كود'}</span>
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={10} className="text-slate-400" />
                                    <span>تاريخ البدء: <strong className="font-mono text-slate-800 font-bold">{p.assignmentDate || 'مستمر'}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={10} className="text-slate-400" />
                                    <span>التسليم: <strong className="font-mono text-slate-800 font-black">{p.handoverDate || 'مستمر'}</strong></span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 bg-slate-50/20 rounded-xl p-4 leading-relaxed">
                            <Compass className="mx-auto text-slate-300 mb-2" size={24} />
                            <p className="font-bold text-slate-600">لم يتم اختيار أي موقع عمل للربط</p>
                            <p className="text-[10px] text-slate-400 mt-1">يرجى الضغط على أحد مواقع العمل الإنشائية في العمود المجاور لعرض مشاريعه وإضافة تكاليفه.</p>
                          </div>
                        )}

                        {activeSite && filteredProjects.length === 0 && (
                          <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 bg-slate-50/20 rounded-xl p-4 leading-relaxed">
                            <p className="font-bold text-slate-600">لا توجد مشاريع مرتبطة بهذا الموقع</p>
                            <p className="text-[10px] text-slate-400 mt-1">يمكنك الضغط على زر (+) في الأعلى لتأسيس وربط أول مشروع إنشائي سحابي بهذا الموقع.</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        ) : (
          
          /* TRADITIONAL BENTO FILTER GRID VIEW (مدراء آخرون أو العرض التقليدي) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {filteredSites.map((site, idx) => (
              <motion.div
                key={site.id || `site_${idx}`}
                whileHover={{ scale: 1.015, y: -2 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSiteSelected(site)}
                className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-indigo-400 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer text-right flex flex-col justify-between min-h-[180px] relative group transition font-sans"
              >
                {/* Modern subtle arrow block */}
                <div className="absolute top-4 left-4 w-8 h-8 bg-slate-50 border border-slate-200/50 group-hover:border-indigo-150 text-slate-400 group-hover:text-indigo-600 rounded-xl flex items-center justify-center shadow-xs transition duration-200">
                  <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building size={15} className="text-indigo-600 shrink-0" />
                    <h3 className="font-extrabold text-slate-900 text-[13px] leading-tight pr-1 truncate max-w-[200px]">{site.nameAr}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-650 font-bold block">
                    <MapPin size={12} className="text-indigo-500 inline shrink-0" />
                    <span>{site.location}</span>
                  </div>
                  
                  <p className="text-[10.5px] text-slate-500 pr-0.5 line-clamp-2 leading-relaxed font-sans">{site.description || 'لم يتم كتابة تفاصيل تشغيلية مميزة لهذا الكود للموقع.'}</p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center z-10">
                  <span className="text-[10px] text-slate-450 font-bold font-mono bg-slate-50 border px-2 py-0.5 rounded-lg">كود: {site.id}</span>
                  
                  {user?.role === 'admin' && (
                    <div className="flex gap-1.5 no-print" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(site);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-amber-700 hover:text-amber-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition shadow-xs"
                      >
                        <Edit size={10} />
                        <span>تعديل</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(site);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition shadow-xs"
                      >
                        <Trash2 size={10} />
                        <span>حذف</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredSites.length === 0 && (
              <div className="col-span-full border border-dashed border-slate-200 bg-white/50 rounded-3xl p-12 text-center text-slate-400">
                <Compass size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-sm text-slate-800">لم يتم العثور على أي مواقع عمل مسجلة</p>
                <p className="text-xs text-slate-500 mt-1">تأكد من تراخيص صلاحيتك أو تواصل مع المشرف العام "معتز يونس".</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer System Credits */}
      <footer className="mt-16 text-center text-[10.5px] text-slate-400 max-w-7xl w-full mx-auto border-t border-slate-250 pt-5 relative z-10 font-sans font-semibold">
        جميع الحقوق محفوظة لنظام بنيان الذكي لإدارة المشروعات والتدقيق الإنشائي © 2026.
      </footer>

      {/* CREATE / EDIT SITE MODAL WITH NEXT SEQUENTIAL CODE AUTOINDICATOR */}
      <AnimatePresence>
        {showAddSiteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-3xl p-6 w-full max-w-md relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <FolderPlus size={20} className="text-indigo-600 shrink-0" />
                <h3 className="font-black text-sm text-slate-900">
                  {isEditMode ? 'تعديل بيانات موقع عمل قيد التشغيل' : 'تأسيس وإنشاء رمز موقع عمل ومشروع جديد'}
                </h3>
              </div>

              <form onSubmit={handleSaveSite} className="space-y-4">
                
                {/* NEW CODE INPUT: DYNAMIC SEQUENTIAL NEXT SITE ID BADGE (اريد عند انشاء موقع جديد ان يعطى له كود تلقائي لرقم الموقع التالى) */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">رمز / كود المشروع (توليد متتالي تلقائي):</label>
                    {!isEditMode && (
                      <span className="text-[9.5px] font-black bg-emerald-500/10 text-emerald-700 border border-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                        <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                        الترتيب التالي التلقائي
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    placeholder="مثال: site-103"
                    value={newSiteId}
                    onChange={(e) => setNewSiteId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                    pattern="[a-zA-Z0-9-]+"
                    title="يرجى استخدام الحروف الإنجليزية والأرقام والشرطات فقط."
                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left ${
                      isEditMode ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-800'
                    }`}
                    dir="ltr"
                  />
                  {!isEditMode && (
                    <p className="text-[9.5px] text-slate-400 leading-normal font-medium">
                      * تم استنتاج تسلسل الكود تلقائياً بناءً على آخر موقع عمل تم إنشاؤه لضمان عدم التداخل. يمكنك تعديله إذا أردت.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">اسم موقع العمل (باللغة العربية):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: موقع كوبري الإسكندرية الفرعي"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">المركز والموقع الجغرافي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: طريق السويس قطاع الهايكستب"
                    value={newSiteLoc}
                    onChange={(e) => setNewSiteLoc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">تفاصيل أو مبررات التخصيص (اختياري):</label>
                  <textarea
                    rows={3}
                    placeholder="أدخل مقتطف تعريفي لمواقع العمل أو البنود الخاصة بمجال الأعمال..."
                    value={newSiteDesc}
                    onChange={(e) => setNewSiteDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-405 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                {/* Branch Administrator Assignment (Only visible for Program Director moataz) */}
                {user?.username.toLowerCase() === 'moataz' && (
                  <div className="space-y-1.5 text-right font-sans">
                    <label className="text-xs font-bold text-slate-700 font-bold">المدير المسؤول عن هذا الموقع (الطبقة الثانية):</label>
                    <select
                      value={newSiteTenantId}
                      onChange={(e) => setNewSiteTenantId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    >
                      <option value="moataz">مدير البرنامج معتز (المكتب العام)</option>
                      {adminsList.map((adm, idx) => (
                        <option key={adm.docId || `${adm.username}_${idx}`} value={adm.username.toLowerCase()}>
                          {adm.nameAr} ({adm.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-3.5 flex gap-2 justify-end text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingSiteId('');
                      setShowAddSiteModal(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition active:scale-95"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري التأسيس والربط السحابي...' : isEditMode ? 'تعديل وحفظ البيانات' : 'حفظ وإنشاء الموقع'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT ACCOUNT ADMIN MODAL */}
      <AnimatePresence>
        {showAddAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Shield size={20} />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {isEditingAdmin ? 'تعديل بيانات مدير نظام الفرع' : 'تأسيس وترقية مدير نظام جديد بالفرع'}
                </h3>
              </div>

              <form onSubmit={handleSaveAdmin} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">اسم مستخدم مدير النظام (إنجليزية وأرقام فقط):</label>
                  <input
                    type="text"
                    required
                    disabled={isEditingAdmin}
                    placeholder="مثال: osama"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left ${
                      isEditingAdmin ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-850'
                    }`}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">الاسم الشخصي والصفة المعتمدة باللغة العربية:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أسامة الشريف"
                    value={adminNameAr}
                    onChange={(e) => setAdminNameAr(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700">
                    {isEditingAdmin ? 'كلمة المرور الجديدة (اترك فارغاً لعدم التغيير):' : 'كلمة مرور الدخول:'}
                  </label>
                  <input
                    type="text"
                    required={!isEditingAdmin}
                    placeholder="رمز مشفر للدخول"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>

                <div className="pt-3.5 flex gap-2 justify-end text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAdmin(false);
                      setShowAddAdminModal(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition active:scale-95"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingAdmin ? 'جاري الحفظ والإنفاذ...' : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLOUD DB REORGANIZATION AND OWNERSHIP TRANSFER CONTROL CENTER */}
      <AnimatePresence>
        {showReorgControlCenter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-3xl p-6 w-full max-w-2xl relative font-sans text-right shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setShowReorgControlCenter(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-5 text-indigo-700 border-b border-slate-150 pb-3">
                <Database size={24} />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">أداة حوكمة وإعادة هيكلة البيانات السحابية</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">صلاحية سيادية مرخصة لمدير البرنامج معتز لمواءمة الأوعية وتطهير الحسابات</p>
                </div>
              </div>

              {isLoadingReorg ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 size={32} className="text-indigo-650 animate-spin" />
                  <p className="text-xs font-bold text-slate-600 animate-pulse">جاري فحص ومواءمة مكونات قاعدة البيانات السحابية...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-450">مستعملي النظام</h4>
                      <p className="text-lg font-black text-slate-800 mt-1 font-mono">{reorgStatus?.totalUsers ?? '...'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-450">مواقع الفروع</h4>
                      <p className="text-lg font-black text-slate-800 mt-1 font-mono">{reorgStatus?.totalSites ?? '...'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-rose-600">المتروكة القديمة</h4>
                      <p className="text-lg font-black text-rose-700 mt-1 font-mono">{reorgStatus?.legacyUsersCount ?? '...'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-700 font-bold">مواقع معلّقة</h4>
                      <p className="text-lg font-black text-amber-700 mt-1 font-mono">{reorgStatus?.orphanedSitesCount ?? '...'}</p>
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  <div className="space-y-2 text-xs">
                    {reorgStatus?.legacyUsersCount > 0 && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                        <h4 className="font-extrabold text-rose-800 flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={14} />
                          تم رصد حسابات معلّقة قديمة تشغل الأوعية!
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          قد تؤدي السجلات القديمة المترتبة إلى تداخل البيانات بين المشرفين الجدد. يمكنك تطهيرها ومسحها بنقرة واحدة.
                        </p>
                      </div>
                    )}

                    {reorgStatus?.orphanedSitesCount > 0 && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                        <h4 className="font-extrabold text-amber-800 flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={14} />
                          أعمال ومواقع معلّقة (بدون مالك فرعي):
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          يسند هذا المعالج فورياً المواقع الغريبة إلى ملكية حسابك مؤقتاً لتتمكن من إعادة توزيعها بشكل آمن.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Clean block */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">1. الفحص الفوري والمواءمة الشاملة</h4>
                    <p className="text-[10px] text-slate-550 leading-relaxed">تطلق هذه التشغيل السحابي مسحاً فورياً لحذف مخلفات البني الإدارية القديمة وتوحيد الأوعية.</p>
                    <button
                      type="button"
                      onClick={handleExecuteReorg}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles size={13} />
                      <span>تشغيل معالج التطهير والمواءمة المركزي للفروع</span>
                    </button>
                  </div>

                  {/* Transfer Form block */}
                  <form onSubmit={handleTransferOwnership} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">2. نقل وإعادة توزيع ملكية المواقع والمقايسات</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">اختر أحد العناوين والبنود من قاعدة البيانات السحابية واختصر الصلاحيات لنقلها فورياً إلى ملكية مدير فرع آخر:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">قطاع العمل أو الموقع المستهدف:</label>
                        <select
                          required
                          value={transferSiteId}
                          onChange={(e) => setTransferSiteId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- اختر موقع العمل السحابي --</option>
                          {sites.map((s, idx) => (
                            <option key={s.id || `site_opt_${idx}`} value={s.id}>{s.nameAr} ({s.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">مدير النظام المستلم الجديد:</label>
                        <select
                          required
                          value={transferAdmin}
                          onChange={(e) => setTransferAdmin(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- اختر الطرف المناسب للاستلام --</option>
                          <option value="moataz">المكتب العام (موئل معتز يونس)</option>
                          {adminsList.map((adm, idx) => (
                            <option key={adm.docId || `${adm.username}_${idx}`} value={adm.username.toLowerCase()}>{adm.nameAr} ({adm.username})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-semibold leading-none flex items-center gap-1">
                        <AlertTriangle size={11} className="text-amber-500" />
                        ستنعكس تغييرات الصلاحية للأعضاء فورياً.
                      </span>
                      <button
                        type="submit"
                        disabled={isTransferring}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition active:scale-95"
                      >
                        {isTransferring ? 'جاري معالجة النقل...' : 'تأكيد وإعادة توجيه الصلاحيات'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED RESTORE BACKUP MODAL */}
      <AnimatePresence>
        {showRestoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-3xl p-6 w-full max-w-lg relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreFile(null);
                  setRestorePayload(null);
                }}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer font-sans"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-5 text-emerald-700 border-b border-slate-150 pb-3">
                <Download size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">استعادة واستيراد بنود ووثائق النسخ الاحتياطي</h3>
                  <p className="text-[10px] text-slate-500">رفع وقراءة السجلات المحلية لحفظها بالكامل على المخدم السحابي المعزول</p>
                </div>
              </div>

              {!restorePayload ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <FolderPlus size={44} className="text-slate-300 mb-3" />
                  <p className="text-xs font-bold text-slate-650 text-center mb-4">يُرجى سحب أو رفع ملف النسخة الاحتياطية بصيغة (JSON)</p>
                  
                  <label className="px-5 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-md">
                    تصفح الملفات
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleRestoreFileSelect}
                    />
                  </label>
                </div>
              ) : (
                <form onSubmit={handleConfirmRestore} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      تم فحص ملف الاسترداد بنجاح!
                    </span>
                    <button 
                      type="button"
                      onClick={() => { setRestoreFile(null); setRestorePayload(null); }}
                      className="text-[10px] underline hover:text-emerald-600 font-bold"
                    >
                      إلغاء الملف
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    سيقوم النظام بإنشاء وتوطين موقع العمل الجديد واستيراد كافة الكشوف من السجل المرفق فوراً. يرجى تأكيد اسم وعنوان الرمز:
                  </p>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-600">اسم موقع العمل العربي:</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      value={restoreSiteName}
                      onChange={(e) => setRestoreSiteName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-600">الرمز الخاص الإنجليزي (ID):</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-left"
                      value={restoreSiteId}
                      onChange={(e) => setRestoreSiteId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      disabled={sites.some(s => s.id === restoreSiteId)}
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] font-black text-slate-600">المركز الجغرافي للموقع:</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      value={restoreSiteLoc}
                      onChange={(e) => setRestoreSiteLoc(e.target.value)}
                    />
                  </div>

                  <div className="pt-3.5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isRestoring}
                      className="px-6 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl font-extrabold cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      {isRestoring ? 'جاري الكتابة والمزامنة السحابية...' : 'تأكيد واستيراد الملف كموقع عمل'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOVEREIGN SITE DELETION CONFIRMATION MODAL WITH CAPTCHA & PASSWORD */}
      <AnimatePresence>
        {showDeleteConfirmModal && siteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative font-sans text-right shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSiteToDelete(null);
                }}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer font-sans"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5 mb-4 text-rose-650 border-b border-slate-100 pb-3">
                <AlertTriangle size={24} className="text-rose-650 shrink-0 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">تأكيد إجراء الحذف السيادي لموقع العمل</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">صلاحية أمنية مخصصة لمدير النظام الرئيسي فقط</p>
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-slate-200 rounded-2xl text-right space-y-1.5 mb-4">
                <p className="text-[10px] text-rose-800 font-bold leading-none">تنبيه حرج وغير قابل للتراجع:</p>
                <p className="text-xs font-extrabold text-slate-900 leading-snug">
                  أنت على وشك مسح وإزالة موقع الإجراء المعتمد:
                  <span className="block mt-1 font-black text-rose-700">"{siteToDelete.nameAr}"</span>
                </p>
                <div className="flex justify-between text-[9.5px] text-slate-550 pt-1 border-t border-rose-100/50 font-mono">
                  <span>كود: {siteToDelete.id}</span>
                  <span>الموقع: {siteToDelete.location}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmDeleteSite} className="space-y-4">
                
                {/* CAPTCHA SECTION */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700">رمز التحقق الأمني (الكابتشر):</label>
                    <button
                      type="button"
                      onClick={() => setDeleteCaptcha(generateCaptcha())}
                      className="text-[10px] font-bold text-indigo-650 hover:underline cursor-pointer"
                    >
                      تحديث الرمز ↻
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Visual Captcha Sign */}
                    <div className="select-none font-mono font-black text-lg bg-indigo-50 border border-indigo-150 text-indigo-650 tracking-widest px-4 py-2 rounded-xl skew-x-3 rotate-1 flex items-center justify-center border-dashed shrink-0 shadow-inner w-24">
                      {deleteCaptcha}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="أدخل الأرقام الأربعة"
                        value={deleteCaptchaInput}
                        onChange={(e) => setDeleteCaptchaInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-mono font-black placeholder-slate-400 focus:outline-none focus:border-rose-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* PASSWORD SECTION */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-700">كلمة مرور مدير النظام (للتأكيد):</label>
                    <span className="text-[9px] text-rose-650 font-bold">مطلوبة *</span>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="أدخل كلمة مرور حسابك لتأكيد الحذف"
                    value={deleteAdminPassword}
                    onChange={(e) => setDeleteAdminPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right tracking-tight focus:outline-none focus:bg-white focus:border-rose-500 placeholder-slate-400 text-left placeholder:text-right"
                    dir="ltr"
                  />
                </div>

                <div className="pt-2 flex gap-2 justify-end text-xs font-bold font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setSiteToDelete(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition active:scale-95"
                  >
                    إلغاء الحذف
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingSite}
                    className="px-5 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl cursor-pointer transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md shadow-rose-600/10"
                  >
                    {isDeletingSite ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الحذف بأمان...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>تأكيد الحذف النهائي</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
