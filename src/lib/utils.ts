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
