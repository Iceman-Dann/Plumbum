import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface School {
  place_id: string;
  name: string;
  score: number;
  lat: number;
  lng: number;
}

interface Props {
  schools: School[];
  centerLat: number;
  centerLng: number;
  highlightedId: string | null;
  onMarkerClick: (id: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 65) return "#A63D2F";
  if (score >= 35) return "#C07A2A";
  return "#4A7C59";
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function SchoolsMap({
  schools,
  centerLat,
  centerLng,
  highlightedId,
  onMarkerClick,
}: Props) {
  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={14}
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
      <RecenterOnChange lat={centerLat} lng={centerLng} />
      {schools.map(school => {
        const isHighlighted = school.place_id === highlightedId;
        return (
          <CircleMarker
            key={school.place_id}
            center={[school.lat, school.lng]}
            radius={isHighlighted ? 14 : 9}
            pathOptions={{
              color: "#FFFFFF",
              fillColor: scoreColor(school.score),
              fillOpacity: isHighlighted ? 1 : 0.85,
              weight: isHighlighted ? 2.5 : 1.5,
            }}
            eventHandlers={{ click: () => onMarkerClick(school.place_id) }}
          >
            <Tooltip permanent={isHighlighted} direction="top" offset={[0, -8]}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                {school.name} — <strong>{school.score}</strong>
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
