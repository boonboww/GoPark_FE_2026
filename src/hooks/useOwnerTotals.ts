import { useQuery } from "@tanstack/react-query";
import { getOwnerTotals } from "@/services/ownerService";
import { TEMP_OWNER_ID } from "@/stores/customer.store";
import { OwnerTotalsType } from "@/types/owner";

/**
 * Lấy thống kê tổng hợp các bãi của owner.
 * BE trả về dạng { statusCode, message, data: { totalParkingLots, ... } }
 */
export function useOwnerTotals() {
  return useQuery({
    queryKey: ["ownerTotals", TEMP_OWNER_ID],
    queryFn: () => getOwnerTotals(TEMP_OWNER_ID),
    staleTime: 1000 * 60 * 5,
    select: (res) => {
      // Unwrap nếu BE trả về { data: {...} }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = res as any;
      return (raw?.data ?? raw) as OwnerTotalsType;
    },
  });
}
