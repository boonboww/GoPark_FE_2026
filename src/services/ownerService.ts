import { OwnerProfileType, ParkingLotType, OwnerTotalsType } from "@/types/owner";
import { get } from "@/lib/api";

interface UserResDto {
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  avatar?: string;
  totalLots?: number;
}

export const getOwnerProfile = async (id: string): Promise<OwnerProfileType> => {
  if (!id || id === "undefined") {
    console.error("OwnerService: fetchProfile called with invalid ID:", id);
    throw new Error("Invalid User ID");
  }

  console.log(`OwnerService: Fetching data for /users/${id}`);
  // Thực hiện gọi API thật tới BE
  const response = await get<UserResDto>(`/users/${id}`);
  
  // Map dữ liệu từ BE (UserResDto) sang OwnerProfileType của FE
  return {
    name: response.fullName || response.name || "N/A",
    phone: response.phoneNumber || response.phone || "N/A",
    avatar: response.avatar || `https://i.pravatar.cc/150?u=${id}`,
    totalLots: response.totalLots || 0,
  };
};

export const getOwnerParkingLots = async (ownerId: string): Promise<ParkingLotType[]> => {
  return get<ParkingLotType[]>(`/parking-lots/owner/${ownerId}`);
};

export const getOwnerTotals = async (ownerId: string): Promise<OwnerTotalsType> => {
  return get<OwnerTotalsType>(`/parking-lots/owner/${ownerId}/totals`);
};

export const updateOwnerProfile = async (
  id: string,
  data: Partial<OwnerProfileType>,
): Promise<OwnerProfileType> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: data.name || "Nguyen Van A",
        phone: data.phone || "0901234567",
        avatar: data.avatar || "https://i.pravatar.cc/150?u=a",
        totalLots: data.totalLots || 3,
      });
    }, 800);
  });
};

export const changePassword = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 800);
  });
};
