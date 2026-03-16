"use client";

import React, { useEffect, useState } from "react";
import OwnerProfile from "./OwnerProfile";
import ParkingLotList from "./ParkingLotList";
import { OwnerProfileType, ParkingLotType } from "./owner";
import {
  getOwnerProfile,
  getOwnerParkingLots,
} from "../../../services/ownerService";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function OwnerAccountPage() {
  const [profile, setProfile] = useState<OwnerProfileType | null>(null);
  const [parkingLots, setParkingLots] = useState<ParkingLotType[]>([]);
  const [showParkingLots, setShowParkingLots] = useState(false);
  const [isLoadingLots, setIsLoadingLots] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getOwnerProfile();
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();
  }, []);

  const handleViewParkingLots = async () => {
    if (!showParkingLots && parkingLots.length === 0) {
      setIsLoadingLots(true);
      setShowParkingLots(true);
      try {
        const lots = await getOwnerParkingLots();
        setParkingLots(lots);
      } catch (error) {
        console.error("Failed to load parking lots", error);
      } finally {
        setIsLoadingLots(false);
      }
    } else {
      setShowParkingLots(!showParkingLots);
    }
  };

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
        <div className="flex flex-1 flex-col">
          <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Account Profile
                </h1>
                <p className="text-gray-500 mt-2">
                  View and manage your personal account information.
                </p>
              </div>

              <OwnerProfile
                profile={profile}
                onViewParkingLots={handleViewParkingLots}
              />

              {showParkingLots && (
                <div className="mt-8 pt-6 border-t border-gray-200 transition-all duration-300 ease-in-out">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                    My Parking Lots
                  </h2>
                  <ParkingLotList
                    parkingLots={parkingLots}
                    isLoading={isLoadingLots}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
