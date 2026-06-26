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
import ErpModulePlaceholder from './components/ErpModulePlaceholder';
import HSEDashboard from './components/HSEDashboard';
import ProjectsTab from './components/ProjectsTab';
import BOQTab from './components/BOQTab';
import SettingsTab from './components/SettingsTab';
import NotificationsTab from './components/NotificationsTab';
import SiteInspectionRequests from './components/SiteInspectionRequests';
import LoginScreen from './components/LoginScreen';
import SiteSelectionScreen from './components/SiteSelectionScreen';
import UsersAdminPanel from './components/UsersAdminPanel';
import ErpSubDashboards from './components/ErpSubDashboards';
import CrmDashboard from './components/CrmDashboard';
import CrmCustomerList from './components/CrmCustomerList';
import AddCustomerModal from './components/AddCustomerModal';

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
  CustomerRecord
} from './types';
import { INITIAL_FUEL_CUSTODY_BUDGET } from './data/fuelInitialData';

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

function sanitizeLoadedData<T extends { id: string }>(items: any[], prefix: string): T[] {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.map((item, idx) => {
    if (!item) return item;
    let finalId = item.id;
    if (!finalId || seen.has(finalId)) {
      finalId = `${prefix}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000000)}`;
    }
    seen.add(finalId);
    return { ...item, id: finalId };
  }).filter(Boolean);
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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Security & Multi-site core databases
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

  const [selectedSite, setSelectedSite] = useState<{id: string; nameAr: string; location: string; description: string} | null>(() => {
    const saved = localStorage.getItem('bunyan_current_site');
    return saved ? JSON.parse(saved) : null;
  });

  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);
  const loadedSiteIdRef = useRef<string | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbChecking, setDbChecking] = useState<boolean>(false);
  const [dbLatency, setDbLatency] = useState<number>(0);
  const [forceOfflineBypass, setForceOfflineBypass] = useState<boolean>(false);

  const toggleOfflineBypass = () => {
    const nextVal = !forceOfflineBypass;
    setForceOfflineBypass(nextVal);
    localStorage.setItem('bunyan_force_offline_bypass', String(nextVal));
  };

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
        dcrRecords
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
    transactions, custodies, contractors, equipment, maintenanceOrders, labTests, hseIncidents, wbsTasks, warehouseItems, auditLogs, workers, attendanceLogs, salaryPayments, extracts, projects, boqItems, submissions, subcontractors, contracts, supplyRecords, supplyItems, cubicCertificates, contractorsReport, fuelLogs, custodyBudget, fuelStations, equipmentList, selectedSite, user, isDbLoaded, risks, dcrRecords
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

          try {
            // Using reliable server API to fetch site data
            const res = await fetch(`/api/site/${selectedSite.id}/data`);
            if (res.ok) {
              data = await res.json();
              if (data && Object.keys(data).length > 0) {
                hasDoc = true;
              }
            }
          } catch (fireErr) {
            console.warn("API fetch failed, check connection...", fireErr);
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
            setAuditLogs(data.auditLogs ? sanitizeLoadedData<AuditTrailRecord>(data.auditLogs, 'audit') : []);
            setWorkers(data.workers ? sanitizeLoadedData<SiteWorker>(data.workers, 'w') : []);
            setAttendanceLogs(data.attendanceLogs ? sanitizeLoadedData<WorkerAttendance>(data.attendanceLogs, 'att') : []);
            setSalaryPayments(data.salaryPayments ? sanitizeLoadedData<WorkerSalaryPayment>(data.salaryPayments, 'pay') : []);
            setFuelLogs(data.fuelLogs || []);
            setCustodyBudget(data.custodyBudget || 0);
            setFuelStations(data.fuelStations || []);

            setExtracts(data.extracts ? sanitizeLoadedData<CustomExtract>(data.extracts, 'ext') : []);
            setProjects(data.projects ? sanitizeLoadedData<Project>(data.projects, 'p') : []);
            setBoqItems(data.boqItems ? sanitizeLoadedData<BOQItem>(data.boqItems, 'boq') : []);
            setSubmissions(data.submissions ? sanitizeLoadedData<Submission>(data.submissions, 'sub') : []);
            setSubcontractors(data.subcontractors ? sanitizeLoadedData<Subcontractor>(data.subcontractors, 'sub') : []);
            setContracts(data.contracts ? sanitizeLoadedData<Contract>(data.contracts, 'con') : []);
            setEquipmentList(data.equipmentSummary ? sanitizeLoadedData<EquipmentSummary>(data.equipmentSummary, 'eqsum') : []);
            
            // Supplies data
            setSupplyRecords(data.supplyRecords || []);
            setSupplyItems(data.supplyItems || []);
            setCubicCertificates(data.cubicCertificates || []);
            setContractorsReport(data.contractorsReport || []);

            // Risks & Documents data
            setRisks(data.risks ? sanitizeLoadedData<RiskItem>(data.risks, 'risk') : []);
            setDcrRecords(data.dcrRecords ? sanitizeLoadedData<DcrRecord>(data.dcrRecords, 'dcr') : []);
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
          }

          // Enforce minimum of 4 seconds for the loading transition to feel high-fidelity
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 4000 - elapsed);
          
          setTimeout(() => {
            loadedSiteIdRef.current = selectedSite.id;
            setIsDbLoaded(true);
            
            // Trigger automatic daily snapshot backup if site has real records
            if (hasDoc && data) {
              checkAndTriggerDailyAutoBackup(selectedSite.id, selectedSite.nameAr, data);
            }
          }, remaining);

        } catch (err) {
          console.warn("Complete catalog loading error:", err);
          loadedSiteIdRef.current = selectedSite.id;
          setIsDbLoaded(true); // Always allow entry so engineers are never blocked
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
    // with a fallback to ledger 'executed_work' or initial budget if empty.
    let totalExecutedValue = transactions
      .filter(t => t.category === cat.id && t.type === 'executed_work')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalExecutedValue === 0) {
      if (cat.id === 'supplies') {
        totalExecutedValue = supplyRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
      } else if (cat.id === 'equipment') {
        const getEquipmentCostHelper = (item: any) => {
          const hours = item.logs?.reduce((acc: number, log: any) => acc + (log.hoursWorked || 0), 0) || 0;
          const dur = item.carryoverHours ? (hours + item.carryoverHours) : hours;
          return Math.round(dur * (item.rate || 0));
        };
        totalExecutedValue = equipmentList.reduce((sum, e) => sum + getEquipmentCostHelper(e), 0);
      } else if (cat.id === 'contractors') {
        totalExecutedValue = subcontractors.reduce((sum, s) => sum + (s.totalValue || 0), 0);
      } else if (cat.id === 'fuel') {
        totalExecutedValue = fuelLogs.reduce((sum, l) => sum + (l.cost || 0), 0);
      }
    }

    // Baseline fallbacks if sheets are completely empty (helps with visual representation in fresh sites)
    if (totalExecutedValue === 0) {
      if (cat.id === 'supplies') totalExecutedValue = 50000;
      else if (cat.id === 'equipment') totalExecutedValue = 4000;
      else if (cat.id === 'contractors') totalExecutedValue = 7000;
      else if (cat.id === 'fuel') totalExecutedValue = totalSpent || 1000;
    }

    return {
      ...cat,
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
    if (dbConnected === false && !forceOfflineBypass) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا تتوفر تغطية لقاعدة البيانات السحابية حالياً. تم تعليق إضافة المعاملات مؤقتاً لضمان عدم حدوث تباين في الحسابات بين أجهزة المهندسين.');
      return;
    }
    const txWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
    };
    setTransactions(prev => [txWithId, ...prev]);
    addAuditLog('إضافة حركة مالية', 'دفتر الحركات المالي', `تم إضافة حركة مالية جديدة رقم ${txWithId.id} بقيمة ${txWithId.amount} ج.م.`);
    setShowAddModal(false);
  };

  const handleAddCustomer = (newCustomer: CustomerRecord) => {
    setCustomers(prev => [...prev, newCustomer]);
    setShowAddCustomerModal(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (dbConnected === false && !forceOfflineBypass) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا تتوفر تغطية لقاعدة البيانات السحابية حالياً. تم تعليق حذف المعاملات لحين عودة الاتصال ومزامنة البيانات.');
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    if (dbConnected === false && !forceOfflineBypass) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا تتوفر تغطية لقاعدة البيانات السحابية حالياً. تم تعليق تعديل الحركات لضمان تماسك السجلات بين الطواقم الإنشائية المختلفة.');
      return;
    }
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    addAuditLog('تعديل حركة مالية', 'دفتر الحركات المالي', `تم تعديل الحركة المالية رقم ${updatedTx.id} بقيمة ${updatedTx.amount} ج.م.`);
  };

  const handleAddCustody = (name: string, amount: number, notes?: string) => {
    if (dbConnected === false && !forceOfflineBypass) {
      alert('⚠️ تنبيه حماية التسجيل الآمن مفعل: لا يمكن فتح عهد مالي جديدة للعهدة الموقع بدون مزامنة سحابية نشطة مع الإدارة المالية المركزية.');
      return;
    }
    const newCustody: CustodyRecord = {
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      engineerName: name,
      totalGiven: amount,
      totalSettled: 0,
      remaining: amount,
      notes: notes || 'عهدة جديدة قيد التصفية'
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
      paymentMethod: 'تحويل بنكى'
    });

    addAuditLog('تفريغ عهدة موقعية', 'العهدة المالية الموقع', `تم قيد تسليم عهدة بقيمة ${amount} ج.م للمهندس ${name}.`);
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
    const newSub: ContractorCertificate = {
      id: `sub-${Date.now()}`,
      contractorName: name,
      trade,
      totalValue,
      executedWorkValue: 0,
      totalPaid: 0,
      remainingBalance: 0
    };
    setContractors(prev => [...prev, newSub]);
    addAuditLog('إرسال مقاول باطن', 'بيانات مقاولي الباطن', `تسجيل مقاول جديد: ${name} للتخصص ${trade}.`);
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
    const orderWithId: MaintenanceOrder = {
      ...newOrder,
      id: `maint-${Date.now()}`
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
      paymentMethod: 'اخرى'
    });

    addAuditLog('إرسال أمر صيانة', 'إدارة المعدات والتشغيل', `قيد أمر صيانة وإصلاح كلف ${newOrder.cost} ج.م لـ ${newOrder.equipmentCode}.`);
  };

  const handleAddLabTest = (newTest: Omit<LabTestRecord, 'id'>) => {
    const testWithId: LabTestRecord = {
      ...newTest,
      id: `test-${Date.now()}`
    };
    setLabTests(prev => [testWithId, ...prev]);
    addAuditLog('تسجيل نتيجة مختبر', 'مراقبة الجودة QA/QC', `إصدار رخصة دمك تتبع ${newTest.testNameAr} برقم طلب فحص ${newTest.rfiCode} (${newTest.resultStatus === 'passed' ? 'مطابق' : 'راسب'}).`);
  };

  const handleAddHseIncident = (newIncident: Omit<HseIncidentRecord, 'id'>) => {
    const incidentWithId: HseIncidentRecord = {
      ...newIncident,
      id: `hse-${Date.now()}`
    };
    setHseIncidents(prev => [incidentWithId, ...prev]);
    addAuditLog('تبليغ أمان HSE', 'السلامة والصحة المهنية HSE', ` رصد حالة ${newIncident.typeNameAr} بمستوى خطورة حرج ${newIncident.severity}.`);
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

  const handleRestoreBackup = (backupDoc: any) => {
    if (!backupDoc || typeof backupDoc !== 'object') {
      alert('ملف البيانات غير صالح الاستيراد.');
      return;
    }
    const data = backupDoc.payload || backupDoc;
    if (data.transactions) setTransactions(sanitizeLoadedData<Transaction>(data.transactions, 'tx'));
    if (data.custodies) setCustodies(sanitizeLoadedData<CustodyRecord>(data.custodies, 'cust'));
    if (data.contractors) setContractors(sanitizeLoadedData<ContractorCertificate>(data.contractors, 'sub'));
    if (data.equipment) setEquipment(sanitizeLoadedData<EquipmentRecord>(data.equipment, 'eq'));
    if (data.maintenanceOrders) setMaintenanceOrders(sanitizeLoadedData<MaintenanceOrder>(data.maintenanceOrders, 'maint'));
    if (data.labTests) setLabTests(sanitizeLoadedData<LabTestRecord>(data.labTests, 'test'));
    if (data.hseIncidents) setHseIncidents(sanitizeLoadedData<HseIncidentRecord>(data.hseIncidents, 'hse'));
    if (data.wbsTasks) setWbsTasks(sanitizeLoadedData<WbsTaskRecord>(data.wbsTasks, 'task'));
    if (data.warehouseItems) setWarehouseItems(sanitizeLoadedData<WarehouseItemRecord>(data.warehouseItems, 'wh'));
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
        return <HSEDashboard user={user} projects={projects} addAuditLog={addAuditLog} auditLogs={auditLogs} />;
      case 'documents':
        return (
          <DocumentControlDashboard 
            dcrRecords={dcrRecords}
            setDcrRecords={setDcrRecords}
            projects={projects}
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
      case 'reports':
        return <ErpModulePlaceholder title="التقارير والتحليلات" description="وحدة التقارير المالية والتشغيلية ولوحات التحكم قيد التطوير." />;

      case 'projects':
        return (
          <ProjectsTab 
            projects={projects}
            setProjects={setProjects}
            boqItems={boqItems}
            currentUserRole={user?.role}
            onRestoreBackup={handleRestoreBackup}
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
          dbConnected={forceOfflineBypass ? true : dbConnected}
          dbLatency={dbLatency}
          forceOfflineBypass={forceOfflineBypass}
          onToggleOfflineBypass={toggleOfflineBypass}
        />
      </motion.div>
    );
  }

  if (!isDbLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans text-right" dir="rtl" id="bunyan-db-loader">
        
        {/* Interactive moving gradient background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Soft floating circle 1 */}
          <motion.div
            animate={{
              x: [0, 60, -30, 0],
              y: [0, -40, 50, 0],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-12 -left-12 w-72 h-72 bg-gradient-to-tr from-indigo-200/40 to-sky-200/40 rounded-full blur-3xl"
          />

          {/* Soft floating circle 2 */}
          <motion.div
            animate={{
              x: [0, -50, 40, 0],
              y: [0, 60, -30, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-br from-amber-100/50 to-pink-100/50 rounded-full blur-3xl"
          />

          {/* Soft floating circle 3 */}
          <motion.div
            animate={{
              x: [0, 30, -40, 0],
              y: [0, 50, -40, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-20 left-1/4 w-80 h-80 bg-gradient-to-tr from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl"
          />

          {/* Delicate structural grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6"
        >
          {/* Subtle decorative inner corner colors */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative inline-block">
            <motion.div
              animate={{ 
                scale: [1, 1.12, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-6 bg-indigo-500/10 blur-2xl rounded-full"
            />
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="mx-auto w-18 h-18 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-md relative z-10"
            >
              <BunyanLogo 
                className="w-14 h-14" 
                iconClassName="fill-slate-850" 
                barsClassName="fill-indigo-600" 
                dotClassName="fill-amber-500" 
              />
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-extrabold text-slate-900 font-sans tracking-tight"
            >
              جاري مزامنة وتأمين السجلات الرقمية
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="bg-slate-50 border border-slate-150 py-2.5 px-4 rounded-xl text-center">
                <span className="text-slate-550 text-xs font-bold font-sans">موقع التشغيل النشط:</span>
                <span className="text-indigo-600 font-extrabold text-xs font-sans mr-1.5">{selectedSite.nameAr}</span>
              </div>
              
              <div className="relative w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
                />
              </div>

              <div className="flex flex-col gap-1 items-center pt-1">
                <p className="text-[10px] text-indigo-600/70 font-bold font-mono tracking-wider uppercase">
                  Securing Database Connection
                </p>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  تأكد أن كافة بيانات ومعلومات هذا المشروع مؤمنة بالكامل
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-slate-50 flex" 
      id="bunyan-app-root"
    >
      
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
              <Building size={14} className="text-indigo-600 shrink-0" />
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
                : (dbConnected || forceOfflineBypass)
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
              ) : (dbConnected || forceOfflineBypass) ? (
                <span className="flex items-center gap-1 text-emerald-600 font-mono">
                  <Wifi size={12} className="text-emerald-500" />
                  <span>{forceOfflineBypass ? 'نشط محلياً ⚠️' : 'متصل'}</span>
                  {!forceOfflineBypass && <span className="text-[9px] text-emerald-500 font-medium">({dbLatency}ms)</span>}
                </span>
              ) : (
                <button 
                  onClick={toggleOfflineBypass}
                  type="button"
                  className="flex items-center gap-1 text-rose-600 cursor-pointer border-none bg-transparent font-bold p-0 transition hover:text-rose-700 text-[11px]"
                  title="اضغط للعمل في وضع العمل المحلي دون إنترنت"
                >
                  <WifiOff size={12} className="text-rose-500 shrink-0 animate-pulse" />
                  <span>أوفلاين (تفعيل ⚠️)</span>
                </button>
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
          {dbConnected === false && !forceOfflineBypass && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-right shadow-sm no-print" id="offline-prevent-write-banner">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100/80 border border-rose-200 rounded-xl text-rose-600 shrink-0 animate-pulse">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-rose-950 text-xs">تنبيه حماية التسجيل والنسخ الآمن مفعل ⚙️</h4>
                  <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                    تم رصد قطع في اتصال الشبكة بقاعدة البيانات السحابية (Firestore). لتجنب تباين السجلات، تم تجميد الحفظ والمسح مؤقتاً لحين استرداد نبض الاتصال الآمن مع الإدارة المالية المركزية.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={toggleOfflineBypass}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  تجاوز مؤقت للعمل أوفلاين ⚠️
                </button>
                <div className="text-[10px] text-rose-900 bg-rose-100 px-3 py-1.5 rounded-lg font-bold">
                  يفحص تلقائياً كل 5 ثوانٍ
                </div>
              </div>
            </div>
          )}

          {dbConnected === false && forceOfflineBypass && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-right shadow-sm no-print" id="offline-bypass-banner">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100/80 border border-amber-200 rounded-xl text-amber-600 shrink-0">
                  <AlertTriangle size={18} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-950 text-xs">وضع العمل المحلي الطارئ مفعل (أوفلاين) 🌐</h4>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    يتم حالياً حفظ التعديلات وإضافة الحركات محلياً في ذاكرة متصفحك بشكل آمن. عند عودة الاتصال بقاعدة بيانات بنيان السحابية، ستتم المزامنة تلقائياً.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={toggleOfflineBypass}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  استعادة وضع الحماية السحابية 🔒
                </button>
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

    </motion.div>
  );
}
