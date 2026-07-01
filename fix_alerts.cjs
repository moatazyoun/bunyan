const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/alert\(/g, 'safeAlert(');

const helper = `\n// Safe alert helper\nconst safeAlert = (msg: string) => {\n  try { window.alert(msg); } catch (e) { console.warn("Alert prevented by browser:", msg); }\n};\n\n`;

// Insert helper after imports
const lastImportIdx = content.lastIndexOf('import ');
const endOfImport = content.indexOf('\n', lastImportIdx) + 1;
content = content.slice(0, endOfImport) + helper + content.slice(endOfImport);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
