"use client";

import React from "react";
import OwnerProfile from "./OwnerProfile";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAccountPage } from "./hooks/useAccountPage";

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
        <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Tài Khoản
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý thông tin hồ sơ và bảo mật tài khoản của bạn.
            </p>
          </div>

          <div className="space-y-6">
            <OwnerProfile profile={profile} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
