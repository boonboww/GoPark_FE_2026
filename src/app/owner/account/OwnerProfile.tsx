"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OwnerProfileType } from "@/types/owner";
import { updateOwnerProfile, changePassword } from "@/services/ownerService";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Camera,
  Lock,
  Edit3,
  Save,
  Eye,
  Loader2,
  ArrowRight,
  User,
} from "lucide-react";
import { toast } from "sonner";

export type EditMode = "none" | "profile" | "password" | "avatar";

interface OwnerProfileProps {
  profile: OwnerProfileType | null;
  initialMode?: EditMode;
}

export default function OwnerProfile({ profile, initialMode = "none" }: OwnerProfileProps) {
  const [editMode, setEditMode] = useState<EditMode>(initialMode);
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
  });
  
  // Sync state with prop if it changes
  React.useEffect(() => {
    setEditMode(initialMode);
  }, [initialMode]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  // ─── Mutation: Update Profile ───────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) =>
      updateOwnerProfile(user!.id, { name: data.name, phone: data.phone }),
    onSuccess: (updated) => {
      updateUser({
        profile: {
          ...(user?.profile ?? { id: 0, gender: null, image: null }),
          name: updated.name,
          phone: updated.phone,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["ownerProfile", user?.id] });
      toast.success("Cập nhật thông tin thành công!");
      setEditMode("none");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Cập nhật thất bại. Vui lòng thử lại.");
    },
  });

  // ─── Mutation: Change Password ───────────────────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setEditMode("none");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
    },
  });

  if (!profile) {
    return (
      <div className="w-full flex items-center justify-center p-20 bg-white rounded-[40px] border border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-slate-200 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tên không được để trống.");
      return;
    }
    updateProfileMutation.mutate({
      name: formData.name,
      phone: formData.phone,
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có nhất 6 ký tự.");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const avatarSrc = profile.image || undefined;
  const avatarFallback = profile.name?.charAt(0)?.toUpperCase() || "O";

  const renderContent = () => {
    switch (editMode) {
      case "profile":
        return (
          <div className="bg-white rounded-[40px] p-8 lg:p-12 border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
               <div className="relative group">
                <Avatar className="w-24 h-24 rounded-[32px] border-4 border-slate-50 shadow-inner">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="text-2xl font-black bg-slate-50 text-slate-300">{avatarFallback}</AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => setEditMode("avatar")}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900">Ảnh đại diện</h3>
                  <p className="text-sm font-medium text-slate-500">Định dạng JPG, PNG. Tối đa 2MB.</p>
               </div>
            </div>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all font-medium"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Địa chỉ Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    className="h-14 pl-12 rounded-2xl bg-slate-100/50 border-transparent text-slate-400 font-medium cursor-not-allowed"
                    value={profile.email}
                    disabled
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mt-2">Email dùng để đăng nhập và không thể thay đổi</p>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-14 px-8 rounded-2xl font-bold text-slate-500"
                  onClick={() => setEditMode("none")}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="h-14 px-10 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200"
                >
                  {updateProfileMutation.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        );

      case "password":
        return (
          <div className="bg-white rounded-[40px] p-8 lg:p-12 border border-slate-100 shadow-sm space-y-10 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Thay đổi mật khẩu</h3>
              <p className="text-slate-500 font-medium">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Mật khẩu hiện tại</Label>
                <Input
                  type="password"
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all font-medium"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <Separator className="bg-slate-50" />
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Mật khẩu mới</Label>
                <Input
                  type="password"
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all font-medium"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Xác nhận mật khẩu mới</Label>
                <Input
                  type="password"
                  className="h-14 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all font-medium"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending}
                  className="h-14 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200"
                >
                  {changePasswordMutation.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  Cập nhật mật khẩu mới
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400"
                  onClick={() => setEditMode("none")}
                >
                  Quay lại
                </Button>
              </div>
            </form>
          </div>
        );

      case "avatar":
        return (
          <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-sm text-center space-y-8 max-w-xl mx-auto">
             <Avatar className="w-40 h-40 rounded-[48px] border-8 border-slate-50 shadow-xl mx-auto">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback className="text-4xl font-black bg-slate-50 text-slate-200">{avatarFallback}</AvatarFallback>
             </Avatar>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Ảnh hồ sơ</h3>
                <p className="text-slate-500 font-medium">Thay đổi hình ảnh hiển thị trên toàn hệ thống GoPark.</p>
             </div>
             <div className="flex flex-col gap-4">
                <Label className="h-14 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all font-bold text-slate-600">
                   <Camera className="w-5 h-5" />
                   Tải ảnh lên từ thiết bị
                   <input type="file" className="hidden" accept="image/*" />
                </Label>
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-400" onClick={() => setEditMode("none")}>Hủy bỏ</Button>
                  <Button className="flex-1 h-14 rounded-2xl bg-black text-white font-bold" onClick={() => setEditMode("none")}>Lưu ảnh đại diện</Button>
                </div>
             </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Info Card */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[40px] p-8 lg:p-10 border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <Avatar className="w-32 h-32 rounded-[40px] border-4 border-slate-50 shadow-inner">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback className="text-3xl font-black bg-slate-50 text-slate-200">{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900">{profile.name}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                              <Mail className="w-4 h-4 text-slate-300" />
                              {profile.email}
                           </div>
                           <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                              <Phone className="w-4 h-4 text-slate-300" />
                              {profile.phone || "Chưa cập nhật"}
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button onClick={() => setEditMode("profile")} className="rounded-xl h-10 px-6 font-bold text-xs gap-2 bg-slate-900">
                          <Edit3 className="w-3.5 h-3.5" />
                          Chỉnh sửa hồ sơ
                        </Button>
                        <Button onClick={() => setEditMode("avatar")} variant="outline" className="rounded-xl h-10 px-6 font-bold text-xs gap-2 border-slate-200">
                          <Camera className="w-3.5 h-3.5" />
                          Đổi ảnh
                        </Button>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
                     <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                        <MapPin className="w-7 h-7 text-emerald-600" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bãi đỗ xe</p>
                        <p className="text-2xl font-black text-slate-900">{profile.totalLots} điểm</p>
                     </div>
                  </div>
                  <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6 group cursor-pointer hover:border-black transition-all" onClick={() => setEditMode("password")}>
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all">
                        <Lock className="w-7 h-7" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bảo mật</p>
                        <p className="text-lg font-black text-slate-900">Đổi mật khẩu</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Quick Stats/Actions */}
            <div className="space-y-6">
               <div className="bg-black rounded-[40px] p-8 text-white relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                     <h4 className="text-xl font-black tracking-tight leading-tight">Nâng cấp trải nghiệm quản lý bãi đỗ</h4>
                     <p className="text-white/60 text-sm font-medium">Hệ thống GoPark giúp bạn tối ưu hóa doanh thu và vận hành hiệu quả hơn.</p>
                     <Button className="w-full bg-white text-black font-black h-12 rounded-2xl hover:bg-white/90">Xem báo cáo chi tiết</Button>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
               </div>

               <div className="bg-slate-50 rounded-[40px] p-8 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Trợ giúp nhanh</h4>
                  <div className="space-y-3">
                     <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 font-bold text-xs hover:border-black transition-all">
                        Trung tâm hỗ trợ
                        <ArrowRight className="w-4 h-4" />
                     </button>
                     <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 font-bold text-xs hover:border-black transition-all">
                        Hướng dẫn sử dụng
                        <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {renderContent()}
    </motion.div>
  );
}
