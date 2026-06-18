import { CategoryMetric, Transaction, CustodyRecord, ContractorCertificate, SiteWorker } from '../types';

export const INITIAL_CATEGORIES: CategoryMetric[] = [
  { id: 'supplies', nameAr: 'التوريدات والمواد', nameEn: 'Supplies & Materials', initialBudget: 0, totalSpent: 0, totalExecutedValue: 0, color: '#3B82F6' },
  { id: 'equipment', nameAr: 'المعدات', nameEn: 'Equipment & Machinery', initialBudget: 0, totalSpent: 0, totalExecutedValue: 0, color: '#8B5CF6' },
  { id: 'contractors', nameAr: 'مقاولين الباطن', nameEn: 'Subcontractors', initialBudget: 0, totalSpent: 0, totalExecutedValue: 0, color: '#F59E0B' },
  { id: 'fuel', nameAr: 'المحروقات والسولار', nameEn: 'Fuel & Energy', initialBudget: 0, totalSpent: 0, totalExecutedValue: 0, color: '#EF4444' },
  { id: 'custody', nameAr: 'العهد المالية بالموقع', nameEn: 'Site Petty Cash', initialBudget: 0, totalSpent: 0, totalExecutedValue: 0, color: '#10B981' },
  { id: 'other', nameAr: 'مصاريف أخرى متنوعة', nameEn: 'Miscellaneous & Other', initialBudget: 0, totalSpent: 0, totalExecutedValue: 0, color: '#64748b' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_CUSTODIES: CustodyRecord[] = [];
export const INITIAL_CONTRACTORS: ContractorCertificate[] = [];
export const INITIAL_WORKERS: SiteWorker[] = [];
