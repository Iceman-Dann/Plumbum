import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  interactive?: boolean;
}

export default function LeafletMap({ lat, lng, zoom = 13, interactive = true }: LeafletMapProps) {
  return (
    <div className="w-full h-full z-0 relative" data-testid={`map-container-${lat}-${lng}`}>
      <InjectPinStyle />
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={interactive}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <Marker position={[lat, lng]} icon={pulseIcon} />
      </MapContainer>
    </div>
  );
}
