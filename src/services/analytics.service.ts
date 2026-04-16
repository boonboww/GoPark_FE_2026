import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { get } from "@/lib/api";

// Interfaces mapping to the requested schema
export interface AnalyticsTransaction {
  id: string;
  parkingLotName: string;
  licensePlate: string;
  time: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  method: 'VNPAY' | 'VIETQR' | 'WALLET';
}

export interface AnalyticsTopLot {
  id: string;
  name: string;
  totalRevenue: number;
  occupancyRate: number;
}

export interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    revenueStatus: { value: number; isUp: boolean };
    successfulTransactions: number;
    occupancyRate: number;
    totalParkingLots: number;
  };
  revenueOverTime: { date: string; amount: number; bookingCount?: number }[];
  paymentMethods: { method: string; value: number; color: string }[];
  trafficFlow: { hour: string; in: number; out: number }[];
  recentTransactions: AnalyticsTransaction[];
  topParkingLots: AnalyticsTopLot[];
  parkingLotsList: { id: string; name: string }[];
}

class AnalyticsService {
  async getAnalytics(
    dateRange: DateRange | undefined,
    lotId: string,
  ): Promise<AnalyticsData> {
    try {
      const year = dateRange?.from ? dateRange.from.getFullYear() : 2026;
      const metricsParams: Record<string, string> = {};
      const revenueParams: Record<string, string> = { year: year.toString() };

      if (lotId !== 'all') {
        metricsParams.lotId = lotId;
        revenueParams.lotId = lotId;
      }

      // Tạm thời fix cứng ownerId = 2 theo kịch bản
      const ownerId = "2";

      const [metricsRes, revenueRes, parkingLotsRes] = await Promise.all([
        get<any>(`/booking/owner-analytics/${ownerId}/metrics`, metricsParams),
        get<any[]>(`/booking/owner-analytics/${ownerId}/revenue-by-month`, revenueParams),
        get<any[]>(`/parking-lots/owner/${ownerId}`)
      ]);

      const revenueOverTime = revenueRes.map((item) => ({
        date: `Tháng ${item.month}`,
        amount: item.revenue || 0,
        bookingCount: item.bookingCount || 0
      }));

      // Dữ liệu mock cho các phần chưa có API
      const mockPaymentMethods = [
        { method: "VNPAY", value: 65, color: "#2563eb" },
        { method: "Việt QR", value: 25, color: "#10b981" },
        { method: "Ví GoPark", value: 10, color: "#f59e0b" },
      ];

      const mockTrafficFlow = Array.from({ length: 24 }).map((_, i) => ({
        hour: `${i}:00`,
        in: Math.floor(Math.random() * 50) + 10,
        out: Math.floor(Math.random() * 50) + 10,
      }));

      const parkingLotsList = parkingLotsRes.map((lot) => ({
        id: lot.id.toString(),
        name: lot.name
      }));

      return {
        metrics: {
          totalRevenue: metricsRes.monthlyRevenue || 0,
          revenueStatus: { 
            value: metricsRes.growthPercent || 0, 
            isUp: (metricsRes.growthPercent || 0) >= 0 
          },
          successfulTransactions: metricsRes.totalBookings || 0,
          occupancyRate: 85, // Mock data
          totalParkingLots: parkingLotsList.length,
        },
        revenueOverTime,
        paymentMethods: mockPaymentMethods,
        trafficFlow: mockTrafficFlow,
        recentTransactions: [],
        topParkingLots: [],
        parkingLotsList
      };

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
