# VRM HRMS Mobile

Flutter mobile client for the HRMS web application.

## Run

Install Flutter 3.22+ and run:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Use the host machine IP instead of `10.0.2.2` on a physical device. The client uses the same backend authentication and employee/attendance/leave endpoints as the web application.

## Build

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://your-api.example.com/api/v1
```
