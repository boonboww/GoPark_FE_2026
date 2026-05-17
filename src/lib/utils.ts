import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStaffLotId(email: string | undefined): number | null {
  if (!email) return null;
  const parts = email.split('.');
  if (parts.length >= 3 && parts[0] === 'staff') {
    const lotId = parseInt(parts[1]);
    return isNaN(lotId) ? null : lotId;
  }
  return null;
}

/**
 * Định dạng chuỗi thời gian sang HH:mm an toàn
 */
export function formatTimeDisplay(timeStr?: any): string {
  if (!timeStr) return "N/A";
  try {
    if (typeof timeStr === 'string' && timeStr.includes("T")) {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime()) && (date.getUTCFullYear() === 1970 || date.getUTCFullYear() === 1969)) {
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      }
    }
    const d = dayjs(timeStr);
    if (d.isValid()) {
      const date = d.toDate();
      if (date.getUTCFullYear() === 1970 || date.getUTCFullYear() === 1969) {
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return d.format("HH:mm");
    }
  } catch (e) {}
  
  if (typeof timeStr === 'string' && timeStr.includes(":") && timeStr.length <= 8) {
    return timeStr.substring(0, 5);
  }
  return "N/A";
}

/**
 * Parse chuỗi thời gian từ Backend sang HH:mm an toàn cho logic
 */
export function parseParkingTime(timeStr: any, defaultTime: string = "00:00"): string {
  if (!timeStr) return defaultTime;
  
  try {
    const s = String(timeStr).trim();
    if (s.includes("T")) {
      const date = new Date(s);
      if (!isNaN(date.getTime()) && (date.getUTCFullYear() === 1970 || date.getUTCFullYear() === 1969)) {
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      }
    }
    
    // Nếu là Date object (từ timestamp)
    const d = dayjs(timeStr);
    if (d.isValid() && typeof timeStr !== 'string') {
      const date = d.toDate();
      if (date.getUTCFullYear() === 1970 || date.getUTCFullYear() === 1969) {
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return d.format("HH:mm");
    }

    if (s.includes(":")) {
      const parts = s.split(":");
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    if (d.isValid()) return d.format("HH:mm");
  } catch (e) {}
  
  return defaultTime;
}

/**
 * Định dạng ngày hoạt động đồng bộ
 */
export function formatOperatingDays(daysStr?: string): string {
  if (!daysStr) return "Hàng ngày";

  const dayMap: Record<string, string> = {
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
    friday: "Thứ 6",
    saturday: "Thứ 7",
    sunday: "Chủ nhật",
    mon: "Thứ 2",
    tue: "Thứ 3",
    wed: "Thứ 4",
    thu: "Thứ 5",
    fri: "Thứ 6",
    sat: "Thứ 7",
    sun: "Chủ nhật",
    "thứ 2": "Thứ 2",
    "thứ 3": "Thứ 3",
    "thứ 4": "Thứ 4",
    "thứ 5": "Thứ 5",
    "thứ 6": "Thứ 6",
    "thứ 7": "Thứ 7",
    "chủ nhật": "Chủ nhật",
    "cn": "Chủ nhật"
  };

  const clean = daysStr.toLowerCase().trim();

  // Kiểm tra nếu là tất cả các ngày
  const allDaysList = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const isAllDays = clean.includes("hàng ngày") || 
                    clean.includes("all days") || 
                    (clean.includes(",") && clean.split(",").length >= 7) ||
                    (allDaysList.every(day => clean.includes(day)));

  if (isAllDays) return "Hàng ngày";

  // Xử lý dạng range: "monday-sunday" hoặc "thứ 2-cn"
  if (clean.includes("-")) {
    const parts = clean.split("-").map(p => p.trim());
    const start = dayMap[parts[0]] || parts[0];
    const end = dayMap[parts[1]] || parts[1];
    return `${start} - ${end}`;
  }

  // Xử lý dạng list: "monday, tuesday, wednesday"
  if (clean.includes(",")) {
    const parts = clean.split(",").map(p => p.trim());
    const mapped = parts.map(p => dayMap[p] || p);
    
    // Nếu có nhiều hơn 3 ngày, hiển thị dạng rút gọn T2 - T6 chẳng hạn
    if (mapped.length >= 5) {
        return `${mapped[0]} - ${mapped[mapped.length - 1]}`;
    }
    
    return mapped.join(", ");
  }

  // Xử lý từ đơn hoặc các trường hợp khác
  return dayMap[clean] || daysStr;
}

/**
 * Định dạng ngày tháng an toàn, tránh RangeError: Invalid time value
 */
export function safeFormat(date: any, formatStr: string, options?: any): string {
  try {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, formatStr, options || { locale: vi });
  } catch (error) {
    return "N/A";
  }
}

/**
 * Hàm khôi phục các ký tự bị lỗi () do Backend/DB làm mất byte UTF-8
 */
export function fixVietnameseMojibake(text?: string | null): string {
  if (!text) return "";
  let fixed = text;
  
  const replacements: Record<string, string> = {
    // Lỗi có ký tự thay thế ()
    "Nguy\ufffdn Hu\ufffd": "Nguyễn Huệ",
    "Nguy\ufffdn V\ufffdn Linh": "Nguyễn Văn Linh",
    "\ufffdi\ufffdn Bi\ufffdn Ph\ufffd": "Điện Biên Phủ",
    "Ph\ufffd\ufffdng H\ufffdi Ch\ufffdu": "Phường Hải Châu",
    "H\ufffda C\ufffd\ufffdng": "Hòa Cường",
    "Thanh Th\ufffdy": "Thanh Thủy",
    "Thanh B\ufffdnh": "Thanh Bình",
    "X\ufffda Kh\ufffdm \ufffd\ufffdc": "Xã Khâm Đức",
    "Th\ufffdnh ph\ufffd": "Thành phố",
    "H\ufffd Ch\ufffd Minh": "Hồ Chí Minh",
    "Th\ufffdc Gi\ufffdn": "Thạc Gián",
    "B\ufffdu H\ufffdc": "Bàu Hạc",
    "Thanh Kh\ufffd": "Thanh Khê",
    "\ufffd\ufffd N\ufffdng": "Đà Nẵng",
    "Vi\ufffdt Nam": "Việt Nam",
    "T\ufffd 4 \ufffd\ufffdn 10 ch\ufffd": "Từ 4 đến 10 chỗ",
    "Nguy\ufffdn": "Nguyễn",
    "Ph\ufffd\ufffdng": "Phường",
    "Kh\ufffdm \ufffd\ufffdc": "Khâm Đức",
    "Bi\ufffdn Ph\ufffd": "Biên Phủ",
    "Qu\ufffdn 1": "Quận 1",
    "B\ufffdi \ufffd\ufffd ": "Bãi đỗ ",
    "B\ufffdi \ufffd\ufffd": "Bãi đỗ",
    "H\ufffda Kh\ufffdnh": "Hòa Khánh",
    "Qu\ufffdn": "Quận",
    "Ch\ufffd tr\ufffdng": "Chỗ trống",
    "Gi\ufffda": "Giá",
    "\ufffd/gi\ufffd": "đ/giờ",
    "\ufffd/gi": "đ/gi",
    "\ufffdnh gi\ufffda": "Đánh giá",
    "\ufffd\ufffdng": "Đường",
    "\ufffdờng": "Đường",
    
    // Lỗi mất hẳn ký tự (khoảng trắng)
    "Nguyn Hu": "Nguyễn Huệ",
    "Nguyn Vn Linh": "Nguyễn Văn Linh",
    "in Bin Ph": "Điện Biên Phủ",
    "Phng Hi Chu": "Phường Hải Châu",
    "Ha Cng": "Hòa Cường",
    "Thanh Thy": "Thanh Thủy",
    "Thanh Bnh": "Thanh Bình",
    "X Khm c": "Xã Khâm Đức",
    "Thnh ph": "Thành phố",
    "H Ch Minh": "Hồ Chí Minh",
    "Thc Gin": "Thạc Gián",
    "Bu Hc": "Bàu Hạc",
    "Thanh Kh": "Thanh Khê",
    " Nng": "Đà Nẵng",
    "Vit Nam": "Việt Nam",
    "T 4 n 10 ch": "Từ 4 đến 10 chỗ",
    "Nguyn": "Nguyễn",
    "Phng": "Phường",
    "Khm c": "Khâm Đức",
    "Bin Ph": "Biên Phủ",
    "Qun 1": "Quận 1",
    "Bi  ": "Bãi đỗ ",
    "Ha Khnh": "Hòa Khánh",
    "Qun": "Quận",
    "Ch tr ng": "Chỗ trống",
    " /giờ": "đ/giờ",
    
    // Lỗi thay thế bằng khoảng trắng (Space-separated)
    "Nguy n Hu ": "Nguyễn Huệ",
    "Nguy n V n Linh": "Nguyễn Văn Linh",
    " i n Bi n Ph ": "Điện Biên Phủ",
    "Ph  ng H i Ch u": "Phường Hải Châu",
    "H a C  ng": "Hòa Cường",
    "Thanh Th y": "Thanh Thủy",
    "Thanh B nh": "Thanh Bình",
    "X  Kh m  c": "Xã Khâm Đức",
    "Th nh ph ": "Thành phố",
    "H  Ch  Minh": "Hồ Chí Minh",
    "Th c Gi n": "Thạc Gián",
    "B u H c": "Bàu Hạc",
    "Thanh Kh ": "Thanh Khê",
    "  N ng": "Đà Nẵng",
    "Vi t Nam": "Việt Nam",
    "T  4 d n 10 ch ": "Từ 4 đến 10 chỗ",
    "Nguy n": "Nguyễn",
    "Ph  ng": "Phường",
    "Kh m  c": "Khâm Đức",
    "Bi n Ph ": "Biên Phủ",
    "Qu n 1": "Quận 1",
    "B i    ": "Bãi đỗ ",
    "H a Kh nh": "Hòa Khánh",
    "Qu n": "Quận",
    "Ch  tr ng": "Chỗ trống",
    "Gi a": "Giá",
    " /gi ": "đ/giờ",
    " nh gi a": "Đánh giá",
    "  ng B u H c": "Đường Bàu Hạc",
    "  ng Thanh Th y": "Đường Thanh Thủy",
    "  ng Lan Nguy n Phi": "Đường Lan Nguyễn Phi",
    "  ng": "Đường",
    "minh di u": "Minh Diệu",
    "B i   H a C  ng": "Bãi đỗ Hòa Cường",
    "Th c Gi n Hub": "Thạc Gián Hub",
    "Nguy n Hu  Premium": "Nguyễn Huệ Premium"
  };

  const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    fixed = fixed.split(key).join(replacements[key]);
  }
  return fixed;
}
