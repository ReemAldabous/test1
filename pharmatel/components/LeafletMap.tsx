import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import type { Pharmacy } from "@/models";

interface LeafletMapProps {
  pharmacies: Pharmacy[];
  centerLat?: number;
  centerLng?: number;
  height?: number;
}

export function LeafletMap({
  pharmacies,
  centerLat = 40.7128,
  centerLng = -74.006,
  height = 280,
}: LeafletMapProps) {
  const markersJs = pharmacies
    .filter((ph) => ph.lat != null && ph.lng != null)
    .map((ph) => {
      const color = ph.inStock ? "#10B981" : "#EF4444";
      const label = ph.inStock ? "In Stock" : "Out of Stock";
      const safeAddress = (ph.address ?? "Address unavailable").replace(
        /'/g,
        "\\'",
      );
      const safePhone = (ph.phone ?? "").replace(/'/g, "\\'");
      return `
        var marker${ph.id.replace(/[^a-z0-9]/gi, "")} = L.marker([${ph.lat}, ${ph.lng}], {
          icon: L.divIcon({
            className: '',
            html: '<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;left:4px;top:2px;width:12px;height:12px;background:${color};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.28)"></div><div style="position:absolute;left:8px;top:7px;width:4px;height:4px;background:white;border-radius:50%"></div></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 18],
          })
        }).addTo(map)
          .bindPopup('<div style="font-family:sans-serif;min-width:170px"><b style="font-size:14px">${ph.name.replace(/'/g, "\\'")}</b><br/><span style="color:#6B7280;font-size:12px">${safeAddress}</span>${safePhone ? `<br/><span style="color:#374151;font-size:12px">📞 ${safePhone}</span>` : ""}<br/><span style="color:${color};font-weight:600;font-size:12px">${label}</span>${ph.price ? `<br/><span style="color:#0A7EA4;font-size:13px;font-weight:600">${ph.price}</span>` : ""}</div>');
      `;
    })
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    #map { width: 100%; height: 100%; }
    .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
    .leaflet-popup-tip { background: white; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${centerLat}, ${centerLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Center marker (user location indicator)
    L.circle([${centerLat}, ${centerLng}], {
      color: '#0A7EA4',
      fillColor: '#0A7EA4',
      fillOpacity: 0.15,
      radius: 500,
      weight: 2,
    }).addTo(map);
    L.circleMarker([${centerLat}, ${centerLng}], {
      radius: 7,
      color: 'white',
      fillColor: '#0A7EA4',
      fillOpacity: 1,
      weight: 3,
    }).addTo(map).bindPopup('<b>Your location</b>');

    ${markersJs}
  </script>
</body>
</html>
  `;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { height }]}>
        <iframe
          srcDoc={html}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 16,
          }}
          sandbox="allow-scripts allow-same-origin"
          title="Pharmacy Map"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
