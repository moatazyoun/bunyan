const fs = require('fs');
const path = './server.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/errorMessage\.includes/g, 'String(errorMessage).includes');
fs.writeFileSync(path, content, 'utf8');
console.log('Done server.ts fix');
