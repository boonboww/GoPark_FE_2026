"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Home, Moon, Sun, ChevronDown, MapPin, DollarSign, Building, Loader2, Globe } from "lucide-react"
import Link from "next/link";
import { useTheme } from "next-themes";

interface Suggestion {
  lat: number;
  lng: number;
  name: string;
  display_name: string;
  geojson?: any;
  isLocal?: boolean;
}

export interface ParkingFilters {
  city: string;
  priceSort: string;
}

export interface NearMeFilter {
  origin: { lat: number; lng: number };
  radiusKm: number;
}

export function TopFilter({
  parkingLots = [],
  onSearch,
  onFilterChange,
  onNearMeChange,
  onTextSearch,
}: {
  parkingLots?: any[];
  onSearch?: (dst: { lng: number, lat: number, name: string, geojson?: any } | null) => void;
  onFilterChange?: (filters: ParkingFilters) => void;
  onNearMeChange?: (filter: NearMeFilter | null) => void;
  onTextSearch?: (text: string) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPriceSort, setSelectedPriceSort] = useState("");
  const [nearMeRadius, setNearMeRadius] = useState("2");
  const [nearMeFilter, setNearMeFilter] = useState<NearMeFilter | null>(null);
  const [isLocatingNearMe, setIsLocatingNearMe] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Đóng dropdown khi click ra ngoài
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchValue.trim()) {
      if (suggestions.length > 0) {
        setSuggestions([]);
      }
      return;
    }

    if (!showSuggestions) return; // Nếu vừa chọn từ danh sách thì không fetch lại

    searchTimeout.current = setTimeout(async () => {
      try {
        let localSuggestions: Suggestion[] = [];
        
        // Lọc bãi đỗ từ database (local)
        if (parkingLots.length > 0) {
          const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
          const keywordClean = removeAccents(searchValue);
          
          localSuggestions = parkingLots
            .filter((lot: any) => {
              const nameClean = removeAccents(lot.name || "");
              const addressClean = removeAccents(lot.address || "");
              
              // Loại bỏ các từ khóa chung chung khỏi query để tìm cụm từ chính (ví dụ: Thanh Khê)
              const specificKeyword = keywordClean.replace(/(bai do xe|bai do|bai giu xe|bai giu|parking|gopark)/g, "").trim();

              // Nếu người dùng chỉ gõ "bãi đỗ", "parking"... thì specificKeyword sẽ rỗng -> hiển thị bãi nào cũng được
              if (!specificKeyword) return true;
              
              // Tách cấu trúc từ để match bất chấp có dấu phẩy (vd: thanh khe da nang)
              const words = specificKeyword.split(/\s+/).filter((w: string) => w.length > 0);
              const nameMatchWords = words.every((w: string) => nameClean.includes(w));
              const addressMatchWords = words.every((w: string) => addressClean.includes(w));
              
              return nameClean.includes(specificKeyword) || addressClean.includes(specificKeyword) || nameMatchWords || addressMatchWords;
            })
            .slice(0, 8) // Lấy tối đa 8 bãi đỗ
            .map((lot: any) => {
              const lat = Number(lot.lat ?? lot.latitude ?? lot.location?.lat);
              const lng = Number(lot.lng ?? lot.longitude ?? lot.location?.lng);
              return {
                lat,
                lng,
                name: lot.name,
                display_name: lot.address || "Chưa cập nhật địa chỉ",
                isLocal: true
              };
            })
            .filter((sg: any) => !isNaN(sg.lat) && !isNaN(sg.lng));
        }

        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=5&countrycodes=vn&polygon_geojson=1`);
        const data = await res.json();
        
        let nominatimSuggestions: Suggestion[] = [];
        if (data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nominatimSuggestions = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name: item.name || item.display_name.split(',')[0],
            display_name: item.display_name,
            geojson: item.geojson,
            isLocal: false
          }));
        }

        // Kết hợp và ưu tiên bãi đỗ local lên trước
        setSuggestions([...localSuggestions, ...nominatimSuggestions].slice(0, 12));
      } catch (error) {
        console.error("Lỗi fetch gợi ý:", error);
      }
    }, 400); // 400ms debounce

  }, [searchValue, showSuggestions, parkingLots]);

  const handleSelectSuggestion = (sug: Suggestion) => {
    setSearchValue(sug.name);
    setShowSuggestions(false);
    onSearch?.({
      lat: sug.lat,
      lng: sug.lng,
      name: sug.name,
      geojson: sug.geojson
    });
  };

  const handleSearchClick = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);

    if (!searchValue.trim()) {
      onSearch?.(null);
      return;
    }

    // Nếu trong Suggestions đang có item khớp, lấy luôn thay vì fetch lại limit=1
    const matching = suggestions.find(s => s.name.toLowerCase() === searchValue.toLowerCase());
    if (matching) {
      onSearch?.({ lat: matching.lat, lng: matching.lng, name: matching.name });
      return;
    }

    setIsSearching(true);
    try {
      // Trigger text search for lot names
      onTextSearch?.(searchValue);

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1&countrycodes=vn&polygon_geojson=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        onSearch?.({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].name || data[0].display_name.split(',')[0],
          geojson: data[0].geojson
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  }

  const handleApplyFilters = () => {
    // Khi áp dụng bộ lọc (đặc biệt là lọc theo thành phố), ta nên reset lại thông tin tìm kiếm cũ
    // để tránh bị xung đột (ví dụ: đang tìm bãi ở Đà Nẵng, xong lại lọc xem thành phố HCM thì sẽ ko ra kết quả)
    setSearchValue("");
    onSearch?.(null);
    onTextSearch?.("");
    
    if (selectedCity) {
      setNearMeFilter(null);
      onNearMeChange?.(null);
    }

    onFilterChange?.({
      city: selectedCity,
      priceSort: selectedPriceSort,
    });
    setShowAdvanced(false);
  };

  const handleResetFilters = () => {
    setSelectedCity("");
    setSelectedPriceSort("");
    onFilterChange?.({
      city: "",
      priceSort: "",
    });
    setShowAdvanced(false);
  };

  const handleResetAll = () => {
    setSearchValue("");
    setSelectedCity("");
    setSelectedPriceSort("");
    setNearMeFilter(null);
    onSearch?.(null);
    onTextSearch?.("");
    onNearMeChange?.(null);
    onFilterChange?.({ city: "", priceSort: "" });
    setShowAdvanced(false);
  };

  const handleToggleNearMe = () => {
    if (nearMeFilter) {
      setNearMeFilter(null);
      onNearMeChange?.(null);
      return;
    }

    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ Geolocation");
      return;
    }

    setIsLocatingNearMe(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const filter = {
          origin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          radiusKm: Number(nearMeRadius),
        };

        setSelectedCity("");
        onFilterChange?.({ city: "", priceSort: selectedPriceSort });
        setNearMeFilter(filter);
        onNearMeChange?.(filter);
        setIsLocatingNearMe(false);
      },
      (error) => {
        console.error("Không thể lấy vị trí của bạn:", error);
        alert("Không thể lấy vị trí hiện tại.");
        setIsLocatingNearMe(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (!nearMeFilter) return;

    const updated = {
      ...nearMeFilter,
      radiusKm: Number(nearMeRadius),
    };
    setNearMeFilter(updated);
    onNearMeChange?.(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearMeRadius]);

  return (
    <div className="flex flex-col relative bg-background dark:bg-green-600 shadow-sm z-50 border-b transition-colors dark:border-[#059669]">
      <div className="flex items-center justify-between px-4 py-2 h-14 gap-4 relative z-50 bg-background dark:bg-green-600">
        {/* Nút về trang chủ */}
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full max-sm:hidden dark:text-white dark:hover:bg-[#059669]" type="button">
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        {/* Khung search chính */}
        <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
          <form onSubmit={handleSearchClick} className="flex items-center gap-2 bg-muted/50 dark:bg-black/30 p-1 rounded-full px-4 border border-transparent dark:border-white/20">
            <Search className="h-4 w-4 text-muted-foreground dark:text-white/70" />
            <Input
              id="top-search-input"
              className="border-none shadow-none bg-transparent focus-visible:ring-0 flex-1 dark:text-white dark:placeholder:text-white/50 h-8 text-sm"
              placeholder="Tìm kiếm khu vực, tên đường..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <Button type="submit" disabled={isSearching} size="sm" className="h-7 rounded-full px-3 md:px-4 text-xs font-medium">
              {isSearching ? <Loader2 className="h-3 w-3 animate-spin mr-1 md:mr-2" /> : null}
              Tìm
            </Button>
          </form>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-background dark:bg-[#064e3b] dark:text-white border shadow-lg rounded-xl overflow-hidden z-[60]">
              <ul className="py-1 max-h-75 overflow-y-auto">
                {suggestions.map((sug, i) => (
                  <li
                    key={i}
                    className="px-4 py-2 hover:bg-muted dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 text-sm transition-colors"
                    onClick={() => handleSelectSuggestion(sug)}
                  >
                    <div className={`p-1.5 rounded-full shrink-0 ${sug.isLocal ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-black/30 dark:text-gray-400'}`}>
                      {sug.isLocal ? <Building className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-bold truncate w-full">{sug.name}</span>
                      <span className="text-xs text-muted-foreground dark:text-white/70 truncate w-full">{sug.display_name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Cụm công cụ (Theme + Lọc nâng cao) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-input bg-background/90 dark:bg-black/30 px-2 py-1">
            <Button
              id="all-parking-btn"
              variant="outline"
              type="button"
              onClick={handleResetAll}
              className="rounded-full h-8 px-3 text-xs dark:text-white dark:border-white/30 dark:hover:bg-[#059669]"
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              Tất cả
            </Button>
            <div className="w-px h-4 bg-border mx-1 hidden sm:block"></div>
            <Button
              id="near-me-btn"
              variant={nearMeFilter ? "default" : "outline"}
              onClick={handleToggleNearMe}
              type="button"
              disabled={isLocatingNearMe || !!selectedCity}
              className="rounded-full h-8 px-3 text-xs"
            >
              {isLocatingNearMe ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <MapPin className="h-3.5 w-3.5 mr-1" />}
              {nearMeFilter ? "Đang lọc gần tôi" : "Gần tôi"}
            </Button>
            <select
              id="near-me-radius-select"
              value={nearMeRadius}
              onChange={(e) => setNearMeRadius(e.target.value)}
              className="border rounded-md px-2 py-1 text-xs bg-transparent dark:border-white/30 outline-none h-7 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!selectedCity || !nearMeFilter}
            >
              <option value="1" className="dark:bg-[#064e3b]">1km</option>
              <option value="2" className="dark:bg-[#064e3b]">2km</option>
              <option value="5" className="dark:bg-[#064e3b]">5km</option>
              <option value="30" className="dark:bg-[#064e3b]">30km</option>
            </select>
          </div>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full gap-2 transition-colors dark:text-white dark:hover:bg-[#059669] h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            onClick={() => setShowAdvanced(!showAdvanced)}
            type="button"
            className={"rounded-full gap-2 transition-colors h-9 px-4 text-sm " + (showAdvanced ? "bg-secondary dark:bg-[#059669] dark:text-white dark:border-[#059669]" : "dark:text-white dark:border-white/50 dark:hover:bg-[#059669]")}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">Lọc nâng cao</span>
            <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (showAdvanced ? "rotate-180" : "")} />
          </Button>
        </div>
      </div>

      {/* Dropdown Lọc nâng cao - Dính với thanh header, không đè màn trái */}
      {showAdvanced && (
        <div className="absolute top-14 right-0 lg:right-4 p-3 bg-background dark:bg-[#064e3b] border dark:border-white/20 shadow-xl rounded-b-xl lg:rounded-xl animate-in fade-in slide-in-from-top-2 dark:text-white z-40 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Lọc theo thành phố */}
            <div className="flex flex-col gap-1.5 min-w-37.5">
              <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground dark:text-white/80">
                <Building className="h-3.5 w-3.5" /> Thành phố
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border rounded-md px-2 py-1.5 text-sm bg-transparent dark:border-white/30 outline-none focus:border-primary dark:focus:border-white h-8"
              >
                <option value="" className="dark:bg-[#064e3b]">Chọn TP...</option>
                <option value="hcm" className="dark:bg-[#064e3b]">Hồ Chí Minh</option>
                <option value="hn" className="dark:bg-[#064e3b]">Hà Nội</option>
                <option value="dn" className="dark:bg-[#064e3b]">Đà Nẵng</option>
                <option value="hp" className="dark:bg-[#064e3b]">Hải Phòng</option>
                <option value="ct" className="dark:bg-[#064e3b]">Cần Thơ</option>
                <option value="nt" className="dark:bg-[#064e3b]">Nha Trang</option>
                <option value="dl" className="dark:bg-[#064e3b]">Đà Lạt</option>
                <option value="vt" className="dark:bg-[#064e3b]">Vũng Tàu</option>
              </select>
            </div>

            {/* Bộ lọc giá */}
            <div className="flex flex-col gap-1.5 min-w-45">
              <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground dark:text-white/80">
                <DollarSign className="h-3.5 w-3.5" /> Khoảng giá & Sắp xếp
              </label>
              <select
                value={selectedPriceSort}
                onChange={(e) => setSelectedPriceSort(e.target.value)}
                className="border rounded-md px-2 py-1.5 text-sm bg-transparent dark:border-white/30 outline-none focus:border-primary dark:focus:border-white h-8"
              >
                <optgroup label="Sắp xếp" className="dark:bg-[#064e3b]">
                  <option value="">Mặc định</option>
                  <option value="asc">Giá thấp đến cao</option>
                  <option value="desc">Giá cao đến thấp</option>
                  <option value="distance-asc">Gần tôi nhất</option>
                </optgroup>
                <optgroup label="Khoảng giá" className="dark:bg-[#064e3b]">
                  <option value="under-15">Dưới 15,000 VND</option>
                  <option value="15-30">15,000 - 30,000 VND</option>
                  <option value="above-30">Trên 30,000 VND</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t dark:border-white/10">
            <Button size="sm" variant="ghost" onClick={handleResetFilters} className="h-8 dark:text-white hover:bg-muted dark:hover:bg-white/10" type="button">Đặt lại</Button>
            <Button size="sm" onClick={handleApplyFilters} className="h-8 dark:bg-white dark:text-[#064e3b] dark:hover:bg-gray-200" type="button">Áp dụng</Button>
          </div>
        </div>
      )}
    </div>
  )
}
