const fs = require('fs');
let code = fs.readFileSync('src/components/UsersAdminPanel.tsx', 'utf-8');

// The script already replaced basic dark mode colors.
// I'll fix the text colors that might still be unreadable or artifacts.

// "bg-slate-950/40" was missed because of regex
code = code.replace(/bg-slate-950\/40/g, "bg-slate-50 border-slate-200");
code = code.replace(/bg-slate-950\/50/g, "bg-white shadow-sm border-slate-200");

code = code.replace(/text-slate-100/g, "text-slate-900");
code = code.replace(/text-slate-200/g, "text-slate-800");
code = code.replace(/text-slate-300/g, "text-slate-700");
code = code.replace(/text-slate-400/g, "text-slate-500");

// Check the modal colors
code = code.replace(/border-white\/5/g, "border-slate-200");
code = code.replace(/border-white\/10/g, "border-slate-200");
code = code.replace(/border-white\/20/g, "border-slate-300");

// Search inputs
code = code.replace(/placeholder-slate-500/g, "placeholder-slate-400");
code = code.replace(/bg-white border-white\/10/g, "bg-white border-slate-200");

// Buttons that might still have text-slate-200
code = code.replace(/text-slate-900/g, "text-slate-800"); // Just homogenize

fs.writeFileSync('src/components/UsersAdminPanel.tsx', code);
