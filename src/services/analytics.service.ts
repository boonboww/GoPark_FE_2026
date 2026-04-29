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
      const formattedDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const metricsParams: Record<string, string> = {};
      const revenueParams: Record<string, string> = { year: year.toString() };
      const commonParams: Record<string, string> = { date: formattedDate };

      if (lotId !== 'all') {
        metricsParams.lotId = lotId;
        revenueParams.lotId = lotId;
        commonParams.lotId = lotId;
      }

      const paymentParams: Record<string, string> = { ...metricsParams };
      if (dateRange?.from && dateRange?.to) {
        paymentParams.startDate = format(dateRange.from, 'yyyy-MM-dd');
        paymentParams.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      const [
        metricsRes, 
        revenueRes, 
        parkingLotsRes,
        paymentRes,
        trafficRes,
        topLotsRes,
        recentTxRes
      ] = await Promise.all([
        get<any>(`/booking/owner-analytics/me/metrics`, metricsParams),
        get<any[]>(`/booking/owner-analytics/me/revenue-by-month`, revenueParams),
        get<any[]>(`/parking-lots/owner/me/lots`),
        get<any[]>(`/booking/owner-analytics/me/payment-methods`, paymentParams),
        get<any[]>(`/booking/owner-analytics/me/hourly-traffic`, commonParams), 
        get<any[]>(`/booking/owner-analytics/me/top-parking-lots`),
        get<any[]>(`/booking/owner-analytics/me/recent-transactions`, { ...commonParams, limit: '5' })
      ]);

      // Helper to handle both direct arrays and wrapped { data: [] } responses
      const ensureArray = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        const potentialArray = res.data || res.items || res.results;
        return Array.isArray(potentialArray) ? potentialArray : [];
      };

      const revenueData = ensureArray(revenueRes);
      const revenueOverTime = revenueData.map((item: any) => ({
        date: `Tháng ${item.month || item.date}`,
        amount: item.revenue || item.amount || 0,
        bookingCount: item.bookingCount || item.count || 0
      }));

      const parkingLotsList = ensureArray(parkingLotsRes).map((lot: any) => ({
        id: (lot.id || lot._id || lot.lotId).toString(),
        name: lot.name || "Bãi đỗ chưa đặt tên"
      }));

      const paymentMethods = ensureArray(paymentRes).map((item: any) => {
        const name = item.name || item.method || item.paymentMethod || item.type || "Khác";
        const count = item.count || 0;
        const revenue = item.value || item.amount || item.revenue || item.total || 0;
        
        // Dynamic color mapping based on name
        let color = '#94a3b8'; // Default gray
        const upperName = name.toString().toUpperCase();
        if (upperName.includes('VNPAY')) color = '#2563eb';
        else if (upperName.includes('QR') || upperName.includes('VIET')) color = '#10b981';
        else if (upperName.includes('WALLET') || upperName.includes('VÍ') || upperName.includes('GOPARK')) color = '#f59e0b';
        else if (upperName.includes('CASH') || upperName.includes('TIỀN MẶT')) color = '#64748b';

        return {
          method: name,
          value: count, // Now value represents the number of transactions
          revenue: revenue, // Keep revenue for other uses if needed
          color: color
        };
      });

      const trafficFlow = ensureArray(trafficRes).map((item: any) => ({
        hour: item.time || item.hour || "00:00",
        in: item.vehicles || item.in || item.count || 0,
        out: item.out || Math.floor((item.vehicles || 10) * 0.6)
      }));

      const recentTransactions = ensureArray(recentTxRes).map((tx: any) => ({
        id: tx.id || tx._id || `TX-${Math.random().toString(36).substr(2, 5)}`,
        parkingLotName: tx.parkingLotName || tx.lotName || tx.slotCode || "N/A",
        licensePlate: tx.licensePlate || tx.customerName || "N/A",
        time: tx.time || tx.date || tx.createdAt || new Date().toISOString(),
        amount: tx.amount || 0,
        status: tx.status || "PAID",
        method: tx.method || "WALLET",
      }));

      const topParkingLots = ensureArray(topLotsRes).map((lot: any) => {
        const rate = lot.occupancyRate || lot.occupancy_rate || 0;
        return {
          id: (lot.id || lot._id || lot.lotId || "0").toString(),
          name: lot.name || "N/A",
          totalRevenue: lot.totalRevenue || lot.revenue || 0,
          occupancyRate: Number(rate.toFixed(1))
        };
      });

      // Metrics handling
      const metrics = metricsRes?.data || metricsRes || {};

      return {
        metrics: {
          totalRevenue: metrics.monthlyRevenue || metrics.totalRevenue || 0,
          revenueStatus: { 
            value: metrics.growthPercent || metrics.growth || 0, 
            isUp: (metrics.growthPercent || metrics.growth || 0) >= 0 
          },
          successfulTransactions: metrics.totalBookings || metrics.count || 0,
          occupancyRate: Number((metrics.occupancyRate || metrics.occupancy_rate || metrics.avgOccupancy || 0).toFixed(1)), 
          totalParkingLots: parkingLotsList.length,
        },
        revenueOverTime,
        paymentMethods,
        trafficFlow,
        recentTransactions,
        topParkingLots,
        parkingLotsList
      };

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
