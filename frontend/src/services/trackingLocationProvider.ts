// ============================================================================
// VRM Enterprise HRM — Location Provider & Offline Synchronization Service
// ============================================================================

import { LocationPoint } from '../types/tracking';

export interface PositionCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  timestamp: number;
}

export interface ILocationProvider {
  getCurrentPosition(): Promise<PositionCoordinates>;
  watchPosition(
    onSuccess: (coords: PositionCoordinates) => void,
    onError: (err: GeolocationPositionError | { message: string }) => void,
    intervalMs?: number
  ): number;
  clearWatch(watchId: number): void;
}

const OFFLINE_STORAGE_KEY = 'vrm_field_tracking_offline_points';

/**
 * Browser Geolocation Provider
 * Uses navigator.geolocation with options optimized for field efficiency.
 */
export class BrowserLocationProvider implements ILocationProvider {
  getCurrentPosition(): Promise<PositionCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({ message: 'Geolocation is not supported by your browser or device.' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined, // m/s to km/h
            timestamp: pos.timestamp
          });
        },
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }

  watchPosition(
    onSuccess: (coords: PositionCoordinates) => void,
    onError: (err: GeolocationPositionError | { message: string }) => void
  ): number {
    if (!navigator.geolocation) {
      onError({ message: 'Geolocation is not supported on this device.' });
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (pos) => {
        onSuccess({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
          timestamp: pos.timestamp
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }

  clearWatch(watchId: number): void {
    if (watchId >= 0 && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}

/**
 * Offline Route Point Store & Auto-Sync
 * Caches location points when network connectivity drops, and syncs upon reconnection.
 */
export const OfflineTrackingStorage = {
  saveOfflinePoint(point: LocationPoint): void {
    try {
      const existing = OfflineTrackingStorage.getOfflinePoints();
      // Avoid duplicate points
      if (!existing.some(p => p.id === point.id)) {
        existing.push({ ...point, syncedOffline: true });
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existing));
      }
    } catch (e) {
      console.warn('Unable to persist offline tracking point', e);
    }
  },

  getOfflinePoints(): LocationPoint[] {
    try {
      const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  clearOfflinePoints(syncedPointIds: string[]): void {
    try {
      const existing = OfflineTrackingStorage.getOfflinePoints();
      const remaining = existing.filter(p => !syncedPointIds.includes(p.id));
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn('Failed to clear synced offline points', e);
    }
  }
};

export const defaultLocationProvider = new BrowserLocationProvider();
