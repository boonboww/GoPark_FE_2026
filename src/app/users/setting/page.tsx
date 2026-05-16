"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  User, 
  Bell, 
  Lock, 
  MapPin, 
  Moon, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Camera,
  Languages,
  Smartphone,
  Trash2, 
  Fingerprint,
  Clock,
  Settings,
  Shield, 
  EyeOff, 
  RefreshCw,
  Info,
  Sun,
  ArrowUpFromLine,
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth.store";
import { useConfigStore } from "@/stores/config.store";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const SettingPage = () => {
  const { user, logout } = useAuthStore();
  const { 
    locationEnabled, 
    setLocationEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    biometricEnabled,
    setBiometricEnabled,
    privacyMode,
    setPrivacyMode,
    language,
    setLanguage
  } = useConfigStore();
  const { theme, setTheme } = useTheme();
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "account");
  const [isClearing, setIsClearing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleToggleLocation = (checked: boolean) => {
    setLocationEnabled(checked);
    toast.success(checked ? "Đã bật định vị vị trí" : "Đã tắt định vị vị trí", {
      description: checked ? "Hệ thống sẽ gợi ý bãi đỗ quanh bạn." : "Hệ thống đã dừng truy cập vị trí của bạn."
    });
  };

  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    toast.info(checked ? "Đã bật thông báo" : "Đã tắt thông báo", {
      description: checked ? "Bạn sẽ nhận được tin nhắn mới nhất." : "Bạn có thể bỏ lỡ các ưu đãi quan trọng."
    });
  };

  const handleToggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
    toast(checked ? "Chế độ tối" : "Chế độ sáng", {
      icon: checked ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
    });
  };

  const handleClearCache = () => {
    setIsClearing(true);
    setTimeout(() => {
      setIsClearing(false);
      toast.success("Đã dọn dẹp bộ nhớ tạm", {
        description: "Giải phóng 12.4 MB dung lượng ứng dụng."
      });
    }, 1500);
  };

  const handleExportData = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Đang chuẩn bị dữ liệu...',
      success: 'Dữ liệu đã được gửi về email của bạn!',
      error: 'Lỗi xuất dữ liệu',
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Tài khoản của bạn đã được lên lịch xóa. Bạn sẽ được đăng xuất.");
      setShowDeleteConfirm(false);
      setTimeout(() => {
        logout();
        window.location.href = "/auth/login";
      }, 1500);
    } catch (e) {
      toast.error("Có lỗi xảy ra khi xóa tài khoản.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // Lưu ý: Cần set cho cả domain cụ thể và root path để đảm bảo cookie hoạt động
    const domain = window.location.hostname;
    if (lang === 'en') {
      document.cookie = `googtrans=/vi/en; path=/;`;
      document.cookie = `googtrans=/vi/en; path=/; domain=${domain};`;
    } else {
      // Đặt lại về tiếng Việt
      document.cookie = `googtrans=/vi/vi; path=/;`;
      document.cookie = `googtrans=/vi/vi; path=/; domain=${domain};`;
    }
    // Tải lại trang để Google Translate script nhận diện cookie mới
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-950 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Cài đặt</h1>
          <p className="text-gray-500 dark:text-gray-400">Quản lý tài khoản và tùy chỉnh trải nghiệm GoPark của bạn.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList id="setting-tabs-list" className="bg-white dark:bg-stone-900 border dark:border-stone-800 p-1 rounded-2xl inline-flex w-full md:w-auto">
              <TabsTrigger value="account" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <User className="w-4 h-4 mr-2" /> Tài khoản
              </TabsTrigger>
              <TabsTrigger id="setting-app-tab" value="app" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <Smartphone className="w-4 h-4 mr-2" /> Ứng dụng
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <Lock className="w-4 h-4 mr-2" /> Bảo mật
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black">Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật ảnh đại diện và thông tin cơ bản của bạn.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-gray-100 dark:border-stone-800 shadow-lg">
                      <AvatarImage src={user?.profile?.image || "https://i.pravatar.cc/150?img=11"} />
                      <AvatarFallback className="text-2xl font-bold bg-green-100 text-green-700">GP</AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-gray-400">Họ và tên</Label>
                        <p className="font-bold text-lg p-3 bg-gray-50 dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700">{user?.profile?.name || "Người dùng GoPark"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-gray-400">Email liên kết</Label>
                        <p className="font-bold text-lg p-3 bg-gray-50 dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700">{user?.email || "user@example.com"}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold px-6 border-2">Chỉnh sửa hồ sơ</Button>
                  </div>
                </div>

                <Separator className="dark:bg-stone-800" />

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Thông tin liên hệ khác</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl border border-gray-100 dark:border-stone-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Số điện thoại</p>
                          <p className="font-bold text-sm">090 * * * * 123</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="font-bold text-primary">Thay đổi</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl border border-gray-100 dark:border-stone-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">Ngôn ngữ</p>
                          <p className="font-bold text-sm">{language === 'en' ? 'English (EN)' : 'Tiếng Việt (VI)'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="font-bold text-primary">Thay đổi</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Settings */}
          <TabsContent value="app" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-[2.5rem]">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black">Tính năng hệ thống</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl transition-colors hover:bg-gray-100 dark:hover:bg-stone-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl shadow-sm">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm dark:text-white">Vị trí của tôi</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Cho phép GoPark truy cập vị trí</p>
                      </div>
                    </div>
                    <Switch 
                      id="setting-location-switch"
                      checked={locationEnabled} 
                      onCheckedChange={handleToggleLocation}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl transition-colors hover:bg-gray-100 dark:hover:bg-stone-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl shadow-sm">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm dark:text-white">Thông báo đẩy</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Nhận cập nhật về bãi đỗ & ưu đãi</p>
                      </div>
                    </div>
                    <Switch 
                      id="setting-notif-switch"
                      checked={notificationsEnabled} 
                      onCheckedChange={handleToggleNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl transition-colors hover:bg-gray-100 dark:hover:bg-stone-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shadow-sm">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm dark:text-white">Giao diện tối</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Tiết kiệm pin và bảo vệ mắt</p>
                      </div>
                    </div>
                    <Switch 
                      id="setting-theme-switch"
                      checked={theme === "dark"} 
                      onCheckedChange={handleToggleTheme}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl transition-colors hover:bg-gray-100 dark:hover:bg-stone-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl shadow-sm">
                        <EyeOff className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm dark:text-white">Chế độ riêng tư</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Ẩn tên trên các đánh giá công khai</p>
                      </div>
                    </div>
                    <Switch 
                      checked={privacyMode} 
                      onCheckedChange={(checked) => {
                        setPrivacyMode(checked);
                        toast(checked ? "Đã bật riêng tư" : "Đã tắt riêng tư");
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-stone-800/50 rounded-2xl border-t-2 border-dashed border-gray-100 dark:border-stone-800 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                            <RefreshCw className={`w-5 h-5 ${isClearing ? "animate-spin" : ""}`} />
                        </div>
                        <div>
                            <p className="font-black text-sm">Bộ nhớ ứng dụng</p>
                            <p className="text-[10px] text-gray-400 font-bold italic">Giải phóng dung lượng rác</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearCache}
                        disabled={isClearing}
                        className="text-amber-600 font-black hover:bg-amber-50 rounded-xl"
                      >
                        {isClearing ? "Đang dọn..." : "Dọn dẹp"}
                      </Button>
                    </div>
                    
                    <Separator className="bg-gray-200/50 dark:bg-stone-700/50" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-black text-sm">Dữ liệu cá nhân</p>
                            <p className="text-[10px] text-gray-400 font-bold italic">Xuất lịch sử hoạt động</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleExportData}
                        className="text-blue-600 font-black hover:bg-blue-50 rounded-xl"
                      >
                        Xuất dữ liệu
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Useful/Smart Features */}
              <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-[2.5rem]">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-green-500 rounded-full" />
                    <CardTitle className="text-xl font-black">Tính năng thông minh</CardTitle>
                  </div>
                  <CardDescription>Các công cụ hỗ trợ trải nghiệm người dùng.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-2 space-y-6">
                  {/* Language Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase text-gray-400 tracking-wider">Ngôn ngữ</Label>
                    <div className="flex gap-2 p-1 bg-gray-50 dark:bg-stone-800 rounded-2xl border border-gray-100 dark:border-stone-700">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleLanguageChange('vi')}
                        className={`flex-1 rounded-xl shadow-sm font-black text-xs ${language === 'vi' ? 'bg-white dark:bg-stone-700 text-black dark:text-white' : 'text-gray-400 hover:text-black dark:hover:text-white bg-transparent'}`}
                      >
                        Tiếng Việt
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleLanguageChange('en')}
                        className={`flex-1 rounded-xl shadow-sm font-black text-xs ${language === 'en' ? 'bg-white dark:bg-stone-700 text-black dark:text-white' : 'text-gray-400 hover:text-black dark:hover:text-white bg-transparent'}`}
                      >
                        English
                      </Button>
                    </div>
                  </div>

                  {/* Smart Alerts */}
                  <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-start justify-between">
                       <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                             <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="font-black text-sm text-blue-900 dark:text-blue-100">Cảnh báo bãi đỗ gần</h4>
                             <p className="text-[10px] font-bold text-blue-700/70 dark:text-blue-400/70 leading-tight mt-1">Gợi ý bãi đỗ khi bạn di chuyển vào vùng có nhiều lựa chọn tốt.</p>
                          </div>
                       </div>
                       <Switch checked={true} />
                    </div>
                  </div>

                  {/* Auto Extend */}
                  <div className="p-5 bg-green-50/50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-start justify-between">
                       <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                             <Clock className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="font-black text-sm text-green-900 dark:text-green-100">Gia hạn tự động</h4>
                             <p className="text-[10px] font-bold text-green-700/70 dark:text-green-400/70 leading-tight mt-1">Tự động cộng thêm 15p nếu bạn chưa kịp thanh toán khi hết giờ.</p>
                          </div>
                       </div>
                       <Switch checked={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance */}
              <Card className="md:col-span-2 border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-[2.5rem]">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black">Bảo trì & Dữ liệu</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 rounded-3xl border-2 flex flex-col gap-2 font-black group hover:border-blue-600 transition-all"
                    onClick={handleExportData}
                  >
                    <ArrowUpFromLine className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>Xuất dữ liệu (.JSON)</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 rounded-3xl border-2 flex flex-col gap-2 font-black group hover:border-orange-600 transition-all"
                    onClick={handleClearCache}
                    disabled={isClearing}
                  >
                    <RefreshCw className={`w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform ${isClearing ? 'animate-spin' : ''}`} />
                    <span>{isClearing ? 'Đang dọn dẹp...' : 'Dọn dẹp bộ nhớ'}</span>
                  </Button>

                  <div className="bg-gray-50 dark:bg-stone-800/50 p-6 rounded-3xl border border-gray-100 dark:border-stone-700 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                       <Info className="w-4 h-4 text-gray-400" />
                       <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Thông tin ứng dụng</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold">Phiên bản</span>
                       <span className="text-xs font-black text-blue-600">v2.5.0-BETA</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-[2.5rem]">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-red-600">Bảo mật & Quyền riêng tư</CardTitle>
                <CardDescription>Bảo vệ tài khoản của bạn khỏi các truy cập trái phép.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 dark:bg-stone-800/50 rounded-3xl border border-gray-100 dark:border-stone-700 flex flex-col justify-between h-full">
                    <div className="mb-4">
                      <h4 className="font-black text-base mb-1">Mật khẩu</h4>
                      <p className="text-xs text-gray-500 font-bold italic">Thay đổi mật khẩu định kỳ 3 tháng một lần.</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl font-bold border-2">Đổi mật khẩu</Button>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-stone-800/50 rounded-3xl border border-gray-100 dark:border-stone-700 flex flex-col justify-between h-full">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Fingerprint className="w-5 h-5 text-blue-600" />
                        <h4 className="font-black text-base">Xác thực sinh trắc học</h4>
                      </div>
                      <p className="text-xs text-gray-500 font-bold">Sử dụng vân tay/khuôn mặt để mở khóa nhanh.</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <span className="text-xs font-black uppercase text-gray-400">Trạng thái: <span className={biometricEnabled ? "text-green-500" : "text-red-500"}>{biometricEnabled ? "Bật" : "Tắt"}</span></span>
                      <Switch 
                        id="setting-biometric-switch"
                        checked={biometricEnabled}
                        onCheckedChange={(checked) => {
                          setBiometricEnabled(checked);
                          toast(checked ? "Đã bật sinh trắc học" : "Đã tắt sinh trắc học");
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                   <Button 
                    variant="destructive" 
                    className="w-full md:w-auto px-10 py-6 rounded-2xl font-black text-base shadow-xl shadow-red-500/20"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                   >
                     <LogOut className="w-5 h-5 mr-3" />
                     Đăng xuất tài khoản
                   </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-stone-950">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2">Xác nhận xóa tài khoản?</DialogTitle>
              <DialogDescription className="text-gray-500 dark:bg-stone-950 dark:text-gray-400 text-center font-bold">
                Hành động này không thể hoàn tác. Mọi dữ liệu đặt chỗ, phương tiện và số dư ví của bạn sẽ bị xóa vĩnh viễn sau 30 ngày.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button variant="outline" className="rounded-2xl py-6 font-black border-2" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</Button>
              <Button 
                variant="destructive" 
                className="rounded-2xl py-6 font-black shadow-xl shadow-red-500/20" 
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </div>
                ) : "Đúng, xóa ngay"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SettingPage;
