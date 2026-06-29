import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { interpolate } from "@/lib/translations";

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

function DefaultCenter({ hotspots }: Props) {
  const map = useMap();
  useEffect(() => {
    if (hotspots && hotspots.length > 0) {
      const first = hotspots[0];
      if (typeof first.lat === "number" && typeof first.lng === "number" && !isNaN(first.lat) && !isNaN(first.lng)) {
        map.setView([first.lat, first.lng], 6);
      }
    }
  }, [hotspots, map]);
  return null;
}

export default function HotspotsMap({ hotspots }: Props) {
  const { t } = useTranslation();
  const maxCount = Math.max(...hotspots.map(h => h.search_count), 1);

  return (
    <MapContainer
      center={[38.5, -96.0]}
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
                {interpolate(t.hotspots.tooltipTract, { fips: h.fips })}<br />
                {interpolate(t.hotspots.tooltipSearches, { count: h.search_count, score: h.avg_score })}
                <br />
                <a
                  href={`/result?address=${encodeURIComponent(`${h.lat},${h.lng}`)}`}
                  style={{ color: "#A63D2F" }}
                >
                  {t.hotspots.tooltipView}
                </a>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
