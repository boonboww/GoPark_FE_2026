"use client";
import React, { useState, useEffect, useMemo } from "react";
import { TopFilter, type ParkingFilters, type NearMeFilter } from "@/components/features/findParking/TopFilter";
import { ParkingMap } from "@/components/features/findParking/ParkingMap";
import { ParkingList } from "@/components/features/findParking/ParkingList";
import { parkingService } from "@/services/parking.service";

const CITY_LABELS: Record<string, string[]> = {
  hcm: ["hồ chí minh", "ho chi minh", "tp.hcm", "tphcm", "sài gòn", "sai gon"],
  hn: ["hà nội", "ha noi", "hn"],
  dn: ["đà nẵng", "da nang", "dn"],
};

const CITY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  hcm: { minLat: 10.63, maxLat: 11.10, minLng: 106.40, maxLng: 106.90 },
  hn: { minLat: 20.95, maxLat: 21.20, minLng: 105.70, maxLng: 105.95 },
  dn: { minLat: 15.95, maxLat: 16.25, minLng: 107.95, maxLng: 108.35 },
};

const CITY_FOCUS: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  hcm: { lat: 10.7758, lng: 106.7018, zoom: 11.5, name: "TP. Hồ Chí Minh" },
  hn: { lat: 21.0285, lng: 105.8542, zoom: 11.5, name: "Hà Nội" },
  dn: { lat: 16.0544, lng: 108.2022, zoom: 12, name: "Đà Nẵng" },
};

const toLowerSafe = (value: unknown) => String(value || "").toLowerCase();

const extractLotPrice = (lot: any) => Number(lot.minprice ?? lot.minPrice ?? 0);

const extractLotImageUrl = (lot: any): string | null => {
  const image = lot?.image;

  if (typeof image === "string" && image.trim()) {
    return image;
  }

  if (image && typeof image === "object") {
    if (typeof image.thumbnail === "string" && image.thumbnail.trim()) {
      return image.thumbnail;
    }

    if (Array.isArray(image.gallery)) {
      const firstGalleryImage = image.gallery.find(
        (value: unknown) => typeof value === "string" && value.trim(),
      );
      if (firstGalleryImage) return firstGalleryImage;
    }
  }

  return null;
};

const getLotCoordinates = (lot: any) => {
  const lat = Number(lot.lat ?? lot.latitude ?? lot.location?.lat);
  const lng = Number(lot.lng ?? lot.longitude ?? lot.location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

const isWithinCityBounds = (coordinates: { lat: number; lng: number }, city: string) => {
  const bounds = CITY_BOUNDS[city];
  if (!bounds) return false;

  return (
    coordinates.lat >= bounds.minLat &&
    coordinates.lat <= bounds.maxLat &&
    coordinates.lng >= bounds.minLng &&
    coordinates.lng <= bounds.maxLng
  );
};

const calculateDistanceKm = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) => {
  const earthRadiusKm = 6371;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const startLat = (from.lat * Math.PI) / 180;
  const endLat = (to.lat * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(startLat) * Math.cos(endLat);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getZoomByRadiusKm = (radiusKm: number) => {
  if (radiusKm <= 1) return 14.8;
  if (radiusKm <= 2) return 14.1;
  if (radiusKm <= 5) return 13.2;
  if (radiusKm <= 10) return 12.4;
  if (radiusKm <= 20) return 11.4;
  return 10.4;
};

export default function FindParkingPage() {
  const [destination, setDestination] = useState<{lng: number, lat: number, name: string, geojson?: any} | null>(null);
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParkingLot, setSelectedParkingLot] = useState<any | null>(null);
  const [directionRoute, setDirectionRoute] = useState<{coordinates: [number, number][]} | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [nearMeFilter, setNearMeFilter] = useState<NearMeFilter | null>(null);
  const [filters, setFilters] = useState<ParkingFilters>({
    city: "",
    priceSort: "",
  });
  const [searchTitle, setSearchTitle] = useState("");

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoading(true);
        const res = await parkingService.getAllParkingLots();
        if (res.data) {
          setParkingLots(res.data);
        } else if (Array.isArray(res)) {
          setParkingLots(res);
        }
      } catch (err) {
        console.error("Failed to fetch parking lots", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  const handleFilterChange = (nextFilters: ParkingFilters) => {
    setFilters(nextFilters);

    if (nextFilters.city) {
      setNearMeFilter(null);
      setDirectionRoute(null);
      setIsNavigating(false);
      setDestination(null);
    }
  };

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  };

  const handleNearMeChange = (filter: NearMeFilter | null) => {
    setNearMeFilter(filter);
    setDirectionRoute(null);
    setIsNavigating(false);
    setDestination(null);
  };

  const isPointInPolygon = (point: {lat: number, lng: number}, geojson: any): boolean => {
    if (!geojson || !geojson.coordinates) return false;
    const { lat, lng } = point;
    const polygons = geojson.type === 'MultiPolygon' ? geojson.coordinates : [geojson.coordinates];
    
    for (const polygon of polygons) {
      const ring = geojson.type === 'MultiPolygon' ? polygon[0] : polygon;
      const coords = Array.isArray(ring[0][0]) ? ring[0] : ring;
      
      let isInside = false;
      for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1];
        const xj = coords[j][0], yj = coords[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
      }
      if (isInside) return true;
    }
    return false;
  };

  const filteredParkingLots = useMemo(() => {
    const destinationCenter = destination ? { lat: destination.lat, lng: destination.lng } : null;
    const nearMeCenter = nearMeFilter?.origin || null;
    const nearMeRadius = nearMeFilter?.radiusKm || null;

    const lotsWithDistance = parkingLots.map((lot) => {
      const coordinates = getLotCoordinates(lot);
      const distanceKm = destinationCenter && coordinates
        ? calculateDistanceKm(destinationCenter, coordinates)
        : null;
      const nearMeDistanceKm = nearMeCenter && coordinates
        ? calculateDistanceKm(nearMeCenter, coordinates)
        : null;

      return {
        ...lot,
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        imageUrl: extractLotImageUrl(lot),
        distanceKm,
        nearMeDistanceKm,
      };
    });

    let result = lotsWithDistance.filter((lot) => {
      if (filters.city) {
        const coordinates = getLotCoordinates(lot);
        const address = toLowerSafe(lot.address);
        const candidates = CITY_LABELS[filters.city] || [];
        const matchesByAddress = candidates.some((keyword) => address.includes(keyword));
        const matchesByBounds = coordinates ? isWithinCityBounds(coordinates, filters.city) : false;
        if (!matchesByAddress && !matchesByBounds) return false;
      }
      
      if (searchTitle) {
        const titleRaw = toLowerSafe(lot.name);
        const addressRaw = toLowerSafe(lot.address);
        const queryRaw = searchTitle.toLowerCase();
        
        const titleClean = removeAccents(titleRaw);
        const addressClean = removeAccents(addressRaw);
        const queryClean = removeAccents(queryRaw);
        
        // 1. Text match (fuzzy/accent-insensitive)
        const matchesText = titleClean.includes(queryClean) || addressClean.includes(queryClean);
        
        // 2. Word-based match (refined)
        const STOP_WORDS = ["bai", "xe", "do", "car", "parking"];
        const queryWords = queryClean.split(' ').filter(w => w.length > 1);
        
        // If query has more than just stop words, filter stop words out for the match check
        const specificQueryWords = queryWords.filter(w => !STOP_WORDS.includes(w));
        const wordsToMatch = specificQueryWords.length > 0 ? specificQueryWords : queryWords;
        
        const matchesWords = wordsToMatch.length > 0 && wordsToMatch.every(word => 
          titleClean.includes(word) || addressClean.includes(word)
        );

        // 3. Geographic area match (strict)
        let matchesArea = false;
        if (destination?.geojson && lot.lat && lot.lng) {
          matchesArea = isPointInPolygon({ lat: lot.lat, lng: lot.lng }, destination.geojson);
        }

        // 4. Proximity match (point search)
        const isPointSearch = destination && !destination.geojson;
        const matchesProximity = isPointSearch && destinationCenter && lot.distanceKm !== null && lot.distanceKm < 2;
        
        // 5. Special City Check: If query contains "da nang", "ho chi minh", etc.
        let cityMismatch = false;
        if (queryClean.includes("da nang") && !addressClean.includes("da nang")) cityMismatch = true;
        if ((queryClean.includes("ho chi minh") || queryClean.includes("hcm") || queryClean.includes("sai gon")) && 
            !(addressClean.includes("ho chi minh") || addressClean.includes("hcm") || addressClean.includes("sai gon"))) cityMismatch = true;
        if (queryClean.includes("ha noi") && !addressClean.includes("ha noi")) cityMismatch = true;

        if (cityMismatch && !matchesArea && !matchesProximity) return false;
        
        if (!matchesText && !matchesWords && !matchesArea && !matchesProximity) return false;
      }

      if (!filters.city && nearMeCenter && nearMeRadius) {
        if (lot.nearMeDistanceKm === null || lot.nearMeDistanceKm > nearMeRadius) return false;
      }

      // Price Range Filtering
      const price = extractLotPrice(lot);
      if (filters.priceSort === "under-15") {
        if (price > 15000) return false;
      } else if (filters.priceSort === "15-30") {
        if (price < 15000 || price > 30000) return false;
      } else if (filters.priceSort === "above-30") {
        if (price < 30000) return false;
      }

      return true;
    });

    if (filters.priceSort === "asc") {
      result = [...result].sort((a, b) => extractLotPrice(a) - extractLotPrice(b));
    } else if (filters.priceSort === "desc") {
      result = [...result].sort((a, b) => extractLotPrice(b) - extractLotPrice(a));
    }

    return result;
  }, [parkingLots, destination, filters, nearMeFilter, searchTitle]);

  const mapParkingLots = useMemo(() => {
    const nearMeCenter = nearMeFilter?.origin || null;
    const nearMeRadius = nearMeFilter?.radiusKm || null;

    return parkingLots.map((lot) => {
      const coordinates = getLotCoordinates(lot);
      return {
        ...lot,
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        imageUrl: extractLotImageUrl(lot),
      };
    }).filter((lot) => {
      if (filters.city) {
        const coordinates = getLotCoordinates(lot);
        const address = toLowerSafe(lot.address);
        const candidates = CITY_LABELS[filters.city] || [];
        const matchesByAddress = candidates.some((keyword) => address.includes(keyword));
        const matchesByBounds = coordinates ? isWithinCityBounds(coordinates, filters.city) : false;
        if (!matchesByAddress && !matchesByBounds) return false;
      }

      if (!filters.city && nearMeCenter && nearMeRadius) {
        const coordinates = getLotCoordinates(lot);
        const distance = coordinates ? calculateDistanceKm(nearMeCenter, coordinates) : null;
        if (distance === null || distance > nearMeRadius) return false;
      }

      return true;
    });
  }, [parkingLots, filters, nearMeFilter]);

  const mapFocusTarget = useMemo(() => {
    if (filters.city && CITY_FOCUS[filters.city]) {
      const city = CITY_FOCUS[filters.city];
      return {
        lat: city.lat,
        lng: city.lng,
        zoom: city.zoom,
        name: city.name,
      };
    }

    if (nearMeFilter) {
      return {
        lat: nearMeFilter.origin.lat,
        lng: nearMeFilter.origin.lng,
        zoom: getZoomByRadiusKm(nearMeFilter.radiusKm),
        name: "Vị trí của bạn",
      };
    }

    if (destination) {
      return {
        lat: destination.lat,
        lng: destination.lng,
        zoom: 14,
        name: destination.name,
      };
    }

    return null;
  }, [filters.city, nearMeFilter, destination]);

  useEffect(() => {
    if (selectedParkingLot && !filteredParkingLots.some((lot) => lot.id === selectedParkingLot.id)) {
      setSelectedParkingLot(null);
      setDirectionRoute(null);
      setIsNavigating(false);
    }
  }, [filteredParkingLots, selectedParkingLot]);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <div className="w-full z-50">
        <TopFilter 
          onSearch={setDestination} 
          onFilterChange={handleFilterChange} 
          onNearMeChange={handleNearMeChange}
          onTextSearch={setSearchTitle}
        />
      </div>
      <div className="flex flex-1 relative overflow-hidden z-0">
        <ParkingList 
          parkingLots={filteredParkingLots} 
          loading={loading} 
          onSelectLot={setSelectedParkingLot} 
          selectedLotId={selectedParkingLot?.id} 
          onRouteFound={setDirectionRoute}
          onClearRoute={() => { setDirectionRoute(null); setIsNavigating(false); }}
          isNavigating={isNavigating}
          onStartNavigation={() => setIsNavigating(true)}
        />
        <ParkingMap 
          destination={destination} 
          parkingLots={mapParkingLots}
          selectedParkingLot={selectedParkingLot}
          setSelectedParkingLot={setSelectedParkingLot}
          directionRoute={directionRoute}
          isNavigating={isNavigating}
          focusTarget={mapFocusTarget}
          userLocation={nearMeFilter?.origin || null}
        />
      </div>
    </div>
  );
}