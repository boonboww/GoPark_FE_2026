"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

import { OverviewCards } from "@/components/owner/dashboard/overview-cards";
import { RevenueChart } from "@/components/owner/dashboard/revenue-chart";
import { ParkingOccupancy } from "@/components/owner/dashboard/parking-occupancy";
import { RecentActivity } from "@/components/owner/dashboard/recent-activity";
import { OperationCenter } from "@/components/owner/dashboard/operation-center";

import { dashboardService } from "@/services/dashboard.service";
import { DashboardSummaryResponse } from "@/types/dashboard";
import { useAuthStore } from "@/stores/auth.store";

export default function Page() {
  const { user } = useAuthStore();
  // Fallback if somehow user is undefined, though RoleGuard should prevent this
  const ownerId = user?.id;
  // || "019d1fbc-2c1a-7c4c-b75b-bd7fc875be16"

  const { data, isLoading, error } = useQuery<DashboardSummaryResponse>({
    queryKey: ["dashboardSummary", ownerId],
    queryFn: () => dashboardService.getDashboardSummary(ownerId),
    enabled: !!user?.id, // Only fetch if we have a valid user id
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="max-w-[1400px] mx-auto p-6 flex-1 space-y-6 w-full @container/main">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Tổng quan
            </h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi trạng thái và hiệu suất hoạt động của hệ thống bãi đỗ xe.
            </p>
          </div>

          <div className="relative min-h-[500px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="p-4 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                Lỗi khi tải dữ liệu Dashboard. Vui lòng kiểm tra kết nối API.
              </div>
            )}

            {!isLoading && data && (
              <div className="space-y-6">
                {/* Row 1: KPI Cards */}
                <OverviewCards data={data.overview} />

                {/* Row 2: Charts and Occupancy */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RevenueChart data={data.revenueChart} />
                  </div>
                  <div className="col-span-1">
                    <ParkingOccupancy data={data.parkingOccupancy} />
                  </div>
                </div>

                {/* Row 3: Activity and Operation Center */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                  <div className="lg:col-span-2">
                    <RecentActivity data={data.recentActivities.slice(0, 8)} />
                  </div>
                  <div className="col-span-1">
                    <OperationCenter alerts={data.alerts} overview={data.overview} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
