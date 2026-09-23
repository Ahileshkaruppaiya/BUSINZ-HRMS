// ============================================================================
// VRM Enterprise HRM — Battery-Efficient GPS Tracking & Distance Engine
// ============================================================================

import { FieldAssignment, LocationPoint } from '../types/tracking';

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Converts meters to kilometers rounded to 2 decimal places.
 */
export function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100;
}

/**
 * Formats a KM number to string with 2 decimal places and 'KM' suffix (e.g. "46.28 KM").
 */
export function formatKm(km: number): string {
  return `${(Number(km) || 0).toFixed(2)} KM`;
}

/**
 * Validates whether a new location point is valid or an unrealistic GPS jump.
 * Discards points with excessive inaccuracy (>50m) or unrealistic speed (>150 km/h).
 */
export function isValidMovementPoint(
  prevPoint: LocationPoint | null,
  newLat: number,
  newLng: number,
  accuracyMeters: number = 20,
  timestampMs: number = Date.now()
): { valid: boolean; distanceMeters: number; reason?: string } {
  // Discard overly inaccurate readings
  if (accuracyMeters > 75) {
    return { valid: false, distanceMeters: 0, reason: 'Low GPS accuracy (>75m)' };
  }

  if (!prevPoint) {
    return { valid: true, distanceMeters: 0 };
  }

  const distanceMeters = calculateHaversineMeters(
    prevPoint.latitude,
    prevPoint.longitude,
    newLat,
    newLng
  );

  // If movement is under 15 meters, consider stationary to save battery and reduce jitter
  if (distanceMeters < 15) {
    return { valid: false, distanceMeters: 0, reason: 'Stationary (<15m movement)' };
  }

  // Check calculated speed between sequential points
  const timeDeltaSeconds = Math.max(1, (timestampMs - new Date(prevPoint.recordedAt).getTime()) / 1000);
  const speedKmPerHour = (distanceMeters / timeDeltaSeconds) * 3.6;

  // Jump filter: reject speeds higher than 150 km/h
  if (speedKmPerHour > 150) {
    return { valid: false, distanceMeters: 0, reason: `Unrealistic GPS jump (${Math.round(speedKmPerHour)} km/h)` };
  }

  return { valid: true, distanceMeters };
}

/**
 * Calculates the total cumulative travel distance across an array of sequential GPS points.
 */
export function calculateSequentialRouteKm(points: LocationPoint[]): number {
  if (!points || points.length < 2) return 0;

  let totalMeters = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dist = calculateHaversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    // Ignore isolated jumps > 50km
    if (dist < 50000) {
      totalMeters += dist;
    }
  }

  return metersToKm(totalMeters);
}

/**
 * Verifies if current time strictly falls within the approved duty schedule.
 * Tracking activates ONLY within this approved period!
 */
export function isTrackingScheduleActive(assignment: FieldAssignment, now: Date = new Date()): boolean {
  if (!assignment.trackingRequired || assignment.status === 'Cancelled' || assignment.status === 'Completed') {
    return false;
  }

  const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = assignment.startTime.split(':').map(Number);
  const [endH, endM] = assignment.endTime.split(':').map(Number);
  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  // Date Check
  if (assignment.scheduleType === 'One Day') {
    if (assignment.startDate !== todayStr) return false;
  } else if (assignment.scheduleType === 'Date Range') {
    if (todayStr < assignment.startDate || todayStr > assignment.endDate) return false;
  } else if (assignment.scheduleType === 'Weekly') {
    // If weekly, check if today is within date range and matches day of week of start date
    const startDayOfWeek = new Date(assignment.startDate).getDay();
    if (now.getDay() !== startDayOfWeek) return false;
    if (todayStr < assignment.startDate || todayStr > assignment.endDate) return false;
  }

  // Time Window Check
  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return false;
  }

  return true;
}

/**
 * Formats a 24-hour time "09:00" to "09:00 AM".
 */
export function formatTimeAmPm(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')} ${period}`;
}
