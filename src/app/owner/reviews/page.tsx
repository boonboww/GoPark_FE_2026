"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useOwnerParkingLots } from "@/hooks/useOwnerParkingLots";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ReviewsList } from "@/components/features/parking-detail/ReviewsList";
import { ParkingContext } from "@/components/features/parking-detail/ParkingContext";
import { MessageSquare, Star, Loader2, MessageCircleOff } from "lucide-react";
import { useAuthStore } from "@/stores";

export default function OwnerReviewsPage() {
  const { user } = useAuthStore();
  const { data: parkingLotsRes, isLoading: isLoadingLots } = useOwnerParkingLots();
  
  // Xử lý dữ liệu trả về từ API owner lots - có thể là { data: [...] } hoặc [...]
  const parkingLots = React.useMemo(() => {
    if (!parkingLotsRes) return [];
    if (Array.isArray(parkingLotsRes)) return parkingLotsRes;
    if ((parkingLotsRes as any).data && Array.isArray((parkingLotsRes as any).data)) {
      return (parkingLotsRes as any).data;
    }
    return [];
  }, [parkingLotsRes]);

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const selectedLot = React.useMemo(() => {
    return parkingLots.find((lot: any) => lot.id.toString() === selectedLotId);
  }, [parkingLots, selectedLotId]);

  // Giả lập context cho ReviewsList
  // Quan trọng: Phải truyền object lot có ID để ReviewsList gọi API lấy reviews
  // Cần mock thêm thông tin owner để ReviewsList nhận diện là chủ sở hữu và hiển thị nút trả lời
  const contextValue = React.useMemo(() => ({
    dataLot: selectedLot 
      ? { ...selectedLot, owner: { id: user?.id } } 
      : (selectedLotId ? { id: parseInt(selectedLotId), owner: { id: user?.id } } : null),
    loadingLot: false,
    selectedSpot: null,
    setSelectedSpot: () => {},
    setDataLot: () => {},
    setLoadingLot: () => {},
  }), [selectedLot, selectedLotId, user?.id]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8 w-full">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Đánh giá từ khách hàng
            </h1>
            <p className="text-slate-500 font-medium font-sans">
              Xem và phản hồi các đánh giá của khách hàng cho từng bãi đỗ xe của bạn.
            </p>
          </div>

          <Card className="border-slate-100 rounded-3xl overflow-hidden border-none bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Bước 1</span>
                  <p className="text-sm font-bold text-slate-700">Chọn bãi đỗ cần quản lý</p>
                </div>
                
                <div className="flex-1">
                  {isLoadingLots ? (
                    <div className="flex items-center gap-3 text-slate-400 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm">Đang tải danh sách bãi đỗ...</span>
                    </div>
                  ) : parkingLots.length > 0 ? (
                    <Select onValueChange={setSelectedLotId} value={selectedLotId || ""}>
                      <SelectTrigger className="w-full bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-900 px-6 focus:ring-2 focus:ring-blue-500/20 transition-all">
                        <SelectValue placeholder="Bấm vào đây để chọn một bãi đỗ xe" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        {parkingLots.map((lot: any) => (
                          <SelectItem key={lot.id} value={lot.id.toString()} className="font-bold rounded-xl py-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                            {lot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-3 text-amber-600 font-bold bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <MessageCircleOff className="w-5 h-5" />
                      <span className="text-sm">Bạn chưa có bãi đỗ xe nào để quản lý đánh giá.</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedLotId ? (
            <div key={`lot-view-${selectedLotId}`} className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 px-2">
                <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Đang xem: {selectedLot?.name || `Bãi đỗ #${selectedLotId}`}
                </h2>
              </div>
              
              <div className="bg-white rounded-[40px] p-2 shadow-sm border border-slate-100">
                <ParkingContext.Provider value={contextValue}>
                  <ReviewsList />
                </ParkingContext.Provider>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[50px] border-4 border-dashed border-white shadow-inner">
              <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
                <Star className="w-12 h-12 text-blue-100 fill-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Sẵn sàng phản hồi</h3>
              <p className="text-slate-400 font-bold text-center max-w-sm px-6">
                Chọn bãi đỗ xe từ danh sách phía trên để xem và trả lời các đánh giá mới nhất từ khách hàng của bạn.
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}