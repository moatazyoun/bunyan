/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Menu, 
  X, 
  Activity,
  Briefcase,
  FileText,
  Truck,
  Home,
  Fuel,
  Users,
  LogOut,
  MapPin,
  Building,
  FileSpreadsheet,
  FileCheck,
  Settings,
  Bell,
  Scroll,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Package,
  Calendar,
  ShieldAlert,
  Wrench,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import BunyanLogo from './BunyanLogo';
import { motion } from 'motion/react';

import { UserItem, UserModulePermissions } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: UserItem | null;
  selectedSite: { id: string; nameAr: string; location: string } | null;
  onLogout: () => void;
  onChangeSite: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  user,
  selectedSite,
  onLogout,
  onChangeSite
}: SidebarProps) {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPerm = (key: keyof UserModulePermissions): boolean => {
    if (user?.role === 'admin') return true;
    return user?.permissions?.[key] !== 'none';
  };

  const menuItems = [
    { id: 'dashboard', label: 'الصفحة الرئيسية', subtitle: 'Dashboard', icon: Home, perm: true },
    { id: 'ai-fetcher', label: 'وكيل جلب أسعار AI', subtitle: 'AI Price Fetcher', icon: Sparkles, perm: true },
    { id: 'projects', label: 'المشروعات والإسناد', subtitle: 'Projects', icon: Briefcase, perm: checkPerm('projects') },
    { id: 'boq', label: 'المقايسة التثمنية', subtitle: 'Bill of Quantities', icon: FileText, perm: checkPerm('boq') },
    { id: 'transactions', label: 'دفتر الحركات المالي', subtitle: 'Ledger', icon: Receipt, perm: checkPerm('transactions') },
    { id: 'supplies', label: 'إدارة التوريدات', subtitle: 'Supplies', icon: Truck, perm: checkPerm('supplies') },
    { id: 'subcontractors', label: 'مقاولين باطن', subtitle: 'Subcontractors', icon: Users, perm: checkPerm('subcontractors') },
    { id: 'extracts', label: 'المستخلصات الفنية', subtitle: 'Extracts', icon: FileSpreadsheet, perm: checkPerm('extracts') },
    { id: 'contracts', label: 'العقود', subtitle: 'Contracts', icon: Scroll, perm: true },
    { id: 'risk-management', label: 'إدارة المخاطر', subtitle: 'Risk Management', icon: AlertTriangle, perm: true },
    { id: 'quality-management', label: 'إدارة الجودة الشاملة', subtitle: 'Quality Management', icon: ShieldCheck, perm: true },
    { id: 'inventory', label: 'المخازن والمستودعات', subtitle: 'Inventory', icon: Package, perm: true },
    { id: 'planning', label: 'الجدولة الزمنية', subtitle: 'Planning', icon: Calendar, perm: true },
    { id: 'hse', label: 'الصحة والسلامة المهنية', subtitle: 'HSE', icon: ShieldAlert, perm: true },
    { id: 'documents', label: 'إدارة الوثائق', subtitle: 'Documents', icon: FileText, perm: true },
    { id: 'crm', label: 'إدارة العملاء', subtitle: 'CRM', icon: Users, perm: true },
    { id: 'activity-log', label: 'سجل النشاطات', subtitle: 'Activity Log', icon: Activity, perm: true },
    { id: 'deliveries', label: 'التسليمات وفحص الأعمال', subtitle: 'Deliveries & Inspection', icon: FileCheck, perm: checkPerm('deliveries') },
    { id: 'site-workers', label: 'العاملين بالموقع', subtitle: 'Site Workers', icon: Users, perm: checkPerm('siteWorkers') },
    { id: 'fuel-dashboard', label: 'حساب المحروقات', subtitle: 'Fuel Log', icon: Fuel, perm: checkPerm('fuelDashboard') },
    { id: 'equipment-dashboard', label: 'بيان المعدات والآلات', subtitle: 'Equipment Log', icon: LayoutDashboard, perm: checkPerm('equipmentDashboard') },
    { id: 'weekly-report', label: 'المنصرف الأسبوعي', subtitle: 'Weekly Report', icon: FileText, perm: checkPerm('weeklyReport') },
    { id: 'notifications', label: 'مركز الإشعارات', subtitle: 'Notification Center', icon: Bell, perm: true },
    { 
      id: 'admin-users', 
      label: 'حسابات المستخدمين والصلاحيات', 
      subtitle: 'User Roles', 
      icon: Users, 
      perm: user?.role === 'admin' || user?.permissions?.usersManagement !== 'none' 
    },
    { id: 'settings', label: 'الإعدادات', subtitle: 'Settings', icon: Settings, perm: true },
  ];

  // Define logical menu groups / categories
  const categories = [
    {
      id: 'control',
      title: 'لوحة التحكم والتحليلات',
      subtitle: 'Dashboard & Reports',
      itemIds: ['dashboard', 'ai-fetcher']
    },
    {
      id: 'technical',
      title: 'المكتب الفني والتخطيط',
      subtitle: 'Engineering & Planning',
      itemIds: ['projects', 'boq', 'planning', 'deliveries', 'documents']
    },
    {
      id: 'financial',
      title: 'الإدارة المالية والتعاقدات',
      subtitle: 'Finance & Contracts',
      itemIds: ['transactions', 'weekly-report', 'contracts', 'subcontractors', 'extracts']
    },
    {
      id: 'logistics',
      title: 'العمليات واللوجستيات',
      subtitle: 'Operations & Logistics',
      itemIds: ['supplies', 'inventory', 'fuel-dashboard', 'equipment-dashboard']
    },
    {
      id: 'site',
      title: 'الموقع والقوى البشرية',
      subtitle: 'Site & Human Resources',
      itemIds: ['site-workers', 'hse']
    },
    {
      id: 'governance',
      title: 'الحوكمة والإدارة العامة',
      subtitle: 'Governance & Settings',
      itemIds: ['crm', 'risk-management', 'quality-management', 'activity-log', 'notifications', 'admin-users', 'settings']
    }
  ];

  // Keep state for collapsed categories
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({
    control: true,
    technical: true,
    financial: false,
    logistics: false,
    site: false,
    governance: false,
  });

  // Auto-expand active category
  React.useEffect(() => {
    const parentCategory = categories.find(cat => cat.itemIds.includes(activeTab));
    if (parentCategory) {
      setOpenCategories(prev => ({
        ...prev,
        [parentCategory.id]: true
      }));
    }
  }, [activeTab]);

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Get visible items for a category
  const getCategoryItems = (itemIds: string[]) => {
    return menuItems.filter(item => itemIds.includes(item.id) && item.perm === true);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 hover:bg-slate-800 transition"
          id="mobile-menu-btn"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        dir="rtl"
        className={`
          fixed inset-y-0 right-0 z-40 w-72 bg-white border-l border-slate-150 text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-[0_0_40px_rgba(139,92,246,0.04)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 h-screen
        `}
      >
        {/* Upper Side: Logo & Header */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setIsOpen(false);
            }}
            className="w-full shrink-0 p-5 border-b border-slate-100 flex flex-row items-center justify-start gap-4 hover:bg-purple-50/30 bg-white transition-all duration-300 group outline-none focus:ring-2 focus:ring-purple-500/10 text-right select-none"
            title="العودة إلى الرئيسية"
          >
            {/* Logo container - perfectly static as requested */}
            <div 
              className="relative flex items-center justify-center p-2.5 rounded-2xl bg-purple-50/50 border border-purple-100 shrink-0"
            >
              <BunyanLogo 
                className="h-12 w-12" 
              />
            </div>

            {/* Text container (Title and subtitle) */}
            <div className="flex flex-col items-start text-right">
              <div className="flex items-center gap-2">
                <span 
                  className="font-black text-xl tracking-wide text-slate-900 group-hover:text-purple-700 transition-colors duration-300 font-sans"
                >
                  بنيان
                </span>
                
                {/* Real-time pulsing connection status indicator */}
                <span className="relative flex h-2.5 w-2.5 select-none" title={isOnline ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
              </div>
              <span 
                className="text-[11px] font-black text-slate-500 group-hover:text-purple-600 transition-colors duration-300 mt-0.5 font-sans whitespace-nowrap"
              >
                مدير المواقع الذكي
              </span>
            </div>
          </button>

          {/* Navigation Links with permanently visible Categories (No Dropdowns) */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5 
            [&::-webkit-scrollbar]:w-1.5 
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-track]:hover:bg-slate-200/20
            [&::-webkit-scrollbar-thumb]:bg-slate-200 
            [&::-webkit-scrollbar-thumb]:rounded-full 
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-300
            transition-colors duration-200
          ">
            {categories.map((category) => {
              const categoryItems = getCategoryItems(category.itemIds);
              if (categoryItems.length === 0) return null; // Hide category if no visible items

              const isSomeActive = categoryItems.some(i => i.id === activeTab);

              return (
                <div key={category.id} className="space-y-2">
                  {/* Category Section Header (Static, Non-collapsible) */}
                  <div className="px-3 py-1 flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSomeActive ? 'bg-purple-600 animate-pulse' : 'bg-slate-300'}`}></span>
                      <div className="text-right">
                        <span className="block text-[10.5px] font-black font-sans tracking-tight text-slate-900">
                          {category.title}
                        </span>
                        <span className="block text-[7.5px] font-mono font-black tracking-wider uppercase text-slate-400 mt-0.5">
                          {category.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grouped Sub-items - Always Visible */}
                  <div className="pr-3 mr-1 space-y-1 border-r border-slate-100">
                    {categoryItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsOpen(false); // Close drawer on mobile click
                          }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 text-right group outline-none
                            ${isActive 
                              ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/20' 
                              : 'text-slate-600 hover:bg-purple-50/40 hover:text-purple-950'
                            }
                          `}
                          id={`nav-item-${item.id}`}
                        >
                          <Icon 
                            size={15} 
                            className={`transition-transform duration-150 group-hover:scale-110 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} 
                          />
                          <div className="flex-1 text-right">
                            <span className="block text-xs font-bold leading-tight">{item.label}</span>
                            <span className={`block text-[9px] font-mono leading-none mt-0.5 ${isActive ? 'text-purple-200' : 'text-slate-400 group-hover:text-purple-500'}`}>
                              {item.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer: User profile and system version */}
        <div className="p-4 border-t border-slate-200 bg-slate-100/40 space-y-3">
          <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200/85 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-purple-650 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                {user?.nameAr ? user.nameAr.charAt(0) : 'م'}
              </div>
              <div className="overflow-hidden text-right">
                <p className="text-xs font-black text-slate-800 truncate leading-none">{user?.nameAr?.replace(/\s*\(?مدير التكاليف\)?/g, '') || 'مستخدم عام'}</p>
                <span className="inline-block mt-1 text-[8.5px] font-black text-purple-650 bg-purple-50/70 px-1.5 py-0.5 rounded-md border border-purple-100">
                  {user?.role === 'admin' && 'مدير البرنامج'}
                  {user?.role === 'projects_manager' && 'مدير مشروعات'}
                  {user?.role === 'site_manager' && 'مدير موقع'}
                  {user?.role === 'site_engineer' && 'مهندس موقع'}
                  {user?.role === 'tech_office' && 'مهندس مكتب فني'}
                  {user?.role === 'accountant' && 'محاسب مالي'}
                  {user?.role === 'supervisor' && 'مشرف'}
                  {user?.role === 'dc' && 'DC'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onChangeSite}
                className="p-1.5 text-slate-500 hover:text-purple-650 hover:bg-slate-100 rounded-lg transition"
                title="تغيير موقع العمل النشط"
                id="sidebar-change-site-btn"
              >
                <Building size={15} />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                title="تسجيل الخروج الآمن"
                id="sidebar-logout-btn"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 flex justify-between items-center font-mono">
            <span>بنيان ERP Enterprise v2.4</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              قيد الاتصال
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
