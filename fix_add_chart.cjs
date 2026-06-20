const fs = require('fs');
let code = fs.readFileSync('src/components/UsersAdminPanel.tsx', 'utf-8');

// Insert Recharts imports
const importTarget = "import { UserItem, UserModulePermissions, Site, Project } from '../types';";
const rechartsImport = "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';";
if (code.includes(importTarget)) {
  code = code.replace(importTarget, importTarget + "\n" + rechartsImport);
}

// Prepare the chart JSX
const chartJSX = `
      {/* Activity Chart Panel */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-emerald-500 bg-emerald-50 p-2 rounded-xl" size={40} />
          <div>
             <h3 className="text-lg font-black text-slate-800">تحليل كادر الموظفين والصلاحيات</h3>
             <p className="text-xs text-slate-500">توزيع أدوار الموظفين على حسب القطاعات الإدارية والأقسام</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'مدراء النظام', count: users.filter(u => u.role === 'admin').length || 0, color: '#f59e0b' },
                { name: 'مدراء العام/القطاع', count: users.filter(u => u.role === 'projects_manager').length || 0, color: '#6366f1' },
                { name: 'المهندسين الميدانيين', count: users.filter(u => u.role === 'engineer').length || 0, color: '#10b981' }
              ]}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={120} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                {
                  [
                    { name: 'مدراء النظام', count: users.filter(u => u.role === 'admin').length || 0, color: '#f59e0b' },
                    { name: 'مدراء العام/القطاع', count: users.filter(u => u.role === 'projects_manager').length || 0, color: '#6366f1' },
                    { name: 'المهندسين الميدانيين', count: users.filter(u => u.role === 'engineer').length || 0, color: '#10b981' }
                  ].map((entry, index) => (
                    <cell key={\`cell-\${index}\`} fill={entry.color} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* End Chart Panel */}
`;

// Also check Activity icon import
if (!code.includes('Activity,')) {
    code = code.replace("import { \n  Briefcase,", "import { \n  Activity,\n  Briefcase,");
}

// insert chart JSX before the user filters
const injectPoint = "{/* Controls: Search and Filters */}";
if (code.includes(injectPoint)) {
    code = code.replace(injectPoint, chartJSX + '\n      ' + injectPoint);
} else {
    console.log('Inject point not found!');
}

fs.writeFileSync('src/components/UsersAdminPanel.tsx', code);
