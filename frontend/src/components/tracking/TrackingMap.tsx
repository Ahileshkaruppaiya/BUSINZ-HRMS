import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  avatar?: string;
  badge?: string;
  badgeColor?: string;
  popupHtml?: string;
  iconType?: 'employee' | 'start' | 'end' | 'site' | 'pin';
  pulse?: boolean;
}

export interface TrackingMapProps {
  center: [number, number];
  zoom?: number;
  height?: string | number;
  markers?: MapMarkerItem[];
  routePoints?: [number, number][];
  circle?: {
    lat: number;
    lng: number;
    radiusMeters: number;
    color?: string;
    fillColor?: string;
  };
  clickable?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  className?: string;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  center,
  zoom = 13,
  height = '420px',
  markers = [],
  routePoints = [],
  circle,
  clickable = false,
  onMapClick,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      if (clickable && onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const lat = Number(e.latlng.lat.toFixed(6));
          const lng = Number(e.latlng.lng.toFixed(6));
          onMapClick(lat, lng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Update center & zoom if changed
  useEffect(() => {
    if (mapInstanceRef.current && center[0] && center[1]) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Redraw dynamic layers (markers, polyline, circle)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Draw Route Polyline
    if (routePoints && routePoints.length > 1) {
      const polyline = L.polyline(routePoints, {
        color: '#0E7490',
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1,
        lineJoin: 'round',
        lineCap: 'round',
        dashArray: undefined
      });
      layerGroupRef.current.addLayer(polyline);

      // Add a subtle glowing shadow line behind
      const polylineGlow = L.polyline(routePoints, {
        color: '#38BDF8',
        weight: 8,
        opacity: 0.25,
        smoothFactor: 1
      });
      layerGroupRef.current.addLayer(polylineGlow);
    }

    // 2. Draw Geofence Circle
    if (circle && circle.lat && circle.lng && circle.radiusMeters > 0) {
      const circleLayer = L.circle([circle.lat, circle.lng], {
        radius: circle.radiusMeters,
        color: circle.color || '#0E7490',
        fillColor: circle.fillColor || '#CFFAFE',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '4, 4'
      });
      layerGroupRef.current.addLayer(circleLayer);
    }

    // 3. Draw Markers
    markers.forEach((m) => {
      let iconHtml = '';
      let iconSize: [number, number] = [36, 44];
      let iconAnchor: [number, number] = [18, 44];

      if (m.iconType === 'start') {
        iconHtml = `
          <div style="position: relative; width: 28px; height: 36px; transform: translate(-14px, -36px);">
            <div style="background: #10B981; color: white; font-weight: 800; font-size: 11px; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4); border: 2px solid #FFFFFF;">
              A
            </div>
            <div style="position: absolute; bottom: 2px; left: 14px; width: 2px; height: 8px; background: #10B981; transform: translateX(-50%);"></div>
          </div>
        `;
        iconSize = [28, 36];
        iconAnchor = [14, 36];
      } else if (m.iconType === 'end') {
        iconHtml = `
          <div style="position: relative; width: 28px; height: 36px; transform: translate(-14px, -36px);">
            <div style="background: #EF4444; color: white; font-weight: 800; font-size: 11px; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4); border: 2px solid #FFFFFF;">
              B
            </div>
            <div style="position: absolute; bottom: 2px; left: 14px; width: 2px; height: 8px; background: #EF4444; transform: translateX(-50%);"></div>
          </div>
        `;
        iconSize = [28, 36];
        iconAnchor = [14, 36];
      } else if (m.iconType === 'site') {
        iconHtml = `
          <div style="position: relative; width: 34px; height: 44px; transform: translate(-17px, -44px);">
            <svg viewBox="0 0 384 512" width="34" height="44" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
              <path fill="#F39C12" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
              <circle cx="192" cy="192" r="74" fill="#FFFFFF" />
              <circle cx="192" cy="192" r="46" fill="#D97706" />
            </svg>
          </div>
        `;
      } else {
        // Employee Live Pin
        const pulseEffect = m.pulse !== false ? `
          <div style="position: absolute; inset: -6px; border-radius: 50%; background: rgba(14, 116, 144, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        ` : '';
        const avatarImg = m.avatar 
          ? `<img src="${m.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`
          : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #0E7490; color: #FFFFFF; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center;">${(m.title || 'U').charAt(0)}</div>`;

        iconHtml = `
          <div style="position: relative; width: 38px; height: 48px; transform: translate(-19px, -48px); cursor: pointer;">
            ${pulseEffect}
            <div style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 4px 12px rgba(14, 116, 144, 0.4); border: 2.5px solid #0E7490; display: flex; align-items: center; justify-content: center; z-index: 2;">
              ${avatarImg}
            </div>
            <div style="position: absolute; bottom: 2px; left: 19px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid #0E7490; transform: translateX(-50%);"></div>
          </div>
        `;
        iconSize = [38, 48];
        iconAnchor = [19, 48];
      }

      const customIcon = L.divIcon({
        className: 'vrm-tracking-map-marker',
        html: iconHtml,
        iconSize,
        iconAnchor
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });

      if (m.popupHtml) {
        marker.bindPopup(m.popupHtml, {
          closeButton: false,
          offset: [0, -32],
          className: 'vrm-map-custom-popup'
        });
      }

      layerGroupRef.current?.addLayer(marker);
    });

    // Auto fit bounds if route points exist
    if (routePoints.length > 1 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(routePoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [markers, routePoints, circle]);

  return (
    <div
      ref={mapContainerRef}
      className={`tracking-map-container ${className}`}
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--color-border, #E7ECF3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
        zIndex: 1
      }}
    />
  );
};
