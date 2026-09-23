import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  X,
  ShieldCheck,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { authService } from '../../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (identifier: string) => void;
  initialIdentifier?: string;
}

type Step = 'REQUEST_OTP' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialIdentifier = '',
}) => {
  const [step, setStep] = useState<Step>('REQUEST_OTP');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  // 6-digit OTP input boxes
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password reset fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Status and timers
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Simulated email toast preview for developers/testers
  const [simulatedEmail, setSimulatedEmail] = useState<{
    to: string;
    employeeName: string;
    otp: string;
  } | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Sync initial identifier if changed
  useEffect(() => {
    if (initialIdentifier) {
      setIdentifier(initialIdentifier);
    }
  }, [initialIdentifier]);

  // Resend 60-second cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password complexity checks per specification
  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword),
    matchesConfirm: Boolean(newPassword && confirmPassword && newPassword === confirmPassword),
  };

  const isPasswordCompliant =
    passwordRules.minLength &&
    passwordRules.hasUppercase &&
    passwordRules.hasLowercase &&
    passwordRules.hasNumber &&
    passwordRules.hasSpecialChar &&
    passwordRules.matchesConfirm;

  // Step 1: Request OTP Submission
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email address or employee ID.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.forgotPassword(identifier.trim());

      // Always show standard privacy notice
      setInfoMessage(res.message);
      if (res.recipientMasked) {
        setMaskedEmail(res.recipientMasked);
      }

      // If simulated OTP was generated (fallback/dev mode)
      if (res.simulatedOtp) {
        setSimulatedEmail({
          to: res.recipientMasked || identifier,
          employeeName: res.employeeName || identifier,
          otp: res.simulatedOtp,
        });
      }

      // Start 60-second cooldown
      setResendCooldown(60);
      setIsLoading(false);
      setStep('VERIFY_OTP');

      // Auto-focus first digit box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to process password reset request.');
    }
  };

  // Step 2: Handle OTP input box typing and paste
  const handleOtpChange = (index: number, value: string) => {
    // If pasting a full 6-digit code
    if (value.length > 1) {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      cleanDigits.forEach((digit, idx) => {
        if (idx < 6) newDigits[idx] = digit;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(cleanDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.verifyResetOtp(identifier.trim(), enteredOtp);
      setResetToken(res.resetToken);
      setIsLoading(false);
      setErrorMessage(null);
      setStep('RESET_PASSWORD');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    }
  };

  // Step 3: Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordCompliant) {
      setErrorMessage('Please ensure your password meets all complexity requirements.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await authService.resetPassword(resetToken, newPassword, confirmPassword);
      setIsLoading(false);
      setStep('SUCCESS');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to update password.');
    }
  };

  const copySimulatedOtp = () => {
    if (simulatedEmail?.otp) {
      navigator.clipboard.writeText(simulatedEmail.otp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
      // Auto-fill into boxes for extreme convenience
      const digits = simulatedEmail.otp.split('');
      setOtpDigits(digits);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #F1F5F9',
            backgroundColor: '#FAFCFD'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#ECFEFF',
                color: '#0E7490',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <KeyRound size={19} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {step === 'REQUEST_OTP' && 'Reset Your Password'}
                {step === 'VERIFY_OTP' && 'Verify Security Code'}
                {step === 'RESET_PASSWORD' && 'Create New Password'}
                {step === 'SUCCESS' && 'Password Updated'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                Businz HRMS Security Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Error Notice */}
          {errorMessage && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '11px 14px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '0.82rem',
                marginBottom: '16px',
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= STEP 1: REQUEST OTP ================= */}
          {step === 'REQUEST_OTP' && (
            <form onSubmit={handleRequestOtp}>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginTop: 0, marginBottom: '18px' }}>
                Enter your <strong>Registered Email Address</strong> or <strong>Employee ID</strong>. We will generate and dispatch a secure 6-digit verification code.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: '#334155', 
                    marginBottom: '7px' 
                  }}
                >
                  Registered Email OR Employee ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. employee@businz.com or EMP-001"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0E7490')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <Mail 
                    size={16} 
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: identifier.trim() && !isLoading ? '#0E7490' : '#94A3B8',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: identifier.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(14, 116, 144, 0.15)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Generating Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    color: '#64748B',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: VERIFY OTP ================= */}
          {step === 'VERIFY_OTP' && (
            <div>
              {/* Privacy Confirmation Banner */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFEFF',
                  border: '1px solid #BAE6FD',
                  color: '#0369A1',
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  marginBottom: '18px'
                }}
              >
                <Clock size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#0E7490' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#0E7490', marginBottom: '2px' }}>
                    Verification Code Sent
                  </div>
                  <span>{infoMessage || 'If this account exists, a verification code has been sent.'}</span>
                  {maskedEmail && (
                    <div style={{ marginTop: '3px', fontSize: '0.78rem', color: '#0284C7' }}>
                      Dispatched to: <strong>{maskedEmail}</strong> (Valid for 10 minutes)
                    </div>
                  )}
                </div>
              </div>

              {/* Simulated Email Toast for Testing / Offline Development */}
              {simulatedEmail && (
                <div 
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px dashed #0E7490',
                    marginBottom: '18px',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#0E7490' }}>
                      ✉️ Simulated In-App Mail Dispatch
                    </span>
                    <button
                      type="button"
                      onClick={copySimulatedOtp}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: copiedOtp ? '#DCFCE7' : '#FFFFFF',
                        color: copiedOtp ? '#166534' : '#0E7490',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedOtp ? <Check size={12} /> : <Copy size={12} />}
                      {copiedOtp ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <div style={{ color: '#475569', lineHeight: 1.4 }}>
                    Subject: <strong>HRMS Password Reset Verification</strong><br />
                    Code: <strong style={{ fontSize: '1.05rem', color: '#0E7490', letterSpacing: '2px' }}>{simulatedEmail.otp}</strong>
                  </div>
                </div>
              )}

              {/* 6-digit OTP Inputs */}
              <form onSubmit={handleVerifyOtp}>
                <label 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: '#334155', 
                    marginBottom: '8px' 
                  }}
                >
                  Enter 6-digit Verification Code
                </label>

                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '8px',
                    marginBottom: '20px'
                  }}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: '100%',
                        height: '52px',
                        textAlign: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        borderRadius: '10px',
                        border: digit ? '2px solid #0E7490' : '1.5px solid #CBD5E1',
                        backgroundColor: digit ? '#F0FDFA' : '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#0E7490')}
                      onBlur={(e) => (e.target.style.borderColor = digit ? '#0E7490' : '#CBD5E1')}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length !== 6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: otpDigits.join('').length === 6 && !isLoading ? '#0E7490' : '#94A3B8',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: otpDigits.join('').length === 6 && !isLoading ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <RotateCw size={16} className="animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Resend OTP with 60s cooldown */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('REQUEST_OTP');
                        setErrorMessage(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ArrowLeft size={13} /> Back
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={() => handleRequestOtp()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#94A3B8' : '#0E7490',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ================= STEP 3: RESET PASSWORD ================= */}
          {step === 'RESET_PASSWORD' && (
            <form onSubmit={handleResetPassword}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  fontSize: '0.82rem',
                  marginBottom: '16px'
                }}
              >
                <ShieldCheck size={17} color="#16A34A" />
                <span>Verification code confirmed. Choose a strong new password.</span>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '14px' }}>
                <label 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: '#334155', 
                    marginBottom: '6px' 
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0E7490')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <Lock 
                    size={16} 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: '#334155', 
                    marginBottom: '6px' 
                  }}
                >
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0E7490')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <Lock 
                    size={16} 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Live Password Rules Checklist */}
              <div 
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  PASSWORD SECURITY REQUIREMENTS:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: passwordRules.minLength ? '#16A34A' : '#64748B' }}>
                    <CheckCircle2 size={13} color={passwordRules.minLength ? '#16A34A' : '#CBD5E1'} />
                    <span>Min 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: passwordRules.hasUppercase ? '#16A34A' : '#64748B' }}>
                    <CheckCircle2 size={13} color={passwordRules.hasUppercase ? '#16A34A' : '#CBD5E1'} />
                    <span>1+ uppercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: passwordRules.hasLowercase ? '#16A34A' : '#64748B' }}>
                    <CheckCircle2 size={13} color={passwordRules.hasLowercase ? '#16A34A' : '#CBD5E1'} />
                    <span>1+ lowercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: passwordRules.hasNumber ? '#16A34A' : '#64748B' }}>
                    <CheckCircle2 size={13} color={passwordRules.hasNumber ? '#16A34A' : '#CBD5E1'} />
                    <span>1+ number</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: passwordRules.hasSpecialChar ? '#16A34A' : '#64748B' }}>
                    <CheckCircle2 size={13} color={passwordRules.hasSpecialChar ? '#16A34A' : '#CBD5E1'} />
                    <span>1+ special symbol</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: passwordRules.matchesConfirm ? '#16A34A' : '#64748B' }}>
                    <CheckCircle2 size={13} color={passwordRules.matchesConfirm ? '#16A34A' : '#CBD5E1'} />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={!isPasswordCompliant || isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: isPasswordCompliant && !isLoading ? '#0E7490' : '#94A3B8',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: isPasswordCompliant && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('VERIFY_OTP')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: '#64748B',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {step === 'SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Password Reset Successfully
              </h3>

              <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
                Your password has been securely updated. Please login with your new password.
              </p>

              <button
                type="button"
                onClick={() => {
                  onSuccess(identifier.trim());
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#0E7490',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(14, 116, 144, 0.2)'
                }}
              >
                <span>Return to Login</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
