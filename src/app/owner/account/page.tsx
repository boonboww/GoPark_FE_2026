"use client";

import React, { useState } from "react";
import { useAccountPage } from "./hooks/useAccountPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOwnerProfile, changePassword } from "@/services/ownerService";
import { useAuthStore } from "@/stores/auth.store";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Camera,
  Loader2,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function OwnerAccountPage() {
  const { profile, user } = useAccountPage();
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
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
      toast.success("Hồ sơ đã được cập nhật!");
    },
    onError: (err: any) => toast.error(err.message || "Cập nhật thất bại"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePassword(data),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Đổi mật khẩu thất bại"),
  });

  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const avatarFallback = profile.name?.charAt(0).toUpperCase() || "O";

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <main className="flex-1 overflow-y-auto bg-slate-50/30 p-4 lg:p-10">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Cài đặt tài khoản
              </h1>
              <p className="text-slate-500 font-medium">
                Quản lý thông tin định danh và thiết lập bảo mật cá nhân.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
              {/* Left Column: Summary & Security */}
              <div className="space-y-6 lg:col-span-1">
                {/* Profile Summary Card */}
                <motion.div
                  id="account-profile-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="overflow-hidden border-slate-200/60 shadow-sm rounded-3xl">
                    <div className="h-24 bg-slate-900" />
                    <CardContent className="relative pt-0 px-6 pb-8">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative -mt-12 mb-4">
                          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                            <AvatarImage src={profile.image || ""} />
                            <AvatarFallback className="bg-slate-100 text-2xl font-bold text-slate-600">
                              {avatarFallback}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-white shadow-lg"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {profile.name}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                          {profile.email}
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-4 bg-slate-900 text-white hover:bg-slate-800 px-4 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]"
                        >
                          Chủ bãi (Owner)
                        </Badge>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                            <Phone className="h-4 w-4 text-slate-400" />
                          </div>
                          <span className="font-semibold text-slate-700">
                            {profile.phone || "Chưa cập nhật SĐT"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                            <Mail className="h-4 w-4 text-slate-400" />
                          </div>
                          <span className="font-semibold text-slate-700 truncate">
                            {profile.email}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Security Card */}
                <motion.div
                  id="account-security-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="border-slate-200/60 shadow-sm rounded-3xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Bảo mật & Quyền riêng tư
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <ShieldCheck className="h-5 w-5 text-slate-900" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Mật khẩu
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                              Đã thiết lập
                            </p>
                          </div>
                        </div>

                        <Dialog
                          open={isPasswordDialogOpen}
                          onOpenChange={setIsPasswordDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              id="account-password-update-btn"
                              variant="outline"
                              size="sm"
                              className="rounded-xl font-bold h-9 border-slate-200"
                            >
                              Thay đổi
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] rounded-[32px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-black">
                                Cập nhật mật khẩu
                              </DialogTitle>
                              <DialogDescription className="font-medium">
                                Đảm bảo bạn sử dụng mật khẩu mạnh để bảo vệ tài
                                khoản.
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={handlePasswordSubmit}
                              className="space-y-4 py-4"
                            >
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Mật khẩu hiện tại
                                </Label>
                                <Input
                                  type="password"
                                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all"
                                  placeholder="••••••••"
                                  value={passwordData.currentPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      currentPassword: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <Separator className="my-2" />
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Mật khẩu mới
                                </Label>
                                <Input
                                  type="password"
                                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all"
                                  placeholder="••••••••"
                                  value={passwordData.newPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      newPassword: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Xác nhận mật khẩu
                                </Label>
                                <Input
                                  type="password"
                                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all"
                                  placeholder="••••••••"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      confirmPassword: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <DialogFooter className="pt-4">
                                <Button
                                  type="submit"
                                  disabled={changePasswordMutation.isPending}
                                  className="w-full h-12 rounded-xl bg-slate-900 font-bold hover:bg-slate-800"
                                >
                                  {changePasswordMutation.isPending ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                  ) : (
                                    "Cập nhật mật khẩu"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column: Profile Edit Form */}
              <div className="lg:col-span-2">
                <motion.div
                  id="account-info-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="border-slate-200/60 shadow-sm rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="pb-8 border-b border-slate-50">
                      <CardTitle className="text-xl font-black text-slate-900">
                        Thông tin cá nhân
                      </CardTitle>
                      <CardDescription className="font-medium">
                        Chỉnh sửa các thông tin cơ bản của tài khoản đối tác.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-10 space-y-8">
                      <form onSubmit={handleProfileSubmit} className="space-y-8">
                        <div className="grid gap-8 sm:grid-cols-2">
                          <div className="space-y-3">
                            <Label
                              htmlFor="fullname"
                              className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                            >
                              Họ và tên
                            </Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <Input
                                id="fullname"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Nhập họ tên đầy đủ"
                                className="h-14 pl-12 rounded-2xl bg-slate-50/50 focus:bg-white transition-all border-slate-100 focus:ring-0 focus:border-slate-900 font-bold text-slate-700"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="phone"
                              className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                            >
                              Số điện thoại liên lạc
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    phone: e.target.value,
                                  })
                                }
                                placeholder="09xx xxx xxx"
                                className="h-14 pl-12 rounded-2xl bg-slate-50/50 focus:bg-white transition-all border-slate-100 focus:ring-0 focus:border-slate-900 font-bold text-slate-700"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 sm:col-span-2">
                            <Label
                              htmlFor="email"
                              className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                            >
                              Email định danh (Không thể thay đổi)
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <Input
                                id="email"
                                defaultValue={profile.email}
                                disabled
                                className="h-14 pl-12 rounded-2xl bg-slate-100/30 cursor-not-allowed border-slate-50 text-slate-400 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-6">
                          <Button
                            id="account-save-button"
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="rounded-2xl font-black bg-slate-900 px-12 h-14 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                          >
                            {updateProfileMutation.isPending ? (
                              <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                              "Cập nhật hồ sơ"
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
