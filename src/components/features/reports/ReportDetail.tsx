import { Report } from "@/types/report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportPriorityBadge, ReportStatusBadge } from "./ReportBadges";
import { format } from "date-fns";

interface ReportDetailProps {
  report: Report;
}

export function ReportDetail({ report }: ReportDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{report.title}</CardTitle>
            <CardDescription className="mt-1.5">
              Report ID: {report.id}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <ReportPriorityBadge priority={report.priority} />
            <ReportStatusBadge status={report.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2 border-b pb-2">Description</h3>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{report.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="text-sm">{report.user_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Parking Lot ID</p>
            <p className="text-sm">{report.parking_lot_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Booking ID</p>
            <p className="text-sm">{report.booking_id || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-sm">{format(new Date(report.created_at), "PPp")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-sm">{format(new Date(report.updated_at), "PPp")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
