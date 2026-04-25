"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import ParkingLotList from "../account/ParkingLotList";
import { useOwnerParkingLots } from "@/hooks/useOwnerParkingLots";
import { CreateLotModal } from "../parkinglot_management/components/create-lot-modal";

export default function MyParkingLotsPage() {
  const { data: parkingLots = [], isLoading: isLoadingLots } =
    useOwnerParkingLots();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 w-full">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Bãi đỗ của tôi
              </h1>
              <p className="text-slate-500 font-medium max-w-lg">
                Danh sách các bãi đỗ xe bạn đang sở hữu và vận hành trên hệ
                thống
              </p>
            </div>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-6 rounded-2xl shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm bãi đỗ mới
            </Button>
          </div>

          {/* Stats Summary (Optional - can be added later) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                Tổng số bãi
              </p>
              <p className="text-3xl font-black text-slate-900">
                {parkingLots.length}
              </p>
            </div>
            {/* Add more stats if needed */}
          </div>

          {/* List Section */}
          <div className="bg-slate-50/50 rounded-[40px] p-1 border border-slate-100">
            <div className="bg-white rounded-[38px] p-6 sm:p-8 shadow-sm">
              <ParkingLotList
                parkingLots={parkingLots}
                isLoading={isLoadingLots}
              />
            </div>
          </div>
        </div>

        {/* Create Modal */}
        <CreateLotModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
