"use client";

import React from "react";
import { OwnerProfileType } from "./owner";

interface OwnerProfileProps {
  profile: OwnerProfileType | null;
  onViewParkingLots: () => void;
}

export default function OwnerProfile({
  profile,
  onViewParkingLots,
}: OwnerProfileProps) {
  if (!profile) {
    return (
      <div className="p-10 bg-white rounded-xl shadow-sm text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100 transition-all hover:shadow-md">
      <div className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 shadow-sm">
              <img
                src={profile.avatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {profile.name}
            </h2>

            <div className="flex flex-col gap-2 text-gray-600 mb-6">
              <p className="flex items-center justify-center md:justify-start gap-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
                {profile.phone}
              </p>
              <p className="flex items-center justify-center md:justify-start gap-2">
                <svg
                  className="w-5 h-5 text-gray-400"
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
                Total Parking Lots:{" "}
                <span className="font-semibold text-gray-900 ml-1">
                  {profile.totalLots}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm active:scale-95">
                Edit Profile
              </button>
              <button className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors active:scale-95">
                Change Password
              </button>
              <button className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors active:scale-95">
                Change Avatar
              </button>
              <button
                onClick={onViewParkingLots}
                className="px-5 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-sm font-medium rounded-lg transition-colors active:scale-95"
              >
                View Parking Lots
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
