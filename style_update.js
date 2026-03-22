const fs = require('fs');
let code = fs.readFileSync('src/app/users/findParking/components/ParkingMap.tsx', 'utf-8');
code = code.replace(/import \{ RotateCcw, Mountain, LocateFixed \} from \"lucide-react\";/g, 'import { RotateCcw, Mountain, LocateFixed, Layers } from \"lucide-react\";');
code = code.replace(/import \{ useEffect, useState \} from \"react\";/g, 'import React, { useEffect, useState } from \"react\";\nimport { type MapRef } from \"@/components/ui/map\";');

code = code.replace(/function MapController\(\) \{/g, 'function MapController({ mapStyle, onStyleChange }: { mapStyle: StyleKey; onStyleChange: (style: StyleKey) => void; }) {');

const htmlInjection = 
      {/* Cụm chọn loại bản đồ góc trên bên phải */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur p-1 rounded-md border shadow-sm">
          <Layers className="size-4 ml-2 text-muted-foreground" />
          <select
            value={mapStyle}
            onChange={(e) => onStyleChange(e.target.value as StyleKey)}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer p-1"
          >
            <option value="default">Bản đồ (Carto)</option>
            <option value="openstreetmap">OpenStreetMap</option>
            <option value="openstreetmap3d">OpenStreetMap 3D</option>
          </select>
        </div>
      </div>

      {myLocation && (;

code = code.replace(/\{myLocation && \(/, htmlInjection);


const parkingMapReplacement = /** Các loại bản đồ */
const mapStyles = {
  default: undefined,
  openstreetmap: "https://tiles.openfreemap.org/styles/bright",
  openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
};

type StyleKey = keyof typeof mapStyles;

export function ParkingMap() {
  const mapRef = React.useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState<StyleKey>("default");
  const selectedStyleUrl = mapStyles[mapStyle];
  const is3D = mapStyle === "openstreetmap3d";

  useEffect(() => {
    if (mapRef.current && is3D) {
      mapRef.current.easeTo({ pitch: 60, duration: 500 });
    }
  }, [is3D]);

  return (
    <div className="flex-1 relative h-full bg-slate-100 flex flex-col border-l overflow-hidden">
      <Map
        ref={mapRef}
        center={[108.2022, 16.0544]}
        zoom={14}
        className="w-full h-full"
        styles={
          selectedStyleUrl
            ? { light: selectedStyleUrl, dark: selectedStyleUrl }
            : undefined
        }
      >
        <MapController mapStyle={mapStyle} onStyleChange={setMapStyle} />
        <MapControls position="bottom-right" />
      </Map>
    </div>
  )
};

code = code.replace(/export function ParkingMap\(\) \{[\s\S]*\}\n?/, parkingMapReplacement);

fs.writeFileSync('src/app/users/findParking/components/ParkingMap.tsx', code);
console.log('done');
