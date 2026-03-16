import { OwnerProfileType, ParkingLotType } from "../app/owner/account/owner";

export const getOwnerProfile = async (): Promise<OwnerProfileType> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Nguyen Van A",
        phone: "0901234567",
        avatar: "https://i.pravatar.cc/150?u=a",
        totalLots: 3,
      });
    }, 500);
  });
};

export const getOwnerParkingLots = async (): Promise<ParkingLotType[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Central Parking",
          address: "123 Le Loi, Da Nang",
          total_slots: 120,
        },
        {
          id: 2,
          name: "Beach Parking",
          address: "45 Vo Nguyen Giap, Da Nang",
          total_slots: 80,
        },
      ]);
    }, 800);
  });
};

export const updateOwnerProfile = async (
  data: Partial<OwnerProfileType>,
): Promise<OwnerProfileType> => {
  // Mock update
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
