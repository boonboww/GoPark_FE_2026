'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Receipt, Calendar, Download, FileText, MapPin, QrCode, CreditCard, ChevronLeft } from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await apiClient<any>(`/payment/invoice/booking/${id}`);
        console.log("Dữ liệu API trả về:", res);

        // API may return raw entity or wrapper { data } or { data: { data: ... } }
        let payload = res;
        if (res && typeof res === 'object') {
          if (res.data) {
            payload = res.data;
            if (payload.data) payload = payload.data;
          }
        }

        if (!payload || Object.keys(payload).length === 0) {
          setError('Hóa đơn đang được hệ thống xử lý hoặc không tồn tại. Vui lòng thử lại sau giây lát.');
          return;
        }

        setInvoice(payload);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Lỗi khi lấy hóa đơn');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50/50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin hóa đơn...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 text-center max-w-sm w-full">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Không thể tải hóa đơn</h3>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="w-full h-11 rounded-xl">Quay lại</Button>
      </div>
    </div>
  );

  const statusText = invoice?.status || invoice?.status?.toString() || 'THÀNH CÔNG';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl shadow-gray-200/60 border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-8 px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <Receipt className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-bold text-gray-900 leading-none">
                Hóa đơn
              </CardTitle>
              <div className="text-emerald-600 font-bold text-lg leading-tight">
                #{invoice?.id || invoice?.invoice_id || 'N/A'}
              </div>
              <CardDescription className="text-sm font-medium text-gray-500 mt-1">
                Chi tiết giao dịch và thông tin thanh toán
              </CardDescription>
            </div>
          </div>
          <div className="flex shrink-0">
             <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap">
                {statusText}
             </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 pb-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
             <h3 className="text-base font-extrabold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-800" strokeWidth={3} /> Chi tiết thanh toán
             </h3>
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <div className="text-sm text-gray-500 font-bold">Tổng tiền</div>
                   <div className="text-xl flex items-end gap-0.5 font-extrabold text-gray-900">
                      {Number(invoice?.total || invoice?.amount || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} 
                      <span className="text-sm font-semibold text-gray-400 mb-0.5 uppercase tracking-tighter">VND</span>
                   </div>
                </div>
                <div className="w-full h-px bg-gray-50"></div>
                <div className="flex justify-between items-center">
                   <div className="text-sm text-gray-500 font-bold">Thuế (VAT)</div>
                   <div className="text-lg flex items-end gap-0.5 font-bold text-gray-700">
                      {Number(invoice?.tax || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} 
                      <span className="text-xs font-semibold text-gray-400 mb-0.5 uppercase tracking-tighter">VND</span>
                   </div>
                </div>
                <div className="w-full h-px bg-gray-50"></div>
                <div className="flex justify-between items-center">
                   <div className="text-sm text-gray-500 font-bold">Ngày tạo</div>
                   <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={3}/>
                       <span className="whitespace-nowrap">
                         {invoice?.createdAt || invoice?.created_at || invoice?.createdAtUtc 
                            ? new Date(invoice?.createdAt || invoice?.created_at || invoice?.createdAtUtc).toLocaleString('vi-VN')
                            : '-'}
                       </span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-50/60 rounded-2xl border border-slate-100 shadow-sm p-6 mb-2">
             <h3 className="text-base font-extrabold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-800" strokeWidth={3} /> Thông tin bãi đỗ
             </h3>
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <div className="text-sm text-gray-500 font-bold">Mã đặt chỗ (Booking ID)</div>
                   <div className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm">
                      {invoice?.booking?.id || invoice?.booking_id || '-'}
                   </div>
                </div>
                <div className="w-full h-px bg-slate-200/50"></div>
                
                {/* Responsive flex-between: label left, data right */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                   <div className="text-sm text-gray-500 font-bold">Chi tiết vị trí (Tầng - Khu vực- Vị trí)</div>
                   <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5 flex-wrap justify-start sm:justify-end">
                      <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-extrabold border border-emerald-200">
                         {invoice?.booking?.slot?.parkingZone?.parkingFloor?.floor_name || '-'}
                      </span>
                      <span className="text-gray-300 font-medium">/</span>
                      <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-extrabold border border-emerald-200">
                         {invoice?.booking?.slot?.parkingZone?.zone_name || '-'}
                      </span>
                      <span className="text-gray-300 font-medium">/</span>
                      <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-extrabold border border-emerald-200">
                         {invoice?.booking?.slot?.code || '-'}
                      </span>
                   </div>
                </div>

                <div className="w-full h-px bg-slate-200/50"></div>
                <div className="flex justify-between items-center">
                   <div className="text-sm text-gray-500 font-bold">Bãi đỗ (Parking Lot)</div>
                   <div className="text-sm font-bold text-gray-900 text-right">
                      {invoice?.booking?.slot?.parkingZone?.parkingFloor?.parkingLot?.name || '-'}
                   </div>
                </div>
             </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 p-6 sm:p-8 pt-2 bg-white border-t border-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
               variant="default" 
               className="flex-1 h-12 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold border-transparent transition-all shadow-sm"
               onClick={() => router.back()}
            >
               <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={2.5}/> Quay lại
            </Button>

            {invoice?.file_url ? (
              <Button 
                variant="default"
                className="flex-1 h-12 rounded-xl text-emerald-800 bg-emerald-100 hover:bg-emerald-200 font-bold transition-all shadow-sm" 
                onClick={() => window.open(invoice.file_url, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" strokeWidth={2.5} /> Tải / Xem PDF
              </Button>
            ) : (
              <Button className="flex-1 h-12 rounded-xl text-gray-500 bg-slate-100 font-bold" disabled variant="default">
                <FileText className="w-4 h-4 mr-2" strokeWidth={2.5} /> Không có file PDF
              </Button>
            )}
          </div>

          <Button 
            className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all group overflow-hidden relative"
            onClick={() => router.push("/users/Ve-QR")}
          >
            <div className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <QrCode className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            <span>Xác nhận & Xem mã QR vào bãi</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
