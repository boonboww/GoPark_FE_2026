import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"

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
  if (typeof timeStr !== 'string') {
    return dayjs(timeStr).format("HH:mm");
  }
  if (timeStr.includes(":") && timeStr.length <= 8) {
    return timeStr.substring(0, 5);
  }
  try {
    const d = dayjs(timeStr);
    if (d.isValid()) return d.format("HH:mm");
  } catch (e) {}
  return "N/A";
}

/**
 * Parse chuỗi thời gian từ Backend sang HH:mm an toàn cho logic
 */
export function parseParkingTime(timeStr: any, defaultTime: string = "00:00"): string {
  if (!timeStr) return defaultTime;
  
  // Nếu là Date object (từ timestamp)
  const d = dayjs(timeStr);
  if (d.isValid() && typeof timeStr !== 'string') {
    return d.format("HH:mm");
  }

  const s = String(timeStr).trim();
  if (s.includes(":")) {
    const parts = s.split(":");
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  if (d.isValid()) return d.format("HH:mm");
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
