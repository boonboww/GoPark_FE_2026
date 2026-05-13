"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  ShieldBan,
  RefreshCw,
  Download,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Car,
  Clock,
  X,
  TrendingUp,
  Loader2,
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
import { adminService, CustomerList } from "@/services/admin.service";
import { useAdminStore } from "@/stores";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: "ACTIVE" | "BLOCKED" | "SPENDING" | string;
  totalBookings: number;
  totalSpending: number;
  lastActive?: string;
  createdAt: string;
  address?: string;
  recentBookings?: RecentBooking[];
}

interface RecentBooking {
  id: string;
  parkingLotName: string;
  date: string;
  status: "completed" | "cancelled" | "confirmed" | "pending";
  amount: number;
}

interface Filters {
  search: string;
  status: string;
  sortBy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

import { get } from "@/lib/api";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export const statusConfig = {
  ACTIVE: {
    label: "Hoạt động",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    dot: "bg-green-500",
  },
  BLOCKED: {
    label: "Đã khóa",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    dot: "bg-red-500",
  },
  SPENDING: {
    label: "Chưa xác thực",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    dot: "bg-yellow-500",
  }
};

const bookingStatusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const bookingStatusLabels: Record<string, string> = {
  completed: "Hoàn thành",
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const avatarColors = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

const getAvatarColor = (id: string) => {
  const index = id.charCodeAt(id.length - 1) % avatarColors.length;
  return avatarColors[index];
};

const timeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateString);
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerPage() {
  const { 
    customers, 
    customerStats: apiStats, 
    isCustomersLoading: loading, 
    customersError: error,
    setCustomerData,
    setCustomersLoading,
    setCustomersError,
    setCustomers,
    totalCustomers
  } = useAdminStore();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    sortBy: "newest",
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);

      const [statsData, customerResponse] = await Promise.all([
        adminService.getUserStats(),
        adminService.getCustomers(currentPage, pageSize)
      ]);

      if (customerResponse && statsData) {
        setCustomerData(customerResponse.data, statsData, customerResponse.total);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomersError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, pageSize]);

  // Filter & sort
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(term) ||
          (c.email || "").toLowerCase().includes(term) ||
          (c.phone || "").replace(/\s/g, "").includes(term.replace(/\s/g, ""))
      );
    }

    // Status
    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    // Sort
    if (filters.sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === "most-bookings") {
      result.sort((a, b) => b.totalBookings - a.totalBookings);
    } else if (filters.sortBy === "most-spent") {
      result.sort((a, b) => b.totalSpending - a.totalSpending);
    }

    return result;
  }, [customers, filters]);

  // Paginated customers are now direct from store
  const paginatedCustomers = filteredCustomers;

  // Stats
  const stats = useMemo(() => {
    if (apiStats) {
      return {
        total: apiStats.totalUsers,
        active: apiStats.activeUsers,
        banned: apiStats.blockedUsers,
        thisMonth: apiStats.newUsersLastMonth,
      };
    }
    

    const total = customers.length;
    const active = customers.filter((c) => c.status === "ACTIVE").length;
    const banned = customers.filter((c) => c.status === "BLOCKED").length;
    const thisMonth = customers.filter((c) => {
      const created = new Date(c.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, active, banned, thisMonth };
  }, [customers, apiStats]);


  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", sortBy: "newest" });
    setCurrentPage(1);
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleToggleStatus = async (customer: Customer) => {
    if (togglingId) return;
    
    const isBlocking = customer.status === "ACTIVE";
    const newStatus = isBlocking ? "BLOCKED" : "ACTIVE";
    const apiStatus = isBlocking ? "BLOCKED" : "ACTIVE";
    
    setTogglingId(customer.id);
    try {
      await adminService.updateUserStatus(customer.id, apiStatus);
      
      setCustomers(
        customers.map((c) => (c.id === customer.id ? { ...c, status: newStatus as "ACTIVE" | "BLOCKED" } : c))
      );
      
      toast.success(`${isBlocking ? "Khóa" : "Mở khóa"} tài khoản thành công`);
      
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer({ ...selectedCustomer, status: newStatus as "ACTIVE" | "BLOCKED" });
      }
    } catch (error: any) {
      toast.error(error.message || `Không thể ${isBlocking ? "khóa" : "mở khóa"} tài khoản`);
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Stat Cards ─────────────────────────────────────────────────────────────

const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const statCards = [
    {
      title: "Tổng khách hàng",
      value: formatNumber(stats.total),
      icon: Users,
      description: "Tổng số người dùng",
      gradient: "from-[#006241] to-[#00754A]",
      bgTint: "bg-card",
      border: "border-border",
    },
    {
      title: "Khách hàng mới",
      value: formatNumber(stats.thisMonth),
      description: apiStats ? "Trong 7 ngày qua" : "Trong tháng này",
      icon: UserPlus,
      gradient: "from-[#1E3932] to-[#2b5148]",
      bgTint: "bg-white",
      border: "border-[#d4e9e2]",
    },
    {
      title: "Đang hoạt động",
      value: formatNumber(stats.active),
      icon: UserCheck,
      description: "Tài khoản khả dụng",
      gradient: "from-[#00754A] to-[#006241]",
      bgTint: "bg-white",
      border: "border-[#d4e9e2]",
    },
    {
      title: "Đã khóa",
      value: formatNumber(stats.banned),
      icon: ShieldBan,
      gradient: "from-[#c82014] to-[#e05a4a]",
      bgTint: "bg-white",
      border: "border-[#ffd4d4]",
    },
  ];

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu khách hàng...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center rounded-2xl p-6 md:px-8 md:py-6 gap-4" style={{ backgroundColor: '#1E3932', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)' }}>
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3" style={{ color: '#ffffff', letterSpacing: '-0.16px' }}>
            <Users className="w-5 h-5 md:w-6 md:h-6" />
            Quản lý Khách hàng
          </h1>
          <p className="mt-1 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Tìm thấy {stats.total} khách hàng
          </p>
          {error && <p className="text-red-300 text-[10px] md:text-xs mt-1">Lỗi kết nối: {error}</p>}
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button onClick={fetchCustomers} size="sm" className="gap-2 text-xs transition-all duration-200 active:scale-95" style={{ borderRadius: '50px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}>
            <RefreshCw size={14} className="md:w-4 md:h-4" />
            Làm mới
          </Button>
          <Button size="sm" className="gap-2 text-xs transition-all duration-200 active:scale-95" style={{ borderRadius: '50px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}>
            <Download size={14} className="md:w-4 md:h-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <AdminStatCard
              key={i || card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.description}
              iconGradient={card.gradient}
              bgTint={card.bgTint}
              borderColor={card.border}
            />
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="p-5 admin-content-card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 h-11 bg-muted border-border focus:bg-card text-foreground"
              />
          </div>
          {/* Status */}
          <Select value={filters.status || "all"} onValueChange={(val) => handleFilterChange("status", val === "all" ? "" : val)}>
            <SelectTrigger className="h-11 min-w-[160px] border-border bg-muted text-foreground">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="BANNED">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={(val) => handleFilterChange("sortBy", val)}>
            <SelectTrigger className="h-11 min-w-[180px] border-border bg-muted text-foreground">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="most-bookings">Nhiều booking nhất</SelectItem>
              <SelectItem value="most-spent">Chi tiêu nhiều nhất</SelectItem>
            </SelectContent>
          </Select>
          {/* Clear */}
          {(filters.search || filters.status || filters.sortBy !== "newest") && (
            <Button variant="ghost" onClick={clearFilters} className="h-11 text-muted-foreground hover:text-foreground/80 hover:bg-red-300 bg-red-100">
              <X size={16} className="mr-1" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden admin-content-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/80 border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chi tiêu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
               
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCustomers.map((customer) => {
                const statusKey = (customer.status || "ACTIVE").toUpperCase() as keyof typeof statusConfig;
                const config = statusConfig[statusKey] || statusConfig.ACTIVE;
                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(customer)}
                  >
                    {/* Customer info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(customer.id)} flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <span className="text-white text-sm font-semibold">
                            {getInitials(customer.name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{customer.name}</p>
                          <p className="text-xs text-gray-400">
                            Tham gia {formatDate(customer.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    {/* Bookings count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg px-3 py-1.5 bg-primary/10 dark:bg-primary/20">
                          <span className="text-sm font-bold text-primary">{customer.totalBookings}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">lượt</span>
                      </div>
                    </td>
                    {/* Total spent */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(customer.totalSpending)}
                      </p>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
                        {config.label}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ">
                            <MoreVertical size={16} className="text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDetail(customer)}>
                            <Eye size={16} className="mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(customer)}
                            className={customer.status === "ACTIVE" ? "text-red-600" : "text-green-600"}
                            disabled={togglingId === customer.id}
                          >
                            {togglingId === customer.id ? (
                              <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : customer.status === "ACTIVE" ? (
                              <Ban size={16} className="mr-2 cursor-pointer" />
                            ) : (
                              <CheckCircle size={16} className="mr-2 cursor-pointer" />
                            )}
                            {customer.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
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

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-card">
            <div className="text-sm text-muted-foreground">
              Hiển thị <span className="font-medium text-foreground">{Math.min(totalCustomers, (currentPage - 1) * pageSize + 1)}-{Math.min(totalCustomers, currentPage * pageSize)}</span> trong <span className="font-medium text-foreground">{totalCustomers}</span> khách hàng
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
                const totalPages = Math.ceil(totalCustomers / pageSize);
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
                onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalCustomers / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(totalCustomers / pageSize)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-muted rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy khách hàng</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để có kết quả phù hợp hơn
            </p>
            <Button onClick={clearFilters} variant="outline">
              Xóa tất cả bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* ─── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết khách hàng</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 mt-2">
              {/* Profile header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-muted">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(selectedCustomer.id)} flex items-center justify-center shadow-md`}
                >
                  <span className="text-white text-xl font-bold">
                    {getInitials(selectedCustomer.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Tham gia từ {formatDate(selectedCustomer.createdAt)}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${(statusConfig[(selectedCustomer.status || "ACTIVE").toUpperCase() as keyof typeof statusConfig] || statusConfig.ACTIVE).className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${(statusConfig[(selectedCustomer.status || "ACTIVE").toUpperCase() as keyof typeof statusConfig] || statusConfig.ACTIVE).dot} mr-1.5 inline-block`} />
                    {(statusConfig[(selectedCustomer.status || "ACTIVE").toUpperCase() as keyof typeof statusConfig] || statusConfig.ACTIVE).label}
                  </Badge>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail size={18} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-foreground">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Phone size={18} className="text-green-500" />
                  <div>
                    <p className="text-xs text-gray-400">Số điện thoại</p>
                    <p className="text-sm font-medium text-foreground">{selectedCustomer.phone}</p>
                  </div>
                </div>
                {selectedCustomer.address && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg sm:col-span-2">
                    <MapPin size={18} className="text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-400">Địa chỉ</p>
                      <p className="text-sm font-medium text-foreground">{selectedCustomer.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 rounded-xl bg-muted">
                  <Car className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-primary">{selectedCustomer.totalBookings}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">Tổng booking</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedCustomer.totalSpending)}</p>
                  <p className="text-xs text-green-500 dark:text-green-400">Đã chi tiêu</p>
                </div>
                {/* <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-purple-700 mt-1">{timeAgo(selectedCustomer.lastActive)}</p>
                  <p className="text-xs text-purple-500">Hoạt động cuối</p>
                </div> */}
              </div>

              {/* Recent bookings */}
              {selectedCustomer.recentBookings && selectedCustomer.recentBookings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-3">
                    Booking gần đây
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{booking.parkingLotName}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(booking.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <Badge className={`text-xs ${bookingStatusColors[booking.status] || "bg-muted text-foreground/80"}`}>
                            {bookingStatusLabels[booking.status] || booking.status}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(booking.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-border cursor-pointer">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Đóng
                </Button>
                <Button
                  onClick={() => handleToggleStatus(selectedCustomer)}
                  disabled={togglingId === selectedCustomer.id}
                  className={
                    selectedCustomer.status === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }
                >
                  {togglingId === selectedCustomer.id ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : selectedCustomer.status === "ACTIVE" ? (
                    <Ban size={16} className="mr-2 cursor-pointer" />
                  ) : (
                    <CheckCircle size={16} className="mr-2 cursor-pointer" />
                  )}
                  {selectedCustomer.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
