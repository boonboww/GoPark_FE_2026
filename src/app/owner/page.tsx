"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

import { OwnerDashboard } from "@/components/owner/dashboard/OwnerDashboard";
import { StaffDashboard }  from "@/components/owner/dashboard/StaffDashboard";

import { dashboardService } from "@/services/dashboard.service";
import { DashboardSummaryResponse } from "@/types/dashboard";
import { useAuthStore } from "@/stores/auth.store";

export default function Page() {
  const { user } = useAuthStore();
  const ownerId = user?.id;
  const role = user?.role?.toLowerCase() || "user";

  const { data, isLoading, error } = useQuery<DashboardSummaryResponse>({
    queryKey: ["dashboardSummary", ownerId],
    queryFn: () => dashboardService.getDashboardSummary(ownerId as string),
    enabled: !!user?.id && role === "owner", // Only fetch owner stats if role is owner
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
        {role !== "staff" && <SiteHeader />}
        <div className="max-w-[1400px] mx-auto p-6 flex-1 space-y-6 w-full @container/main">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {role === "staff" ? "Bảng điều khiển nhân viên" : "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {role === "staff" 
                  ? "Chào mừng bạn trở lại. Theo dõi hoạt động bãi đỗ xe hôm nay."
                  : "Theo dõi trạng thái và hiệu suất hoạt động của hệ thống bãi đỗ xe."}
              </p>
            </div>
          </div>

          <div className="relative min-h-[500px]">
            {role === "owner" && isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {role === "owner" && error && (
              <div className="p-4 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                Lỗi khi tải dữ liệu Dashboard. Vui lòng kiểm tra kết nối API.
              </div>
            )}

            {role === "staff" ? (
              <StaffDashboard />
            ) : (
              !isLoading && data && <OwnerDashboard data={data} />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
