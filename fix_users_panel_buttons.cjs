const fs = require('fs');
let code = fs.readFileSync('src/components/UsersAdminPanel.tsx', 'utf-8');

// For buttons
code = code.replace(/bg-slate-800 hover:bg-slate-700/g, "bg-slate-200 hover:bg-slate-300 text-slate-800");
code = code.replace(/bg-slate-800 text-slate-700 hover:text-slate-800/g, "bg-slate-100 text-slate-600 hover:text-slate-800");
code = code.replace(/hover:bg-slate-800 text-slate-500 hover:text-slate-800/g, "hover:bg-slate-100 text-slate-500 hover:text-slate-900");
code = code.replace(/bg-white hover:bg-slate-800/g, "bg-slate-100 hover:bg-slate-200");
code = code.replace(/text-slate-700 hover:text-slate-800/g, "text-slate-600 hover:text-slate-900");

// The generic dark mode background class
code = code.replace(/bg-slate-950/g, "bg-slate-50");
code = code.replace(/text-slate-100/g, "text-slate-900");
code = code.replace(/text-slate-200/g, "text-slate-800");

// Also the chart! Recharts components have dark mode colors for tooltip.
// We can change the stroke/fill if needed.
code = code.replace(/stroke="#475569"/g, 'stroke="#e2e8f0"');
code = code.replace(/fill="#1e293b"/g, 'fill="#f8fafc"');
code = code.replace(/contentStyle=\{\{ backgroundColor: '#020617', borderColor: '#1e293b' \}\}/g, "contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}");

fs.writeFileSync('src/components/UsersAdminPanel.tsx', code);
