"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Checkpoint, LatLng } from "@/lib/mockRoutes";

function createCheckpointIcon(index: number) {
  return L.divIcon({
    html: `<div style="
      width:32px;
      height:32px;
      background-color:#1fae63;
      border:2px solid white;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:16px;
      font-weight:bold;
      color:white;
      transform:translate(-50%,-50%);
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
    ">${index}</div>`,
    className: "",
    iconSize: [32, 32],
  });
}

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
      {checkpoints.map((cp, index) => (
        <Marker key={cp.name} position={[cp.lat, cp.lng]} icon={createCheckpointIcon(index + 1)}>
          <Popup>{cp.name}</Popup>
        </Marker>
      ))}
      <FitBounds path={path} />
    </MapContainer>
  );
}
