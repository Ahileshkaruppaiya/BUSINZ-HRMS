import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  StopCircle,
  AlertTriangle,
  RotateCcw,
  Wifi,
  WifiOff,
  Maximize2
} from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';
import { TrackingMap, MapMarkerItem } from './TrackingMap';
import { formatKm } from '../../services/trackingEngine';
import { defaultLocationProvider, OfflineTrackingStorage } from '../../services/trackingLocationProvider';

export interface EmployeeTripTabProps {
  onTripEnded?: () => void;
}

export const EmployeeTripTab: React.FC<EmployeeTripTabProps> = ({ onTripEnded }) => {
  const {
    currentUser,
    fieldAssignments,
    tripSessions,
    recordLocationPoint,
    endTrip
  } = useHRMS();

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Network state listener & offline sync
  useEffect(() => {
    const updateOnline = () => {
      setIsOnline(true);
      // Synchronize offline points to Supabase / store
      const offlinePts = OfflineTrackingStorage.getOfflinePoints();
      if (offlinePts.length > 0 && activeTrip) {
        offlinePts.forEach((pt) => {
          recordLocationPoint(activeTrip.id, pt);
        });
        OfflineTrackingStorage.clearOfflinePoints(offlinePts.map((p) => p.id));
        setOfflinePendingCount(0);
      }
    };

    const updateOffline = () => {
      setIsOnline(false);
      setOfflinePendingCount(OfflineTrackingStorage.getOfflinePoints().length);
    };

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOffline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOffline);
    };
  }, []);

  // Find employee's active trip session
  const activeTrip = tripSessions.find(
    (t) => (t.employeeId === currentUser.employeeId || t.employeeId === currentUser.id || t.employeeName === currentUser.name) &&
           t.status === 'Active'
  ) || tripSessions.find(t => t.status === 'Active');

  const assignment = fieldAssignments.find((a) => a.id === activeTrip?.assignmentId);

  // Setup battery-efficient location tracking when trip is active
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'Active') return;

    // Use watchPosition or timed interval (every 2-5 mins / on move)
    const id = defaultLocationProvider.watchPosition(
      (pos) => {
        const pointData = {
          assignmentId: activeTrip.assignmentId,
          employeeId: activeTrip.employeeId,
          recordedAt: new Date(pos.timestamp).toISOString(),
          latitude: pos.lat,
          longitude: pos.lng,
          accuracy: pos.accuracy,
          speed: pos.speed
        };

        if (navigator.onLine) {
          recordLocationPoint(activeTrip.id, pointData);
        } else {
          // Offline storage
          OfflineTrackingStorage.saveOfflinePoint({
            ...pointData,
            id: `offline-pt-${Date.now()}`,
            tripId: activeTrip.id
          });
          setOfflinePendingCount(OfflineTrackingStorage.getOfflinePoints().length);
        }
      },
      (err) => {
        console.warn('GPS location tracking error:', err);
      }
    );

    setWatchId(id);

    return () => {
      if (id >= 0) defaultLocationProvider.clearWatch(id);
    };
  }, [activeTrip?.id]);

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    if (window.confirm(`Are you sure you want to end your trip? Current logged distance: ${formatKm(activeTrip.totalKm)}`)) {
      if (watchId !== null) defaultLocationProvider.clearWatch(watchId);

      try {
        const pos = await defaultLocationProvider.getCurrentPosition();
        endTrip(activeTrip.id, pos.lat, pos.lng, 'Destination Reached');
      } catch {
        const lastPt = activeTrip.locationPoints[activeTrip.locationPoints.length - 1];
        endTrip(
          activeTrip.id,
          lastPt?.latitude || activeTrip.startLat,
          lastPt?.longitude || activeTrip.startLng,
          'Destination'
        );
      }

      if (onTripEnded) onTripEnded();
    }
  };

  if (!activeTrip) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid #E7ECF3',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <Navigation size={42} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B1A2D' }}>No Active Trip in Progress</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '8px auto 0' }}>
          You do not have an active travel tracking session. Visit the <strong>My Duty</strong> tab to start your assigned trip.
        </p>
      </div>
    );
  }

  const routePoints: [number, number][] = activeTrip.locationPoints.map((pt) => [pt.latitude, pt.longitude]);
  const lastPoint = activeTrip.locationPoints[activeTrip.locationPoints.length - 1];
  const centerLat = lastPoint?.latitude || activeTrip.startLat;
  const centerLng = lastPoint?.longitude || activeTrip.startLng;

  const markers: MapMarkerItem[] = [
    {
      id: 'trip-start',
      lat: activeTrip.startLat,
      lng: activeTrip.startLng,
      title: 'Trip Start',
      subtitle: activeTrip.startAddress,
      iconType: 'start'
    },
    {
      id: 'current-pos',
      lat: centerLat,
      lng: centerLng,
      title: currentUser.name,
      avatar: currentUser.avatar,
      iconType: 'employee',
      pulse: true
    }
  ];

  if (assignment?.siteLat && assignment?.siteLng) {
    markers.push({
      id: 'assigned-site',
      lat: assignment.siteLat,
      lng: assignment.siteLng,
      title: assignment.customerSiteName,
      iconType: 'site'
    });
  }

  const tripStartTimeFormatted = new Date(activeTrip.tripStartTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '820px', margin: '0 auto' }}>
      {/* Offline sync banner if offline */}
      {!isOnline && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#92400E',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <WifiOff size={16} />
          <span>Offline — tracking data is safely cached locally and will sync automatically upon reconnection.</span>
        </div>
      )}

      {/* Active Trip Telemetry Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E7ECF3',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Banner Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E7ECF3',
            backgroundColor: '#FAFCFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: '#DCFCE7',
                color: '#166534',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
              TRIP ACTIVE
            </span>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B1A2D' }}>
              {activeTrip.customerSiteName}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem' }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>GPS ✓</span>
            <span style={{ color: isOnline ? '#16A34A' : '#D97706', fontWeight: 700 }}>
              Internet {isOnline ? '✓' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Live Numbers Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            padding: '18px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E7ECF3'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Start Time
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B1A2D', marginTop: '4px' }}>
              {tripStartTimeFormatted}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Current Distance
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0E7490', marginTop: '2px' }}>
              {formatKm(activeTrip.totalKm)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Sequential Points
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B1A2D', marginTop: '4px' }}>
              {activeTrip.locationPoints.length} points
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Tracking Engine
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16A34A', marginTop: '6px' }}>
              ● ACTIVE (Battery-Safe)
            </div>
          </div>
        </div>

        {/* Live Personal Route Map */}
        <div style={{ padding: '16px 20px' }}>
          <TrackingMap
            center={[centerLat, centerLng]}
            zoom={14}
            height="380px"
            markers={markers}
            routePoints={routePoints}
            circle={assignment?.attendanceType === 'Site Geofence' && assignment?.siteLat && assignment?.siteLng ? {
              lat: assignment.siteLat,
              lng: assignment.siteLng,
              radiusMeters: assignment.allowedRadiusMeters || 200,
              color: '#0E7490',
              fillColor: '#CFFAFE'
            } : undefined}
          />
        </div>

        {/* Buttons: End Trip */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E7ECF3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFCFE',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Origin: <strong>{activeTrip.startAddress}</strong>
          </div>

          <button
            type="button"
            onClick={handleEndTrip}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            <StopCircle size={18} />
            <span>END TRIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
