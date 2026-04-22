"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconListDetails,
  IconMessageCircle,
  IconReport,
  IconTicket,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Chủ bãi",
    email: "owner@gopark.vn",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Bảng điều khiển",
      url: "/owner",
      icon: IconDashboard,
    },
    {
      title: "Quản lý bãi đỗ xe",
      url: "/owner/parkinglot_management",
      icon: IconListDetails,
    },
    {
      title: "Lịch sử Booking",
      url: "/owner/bookings",
      icon: IconTicket,
    },
    {
      title: "Phân tích",
      url: "/owner/analytics",
      icon: IconChartBar,
    },
    {
      title: "Quản lý khách hàng",
      url: "/owner/customer_management",
      icon: IconUsers,
    },

    {
      title: "Báo cáo",
      url: "/owner/reports",
      icon: IconReport,
    },
  ],

  navSecondary: [
    {
      title: "Trợ giúp",
      url: "/owner/help",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <SidebarMenu>
          <SidebarMenuItem className="flex w-full items-center justify-between group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 group-data-[collapsible=icon]:!hidden hover:bg-transparent"
            >
              <a href="/owner" className="flex items-center gap-2">
                {/* Logo Icon — filled circle like Tasko's smiley */}
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-primary-foreground fill-current"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-foreground">
                  GoPark
                </span>
              </a>
            </SidebarMenuButton>
            {/* <SidebarTrigger className="shrink-0" /> */}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-0">
        <NavMain items={data.navMain} label="MENU" />
        <NavMain items={data.navSecondary} label="GENERAL" />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-3">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
