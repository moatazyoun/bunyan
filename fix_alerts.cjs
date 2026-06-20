const fs = require('fs');
let code = fs.readFileSync('src/components/SiteSelectionScreen.tsx', 'utf-8');

code = code.replace(/const \[errorMsg, setErrorMsg\] = useState\(''\);/, "const [errorMsg, setErrorMsg] = useState('');\n  const [successMsg, setSuccessMsg] = useState('');");

code = code.replace(/alert\(`بنجاح تام! تم ترتيب وتوجيه البيانات السحابية/g, "setSuccessMsg(`بنجاح تام! تم ترتيب وتوجيه البيانات السحابية");
code = code.replace(/alert\('تم نقل المشروع ومواقع العمل بنجاح تام إلى مدير النظام المحدد!'\);/g, "setSuccessMsg('تم نقل المشروع ومواقع العمل بنجاح تام إلى مدير النظام المحدد!');");

// Replace all other alerts with setErrorMsg
code = code.replace(/alert\(/g, "setErrorMsg(");

fs.writeFileSync('src/components/SiteSelectionScreen.tsx', code);
