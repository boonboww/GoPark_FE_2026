"use client";

import React from "react";
import OwnerProfile from "./OwnerProfile";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAccountPage } from "./hooks/useAccountPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, Settings } from "lucide-react";

export default function OwnerAccountPage() {
  const { profile } = useAccountPage();

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
        <SiteHeader />
        <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-10 w-full">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Cài đặt tài khoản
            </h1>
            <p className="text-slate-500 font-medium max-w-lg">
              Quản lý thông tin định danh, bảo mật và cấu hình hệ thống của bạn.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 h-14 w-full justify-start gap-1">
              <TabsTrigger 
                value="profile" 
                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 font-bold text-slate-500 gap-2 transition-all"
              >
                <User className="w-4 h-4" />
                Hồ sơ cá nhân
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 font-bold text-slate-500 gap-2 transition-all"
              >
                <Shield className="w-4 h-4" />
                Bảo mật
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 font-bold text-slate-500 gap-2 transition-all"
              >
                <Bell className="w-4 h-4" />
                Thông báo
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 font-bold text-slate-500 gap-2 transition-all"
              >
                <Settings className="w-4 h-4" />
                Cài đặt chung
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-0 outline-none">
              <OwnerProfile profile={profile} initialMode="profile" />
            </TabsContent>
            
            <TabsContent value="security" className="mt-0 outline-none">
              <OwnerProfile profile={profile} initialMode="password" />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 outline-none">
              <div className="bg-slate-50 rounded-[40px] p-12 border-2 border-dashed border-slate-200 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Cài đặt thông báo</h3>
                <p className="text-slate-500 mt-2 font-medium">Tính năng này đang được phát triển.</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 outline-none">
              <div className="bg-slate-50 rounded-[40px] p-12 border-2 border-dashed border-slate-200 text-center">
                <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Cài đặt hệ thống</h3>
                <p className="text-slate-500 mt-2 font-medium">Quản lý các cấu hình chung cho tài khoản doanh nghiệp.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
