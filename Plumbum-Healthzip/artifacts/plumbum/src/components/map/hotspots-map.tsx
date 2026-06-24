import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Hotspot {
  fips: string;
  city: string;
  search_count: number;
  avg_score: number;
  lat: number;
  lng: number;
}

interface Props {
  hotspots: Hotspot[];
}

function scoreColor(score: number): string {
  if (score >= 65) return "#A63D2F";
  if (score >= 35) return "#C07A2A";
  return "#4A7C59";
}

function DefaultCenter({ hotspots }: { hotspots: Hotspot[] }) {
  const map = useMap();
  useEffect(() => {
    if (hotspots.length === 0) return;
    const avgLat = hotspots.reduce((s, h) => s + h.lat, 0) / hotspots.length;
    const avgLng = hotspots.reduce((s, h) => s + h.lng, 0) / hotspots.length;
    map.setView([avgLat, avgLng], 6, { animate: false });
  }, [hotspots.length]);
  return null;
}

export default function HotspotsMap({ hotspots }: Props) {
  const maxCount = Math.max(...hotspots.map(h => h.search_count), 1);

  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <DefaultCenter hotspots={hotspots} />
      {hotspots.map(h => {
        const radiusPct = h.search_count / maxCount;
        const radius = 12 + radiusPct * 28;
        const opacity = 0.45 + radiusPct * 0.5;

        return (
          <CircleMarker
            key={h.fips}
            center={[h.lat, h.lng]}
            radius={radius}
            pathOptions={{
              color: scoreColor(h.avg_score),
              fillColor: scoreColor(h.avg_score),
              fillOpacity: opacity,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, lineHeight: 1.5 }}>
                <strong>{h.city}</strong><br />
                Tract {h.fips}<br />
                {h.search_count} searches · Avg score <strong>{h.avg_score}</strong>
                <br />
                <a
                  href={`/result?address=${encodeURIComponent(`${h.lat},${h.lng}`)}`}
                  style={{ color: "#A63D2F" }}
                >
                  View tract data →
                </a>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
