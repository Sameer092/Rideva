import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from "react";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { LatLng } from "@/types";
import { DEFAULT_REGION } from "@/constants";

export interface MapMarker {
  lat: number;
  lng: number;
  type: "pickup" | "dropoff" | "driver";
  /** Optional emoji marker (e.g. vehicle icon) rendered instead of a dot. */
  emoji?: string;
}

export interface OSMMapHandle {
  /** Center the map (react-native-maps-compatible signature). */
  animateToRegion: (region: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number }, duration?: number) => void;
  /** Fit the viewport around the given coordinates. */
  fitToCoordinates: (coords: LatLng[], opts?: unknown) => void;
}

interface OSMMapProps {
  center?: LatLng | null;
  zoom?: number;
  markers?: MapMarker[];
  polyline?: LatLng[];
  dark?: boolean;
  /** Report the map center after every pan/zoom (used by the location picker). */
  onRegionChange?: (center: LatLng) => void;
  interactive?: boolean;
}

/** Convert a react-native-maps latitudeDelta to an approximate Leaflet zoom. */
function deltaToZoom(delta?: number): number {
  if (!delta || delta <= 0) return 15;
  return Math.max(3, Math.min(19, Math.round(Math.log2(360 / delta))));
}

/**
 * A free, key-less map built on OpenStreetMap tiles rendered with Leaflet inside
 * a WebView. Replaces react-native-maps/Google Maps (which needs a billed key on
 * Android). Exposes a react-native-maps-compatible imperative API so the rest of
 * the app didn't need rewiring.
 */
export const OSMMap = forwardRef<OSMMapHandle, OSMMapProps>(function OSMMap(
  { center, zoom = 14, markers = [], polyline = [], dark = false, onRegionChange, interactive = true },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const start = center ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };

  const inject = (js: string) => webRef.current?.injectJavaScript(`${js}; true;`);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, _duration) =>
      inject(`window.rnSetView(${region.latitude}, ${region.longitude}, ${deltaToZoom(region.latitudeDelta)})`),
    fitToCoordinates: (coords) =>
      inject(`window.rnFitBounds(${JSON.stringify(coords)})`),
  }));

  // Push marker / polyline updates once the map is ready.
  useEffect(() => {
    if (ready) inject(`window.rnSetMarkers(${JSON.stringify(markers)})`);
  }, [ready, markers]);
  useEffect(() => {
    if (ready) inject(`window.rnSetPolyline(${JSON.stringify(polyline)})`);
  }, [ready, polyline]);
  useEffect(() => {
    if (ready && center) inject(`window.rnSetView(${center.latitude}, ${center.longitude}, ${zoom})`);
  }, [ready, center?.latitude, center?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  const html = useMemo(() => buildHtml(start.latitude, start.longitude, zoom, dark, interactive), []); // eslint-disable-line react-hooks/exhaustive-deps

  function onMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "ready") {
        setReady(true);
      } else if (msg.type === "region" && onRegionChange) {
        onRegionChange({ latitude: msg.lat, longitude: msg.lng });
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <WebView
      ref={webRef}
      originWhitelist={["*"]}
      source={{ html }}
      style={{ flex: 1, backgroundColor: dark ? "#0A0B0F" : "#e8eaed" }}
      onMessage={onMessage}
      scrollEnabled={false}
      overScrollMode="never"
      javaScriptEnabled
      domStorageEnabled
      androidLayerType="hardware"
      setBuiltInZoomControls={false}
    />
  );
});

function buildHtml(lat: number, lng: number, zoom: number, dark: boolean, interactive: boolean): string {
  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;background:${dark ? "#0A0B0F" : "#e8eaed"}}
.leaflet-control-attribution{font-size:8px;background:rgba(255,255,255,.6)}</style>
</head><body><div id="map"></div>
<script>
  var map = L.map('map', { zoomControl:false, attributionControl:true, dragging:${interactive}, tap:${interactive} }).setView([${lat},${lng}], ${zoom});
  L.tileLayer('${tileUrl}', { maxZoom:19, subdomains:'abcd', attribution:'© OpenStreetMap, © CARTO' }).addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var lineLayer = L.layerGroup().addTo(map);
  function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
  map.on('moveend', function(){ var c=map.getCenter(); post({type:'region', lat:c.lat, lng:c.lng}); });
  window.rnSetView = function(la,ln,z){ map.setView([la,ln], z || map.getZoom()); };
  window.rnFitBounds = function(cs){ if(cs && cs.length){ map.fitBounds(cs.map(function(c){return [c.latitude,c.longitude];}), {padding:[60,80]}); } };
  window.rnSetMarkers = function(ms){
    markerLayer.clearLayers();
    (ms||[]).forEach(function(m){
      var icon;
      if (m.emoji) {
        // Vehicle marker: emoji inside a white circle.
        icon = L.divIcon({ className:'', iconSize:[34,34], iconAnchor:[17,17],
          html:'<div style="width:30px;height:30px;border-radius:50%;background:#fff;border:1px solid rgba(0,0,0,.15);box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px">'+m.emoji+'</div>' });
      } else {
        var color = m.type==='dropoff' ? '#0B0D12' : (m.type==='driver' ? '#10B981' : '#6D5EF6');
        var radius = m.type==='dropoff' ? '4px' : '50%';
        icon = L.divIcon({ className:'', iconSize:[18,18], iconAnchor:[9,9],
          html:'<div style="width:16px;height:16px;border-radius:'+radius+';background:'+color+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>' });
      }
      L.marker([m.lat,m.lng], {icon:icon}).addTo(markerLayer);
    });
  };
  window.rnSetPolyline = function(cs){
    lineLayer.clearLayers();
    if(cs && cs.length>1){ L.polyline(cs.map(function(c){return [c.latitude,c.longitude];}), {color:'#6D5EF6', weight:4}).addTo(lineLayer); }
  };
  post({type:'ready'});
</script></body></html>`;
}
