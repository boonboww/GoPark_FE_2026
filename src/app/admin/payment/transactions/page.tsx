"use client";
import { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, Eye, Clock, CheckCircle2, XCircle, ArrowRightLeft, Wallet, Banknote, CreditCard, Receipt, AlertCircle, Hash, Calendar, User, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService, Transaction } from "@/services/admin.service";
import { useAdminStore } from "@/stores";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

interface Filters { search: string; status: string; type: string; dateFrom: string; dateTo: string; sortBy: string; }

const statusConfig: Record<string, { label: string; className: string; dot: string; icon: any }> = {
  COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400", dot: "bg-green-500", icon: CheckCircle2 },
  PENDING: { label: "Đang xử lý", className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400", dot: "bg-yellow-500", icon: Clock },
  FAILED: { label: "Thất bại", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-green-400", dot: "bg-red-500", icon: XCircle },
  CANCELLED: { label: "Đã hủy", className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400", dot: "bg-gray-400", icon: XCircle },
  SUCCESS: { label: "Thành công", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400", dot: "bg-green-500", icon: CheckCircle2 },
};

const typeConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; isOutgoing: boolean }> = {
  TOP_UP: { label: "Nạp tiền vào ví", color: "text-green-600", bgColor: "bg-green-100", icon: Wallet, isOutgoing: false },
  WITHDRAW: { label: "Rút tiền từ ví", color: "text-orange-600", bgColor: "bg-orange-100", icon: Banknote, isOutgoing: true },
  BOOKING_PAYMENT: { label: "Thanh toán đặt chỗ", color: "text-blue-600", bgColor: "bg-blue-100", icon: CreditCard, isOutgoing: true },
  BOOKING_REFUND: { label: "Hoàn tiền đặt chỗ", color: "text-teal-600", bgColor: "bg-teal-100", icon: ArrowRightLeft, isOutgoing: false },
  PENALTY: { label: "Phạt quá giờ", color: "text-red-600", bgColor: "bg-red-100", icon: AlertCircle, isOutgoing: true },
  TRANSFER_IN: { label: "Chuyển tiền vào", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: ArrowUpDown, isOutgoing: false },
  TRANSFER_OUT: { label: "Chuyển tiền ra", color: "text-rose-600", bgColor: "bg-rose-100", icon: ArrowUpDown, isOutgoing: true },
  EARN_PARKING_FEE: { label: "Tiền gửi xe", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: Banknote, isOutgoing: false },
  PAYMENT: { label: "Thanh toán", color: "text-blue-600", bgColor: "bg-blue-100", icon: CreditCard, isOutgoing: true },
};

const formatCurrency = (v: number | string) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v));
const formatCompact = (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", notation: "compact", maximumFractionDigits: 1 }).format(v);
const formatDateTime = (d: string) => new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); const h = Math.floor(m / 60); const days = Math.floor(h / 24); if (m < 1) return "Vừa xong"; if (m < 60) return `${m} phút trước`; if (h < 24) return `${h} giờ trước`; if (days < 7) return `${days} ngày trước`; return formatDateTime(d); };

const getTypeConf = (t: string) => typeConfig[t] || { label: t, color: "text-gray-600", bgColor: "bg-gray-100", icon: Receipt, isOutgoing: false };
const getStatusConf = (s: string) => statusConfig[s] || statusConfig.PENDING;

export default function TransactionsPage() {
  const { 
    transactions, 
    isTransactionsLoading: loading, 
    transactionsError: error, 
    setTransactions, 
    setTransactionsLoading, 
    setTransactionsError, 
    totalTransactions, 
    setTotalTransactions,
    transactionStats,
    setTransactionStats
  } = useAdminStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [usingMockData, setUsingMockData] = useState(false);
  const [filters, setFilters] = useState<Filters>({ search: "", status: "", type: "", dateFrom: "", dateTo: "", sortBy: "newest" });
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await adminService.getTransactionStats();
      setTransactionStats(res);
    } catch (err) {
      console.error("Lỗi khi tải thống kê giao dịch:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      setUsingMockData(false);
      const res = await adminService.getTransactions(currentPage, pageSize);
      setTransactions(res.data);
      setTotalTransactions(res.total);
    } catch (err) {
      setTransactionsError(err instanceof Error ? err.message : "Lỗi không xác định");
      setUsingMockData(true);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, pageSize]);

  const filtered = useMemo(() => {
    let r = [...transactions];
    if (filters.search) {
      const t = filters.search.toLowerCase();
      r = r.filter(x => (x.id || "").toLowerCase().includes(t) || (x.ref_id || "").toLowerCase().includes(t) || (x.wallet?.user?.userName || "").toLowerCase().includes(t) || (x.wallet?.user?.email || "").toLowerCase().includes(t) || (x.ref_type || "").toLowerCase().includes(t));
    }
    if (filters.status) r = r.filter(x => x.status === filters.status);
    if (filters.type) r = r.filter(x => x.type === filters.type);
    if (filters.dateFrom) r = r.filter(x => new Date(x.created_at) >= new Date(filters.dateFrom));
    if (filters.dateTo) r = r.filter(x => new Date(x.created_at) <= new Date(filters.dateTo + "T23:59:59"));
    
    switch (filters.sortBy) {
      case "newest": r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "oldest": r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case "amount-high": r.sort((a, b) => Number(b.amount) - Number(a.amount)); break;
      case "amount-low": r.sort((a, b) => Number(a.amount) - Number(b.amount)); break;
    }
    return r;
  }, [transactions, filters]);

  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === "COMPLETED" || t.status === "SUCCESS");
    const totalIn = completed.filter(t => !getTypeConf(t.type).isOutgoing).reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = completed.filter(t => getTypeConf(t.type).isOutgoing).reduce((s, t) => s + Number(t.amount), 0);
    return { total: transactions.length, completed: completed.length, pending: transactions.filter(t => t.status === "PENDING").length, totalIn, totalOut };
  }, [transactions]);

  const handleFilter = (k: keyof Filters, v: string) => {
    setFilters(p => ({ ...p, [k]: v }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters({ search: "", status: "", type: "", dateFrom: "", dateTo: "", sortBy: "newest" });
    setCurrentPage(1);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" /><p className="text-muted-foreground">Đang tải giao dịch...</p></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-primary via-primary/95 to-primary/90 rounded-2xl px-8 py-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Receipt className="w-6 h-6" />Lịch sử Giao dịch Ví</h1>
          <p className="text-primary-foreground/70 mt-1 text-sm">Tìm thấy {totalTransactions} giao dịch{usingMockData && <span className="ml-2 text-orange-300 text-xs">(Dữ liệu mẫu)</span>}</p>
          {error && <p className="text-red-300 text-xs mt-1">Lỗi: {error}</p>}
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Button onClick={fetchStats} variant="ghost" className="text-white hover:bg-white/10 gap-2"><RefreshCw size={14} />Thống kê</Button>
          <Button onClick={fetchTransactions} className="gap-2" style={{ borderRadius: "50px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}><RefreshCw size={16} />Làm mới</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard 
          title="Tổng giao dịch" 
          value={transactionStats?.totalTransactions.toString() || totalTransactions.toString()} 
          icon={Receipt} 
          iconGradient="from-blue-500 to-blue-600" 
          bgTint="bg-blue-50 dark:bg-blue-950/20" 
          borderColor="border-blue-100 dark:border-blue-900/50" 
        />
        <AdminStatCard 
          title="Thành công" 
          value={transactionStats?.successTransactions.toString() || stats.completed.toString()} 
          icon={CheckCircle2} 
          iconGradient="from-green-500 to-green-600" 
          bgTint="bg-green-50 dark:bg-green-950/20" 
          borderColor="border-green-100 dark:border-green-900/50" 
        />
        <AdminStatCard 
          title="Tổng thu nhập" 
          value={transactionStats?.totalIncome || formatCompact(stats.totalIn)} 
          icon={ArrowUpDown} 
          iconGradient="from-emerald-500 to-emerald-600" 
          bgTint="bg-emerald-50 dark:bg-emerald-950/20" 
          borderColor="border-emerald-100 dark:border-emerald-900/50" 
        />
        <AdminStatCard 
          title="Tổng hoàn tiền" 
          value={transactionStats?.totalRefund || "0 ₫"} 
          icon={ArrowRightLeft} 
          iconGradient="from-orange-500 to-orange-600" 
          bgTint="bg-orange-50 dark:bg-orange-950/20" 
          borderColor="border-orange-100 dark:border-orange-900/50" 
        />
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Tìm theo ID, mã ref, tên người dùng, email..." value={filters.search} onChange={e => handleFilter("search", e.target.value)} className="pl-10 h-11 bg-muted border-border focus:ring-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-1">
            <Select value={filters.status || "all"} onValueChange={v => handleFilter("status", v === "all" ? "" : v)}>
              <SelectTrigger className="w-full h-10 bg-muted border-border text-sm"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="COMPLETED">Hoàn thành</SelectItem><SelectItem value="SUCCESS">Thành công</SelectItem><SelectItem value="PENDING">Đang xử lý</SelectItem><SelectItem value="FAILED">Thất bại</SelectItem><SelectItem value="CANCELLED">Đã hủy</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1">
            <Select value={filters.type || "all"} onValueChange={v => handleFilter("type", v === "all" ? "" : v)}>
              <SelectTrigger className="w-full h-10 bg-muted border-border text-sm"><SelectValue placeholder="Loại GD" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tất cả loại</SelectItem><SelectItem value="TOP_UP">Nạp tiền vào ví</SelectItem><SelectItem value="WITHDRAW">Rút tiền từ ví</SelectItem><SelectItem value="BOOKING_PAYMENT">Thanh toán đặt chỗ</SelectItem><SelectItem value="BOOKING_REFUND">Hoàn tiền đặt chỗ</SelectItem><SelectItem value="PENALTY">Phạt quá giờ</SelectItem><SelectItem value="TRANSFER_IN">Chuyển tiền vào</SelectItem><SelectItem value="TRANSFER_OUT">Chuyển tiền ra</SelectItem><SelectItem value="EARN_PARKING_FEE">Tiền gửi xe</SelectItem><SelectItem value="PAYMENT">Thanh toán</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2 flex items-center gap-2 bg-muted border border-border rounded-md px-3 h-10">
            <div className="flex-1 flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <Input type="date" value={filters.dateFrom} onChange={e => handleFilter("dateFrom", e.target.value)} className="h-8 border-0 bg-transparent text-xs p-0 w-full focus-visible:ring-0" />
            </div>
            <span className="text-muted-foreground/50">|</span>
            <div className="flex-1 flex items-center gap-2 text-right justify-end">
              <Input type="date" value={filters.dateTo} onChange={e => handleFilter("dateTo", e.target.value)} className="h-8 border-0 bg-transparent text-xs p-0 w-full focus-visible:ring-0 text-right" />
              <Calendar size={14} className="text-muted-foreground" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Select value={filters.sortBy} onValueChange={v => handleFilter("sortBy", v)}>
              <SelectTrigger className="w-full h-10 bg-muted border-border text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="newest">Mới nhất</SelectItem><SelectItem value="oldest">Cũ nhất</SelectItem><SelectItem value="amount-high">Số tiền ↓</SelectItem><SelectItem value="amount-low">Số tiền ↑</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1 flex justify-end gap-2">
            {(filters.search || filters.status || filters.type || filters.dateFrom || filters.dateTo || filters.sortBy !== "newest") && (
              <Button variant="ghost" onClick={clearFilters} className="h-10 w-full lg:w-10 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title="Xóa bộ lọc"><XCircle size={18} /></Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden admin-content-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/80 border-b border-border">
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Giao dịch</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người dùng / Ví</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loại</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số dư trước/sau</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tham chiếu</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                <th className="px-5 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(txn => {
                const stConf = getStatusConf(txn.status);
                const tConf = getTypeConf(txn.type);
                const TIcon = tConf.icon;
                const user = txn.wallet?.user;
                return (
                  <tr key={txn.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => { setSelectedTxn(txn); setDetailOpen(true); }}>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{txn.id.split("-")[0]}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {user ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">{txn.wallet_id ? txn.wallet_id.split("-")[0] + "..." : "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded ${tConf.bgColor} flex items-center justify-center`}><TIcon className={`w-3.5 h-3.5 ${tConf.color}`} /></div>
                        <span className="text-xs text-muted-foreground">{tConf.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${tConf.isOutgoing ? "text-red-600" : "text-green-600"}`}>{tConf.isOutgoing ? "−" : "+"}{formatCurrency(txn.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs space-y-0.5">
                        <p className="text-muted-foreground">Trước: <span className="font-medium text-foreground">{formatCurrency(txn.balance_before)}</span></p>
                        <p className="text-muted-foreground">Sau: <span className="font-medium text-foreground">{formatCurrency(txn.balance_after)}</span></p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {txn.ref_type ? (
                        <div className="text-xs">
                          <span className="bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded text-[10px] font-medium">{txn.ref_type}</span>
                          {txn.ref_id && <p className="text-muted-foreground mt-0.5 font-mono">{txn.ref_id.slice(0, 8)}...</p>}
                        </div>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className={`text-xs font-medium ${stConf.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stConf.dot} mr-1.5 inline-block`} />{stConf.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-muted-foreground">{timeAgo(txn.created_at)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedTxn(txn); setDetailOpen(true); }}><Eye size={14} /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalTransactions > 0 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-card">
            <div className="text-sm text-muted-foreground">
              Hiển thị <span className="font-medium text-foreground">{Math.min(totalTransactions, (currentPage - 1) * pageSize + 1)}-{Math.min(totalTransactions, currentPage * pageSize)}</span> trong <span className="font-medium text-foreground">{totalTransactions}</span> giao dịch
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {(() => {
                const totalPages = Math.ceil(totalTransactions / pageSize);
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) pages.push(i);
                  else if (i === currentPage - 2 || i === currentPage + 2) pages.push("...");
                }
                return pages.filter((p, idx, arr) => p !== "..." || arr[idx - 1] !== "...").map((page, idx) => (
                  typeof page === "number" ? (
                    <Button key={idx} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}>
                      {page}
                    </Button>
                  ) : <span key={idx} className="text-gray-400 px-1">...</span>
                ));
              })()}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalTransactions / pageSize), p + 1))} disabled={currentPage >= Math.ceil(totalTransactions / pageSize)} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">Chi tiết giao dịch</DialogTitle></DialogHeader>
          {selectedTxn && (
            <div className="space-y-5 mt-2">
              <div className={`p-6 rounded-xl text-center ${getTypeConf(selectedTxn.type).isOutgoing ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30" : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"}`}>
                <p className={`text-4xl font-bold ${getTypeConf(selectedTxn.type).isOutgoing ? "text-red-600" : "text-green-600"}`}>{getTypeConf(selectedTxn.type).isOutgoing ? "−" : "+"}{formatCurrency(selectedTxn.amount)}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge variant="outline" className={`text-xs font-medium ${getStatusConf(selectedTxn.status).className}`}>{getStatusConf(selectedTxn.status).label}</Badge>
                  <Badge variant="outline" className={`text-xs ${getTypeConf(selectedTxn.type).bgColor} ${getTypeConf(selectedTxn.type).color} border-0`}>{getTypeConf(selectedTxn.type).label}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Hash size={18} className="text-blue-500" />
                  <div><p className="text-xs text-muted-foreground">ID Giao dịch</p><p className="text-sm font-mono font-semibold text-foreground break-all">{selectedTxn.id}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Wallet size={18} className="text-indigo-500" />
                  <div><p className="text-xs text-muted-foreground">Wallet ID</p><p className="text-sm font-mono text-foreground break-all">{selectedTxn.wallet_id || "—"}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar size={18} className="text-green-500" />
                  <div><p className="text-xs text-muted-foreground">Thời gian tạo</p><p className="text-sm font-medium text-foreground">{formatDateTime(selectedTxn.created_at)}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar size={18} className="text-orange-500" />
                  <div><p className="text-xs text-muted-foreground">Cập nhật lúc</p><p className="text-sm font-medium text-foreground">{formatDateTime(selectedTxn.updated_at)}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Số dư trước</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(selectedTxn.balance_before)}</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Số dư sau</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(selectedTxn.balance_after)}</p>
                </div>
              </div>

              {(selectedTxn.ref_type || selectedTxn.ref_id) && (
                <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/30">
                  <h4 className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-2">Tham chiếu</h4>
                  {selectedTxn.ref_type && <p className="text-sm font-medium text-foreground">Loại: <span className="text-violet-600">{selectedTxn.ref_type}</span></p>}
                  {selectedTxn.ref_id && <p className="text-sm text-muted-foreground font-mono mt-1">ID: {selectedTxn.ref_id}</p>}
                </div>
              )}

              {selectedTxn.wallet?.user && (
                <div className="p-4 bg-muted rounded-xl">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1"><User size={12} />Người dùng</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{selectedTxn.wallet.user.userName}</p>
                    <p className="text-xs text-muted-foreground">{selectedTxn.wallet.user.email}</p>
                    {selectedTxn.wallet.user.phoneNumber && <p className="text-xs text-muted-foreground">{selectedTxn.wallet.user.phoneNumber}</p>}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
