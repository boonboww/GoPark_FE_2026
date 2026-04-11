"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BookingDataTable } from "@/components/features/bookings/BookingDataTable";
import { useCustomerStore } from "@/stores/customer.store";

export default function BookingsPage() {
  const { lotId } = useCustomerStore();

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
      <SidebarInset className="bg-slate-50">
        <SiteHeader />

        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Lịch sử Booking
              </h1>
              <p className="text-slate-500 font-medium">
                Theo dõi và quản lý toàn bộ các lượt đặt chỗ tại bãi đỗ xe của
                bạn.
              </p>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-2 md:p-6">
            <BookingDataTable />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
