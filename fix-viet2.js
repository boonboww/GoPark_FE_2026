const fs = require('fs');
let file = fs.readFileSync('src/app/users/profile/page.tsx', 'utf8');

file = file.replace(/Du\?i 4 ch\?/g, 'Dưới 4 chỗ');
file = file.replace(/T\? 4 d\?n 10 ch\?/g, 'Từ 4 đến 10 chỗ');
file = file.replace(/L\?n hon 10 ch\?/g, 'Lớn hơn 10 chỗ');

fs.writeFileSync('src/app/users/profile/page.tsx', file, 'utf8');
