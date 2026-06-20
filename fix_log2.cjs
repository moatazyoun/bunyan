const fs = require('fs');
let code = fs.readFileSync('src/lib/apiInterceptor.ts', 'utf-8');

// Fix logUserActivity catch block
code = code.replace(
/const logDocRef = doc\(db, 'activityLogs', logId\);\s*await runFs\(\(\) => setDoc\(logDocRef, newLog\), OperationType\.CREATE, `activityLogs\/\$\{logId\}`\);\s*\/\/ Also append to local storage cache for rapid reading\s*const cachedLogs = getStorage<any\[\]>\('activityLogs', \[\]\);\s*cachedLogs\.push\(newLog\);\s*setStorage\('activityLogs', cachedLogs\);\s*\} catch \(err\) \{/g,
`// Also append to local storage cache for rapid reading
    const cachedLogs = getStorage<any[]>('activityLogs', []);
    cachedLogs.push(newLog);
    setStorage('activityLogs', cachedLogs);

    const logDocRef = doc(db, 'activityLogs', logId);
    await runFs(() => setDoc(logDocRef, newLog), OperationType.CREATE, \`activityLogs/\${logId}\`);
  } catch (err) {`
);

fs.writeFileSync('src/lib/apiInterceptor.ts', code);
