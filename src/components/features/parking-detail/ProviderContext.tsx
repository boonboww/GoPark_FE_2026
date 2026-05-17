"use client";

import { get } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ParkingContext } from "./ParkingContext";

function ParkingProvider({
    children,
    defaultSlotId,
} : {
    children : React.ReactNode;
    defaultSlotId?: string;
}) {

    const [dataLot,setDataLot] = useState<any>({});
    const [loadingLot,setLoadingLot] = useState(true);
    const [selectedSpot, setSelectedSpot] = useState<any>(null);
    
    const params = useParams();
    const parkingLotId = params.id;

    useEffect(()=>{
        get(`/parking-lots/public/${parkingLotId}`)
        .then((res : any) => {
            console.log(res.data);
            setDataLot(res.data);
        }).catch((error : any)=>{
            console.log(error);
        }).finally(()=>{
            setLoadingLot(false);
        })
    },[parkingLotId])

    useEffect(() => {
        if (!defaultSlotId || !dataLot?.parkingFloor?.length) return;

        for (const floor of dataLot.parkingFloor) {
            for (const zone of floor.parkingZones || []) {
                const slot = (zone.slot || []).find((item: any) => String(item.id) === String(defaultSlotId));
                if (slot) {
                    setSelectedSpot({
                        floorName: floor.floor_name,
                        zoneName: zone.zone_name,
                        zoneId: zone.id,
                        slot,
                    });
                    return;
                }
            }
        }
    }, [dataLot, defaultSlotId])

    return(
        <ParkingContext.Provider value={{dataLot,setDataLot,loadingLot,
        setLoadingLot,selectedSpot,setSelectedSpot}}>
            {children}
        </ParkingContext.Provider>

    )
}
export default ParkingProvider;
