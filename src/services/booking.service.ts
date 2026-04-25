import { get, post } from "@/lib/api";
import { Booking } from "@/types/booking";

interface GetBookingsParams {
  lotId: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

class BookingService {
  async getBookingsByParkingLot(params: GetBookingsParams): Promise<Booking[]> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const qs = queryParams.toString();
    const url = `/booking/parking-lot/${params.lotId}${qs ? `?${qs}` : ""}`;

    const response = await get<any>(url);

    // Dữ liệu API Backend trả về thường được bọc trong data.data hoặc data tùy cấu trúc
    const data = response?.data?.data || response?.data || response || [];

    if (!Array.isArray(data)) return [];

    return data.map((item: any): Booking => {
      // Map status
      const rawStatus = item.status?.toUpperCase() || "";
      let mappedStatus: Booking["status"] = "PENDING";
      if (rawStatus === "ONGOING") mappedStatus = "ACTIVE";
      else if (rawStatus === "COMPLETED") mappedStatus = "COMPLETED";
      else if (rawStatus === "CANCELLED") mappedStatus = "CANCELLED";

      return {
        id: item.id?.toString() || "",
        userId: item.user?.id?.toString() || "",
        userName: item.user?.profile?.name || item.user?.email || "Khách vãng lai",
        userPhone: item.user?.profile?.phone || item.user?.phoneNumber || "",
        licensePlate: item.vehicle?.plate_number || "",
        vehicleType: item.vehicle?.type || "",
        slotId: item.slot?.id?.toString() || "",
        slotCode: item.slot?.code || "",
        parkingLotId: params.lotId.toString(),
        zone: item.slot?.parkingZone?.zone_name || "",
        floorNumber: item.slot?.parkingZone?.parkingFloor?.floor_number,
        startTime: item.start_time,
        endTime: item.end_time,
        status: mappedStatus,
        createdAt: item.created_at || new Date().toISOString(),
        totalPrice: item.invoice?.[0]?.total || 0,
        qrCode: item.qrCode?.content,
      };
    });
  }

  /**
   * Scan QR Code for Check-in/Check-out
   * POST /api/v1/booking/scan
   */
  async scanBooking(content: string, gateId: string, image?: File): Promise<any> {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("gateId", gateId);
    if (image) {
      formData.append("image", image);
    }
    return post<any>(`/booking/scan`, formData);
  }

  /**
   * Lấy booking đang hoạt động của 1 slot
   * GET /api/v1/booking/active/slot/:slotId
   */
  async getActiveBookingBySlot(slotId: number): Promise<any> {
    return get<any>(`/booking/active/slot/${slotId}`);
  }
}

export const bookingService = new BookingService();
