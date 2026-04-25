import {
  IconTrendingDown,
  IconTrendingUp,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { DashboardSummaryResponse } from "@/types/dashboard";

export function OverviewCards({
  data,
}: {
  data?: DashboardSummaryResponse["overview"];
}) {
  if (!data) return null;

  const cards = [
    {
      title: "Doanh thu hôm nay",
      value: `${data.todayRevenue.toLocaleString()} đ`,
      growth: data.revenueGrowth,
      growthLabel: "so với hôm qua",
      highlight: true,
    },
    {
      title: "Lượt gửi xe hôm nay",
      value: `${data.todayBookings}`,
      growth: data.bookingsGrowth,
      growthLabel: "so với hôm qua",
      highlight: false,
    },
    {
      title: "Lấp đầy trung bình",
      value: `${data.averageOccupancy}%`,
      growth: data.occupancyGrowth,
      growthLabel: "so với tuần trước",
      highlight: false,
    },
    {
      title: "Khách hàng mới",
      value: `+${data.newCustomers}`,
      growth: data.customersGrowth,
      growthLabel: "so với tuần trước",
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.title}
          className={cn(
            "relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden",
            card.highlight
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border shadow-sm"
          )}
        >
          {/* Top row */}
          <div className="flex items-center justify-between">
            <p
              className={cn(
                "text-sm font-medium",
                card.highlight ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {card.title}
            </p>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                card.highlight
                  ? "bg-primary-foreground/15"
                  : "bg-primary/10"
              )}
            >
              <IconArrowUpRight
                className={cn(
                  "w-4 h-4",
                  card.highlight ? "text-primary-foreground" : "text-primary"
                )}
              />
            </div>
          </div>

          {/* Value */}
          <p
            className={cn(
              "text-3xl font-bold tabular-nums tracking-tight",
              card.highlight ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {card.value}
          </p>

          {/* Growth badge */}
          <div className="flex items-center gap-1.5">
            {card.growth >= 0 ? (
              <IconTrendingUp
                className={cn(
                  "w-3.5 h-3.5",
                  card.highlight ? "text-primary-foreground/70" : "text-primary"
                )}
              />
            ) : (
              <IconTrendingDown
                className={cn(
                  "w-3.5 h-3.5",
                  card.highlight ? "text-primary-foreground/70" : "text-destructive"
                )}
              />
            )}
            <span
              className={cn(
                "text-xs font-semibold",
                card.highlight
                  ? "text-primary-foreground/80"
                  : card.growth >= 0
                    ? "text-primary"
                    : "text-destructive"
              )}
            >
              {card.growth >= 0 ? "+" : ""}{card.growth}%
            </span>
            <span
              className={cn(
                "text-xs",
                card.highlight ? "text-primary-foreground/60" : "text-muted-foreground"
              )}
            >
              {card.growthLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
