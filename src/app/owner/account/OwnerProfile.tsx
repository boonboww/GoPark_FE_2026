"use client";

import React, { useState } from "react";
import { OwnerProfileType } from "@/types/owner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Phone, MapPin, Camera, Lock, Edit3, Save, Eye } from "lucide-react";

interface OwnerProfileProps {
  profile: OwnerProfileType | null;
  onViewParkingLots: () => void;
}

type EditMode = "none" | "profile" | "password" | "avatar";

export default function OwnerProfile({
  profile,
  onViewParkingLots,
}: OwnerProfileProps) {
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
  });

  if (!profile) {
    return (
      <Card className="w-full flex items-center justify-center p-12 border-none shadow-none bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">
            Loading profile...
          </p>
        </div>
      </Card>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // API logic is not modified as per rules
    setEditMode("none");
  };

  const renderContent = () => {
    switch (editMode) {
      case "profile":
        return (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMode("none")}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        );

      case "password":
        return (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMode("none")}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save Password
              </Button>
            </div>
          </form>
        );

      case "avatar":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-6 py-4">
              <Avatar className="w-32 h-32 border-4 border-indigo-50 shadow-sm">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="w-full max-w-sm">
                <Label
                  htmlFor="avatar-upload"
                  className="mb-2 block text-center"
                >
                  Upload new avatar
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  className="cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMode("none")}
              >
                Cancel
              </Button>
              <Button onClick={() => setEditMode("none")}>
                <Save className="w-4 h-4 mr-2" />
                Save Avatar
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
              <Avatar className="w-32 h-32 border-4 border-indigo-50 shadow-sm">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile.name}
                  </h2>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <p className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </p>
                    <p className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      Total Parking Lots:{" "}
                      <span className="font-semibold text-foreground">
                        {profile.totalLots}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-4">
                <Button
                  onClick={() => setEditMode("profile")}
                  variant="default"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => setEditMode("password")}
                  variant="outline"
                  size="sm"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  onClick={() => setEditMode("avatar")}
                  variant="outline"
                  size="sm"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Change Avatar
                </Button>
                <Separator
                  orientation="vertical"
                  className="h-8 mx-1 hidden md:block"
                />
                <Button
                  onClick={onViewParkingLots}
                  variant="secondary"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Parking Lots
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (editMode) {
      case "profile":
        return "Edit Profile";
      case "password":
        return "Change Password";
      case "avatar":
        return "Change Avatar";
    }
  };

  const getDescription = () => {
    switch (editMode) {
      case "profile":
        return "Update your name and contact information.";
      case "password":
        return "Choose a strong password to protect your account.";
      case "avatar":
        return "Upload a professional photo for your profile.";
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">{renderContent()}</CardContent>
    </Card>
  );
}
