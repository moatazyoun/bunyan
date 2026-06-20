const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const helperCode = `
// Helpers for auto tracking
const getModuleAr = (key: string) => {
  const map: Record<string, string> = {
    transactions: 'دفتر الحركات المالي', custodies: 'العهد المالية', contractors: 'مقاولي الباطن', 
    equipment: 'حركة المعدات', maintenanceOrders: 'الصيانة', labTests: 'مختبرات الجودة', 
    hseIncidents: 'شؤون السيرتي والبيئة', wbsTasks: 'برامج الجدولة', warehouseItems: 'المخازن المركزية', 
    workers: 'العمالة اليومية', attendanceLogs: 'سجلات الدوام', salaryPayments: 'مسيرات الرواتب', 
    supplyRecords: 'سجلات التوريد', cubicCertificates: 'شهادات التكعيب', projects: 'المشروعات والتعاقدات', 
    boqItems: 'مقايسات الأعمال', submissions: 'الاعتمادات والمستخلصات'
  };
  return map[key] || key;
};
`;

const trackerCode = `
  // --- Enhanced Auto-Audit Tracker ---
  const prevStatesRef = useRef<any>({});
  
  useEffect(() => {
    if (!isDbLoaded) return; // wait until initialized
    
    // Only track if there's an actual user logged in
    if (!user) return;
    
    const currentTrackables = {
        transactions, custodies, contractors, equipment, maintenanceOrders,
        labTests, hseIncidents, wbsTasks, warehouseItems, workers, attendanceLogs,
        salaryPayments, supplyRecords, cubicCertificates, projects, boqItems, submissions
    };

    if (Object.keys(prevStatesRef.current).length === 0) {
      prevStatesRef.current = JSON.parse(JSON.stringify(currentTrackables));
      return;
    }

    const prev = prevStatesRef.current;
    let changed = false;
    
    for (const [key, currArray] of Object.entries(currentTrackables)) {
        const prevArray = prev[key] || [];
        const moduleNameAr = getModuleAr(key);
        
        if (currArray.length > prevArray.length) {
            const addedNum = currArray.length - prevArray.length;
            addAuditLog('إضافة سجل حية', moduleNameAr, \`تم تسجيل وتوثيق إدخال \${addedNum} بند/عنصر جديد في قاعدة البيانات.\`);
            changed = true;
        } else if (currArray.length < prevArray.length) {
            const delNum = prevArray.length - currArray.length;
            addAuditLog('إزالة سجل حية', moduleNameAr, \`تم إزالة أو حذف \${delNum} بند/عنصر من السجلات بأمر المشغل.\`);
            changed = true;
        } else {
            // Check for updates
            const pStr = JSON.stringify(prevArray);
            const cStr = JSON.stringify(currArray);
            if (pStr !== cStr) {
                addAuditLog('تحديث بيانات حي', moduleNameAr, \`جرى تعديل تفاصيل ومحتوى سجلات بداخل هذه الوحدة.\`);
                changed = true;
            }
        }
    }
    
    if (changed) {
        prevStatesRef.current = JSON.parse(JSON.stringify(currentTrackables));
    }
    
  }, [
      transactions, custodies, contractors, equipment, maintenanceOrders,
      labTests, hseIncidents, wbsTasks, warehouseItems, workers, attendanceLogs,
      salaryPayments, supplyRecords, cubicCertificates, projects, boqItems, submissions,
      isDbLoaded, user
  ]);
`;

// Insert helper code outside
code = code.replace(/export default function App\(\) \{/, helperCode + '\nexport default function App() {');

// Insert tracker code after addAuditLog declaration
if (code.includes('addAuditLog = (action: string')) {
  // We need to inject after the setAuditLogs/fetch block
  code = code.replace(/(addAuditLog = [^]*?\}\)\.catch\(console\.error\);\s*\};)/m, "$1\n" + trackerCode);
} else {
  console.log("Could not find addAuditLog!");
}

fs.writeFileSync('src/App.tsx', code);
