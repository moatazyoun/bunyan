import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Coins, 
  FileCheck, 
  FileSpreadsheet, 
  FolderOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import sub-modules
import SuppliesAccountTab from './SuppliesAccountTab';
import SuppliesRecordsTab from './SuppliesRecordsTab';
import SuppliesCubicTab from './SuppliesCubicTab';
import SuppliesSettingsTab from './SuppliesSettingsTab';

import { SupplyRecord, SupplyItem, CubicCertificate, SiteWorker } from '../types';

interface SuppliesDashboardProps {
  transactions?: any[];
  onAddTransaction?: (tx: any) => void;
  supplyRecords: SupplyRecord[];
  supplyItems: SupplyItem[];
  cubicCertificates: CubicCertificate[];
  contractorsReport: any[];
  workers: SiteWorker[];
  setSupplyRecords: (records: SupplyRecord[]) => void;
  setSupplyItems: (items: SupplyItem[]) => void;
  setCubicCertificates: (certs: CubicCertificate[]) => void;
  setContractorsReport: (report: any[]) => void;
}

export default function SuppliesDashboard({ 
  transactions = [], 
  onAddTransaction,
  supplyRecords,
  supplyItems,
  cubicCertificates,
  contractorsReport,
  workers,
  setSupplyRecords,
  setSupplyItems,
  setCubicCertificates,
  setContractorsReport
}: SuppliesDashboardProps) {
  // 1. Tab switches default: 'accounts' | 'records' | 'cubic' | 'settings'
  const [activeTab, setActiveTab] = useState<'accounts' | 'records' | 'cubic' | 'settings'>('accounts');

  // Derive Payments from Ledger
  const supplierPayments = transactions.filter(t => t.category === 'supplies' && t.type === 'spent');

  // 3. Suppliers derived from contractorsReport (needs mapping in App.tsx or derived here)
  const suppliers = contractorsReport;

  // Central reconciliation function for all supply tickets depending on dynamic periods of cubic certificates
  const reconcileAllSupplyRecords = useMemo(() => (
    records: SupplyRecord[],
    certs: CubicCertificate[]
  ): SupplyRecord[] => {
    try {
      return records.map(rec => {
        // 1. Check if the ticket uses truck delivery method or is related to cubic capacity
        if (rec.supplyMethod !== 'truck' && rec.supplyMethod !== 'cubic') {
          return rec;
        }

        // 2. Find the supplier for this receipt
        const supplierObj = contractorsReport.find(s => s.name === rec.supplierName);
        if (!supplierObj || !supplierObj.deliveryMethods) return rec;

        // 3. Match the dumper/truck by plate number
        const dumper = supplierObj.deliveryMethods.find((dm: any) => 
          dm.dumperNumber === rec.truckPlate || 
          dm.truckNumber === rec.truckPlate
        );
        if (!dumper) return rec;

        // 4. Find the valid cubic certificate for this dumper on the ticket's date
        const dumperCerts = certs.filter(c => c.dumperId === dumper.id);
        
        const matchingCert = dumperCerts.find(c => {
          const start = c.startDate || '1970-01-01';
          const end = c.endDate || '9999-12-31';
          return rec.date >= start && rec.date <= end;
        });

        if (matchingCert) {
          const qualityD = rec.qualityDiscount || 0;
          const loadD = rec.loadDiscount || 0;
          const certCapacity = matchingCert.netCubic ?? matchingCert.totalCubic ?? dumper.cubicCapacity;
          const rawQuantity = typeof certCapacity === 'number' ? certCapacity : (parseFloat(certCapacity) || rec.rawQuantity);
          const netQuantity = Math.max(0, rawQuantity - qualityD - loadD);
          const totalCost = netQuantity * rec.unitPrice;

          return {
            ...rec,
            cubicCertificateId: matchingCert ? matchingCert.id : undefined,
            rawQuantity,
            netQuantity,
            totalCost
          };
        } else {
          // Fallback to default vehicle capacity if no certificate covers this date
          const qualityD = rec.qualityDiscount || 0;
          const loadD = rec.loadDiscount || 0;
          const capacity = dumper.cubicCapacity;
          const rawQuantity = typeof capacity === 'number' ? capacity : (parseFloat(capacity) || rec.rawQuantity);
          const netQuantity = Math.max(0, rawQuantity - qualityD - loadD);
          const totalCost = netQuantity * rec.unitPrice;

          return {
            ...rec,
            cubicCertificateId: undefined,
            rawQuantity,
            netQuantity,
            totalCost
          };
        }
      });
    } catch (err) {
      console.error("Reconciliation error:", err);
      return records;
    }
  }, [contractorsReport]);

  // Run automatically when certificates or contractors report updates to reconcile historical data
  useEffect(() => {
    if (supplyRecords.length > 0 && cubicCertificates.length > 0) {
      const reconciled = reconcileAllSupplyRecords(supplyRecords, cubicCertificates);
      const hasDiff = reconciled.some((rec, index) => {
        const orig = supplyRecords[index];
        return !orig || 
               orig.netQuantity !== rec.netQuantity || 
               orig.cubicCertificateId !== rec.cubicCertificateId || 
               orig.rawQuantity !== rec.rawQuantity;
      });
      if (hasDiff) {
        setSupplyRecords(reconciled);
      }
    }
  }, [cubicCertificates, contractorsReport, reconcileAllSupplyRecords, supplyRecords, setSupplyRecords]);

  // Operations handlers
  const handleAddRecord = (rec: SupplyRecord) => {
    const updated = [rec, ...supplyRecords];
    const reconciled = reconcileAllSupplyRecords(updated, cubicCertificates);
    setSupplyRecords(reconciled);
  };

  const handleUpdateRecord = (id: string, updates: Partial<SupplyRecord>) => {
    const updated = supplyRecords.map(r => r.id === id ? { ...r, ...updates } : r);
    const reconciled = reconcileAllSupplyRecords(updated, cubicCertificates);
    setSupplyRecords(reconciled);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = supplyRecords.filter(r => r.id !== id);
    const reconciled = reconcileAllSupplyRecords(updated, cubicCertificates);
    setSupplyRecords(reconciled);
  };

  // Create certificate AND link its tickets
  const handleAddCertificate = (cert: CubicCertificate, attachedTicketIds: string[]) => {
    let updatedCerts = [...cubicCertificates];

    // Check if we need to terminate an old certificate
    if (cert.oldCertIdToTerminate && cert.oldCertTerminationDate) {
      updatedCerts = updatedCerts.map(c => {
        if (c.id === cert.oldCertIdToTerminate) {
          return {
            ...c,
            endDate: cert.oldCertTerminationDate
          };
        }
        return c;
      });

      // Compute start date of the new certificate as day after termination date
      const termDate = new Date(cert.oldCertTerminationDate);
      termDate.setDate(termDate.getDate() + 1);
      cert.startDate = termDate.toISOString().split('T')[0];
    } else {
      // If there are other certificates for the same vehicle, we can default the start date to cert.date
      const existingOfDumper = cubicCertificates.filter(c => c.dumperId === cert.dumperId);
      if (existingOfDumper.length > 0) {
        cert.startDate = cert.date;
      } else {
        cert.startDate = '1970-01-01'; // Default start of time for the first cert
      }
    }

    updatedCerts = [cert, ...updatedCerts];
    setCubicCertificates(updatedCerts);

    // Reconcile all supply tickets based on the updated certificate set
    const reconciled = reconcileAllSupplyRecords(supplyRecords, updatedCerts);
    setSupplyRecords(reconciled);
  };

  const handleUpdateCertificate = (id: string, cert: CubicCertificate, attachedTicketIds: string[]) => {
    let updatedCerts = cubicCertificates.map(c => c.id === id ? cert : c);

    // Check if we need to terminate an old certificate during update
    if (cert.oldCertIdToTerminate && cert.oldCertTerminationDate) {
      updatedCerts = updatedCerts.map(c => {
        if (c.id === cert.oldCertIdToTerminate) {
          return {
            ...c,
            endDate: cert.oldCertTerminationDate
          };
        }
        return c;
      });

      const termDate = new Date(cert.oldCertTerminationDate);
      termDate.setDate(termDate.getDate() + 1);
      cert.startDate = termDate.toISOString().split('T')[0];
    }

    setCubicCertificates(updatedCerts);

    const reconciled = reconcileAllSupplyRecords(supplyRecords, updatedCerts);
    setSupplyRecords(reconciled);
  };

  // Delete certificate AND un-link tickets
  const handleDeleteCertificate = (id: string) => {
    const certToDelete = cubicCertificates.find(c => c.id === id);
    let updatedCerts = cubicCertificates.filter(c => c.id !== id);

    // If we deleted a certificate, and it had terminated another certificate, we should restore that old certificate's activity (clear its endDate)
    if (certToDelete && certToDelete.oldCertIdToTerminate) {
      updatedCerts = updatedCerts.map(c => {
        if (c.id === certToDelete.oldCertIdToTerminate) {
          return {
            ...c,
            endDate: undefined // restore back to infinite
          };
        }
        return c;
      });
    }

    setCubicCertificates(updatedCerts);

    const reconciled = reconcileAllSupplyRecords(supplyRecords, updatedCerts);
    setSupplyRecords(reconciled);
  };

  return (
    <div id="supplies-dashboard-wrapper" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-indigo-600" />
            إدارة التوريدات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بوابة جرد وإحصاء حركة تشوين المواد، تكعيب القلابات، تصفية الموردين وحسابات المدفوعات التراكمية
          </p>
        </div>
      </div>

      {/* Tabs list switches */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm inline-flex">
        
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'accounts' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Coins className="h-4 w-4" />
          كشف حساب الموردين
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'records' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          بيان التوريدات
        </button>

        <button
          onClick={() => setActiveTab('cubic')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'cubic' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          محاضر التكعيب ({cubicCertificates.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'settings' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          الخامات والموردين
        </button>

      </div>

      {/* Active tab content area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="focus:outline-none"
      >
        {activeTab === 'accounts' && (
          <SuppliesAccountTab 
            suppliers={suppliers}
            supplyRecords={supplyRecords}
            supplierPayments={supplierPayments}
            supplyItems={supplyItems}
            onAddTransaction={onAddTransaction}
            onAddRecord={handleAddRecord}
          />
        )}

        {activeTab === 'records' && (
          <SuppliesRecordsTab 
            supplyRecords={supplyRecords}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            supplyItems={supplyItems}
            suppliers={suppliers}
          />
        )}

        {activeTab === 'cubic' && (
          <SuppliesCubicTab 
            certificates={cubicCertificates}
            supplyRecords={supplyRecords}
            onAddCertificate={handleAddCertificate}
            onUpdateCertificate={handleUpdateCertificate}
            onDeleteCertificate={handleDeleteCertificate}
            suppliers={suppliers}
            setContractorsReport={setContractorsReport}
            supplyItems={supplyItems}
            workers={workers}
          />
        )}

        {activeTab === 'settings' && (
          <SuppliesSettingsTab 
            suppliers={suppliers}
            setContractorsReport={setContractorsReport}
            supplyItems={supplyItems}
            setSupplyItems={setSupplyItems}
            cubicCertificates={cubicCertificates}
          />
        )}
      </motion.div>

    </div>
  );
}
