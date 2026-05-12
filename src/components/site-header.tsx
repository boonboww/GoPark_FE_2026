"use client";

import { Loader2, Search, Bell, Mail } from "lucide-react";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOwnerParkingLots } from "@/hooks/useOwnerParkingLots";
import { useOwnerTotals } from "@/hooks/useOwnerTotals";
import { useCustomerStore } from "@/stores/customer.store";
import { useAuthStore } from "@/stores/auth.store";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/owner/NotificationBell";

export function SiteHeader() {
  const { lotId, setLotId } = useCustomerStore();
  const { data: parkingLots, isLoading: isLoadingLots } = useOwnerParkingLots();
  const { data: totals, isLoading: isLoadingTotals } = useOwnerTotals();
  const { user } = useAuthStore();

  // Auto-select bãi đầu tiên khi load xong
  useEffect(() => {
    if (parkingLots && parkingLots.length > 0 && lotId === null) {
      setLotId(parkingLots[0].id);
    }
  }, [parkingLots, lotId, setLotId]);

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-sm transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between px-4 lg:px-8 h-full">
        {/* Left: Sidebar Trigger + Search-style lot selector */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1 h-9 w-9 rounded-lg border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-all" />
          <Separator orientation="vertical" className="mx-2 h-4 hidden sm:block" />
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Select
              value={lotId !== null ? String(lotId) : ""}
              onValueChange={(val) => setLotId(Number(val))}
              disabled={isLoadingLots || !parkingLots?.length}
            >
              <SelectTrigger id="lot-selector" className="pl-10 w-[240px] bg-muted/40 border-border rounded-xl h-10 text-base font-medium">
                {isLoadingLots ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                  </span>
                ) : (
                  <SelectValue placeholder="Chọn bãi đỗ xe" />
                )}
              </SelectTrigger>
              <SelectContent>
                {parkingLots?.map((lot) => (
                  <SelectItem
                    key={lot.id}
                    value={String(lot.id)}
                    className="text-base"
                  >
                    {lot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lot count badge */}
          {!isLoadingTotals && totals?.totalParkingLots !== undefined && (
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline bg-muted/50 px-3 py-1 rounded-full">
              {totals.totalParkingLots} bãi đỗ xe
            </span>
          )}
        </div>

        {/* Right: Notification + user */}
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
