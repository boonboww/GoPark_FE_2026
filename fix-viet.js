const fs = require('fs');
let file = fs.readFileSync('src/app/users/profile/page.tsx', 'utf8');

const replacements = {
  'du\\?i 4 ch\\?': 'dưới 4 chỗ',
  't\\? 4 d\\?n 10 ch\\?': 'từ 4 đến 10 chỗ',
  'l\\?n hon 10 ch\\?': 'lớn hơn 10 chỗ',
  'T\\?i kho\\?n c\\?a t\\?i': 'Tài khoản của tôi',
  'Qu\\?n l thng tin c nhn v phuong ti\\?n dang k': 'Quản lý thông tin cá nhân và phương tiện đăng ký',
  'H\\? so c nhn': 'Hồ sơ cá nhân',
  'Thng tin d\\?nh danh c\\?a b\\?n': 'Thông tin định danh của bạn',
  'Chua c\\?p nh\\?t tn': 'Chưa cập nhật tên',
  'S\\? di\\?n tho\\?i': 'Số điện thoại',
  'Chua c\\?p nh\\?t': 'Chưa cập nhật',
  'Gi\\?i tnh': 'Giới tính',
  'N\\?': 'Nữ',
  'Khc': 'Khác',
  'H\\? so phuong ti\\?n  t': 'Hồ sơ phương tiện ô tô',
  'Qu\\?n l t\\?i da': 'Quản lý tối đa',
  'phuong ti\\?n dang k g\\?i xe \\(Ch\\?  t\\)': 'phương tiện đăng ký gửi xe (Chỉ ô tô)',
  'Thm xe': 'Thêm xe',
  'Chua c phuong ti\\?n no': 'Chưa có phương tiện nào',
  'Hy thm phuong ti\\?n d\\? s\\? d\\?ng bi d\\?': 'Hãy thêm phương tiện để sử dụng bãi đỗ',
  // '?nh phuong ti\\?n / QR code gi\\? l\\?p': 'Ảnh phương tiện / QR code giả lập',
  // 'Thng tin phuong ti\\?n': 'Thông tin phương tiện',
  'Ch\\?nh s\\?a h\\? so': 'Chỉnh sửa hồ sơ',
  'C\\?p nh\\?t thng tin c nhn c\\?a b\\?n. Ti kho\\?n email khng th\\? thay d\\?i.': 'Cập nhật thông tin cá nhân của bạn. Tài khoản email không thể thay đổi.',
  'H\\? v tn': 'Họ và tên',
  'Ch\\?n gi\\?i tnh': 'Chọn giới tính',
  'Luu h\\? so': 'Lưu hồ sơ',
  'H\\?y': 'Hủy',
  'Thm  t m\\?i': 'Thêm ô tô mới',
  'Vui lng nh\\?p chnh xc bi\\?n s\\? xe d\\? quy trnh qut t\\?i bi di\\?n ra thu\\?n l\\?i.': 'Vui lòng nhập chính xác biển số xe để quy trình quét tại bãi diễn ra thuận lợi.',
  'T\\?i \\?nh xe ln \\(Ty ch\\?n\\)': 'Tải ảnh xe lên (Tùy chọn)',
  'Bi\\?n s\\? xe': 'Biển số xe',
  'Lo\\?i xe \\( t\\)': 'Loại xe (Ô tô)',
  'Ch\\?n lo\\?i xe': 'Chọn loại xe',
  'Luu thng tin': 'Lưu thông tin',
  'dy l interface t\\?m th\\?i d\\? trnh l\\?i, sau ny s\\? d\\?ng b\\? v\\?i backend': 'đây là interface tạm thời để tránh lỗi, sau này sẽ đồng bộ với backend',
  'Vui lng ch\\?n \\?nh nh\\? hon 2MB': 'Vui lòng chọn ảnh nhỏ hơn 2MB',
  ' c\\?p nh\\?t thng tin c nhn!': 'Đã cập nhật thông tin cá nhân!',
  'Khng th\\? c\\?p nh\\?t h\\? so': 'Không thể cập nhật hồ sơ',
  'B\\?n ch\\? du\\?c dang k t\\?i da': 'Bạn chỉ được đăng ký tối đa',
  'phuong ti\\?n!': 'phương tiện!',
  'B\\?n c ch\\?c ch\\?n mu\\?n xa phuong ti\\?n ny\\?': 'Bạn có chắc chắn muốn xóa phương tiện này?',
  ' xa phuong ti\\?n thnh cng.': 'Đã xóa phương tiện thành công.',
  'Khng th\\? xa phuong ti\\?n': 'Không thể xóa phương tiện',
  'Vui lng nh\\?p bi\\?n s\\? xe.': 'Vui lòng nhập biển số xe.',
  'Bi\\?n s\\? xe ny d du\\?c dang k!': 'Biển số xe này đã được đăng ký!',
  'C\\?p nh\\?t phuong ti\\?n thnh cng.': 'Cập nhật phương tiện thành công.',
  'Ch\\? c th\\? thm t\\?i da': 'Chỉ có thể thêm tối đa',
  'Thm phuong ti\\?n m\\?i thnh cng.': 'Thêm phương tiện mới thành công.',
  'L\\?i luu phuong ti\\?n': 'Lỗi lưu phương tiện',
  'S\\?a thng tin xe': 'Sửa thông tin xe',
  'Trnh m QR khi ra/vo bi.': 'Trình mã QR khi ra/vào bãi.',
  'Nguy\\?n Van A': 'Nguyễn Văn A'
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key, 'g');
  file = file.replace(regex, value);
}

// Fixed leftover weird character
file = file.replace(/\?nh phuong ti\?n/g, 'Ảnh phương tiện');
file = file.replace(/Thng tin phuong ti\?n/g, 'Thông tin phương tiện');
file = file.replace(/ t/g, 'Ô tô');

fs.writeFileSync('src/app/users/profile/page.tsx', file, 'utf8');
console.log('Fixed Vietnamese text');
