import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ── Pin styles ─────────────────────────────────────────────────────────────────

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

export function getHeatmapColor(score: number): string {
  if (score >= 85) return "#7D0017"; // Lava Red
  if (score >= 70) return "#E63946"; // Crimson
  if (score >= 50) return "#F4A261"; // Orange
  if (score >= 30) return "#E9C46A"; // Amber
  return "#2A9D8F"; // Teal
}

// ── Main exported component ────────────────────────────────────────────────────

interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  interactive?: boolean;
  hideOverlays?: boolean;
  neighborhoodGeoJson?: any;
}

export default function LeafletMap({
  lat,
  lng,
  zoom = 13,
  interactive = true,
  hideOverlays = false,
  neighborhoodGeoJson,
}: LeafletMapProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  const toggleHeatmap = useCallback(() => setShowHeatmap((v) => !v), []);

  return (
    <div
      className="w-full h-full z-0 relative"
      data-testid={`map-container-${lat}-${lng}`}
      style={{ position: "relative" }}
    >
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
        {showHeatmap && neighborhoodGeoJson && (
          <GeoJSON
            key={JSON.stringify(neighborhoodGeoJson.features?.map((f: any) => f.properties?.GEOID || f.properties?.id))}
            data={neighborhoodGeoJson}
            style={(feature) => {
              const score = feature?.properties?.score ?? 45;
              return {
                fillColor: getHeatmapColor(score),
                fillOpacity: 0.5,
                weight: 1.5,
                color: "#1E1A17",
                opacity: 0.4,
              };
            }}
            onEachFeature={(feature, layer) => {
              const name = feature?.properties?.NAME ?? "Census Tract";
              const score = feature?.properties?.score ?? 0;
              layer.bindTooltip(
                `<div style="font-family:Inter,sans-serif;font-size:12px;"><strong>${name}</strong><br/>Predictive Risk: ${score}/100</div>`,
                { sticky: true }
              );
              layer.on({
                mouseover: (e: any) => {
                  e.target.setStyle({ fillOpacity: 0.7, weight: 2, color: "#FFFFFF" });
                },
                mouseout: (e: any) => {
                  e.target.setStyle({ fillOpacity: 0.5, weight: 1.5, color: "#1E1A17" });
                },
              });
            }}
          />
        )}
        <Marker position={[lat, lng]} icon={pulseIcon} />
      </MapContainer>

      {/* Control panel — positioned absolute within the outer wrapper, above the map */}
      {interactive && neighborhoodGeoJson && (
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "16px",
            zIndex: 1000,
            background: "#f8f6f1",
            border: "1px solid #1A1614",
            borderRadius: 0,
            padding: "14px 18px 12px",
            minWidth: "240px",
            fontFamily: "Inter, sans-serif",
            pointerEvents: "all",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#1A1614",
              letterSpacing: "0.01em",
              marginBottom: "12px",
              borderBottom: "1px solid #D6CFC8",
              paddingBottom: "8px",
            }}
          >
            Geographic Context
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={toggleHeatmap}
              style={{
                width: "14px",
                height: "14px",
                marginTop: "1px",
                accentColor: "#a63d2f",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#1A1614", lineHeight: "1.45", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Predictive Risk Heatmap
              <span style={{ display: "block", fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#7A6F65", fontSize: "10px", marginTop: "2px" }}>
                Plumbum ML assessment
              </span>
            </span>
          </label>

          {showHeatmap && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", marginLeft: "24px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", background: "#7D0017" }} />
                <span style={{ fontSize: "9px", color: "#5A5550", fontWeight: 600 }}>&gt;85</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", background: "#E63946" }} />
                <span style={{ fontSize: "9px", color: "#5A5550", fontWeight: 600 }}>&gt;70</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", background: "#F4A261" }} />
                <span style={{ fontSize: "9px", color: "#5A5550", fontWeight: 600 }}>&gt;50</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", background: "#E9C46A" }} />
                <span style={{ fontSize: "9px", color: "#5A5550", fontWeight: 600 }}>&gt;30</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", background: "#2A9D8F" }} />
                <span style={{ fontSize: "9px", color: "#5A5550", fontWeight: 600 }}>Low</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
