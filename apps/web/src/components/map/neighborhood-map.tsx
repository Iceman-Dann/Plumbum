import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const PIN_STYLE = `
  .plumbum-pin { position: relative; width: 24px; height: 24px; }
  .plumbum-pin-dot {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 12px; height: 12px;
    background: #A63D2F; border-radius: 50%;
    border: 2px solid #FFFFFF;
    z-index: 2;
  }
  .plumbum-pin-ring {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(1);
    width: 12px; height: 12px;
    border-radius: 50%;
    background: rgba(166, 61, 47, 0.35);
    z-index: 1;
    animation: pinPulse 1.8s ease-out infinite;
  }
  @keyframes pinPulse {
    0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; }
  }
`;

function InjectPinStyle() {
  useEffect(() => {
    if (document.getElementById("plumbum-pin-css")) return;
    const el = document.createElement("style");
    el.id = "plumbum-pin-css";
    el.textContent = PIN_STYLE;
    document.head.appendChild(el);
  }, []);
  return null;
}

const pulseIcon = L.divIcon({
  className: "",
  html: `<div class="plumbum-pin"><div class="plumbum-pin-ring"></div><div class="plumbum-pin-dot"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface NeighborhoodMapProps {
  lat: number;
  lng: number;
  geoJson: any;
}

function getHeatmapColor(score: number): string {
  if (score >= 80) return "#7A1F0F"; // Very High (dark red)
  if (score >= 60) return "#A63D2F"; // High (brick red)
  if (score >= 35) return "#C07A2A"; // Moderate (orange/amber)
  return "#4A7C59"; // Low (green)
}

export default function NeighborhoodMap({ lat, lng, geoJson }: NeighborhoodMapProps) {
  const styleFeature = (feature: any) => {
    const score = feature.properties?.score ?? 45;
    return {
      fillColor: getHeatmapColor(score),
      fillOpacity: 0.55,
      weight: 1.5,
      opacity: 0.8,
      color: "#5C5550", // Slate/brown border color
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties?.NAME ?? "Census Tract";
    const score = feature.properties?.score ?? 0;
    
    // Bind hover tooltip
    layer.bindTooltip(`<strong>${name}</strong><br/>Risk Score: ${score}/100`, {
      sticky: true,
      direction: "auto",
    });

    // Hover interaction styling
    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.75,
          weight: 2,
          color: "#A63D2F", // Highlight border with brand color
        });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.55,
          weight: 1.5,
          color: "#5C5550",
        });
      },
    });
  };

  return (
    <div className="w-full h-full z-0 relative" style={{ height: "500px" }}>
      <InjectPinStyle />
      <MapContainer
        center={[lat, lng]}
        zoom={12} // Bounding box fits nicely at zoom 12 for whole city
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
        zoomControl={true}
        attributionControl={false}
        className="w-full h-full"
        style={{ height: "500px", borderRadius: "8px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        {geoJson && (
          <GeoJSON
            key={JSON.stringify(geoJson.features?.map((f: any) => f.properties?.GEOID))} // Remount GeoJSON layer when tracts change
            data={geoJson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        <Marker position={[lat, lng]} icon={pulseIcon} />
      </MapContainer>
    </div>
  );
}
