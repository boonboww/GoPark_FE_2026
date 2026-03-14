"use client";

import React, { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Types
interface FormData {
  phone: string;
  parkingLotName: string;
  address: string;
  floors: number | string;
  floorSlots: (number | string)[];
  agreedToTerms: boolean;
}

const STEPS = ["Profile Verification", "Parking Details", "Review"];

export default function BecomeOwnerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    phone: "",
    parkingLotName: "",
    address: "",
    floors: 1,
    floorSlots: [""],
    agreedToTerms: false,
  });

  // Mocked data for Step 1
  const mockUser = {
    fullName: "John Doe",
    email: "john.doe@example.com",
  };

  const handleNext = () => {
    if (currentStep === 2) {
      const floorsNum = Number(formData.floors);
      if (!floorsNum || floorsNum <= 0) {
        toast.error("Number of floors must be greater than 0");
        return;
      }
      for (let i = 0; i < floorsNum; i++) {
        const slots = Number(formData.floorSlots[i]);
        if (!slots || slots <= 0) {
          toast.error(`Slots for Floor ${i + 1} must be greater than 0`);
          return;
        }
      }
    }

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions to proceed.");
      return;
    }
    console.log("Submitting Request:", formData);
    toast.success(
      "Registration request submitted successfully! We will review your application.",
    );
    // Redirect or show success screen...
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    // We add a solid bg-background to cover the 3D map from the parent AuthLayout
    // and pointer-events-auto to re-enable clicks that AuthLayout disabled.
    <div className="fixed inset-0 min-h-screen bg-background p-4 flex items-center justify-center pointer-events-auto overflow-y-auto">
      <Card className="w-full max-w-3xl shadow-lg my-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Become a Parking Lot Owner
          </CardTitle>
          <CardDescription className="text-center">
            Register your parking lot on GoPark and start managing your spaces
            efficiently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stepper currentStep={currentStep} />

          <div className="mt-8">
            {currentStep === 1 && (
              <Step1Profile
                user={mockUser}
                data={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <Step2Parking data={formData} onChange={updateFormData} />
            )}
            {currentStep === 3 && (
              <Step3Review
                user={mockUser}
                data={formData}
                onChange={updateFormData}
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={currentStep === 1 ? "invisible" : ""}
          >
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit Request
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// --- Sub-components ---

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative">
      {/* Background Line */}
      <div className="absolute top-5 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full hidden sm:block"></div>

      {/* Active Line */}
      <div
        className="absolute top-5 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-300 hidden sm:block"
        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
      ></div>

      <div className="relative flex justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div 
              key={step} 
              className={`flex flex-col items-center ${index === STEPS.length - 1 ? "translate-x-2" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10 bg-background
                  ${isActive ? "border-primary text-primary" : ""}
                  ${isCompleted ? "bg-primary border-primary text-primary-foreground" : ""}
                  ${!isActive && !isCompleted ? "border-muted text-muted-foreground" : ""}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span
                className={`mt-2 text-sm text-center font-medium max-w-[120px] 
                  ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}
                `}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step1Profile({ user, data, onChange }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={user.fullName}
            readOnly
            className="bg-muted text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={user.email}
            readOnly
            className="bg-muted text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          placeholder="Enter your phone number"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step2Parking({ data, onChange }: any) {
  const handleFloorsChange = (val: string) => {
    onChange("floors", val);
    
    const newFloors = parseInt(val);
    if (!isNaN(newFloors) && newFloors > 0) {
      const newFloorSlots = [...data.floorSlots];
      if (newFloors > newFloorSlots.length) {
        // pad with empty strings for new inputs
        while (newFloorSlots.length < newFloors) {
          newFloorSlots.push("");
        }
      } else if (newFloors < newFloorSlots.length) {
        // truncate
        newFloorSlots.length = newFloors;
      }
      onChange("floorSlots", newFloorSlots);
    }
  };

  const handleSlotChange = (index: number, val: string) => {
    const newFloorSlots = [...data.floorSlots];
    newFloorSlots[index] = val;
    onChange("floorSlots", newFloorSlots);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="parkingName">Parking Lot Name</Label>
          <Input
            id="parkingName"
            placeholder="e.g. Central City Parking"
            value={data.parkingLotName}
            onChange={(e) => onChange("parkingLotName", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter full address"
            value={data.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>

        <div className="space-y-4 md:col-span-2 border rounded-lg p-5 bg-muted/20">
          <h3 className="font-semibold text-lg border-b pb-2">
            Parking Structure
          </h3>
          <div className="space-y-2 sm:w-1/2">
            <Label htmlFor="floors">Number of Floors</Label>
            <Input
              id="floors"
              type="number"
              min="1"
              placeholder="e.g. 3"
              value={data.floors}
              onChange={(e) => handleFloorsChange(e.target.value)}
            />
          </div>

          {Number(data.floors) > 0 && (
            <div className="space-y-3 pt-4">
              <Label>Floor Slots Configuration</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: Number(data.floors) }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-background p-2 rounded-md border text-sm"
                  >
                    <span className="font-medium whitespace-nowrap min-w-[60px]">
                      Floor {index + 1}
                    </span>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Slots"
                      className="h-8"
                      value={data.floorSlots[index] ?? ""}
                      onChange={(e) => handleSlotChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <div className="w-full h-48 bg-muted border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
          <MapPin className="w-8 h-8 mb-2" />
          <span>Interactive Map Widget (Select Lat/Lng)</span>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step3Review({ user, data, onChange }: any) {
  const totalSlots = data.floorSlots.reduce(
    (acc: number, curr: number | string) => acc + (Number(curr) || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-muted/30 rounded-lg p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">
          Application Summary
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Profile Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{user.fullName}</span>
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">
                {data.phone || "Not provided"}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Parking Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Lot Name:</span>
              <span className="font-medium">
                {data.parkingLotName || "Not provided"}
              </span>
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium">
                {data.address || "Not provided"}
              </span>
              <span className="text-muted-foreground">Floors:</span>
              <span className="font-medium">{data.floors || "0"}</span>
              <span className="text-muted-foreground">Total Slots:</span>
              <span className="font-medium">{totalSlots}</span>
            </div>

            {Number(data.floors) > 0 && (
              <div className="mt-4">
                <span className="text-muted-foreground text-xs block mb-2">
                  Slots per floor:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {data.floorSlots.map((slots: number | string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-muted px-2 py-1 rounded-md border"
                    >
                      F{idx + 1}:{" "}
                      <span className="font-medium text-foreground">
                        {slots || 0}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-3 bg-secondary/20 p-4 rounded-lg border border-secondary/30">
        <Checkbox
          id="terms"
          className="mt-1"
          checked={data.agreedToTerms}
          onCheckedChange={(checked) =>
            onChange("agreedToTerms", checked === true)
          }
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="terms" className="font-medium cursor-pointer">
            Accept terms and conditions
          </Label>
          <p className="text-sm text-muted-foreground">
            I verify that the information provided is accurate and I agree to
            the GoPark Owner Partnership Agreement.
          </p>
        </div>
      </div>
    </div>
  );
}


