/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SubmissionsTab from './components/SubmissionsTab';
import DashboardOverview from './components/DashboardOverview';
import TransactionsTable from './components/TransactionsTable';
import AddTransactionModal from './components/AddTransactionModal';
import CustodyManager from './components/CustodyManager';
import ContractorCertificates from './components/ContractorCertificates';
import BudgetAnalysis from './components/BudgetAnalysis';
import WeeklyExpenseReport from './components/WeeklyExpenseReport';

// NEW Enterprise ERP Components
import EquipmentDashboard from './components/EquipmentDashboard';
import SuppliesDashboard from './components/SuppliesDashboard';
import SubcontractorsDashboard from './components/SubcontractorsDashboard';
import ContractsDashboard from './components/ContractsDashboard';
import RiskDashboard from './components/RiskDashboard';
import QualityDashboard from './components/QualityDashboard';
import DocumentControlDashboard from './components/DocumentControlDashboard';
import PlanningDashboard from './components/PlanningDashboard';
import FuelDashboard from './components/FuelDashboard';
import SiteWorkersDashboard from './components/SiteWorkersDashboard';
import WarehouseDashboard from './components/WarehouseDashboard';
import ExtractsTab from './components/ExtractsTab';
import HSEDashboard from './components/HSEDashboard';
import ProjectsTab from './components/ProjectsTab';
import BOQTab from './components/BOQTab';
import SettingsTab from './components/SettingsTab';
import NotificationsTab from './components/NotificationsTab';
import SiteInspectionRequests from './components/SiteInspectionRequests';
import LoginScreen from './components/LoginScreen';
import SiteSelectionScreen from './components/SiteSelectionScreen';
import UsersAdminPanel from './components/UsersAdminPanel';
import CrmDashboard from './components/CrmDashboard';
import CrmCustomerList from './components/CrmCustomerList';
import AddCustomerModal from './components/AddCustomerModal';
import GlobalActivityLog from './components/GlobalActivityLog';


import { 
  Transaction, 
  ProjectCategory, 
  CustodyRecord, 
  ContractorCertificate, 
  CategoryMetric,
  EquipmentRecord,
  MaintenanceOrder,
  LabTestRecord,
  HseIncidentRecord,
  WbsTaskRecord,
  WarehouseItemRecord,
  AuditTrailRecord,
  SiteWorker,
  WorkerAttendance,
  WorkerSalaryPayment,
  CustomExtract,
  BOQItem,
  Project,
  Submission,
  Contract,
  Subcontractor,
  EquipmentSummary,
  FuelLogRecord,
  FuelStation,
  SupplyRecord,
  SupplyItem,
  CubicCertificate,
  UserItem,
  UserModulePermissions,
  RiskItem,
  DcrRecord,
  CustomerRecord,
  MRIRRecord,
  MRNRecord,
  AuditCountRecord
} from './types';
import { INITIAL_FUEL_CUSTODY_BUDGET } from './data/fuelInitialData';
import { setConfirmListener } from './utils/confirmHelper';

// Replaced direct Firestore imports with API calls for better reliability in diverse environments

import { 
  INITIAL_CATEGORIES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_CUSTODIES, 
  INITIAL_CONTRACTORS,
  INITIAL_WORKERS
} from './data/initialData';

import {
  INITIAL_EQUIPMENT,
  INITIAL_MAINTENANCE_ORDERS,
  INITIAL_LAB_TESTS,
  INITIAL_HSE_INCIDENTS,
  INITIAL_WBS_TASKS,
  INITIAL_WAREHOUSE,
  INITIAL_AUDIT_TRAIL
} from './data/erpInitialData';

import { 
  Calendar, 
  Clock, 
  Building,
  Activity,
  FileText,
  HelpCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Database,
  Sparkles,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BunyanLogo from './components/BunyanLogo';
import * as firestore from 'firebase/firestore';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  query, 
  collection, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { appendSessionLog } from './lib/sessionTracker';
import { applyColorTheme, COLOR_THEMES } from './utils/themeHelper';
import InteractiveBackground from './components/InteractiveBackground';
import LoadingScreen from './components/LoadingScreen';

function sanitizeLoadedData<T extends { id: string; referenceNo?: string }>(items: any[], prefix: string): T[] {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.map((item, idx) => {
    if (!item) return item;
    let finalId = item.id;
    if (!finalId || seen.has(finalId)) {
      finalId = `${prefix}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000000)}`;
    }
    seen.add(finalId);
    
    // Automatically generate referenceNo if not present in the loaded database record
    let finalRef = item.referenceNo || item.refNo || item.referenceNumber || item.ref;
    if (!finalRef) {
      finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    
    return { ...item, id: finalId, referenceNo: finalRef };
  }).filter(Boolean) as T[];
}


// Helpers for auto tracking
const getModuleAr = (key: string) => {
  const map: Record<string, string> = {
    transactions: 'دفتر الحركات المالي', custodies: 'العهد المالية', contractors: 'مقاولي الباطن', 
    equipment: 'حركة المعدات', maintenanceOrders: 'الصيانة', labTests: 'مختبرات الجودة', 
    hseIncidents: 'شؤون السيرتي والبيئة', wbsTasks: 'برامج الجدولة', warehouseItems: 'المخازن المركزية', 
    workers: 'العمالة اليومية', attendanceLogs: 'سجلات الدوام', salaryPayments: 'مسيرات الرواتب', 
    supplyRecords: 'سجلات التوريد', cubicCertificates: 'شهادات التكعيب', projects: 'المشروعات والتعاقدات', 
    boqItems: 'مقايسات الأعمال', submissions: 'الاعتمادات والمستخلصات'
  };
  return map[key] || key;
};

export default function App() {
  const [activeTab, setActiveTab ] = useState<string>('dashboard');
  
  // Dynamic design system themes and background modes (scoped per user)
  const getInitialUserTheme = () => {
    const savedUser = localStorage.getItem('bunyan_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.username) {
          return localStorage.getItem(`bunyan_theme_id_${u.username}`) || u.themeId || 'classic';
        }
      } catch (e) {}
    }
    return localStorage.getItem('bunyan_theme_id_guest') || 'classic';
  };

  const getInitialUserBg = () => {
    const savedUser = localStorage.getItem('bunyan_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.username) {
          return localStorage.getItem(`bunyan_bg_type_${u.username}`) || u.bgType || 'waves';
        }
      } catch (e) {}
    }
    return localStorage.getItem('bunyan_bg_type_guest') || 'waves';
  };

  const [themeId, setThemeId] = useState<string>(getInitialUserTheme);
  const [bgType, setBgType] = useState<'none' | 'waves' | 'particles' | 'matrix' | 'bubbles' | 'vortex'>(getInitialUserBg);

  // Sync state when user logs in, out, or changes
  const [user, setUser] = useState<UserItem | null>(() => {
    const saved = localStorage.getItem('bunyan_current_user');
    if (!saved) return null;
    try {
      const u = JSON.parse(saved);
      // Ensure permissions exist for legacy sessions
      if (!u.permissions) {
        u.permissions = { projects: true, supplies: true, equipment: true, contractors: true, finance: true, usersManagement: false };
      }
      return u;
    } catch {
      return null;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const [selectedSite, setSelectedSite] = useState<{id: string; nameAr: string; location: string; description: string} | null>(() => {
    const saved = localStorage.getItem('bunyan_current_site');
    return saved ? JSON.parse(saved) : null;
  });

  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);
  const loadedSiteIdRef = useRef<string | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbChecking, setDbChecking] = useState<boolean>(false);
  const [dbLatency, setDbLatency] = useState<number>(0);

  useEffect(() => {
    if (user) {
      const userTheme = localStorage.getItem(`bunyan_theme_id_${user.username}`) || user.themeId || 'classic';
      const userBg = (localStorage.getItem(`bunyan_bg_type_${user.username}`) as any) || user.bgType || 'waves';
      setThemeId(userTheme);
      setBgType(userBg);
    } else {
      const guestTheme = localStorage.getItem('bunyan_theme_id_guest') || 'classic';
      const guestBg = (localStorage.getItem('bunyan_bg_type_guest') as any) || 'waves';
      setThemeId(guestTheme);
      setBgType(guestBg);
    }
  }, [user]);

  // Persist changes to local storage and sync with Firestore if logged in
  useEffect(() => {
    applyColorTheme(themeId);
    if (user) {
      localStorage.setItem(`bunyan_theme_id_${user.username}`, themeId);
      if (dbConnected) {
        const userDocRef = doc(db, 'users', user.username);
        updateDoc(userDocRef, { themeId }).catch(err => console.error("Error saving user theme in Firestore:", err));
      }
    } else {
      localStorage.setItem('bunyan_theme_id_guest', themeId);
    }
  }, [themeId, user, dbConnected]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`bunyan_bg_type_${user.username}`, bgType);
      if (dbConnected) {
        const userDocRef = doc(db, 'users', user.username);
        updateDoc(userDocRef, { bgType }).catch(err => console.error("Error saving user bgType in Firestore:", err));
      }
    } else {
      localStorage.setItem('bunyan_bg_type_guest', bgType);
    }
  }, [bgType, user, dbConnected]);

  // Fetch the latest saved theme/bg settings from Firestore on mount/login
  useEffect(() => {
    if (user && dbConnected) {
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', user.username);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.themeId && data.themeId !== themeId) {
              setThemeId(data.themeId);
              localStorage.setItem(`bunyan_theme_id_${user.username}`, data.themeId);
            }
            if (data.bgType && data.bgType !== bgType) {
              setBgType(data.bgType);
              localStorage.setItem(`bunyan_bg_type_${user.username}`, data.bgType);
            }
          }
        } catch (err) {
          console.error("Error fetching user preferences from Firestore:", err);
        }
      };
      fetchUserData();
    }
  }, [user, dbConnected]);

  const [globalConfirm, setGlobalConfirm] = useState<{
    message: string;
    randomCode: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  const [globalConfirmInput, setGlobalConfirmInput] = useState('');

  useEffect(() => {
    setConfirmListener((req) => {
      setGlobalConfirm(req);
      setGlobalConfirmInput('');
    });
    return () => setConfirmListener(() => {});
  }, []);

  // DB Connection status continuous check
  const checkDbStatus = async () => {
    setDbChecking(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      const end = Date.now();
      setDbConnected(data.connected);
      setDbLatency(end - start);
    } catch {
      setDbConnected(false);
    } finally {
      setDbChecking(false);
    }
  };

  useEffect(() => {
    const isWiped = localStorage.getItem('bunyan_v2_wipe');
    if (!isWiped) {
      localStorage.clear();
      localStorage.setItem('bunyan_v2_wipe', 'true');
      window.location.reload();
    }

    checkDbStatus(); // Immediate first check
    const interval = setInterval(checkDbStatus, 5000); // Pulse check every 5 seconds continuously
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (user) {
      appendSessionLog(user, 'خروج', selectedSite?.nameAr || 'لم يحدد بعد');
    }
    setUser(null);
    setSelectedSite(null);
    setIsDbLoaded(false);
    loadedSiteIdRef.current = null;
    sessionStorage.removeItem('bunyan_logged_this_tab');
    localStorage.removeItem('bunyan_current_user');
    localStorage.removeItem('bunyan_current_site');
  };

  // --- Global Viewer Protection (Strict Mode) ---
  useEffect(() => {
    if (user?.role !== 'viewer') {
      return;
    }
    
    // (viewer mode disabled)

    const blockEvent = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
    };

    const handleActionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
      if (isInput) {
        const input = target as HTMLInputElement;
        const isSearch = input.type === 'search' || input.placeholder?.includes('بحث') || input.className.includes('search');
        if (!isSearch) {
          blockEvent(e);
          // Don't alert on inputs, just quietly block
          return;
        }
      }

      const btn = target.closest('button, [role="button"]') as HTMLButtonElement | null;
      if (btn) {
        // Exclude inputs explicitly requested to be accessible or navigation
        const isNav = target.closest('nav') || target.closest('header') || target.closest('.sidebar');
        const txt = (btn.textContent || '').toLowerCase();
        const title = (btn.getAttribute('title') || '').toLowerCase();
        const HTML = btn.innerHTML || '';
        
        // Always let these actions pass
        if (/إغلاق|رجوع|إلغاء|بحث|تصدير|طباعة|خروج|عرض|تفاصيل|تحميل|close|cancel|back|print|export|view|تسجيل الدخول|دخول/.test(txt + title)) {
          return;
        }
        
        const isAction = /trash|edit|plus|save|upload|download/i.test(HTML) || 
                         /إضافة|تعديل|حذف|حفظ|مسح|رفع|تسجيل|صرف|اعتماد|تحديث|edit|delete|add|save|update|remove|trash|plus/i.test(txt + title) || 
                         btn.type === 'submit' ||
                         btn.className.includes('bg-rose-') ||
                         btn.className.includes('bg-emerald-') ||
                         btn.className.includes('bg-indigo-600') ||
                         btn.className.includes('text-rose-500');

        if (isAction && !isNav) {
          blockEvent(e);
          alert('عذراً، حالة حسابك (مشاهد) ولا تملك صلاحية لهذه العملية.');
        }
      }
    };

    const handleFormSubmit = (e: SubmitEvent) => {
      blockEvent(e);
      alert('عذراً، حالة حسابك (مشاهد) ولا تملك صلاحية للحفظ.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      
      if (isInput) {
        const inputBase = target as HTMLInputElement;
        const isSearch = inputBase.type === 'search' || inputBase.placeholder?.includes('بحث') || inputBase.className.includes('search');
        
        if (!isSearch) {
          // Allow basic navigation keys (Tab, arrows, Home, End, PageUp, PageDown)
          if (!['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
            blockEvent(e);
          }
        }
      }
    };

    // Use capturing phase to intercept before React synthetic events
    document.addEventListener('click', handleActionClick, true);
    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Aggressively disable elements in DOM to provide UI feedback & secondary blockage
    const observer = new MutationObserver(() => {
      // 1. Disable all non-search inputs
      document.querySelectorAll('input, select, textarea').forEach((el) => {
        const t = el as HTMLInputElement;
        const isSearch = t.type === 'search' || t.placeholder?.includes('بحث') || t.className.includes('search');
        if (!isSearch && !t.disabled) {
          t.disabled = true;
          t.style.opacity = '0.7';
          t.style.cursor = 'not-allowed';
        }
      });
      // 2. Disable specific action buttons
      document.querySelectorAll('button').forEach((btn) => {
        const isNav = btn.closest('nav') || btn.closest('header') || btn.closest('.sidebar');
        if (isNav) return;
        
        const txt = (btn.textContent || '').toLowerCase();
        const HTML = btn.innerHTML || '';
        const title = (btn.getAttribute('title') || '').toLowerCase();
        
        if (/إغلاق|رجوع|إلغاء|بحث|تصدير|طباعة|خروج|عرض|تفاصيل|تحميل/.test(txt + title)) return;
        
        const isAction = /trash|edit|plus|save|upload/i.test(HTML) || 
                         /إضافة|تعديل|حذف|حفظ|مسح|رفع|تسجيل|صرف|اعتماد|تحديث/.test(txt + title) || 
                         btn.type === 'submit' ||
                         btn.className.includes('bg-indigo-600') ||
                         btn.className.includes('bg-rose-');

        if (isAction && !btn.disabled) {
           btn.disabled = true;
           btn.style.opacity = '0.5';
           btn.style.cursor = 'not-allowed';
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    
    // Run observer once for existing DOM
    observer.takeRecords();
    document.querySelectorAll('input, select, textarea, button').forEach(el => observer.observe(el, {attributes: true}));

    return () => {
      document.removeEventListener('click', handleActionClick, true);
      document.removeEventListener('submit', handleFormSubmit, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      observer.disconnect();
    };
  }, [user]);

  // 1. Core Trial Session Time tracking & dynamic lockout
  const [trialTimeLeft, setTrialTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let timerInterval: any = null;
    if (user && user.isTrial && user.trialStartedAt) {
      const calculateLeft = () => {
        const elapsedSec = Math.floor((Date.now() - new Date(user.trialStartedAt!).getTime()) / 1000);
        const remaining = Math.max(0, 3600 - elapsedSec);
        setTrialTimeLeft(remaining);
        if (remaining <= 0) {
          handleLogout();
        }
      };

      calculateLeft();
      timerInterval = setInterval(calculateLeft, 1000);
    } else {
      setTrialTimeLeft(null);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [user]);

  // 1. Core Financial Transactions & Ledger
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [custodies, setCustodies] = useState<CustodyRecord[]>([]);

  const [contractors, setContractors] = useState<ContractorCertificate[]>([]);

  // 2. Enterprise ERP Modules States
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([]);

  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);

  const [labTests, setLabTests] = useState<LabTestRecord[]>([]);

  const [hseIncidents, setHseIncidents] = useState<HseIncidentRecord[]>([]);

  const [wbsTasks, setWbsTasks] = useState<WbsTaskRecord[]>([]);

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItemRecord[]>([]);
  const [mrirLogs, setMrirLogs] = useState<MRIRRecord[]>([]);
  const [mrnLogs, setMrnLogs] = useState<MRNRecord[]>([]);
  const [warehouseAuditLogs, setWarehouseAuditLogs] = useState<AuditCountRecord[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditTrailRecord[]>([]);

  const [workers, setWorkers] = useState<SiteWorker[]>([]);

  const [attendanceLogs, setAttendanceLogs] = useState<WorkerAttendance[]>([]);

  const [salaryPayments, setSalaryPayments] = useState<WorkerSalaryPayment[]>([]);

  // Supplies Module state
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [cubicCertificates, setCubicCertificates] = useState<CubicCertificate[]>([]);
  const [contractorsReport, setContractorsReport] = useState<any[]>([]);

  const [fuelLogs, setFuelLogs] = useState<FuelLogRecord[]>([]);
  const [custodyBudget, setCustodyBudget] = useState<number>(0);
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([]);

  const [extracts, setExtracts] = useState<CustomExtract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentSummary[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [dcrRecords, setDcrRecords] = useState<DcrRecord[]>([]);

  // Weekly report persistent configuration (Firestore master source of truth)
  const [weeklyReportBenodTree, setWeeklyReportBenodTree] = useState<any>(null);
  const [weeklyReportClosingDayIndex, setWeeklyReportClosingDayIndex] = useState<number>(2);
  const [weeklyReportSignatures, setWeeklyReportSignatures] = useState<any>({
    sig1Title: 'المحاسب المالي',
    sig2Title: 'مهندس أول المشروع والمراجعة',
    sig3Title: 'مدير عام قطاع التنفيذ للمشاريع',
    sig1Name: '',
    sig2Name: '',
    sig3Name: '',
  });

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const userRole = user?.role;

  // Clock Update Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(now.toISOString().split('T')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync to Firestore instead of local storage
  useEffect(() => {
    if (user && selectedSite && isDbLoaded && loadedSiteIdRef.current === selectedSite.id) {
      const siteDataPayload = {
        transactions,
        custodies,
        contractors,
        equipment,
        maintenanceOrders,
        labTests,
        hseIncidents,
        wbsTasks,
        warehouseItems,
        mrirLogs,
        mrnLogs,
        warehouseAuditLogs,
        auditLogs,
        workers,
        attendanceLogs,
        salaryPayments,
        extracts,
        projects,
        boqItems,
        submissions,
        subcontractors,
        contracts,
        supplyRecords,
        supplyItems,
        cubicCertificates,
        contractorsReport,
        fuelLogs,
        custodyBudget,
        fuelStations,
        equipmentSummary: equipmentList,
        risks,
        dcrRecords,
        weeklyReportBenodTree,
        weeklyReportClosingDayIndex,
        weeklyReportSignatures
      };

      const timer = setTimeout(async () => {
        try {
          // Deep clean payload of undefined values which Firestore doesn't accept
          const cleanPayload = JSON.parse(JSON.stringify(siteDataPayload));
          
          // Use reliable server API instead of direct client-side Firestore SDK
          const response = await fetch(`/api/site/${selectedSite.id}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: cleanPayload })
          });
          if (!response.ok) {
            throw new Error('Failed to save data to database.');
          }
        } catch (err) {
          console.warn("Error saving site data via API:", err);
          setDbConnected(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    transactions, custodies, contractors, equipment, maintenanceOrders, labTests, hseIncidents, wbsTasks, warehouseItems, mrirLogs, mrnLogs, warehouseAuditLogs, auditLogs, workers, attendanceLogs, salaryPayments, extracts, projects, boqItems, submissions, subcontractors, contracts, supplyRecords, supplyItems, cubicCertificates, contractorsReport, fuelLogs, custodyBudget, fuelStations, equipmentList, selectedSite, user, isDbLoaded, risks, dcrRecords, weeklyReportBenodTree, weeklyReportClosingDayIndex, weeklyReportSignatures
  ]);

  const checkAndTriggerDailyAutoBackup = async (siteId: string, siteName: string, sitePayload: any) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `bunyan_last_auto_backup_${siteId}`;
      const lastBackupDate = localStorage.getItem(storageKey);
      
      if (lastBackupDate === today) {
        console.log(`[Auto-Backup] Already completed for site ${siteId} today (${today}).`);
        return;
      }
      
      console.log(`[Auto-Backup] Launching daily auto-backup for site ${siteId}...`);
      
      const response = await fetch(`/api/site/${siteId}/auto-backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteName,
          payload: sitePayload
        })
      });
      
      if (response.ok) {
        localStorage.setItem(storageKey, today);
        console.log(`[Auto-Backup] Daily auto-backup successfully completed for ${siteId}.`);
      }
    } catch (err) {
      console.error("[Auto-Backup] Error during daily auto-backup check:", err);
    }
  };

  const [showBackupReminder, setShowBackupReminder] = useState(false);

  useEffect(() => {
    const checkBackupReminder = () => {
      const now = new Date();
      // Test or real check
      if (now.getHours() === 12 && now.getMinutes() === 0) {
        setShowBackupReminder(true);
      }
    };
    const timer = setInterval(checkBackupReminder, 60000); 
    return () => clearInterval(timer);
  }, []);

  const triggerTestBackupReminder = () => {
    setShowBackupReminder(true);
  };
  
  // Pull site database from Firestore upon site selection
  useEffect(() => {
    if (user && selectedSite) {
      setIsDbLoaded(false); // Reset database load flag to block save effects during loading
      
      const loadSiteData = async () => {
        const startTime = Date.now(); // Track start time for minimum duration
        
        // Instant visual wipe to prevent any cross-site memory leak or mismatch
        setTransactions([]);
        setCustodies([]);
        setContractors([]);
        setEquipment([]);
        setMaintenanceOrders([]);
        setLabTests([]);
        setHseIncidents([]);
        setWbsTasks([]);
        setWarehouseItems([]);
        setMrirLogs([]);
        setMrnLogs([]);
        setWarehouseAuditLogs([]);
        setAuditLogs([]);
        setWorkers([]);
        setAttendanceLogs([]);
        setSalaryPayments([]);
        setFuelLogs([]);
        setCustodyBudget(0);
        setExtracts([]);
        setProjects([]);
        setBoqItems([]);
        setSubmissions([]);
        setSubcontractors([]);
        setContracts([]);
        setEquipmentList([]);
        setSupplyRecords([]);
        setSupplyItems([]);
        setCubicCertificates([]);
        setContractorsReport([]);

        try {
          let hasDoc = false;
          let data: any = null;

          // Using reliable server API to fetch site data
          const res = await fetch(`/api/site/${selectedSite.id}/data`);
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }
          data = await res.json();
          if (data && Object.keys(data).length > 0) {
            hasDoc = true;
          }
          
          if (hasDoc && data) {
            setTransactions(data.transactions ? sanitizeLoadedData<Transaction>(data.transactions, 'tx') : []);
            setCustodies(data.custodies ? sanitizeLoadedData<CustodyRecord>(data.custodies, 'cust') : []);
            setContractors(data.contractors ? sanitizeLoadedData<ContractorCertificate>(data.contractors, 'sub') : []);
            setEquipment(data.equipment ? sanitizeLoadedData<EquipmentRecord>(data.equipment, 'eq') : []);
            setMaintenanceOrders(data.maintenanceOrders ? sanitizeLoadedData<MaintenanceOrder>(data.maintenanceOrders, 'maint') : []);
            setLabTests(data.labTests ? sanitizeLoadedData<LabTestRecord>(data.labTests, 'test') : []);
            setHseIncidents(data.hseIncidents ? sanitizeLoadedData<HseIncidentRecord>(data.hseIncidents, 'hse') : []);
            setWbsTasks(data.wbsTasks ? sanitizeLoadedData<WbsTaskRecord>(data.wbsTasks, 'task') : []);
            setWarehouseItems(data.warehouseItems ? sanitizeLoadedData<WarehouseItemRecord>(data.warehouseItems, 'wh') : []);
            setMrirLogs(data.mrirLogs ? sanitizeLoadedData<MRIRRecord>(data.mrirLogs, 'mrir') : []);
            setMrnLogs(data.mrnLogs ? sanitizeLoadedData<MRNRecord>(data.mrnLogs, 'mrn') : []);
            setWarehouseAuditLogs(data.warehouseAuditLogs ? sanitizeLoadedData<AuditCountRecord>(data.warehouseAuditLogs, 'waudit') : []);
            setAuditLogs(data.auditLogs ? sanitizeLoadedData<AuditTrailRecord>(data.auditLogs, 'audit') : []);
            setWorkers(data.workers ? sanitizeLoadedData<SiteWorker>(data.workers, 'w') : []);
            setAttendanceLogs(data.attendanceLogs ? sanitizeLoadedData<WorkerAttendance>(data.attendanceLogs, 'att') : []);
            setSalaryPayments(data.salaryPayments ? sanitizeLoadedData<WorkerSalaryPayment>(data.salaryPayments, 'pay') : []);
            setFuelLogs(data.fuelLogs ? sanitizeLoadedData<FuelLogRecord>(data.fuelLogs, 'fuel') : []);
            setCustodyBudget(data.custodyBudget || 0);
            setFuelStations(data.fuelStations ? sanitizeLoadedData<FuelStation>(data.fuelStations, 'station') : []);

            setExtracts(data.extracts ? sanitizeLoadedData<CustomExtract>(data.extracts, 'ext') : []);
            setProjects(data.projects ? sanitizeLoadedData<Project>(data.projects, 'p') : []);
            setBoqItems(data.boqItems ? sanitizeLoadedData<BOQItem>(data.boqItems, 'boq') : []);
            setSubmissions(data.submissions ? sanitizeLoadedData<Submission>(data.submissions, 'sub') : []);
            setSubcontractors(data.subcontractors ? sanitizeLoadedData<Subcontractor>(data.subcontractors, 'sub') : []);
            setContracts(data.contracts ? sanitizeLoadedData<Contract>(data.contracts, 'con') : []);
            setEquipmentList(data.equipmentSummary ? sanitizeLoadedData<EquipmentSummary>(data.equipmentSummary, 'eqsum') : []);
            
            // Supplies data
            setSupplyRecords(data.supplyRecords ? sanitizeLoadedData<SupplyRecord>(data.supplyRecords, 'suprec') : []);
            setSupplyItems(data.supplyItems ? sanitizeLoadedData<SupplyItem>(data.supplyItems, 'supitem') : []);
            setCubicCertificates(data.cubicCertificates ? sanitizeLoadedData<CubicCertificate>(data.cubicCertificates, 'cubic') : []);
            setContractorsReport(data.contractorsReport ? sanitizeLoadedData<any>(data.contractorsReport, 'contractor') : []);

            // Risks & Documents data
            setRisks(data.risks ? sanitizeLoadedData<RiskItem>(data.risks, 'risk') : []);
            setDcrRecords(data.dcrRecords ? sanitizeLoadedData<DcrRecord>(data.dcrRecords, 'dcr') : []);

            // Set weekly report states from Firestore
            setWeeklyReportBenodTree(data.weeklyReportBenodTree || null);
            setWeeklyReportClosingDayIndex(data.weeklyReportClosingDayIndex !== undefined ? data.weeklyReportClosingDayIndex : 2);
            setWeeklyReportSignatures(data.weeklyReportSignatures || {
              sig1Title: 'المحاسب المالي',
              sig2Title: 'مهندس أول المشروع والمراجعة',
              sig3Title: 'مدير عام قطاع التنفيذ للمشاريع',
              sig1Name: '',
              sig2Name: '',
              sig3Name: '',
            });
          } else {
            // New / unconfigured site: reset states (already done but safe to re-assert)
            setTransactions([]);
            setCustodies([]);
            setContractors([]);
            setEquipment([]);
            setMaintenanceOrders([]);
            setLabTests([]);
            setHseIncidents([]);
            setWbsTasks([]);
            setWarehouseItems([]);
            setMrirLogs([]);
            setMrnLogs([]);
            setWarehouseAuditLogs([]);
            setAuditLogs([]);
            setWorkers([]);
            setAttendanceLogs([]);
            setSalaryPayments([]);
            setFuelLogs([]);
            setCustodyBudget(0);
            setFuelStations([]);
            
            setExtracts([]);
            setProjects([]);
            setBoqItems([]);
            setSubmissions([]);
            setSubcontractors([]);
            setContracts([]);
            
            setSupplyRecords([]);
            setSupplyItems([]);
            setCubicCertificates([]);
            setContractorsReport([]);

            setRisks([]);
            setDcrRecords([]);

            // Reset weekly report configuration states to defaults
            setWeeklyReportBenodTree(null);
            setWeeklyReportClosingDayIndex(2);
            setWeeklyReportSignatures({
              sig1Title: 'المحاسب المالي',
              sig2Title: 'مهندس أول المشروع والمراجعة',
              sig3Title: 'مدير عام قطاع التنفيذ للمشاريع',
              sig1Name: '',
              sig2Name: '',
              sig3Name: '',
            });
          }

          // Enforce minimum of 5 seconds for the loading transition to feel high-fidelity
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 5000 - elapsed);
          
          setTimeout(() => {
            loadedSiteIdRef.current = selectedSite.id;
            setIsDbLoaded(true);
            
            // Trigger automatic daily snapshot backup if site has real records
            if (hasDoc && data) {
              checkAndTriggerDailyAutoBackup(selectedSite.id, selectedSite.nameAr, data);
            }
          }, remaining);

        } catch (err) {
          console.error("Complete catalog loading error:", err);
          alert("فشل الاتصال بقاعدة البيانات. لا يمكن تحميل بيانات الموقع. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
          setSelectedSite(null);
          setIsDbLoaded(false);
        }
      };

      loadSiteData();
    } else {
      setIsDbLoaded(false);
      loadedSiteIdRef.current = null;
    }
  }, [user, selectedSite]);

  // Compute category metrics dynamically for ledger reports
  const categories: CategoryMetric[] = INITIAL_CATEGORIES.map(cat => {
    // 1. Calculate 'المسدد' (Spent) automatically from 'شيت الحركة' (transactions)
    const totalSpent = transactions
      .filter(t => t.category === cat.id && t.type === 'spent')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Calculate 'الأعمال المنفذة / المستحقات' dynamically from their respective dashboards,
    // with a fallback to ledger 'executed_work' if empty.
    let totalExecutedValue = 0;

    if (cat.id === 'supplies') {
      const suppliesTotal = supplyRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
      totalExecutedValue = suppliesTotal > 0 ? suppliesTotal : transactions
        .filter(t => t.category === cat.id && t.type === 'executed_work')
        .reduce((sum, t) => sum + t.amount, 0);
    } else if (cat.id === 'equipment') {
      const getEquipmentCostHelper = (item: any) => {
        const hours = item.logs?.reduce((acc: number, log: any) => acc + (log.hoursWorked || 0), 0) || 0;
        const dur = item.carryoverHours ? (hours + item.carryoverHours) : hours;
        return Math.round(dur * (item.rate || 0));
      };
      const equipmentTotal = equipmentList.reduce((sum, e) => sum + getEquipmentCostHelper(e), 0);
      totalExecutedValue = equipmentTotal > 0 ? equipmentTotal : transactions
        .filter(t => t.category === cat.id && t.type === 'executed_work')
        .reduce((sum, t) => sum + t.amount, 0);
    } else if (cat.id === 'contractors') {
      const subcontractorsTotal = subcontractors.reduce((sum, s) => {
        const items = s.workItems && s.workItems.length > 0 ? s.workItems : [{
          id: 'legacy-item',
          trade: s.trade || 'عمل رئيسي',
          workVolume: s.workVolume || 0,
          unitPrice: s.unitPrice || 0,
          totalValue: (s.workVolume || 0) * (s.unitPrice || 0) || s.totalValue || 0,
          discounts: []
        }];
        let grossValue = 0;
        let totalDiscounts = 0;
        items.forEach(item => {
          grossValue += item.totalValue;
          if (item.discounts) {
            item.discounts.forEach(d => {
              totalDiscounts += d.amount || 0;
            });
          }
        });
        return sum + (grossValue - totalDiscounts);
      }, 0);
      totalExecutedValue = subcontractorsTotal > 0 ? subcontractorsTotal : transactions
        .filter(t => t.category === cat.id && t.type === 'executed_work')
        .reduce((sum, t) => sum + t.amount, 0);
    } else if (cat.id === 'fuel') {
      const fuelTotal = fuelLogs.reduce((sum, l) => sum + (l.cost || 0), 0);
      totalExecutedValue = fuelTotal > 0 ? fuelTotal : transactions
        .filter(t => t.category === cat.id && t.type === 'executed_work')
        .reduce((sum, t) => sum + t.amount, 0);
    } else if (cat.id === 'custody') {
      const custodySpent = transactions
        .filter(t => t.nature === 'inside_custody' && t.type === 'spent')
        .reduce((sum, t) => sum + t.amount, 0);
      totalExecutedValue = custodySpent > 0 ? custodySpent : transactions
        .filter(t => t.category === cat.id && t.type === 'executed_work')
        .reduce((sum, t) => sum + t.amount, 0);
    } else {
      totalExecutedValue = transactions
        .filter(t => t.category === cat.id && t.type === 'executed_work')
        .reduce((sum, t) => sum + t.amount, 0);
    }

    // 3. Calculate 'الميزانية المعتمدة' (initialBudget) dynamically from Contracts, BOQ, or custodyBudget
    let initialBudget = 0;
    if (cat.id === 'contractors') {
      const subcontractorContractsValue = contracts
        .filter(c => c.category === 'subcontractor')
        .reduce((sum, c) => sum + (c.value || 0), 0);
      initialBudget = subcontractorContractsValue > 0 
        ? subcontractorContractsValue 
        : subcontractors.reduce((sum, s) => sum + (s.totalValue || 0), 0);
    } else if (cat.id === 'supplies') {
      const supplierContractsValue = contracts
        .filter(c => c.category === 'supplier')
        .reduce((sum, c) => sum + (c.value || 0), 0);
      initialBudget = supplierContractsValue > 0 
        ? supplierContractsValue 
        : supplyRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    } else if (cat.id === 'custody') {
      initialBudget = custodyBudget || 0;
    } else {
      const categoryContractsValue = contracts
        .filter(c => c.category === cat.id)
        .reduce((sum, c) => sum + (c.value || 0), 0);
      initialBudget = categoryContractsValue > 0 ? categoryContractsValue : (cat.initialBudget || 0);
    }

    return {
      ...cat,
      initialBudget: initialBudget || cat.initialBudget || 0,
      totalSpent,
      totalExecutedValue
    };
  });

  // Calculate high-level financial counters directly
  const totalLedgerSpent = transactions
    .filter(t => t.type === 'spent')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLedgerExecuted = transactions
    .filter(t => t.type === 'executed_work')
    .reduce((sum, t) => sum + t.amount, 0);

  // Track user login session timestamps (توقيت آخر جلسة بالبرنامج)
  useEffect(() => {
    if (user) {
      const storedCurrent = localStorage.getItem('bunyan_current_session_time');
      const prevSessionUser = localStorage.getItem('bunyan_prev_session_user');
      
      if (!storedCurrent || prevSessionUser !== user.username) {
        if (storedCurrent) {
          localStorage.setItem('bunyan_last_session_time', storedCurrent);
        } else {
          // Fallback if never logged before (a beautiful realistic placeholder from last 24 hours)
          const formattedPrev = new Date(Date.now() - 3600000 * 18.5).toLocaleString('ar-EG', {
            hour12: true,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
          localStorage.setItem('bunyan_last_session_time', formattedPrev);
        }
        
        const nowStr = new Date().toLocaleString('ar-EG', {
          hour12: true,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        localStorage.setItem('bunyan_current_session_time', nowStr);
        localStorage.setItem('bunyan_prev_session_user', user.username);
      }

      // Automatically append login log once per tab session
      const hasLoggedThisTab = sessionStorage.getItem('bunyan_logged_this_tab');
      if (!hasLoggedThisTab) {
        appendSessionLog(user, 'دخول', selectedSite?.nameAr || 'لم يحدد بعد');
        sessionStorage.setItem('bunyan_logged_this_tab', 'true');
      }
    }
  }, [user, selectedSite]);

  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (activeNotifications.length > 0) {
      setShowNotificationModal(true);
    }
  }, [activeNotifications]);

  const handleAcknowledgeNotification = async (notificationId: string) => {
    try {
      const userDocRef = doc(db, 'users', user.username);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      const docRef = doc(db, 'notifications', notificationId);
      const dismissedBy = userData?.nameAr ? [userData.nameAr] : [user.username];
      
      // Update Firestore to add user to dismissedBy
      await updateDoc(docRef, {
        dismissedBy: arrayUnion(user.username)
      });
      
      setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (e) {
      console.error("Error acknowledging notification", e);
    }
  };

  const handleDismissAll = async () => {
    for (const notif of activeNotifications) {
      await handleAcknowledgeNotification(notif.id);
    }
    setShowNotificationModal(false);
  };

  // Real-time notifications listener
  useEffect(() => {
    if (!user) {
      setActiveNotifications([]);
      return;
    }

    try {
      const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Read local storage in case we dismissed offline too
        let locallyDismissed: string[] = [];
        try {
          const stored = localStorage.getItem('bunyan_dismissed_notifications');
          if (stored) locallyDismissed = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }

        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const notifId = docSnap.id;
          
          // Check if notification is targetted to this user's site, or is global for everyone
          const isTargeted = data.siteId === 'all' || (selectedSite && data.siteId === selectedSite.id);
          
          // Check if user has already dismissed this notification
          const isDismissedByCurrentUser = (data.dismissedBy && data.dismissedBy.includes(user.username)) || locallyDismissed.includes(notifId);

          if (isTargeted && !isDismissedByCurrentUser) {
            list.push({
              id: notifId,
              ...data
            });
          }
        });
        setActiveNotifications(list);
      }, (error) => {
        console.warn("Notifications live feed subscription warning:", error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not start real-time notifications subscription", e);
    }
  }, [user, selectedSite]);

  // Real-time customers listener
  useEffect(() => {
    try {
      const q = query(collection(db, 'customers'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CustomerRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CustomerRecord);
        });
        setCustomers(list);
      }, (error) => {
        console.warn("Customers live feed subscription warning:", error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not start real-time customers subscription", e);
    }
  }, []);

  const handleDismissNotification = async (notificationId: string) => {
    // 1. Instantly update UI by saving to local storage so they don't see it while Firebase syncs
    let locallyDismissed: string[] = [];
    try {
      const stored = localStorage.getItem('bunyan_dismissed_notifications');
      if (stored) locallyDismissed = JSON.parse(stored);
    } catch {}
    if (!locallyDismissed.includes(notificationId)) {
      locallyDismissed.push(notificationId);
      localStorage.setItem('bunyan_dismissed_notifications', JSON.stringify(locallyDismissed));
    }

    // 2. Filter out instantly
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));

    // 3. Sync update to Firestore doc
    if (user) {
      try {
        const docRef = doc(db, 'notifications', notificationId);
        await updateDoc(docRef, {
          dismissedBy: arrayUnion(user.username)
        });
      } catch (err) {
        console.warn("Failed to sync dismissal to database:", err);
      }
    }
  };

  // Helper action: Post automated entry to audit logs
  const addAuditLog = (action: string, module: string, details: string, customRefNo?: string) => {
    const refNo = customRefNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const newLog: AuditTrailRecord = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: user ? `${user.nameAr?.replace(/\s*\(?مدير التكاليف\)?/g, '')} (${user.role === 'admin' ? 'مدير البرنامج' : user.role === 'projects_manager' ? 'مدير عام' : 'مهندس'})` : 'م. معتز يونس',
      action,
      module,
      ip: '197.34.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      details,
      referenceNo: refNo
    };
    setAuditLogs(prev => [newLog, ...prev]);
    
    // إرسال السجل للسحابة
    fetch('/api/users/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user?.username || 'engineer',
        actionAr: `${action} [${module}]`,
        type: 'site',
        detailsAr: `${details} (الرقم المرجعي: ${refNo})`
      })
    }).catch(console.error);
  };

  // --- Enhanced Auto-Audit Tracker ---
  const prevStatesRef = useRef<any>({});
  
  useEffect(() => {
    if (!isDbLoaded) return; // wait until initialized
    
    // Only track if there's an actual user logged in
    if (!user) return;
    
    const currentTrackables = {
        transactions, custodies, contractors, equipment, maintenanceOrders,
        labTests, hseIncidents, wbsTasks, warehouseItems, workers, attendanceLogs,
        salaryPayments, supplyRecords, cubicCertificates, projects, boqItems, submissions
    };

    if (Object.keys(prevStatesRef.current).length === 0) {
      prevStatesRef.current = JSON.parse(JSON.stringify(currentTrackables));
      return;
    }

    const prev = prevStatesRef.current;
    let changed = false;
    
    for (const [key, currArray] of Object.entries(currentTrackables)) {
        const prevArray = prev[key] || [];
        const moduleNameAr = getModuleAr(key);
        
        if (currArray.length > prevArray.length) {
            if (key === 'transactions') {
                changed = true; // Still update prevStatesRef, just don't log
                continue; 
            }
            const addedNum = currArray.length - prevArray.length;
            addAuditLog('إضافة سجل حية', moduleNameAr, `تم تسجيل وتوثيق إدخال ${addedNum} بند/عنصر جديد في قاعدة البيانات.`);
            changed = true;
        } else if (currArray.length < prevArray.length) {
            const delNum = prevArray.length - currArray.length;
            // Identify removed elements if delNum === 1
            let removedInfo = '';
            if (delNum === 1) {
                const removedItem = prevArray.find((p: any) => !currArray.some((c: any) => c.id === p.id));
                if (removedItem) {
                    // Try to construct a readable description
                    const itemName = removedItem.name || removedItem.action || removedItem.description || '';
                    removedInfo = ` (العنصر: ${itemName}, الرقم المرجعي: ${removedItem.id})`;
                }
            }
            addAuditLog('إزالة سجل حية', moduleNameAr, `تم إزالة أو حذف ${delNum} بند/عنصر من السجلات${removedInfo} بأمر المشغل.`);
            changed = true;
        } else {
            // Check for updates - Skip manual-logged modules to avoid double logs
            if (key === 'attendanceLogs' || key === 'salaryPayments' || key === 'workers' || key === 'supplyRecords' || key === 'fuelLogs') {
                const pStr = JSON.stringify(prevArray);
                const cStr = JSON.stringify(currArray);
                if (pStr !== cStr) {
                    changed = true; // Still mark as changed to update ref, but don't call addAuditLog
                }
                continue;
            }
            
            const pStr = JSON.stringify(prevArray);
            const cStr = JSON.stringify(currArray);
            if (pStr !== cStr) {
                addAuditLog('تحديث بيانات حي', moduleNameAr, `جرى تعديل تفاصيل ومحتوى سجلات بداخل هذه الوحدة.`);
                changed = true;
            }
        }
    }
    
    if (changed) {
        prevStatesRef.current = JSON.parse(JSON.stringify(currentTrackables));
    }
    
  }, [
      transactions, custodies, contractors, equipment, maintenanceOrders,
      labTests, hseIncidents, wbsTasks, warehouseItems, workers, attendanceLogs,
      salaryPayments, supplyRecords, cubicCertificates, projects, boqItems, submissions,
      isDbLoaded, user
  ]);




  // MAIN TRANSACTION HANDLERS
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    if (dbConnected === false) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا تتوفر تغطية لقاعدة البيانات السحابية حالياً. تم تعليق إضافة المعاملات مؤقتاً لضمان عدم حدوث تباين في الحسابات بين أجهزة المهندسين.');
      return;
    }
    const finalRef = (newTx as any).referenceNo?.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const txWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      referenceNo: finalRef
    };
    setTransactions(prev => [txWithId, ...prev]);
    addAuditLog('إضافة حركة مالية', 'دفتر الحركات المالي', `تم إضافة حركة مالية جديدة رقم ${txWithId.id} بمرجع ${txWithId.referenceNo} وقيمة ${txWithId.amount} ج.م.`);
    setShowAddModal(false);
  };

  const handleAddCustomer = (newCustomer: CustomerRecord) => {
    setCustomers(prev => [...prev, newCustomer]);
    setShowAddCustomerModal(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (dbConnected === false) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا تتوفر تغطية لقاعدة البيانات السحابية حالياً. تم تعليق حذف المعاملات لحين عودة الاتصال ومزامنة البيانات.');
      return;
    }
    const target = transactions.find(t => t.id === id);
    const info = target ? ` (القيمة: ${target.amount} ج.م، المرجع: ${target.referenceNo})` : '';
    setTransactions(prev => prev.filter(t => t.id !== id));
    addAuditLog('حذف حركة مالية', 'دفتر الحركات المالي', `تم حذف حركة مالية بنجاح من الدفتر رقم ${id}${info}.`);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    if (dbConnected === false) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا تتوفر تغطية لقاعدة البيانات السحابية حالياً. تم تعليق تعديل الحركات لضمان تماسك السجلات بين الطواقم الإنشائية المختلفة.');
      return;
    }
    const finalRef = updatedTx.referenceNo?.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalTx = { ...updatedTx, referenceNo: finalRef };
    setTransactions(prev => prev.map(t => t.id === finalTx.id ? finalTx : t));
    addAuditLog('تعديل حركة مالية', 'دفتر الحركات المالي', `تم تعديل الحركة المالية رقم ${finalTx.id} بالمرجع ${finalTx.referenceNo} وقيمة ${finalTx.amount} ج.م.`);
  };

  const handleAddCustody = (name: string, amount: number, notes?: string) => {
    if (dbConnected === false) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا يمكن فتح عهد مالي جديدة للعهدة الموقع بدون مزامنة سحابية نشطة مع الإدارة المالية المركزية.');
      return;
    }
    const finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCustody: CustodyRecord = {
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      engineerName: name,
      totalGiven: amount,
      totalSettled: 0,
      remaining: amount,
      notes: notes || 'عهدة جديدة قيد التصفية',
      referenceNo: finalRef
    };
    
    setCustodies(prev => [...prev, newCustody]);

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'custody',
      amount,
      type: 'spent',
      nature: 'outside_custody', // Giving money to the engineer is from office treasury
      description: `صرف وتسليم عهدة نقدية للمهندس ${name}`,
      recipient: name,
      paymentMethod: 'تحويل بنكى',
      referenceNo: finalRef
    });

    addAuditLog('تفريغ عهدة موقعية', 'العهدة المالية الموقع', `تم قيد تسليم عهدة بالمرجع ${finalRef} وبقيمة ${amount} ج.م للمهندس ${name}.`);
  };

  const handleSettleCustody = (id: string, amount: number, notes: string) => {
    setCustodies(prev => prev.map(c => {
      if (c.id === id) {
        const totalSettled = c.totalSettled + amount;
        return {
          ...c,
          totalSettled,
          remaining: Math.max(0, c.totalGiven - totalSettled),
          notes: `آخر تصفية فواتير: ${notes}`
        };
      }
      return c;
    }));

    const engineer = custodies.find(c => c.id === id);
    const engName = engineer ? engineer.engineerName : 'المهندس المشرف';

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'custody',
      amount,
      type: 'executed_work',
      nature: 'inside_custody', // The actual expenditure is now recognized as custody expense
      description: `تسوية أوراق فواتير لمصاريف العهدة: ${notes}`,
      recipient: `${engName} (مراجعة حسابات)`,
      paymentMethod: 'اخرى'
    });

    addAuditLog('تسوية فواتير عهدة', 'العهدة المالية الموقع', `تمت تصفية مبلغ ${amount} ج.م للمشرف ${engName}.`);
  };

  const handleAddSubcontractor = (name: string, trade: string, totalValue: number) => {
    const finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSub: ContractorCertificate = {
      id: `sub-${Date.now()}`,
      contractorName: name,
      trade,
      totalValue,
      executedWorkValue: 0,
      totalPaid: 0,
      remainingBalance: 0,
      referenceNo: finalRef
    };
    setContractors(prev => [...prev, newSub]);
    addAuditLog('إرسال مقاول باطن', 'بيانات مقاولي الباطن', `تسجيل مقاول جديد بالمرجع ${finalRef}: ${name} للتخصص ${trade}.`);
  };

  const handleAddWorkCertificate = (id: string, amount: number, description: string) => {
    setContractors(prev => prev.map(c => {
      if (c.id === id) {
        const executedWorkValue = c.executedWorkValue + amount;
        return {
          ...c,
          executedWorkValue
        };
      }
      return c;
    }));

    const sub = contractors.find(c => c.id === id);
    const subName = sub ? sub.contractorName : 'المقاول';

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'contractors',
      amount,
      type: 'executed_work',
      nature: 'inside_custody',
      description: `اعتماد مستخلص أعمال منفذة: ${description}`,
      recipient: subName,
      paymentMethod: 'اخرى'
    });

    addAuditLog('اعتماد مستخلص باطن', 'المستخلصات والأشغال المعتمدة', `تم اعتماد مستخلص بقيمة ${amount} ج.م لحساب مقاول الباطن ${subName}.`);
  };

  const handlePayContractor = (id: string, amount: number, method: string, ref: string, description: string) => {
    setContractors(prev => prev.map(c => {
      if (c.id === id) {
        const totalPaid = c.totalPaid + amount;
        return {
          ...c,
          totalPaid
        };
      }
      return c;
    }));

    const sub = contractors.find(c => c.id === id);
    const subName = sub ? sub.contractorName : 'المقاول';

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'contractors',
      amount,
      type: 'spent',
      nature: (method === 'تحويل بنكى' || method === 'شيك') ? 'outside_custody' : 'inside_custody',
      description: `صرف ومقاصة دفعة نقدية لمقاول باطن: ${description}`,
      recipient: subName,
      paymentMethod: method as any,
      referenceNo: ref || undefined
    });

    addAuditLog('صرف دفعة للمقاول', 'المستخلصات والأشغال المعتمدة', `تم صرف حوالة مصرفية بقيمة ${amount} ج.م لـ ${subName}.`);
  };

  // FIELD OPERATIONS HANDLERS (AUTOMATED DATABASE ENTRIES)

  const handleAddEquipmentLog = (eqId: string, hours: number, fuel: number) => {
    const eqItem = equipment.find(e => e.id === eqId);
    if (!eqItem) return;

    setEquipment(prev => prev.map(e => {
      if (e.id === eqId) {
        return {
          ...e,
          hoursWorked: e.hoursWorked + hours,
          fuelConsumed: e.fuelConsumed + fuel
        };
      }
      return e;
    }));

    const estimatedCost = fuel * 16.5; // Solat price index
    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'fuel',
      amount: estimatedCost,
      type: 'spent',
      nature: 'inside_custody',
      description: `حرق واستهلاك وقود سولار لـ ${eqItem.code} بقدر ${fuel} لتر أثناء أعمال الرصف الميدانية`,
      recipient: eqItem.operator,
      paymentMethod: 'اخرى'
    });

    addAuditLog('تشغيل وصيد الوقود', 'إدارة المعدات والتشغيل', `تسجيل ${hours} ساعة عمل و ${fuel} لتر وقود لـ ${eqItem.code}.`);
  };

  const handleAddMaintenanceOrder = (newOrder: Omit<MaintenanceOrder, 'id'>) => {
    const finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderWithId: MaintenanceOrder = {
      ...newOrder,
      id: `maint-${Date.now()}`,
      referenceNo: finalRef
    };
    setMaintenanceOrders(prev => [orderWithId, ...prev]);

    setEquipment(prev => prev.map(e => {
      if (e.id === newOrder.equipmentId) {
        return { ...e, status: 'under_maintenance' };
      }
      return e;
    }));

    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'equipment',
      amount: newOrder.cost,
      type: 'spent',
      nature: 'inside_custody',
      description: `تحرير أمر صيانة ميكانيكية لمركبة ${newOrder.equipmentCode}: ${newOrder.description}`,
      recipient: 'قسم ورشة الصيانة والزيوت الموقعية',
      paymentMethod: 'اخرى',
      referenceNo: finalRef
    });

    addAuditLog('إرسال أمر صيانة', 'إدارة المعدات والتشغيل', `قيد أمر صيانة وإصلاح بالمرجع ${finalRef} كلف ${newOrder.cost} ج.م لـ ${newOrder.equipmentCode}.`);
  };

  const handleAddLabTest = (newTest: Omit<LabTestRecord, 'id'>) => {
    const finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const testWithId: LabTestRecord = {
      ...newTest,
      id: `test-${Date.now()}`,
      referenceNo: finalRef
    };
    setLabTests(prev => [testWithId, ...prev]);
    addAuditLog('تسجيل نتيجة مختبر', 'مراقبة الجودة QA/QC', `إصدار رخصة دمك بالمرجع ${finalRef} تتبع ${newTest.testNameAr} برقم طلب فحص ${newTest.rfiCode} (${newTest.resultStatus === 'passed' ? 'مطابق' : 'راسب'}).`);
  };

  const handleAddHseIncident = (newIncident: Omit<HseIncidentRecord, 'id'>) => {
    const finalRef = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const incidentWithId: HseIncidentRecord = {
      ...newIncident,
      id: `hse-${Date.now()}`,
      referenceNo: finalRef
    };
    setHseIncidents(prev => [incidentWithId, ...prev]);
    addAuditLog('تبليغ أمان HSE', 'السلامة والصحة المهنية HSE', `رصد حالة ${newIncident.typeNameAr} بالمرجع ${finalRef} بمستوى خطورة حرج ${newIncident.severity}.`);
  };

  const handleUpdateWbsProgress = (taskId: string, progress: number) => {
    const task = wbsTasks.find(t => t.id === taskId);
    if (!task) return;

    setWbsTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const status = progress === 100 ? 'completed' : (progress < t.plannedProgress ? 'behind' : 'on_track');
        return {
          ...t,
          actualProgress: progress,
          status
        };
      }
      return t;
    }));

    if (progress > task.actualProgress) {
      const addedValue = ((progress - task.actualProgress) / 100) * 150000;
      handleAddTransaction({
        date: new Date().toISOString().split('T')[0],
        category: 'supplies',
        amount: addedValue,
        type: 'executed_work',
        nature: 'inside_custody',
        description: `أشغال طريق حقيقية WBS: تقدم البند ${task.name} من منجز ${task.actualProgress}% إلى ${progress}%`,
        recipient: 'القسم المدني الهندسي',
        paymentMethod: 'اخرى'
      });
    }

    addAuditLog('توجيه تقدّم WBS', 'التخطيط والجدولة', `تحديث تشوينات وإنجاز الفقرة ${task.wbsCode} لتصبح نسبة المنفذ ${progress}%.`);
  };

  const handleDispatchWarehouseItem = (itemId: string, qty: number, recipient: string, purpose: string) => {
    const item = warehouseItems.find(i => i.id === itemId);
    if (!item) return;

    setWarehouseItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          currentStock: Math.max(0, i.currentStock - qty)
        };
      }
      return i;
    }));

    const materialsAssignedVal = qty * 480;
    handleAddTransaction({
      date: new Date().toISOString().split('T')[0],
      category: 'supplies',
      amount: materialsAssignedVal,
      type: 'spent',
      nature: 'inside_custody',
      description: `صرف وإفراج عن كميات ${qty} ${item.unit} من صنف ${item.name} للموقع لاستعمال ${recipient} في ${purpose}`,
      recipient: recipient,
      paymentMethod: 'اخرى'
    });

    addAuditLog('سحب وإذن صرف مخزني', 'إدارة المستودعات والمخازن', `صرف جزء مخزني من مادة ${item.code} لصالح المقاول ${recipient} لغرض ${purpose}.`);
  };

  // State reset
  const handleResetData = () => {
    localStorage.removeItem('bunyan_transactions');
    localStorage.removeItem('bunyan_custodies');
    localStorage.removeItem('bunyan_contractors');
    localStorage.removeItem('bunyan_equipment');
    localStorage.removeItem('bunyan_maint_orders');
    localStorage.removeItem('bunyan_lab_tests');
    localStorage.removeItem('bunyan_hse_incidents');
    localStorage.removeItem('bunyan_wbs_tasks');
    localStorage.removeItem('bunyan_warehouse');
    localStorage.removeItem('bunyan_audit_logs');
    localStorage.removeItem('bunyan_site_workers');
    localStorage.removeItem('bunyan_site_workers_attendance');
    localStorage.removeItem('bunyan_site_workers_salary_payments');

    setTransactions(INITIAL_TRANSACTIONS);
    setCustodies(INITIAL_CUSTODIES);
    setContractors(INITIAL_CONTRACTORS);
    setEquipment(INITIAL_EQUIPMENT);
    setMaintenanceOrders(INITIAL_MAINTENANCE_ORDERS);
    setLabTests(INITIAL_LAB_TESTS);
    setHseIncidents(INITIAL_HSE_INCIDENTS);
    setWbsTasks(INITIAL_WBS_TASKS);
    setWarehouseItems(INITIAL_WAREHOUSE);
    setAuditLogs(INITIAL_AUDIT_TRAIL);
    setWorkers(INITIAL_WORKERS);
    setAttendanceLogs([]);
    setSalaryPayments([]);
    setActiveTab('dashboard');
  };

  const getBackupPayload = () => {
    return {
      transactions,
      custodies,
      contractors,
      equipment,
      maintenanceOrders,
      labTests,
      hseIncidents,
      wbsTasks,
      warehouseItems,
      mrirLogs,
      mrnLogs,
      warehouseAuditLogs,
      auditLogs,
      workers,
      attendanceLogs,
      salaryPayments,
      extracts,
      projects,
      boqItems,
      submissions,
      subcontractors,
      supplyRecords,
      supplyItems,
      cubicCertificates,
      contractorsReport,
      fuelLogs,
      custodyBudget,
      equipmentSummary: equipmentList
    };
  };

  const handleDownloadLocalFile = () => {
    if (!selectedSite) {
      alert('فضلاً، يجب تسجيل موقع عمل نشط للتصدير.');
      return;
    }
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
    } catch (err: any) {
      alert('فشل إعداد التصدير المحلي للملف: ' + err.message);
    }
  };

  const handleRestoreBackup = (backupDoc: any) => {
    console.log("Restoring backup:", backupDoc);
    if (!backupDoc || typeof backupDoc !== 'object') {
      alert('ملف البيانات غير صالح الاستيراد.');
      return;
    }
    const data = backupDoc.payload || backupDoc;
    console.log("Backup payload data:", data);
    
    if (data.transactions) setTransactions(sanitizeLoadedData<Transaction>(data.transactions, 'tx'));
    if (data.custodies) setCustodies(sanitizeLoadedData<CustodyRecord>(data.custodies, 'cust'));
    if (data.contractors) setContractors(sanitizeLoadedData<ContractorCertificate>(data.contractors, 'sub'));
    if (data.equipment) setEquipment(sanitizeLoadedData<EquipmentRecord>(data.equipment, 'eq'));
    if (data.maintenanceOrders) setMaintenanceOrders(sanitizeLoadedData<MaintenanceOrder>(data.maintenanceOrders, 'maint'));
    if (data.labTests) setLabTests(sanitizeLoadedData<LabTestRecord>(data.labTests, 'test'));
    if (data.hseIncidents) setHseIncidents(sanitizeLoadedData<HseIncidentRecord>(data.hseIncidents, 'hse'));
    if (data.wbsTasks) setWbsTasks(sanitizeLoadedData<WbsTaskRecord>(data.wbsTasks, 'task'));
    if (data.warehouseItems) setWarehouseItems(sanitizeLoadedData<WarehouseItemRecord>(data.warehouseItems, 'wh'));
    if (data.mrirLogs) setMrirLogs(sanitizeLoadedData<MRIRRecord>(data.mrirLogs, 'mrir'));
    if (data.mrnLogs) setMrnLogs(sanitizeLoadedData<MRNRecord>(data.mrnLogs, 'mrn'));
    if (data.warehouseAuditLogs) setWarehouseAuditLogs(sanitizeLoadedData<AuditCountRecord>(data.warehouseAuditLogs, 'waudit'));
    if (data.auditLogs) setAuditLogs(sanitizeLoadedData<AuditTrailRecord>(data.auditLogs, 'audit'));
    if (data.workers) setWorkers(sanitizeLoadedData<SiteWorker>(data.workers, 'w'));
    if (data.attendanceLogs) setAttendanceLogs(data.attendanceLogs || []);
    if (data.salaryPayments) setSalaryPayments(data.salaryPayments || []);
    if (data.extracts) setExtracts(sanitizeLoadedData<CustomExtract>(data.extracts, 'ext'));
    if (data.projects) setProjects(sanitizeLoadedData<Project>(data.projects, 'p'));
    if (data.boqItems) setBoqItems(sanitizeLoadedData<BOQItem>(data.boqItems, 'boq'));
    if (data.submissions) setSubmissions(sanitizeLoadedData<Submission>(data.submissions, 'sub'));
    if (data.subcontractors) setSubcontractors(sanitizeLoadedData<Subcontractor>(data.subcontractors, 'sub'));
    if (data.equipmentSummary) setEquipmentList(sanitizeLoadedData<EquipmentSummary>(data.equipmentSummary, 'eqsum'));
    
    if (data.supplyRecords) setSupplyRecords(data.supplyRecords);
    if (data.supplyItems) setSupplyItems(data.supplyItems);
    if (data.cubicCertificates) setCubicCertificates(data.cubicCertificates);
    if (data.contractorsReport) setContractorsReport(data.contractorsReport);
    if (data.fuelLogs) setFuelLogs(data.fuelLogs);
    if (data.custodyBudget !== undefined) setCustodyBudget(data.custodyBudget);
    
    alert('تمت استعادة البيانات بنجاح!');
  };

  // Tab Router
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            categories={categories}
            transactions={transactions}
            setActiveTab={setActiveTab}
            supplyRecords={supplyRecords} // For now, or sync from firestore
            equipmentList={equipmentList}
            maintenanceOrders={maintenanceOrders}
            custodies={custodies}
            contractors={contractors}
            workers={workers}
            attendanceLogs={attendanceLogs}
            salaryPayments={salaryPayments}
            submissions={submissions}
            extracts={extracts}
            hseIncidents={hseIncidents}
            wbsTasks={wbsTasks}
            risks={risks}
            dcrRecords={dcrRecords}
            labTests={labTests}
            warehouseItems={warehouseItems}
            subcontractors={subcontractors}
            projects={projects}
            boqItems={boqItems}
            contracts={contracts}
          />
        );

      case 'transactions':
        return (
          <TransactionsTable 
            transactions={transactions} 
            onAddClick={() => setShowAddModal(true)} 
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            userRole={user?.role}
            selectedSiteName={selectedSite?.nameAr}
            fuelStations={fuelStations}
            addAuditLog={addAuditLog}
          />
        );

      case 'supplies':
        return (
          <SuppliesDashboard 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction} 
            supplyRecords={supplyRecords}
            supplyItems={supplyItems}
            cubicCertificates={cubicCertificates}
            contractorsReport={contractorsReport}
            workers={workers}
            custodies={custodies}
            setSupplyRecords={setSupplyRecords}
            setSupplyItems={setSupplyItems}
            setCubicCertificates={setCubicCertificates}
            setContractorsReport={setContractorsReport}
            userRole={user?.role}
            addAuditLog={addAuditLog}
            contracts={contracts}
          />
        );

      case 'subcontractors':
        return (
          <SubcontractorsDashboard 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction} 
            subcontractors={subcontractors}
            setSubcontractors={setSubcontractors}
            userRole={user?.role}
            addAuditLog={addAuditLog}
            contracts={contracts}
          />
        );

      case 'contracts':
        return (
          <ContractsDashboard
            contracts={contracts}
            setContracts={setContracts}
            projects={projects}
            subcontractors={subcontractors}
            setSubcontractors={setSubcontractors}
            suppliers={contractorsReport}
            workers={workers}
            userRole={user?.role}
            addAuditLog={addAuditLog}
          />
        );
      
      case 'risk-management':
        return (
          <RiskDashboard 
            risks={risks}
            setRisks={setRisks}
            projects={projects}
            workers={workers}
            addAuditLog={addAuditLog}
            userRole={user?.role}
          />
        );

      case 'quality-management':
        return (
          <QualityDashboard 
            labTests={labTests}
            setLabTests={setLabTests}
            projects={projects}
            addAuditLog={addAuditLog}
            userRole={user?.role}
          />
        );
      case 'hr':
        return (
          <SiteWorkersDashboard 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
            workers={workers}
            setWorkers={setWorkers}
            attendanceLogs={attendanceLogs}
            setAttendanceLogs={setAttendanceLogs}
            salaryPayments={salaryPayments}
            setSalaryPayments={setSalaryPayments}
            userRole={user?.role}
            addAuditLog={addAuditLog}
            contracts={contracts}
            defaultTab="hr-strategy"
          />
        );
      case 'inventory':
        return (
          <WarehouseDashboard
            warehouseItems={warehouseItems}
            setWarehouseItems={setWarehouseItems}
            mrirLogs={mrirLogs}
            setMrirLogs={setMrirLogs}
            mrnLogs={mrnLogs}
            setMrnLogs={setMrnLogs}
            warehouseAuditLogs={warehouseAuditLogs}
            setWarehouseAuditLogs={setWarehouseAuditLogs}
            projects={projects}
            userRole={user?.role}
            addAuditLog={addAuditLog}
          />
        );
      case 'planning':
        return (
          <PlanningDashboard
            wbsTasks={wbsTasks}
            setWbsTasks={setWbsTasks}
            boqItems={boqItems}
            projects={projects}
            transactions={transactions}
            contracts={contracts}
            userRole={user?.role}
            addAuditLog={addAuditLog}
          />
        );
      case 'hse':
        return <HSEDashboard user={user} projects={projects} addAuditLog={addAuditLog} auditLogs={auditLogs} selectedSite={selectedSite} />;
      case 'documents':
        return (
          <DocumentControlDashboard 
            dcrRecords={dcrRecords}
            setDcrRecords={setDcrRecords}
            projects={projects}
            boqItems={boqItems}
            workers={workers}
            userRole={user?.role}
            addAuditLog={addAuditLog}
          />
        );
      case 'crm':
        return selectedCustomer ? (
          <CrmDashboard
            customer={selectedCustomer}
            projects={projects}
            userRole={user?.role}
            addAuditLog={addAuditLog}
          />
        ) : (
          <CrmCustomerList
            customers={customers}
            onSelectCustomer={setSelectedCustomer}
            onAddCustomer={() => setShowAddCustomerModal(true)}
          />
        );
      case 'maintenance':
        return (
          <EquipmentDashboard 
            equipmentList={equipmentList}
            setEquipmentList={setEquipmentList}
            transactions={transactions}
            fuelLogs={fuelLogs}
            setFuelLogs={setFuelLogs}
            custodyBudget={custodyBudget}
            setCustodyBudget={setCustodyBudget}
            userRole={user?.role}
            addAuditLog={addAuditLog}
            maintenanceOrders={maintenanceOrders}
            setMaintenanceOrders={setMaintenanceOrders}
            initialTab="maintenance"
          />
        );

      case 'activity-log':
        return (
          <GlobalActivityLog 
            auditLogs={auditLogs}
            onClearLogs={user?.role === 'admin' ? () => setAuditLogs([]) : undefined}
            currentUserRole={user?.role}
          />
        );

      case 'projects':
        return (
          <ProjectsTab 
            projects={projects}
            setProjects={setProjects}
            boqItems={boqItems}
            currentUserRole={user?.role}
            onRestoreBackup={handleRestoreBackup}
            addAuditLog={addAuditLog}
          />
        );

      case 'extracts':
        return (
          <ExtractsTab 
            projectId={selectedSite.id}
            projects={projects} 
            boqItems={boqItems} 
            extracts={extracts}
            setExtracts={setExtracts}
            subcontractors={subcontractors}
            branding={{companyName: 'بنيان'}}
            extractType="Owner"
            userRole={userRole}
          />
        );

      case 'boq':
        return (
          <BOQTab 
            projectId={selectedSite.id}
            projects={projects}
            setProjects={setProjects}
            boqItems={boqItems}
            setBoqItems={setBoqItems}
            userRole={userRole}
          />
        );

      case 'site-workers':
        return (
          <SiteWorkersDashboard 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
            workers={workers}
            setWorkers={setWorkers}
            attendanceLogs={attendanceLogs}
            setAttendanceLogs={setAttendanceLogs}
            salaryPayments={salaryPayments}
            setSalaryPayments={setSalaryPayments}
            userRole={user?.role}
            addAuditLog={addAuditLog}
            contracts={contracts}
          />
        );

      case 'weekly-report':
        return (
          <WeeklyExpenseReport 
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            addAuditLog={addAuditLog}
            workers={workers}
            userRole={userRole}
            benodTree={weeklyReportBenodTree}
            setBenodTree={setWeeklyReportBenodTree}
            closingDayIndex={weeklyReportClosingDayIndex}
            setClosingDayIndex={setWeeklyReportClosingDayIndex}
            signatures={weeklyReportSignatures}
            setSignatures={setWeeklyReportSignatures}
          />
        );

      case 'deliveries':
        return (
          <SubmissionsTab 
            projectId={selectedSite.id}
            submissions={submissions}
            setSubmissions={setSubmissions}
            userRole={user?.role}
            userNameAr={user?.nameAr}
            addAuditLog={addAuditLog}
            workers={workers}
          />
        );

      case 'equipment-dashboard':
        return (
          <EquipmentDashboard 
            equipmentList={equipmentList}
            setEquipmentList={setEquipmentList}
            transactions={transactions}
            fuelLogs={fuelLogs}
            setFuelLogs={setFuelLogs}
            custodyBudget={custodyBudget}
            setCustodyBudget={setCustodyBudget}
            userRole={user?.role}
            addAuditLog={addAuditLog}
            maintenanceOrders={maintenanceOrders}
            setMaintenanceOrders={setMaintenanceOrders}
            initialTab="operation"
          />
        );

      case 'fuel-dashboard':
        return (
          <FuelDashboard 
            fuelLogs={fuelLogs} 
            setFuelLogs={setFuelLogs}
            custodyBudget={custodyBudget}
            setCustodyBudget={setCustodyBudget}
            fuelStations={fuelStations}
            setFuelStations={setFuelStations}
            equipment={equipmentList}
            transactions={transactions}
            workers={workers}
            userRole={user?.role}
            addAuditLog={addAuditLog}
          />
        );

      case 'admin-users':
        return (
          <UsersAdminPanel currentUser={user} auditLogs={auditLogs} />
        );

      case 'settings':
        return (
          <SettingsTab 
            selectedSite={selectedSite}
            getBackupPayload={getBackupPayload}
            onRestoreBackup={handleRestoreBackup}
            currentUser={user}
            currentUserRole={user?.role}
            dbConnected={dbConnected}
            triggerTestBackupReminder={triggerTestBackupReminder}
            currentThemeId={themeId}
            onThemeChange={setThemeId}
            currentBgType={bgType}
            onBgTypeChange={setBgType}
          />
        );

      case 'notifications':
        return (
          <NotificationsTab 
            currentUser={user}
            selectedSite={selectedSite}
            dbConnected={dbConnected}
          />
        );

      default:
        return (
          <TransactionsTable 
            transactions={transactions} 
            onAddClick={() => setShowAddModal(true)} 
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            userRole={user?.role}
            selectedSiteName={selectedSite?.nameAr}
            addAuditLog={addAuditLog}
          />
        );
    }
  };

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <LoginScreen 
          onLogin={(u) => { 
            setUser(u); 
            localStorage.setItem('bunyan_current_user', JSON.stringify(u)); 
            setIsDbLoaded(false); 
          }} 
          dbConnected={dbConnected}
          dbLatency={dbLatency}
        />
      </motion.div>
    );
  }

  if (!selectedSite) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
        <SiteSelectionScreen 
          user={user} 
          onSiteSelected={(site) => {
            setSelectedSite(site);
            localStorage.setItem('bunyan_current_site', JSON.stringify(site));
            setIsDbLoaded(false);
          }}
          onLogout={handleLogout}
          dbConnected={dbConnected}
          dbLatency={dbLatency}
        />
      </motion.div>
    );
  }

  if (!isDbLoaded) {
    return (
      <LoadingScreen 
        siteName={selectedSite.nameAr}
        primaryColor={COLOR_THEMES.find(t => t.id === themeId)?.primaryColor || '#4f46e5'}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-slate-50/75 flex relative z-10" 
      id="bunyan-app-root"
    >
      {/* Dynamic Animated Interactive Background */}
      <InteractiveBackground 
        type={bgType} 
        primaryColor={COLOR_THEMES.find(t => t.id === themeId)?.primaryColor || '#4f46e5'} 
      />
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        user={user}
        selectedSite={selectedSite}
        onLogout={handleLogout}
        onChangeSite={() => {
          setSelectedSite(null);
          setIsDbLoaded(false);
          loadedSiteIdRef.current = null;
          localStorage.removeItem('bunyan_current_site');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 md:mr-72 p-3 sm:p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300 overflow-x-hidden">
        
        {/* Dynamic Professional Header Info */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-6 mb-6 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-700 text-xs md:text-sm font-semibold">
              <Building size={14} className="text-purple-650 shrink-0" />
              <span className="font-black text-slate-800 truncate">{selectedSite.nameAr}</span>
            </div>
            <h1 className="text-base md:text-xl font-bold text-slate-900 tracking-tight mt-1 text-right font-sans">
              {activeTab === 'dashboard' && 'الصفحة الرئيسية'}
              {activeTab === 'projects' && 'المشروعات والإسناد'}
              {activeTab === 'settings' && 'إعدادات النظام والنسخ الاحتياطي السحابي'}
              {activeTab === 'transactions' && 'دفتر الحركات المالي'}
              {activeTab === 'supplies' && 'كشف التوريدات وبونات الاستلام'}
              {activeTab === 'contracts' && 'إدارة العقود'}
              {activeTab === 'deliveries' && 'لوج وتسجيل تسليمات الأعمال (طلبات فحص الموقع)'}
              {activeTab === 'weekly-report' && 'كشف المنصرف الأسبوعي والمراجع الذكي'}
              {activeTab === 'fuel-dashboard' && 'حركة وحساب المحروقات'}
              {activeTab === 'equipment-dashboard' && 'يوميات وتشغيل المعدات (السركي)'}
              {activeTab === 'admin-users' && 'لوحة التحكم بصلاحيات المستخدمين والمدراء'}
            </h1>
          </div>

          {/* Connection & Time block wrapper */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start lg:self-auto">

            {/* Trial badge with countdown */}
            {trialTimeLeft !== null && (
              <div className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-500/10 text-amber-800 flex items-center gap-1.5 text-[11px] font-bold font-sans animate-pulse">
                <Sparkles size={12} className="text-amber-600 shrink-0" />
                <span>نسخة تجريبية</span>
                <span className="bg-amber-600 text-white rounded px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-extrabold">
                  {Math.floor(trialTimeLeft / 60)}:{(trialTimeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}



            {/* Real-time DB Status Badge */}
            <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-bold transition-all duration-300 font-sans ${
              dbConnected === null 
                ? 'bg-amber-50/80 border-amber-200/80 text-amber-700' 
                : dbConnected
                ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
            }`}>
              <Database size={12} className={dbConnected === null ? 'animate-pulse text-amber-500' : 'text-current'} />
              <span className="hidden sm:inline text-slate-500 font-semibold">الحالة:</span>
              {dbConnected === null ? (
                <span className="flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin text-amber-500" />
                  <span>جاري الفحص...</span>
                </span>
              ) : dbConnected ? (
                <span className="flex items-center gap-1 text-emerald-600 font-mono">
                  <Wifi size={12} className="text-emerald-500" />
                  <span>متصل</span>
                  <span className="text-[9px] text-emerald-500 font-medium">({dbLatency}ms)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                  <WifiOff size={12} className="text-rose-500 shrink-0 animate-pulse" />
                  <span>غير متصل</span>
                </span>
              )}
            </div>

            {/* Time & Live Info Block */}
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 text-[11px] text-slate-600 font-bold font-mono">
              <div className="flex items-center gap-1 border-l border-slate-100 pl-2.5">
                <Calendar size={12} className="text-slate-400" />
                <span>{currentDate}</span>
              </div>
              <div className="flex items-center gap-1 font-sans">
                <Clock size={12} className="text-slate-400" />
                <span className="text-slate-950 font-black font-sans" dir="ltr">{currentTime}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Panel */}
        <main className="space-y-6">
          {/* Continuous Offline Write Prevention Warning Banner */}
          {dbConnected === false && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-right shadow-sm no-print" id="offline-prevent-write-banner">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100/80 border border-rose-200 rounded-xl text-rose-600 shrink-0 animate-pulse">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-rose-950 text-xs">تنبيه حماية التسجيل والنسخ الآمن مفعل ⚙️</h4>
                  <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                    تم رصد قطع في اتصال الشبكة بقاعدة البيانات السحابية (Firestore). لتجنب تباين السجلات وتداخل حسابات المستخدمين الآخرين، تم تعليق وتجميد الحفظ والمسح مؤقتاً لحين استرداد نبض الاتصال الآمن مع الإدارة المالية المركزية.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <div className="text-[10px] text-rose-900 bg-rose-100 px-3 py-1.5 rounded-lg font-bold animate-pulse">
                  جاري محاولة الاتصال تلقائياً كل 5 ثوانٍ...
                </div>
              </div>
            </div>
          )}
          
          {renderActiveTab()}
        </main>
      </div>

      {/* Pop up creation form modal */}
      {showAddModal && (
        <AddTransactionModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddTransaction} 
          subcontractors={subcontractors}
          setSubcontractors={setSubcontractors}
          equipmentList={equipmentList}
          contractorsReport={contractorsReport}
          setContractorsReport={setContractorsReport}
          workers={workers}
          fuelStations={fuelStations}
        />
      )}
      {showAddCustomerModal && (
        <AddCustomerModal 
          onClose={() => setShowAddCustomerModal(false)} 
          onSave={handleAddCustomer} 
        />
      )}

      {/* Real-time Administrative Broadcast Center Overlay */}
      <AnimatePresence>
        {showNotificationModal && activeNotifications.length > 0 && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-black text-slate-900">إشعارات لم تقرأها</h3>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{activeNotifications.length}</span>
              </div>
              
              <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-1">
                {activeNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="text-sm font-black text-slate-900">{notif.title}</h4>
                    <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{notif.content}</p>
                    <div className="text-[10px] text-slate-400 mt-3 font-mono">{new Date(notif.timestamp).toLocaleString('ar-EG')}</div>
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={handleDismissAll}
                  className="w-full py-4 bg-slate-950 text-white hover:bg-slate-800 rounded-2xl text-xs font-black shadow-lg hover:shadow-slate-500/10 active:scale-98 transition duration-200 cursor-pointer"
                >
                  أقرّ بقراءة جميع الإشعارات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backup Reminder Modal */}
      <AnimatePresence>
        {showBackupReminder && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col p-6 space-y-4"
            >
              <h3 className="text-lg font-black text-slate-900">تذكير بالنسخ الاحتياطي اليومي</h3>
              <p className="text-sm text-slate-600">حان وقت النسخ الاحتياطي اليومي لبياناتك. يرجى تحميل نسخة احتياطية محلية لضمان سلامة بياناتك.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleDownloadLocalFile();
                    setShowBackupReminder(false);
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black"
                >
                  تحميل النسخة الاحتياطية الآن
                </button>
                <button
                  onClick={() => setShowBackupReminder(false)}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl text-xs font-black"
                >
                  ليس الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Confirm Modal */}
      <AnimatePresence>
        {globalConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border-t-4 border-rose-600 p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-rose-700">تأكيد الإجراء النهائي للحذف</h3>
                <button 
                  onClick={() => globalConfirm.resolve(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <p className="mb-5 text-slate-600 text-xs font-bold leading-relaxed text-right">
                {globalConfirm.message}
              </p>
              
              <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl space-y-3 mb-5">
                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
                  أدخل كود التحقق لتأكيد الإجراء: <span className="bg-rose-100/80 px-2 py-0.5 rounded text-rose-700 text-sm ml-1 select-all font-mono tracking-widest">{globalConfirm.randomCode}</span>
                </label>
                <input 
                  type="text"
                  value={globalConfirmInput}
                  onChange={(e) => setGlobalConfirmInput(e.target.value)}
                  placeholder="أدخل الكود هنا..."
                  className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-center font-mono text-base focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-800"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2.5">
                <button 
                  type="button"
                  onClick={() => {
                    if (globalConfirmInput === globalConfirm.randomCode) {
                      globalConfirm.resolve(true);
                    } else {
                      alert('كود التأكيد غير صحيح. يرجى المحاولة مرة أخرى.');
                    }
                  }}
                  disabled={globalConfirmInput !== globalConfirm.randomCode}
                  className={`py-3.5 px-6 font-black rounded-xl transition duration-200 text-xs shadow-lg flex-1 active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                    globalConfirmInput === globalConfirm.randomCode
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  تأكيد وبدء الإجراء
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    globalConfirm.resolve(false);
                  }}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition duration-200 border border-slate-200 cursor-pointer flex-1 text-center"
                >
                  إلغاء وتراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
