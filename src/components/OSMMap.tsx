import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { DeliveryPoint, OrderStatus } from '../types';
import 'leaflet/dist/leaflet.css';

interface Props {
  route: DeliveryPoint[];
  progress: number;
  status: OrderStatus;
  gpsOnline: boolean;
  issue: string | null;
}

const getTruckIcon = () => {
  return L.divIcon({
    html: `<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-blue-500 shadow-lg">
      <div class="w-1 h-3 bg-blue-500 transform rotate-45"></div>
    </div>`,
    iconSize: [32, 32],
    className: ''
  });
};

const getMarkerIcon = (index: number, isDelivered: boolean) => {
  const color = isDelivered ? 'green' : index % 2 ? 'gray' : 'blue';
  return L.divIcon({
    html: `<div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-${color}-500 ${color === 'green' ? 'bg-green-500' : color === 'blue' ? 'bg-blue-500' : 'bg-gray-500'} shadow-lg">
        ${isDelivered ? '✓' : index + 1}
      </div>
      <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${color === 'green' ? 'border-t-green-500' : color === 'blue' ? 'border-t-blue-500' : 'border-t-gray-500'}"></div>
    </div>`,
    iconSize: [32, 40],
    className: ''
  });
};

export function OSMMap({ route, progress, gpsOnline, issue }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      const container = document.getElementById('osm-map-container');
      if (!container) return;

      mapRef.current = L.map(container).setView([55.75, 37.62], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Удаляем старые маркеры
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylineRef.current?.remove();
    truckMarkerRef.current?.remove();

    if (route.length === 0) return;

    // Добавляем маркеры для каждой точки доставки
    route.forEach((point, index) => {
      const isDelivered = (point.sequence || 0) <= (route.length * progress / 100);
      const marker = L.marker([point.lat, point.lon], {
        icon: getMarkerIcon(index, isDelivered)
      }).bindPopup(`<strong>${point.address}</strong><br/>Точка ${index + 1}`);

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Рисуем маршрут
    const routeCoords = route.map(point => [point.lat, point.lon] as [number, number]);
    const completedCoords = routeCoords.slice(0, Math.floor(route.length * progress / 100) + 1);

    // Пройденная часть маршрута
    if (completedCoords.length > 1) {
      const completedPolyline = L.polyline(completedCoords, {
        color: gpsOnline ? '#3b82f6' : '#ef4444',
        weight: 3,
        opacity: 0.9,
        dashArray: '5, 5'
      }).addTo(map);
    }

    // Весь маршрут
    polylineRef.current = L.polyline(routeCoords, {
      color: '#9ca3af',
      weight: 2,
      opacity: 0.5,
      dashArray: '2, 5'
    }).addTo(map);
    polylineRef.current.addTo(map);

    // Добавляем маркер грузовика в текущую позицию
    if (route.length > 0) {
      const currentIndex = Math.min(Math.floor(route.length * progress / 100), route.length - 1);
      const currentPoint = route[currentIndex];

      truckMarkerRef.current = L.marker([currentPoint.lat, currentPoint.lon], {
        icon: getTruckIcon(),
        zIndexOffset: 1000
      }).bindPopup(`<strong>Грузовик</strong><br/>ETA: ${Math.round((100 - progress) * 16)} мин`);

      truckMarkerRef.current.addTo(map);
    }

    // Подгоняем карту под все маркеры
    if (markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 14 });
    }
  }, [route, progress, gpsOnline, issue]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 shadow-2xl overflow-hidden">
      <div id="osm-map-container" className="w-full h-[458px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20" />
    </div>
  );
}
