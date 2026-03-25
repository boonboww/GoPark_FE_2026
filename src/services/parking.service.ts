import { post } from "@/lib/api";

export interface WalkInRequest {
  name: string;
  phoneNumber: string;
  licensePlate: string;
  vehicleType: string;
  // Các field cho images sẽ được thêm vào payload form-data ở component nếu backend yêu cầu multipart/form-data
  // Trong trường hợp này gửi JSON thô theo yêu cầu:
}

export interface WalkInResponse {
  statusCode: number;
  message: string;
  data: {
    bookingId: string;
    [key: string]: any;
  };
}

class ParkingService {
  /**
   * Đăng ký khách vãng lai (walk-in) vào bãi đỗ xe
   * POST /parking-lots/:id/walk-in
   */
  async walkInCheckIn(lotId: number, payload: WalkInRequest): Promise<WalkInResponse> {
    try {
      const response = await post<WalkInResponse>(`/parking-lots/${lotId}/walk-in`, payload);
      return response;
    } catch (error) {
      console.error("Error in walkInCheckIn:", error);
      throw error;
    }
  }
}

export const parkingService = new ParkingService();
