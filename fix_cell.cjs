const fs = require('fs');
let code = fs.readFileSync('src/components/UsersAdminPanel.tsx', 'utf-8');

code = code.replace(/<cell key/g, "<Cell key");

// Include Cell in imports
const rechartsImportStr = "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';";
const fixedRechartsImport = "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';";

code = code.replace(rechartsImportStr, fixedRechartsImport);

fs.writeFileSync('src/components/UsersAdminPanel.tsx', code);
