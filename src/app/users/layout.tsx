"use client";

import React from "react";
import { UserGuide } from "@/components/layout/UserGuide";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      <UserGuide />
    </div>
  );
}
