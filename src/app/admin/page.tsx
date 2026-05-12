"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  MapPin,
  Receipt,
  TrendingUp,
  Server,
  Database,
  CreditCard,
  Bell,
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Clock,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

import {
  adminService,
  type AdminStats,
  type AdminActivity,
  type SystemStatus,
} from "@/services/admin.service";

import RoleGuard from "@/components/RoleGuard";
import { useAdminStore } from "@/stores";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

const MOCK_SYSTEM_STATUS: SystemStatus = {
  apiService: { status: "healthy", message: "Hoạt động bình thường" },
  database: { status: "healthy", message: "Kết nối ổn định" },
  paymentGateway: {
    status: "healthy",
    message: "Cổng thanh toán MoMo & ZaloPay",
  },
  notification: { status: "healthy", message: "Hệ thống Push Notification" },
};

export default function AdminDashboard() {
  const {
    overviewStats: stats,
    recentActivities: activities,
    systemStatus,
    isDashboardLoading: loading,
    dashboardError: error,
    setDashboardData,
    setDashboardLoading,
    setDashboardError,
  } = useAdminStore();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalActivities, setTotalActivities] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredActivities = activities.filter((activity) => {
    if (!activity) return false;

    // Safely access properties with optional chaining and fallback to empty string
    const content = activity.content || "";
    const username = activity.username || "";
    const type = activity.type || "";
    const status = activity.status || "";

    const matchesSearch =
      content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || type.toLowerCase() === typeFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const displayTotal =
    totalActivities > 0 ? totalActivities : filteredActivities.length;
  const totalPages = Math.ceil(displayTotal / itemsPerPage);

  // If backend paginates, we might not need to slice, but we slice just in case the backend returns all items.
  const currentActivities =
    totalActivities > 0
      ? filteredActivities
      : filteredActivities.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );

  const fetchData = async () => {
    try {
      setDashboardLoading(true);

      // Fetch all data using adminService
      const [statsData, activitiesResponse, statusData] = await Promise.all([
        adminService.getOverviewStats(),
        adminService.getRecentActivities(currentPage, itemsPerPage),
        adminService.getSystemStatus().catch(() => null), // Optional, fallback handled below
      ]);

      const activitiesData = activitiesResponse.data || [];
      setTotalActivities(activitiesResponse.total || activitiesData.length);

      setDashboardData(
        statsData,
        activitiesData,
        statusData || MOCK_SYSTEM_STATUS,
      );
    } catch (err: any) {
      console.error("Fetch error:", err);
      setDashboardError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const statCards = [
    {
      title: "Tổng người dùng",
      value: formatNumber(stats?.totalUsers || 0),
      change: `${(stats?.userChangePercent as number) >= 0 ? "+" : ""}${stats?.userChangePercent || 0}%`,
      changeType:
        (stats?.userChangePercent || 0) >= 0 ? "positive" : "negative",
      icon: Users,
      description: "So với tháng trước",
      iconGradient: "from-blue-500 to-indigo-600",
      bgTint:
        "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
      borderColor: "border-blue-100 dark:border-blue-900/50",
      accentColor: "text-primary",
    },
    {
      title: "Bãi đỗ xe",
      value: formatNumber(stats?.totalParkingLots || 0),
      change: `+${stats?.newParkingLotsThisMonth || 0}`,
      changeType: "positive",
      icon: MapPin,
      description: "Bãi mới trong tháng",
      iconGradient: "from-emerald-500 to-teal-600",
      bgTint:
        "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
      borderColor: "border-emerald-100 dark:border-emerald-900/50",
      accentColor: "text-emerald-600",
    },
    {
      title: "Đặt chỗ hôm nay",
      value: formatNumber(stats?.todayBookings || 0),
      change: `${(stats?.bookingChangePercent as number) >= 0 ? "+" : ""}${stats?.bookingChangePercent || 0}%`,
      changeType:
        (stats?.bookingChangePercent || 0) >= 0 ? "positive" : "negative",
      icon: Receipt,
      description: "So với hôm qua",
      iconGradient: "from-violet-500 to-purple-600",
      bgTint:
        "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
      borderColor: "border-violet-100 dark:border-violet-900/50",
      accentColor: "text-violet-600",
    },
    {
      title: "Doanh thu tháng",
      value: formatCurrency(stats?.thisMonthRevenue || 0),
      change: `${(stats?.revenueChangePercent as number) >= 0 ? "+" : ""}${stats?.revenueChangePercent || 0}%`,
      changeType:
        (stats?.revenueChangePercent || 0) >= 0 ? "positive" : "negative",
      icon: TrendingUp,
      description: "So với tháng trước",
      iconGradient: "from-amber-500 to-orange-600",
      bgTint:
        "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
      borderColor: "border-amber-100 dark:border-amber-900/50",
      accentColor: "text-amber-600",
    },
  ];

  return (
    <RoleGuard allowedRole="admin">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải dashboard admin...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Lỗi server không hoạt động
            </h3>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-primary via-primary/95 to-primary/90 rounded-2xl p-6 md:px-8 md:py-6 shadow-lg gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Dashboard Admin
              </h1>
              <p className="text-primary-foreground/70 mt-1 text-xs md:text-sm">
                Tổng quan hệ thống GoPark
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Badge className="bg-amber-400/15 text-amber-300 border border-amber-400/30 backdrop-blur-sm px-2.5 py-1 md:px-3 md:py-1 text-[10px] md:text-xs">
                <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-red-500/80" />
                {stats?.pendingApprovals || 0} chờ duyệt
              </Badge>
              <Button
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-none text-xs h-8 md:h-9"
              >
                Xuất báo cáo
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <AdminStatCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  change={card.change}
                  changeType={card.changeType as "positive" | "negative"}
                  description={card.description}
                  iconGradient={card.iconGradient}
                  bgTint={card.bgTint}
                  borderColor={card.borderColor}
                />
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Activities */}
            <Card className="lg:col-span-2 border-border dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="pb-3 px-6 pt-6 mb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary/80 rounded-full" />
                    <CardTitle className="text-lg font-bold text-foreground dark:text-slate-100 uppercase tracking-wide">
                      Hoạt động hệ thống
                    </CardTitle>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Tìm kiếm..."
                        className="h-9 pl-9 text-sm w-[180px] md:w-[240px] border-border dark:border-slate-700 focus-visible:ring-primary/30 bg-muted dark:bg-slate-800 text-foreground"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>

                    {(searchTerm ||
                      typeFilter !== "all" ||
                      statusFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        onClick={() => {
                          setSearchTerm("");
                          setTypeFilter("all");
                          setStatusFilter("all");
                          setCurrentPage(1);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="rounded-xl border border-border dark:border-slate-800 overflow-x-auto bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
                  <Table>
                    <TableHeader className="bg-muted/50 dark:bg-slate-800/50">
                      <TableRow className="hover:bg-transparent border-border dark:border-slate-800">
                        <TableHead className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider h-10">
                          Loại
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider h-10 w-[40%]">
                          Hoạt động
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider h-10">
                          Người thực hiện
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider h-10">
                          Thời gian
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider h-10 text-right">
                          Trạng thái
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentActivities.length > 0 ? (
                        currentActivities.map((activity) => {
                          let Icon = Activity;
                          let colorClass = "blue";

                          const activityType = activity.type.toLowerCase();

                          switch (true) {
                            case activityType.includes("user"):
                              Icon = UserPlus;
                              colorClass = "indigo";
                              break;
                            case activityType.includes("parking"):
                              Icon = MapPin;
                              colorClass = "emerald";
                              break;
                            case activityType.includes("wallet") ||
                              activityType.includes("payment"):
                              Icon = CreditCard;
                              colorClass = "amber";
                              break;
                            case activityType.includes("booking"):
                              Icon = Receipt;
                              colorClass = "blue";
                              break;
                            case activityType.includes("system"):
                              Icon = Settings;
                              colorClass = "rose";
                              break;
                            default:
                              Icon = Activity;
                              colorClass = "blue";
                              break;
                          }

                          const statusConfig = {
                            success: {
                              label: "Thành công",
                              class:
                                "text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50",
                            },
                            warning: {
                              label: "Cảnh báo",
                              class:
                                "text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50",
                            },
                            error: {
                              label: "Lỗi",
                              class:
                                "text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50",
                            },
                          };

                          const currentStatus =
                            statusConfig[activity.status] ||
                            statusConfig.success;

                          return (
                            <TableRow
                              key={activity.id}
                              className="hover:bg-muted/50 dark:hover:bg-slate-800/30 border-border dark:border-slate-800 transition-colors group"
                            >
                              <TableCell className="py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border dark:border-slate-800 group-hover:scale-110 transition-transform duration-300`}
                                  >
                                    <Icon
                                      className={`w-4 h-4 text-${colorClass}-500`}
                                    />
                                  </div>
                                  <span className="text-[11px] font-bold uppercase text-slate-400 group-hover:text-muted-foreground transition-colors tracking-tight">
                                    {activity.type}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <p className="text-sm font-bold text-foreground/80 dark:text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">
                                  {activity.content}
                                </p>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-border dark:border-slate-700 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-slate-400" />
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                                    {activity.username}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <Clock className="w-3.5 h-3.5 opacity-60" />
                                  <span className="text-xs font-medium whitespace-nowrap">
                                    {activity.time}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-right">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] uppercase font-bold px-2 py-0.5 h-6 border shadow-none pointer-events-none ${currentStatus.class}`}
                                >
                                  {currentStatus.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="w-12 h-12 bg-muted dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                <Activity className="w-6 h-6 text-slate-300 dark:text-foreground/80" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground/80 dark:text-slate-200">
                                  Không tìm thấy dữ liệu
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Thử thay đổi bộ lọc hoặc tìm kiếm khác
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {displayTotal > 0 && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border dark:border-slate-800">
                    <div className="text-sm text-muted-foreground dark:text-slate-400">
                      Hiển thị{" "}
                      <span className="font-medium text-foreground dark:text-white">
                        {Math.min(
                          displayTotal,
                          (currentPage - 1) * itemsPerPage + 1,
                        )}
                        -{Math.min(displayTotal, currentPage * itemsPerPage)}
                      </span>{" "}
                      trong{" "}
                      <span className="font-medium text-foreground dark:text-white">
                        {displayTotal}
                      </span>{" "}
                      kết quả
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 mr-2 md:mr-4 border-r border-border dark:border-slate-700 pr-2 md:pr-4">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">
                          Dòng mỗi trang:
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(val) => {
                            setItemsPerPage(Number(val));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[70px] bg-muted dark:bg-slate-800 border-border dark:border-slate-700 text-sm shadow-none">
                            <SelectValue placeholder="5" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 bg-card dark:bg-slate-800 border-border dark:border-slate-700"
                      >
                        <ChevronLeft className="w-4 h-4 text-muted-foreground dark:text-slate-300" />
                      </Button>

                      {(() => {
                        const pages = [];
                        for (let i = 1; i <= totalPages; i++) {
                          if (
                            i === 1 ||
                            i === totalPages ||
                            (i >= currentPage - 1 && i <= currentPage + 1)
                          ) {
                            pages.push(i);
                          } else if (
                            i === currentPage - 2 ||
                            i === currentPage + 2
                          ) {
                            pages.push("...");
                          }
                        }

                        return pages
                          .filter(
                            (p, idx, arr) =>
                              p !== "..." || arr[idx - 1] !== "...",
                          )
                          .map((page, idx) =>
                            typeof page === "number" ? (
                              <Button
                                key={idx}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 p-0 text-sm ${
                                  currentPage === page
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                                    : "bg-card dark:bg-slate-800 text-muted-foreground dark:text-slate-300 border-border dark:border-slate-700 hover:bg-muted dark:hover:bg-slate-700"
                                }`}
                              >
                                {page}
                              </Button>
                            ) : (
                              <span
                                key={idx}
                                className="text-slate-400 dark:text-muted-foreground px-1"
                              >
                                ...
                              </span>
                            ),
                          );
                      })()}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage >= totalPages || totalPages === 0}
                        className="h-8 w-8 p-0 bg-card dark:bg-slate-800 border-border dark:border-slate-700"
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-slate-300" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-border dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                  <CardTitle className="text-base font-bold text-foreground dark:text-slate-100">
                    Trạng thái hệ thống
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3.5">
                  {systemStatus &&
                    Object.entries(systemStatus).map(([key, service]) => {
                      let ServiceIcon = Server;
                      let iconBgGradient =
                        "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700";
                      let iconColor =
                        "text-muted-foreground dark:text-slate-400";

                      if (key.toLowerCase().includes("database")) {
                        ServiceIcon = Database;
                        iconBgGradient = "from-violet-500 to-purple-600";
                        iconColor = "text-white";
                      } else if (key.toLowerCase().includes("payment")) {
                        ServiceIcon = CreditCard;
                        iconBgGradient = "from-amber-500 to-orange-600";
                        iconColor = "text-white";
                      } else if (key.toLowerCase().includes("notification")) {
                        ServiceIcon = Bell;
                        iconBgGradient = "from-pink-500 to-rose-600";
                        iconColor = "text-white";
                      } else if (key.toLowerCase().includes("api")) {
                        ServiceIcon = Activity;
                        iconBgGradient = "from-blue-500 to-indigo-600";
                        iconColor = "text-white";
                      }

                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 group ${
                            service.status === "healthy"
                              ? "bg-card dark:bg-slate-800/40 border-border dark:border-slate-800/50 hover:border-emerald-200 dark:hover:border-emerald-900/30"
                              : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 hover:border-red-200"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBgGradient} flex items-center justify-center shadow-sm shrink-0 border border-white/10`}
                          >
                            <ServiceIcon className={`w-5 h-5 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground/80 dark:text-slate-200 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5 truncate">
                              {service.message}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight shrink-0 border ${
                              service.status === "healthy"
                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${service.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                            />
                            {service.status === "healthy" ? "Tốt" : "Lỗi"}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
