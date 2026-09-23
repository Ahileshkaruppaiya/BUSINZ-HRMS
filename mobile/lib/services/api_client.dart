import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient({String? baseUrl}) : baseUrl = baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:8000/api/v1');

  final String baseUrl;
  String? token;

  Future<void> restoreToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('auth_token');
  }

  Future<void> clearToken() async {
    token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': identifier, 'password': password}),
    );
    final body = _decode(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(body['error']?['message'] ?? 'Unable to sign in');
    }
    token = body['data']?['accessToken'] as String?;
    if (token != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token!);
    }
    return Map<String, dynamic>.from(body['data']?['user'] ?? body['user'] ?? {});
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: _headers());
    final body = _decode(response);
    if (response.statusCode < 200 || response.statusCode >= 300) throw Exception(body['error']?['message'] ?? 'Request failed');
    return body;
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> payload) async {
    final response = await http.post(Uri.parse('$baseUrl$path'), headers: {..._headers(), 'Content-Type': 'application/json'}, body: jsonEncode(payload));
    final body = _decode(response);
    if (response.statusCode < 200 || response.statusCode >= 300) throw Exception(body['error']?['message'] ?? 'Request failed');
    return body;
  }

  Map<String, String> _headers() => {if (token != null) 'Authorization': 'Bearer $token'};
  Map<String, dynamic> _decode(http.Response response) => jsonDecode(response.body) is Map<String, dynamic> ? jsonDecode(response.body) as Map<String, dynamic> : <String, dynamic>{};
}
