const fs = require('fs');
let file = fs.readFileSync('src/app/users/profile/page.tsx', 'utf8');

file = file.replace(/import \{ổô tôổoast \}/g, 'import { toast }');
file = file.replace(/Ôô tôôype:/g, 'type:');
file = file.replace(/Ôô tôô/g, 't');
file = file.replace(/ổô tôổ/g, 't');
file = file.replace(/ô tô/g, 'ô tô');

fs.writeFileSync('src/app/users/profile/page.tsx', file, 'utf8');
