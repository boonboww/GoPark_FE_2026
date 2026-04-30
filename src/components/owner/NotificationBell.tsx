"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, MailOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:8000';

export function NotificationBell() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // 1. Fetch unread count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      const res = await notificationService.countUnread();
      return res.data;
    },
    enabled: !!user?.id,
  });

  // 2. Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", "list", user?.id],
    queryFn: async () => {
      const res = await notificationService.getForUser();
      return res.data as any;
    },
    enabled: !!user?.id && isOpen, // Only fetch when dropdown is open
  });

  // 3. Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã đánh dấu tất cả là đã đọc");
    },
  });

  // 4. Socket.io for real-time
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
    });

    socket.on("notificationReceived", (notification) => {
      console.log("New notification received:", notification);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      // Show toast
      toast.info(notification.title || "Thông báo mới", {
        description: notification.content,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, queryClient]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button id="header-notification-bell" className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 overflow-hidden rounded-xl border-border shadow-2xl">
        <DropdownMenuLabel className="p-4 flex items-center justify-between bg-muted/30">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold">Thông báo</span>
            <span className="text-xs text-muted-foreground font-normal">
              Bạn có {unreadCount} thông báo chưa đọc
            </span>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => markAllReadMutation.mutate()}
            >
              Đánh dấu đã đọc tất cả
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex gap-4 p-4 transition-colors hover:bg-muted/50 relative group cursor-pointer border-b border-border/50 last:border-0",
                    !notif.isRead && "bg-primary/5"
                  )}
                  onClick={() => !notif.isRead && markAsReadMutation.mutate(notif.id)}
                >
                  <div className={cn(
                    "mt-1 w-10 h-10 shrink-0 rounded-full flex items-center justify-center",
                    notif.type === "SYSTEM" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                    notif.type === "ALERT" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                  )}>
                    {notif.type === "SYSTEM" ? <MailOpen className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1 pr-6">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-semibold leading-tight",
                        !notif.isRead ? "text-foreground" : "text-muted-foreground font-medium"
                      )}>
                        {notif.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notif.content}
                    </p>
                    <span className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                  </div>

                  {!notif.isRead && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  )}
                  
                  <button 
                    className="absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
                    title="Đánh dấu đã đọc"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notif.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 bg-muted/20">
          <Button variant="ghost" className="w-full text-xs font-medium h-9 text-muted-foreground">
            Xem tất cả thông báo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
