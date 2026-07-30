"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Checkpoint, LatLng } from "@/lib/mockRoutes";

const checkpointIcon = L.divIcon({
  html: '<div style="font-size:22px;line-height:1;transform:translate(-50%,-100%)">📍</div>',
  className: "",
  iconSize: [0, 0],
});

function FitBounds({ path }: { path: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length === 0) return;
    map.fitBounds(
      path.map((p) => [p.lat, p.lng]),
      { padding: [24, 24] },
    );
  }, [map, path]);
  return null;
}

export default function RouteMap({ path, checkpoints }: { path: LatLng[]; checkpoints: Checkpoint[] }) {
  const center: [number, number] = path.length
    ? [path[0].lat, path[0].lng]
    : [37.5215, 126.909];

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom={false} className="h-56 w-full rounded-2xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={path.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#1fae63", weight: 4 }} />
      {checkpoints.map((cp) => (
        <Marker key={cp.name} position={[cp.lat, cp.lng]} icon={checkpointIcon}>
          <Popup>{cp.name}</Popup>
        </Marker>
      ))}
      <FitBounds path={path} />
    </MapContainer>
  );
}
