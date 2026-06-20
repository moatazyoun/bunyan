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
  Bell
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

  // Filter menu items by permissions
  const visibleMenuItems = menuItems.filter(item => item.perm === true);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
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
        fixed inset-y-0 right-0 z-40 w-72 bg-slate-50 border-l border-slate-200 text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out
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
            className="w-full shrink-0 text-right p-5 border-b border-slate-200 flex items-center justify-start hover:bg-slate-100/70 transition-all duration-300 group outline-none focus:ring-2 focus:ring-indigo-500/20"
            title="العودة إلى الرئيسية"
          >
            <div className="relative inline-flex items-center justify-start gap-3 p-1 rounded-xl transition-colors">
              <div className="relative flex items-center justify-center p-0 rounded-xl transition-all duration-300">
                <BunyanLogo 
                  className="h-10 w-auto transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 drop-shadow-md" 
                  iconClassName="fill-slate-800 group-hover:fill-indigo-900"
                  barsClassName="fill-indigo-600 group-hover:fill-amber-500"
                  dotClassName="fill-indigo-600 group-hover:fill-indigo-500"
                />
                {/* Modern subtle glow behind the logo */}
                <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="text-right">
                <h1 className="font-bold text-base tracking-wide text-slate-900 group-hover:text-indigo-600 transition-colors font-sans">بنيان</h1>
                <p className="text-[11px] text-slate-500 font-bold group-hover:text-slate-700 transition-colors">نظام بنيان الذكي لإدارة المشروعات والتكاليف</p>
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 
            [&::-webkit-scrollbar]:w-2 
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-track]:hover:bg-slate-100/50
            [&::-webkit-scrollbar-thumb]:bg-slate-300/80 
            [&::-webkit-scrollbar-thumb]:rounded-full 
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-400
            transition-colors duration-200
          ">
            {visibleMenuItems.map((item) => {
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
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-205 text-right group
                    ${isActive 
                      ? 'bg-indigo-50/80 text-indigo-700 font-bold border-r-4 border-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                  id={`nav-item-${item.id}`}
                >
                  <Icon 
                    size={18} 
                    className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-650' : 'text-slate-400 group-hover:text-indigo-600'}`} 
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-semibold">{item.label}</span>
                    <span className={`block text-[9.5px] font-medium tracking-wider leading-none mt-0.5 ${isActive ? 'text-indigo-600/80' : 'text-slate-400 group-hover:text-slate-500'}`}>
                      {item.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: User profile and system version */}
        <div className="p-4 border-t border-slate-200 bg-slate-100/50 space-y-3">
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-200/40 rounded-lg">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.nameAr ? user.nameAr.charAt(0) : 'م'}
              </div>
              <div className="overflow-hidden text-right">
                <p className="text-xs font-extrabold text-slate-800 truncate leading-none">{user?.nameAr?.replace(/\s*\(?مدير التكاليف\)?/g, '') || 'مستخدم عام'}</p>
                <span className="inline-block mt-1 text-[8.5px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/40">
                  {user?.role === 'admin' && 'مدير البرنامج'}
                  {user?.role === 'projects_manager' && 'مدير مشروعات'}
                  {user?.role === 'site_manager' && 'مدير موقع'}
                  {user?.role === 'site_engineer' && 'مهندس موقع'}
                  {user?.role === 'tech_office' && 'مهندس مكتب فني'}
                  {user?.role === 'accountant' && 'محاسب مالي'}
                  {user?.role === 'supervisor' && 'مشرف'}
                  {user?.role === 'dc' && 'DC'}
                  {user?.role === 'viewer' && 'مراقب مشاهدة'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onChangeSite}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                title="تغيير موقع العمل النشط"
                id="sidebar-change-site-btn"
              >
                <Building size={15} />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="تسجيل الخروج الآمن"
                id="sidebar-logout-btn"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 flex justify-between items-center font-mono">
            <span>بنيان ERP v2.5</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] border border-emerald-100/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              قيد الاتصال
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
