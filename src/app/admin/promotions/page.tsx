"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Gift,
  Plus,
  RefreshCw,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Clock,
  X,
  CheckCircle,
  XCircle,
  Percent,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  DollarSign,
  TicketPercent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { voucherService } from "@/services/voucher.service";

// ─── Kiểu dữ liệu ───────────────────────────────────────────────────────────

type PromotionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";
type VoucherDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

interface Promotion {
  id: string;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minBookingValue: number;
  usageLimit: number;
  usedCount: number;
  minBookingCount: number | null;
  firstBookingOnly: boolean;
  startTime: string;
  endTime: string;
  status: PromotionStatus;
  createdAt: string;
}

interface Filters {
  search: string;
  status: string;
  sortBy: string;
}

// ─── Hằng số cấu hình ────────────────────────────────────────────────────────

const statusConfig: Record<PromotionStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: "Đang diễn ra", className: "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", dot: "bg-green-500" },
  UPCOMING: { label: "Sắp diễn ra", className: "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800", dot: "bg-blue-500" },
  EXPIRED: { label: "Đã kết thúc", className: "border-gray-200 text-gray-600 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700", dot: "bg-gray-500" },
  INACTIVE: { label: "Đã vô hiệu", className: "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", dot: "bg-red-500" },
};

// ─── Hàm tiện ích ─────────────────────────────────────────────────────────────

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// Lấy ngày hiện tại + giờ local theo chuẩn datetime-local
const getLocalDatetimeString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

// ─── Component chính ──────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Bộ lọc tìm kiếm / trạng thái / sắp xếp */
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    sortBy: "newest",
  });

  /** Ưu đãi đang xem chi tiết */
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /** Form tạo ưu đãi mới */
  const [createOpen, setCreateOpen] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<Promotion>>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    maxDiscountAmount: null,
    minBookingValue: 0,
    usageLimit: 100,
    minBookingCount: null,
    firstBookingOnly: false,
    startTime: getLocalDatetimeString(new Date()),
    endTime: getLocalDatetimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Fetch data
  const loadData = async (showGlobalLoading = true, page = currentPage, currentFilters = filters) => {
    try {
      if (showGlobalLoading) setLoading(true);
      const params: any = { page, limit: pageSize };
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.sortBy) params.sortBy = currentFilters.sortBy;

      const res = await voucherService.getAll(params);
      if (res && res.data && res.data.items) {
        const mapped: Promotion[] = res.data.items.map(v => ({
          id: v.id,
          code: v.code,
          discountType: v.discount_type,
          discountValue: Number(v.discount_value),
          maxDiscountAmount: v.max_discount_amount ? Number(v.max_discount_amount) : null,
          minBookingValue: Number(v.min_booking_value),
          usageLimit: v.usage_limit,
          usedCount: v.used_count,
          minBookingCount: v.min_booking_count,
          firstBookingOnly: v.first_booking_only,
          startTime: v.start_time,
          endTime: v.end_time,
          status: v.status,
          createdAt: v.createdAt
        }));
        setPromotions(mapped);
        if (res.data.meta && res.data.meta.totalItems !== undefined) {
          setTotalItems(res.data.meta.totalItems);
        } else {
          setTotalItems(mapped.length);
        }
      } else {
        setPromotions([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      if (showGlobalLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(true, currentPage, filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, filters]);

  // (Lọc và phân trang nay đã được đẩy qua API, các biến này dùng như alias để giữ code cũ ít thay đổi)
  const filteredPromotions = promotions;
  const paginatedPromotions = promotions;

  const stats = useMemo(() => {
    return { 
      total: totalItems, 
      active: promotions.filter((p) => p.status === "ACTIVE").length, 
      upcoming: promotions.filter((p) => p.status === "UPCOMING").length, 
      expired: promotions.filter((p) => p.status === "EXPIRED" || p.status === "INACTIVE").length 
    };
  }, [promotions, totalItems]);

  // ── Xử lý sự kiện ──────────────────────────────────────────────────────────

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", sortBy: "newest" });
    setCurrentPage(1);
  };

  const openDetail = (promo: Promotion) => {
    setSelectedPromo(promo);
    setDetailOpen(true);
  };

  const handleToggleStatus = async (promo: Promotion) => {
    if (togglingId) return;
    
    setTogglingId(promo.id);
    const newStatus: PromotionStatus = promo.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    
    try {
      await voucherService.updateStatus(promo.id, newStatus);
      setPromotions(promotions.map((p) => (p.id === promo.id ? { ...p, status: newStatus } : p)));
      toast.success(`Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} ưu đãi ${promo.code}`);
      
      if (selectedPromo?.id === promo.id) {
        setSelectedPromo({ ...selectedPromo, status: newStatus });
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật trạng thái");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (promo: Promotion) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ưu đãi ${promo.code}?`)) {
      setPromotions(promotions.filter(p => p.id !== promo.id));
      toast.success("Đã xóa ưu đãi thành công");
    }
  };

  const refreshData = () => {
    loadData(false);
    toast.success("Đã làm mới dữ liệu");
  };

  const handleCreateSubmit = async () => {
    if (!newPromo.code || !newPromo.startTime || !newPromo.endTime || newPromo.discountValue === undefined) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    if (newPromo.discountType === "PERCENTAGE" && (newPromo.discountValue <= 0 || newPromo.discountValue > 100)) {
      toast.error("Mức giảm phần trăm phải từ 1 đến 100");
      return;
    }

    if (newPromo.discountValue <= 0) {
      toast.error("Mức giảm/Số tiền giảm phải lớn hơn 0");
      return;
    }

    const now = new Date().getTime();
    const startTimeMs = new Date(newPromo.startTime).getTime();
    let computedStatus: PromotionStatus = "ACTIVE";
    
    if (startTimeMs > now) {
      computedStatus = "UPCOMING";
    }

    try {
      setIsSubmitting(true);
      const res = await voucherService.create({
        code: newPromo.code,
        discount_type: newPromo.discountType as VoucherDiscountType,
        discount_value: newPromo.discountValue,
        max_discount_amount: newPromo.maxDiscountAmount || null,
        min_booking_value: newPromo.minBookingValue || 0,
        usage_limit: newPromo.usageLimit || 1,
        start_time: new Date(newPromo.startTime).toISOString(),
        end_time: new Date(newPromo.endTime).toISOString(),
        min_booking_count: newPromo.minBookingCount || null,
        first_booking_only: newPromo.firstBookingOnly || false,
        status: computedStatus,
      });

      if (res && res.data) {
        toast.success("Tạo ưu đãi mới thành công");
        setCreateOpen(false);
        loadData(false);
        
        // Reset form
        setNewPromo({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: 0,
          maxDiscountAmount: null,
          minBookingValue: 0,
          usageLimit: 100,
          minBookingCount: null,
          firstBookingOnly: false,
          startTime: getLocalDatetimeString(new Date()),
          endTime: getLocalDatetimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo ưu đãi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Cấu hình thẻ thống kê ──────────────────────────────────────────────────

  const statCards = [
    {
      title: "Tổng ưu đãi",
      value: stats.total,
      icon: Gift,
      gradient: "from-[#006241] to-[#00754A]",
      bgTint: "bg-white",
      border: "border-[#d4e9e2]",
    },
    {
      title: "Đang diễn ra",
      value: stats.active,
      icon: CheckCircle,
      gradient: "from-[#1E3932] to-[#2b5148]",
      bgTint: "bg-white",
      border: "border-[#d4e9e2]",
    },
    {
      title: "Sắp diễn ra",
      value: stats.upcoming,
      icon: Clock,
      gradient: "from-[#00754A] to-[#006241]",
      bgTint: "bg-white",
      border: "border-[#d4e9e2]",
    },
    {
      title: "Đã kết thúc / Vô hiệu",
      value: stats.expired,
      icon: XCircle,
      gradient: "from-[#c82014] to-[#e05a4a]",
      bgTint: "bg-white",
      border: "border-[#ffd4d4]",
    },
  ];

  // ── Trạng thái đang tải ─────────────────────────────────────────────────────

  if (loading) {
    return (
       <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu ưu đãi...</p>
        </div>
      </div>
    );
  }

  // ── Giao diện chính ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Tiêu đề trang & nút hành động ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl px-8 py-6" style={{ backgroundColor: '#1E3932', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)' }}>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Gift className="w-6 h-6" />
            Quản lý Ưu đãi
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            Quản lý mã giảm giá, voucher và các chương trình khuyến mãi
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button onClick={refreshData} className="gap-2 transition-all duration-200 active:scale-95" style={{ borderRadius: '50px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}>
            <RefreshCw size={16} />
            Làm mới
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="bg-white text-primary hover:bg-white/90 shadow-sm gap-2 font-semibold">
            <TicketPercent className="w-4 h-4" />
            Thêm Ưu đãi
          </Button>
        </div>
      </div>

      {/* ── Thẻ thống kê ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <AdminStatCard
            key={i || card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconGradient={card.gradient}
            bgTint={card.bgTint}
            borderColor={card.border}
          />
        ))}
      </div>

      {/* ── Thanh tìm kiếm & bộ lọc ───────────────────────────────────────── */}
      <div className="p-5 admin-content-card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Tìm theo mã ưu đãi..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10 h-11 bg-muted border-border focus:bg-card text-foreground"
            />
          </div>
          {/* Lọc trạng thái */}
          <Select value={filters.status || "all"} onValueChange={(val) => handleFilterChange("status", val === "all" ? "" : val)}>
            <SelectTrigger className="h-11 min-w-[160px] border-border bg-muted text-foreground">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
              <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
              <SelectItem value="EXPIRED">Đã kết thúc</SelectItem>
              <SelectItem value="DISABLED">Đã vô hiệu</SelectItem>
            </SelectContent>
          </Select>
          {/* Sắp xếp */}
          <Select value={filters.sortBy} onValueChange={(val) => handleFilterChange("sortBy", val)}>
            <SelectTrigger className="h-11 min-w-[180px] border-border bg-muted text-foreground">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới tạo nhất</SelectItem>
              <SelectItem value="oldest">Tạo cũ nhất</SelectItem>
              <SelectItem value="highest-discount">Giảm giá cao nhất</SelectItem>
              <SelectItem value="ending-soon">Sắp kết thúc</SelectItem>
            </SelectContent>
          </Select>
          {/* Nút xóa bộ lọc */}
          {(filters.search || filters.status || filters.sortBy !== "newest") && (
            <Button variant="ghost" onClick={clearFilters} className="h-11 text-muted-foreground hover:text-foreground/80 hover:bg-red-300 bg-red-100">
              <X size={16} className="mr-1" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* ── Bảng danh sách ưu đãi ──────────────────────────────────────── */}
      <div className="overflow-hidden admin-content-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/80 border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mã Ưu đãi
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mức giảm
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Thời hạn áp dụng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Đã dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12" />
              </tr>
            </thead>

            <tbody className="admin-table-divider divide-y divide-border">
              {paginatedPromotions.map((promo) => {
                const config = statusConfig[promo.status];
                const usagePercent = Math.round((promo.usedCount / promo.usageLimit) * 100);

                return (
                  <tr
                    key={promo.id}
                    className="admin-table-row hover:bg-muted/30 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => openDetail(promo)}
                  >
                    {/* Mã và tên */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${promo.discountType === "PERCENTAGE" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                          {promo.discountType === "PERCENTAGE" ? <Percent size={20} /> : <DollarSign size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{promo.code}</span>
                            {promo.firstBookingOnly && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-purple-50 text-purple-600 border-purple-200">
                                KH mới
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mức giảm */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-semibold ${promo.discountType === "PERCENTAGE" ? "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"}`}>
                          {promo.discountType === "PERCENTAGE" ? <Percent size={14} /> : <Tag size={14} />}
                          {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                        </div>
                        {promo.discountType === "PERCENTAGE" && promo.maxDiscountAmount && (
                          <p className="text-xs text-muted-foreground">
                            Tối đa {formatCurrency(promo.maxDiscountAmount)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Thời hạn */}
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar size={14} className="text-muted-foreground" />
                          <span>{formatDate(promo.startTime).split(' ')[0]}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{formatDate(promo.endTime).split(' ')[0]}</span>
                        </div>
                      </div>
                    </td>

                    {/* Lượt dùng */}
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-foreground">{promo.usedCount}</span>
                          <span className="text-muted-foreground">/ {promo.usageLimit}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 75 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
                        {config.label}
                      </Badge>
                    </td>

                    {/* Hành động */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical size={16} className="text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDetail(promo)}>
                            <Eye size={16} className="mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit size={16} className="mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(promo)}
                            className={promo.status === "INACTIVE" ? "text-green-600" : "text-orange-600"}
                            disabled={togglingId === promo.id}
                          >
                            {togglingId === promo.id ? (
                              <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                              <ToggleLeft size={16} className="mr-2" />
                            )}
                            {promo.status === "INACTIVE" ? "Kích hoạt lại" : "Vô hiệu hóa"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(promo)}
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Xóa ưu đãi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalItems > 0 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-card rounded-b-xl">
            <div className="text-sm text-muted-foreground">
              Hiển thị <span className="font-medium text-foreground">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)}</span> trong <span className="font-medium text-foreground">{totalItems}</span> ưu đãi
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {(() => {
                const totalPages = Math.ceil(totalItems / pageSize);
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    pages.push(i);
                  } else if (i === currentPage - 2 || i === currentPage + 2) {
                    pages.push("...");
                  }
                }
                
                return pages.filter((p, idx, arr) => p !== "..." || arr[idx - 1] !== "...").map((page, idx) => (
                  typeof page === "number" ? (
                    <Button
                      key={idx}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={idx} className="text-muted-foreground px-1">...</span>
                  )
                ));
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalItems / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Trạng thái trống */}
        {totalItems === 0 && (
          <div className="text-center py-16">
            <div className="bg-muted rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <Gift className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy ưu đãi nào</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Thử điều chỉnh bộ lọc hoặc tạo mới một ưu đãi.
            </p>
            <Button onClick={clearFilters} variant="outline" className="mr-3">
              Xóa lọc
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} className="mr-2" />
              Thêm ưu đãi mới
            </Button>
          </div>
        )}
      </div>

      {/* ── Dialog Tạo Ưu đãi mới ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-green-600 flex items-center gap-2">
              <TicketPercent className="w-5 h-5" />
              Thêm ưu đãi mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mã Ưu đãi (Code) <span className="text-red-500">*</span></label>
              <Input 
                placeholder="VD: SUMMER2026" 
                value={newPromo.code}
                onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase().replace(/\s+/g, '')})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại giảm giá <span className="text-red-500">*</span></label>
                <Select 
                  value={newPromo.discountType} 
                  onValueChange={(val: VoucherDiscountType) => setNewPromo({...newPromo, discountType: val, discountValue: 0, maxDiscountAmount: null})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Giảm theo phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {newPromo.discountType === "PERCENTAGE" ? "Mức giảm (%)" : "Số tiền giảm (VNĐ)"} <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="number"
                  min="0"
                  max={newPromo.discountType === "PERCENTAGE" ? "100" : undefined}
                  value={newPromo.discountValue || ""}
                  onChange={(e) => setNewPromo({...newPromo, discountValue: Number(e.target.value)})}
                />
              </div>

              {newPromo.discountType === "PERCENTAGE" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giảm tối đa (VNĐ)</label>
                  <Input 
                    type="number"
                    placeholder="Không giới hạn nếu để trống"
                    value={newPromo.maxDiscountAmount || ""}
                    onChange={(e) => setNewPromo({...newPromo, maxDiscountAmount: e.target.value ? Number(e.target.value) : null})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Giá trị đơn tối thiểu (VNĐ) <span className="text-red-500">*</span></label>
                <Input 
                  type="number"
                  min="0"
                  value={newPromo.minBookingValue || ""}
                  onChange={(e) => setNewPromo({...newPromo, minBookingValue: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lượt đặt tối thiểu</label>
                <Input 
                  type="number"
                  min="0"
                  placeholder="Bỏ trống nếu không yêu cầu"
                  value={newPromo.minBookingCount || ""}
                  onChange={(e) => setNewPromo({...newPromo, minBookingCount: e.target.value ? Number(e.target.value) : null})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dành cho khách hàng mới?</label>
                <Select 
                  value={newPromo.firstBookingOnly ? "true" : "false"}
                  onValueChange={(val) => setNewPromo({...newPromo, firstBookingOnly: val === "true"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không (Tất cả)</SelectItem>
                    <SelectItem value="true">Có (Chỉ đơn đầu tiên)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian bắt đầu <span className="text-red-500">*</span></label>
                <Input 
                  type="datetime-local"
                  value={newPromo.startTime}
                  onChange={(e) => setNewPromo({...newPromo, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian kết thúc <span className="text-red-500">*</span></label>
                <Input 
                  type="datetime-local"
                  value={newPromo.endTime}
                  onChange={(e) => setNewPromo({...newPromo, endTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2 w-1/2 pr-2">
              <label className="text-sm font-medium">Giới hạn số lượt sử dụng <span className="text-red-500">*</span></label>
              <Input 
                type="number"
                min="1"
                value={newPromo.usageLimit || ""}
                onChange={(e) => setNewPromo({...newPromo, usageLimit: Number(e.target.value)})}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={handleCreateSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo Ưu đãi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog chi tiết Ưu đãi ─────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-green-600 flex items-center gap-2">
              <TicketPercent className="w-5 h-5" />
              Chi tiết Ưu đãi
              </DialogTitle>
          </DialogHeader>

          {selectedPromo && (
            <div className="space-y-6 mt-2">
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 text-white ${selectedPromo.discountType === "PERCENTAGE" ? "bg-orange-500" : "bg-blue-500"}`}>
                  {selectedPromo.discountType === "PERCENTAGE" ? <Percent size={32} /> : <DollarSign size={32} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground font-mono">{selectedPromo.code}</h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${(statusConfig[selectedPromo.status]).className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${(statusConfig[selectedPromo.status]).dot} mr-1.5 inline-block`} />
                      {(statusConfig[selectedPromo.status]).label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-medium text-foreground border-b border-border pb-2">Thông tin giảm giá</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loại ưu đãi:</span>
                      <span className="font-semibold text-foreground">
                        {selectedPromo.discountType === "PERCENTAGE" ? "Phần trăm (%)" : "Số tiền cố định (VNĐ)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mức giảm:</span>
                      <span className={`font-semibold ${selectedPromo.discountType === "PERCENTAGE" ? "text-green-600" : "text-blue-600"}`}>
                        {selectedPromo.discountType === "PERCENTAGE" ? `${selectedPromo.discountValue}%` : formatCurrency(selectedPromo.discountValue)}
                      </span>
                    </div>
                    {selectedPromo.discountType === "PERCENTAGE" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giảm tối đa:</span>
                        <span className="font-medium text-foreground">{selectedPromo.maxDiscountAmount ? formatCurrency(selectedPromo.maxDiscountAmount) : "Không giới hạn"}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Đơn tối thiểu:</span>
                      <span className="font-medium text-foreground">{formatCurrency(selectedPromo.minBookingValue)}</span>
                    </div>
                    {selectedPromo.minBookingCount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lượt đặt tối thiểu:</span>
                        <span className="font-medium text-foreground">{selectedPromo.minBookingCount} lượt</span>
                      </div>
                    )}
                    {selectedPromo.firstBookingOnly && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Đối tượng:</span>
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 py-0 h-5">Khách mới</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-medium text-foreground border-b border-border pb-2">Thời gian áp dụng</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bắt đầu:</span>
                      <span className="font-medium text-foreground">{formatDate(selectedPromo.startTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kết thúc:</span>
                      <span className="font-medium text-foreground">{formatDate(selectedPromo.endTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium text-foreground border-b border-border pb-2">Giới hạn sử dụng</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Đã sử dụng: <strong className="text-foreground">{selectedPromo.usedCount}</strong> / {selectedPromo.usageLimit} lượt</span>
                    <span className="font-medium text-blue-600">{Math.round((selectedPromo.usedCount / selectedPromo.usageLimit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${Math.round((selectedPromo.usedCount / selectedPromo.usageLimit) * 100) >= 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${Math.round((selectedPromo.usedCount / selectedPromo.usageLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
