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
  ChevronUp
} from 'lucide-react';
import BunyanLogo from './BunyanLogo';

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
  const checkPerm = (key: keyof UserModulePermissions): boolean => {
    if (user?.role === 'admin') return true;
    return user?.permissions?.[key] !== 'none';
  };

  const menuItems = [
    { id: 'dashboard', label: 'الصفحة الرئيسية', subtitle: 'Dashboard', icon: Home, perm: true },
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
      itemIds: ['dashboard']
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
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-72 bg-[#fcfbfd] border-l border-slate-200 text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-lg
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 h-screen
      `}>
        {/* Upper Side: Logo & Header */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setIsOpen(false);
            }}
            className="w-full shrink-0 text-right p-5 border-b border-slate-200 flex items-center justify-start hover:bg-purple-50 bg-white transition-all duration-300 group outline-none focus:ring-2 focus:ring-purple-500/10"
            title="العودة إلى الرئيسية"
          >
            <div className="relative inline-flex items-center justify-start gap-3 p-1 rounded-xl transition-colors">
              <div className="relative flex items-center justify-center p-0 rounded-xl transition-all duration-300">
                <BunyanLogo 
                  className="h-10 w-auto transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 drop-shadow-md" 
                  iconClassName="fill-slate-700 group-hover:fill-purple-650"
                  barsClassName="fill-purple-650 group-hover:fill-purple-500"
                  dotClassName="fill-purple-650 group-hover:fill-purple-400"
                />
                {/* Modern subtle glow behind the logo */}
                <div className="absolute inset-0 bg-purple-550/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="text-right">
                <h1 className="font-extrabold text-base tracking-wide text-slate-900 group-hover:text-purple-650 transition-colors font-sans">بنيان</h1>
                <p className="text-[10px] text-slate-550 font-bold group-hover:text-slate-700 transition-colors">نظام بنيان الذكي لإدارة المشروعات والتكاليف</p>
              </div>
            </div>
          </button>

          {/* Navigation Links with Collapsible Categories */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 
            [&::-webkit-scrollbar]:w-2 
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-track]:hover:bg-slate-200/30
            [&::-webkit-scrollbar-thumb]:bg-slate-300 
            [&::-webkit-scrollbar-thumb]:rounded-full 
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-400
            transition-colors duration-200
          ">
            {categories.map((category) => {
              const categoryItems = getCategoryItems(category.itemIds);
              if (categoryItems.length === 0) return null; // Hide category if no visible items

              const isExpanded = openCategories[category.id];
              const isSomeActive = categoryItems.some(i => i.id === activeTab);

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header Button */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-right font-sans outline-none
                      ${isSomeActive 
                        ? 'bg-purple-50/40 text-purple-700 border-r-2 border-purple-600' 
                        : 'text-slate-800 hover:bg-slate-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-650"></span>
                      <div>
                        <span className="block text-xs font-bold font-sans tracking-tight text-slate-900">
                          {category.title}
                        </span>
                        <span className="block text-[8px] font-mono font-bold tracking-wider uppercase opacity-60">
                          {category.subtitle}
                        </span>
                      </div>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Grouped Sub-items */}
                  {isExpanded && (
                    <div className="pr-2 mr-1 space-y-1 border-r border-slate-200 transition-all duration-300">
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
                              w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-right group outline-none
                              ${isActive 
                                ? 'bg-purple-50/90 text-purple-750 font-bold border-r-4 border-purple-650 shadow-sm shadow-purple-500/5' 
                                : 'text-slate-600 hover:bg-slate-100 hover:text-black'
                              }
                            `}
                            id={`nav-item-${item.id}`}
                          >
                            <Icon 
                              size={16} 
                              className={`transition-transform duration-150 group-hover:scale-105 ${isActive ? 'text-purple-650' : 'text-slate-400 group-hover:text-purple-650'}`} 
                            />
                            <div className="flex-1">
                              <span className="block text-xs font-semibold">{item.label}</span>
                              <span className={`block text-[9px] font-mono leading-none mt-0.5 ${isActive ? 'text-purple-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                {item.subtitle}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
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
            <span>بنيان ERP v2.5</span>
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
