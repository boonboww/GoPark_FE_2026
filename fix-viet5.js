const fs = require('fs');
let file = fs.readFileSync('src/app/users/profile/page.tsx', 'utf8');

file = file.replace(/<inpuô tôype/g, '<input type');
file = file.replace(/<inputtype/g, '<input type');

fs.writeFileSync('src/app/users/profile/page.tsx', file, 'utf8');
