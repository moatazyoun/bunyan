import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, FileText, MessageSquare, List } from 'lucide-react';
import { CustomerRecord } from '../types';
import CrmOverview from './CrmOverview';
import CrmFinancials from './CrmFinancials';
import CrmCorrespondence from './CrmCorrespondence';
import CrmActivityLog from './CrmActivityLog';

interface CrmDashboardProps {
  customer?: CustomerRecord;
  projects?: any;
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

export default function CrmDashboard({ customer, projects, userRole, addAuditLog }: CrmDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'correspondence' | 'activity'>('overview');

  if (!customer) {
    return <div className="text-center p-10 text-slate-500">لا يوجد بيانات للعميل</div>;
  }

  const tabs = [
    { id: 'overview', label: 'النظرة العامة', icon: Users },
    { id: 'financials', label: 'البيانات المالية والعقود', icon: FileText },
    { id: 'correspondence', label: 'المراسلات والمهام', icon: MessageSquare },
    { id: 'activity', label: 'سجل النشاطات', icon: List },
  ] as const;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <header className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{customer.name}</h1>
        <p className="text-sm text-slate-500 mt-2">إدارة بيانات العميل والمشاريع</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 1, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1 }}
          >
            {activeTab === 'overview' && <CrmOverview customer={customer} />}
            {activeTab === 'financials' && <CrmFinancials />}
            {activeTab === 'correspondence' && <CrmCorrespondence />}
            {activeTab === 'activity' && <CrmActivityLog logs={customer.activityLogs} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
