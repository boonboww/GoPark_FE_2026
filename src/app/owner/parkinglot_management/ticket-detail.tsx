"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface TicketData {
  ticketCode: string;
  customerName: string;
  licensePlate: string;
  position: string; // Slot Label like A2
  startTime: Date;
  endTime: Date;
  price: number;
}

interface TicketDetailProps {
  isOpen: boolean;
  onClose: () => void;
  data: TicketData | null;
  status: "occupied" | "reserved" | "available";
}

export function TicketDetail({
  isOpen,
  onClose,
  data,
  status,
}: TicketDetailProps) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!data || status !== "occupied") {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const now = new Date().getTime();
      const start = data.startTime.getTime();
      const end = data.endTime.getTime();
      const totalDuration = end - start;
      const elapsed = now - start;

      // Calculate percentage (0 to 100)
      let percent = (elapsed / totalDuration) * 100;

      // Clamp between 0 and 100
      percent = Math.min(Math.max(percent, 0), 100);

      setProgress(percent);

      // Time left string
      const remaining = end - now;
      if (remaining <= 0) {
        setTimeLeft("Expired");
      } else {
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remaining / (1000 * 60)) % 60);
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [data, status]);

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>
            Information about the parking slot {data.position}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ticket Code</Label>
              <Input
                value={data.ticketCode}
                readOnly
                className="bg-slate-50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                value={data.position}
                readOnly
                className="bg-slate-50 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>License Plate</Label>
              <Input
                value={data.licensePlate}
                readOnly
                className="bg-yellow-50 border-yellow-200 font-bold text-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input
                value={data.customerName}
                readOnly
                className="bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                value={format(data.startTime, "HH:mm dd/MM/yyyy")}
                readOnly
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                value={format(data.endTime, "HH:mm dd/MM/yyyy")}
                readOnly
                className="bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Price</Label>
            <Input
              value={`${data.price.toLocaleString()} VND`}
              readOnly
              className="bg-slate-50 font-semibold"
            />
          </div>

          {status === "occupied" && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span>Parking Duration</span>
                <span className="text-blue-600">{timeLeft}</span>
              </div>
              {/* Progress Bar: 0% = Start, 100% = End */}
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{format(data.startTime, "HH:mm")}</span>
                <span>{Math.round(progress)}%</span>
                <span>{format(data.endTime, "HH:mm")}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
