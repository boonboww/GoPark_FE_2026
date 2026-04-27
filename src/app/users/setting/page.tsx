"use client";

import React, { useState } from "react";
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
  Smartphone
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useTheme } from "next-themes";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const SettingPage = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-950 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Cài đặt</h1>
          <p className="text-gray-500 dark:text-gray-400">Quản lý tài khoản và tùy chỉnh trải nghiệm GoPark của bạn.</p>
        </div>

        <Tabs defaultValue="account" className="w-full space-y-8">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-white dark:bg-stone-900 border dark:border-stone-800 p-1 rounded-2xl inline-flex w-full md:w-auto">
              <TabsTrigger value="account" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <User className="w-4 h-4 mr-2" /> Tài khoản
              </TabsTrigger>
              <TabsTrigger value="app" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
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
                          <p className="font-bold text-sm">Tiếng Việt (VI)</p>
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
                      checked={locationEnabled} 
                      onCheckedChange={setLocationEnabled}
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
                      checked={notificationsEnabled} 
                      onCheckedChange={setNotificationsEnabled}
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
                      checked={theme === "dark"} 
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-stone-900 rounded-[2.5rem]">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black">Ưu tiên trải nghiệm</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2 space-y-4">
                   <div className="p-5 bg-linear-to-br from-green-50 to-emerald-50 dark:from-emerald-900/10 dark:to-emerald-950/10 rounded-3xl border border-green-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-green-600 text-white rounded-xl">
                            <ShieldCheck className="w-5 h-5" />
                         </div>
                         <h4 className="font-black text-green-800 dark:text-green-400">Tối ưu đặt chỗ</h4>
                      </div>
                      <p className="text-xs font-bold text-green-700/70 dark:text-green-500/70 leading-relaxed">
                        Tự động hiển thị các bãi đỗ xe gần nhất dựa trên lịch sử di chuyển và vị trí thời gian thực của bạn.
                      </p>
                      <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 font-bold rounded-xl shadow-lg shadow-green-600/20">
                         Xem chi tiết
                      </Button>
                   </div>

                   <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between py-2 group cursor-pointer">
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">Điều khoản dịch vụ</span>
                         <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between py-2 group cursor-pointer">
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">Chính sách bảo mật</span>
                         <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between py-2 group cursor-pointer">
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">Phiên bản ứng dụng</span>
                         <span className="text-xs font-bold text-gray-400">v2.4.1 (Stable)</span>
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
                      <h4 className="font-black text-base mb-1">Xác thực 2 yếu tố (2FA)</h4>
                      <p className="text-xs text-gray-500 font-bold italic">Tăng cường bảo mật bằng mã OTP qua điện thoại.</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <span className="text-xs font-black uppercase text-gray-400">Trạng thái: <span className="text-red-500">Tắt</span></span>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                   <Button 
                    variant="destructive" 
                    className="w-full md:w-auto px-10 py-6 rounded-2xl font-black text-base shadow-xl shadow-red-500/20"
                    onClick={() => {
                      logout();
                      window.location.href = "/auth/login";
                    }}
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

      <Footer />
    </div>
  );
};

export default SettingPage;
