import React, { useState, useEffect } from 'react';
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

  // Operations handlers
  const handleAddRecord = (rec: SupplyRecord) => {
    setSupplyRecords([rec, ...supplyRecords]);
  };

  const handleUpdateRecord = (id: string, updates: Partial<SupplyRecord>) => {
    setSupplyRecords(supplyRecords.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeleteRecord = (id: string) => {
    setSupplyRecords(supplyRecords.filter(r => r.id !== id));
  };

  // Create certificate AND link its tickets
  const handleAddCertificate = (cert: CubicCertificate, attachedTicketIds: string[]) => {
    setCubicCertificates([cert, ...cubicCertificates]);
    setSupplyRecords(supplyRecords.map(rec => {
      if (attachedTicketIds.includes(rec.id)) {
        return {
          ...rec,
          cubicCertificateId: cert.id
        };
      }
      return rec;
    }));
  };

  const handleUpdateCertificate = (id: string, cert: CubicCertificate, attachedTicketIds: string[]) => {
    setCubicCertificates(cubicCertificates.map(c => c.id === id ? cert : c));
    
    // First, clear all records currently linked to this certificate
    const clearedRecords = supplyRecords.map(rec => {
      if (rec.cubicCertificateId === id) {
        return { ...rec, cubicCertificateId: undefined };
      }
      return rec;
    });

    // Then, link the new set of tickets
    setSupplyRecords(clearedRecords.map(rec => {
      if (attachedTicketIds.includes(rec.id)) {
        return { ...rec, cubicCertificateId: cert.id };
      }
      return rec;
    }));
  };

  // Delete certificate AND un-link tickets
  const handleDeleteCertificate = (id: string) => {
    setCubicCertificates(cubicCertificates.filter(c => c.id !== id));
    setSupplyRecords(supplyRecords.map(rec => {
      if (rec.cubicCertificateId === id) {
        return {
          ...rec,
          cubicCertificateId: undefined
        };
      }
      return rec;
    }));
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
