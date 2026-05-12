"use client";

import { type Icon } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive =
              item.url === "/owner"
                ? pathname === "/owner"
                : pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  id={`sidebar-item-${item.url.split("/").pop() || "dashboard"}`}
                  isActive={isActive}
                  tooltip={item.title}
                  onClick={() => router.push(item.url)}
                  className={cn(
                    "h-11 rounded-xl px-3 transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "size-5 shrink-0 transition-colors",
                        isActive
                          ? "text-primary-foreground"
                          : "text-sidebar-foreground/60",
                      )}
                    />
                  )}
                  <span className="font-semibold text-[13px]">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
