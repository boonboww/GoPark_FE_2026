"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useOwnerParkingLots } from "@/hooks/useOwnerParkingLots";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewsList } from "@/components/features/parking-detail/ReviewsList";
import { ParkingContext } from "@/components/features/parking-detail/ParkingContext";
import {
  IconStar,
  IconMessage2,
  IconLoader2,
  IconMessageOff,
  IconBuildingStore,
  IconChevronRight,
  IconArrowRight,
} from "@tabler/icons-react";
import { useAuthStore } from "@/stores";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function OwnerReviewsPage() {
  const { user } = useAuthStore();
  const { data: parkingLotsRes, isLoading: isLoadingLots } =
    useOwnerParkingLots();

  const parkingLots = React.useMemo(() => {
    if (!parkingLotsRes) return [];
    if (Array.isArray(parkingLotsRes)) return parkingLotsRes;
    if (
      (parkingLotsRes as any).data &&
      Array.isArray((parkingLotsRes as any).data)
    ) {
      return (parkingLotsRes as any).data;
    }
    return [];
  }, [parkingLotsRes]);

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const selectedLot = React.useMemo(() => {
    return parkingLots.find((lot: any) => lot.id.toString() === selectedLotId);
  }, [parkingLots, selectedLotId]);

  const contextValue = React.useMemo(
    () => ({
      dataLot: selectedLot
        ? { ...selectedLot, owner: { id: user?.id } }
        : selectedLotId
          ? { id: parseInt(selectedLotId), owner: { id: user?.id } }
          : null,
      loadingLot: false,
      selectedSpot: null,
      setSelectedSpot: () => {},
      setDataLot: () => {},
      setLoadingLot: () => {},
    }),
    [selectedLot, selectedLotId, user?.id],
  );

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
      <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-10 w-full font-roboto">
          {/* Premium Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                >
                  Customer Feedback
                </Badge>
              </div>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                  <IconMessage2 className="w-8 h-8 text-white" />
                </div>
                Đánh giá khách hàng
              </h1>
              <p className="text-zinc-500 font-medium max-w-2xl">
                Quản lý uy tín thương hiệu bằng cách theo dõi và phản hồi các
                trải nghiệm thực tế từ người dùng tại hệ thống bãi đỗ của bạn.
              </p>
            </div>
          </div>

          <Separator className="bg-zinc-200/60 dark:bg-zinc-800" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Selection Column */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden transition-all duration-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 flex items-center justify-center text-[10px] font-black">
                      01
                    </div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">
                      Chọn bãi đỗ
                    </CardTitle>
                  </div>
                  <CardDescription className="text-zinc-500 font-bold">
                    Lựa chọn bãi đỗ xe để bắt đầu quản lý đánh giá.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingLots ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                      <IconLoader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        Đang tải dữ liệu...
                      </span>
                    </div>
                  ) : parkingLots.length > 0 ? (
                    <div className="space-y-5">
                      <Select
                        onValueChange={setSelectedLotId}
                        value={selectedLotId || ""}
                      >
                        <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl h-14 font-black text-zinc-900 dark:text-white px-6 focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <SelectValue placeholder="Chọn một bãi đỗ xe" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white dark:bg-zinc-900">
                          {parkingLots.map((lot: any) => (
                            <SelectItem
                              key={lot.id}
                              value={lot.id.toString()}
                              className="font-bold rounded-xl py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <IconBuildingStore
                                  size={16}
                                  className="text-zinc-400"
                                />
                                {lot.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedLot ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                          <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                              <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0">
                                <IconBuildingStore size={18} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                  {selectedLot.name}
                                </p>
                                <p className="text-[11px] font-bold text-zinc-400 leading-relaxed">
                                  {selectedLot.address ||
                                    "Chưa có địa chỉ cụ thể"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 flex gap-3">
                          <IconStar className="w-5 h-5 text-blue-500 shrink-0" />
                          <p className="text-[11px] font-bold text-blue-700/80 leading-relaxed">
                            Mẹo: Trả lời đánh giá giúp tăng thứ hạng bãi đỗ của
                            bạn.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 gap-4">
                      <IconMessageOff className="w-10 h-10 text-amber-500" />
                      <p className="text-xs font-bold text-amber-700">
                        Bạn chưa có bãi đỗ xe nào.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-8">
              {selectedLotId ? (
                <div
                  key={`lot-view-${selectedLotId}`}
                  className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700"
                >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                      <h2 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">
                        Danh sách phản hồi
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs">
                      <span>Reviews</span>
                      <IconChevronRight size={12} />
                      <span className="text-blue-600">{selectedLot?.name}</span>
                    </div>
                  </div>

                  <Card className="bg-white dark:bg-zinc-900 border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none rounded-[3rem] p-2 overflow-hidden">
                    <ParkingContext.Provider value={contextValue}>
                      <ReviewsList />
                    </ParkingContext.Provider>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[4rem] border-4 border-dashed border-white dark:border-zinc-800 shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                  <div className="relative z-10 flex flex-col items-center text-center px-10">
                    <div className="w-28 h-28 bg-white dark:bg-zinc-800 rounded-[35px] shadow-2xl shadow-zinc-200 dark:shadow-none flex items-center justify-center mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                      <IconStar className="w-14 h-14 text-blue-100 fill-blue-500" />
                    </div>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3">
                      Phản hồi tạo niềm tin
                    </h3>
                    <p className="text-zinc-400 font-bold max-w-sm">
                      Chọn một bãi đỗ xe để bắt đầu lắng nghe khách hàng của
                      bạn. Mỗi lượt phản hồi là một cơ hội để cải thiện chất
                      lượng dịch vụ.
                    </p>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-10 right-10 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-10 left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
