export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  licensePlate: string;
  vehicleType: string;
  slotId: string;
  slotCode: string;
  parkingLotId: string;
  zone: string;
  floorNumber?: number;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "PENDING" | "COMPLETED" | "CANCELLED";
  totalPrice: number;
  createdAt: string;
  qrCode?: string;
}
