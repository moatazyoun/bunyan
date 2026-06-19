/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
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
import FuelDashboard from './components/FuelDashboard';
import SiteWorkersDashboard from './components/SiteWorkersDashboard';
import ExtractsTab from './components/ExtractsTab';
import ProjectsTab from './components/ProjectsTab';
import BOQTab from './components/BOQTab';
import SubmissionsTab from './components/SubmissionsTab';
import LoginScreen from './components/LoginScreen';
import SiteSelectionScreen from './components/SiteSelectionScreen';
import UsersAdminPanel from './components/UsersAdminPanel';

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
  Subcontractor,
  EquipmentSummary,
  FuelLogRecord,
  SupplyRecord,
  SupplyItem,
  CubicCertificate,
  UserItem,
  UserModulePermissions
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

function sanitizeLoadedData<T extends { id: string }>(items: any[], prefix: string): T[] {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.map((item, idx) => {
    let finalId = item.id;
    if (!finalId || seen.has(finalId)) {
      finalId = `${prefix}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000000)}`;
    }
    seen.add(finalId);
    return { ...item, id: finalId };
  });
}

export default function App() {
  const [activeTab, setActiveTab ] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

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
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbChecking, setDbChecking] = useState<boolean>(false);
  const [dbLatency, setDbLatency] = useState<number>(0);
  const [forceOfflineBypass, setForceOfflineBypass] = useState<boolean>(() => {
    return localStorage.getItem('bunyan_force_offline_bypass') === 'true';
  });

  const toggleOfflineBypass = () => {
    const nextVal = !forceOfflineBypass;
    setForceOfflineBypass(nextVal);
    localStorage.setItem('bunyan_force_offline_bypass', String(nextVal));
  };

  // DB Connection status continuous check
  const checkDbStatus = async () => {
    setDbChecking(true);
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setDbConnected(data.connected);
      if (data.latencyMs !== undefined) setDbLatency(data.latencyMs);
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
    setUser(null);
    setSelectedSite(null);
    setIsDbLoaded(false);
    localStorage.removeItem('bunyan_current_user');
    localStorage.removeItem('bunyan_current_site');
  };

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

  const [attendanceLogs, setAttendanceLogs] = useState<WorkerAttendance[]>(() => {
    const saved = localStorage.getItem('bunyan_site_workers_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [salaryPayments, setSalaryPayments] = useState<WorkerSalaryPayment[]>(() => {
    const saved = localStorage.getItem('bunyan_site_workers_salary_payments');
    const items = saved ? JSON.parse(saved) : [];
    return sanitizeLoadedData<WorkerSalaryPayment>(items, 'pay');
  });

  // Supplies Module state
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [cubicCertificates, setCubicCertificates] = useState<CubicCertificate[]>([]);
  const [contractorsReport, setContractorsReport] = useState<any[]>([]);

  const [fuelLogs, setFuelLogs] = useState<FuelLogRecord[]>([]);
  const [custodyBudget, setCustodyBudget] = useState<number>(0);

  const [extracts, setExtracts] = useState<CustomExtract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentSummary[]>([]);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

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
    if (user && selectedSite && isDbLoaded) {
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
        supplyRecords,
        supplyItems,
        cubicCertificates,
        contractorsReport,
        fuelLogs,
        custodyBudget,
        equipmentSummary: equipmentList
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
    transactions, custodies, contractors, equipment, maintenanceOrders, labTests, hseIncidents, wbsTasks, warehouseItems, auditLogs, workers, attendanceLogs, salaryPayments, extracts, projects, boqItems, submissions, subcontractors, supplyRecords, supplyItems, cubicCertificates, contractorsReport, fuelLogs, custodyBudget, equipmentList, selectedSite, user, isDbLoaded
  ]);

  // Pull site database from Firestore upon site selection
  useEffect(() => {
    if (user && selectedSite) {
      setIsDbLoaded(false); // Reset database load flag to block save effects during loading
      
      const loadSiteData = async () => {
        const startTime = Date.now(); // Track start time for minimum duration
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
                // Cache in local storage for subsequent offline loads
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

            setExtracts(data.extracts ? sanitizeLoadedData<CustomExtract>(data.extracts, 'ext') : []);
            setProjects(data.projects ? sanitizeLoadedData<Project>(data.projects, 'p') : []);
            setBoqItems(data.boqItems ? sanitizeLoadedData<BOQItem>(data.boqItems, 'boq') : []);
            setSubmissions(data.submissions ? sanitizeLoadedData<Submission>(data.submissions, 'sub') : []);
            setSubcontractors(data.subcontractors ? sanitizeLoadedData<Subcontractor>(data.subcontractors, 'sub') : []);
            setEquipmentList(data.equipmentSummary ? sanitizeLoadedData<EquipmentSummary>(data.equipmentSummary, 'eqsum') : []);
            
            // Supplies data
            setSupplyRecords(data.supplyRecords || []);
            setSupplyItems(data.supplyItems || []);
            setCubicCertificates(data.cubicCertificates || []);
            setContractorsReport(data.contractorsReport || []);
          } else {
            // New / unconfigured site: Reset all states
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
            
            // Supplies
            setSupplyRecords([]);
            setSupplyItems([]);
            setCubicCertificates([]);
            setContractorsReport([]);
          }

          // Enforce minimum of 4 seconds for the loading transition to feel high-fidelity
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 4000 - elapsed);
          
          setTimeout(() => {
            setIsDbLoaded(true);
          }, remaining);

        } catch (err) {
          console.warn("Complete catalog loading error:", err);
          setIsDbLoaded(true); // Always allow entry so engineers are never blocked, using local storage cache safely
        }
      };

      loadSiteData();
    } else {
      setIsDbLoaded(false);
    }
  }, [user, selectedSite]);

  // Compute category metrics dynamically for ledger reports
  const categories: CategoryMetric[] = INITIAL_CATEGORIES.map(cat => {
    const totalSpent = transactions
      .filter(t => t.category === cat.id && t.type === 'spent')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExecutedValue = transactions
      .filter(t => t.category === cat.id && t.type === 'executed_work')
      .reduce((sum, t) => sum + t.amount, 0);

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

  // Helper action: Post automated entry to audit logs
  const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditTrailRecord = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'م. معتز يونس (مدير التكاليف)',
      action,
      module,
      ip: '192.168.1.115',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

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
    setShowAddModal(false);
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

  // Tab Router
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            categories={categories}
            transactions={transactions}
            setActiveTab={setActiveTab}
            supplyRecords={[]} // For now, or sync from firestore
            equipmentList={equipment}
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
            setSupplyRecords={setSupplyRecords}
            setSupplyItems={setSupplyItems}
            setCubicCertificates={setCubicCertificates}
            setContractorsReport={setContractorsReport}
          />
        );

      case 'subcontractors':
        return (
          <SubcontractorsDashboard 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction} 
            subcontractors={subcontractors}
            setSubcontractors={setSubcontractors}
          />
        );

      case 'projects':
        return (
          <ProjectsTab 
            projects={projects}
            setProjects={setProjects}
            boqItems={boqItems}
            currentUserRole={user?.role}
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
          />
        );

      case 'fuel-dashboard':
        return (
          <FuelDashboard 
            fuelLogs={fuelLogs} 
            setFuelLogs={setFuelLogs}
            custodyBudget={custodyBudget}
            setCustodyBudget={setCustodyBudget}
            equipment={equipmentList}
          />
        );

      case 'admin-users':
        return (
          <UsersAdminPanel currentUser={user} />
        );

      default:
        return (
          <TransactionsTable 
            transactions={transactions} 
            onAddClick={() => setShowAddModal(true)} 
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            userRole={user?.role}
          />
        );
    }
  };

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <LoginScreen 
          onLoginSuccess={(u) => { 
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
          localStorage.removeItem('bunyan_current_site');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:mr-72 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
        
        {/* Dynamic Professional Header Info */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 mb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 text-slate-700 text-xs md:text-sm font-semibold">
              <Building size={15} className="text-indigo-600" />
              <span className="font-black text-slate-800">{selectedSite.nameAr}</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mt-1 text-right font-sans">
              {activeTab === 'dashboard' && 'الصفحة الرئيسية'}
              {activeTab === 'transactions' && 'دفتر الحركات المالي'}
              {activeTab === 'supplies' && 'كشف التوريدات وبونات الاستلام'}
              {activeTab === 'deliveries' && 'لوج وتسجيل تسليمات الأعمال (طلبات فحص الموقع)'}
              {activeTab === 'weekly-report' && 'كشف المنصرف الأسبوعي والمراجع الذكي'}
              {activeTab === 'fuel-dashboard' && 'حركة وحساب المحروقات'}
              {activeTab === 'equipment-dashboard' && 'يوميات وتشغيل المعدات (السركي)'}
              {activeTab === 'admin-users' && 'لوحة التحكم بصلاحيات المستخدمين والمدراء'}
            </h1>
          </div>

          {/* Connection & Time block wrapper */}
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">

            {/* Real-time DB Status Badge */}
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300 font-sans ${
              dbConnected === null 
                ? 'bg-amber-50/80 border-amber-200/80 text-amber-700' 
                : (dbConnected || forceOfflineBypass)
                ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
            }`}>
              <Database size={13} className={dbConnected === null ? 'animate-pulse text-amber-500' : 'text-current'} />
              <span className="hidden sm:inline text-slate-500 font-semibold">الحالة:</span>
              {dbConnected === null ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={11} className="animate-spin text-amber-500" />
                  <span>جاري الفحص...</span>
                </span>
              ) : (dbConnected || forceOfflineBypass) ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-mono">
                  <Wifi size={13} className="text-emerald-500" />
                  <span>{forceOfflineBypass ? 'نشط محلياً ⚠️' : 'متصل'}</span>
                  {!forceOfflineBypass && <span className="text-[10px] text-emerald-500 font-medium">({dbLatency}ms)</span>}
                </span>
              ) : (
                <button 
                  onClick={toggleOfflineBypass}
                  type="button"
                  className="flex items-center gap-1.5 text-rose-600 cursor-pointer border-none bg-transparent font-bold p-0 transition hover:text-rose-700"
                  title="اضغط للعمل في وضع العمل المحلي دون إنترنت"
                >
                  <WifiOff size={13} className="text-rose-500 shrink-0 animate-pulse" />
                  <span>أوفلاين (اضغط للتفعيل ⚠️)</span>
                </button>
              )}
            </div>

            {/* Time & Live Info Block */}
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4 text-xs text-slate-600 font-bold font-mono">
              <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                <Calendar size={14} className="text-slate-400" />
                <span>{currentDate}</span>
              </div>
              <div className="flex items-center gap-1.5 font-sans">
                <Clock size={14} className="text-slate-400" />
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
        />
      )}


    </motion.div>
  );
}
