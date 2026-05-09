"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  Settings,
  Layers,
  LayoutGrid,
  Filter,
  Search,
  RotateCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { TicketDetail, TicketData } from "./ticket-detail";
import { bookingService } from "@/services/booking.service";
import { SetupWizardTab } from "./components/setup-wizard-modal";
import { StructureManagerTab } from "./components/structure-manager-modal";
import { ZoneSlotGrid, ApiSlot } from "./components/zone-slot-grid";
import { CreateLotModal } from "./components/create-lot-modal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery } from "@tanstack/react-query";
import { parkingService } from "@/services/parking.service";
import { useCustomerStore } from "@/stores/customer.store";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useTourStore } from "@/store/tourStore";
import { Slot } from "./components/slot";

interface ZoneData {
  id: string;
  zoneId: number;
  floorId: number;
  name: string;
  totalSlots: number;
  slots: any[];
}

interface FloorData {
  id: string;
  floorId: number;
  name: string;
  zones: ZoneData[];
}

export default function ParkingLotManagementPage() {
  const { user: authUser } = useAuthStore();
  const role = authUser?.role?.toLowerCase() || "user";
  const { lotId } = useCustomerStore();
  const [date, setDate] = React.useState<Date>(new Date());
  const [startTime, setStartTime] = React.useState("10:00");
  const [endTime, setEndTime] = React.useState("14:00");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isFetchingAvailable, setIsFetchingAvailable] = React.useState(false);
  const [availableMapData, setAvailableMapData] = React.useState<any>(null);
  
  const isTourActive = useTourStore((state) => state.isTourActive);

  // Fetch all bookings to find overdue ones
  const { data: lotBookings = [] } = useQuery({
    queryKey: ["lotBookings", lotId],
    queryFn: () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return bookingService.getBookingsByParkingLot({
        lotId: lotId!,
        startDate: format(sevenDaysAgo, "yyyy-MM-dd") + "T00:00:00Z",
      });
    },
    enabled: !!lotId,
    refetchInterval: 30_000,
  });

  const overdueSlotIds = React.useMemo(() => {
    const now = new Date();
    return lotBookings
      .filter(
        (b) =>
          (b.status === "ACTIVE" || b.status === "PENDING") &&
          new Date(b.endTime) < now,
      )
      .map((b) => b.slotId.toString());
  }, [lotBookings]);

  // Self-healing: Get all slots that TRULY have an active or pending booking
  const validActiveSlotIds = React.useMemo(() => {
    return new Set(
      lotBookings
        .filter((b) => b.status === "ACTIVE" || b.status === "PENDING")
        .map((b) => b.slotId.toString()),
    );
  }, [lotBookings]);

  // Fetch real structure
  const { data: floorsResponse, isLoading } = useQuery({
    queryKey: ["parkingLotFloors", lotId],
    queryFn: () => parkingService.getFloors(lotId as number),
    enabled: !!lotId,
  });

  const floorsData = React.useMemo<FloorData[]>(() => {
    const rawFloors = Array.isArray(floorsResponse)
      ? floorsResponse
      : (floorsResponse?.data ?? []);

    return rawFloors.map((floor: any): FloorData => {
      // Tìm mảng zones từ các tên trường phổ biến
      const rawZones =
        floor.parkingZone ||
        floor.parkingZones ||
        floor.zones ||
        floor.parking_zones ||
        [];

      return {
        id: (floor.id || "").toString(),
        floorId: floor.id as number,
        name: floor.floor_name || floor.name || `Tầng ${floor.floor_number}`,
        zones: (Array.isArray(rawZones) ? rawZones : []).map((zone: any) => ({
          id: (zone.id || "").toString(),
          zoneId: zone.id as number,
          floorId: floor.id as number,
          name: zone.zone_name || zone.name || `Khu ${zone.prefix || zone.id}`,
          totalSlots: zone.total_slots || zone.totalSlots || 0,
          slots: [],
        })),
      };
    });
  }, [floorsResponse]);

  const [selectedFloor, setSelectedFloor] = React.useState("");
  const [selectedZone, setSelectedZone] = React.useState<string>("all"); // "all" or zoneId

  // Auto select first floor when data loads
  React.useEffect(() => {
    if (floorsData.length > 0 && !selectedFloor) {
      setSelectedFloor(floorsData[0].id);
    }
  }, [floorsData, selectedFloor]);

  // Modal State
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);
  const hasData = floorsData.length > 0;

  const [activeTab, setActiveTab] = React.useState(hasData ? "edit" : "setup");

  // Whenever we change floors, reset selected zone to 'all'
  React.useEffect(() => {
    setSelectedZone("all");
  }, [selectedFloor]);

  // Make sure to sync activeTab correctly when opening
  const openConfigModal = (tab: "setup" | "edit") => {
    setActiveTab(tab);
    setIsConfigOpen(true);
  };

  const [isTicketOpen, setIsTicketOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<{
    data: TicketData | null;
    status: "occupied" | "reserved" | "available";
    slotId?: number | null;
    slotCode?: string;
    floorName?: string;
    zoneName?: string;
  }>({ data: null, status: "available" });


  const currentFloor = floorsData.find((f: FloorData) => f.id === selectedFloor);
  const activeZones = React.useMemo(() => {
    if (!currentFloor) return [];
    if (selectedZone === "all") return currentFloor.zones;
    return currentFloor.zones.filter((z) => z.id === selectedZone);
  }, [currentFloor, selectedZone]);

  // Pre-calculate zone slots map for availability map mode
  const zoneSlotsMap = React.useMemo(() => {
    if (!availableMapData) return new Map<number, ApiSlot[]>();
    const map = new Map<number, ApiSlot[]>();
    const floors = availableMapData.parkingFloor || [];
    for (const f of floors) {
      const zones = f.parkingZones || f.zones || f.parking_zones || [];
      for (const zone of zones) {
        const slots = zone.slot || zone.slots || [];
        // Hiển thị tất cả các slot theo trạng thái mà BE trả về (đã tính toán theo thời gian)
        map.set(zone.id, slots);
      }
    }
    return map;
  }, [availableMapData]);

  const handleSlotClick = async (slot: ApiSlot) => {
    const floor = floorsData.find((f) => f.id === selectedFloor);
    const currentZoneName =
      activeZones.length === 1 ? activeZones[0].name : "Khu vực";

    const isMock = slot.id >= 9990;
    const isValidActive = isMock || validActiveSlotIds.has(slot.id.toString());
    const effectiveStatus = isValidActive ? slot.status : "AVAILABLE";

    if (effectiveStatus === "OCCUPIED" || effectiveStatus === "RESERVED") {
      // Tìm booking tương ứng trong danh sách đã load sẵn
      let activeBooking = lotBookings.find(
        (b) =>
          b.slotId.toString() === slot.id.toString() &&
          (b.status === "ACTIVE" || b.status === "PENDING"),
      );

      if (isMock) {
        activeBooking = {
          id: 999201,
          userName: "Khách Mẫu Hướng Dẫn",
          licensePlate: "51A-999.99",
          status: "ACTIVE",
          slotId: "9992",
          totalPrice: 20000,
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString()
        } as any;
      }

      if (activeBooking) {
        setSelectedTicket({
          data: {
            ticketCode: activeBooking.id?.toString() || "N/A",
            customerName: activeBooking.userName || "N/A",
            licensePlate: activeBooking.licensePlate || "N/A",
            position: slot.code,
            startTime: new Date(activeBooking.startTime),
            endTime: new Date(activeBooking.endTime),
            price: activeBooking.totalPrice || 0,
          },
          status: effectiveStatus.toLowerCase() as any,
          slotId: slot.id,
          slotCode: slot.code,
          floorName: currentFloor?.name,
          zoneName: currentZoneName,
        });
        setIsTicketOpen(true);
        return;
      }

      // Fallback: Nếu không tìm thấy trong list local, thử gọi API trực tiếp
      try {
        const response = await bookingService.getActiveBookingBySlot(slot.id);
        const bData = response?.data || response;

        setSelectedTicket({
          data: {
            ticketCode: bData.id?.toString() || "N/A",
            customerName:
              bData.user?.profile?.name || bData.user?.email || "N/A",
            licensePlate: bData.vehicle?.plate_number || "N/A",
            position: slot.code,
            startTime: new Date(bData.start_time),
            endTime: new Date(bData.end_time),
            price: bData.invoice?.[0]?.total || 0,
          },
          status: slot.status.toLowerCase() as any,
          slotId: slot.id,
          slotCode: slot.code,
          floorName: currentFloor?.name,
          zoneName: currentZoneName,
        });
        setIsTicketOpen(true);
      } catch (error: any) {
        console.error("Error fetching slot detail:", error);
        setSelectedTicket({
          data: null,
          status: effectiveStatus.toLowerCase() as any,
          slotId: slot.id,
          slotCode: slot.code,
          floorName: currentFloor?.name,
          zoneName: currentZoneName,
        });
        setIsTicketOpen(true);
      }
    } else {
      setSelectedTicket({
        data: null,
        status: "available",
        slotId: slot.id,
        slotCode: slot.code,
        floorName: currentFloor?.name,
        zoneName: currentZoneName,
      });
      setIsTicketOpen(true);
    }
  };

  const handleApplyFilter = async () => {
    if (!lotId || !date) {
      toast.error("Vui lòng chọn đầy đủ thông tin");
      return;
    }

    try {
      setIsFetchingAvailable(true);

      // Combine date and time
      const combine = (timeStr: string) => {
        const d = new Date(date);
        const [h, m] = timeStr.split(":").map(Number);
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };

      const startISO = combine(startTime);
      const endISO = combine(endTime);

      const response = await parkingService.getAvailableMap(
        lotId,
        startISO,
        endISO,
      );

      setAvailableMapData(response?.data || response);
      setIsFilterOpen(false);
      toast.success("Đã cập nhật bản đồ chỗ trống");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Lỗi khi tải bản đồ chỗ trống",
      );
    } finally {
      setIsFetchingAvailable(false);
    }
  };

  const handleResetFilter = () => {
    setAvailableMapData(null);
    toast.info("Đã quay lại chế độ thời gian thực");
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
        {role !== "staff" && <SiteHeader />}

        <div className="max-w-[1400px] mx-auto p-6 space-y-6 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Vận hành bãi đỗ
              </h1>
              <p className="text-slate-500 font-medium">
                Quản lý cấu trúc tầng, khu vực và giám sát trạng thái ô đỗ trực
                tuyến.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!hasData ? (
                <Button
                  id="setup-first-grid-btn"
                  onClick={() => openConfigModal("setup")}
                  className="bg-black hover:bg-slate-800 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" /> Thiết lập sơ đồ đầu tiên
                </Button>
              ) : (
                <Button
                  id="config-tech-price-btn"
                  onClick={() => openConfigModal("edit")}
                  variant="outline"
                  className="h-12 px-6 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" /> Cấu hình kỹ thuật & Giá
                </Button>
              )}
            </div>
          </div>

          {/* TOP BAR: Button on Left, Date/Time on Right */}

          {/* SELECTORS: Floor dropdown + Zone pills */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            {/* Floor selector row */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Tầng
                  </span>
                </div>
                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200 font-bold text-sm shadow-none focus:ring-0">
                    <SelectValue placeholder="Chọn tầng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {floorsData.map((floor) => (
                      <SelectItem
                        key={floor.id}
                        value={floor.id}
                        className="font-semibold"
                      >
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {availableMapData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilter}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold h-9 px-3 transition-all"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Xoá lọc
                  </Button>
                )}

                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={availableMapData ? "default" : "outline"}
                      className="h-9 px-4 font-bold text-xs gap-2"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      {availableMapData ? "Đang lọc" : "Bộ lọc thời gian"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[320px] p-5 rounded-2xl shadow-2xl border-slate-100"
                    align="end"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-800 tracking-tight">
                          Cấu hình thời gian
                        </h4>
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Date Picker Section */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Ngày kiểm tra
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-bold border-slate-200 h-10 bg-slate-50"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                              {date ? format(date, "PPP") : "Chọn ngày"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={(d) => d && setDate(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Time Range Section */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Khoảng giờ (In - Out)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <Input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="h-10 border-slate-200 bg-slate-50 font-bold px-3"
                            />
                          </div>
                          <div className="relative">
                            <Input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="h-10 border-slate-200 bg-slate-50 font-bold px-3"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={handleApplyFilter}
                          disabled={isFetchingAvailable}
                        >
                          {isFetchingAvailable ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4 mr-2" />
                          )}
                          Áp dụng Lọc
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-slate-400 hover:text-slate-600 font-bold text-xs"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Đóng
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>


            {/* Zone pills row */}
            <div className="flex items-center px-4 py-2.5 gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 mr-1 shrink-0">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  Khu vực
                </span>
              </div>

              {/* All zones pill */}
              <button
                onClick={() => setSelectedZone("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 ${
                  selectedZone === "all"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                Tất cả
              </button>

              {/* Per-zone pills */}
              {currentFloor?.zones.map((z) => {
                const zz = z as any;
                const isActive = selectedZone === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZone(z.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md shadow-slate-300"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {z.name}
                    {zz.totalSlots > 0 && (
                      <span
                        className={`text-[10px] font-bold rounded-full px-1 ${
                          isActive ? "text-white/70" : "text-slate-400"
                        }`}
                      >
                        {zz.totalSlots}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID */}
          <div className="flex-1 bg-card rounded-xl shadow-sm border border-border overflow-hidden flex flex-col relative w-full">
            {/* Grid header bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-black text-slate-900 ">
                    Sơ đồ bãi đỗ
                  </span>
                  <span className="text-slate-300 font-light">—</span>
                  <span className="text-sm font-bold text-slate-600 tracking-tight">
                    {currentFloor?.name ?? ""}
                  </span>
                </div>

                <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold uppercase tracking-widest text-slate-400">
                      Quy mô:
                    </span>
                    <span className="text-[15px] font-black text-slate-700">
                      {floorsData.reduce(
                        (acc, f) =>
                          acc +
                          f.zones.reduce(
                            (az, z) => az + (z as any).totalSlots,
                            0,
                          ),
                        0,
                      )}{" "}
                      ô đỗ
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[15px] font-bold uppercase tracking-widest text-slate-400">
                      Cấu trúc:
                    </span>
                    <span className="text-[15px] font-black text-slate-700">
                      {floorsData.length} tầng /{" "}
                      {floorsData.reduce((acc, f) => acc + f.zones.length, 0)}{" "}
                      khu
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div id="parking-grid-map" className="flex-1 overflow-auto bg-slate-50/40 p-4 sm:p-8 relative min-h-[460px]">
              {/* Dot pattern background */}
              <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1.5px 1.5px, #94a3b8 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }}
              />

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-20 relative z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
                    </div>
                  </div>
                  <p className="font-semibold tracking-wide text-sm">
                    Đang tải cấu trúc bãi đỗ...
                  </p>
                </div>
              ) : activeZones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-6 mt-20 relative z-10">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-slate-100">
                    <Settings className="w-14 h-14 text-slate-300 pointer-events-none animate-spin-slow" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      Bãi đỗ chưa có Cấu trúc
                    </h2>
                    <p className="font-medium tracking-wide text-slate-500 max-w-md mx-auto">
                      Quý khách cần phác thảo Tầng và Khu vực đỗ xe để hệ thống
                      có thể quản lý và hiển thị không gian trực quan.
                    </p>
                  </div>
                  {!hasData && (
                    <Button
                      onClick={() => openConfigModal("setup")}
                      variant="default"
                      className="mt-6"
                    >
                      Tạo Sơ Đồ Khởi Tạo Ngay
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-12 relative z-10">
                  {activeZones.map((zone, idx) => {
                    const z = zone as any;
                    return (
                      <div key={zone.id} className="relative">
                        {lotId && z.zoneId ? (
                          <ZoneSlotGrid
                            lotId={lotId as number}
                            floorId={
                              z.floorId ?? (currentFloor as any)?.floorId
                            }
                            zoneId={z.zoneId}
                            zoneName={zone.name}
                            zoneIndex={idx}
                            size={selectedZone === "all" ? "small" : "normal"}
                            onSlotClick={handleSlotClick}
                            overrideSlots={zoneSlotsMap.get(z.zoneId)}
                            isPreviewMode={!!availableMapData}
                            overdueSlotIds={overdueSlotIds}
                            validActiveSlotIds={validActiveSlotIds}
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LEGEND */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card px-5 py-3.5 rounded-xl shadow-sm border border-border">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
              Chú thích
            </span>

            {/* Mock slots for Tour Guide */}
            {isTourActive && (
              <div className="flex items-center gap-6 mt-4 p-4 border-2 border-dashed border-primary/50 bg-primary/5 rounded-2xl w-full justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Mẫu Slot Trống</span>
                  <div id="tour-mock-available-slot" onClick={() => handleSlotClick({ id: 9991, code: "M-A01", status: "AVAILABLE" } as any)}>
                    <Slot
                      slot={{ id: 9991, code: "M-A01", status: "available", label: "M-A01" }}
                      onClick={() => {}}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Mẫu Slot Có Khách</span>
                  <div id="tour-mock-occupied-slot" onClick={() => handleSlotClick({ id: 9992, code: "M-A02", status: "OCCUPIED" } as any)}>
                    <Slot
                      slot={{ 
                        id: 9992, code: "M-A02", status: "occupied", label: "M-A02",
                        ticket: {
                          startTime: new Date(Date.now() - 3600000), // 1 hour ago
                          endTime: new Date(Date.now() + 3600000)    // 1 hour left
                        }
                      }}
                      onClick={() => {}}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {/* Available */}
              <div id="legend-slot-available" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                <div className="w-4 h-7 rounded-sm bg-white border-2 border-dashed border-slate-300 shadow-sm shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Chỗ trống
                </span>
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              </div>

              {/* Occupied */}
              <div id="legend-slot-occupied" className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-border rounded-full">
                <div className="relative w-4 h-7 rounded-sm bg-muted border-2 border-muted-foreground shadow-sm overflow-hidden shrink-0">
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-muted-foreground" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Xe đang đỗ
                </span>
              </div>

              {/* Reserved */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
                <div className="relative w-4 h-7 rounded-sm bg-orange-500 border-2 border-orange-600 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-orange-600">
                  Đã đặt trước
                </span>
              </div>

              {/* Overdue */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full animate-pulse">
                <div className="w-4 h-7 rounded-sm bg-red-600 border-2 border-red-700 shadow-sm shrink-0" />
                <span className="text-xs font-semibold text-red-600">
                  Quá giờ
                </span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
              Nhấn vào ô đỗ để xem chi tiết
            </span>
          </div>
        </div>

        <TicketDetail
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
          data={selectedTicket.data}
          status={selectedTicket.status}
          slotId={selectedTicket.slotId}
          slotCode={selectedTicket.slotCode}
          floorName={selectedTicket.floorName}
          zoneName={selectedTicket.zoneName}
        />

        {/* MASTER CONFIG MODAL */}
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
            <VisuallyHidden>
              <DialogTitle>Cấu hình Sơ đồ Bãi đỗ xe</DialogTitle>
            </VisuallyHidden>
            <div className="flex border-b overflow-x-auto bg-slate-50/50">
              <button
                onClick={() => setActiveTab("setup")}
                disabled={hasData}
                className={`py-4 px-6 font-semibold border-b-2 text-sm transition-colors ${activeTab === "setup" ? "border-black text-black" : "border-transparent text-slate-500 hover:text-slate-800"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Khởi tạo Cấu trúc
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                disabled={!hasData}
                className={`py-4 px-6 font-semibold border-b-2 text-sm transition-colors ${activeTab === "edit" ? "border-black text-black" : "border-transparent text-slate-500"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Chỉnh sửa Cấu trúc & Giá
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {activeTab === "setup" && (
                <SetupWizardTab onClose={() => setIsConfigOpen(false)} />
              )}
              {activeTab === "edit" && <StructureManagerTab onClose={() => setIsConfigOpen(false)} />}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
