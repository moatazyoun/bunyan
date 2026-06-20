const fs = require('fs');
let code = fs.readFileSync('src/components/UsersAdminPanel.tsx', 'utf-8');

// The chart JSX
const chartJSX = `
      {/* Activity Chart Panel */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-emerald-500 bg-emerald-50 p-2 rounded-xl" size={40} />
          <div>
             <h3 className="text-lg font-black text-slate-800">تحليل وتوزيع كادر الموظفين والصلاحيات</h3>
             <p className="text-xs text-slate-500">توزيع أدوار الموظفين المهندسين والمشرفين على حسب القطاعات الإدارية والأقسام الهندسية</p>
          </div>
        </div>
        <div className="h-64 w-full" style={{ direction: 'ltr' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'مدراء النظام والمشاريع', count: users.filter(u => u.role === 'admin' || u.role === 'projects_manager').length || 0, color: '#f59e0b' },
                { name: 'المهندسين الميدانيين والفنيين', count: users.filter(u => u.role === 'engineer' || u.role === 'site_manager' || u.role === 'tech_office' || u.role === 'site_engineer').length || 0, color: '#10b981' },
                { name: 'المراقبون والمشاهدون للبيانات', count: users.filter(u => u.role === 'viewer' || u.role === 'supervisor' || u.role === 'accountant' || u.role === 'dc').length || 0, color: '#6366f1' }
              ]}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={150} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} style={{ textAnchor: 'end' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={25} fill="#6366f1">
                {
                  [
                    { color: '#f59e0b' },
                    { color: '#10b981' },
                    { color: '#6366f1' }
                  ].map((entry, index) => (
                    <cell key={\`cell-\${index}\`} fill={entry.color} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
`;

const injectPoint = "{/* Filters Bar */}";
if (code.includes(injectPoint)) {
    code = code.replace(injectPoint, chartJSX + '\n      ' + injectPoint);
} else {
    console.log('Inject point not found!');
}

fs.writeFileSync('src/components/UsersAdminPanel.tsx', code);
