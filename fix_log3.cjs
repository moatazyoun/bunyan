const fs = require('fs');
let code = fs.readFileSync('src/lib/apiInterceptor.ts', 'utf-8');

code = code.replace(
/try \{\s*const logsCol = collection\(db, 'activityLogs'\);\s*const snapshot = await runFs\(\(\) => getDocs\(logsCol\), OperationType\.LIST, 'activityLogs'\);\s*let logsList = snapshot\.docs\.map\(d => d\.data\(\) as any\);/g,
`try {
      const logsCol = collection(db, 'activityLogs');
      const snapshot = await runFs(() => getDocs(logsCol), OperationType.LIST, 'activityLogs');
      let logsList = snapshot.docs.map(d => d.data() as any);
      
      // Merge with local storage logs
      const localLogs = getStorage<any[]>('activityLogs', []);
      logsList = [...logsList, ...localLogs];
      
      // Deduplicate by ID
      const uniqueLogs = new Map();
      logsList.forEach(log => uniqueLogs.set(log.id, log));
      logsList = Array.from(uniqueLogs.values());`
);

code = code.replace(
/const fallbackLogs = \[/g,
`const localLogs = getStorage<any[]>('activityLogs', []);
      if (localLogs.length > 0) {
        if (lowerQuery && lowerQuery !== 'logs') {
          return mockResponseOk(localLogs.filter(l => (l.username || '').toLowerCase().trim() === lowerQuery).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
        return mockResponseOk(localLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
      
      const fallbackLogs = [`
);

fs.writeFileSync('src/lib/apiInterceptor.ts', code);
