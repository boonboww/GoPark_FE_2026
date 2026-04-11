import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";
import { useCustomerStore } from "@/stores/customer.store";

interface UseBookingsOptions {
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const { lotId } = useCustomerStore();
  
  return useQuery({
    queryKey: ["bookings", lotId, options.search, options.startDate, options.endDate],
    queryFn: () => {
      // Return empty array if no lot selected to match previous logic
      if (!lotId) return [];
      
      return bookingService.getBookingsByParkingLot({
        lotId,
        search: options.search,
        startDate: options.startDate,
        endDate: options.endDate,
      });
    },
    enabled: lotId !== null,
  });
};
