"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Clock, Settings } from "lucide-react";

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
import { Label } from "@/components/ui/label";

import { TicketDetail, TicketData } from "./ticket-detail";
import { MockFloor, MockSlot } from "./components/mock-data";
import { Slot } from "./components/slot";
import { SetupWizardTab } from "./components/setup-wizard-modal";
import { StructureManagerTab } from "./components/structure-manager-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { parkingService } from "@/services/parking.service";
import { useCustomerStore } from "@/stores/customer.store";
import { Loader2 } from "lucide-react";

export default function ParkingLotManagementPage() {
  const { lotId } = useCustomerStore();
  const [date, setDate] = React.useState<Date>();
  
  // Fetch real structure
  const { data: floorsResponse, isLoading } = useQuery({
    queryKey: ["parkingLotFloors", lotId],
    queryFn: () => parkingService.getFloors(lotId as number),
    enabled: !!lotId,
  });

  const floorsData = React.useMemo(() => {
    if (!floorsResponse?.data) return [] as MockFloor[];
    return floorsResponse.data.map((floor: any) => ({
      id: floor.id.toString(),
      name: floor.floor_name,
      zones: (floor.parkingZone || []).map((zone: any) => {
        const prefix = zone.description?.match(/Tiền tố (.*)/)?.[1]?.trim() || zone.zone_name.charAt(0);
        return {
          id: zone.id.toString(),
          name: zone.zone_name,
          slots: Array.from({ length: zone.total_slots || 0 }).map((_, idx) => ({
            id: `slot_${zone.id}_${idx + 1}`,
            name: `${prefix}${idx + 1}`,
            status: "available", // Mock status
            type: "car",
          }))
        };
      })
    })) as MockFloor[];
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
  }>({ data: null, status: "available" });

  const currentFloor = floorsData.find((f) => f.id === selectedFloor);
  const activeZones = React.useMemo(() => {
    if (!currentFloor) return [];
    if (selectedZone === "all") return currentFloor.zones;
    return currentFloor.zones.filter((z) => z.id === selectedZone);
  }, [currentFloor, selectedZone]);

  const totalSlotsCurrentFloor =
    currentFloor?.zones.reduce((acc, z) => acc + z.slots.length, 0) || 0;

  const handleSlotClick = (slot: MockSlot) => {
    if (slot.ticket) {
      setSelectedTicket({ data: slot.ticket, status: slot.status as any });
      setIsTicketOpen(true);
    }
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
      <SidebarInset className="bg-slate-50">
        <SiteHeader />

        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* TOP BAR: Button on Left, Date/Time on Right */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            {!hasData ? (
              <Button
                onClick={() => openConfigModal("setup")}
                className="bg-black text-white hover:bg-slate-800 shadow-xl border border-black px-6"
              >
                <Settings className="w-4 h-4 mr-2" /> Thiết lập Sơ đồ
              </Button>
            ) : (
              <Button
                onClick={() => openConfigModal("edit")}
                variant="outline"
                className="bg-white text-slate-800 hover:bg-slate-50 shadow-sm border-slate-200 px-6 font-semibold"
              >
                <Settings className="w-4 h-4 mr-2 text-slate-500" /> Quản lý Sơ đồ
              </Button>
            )}

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[200px] justify-start text-left font-semibold h-11 border-slate-200 bg-slate-50 hover:bg-slate-100",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Chọn ngày xem</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div className="relative w-28">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="time"
                    className="pl-9 h-9 border-0 shadow-none bg-transparent font-semibold"
                    defaultValue="10:00"
                  />
                </div>
                <div className="w-4 border-t-2 border-slate-300"></div>
                <div className="relative w-28">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="time"
                    className="pl-9 h-9 border-0 shadow-none bg-transparent font-semibold"
                    defaultValue="14:00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SELECTORS: Floor & Zone */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Tầng / Vị trí
                </Label>
                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200 shadow-none font-bold text-base h-12">
                    <SelectValue placeholder="Chọn tầng" />
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

              <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Khu vực phân bổ
                </Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200 shadow-none font-bold text-base h-12">
                    <SelectValue placeholder="Khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="all"
                      className="font-semibold text-blue-600"
                    >
                      Tất cả Khu vực
                    </SelectItem>
                    {currentFloor?.zones.map((z) => (
                      <SelectItem
                        key={z.id}
                        value={z.id}
                        className="font-semibold"
                      >
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Tổng Số Chỗ Tầng Này
              </span>
              <div className="px-4 py-1.5 bg-slate-800 text-white rounded-lg shadow-inner font-mono text-xl font-bold tracking-wider">
                {totalSlotsCurrentFloor}
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-6 min-h-[500px] overflow-hidden flex flex-col relative w-full">
            <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-8 relative">
              {/* Decorative Pattern Background */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              ></div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-20 relative z-10">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="font-semibold tracking-wide">Đang tải cấu trúc bãi đỗ...</p>
                </div>
              ) : activeZones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-6 mt-20 relative z-10">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-slate-100">
                    <Settings className="w-14 h-14 text-slate-300 pointer-events-none animate-spin-slow" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">Bãi đỗ chưa có Cấu trúc</h2>
                    <p className="font-medium tracking-wide text-slate-500 max-w-md mx-auto">
                      Quý khách cần phác thảo Tầng và Khu vực đỗ xe để hệ thống có thể quản lý và hiển thị không gian trực quan.
                    </p>
                  </div>
                  {!hasData && (
                    <Button 
                      onClick={() => openConfigModal("setup")} 
                      className="mt-6 bg-black text-white px-10 py-7 rounded-2xl hover:bg-slate-800 shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 font-bold text-lg"
                    >
                       Tạo Sơ Đồ Khởi Tạo Ngay
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-16 relative z-10">
                  {activeZones.map((zone, idx) => (
                    <div key={zone.id} className="space-y-6 relative">
                      <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-200/80">
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm shadow-md">
                          {idx + 1}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                          {zone.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-12 py-4 items-center justify-start">
                        {zone.slots.map((slot) => (
                          <div key={slot.id} className="relative group">
                            <Slot
                              slot={slot}
                              onClick={() => handleSlotClick(slot)}
                              size={selectedZone === "all" ? "small" : "normal"}
                              orientation="bottom"
                            />
                            {/* Minor decorative shadow effect for realism on normal size */}
                            {selectedZone !== "all" && (
                              <div className="absolute -bottom-2 -right-2 w-full h-full bg-slate-200/50 rounded-xl -z-10 blur-sm pointer-events-none group-hover:bg-slate-300/50 transition-colors"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LEGEND */}
          <div className="flex flex-wrap gap-8 justify-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 font-semibold text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-6 h-10 rounded-md bg-white border-2 border-dashed border-slate-300 shadow-sm"></div>
              <span>Chỗ trống</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-10 rounded-md bg-blue-300 border-2 border-blue-600 shadow-sm overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-blue-500"></div>
              </div>
              <span className="text-black">
                Có xe đang đỗ (Thanh thời gian)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-10 rounded-md bg-orange-500 shadow-sm border-2 border-orange-600 flex items-center justify-center">
                <div className="bg-black/20 rounded-full p-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-orange-600">Đã đặt trước</span>
            </div>
          </div>
        </div>

        <TicketDetail
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
          data={selectedTicket.data}
          status={selectedTicket.status}
        />

        <TicketDetail
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
          data={selectedTicket.data}
          status={selectedTicket.status}
        />

        {/* MASTER CONFIG MODAL */}
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
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
              {activeTab === "setup" && <SetupWizardTab onClose={() => setIsConfigOpen(false)} />}
              {activeTab === "edit" && <StructureManagerTab />}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
