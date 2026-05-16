"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2, ChevronRight, ChevronLeft, Loader2, Route, Clock, ArrowLeft, LocateFixed, Search, MapPin, Ticket, Info, ShoppingCart, Navigation, CornerUpRight, CornerUpLeft, ArrowUp, Navigation2, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

import { useConfigStore } from "@/stores/config.store"
import { toast } from "sonner"
import { fixVietnameseMojibake } from "@/lib/utils"

export function ParkingList({ parkingLots = [], suggestedParkingLots = [], loading = false, onSelectLot, selectedLotId, onRouteFound, onClearRoute, isNavigating, onStartNavigation }: { parkingLots?: any[], suggestedParkingLots?: any[], loading?: boolean, onSelectLot?: (lot: any) => void, selectedLotId?: number, onRouteFound?: (route: any) => void, onClearRoute?: () => void, isNavigating?: boolean, onStartNavigation?: () => void }) {
  const { locationEnabled } = useConfigStore();
  const [isOpen, setIsOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuickView, setShowQuickView] = useState<any | null>(null);
  
  // States for directions
  const [directionLot, setDirectionLot] = useState<any | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number, startName: string, endName: string, steps: any[]} | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Reset trang về 1 khi danh sách bãi đỗ thay đổi (ví dụ: thực hiện search)
  useEffect(() => {
    setCurrentPage(1);
  }, [parkingLots.length]);

  const viewMode = isFullScreen ? "grid" : "list";
  const itemsPerPage = isFullScreen ? 12 : 4; // 12 items for 3x4 grid
  const totalPages = Math.ceil(parkingLots.length / itemsPerPage);

  const displayedLots = parkingLots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleGetDirections = (lot: any) => {
    if (!locationEnabled) {
      toast.error("Vị trí đang tắt", {
        description: "Vui lòng bật định vị trong phần Cài đặt để sử dụng tính năng này."
      });
      return;
    }
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ Geolocation");
      return;
    }
    setDirectionLot(lot);
    setIsRouting(true);
    setRouteInfo(null);
    if (onSelectLot) onSelectLot(lot);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { longitude, latitude } = position.coords;
          const mapboxToken = (window as any).mapboxgl?.accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
          
          let url = `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${lot.lng},${lot.lat}?overview=full&geometries=geojson&steps=true`;
          
          if (mapboxToken) {
            url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${longitude},${latitude};${lot.lng},${lot.lat}?overview=full&geometries=geojson&steps=true&annotations=congestion,duration,distance&access_token=${mapboxToken}`;
          }

          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            
            // MÔ PHỎNG KẸT XE: Tạo dữ liệu ngẫu nhiên
            let congestionData = route.annotation?.congestion;
            if (!congestionData) {
              const levels = ['low', 'low', 'low', 'moderate', 'heavy', 'severe'];
              congestionData = Array.from({ length: route.geometry.coordinates.length - 1 }, () => 
                levels[Math.floor(Math.random() * levels.length)]
              );
            }

            setRouteInfo({
              distance: route.distance,
              duration: route.duration,
              startName: "Vị trí của bạn",
              endName: lot.address || lot.name,
              steps: route.legs && route.legs[0] ? route.legs[0].steps : []
            });
            if (onRouteFound) {
              onRouteFound({ 
                coordinates: route.geometry.coordinates,
                congestion: congestionData
              });
            }
          }
        } catch (error) {
          console.error("Lỗi tìm đường:", error);
          alert("Không thể tìm đường.");
        } finally {
          setIsRouting(false);
        }
      },
      (error) => {
        console.error("Lỗi lấy vị trí:", error);
        alert("Không thể lấy vị trí của bạn.");
        setIsRouting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const formatDuration = (seconds: number) => {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} phút`;
    return `${Math.floor(m/60)}g ${m%60}p`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 left-4 z-999 shadow-md rounded-full bg-white dark:bg-[#064e3b] dark:text-white dark:hover:bg-[#10b981]"
        onClick={() => setIsOpen(true)}
        title="Mở danh sách"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    );
  }

  const getManeuverIcon = (maneuver: any) => {
    if (!maneuver) return <Navigation2 className="w-6 h-6" />;
    const modifier = maneuver.modifier;
    const type = maneuver.type;

    if (type === 'arrive') return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
    if (type === 'depart') return <LocateFixed className="w-6 h-6" />;
    
    switch (modifier) {
      case 'left':
      case 'slight left':
      case 'sharp left':
        return <CornerUpLeft className="w-8 h-8" />;
      case 'right':
      case 'slight right':
      case 'sharp right':
        return <CornerUpRight className="w-8 h-8" />;
      case 'uturn':
        return <Navigation2 className="w-8 h-8 rotate-180" />;
      case 'straight':
        return <ArrowUp className="w-8 h-8" />;
      default:
        return <Navigation className="w-8 h-8" />;
    }
  };

  const getManeuverTranslation = (maneuver: any) => {
    if (!maneuver) return 'Di chuyển';
    const type = maneuver.type;
    const modifier = maneuver.modifier;
    
    if (type === 'depart') return 'Bắt đầu từ';
    if (type === 'arrive') return 'Đến nơi';
    if (type === 'roundabout') return 'Đi vào vòng xuyến';
    if (type === 'continue') return 'Đi tiếp';
    
    switch (modifier) {
      case 'left': return 'Rẽ trái';
      case 'right': return 'Rẽ phải';
      case 'slight left': return 'Chếch sang trái';
      case 'slight right': return 'Chếch sang phải';
      case 'sharp left': return 'Rẽ gắt sang trái';
      case 'sharp right': return 'Rẽ gắt sang phải';
      case 'uturn': return 'Quay đầu';
      case 'straight': return 'Đi thẳng';
    }
    
    if (type === 'turn') return 'Rẽ';
    return 'Tiến tới';
  };

  return (
    <div id="parking-list-sidebar" className={`bg-background dark:bg-black border-r dark:border-white/10 h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-40 relative ${isFullScreen ? "w-full absolute inset-0 z-50" : "w-87.5 lg:w-100 shrink-0"}`}>
      <div className="p-4 border-b dark:border-white/10 flex items-center justify-between">
        <div className="font-medium text-lg dark:text-white">
          {directionLot ? "Chỉ đường" : `Kết quả tìm kiếm (${parkingLots.length})`}
        </div>
        <div className="flex items-center gap-1">
          {directionLot && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full dark:text-white dark:hover:bg-[#059669]"
              onClick={() => {
                setDirectionLot(null);
                setRouteInfo(null);
                if (onClearRoute) onClearRoute();
              }}
              title="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full dark:text-white dark:hover:bg-[#059669]"
            onClick={() => {
              setIsFullScreen(!isFullScreen)
              setCurrentPage(1)
            }}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full dark:text-white dark:hover:bg-[#059669]"
            onClick={() => {
              setIsOpen(false);
              setIsFullScreen(false);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${!directionLot && viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-rows-3 gap-6 auto-rows-max" : "space-y-4"}`}>
        {directionLot ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="dark:bg-[#064e3b]/30 dark:border-white/20">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">{directionLot.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{directionLot.address}</p>
                <div className="bg-muted p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Route className="w-5 h-5 text-primary shrink-0" />
                    <span>Vị trí của bạn &rarr; <strong>{directionLot.name}</strong></span>
                  </div>
                  
                  {isRouting ? (
                    <div className="flex items-center gap-2 text-primary font-medium mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tính toán tuyến đường...</span>
                    </div>
                  ) : routeInfo ? (
                    <>
                      <div className="flex bg-background rounded-md border mt-2 overflow-hidden shadow-sm">
                        <div className="flex-1 p-3 flex flex-col items-center justify-center border-r">
                          <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">Khoảng cách</span>
                          <span className="font-bold text-lg text-emerald-600">{formatDistance(routeInfo.distance)}</span>
                        </div>
                        <div className="flex-1 p-3 flex flex-col items-center justify-center">
                          <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">Thời gian</span>
                          <span className="flex items-center font-bold text-lg text-blue-600"><Clock className="w-4 h-4 mr-1" /> {formatDuration(routeInfo.duration)}</span>
                        </div>
                      </div>
                      {routeInfo.steps && routeInfo.steps.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-semibold text-sm mb-3">Chi tiết lộ trình (<span className="text-primary">{routeInfo.steps.filter(s => s.maneuver?.type === 'turn' || ['left', 'right', 'sharp right', 'sharp left', 'slight left', 'slight right'].includes(s.maneuver?.modifier)).length}</span> ngã rẽ)</h4>
                          <div className="space-y-3 max-h-75 overflow-y-auto pr-1">
                            {routeInfo.steps.map((step, idx) => (
                              <div key={idx} className="flex gap-3 text-sm items-start">
                                <div className="mt-0.5 shrink-0 bg-secondary/30 p-1.5 rounded text-primary">
                                  <Route className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                  <div>
                                    <span className="font-medium">{getManeuverTranslation(step.maneuver)}</span>
                                    {step.name && step.name !== "" && (
                                      <span> vào <span className="font-semibold text-primary">{step.name}</span></span>
                                    )}
                                  </div>
                                  {step.distance > 0 && (
                                    <span className="text-xs text-muted-foreground mt-0.5">{formatDistance(step.distance)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isNavigating && onStartNavigation ? (
                        <Button 
                          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 text-lg rounded-2xl shadow-lg shadow-emerald-500/10 group transition-all" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartNavigation();
                          }}
                        >
                          <LocateFixed className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                          Bắt đầu di chuyển
                        </Button>
                      ) : isNavigating ? (
                        <Card className="mt-4 overflow-hidden border-2 border-primary/10 shadow-xl bg-background/80 backdrop-blur-md rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {/* Small Icon Box */}
                              <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                                {getManeuverIcon(routeInfo.steps && routeInfo.steps[0] ? routeInfo.steps[0].maneuver : null)}
                              </div>

                              {/* Compact Text Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter rounded-sm animate-pulse">
                                    LIVE
                                  </Badge>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">GoPark Nav</span>
                                </div>
                                <h4 className="text-base font-black text-foreground leading-tight truncate">
                                  {routeInfo.steps && routeInfo.steps[0] ? (
                                    <>
                                      {getManeuverTranslation(routeInfo.steps[0].maneuver)}
                                      {routeInfo.steps[0].name && <span className="text-primary ml-1">vào {routeInfo.steps[0].name}</span>}
                                    </>
                                  ) : "Đang tính..."}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                                  <span>{formatDistance(routeInfo.steps && routeInfo.steps[0] ? routeInfo.steps[0].distance : 0)}</span>
                                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(routeInfo.duration)}</span>
                                </div>
                              </div>

                              {/* Tiny Control Buttons */}
                              <div className="flex flex-col gap-1">
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onClearRoute) onClearRoute();
                                  }}
                                  title="Dừng"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.success("Đã đến nơi!");
                                    if (onClearRoute) onClearRoute();
                                  }}
                                  title="Xong"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-sm text-destructive mt-2">
                      Không thể tìm thấy tuyến đường. Vui lòng thử lại sau.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : parkingLots.length === 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center p-8 lg:p-14 text-center bg-white/50 dark:bg-stone-900/20 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-stone-800">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Không tìm thấy bãi đỗ nào phù hợp</h3>
              <p className="text-xs text-gray-500 max-w-[200px]">Hãy thử tìm kiếm với từ khóa khác hoặc tham khảo các bãi đỗ gợi ý dưới đây.</p>
            </div>
            
            {suggestedParkingLots && suggestedParkingLots.length > 0 && (
              <div className="mt-4 flex flex-col gap-4">
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Bãi đỗ xe gợi ý cho bạn
                </h4>
                {suggestedParkingLots.map((lot) => (
                  <div key={lot.id} className="flex justify-center w-full" id={`parking-card-suggested-${lot.id}`}>
                    <Card 
                      className={`overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 group flex flex-row h-40 w-full min-w-0 ${selectedLotId === lot.id ? "border-green-600 bg-green-50/5" : "border-green-900/30 dark:border-white/10 dark:bg-stone-900/40"}`}
                      style={{ border: '2px solid #14532d', borderRadius: '1.25rem' }}
                      onClick={() => {
                        if (onSelectLot) onSelectLot(lot);
                        if (isFullScreen) setShowQuickView(lot);
                      }}
                    >
                      {/* Image Section */}
                      <div className="relative w-28 sm:w-32 h-full shrink-0 overflow-hidden border-r dark:border-white/10">
                        <img
                          src={lot.imageUrl || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&h=200&q=80"}
                          alt={lot.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className={`${lot.available_slots > 0 ? "bg-green-600" : "bg-red-600"} text-white text-[8px] uppercase font-black py-0.5 px-1.5 border-none rounded-sm shadow-sm`}>
                            {lot.available_slots > 0 ? "Còn chỗ" : "Hết chỗ"}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Section */}
                      <CardContent className="p-3 flex-1 flex flex-col justify-between min-w-0 bg-white dark:bg-transparent">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <h3 className="font-black text-sm text-black dark:text-white truncate" title={fixVietnameseMojibake(lot.name)}>
                              {fixVietnameseMojibake(lot.name)}
                            </h3>
                            {(lot.distanceKm !== undefined && lot.distanceKm !== null) || (lot.nearMeDistanceKm !== undefined && lot.nearMeDistanceKm !== null) || (lot.userDistanceKm !== undefined && lot.userDistanceKm !== null) ? (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1 py-0.5 rounded whitespace-nowrap">
                                {formatDistance((lot.distanceKm ?? lot.nearMeDistanceKm ?? lot.userDistanceKm) * 1000)}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[9px] font-medium text-gray-500 dark:text-stone-400 line-clamp-2 leading-tight" title={fixVietnameseMojibake(lot.address)}>
                            {fixVietnameseMojibake(lot.address)}
                          </p>
                        </div>

                        <div className="flex items-end justify-between gap-1 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">Trống</span>
                            <div className="flex items-baseline gap-0.5">
                              <span className="font-black text-xl text-green-600 leading-none">
                                {lot.available_slots || 0}
                              </span>
                              <span className="text-gray-400 font-bold text-[10px]">/ {lot.total_slots || 0}</span>
                            </div>
                          </div>
                          
                          <Button
                            id="get-directions-btn-suggested"
                            variant="secondary"
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-black dark:text-white font-bold rounded-lg h-7 px-2 text-[9px] border-none transition-all flex items-center gap-1 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(lot);
                            }}
                          >
                            <Route className="w-3 h-3" />
                            Chỉ đường
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          displayedLots.map((lot) => (
            <div key={lot.id} className="flex justify-center w-full" id={`parking-card-${lot.id}`}>
              <Card 
                className={`overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 group flex flex-row h-40 w-full min-w-0 ${selectedLotId === lot.id ? "border-green-600 bg-green-50/5" : "border-green-900/30 dark:border-white/10 dark:bg-stone-900/40"}`}
                style={{ border: '2px solid #14532d', borderRadius: '1.25rem' }}
                onClick={() => {
                  if (onSelectLot) onSelectLot(lot);
                  if (isFullScreen) setShowQuickView(lot);
                }}
              >
                {/* Image Section - Smaller width */}
                <div className="relative w-28 sm:w-32 h-full shrink-0 overflow-hidden border-r dark:border-white/10">
                  <img
                    src={lot.imageUrl || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&h=200&q=80"}
                    alt={lot.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className={`${lot.available_slots > 0 ? "bg-green-600" : "bg-red-600"} text-white text-[8px] uppercase font-black py-0.5 px-1.5 border-none rounded-sm shadow-sm`}>
                      {lot.available_slots > 0 ? "Còn chỗ" : "Hết chỗ"}
                    </Badge>
                  </div>
                </div>

                {/* Content Section - More space for text */}
                <CardContent className="p-3 flex-1 flex flex-col justify-between min-w-0 bg-white dark:bg-transparent">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <h3 className="font-black text-sm text-black dark:text-white truncate" title={fixVietnameseMojibake(lot.name)}>
                        {fixVietnameseMojibake(lot.name)}
                      </h3>
                      {(lot.distanceKm !== undefined && lot.distanceKm !== null) || (lot.nearMeDistanceKm !== undefined && lot.nearMeDistanceKm !== null) || (lot.userDistanceKm !== undefined && lot.userDistanceKm !== null) ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1 py-0.5 rounded whitespace-nowrap">
                          {formatDistance((lot.distanceKm ?? lot.nearMeDistanceKm ?? lot.userDistanceKm) * 1000)}
                        </span>
                      ) : null}
                      {lot.name && lot.name.length > 20 && (
                        <button 
                          className="text-[10px] text-blue-500 hover:underline shrink-0 font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(fixVietnameseMojibake(lot.name));
                          }}
                        >
                          Xem thêm
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] font-medium text-gray-500 dark:text-stone-400 line-clamp-2 leading-tight" title={fixVietnameseMojibake(lot.address)}>
                      {fixVietnameseMojibake(lot.address)}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-1 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">Trống</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-black text-xl text-green-600 leading-none">
                          {lot.available_slots || 0}
                        </span>
                        <span className="text-gray-400 font-bold text-[10px]">/ {lot.total_slots || 0}</span>
                      </div>
                    </div>
                    
                    <Button
                      id="get-directions-btn"
                      variant="secondary"
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-black dark:text-white font-bold rounded-lg h-7 px-2 text-[9px] border-none transition-all flex items-center gap-1 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(lot);
                      }}
                    >
                      <Route className="w-3 h-3" />
                      Chỉ đường
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
      
      {!directionLot && totalPages > 1 && (
        <div className={`p-3 border-t dark:border-white/10 flex items-center bg-muted/20 dark:bg-black/50 ${isFullScreen ? "justify-center gap-8" : "justify-between"}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="dark:border-white/30 dark:text-white dark:hover:bg-[#059669]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Trước
          </Button>
          <span className="text-sm font-medium dark:text-white">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="dark:border-white/30 dark:text-white dark:hover:bg-[#059669]"
          >
            Sau <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Quick View Modal for Full Screen Card Click */}
      {showQuickView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowQuickView(null)}
          />
          <Card className="relative w-full max-w-sm bg-white dark:bg-stone-900 border-2 border-green-900/50 shadow-2xl rounded-[1.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowQuickView(null)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20 transition"
            >
              <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="relative h-36">
              <img
                src={showQuickView.imageUrl || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&h=400&q=80"}
                alt={showQuickView.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge className={`${showQuickView.available_slots > 0 ? "bg-green-600" : "bg-red-600"} text-white text-[10px] uppercase font-black py-0.5 px-2.5 border-none rounded-full shadow-lg`}>
                  {showQuickView.available_slots > 0 ? "Còn chỗ" : "Hết chỗ"}
                </Badge>
              </div>
            </div>

            <CardContent className="p-5">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-black text-black dark:text-white mb-1 leading-tight line-clamp-1">
                    {fixVietnameseMojibake(showQuickView.name)}
                  </h2>
                  <div className="flex items-start gap-1.5 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                    <p className="text-[11px] font-medium line-clamp-1">{fixVietnameseMojibake(showQuickView.address)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-100 dark:border-white/10">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest block">Trống</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-2xl text-green-600 leading-none">
                        {showQuickView.available_slots || 0}
                      </span>
                      <span className="text-gray-400 font-bold text-xs">/ {showQuickView.total_slots || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest block">Giá vé</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-lg text-black dark:text-white leading-none">
                        {new Intl.NumberFormat('vi-VN').format(showQuickView.minprice || 15000)}đ
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold">/ mỗi giờ</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link 
                    href={`/users/detailParking/${showQuickView.id}`}
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 font-bold h-10 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs">
                      <ShoppingCart className="w-4 h-4" />
                      Đặt ngay
                    </Button>
                  </Link>
                  <Link 
                    href={`/users/detailParking/${showQuickView.id}`}
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline" className="w-full border-2 border-gray-100 dark:border-white/10 font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs">
                      <Info className="w-4 h-4" />
                      Chi tiết
                    </Button>
                  </Link>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-black dark:text-white font-bold h-10 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
                  onClick={() => {
                    handleGetDirections(showQuickView);
                    setShowQuickView(null);
                  }}
                >
                  <Route className="w-4 h-4" />
                  Chỉ đường
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
