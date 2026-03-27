"use client";

import React, { useState } from "react";
import { Check, MapPin, X, UploadCloud, Star, User, Mail, Phone, FileText, Building2, Building, CarFront, LayoutList, Layers } from "lucide-react";
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
import { MapLocationPicker } from "@/components/ui/map-location-picker";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import Image from "next/image";

// Types
interface FormData {
  phone: string;
  taxCode: string;
  description: string;
  businessLicense: File | null;
  parkingLotName: string;
  address: string;
  location: { lat: number; lng: number } | null;
  floors: number | string;
  floorSlots: (number | string)[];
  agreedToTerms: boolean;
  images: File[];
  avatarIndex: number;
}

const STEPS = ["Xác thực hồ sơ", "Chi tiết bãi đỗ", "Xem lại thông tin"];

export default function BecomeOwnerPage() {
  const router = useRouter();
  const { user, accessToken, login } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    phone: "",
    taxCode: "",
    description: "",
    businessLicense: null,
    parkingLotName: "",
    address: "",
    location: null,
    floors: 1,
    floorSlots: [""],
    agreedToTerms: false,
    images: [],
    avatarIndex: 0,
  });

  // Data for Step 1
  const currentUser = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fullName: (user as any)?.profile?.name || "Tài khoản",
    email: user?.email || "",
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.phone) {
        toast.error("Vui lòng nhập số điện thoại");
        return;
      }
      if (!formData.taxCode) {
        toast.error("Vui lòng nhập mã số thuế");
        return;
      }
      if (!formData.businessLicense) {
        toast.error("Vui lòng tải lên giấy phép kinh doanh");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.parkingLotName) {
        toast.error("Vui lòng nhập tên bãi đỗ");
        return;
      }
      if (!formData.description) {
        toast.error("Vui lòng nhập mô tả bãi đỗ");
        return;
      }
      if (!formData.address) {
        toast.error("Vui lòng nhập địa chỉ bãi đỗ");
        return;
      }
      const floorsNum = Number(formData.floors);
      if (!floorsNum || floorsNum <= 0) {
        toast.error("Số tầng phải lớn hơn 0");
        return;
      }
      if (!formData.location) {
        toast.error("Vui lòng chọn vị trí trên bản đồ bằng cách nhấp vào bản đồ hoặc chờ bản đồ tự nhận vị trí");
        return;
      }
      if (formData.images.length === 0) {
        toast.error("Vui lòng tải lên ít nhất một hình ảnh của bãi đỗ");
        return;
      }
      for (let i = 0; i < floorsNum; i++) {
        const slots = Number(formData.floorSlots[i]);
        if (!slots || slots <= 0) {
          toast.error(`Số chỗ đỗ cho Tầng ${i + 1} phải lớn hơn 0`);
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

  const handleSubmit = async () => {
    if (!formData.agreedToTerms) {
      toast.error("Vui lòng đồng ý với Điều khoản và Điều kiện để tiếp tục.");
      return;
    }

    if (!user) {
      toast.error("Bạn chưa đăng nhập.");
      return;
    }

    try {
      setLoading(true);

      const slots = formData.floorSlots.map((s, i) => ({
        floorNumber: i + 1,
        capacity: Number(s),
      }));

      // NOTE: In a real implementation with images, you'd use FormData here
      // since application/json doesn't support file uploads well.
      // We will pretend the endpoint can handle a FormData object, or you can adjust it later.
      const payload = new FormData();
      payload.append("parkingLotName", formData.parkingLotName);
      payload.append("address", formData.address);
      payload.append("lat", String(formData.location?.lat));
      payload.append("lng", String(formData.location?.lng));
      payload.append("floors", String(formData.floors));
      payload.append("floorSlots", JSON.stringify(slots));
      payload.append("phone", formData.phone);
      payload.append("taxCode", formData.taxCode);
      payload.append("description", formData.description);
      payload.append("avatarIndex", String(formData.avatarIndex));
      
      if (formData.businessLicense) {
        payload.append("businessLicense", formData.businessLicense);
      }

      formData.images.forEach((file) => {
        payload.append(`images`, file);
      });

      await apiClient("/parking/become-owner", {
        method: "POST",
        body: payload, // changed from JSON.stringify to FormData
        headers: {
          Authorization: `Bearer ${accessToken}`, // Do NOT set Content-Type to application/json so boundary is generated automatically
        },
      });

      toast.success(
        "Đăng ký thành công! Tài khoản của bạn đã được nâng cấp thành Chủ bãi xe.",
      );

      // Redirect user to sign in to refresh their JWT or owner dashboard if it fetches user directly
      setTimeout(() => {
        router.push("/auth/sign-in"); // or wherever appropriate
      }, 2000);
    } catch (error: any) { // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error(
        error.message || "Đã xảy ra lỗi khi đăng ký.",
      );
    } finally {
      setLoading(false);
    }
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
    <div className="fixed inset-0 min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex items-center justify-center pointer-events-auto overflow-y-auto">
      <Card className="w-full max-w-[95vw] lg:max-w-[1500px] shadow-2xl my-auto max-h-[96vh] overflow-y-auto flex flex-col border-muted">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl text-center font-bold">
            Trở thành Chủ Bãi Đỗ Xe
          </CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Đăng ký bãi đỗ xe của bạn trên GoPark và bắt đầu quản lý chỗ đỗ hiệu quả.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 px-4 sm:px-8 lg:px-12 pb-8">
          <Stepper currentStep={currentStep} />

          <div className="mt-10 h-full">
            {currentStep === 1 && (
              <Step1Profile
                user={currentUser}
                data={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <Step2Parking data={formData} onChange={updateFormData} />
            )}
            {currentStep === 3 && (
              <Step3Review
                user={currentUser}
                data={formData}
                onChange={updateFormData}
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 mt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className={currentStep === 1 ? "invisible" : ""}
          >
            Quay lại
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext}>Tiếp tục</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Đang xử lý..." : "Gửi Yêu Cầu"}
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
  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange("businessLicense", e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Họ và Tên</Label>
          <Input
            id="fullName"
            value={user.fullName}
            readOnly
            className="bg-muted text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />Địa chỉ Email</Label>
          <Input
            id="email"
            value={user.email}
            readOnly
            className="bg-muted text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />Số Điện Thoại <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            placeholder="Nhập số điện thoại của bạn"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxCode" className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />Mã Số Thuế Doanh Nghiệp / Cá Nhân <span className="text-red-500">*</span></Label>
          <Input
            id="taxCode"
            placeholder="Nhập mã số thuế"
            value={data.taxCode}
            onChange={(e) => onChange("taxCode", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-5 bg-muted/20">
        <h3 className="font-semibold text-lg border-b pb-2 mb-2">
          Giấy Phép Kinh Doanh
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tải lên bản scan hoặc hình ảnh Giấy phép kinh doanh của bạn để xác thực.
        </p>

        <div className="flex items-center gap-4">
          <label className="border-2 border-dashed border-muted-foreground hover:border-primary transition-colors hover:bg-muted/30 cursor-pointer w-32 h-32 flex flex-col items-center justify-center rounded-lg text-muted-foreground hover:text-primary space-y-2">
            <UploadCloud className="w-8 h-8" />
            <span className="text-xs font-medium text-center px-2">Tải file lên</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleLicenseChange}
            />
          </label>
          
          {data.businessLicense && (
            <div className="flex-1 border rounded-lg p-3 bg-background flex items-center justify-between shadow-sm">
              <span className="text-sm font-medium truncate mr-4">
                {data.businessLicense.name}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onChange("businessLicense", null)}
              >
                Xóa
              </Button>
            </div>
          )}
        </div>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allFiles = [...data.images, ...newFiles];
      onChange("images", allFiles);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...data.images];
    newFiles.splice(index, 1);
    onChange("images", newFiles);
    if (data.avatarIndex === index) {
      onChange("avatarIndex", 0);
    } else if (data.avatarIndex > index) {
      onChange("avatarIndex", data.avatarIndex - 1);
    }
  };

  const setAsAvatar = (index: number) => {
    onChange("avatarIndex", index);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 xl:gap-16 items-start">
        {/* Left Column: Form Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="parkingName" className="flex items-center gap-2"><CarFront className="w-4 h-4 text-muted-foreground" />Tên Bãi Đỗ Xe <span className="text-red-500">*</span></Label>
            <Input
              id="parkingName"
              placeholder="VD: Bãi đỗ xe trung tâm"
              value={data.parkingLotName}
              onChange={(e) => onChange("parkingLotName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2"><LayoutList className="w-4 h-4 text-muted-foreground" />Mô Tả Bãi Đỗ <span className="text-red-500">*</span></Label>
            <Input
              id="description"
              placeholder="VD: Bãi đỗ xe rộng rãi, có mái che, an ninh 24/7..."
              value={data.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-4 border rounded-lg p-5 bg-muted/20">
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">
              Hình ảnh bãi đỗ
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tải lên hình ảnh thực tế bãi đỗ từ thiết bị của bạn. Bạn có thể tải nhiều ảnh và chọn 1 ảnh làm ảnh đại diện (avatar).
            </p>

            <div className="flex flex-wrap gap-4 items-start">
              {data.images.map((file: File, idx: number) => {
                 const previewUrl = URL.createObjectURL(file);
                 const isAvatar = data.avatarIndex === idx;

                 return (
                   <div
                     key={`${file.name}-${idx}`}
                     className={`relative border rounded-lg overflow-hidden group w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 transition-all ${
                       isAvatar ? "ring-2 ring-primary border-primary shadow-md" : "border-muted"
                     }`}
                   >
                     <Image
                       src={previewUrl}
                       alt="preview"
                       fill
                       unoptimized
                       className="object-cover"
                       onLoad={() => URL.revokeObjectURL(previewUrl)}
                     />
                     
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 backdrop-blur-[1px]">
                       {!isAvatar && (
                         <Button
                           variant="secondary"
                           size="sm"
                           className="h-7 text-[10px] sm:text-xs scale-90"
                           onClick={(e) => {
                             e.preventDefault();
                             setAsAvatar(idx);
                           }}
                         >
                           Làm Avatar
                         </Button>
                       )}
                       <Button
                         variant="destructive"
                         size="icon"
                         className="h-6 w-6 sm:h-7 sm:w-7 rounded-full"
                         onClick={(e) => {
                           e.preventDefault();
                           removeImage(idx);
                         }}
                       >
                         <X className="w-3 h-3 sm:w-4 sm:h-4" />
                       </Button>
                     </div>
                     
                     {isAvatar && (
                       <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-lg">
                         <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-500" /> Avatar
                       </div>
                     )}
                   </div>
                 );
              })}

              <label className="border-2 border-dashed border-muted-foreground hover:border-primary transition-colors hover:bg-muted/30 cursor-pointer w-24 h-24 sm:w-32 sm:h-32 flex flex-col items-center justify-center rounded-lg text-muted-foreground hover:text-primary space-y-2">
                <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-[10px] sm:text-xs font-medium text-center px-2">Tải ảnh lên</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-5 bg-muted/20">
            <h3 className="font-semibold text-lg border-b pb-2">
              Cấu trúc Bãi Đỗ Xe
            </h3>
            <div className="space-y-2 sm:w-1/2">
              <Label htmlFor="floors" className="flex items-center gap-2"><Layers className="w-4 h-4 text-muted-foreground" />Số tầng / khu vực <span className="text-red-500">*</span></Label>
              <Input
                id="floors"
                type="number"
                min="1"
                placeholder="VD: 3"
                value={data.floors}
                onChange={(e) => handleFloorsChange(e.target.value)}
              />
            </div>

            {Number(data.floors) > 0 && (
              <div className="space-y-3 pt-4">
                <Label className="flex items-center gap-2">Cấu hình sức chứa theo tầng <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: Number(data.floors) }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 bg-background p-2 rounded-md border text-sm"
                    >
                      <span className="font-medium whitespace-nowrap min-w-[60px]">
                        Tầng {index + 1}
                      </span>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Số chỗ đỗ"
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

          <div className="space-y-4 border rounded-lg p-5 bg-muted/20">
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">
              Địa chỉ bãi đỗ
            </h3>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />Địa chỉ (Sẽ tự động cập nhật bản đồ) <span className="text-red-500">*</span></Label>
              <Input
                id="address"
                placeholder="Nhập địa chỉ đầy đủ (VD: 254 Nguyễn Văn Linh, Đà Nẵng)"
                value={data.address}
                onChange={(e) => onChange("address", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="flex flex-col h-full min-h-[400px] lg:min-h-[600px] lg:sticky lg:top-0">
          <div className="space-y-2 flex flex-col h-full bg-muted/10 p-5 rounded-lg border">
            <Label className="text-lg font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Vị trí trên bản đồ <span className="text-red-500">*</span></Label>
            <span className="text-sm text-muted-foreground block mb-4">
              Nhấp vào bản đồ để xác định vị trí chính xác của bãi đỗ xe hoặc nhập địa chỉ vào ô ở bên trái để tự động tìm đến vị trí tương đối.
            </span>
            <div className="flex-1 w-full rounded-md overflow-hidden border shadow-sm relative min-h-[300px]">
              <MapLocationPicker 
                location={data.location} 
                addressSearch={data.address}
                onChange={(loc) => onChange("location", loc)} 
                onAddressSelect={(address) => onChange("address", address)}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
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
          Thông tin tóm tắt
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Thông tin Hồ sơ cá nhân
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Họ và Tên:</span>
              <span className="font-medium">{user.fullName}</span>
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
              <span className="text-muted-foreground">Số điện thoại:</span>
              <span className="font-medium">
                {data.phone || "Chưa cung cấp"}
              </span>
              <span className="text-muted-foreground">Mã Số Thuế:</span>
              <span className="font-medium">
                {data.taxCode || "Chưa cung cấp"}
              </span>
              <span className="text-muted-foreground">Giấy Phép KD:</span>
              <span className="font-medium">
                {data.businessLicense ? data.businessLicense.name : "Chưa tải lên"}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Chi tiết Bãi đỗ xe
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Tên bãi đỗ:</span>
              <span className="font-medium">
                {data.parkingLotName || "Chưa cung cấp"}
              </span>
              <span className="text-muted-foreground">Mô tả:</span>
              <span className="font-medium truncate" title={data.description}>
                {data.description || "Chưa cung cấp"}
              </span>
              <span className="text-muted-foreground">Địa chỉ:</span>
              <span className="font-medium">
                {data.address || "Chưa cung cấp"}
              </span>
              <span className="text-muted-foreground">Số lượng ảnh (Avatar):</span>
              <span className="font-medium">
                {data.images.length} (Ảnh số {data.avatarIndex + 1})
              </span>
              <span className="text-muted-foreground">Số tầng:</span>
              <span className="font-medium">{data.floors || "0"}</span>
              <span className="text-muted-foreground">Tổng số chỗ đỗ:</span>
              <span className="font-medium">{totalSlots}</span>
            </div>

            {Number(data.floors) > 0 && (
              <div className="mt-4">
                <span className="text-muted-foreground text-xs block mb-2">
                  Số chỗ đỗ theo từng tầng:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {data.floorSlots.map((slots: number | string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-muted px-2 py-1 rounded-md border"
                    >
                      Tầng {idx + 1}:{" "}
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
            Đồng ý với các điều khoản
          </Label>
          <p className="text-sm text-muted-foreground mt-2">
            Tôi xác nhận các thông tin trên là chính xác và tôi đồng ý với Thỏa thuận đối tác quản lý bãi đỗ GoPark.
          </p>
        </div>
      </div>
    </div>
  );
}



