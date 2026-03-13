import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import axios from "axios";

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
  revenueOverTime: { date: string; amount: number }[];
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
      const params: Record<string, string | undefined> = {
        lotId: lotId !== 'all' ? lotId : undefined,
      };

      if (dateRange?.from) {
        params.startDate = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange?.to) {
        params.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      // Replace with your actual backend endpoint
      const response = await axios.get<AnalyticsData>('/api/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  // Helper for Exporting Data -> In a real app we would call a backend endpoint that returns a Blob
  // For frontend, we will use the `xlsx` library to generate it within the page component context.
}

export const analyticsService = new AnalyticsService();
