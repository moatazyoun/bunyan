const fs = require('fs');
let code = fs.readFileSync('src/components/SiteSelectionScreen.tsx', 'utf-8');

// Render successMsg
const errorBlock = `{errorMsg && (
          <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-750 text-xs font-bold rounded-xl max-w-md relative z-10 text-right">
            {errorMsg}
          </div>
        )}`;

const alertsBlock = `{errorMsg && (
          <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-750 text-[11.5px] font-bold rounded-xl max-w-md relative z-10 text-right">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-750 text-[11.5px] font-bold rounded-xl max-w-md relative z-10 text-right">
            {successMsg}
          </div>
        )}`;

// It's safer to just replace by regex:
code = code.replace(/\{errorMsg && \(\s*<div className="p-4 mb-6 bg-rose-500\/10 border border-rose-500\/20 text-rose-750 text-xs font-bold rounded-xl max-w-md relative z-10">\s*\{errorMsg\}\s*<\/div>\s*\)\}/, alertsBlock);

// Also add a reset hook to hide messages after 5 seconds:
const useEffectCode = `
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);
`;

code = code.replace(/const \[successMsg, setSuccessMsg\] = useState\(''\);/, "const [successMsg, setSuccessMsg] = useState('');" + useEffectCode);

fs.writeFileSync('src/components/SiteSelectionScreen.tsx', code);
