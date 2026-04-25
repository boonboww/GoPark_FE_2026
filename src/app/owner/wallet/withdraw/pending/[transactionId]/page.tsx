'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Loader2, Clock, CheckCircle2, XCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

type TxStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | string;

type WalletTransaction = {
  id: string;
  amount: number;
  status: TxStatus;
  created_at?: string;
  createdAt?: string;
  ref_id?: string;
};

const WAITING_SECONDS = 480;

type ParsedBankInfo = {
  bank?: string;
  account?: string;
  holder?: string;
};

export default function OwnerWithdrawPendingPage() {
  const router = useRouter();
  const params = useParams<{ transactionId: string }>();
  const transactionId = params?.transactionId;
  const user = useAuthStore((state) => state.user);

  const [tx, setTx] = useState<WalletTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingError, setPollingError] = useState('');
  const [isComplaining, setIsComplaining] = useState(false);
  const [complaintSent, setComplaintSent] = useState(false);
  const [countdown, setCountdown] = useState(WAITING_SECONDS);

  const isPending = tx?.status === 'PENDING';
  const isExpired = countdown <= 0;

  const amountText = useMemo(() => {
    if (!tx) return '0';
    return Math.abs(Number(tx.amount || 0)).toLocaleString('vi-VN');
  }, [tx]);

  const bankInfoString = useMemo(() => {
    if (!tx || !tx.ref_id) return 'Không có thông tin';
    try {
      const parsed: ParsedBankInfo = JSON.parse(tx.ref_id);
      if (parsed.bank && parsed.account) {
        return `${parsed.bank} - ${parsed.account} ${parsed.holder ? `(${parsed.holder})` : ''}`;
      }
    } catch {
      // Ignore if not valid JSON
    }
    return tx.ref_id;
  }, [tx]);

  const formatDateTime = (value?: string) => {
    if (!value) return '--';
    let ms = new Date(value).getTime();
    
    // Fix backend timezone shift (+7 or -7 hours)
    if (ms > Date.now() + 5 * 3600 * 1000) {
      ms -= 7 * 3600 * 1000;
    } else if (Date.now() - ms > 6 * 3600 * 1000 && Date.now() - ms < 8 * 3600 * 1000) {
      ms += 7 * 3600 * 1000;
    }

    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) + ' (Giờ VN)';
  };

  const parseTransactionCreatedMs = (transaction: WalletTransaction): number => {
    const raw = transaction.created_at || transaction.createdAt;
    if (!raw) return Date.now();

    const direct = new Date(raw).getTime();
    if (!Number.isNaN(direct)) return direct;

    const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
    const fallback = new Date(normalized).getTime();
    if (!Number.isNaN(fallback)) return fallback;

    return Date.now();
  };

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchTransaction = async () => {
    if (!transactionId) return;

    try {
      const res = await apiClient<any>(`/wallets/transaction/${transactionId}`, {
        method: 'GET',
      });
      const raw = (res?.data || res) as WalletTransaction;
      setTx(raw);
      setPollingError('');
    } catch (error: any) {
      setPollingError(error?.message || 'Không thể tải trạng thái giao dịch');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  useEffect(() => {
    if (!tx || tx.status !== 'PENDING') return;

    let createdMs = parseTransactionCreatedMs(tx);

    const storageKey = `tx_wait_${tx.id}`;
    const savedTime = localStorage.getItem(storageKey);

    if (savedTime) {
      createdMs = parseInt(savedTime, 10);
    } else {
      if (Date.now() - createdMs > WAITING_SECONDS * 1000 || createdMs > Date.now() + 60000) {
        createdMs = Date.now();
      }
      localStorage.setItem(storageKey, createdMs.toString());
    }

    const deadline = createdMs + WAITING_SECONDS * 1000;

    const updateCountdown = () => {
      const next = Math.floor((deadline - Date.now()) / 1000);
      setCountdown(next > 0 ? next : 0);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [tx]);

  useEffect(() => {
    if (!transactionId || !isPending) return;

    const interval = setInterval(() => {
      fetchTransaction();
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId, isPending]);

  const handleComplaint = async () => {
    if (!transactionId || !user?.id) {
      toast.error('Không thể gửi khiếu nại do thiếu thông tin người dùng/giao dịch');
      return;
    }

    setIsComplaining(true);
    try {
      await apiClient(`/wallets/withdraw-requests/${transactionId}/complaint`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          message: `Khiếu nại giao dịch rút tiền ${transactionId} quá thời gian chờ xử lý`,
        }),
      });
      setComplaintSent(true);
      toast.success('Đã gửi khiếu nại tới admin. Vui lòng chờ phản hồi.');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể gửi khiếu nại tới admin');
    } finally {
      setIsComplaining(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-20">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải trạng thái giao dịch...
          </div>
        </div>
      );
    }

    if (!tx) {
      return (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Không tìm thấy giao dịch</CardTitle>
            <CardDescription>{pollingError || 'Mã giao dịch không hợp lệ hoặc đã bị xóa.'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.replace('/owner/wallet')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại ví
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card className="border-emerald-200 shadow-lg bg-card">
        <CardHeader>
          <CardTitle>Thông tin giao dịch</CardTitle>
          <CardDescription>
            Theo dõi trạng thái xử lý bởi admin. Tiền chỉ cập nhật khi admin xác nhận thành công.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border p-4 bg-slate-50">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Mã giao dịch</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">{tx.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Số tài khoản nhận</span>
              <span className="font-semibold text-emerald-700">{bankInfoString}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Số tiền cần rút</span>
              <span className="font-bold text-emerald-700 text-base">{amountText} VNĐ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Thời gian gửi</span>
              <span className="font-medium text-sm text-slate-900">{formatDateTime(tx.created_at || tx.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Trạng thái</span>
              <span className="font-bold text-slate-900">{tx.status}</span>
            </div>
          </div>

          {tx.status === 'PENDING' && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
                <Clock className="h-5 w-5" />
                Đang chờ admin xác nhận
              </div>
              <div className="text-3xl font-mono font-black text-orange-600">{formatTime(countdown)}</div>
              <p className="text-sm text-orange-700 mt-2 font-medium">
                Hệ thống đang chờ admin xử lý ưu tiên lệnh rút này.
              </p>
            </div>
          )}

          {tx.status === 'SUCCESS' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="h-5 w-5" />
                Đã thanh toán thành công
              </div>
              <p className="text-sm font-medium">Bạn có thể kiểm tra biến động số dư trong tài khoản ngân hàng của mình.</p>
            </div>
          )}

          {(tx.status === 'FAILED' || tx.status === 'CANCELLED') && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="flex items-center gap-2 font-bold mb-1">
                <XCircle className="h-5 w-5" />
                Yêu cầu bị từ chối
              </div>
              <p className="text-sm font-medium">Lệnh rút tiền đã bị huỷ. Số dư của bạn sẽ được bảo lưu.</p>
            </div>
          )}

          {isPending && isExpired && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mt-4">
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <ShieldAlert className="h-5 w-5" />
                Quá thời gian xử lý ưu tiên
              </div>
              <p className="text-sm text-amber-700 mt-2 font-medium">
                Bạn có thể gửi yêu cầu đốc thúc admin kiểm tra giao dịch này.
              </p>
              <Button
                className="mt-4 bg-amber-600 hover:bg-amber-700 font-bold"
                onClick={handleComplaint}
                disabled={isComplaining || complaintSent}
              >
                {isComplaining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi khiếu nại...
                  </>
                ) : complaintSent ? (
                  'Đã gửi đốc thúc thành công'
                ) : (
                  'Yêu cầu hỗ trợ giao dịch'
                )}
              </Button>
            </div>
          )}

          {pollingError && <p className="text-sm font-semibold text-red-600">{pollingError}</p>}
        </CardContent>

        <CardFooter className="flex gap-3 bg-slate-50/50 pt-6 rounded-b-xl border-t border-slate-100">
          <Button variant="outline" className="font-bold" onClick={fetchTransaction}>
            Cập nhật trạng thái
          </Button>
          <Button onClick={() => router.replace('/owner/wallet')} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
            Trở lại Quản lý Ví
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        
        <div className="max-w-3xl mx-auto p-6 space-y-6 w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-emerald-800 flex items-center gap-3">
                <Clock className="h-6 w-6" />
                Tiến trình Rút doanh thu
              </h1>
              <p className="text-sm text-muted-foreground w-full">
                Hệ thống đang điều chuyển tiền về ngân hàng của bạn.
              </p>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => router.replace('/owner/wallet')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Chi tiết Ví
            </Button>
          </div>

          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
