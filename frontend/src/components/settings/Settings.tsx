import React, { useState, useEffect } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { NewSettingsSection } from '../../types/settings';
import { 
  Building2, 
  Clock, 
  CalendarDays, 
  CreditCard, 
  Trophy, 
  ShieldAlert, 
  User,
  Banknote,
  ArrowLeft
} from 'lucide-react';

import { UserProfile } from '../profile/UserProfile';
import { CompanyDetailsSettings } from './CompanyDetailsSettings';
import { AttendanceTimeSettings } from './AttendanceTimeSettings';
import { LeaveManagementSettings } from './LeaveManagementSettings';
import { PayrollSettings } from './PayrollSettings';
import { RewardsSettings } from './RewardsSettings';
import { AdvanceLoanPolicySettings } from './AdvanceLoanPolicySettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { SettingsDashboard } from './SettingsDashboard';

interface SettingsProps {
  onLogout?: () => void;
  initialSection?: NewSettingsSection;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackSection: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SettingsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Settings Error Caught by Boundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.fallbackSection !== this.props.fallbackSection && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '36px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #FEE2E2',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <ShieldAlert size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
            Settings Module Recovery
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 16px' }}>
            This settings section encountered a state conflict. Reload the module to restore fresh defaults.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: '8px 18px',
                backgroundColor: '#0E7490',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Reset to Defaults & Reload
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                padding: '8px 18px',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Retry View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Settings: React.FC<SettingsProps> = ({ onLogout, initialSection }) => {
  const { setActiveSettingsTab, currentUser } = useHRMS();
  const isEmployee = currentUser.role === 'Employee';

  // If initialSection is passed (e.g. from profile or other nav), open it; otherwise show separate one-by-one cards list (null)
  const [activeSection, setActiveSection] = useState<NewSettingsSection | null>(() => {
    if (initialSection) return initialSection;
    return null;
  });

  // Synchronize when initialSection changes externally
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSelectSection = (id: NewSettingsSection | null) => {
    setActiveSection(id);
    if (id) setActiveSettingsTab(id);
  };

  const getSectionTitle = (section: NewSettingsSection | null): string => {
    switch (section) {
      case 'my_profile': return 'Personal Profile & Credentials';
      case 'company_details': return 'Company Details';
      case 'attendance_time': return 'Attendance & Time';
      case 'leave_management': return 'Leave Management';
      case 'payroll_settings': return 'Payroll Settings';
      case 'rewards_recognition': return 'Rewards & Recognition';
      case 'advance_loan_policy': return 'Advance Salary Policy';
      case 'integrations': return '8. Third-Party Enterprise Integrations & APIs';
      default: return 'Settings';
    }
  };

  const renderActiveSectionContent = () => {
    if (isEmployee && activeSection !== 'my_profile') {
      return (
        <div style={{
          padding: '44px 28px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            Policy Restricted
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5', margin: '0 0 20px', maxWidth: '440px', marginInline: 'auto' }}>
            As an employee, company-wide policies require HR Administrator or Super Admin permissions to modify.
          </p>
          <button
            type="button"
            onClick={() => handleSelectSection('my_profile')}
            className="btn btn-primary btn-sm"
          >
            <User size={15} /> Return to Personal Profile
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case 'my_profile':
        return <UserProfile onLogout={onLogout} isEmbedded={true} />;
      case 'company_details':
        return <CompanyDetailsSettings />;
      case 'attendance_time':
        return <AttendanceTimeSettings />;
      case 'leave_management':
        return <LeaveManagementSettings />;
      case 'payroll_settings':
        return <PayrollSettings />;
      case 'rewards_recognition':
        return <RewardsSettings />;
      case 'advance_loan_policy':
        return <AdvanceLoanPolicySettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0 8px 48px', minHeight: '100%', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* If no section is selected (activeSection === null), show the Separate One-by-One Settings Cards List */}
      {activeSection === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Banner Card */}
          <div className="welcome-banner-card" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 className="welcome-banner-title">
                Settings
              </h1>
              <p className="welcome-banner-subtitle">
                Configure personal credentials, organizational rules, shift timings, and payroll structures.
              </p>
            </div>
          </div>

          {/* One by One Cards List */}
          <SettingsDashboard onSelectSection={handleSelectSection} />
        </div>
      ) : (
        /* If a section is selected, render it SEPARATELY in full-width with ONLY the back arrow icon */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {/* Top Back Bar with ONLY Back Icon Symbol */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '14px',
            border: '1px solid #E7ECF3',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleSelectSection(null)}
                title="Back"
                aria-label="Back"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#ECFEFF',
                  color: '#0E7490',
                  border: '1px solid #A5F3FC',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#CFFAFE'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ECFEFF'}
              >
                <ArrowLeft size={18} />
              </button>

              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {getSectionTitle(activeSection)}
              </span>
            </div>
          </div>

          {/* Full-Width Module Content Area (No sidebar squeezing it!) */}
          <main style={{ width: '100%' }}>
            <SettingsErrorBoundary fallbackSection={activeSection}>
              {renderActiveSectionContent()}
            </SettingsErrorBoundary>
          </main>
        </div>
      )}
    </div>
  );
};

export default Settings;
