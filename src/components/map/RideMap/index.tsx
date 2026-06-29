import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { VEHICLE_CLASSES, DEFAULT_REGION } from '@config/constant';

const VEHICLE_EMOJI = {
  motorcycle: '🏍️',
  rickshaw: '🛺',
  economy: '🚗',
  comfort: '🚙',
  xl: '🚐',
  premium: '🏎️',
};

function buildMarkers(pickup, dropoff, driver, vehicles) {
  const list = [];
  (vehicles || []).forEach((v) => list.push({ lat: v.lat, lng: v.lng, emoji: VEHICLE_EMOJI[v.vehicle_class] || '🚗' }));
  if (pickup) list.push({ lat: pickup.latitude, lng: pickup.longitude, type: 'pickup' });
  if (dropoff) list.push({ lat: dropoff.latitude, lng: dropoff.longitude, type: 'dropoff' });
  if (driver) list.push({ lat: driver.latitude, lng: driver.longitude, emoji: '🚗' });
  return list;
}

const RideMap = forwardRef(function RideMap({ center, pickup, dropoff, driver, vehicles, onRegionChange }, ref) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const start = center || pickup || dropoff || { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };

  const inject = (js) => webRef.current && webRef.current.injectJavaScript(`${js}; true;`);
  const markers = useMemo(() => buildMarkers(pickup, dropoff, driver, vehicles), [pickup, dropoff, driver, vehicles]);

  useImperativeHandle(ref, () => ({
    setCenter: (p, zoom) => inject(`window.rnSetView(${p.latitude}, ${p.longitude}, ${zoom || 15})`),
    fitTwo: (a, b) => inject(`window.rnFit(${JSON.stringify([a, b])})`),
  }));

  useEffect(() => {
    if (ready) inject(`window.rnSetMarkers(${JSON.stringify(markers)})`);
  }, [ready, markers]);

  useEffect(() => {
    if (ready && center) inject(`window.rnSetView(${center.latitude}, ${center.longitude}, 15)`);
  }, [ready, center && center.latitude, center && center.longitude]);

  const html = useMemo(() => buildHtml(start.latitude, start.longitude), []);

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') setReady(true);
      else if (msg.type === 'region' && onRegionChange) onRegionChange({ latitude: msg.lat, longitude: msg.lng });
    } catch (err) {}
  };

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      style={{ flex: 1, backgroundColor: '#e8eaed' }}
      onMessage={onMessage}
      scrollEnabled={false}
      javaScriptEnabled
      domStorageEnabled
      androidLayerType="hardware"
    />
  );
});

export default RideMap;

function buildHtml(lat, lng) {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e8eaed}.leaflet-control-attribution{font-size:8px}</style>
</head><body><div id="map"></div>
<script>
var map = L.map('map',{zoomControl:false}).setView([${lat},${lng}],15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd',attribution:'© OpenStreetMap, © CARTO'}).addTo(map);
var markerLayer = L.layerGroup().addTo(map);
function post(o){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
map.on('moveend', function(){ var c=map.getCenter(); post({type:'region',lat:c.lat,lng:c.lng}); });
window.rnSetView=function(la,ln,z){ map.setView([la,ln], z||map.getZoom()); };
window.rnFit=function(cs){ if(cs&&cs.length){ map.fitBounds(cs.map(function(c){return [c.latitude,c.longitude];}),{padding:[60,80]}); } };
window.rnSetMarkers=function(ms){
  markerLayer.clearLayers();
  (ms||[]).forEach(function(m){
    var icon;
    if(m.emoji){ icon=L.divIcon({className:'',iconSize:[34,34],iconAnchor:[17,17],html:'<div style="width:30px;height:30px;border-radius:50%;background:#fff;border:1px solid rgba(0,0,0,.15);box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px">'+m.emoji+'</div>'}); }
    else { var color=m.type==='dropoff'?'#0B0D12':'#6D5EF6'; var radius=m.type==='dropoff'?'4px':'50%'; icon=L.divIcon({className:'',iconSize:[18,18],iconAnchor:[9,9],html:'<div style="width:16px;height:16px;border-radius:'+radius+';background:'+color+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>'}); }
    L.marker([m.lat,m.lng],{icon:icon}).addTo(markerLayer);
  });
};
post({type:'ready'});
</script></body></html>`;
}
