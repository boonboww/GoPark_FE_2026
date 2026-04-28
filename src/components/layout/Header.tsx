"use client";
import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import {
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Wallet,
  Loader2,
  Home,
  Search,
  History,
  User,
  Contact,
  Menu,
  Building2,
  MessageCircle,
  AlertCircle,
  Info,
  Megaphone,
  CheckCircle,
  Clock,
  X,
  Ticket,
  Smartphone,
  ShieldAlert
} from "lucide-react";
import { useTheme } from "next-themes";
import { useWallet } from "@/hooks/useWallet";
import { useTourStore } from "@/store/tourStore";
import { notificationService } from "@/services/notification.service";
import { SentNotification } from "@/stores/notification.store";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const Header = () => {
  const { isAuthenticated: isLoggedIn, user, logout } = useAuthStore();
  const { data: balance, isLoading: isWalletLoading } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isTourActive, currentStep, steps } = useTourStore();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<SentNotification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Tự động mở dropdown nếu bước hướng dẫn đang nằm trong menu avatar
  useEffect(() => {
    if (isTourActive && steps[currentStep]) {
      const targetId = steps[currentStep].targetId;
      const dropdownItems = [
        "header-profile-link",
        "header-wallet-link",
        "header-requests-link",
        "header-chat-link",
        "header-report-link",
        "header-logout-btn"
      ];
      
      // Kiểm tra xem bước hiện tại có nằm trong dropdown không
      const isInDropdown = dropdownItems.includes(targetId);
      
      if (isInDropdown) {
        setIsDropdownOpen(true);
      } else {
        // Đóng dropdown nếu bước tiếp theo không thuộc dropdown (ví dụ: tìm bãi đỗ, logo home)
        setIsDropdownOpen(false);
      }
    }
  }, [isTourActive, currentStep, steps]);

  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : 'http://localhost:8000';

  useEffect(() => setMounted(true), []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationService.getForUser(),
        notificationService.countUnread()
      ]);
      setNotifications(notifRes.data || []);
      setUnreadCount(countRes.data || 0);
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Kết nối Socket để nhận thông báo realtime
    if (isLoggedIn && user?.id) {
      const socket = io(SOCKET_URL, {
        query: { userId: user.id },
        transports: ['websocket', 'polling'],
      });

      socket.on('notificationReceived', (newNotif: SentNotification) => {
        console.log("Đã nhận thông báo mới:", newNotif);
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Có thể thêm âm thanh thông báo hoặc toast ở đây
      });

      socketRef.current = socket;
    }

    // Polling every 2 minutes as a backup
    const interval = setInterval(fetchNotifications, 120000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isLoggedIn, user?.id]);

  const handleNotificationClick = async (notif: SentNotification) => {
    try {
      if (!notif.isRead) {
        await notificationService.markRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      }

      setSelectedNotif(notif);
      setIsDetailModalOpen(true);
      setIsNotificationOpen(false);
    } catch (error) {
      console.error("Lỗi khi xử lý thông báo:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PROMOTIONAL":
      case "PROMOTION":
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      case "ALERT":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "REMINDER":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "SYSTEM":
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "PROMOTIONAL":
      case "PROMOTION":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "ALERT":
        return "bg-red-50 dark:bg-red-900/20";
      case "REMINDER":
        return "bg-amber-50 dark:bg-amber-900/20";
      case "SYSTEM":
        return "bg-blue-50 dark:bg-blue-900/20";
      default:
        return "bg-gray-50 dark:bg-stone-800/50";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link
            href="/"
            id="header-logo-link"
            className="flex items-center gap-2 text-primary font-bold text-2xl hover:opacity-90 transition-opacity"
          >
            <img src="/logo.png" alt="GoPark Logo" className="h-8 w-8" />
            <span className=" bg-clip-text text-black dark:text-white">
              Go <span className="text-green-600">Park</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-sm font-medium text-muted-foreground relative">
            <Link
              href="/"
              id="home-nav-link"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <Home className="h-5 w-5 inline-block mr-1" />
              Trang chủ
            </Link>
            <Link
              href="/users/findParking"
              id="find-parking-nav-link"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <Search className="h-5 w-5 inline-block mr-1" />
              Tìm bãi đỗ
            </Link>
            <Link
              href="/users/promotions"
              id="header-promotions-link"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <Ticket className="h-5 w-5 inline-block mr-1" />
              Ưu đãi
            </Link>
            <Link
              href="/users/historyBooking"
              id="header-history-link"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <History className="h-5 w-5 inline-block mr-1" />
              Lịch sử đặt chỗ
            </Link>

            <Link
              href="/users/about"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <User className="h-5 w-5 inline-block mr-1" />
              Về chúng tôi
            </Link>
            <Link
              href="/users/contact"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <Contact className="h-5 w-5 inline-block mr-1" />
              Liên hệ
            </Link>
            <Link
              href="/users/Ve-QR"
              className="transition-colors hover:text-primary hover:font-semibold"
            >
              <Ticket className="h-5 w-5 inline-block mr-1" />
              Vé-QR
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 flex items-center justify-center mr-2"
                aria-label="Toggle Dark Mode"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            {isLoggedIn ? (
              <div className="flex items-center gap-3 md:gap-5">
                {/* Nút thông báo */}
                <div className="relative" ref={notificationRef}>
                  <button
                    id="header-notification-btn"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-stone-800"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-stone-900 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown thông báo */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-stone-900 border border-gray-100 dark:border-stone-800 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-50 dark:border-stone-800 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-black dark:text-white">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              await notificationService.markAllRead();
                              setUnreadCount(0);
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Đánh dấu đã đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Không có thông báo nào</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-stone-800/50 hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors flex gap-3 ${!notif.isRead ? "bg-blue-50/20 dark:bg-blue-900/10" : ""}`}
                            >
                              <div className={`mt-1 h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${getNotificationColor(notif.type)}`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start gap-2">
                                  <p className={`text-sm ${!notif.isRead ? "font-bold text-black dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                  {notif.content}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <Link
                        href="/users/requests"
                        onClick={() => setIsNotificationOpen(false)}
                        className="block px-4 py-2 text-center text-xs font-semibold text-gray-500 hover:text-blue-600 border-t border-gray-50 dark:border-stone-800 mt-1"
                      >
                        Xem tất cả yêu cầu
                      </Link>
                    </div>
                  )}
                </div>

                {/* Avatar & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="header-avatar-btn"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-full border border-gray-200 dark:border-stone-700 hover:shadow-md transition-all bg-white dark:bg-stone-800"
                  >
                    <img
                      src={
                        user?.profile?.image || "https://i.pravatar.cc/150?img=11"
                      }
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold max-w-25 truncate hidden sm:block dark:text-white">
                      {user?.profile?.name || "Người dùng"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-stone-900 border border-gray-100 dark:border-stone-800 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-gray-50 dark:border-stone-800 mb-2">
                        <p className="text-sm font-bold text-black dark:text-white">
                          {user?.profile?.name || "Người dùng"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {user?.email || ""}
                        </p>
                      </div>

                      <div className="px-4 pb-2 border-b border-gray-50 dark:border-stone-800 mb-2">
                        <div className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 dark:bg-stone-800/80 rounded-lg border border-gray-100 dark:border-stone-700">
                          <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-md text-emerald-600 dark:text-emerald-300">
                            <Wallet className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Số dư ví
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-black dark:text-white mt-0.5">
                              {isWalletLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                `${(balance || 0).toLocaleString("vi-VN")} đ`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/users/profile"
                        id="header-profile-link"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Thông tin cá nhân
                      </Link>

                      <Link
                        href="/users/wallet"
                        id="header-wallet-link"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Wallet className="h-4 w-4" />
                        Quản lý Ví
                      </Link>

                      <Link
                        href="/users/requests"
                        id="header-requests-link"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <History className="h-4 w-4" />
                        Yêu cầu của tôi
                      </Link>

                      <Link
                        href="/users/chat"
                        id="header-chat-link"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Trò chuyện
                      </Link>


                      {user?.role && user.role !== "OWNER" && (
                        <Link
                          href="/auth/become-owner"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Building2 className="h-4 w-4" />
                          Trở thành chủ bãi đỗ
                        </Link>
                      )}

                      <Link
                        href="/users/report"
                        id="header-report-link"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Báo cáo & Khiếu nại
                      </Link>
                      <Link
                        href="/users/setting"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Cài đặt
                      </Link>
                      <div className="h-px bg-gray-100 dark:bg-stone-800 my-1"></div>

                      <button
                        id="header-logout-btn"
                        onClick={() => {
                          logout();
                          router.push("/auth/login");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Button variant="ghost" className="font-semibold" asChild>
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 shadow-md font-semibold"
                  asChild
                >
                  <Link href="/auth/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-gray-600 dark:text-gray-300 transition-colors rounded-full flex items-center justify-center mr-1"
                aria-label="Toggle Dark Mode"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              className="text-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-full sm:w-[320px] bg-white dark:bg-stone-900 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-[101]">
              <div className="p-6 border-b flex items-center justify-between dark:border-stone-800">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="bg-green-600 p-1.5 rounded-lg">
                    <img src="/logo.png" alt="Logo" className="h-6 w-6 invert brightness-0" />
                  </div>
                  <span className="font-bold text-xl dark:text-white">Go<span className="text-green-600">Park</span></span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {isLoggedIn && (
                  <div className="p-5 bg-linear-to-br from-gray-50 to-gray-100 dark:from-stone-800/50 dark:to-stone-900/50 rounded-[2rem] border border-gray-200 dark:border-stone-700/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <img
                          src={user?.profile?.image || "https://i.pravatar.cc/150?img=11"}
                          alt="Avatar"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-stone-800 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-stone-900 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-black truncate dark:text-white leading-tight">{user?.profile?.name || "Người dùng"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-2.5 px-4 bg-white dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700 shadow-xs">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số dư ví</span>
                        <span className="text-sm font-black dark:text-white">
                          {isWalletLoading ? "..." : `${(balance || 0).toLocaleString("vi-VN")} đ`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điều hướng chính</p>
                  <MobileNavItem href="/" icon={Home} label="Trang chủ" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/users/findParking" icon={Search} label="Tìm bãi đỗ" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/users/promotions" icon={Ticket} label="Ưu đãi & Khuyến mãi" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/users/historyBooking" icon={History} label="Lịch sử đặt chỗ" onClick={() => setIsMobileMenuOpen(false)} />
                </div>

                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tài khoản & Hỗ trợ</p>
                  <MobileNavItem href="/users/chat" icon={MessageCircle} label="Tin nhắn" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/users/profile" icon={User} label="Hồ sơ cá nhân" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/users/setting" icon={Settings} label="Cài đặt hệ thống" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/about" icon={Info} label="Về GoPark" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavItem href="/contact" icon={Contact} label="Trung tâm trợ giúp" onClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </div>

              <div className="p-6 border-t dark:border-stone-800 bg-gray-50/50 dark:bg-stone-900/50">
                {isLoggedIn ? (
                  <Button
                    variant="destructive"
                    className="w-full justify-center gap-3 h-14 rounded-2xl font-bold shadow-lg shadow-red-500/20"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      router.push("/auth/login");
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Đăng xuất tài khoản
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl font-bold" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/auth/login">Đăng nhập</Link>
                    </Button>
                    <Button className="h-12 rounded-2xl bg-green-600 hover:bg-green-700 font-bold shadow-lg shadow-green-500/20" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/auth/register">Đăng ký</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Modal Chi tiết Thông báo */}
      {isDetailModalOpen && selectedNotif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDetailModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`h-2 w-full ${getNotificationColor(selectedNotif.type)}`} />

            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${getNotificationColor(selectedNotif.type)}`}>
                  {getNotificationIcon(selectedNotif.type)}
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-2">
                {selectedNotif.title}
              </h2>
              <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Đã nhận {formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true, locale: vi })}
              </p>

              <div className="bg-gray-50 dark:bg-stone-800/50 rounded-2xl p-5 mb-8">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotif.content}
                </p>
              </div>

              <div className="flex gap-3">
                {(selectedNotif.content?.includes("Yêu cầu trở thành chủ bãi đỗ đã được duyệt") ||
                  selectedNotif.content?.includes("xác thực bãi") ||
                  selectedNotif.content?.includes("phê duyệt bãi")) && (
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        router.push("/users/requests");
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl"
                    >
                      Đến trang yêu cầu
                    </Button>
                  )}
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  variant="outline"
                  className={`h-12 rounded-xl ${(selectedNotif.content?.includes("Yêu cầu trở thành chủ bãi đỗ đã được duyệt") ||
                    selectedNotif.content?.includes("xác thực bãi") ||
                    selectedNotif.content?.includes("phê duyệt bãi")) ? "w-1/3" : "w-full"}`}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MobileNavItem = ({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) => (
  <Link
    href={href}
    onClick={onClick}
    className="group flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-stone-800/80 transition-all active:scale-[0.98]"
  >
    <div className="p-2.5 bg-gray-100 dark:bg-stone-800 rounded-xl group-hover:bg-white dark:group-hover:bg-stone-700 transition-colors shadow-xs">
      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-green-600 transition-colors" />
    </div>
    {label}
  </Link>
);

export default Header;
