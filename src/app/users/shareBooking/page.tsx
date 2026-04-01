import { email } from "zod";

export const mapDataBooking = (b : any) => {
    const startDate = new Date(b.start_time);
        const endDate = new Date(b.end_time);
        const startDateIso = startDate.toISOString().split("T")[0];
        const endDateIso = endDate.toISOString().split("T")[0];
        const floors = b.parkingLot?.parkingFloor || [];
        const floor = floors.find((f: any) => f.parkingZone?.length > 0);
        const zoneName = floor?.parkingZone?.[0].zone_name;

        const price = b.total_price || b.totalPrice || b.amount || b.price || b.cost || 0;

        const statusMap : any = {
            BOOKED:"Đã đặt",
            ACTIVE:"Đang hoạt động"
        }
        return {
          id : b.id,
          name : b.parkingLot.name,
          address : b.parkingLot.address,
          code : b.slot.code,
          floor_name: floor?.floor_name || "N/A",
          floor_number: floor?.floor_number ?? "N/A",
          floor_zone: zoneName,
          total_price: price,
          user_name: b.user.profile.name ,
          plate_number: b.vehicle.plate_number,
          type: b.slot.type,
          email:b.user.email,

          start_timestamp: startDate.getTime(),

          start_date: startDate.toLocaleDateString("vi-VN"),
          start_date_iso: startDateIso,
          end_date: endDate.toLocaleDateString("vi-VN"),
          end_date_iso: endDateIso,
          start_time: startDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          end_time: endDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: statusMap[b.status] || b.status,
          qrCodeContent: b.qrCode?.content
        }
    }