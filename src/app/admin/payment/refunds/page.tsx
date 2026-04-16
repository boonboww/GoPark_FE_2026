'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Refunds() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient<any>('/wallets/withdraw-requests', {
        method: 'GET',
      });
      setRequests(res?.data || res || []);
    } catch (e: any) {
      toast.error('Lỗi khi tải danh sách: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async () => {
    if (!selectedReq) return;
    setIsProcessing(true);
    try {
      await apiClient(`/wallets/withdraw-requests/${selectedReq.id}/approve`, {
        method: 'POST',
      });
      toast.success('Xác nhận thành công!');
      setSelectedReq(null);
      fetchRequests();
    } catch (e: any) {
      toast.error('Lỗi: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!window.confirm('Hủy bỏ yêu cầu này? Tiền sẽ được hoàn lại ví người dùng.')) return;
    setIsProcessing(true);
    try {
      await apiClient(`/wallets/withdraw-requests/${selectedReq.id}/reject`, {
        method: 'POST',
      });
      toast.success('Đã từ chối lệnh và hoàn lại tiền!');
      setSelectedReq(null);
      fetchRequests();
    } catch (e: any) {
      toast.error('Lỗi: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getUserName = (wallet: any) => {
    return wallet?.user?.profile?.name || wallet?.user?.email || 'N/A';
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hoàn tiền / Rút tiền</h1>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chờ xử lý</CardTitle>
          <CardDescription>
            Giao dịch người dùng yêu cầu rút số dư khả dụng khỏi hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (!requests || requests.length === 0) ? (
            <div className="text-center py-10 text-gray-500">
              Không có yêu cầu nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Giao Dịch</TableHead>
                    <TableHead>Người Yêu Cầu</TableHead>
                    <TableHead>Ngày Đặt Lệnh</TableHead>
                    <TableHead className="text-right">Số Tiền (VNĐ)</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-center">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs">{req.id.split('-')[0]}</TableCell>
                      <TableCell className="font-semibold">{getUserName(req.wallet)}</TableCell>
                      <TableCell>{new Date(req.created_at).toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-bold">
                        {Math.abs(req.amount).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedReq(req)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Chi Tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
            <DialogDescription>
              Vui lòng chuyển tiền trước khi ấn Xác nhận.
            </DialogDescription>
          </DialogHeader>

          {selectedReq && (
            <div className="my-4 text-sm border border-border rounded-md overflow-hidden bg-background shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 border-b border-border gap-1 sm:gap-4 bg-muted/30">
                <span className="text-muted-foreground">Mã giao dịch:</span>
                <span className="font-mono font-medium text-foreground sm:col-span-2 sm:text-right break-words">{selectedReq.id}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border">
                <span className="text-muted-foreground">Người dùng:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate ml-4">{getUserName(selectedReq.wallet)}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border bg-muted/30">
                <span className="text-muted-foreground font-semibold">Cần chuyển:</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-500">{Math.abs(selectedReq.amount).toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                <span className="text-muted-foreground font-semibold">Thông tin nhận tiền:</span>
                <div className="bg-muted/50 p-3 rounded-md border border-border">
                  {(() => {
                    if (!selectedReq.ref_id) return <span className="text-muted-foreground italic">Chưa cung cấp</span>;
                    
                    let bank = '';
                    let account = '';
                    let holder = '';
                    let isParsed = false;
                    
                    try {
                      // Thử Parse JSON
                      const parsed = JSON.parse(selectedReq.ref_id);
                      if (parsed.bank && parsed.account) {
                        bank = parsed.bank;
                        account = parsed.account;
                        holder = parsed.holder || '';
                        isParsed = true;
                      }
                    } catch (e) {
                      // Nếu không phải JSON, thử parse dạng "Ngân Hàng - STK"
                      if (selectedReq.ref_id.includes('-')) {
                        const parts = selectedReq.ref_id.split('-');
                        bank = parts[0].trim();
                        account = parts[1].trim().replace(/\s+/g, ''); // Xóa dấu cách nếu có
                        if (bank && account) {
                          isParsed = true;
                        }
                      }
                    }

                    if (isParsed) {
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ngân hàng:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">{bank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Số tài khoản:</span>
                            <span className="font-bold font-mono text-right">{account}</span>
                          </div>
                          {holder && (
                            <div className="flex justify-between pt-2 border-t border-border border-dashed">
                              <span className="text-muted-foreground">Chủ thẻ:</span>
                              <span className="font-bold uppercase text-right">{holder}</span>
                            </div>
                          )}
                          
                          <div className="mt-4 pt-4 border-t border-border flex flex-col items-center justify-center gap-3">
                            <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider bg-muted/80 px-3 py-1 rounded-full">Quét QR Tự động điền</span>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-border">
                              <img 
                                src={`https://img.vietqr.io/image/${bank}-${account}-compact2.jpg?amount=${Math.abs(selectedReq.amount)}&addInfo=${selectedReq.id}&accountName=${holder ? encodeURIComponent(holder) : ''}`} 
                                alt="Mã QR Thanh Toán" 
                                className="w-52 h-52 object-contain"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground max-w-[260px] leading-relaxed">
                              Nội dung chuyển khoản mặc định: <br/> 
                              <span className="font-mono font-medium text-foreground bg-muted p-1 rounded inline-block mt-1">{selectedReq.id}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Nếu không parse được theo chuẩn nào, fallback hiển thị text thường
                    return <span className="font-mono break-words whitespace-pre-wrap">{selectedReq.ref_id}</span>;
                  })()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-between w-full mt-4">
            <Button variant="destructive" disabled={isProcessing} onClick={handleReject}>
              Từ chối (Hoàn tiền)
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" disabled={isProcessing} onClick={() => setSelectedReq(null)}>
                Đóng
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isProcessing} onClick={handleApprove}>
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Xác nhận đã thanh toán
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

