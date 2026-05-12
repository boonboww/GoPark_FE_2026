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
      <SidebarHeader className="h-(--header-height) flex items-center justify-center border-b border-sidebar-border p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent group-data-[collapsible=icon]:!p-0"
            >
              <a href="/owner" className="flex items-center gap-3 px-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <span className="text-xl font-black">G</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-black text-lg text-foreground tracking-tight">
                    GoPark
                  </span>
                  <span className="truncate text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Owner Panel
                  </span>
                </div>
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
