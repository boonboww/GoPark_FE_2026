import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReportList } from "@/components/features/reports/ReportList";

export default function ReportsPage() {
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quản lý Báo cáo</h1>
            <p className="text-sm text-muted-foreground w-full">
              Xem và phân tích các báo cáo hoạt động của bãi đỗ xe.
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <ReportList />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
