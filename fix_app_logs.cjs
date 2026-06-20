const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const originalAddAuditLog = `const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditTrailRecord = {
      id: \`audit-\${Date.now()}-\${Math.floor(Math.random() * 1000000)}\`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: user ? \`\${user.nameAr} (\${user.role === 'admin' ? 'مدير نظام' : user.role === 'projects_manager' ? 'مدير عام' : 'مهندس'})\` : 'م. معتز يونس',
      action,
      module,
      ip: '197.34.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };`;

const newAddAuditLog = `const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditTrailRecord = {
      id: \`audit-\${Date.now()}-\${Math.floor(Math.random() * 1000000)}\`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: user ? \`\${user.nameAr} (\${user.role === 'admin' ? 'مدير نظام' : user.role === 'projects_manager' ? 'مدير عام' : 'مهندس'})\` : 'م. معتز يونس',
      action,
      module,
      ip: '197.34.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    
    // إرسال السجل للسحابة
    fetch('/api/users/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user?.username || 'engineer',
        actionAr: \`\${action} [\${module}]\`,
        type: 'site',
        detailsAr: details
      })
    }).catch(console.error);
  };`;

// Update addAuditLog
if (code.includes('addAuditLog = (action: string')) {
  // If exact match fails, use regex
  code = code.replace(/const addAuditLog = \(action: string, module: string, details: string\) => \{[^]*?setAuditLogs\(prev => \[newLog, \.\.\.prev\]\);\s*\};/m, newAddAuditLog);
}

// Remove the buggy auto-logger useEffect completely using a regex
const useEffectRegex = /  const prevStatesRef = useRef<any>\(null\);\s*\/\/ Auto-audit tracker[^]*?prevStatesRef\.current = JSON\.parse\(JSON\.stringify\(currentData\)\);\s*\}, \[.*?\]\);/msg;

code = code.replace(useEffectRegex, "");

fs.writeFileSync('src/App.tsx', code);
