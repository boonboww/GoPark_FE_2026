"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconChevronRight,
  IconCircleCheck
} from "@tabler/icons-react";
import { DashboardSummaryResponse } from "@/types/dashboard";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OperationCenterProps {
  alerts?: DashboardSummaryResponse['alerts'];
  overview?: DashboardSummaryResponse['overview'];
}

export function OperationCenter({ alerts, overview }: OperationCenterProps) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Điều hành & Báo cáo</CardTitle>
            <CardDescription>Tóm tắt vận hành và hiệu suất</CardDescription>
          </div>
          <IconChartBar className="text-muted-foreground" size={24} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        {/* Section 1: Growth Analytics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-muted flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tăng trưởng Doanh thu</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                (overview?.revenueGrowth ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {(overview?.revenueGrowth ?? 0) >= 0 ? "+" : ""}{overview?.revenueGrowth}%
              </span>
              {(overview?.revenueGrowth ?? 0) >= 0 ? (
                <IconTrendingUp size={18} className="text-emerald-500" />
              ) : (
                <IconTrendingDown size={18} className="text-rose-500" />
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-muted flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tăng trưởng Đơn hàng</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                (overview?.bookingsGrowth ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {(overview?.bookingsGrowth ?? 0) >= 0 ? "+" : ""}{overview?.bookingsGrowth}%
              </span>
              {(overview?.bookingsGrowth ?? 0) >= 0 ? (
                <IconTrendingUp size={18} className="text-emerald-500" />
              ) : (
                <IconTrendingDown size={18} className="text-rose-500" />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Alerts */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Cảnh báo vận hành</h4>
            {hasAlerts && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{alerts.length}</span>}
          </div>
          
          {hasAlerts ? (
            <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-rose-500/10 border border-rose-200 rounded-lg flex gap-3 text-sm text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-right-2 duration-300">
                  <IconAlertTriangle className="shrink-0 text-rose-500 mt-0.5" size={18} />
                  <div className="flex flex-col">
                    <span className="font-semibold line-clamp-1">{alert.lotName}</span>
                    <span className="opacity-90 text-xs">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-emerald-200 bg-emerald-500/5 rounded-xl flex flex-col items-center justify-center text-center gap-2 py-8">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <IconCircleCheck size={24} />
              </div>
              <div>
                <span className="font-semibold text-emerald-600 block text-sm">Hệ thống an toàn</span>
                <span className="text-xs text-muted-foreground">Không có xe nào đỗ quá giờ.</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Shortcut */}
        <Link href="/owner/reports" className="mt-auto">
          <Button variant="outline" className="w-full justify-between group h-11" size="sm">
            <span className="flex items-center gap-2">
              <IconChartBar size={18} className="text-primary" />
              Xem báo cáo chi tiết
            </span>
            <IconChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
