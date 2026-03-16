"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminStats {
  totalUsers: number;
  userChangePercent: number;
  totalParkingLots: number;
  newParkingLotsThisMonth: number;
  todayBookings: number;
  bookingChangePercent: number;
  thisMonthRevenue: number;
  revenueChangePercent: number;
  pendingApprovals: number;
  activeBookings: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  user: string;
  time: string;
  status: "success" | "warning" | "error";
}

interface SystemStatus {
  apiService: { status: string; message: string };
  database: { status: string; message: string };
  paymentGateway: { status: string; message: string };
  notification: { status: string; message: string };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

import RoleGuard from "@/components/RoleGuard";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");
        console.log("Token found:", !!token);

        // Test connection first
        const testResponse = await fetch(`${API_BASE_URL}/api/v1/admin/test`);
        if (!testResponse.ok) {
          throw new Error("Cannot connect to admin API");
        }
        const testData = await testResponse.json();
        console.log("Connection test successful:", testData);

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Fetch all data
        const [statsRes, activitiesRes, statusRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/admin/dashboard/stats`, { headers }),
          fetch(`${API_BASE_URL}/api/v1/admin/dashboard/activities?limit=8`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/api/v1/admin/dashboard/system-status`, {
            headers,
          }),
        ]);

        // Helper to get error message from response
        const getErrorMessage = async (res: Response, label: string) => {
          let msg = `${label}: ${res.status}`;
          try {
            const data = await res.json();
            if (data && (data.message || data.error)) {
              msg += ` - ${data.message || data.error}`;
            }
          } catch {}
          return msg;
        };

        if (!statsRes.ok)
          throw new Error(await getErrorMessage(statsRes, "Stats"));
        if (!activitiesRes.ok)
          throw new Error(await getErrorMessage(activitiesRes, "Activities"));
        if (!statusRes.ok)
          throw new Error(await getErrorMessage(statusRes, "Status"));

        const [statsData, activitiesData, statusData] = await Promise.all([
          statsRes.json(),
          activitiesRes.json(),
          statusRes.json(),
        ]);

        setStats(statsData.data);
        setActivities(activitiesData.data);
        setSystemStatus(statusData.data);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(`Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      color: "bg-blue-500",
    },
    {
      title: "Bãi đỗ xe",
      value: formatNumber(stats?.totalParkingLots || 0),
      change: `+${stats?.newParkingLotsThisMonth || 0}`,
      changeType: "positive",
      icon: MapPin,
      description: "Bãi mới trong tháng",
      color: "bg-green-500",
    },
    {
      title: "Đặt chỗ hôm nay",
      value: formatNumber(stats?.todayBookings || 0),
      change: `${(stats?.bookingChangePercent as number) >= 0 ? "+" : ""}${stats?.bookingChangePercent || 0}%`,
      changeType:
        (stats?.bookingChangePercent || 0) >= 0 ? "positive" : "negative",
      icon: Receipt,
      description: "So với hôm qua",
      color: "bg-purple-500",
    },
    {
      title: "Doanh thu tháng",
      value: formatCurrency(stats?.thisMonthRevenue || 0),
      change: `${(stats?.revenueChangePercent as number) >= 0 ? "+" : ""}${stats?.revenueChangePercent || 0}%`,
      changeType:
        (stats?.revenueChangePercent || 0) >= 0 ? "positive" : "negative",
      icon: TrendingUp,
      description: "So với tháng trước",
      color: "bg-orange-500",
    },
  ];

  return (
    <RoleGuard allowedRole="admin">
      {/* {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dashboard admin...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Lỗi tải dữ liệu
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      ) : ( */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Admin
            </h1>
            <p className="text-gray-600 mt-1">Tổng quan hệ thống GoPark</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-200"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              {stats?.pendingApprovals || 0} chờ duyệt
            </Badge>
            <Button variant="outline" size="sm">
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {card.value}
                      </p>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs font-medium ${
                            card.changeType === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {card.change}
                        </span>
                        <span className="text-xs text-gray-500">
                          {card.description}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-center">
                {systemStatus &&
                  Object.entries(systemStatus).map(([key, service]) => {
                    let ServiceIcon = Server;
                    if (key.toLowerCase().includes("database"))
                      ServiceIcon = Database;
                    else if (key.toLowerCase().includes("payment"))
                      ServiceIcon = CreditCard;
                    else if (key.toLowerCase().includes("notification"))
                      ServiceIcon = Bell;
                    else if (key.toLowerCase().includes("api"))
                      ServiceIcon = Activity;

                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center justify-center w-48 min-h-[140px] p-4 rounded-lg border shadow-sm transition-all duration-200 ${
                          service.status === "healthy"
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <ServiceIcon
                            className={`w-6 h-6 ${service.status === "healthy" ? "text-green-600" : "text-red-600"}`}
                          />
                          {service.status === "healthy" ? (
                            <svg
                              className="w-6 h-6 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-6 h-6 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-base font-semibold text-gray-900 capitalize truncate flex items-center justify-center gap-1">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>
                          <p
                            className={`text-xs mt-1 font-medium ${service.status === "healthy" ? "text-green-700" : "text-red-700"}`}
                          >
                            {service.status === "healthy"
                              ? "Hoạt động tốt"
                              : "Lỗi"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 break-words max-w-[160px]">
                            {service.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* )} */}
    </RoleGuard>
  );
}
