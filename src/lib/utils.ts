import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
