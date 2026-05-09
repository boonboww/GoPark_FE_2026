"use client";

import React, { useEffect, useState } from "react";
import { 
  Building2, 
  MapPin, 
  Wallet, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Info,
  Calendar,
  MessageCircle,
  Hash,
  User,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { apiClient, patch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface RequestItem {
  id: string;
  type: string;
  status: string;
  description?: string;
  payload: any;
  createdAt: string;
  updatedAt: string;
  note?: Array<{
    action: string;
    approvedBy: string;
    timestamp: string;
    reason?: string;
  }>;
}
// Các loại yêu cầu có thể có
export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
// Hàm lấy danh sách yêu cầu của người dùng hiện tại
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient<{ data: RequestItem[] }>("/request/me");
      setRequests(response.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu cầu:", error);
    } finally {
      setLoading(false);
    }
  };
// gọi hàm lấy yêu cầu khi component được mount
  useEffect(() => {
    fetchRequests();
  }, []);
// Hàm hiển thị badge trạng thái với màu sắc và icon tương ứng
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã xử lý</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none flex items-center gap-1"><XCircle className="w-3 h-3" /> Đã từ chối</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none flex items-center gap-1"><RefreshCcw className="w-3 h-3 animate-spin-slow" /> Đang xử lý</Badge>;
      case "PENDING":
      case "OPEN":
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none flex items-center gap-1"><Clock className="w-3 h-3" /> Đang chờ duyệt</Badge>;
    }
  };
// Hàm hiển thị icon tương ứng với loại yêu cầu
  const getRequestIcon = (type: string) => {
    switch (type) {
      case "BECOME_OWNER":
        return <Building2 className="w-5 h-5 text-blue-500" />;
      case "WITHDRAW_FUND":
        return <Wallet className="w-5 h-5 text-green-500" />;
      case "REFUND":
      case "PAYMENT":
        return <RefreshCcw className="w-5 h-5 text-purple-500" />;
      case "BOOKING_ISSUE":
      case "COMPLAINT":
      case "SYSTEM_BUG":
      case "OTHER":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <ClipboardList className="w-5 h-5 text-gray-500" />;
    }
  };
// Hàm hiển thị tên loại yêu cầu dựa trên trường type
  const getRequestTypeName = (type: string) => {
    switch (type) {
      case "BECOME_OWNER": return "Đăng ký Chủ bãi đỗ";
      case "WITHDRAW_FUND": return "Yêu cầu rút tiền";
      case "REFUND": return "Yêu cầu hoàn tiền";
      case "PAYMENT": return "Thanh toán";
      case "NEW_PARKING_LOT": return "Thêm bãi đỗ mới";
      case "UPDATE_PARKING_LOT": return "Cập nhật bãi đỗ";
      case "BOOKING_ISSUE": return "Báo cáo sự cố đặt chỗ";
      case "COMPLAINT": return "Khiếu nại bãi đỗ";
      case "SYSTEM_BUG": return "Báo cáo lỗi hệ thống";
      case "OTHER": return "Báo cáo khác";
      default: return type;
    }
  };
// Hàm hiển thị tóm tắt thông tin trong payload của yêu cầu, tùy theo loại yêu cầu sẽ có cách hiển thị khác nhau
  const renderPayloadSummary = (type: string, payload: any) => {
    if (!payload) return null;

    if (type === "BECOME_OWNER" || type === "NEW_PARKING_LOT") {
      return (
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <p><span className="font-medium text-gray-700">Tên bãi:</span> {payload.parkingLotName}</p>
          <p className="flex items-start gap-1">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" /> 
            <span className="line-clamp-1">{payload.address}</span>
          </p>
        </div>
      );
    }
   // Với yêu cầu rút tiền, hiển thị số tiền và ngân hàng liên quan đến yêu cầu rút tiền đó 
    if (type === "WITHDRAW_FUND") {
      return (
        <div className="mt-3 text-sm text-gray-600">
          <p><span className="font-medium text-gray-700">Số tiền:</span> {payload.amount?.toLocaleString('vi-VN')} VNĐ</p>
          <p><span className="font-medium text-gray-700">Ngân hàng:</span> {payload.bankName}</p>
        </div>
      );
    }

    return null;
  };

  const RequestDetailDialog = ({ request }: { request: RequestItem }) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            Chi tiết <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gray-100 p-2 rounded-lg">
                {getRequestIcon(request.type)}
              </div>
              <div>
                <DialogTitle className="text-xl">{getRequestTypeName(request.type)}</DialogTitle>
                <DialogDescription>
                  Mã yêu cầu: #{request.id.slice(0, 8)}...
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Status and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Trạng thái hiện tại
                </p>
                <div>{getStatusBadge(request.status)}</div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Thời gian gửi
                </p>
                <p className="text-sm font-medium">
                  {format(new Date(request.createdAt), 'HH:mm:ss - dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-500" /> Nội dung chi tiết
              </h4>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700">
                {request.description || "Không có mô tả chi tiết."}
              </div>
            </div>

            {/* Payload Details */}
            {request.payload && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-green-500" /> Thông tin liên quan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.payload.title && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Tiêu đề gốc</p>
                      <p className="text-sm font-medium">{request.payload.title}</p>
                    </div>
                  )}
                  {request.payload.parkingLotId && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">ID Bãi đỗ</p>
                      <p className="text-sm font-medium">#{request.payload.parkingLotId}</p>
                    </div>
                  )}
                  {request.payload.bookingId && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Mã đơn hàng</p>
                      <p className="text-sm font-medium">#{request.payload.bookingId}</p>
                    </div>
                  )}
                  {request.payload.bankName && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Ngân hàng</p>
                      <p className="text-sm font-medium">{request.payload.bankName}</p>
                    </div>
                  )}
                  {request.payload.accountNumber && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Số tài khoản</p>
                      <p className="text-sm font-medium">{request.payload.accountNumber}</p>
                    </div>
                  )}
                  {request.payload.amount && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Số tiền</p>
                      <p className="text-sm font-bold text-green-600">
                        {request.payload.amount.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Response/Notes */}
            {request.note && request.note.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" /> Phản hồi từ hệ thống
                </h4>
                <div className="space-y-3">
                  {request.note.map((n, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${
                      n.action === 'APPROVED' ? 'bg-green-50 border-green-100' : 
                      n.action === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className={
                           n.action === 'APPROVED' ? 'text-green-700 border-green-200 bg-white' : 
                           n.action === 'REJECTED' ? 'text-red-700 border-red-200 bg-white' : 'text-slate-700 border-slate-200 bg-white'
                        }>
                          {n.action === 'APPROVED' ? 'Chấp nhận' : n.action === 'REJECTED' ? 'Từ chối' : 'Cập nhật'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {format(new Date(n.timestamp), 'HH:mm dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 italic">"{n.reason || "Không có lý do cụ thể."}"</p>
                      <p className="text-[10px] text-slate-400 mt-2">Người xử lý: {n.approvedBy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-4xl min-h-[calc(100vh-200px)]">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử Yêu cầu</h1>
          <p className="text-muted-foreground mt-1">Quản lý và theo dõi trạng thái các yêu cầu của bạn trên hệ thống</p>
        </div>
        <Button variant={"outline"} onClick={fetchRequests}>Làm mới</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex gap-4 items-start">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-40 h-5" />
                    <Skeleton className="w-full max-w-md h-4" />
                    <Skeleton className="w-24 h-4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <ClipboardList className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">Không có yêu cầu nào</h3>
              <p className="mt-1">Bạn chưa gửi yêu cầu nào tới hệ thống.</p>
            </div>
          ) : (
            <div className="divide-y cursor-default">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors flex items-start flex-col sm:flex-row gap-4">
                  <div className="bg-gray-100 p-3 rounded-full flex-shrink-0">
                    {getRequestIcon(request.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getRequestTypeName(request.type)}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <RequestDetailDialog request={request} />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      Gửi lúc: {format(new Date(request.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </p>

                    {renderPayloadSummary(request.type, request.payload)}

                    {request.type === "BECOME_OWNER" && request.status === "APPROVED" && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                        <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                          Yêu cầu trở thành chủ bãi đỗ của bạn đã được phê duyệt! Hãy xác nhận và đăng nhập lại để bắt đầu quản lý bãi đỗ của mình.
                        </p>
                        <Button 
                          onClick={async () => {
                            try {
                              // Gọi API xác nhận để Backend chuyển role sang Owner
                               await patch(`/request/${request.id}/confirm`);
                              
                              // Sau đó mới đăng xuất và chuyển trang login
                              localStorage.removeItem("auth-storage");
                              window.location.href = "/auth/login";
                            } catch (error) {
                              console.error("Lỗi xác nhận yêu cầu:", error);
                              alert("Có lỗi xảy ra khi xác nhận. Vui lòng thử lại sau.");
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-full px-6 transition-all"
                        >
                          Xác nhận & Đăng nhập Chủ bãi
                        </Button>
                      </div>
                    )}

                    {request.status === "REJECTED" && request.note && request.note.length > 0 && (
                      <div className="mt-3 bg-red-50 border border-red-100 text-red-700 p-3 rounded-md text-sm">
                        <span className="font-medium text-red-800 flex items-center gap-1 mb-1">
                          <XCircle className="w-4 h-4" /> Lý do từ chối:
                        </span>
                        {request.note[request.note.length - 1].reason || "Không rõ lý do, vui lòng liên hệ admin."}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      <Footer />
    </>
  );
}