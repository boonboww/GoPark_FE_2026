"use client";

import React, { useEffect, useState, useMemo } from "react";
import { notificationService } from "@/services/notification.service";
import { SentNotification } from "@/stores/notification.store";
import {
  Ticket,
  Clock,
  Sparkles,
  Search,
  Tag,
  Filter,
  CheckCircle2,
  AlertCircle,
  Zap,
  Gift,
  ArrowRight,
  Info
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
        return list.filter(p => {
            const days = differenceInDays(new Date(), new Date(p.createdAt));
            return days > 5 && days < 10;
        });
      case "used":
        return list.filter(p => differenceInDays(new Date(), new Date(p.createdAt)) >= 10);
      default:
        return list;
    }
  }, [promotions, searchTerm, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-950 font-sans selection:bg-green-100 selection:text-green-900">
      <Header />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-green-500/10 dark:bg-green-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-6">
                        <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" /> Ưu đãi độc quyền
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-8">
                        Kho <span className="bg-linear-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Voucher</span> <br />
                        Đỉnh Cao Tại GoPark
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                        Khám phá hàng ngàn mã giảm giá, ưu đãi đặt chỗ và quà tặng đặc biệt dành riêng cho bạn. Đỗ xe thông minh, tiết kiệm tối đa.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative max-w-2xl mx-auto group"
                >
                    <div className="absolute -inset-1 bg-linear-to-r from-green-600 to-blue-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <div className="relative flex items-center bg-white dark:bg-stone-900 rounded-[2rem] border border-gray-100 dark:border-stone-800 shadow-xl overflow-hidden h-16 md:h-20 p-2">
                        <Search className="absolute left-6 h-6 w-6 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã giảm giá, bãi đỗ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-full pl-14 pr-32 bg-transparent border-none outline-none text-gray-700 dark:text-white font-bold text-lg placeholder:text-gray-400 placeholder:font-normal"
                        />
                        <Button className="absolute right-2 h-12 md:h-16 px-8 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black shadow-lg shadow-green-600/20 transition-all active:scale-95 hidden sm:flex">
                            Tìm ngay
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
      </section>

      {/* TABS & FILTER */}
      <section className="container mx-auto px-4 mb-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-100 dark:border-stone-900 pb-8">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabType)} className="w-full md:w-auto">
                <TabsList className="bg-transparent h-auto p-0 flex gap-2 sm:gap-6 flex-wrap justify-center md:justify-start">
                    <TabTrigger value="all" label="Tất cả" icon={Filter} active={activeTab === "all"} />
                    <TabTrigger value="my" label="Ưu đãi của tôi" icon={Gift} active={activeTab === "my"} />
                    <TabTrigger value="expiring" label="Sắp hết hạn" icon={AlertCircle} active={activeTab === "expiring"} />
                    <TabTrigger value="used" label="Đã sử dụng" icon={CheckCircle2} active={activeTab === "used"} />
                </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span>{filteredPromotions.length} Ưu đãi khả dụng</span>
            </div>
        </div>
      </section>

      {/* CONTENT LISTING */}
      <section className="container mx-auto px-4 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-gray-100 dark:bg-stone-900 animate-pulse" />
            ))}
          </div>
        ) : filteredPromotions.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
                {filteredPromotions.map((promo) => (
                <motion.div
                    key={promo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                >
                    <VoucherCard promo={promo} onClaim={() => handleClaim(promo.id)} isMyTab={activeTab === "my"} />
                </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-32 h-32 bg-gray-100 dark:bg-stone-900 rounded-[3rem] flex items-center justify-center mb-8 rotate-12">
              <Ticket className="w-16 h-16 text-gray-300" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Không tìm thấy ưu đãi nào</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
              Bạn có thể thử đổi từ khóa tìm kiếm hoặc kiểm tra lại các danh mục khác nhé!
            </p>
            <Button 
                variant="outline" 
                className="mt-8 rounded-2xl border-2 font-bold px-8"
                onClick={() => { setSearchTerm(""); setActiveTab("all"); }}
            >
                Xem tất cả ưu đãi
            </Button>
          </motion.div>
        )}
      </section>

      {/* FEATURED BANNER */}
      <section className="container mx-auto px-4 pb-32">
        <Card className="relative overflow-hidden rounded-[3rem] border-none shadow-2xl bg-stone-900">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-linear-to-r from-stone-950 via-stone-900/80 to-transparent" />
            
            <CardContent className="relative z-10 p-8 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
                        <Zap className="w-3 h-3 fill-white" /> Khởi đầu hoàn hảo
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8">
                        Giảm Ngay <span className="text-green-500">100%</span> <br /> 
                        Cho Lần Đặt Đầu
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl font-medium mb-12">
                        Chào mừng bạn gia nhập đại gia đình GoPark! Tặng ngay mã giảm giá tối đa cho lượt trải nghiệm đầu tiên.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button className="h-16 px-10 bg-green-600 hover:bg-green-700 text-white rounded-[1.25rem] font-black text-lg shadow-xl shadow-green-600/30">
                            Đăng ký nhận mã
                        </Button>
                        <Button variant="outline" className="h-16 px-10 border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md rounded-[1.25rem] font-black text-lg">
                            Tìm hiểu thêm
                        </Button>
                    </div>
                </div>

                <div className="relative group cursor-default hidden lg:block">
                    <motion.div 
                        animate={{ 
                            rotateY: [0, 15, 0],
                            rotateX: [0, 5, 0]
                        }}
                        transition={{ 
                            duration: 5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-12 text-center shadow-3xl"
                    >
                        <p className="text-8xl font-black text-green-500 mb-2 drop-shadow-2xl">FREE</p>
                        <div className="h-px w-full bg-white/20 mb-6" />
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Voucher 0đ</p>
                        <p className="text-[10px] text-white/50 font-bold mt-2">HSD: 30 ngày từ khi kích hoạt</p>
                    </motion.div>
                </div>
            </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}

const TabTrigger = ({ value, label, icon: Icon, active }: { value: string; label: string; icon: any; active: boolean }) => (
  <TabsTrigger 
    value={value} 
    className={`relative px-6 py-4 rounded-full transition-all duration-300 border-none bg-transparent group ${active ? 'text-green-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
  >
    <div className="flex items-center gap-2.5 relative z-10">
        <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-black text-sm">{label}</span>
    </div>
    {active && (
        <motion.div 
            layoutId="activeTab"
            className="absolute inset-0 bg-green-50 dark:bg-green-900/20 rounded-full -z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
    )}
  </TabsTrigger>
);

const VoucherCard = ({ promo, onClaim, isMyTab }: { promo: SentNotification; onClaim: () => void; isMyTab: boolean }) => {
    const daysRemaining = 30 - differenceInDays(new Date(), new Date(promo.createdAt));
    const isExpiring = daysRemaining < 7;

    return (
        <div className="relative group">
            {/* TICKET CONTAINER */}
            <div className="flex bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-stone-800 overflow-hidden h-52 group-hover:shadow-2xl group-hover:shadow-green-500/10 transition-all duration-500 group-hover:-translate-y-1">
                
                {/* LEFT SIDE: VALUE/ICON */}
                <div className={`w-32 sm:w-40 flex flex-col items-center justify-center relative overflow-hidden ${promo.isRead ? 'bg-gray-50 dark:bg-stone-800/50' : 'bg-linear-to-br from-green-600 to-emerald-500 text-white'}`}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/20" />
                        <Ticket className="absolute -bottom-4 -left-4 w-24 h-24 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className={`p-4 rounded-2xl mb-3 shadow-lg ${promo.isRead ? 'bg-white dark:bg-stone-700 text-gray-400' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                            <Zap className="w-8 h-8 fill-current" />
                        </div>
                        <p className={`text-xs font-black uppercase tracking-tighter ${promo.isRead ? 'text-gray-400' : 'text-white/80'}`}>GoPark</p>
                        <p className={`text-xl font-black ${promo.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-white'}`}>VOUCHER</p>
                    </div>

                    {/* Dotted Border */}
                    <div className="absolute right-0 top-0 bottom-0 w-px border-r-2 border-dashed border-gray-200/30 dark:border-white/10 z-20" />
                </div>

                {/* RIGHT SIDE: CONTENT */}
                <div className="flex-1 p-6 flex flex-col justify-between relative bg-white dark:bg-stone-900">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-black text-gray-900 dark:text-white leading-tight line-clamp-2 text-base group-hover:text-green-600 transition-colors">
                                {promo.title}
                            </h4>
                            {!promo.isRead && (
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0 mt-1" />
                            )}
                        </div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {promo.content}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className={`w-3.5 h-3.5 ${isExpiring ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                                <span className={`text-[10px] font-black ${isExpiring ? 'text-red-500' : 'text-gray-400'}`}>
                                    {isExpiring ? `CÒN ${daysRemaining} NGÀY` : `HSD: ${format(new Date(promo.createdAt), "dd/MM/yyyy")}`}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-green-600 transition-colors">
                                <Info className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {!promo.isRead ? (
                                <Button 
                                    onClick={(e) => { e.preventDefault(); onClaim(); }}
                                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-xs shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all"
                                >
                                    Nhận Voucher Ngay
                                </Button>
                            ) : (
                                <Link href="/users/findParking" className="flex-1">
                                    <Button className="w-full h-11 bg-stone-900 dark:bg-stone-800 hover:bg-black text-white font-black rounded-xl text-xs shadow-lg active:scale-[0.98] transition-all">
                                        Sử dụng ngay <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Punched hole effect */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 dark:bg-stone-950 border border-gray-100 dark:border-stone-900 shadow-inner z-30" />
                </div>
            </div>

            {/* DECORATIVE DOTS */}
            <div className="absolute left-32 sm:left-40 top-0 h-full flex flex-col justify-around py-4 z-40 pointer-events-none translate-x-[-50%]">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-gray-100 dark:bg-stone-800" />
                ))}
            </div>
        </div>
    );
};
