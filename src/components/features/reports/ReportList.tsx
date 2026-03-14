"use client";

import { ReportDataTable } from "./ReportDataTable";
import { columns } from "./columns";
import { Report } from "@/types/report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for initial testing
export const MOCK_REPORTS: Report[] = [
  {
    id: "REP-001",
    user_id: "USR-789",
    parking_lot_id: "LOT-01",
    booking_id: "BKG-102",
    title: "Broken parking sensor in spot B4",
    description: "The sensor at parking spot B4 is staying consistently red even though the spot is empty. Vehicles are avoiding it.",
    priority: "MEDIUM",
    status: "OPEN",
    created_at: "2026-03-12T08:30:00Z",
    updated_at: "2026-03-12T08:30:00Z",
  },
  {
    id: "REP-002",
    user_id: "USR-452",
    parking_lot_id: "LOT-03",
    booking_id: null,
    title: "Payment gateway error at exit",
    description: "One of the terminal machines at the south exit is giving an error Code 500 continuously when people tap their cards.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    created_at: "2026-03-14T09:15:00Z",
    updated_at: "2026-03-14T10:00:00Z",
  },
  {
    id: "REP-003",
    user_id: "USR-112",
    parking_lot_id: "LOT-01",
    booking_id: "BKG-304",
    title: "Request for refund",
    description: "I was double charged for my booking on Tuesday. Please refund the extra amount.",
    priority: "LOW",
    status: "RESOLVED",
    created_at: "2026-03-10T14:20:00Z",
    updated_at: "2026-03-11T16:45:00Z",
  },
  {
    id: "REP-004",
    user_id: "USR-999",
    parking_lot_id: "LOT-05",
    booking_id: null,
    title: "Vandalism reported",
    description: "Someone sprayed graffiti over the main directory signboard near elevator 2.",
    priority: "HIGH",
    status: "OPEN",
    created_at: "2026-03-13T22:15:00Z",
    updated_at: "2026-03-13T22:15:00Z",
  },
];

export function ReportList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>
          Manage user reports and system issues across parking lots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReportDataTable columns={columns} data={MOCK_REPORTS} />
      </CardContent>
    </Card>
  );
}
