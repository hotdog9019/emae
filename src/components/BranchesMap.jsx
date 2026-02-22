import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Переопределяем иконку через CDN напрямую (без require)
const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

function normalizeCoord(c) {
  if (!c) return null;

  // Массив [lat, lng]
  if (Array.isArray(c) && c.length >= 2) {
    const lat = parseFloat(c[0]);
    const lng = parseFloat(c[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  // Объект с lat/lng
  if (typeof c === "object" && c !== null) {
    let lat, lng;

    if (c.lat !== undefined && c.lng !== undefined) {
      lat = parseFloat(c.lat);
      lng = parseFloat(c.lng);
    } else if (c.latitude !== undefined && c.longitude !== undefined) {
      lat = parseFloat(c.latitude);
      lng = parseFloat(c.longitude);
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  return null;
}

export default function BranchesMap({ branches = [], onSelectBranch = () => {} }) {
  const list = useMemo(() => {
    if (!branches || branches.length === 0) return [];

    return branches
      .map((b) => {
        const pos = normalizeCoord(b.coord || b.coords || b.location);
        if (!pos) return null;
        return { ...b, pos };
      })
      .filter((x) => x !== null);
  }, [branches]);

  const center = list.length > 0 ? list[0].pos : [55.75, 37.62];

  return (
    <div className="map-wrap" style={{ position: "relative", zIndex: 1, borderRadius: "12px", overflow: "hidden" }}>
      {list.length === 0 ? (
        <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", color: "var(--muted)" }}>
          Филиалы загружаются...
        </div>
      ) : (
        <MapContainer center={center} zoom={11} style={{ height: 360, width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {list.map((b) => (
            <Marker key={`marker-${b.id}`} position={b.pos} icon={markerIcon}>
              <Popup>
                <div style={{ padding: "8px", color: "#000" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{b.name}</div>
                  <div style={{ color: "#7c5cff", fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
                    {b.theme}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 8 }}>
                    {b.description}
                  </div>
                  <button
                    onClick={() => onSelectBranch(b)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#7c5cff",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Выбрать
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}