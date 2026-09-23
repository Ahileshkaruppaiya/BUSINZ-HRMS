import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vrm_hrms_mobile/main.dart';
import 'package:vrm_hrms_mobile/services/api_client.dart';

class FakeApiClient extends ApiClient {
  Map<String, dynamic>? lastPayload;

  @override
  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> payload,
  ) async {
    lastPayload = payload;
    return {'success': true};
  }
}

void main() {
  testWidgets('login validates empty credentials', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: LoginPage(api: FakeApiClient(), onLogin: (_) {})),
    );

    await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
    await tester.pump();

    expect(find.text('Enter your user ID and password.'), findsOneWidget);
  });

  testWidgets('quick actions navigate and check-in sends typed payload', (
    tester,
  ) async {
    final api = FakeApiClient();
    await tester.pumpWidget(
      MaterialApp(
        home: HomePage(
          api: api,
          user: const {
            'id': 'EMP-001',
            'name': 'Test Employee',
            'role': 'Employee',
          },
          onLogout: () async {},
        ),
      ),
    );

    await tester.tap(find.widgetWithText(ActionChip, 'Clock in'));
    await tester.pumpAndSettle();
    expect(find.text('Attendance'), findsWidgets);

    await tester.tap(find.widgetWithText(FilledButton, 'Check in'));
    await tester.pumpAndSettle();

    expect(api.lastPayload?['employeeId'], isA<String>());
    expect(api.lastPayload?['employeeId'], 'EMP-001');
    expect(api.lastPayload?['type'], 'IN');
    expect(api.lastPayload?['method'], 'MOBILE');
    expect(api.lastPayload?['timestamp'], isA<String>());
  });
}
