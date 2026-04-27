"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageCircle, 
  Clock, 
  Globe,
  Facebook,
  Instagram,
  Twitter,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
        q: "Làm thế nào để tôi đặt chỗ đỗ xe qua GoPark?",
        a: "Bạn chỉ cần mở ứng dụng, tìm kiếm bãi đỗ mong muốn hoặc chọn bãi gần nhất. Sau đó nhấn 'Đặt chỗ', chọn thời gian và xác nhận. Cực kỳ đơn giản!"
    },
    {
        q: "Tôi có thể hủy đặt chỗ đã xác nhận không?",
        a: "Có, bạn có thể hủy đặt chỗ trước giờ bắt đầu tối thiểu 15 phút mà không mất phí. Sau thời gian đó, phí hủy có thể được áp dụng tùy theo quy định của từng bãi đỗ."
    },
    {
        q: "Làm sao để thanh toán phí đỗ xe?",
        a: "GoPark hỗ trợ nhiều phương thức thanh toán: Ví GoPark, Thẻ ngân hàng, Momo, ZaloPay hoặc tiền mặt tại bãi đỗ."
    },
    {
        q: "Nếu tôi đến muộn so với giờ đặt thì sao?",
        a: "Chúng tôi sẽ giữ chỗ cho bạn tối đa 15 phút so với giờ đặt. Sau thời gian đó, nếu bạn chưa đến, chỗ đỗ có thể được nhường cho người khác."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 font-sans selection:bg-green-100 selection:text-green-900">
      <Header />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-green-500/5 dark:bg-green-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-8">
              Liên hệ với chúng tôi
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-8">
              Chúng Tôi Luôn <br />
              <span className="bg-linear-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Lắng Nghe Bạn</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium mb-12 leading-relaxed">
                Có câu hỏi, góp ý hay muốn hợp tác? Đừng ngần ngại gửi tin nhắn cho đội ngũ GoPark. Chúng tôi sẽ phản hồi bạn trong vòng 24 giờ.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTACT FORM & INFO */}
      <section className="pb-32 container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
                <ContactInfoCard 
                    icon={Mail} 
                    title="Email" 
                    value="support@gopark.vn" 
                    subValue="Phản hồi trong 24h"
                />
                <ContactInfoCard 
                    icon={Phone} 
                    title="Điện thoại" 
                    value="1900 6789" 
                    subValue="Thứ 2 - Chủ Nhật, 8h-22h"
                />
                <ContactInfoCard 
                    icon={MapPin} 
                    title="Văn phòng" 
                    value="Tầng 12, Tòa nhà Innovation" 
                    subValue="Quận 1, TP. Hồ Chí Minh"
                />
                
                <div className="p-8 rounded-[2.5rem] bg-gray-50 dark:bg-stone-900/50 border border-gray-100 dark:border-stone-800">
                    <h4 className="text-lg font-black mb-6 dark:text-white uppercase tracking-widest">Mạng xã hội</h4>
                    <div className="flex gap-4">
                        <SocialButton icon={Facebook} color="bg-blue-600" />
                        <SocialButton icon={Instagram} color="bg-pink-600" />
                        <SocialButton icon={Twitter} color="bg-sky-500" />
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="lg:col-span-2">
                <Card className="rounded-[3rem] border-none shadow-3xl bg-white dark:bg-stone-900 overflow-hidden h-full">
                    <CardContent className="p-8 md:p-16">
                        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">Họ và tên</label>
                                    <Input 
                                        placeholder="Nguyễn Văn A" 
                                        className="h-16 px-6 rounded-2xl bg-gray-50 dark:bg-stone-800 border-none text-lg font-medium focus-visible:ring-2 focus-visible:ring-green-500"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">Email</label>
                                    <Input 
                                        type="email" 
                                        placeholder="email@example.com" 
                                        className="h-16 px-6 rounded-2xl bg-gray-50 dark:bg-stone-800 border-none text-lg font-medium focus-visible:ring-2 focus-visible:ring-green-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">Chủ đề</label>
                                <Input 
                                    placeholder="Tôi muốn hợp tác kinh doanh bãi đỗ..." 
                                    className="h-16 px-6 rounded-2xl bg-gray-50 dark:bg-stone-800 border-none text-lg font-medium focus-visible:ring-2 focus-visible:ring-green-500"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">Tin nhắn</label>
                                <Textarea 
                                    placeholder="Nội dung tin nhắn của bạn..." 
                                    className="min-h-48 p-6 rounded-2xl bg-gray-50 dark:bg-stone-800 border-none text-lg font-medium focus-visible:ring-2 focus-visible:ring-green-500"
                                />
                            </div>

                            <Button className="h-20 w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-green-600/20 active:scale-95 transition-all">
                                <Send className="mr-3 w-6 h-6" /> Gửi tin nhắn ngay
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-32 bg-gray-50 dark:bg-stone-900/30">
        <div className="container mx-auto px-4">
            <div className="text-center mb-20">
                <Badge className="bg-emerald-600 mb-4">FAQs</Badge>
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">Câu hỏi thường gặp</h2>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, idx) => (
                    <motion.div 
                        key={idx}
                        className="bg-white dark:bg-stone-900 rounded-3xl border border-gray-100 dark:border-stone-800 overflow-hidden"
                    >
                        <button 
                            className="w-full p-8 flex items-center justify-between text-left"
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        >
                            <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white pr-8">{faq.q}</span>
                            <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaq === idx && (
                            <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="h-px w-full bg-gray-100 dark:bg-stone-800 mb-6" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed text-lg">
                                    {faq.a}
                                </p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const ContactInfoCard = ({ icon: Icon, title, value, subValue }: { icon: any; title: string; value: string; subValue: string }) => (
    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-stone-900 border border-gray-100 dark:border-stone-800 shadow-xl shadow-gray-100/50 dark:shadow-none transition-transform hover:-translate-y-1 duration-300 group">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white">
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subValue}</p>
            </div>
        </div>
    </div>
);

const SocialButton = ({ icon: Icon, color }: { icon: any; color: string }) => (
    <Button className={`w-14 h-14 rounded-2xl ${color} text-white shadow-lg hover:brightness-110 active:scale-90 transition-all`}>
        <Icon className="w-6 h-6" />
    </Button>
);
