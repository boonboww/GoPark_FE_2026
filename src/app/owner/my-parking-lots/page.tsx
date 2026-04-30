"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ParkingLotList from "./components/ParkingLotList";
import { useOwnerParkingLots } from "@/hooks/useOwnerParkingLots";
import { CreateLotModal as CreateParkingLotDialog } from "../parkinglot_management/components/create-lot-modal";
import EditParkingLotDialog from "../account/EditParkingLotDialog";
import { useRouter } from "next/navigation";
import { useCustomerStore } from "@/stores/customer.store";
import { ParkingLotType } from "@/types/owner";

export default function MyParkingLotsPage() {
  const router = useRouter();
  const setLotId = useCustomerStore((s) => s.setLotId);
  const { data: parkingLots = [], isLoading: isLoadingLots } =
    useOwnerParkingLots();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [editingLot, setEditingLot] = React.useState<ParkingLotType | null>(
    null,
  );

  const handleManageLot = (lotId: number) => {
    setLotId(lotId);
    router.push("/owner/parkinglot_management");
  };

  const handleEditLot = (lot: ParkingLotType) => {
    setEditingLot(lot);
  };

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
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-10 w-full">
          {/* Header Section */}
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    Bãi đỗ của tôi
                  </h1>
                  <div className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                    <span className="text-[18px] font-black text-slate-500">
                      {parkingLots.length} bãi
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 font-medium max-w-lg">
                  Quản lý và theo dõi hiệu suất các điểm đỗ xe trong hệ thống
                  của bạn.
                </p>
              </div>

              <Button
                id="add-parking-lot-btn"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-black hover:bg-slate-800 text-white font-bold px-8 py-7 rounded-[24px] shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
              >
                <Plus className="w-6 h-6" />
                Thêm bãi đỗ mới
              </Button>
            </div>
          </div>

          {/* List Section */}
          <div
            id="parking-lot-list-card"
            className="bg-slate-50/50 rounded-[40px] p-1 border border-slate-100"
          >
            <div className="bg-white rounded-[38px] p-6 sm:p-8 shadow-sm">
              <ParkingLotList
                parkingLots={parkingLots}
                isLoading={isLoadingLots}
                onManage={handleManageLot}
                onEdit={handleEditLot}
              />
            </div>
          </div>
        </div>

        <CreateParkingLotDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <EditParkingLotDialog
          parkingLot={editingLot}
          open={!!editingLot}
          onOpenChange={(open) => !open && setEditingLot(null)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
