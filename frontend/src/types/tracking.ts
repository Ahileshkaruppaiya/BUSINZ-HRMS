// ============================================================================
// VRM Enterprise HRM — Field Duty & GPS Live Tracking Type Definitions
// ============================================================================

export type DutyType = 
  | 'Site Visit' 
  | 'Customer Visit' 
  | 'Vendor Visit' 
  | 'Travel' 
  | 'Field Work' 
  | 'Other';

export type ScheduleType = 
  | 'One Day' 
  | 'Date Range' 
  | 'Weekly' 
  | 'Monthly' 
  | 'Custom Dates';

export type AttendanceType = 
  | 'Site Geofence' 
  | 'Flexible Field Check-in';

export type AssignmentStatus = 
  | 'Scheduled' 
  | 'Active' 
  | 'Completed' 
  | 'Cancelled';

export type TripStatus = 
  | 'Active' 
  | 'Completed' 
  | 'Cancelled';

export type GpsStatus = 
  | 'GPS Active' 
  | 'GPS Lost' 
  | 'GPS Off';

export type TrackingStatus = 
  | 'Travelling' 
  | 'On Site' 
  | 'Duty Active' 
  | 'Interrupted' 
  | 'Completed' 
  | 'Idle';

export type AlertType = 
  | 'GPS Disabled' 
  | 'Location Permission Denied' 
  | 'No Location Received' 
  | 'Low Accuracy' 
  | 'Tracking Interrupted';

export type AlertStatus = 'Open' | 'Resolved';

export interface FieldAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  dutyType: DutyType;
  scheduleType: ScheduleType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm (24hr e.g. "09:00")
  endTime: string;   // HH:mm (24hr e.g. "18:00")
  customerSiteName: string;
  siteAddress: string;
  purpose: string;
  trackingRequired: boolean;
  travelKmRequired: boolean;
  attendanceType: AttendanceType;
  siteLat?: number;
  siteLng?: number;
  allowedRadiusMeters: number; // e.g. 200
  notes?: string;
  status: AssignmentStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPoint {
  id: string;
  tripId: string;
  assignmentId: string;
  employeeId: string;
  recordedAt: string; // ISO String
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  speed?: number;    // in m/s or km/h
  batteryLevel?: number; // 0-100 percentage
  syncedOffline?: boolean;
}

export interface FieldTripSession {
  id: string;
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  dutyType: DutyType;
  customerSiteName: string;
  tripStartTime: string; // ISO
  tripEndTime?: string;  // ISO
  startLat: number;
  startLng: number;
  startAddress: string;
  endLat?: number;
  endLng?: number;
  endAddress?: string;
  totalKm: number;
  status: TripStatus;
  checkInTime?: string;  // ISO
  checkOutTime?: string; // ISO
  locationPoints: LocationPoint[];
  gpsStatus: GpsStatus;
  trackingStatus: TrackingStatus;
  lastGpsUpdate?: string; // ISO
  createdAt: string;
  updatedAt: string;
}

export interface TrackingAlert {
  id: string;
  assignmentId?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  alertType: AlertType;
  issueStartTime: string;
  issueEndTime?: string;
  durationMinutes?: number;
  lastKnownLocation?: string;
  lastKnownLat?: number;
  lastKnownLng?: number;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingOverviewMetrics {
  fieldEmployeesToday: number;
  currentlyTravelling: number;
  gpsIssues: number;
  totalKmToday: number;
}

export interface TodayFieldEmployeeItem {
  id: string;
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  dutyType: DutyType;
  customerSiteName: string;
  checkInTime?: string;
  travelKm: number;
  gpsStatus: GpsStatus;
  trackingStatus: TrackingStatus;
  lastUpdated: string;
  currentLat?: number;
  currentLng?: number;
  startLat?: number;
  startLng?: number;
  siteLat?: number;
  siteLng?: number;
  allowedRadius?: number;
  activeTripId?: string;
}
