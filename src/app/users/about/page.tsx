"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Award,
  ArrowRight,
  ParkingCircle,
  Smartphone,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 font-sans selection:bg-green-100 selection:text-green-900">
      <Header />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-green-500/5 dark:bg-green-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-8">
              Câu chuyện của chúng tôi
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-8">
              Định Nghĩa Lại <br />
              <span className="bg-linear-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Trải Nghiệm Đỗ Xe</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-medium mb-12 leading-relaxed">
              GoPark sinh ra với sứ mệnh giải quyết nỗi lo tìm chỗ đỗ xe tại các đô thị lớn, mang đến sự tiện lợi, an toàn và thông minh cho mọi tài xế Việt.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="h-16 px-10 bg-green-600 hover:bg-green-700 text-white rounded-[1.25rem] font-black text-lg shadow-xl shadow-green-600/20 active:scale-95 transition-all">
                Khám phá ngay <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="ghost" className="h-16 px-10 rounded-[1.25rem] font-black text-lg dark:text-white">
                Tìm hiểu thêm
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 bg-gray-50 dark:bg-stone-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem count="50,000+" label="Người dùng" />
            <StatItem count="1,200+" label="Bãi đỗ xe" />
            <StatItem count="98%" label="Hài lòng" />
            <StatItem count="24/7" label="Hỗ trợ" />
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1">
              <Badge className="bg-green-600 text-white font-bold mb-6">Giá trị cốt lõi</Badge>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-8 leading-tight">
                Tại sao hàng ngàn người <br /> tin dùng GoPark?
              </h2>
              <div className="space-y-8">
                <ValueCard 
                  icon={Zap} 
                  title="Tốc độ & Tiện lợi" 
                  description="Tìm kiếm và đặt chỗ chỉ trong 30 giây. Không còn phải chạy vòng quanh tìm chỗ đỗ."
                />
                <ValueCard 
                  icon={ShieldCheck} 
                  title="An toàn tuyệt đối" 
                  description="Hệ thống bãi đỗ được xác thực, có bảo vệ và camera giám sát 24/7."
                />
                <ValueCard 
                  icon={Users} 
                  title="Cộng đồng kết nối" 
                  description="Chia sẻ và đánh giá bãi đỗ giúp mọi người có lựa chọn tốt nhất."
                />
              </div>
            </div>
            
            <div className="flex-1 relative">
                <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full" />
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="relative z-10"
                >
                    <img 
                        src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1000&auto=format&fit=crop" 
                        alt="GoPark App" 
                        className="rounded-[3rem] shadow-3xl border-8 border-white dark:border-stone-800 rotate-3 hover:rotate-0 transition-transform duration-700"
                    />
                </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-32 bg-stone-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-green-600/20 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10"
            >
                <Target className="w-16 h-16 text-green-500 mb-8" />
                <h3 className="text-4xl font-black mb-6">Tầm nhìn</h3>
                <p className="text-xl text-gray-400 leading-relaxed font-medium">
                    Trở thành nền tảng quản lý và đặt chỗ đỗ xe hàng đầu Đông Nam Á, góp phần xây dựng đô thị thông minh và giảm thiểu ùn tắc giao thông.
                </p>
            </motion.div>
            
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10"
            >
                <Globe className="w-16 h-16 text-emerald-500 mb-8" />
                <h3 className="text-4xl font-black mb-6">Sứ mệnh</h3>
                <p className="text-xl text-gray-400 leading-relaxed font-medium">
                    Ứng dụng công nghệ tiên tiến nhất để tối ưu hóa không gian đỗ xe, tiết kiệm thời gian và nhiên liệu cho hàng triệu tài xế mỗi ngày.
                </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const StatItem = ({ count, label }: { count: string; label: string }) => (
  <div className="text-center">
    <p className="text-4xl md:text-6xl font-black text-green-600 mb-2 tracking-tighter">{count}</p>
    <p className="text-sm md:text-lg font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</p>
  </div>
);

const ValueCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex gap-6 group">
    <div className="shrink-0 w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white">
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{title}</h4>
      <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-md">{description}</p>
    </div>
  </div>
);
