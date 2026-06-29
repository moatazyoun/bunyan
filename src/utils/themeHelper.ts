/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorTheme {
  id: string;
  nameAr: string;
  primaryColor: string; // hex
  variables: Record<string, string>;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'classic',
    nameAr: 'بنيان الكلاسيكي (أرجواني غامق / كحلي)',
    primaryColor: '#4f46e5',
    variables: {
      '--primary-50': '#f5f3ff',
      '--primary-100': '#ede9fe',
      '--primary-150': '#e0e7ff',
      '--primary-200': '#ddd6fe',
      '--primary-300': '#c084fc',
      '--primary-400': '#a855f7',
      '--primary-500': '#6366f1',
      '--primary-600': '#4f46e5',
      '--primary-650': '#4f46e5',
      '--primary-700': '#4338ca',
      '--primary-800': '#3730a3',
      '--primary-900': '#312e81',
      '--primary-950': '#1e1b4b',
    }
  },
  {
    id: 'royal-blue',
    nameAr: 'الأزرق الملكي الفخم (Royal Blue)',
    primaryColor: '#2563eb',
    variables: {
      '--primary-50': '#eff6ff',
      '--primary-100': '#dbeafe',
      '--primary-150': '#d0e1fd',
      '--primary-200': '#bfdbfe',
      '--primary-300': '#93c5fd',
      '--primary-400': '#60a5fa',
      '--primary-500': '#3b82f6',
      '--primary-600': '#2563eb',
      '--primary-650': '#1d4ed8',
      '--primary-700': '#1d4ed8',
      '--primary-800': '#1e40af',
      '--primary-900': '#1e3a8a',
      '--primary-950': '#172554',
    }
  },
  {
    id: 'emerald',
    nameAr: 'الأخضر الزمردي الهندسي',
    primaryColor: '#059669',
    variables: {
      '--primary-50': '#ecfdf5',
      '--primary-100': '#d1fae5',
      '--primary-150': '#c2f4da',
      '--primary-200': '#a7f3d0',
      '--primary-300': '#6ee7b7',
      '--primary-400': '#34d399',
      '--primary-500': '#10b981',
      '--primary-600': '#059669',
      '--primary-650': '#047857',
      '--primary-700': '#047857',
      '--primary-800': '#065f46',
      '--primary-900': '#064e3b',
      '--primary-950': '#022c22',
    }
  },
  {
    id: 'rose-red',
    nameAr: 'الأحمر الوردي الإنشائي الدافئ',
    primaryColor: '#e11d48',
    variables: {
      '--primary-50': '#fff1f2',
      '--primary-100': '#ffe4e6',
      '--primary-150': '#fecdd3',
      '--primary-200': '#fecdd3',
      '--primary-300': '#fda4af',
      '--primary-400': '#fb7185',
      '--primary-500': '#f43f5e',
      '--primary-600': '#e11d48',
      '--primary-650': '#be123c',
      '--primary-700': '#be123c',
      '--primary-800': '#9f1239',
      '--primary-900': '#881337',
      '--primary-950': '#4c0519',
    }
  },
  {
    id: 'charcoal-black',
    nameAr: 'الأسود الكربوني الفاخر',
    primaryColor: '#1e293b',
    variables: {
      '--primary-50': '#f8fafc',
      '--primary-100': '#f1f5f9',
      '--primary-150': '#e2e8f0',
      '--primary-200': '#cbd5e1',
      '--primary-300': '#94a3b8',
      '--primary-400': '#64748b',
      '--primary-500': '#475569',
      '--primary-600': '#1e293b',
      '--primary-650': '#0f172a',
      '--primary-700': '#0f172a',
      '--primary-800': '#020617',
      '--primary-900': '#000000',
      '--primary-950': '#000000',
    }
  },
  {
    id: 'amber-gold',
    nameAr: 'الأصفر الذهبي (معدات السلامة والرافعات)',
    primaryColor: '#d97706',
    variables: {
      '--primary-50': '#fffbeb',
      '--primary-100': '#fef3c7',
      '--primary-150': '#fde68a',
      '--primary-200': '#fde68a',
      '--primary-300': '#fcd34d',
      '--primary-400': '#fbbf24',
      '--primary-500': '#f59e0b',
      '--primary-600': '#d97706',
      '--primary-650': '#b45309',
      '--primary-700': '#b45309',
      '--primary-800': '#92400e',
      '--primary-900': '#78350f',
      '--primary-950': '#451a03',
    }
  },
  {
    id: 'teal-coast',
    nameAr: 'الأزرق الفيروزي الساحر (Teal Coast)',
    primaryColor: '#0d9488',
    variables: {
      '--primary-50': '#f0fdfa',
      '--primary-100': '#ccfbf1',
      '--primary-150': '#99f6e4',
      '--primary-200': '#5eead4',
      '--primary-300': '#2dd4bf',
      '--primary-400': '#14b8a6',
      '--primary-500': '#0d9488',
      '--primary-600': '#0d9488',
      '--primary-650': '#0f766e',
      '--primary-700': '#0f766e',
      '--primary-800': '#115e59',
      '--primary-900': '#134e4a',
      '--primary-950': '#042f2e',
    }
  },
  {
    id: 'violet-velvet',
    nameAr: 'البنفسجي الإمبراطوري المخملي (Violet)',
    primaryColor: '#7c3aed',
    variables: {
      '--primary-50': '#f5f3ff',
      '--primary-100': '#ede9fe',
      '--primary-150': '#ddd6fe',
      '--primary-200': '#c4b5fd',
      '--primary-300': '#a78bfa',
      '--primary-400': '#8b5cf6',
      '--primary-500': '#7c3aed',
      '--primary-600': '#7c3aed',
      '--primary-650': '#6d28d9',
      '--primary-700': '#6d28d9',
      '--primary-800': '#5b21b6',
      '--primary-900': '#4c1d95',
      '--primary-950': '#2e1065',
    }
  },
  {
    id: 'orange-sun',
    nameAr: 'البرتقالي الإنشائي النشط (Orange)',
    primaryColor: '#ea580c',
    variables: {
      '--primary-50': '#fff7ed',
      '--primary-100': '#ffedd5',
      '--primary-150': '#fed7aa',
      '--primary-200': '#fdbb74',
      '--primary-300': '#fb923c',
      '--primary-400': '#f97316',
      '--primary-500': '#ea580c',
      '--primary-600': '#ea580c',
      '--primary-650': '#c2410c',
      '--primary-700': '#c2410c',
      '--primary-800': '#9a3412',
      '--primary-900': '#7c2d12',
      '--primary-950': '#431407',
    }
  },
  {
    id: 'forest-green',
    nameAr: 'أخضر الغابات العتيق (Forest Green)',
    primaryColor: '#15803d',
    variables: {
      '--primary-50': '#f0fdf4',
      '--primary-100': '#dcfce7',
      '--primary-150': '#bbf7d0',
      '--primary-200': '#86efac',
      '--primary-300': '#4ade80',
      '--primary-400': '#22c55e',
      '--primary-500': '#16a34a',
      '--primary-600': '#15803d',
      '--primary-650': '#166534',
      '--primary-700': '#15803d',
      '--primary-800': '#166534',
      '--primary-900': '#14532d',
      '--primary-950': '#052e16',
    }
  },
  {
    id: 'warm-terracotta',
    nameAr: 'الطوب الرملي الدافئ (Terracotta)',
    primaryColor: '#b45309',
    variables: {
      '--primary-50': '#fffbeb',
      '--primary-100': '#fef3c7',
      '--primary-150': '#fde68a',
      '--primary-200': '#fcd34d',
      '--primary-300': '#f59e0b',
      '--primary-400': '#d97706',
      '--primary-500': '#b45309',
      '--primary-600': '#92400e',
      '--primary-650': '#78350f',
      '--primary-700': '#78350f',
      '--primary-800': '#451a03',
      '--primary-900': '#3b0f02',
      '--primary-950': '#200600',
    }
  }
];

export function applyColorTheme(themeId: string) {
  const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.variables).forEach(([vName, vValue]) => {
    root.style.setProperty(vName, vValue);
  });
}
