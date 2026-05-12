"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  BellPlus,
  Send,
  Search,
  Filter,
  RefreshCw,
  Users,
  User,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  ChevronDown,
  X,
  Plus,
  Megaphone,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore, SentNotification, NotificationType, TargetType, NotificationStatus, UserSelectItem } from "@/stores/notification.store";
import { notificationService } from "@/services/notification.service";
import { userService } from "@/services/userService";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

// ─── Constants ──────────────────────────────────────────────────────────────

const typeConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PROMOTION: { label: "Khuyến mãi", color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800", icon: "🎉" },
  ALERT: { label: "Cảnh báo", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: "⚠️" },
  REMINDER: { label: "Nhắc nhở", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: "⏰" },
  SYSTEM: { label: "Hệ thống", color: "text-foreground/80", bgColor: "bg-muted border-border", icon: "⚙️" },
};

const targetConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ALL: { label: "Toàn bộ", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  USER: { label: "Khách hàng", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
  OWNER: { label: "Chủ bãi", color: "text-violet-700", bgColor: "bg-violet-50 border-violet-200" },
  SPECIFIC: { label: "Người nhận cụ thể", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  SENT: { label: "Đã gửi", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
  sent: { label: "Đã gửi", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
  SCHEDULED: { label: "Đã lên lịch", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20" },
  scheduled: { label: "Đã lên lịch", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20" },
  DRAFT: { label: "Bản nháp", color: "text-foreground/80", bg: "bg-muted" },
  draft: { label: "Bản nháp", color: "text-foreground/80", bg: "bg-muted" },
  FAILED: { label: "Thất bại", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/20" },
  failed: { label: "Thất bại", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/20" },
  "Đã gửi": { label: "Đã gửi", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
};


function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { accessToken } = useAuthStore();
  const {
    notifications,
    setNotifications,
    isLoading: loading,
    setLoading,
    error: storeError,
    setError,
    filters,
    setFilters,
    clearFilters,
    fetchNotifications,
    fetchUsers,
    sendToUser,
    sendToRole,
    availableUsers,
    currentPage,
    pageSize,
    setCurrentPage,
  } = useNotificationStore();

  const { searchTerm, filterType, filterTarget, filterStatus } = filters;

  // Create notification form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<SentNotification | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "SYSTEM" as NotificationType,
    targetType: "all" as TargetType,
    targetRole: "all",
    selectedUsers: [] as string[],
  });
  const [userSearch, setUserSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (notifications.length === 0) {
      fetchNotifications();
      fetchUsers();
    }
  }, []);

  // Filter logic - derived state
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(term) ||
          (n.content?.toLowerCase().includes(term) ?? false)
      );
    }

    if (filterType && filterType !== "all") {
      filtered = filtered.filter((n) => n.type === filterType);
    }
    if (filterTarget && filterTarget !== "all") {
      if (filterTarget === "NULL") {
        filtered = filtered.filter((n) => !n.targetRole || n.targetRole === "NULL" || n.targetRole === "null" || n.targetType === "specific");
      } else {
        filtered = filtered.filter((n) => n.targetRole === filterTarget || n.targetType?.toLowerCase() === filterTarget.toLowerCase());
      }
    }
    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter((n) => n.status === filterStatus);
    }

    return filtered;
  }, [searchTerm, filterType, filterTarget, filterStatus, notifications]);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "SYSTEM",
      targetType: "all",
      targetRole: "user",
      selectedUsers: [],
    });
    setUserSearch("");
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    setSending(true);

    try {
      if (formData.targetType === "specific") {
        if (formData.selectedUsers.length === 0) {
          toast.error("Vui lòng chọn người nhận cụ thể.");
          return;
        }
        await sendToUser({
          userIds: formData.selectedUsers,
          notification: {
            title: formData.title,
            content: formData.message,
            target_role: "NULL",
            type: formData.type,
          },
        });
      } else {
        // Handle "all" and "role"
        await sendToRole({
          notification: {
            title: formData.title,
            content: formData.message,
            target_role: formData.targetType === "all" ? "ALL" : (formData.targetRole || "USER").toUpperCase(),
            type: formData.type,
          },
        });
      }

      toast.success("Thông báo đã được gửi thành công!");
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Lỗi khi gửi thông báo:", err);
      toast.error(`Gửi thông báo thất bại: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter((id) => id !== userId)
        : [...prev.selectedUsers, userId],
    }));
  };

  // TODO: Implement fetching users from real user service
  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Stats
  const totalSent = notifications.filter((n) => n.status === "sent" || n.status === "SENT" || n.status === "Đã gửi").length;
  const totalFailed = notifications.filter((n) => n.status === "failed" || n.status === "FAILED").length;
  const totalTargeted = notifications.reduce((sum, n) => sum + (n.recipientCount || 0), 0);
  const totalRead = notifications.reduce((sum, n) => sum + (n.readCount || 0), 0);

  const stats = [
    {
      title: "Tổng thông báo",
      value: notifications.length,
      icon: Bell,
      gradient: "from-[#006241] to-[#00754A]",
      bgTint: "bg-card",
      border: "border-border",
    },
    {
      title: "Đã gửi thành công",
      value: totalSent,
      icon: CheckCircle2,
      gradient: "from-[#1E3932] to-[#2b5148]",
      bgTint: "bg-card",
      border: "border-border",
    },
    {
      title: "Tổng người nhận",
      value: totalTargeted.toLocaleString("vi-VN"),
      icon: Users,
      gradient: "from-[#00754A] to-[#006241]",
      bgTint: "bg-card",
      border: "border-border",
    },
    {
      title: "Đã đọc",
      value: totalRead.toLocaleString("vi-VN"),
      icon: Eye,
      gradient: "from-[#cba258] to-[#dfc49d]",
      bgTint: "bg-card",
      border: "border-border",
    },
  ];

  if(loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu thông báo...</p>
        </div>
      </div>
    )
  } 

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center rounded-2xl px-8 py-6" style={{ backgroundColor: '#1E3932', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)' }}>
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-3"
            style={{ color: '#ffffff', letterSpacing: '-0.16px' }}
          >
            <Megaphone className="w-6 h-6" />
            Quản lý Thông báo
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Tạo và quản lý thông báo gửi đến người dùng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-white text-primary hover:bg-white/90 shadow-sm gap-2 font-semibold"
          >
            <BellPlus className="w-4 h-4" />
            Tạo thông báo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <AdminStatCard
              key={i || stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconGradient={stat.gradient}
              bgTint={stat.bgTint}
              borderColor={stat.border}
            />
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                value={searchTerm}
                onChange={(e) => setFilters({ searchTerm: e.target.value })}
                className="pl-10 h-10 bg-muted border-border focus:bg-card text-foreground"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={filterType || "all"} onValueChange={(val) => setFilters({ filterType: val })}>
                <SelectTrigger className="w-full h-10 border-border bg-muted text-foreground">
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="PROMOTION">Khuyến mãi</SelectItem>
                  <SelectItem value="ALERT">Cảnh báo</SelectItem>
                  <SelectItem value="REMINDER">Nhắc nhở</SelectItem>
                  <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTarget || "all"} onValueChange={(val) => setFilters({ filterTarget: val })}>
                <SelectTrigger className="w-full h-10 border-border bg-muted text-foreground">
                  <SelectValue placeholder="Tất cả đối tượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đối tượng</SelectItem>
                  <SelectItem value="ALL">Toàn bộ</SelectItem>
                  <SelectItem value="USER">Khách hàng</SelectItem>
                  <SelectItem value="OWNER">Chủ bãi</SelectItem>
                  <SelectItem value="NULL">Khách hàng cụ thể</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus || "all"} onValueChange={(val) => setFilters({ filterStatus: val })}>
                <SelectTrigger className="w-full h-10 border-border bg-muted text-foreground">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Đã gửi">Đã gửi</SelectItem>
                  <SelectItem value="FAILED">Thất bại</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="h-10">
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-primary/80 rounded-full" />
              <CardTitle className="text-base font-semibold text-foreground">
                Thông báo đã gửi ({filteredNotifications.length})
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground gap-1.5"
              onClick={() => fetchNotifications()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-border bg-muted/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Thông báo
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Đối tượng
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Đã đọc
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedNotifications.map((notif: SentNotification) => {
                  const tc = typeConfig[notif.type] || typeConfig.SYSTEM;
                  const sc = statusConfig[notif.status] || statusConfig.sent;
                  const readPercent =
                    notif.recipientCount > 0
                      ? Math.round(((notif.readCount || 0) / notif.recipientCount) * 100)
                      : 0;

                  return (
                    <tr
                      key={notif.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedNotification(notif);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* Title & Message */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <span className="text-lg shrink-0 mt-0.5">{tc.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {notif.content}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <Badge
                          className={`${tc.bgColor} ${tc.color} border text-[10px] font-semibold`}
                        >
                          {tc.label}
                        </Badge>
                      </td>

                      {/* Target */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {notif.targetType === "all" && (
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          {notif.targetType === "role" && (
                            <Shield className="w-3.5 h-3.5 text-violet-500" />
                          )}
                          {notif.targetType === "specific" && (
                            <User className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className="text-sm text-foreground/80">
                            {(() => {
                              let targetKey = "SPECIFIC";
                              if (notif.targetType === "all" || notif.targetRole === "ALL") targetKey = "ALL";
                              else if (notif.targetRole === "USER") targetKey = "USER";
                              else if (notif.targetRole === "OWNER") targetKey = "OWNER";
                              else if (notif.targetType === "specific" || notif.targetRole === "NULL" || !notif.targetRole) targetKey = "SPECIFIC";
                              
                              const config = targetConfig[targetKey];
                              return (
                                <Badge
                                  className={`${config.bgColor} ${config.color} border text-[10px] font-semibold`}
                                >
                                  {config.label}
                                </Badge>
                              );
                            })()}
                          </span>
                        </div>
                      </td>

                      {/* Read Count */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            {notif.readSummary || "0/0"}
                          </span>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                              style={{
                                width: `${notif.recipientCount > 0 ? Math.round(((notif.readCount || 0) / notif.recipientCount) * 100) : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <Badge
                          className={`${sc.bg} ${sc.color} text-[10px] font-semibold`}
                        >
                          {sc.label}
                        </Badge>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(notif.sentAt || notif.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedNotification(notif);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setNotifications((prev) =>
                                prev.filter((n) => n.id !== notif.id)
                              );
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Không tìm thấy thông báo
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Thử thay đổi bộ lọc hoặc tạo thông báo mới
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
          {filteredNotifications.length > 0 && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => {
                      const showEllipsis = i > 0 && p - arr[i-1] > 1;
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsis && <span className="text-gray-400 px-1">...</span>}
                          <Button
                            variant={currentPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`}
                          >
                            {p}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Notification Dialog ────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <BellPlus className="w-5 h-5 text-blue-600" />
              Tạo thông báo mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Nhập tiêu đề thông báo..."
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="h-10"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Nhập nội dung thông báo..."
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Loại thông báo
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(["PROMOTION", "ALERT", "REMINDER", "SYSTEM"] as NotificationType[]).map((type) => {
                  const cfg = typeConfig[type] || typeConfig.SYSTEM;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type }))
                      }
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                        formData.type === type
                          ? `${cfg.bgColor} ${cfg.color} border-current shadow-sm`
                          : "border-border text-muted-foreground hover:border-border"
                      }`}
                    >
                      <span className="text-base">{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Gửi đến
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* All */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, targetType: "all" }))
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    formData.targetType === "all"
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-border text-muted-foreground hover:border-border"
                  }`}
                >
                  <Globe className="w-6 h-6" />
                  <span className="text-xs font-semibold">Tất cả</span>
                  <span className="text-[10px] text-gray-400">
                    ~1,250 người
                  </span>
                </button>

                {/* Role */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, targetType: "role" }))
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    formData.targetType === "role"
                      ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                      : "border-border text-muted-foreground hover:border-border"
                  }`}
                >
                  <Shield className="w-6 h-6" />
                  <span className="text-xs font-semibold">Theo vai trò</span>
                  <span className="text-[10px] text-gray-400">
                    User hoặc Owner
                  </span>
                </button>

                {/* Specific */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, targetType: "specific" }))
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    formData.targetType === "specific"
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-border text-muted-foreground hover:border-border"
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="text-xs font-semibold">Cụ thể</span>
                  <span className="text-[10px] text-gray-400">
                    Chọn người dùng
                  </span>
                </button>
              </div>
            </div>

            {/* Role Selection */}
            {formData.targetType === "role" && (
              <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100">
                <label className="block text-sm font-medium text-violet-700 mb-2">
                  Chọn vai trò
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        targetRole: "user",
                      }))
                    }
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      formData.targetRole === "user"
                        ? "border-violet-500 bg-card shadow-sm"
                        : "border-transparent bg-white/50 hover:bg-card"
                    }`}
                  >
                    <Users className="w-5 h-5 text-violet-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">
                        Khách hàng (User)
                      </p>
                      <p className="text-[10px] text-gray-400">~980 người</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        targetRole: "owner",
                      }))
                    }
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      formData.targetRole === "owner"
                        ? "border-violet-500 bg-card shadow-sm"
                        : "border-transparent bg-white/50 hover:bg-card"
                    }`}
                  >
                    <Shield className="w-5 h-5 text-violet-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">
                        Chủ bãi (Owner)
                      </p>
                      <p className="text-[10px] text-gray-400">~45 người</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* User Selection */}
            {formData.targetType === "specific" && (
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Chọn người dùng ({formData.selectedUsers.length} đã chọn)
                </label>

                {/* Selected chips */}
                {formData.selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {formData.selectedUsers.map((uid) => {
                      const user = availableUsers.find((u) => u.id === uid);
                      return (
                        <span
                          key={uid}
                          className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {user?.name || uid}
                          <button
                            type="button"
                            onClick={() => toggleUserSelection(uid)}
                            className="hover:text-amber-950"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* User search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <Input
                    placeholder="Tìm kiếm người dùng..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* User list */}
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg bg-card border border-amber-100 p-1.5">
                  {filteredUsers.map((user) => {
                    const selected = formData.selectedUsers.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUserSelection(user.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          selected
                            ? "bg-amber-100/80 text-amber-900"
                            : "hover:bg-muted text-foreground/80"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            selected
                              ? "bg-amber-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Badge
                          className={`text-[9px] shrink-0 ${
                            user.role === "owner"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role === "owner" ? "Chủ bãi" : "User"}
                        </Badge>
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>
                Hủy
              </Button>
            </DialogClose>
            <Button
              onClick={handleSendNotification}
              disabled={
                !formData.title.trim() ||
                !formData.message.trim() ||
                (formData.targetType === "specific" &&
                  formData.selectedUsers.length === 0) ||
                sending
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 min-w-[120px]"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Gửi thông báo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Eye className="w-5 h-5 text-green-600" />
              Chi tiết thông báo
            </DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4 py-2">
              {/* Title + type */}
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {(typeConfig[selectedNotification.type] || typeConfig.SYSTEM).icon}
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    {selectedNotification.title}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <Badge
                      className={`${(typeConfig[selectedNotification.type] || typeConfig.SYSTEM).bgColor} ${(typeConfig[selectedNotification.type] || typeConfig.SYSTEM).color} border text-[10px]`}
                    >
                      {(typeConfig[selectedNotification.type] || typeConfig.SYSTEM).label}
                    </Badge>
                    <Badge
                      className={`${(statusConfig[selectedNotification.status] || statusConfig.sent).bg} ${(statusConfig[selectedNotification.status] || statusConfig.sent).color} text-[10px]`}
                    >
                      {(statusConfig[selectedNotification.status] || statusConfig.sent).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="bg-muted rounded-xl p-4">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {selectedNotification.content || "Không có nội dung"}
                </p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-[10px] uppercase font-semibold text-gray-400 mb-0.5">
                    Đối tượng
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedNotification.targetRole === "ALL" ? "Tất cả người dùng" :
                      selectedNotification.targetRole === "USER" ? "Khách hàng" :
                        selectedNotification.targetRole === "OWNER" ? "Chủ bãi" :
                          selectedNotification.targetRole === null || selectedNotification.targetRole === "NULL" || selectedNotification.targetType === "specific" ? "Khách hàng cụ thể" :
                            selectedNotification.targetRole || "Khách hàng cụ thể"}
                  </p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-[10px] uppercase font-semibold text-gray-400 mb-0.5">
                    Tỷ lệ đọc
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedNotification.readSummary || "0/0"}{" "}
                    ({selectedNotification.recipientCount > 0
                      ? Math.round(
                          ((selectedNotification.readCount || 0) /
                            selectedNotification.recipientCount) *
                            100
                        )
                      : 0}
                    %)
                  </p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-[10px] uppercase font-semibold text-gray-400 mb-0.5">
                    Thời gian gửi
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(
                      selectedNotification.sentAt ||
                        selectedNotification.createdAt
                    )}
                  </p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-[10px] uppercase font-semibold text-gray-400 mb-0.5">
                    Người tạo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedNotification.createdBy}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}