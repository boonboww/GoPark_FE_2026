"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Eye,
  RefreshCw,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  User,
  Hash,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WithdrawRequest = {
  id: string;
  amount: number;
  status: string;
  ref_id?: string;
  ref_type?: string;
  created_at: string;
  wallet?: {
    balance?: number;
    user?: {
      email?: string;
      profile?: {
        name?: string;
        phone?: string;
      };
    };
  };
};

type ParsedBankInfo = {
  bank: string;
  account: string;
  holder?: string;
};

function parseBankInfo(refId: string): ParsedBankInfo | null {
  if (!refId) return null;
  try {
    const parsed = JSON.parse(refId);
    if (parsed.bank && parsed.account) {
      return { bank: parsed.bank, account: parsed.account, holder: parsed.holder || "" };
    }
  } catch {
    if (refId.includes("-")) {
      const dashIdx = refId.indexOf("-");
      const bank = refId.substring(0, dashIdx).trim();
      const account = refId.substring(dashIdx + 1).trim().replace(/\s+/g, "");
      if (bank && account) return { bank, account };
    }
  }
  return null;
}

function formatVND(amount: number) {
  return Math.abs(amount).toLocaleString("vi-VN") + " ₫";
}

function formatDateVN(dateStr: string) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default function Refunds() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReq, setSelectedReq] = useState<WithdrawRequest | null>(null);
  const [qrError, setQrError] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient<any>("/wallets/withdraw-requests", { method: "GET" });
      const data = res?.data || res || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error("Lỗi khi tải danh sách: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!selectedReq) return;
    setIsProcessing(true);
    try {
      await apiClient(`/wallets/withdraw-requests/${selectedReq.id}/approve`, { method: "POST" });
      toast.success("✅ Xác nhận thành công! Tiền đã được trừ khỏi ví người dùng.");
      setSelectedReq(null);
      fetchRequests();
    } catch (e: any) {
      toast.error("Lỗi: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!window.confirm("Từ chối yêu cầu này? Lệnh rút sẽ bị hủy và ví người dùng không bị trừ tiền.")) return;
    setIsProcessing(true);
    try {
      await apiClient(`/wallets/withdraw-requests/${selectedReq.id}/reject`, { method: "POST" });
      toast.success("Đã từ chối lệnh rút tiền.");
      setSelectedReq(null);
      fetchRequests();
    } catch (e: any) {
      toast.error("Lỗi: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Đã sao chép ${label}`));
  };

  const getUserName = (wallet: any) =>
    wallet?.user?.profile?.name || wallet?.user?.email || "N/A";

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const bankInfo = selectedReq?.ref_id ? parseBankInfo(selectedReq.ref_id) : null;
  const qrUrl = bankInfo
    ? `https://img.vietqr.io/image/${bankInfo.bank}-${bankInfo.account}-compact2.jpg?amount=${Math.abs(selectedReq?.amount ?? 0)}&addInfo=${encodeURIComponent(selectedReq?.id ?? "")}&accountName=${encodeURIComponent(bankInfo.holder ?? "")}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 rounded-2xl px-8 py-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Banknote className="w-6 h-6" />
            Phê Duyệt Rút Tiền
          </h1>
          <p className="text-emerald-200/70 mt-1 text-sm">
            {pendingCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse inline-block" />
                {pendingCount} yêu cầu đang chờ xử lý
              </span>
            ) : (
              "Không có yêu cầu nào đang chờ"
            )}
          </p>
        </div>
        <Button
          onClick={fetchRequests}
          disabled={isLoading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-none gap-2 mt-4 sm:mt-0"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-orange-700">Chờ xử lý</p>
              <p className="text-3xl font-bold text-gray-900">{requests.filter(r => r.status === "PENDING").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-700">Đã duyệt hôm nay</p>
              <p className="text-3xl font-bold text-gray-900">
                {requests.filter(r => r.status === "SUCCESS" && new Date(r.created_at).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700">Tổng cần chuyển</p>
              <p className="text-xl font-bold text-gray-900">
                {formatVND(requests.filter(r => r.status === "PENDING").reduce((s, r) => s + Math.abs(r.amount), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Danh sách yêu cầu rút tiền</CardTitle>
          <CardDescription>
            Chỉ hiển thị các giao dịch đang chờ admin phê duyệt. Nhấn "Chi Tiết" để xem QR chuyển khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
              <p className="font-medium">Không có yêu cầu nào cần xử lý</p>
              <p className="text-sm text-gray-400 mt-1">Tất cả đã được giải quyết</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="pl-6">Mã Giao Dịch</TableHead>
                    <TableHead>Người Yêu Cầu</TableHead>
                    <TableHead>Ngân Hàng / STK</TableHead>
                    <TableHead>Ngày Đặt Lệnh</TableHead>
                    <TableHead className="text-right">Số Tiền</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-center pr-6">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const info = req.ref_id ? parseBankInfo(req.ref_id) : null;
                    return (
                      <TableRow key={req.id} className="hover:bg-emerald-50/30 transition-colors">
                        <TableCell className="pl-6">
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {req.id.substring(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{getUserName(req.wallet)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {info ? (
                            <div className="text-sm">
                              <p className="font-bold text-emerald-700">{info.bank}</p>
                              <p className="font-mono text-gray-600">{info.account}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">{req.ref_id || "Không có thông tin"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{formatDateVN(req.created_at)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-600 text-sm">{formatVND(req.amount)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              req.status === "PENDING"
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : req.status === "SUCCESS"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {req.status === "PENDING" ? "Chờ duyệt" : req.status === "SUCCESS" ? "Đã duyệt" : "Từ chối"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 gap-1.5"
                            onClick={() => { setSelectedReq(req); setQrError(false); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Chi Tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Chi tiết yêu cầu rút tiền
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-orange-600 font-medium">
              <AlertTriangle className="w-4 h-4" />
              Chỉ xác nhận sau khi bạn đã chuyển khoản thực tế cho người dùng.
            </DialogDescription>
          </DialogHeader>

          {selectedReq && (() => {
            const info = selectedReq.ref_id ? parseBankInfo(selectedReq.ref_id) : null;
            return (
              <div className="space-y-4 mt-2">
                {/* Transaction info */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Hash size={16} className="text-blue-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Mã giao dịch (nội dung chuyển khoản)</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-bold text-gray-900 break-all">{selectedReq.id}</p>
                        <button
                          onClick={() => copyToClipboard(selectedReq.id, "mã giao dịch")}
                          className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                          title="Sao chép"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <Banknote size={16} className="text-emerald-600" />
                      <div>
                        <p className="text-xs text-gray-400">Số tiền cần chuyển</p>
                        <p className="font-bold text-emerald-600 text-lg">{formatVND(selectedReq.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-400">Thời gian yêu cầu</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateVN(selectedReq.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <Banknote size={16} className="text-blue-500" />
                    <div className="flex-1 flex justify-between items-center">
                      <p className="text-sm font-semibold text-blue-800">Số dư hiện tại trong ví người dùng:</p>
                      <p className="font-black text-blue-700 text-base">
                        {selectedReq.wallet?.balance !== undefined
                          ? formatVND(Number(selectedReq.wallet.balance))
                          : "Không xác định"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User size={16} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-400">Người yêu cầu</p>
                      <p className="text-sm font-semibold text-gray-900">{getUserName(selectedReq.wallet)}</p>
                      {selectedReq.wallet?.user?.email && (
                        <p className="text-xs text-gray-500">{selectedReq.wallet.user.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Info + QR */}
                {info ? (
                  <div className="border border-emerald-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2 border-b border-emerald-200">
                      <CreditCard size={16} className="text-emerald-700" />
                      <h4 className="text-sm font-semibold text-emerald-800">Thông tin nhận tiền</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Ngân hàng</p>
                          <p className="font-bold text-emerald-700 text-lg">{info.bank}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Số tài khoản</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-gray-900">{info.account}</p>
                            <button onClick={() => copyToClipboard(info.account, "số tài khoản")} className="text-gray-400 hover:text-blue-600">
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {info.holder && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Chủ tài khoản</p>
                          <p className="font-bold uppercase text-gray-900">{info.holder}</p>
                        </div>
                      )}

                      {/* QR Code */}
                      {qrUrl && (
                        <div className="flex flex-col items-center gap-3 pt-3 border-t border-dashed border-emerald-200">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <QrCode size={16} className="text-emerald-600" />
                            Quét QR để tự động điền thông tin chuyển khoản
                          </div>
                          <div className="bg-white p-3 rounded-xl shadow-sm border-2 border-emerald-200">
                            {!qrError ? (
                              <img
                                src={qrUrl}
                                alt="Mã QR chuyển khoản"
                                className="w-56 h-56 object-contain"
                                onError={() => setQrError(true)}
                              />
                            ) : (
                              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50 rounded-lg">
                                <QrCode size={40} className="text-gray-300" />
                                <p className="text-xs text-center">Không tải được QR.<br />Kiểm tra mã ngân hàng.</p>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg p-3 w-full">
                            <p className="font-medium text-gray-700 mb-1">Nội dung chuyển khoản:</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded break-all text-center">
                                {selectedReq.id}
                              </span>
                              <button onClick={() => copyToClipboard(selectedReq.id, "nội dung chuyển khoản")} className="text-gray-400 hover:text-blue-600 flex-shrink-0">
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    <p className="font-semibold mb-1">Thông tin nhận tiền:</p>
                    <p className="font-mono break-words">{selectedReq.ref_id || "Người dùng chưa cung cấp thông tin"}</p>
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Sau khi nhấn <strong>"Xác nhận đã thanh toán"</strong>, hệ thống sẽ tự động trừ tiền khỏi ví người dùng. Hành động này không thể hoàn tác.</p>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-between w-full mt-4 pt-4 border-t">
            <Button variant="destructive" disabled={isProcessing} onClick={handleReject} className="gap-2">
              <XCircle size={16} />
              Từ chối yêu cầu
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" disabled={isProcessing} onClick={() => setSelectedReq(null)}>
                Đóng
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                disabled={isProcessing}
                onClick={handleApprove}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
                Xác nhận đã thanh toán
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
