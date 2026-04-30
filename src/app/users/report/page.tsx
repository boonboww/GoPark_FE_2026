"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Send, 
  MessageSquare, 
  AlertTriangle, 
  HelpCircle, 
  FileText, 
  CheckCircle2,
  ParkingCircle,
  Clock,
  Car,
  Image as ImageIcon,
  ChevronRight,
  ArrowLeft,
  X,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiClient } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";

const REPORT_TYPES = [
  { 
    id: "BOOKING_ISSUE", 
    label: "Sự cố đặt chỗ", 
    description: "Lỗi thanh toán, không tìm thấy slot, hoặc sai thông tin vé.",
    icon: FileText,
    color: "bg-blue-100 text-blue-600"
  },
  { 
    id: "COMPLAINT", 
    label: "Khiếu nại bãi đỗ", 
    description: "Nhân viên thái độ không tốt, bãi đỗ không giống mô tả, phí sai.",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600"
  },
  { 
    id: "SYSTEM_BUG", 
    label: "Lỗi hệ thống", 
    description: "Lỗi ứng dụng, không đăng nhập được, hoặc hiển thị sai GPS.",
    icon: MessageSquare,
    color: "bg-amber-100 text-amber-600"
  },
  { 
    id: "OTHER", 
    label: "Vấn đề khác", 
    description: "Góp ý cải tiến hoặc các hỗ trợ ngoài danh mục trên.",
    icon: HelpCircle,
    color: "bg-slate-100 text-slate-600"
  }
];

export default function ReportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parkingLotId, setParkingLotId] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  
  // Options Data
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  useEffect(() => {
    // Fetch bãi đỗ xe để report
    const fetchLots = async () => {
      try {
        const res = await apiClient<any>("/parking-lots/all");
        // Giả sử API có thể trả về { data: [...] } hoặc chỉ là [...]
        const lots = Array.isArray(res) ? res : (res?.data || []);
        setParkingLots(lots);
      } catch (err) {
        console.error("Lỗi lấy danh sách bãi đỗ:", err);
        setParkingLots([]);
      }
    };

    // Fetch booking của user
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        const res = await apiClient<any>(`/booking/user/${user.id}`);
        const bookings = Array.isArray(res) ? res : (res?.data || []);
        setMyBookings(bookings);
      } catch (err) {
        console.error("Lỗi lấy danh sách booking:", err);
        setMyBookings([]);
      }
    };

    fetchLots();
    fetchBookings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !title || !description) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: selectedType,
        description: `${title}: ${description}`,
        requesterId: user?.id,
        payload: {
          title,
          description,
          parkingLotId: parkingLotId ? Number(parkingLotId) : undefined,
          bookingId: bookingId ? Number(bookingId) : undefined,
        },
      };

      await apiClient("/request", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success("Báo cáo của bạn đã được gửi đi thành công!");
      setStep(3); // Chuyển sang trang hoàn tất
    } catch (error: any) {
      toast.error(error?.message || "Đã xảy ra lỗi khi gửi báo cáo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    setStep(2);
    // Reset form fields
    setTitle("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-950 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mb-4"
          >
            <ShieldAlert size={32} />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Trung tâm Hỗ trợ & Khiếu nại</h1>
          <p className="text-slate-500 dark:text-gray-400">Chúng tôi luôn sẵn sàng lắng nghe và giải quyết các vấn đề của bạn.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4"
            >
              <h2 className="text-lg font-semibold mb-2 px-1">Chọn loại báo cáo của bạn</h2>
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className="group flex items-center p-4 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-md transition-all text-left"
                >
                  <div className={`p-3 rounded-xl mr-4 ${type.color}`}>
                    <type.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {type.label}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{type.description}</p>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-red-400 transform group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </motion.div>
          )}

          {step === 2 && selectedType && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-slate-200 dark:border-stone-800 overflow-hidden rounded-2xl shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-stone-900/50 border-b border-slate-100 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 transition-colors text-sm font-medium"
                    >
                      <ArrowLeft size={16} /> Quay lại
                    </button>
                    <Badge variant="outline" className="bg-white dark:bg-stone-800 border-red-200 text-red-600">
                      {REPORT_TYPES.find(t => t.id === selectedType)?.label}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">Chi tiết báo cáo</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">Tiêu đề báo cáo <span className="text-red-500">*</span></Label>
                      <Input
                        id="title"
                        placeholder="VD: Không thể quét được mã QR tại cổng vào"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-xl border-slate-200 dark:border-stone-700"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Liên quan đến bãi đỗ</Label>
                        <Select onValueChange={setParkingLotId} value={parkingLotId}>
                          <SelectTrigger className="rounded-xl border-slate-200 dark:border-stone-700">
                            <SelectValue placeholder="Chọn bãi đỗ (nếu có)" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(parkingLots) && parkingLots.length > 0 ? (
                              parkingLots.map((lot) => (
                                <SelectItem key={lot.id} value={lot.id.toString()}>
                                  {lot.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-gray-500 text-center">Không có bãi đỗ nào</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Mã đơn hàng liên quan</Label>
                        <Select onValueChange={setBookingId} value={bookingId}>
                          <SelectTrigger className="rounded-xl border-slate-200 dark:border-stone-700">
                            <SelectValue placeholder="Chọn mã đơn (nếu có)" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(myBookings) && myBookings.length > 0 ? (
                              myBookings.map((b) => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                  #{b.id} - {b.vehicle?.plate_number}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-gray-500 text-center">Không có đơn hàng nào</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desc" className="text-slate-700 dark:text-slate-300">Nội dung chi tiết <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="desc"
                        placeholder="Mô tả cụ thể sự cố bạn gặp phải để chúng tôi hỗ trợ tốt nhất..."
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl border-slate-200 dark:border-stone-700 resize-none"
                        required
                      />
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                      <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Thông tin của bạn sẽ được gửi đến bộ phận hỗ trợ khách hàng. Chúng tôi cam kết phản hồi trong vòng 24h làm việc.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} /> Đang gửi báo cáo...
                        </>
                      ) : (
                        <>
                          <Send size={18} /> Gửi báo cáo ngay
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-white dark:bg-stone-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-stone-800"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đã nhận được báo cáo!</h2>
              <p className="text-slate-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                Cảm ơn bạn đã thông tin. Mã số báo cáo của bạn đang được xử lý. Bạn có thể theo dõi trạng thái hỗ trợ trong mục "Yêu cầu của tôi".
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => router.push("/users/requests")}
                  className="rounded-xl"
                  variant="outline"
                >
                  Xem yêu cầu của tôi
                </Button>
                <Button 
                  onClick={() => router.push("/")}
                  className="rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900"
                >
                  Quay lại trang chủ
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
