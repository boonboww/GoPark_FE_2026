"use client";

import React, { useEffect, useState, useMemo } from "react";
import { promotionService, Voucher, VoucherDiscountType } from "@/services/promotion.service";
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
  Info,
  Lock,
  BookmarkPlus,
  Check
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type TabType = "all" | "my" | "eligible" | "expiring";

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    // Load claimed vouchers from localStorage
    const saved = localStorage.getItem("gopark_claimed_vouchers");
    if (saved) {
      try {
        setClaimedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi khi tải voucher đã lưu:", e);
      }
    }

    const fetchPromotions = async () => {
      try {
        const data = await promotionService.getAllWithEligibility();
        setVouchers(data || []);
      } catch (error) {
        console.error("Lỗi khi tải ưu đãi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const handleClaim = (id: string) => {
    const newClaimedIds = [...claimedIds, id];
    setClaimedIds(newClaimedIds);
    localStorage.setItem("gopark_claimed_vouchers", JSON.stringify(newClaimedIds));
    toast.success("Đã lưu ưu đãi vào kho của bạn!", {
      description: "Bạn có thể sử dụng ưu đãi này khi đặt chỗ.",
      icon: <Gift className="w-4 h-4 text-green-500" />
    });
  };

  const filteredPromotions = useMemo(() => {
    let list = [...vouchers];

    if (searchTerm) {
      list = list.filter(p =>
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ineligibility_reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (activeTab) {
      case "my":
        return list.filter(v => claimedIds.includes(v.id));
      case "eligible":
        // Hiển thị những cái dùng được nhưng CHƯA lưu (để người dùng lưu)
        return list.filter(v => v.is_eligible && !claimedIds.includes(v.id));
      case "expiring":
        return list.filter(v => {
            const days = differenceInDays(new Date(v.end_time), new Date());
            return days >= 0 && days <= 5;
        });
      default:
        return list;
    }
  }, [vouchers, searchTerm, activeTab, claimedIds]);

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
                        Lưu voucher vào kho của bạn và tận hưởng ưu đãi khi đặt chỗ đậu xe. Tiết kiệm hơn, đỗ xe thông minh hơn.
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
                            placeholder="Nhập mã voucher để tìm kiếm..."
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
                    <TabTrigger value="my" label="Ưu đãi của tôi" icon={Gift} active={activeTab === "my"} count={claimedIds.length} />
                    <TabTrigger value="eligible" label="Có thể lưu" icon={Zap} active={activeTab === "eligible"} />
                    <TabTrigger value="expiring" label="Sắp hết hạn" icon={AlertCircle} active={activeTab === "expiring"} />
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
                    <VoucherCard 
                      voucher={promo} 
                      isClaimed={claimedIds.includes(promo.id)}
                      onClaim={() => handleClaim(promo.id)}
                      showUseButton={activeTab === "my"}
                    />
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
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
              {activeTab === "my" ? "Kho ưu đãi đang trống" : "Không tìm thấy ưu đãi nào"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
              {activeTab === "my" 
                ? "Hãy quay lại tab Tất cả để lưu những ưu đãi hấp dẫn nhất về kho của bạn nhé!"
                : "Bạn có thể thử đổi từ khóa tìm kiếm hoặc kiểm tra lại các danh mục khác nhé!"}
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

const TabTrigger = ({ value, label, icon: Icon, active, count }: { value: string; label: string; icon: any; active: boolean, count?: number }) => (
  <TabsTrigger 
    value={value} 
    className={`relative px-6 py-4 rounded-full transition-all duration-300 border-none bg-transparent group ${active ? 'text-green-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
  >
    <div className="flex items-center gap-2.5 relative z-10">
        <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-black text-sm">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
            {count}
          </span>
        )}
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

const VoucherCard = ({ 
  voucher, 
  isClaimed, 
  onClaim, 
  showUseButton,
  setActiveTab
}: { 
  voucher: Voucher; 
  isClaimed: boolean; 
  onClaim: () => void;
  showUseButton: boolean;
  setActiveTab?: (val: TabType) => void;
}) => {
    const daysRemaining = differenceInDays(new Date(voucher.end_time), new Date());
    const isExpiring = daysRemaining >= 0 && daysRemaining < 7;
    const isEligible = voucher.is_eligible ?? true;

    const title = voucher.discount_type === VoucherDiscountType.PERCENTAGE 
        ? `GIẢM ${voucher.discount_value}%`
        : `GIẢM ${Number(voucher.discount_value).toLocaleString('vi-VN')}đ`;

    const description = `Áp dụng cho đơn hàng từ ${Number(voucher.min_booking_value).toLocaleString('vi-VN')}đ. ${voucher.max_discount_amount ? `Giảm tối đa ${Number(voucher.max_discount_amount).toLocaleString('vi-VN')}đ.` : ''}`;

    return (
        <div className="relative group">
            {/* TICKET CONTAINER */}
            <div className={`flex bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-stone-800 overflow-hidden h-52 group-hover:shadow-2xl group-hover:shadow-green-500/10 transition-all duration-500 group-hover:-translate-y-1 ${!isEligible ? 'opacity-75' : ''}`}>
                
                {/* LEFT SIDE: VALUE/ICON */}
                <div className={`w-32 sm:w-40 flex flex-col items-center justify-center relative overflow-hidden ${!isEligible ? 'bg-gray-200 dark:bg-stone-800 text-gray-500' : isClaimed ? 'bg-stone-900 text-white' : 'bg-linear-to-br from-green-600 to-emerald-500 text-white'}`}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/20" />
                        <Ticket className="absolute -bottom-4 -left-4 w-24 h-24 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center px-2 text-center">
                        <div className={`p-3 rounded-2xl mb-2 shadow-lg ${isClaimed ? 'bg-white/10 backdrop-blur-sm text-green-500' : isEligible ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-white dark:bg-stone-700 text-gray-400'}`}>
                            {isClaimed ? <Check className="w-8 h-8" /> : isEligible ? <Zap className="w-8 h-8 fill-current" /> : <Lock className="w-8 h-8" />}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-tighter ${!isEligible ? 'text-gray-400' : 'text-white/80'}`}>GoPark</p>
                        <p className={`text-lg font-black leading-tight ${!isEligible ? 'text-gray-700 dark:text-gray-300' : 'text-white'}`}>{voucher.code}</p>
                    </div>

                    {/* Dotted Border */}
                    <div className="absolute right-0 top-0 bottom-0 w-px border-r-2 border-dashed border-gray-200/30 dark:border-white/10 z-20" />
                </div>

                {/* RIGHT SIDE: CONTENT */}
                <div className="flex-1 p-6 flex flex-col justify-between relative bg-white dark:bg-stone-900">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-black leading-tight line-clamp-2 text-base transition-colors ${isClaimed ? 'text-stone-900 dark:text-white' : 'text-gray-900 dark:text-white group-hover:text-green-600'}`}>
                                {title}
                            </h4>
                            {isEligible && !isClaimed && (
                                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0 mt-1" />
                            )}
                            {isClaimed && (
                                <div className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1" />
                            )}
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                            {description}
                        </p>
                        {!isEligible && voucher.ineligibility_reason && (
                             <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {voucher.ineligibility_reason}
                             </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className={`w-3.5 h-3.5 ${isExpiring ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                                <span className={`text-[10px] font-black ${isExpiring ? 'text-red-500' : 'text-gray-400'}`}>
                                    {daysRemaining < 0 ? 'ĐÃ HẾT HẠN' : isExpiring ? `CÒN ${daysRemaining} NGÀY` : `HSD: ${format(new Date(voucher.end_time), "dd/MM/yyyy")}`}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-green-600 transition-colors">
                                <Info className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {showUseButton && isClaimed ? (
                                <Link href="/users/findParking" className="flex-1">
                                    <Button className="w-full h-11 bg-stone-900 dark:bg-stone-800 hover:bg-black text-white font-black rounded-xl text-xs shadow-lg active:scale-[0.98] transition-all">
                                        Sử dụng ngay <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                </Link>
                            ) : isClaimed ? (
                                <Button 
                                    className="flex-1 h-11 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs shadow-lg active:scale-[0.98] transition-all"
                                    onClick={(e) => { e.preventDefault(); setActiveTab?.("my"); }}
                                >
                                    Đã lưu ưu đãi <Check className="w-3.5 h-3.5 ml-2" />
                                </Button>
                            ) : isEligible ? (
                                <Button 
                                    onClick={(e) => { e.preventDefault(); onClaim(); }}
                                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-xs shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all"
                                >
                                    <BookmarkPlus className="w-3.5 h-3.5 mr-2" /> Lưu ưu đãi
                                </Button>
                            ) : (
                                <Button 
                                    disabled
                                    className="flex-1 h-11 bg-gray-100 dark:bg-stone-800 text-gray-400 font-black rounded-xl text-xs border border-gray-200 dark:border-stone-700"
                                >
                                    Chưa đủ điều kiện
                                </Button>
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
