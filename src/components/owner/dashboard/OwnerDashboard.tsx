"use client";

import React from "react";
import { OverviewCards } from "./overview-cards";
import { RevenueChart } from "./revenue-chart";
import { ParkingOccupancy } from "./parking-occupancy";
import { RecentActivity } from "./recent-activity";
import { OperationCenter } from "./operation-center";
import { DashboardSummaryResponse } from "@/types/dashboard";

interface OwnerDashboardProps {
  data: DashboardSummaryResponse;
}

export function OwnerDashboard({ data }: OwnerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div id="dashboard-kpi-cards">
        <OverviewCards data={data.overview} />
      </div>

      {/* Row 2: Charts and Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="dashboard-revenue-chart" className="lg:col-span-2">
          <RevenueChart data={data.revenueChart} />
        </div>
        <div id="dashboard-occupancy-chart" className="col-span-1">
          <ParkingOccupancy data={data.parkingOccupancy} />
        </div>
      </div>

      {/* Row 3: Activity and Operation Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        <div id="dashboard-recent-activity" className="lg:col-span-2">
          <RecentActivity data={data.recentActivities.slice(0, 8)} />
        </div>
        <div id="dashboard-operation-center" className="col-span-1">
          <OperationCenter alerts={data.alerts} overview={data.overview} />
        </div>
      </div>
    </div>
  );
}
