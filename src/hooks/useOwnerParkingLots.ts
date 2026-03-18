import { useQuery } from "@tanstack/react-query";
import { getOwnerParkingLots } from "@/services/ownerService";
import { TEMP_OWNER_ID } from "@/stores/customer.store";
import { ParkingLotType } from "@/types/owner";

/**
 * Lấy danh sách bãi đỗ xe của owner.
 * BE trả về dạng { statusCode, message, data: [...] } hoặc trực tiếp [...]
 */
export function useOwnerParkingLots() {
  return useQuery({
    queryKey: ["parkingLots", TEMP_OWNER_ID],
    queryFn: () => getOwnerParkingLots(TEMP_OWNER_ID),
    staleTime: 1000 * 60 * 10,
    select: (res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = res as any;
      const list = raw?.data ?? raw;
      return (Array.isArray(list) ? list : []) as ParkingLotType[];
    },
  });
}

