"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Download,
  MoreVertical,
  Eye,
  MapPin,
  Clock,
  X,
  Star,
  Car,
  ParkingSquare,
  Users,
  TrendingUp,
  Ban,
  CheckCircle,
  Phone,
  Mail,
  Building2,
  Navigation,
  Layers,
  Activity,
  ParkingCircleIcon,
  SquareParking,
  SquareParkingIcon,
  ParkingCircleOff,
  ParkingCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  adminService,
  ParkingLot,
  ParkingLotStatus,
  ParkingLotType,
  ParkingLotItem,
  ParkingLotStats,
} from "@/services/admin.service";
import { useAdminStore } from "@/stores";
import { IconCash, IconMail, IconMoneybag } from "@tabler/icons-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

 

/** Bộ lọc */
interface Filters {
  search: string;
  status: string;
  type: string;
  sortBy: string;
}


/** Cấu hình trạng thái bãi đỗ */
const statusConfig: Record<ParkingLotStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    className: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  PENDING: {
    label: "Chờ duyệt",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-500",
  },
  INACTIVE: {
    label: "Ngưng hoạt động",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    dot: "bg-orange-500",
  },
  CLOSED: {
    label: "Đã đóng",
    className: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

// ─── Hàm tiện ích ─────────────────────────────────────────────────────────────

/** Định dạng ngày theo chuẩn Việt Nam */
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Định dạng tiền tệ VND */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

/** Định dạng tiền tệ rút gọn */
const formatCompactCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", notation: "compact", maximumFractionDigits: 1 }).format(amount);

/** Định dạng số lớn */
const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

/** Tính phần trăm sử dụng chỗ đỗ */
const getOccupancyPercent = (occupied: number, total: number) =>
  total > 0 ? Math.round((occupied / total) * 100) : 0;

/** Lấy màu cho thanh công suất */
const getOccupancyColor = (percent: number) => {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-orange-500";
  if (percent >= 50) return "bg-yellow-500";
  return "bg-green-500";
};

/** Lấy chữ cái đầu cho avatar */
const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ─── Component chính ──────────────────────────────────────────────────────────

export default function ParkingLotsPage() {
  const {
    parkingLots,
    parkingLotStats,
    isParkingLotsLoading: loading,
    parkingLotsError: error,
    setParkingLots,
    setParkingLotStats,
    setParkingLotsLoading,
    setParkingLotsError,
  } = useAdminStore();

  const [usingMockData, setUsingMockData] = useState(false);

  /** Bộ lọc */
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    type: "",
    sortBy: "rating",
  });

  /** Bãi đỗ đang xem chi tiết */
  const [selectedLot, setSelectedLot] = useState<ParkingLotItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ── Gọi API lấy danh sách bãi đỗ ───────────────────────────────────────────

  const fetchParkingLots = async () => {
    try {
      setParkingLotsLoading(true);
      setUsingMockData(false);

      const [listResult, statsResult] = await Promise.all([
        adminService.getParkingLotsList(),
        adminService.getParkingLotStats()
      ]);

      setParkingLots(listResult.data);
      setParkingLotStats(statsResult);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bãi đỗ:", err);
      setParkingLotsError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  };

  /** Tải dữ liệu khi component được mount */
  useEffect(() => {
    if (parkingLots.length === 0) {
      fetchParkingLots();
    }
  }, []);

  // ── Lọc & sắp xếp ──────────────────────────────────────────────────────────

  const filteredLots = useMemo(() => {
    let result = [...parkingLots];

    // Tìm kiếm theo tên, địa chỉ, tên chủ bãi
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (lot) =>
          lot.name.toLowerCase().includes(term) ||
          lot.location.toLowerCase().includes(term) ||
          lot.owner.name.toLowerCase().includes(term)
      );
    }

    // Lọc theo trạng thái
    if (filters.status) {
      result = result.filter((lot) => lot.status === filters.status.toUpperCase());
    }

    // Sắp xếp
    switch (filters.sortBy) {
      case "rating":
        result.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
        break;
      case "most-slots":
        result.sort((a, b) => b.totalSpaces - a.totalSpaces);
        break;
      case "price-low":
        result.sort((a, b) => {
          const minA = Math.min(...(a.pricePerHour || []).map(p => p.pricePerHour), Infinity);
          const minB = Math.min(...(b.pricePerHour || []).map(p => p.pricePerHour), Infinity);
          return minA - minB;
        });
        break;
      case "price-high":
        result.sort((a, b) => {
          const minA = Math.min(...(a.pricePerHour || []).map(p => p.pricePerHour), -1);
          const minB = Math.min(...(b.pricePerHour || []).map(p => p.pricePerHour), -1);
          return minB - minA;
        });
        break;
    }

    return result;
  }, [parkingLots, filters]);

  // Paginated lots
  const paginatedLots = useMemo(() => {
    return filteredLots.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredLots, currentPage]);

  // ── Thống kê ────────────────────────────────────────────────────────────────

  // Stats are now fetched directly from the API

  // ── Xử lý sự kiện ──────────────────────────────────────────────────────────

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", type: "", sortBy: "rating" });
    setCurrentPage(1);
  };

  const openDetail = (lot: ParkingLotItem) => {
    setSelectedLot(lot);
    setDetailOpen(true);
  };

  /** Chuyển trạng thái bãi đỗ */
  const handleToggleStatus = async (lot: ParkingLotItem, newStatus: string) => {
    console.log(`Chuyển bãi ${lot.id} sang ${newStatus}`);
    // TODO: Gọi API cập nhật trạng thái
    const updatedLots = parkingLots.map((l: ParkingLotItem) => (l.id === lot.id ? { ...l, status: newStatus } : l));
    setParkingLots(updatedLots);
  };

  // ── Thẻ thống kê ───────────────────────────────────────────────────────────

  const statCards = [
    { title: "Tổng bãi đỗ", value: parkingLotStats?.totalParkingLots.toString() || "0", icon: ParkingSquare, color: "bg-blue-600", light: "bg-blue-50 dark:bg-blue-950/20" },
    { title: "Đang hoạt động", value: parkingLotStats?.activeParkingLots.toString() || "0", icon: Activity, color: "bg-emerald-600", light: "bg-emerald-50 dark:bg-emerald-950/20" },
    { title: "Chỗ trống / Tổng chỗ đỗ", value: parkingLotStats?.availableSpacesParkingSlot || "0/0", icon: ParkingCircle, color: "bg-violet-600", light: "bg-violet-50 dark:bg-violet-950/20" },
    { title: "Đánh giá TB", value: `${parkingLotStats?.averageRating || "0.0"}`, icon: Star, color: "bg-amber-500", light: "bg-amber-50 dark:bg-amber-950/20" },
  ];

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải danh sách bãi đỗ xe...</p>
        </div>
      </div>
    );
  }

  // ── Giao diện ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Tiêu đề ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-primary via-primary/95 to-primary/90 rounded-2xl px-8 py-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ParkingSquare className="w-6 h-6" />
            Tất cả Bãi đỗ xe
          </h1>
          <p className="text-primary-foreground/70 mt-1 text-sm">
            Tìm thấy {filteredLots.length} bãi đỗ xe
            {usingMockData && <span className="ml-2 text-orange-300 text-xs">(Dữ liệu mẫu)</span>}
          </p>
          {error && <p className="text-red-300 text-xs mt-1">Lỗi kết nối: {error}</p>}
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button onClick={fetchParkingLots} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-none gap-2">
            <RefreshCw size={16} />
            Làm mới
          </Button>
          <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-none gap-2">
            <Download size={16} />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* ── Thẻ thống kê ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <AdminStatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconGradient={`from-${card.color.split('-')[1]}-500 to-${card.color.split('-')[1]}-600`}
              bgTint={card.light}
              borderColor={`border-${card.color.split('-')[1]}-100 dark:border-${card.color.split('-')[1]}-900/50`}
            />
          );
        })}
      </div>

      {/* ── Thanh tìm kiếm & lọc ──────────────────────────────────────────── */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Tìm theo tên bãi đỗ, địa chỉ, chủ bãi..."
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
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm ngưng</SelectItem>
            </SelectContent>
          </Select>

          {/* Sắp xếp */}
          <Select value={filters.sortBy} onValueChange={(val) => handleFilterChange("sortBy", val)}>
            <SelectTrigger className="h-11 min-w-[180px] border-border bg-muted text-foreground">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
              <SelectItem value="most-slots">Nhiều chỗ nhất</SelectItem>
              <SelectItem value="price-low">Giá thấp → cao</SelectItem>
              <SelectItem value="price-high">Giá cao → thấp</SelectItem>
            </SelectContent>
          </Select>
          {/* Xóa lọc */}
          {(filters.search || filters.status || filters.type || filters.sortBy !== "rating") && (
            <Button variant="ghost" onClick={clearFilters} className="h-11 text-muted-foreground hover:text-foreground/80 hover:bg-red-300 bg-red-100">
              <X size={16} className="mr-1" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* ── Bảng danh sách bãi đỗ ──────────────────────────────────────────── */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/80 border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bãi đỗ xe</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chủ bãi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Công suất</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giá / giờ</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đánh giá</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLots.map((lot) => {
                const currentStatus = lot.status.toUpperCase() as ParkingLotStatus;
                const stConf = statusConfig[currentStatus] || statusConfig.ACTIVE;
                const occupancy = getOccupancyPercent(lot.availableSpaces.totalSlots - lot.availableSpaces.availableSlots, lot.availableSpaces.totalSlots);
                const occColor = getOccupancyColor(occupancy);

                return (
                  <tr
                    key={lot.id}
                    className="hover:bg-gray-200/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(lot)}
                  >
                    {/* Thông tin bãi đỗ */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {/* Icon loại bãi */}
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <ParkingSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate max-w-[220px]">{lot.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{lot.location}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Chủ bãi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{getInitials(lot.owner.name)}</span>
                        </div>
                        <span className="text-sm text-foreground/80 truncate max-w-[120px]">{lot.owner.name}</span>
                      </div>
                    </td>

                    {/* Công suất sử dụng */}
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{lot.availableSpaces.totalSlots - lot.availableSpaces.availableSlots}/{lot.availableSpaces.totalSlots}</span>
                          <span className="font-semibold text-foreground/80">{occupancy}%</span>
                        </div>
                        {/* Thanh tiến trình công suất */}
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${occColor} transition-all`} style={{ width: `${occupancy}%` }} />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {lot.pricePerHour && lot.pricePerHour.length > 0 ? (
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(Math.min(...lot.pricePerHour.map(p => p.pricePerHour)))}
                          </p>
                          {lot.pricePerHour.length > 1 && (
                            <p className="text-[10px] text-gray-400">Từ {lot.pricePerHour.length} mức giá</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Chưa có giá</p>
                      )}
                    </td>

                    {/* Đánh giá */}
                    <td className="px-6 py-4">
                      {parseFloat(lot.averageRating) > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                            <Star size={14} className="fill-amber-400 text-amber-400" />
                            <span className="text-sm font-bold text-amber-700">{lot.averageRating}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Chưa có</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-xs font-medium ${stConf.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stConf.dot} mr-1.5 inline-block`} />
                        {stConf.label}
                      </Badge>
                    </td>

                    {/* Menu hành động */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDetail(lot)}>
                            <Eye size={16} className="mr-2" />
                            Xem chi tiết
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
        {filteredLots.length > 0 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-card">
            <div className="text-sm text-muted-foreground">
              Hiển thị <span className="font-medium text-foreground">{Math.min(filteredLots.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredLots.length, currentPage * pageSize)}</span> trong <span className="font-medium text-foreground">{filteredLots.length}</span> bãi đỗ
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
                const totalPages = Math.ceil(filteredLots.length / pageSize);
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 ||
                    i === totalPages ||
                    (i >= currentPage - 1 && i <= currentPage + 1)
                  ) {
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
                      className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={idx} className="text-gray-400 px-1">...</span>
                  )
                ));
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(filteredLots.length / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredLots.length / pageSize)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Trạng thái trống */}
        {filteredLots.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-muted rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <ParkingSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy bãi đỗ xe nào</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            <Button onClick={clearFilters} variant="outline">Xóa tất cả bộ lọc</Button>
          </div>
        )}
      </div>

      {/* ── Dialog chi tiết bãi đỗ ─────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết bãi đỗ xe</DialogTitle>
          </DialogHeader>

          {selectedLot && ((lot: ParkingLotItem) => {
            const currentStatus = lot.status.toUpperCase() as ParkingLotStatus;
            const stConf = statusConfig[currentStatus] || statusConfig.ACTIVE;
            const occupancy = getOccupancyPercent(lot.availableSpaces.totalSlots - lot.availableSpaces.availableSlots, lot.availableSpaces.totalSlots);
            const occColor = getOccupancyColor(occupancy);

            return (
              <div className="space-y-5 mt-2">

                {/* Phần đầu — Tên + trạng thái */}
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ParkingSquare className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground">{lot.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={14} className="flex-shrink-0" />{lot.location}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs font-medium ${stConf.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stConf.dot} mr-1.5 inline-block`} />
                          {stConf.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-medium bg-indigo-100 text-indigo-700 border-indigo-200">
                          <Layers size={12} className="mr-1" />
                          {lot.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thống kê nhanh */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Car className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{lot.totalSpaces}</p>
                    <p className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Tổng chỗ đỗ</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <IconCash className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-700">
                      {lot.pricePerHour && lot.pricePerHour.length > 0 
                        ? formatCurrency(Math.min(...lot.pricePerHour.map(p => p.pricePerHour)))
                        : "—"}
                    </p>
                    <p className="text-[10px] text-green-500 uppercase font-bold tracking-wider">Giá thấp nhất</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl">
                    <Star className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700">{parseFloat(lot.averageRating) > 0 ? lot.averageRating : "—"}</p>
                    <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Đánh giá TB</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-700">{lot.totalRevenue}</p>
                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Tổng doanh thu</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-xl">
                    <Car className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-indigo-700">{formatNumber(lot.totalBookings)}</p>
                    <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">Tổng đơn đặt</p>
                  </div>
                </div>

                {/* Thanh công suất lớn */}
                <div className="p-4 bg-muted rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground/80">Công suất sử dụng</h4>
                    <span className="text-sm font-bold text-foreground">{occupancy}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${occColor} transition-all`} style={{ width: `${occupancy}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Đang dùng: <strong className="text-foreground/80">{lot.occupiedSlots}</strong></span>
                    <span>Còn trống: <strong className="text-green-600">{lot.availableSpaces.availableSlots}</strong></span>
                    <span>Tổng: <strong className="text-foreground/80">{lot.totalSpaces}</strong></span>
                  </div>
                </div>


                {/* Phân bổ theo khu vực */}
                <div className="border border-border rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Phân bổ theo khu vực ({lot.zones.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lot.zones.map((zone) => (
                      <div key={zone.id} className="p-3 bg-card border border-border rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground">{zone.name}</span>
                          <span className="text-xs font-bold text-blue-600">{zone.availableSlots}/{zone.totalSlots} chỗ</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${getOccupancyPercent(zone.totalSlots - zone.availableSlots, zone.totalSlots)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


                {/* Bảng giá theo khu vực */}
                <div className="border border-border rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bảng giá tham khảo ({lot.pricePerHour.length})</h4>
                  <div className="overflow-hidden border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Khu vực</th>
                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Theo giờ</th>
                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Theo ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lot.pricePerHour.map((price, idx) => (
                          <tr key={idx} className="hover:bg-muted/50">
                            <td className="px-4 py-2 text-foreground/80 font-medium">{price.zonename}</td>
                            <td className="px-4 py-2 text-right text-blue-600 font-semibold">{formatCurrency(price.pricePerHour)}</td>
                            <td className="px-4 py-2 text-right text-indigo-600 font-semibold">{formatCurrency(price.pricePerDay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* Mô tả & Thông tin vận hành */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted p-3 rounded-lg border border-border italic">
                      "{lot.description || "Không có mô tả"}"
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thông tin vận hành</h4>
                    <div className="bg-muted p-3 rounded-lg border border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Giờ mở cửa</span>
                        <span className="text-sm font-semibold text-foreground/80">{lot.openTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Giờ đóng cửa</span>
                        <span className="text-sm font-semibold text-foreground/80">{lot.closeTime}</span>
                      </div>
                      <div className="pt-1 border-t border-border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Navigation size={12} /> Loại hình</span>
                        <span className="text-sm font-semibold text-foreground/80">{lot.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                

                {/* Tiện ích */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiện ích</h4>
                  <div className="flex flex-wrap gap-2">
                    {lot.amenities.map((item) => (
                      <Badge key={item} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                        {item}
                      </Badge>
                    ))}
                    {lot.amenities.length === 0 && <span className="text-xs text-gray-400 italic">Chưa cập nhật tiện ích</span>}
                  </div>
                </div>

               

                {/* Thông tin chủ bãi */}
                <div className="p-4 bg-muted rounded-xl border border-border">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chủ bãi đỗ</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-semibold">{getInitials(lot.owner.name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{lot.owner.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={12} /> {lot.owner.phone}
                        </p>
                      </div>
                    </div>
                    {lot.owner.gender && (
                      <Badge variant="outline" className="text-[10px] uppercase">{lot.owner.gender}</Badge>
                    )}
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
                  {lot.status === "ACTIVE" && (
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleToggleStatus(lot, "INACTIVE")}>
                      <Ban size={16} className="mr-2" />Tạm ngưng
                    </Button>
                  )}
                  {lot.status === "INACTIVE" && (
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleToggleStatus(lot, "ACTIVE")}>
                      <CheckCircle size={16} className="mr-2" />Kích hoạt lại
                    </Button>
                  )}
                </div>
              </div>
            );
          })(selectedLot)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
