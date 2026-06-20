const fs = require('fs');
let code = fs.readFileSync('src/lib/apiInterceptor.ts', 'utf-8');

// Use url.searchParams.get('username')
code = code.replace(
/const queryUser = path\.includes\('\?username='\)\s*\?\s*path\.split\('\?username='\)\[1\]\.split\('&'\)\[0\]\s*:\s*\(path\.split\('\/'\)\.pop\(\) \|\| ''\);/g,
"const queryUser = url.searchParams.get('username') || (path.split('/').pop() || '');"
);

fs.writeFileSync('src/lib/apiInterceptor.ts', code);
