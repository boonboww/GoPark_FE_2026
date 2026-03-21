const fs = require('fs');
let file = fs.readFileSync('src/app/users/profile/page.tsx', 'utf8');
file = file.replace(/import \{ÔÔ tôôoast \}/g, 'import { toast }');
file = file.replace(/Ô tô/g, 'ô tô');
fs.writeFileSync('src/app/users/profile/page.tsx', file, 'utf8');
