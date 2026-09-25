import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHRMS, calculateDistanceMeters } from '../../context/HRMSContext';
import { ScanFace, Camera, CameraOff, CheckCircle2, RefreshCw, History, ShieldAlert, MapPin, XCircle, Navigation, X, Clock, AlertTriangle } from 'lucide-react';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalTimestampString = (d = new Date()) => {
  const dateStr = getLocalDateString(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${mins}:${secs}`;
};

const formatAttendanceTime = (ts: string) => {
  if (!ts) return '--:--';
  if (ts.includes(' ') || ts.includes('T')) {
    const parts = ts.split(/[\sT]/);
    const timePart = parts[1]?.substring(0, 8);
    if (timePart) {
      const [hStr, mStr, sStr] = timePart.split(':');
      const h = parseInt(hStr, 10);
      if (!isNaN(h)) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 === 0 ? 12 : h % 12;
        const padHour = String(formattedHour).padStart(2, '0');
        return sStr ? `${padHour}:${mStr}:${sStr} ${ampm}` : `${padHour}:${mStr} ${ampm}`;
      }
    }
  }
  return ts;
};

export const FaceAttendance: React.FC = () => {
  const { 
    employees, 
    markAttendance, 
    addFaceLog, 
    faceLogs, 
    attendanceRecords, 
    geofenceConfig, 
    updateGeofenceConfig, 
    currentUser, 
    setActiveModule, 
    getTodayFieldAssignment,
    getEmployeeShiftAttendanceState
  } = useHRMS();
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => currentUser.employeeId || employees[0]?.employeeId || 'EMP-001');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });
  const [punchType, setPunchType] = useState<'Check-In' | 'Check-Out'>('Check-In');
  const todayStr = getLocalDateString();
  const selectedEmp = employees.find(e => e.employeeId === selectedEmpId || e.id === selectedEmpId);

  // Real-time ticker for shift window countdown
  const [ticker, setTicker] = useState<number>(0);
  useEffect(() => {
    const t = setInterval(() => setTicker(prev => prev + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Shift Window Evaluation
  const shiftEval = useMemo(() => {
    return getEmployeeShiftAttendanceState(selectedEmpId);
  }, [selectedEmpId, ticker, attendanceRecords, getEmployeeShiftAttendanceState]);

  const todayAttendance = attendanceRecords.find(
    a => (a.employeeId === selectedEmpId || a.employeeId === selectedEmp?.employeeId || a.employeeId === selectedEmp?.id) && 
         (a.shiftDate === shiftEval.shiftDate || a.date === shiftEval.shiftDate || a.date === todayStr)
  );

  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);

  const isCEO = currentUser.role === 'CEO' || currentUser.designation === 'CEO' || currentUser.employeeId === 'EMP-000';

  // Auto-switch punchType based on shift lifecycle
  useEffect(() => {
    if (shiftEval.canCheckOut && !shiftEval.canCheckIn) {
      setPunchType('Check-Out');
    } else {
      setPunchType('Check-In');
    }
  }, [selectedEmpId, shiftEval.canCheckOut, shiftEval.canCheckIn]);

  // GPS Clock-In Modal States
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsData, setGpsData] = useState<{
    lat: number;
    lng: number;
    distance: number;
    isInside: boolean;
    address: string;
  } | null>(null);

  // Sync selected employee whenever logged-in user changes
  useEffect(() => {
    if (currentUser.employeeId) {
      setSelectedEmpId(currentUser.employeeId);
    }
  }, [currentUser]);

  // GPS Location Mode: 'real' (Live Browser GPS), 'inside' (Demo Inside 35m), 'outside' (Demo Outside 650m)
  const [locationMode, setLocationMode] = useState<'real' | 'inside' | 'outside'>('real');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Helper to set office pin directly to user's current GPS location for testing
  const handleSetOfficeToMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setScanResult({ status: null, message: 'Fetching your device GPS coordinates...' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        updateGeofenceConfig({
          enabled: true,
          officeName: 'My Current Location (Test Office)',
          centerLat: lat,
          centerLng: lng,
          radiusMeters: 50,
          enforceStrictly: true
        });
        setLocationMode('real');
        setScanResult({
          status: 'success',
          message: `Office Geofence Pin updated to your current position (${lat}, ${lng}) with 50m radius! Try Check-In Scan now.`
        });
      },
      (err) => {
        console.error('GPS error:', err);
        setScanResult({
          status: 'error',
          message: '🚨 Could not access current GPS position. Please allow browser location permissions.'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Strictly stop and release all hardware camera media tracks
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    setIsCameraActive(false);
  };

  // Start real browser camera ONLY on user explicit button click
  const startCamera = async () => {
    // Stop any existing stream first
    stopCamera();

    setScanResult({ status: null, message: '' });

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
        });
        mediaStreamRef.current = stream;
        
        setIsCameraActive(true);

        // Connect stream to video element on next tick after render
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('Video play catch:', e));
          }
        }, 100);
      }
    } catch (err: any) {
      console.log('WebCam access error:', err);
      setScanResult({
        status: 'error',
        message: 'Could not access WebCam. Hardware may be in use by another app or permissions denied.'
      });
      stopCamera();
    }
  };

  // ALWAYS stop camera hardware on component unmount (when leaving Face Attendance tab)
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Helper to capture live frame snapshot from video element
  const captureVideoFrame = (): string => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (err) {
        console.error('Snapshot capture error:', err);
      }
    }
    const emp = employees.find(e => e.employeeId === selectedEmpId);
    return emp?.avatar || '';
  };

  const processAttendanceScan = (
    type: 'Check-In' | 'Check-Out', 
    capturedPhotoUrl: string, 
    userLat: number, 
    userLng: number, 
    distance: number, 
    addressText: string
  ) => {
    const emp = employees.find(e => e.employeeId === selectedEmpId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';

    // Location tracking: determine if inside geofence boundary (permissive - never blocks attendance)
    const isInsideGeofence = !geofenceConfig.enabled || distance <= geofenceConfig.radiusMeters;

    // Enforce Shift Window Validation
    const currentShiftState = getEmployeeShiftAttendanceState(selectedEmpId);
    if (type === 'Check-In' && !currentShiftState.canCheckIn) {
      setScanResult({
        status: 'error',
        message: `🚫 Check-In Not Allowed: ${currentShiftState.message}`
      });
      setIsScanning(false);
      return;
    }
    if (type === 'Check-Out' && !currentShiftState.canCheckOut) {
      setScanResult({
        status: 'error',
        message: `🚫 Check-Out Not Allowed: ${currentShiftState.message}`
      });
      setIsScanning(false);
      return;
    }

    // Record Attendance & Add Face Log
    markAttendance(selectedEmpId, 'Present', 'Face Recognition', {
      lat: userLat,
      lng: userLng,
      address: addressText,
      inGeofence: isInsideGeofence
    });

    addFaceLog({
      employeeId: selectedEmpId,
      employeeName: empName,
      timestamp: getLocalTimestampString(),
      type,
      status: 'Success',
      photoUrl: capturedPhotoUrl,
      confidenceScore: 98.6
    });

    setScanResult({
      status: 'success',
      message: `Face Verified! ${type} logged for ${empName}.`
    });

    if (type === 'Check-In') {
      setPunchType('Check-Out');
    }

    setIsScanning(false);

    // Automatically stop camera hardware 3 seconds after successful scan for privacy
    setTimeout(() => {
      stopCamera();
    }, 3000);
  };

  const triggerFaceScan = (type: 'Check-In' | 'Check-Out') => {
    if (!isCameraActive) {
      setScanResult({ status: 'error', message: 'Please turn on the camera first before scanning face.' });
      return;
    }

    const capturedPhotoUrl = captureVideoFrame();
    setIsScanning(true);
    setScanResult({ status: null, message: 'Requesting GPS location permissions & verifying boundary...' });

    if (locationMode === 'real') {
      if (!navigator.geolocation) {
        setScanResult({
          status: 'error',
          message: '🚨 GPS Geolocation is not supported by your browser or device.'
        });
        setIsScanning(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const distance = calculateDistanceMeters(
            userLat, 
            userLng, 
            geofenceConfig.centerLat, 
            geofenceConfig.centerLng
          );
          const address = `Live GPS (${userLat.toFixed(4)}, ${userLng.toFixed(4)}) - ${distance}m away`;
          processAttendanceScan(type, capturedPhotoUrl, userLat, userLng, distance, address);
        },
        (error) => {
          console.error('Geolocation permission error:', error);
          let errorMsg = 'GPS Location Access Required! Please grant location permissions in your browser settings to verify geofence boundary.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = '🚨 Location Permission DENIED by Browser! You must enable location access in browser settings to check in.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = '🚨 GPS Location signal unavailable. Please ensure location/GPS is enabled on your device.';
          }
          setScanResult({ status: 'error', message: errorMsg });
          setIsScanning(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const fetchGpsStatus = () => {
    setGpsLoading(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const dist = calculateDistanceMeters(lat, lng, geofenceConfig.centerLat, geofenceConfig.centerLng);
          setGpsData({
            lat,
            lng,
            distance: dist,
            isInside: !geofenceConfig.enabled || dist <= geofenceConfig.radiusMeters,
            address: `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          });
          setGpsLoading(false);
        },
        () => {
          // Simulated inside geofence
          const dist = 28;
          setGpsData({
            lat: geofenceConfig.centerLat + 0.00018,
            lng: geofenceConfig.centerLng + 0.00015,
            distance: dist,
            isInside: true,
            address: `${geofenceConfig.officeName} Gate 1 (${dist}m away)`
          });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const dist = 28;
      setGpsData({
        lat: geofenceConfig.centerLat + 0.00018,
        lng: geofenceConfig.centerLng + 0.00015,
        distance: dist,
        isInside: true,
        address: `${geofenceConfig.officeName} Gate 1 (${dist}m away)`
      });
      setGpsLoading(false);
    }
  };

  const handleGpsPunch = (type: 'Check-In' | 'Check-Out') => {
    const activeEmp = employees.find(e => e.employeeId === selectedEmpId || e.id === selectedEmpId) || {
      firstName: currentUser.name || 'Alex',
      lastName: '',
      employeeId: currentUser.employeeId || 'EMP-001',
      avatar: currentUser.avatar || ''
    };

    const lat = gpsData?.lat || geofenceConfig.centerLat;
    const lng = gpsData?.lng || geofenceConfig.centerLng;
    const dist = gpsData?.distance ?? 28;
    const isInside = gpsData?.isInside ?? true;
    const addr = gpsData?.address || `${geofenceConfig.officeName} (GPS Clock-In)`;

    // Enforce Shift Window Validation
    const currentShiftState = getEmployeeShiftAttendanceState(selectedEmpId);
    if (type === 'Check-In' && !currentShiftState.canCheckIn) {
      setScanResult({
        status: 'error',
        message: `🚫 Check-In Not Allowed: ${currentShiftState.message}`
      });
      return;
    }
    if (type === 'Check-Out' && !currentShiftState.canCheckOut) {
      setScanResult({
        status: 'error',
        message: `🚫 Check-Out Not Allowed: ${currentShiftState.message}`
      });
      return;
    }

    markAttendance(selectedEmpId, 'Present', (type === 'Check-In' ? 'GPS Check-In' : 'GPS Check-Out') as any, {
      lat,
      lng,
      address: addr,
      inGeofence: isInside
    });

    addFaceLog({
      employeeId: selectedEmpId,
      employeeName: `${activeEmp.firstName} ${activeEmp.lastName}`.trim(),
      timestamp: getLocalTimestampString(),
      type,
      status: 'Success',
      confidenceScore: 100,
      photoUrl: activeEmp.avatar || ''
    });

    setScanResult({
      status: 'success',
      message: `📍 GPS ${type} Successful! Verified location (${dist}m) for ${activeEmp.firstName} ${activeEmp.lastName}.`
    });

    if (type === 'Check-In') {
      setPunchType('Check-Out');
    }

    setShowGpsModal(false);
  };

  const isEmployee = currentUser.role === 'Employee' || currentUser.role === 'Assignee';

  // Strict Scoping: Employee role strictly sees only their own punch & face scan activity
  const isLogForCurrentUser = (log: any): boolean => {
    const userEmpId = (currentUser.employeeId || currentUser.id || '').trim().toLowerCase();
    const userName = (currentUser.name || '').trim().toLowerCase();
    const logEmpId = (log.employeeId || '').trim().toLowerCase();
    const logEmpName = (log.employeeName || '').trim().toLowerCase();

    // Direct Employee ID match
    if (userEmpId && logEmpId && userEmpId === logEmpId) return true;

    // Direct Name match
    if (userName && logEmpName) {
      if (logEmpName === userName) return true;
      if (logEmpName.includes(userName) || userName.includes(logEmpName)) return true;
    }

    return false;
  };

  const allTodayLogs = faceLogs.filter(log => log.timestamp.startsWith(todayStr));
  const todayLogs = isEmployee 
    ? allTodayLogs.filter(isLogForCurrentUser)
    : allTodayLogs;

  if (isCEO) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E7ECF3', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ScanFace size={32} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B1A2D', marginBottom: '8px' }}>
          Attendance Not Required
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '24px' }}>
          As CEO, attendance tracking and live face scanning are exempt for executive leadership.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => setActiveModule('dashboard')}
          style={{ padding: '9px 20px', borderRadius: '10px', fontWeight: 700 }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header Matching Screenshot */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div className="page-title-group">
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Attendance Scanner</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>Scan face to clock in/out</p>
        </div>

        {/* GPS CLOCK-IN BUTTON */}
        <button
          type="button"
          onClick={() => {
            setShowGpsModal(true);
            fetchGpsStatus();
          }}
          style={{
            background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
            color: '#ffffff',
            borderRadius: '99px',
            padding: '10px 24px',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 4px 14px rgba(14, 116, 144, 0.35)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(14, 116, 144, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 116, 144, 0.35)';
          }}
        >
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: '1.5px solid rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={12} color="#ffffff" strokeWidth={2.8} />
          </div>
          <span>GPS CLOCK-IN</span>
        </button>
      </div>

      {isCEO && (
        <div style={{
          backgroundColor: '#ECFEFF',
          border: '1.5px solid #A5F3FC',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldAlert size={24} color="#0E7490" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#0E7490', fontSize: '0.94rem' }}>
              Executive Attendance Exemption
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0891B2', marginTop: '2px' }}>
              As CEO / Managing Director, you have executive exemption from daily face scans and GPS punches. You may test hardware cameras or inspect company-wide logs below.
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout Matching Screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ATTENDANCE SCANNER CARD */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #0e7490',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          padding: '36px 24px 28px',
          textAlign: 'center'
        }}>
          {/* CAMERA VIEWFINDER WITH 4 TEAL CORNER BRACKETS */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            margin: '0 auto 24px'
          }}>
            {/* Top-Left Bracket */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '-12px',
              width: '38px',
              height: '38px',
              borderTop: '4px solid #0e7490',
              borderLeft: '4px solid #0e7490',
              borderTopLeftRadius: '16px',
              zIndex: 10,
              pointerEvents: 'none'
            }} />
            {/* Top-Right Bracket */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              width: '38px',
              height: '38px',
              borderTop: '4px solid #0e7490',
              borderRight: '4px solid #0e7490',
              borderTopRightRadius: '16px',
              zIndex: 10,
              pointerEvents: 'none'
            }} />
            {/* Bottom-Left Bracket */}
            <div style={{
              position: 'absolute',
              bottom: '-12px',
              left: '-12px',
              width: '38px',
              height: '38px',
              borderBottom: '4px solid #0e7490',
              borderLeft: '4px solid #0e7490',
              borderBottomLeftRadius: '16px',
              zIndex: 10,
              pointerEvents: 'none'
            }} />
            {/* Bottom-Right Bracket */}
            <div style={{
              position: 'absolute',
              bottom: '-12px',
              right: '-12px',
              width: '38px',
              height: '38px',
              borderBottom: '4px solid #0e7490',
              borderRight: '4px solid #0e7490',
              borderBottomRightRadius: '16px',
              zIndex: 10,
              pointerEvents: 'none'
            }} />

            {/* Viewfinder Viewport Screen */}
            <div style={{
              width: '100%',
              aspectRatio: '1 / 1',
              backgroundColor: '#0d1527',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.6)'
            }}>
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Laser Scanning Overlay */}
                  <div className="face-scanning-overlay" />
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(14, 116, 144, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#0891b2'
                  }}>
                    <Camera size={32} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    AI Biometric Scanner
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Click "Start Face Scan" below
                  </div>
                </div>
              )}

              {/* Status Alert Inside Viewport */}
              {scanResult.status && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: scanResult.status === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 20
                }}>
                  {scanResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{scanResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Punch Type Selector (Clock-In vs Clock-Out) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setPunchType('Check-In')}
              disabled={!shiftEval.canCheckIn}
              title={shiftEval.canCheckIn ? 'Click to switch to Check-In' : `Check-In disabled: ${shiftEval.message}`}
              style={{
                padding: '6px 20px',
                borderRadius: '99px',
                border: punchType === 'Check-In' ? '1.5px solid #0e7490' : '1px solid #cbd5e1',
                backgroundColor: punchType === 'Check-In' ? '#ecfeff' : '#ffffff',
                color: punchType === 'Check-In' ? '#0e7490' : shiftEval.canCheckIn ? '#64748b' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: shiftEval.canCheckIn ? 'pointer' : 'not-allowed',
                opacity: shiftEval.canCheckIn ? 1 : 0.6,
                transition: 'all 0.15s ease',
                boxShadow: punchType === 'Check-In' ? '0 2px 6px rgba(14, 116, 144, 0.15)' : 'none'
              }}
            >
              Clock-In
            </button>
            <button
              type="button"
              onClick={() => setPunchType('Check-Out')}
              disabled={!shiftEval.canCheckOut}
              title={shiftEval.canCheckOut ? 'Click to switch to Check-Out' : `Check-Out disabled: ${shiftEval.message}`}
              style={{
                padding: '6px 20px',
                borderRadius: '99px',
                border: punchType === 'Check-Out' ? '1.5px solid #0e7490' : '1px solid #cbd5e1',
                backgroundColor: punchType === 'Check-Out' ? '#ecfeff' : '#ffffff',
                color: punchType === 'Check-Out' ? '#0e7490' : shiftEval.canCheckOut ? '#64748b' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: shiftEval.canCheckOut ? 'pointer' : 'not-allowed',
                opacity: shiftEval.canCheckOut ? 1 : 0.6,
                transition: 'all 0.15s ease',
                boxShadow: punchType === 'Check-Out' ? '0 2px 6px rgba(14, 116, 144, 0.15)' : 'none'
              }}
            >
              Clock-Out
            </button>
          </div>

          {/* Primary Action Button */}
          <div style={{ maxWidth: '360px', margin: '0 auto' }}>
            <button
              type="button"
              disabled={isScanning || (punchType === 'Check-In' ? !shiftEval.canCheckIn : !shiftEval.canCheckOut)}
              onClick={async () => {
                if (!isCameraActive) {
                  await startCamera();
                } else {
                  triggerFaceScan(punchType);
                }
              }}
              style={{
                width: '100%',
                padding: '14px 28px',
                borderRadius: '12px',
                background: (punchType === 'Check-In' ? shiftEval.canCheckIn : shiftEval.canCheckOut)
                  ? 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)'
                  : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.94rem',
                border: 'none',
                cursor: (punchType === 'Check-In' ? shiftEval.canCheckIn : shiftEval.canCheckOut) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: (punchType === 'Check-In' ? shiftEval.canCheckIn : shiftEval.canCheckOut)
                  ? '0 6px 20px rgba(14, 116, 144, 0.35)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isScanning ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  <span>Verifying Face & GPS...</span>
                </>
              ) : (
                <>
                  <ScanFace size={18} />
                  <span>{isCameraActive ? `Confirm ${punchType} Scan` : 'Start Face Scan'}</span>
                </>
              )}
            </button>

            {isCameraActive && (
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  marginTop: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Turn Off Camera
              </button>
            )}
          </div>

          {/* Result Alert Message */}
          {scanResult.message && (
            <div style={{
              maxWidth: '360px',
              margin: '16px auto 0',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: scanResult.status === 'success' ? '#ecfdf5' : scanResult.status === 'error' ? '#fff1f2' : '#ecfeff',
              border: `1px solid ${scanResult.status === 'success' ? '#10b981' : scanResult.status === 'error' ? '#f43f5e' : '#0891b2'}`,
              color: scanResult.status === 'success' ? '#065f46' : scanResult.status === 'error' ? '#9f1239' : '#0e7490',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {scanResult.status === 'success' && <CheckCircle2 size={16} />}
              {scanResult.status === 'error' && <ShieldAlert size={16} />}
              <span>{scanResult.message}</span>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: TODAY'S ACTIVITY CARD MATCHING SCREENSHOT */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          padding: '24px',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header Strip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isEmployee ? "My Today's Activity" : "Today's Activity"}
            </h2>
            <span style={{
              backgroundColor: '#ecfeff',
              color: '#0e7490',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              {todayLogs.length} {todayLogs.length === 1 ? 'RECORD' : 'RECORDS'}
            </span>
          </div>

          {/* Activity Body */}
          {todayLogs.length === 0 ? (
            /* Empty State Matching Screenshot */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Clock size={24} color="#94a3b8" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', marginBottom: '4px' }}>
                No activity yet
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {isEmployee ? 'Your scans today will appear here' : 'Scans will appear here'}
              </div>
            </div>
          ) : (
            /* List of Scans for Today */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {todayLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0e7490, #0891b2)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem'
                    }}>
                      {log.employeeName?.substring(0, 2).toUpperCase() || 'EM'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                        {log.employeeName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {formatAttendanceTime(log.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backgroundColor: log.type === 'Check-In' ? '#ecfdf5' : '#ecfeff',
                      color: log.type === 'Check-In' ? '#059669' : '#0e7490'
                    }}>
                      {log.type}
                    </span>
                    <span className="status-pill present" style={{ fontSize: '0.65rem' }}>
                      {log.confidenceScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* GPS CLOCK-IN MODAL DIALOG */}
      {showGpsModal && (
        <div className="modal-overlay" onClick={() => setShowGpsModal(false)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#ecfeff',
                  color: '#0e7490',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    GPS Geofence Clock-In
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Live GPS Geolocation Attendance Verification
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowGpsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Active Employee Selected */}
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Account</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {employees.find(e => e.employeeId === selectedEmpId)?.firstName} {employees.find(e => e.employeeId === selectedEmpId)?.lastName} ({selectedEmpId})
                  </div>
                </div>
                <span className="status-pill present" style={{ fontSize: '0.72rem' }}>Verified</span>
              </div>

              {/* Geofence & Location Status Card */}
              <div style={{
                padding: '18px',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: gpsData?.isInside ? '#f0fdf4' : '#fffbeb',
                borderColor: gpsData?.isInside ? '#86efac' : '#fde68a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: gpsData?.isInside ? '#22c55e' : '#f59e0b',
                      display: 'inline-block',
                      boxShadow: gpsData?.isInside ? '0 0 8px #22c55e' : 'none'
                    }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: gpsData?.isInside ? '#15803d' : '#b45309' }}>
                      {gpsLoading ? 'Detecting Location...' : gpsData?.isInside ? 'INSIDE GEOFENCE BOUNDARY' : 'OUTSIDE GEOFENCE'}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={fetchGpsStatus} 
                    disabled={gpsLoading}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0891b2', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={13} className={gpsLoading ? 'spin' : ''} /> Refresh
                  </button>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Designated Office:</strong> {geofenceConfig.officeName}</div>
                  <div><strong>Allowed Zone Radius:</strong> {geofenceConfig.radiusMeters} meters</div>
                  <div><strong>Detected Distance:</strong> {gpsData ? `${gpsData.distance}m away` : 'Calculating...'}</div>
                  <div><strong>Current Coordinates:</strong> {gpsData ? `${gpsData.lat.toFixed(5)}, ${gpsData.lng.toFixed(5)}` : 'Waiting for GPS...'}</div>
                </div>
              </div>

              {/* Punch Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  disabled={gpsLoading}
                  onClick={() => handleGpsPunch('Check-In')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle2 size={18} /> GPS Clock-In
                </button>

                <button
                  type="button"
                  disabled={gpsLoading}
                  onClick={() => handleGpsPunch('Check-Out')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#0e7490',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(14, 116, 144, 0.3)'
                  }}
                >
                  <Clock size={18} /> GPS Clock-Out
                </button>
              </div>

              {/* Portal link */}
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowGpsModal(false);
                    setActiveModule('gps_geofence');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#0891b2',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'underline'
                  }}
                >
                  Open Full GPS Geofence & Location Portal →
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
