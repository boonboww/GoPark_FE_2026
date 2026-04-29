"use client";

import React, { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { DashboardHeader } from "./components/DashboardHeader";
import { OverviewCards } from "./components/OverviewCards";
import { AnalyticsCharts } from "./components/Charts";
import { DataTables } from "./components/DataTables";
import { analyticsService, AnalyticsData } from "@/services/analytics.service";
import { toast } from "sonner";
import * as xlsx from "xlsx";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useCustomerStore } from "@/stores/customer.store";

export default function AnalyticsPage() {
  const { lotId } = useCustomerStore();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentLotId = lotId ? lotId.toString() : "all";
        const result = await analyticsService.getAnalytics(
          dateRange,
          currentLotId,
        );
        setData(result);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err);
        toast.error("Không tải được dữ liệu thống kê.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, lotId]);

  const handleExport = () => {
    if (!data) return;

    try {
      const wb = xlsx.utils.book_new();

      // 1. Sheet: Tổng quan KPI
      const summaryData = [
        { "Hạng mục": "Tổng doanh thu (VND)", "Giá trị": data.metrics.totalRevenue },
        { "Hạng mục": "Giao dịch thành công", "Giá trị": data.metrics.successfulTransactions },
        { "Hạng mục": "Tỉ lệ lấp đầy trung bình (%)", "Giá trị": data.metrics.occupancyRate },
        { "Hạng mục": "Số lượng bãi đỗ đang quản lý", "Giá trị": data.metrics.totalParkingLots },
        { "Hạng mục": "Ngày trích xuất", "Giá trị": new Date().toLocaleString('vi-VN') }
      ];
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(summaryData), "1. Tổng quan");

      // 2. Sheet: Chi tiết Giao dịch
      const txData = data.recentTransactions.map(tx => ({
        "ID Giao dịch": tx.id,
        "Vị trí / Bãi đỗ": tx.parkingLotName,
        "Biển số xe": tx.licensePlate,
        "Thời gian": tx.time,
        "Số tiền (VND)": tx.amount,
        "Trạng thái": tx.status,
        "Phương thức": tx.method
      }));
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(txData), "2. Giao dịch chi tiết");

      // 3. Sheet: Phân tích Doanh thu Tháng
      const revenueData = data.revenueOverTime.map(r => ({
        "Thời gian": r.date,
        "Doanh thu thực tế (VND)": r.amount,
        "Số lượt đặt chỗ": r.bookingCount
      }));
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(revenueData), "3. Doanh thu theo tháng");

      // 4. Sheet: Hiệu suất từng Bãi đỗ
      const topLotsData = data.topParkingLots.map(lot => ({
        "Tên bãi đỗ": lot.name,
        "Doanh thu đóng góp (VND)": lot.totalRevenue,
        "Tỉ lệ lấp đầy TB (%)": lot.occupancyRate
      }));
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(topLotsData), "4. Hiệu suất bãi đỗ");

      // 5. Sheet: Lưu lượng xe (Traffic)
      const trafficData = data.trafficFlow.map(t => ({
        "Khung giờ": t.hour,
        "Lượt xe vào": t.in,
        "Lượt xe ra": t.out
      }));
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(trafficData), "5. Lưu lượng xe");

      // 6. Sheet: Phương thức thanh toán
      const paymentData = data.paymentMethods.map(p => ({
        "Cổng thanh toán": p.method,
        "Số lượng giao dịch": p.value
      }));
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(paymentData), "6. Thanh toán");

      // Download
      xlsx.writeFile(wb, `GoPark_Bao_Cao_Chuyen_Sau_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Đã khởi tạo và tải xuống báo cáo chi tiết!");
    } catch (error) {
      console.error("Export error", error);
      toast.error("Lỗi khi xuất báo cáo.");
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="max-w-[1400px] mx-auto w-full p-6 space-y-6">
          <DashboardHeader 
            dateRange={dateRange} 
            setDateRange={setDateRange} 
            onExport={handleExport}
          />

          <div className="relative min-h-[500px]">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {error ? (
              <div className="flex items-center justify-center h-[500px] text-destructive">
                Đã có lỗi xảy ra khi tải dữ liệu thống kê.
              </div>
            ) : data ? (
              <div className="space-y-6">
                <OverviewCards metrics={data.metrics} />
                <AnalyticsCharts 
                  revenueData={data.revenueOverTime}
                  paymentData={data.paymentMethods}
                  trafficData={data.trafficFlow}
                />
                <DataTables 
                  recentTransactions={data.recentTransactions}
                  topParkingLots={data.topParkingLots}
                />
              </div>
            ) : null}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
