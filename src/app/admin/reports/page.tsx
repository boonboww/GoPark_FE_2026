"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Car,
  Calendar,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  ParkingSquare,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  MonthlyRevenue,
  ParkingLotRevenue,
  RevenueSource,
  DailyRevenue,
  RecentTransaction,
} from "@/services/admin.service";
import { useAdminStore } from "@/stores";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

// ─── Kiểu dữ liệu ───────────────────────────────────────────────────────────
 
 

/** Giao dịch gần đây */


// ─── Hằng số ──────────────────────────────────────────────────────────────────

/** Khoảng thời gian lọc */
const PERIODS = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "this_month", label: "Tháng này" },
  { value: "last_month", label: "Tháng trước" },
  { value: "this_quarter", label: "Quý này" },
  { value: "this_year", label: "Năm nay" },
];

/** Màu cho biểu đồ tròn */
const PIE_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981", "#EC4899"];

// ─── Dữ liệu mẫu ────────────────────────────────────────────────────────────

/** Doanh thu 12 tháng */
const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: "T1", bookingRevenue: 45000000, subscriptionRevenue: 5000000, penaltyRevenue: 2000000, totalRevenue: 52000000, refunds: 3200000, netRevenue: 48800000 },
  { month: "T2", bookingRevenue: 38000000, subscriptionRevenue: 4500000, penaltyRevenue: 1800000, totalRevenue: 44300000, refunds: 2800000, netRevenue: 41500000 },
  { month: "T3", bookingRevenue: 52000000, subscriptionRevenue: 6200000, penaltyRevenue: 2500000, totalRevenue: 60700000, refunds: 4100000, netRevenue: 56600000 },
  { month: "T4", bookingRevenue: 48000000, subscriptionRevenue: 5800000, penaltyRevenue: 2200000, totalRevenue: 56000000, refunds: 3600000, netRevenue: 52400000 },
  { month: "T5", bookingRevenue: 55000000, subscriptionRevenue: 7000000, penaltyRevenue: 2800000, totalRevenue: 64800000, refunds: 4500000, netRevenue: 60300000 },
  { month: "T6", bookingRevenue: 62000000, subscriptionRevenue: 7500000, penaltyRevenue: 3000000, totalRevenue: 72500000, refunds: 5000000, netRevenue: 67500000 },
  { month: "T7", bookingRevenue: 70000000, subscriptionRevenue: 8200000, penaltyRevenue: 3500000, totalRevenue: 81700000, refunds: 5800000, netRevenue: 75900000 },
  { month: "T8", bookingRevenue: 68000000, subscriptionRevenue: 8000000, penaltyRevenue: 3200000, totalRevenue: 79200000, refunds: 5400000, netRevenue: 73800000 },
  { month: "T9", bookingRevenue: 58000000, subscriptionRevenue: 7200000, penaltyRevenue: 2600000, totalRevenue: 67800000, refunds: 4200000, netRevenue: 63600000 },
  { month: "T10", bookingRevenue: 65000000, subscriptionRevenue: 8500000, penaltyRevenue: 3100000, totalRevenue: 76600000, refunds: 5200000, netRevenue: 71400000 },
  { month: "T11", bookingRevenue: 72000000, subscriptionRevenue: 9000000, penaltyRevenue: 3600000, totalRevenue: 84600000, refunds: 6000000, netRevenue: 78600000 },
  { month: "T12", bookingRevenue: 80000000, subscriptionRevenue: 10000000, penaltyRevenue: 4000000, totalRevenue: 94000000, refunds: 6800000, netRevenue: 87200000 },
];

/** Doanh thu 7 ngày gần nhất */
const mockDailyRevenue: DailyRevenue[] = [
  { date: "07/03", revenue: 2800000, bookings: 45 },
  { date: "08/03", revenue: 3200000, bookings: 52 },
  { date: "09/03", revenue: 2500000, bookings: 38 },
  { date: "10/03", revenue: 3800000, bookings: 61 },
  { date: "11/03", revenue: 4200000, bookings: 68 },
  { date: "12/03", revenue: 3600000, bookings: 55 },
  { date: "13/03", revenue: 4500000, bookings: 72 },
];

/** Top bãi đỗ doanh thu cao nhất */
const mockTopParkingLots: ParkingLotRevenue[] = [
  { name: "Bãi đỗ xe Bitexco", revenue: 170000000, bookings: 6800, percentage: 22.5 },
  { name: "ParkSmart Quận 1", revenue: 112000000, bookings: 5600, percentage: 14.8 },
  { name: "Bãi đỗ xe Royal City", revenue: 67500000, bookings: 4500, percentage: 8.9 },
  { name: "Vincom Đồng Khởi", revenue: 57600000, bookings: 3200, percentage: 7.6 },
  { name: "Times City", revenue: 22800000, bookings: 1520, percentage: 3.0 },
  { name: "Lotte Mart Q7", revenue: 7840000, bookings: 980, percentage: 1.0 },
];

/** Phân bổ doanh thu theo nguồn */
const mockRevenueSources: RevenueSource[] = [
  { name: "Đặt chỗ đỗ xe", value: 713000000, color: "#3B82F6" },
  { name: "Gói dịch vụ", value: 86900000, color: "#8B5CF6" },
  { name: "Phạt đỗ quá giờ", value: 34300000, color: "#F59E0B" },
];

/** Giao dịch gần đây */
const mockRecentTransactions: RecentTransaction[] = [
  { _id: "rt1", description: "Thanh toán đặt chỗ - Bãi Bitexco", amount: 350000, type: "income", time: "14:30" },
  { _id: "rt2", description: "Nạp tiền ví - Nguyễn Văn Anh", amount: 500000, type: "income", time: "14:15" },
  { _id: "rt3", description: "Hoàn tiền booking #BK-045", amount: 120000, type: "expense", time: "13:50" },
  { _id: "rt4", description: "Gói quảng cáo - Bãi Bitexco", amount: 990000, type: "income", time: "13:20" },
  { _id: "rt5", description: "Thanh toán đặt chỗ - Royal City", amount: 200000, type: "income", time: "12:45" },
  { _id: "rt6", description: "Phạt đỗ quá giờ - Vạn Hạnh Mall", amount: 50000, type: "income", time: "12:10" },
  { _id: "rt7", description: "Rút tiền - Phạm Đức Duy", amount: 5000000, type: "expense", time: "11:30" },
  { _id: "rt8", description: "Thanh toán đặt chỗ - Vincom Q1", amount: 250000, type: "income", time: "11:00" },
];

// ─── Hàm tiện ích ─────────────────────────────────────────────────────────────

/** Định dạng tiền tệ VND */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

/** Định dạng tiền rút gọn */
const formatCompactCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", notation: "compact", maximumFractionDigits: 1 }).format(amount);

/** Định dạng số */
const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

/** Custom tooltip cho biểu đồ */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
        <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCompactCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Component chính ──────────────────────────────────────────────────────────

export default function RevenueReportPage() {
  const {
    monthlyRevenue,
    dailyRevenue,
    topParkingLots,
    revenueSources,
    recentTransactions,
    isReportsLoading: loading,
    setReportsData,
    setReportsLoading,
    setReportsError,
  } = useAdminStore();

  const [period, setPeriod] = useState("this_year");

  // ── Tải dữ liệu ────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setReportsLoading(true);
    try {
      // TODO: Gọi API thực tế
      await new Promise((res) => setTimeout(res, 600));
      setReportsData(
        mockMonthlyRevenue,
        mockDailyRevenue,
        mockTopParkingLots,
        mockRevenueSources,
        mockRecentTransactions
      );
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu báo cáo:", err);
      setReportsError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  };

  useEffect(() => {
    if (monthlyRevenue.length === 0) {
      fetchData();
    }
  }, [period]);

  // ── Tính toán thống kê ──────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.totalRevenue, 0);
    const totalRefunds = monthlyRevenue.reduce((s, m) => s + m.refunds, 0);
    const netRevenue = monthlyRevenue.reduce((s, m) => s + m.netRevenue, 0);
    const totalBookingRevenue = monthlyRevenue.reduce((s, m) => s + m.bookingRevenue, 0);

    // So sánh tháng hiện tại vs tháng trước
    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
    const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
    const revenueGrowth = currentMonth && prevMonth
      ? ((currentMonth.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue * 100).toFixed(1)
      : "0";

    const todayRevenue = dailyRevenue.length > 0 ? dailyRevenue[dailyRevenue.length - 1].revenue : 0;
    const todayBookings = dailyRevenue.length > 0 ? dailyRevenue[dailyRevenue.length - 1].bookings : 0;

    return { totalRevenue, totalRefunds, netRevenue, totalBookingRevenue, revenueGrowth, todayRevenue, todayBookings };
  }, [monthlyRevenue, dailyRevenue]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải báo cáo doanh thu...</p>
        </div>
      </div>
    );
  }

  // ── Giao diện ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Tiêu đề + chọn khoảng thời gian ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl px-8 py-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            Báo cáo Doanh thu
          </h1>
          <p className="text-primary-foreground/70 mt-1 text-sm">Thống kê tổng quan doanh thu hệ thống GoPark</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* Bộ chọn khoảng thời gian */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-10 border-white/30 rounded-lg bg-white/20 text-white text-sm focus:ring-white/40 backdrop-blur-sm shadow-none">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md">
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchData} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-none gap-2">
            <RefreshCw size={16} />Làm mới
          </Button>
          <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-none gap-2">
            <Download size={16} />Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* ── Thẻ thống kê tổng quan ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng doanh thu */}
        <AdminStatCard
          title="Tổng doanh thu (Tháng)"
          value={formatCompactCurrency(summary.totalRevenue)}
          icon={TrendingUp}
          change={`${Number(summary.revenueGrowth) >= 0 ? "+" : ""}${Math.abs(Number(summary.revenueGrowth))}%`}
          changeType={Number(summary.revenueGrowth) >= 0 ? "positive" : "negative"}
          description="so với tháng trước"
          iconGradient="from-blue-500 to-indigo-600"
          bgTint="from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
          borderColor="border-blue-100 dark:border-blue-900/50"
        />

        {/* Doanh thu ròng */}
        <AdminStatCard
          title="Doanh thu ròng"
          value={formatCompactCurrency(summary.netRevenue)}
          icon={DollarSign}
          description="Đã trừ hoàn tiền"
          iconGradient="from-emerald-500 to-teal-600"
          bgTint="from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
          borderColor="border-emerald-100 dark:border-emerald-900/50"
        />

        {/* Doanh thu hôm nay */}
        <AdminStatCard
          title="Tổng đơn đặt"
          value={formatNumber(summary.todayBookings)}
          icon={Calendar}
          change="Hôm nay"
          changeType="positive"
          iconGradient="from-violet-500 to-purple-600"
          bgTint="from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20"
          borderColor="border-violet-100 dark:border-violet-900/50"
        />

        {/* Tổng hoàn tiền */}
        <AdminStatCard
          title="Tổng hoàn tiền"
          value={formatCompactCurrency(summary.totalRefunds)}
          icon={ArrowDownRight}
          description="Các giao dịch lỗi/hủy"
          iconGradient="from-amber-500 to-orange-600"
          bgTint="from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
          borderColor="border-amber-100 dark:border-amber-900/50"
        />
      </div>

      {/* ── Biểu đồ doanh thu theo tháng (AreaChart) ──────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Doanh thu theo tháng</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Biểu đồ phân tích doanh thu hệ thống trong năm</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" />Đặt chỗ</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-500" />Gói dịch vụ</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" />Phạt</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBooking" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSubscription" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPenalty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bookingRevenue" name="Đặt chỗ" stackId="1" stroke="#3B82F6" fill="url(#gradBooking)" strokeWidth={2} />
              <Area type="monotone" dataKey="subscriptionRevenue" name="Gói dịch vụ" stackId="1" stroke="#8B5CF6" fill="url(#gradSubscription)" strokeWidth={2} />
              <Area type="monotone" dataKey="penaltyRevenue" name="Phạt" stackId="1" stroke="#F59E0B" fill="url(#gradPenalty)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── 2 cột: Biểu đồ tròn + Doanh thu 7 ngày ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Phân bổ doanh thu theo nguồn */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <PieChartIcon size={18} className="text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">Phân bổ doanh thu</h3>
            </div>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={revenueSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                  >
                    {revenueSources.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                {revenueSources.map((source) => {
                  const total = revenueSources.reduce((s, r) => s + r.value, 0);
                  const pct = ((source.value / total) * 100).toFixed(1);
                  return (
                    <div key={source.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm text-foreground/80">
                          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: source.color }} />
                          {source.name}
                        </span>
                        <span className="text-sm font-bold text-foreground">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: source.color }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatCompactCurrency(source.value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doanh thu 7 ngày gần nhất */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">7 ngày gần nhất</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyRevenue} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}Tr`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Ngày ${label}`} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            {/* Tổng 7 ngày */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng 7 ngày</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCompactCurrency(dailyRevenue.reduce((s, d) => s + d.revenue, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2 cột: Top bãi đỗ + Giao dịch gần đây ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top bãi đỗ doanh thu cao nhất */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ParkingSquare size={18} className="text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">Top bãi đỗ doanh thu</h3>
              </div>
              <Badge variant="outline" className="text-xs">Top {topParkingLots.length}</Badge>
            </div>
            <div className="space-y-3">
              {topParkingLots.map((lot, index) => (
                <div key={lot.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  {/* Hạng */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-gray-200 text-foreground/80" :
                    index === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{lot.name}</p>
                    <p className="text-xs text-gray-400">{formatNumber(lot.bookings)} bookings</p>
                  </div>
                  {/* Doanh thu + phần trăm */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatCompactCurrency(lot.revenue)}</p>
                    <p className="text-xs text-blue-600">{lot.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Giao dịch gần đây */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">Giao dịch gần đây</h3>
              </div>
              <Badge variant="outline" className="text-xs">Hôm nay</Badge>
            </div>
            <div className="space-y-1">
              {recentTransactions.map((txn) => (
                <div key={txn._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                  {/* Icon loại */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    txn.type === "income" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {txn.type === "income" ?
                      <ArrowUpRight className="w-4 h-4 text-green-600" /> :
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  {/* Mô tả */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80 truncate">{txn.description}</p>
                    <p className="text-xs text-gray-400">{txn.time}</p>
                  </div>
                  {/* Số tiền */}
                  <span className={`text-sm font-bold flex-shrink-0 ${txn.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {txn.type === "income" ? "+" : "−"}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Biểu đồ so sánh doanh thu vs hoàn tiền ───────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Doanh thu ròng vs Hoàn tiền</h3>
              <p className="text-sm text-muted-foreground mt-0.5">So sánh doanh thu ròng và hoàn tiền qua từng tháng</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />Doanh thu ròng</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" />Hoàn tiền</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="netRevenue" name="Doanh thu ròng" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: "#10B981" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="refunds" name="Hoàn tiền" stroke="#F87171" strokeWidth={2} dot={{ r: 3, fill: "#F87171" }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Bảng tổng hợp theo tháng ──────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">Bảng tổng hợp doanh thu theo tháng</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/80 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Tháng</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Đặt chỗ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Gói DV</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Phạt</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Tổng</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Hoàn tiền</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Doanh thu ròng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyRevenue.map((row) => (
                  <tr key={row.month} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{row.month}/2026</td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCompactCurrency(row.bookingRevenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-violet-600">{formatCompactCurrency(row.subscriptionRevenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-amber-600">{formatCompactCurrency(row.penaltyRevenue)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{formatCompactCurrency(row.totalRevenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-500">−{formatCompactCurrency(row.refunds)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">{formatCompactCurrency(row.netRevenue)}</td>
                  </tr>
                ))}
              </tbody>
              {/* Tổng cộng */}
              <tfoot>
                <tr className="bg-muted border-t-2 border-border">
                  <td className="px-4 py-3 text-sm font-bold text-foreground">Tổng cộng</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-blue-700">
                    {formatCompactCurrency(monthlyRevenue.reduce((s, m) => s + m.bookingRevenue, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-violet-700">
                    {formatCompactCurrency(monthlyRevenue.reduce((s, m) => s + m.subscriptionRevenue, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-amber-700">
                    {formatCompactCurrency(monthlyRevenue.reduce((s, m) => s + m.penaltyRevenue, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-foreground">
                    {formatCompactCurrency(summary.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                    −{formatCompactCurrency(summary.totalRefunds)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                    {formatCompactCurrency(summary.netRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
