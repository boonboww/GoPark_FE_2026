import { date } from "zod";

export const mapBookingData = (item: any) => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);

    const totalPrice = (item.invoice || []).reduce(
    (sum: number, inv: any) => sum + Number(inv.total || 0),
    0
    );

    const formatDate = (date: Date) =>
        date.toLocaleDateString("vi-VN", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

    const formatTime = (date: Date) =>
        date.toLocaleTimeString("vi-VN", {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })

        
    const statusMap: Record<string, string> = {
        CONFIRMED: "Đã xác nhận",
        ONGOING: "Đang hoạt động",
        COMPLETED: "Đã hoàn thành",
        PENDING: "Chờ xử lý"
    }


    return {
        id: item.id,
        name: item.slot?.parkingZone?.parkingFloor?.parkingLot?.name,
        address: item.slot?.parkingZone?.parkingFloor?.parkingLot?.address,
        code: item.slot.code,
        floor_zone: item.slot.parkingZone.zone_name,
        floor_name: item.slot.parkingZone.parkingFloor.floor_name,
        user_name: item.user.profile.name,
        plate_number: item.vehicle.plate_number,
        vehicle_brand: item.vehicle.brand || "Chưa cập nhật",
        vehicle_type: item.vehicle.type || "Chưa cập nhật",

        start_date: formatDate(start),
        start_time: formatTime(start),
        end_date: formatDate(end),
        end_time: formatTime(end),
        start_date_iso: item.start_time.split('T')[0],
        end_day_iso: item.end_time.split('T')[0],
        start_timestamp: start.getTime(),
        statusRaw: item.status,
        status: statusMap[item.status],
        total_price: totalPrice,
        end_time_raw: item.end_time,
        qrCode_content: item.qrCode?.content || "",
        image: item.slot?.parkingZone?.parkingFloor?.parkingLot?.image?.thumbnail || "",
    }
}