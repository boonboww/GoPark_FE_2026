"use client";

import * as React from "react";
import { format, addHours, subMinutes } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Edit,
  Trash,
  CarFront,
} from "lucide-react";

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

// Mock Data
const parkingLots = [
  { id: "1", name: "Vincom Center Landmark 81" },
  { id: "2", name: "Bitexco Financial Tower" },
  { id: "3", name: "Saigon Centre" },
];

const floors = [
  { id: "1", name: "1st Floor", totalSlots: 50 },
  { id: "2", name: "2nd Floor", totalSlots: 45 },
  { id: "3", name: "3rd Floor", totalSlots: 60 },
];

// Mock Slot Data (State of each slot)
const getMockTicket = (
  label: string,
  status: "occupied" | "reserved",
): TicketData => {
  const now = new Date();
  // Random start time between 30 mins to 3 hours ago for occupied
  const startOffset =
    status === "occupied" ? Math.floor(Math.random() * 180) + 30 : 0;
  // Random duration 2-5 hours
  const duration = Math.floor(Math.random() * 3) + 2;

  const startTime = subMinutes(now, startOffset);
  const endTime = addHours(startTime, duration);

  return {
    ticketCode: `TCK-${label}-${Math.floor(Math.random() * 10000)}`,
    customerName: status === "occupied" ? "Nguyen Van A" : "Reserved Client",
    licensePlate:
      status === "occupied"
        ? `51F-${Math.floor(Math.random() * 900)}.${Math.floor(Math.random() * 90)}`
        : "",
    position: label,
    startTime: startTime,
    endTime: endTime,
    price: 50000 * duration,
  };
};

// Slot component
const Slot = ({
  status,
  label,
  data,
  onClick,
  rotated = false,
}: {
  status: "available" | "occupied" | "reserved";
  label: string;
  data?: TicketData;
  onClick: () => void;
  rotated?: boolean;
}) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (status !== "occupied" || !data) {
      setProgress(0);
      return;
    }

    const updateProgress = () => {
      const now = new Date().getTime();
      const start = data.startTime.getTime();
      const end = data.endTime.getTime();
      const total = end - start;
      const elapsed = now - start;

      // Calculate progress (0 to 100)
      let p = (elapsed / total) * 100;
      p = Math.min(Math.max(p, 0), 100);
      setProgress(p);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 60000); // 1 min update
    return () => clearInterval(interval);
  }, [status, data]);

  const getBackgroundStyle = () => {
    if (status === "occupied") {
      // Gradient logic: Gray decreases, White increases as progress increases.
      // Direction: "From front of car to back of car".
      // Car icon is rotated -90deg, so it points LEFT relative to the slot container.
      // Front is Left, Back is Right.
      // "Left to Right" direction.
      // Progress 0% -> Full Gray.
      // Progress 50% -> Half White (Left), Half Gray (Right).
      // Progress 100% -> Full White.
      return {
        background: `linear-gradient(to right, white ${progress}%, #cbd5e1 ${progress}%)`,
      };
    }
    return {};
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "occupied":
        return "border-slate-300"; // Custom background handled by style
      case "reserved":
        return "bg-green-500 border-green-600 text-white";
      case "available":
        return "bg-white border-gray-200 text-gray-400";
      default:
        return "bg-white border-gray-200 text-gray-400";
    }
  };

  return (
    <div
      onClick={onClick}
      style={getBackgroundStyle()}
      className={cn(
        "relative w-24 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm transform hover:scale-105 cursor-pointer overflow-hidden",
        getStatusClasses(status),
        rotated ? "-rotate-45" : "rotate-45",
      )}
    >
      {/* Slot Label */}
      <span
        className={cn(
          "text-xs font-bold z-10",
          status === "occupied" ? "opacity-0" : "opacity-100",
        )}
      >
        {label}
      </span>

      {/* Car Icon for Occupied Slots */}
      {status === "occupied" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <CarFront className="w-8 h-8 text-slate-700 fill-slate-300 transform -rotate-90 opacity-80" />
        </div>
      )}
      {/* Check Icon for Reserved/Selected Slots */}
      {status === "reserved" && (
        <div className="absolute left-2 bottom-2 bg-white/20 rounded-full p-0.5 text-white">
          <Check className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default function ParkingLotManagementPage() {
  const [date, setDate] = React.useState<Date>();
  const [selectedLot, setSelectedLot] = React.useState(parkingLots[0].id);
  const [selectedFloor, setSelectedFloor] = React.useState(floors[1].id);

  // Modal State
  const [isTicketOpen, setIsTicketOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<{
    data: TicketData;
    status: "occupied" | "reserved" | "available";
  } | null>(null);

  // Mock mapped data for slots
  // In a real app, this would come from an API based on selectedFloor/Lot
  const [slotDataMap, setSlotDataMap] = React.useState<
    Record<string, TicketData>
  >({});

  React.useEffect(() => {
    // Generate random data for slots on mount (mocking fetch)
    const newMap: Record<string, TicketData> = {};
    [
      "A2",
      "A4",
      "A5",
      "A6",
      "A7",
      "A11",
      "A15",
      "A17",
      "A18",
      "A19",
      "A22",
      "A24",
    ].forEach((label) => {
      newMap[label] = getMockTicket(
        label,
        label === "A22" ? "reserved" : "occupied",
      );
    });
    setSlotDataMap(newMap);
  }, []); // Run once

  const handleSlotClick = (
    label: string,
    status: "occupied" | "reserved" | "available",
  ) => {
    const data = slotDataMap[label];
    if (data) {
      setSelectedTicket({ data, status });
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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-col h-full bg-slate-50 p-6 space-y-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="w-full md:w-1/3">
              <Select value={selectedLot} onValueChange={setSelectedLot}>
                <SelectTrigger className="w-full h-12 text-lg font-medium bg-white shadow-sm border-gray-200">
                  <SelectValue placeholder="Select Parking Lot" />
                </SelectTrigger>
                <SelectContent>
                  {parkingLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-10 px-6 gap-2 border-gray-300 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" /> Edit
              </Button>
              <Button variant="destructive" className="h-10 px-6 gap-2">
                <Trash className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>

          {/* DATE & TIME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
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
            <div className="flex items-center gap-4">
              <div className="relative w-full">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="time"
                  className="pl-10 h-11"
                  defaultValue="10:00"
                />
              </div>
              <span className="text-gray-400 font-medium">-</span>
              <div className="relative w-full">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="time"
                  className="pl-10 h-11"
                  defaultValue="14:00"
                />
              </div>
            </div>
          </div>

          {/* TOTAL SLOTS */}
          <div className="flex justify-between items-center">
            <div className="w-48">
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="w-full bg-white border-none shadow-none text-xl font-bold p-4 focus:ring-0">
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-600">
              <span>Total Slots:</span>
              <span className="text-black font-bold text-lg">
                {floors.find((f) => f.id === selectedFloor)?.totalSlots || 0}
              </span>
            </div>
          </div>

          {/* GRID */}
          <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex justify-center relative min-h-[500px]">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 opacity-10">
              <ArrowLeft className="w-32 h-32 rotate-90 text-gray-400" />
            </div>

            <div className="flex gap-24 relative z-20">
              {/* Manually rendering slots with click handlers and data */}
              {/* Left Column */}
              <div className="flex flex-col gap-6 pt-12">
                <div className="flex gap-16 justify-end">
                  <Slot
                    label="A1"
                    status="available"
                    onClick={() => {}}
                    rotated
                  />
                  <Slot
                    label="A2"
                    status="occupied"
                    data={slotDataMap["A2"]}
                    onClick={() => handleSlotClick("A2", "occupied")}
                    rotated
                  />
                </div>
                <div className="flex gap-16 justify-end">
                  <Slot
                    label="A3"
                    status="available"
                    onClick={() => {}}
                    rotated
                  />
                  <Slot
                    label="A4"
                    status="occupied"
                    data={slotDataMap["A4"]}
                    onClick={() => handleSlotClick("A4", "occupied")}
                    rotated
                  />
                </div>
                <div className="flex gap-16 justify-end">
                  <Slot
                    label="A5"
                    status="occupied"
                    data={slotDataMap["A5"]}
                    onClick={() => handleSlotClick("A5", "occupied")}
                    rotated
                  />
                  <Slot
                    label="A6"
                    status="occupied"
                    data={slotDataMap["A6"]}
                    onClick={() => handleSlotClick("A6", "occupied")}
                    rotated
                  />
                </div>
                <div className="flex gap-16 justify-end">
                  <Slot
                    label="A7"
                    status="occupied"
                    data={slotDataMap["A7"]}
                    onClick={() => handleSlotClick("A7", "occupied")}
                    rotated
                  />
                  <Slot
                    label="A8"
                    status="available"
                    onClick={() => {}}
                    rotated
                  />
                </div>
                <div className="flex gap-16 justify-end">
                  <Slot
                    label="A9"
                    status="available"
                    onClick={() => {}}
                    rotated
                  />
                  <Slot
                    label="A10"
                    status="available"
                    onClick={() => {}}
                    rotated
                  />
                </div>
                <div className="flex gap-16 justify-end">
                  <Slot
                    label="A11"
                    status="occupied"
                    data={slotDataMap["A11"]}
                    onClick={() => handleSlotClick("A11", "occupied")}
                    rotated
                  />
                  <Slot
                    label="A12"
                    status="available"
                    onClick={() => {}}
                    rotated
                  />
                </div>
              </div>

              <div className="w-px bg-dashed border-l-2 border-gray-100 h-full absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 pointer-events-none"></div>

              {/* Right Column */}
              <div className="flex flex-col gap-6 pt-12">
                <div className="flex gap-16">
                  <Slot label="A14" status="available" onClick={() => {}} />
                  <Slot
                    label="A15"
                    status="occupied"
                    data={slotDataMap["A15"]}
                    onClick={() => handleSlotClick("A15", "occupied")}
                  />
                </div>
                <div className="flex gap-16">
                  <Slot label="A16" status="available" onClick={() => {}} />
                  <Slot
                    label="A17"
                    status="occupied"
                    data={slotDataMap["A17"]}
                    onClick={() => handleSlotClick("A17", "occupied")}
                  />
                </div>
                <div className="flex gap-16">
                  <Slot
                    label="A18"
                    status="occupied"
                    data={slotDataMap["A18"]}
                    onClick={() => handleSlotClick("A18", "occupied")}
                  />
                  <Slot
                    label="A19"
                    status="occupied"
                    data={slotDataMap["A19"]}
                    onClick={() => handleSlotClick("A19", "occupied")}
                  />
                </div>
                <div className="flex gap-16">
                  <Slot label="A20" status="available" onClick={() => {}} />
                  <Slot label="A21" status="available" onClick={() => {}} />
                </div>
                <div className="flex gap-16">
                  <Slot
                    label="A22"
                    status="reserved"
                    data={slotDataMap["A22"]}
                    onClick={() => handleSlotClick("A22", "reserved")}
                  />
                  <Slot label="A23" status="available" onClick={() => {}} />
                </div>
                <div className="flex gap-16">
                  <Slot
                    label="A24"
                    status="occupied"
                    data={slotDataMap["A24"]}
                    onClick={() => handleSlotClick("A24", "occupied")}
                  />
                  <Slot label="A25" status="available" onClick={() => {}} />
                </div>
              </div>
            </div>
          </div>

          {/* LEGEND */}
          <div className="flex flex-wrap gap-6 justify-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
              <span className="text-sm font-medium text-gray-600">
                Available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-transparent flex items-center justify-center">
                <CarFront className="w-5 h-5 text-gray-700 fill-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Occupied
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border border-green-600"></div>
              <span className="text-sm font-medium text-gray-600">
                Selected / Reserved
              </span>
            </div>
          </div>

          <TicketDetail
            isOpen={isTicketOpen}
            onClose={() => setIsTicketOpen(false)}
            data={selectedTicket?.data || null}
            status={selectedTicket?.status || "available"}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
