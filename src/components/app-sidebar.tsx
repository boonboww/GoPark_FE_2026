"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconLayoutGrid,
  IconList,
  IconListDetails,
  IconMessageCircle,
  IconReport,
  IconTicket,
  IconUsers,
  IconStar,
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

import { useAuthStore } from "@/stores/auth.store";

const data = {
  navMain: [
    {
      title: "Bảng điều khiển",
      url: "/owner",
      icon: IconDashboard,
    },
    {
      title: "Quản lý bãi đỗ",
      url: "/owner/my-parking-lots",
      icon: IconList,
    },
    {
      title: "Quản lý hoạt động bãi đỗ",
      url: "/owner/parkinglot_management",
      icon: IconLayoutGrid,
    },
    {
      title: "Lịch sử Booking",
      url: "/owner/bookings",
      icon: IconTicket,
    },
    {
      title: "Trò chuyện",
      url: "/owner/chat",
      icon: IconMessageCircle,
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
    // {
    //   title: "Báo cáo",
    //   url: "/owner/reports",
    //   icon: IconReport,
    // },
    {
      title: "Quản lý nhân viên",
      url: "/owner/staff-management",
      icon: IconUsers,
    },
    {
      title: "Đánh giá khách hàng",
      url: "/owner/reviews",
      icon: IconStar,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase() || "user";

  // Filter menu items based on role
  const filteredNavMain = data.navMain.filter((item) => {
    if (role === "staff") {
      const allowedForStaff = [
        "/owner",
        "/owner/parkinglot_management",
        "/owner/bookings",
        "/owner/customer_management",
      ];
      return allowedForStaff.includes(item.url);
    }
    return true; // Owner/Admin sees everything
  });

  const userData = {
    name: user?.profile?.name || (role === "owner" ? "Chủ bãi" : "Nhân viên"),
    email: user?.email || "user@gopark.vn",
    avatar: user?.profile?.image || "/avatars/shadcn.jpg",
  };

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
                <span className="text-[25px] font-bold text-foreground ml-3">
                  GoPark
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-0">
        <NavMain items={filteredNavMain} label="MENU" />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-3">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
