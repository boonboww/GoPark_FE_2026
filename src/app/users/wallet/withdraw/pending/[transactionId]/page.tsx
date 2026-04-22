'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function WithdrawPendingPage() {
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

    // Fallback for formats like "YYYY-MM-DD HH:mm:ss".
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

    // Fix lỗi múi giờ (VD: server trả về UTC nhưng hiểu nhầm là Local khiến thời gian lùi 7 tiếng)
    // Nếu tạo lệch quá thời gian chờ, thiết lập mốc đếm ngược từ lúc user mở trang này
    const storageKey = `tx_wait_${tx.id}`;
    const savedTime = localStorage.getItem(storageKey);

    if (savedTime) {
      createdMs = parseInt(savedTime, 10);
    } else {
      // Nếu createdMs bị quá khứ xa hơn thời gian chờ (hoặc là thời gian tương lai bị sai)
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl min-h-screen pt-20 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải trạng thái giao dịch...
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="container mx-auto p-4 max-w-2xl min-h-screen pt-20">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Không tìm thấy giao dịch</CardTitle>
            <CardDescription>{pollingError || 'Mã giao dịch không hợp lệ hoặc đã bị xóa.'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.replace('/users/wallet/withdraw')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại rút tiền
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl min-h-screen pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-800">Theo dõi yêu cầu rút tiền</h1>
        <Button variant="outline" onClick={() => router.replace('/users/profile')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Về hồ sơ
        </Button>
      </div>

      <Card className="border-emerald-200 shadow-lg">
        <CardHeader>
          <CardTitle>Thông tin giao dịch</CardTitle>
          <CardDescription>
            Theo dõi trạng thái xử lý bởi admin. Tiền chỉ bị trừ khỏi ví khi admin xác nhận thành công.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border p-4 bg-slate-50">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Mã giao dịch</span>
              <span className="font-mono text-xs sm:text-sm font-semibold">{tx.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Số tài khoản nhận</span>
              <span className="font-semibold text-emerald-700">{tx.ref_id || 'Không có thông tin'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Số tiền cần rút</span>
              <span className="font-bold text-emerald-700">{amountText} VNĐ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Thời gian gửi giao dịch</span>
              <span className="font-medium text-sm">{formatDateTime(tx.created_at || tx.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Trạng thái hiện tại</span>
              <span className="font-semibold">{tx.status}</span>
            </div>
          </div>

          {tx.status === 'PENDING' && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
                <Clock className="h-5 w-5" />
                Đang chờ admin xác nhận
              </div>
              <div className="text-3xl font-mono font-bold text-orange-600">{formatTime(countdown)}</div>
              <p className="text-sm text-orange-700 mt-2">
                Hệ thống đang chờ admin xử lý chuyển khoản thủ công dựa trên mã giao dịch này.
              </p>
            </div>
          )}

          {tx.status === 'SUCCESS' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Giao dịch đã được admin xác nhận thành công
              </div>
              <p className="text-sm mt-2">Số tiền đã được trừ khỏi ví của bạn.</p>
            </div>
          )}

          {(tx.status === 'FAILED' || tx.status === 'CANCELLED') && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="flex items-center gap-2 font-semibold">
                <XCircle className="h-5 w-5" />
                Giao dịch không được xác nhận
              </div>
              <p className="text-sm mt-2">Đơn rút tiền đã bị từ chối/hủy, ví của bạn không bị trừ tiền.</p>
            </div>
          )}

          {isPending && isExpired && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                <ShieldAlert className="h-5 w-5" />
                Quá thời gian chờ xử lý
              </div>
              <p className="text-sm text-amber-700 mt-2">
                Bạn có thể gửi khiếu nại tới admin để được ưu tiên kiểm tra giao dịch này.
              </p>
              <Button
                className="mt-3 bg-amber-600 hover:bg-amber-700"
                onClick={handleComplaint}
                disabled={isComplaining || complaintSent}
              >
                {isComplaining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi khiếu nại...
                  </>
                ) : complaintSent ? (
                  'Đã gửi khiếu nại'
                ) : (
                  'Khiếu nại đến admin'
                )}
              </Button>
            </div>
          )}

          {pollingError && <p className="text-sm text-red-600">{pollingError}</p>}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={fetchTransaction}>
            Kiểm tra lại trạng thái
          </Button>
          <Button onClick={() => router.replace('/users/wallet')} className="bg-emerald-600 hover:bg-emerald-700">
            Về ví của tôi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
