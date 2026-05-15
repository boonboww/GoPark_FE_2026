"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Ticket, BadgeCheck, Zap, Navigation, Plus, User as UserIcon, Search, Settings, Send, PhoneCall, Shield, Home, Car, ChevronDown, X, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useConfigStore } from "@/stores/config.store";
import { parkingService } from "@/services/parking.service";
import { ParkingMap } from "@/components/features/findParking/ParkingMap";
import { useSearchParams } from "next/navigation";

type ParkingLotRecord = Record<string, any> & {
  id: number;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  parkingFloor?: any[];
};

type ParkingWithDistance = ParkingLotRecord & {
  distanceKm: number | null;
  distanceLabel: string;
};

type ParkingLotOwner = {
  name?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  avatar?: string | null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractCoordinates = (lot: ParkingLotRecord) => {
  const latitude = toNumber(lot.latitude ?? lot.lat ?? lot.location?.lat);
  const longitude = toNumber(lot.longitude ?? lot.lng ?? lot.location?.lng);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
};

const calculateDistanceKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) => {
  const earthRadiusKm = 6371;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const startLat = (from.latitude * Math.PI) / 180;
  const endLat = (to.latitude * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(startLat) * Math.cos(endLat);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceKm: number | null) => {
  if (distanceKm === null) return "Chưa có vị trí";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

const normalizeSlotStatus = (status?: string) => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "BOOKED") return "RESERVED";
  return normalized;
};

const countSlotsInStructure = (structure: any): number => {
  const floors = structure?.parkingFloor || structure || [];
  if (!Array.isArray(floors)) return 0;

  return floors.reduce((total: number, floor: any) => {
    const zones = floor?.parkingZones || floor?.zones || floor?.parking_zone || floor?.parking_zones || [];
    if (!Array.isArray(zones)) return total;

    const zoneSlots = zones.reduce((zoneTotal: number, zone: any) => {
      const slots = zone?.slot || zone?.slots || zone?.parkingSlots || zone?.parking_slots || [];
      return zoneTotal + (Array.isArray(slots) ? slots.length : 0);
    }, 0);

    return total + zoneSlots;
  }, 0);
};

const hasStructureHierarchy = (structure: any): boolean => {
  const floors = structure?.parkingFloor || structure || [];
  if (!Array.isArray(floors) || floors.length === 0) return false;

  return floors.some((floor: any) => {
    const zones = floor?.parkingZones || floor?.zones || floor?.parking_zone || floor?.parking_zones || [];
    return Array.isArray(zones);
  });
};

const getSlotStatusClass = (status?: string) => {
  const normalizedStatus = normalizeSlotStatus(status);

  if (normalizedStatus === "OCCUPIED") {
    return "bg-blue-500 border-blue-600 text-white shadow-sm";
  }
  if (normalizedStatus === "RESERVED") {
    return "bg-orange-500 border-orange-600 text-white shadow-sm";
  }
  return "bg-white dark:bg-stone-800 border-dashed border-gray-300 dark:border-stone-600 text-gray-700 dark:text-gray-200";
};

const getSlotBadge = (status?: string) => {
  const normalizedStatus = normalizeSlotStatus(status);

  if (normalizedStatus === "OCCUPIED") return "Xe đang đỗ";
  if (normalizedStatus === "RESERVED") return "Đã đặt trước";
  return "Chỗ trống";
};

const normalizeOwner = (lot: Record<string, any>): ParkingLotOwner | null => {
  const ownerSource =
    lot.owner ||
    lot.user ||
    lot.parkingOwner ||
    lot.ownerInfo ||
    lot.owner_info ||
    lot.createdBy ||
    lot.created_by ||
    lot.manager ||
    null;

  const profileSource =
    ownerSource?.profile ||
    lot.profile ||
    lot.userProfile ||
    lot.user_profile ||
    lot.ownerProfile ||
    null;

  const name =
    ownerSource?.name ||
    ownerSource?.userName ||
    ownerSource?.username ||
    profileSource?.name ||
    profileSource?.fullName ||
    lot.owner_name ||
    lot.ownerName ||
    lot.user_name ||
    lot.userName ||
    lot.createdByName ||
    lot.created_by_name ||
    null;

  const phone =
    ownerSource?.phone ||
    ownerSource?.phoneNumber ||
    profileSource?.phone ||
    profileSource?.phoneNumber ||
    lot.owner_phone ||
    lot.ownerPhone ||
    lot.user_phone ||
    lot.userPhone ||
    null;

  const avatar =
    ownerSource?.avatar ||
    ownerSource?.image ||
    profileSource?.image ||
    lot.owner_avatar ||
    lot.ownerAvatar ||
    lot.user_avatar ||
    lot.userAvatar ||
    null;

  if (!name && !phone && !avatar && !ownerSource && !profileSource) {
    return null;
  }

  return {
    name: name || undefined,
    username:
      ownerSource?.username ||
      ownerSource?.userName ||
      profileSource?.name ||
      undefined,
    email: ownerSource?.email || profileSource?.email || lot.owner_email || lot.ownerEmail || undefined,
    phone,
    avatar,
  };
};

// Mock Data
const mockAllParkings = [
  {
    id: 1,
    name: "GoPark Complex Quận Cẩm Lệ",
    address: "18, Hòa Nam 6, Hòa Nam, Đà Nẵng",
    status: "Mở cửa",
    timeOpen: "24/7",
    availableSpots: 89,
    totalSpots: 150,
    pricing: {
      firstHour: "25,000 VND",
      nextHour: "15,000 VND",
      overnight: "120,000 VND",
    },
    amenities: [
      { label: "Quy mô", sub: "150 vị trí", icon: Home, color: "text-blue-500" },
      { label: "Chỗ trống", sub: "89 rảnh", icon: Zap, color: "text-amber-500" },
      { label: "Hoạt động", sub: "24/7", icon: Shield, color: "text-emerald-500" },
      { label: "Trạng thái", sub: "Sẵn sàng", icon: Ticket, color: "text-purple-500" },
    ],
    bgImage: "book.png",
  },
  {
    id: 2,
    name: "Bãi đỗ xe Trung tâm Vincom",
    address: "910A Ngô Quyền, Sơn Trà, Đà Nẵng",
    status: "Đang đông",
    timeOpen: "08:00 - 23:00",
    availableSpots: 12,
    totalSpots: 200,
    pricing: {
      firstHour: "30,000 VND",
      nextHour: "20,000 VND",
      overnight: "Không nhận",
    },
    amenities: [
      { label: "Quy mô", sub: "200 vị trí", icon: Home, color: "text-blue-500" },
      { label: "Chỗ trống", sub: "12 rảnh", icon: Shield, color: "text-emerald-500" },
      { label: "Hoạt động", sub: "8:00 - 22:00", icon: Zap, color: "text-amber-500" },
    ],
    bgImage: "book.png",
  },
  {
    id: 3,
    name: "Bãi đỗ xe Sân bay Quốc tế",
    address: "Sân bay Đà Nẵng, Hải Châu, Đà Nẵng",
    status: "Mở cửa",
    timeOpen: "24/7",
    availableSpots: 150,
    totalSpots: 500,
    pricing: {
      firstHour: "15,000 VND",
      nextHour: "10,000 VND",
      overnight: "150,000 VND",
    },
    amenities: [
      { label: "Quy mô", sub: "500 vị trí", icon: Home, color: "text-blue-500" },
      { label: "Chỗ trống", sub: "150 rảnh", icon: Shield, color: "text-emerald-500" },
      { label: "Hoạt động", sub: "24/7", icon: Navigation, color: "text-purple-500" },
    ],
    bgImage: "bg.jpg",
  }
];

const HeroSection = () => {
  const [isNameExpanded, setIsNameExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("nearby");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState("left");
  const [parkings, setParkings] = useState<ParkingLotRecord[]>(mockAllParkings as ParkingLotRecord[]);
  const [loading, setLoading] = useState(true);
  const [selectedLayoutLotId, setSelectedLayoutLotId] = useState<number | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [layoutStructureByLotId, setLayoutStructureByLotId] = useState<Record<number, any>>({});
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Tự động chuyển tab dựa trên tham số URL
  useEffect(() => {
    const validTabs = ["all", "layout", "nearby"];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const user = useAuthStore((state) => state.user);
  const { locationEnabled } = useConfigStore();

  useEffect(() => {
    const fetchHomeParkings = async () => {
      try {
        setLoading(true);
        const res = await parkingService.getAllParkingLots();
        const data = res.data || (Array.isArray(res) ? res : []);

        if (data.length > 0) {
          const mappedParkings = data.map((lot: Record<string, any>) => {
            const openTimeStr = lot.open_time ? new Date(lot.open_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
            const closeTimeStr = lot.close_time ? new Date(lot.close_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
            const formattedTimeOpen = openTimeStr && closeTimeStr && openTimeStr !== "Invalid Date" ? `${openTimeStr} - ${closeTimeStr}` : "24/7";

            return {
              id: lot.id,
              lat: lot.latitude ?? lot.lat ?? lot.location?.lat,
              lng: lot.longitude ?? lot.lng ?? lot.location?.lng,
              latitude: lot.latitude ?? lot.lat ?? lot.location?.lat,
              longitude: lot.longitude ?? lot.lng ?? lot.location?.lng,
              parkingFloor: lot.parkingFloor || lot.parking_floor || lot.floors || [],
              name: lot.name,
              address: lot.address,
              description: lot.description || "Bãi đỗ xe an toàn, tiện lợi, hỗ trợ 24/7",
              status: lot.available_slots > 0 ? "Mở cửa" : "Hết chỗ",
              timeOpen: formattedTimeOpen,
              availableSpots: lot.available_slots || 0,
              totalSpots: lot.total_slots || 0,
              pricing: {
                firstHour: `${new Intl.NumberFormat('vi-VN').format(lot.minprice || lot.minPrice || 15000)} VND`,
                nextHour: lot.maxprice ? `${new Intl.NumberFormat('vi-VN').format(Math.floor(lot.maxprice / 2))} VND` : "10,000 VND",
                overnight: lot.maxprice ? `${new Intl.NumberFormat('vi-VN').format(lot.maxprice * 4)} VND` : "150,000 VND",
              },
              amenities: [
                { label: "Quy mô", sub: `${lot.total_slots || 0} vị trí`, icon: Car, color: "text-blue-500" },
                { label: "Chỗ trống", sub: `${lot.available_slots || 0} khả dụng`, icon: BadgeCheck, color: "text-emerald-500" },
                { label: "Hoạt động", sub: lot.operating_days || "Thứ 2 - CN", icon: Clock, color: "text-amber-500" },
                { label: "Trạng thái", sub: (!lot.status || lot.status === "ACTIVE" || lot.available_slots > 0) ? "Sẵn sàng" : "Đã đầy", icon: Shield, color: "text-purple-500" }
              ],
              bgImage: (typeof lot.image === 'string' && lot.image.startsWith('{') ? (() => { try { const p = JSON.parse(lot.image); return p.thumbnail || p.gallery?.[0] || 'book.png'; } catch { return lot.image; } })() : (typeof lot.image === 'object' ? lot.image?.thumbnail || lot.image?.gallery?.[0] || 'book.png' : lot.image)) || "book.png",
              owner: normalizeOwner(lot),
            };
          });
          setParkings(mappedParkings);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu bãi đỗ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeParkings();
  }, []);



  useEffect(() => {
    if (activeTab !== "nearby" || hasRequestedLocation || !locationEnabled) return;
    setHasRequestedLocation(true);

    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
        setLocationLoading(false);
      },
      (error) => {
        console.error("Không lấy được vị trí hiện tại:", error);
        setLocationError("Không thể lấy vị trí hiện tại, đang hiển thị theo danh sách mặc định.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    );
  }, [activeTab, hasRequestedLocation]);

  useEffect(() => {
    if (activeTab !== "layout") return;
    if (!selectedLayoutLotId) return;
    if (layoutStructureByLotId[selectedLayoutLotId]) return;

    setLayoutLoading(false);
    setLayoutError(null);

    const selectedLot = parkings.find((lot) => lot.id === selectedLayoutLotId);
    const existingStructure = selectedLot?.parkingFloor;
    const hasHierarchy = hasStructureHierarchy(existingStructure);

    if (existingStructure && hasHierarchy) {
      setLayoutStructureByLotId((prev) => ({
        ...prev,
        [selectedLayoutLotId]: existingStructure,
      }));
      return;
    }

    setLayoutError("Bãi đỗ này chưa có cấu trúc tầng/khu vực.");
  }, [activeTab, selectedLayoutLotId, layoutStructureByLotId, parkings]);

  const selectedLayoutLot = useMemo(() => {
    return parkings.find((lot) => lot.id === selectedLayoutLotId) || null;
  }, [parkings, selectedLayoutLotId]);

  const selectedLayoutStructure = useMemo(() => {
    if (!selectedLayoutLot) return null;
    return layoutStructureByLotId[selectedLayoutLot.id] || selectedLayoutLot.parkingFloor || null;
  }, [layoutStructureByLotId, selectedLayoutLot]);

  const sortedParkings = useMemo((): ParkingWithDistance[] => {
    const withDistance = parkings.map((lot) => {
      const coordinates = extractCoordinates(lot);
      const distanceKm = myLocation && coordinates ? calculateDistanceKm(myLocation, coordinates) : null;
      return {
        ...lot,
        distanceKm,
        distanceLabel: formatDistance(distanceKm)
      } as ParkingWithDistance;
    });

    if (!myLocation) return withDistance;

    return [...withDistance].sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [parkings, myLocation]);

  const nearbyParkings = useMemo((): ParkingWithDistance[] => {
    if (!myLocation || !locationEnabled) return [];
    return sortedParkings.filter((lot) => lot.distanceKm !== null && lot.distanceKm <= 60);
  }, [sortedParkings, myLocation, locationEnabled]);

  useEffect(() => {
    if (activeTab === 'layout' && nearbyParkings.length > 0) {
      if (!selectedLayoutLotId || !nearbyParkings.some((lot) => lot.id === selectedLayoutLotId)) {
        setSelectedLayoutLotId(nearbyParkings[0].id);
      }
    } else if (parkings.length > 0) {
      const firstValidLot = parkings.find((lot) => typeof lot.id === "number");
      if (firstValidLot && (!selectedLayoutLotId || !parkings.some((lot) => lot.id === selectedLayoutLotId))) {
        setSelectedLayoutLotId(firstValidLot.id);
      }
    }
  }, [parkings, nearbyParkings, activeTab, selectedLayoutLotId]);

  const displayNearbyParkings = nearbyParkings;

  useEffect(() => {
    if (activeTab !== "nearby" || displayNearbyParkings.length <= 1) return;

    const interval = setInterval(() => {
      setSlideDirection("left");
      setCurrentIndex((prev) => (prev + 1) % displayNearbyParkings.length);
      setIsNameExpanded(false); // reset details when sliding
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab, displayNearbyParkings.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [displayNearbyParkings.length]);

  const handleNext = () => {
    if (displayNearbyParkings.length === 0) return;
    setSlideDirection("left");
    setCurrentIndex((prev) => (prev + 1) % displayNearbyParkings.length);
    setIsNameExpanded(false);
  };

  const handlePrev = () => {
    if (displayNearbyParkings.length === 0) return;
    setSlideDirection("right");
    setCurrentIndex((prev) => (prev - 1 + displayNearbyParkings.length) % displayNearbyParkings.length);
    setIsNameExpanded(false);
  };

  const currentParkingData = displayNearbyParkings[currentIndex];

  return (
    <section className="relative w-full min-h-screen bg-[#F0F2F5] dark:bg-stone-900 overflow-hidden font-sans p-4 sm:p-6 md:p-10 flex flex-col">

      {/* BACKGROUND GRADIENT/DECORATION */}
      <div className="absolute top-0 left-0 w-full h-[40vh] sm:h-[60vh] bg-linear-to-br from-gray-200 to-gray-100 dark:from-stone-800 dark:to-stone-900 -z-10 rounded-b-[2rem] sm:rounded-b-[3rem] md:rounded-b-[4rem]" />

      {/* HEADER NAV */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 z-10 w-full mb-8 md:mb-12">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-center lg:text-left w-full lg:w-auto mt-2 sm:mt-0">
          Xin chào, <span className="font-semibold text-green-600 dark:text-green-500 capitalize">{user?.profile?.name || "bạn"}</span>
        </h1>

        <div className="flex bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-2xl sm:rounded-full shadow-md p-1.5 overflow-x-auto w-full max-w-full sm:max-w-max justify-start sm:justify-center hide-scrollbar border border-white/20">
          <button
            id="nearby-tab-btn"
            onClick={() => setActiveTab("nearby")}
            className={`px-4 sm:px-6 py-2.5 cursor-pointer rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "nearby" ? "bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
          >
            Gần tôi
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`px-4 sm:px-6 py-2.5 cursor-pointer rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "layout" ? "bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
          >
            Sơ đồ bãi
          </button>
          <button
            onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
            className={`px-4 sm:px-6 py-2.5 cursor-pointer rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "all" ? "bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
          >
            Tất cả bãi đỗ
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-center">
          <div className="flex items-center bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-md text-xs sm:text-sm font-bold border border-white/20 flex-1 lg:flex-none">
            <MapPin className="w-4 h-4 mr-2 text-red-500 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[300px]">
              {currentParkingData?.address ? currentParkingData.address.split(',').slice(-2).join(', ').trim() : 'Đà Nẵng, Việt Nam'}
            </span>
          </div>
          <Link href="/users/setting" className="w-10 h-10 bg-white/80 dark:bg-black/60 backdrop-blur-xl flex justify-center items-center rounded-full shadow-md border border-white/20 shrink-0 hover:bg-white dark:hover:bg-stone-800 transition-colors">
            <Settings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </Link>
        </div>
      </header>

      {/* LAYOUT VIEW */}
      {activeTab === 'layout' && (
        <div className="flex-1 w-full mx-auto z-10 mt-6 animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[2rem] xl:rounded-[3rem] shadow-xl border border-white/40 dark:border-white/10 p-6 lg:p-10 flex flex-col min-h-[60vh]">
            <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-end mb-8 shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                  <Car className="text-blue-500 w-8 h-8" /> Sơ đồ bãi đỗ
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Xem cấu trúc tầng, khu vực và vị trí đỗ của từng bãi.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedLayoutLotId ?? ""}
                  onChange={(e) => setSelectedLayoutLotId(Number(e.target.value))}
                  className="bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm outline-none"
                >
                  {nearbyParkings.length > 0 ? (
                    nearbyParkings.map((lot) => (
                      <option key={lot.id} value={lot.id}>{lot.name} ({lot.distanceLabel})</option>
                    ))
                  ) : (
                    <option value="" disabled>Không có bãi đỗ gần đây</option>
                  )}
                </select>
                <button onClick={() => setActiveTab('all')} className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition">
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {layoutLoading ? (
                <div className="flex h-[50vh] items-center justify-center text-gray-500 dark:text-gray-400 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Đang tải sơ đồ bãi đỗ...</span>
                </div>
              ) : layoutError ? (
                <div className="flex h-[50vh] items-center justify-center">
                  <div className="max-w-lg rounded-[2rem] bg-white/90 dark:bg-stone-800/90 border border-dashed border-gray-200 dark:border-stone-700 p-8 text-center shadow-sm">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{layoutError}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Bãi đỗ này cần có cấu trúc tầng và khu vực để hiển thị sơ đồ.</p>
                    {selectedLayoutLot && (
                      <a href={`/users/detailParking/${selectedLayoutLot.id}`} className="inline-flex mt-5 items-center justify-center rounded-full bg-black text-white px-5 py-2.5 text-sm font-semibold">
                        Mở trang chi tiết bãi đỗ
                      </a>
                    )}
                  </div>
                </div>
              ) : !selectedLayoutStructure ? (
                <div className="flex h-[50vh] items-center justify-center text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu sơ đồ cho bãi đỗ này.
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  <div className="rounded-[2rem] bg-white/90 dark:bg-stone-800/90 border border-black/5 dark:border-white/10 p-5 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Bãi đỗ đang xem</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">{selectedLayoutLot?.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedLayoutLot?.address}</p>
                      </div>
                      <a href={`/users/detailParking/${selectedLayoutLot?.id}`} className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-emerald-700 transition">
                        Xem chi tiết và đặt chỗ
                      </a>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {(selectedLayoutStructure?.parkingFloor || selectedLayoutStructure || []).map((floor: any, floorIndex: number) => {
                      const zones = floor.parkingZones || floor.zones || floor.parking_zone || floor.parking_zones || [];

                      return (
                        <div key={floor.id || floorIndex} className="rounded-[2rem] bg-white/90 dark:bg-stone-800/90 border border-black/5 dark:border-white/10 p-5 shadow-sm">
                          <div className="flex items-center gap-4 w-full px-2 mb-5">
                            <div className="h-px flex-1 bg-gray-200 dark:bg-stone-700"></div>
                            <div className="px-5 py-2 bg-gray-50 dark:bg-stone-900 text-gray-600 dark:text-gray-300 font-bold rounded-full text-xs uppercase tracking-widest border border-gray-200 dark:border-stone-700 shadow-sm">
                              {floor.floor_name || floor.name || `Tầng ${floor.floor_number ?? floorIndex + 1}`}
                            </div>
                            <div className="h-px flex-1 bg-gray-200 dark:bg-stone-700"></div>
                          </div>

                          <div className="space-y-5">
                            {zones.map((zone: any) => {
                              const slots = (zone.slot || zone.slots || zone.parkingSlots || zone.parking_slots || [])
                                .slice()
                                .sort((a: any, b: any) => Number(a.id) - Number(b.id));

                              return (
                                <div key={zone.id} className="flex flex-col lg:flex-row gap-4 lg:items-start">
                                  <div className="lg:w-44 shrink-0 font-bold text-gray-500 dark:text-gray-400 text-left lg:text-right text-base pt-1 lg:pt-2">
                                    <div>{zone.zone_name || zone.name || `Khu ${zone.prefix || zone.id}`}</div>
                                    <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">{slots.length} vị trí</div>
                                  </div>

                                  <div className="flex-1 overflow-x-auto pb-1">
                                    <div className="flex gap-3 flex-wrap min-w-90">
                                      {slots.map((slot: any) => {
                                        const slotStatus = normalizeSlotStatus(slot.status);
                                        const isAvailable = slotStatus === "AVAILABLE";

                                        return (
                                          <div
                                            key={slot.id}
                                            className={`min-w-18 h-20 rounded-2xl border-2 p-2 flex flex-col justify-between transition-all ${getSlotStatusClass(slotStatus)}`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{slot.code || slot.name || "Slot"}</span>
                                              {isAvailable ? (
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                              ) : (
                                                <Car className="w-4 h-4 opacity-90" />
                                              )}
                                            </div>
                                            <div className="text-[11px] font-semibold leading-tight">
                                              {getSlotBadge(slotStatus)}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {slots.length === 0 && (
                                        <div className="min-h-18 rounded-2xl border border-dashed border-gray-300 dark:border-stone-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-stone-900/50 flex items-center">
                                          Khu vực này đã có cấu trúc, nhưng chưa có dữ liệu vị trí đỗ chi tiết trong API public.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-[2rem] bg-white/90 dark:bg-stone-800/90 border border-black/5 dark:border-white/10 p-5 shadow-sm flex flex-wrap items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mr-2">Chú thích</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-stone-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-stone-900">
                      <span className="w-3 h-3 rounded-full bg-white border-2 border-dashed border-gray-300"></span>
                      Chỗ trống
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-200">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      Xe đang đỗ
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-200">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      Đã đặt trước
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALL PARKINGS GRID VIEW */}
      {activeTab === 'all' && (
        <div className="flex-1 w-full mx-auto z-10 mt-6 animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[2rem] xl:rounded-[3rem] shadow-xl border border-white/40 dark:border-white/10 p-6 lg:p-10 flex flex-col min-h-[60vh]">
            <div className="flex justify-between items-center mb-6 shrink-0 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                  <Home className="text-blue-500 w-8 h-8" /> Tất cả bãi đỗ trong hệ thống
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Duyệt qua toàn bộ danh sách bãi đỗ của GoPark.</p>
              </div>
              <button onClick={() => setActiveTab('nearby')} className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition shrink-0">
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 flex-1 pb-4">
              {sortedParkings.slice((currentPage - 1) * 8, currentPage * 8).map((p) => (
                <Link
                  key={p.id}
                  href={`/users/detailParking/${p.id}`}
                  className="bg-white/90 dark:bg-stone-800/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 dark:border-white/5 cursor-pointer group hover:-translate-y-1 flex flex-col"
                >
                  <div className="w-full h-32 sm:h-40 relative overflow-hidden bg-gray-100 dark:bg-stone-800">
                    <img src={p.bgImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shadow-sm flex flex-col gap-1">
                      <span>Còn {p.availableSpots} chỗ</span>
                      {p.distanceLabel && <span className="text-blue-600 dark:text-blue-400">{p.distanceLabel}</span>}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-base mb-1 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 flex-1">{p.address}</p>
                    <div className="pt-3 border-t border-gray-100 dark:border-stone-700/50 flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Giá từ</span>
                      <span className="font-bold text-sm text-black dark:text-white">{p.pricing?.firstHour || "Liên hệ"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {Math.ceil(sortedParkings.length / 8) > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-stone-800 disabled:opacity-50 shadow-sm border border-gray-100 dark:border-stone-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {currentPage} / {Math.ceil(sortedParkings.length / 8)}
                </span>
                <button
                  disabled={currentPage === Math.ceil(sortedParkings.length / 8)}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sortedParkings.length / 8)))}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-stone-800 disabled:opacity-50 shadow-sm border border-gray-100 dark:border-stone-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEARBY PARKINGS VIEW (MAIN CONTENT + BOTTOM WIDGETS) */}
      {activeTab === 'nearby' && (
        <>
          {!locationEnabled ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
                <MapPin className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white text-center">Vị trí của bạn đang tắt</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-center max-w-md font-medium">
                Để khám phá các bãi đỗ xe gần nhất và nhận chỉ đường chính xác, vui lòng bật dịch vụ vị trí trong phần cài đặt.
              </p>
              <Link
                href="/users/setting?tab=app"
                className="mt-8 bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
              >
                <Settings className="w-5 h-5" />
                Đi tới Cài đặt
              </Link>
            </div>
          ) : locationLoading ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center z-10 animate-pulse">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Đang xác định vị trí của bạn...</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Vui lòng chờ trong giây lát</p>
            </div>
          ) : displayNearbyParkings.length > 0 ? (
            <>
              {/* MAIN CONTENT */}
              <div className="relative flex-1 w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 z-10 mt-0 md:mt-2 animate-in fade-in slide-in-from-bottom-8">

                {/* LEFT COLUMN: GREETING & FLOATING CONTROLS (tên bãi, nút đặt chỗ ngay) */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-center z-20 text-center md:text-left relative mb-6">
                  <div className="relative w-full h-80 sm:h-90 md:h-100 flex flex-col justify-center overflow-visible">
                    {displayNearbyParkings.map((parking, index) => (
                      <div
                        key={`info-${index}`}
                        className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out ${index === currentIndex
                          ? "opacity-100 translate-x-0"
                          : slideDirection === "left"
                            ? index < currentIndex || (currentIndex === 0 && index === displayNearbyParkings.length - 1)
                              ? "opacity-0 -translate-x-full"
                              : "opacity-0 translate-x-full"
                            : index > currentIndex || (currentIndex === displayNearbyParkings.length - 1 && index === 0)
                              ? "opacity-0 translate-x-full"
                              : "opacity-0 -translate-x-full"
                          }`}
                      >
                        <div className="flex flex-col mb-4">
                          <h2
                            className={`text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white leading-tight wrap-break-word transition-all duration-300 ${!isNameExpanded ? 'line-clamp-1' : ''}`}
                            title={parking.name}
                          >
                            {parking.name}
                          </h2>

                          {parking.name.length > 10 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsNameExpanded(!isNameExpanded);
                              }}
                              className="flex justify-center md:justify-start gap-1.5 text-[11px] font-bold mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-all items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 z-30"
                            >
                              {isNameExpanded ? "(^ Thu gọn)" : "(... Xem thêm)"}
                            </button>
                          )}
                        </div>

                        <div className="mt-0 flex flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base bg-white/40 dark:bg-black/40 backdrop-blur-md inline-flex px-4 py-2 rounded-full shadow-sm">
                              {parking.status} • Trống {parking.availableSpots}/{parking.totalSpots} chỗ
                              {parking.distanceLabel && <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">({parking.distanceLabel})</span>}
                            </p>

                            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-md inline-flex items-center gap-2 px-2 py-1.5 rounded-full shadow-sm">
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                                {parking.owner?.avatar ? (
                                  <img src={parking.owner.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="pr-2 text-left">
                                <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none">{parking.owner?.name || parking.owner?.username || "Chủ bãi"}</p>
                                <p className="text-[9px] text-gray-500 leading-none mt-1">{parking.timeOpen}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row">
                          <Link id="hero-booking-btn" href={`/users/detailParking/${parking.id}`} className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-full shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl w-full sm:w-auto text-center">
                            Đặt chỗ ngay
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SLIDER CONTROLS */}
                  {displayNearbyParkings.length > 1 && (
                    <div className="flex gap-3 justify-center md:justify-start mt-4">
                      <button
                        onClick={handlePrev}
                        className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur shadow-sm hover:shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-stone-800 transition text-gray-700 dark:text-gray-300"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur shadow-sm hover:shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-stone-800 transition text-gray-700 dark:text-gray-300"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-1.5 ml-2">
                        {displayNearbyParkings.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-5 bg-black dark:bg-white' : 'w-1.5 bg-gray-300 dark:bg-stone-600'}`}></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CENTER COLUMN: CAR IMAGE */}
                <div className="lg:col-span-4 xl:col-span-5 relative flex items-center justify-center min-h-[200px] sm:min-h-62.5 md:min-h-75 z-0 -mx-4 md:mx-0 overflow-hidden">
                  {displayNearbyParkings.map((parking, index) => (
                    <div
                      key={`img-${index}`}
                      className={`absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-in-out ${index === currentIndex
                        ? "translate-x-0"
                        : slideDirection === "left"
                          ? index < currentIndex || (currentIndex === 0 && index === displayNearbyParkings.length - 1)
                            ? "-translate-x-[120%]"
                            : "translate-x-[120%]"
                          : index > currentIndex || (currentIndex === displayNearbyParkings.length - 1 && index === 0)
                            ? "translate-x-[120%]"
                            : "-translate-x-[120%]"
                        }`}
                    >
                      <img
                        src={parking.bgImage}
                        alt="Car/Parking"
                        className={`w-[95%] md:w-[90%] lg:w-[90%] max-w-3xl aspect-4/3 object-cover rounded-3xl drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ${index % 2 === 0 ? "-rotate-3" : "rotate-3"
                          }`}
                      />
                    </div>
                  ))}
                </div>

                {/* RIGHT COLUMN: CARDS */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4 z-20 lg:pl-4 xl:pl-10 justify-center pb-8 md:pb-0">

                  {/* Thông tin & Bảng giá Card */}
                  <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-2xl p-5 rounded-[2rem] shadow-xl border border-white/40 dark:border-white/10 flex flex-col delay-500 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both">
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" /> Thông tin nhanh
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {currentParkingData?.amenities.map((item: any, idx: number) => (
                        <div key={`${currentIndex}-${idx}`} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 p-2 rounded-xl">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-semibold leading-tight">{item.label}</p>
                            <p className="text-xs font-bold leading-tight">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Giá giờ đầu</span>
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{currentParkingData?.pricing.firstHour}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] text-gray-600 dark:text-gray-400">Giờ tiếp theo</span>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{currentParkingData?.pricing.nextHour}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-600 dark:text-gray-400">Gửi qua đêm</span>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{currentParkingData?.pricing.overnight}</span>
                      </div>
                    </div>

                    {/* AI Input Area */}
                    <div className="mt-3 bg-gray-100 dark:bg-black/30 p-1.5 rounded-xl flex items-center shadow-inner">
                      <input
                        type="text"
                        placeholder="Hỏi AI về bãi đỗ..."
                        className="bg-transparent border-none outline-none px-3 flex-1 text-xs text-gray-700 dark:text-gray-200"
                      />
                      <button className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex justify-center items-center shadow-md transition">
                        <Send className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vị trí */}
                  <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-2xl p-4 rounded-[2rem] shadow-xl border border-white/40 dark:border-white/10 relative overflow-hidden delay-700 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both flex flex-col h-48">
                    <div className="relative z-10 flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-red-500" /> Vị trí Bãi đỗ</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-50">{currentParkingData?.address}</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-black/20 w-full rounded-xl relative shadow-inner overflow-hidden border border-black/5 dark:border-white/10 group cursor-pointer pointer-events-none sm:pointer-events-auto">
                      {currentParkingData?.lat && currentParkingData?.lng ? (
                        <div className="absolute inset-0">
                          <ParkingMap
                            compact
                            parkingLots={[{
                              ...currentParkingData,
                              lat: Number(currentParkingData.lat),
                              lng: Number(currentParkingData.lng),
                            }]}
                            selectedParkingLot={{
                              ...currentParkingData,
                              lat: Number(currentParkingData.lat),
                              lng: Number(currentParkingData.lng),
                            }}
                            setSelectedParkingLot={() => undefined}
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 dark:from-stone-800 dark:to-stone-900 text-center px-4">
                          <div>
                            <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Chưa có tọa độ bản đồ</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 w-full mx-auto z-10 mt-6 animate-in fade-in slide-in-from-bottom-8">
              <div className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[2rem] xl:rounded-[3rem] shadow-xl border border-white/40 dark:border-white/10 p-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-8">
                  <Navigation className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">Không tìm thấy bãi đỗ nào gần bạn</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-10 leading-relaxed">
                  {locationError
                    ? `Lỗi vị trí: ${locationError}. Vui lòng cấp quyền truy cập vị trí cho trình duyệt.`
                    : "Chúng tôi không tìm thấy bãi đỗ xe nào trong bán kính 60km quanh vị trí hiện tại của bạn. Bạn có thể thử lại hoặc xem toàn bộ danh sách bãi đỗ."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      setHasRequestedLocation(false);
                      // Kích hoạt lại yêu cầu vị trí
                      if (navigator.geolocation) {
                        setLocationLoading(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                            setLocationError(null);
                            setLocationLoading(false);
                          },
                          (err) => {
                            setLocationError("Không thể truy cập vị trí");
                            setLocationLoading(false);
                          }
                        );
                      }
                    }}
                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
                  >
                    Thử lại ngay
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className="px-8 py-4 bg-white dark:bg-stone-800 text-gray-800 dark:text-white font-bold rounded-full shadow-md border border-gray-200 dark:border-stone-700 hover:bg-gray-50 transition transform hover:-translate-y-1"
                  >
                    Xem tất cả bãi đỗ
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </section>
  );
};

export default HeroSection;