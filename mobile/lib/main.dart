import 'package:flutter/material.dart';
import 'services/api_client.dart';

const teal = Color(0xFF0E7490);
const navy = Color(0xFF0F172A);

void main() => runApp(const HrmsApp());

void showMessage(BuildContext context, String message) =>
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

class HrmsApp extends StatefulWidget {
  const HrmsApp({super.key});
  @override
  State<HrmsApp> createState() => _HrmsAppState();
}

class _HrmsAppState extends State<HrmsApp> {
  final api = ApiClient();
  bool ready = false;
  Map<String, dynamic>? user;

  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    await api.restoreToken();
    if (api.token != null) {
      try {
        final result = await api.get('/auth/me');
        user = Map<String, dynamic>.from(
          result['data']?['user'] ?? result['user'] ?? {},
        );
      } catch (_) {
        await api.clearToken();
      }
    }
    if (mounted) setState(() => ready = true);
  }

  Future<void> _signOut() async {
    await api.clearToken();
    if (mounted) setState(() => user = null);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'VRM HRMS',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: teal),
          scaffoldBackgroundColor: const Color(0xFFF7FAFC),
        ),
        home: !ready
            ? const Scaffold(body: Center(child: CircularProgressIndicator()))
            : user == null
                ? LoginPage(
                    api: api,
                    onLogin: (value) => setState(() => user = value),
                  )
                : HomePage(api: api, user: user!, onLogout: _signOut),
      );
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.api, required this.onLogin});
  final ApiClient api;
  final ValueChanged<Map<String, dynamic>> onLogin;
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final identifier = TextEditingController();
  final password = TextEditingController();
  bool loading = false;
  bool obscure = true;
  String? error;

  Future<void> submit() async {
    if (identifier.text.trim().isEmpty || password.text.isEmpty) {
      setState(() => error = 'Enter your user ID and password.');
      return;
    }
    setState(() {
      loading = true;
      error = null;
    });
    try {
      widget.onLogin(
        await widget.api.login(identifier.text.trim(), password.text),
      );
    } catch (e) {
      if (mounted) {
        setState(() => error = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void dispose() {
    identifier.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(
                      Icons.business_center_rounded,
                      color: teal,
                      size: 64,
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Welcome to VRM HRMS',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: navy,
                      ),
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: identifier,
                      decoration: const InputDecoration(
                        labelText: 'Employee code or email',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: password,
                      obscureText: obscure,
                      onSubmitted: (_) => submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => obscure = !obscure),
                          icon: Icon(
                            obscure ? Icons.visibility : Icons.visibility_off,
                          ),
                        ),
                      ),
                    ),
                    if (error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          error!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    const SizedBox(height: 22),
                    FilledButton.icon(
                      onPressed: loading ? null : submit,
                      icon: loading
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.login),
                      label: Text(loading ? 'Signing in...' : 'Sign in'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
}

class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.api,
    required this.user,
    required this.onLogout,
  });
  final ApiClient api;
  final Map<String, dynamic> user;
  final Future<void> Function() onLogout;
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int index = 0;
  bool submittingPunch = false;

  String get employeeId =>
      (widget.user['employeeId'] ??
              widget.user['employee_id'] ??
              widget.user['id'] ??
              '')
          .toString();

  Future<void> punchIn() async {
    if (employeeId.isEmpty) {
      showMessage(context, 'Your account is missing an employee ID.');
      return;
    }
    setState(() => submittingPunch = true);
    try {
      await widget.api.post('/attendance/punch', {
        'employeeId': employeeId,
        'type': 'IN',
        'method': 'MOBILE',
        'timestamp': DateTime.now().toUtc().toIso8601String(),
      });
      if (mounted) showMessage(context, 'Check-in recorded successfully.');
    } catch (e) {
      if (mounted) {
        showMessage(context, e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => submittingPunch = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardPage(onNavigate: (value) => setState(() => index = value)),
      AttendancePage(loading: submittingPunch, onCheckIn: punchIn),
      const LeavePage(),
      const TasksPage(),
      ProfilePage(user: widget.user),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(
          ['Dashboard', 'Attendance', 'Leave', 'Tasks', 'Profile'][index],
        ),
        actions: [
          IconButton(
            onPressed: () => showMessage(context, 'No new notifications.'),
            icon: const Icon(Icons.notifications_none),
          ),
        ],
      ),
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.fingerprint),
            label: 'Attendance',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_note_outlined),
            label: 'Leave',
          ),
          NavigationDestination(icon: Icon(Icons.task_alt), label: 'Tasks'),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            children: [
              ListTile(
                leading: const CircleAvatar(child: Icon(Icons.person)),
                title: Text(widget.user['name']?.toString() ?? employeeId),
                subtitle:
                    Text(widget.user['role']?.toString() ?? 'Employee'),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Sign out'),
                onTap: () {
                  Navigator.pop(context);
                  widget.onLogout();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key, required this.onNavigate});
  final ValueChanged<int> onNavigate;
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Your HR workspace',
            style: TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.bold,
              color: navy,
            ),
          ),
          const SizedBox(height: 20),
          const Row(
            children: [
              Expanded(
                child: MetricCard(
                  title: 'Present today',
                  value: '84%',
                  icon: Icons.how_to_reg,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: MetricCard(
                  title: 'Open tasks',
                  value: '12',
                  icon: Icons.assignment_outlined,
                ),
              ),
            ],
          ),
          const SectionTitle(title: 'Quick actions'),
          Wrap(
            spacing: 10,
            children: [
              ActionChip(
                label: const Text('Clock in'),
                avatar: const Icon(Icons.fingerprint),
                onPressed: () => onNavigate(1),
              ),
              ActionChip(
                label: const Text('Apply leave'),
                avatar: const Icon(Icons.event_available),
                onPressed: () => onNavigate(2),
              ),
              ActionChip(
                label: const Text('My tasks'),
                avatar: const Icon(Icons.task_alt),
                onPressed: () => onNavigate(3),
              ),
            ],
          ),
        ],
      );
}

class AttendancePage extends StatelessWidget {
  const AttendancePage({
    super.key,
    required this.loading,
    required this.onCheckIn,
  });
  final bool loading;
  final VoidCallback onCheckIn;
  @override
  Widget build(BuildContext context) => Center(
        child: FilledButton.icon(
          onPressed: loading ? null : onCheckIn,
          icon: const Icon(Icons.login),
          label: Text(loading ? 'Checking in...' : 'Check in'),
        ),
      );
}

class LeavePage extends StatelessWidget {
  const LeavePage({super.key});
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SectionTitle(title: 'Leave balance'),
              FilledButton.icon(
                onPressed: () => showMessage(
                  context,
                  'Leave application form is available in the web portal.',
                ),
                icon: const Icon(Icons.add),
                label: const Text('Apply'),
              ),
            ],
          ),
          const RecordTile(
            title: 'Casual leave · 20 Sep',
            subtitle: 'Full day',
            status: 'Pending',
          ),
        ],
      );
}

class TasksPage extends StatelessWidget {
  const TasksPage({super.key});
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          SectionTitle(title: 'My tasks'),
          RecordTile(
            title: 'Review attendance exceptions',
            subtitle: 'Due today',
            status: 'In progress',
          ),
        ],
      );
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key, required this.user});
  final Map<String, dynamic> user;
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const CircleAvatar(
            radius: 42,
            backgroundColor: teal,
            child: Icon(Icons.person, size: 42, color: Colors.white),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              user['name']?.toString() ?? 'Employee',
              style: const TextStyle(fontSize: 21, fontWeight: FontWeight.bold),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: const Text('Work email'),
            subtitle: Text(user['email']?.toString() ?? 'Not provided'),
          ),
        ],
      );
}

class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
  });
  final String title;
  final String value;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: teal),
              const SizedBox(height: 12),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(title),
            ],
          ),
        ),
      );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: navy,
          ),
        ),
      );
}

class RecordTile extends StatelessWidget {
  const RecordTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.status,
  });
  final String title;
  final String subtitle;
  final String status;
  @override
  Widget build(BuildContext context) => Card(
        child: ListTile(
          title: Text(title),
          subtitle: Text(subtitle),
          trailing: Text(
            status,
            style: const TextStyle(color: teal, fontWeight: FontWeight.bold),
          ),
        ),
      );
}
