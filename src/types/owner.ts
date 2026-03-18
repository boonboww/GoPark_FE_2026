export interface OwnerProfileType {
  name: string;
  phone: string;
  avatar: string;
  totalLots: number;
}

/** Dùng cho danh sách bãi từ /parking-lots/owner/:ownerId */
export interface ParkingLotType {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  totalSlots: number;
  availableSlots: number;
  status: "OPEN" | "CLOSED" | string;
}

/** Dùng cho /parking-lots/owner/:ownerId/totals */
export interface OwnerTotalsType {
  totalParkingLots: number;
  totalSlots: number;
  totalAvailableSlots: number;
  totalOccupiedSlots: number;
  statusBreakdown: Record<string, number>;
}

