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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-card transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 lg:px-6 gap-4">

        {/* Left: Search-style lot selector */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Select
              value={lotId !== null ? String(lotId) : ""}
              onValueChange={(val) => setLotId(Number(val))}
              disabled={isLoadingLots || !parkingLots?.length}
            >
              <SelectTrigger className="pl-9 w-[220px] bg-muted/40 border-border rounded-xl h-9 text-sm">
                {isLoadingLots ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Đang tải...
                  </span>
                ) : (
                  <SelectValue placeholder="Chọn bãi đỗ xe" />
                )}
              </SelectTrigger>
              <SelectContent>
                {parkingLots?.map((lot) => (
                  <SelectItem key={lot.id} value={String(lot.id)}>
                    {lot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lot count badge */}
          {!isLoadingTotals && totals?.totalParkingLots !== undefined && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {totals.totalParkingLots} bãi đỗ xe
            </span>
          )}
        </div>

        {/* Right: Notification + user */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors relative">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border ml-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {user?.profile?.name?.charAt(0)?.toUpperCase() ?? "O"}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{user?.profile?.name ?? "Chủ bãi"}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{user?.email ?? "owner@gopark.vn"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
