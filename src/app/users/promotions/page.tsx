"use client";
import React, { useEffect, useState, useMemo } from "react";
import { notificationService } from "@/services/notification.service";
import { SentNotification } from "@/stores/notification.store";
import { 
  Megaphone, 
  Ticket, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Search,
  Calendar,
  Tag,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type TabType = "all" | "my" | "expiring" | "used";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<SentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await notificationService.getForUser();
        const filtered = (res.data || []).filter(
          (n: SentNotification) => n.type === "PROMOTION" || n.type === "PROMOTIONAL"
        );
        setPromotions(filtered);
      } catch (error) {
        console.error("Lỗi khi tải ưu đãi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const handleClaim = async (id: string) => {
    try {
      await notificationService.markRead(id);
      // Update local state to reflect the claimed status
      setPromotions(prev => prev.map(p => {
        if (p.id === id) return { ...p, isRead: true };
        return p;
      }));
    } catch (error) {
      console.error("Lỗi khi nhận ưu đãi:", error);
    }
  };

  const filteredPromotions = useMemo(() => {
    let list = [...promotions];
    
    if (searchTerm) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (activeTab) {
      case "my":
        return list.filter(p => p.isRead);
      case "expiring":
        return list.filter(p => differenceInDays(new Date(), new Date(p.createdAt)) > 5);
      case "used":
        // Mock logic: used means expired or specifically tagged
        return list.filter(p => differenceInDays(new Date(), new Date(p.createdAt)) > 10);
      default:
        return list;
    }
  }, [promotions, searchTerm, activeTab]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-stone-950 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-8 uppercase tracking-widest">
          <Link href="/" className="hover:text-green-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-green-600 font-bold">Ưu đãi</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tight leading-tight">
              Kho <span className="text-green-600 underline decoration-green-500/30 underline-offset-8">Voucher</span> <br />
              Độc Quyền
            </h1>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Tìm voucher, khuyến mãi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-6 bg-white dark:bg-stone-900 border-gray-100 dark:border-stone-800 rounded-3xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all h-14"
            />
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} className="mb-12" onValueChange={(val) => setActiveTab(val as TabType)}>
          <TabsList className="h-auto p-1.5 bg-white dark:bg-stone-900/50 rounded-[2rem] border border-gray-100 dark:border-stone-800 shadow-sm flex flex-wrap w-fit">
            <TabsTrigger value="all" className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold transition-all">
              <Filter className="h-4 w-4" /> Tất cả
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold transition-all">
              <Ticket className="h-4 w-4" /> Ưu đãi của tôi
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold transition-all">
              <AlertCircle className="h-4 w-4" /> Sắp hết hạn
            </TabsTrigger>
            <TabsTrigger value="used" className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold transition-all">
              <CheckCircle2 className="h-4 w-4" /> Đã sử dụng
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-[2rem] p-4 border-gray-100 dark:border-stone-800 aspect-square flex flex-col justify-center">
                <Skeleton className="h-12 w-12 rounded-xl mx-auto mb-4" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </Card>
            ))}
          </div>
        ) : filteredPromotions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPromotions.map((promo) => (
              <Card 
                key={promo.id}
                className="group relative rounded-[2rem] border border-gray-100 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden aspect-square flex flex-col p-6 bg-white dark:bg-stone-900"
              >
                {/* Blurred Background Layer */}
                <div 
                  className="absolute inset-0 z-0 opacity-30 blur-[4px] transition-transform duration-700 group-hover:scale-125"
                  style={{ 
                    backgroundImage: 'url(/uudai.png)', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                  }}
                ></div>
                
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-white/70 dark:bg-stone-950/70 z-0"></div>

                <div className="relative z-10 flex flex-col h-full items-center text-center">
                  {/* Status Badge - Top Center */}
                  <div className="mb-4">
                    {promo.isRead ? (
                      <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[8px] px-2 py-0.5 border-none">
                        Đã sở hữu
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 text-white font-bold uppercase text-[8px] px-2 py-0.5 animate-pulse border-none">
                        Ưu đãi mới
                      </Badge>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-sm mb-4">
                    <Ticket className="h-6 w-6" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm font-black text-black dark:text-white leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                    {promo.title}
                  </h3>
                  
                  {/* Content - Smaller and lighter */}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                    {promo.content}
                  </p>

                  {/* Footer Action */}
                  <div className="w-full pt-4 border-t border-dashed border-gray-100 dark:border-stone-800 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                      <Clock className="h-3 w-3 text-green-600" /> Còn 30 ngày
                    </div>
                    
                    {activeTab === "all" && !promo.isRead ? (
                      <Button 
                        onClick={() => handleClaim(promo.id)}
                        className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 border-none"
                      >
                        Nhận ngay
                      </Button>
                    ) : (
                      <Link href="/users/findParking" className="w-full">
                        <Button className="w-full h-9 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/10 border-none">
                          Dùng ngay
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Decorative Notch for ticket feel */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-[#F8FAFC] dark:bg-stone-950 border-r border-gray-100 dark:border-stone-800 z-10"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-[#F8FAFC] dark:bg-stone-950 border-l border-gray-100 dark:border-stone-800 z-10"></div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-[3rem] p-20 text-center border-gray-100 dark:border-stone-800 shadow-sm">
            <div className="h-24 w-24 bg-green-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="h-12 w-12 text-green-200" />
            </div>
            <CardTitle className="text-2xl font-black text-black dark:text-white mb-2">Không tìm thấy ưu đãi nào</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Thử thay đổi tab hoặc từ khóa tìm kiếm để khám phá thêm nhiều voucher hấp dẫn khác nhé.
            </CardDescription>
          </Card>
        )}

        {/* Featured Section */}
        <Card className="mt-24 relative overflow-hidden rounded-[3rem] bg-stone-900 border-none text-white shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-green-600/20 -skew-x-12 translate-x-1/2"></div>
          <CardContent className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 p-8 md:p-16">
            <div className="flex-1 text-left">
              <Badge className="bg-green-600 hover:bg-green-600 text-white font-black uppercase tracking-widest mb-6 border-none">
                Ưu đãi độc quyền
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                Tặng 100% Phí Đỗ Xe <br /> Lần Đầu Tiên
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-md">
                Chỉ dành riêng cho thành viên mới đăng ký trong tháng này. Hãy trải nghiệm GoPark ngay hôm nay!
              </p>
              <Button variant="outline" className="bg-white text-black hover:bg-green-50 font-black rounded-2xl h-14 px-10 text-lg transition-transform hover:scale-105 border-none shadow-xl">
                Nhận Voucher Ngay
              </Button>
            </div>
            <div className="w-full md:w-auto flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 text-center min-w-[240px]">
                  <p className="text-7xl font-black text-green-500 mb-2">0đ</p>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Cho lượt đỗ đầu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
