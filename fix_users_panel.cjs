const fs = require('fs');
let code = fs.readFileSync('src/components/UsersAdminPanel.tsx', 'utf-8');

// Replace dark mode colors with light mode colors
code = code.replace(/bg-slate-950/g, "bg-slate-50");
code = code.replace(/bg-slate-900\/30/g, "bg-white shadow-sm");
code = code.replace(/bg-slate-900\/50/g, "bg-slate-50 shadow-md");
code = code.replace(/bg-slate-900\/20/g, "bg-white shadow-sm");
code = code.replace(/bg-slate-900/g, "bg-white");
code = code.replace(/text-slate-100/g, "text-slate-900");
code = code.replace(/text-slate-200/g, "text-slate-800");
code = code.replace(/text-slate-300/g, "text-slate-700");
code = code.replace(/text-slate-400/g, "text-slate-500");
code = code.replace(/text-white/g, "text-slate-900");
code = code.replace(/border-white\/5/g, "border-slate-200");
code = code.replace(/border-white\/10/g, "border-slate-200");

// Fix headers text to be dark
code = code.replace(/text-white/g, "text-slate-900");

fs.writeFileSync('src/components/UsersAdminPanel.tsx', code);
