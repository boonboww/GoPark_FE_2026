export interface DashboardSummaryResponse {
  overview: {
    todayRevenue: number;
    revenueGrowth: number;
    todayBookings: number;
    bookingsGrowth: number;
    averageOccupancy: number;
    occupancyGrowth: number;
    newCustomers: number;
    customersGrowth: number;
  };
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
  parkingOccupancy: Array<{
    lotId: number;
    name: string;
    capacity: number;
    occupied: number;
  }>;
  recentActivities: Array<{
    id: number;
    vehicle: string;
    status: 'PENDING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELED' | 'IN_USE' | 'OVERSTAY'; 
    time: string; 
    lotName: string;
  }>;
  alerts: Array<{
    id: number;
    vehicle: string;
    issue: 'OVERSTAY' | string;
    lotName: string;
    overstayHours: number;
    message: string;
  }>;
}
