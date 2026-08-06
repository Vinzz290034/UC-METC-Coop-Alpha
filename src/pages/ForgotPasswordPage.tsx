import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FloatingInput } from '../components/FloatingInput';
import { apiClient } from '../services/api';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import { ChevronLeft, Mail, Lock, CheckCircle2 } from 'lucide-react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * { font-family: 'Inter', sans-serif; }

  /* 3D Floating Animations for Page Background (Solid Colors) */
  @keyframes float3d-a {
    0%   { transform: translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
    33%  { transform: translateY(-22px) rotateX(15deg) rotateY(20deg) rotateZ(5deg); }
    66%  { transform: translateY(-10px) rotateX(-10deg) rotateY(-10deg) rotateZ(-5deg); }
    100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  }
  @keyframes float3d-b {
    0%   { transform: translateY(0px) rotateX(0deg) rotateZ(0deg); }
    50%  { transform: translateY(-28px) rotateX(20deg) rotateZ(15deg); }
    100% { transform: translateY(0px) rotateX(0deg) rotateZ(0deg); }
  }
  @keyframes float3d-c {
    0%   { transform: translateY(0px) rotateY(0deg); }
    50%  { transform: translateY(-18px) rotateY(25deg); }
    100% { transform: translateY(0px) rotateY(0deg); }
  }
  @keyframes spin3d {
    from { transform: rotateX(20deg) rotateY(0deg); }
    to   { transform: rotateX(20deg) rotateY(360deg); }
  }

  /* Form Entrance Animation */
  @keyframes popInEntrance {
    0% {
      opacity: 0;
      transform: scale(0.92) translateY(20px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-float-a { animation: float3d-a 7s ease-in-out infinite; }
  .animate-float-b { animation: float3d-b 9s ease-in-out infinite; }
  .animate-float-c { animation: float3d-c 6s ease-in-out infinite; }
  .animate-spin-3d { animation: spin3d 12s linear infinite; }

  .page-pop-in {
    animation: popInEntrance 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) both;
  }

  /* Top Nav backdrop — light solid */
  .nav-light {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  }
`;

// ----- 3D Background Shapes (Solid colors only, no gradients) -----
const Shape3DCube: React.FC<{ size?: number; color: string; className?: string }> = ({ size = 55, color, className = '' }) => (
  <div className={`animate-float-a ${className}`} style={{ width: size, height: size, transformStyle: 'preserve-3d', perspective: 400 }}>
    <div style={{
      width: size, height: size, background: color, border: '2px solid #ffffff',
      borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transform: 'rotateX(15deg) rotateY(30deg)',
      transformStyle: 'preserve-3d', animation: 'spin3d 14s linear infinite',
    }} />
  </div>
);

const Shape3DPyramid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-float-b ${className}`} style={{
    width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent',
    borderBottom: '50px solid #16a34a', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
  }} />
);

const Shape3DSphere: React.FC<{ size?: number; color: string; className?: string }> = ({ size = 45, color, className = '' }) => (
  <div className={`animate-float-c rounded-full ${className}`} style={{
    width: size, height: size,
    background: color,
    border: '3px solid #ffffff',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  }} />
);

const Shape3DRing: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-spin-3d ${className}`} style={{
    width: 70, height: 70, border: '6px solid #7c3aed', borderRadius: '50%',
    borderTopColor: '#16a34a', boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
  }} />
);

export const ForgotPasswordPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const fromAdminStaff = (location.state as any)?.fromAdminStaff || false;

  // Navigate directly back to corresponding portal mode (Admin/Staff vs Student/User)
  const handleBackToLogin = () => {
    if (fromAdminStaff) {
      navigate('/login?mode=admin_staff');
    } else {
      navigate('/login?mode=student');
    }
  };

  // Exact solid color schemes matching reference images
  const headerBgClass = fromAdminStaff ? 'bg-[#333f4f]' : 'bg-[#9333ea]';
  const circleTopRightClass = fromAdminStaff ? 'bg-[#222a35]/70' : 'bg-white/20';
  const circleBottomLeftClass = fromAdminStaff ? 'bg-[#607185]/40' : 'bg-white/20';
  const buttonBgClass = fromAdminStaff
    ? 'bg-[#333f4f] hover:bg-[#28323f]'
    : 'bg-[#9333ea] hover:bg-[#7e22ce]';
  const linkTextClass = fromAdminStaff
    ? 'text-[#333f4f] hover:text-[#28323f]'
    : 'text-[#9333ea] hover:text-[#7e22ce]';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      await apiClient.forgotPassword(email);
      setSuccess('Reset code sent to your email! Please check your inbox.');
      setStep('reset');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!resetCode || !newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      await apiClient.resetPassword(email, resetCode, newPassword);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        handleBackToLogin();
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || 'Invalid reset code or failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="relative w-full min-h-screen text-slate-900 flex flex-col justify-between pt-20 pb-8 px-4 overflow-hidden" style={{ background: '#f8fafc' }}>

        {/* 3D Floating Background Shapes */}
        <Shape3DCube size={55} color="#7c3aed" className="absolute top-28 left-8 sm:left-24 pointer-events-none opacity-80" />
        <Shape3DSphere size={45} color="#16a34a" className="absolute top-36 right-8 sm:right-28 pointer-events-none opacity-80" />
        <Shape3DPyramid className="absolute bottom-36 left-12 sm:left-32 opacity-70 pointer-events-none" />
        <Shape3DRing className="absolute bottom-28 right-8 sm:right-20 pointer-events-none opacity-80" />

        {/* Top Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 nav-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src={COOP_LOGO_URL}
                alt="UC METC Logo"
                className="w-9 h-9 rounded-full ring-2 shadow-xs"
                style={{ borderColor: '#7c3aed' }}
              />
              <span className="text-lg sm:text-xl font-bold">
                <span style={{ color: '#16a34a' }}>UC</span>
                <span className="text-slate-800"> METC </span>
                <span style={{ color: '#7c3aed' }}>SILMS</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-purple-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors font-semibold text-xs sm:text-sm cursor-pointer"
            >
              <ChevronLeft size={16} className="text-purple-600" />
              <span>Back to Login</span>
            </button>
          </div>
        </nav>

        {/* Main Card Container with Entrance Animation */}
        <div className="w-full max-w-md mx-auto my-auto relative z-10 page-pop-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            
            {/* Header Banner - Solid Color with Decorative Corner Circles */}
            <div className={`h-32 ${headerBgClass} flex items-center justify-center relative overflow-hidden transition-colors duration-300`}>
              <div className={`absolute top-0 right-0 w-36 h-36 ${circleTopRightClass} rounded-full transform -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>
              <div className={`absolute bottom-0 left-0 w-28 h-28 ${circleBottomLeftClass} rounded-full transform translate-y-1/2 -translate-x-1/2 pointer-events-none`}></div>

              <div className="relative z-10 text-center flex flex-col items-center">
                <img
                  src={COOP_LOGO_URL}
                  alt="UC METC Logo"
                  className="w-20 h-20 rounded-full mb-2 bg-white p-0.5 shadow-sm"
                />
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">UC METC SILMS</h3>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {step === 'email' ? (
                <>
                  <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Forgot Password?</h2>
                  <p className="text-center text-slate-600 text-sm mb-6">
                    Enter your email address and we'll send you a code to reset your password.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <FloatingInput
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        focusColor={fromAdminStaff ? 'green' : 'purple'}
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm ${buttonBgClass}`}
                    >
                      <Mail size={20} />
                      <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                    </button>
                  </form>

                  <div className="mt-6 text-center text-sm text-slate-600">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className={`font-semibold hover:underline transition-colors cursor-pointer ${linkTextClass}`}
                    >
                      Sign In
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Reset Password</h2>
                  <p className="text-center text-slate-600 text-sm mb-6">
                    Enter the code sent to your email and your new password.
                  </p>

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div>
                      <FloatingInput
                        label="Reset Code"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        focusColor={fromAdminStaff ? 'green' : 'purple'}
                        required
                      />
                    </div>

                    <div>
                      <FloatingInput
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type="password"
                        focusColor={fromAdminStaff ? 'green' : 'purple'}
                        required
                        showToggle
                        showVisibility={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                      />
                    </div>

                    <div>
                      <FloatingInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        focusColor={fromAdminStaff ? 'green' : 'purple'}
                        required
                        showToggle
                        showVisibility={showConfirmPassword}
                        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm ${buttonBgClass}`}
                    >
                      <Lock size={20} />
                      <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                    </button>
                  </form>

                  <div className="mt-6 text-center text-sm text-slate-600">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError('');
                        setSuccess('');
                        setResetCode('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className={`font-semibold hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer ${linkTextClass}`}
                    >
                      <ChevronLeft size={16} />
                      <span>Back</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <footer className="relative z-10 text-center text-xs text-slate-500 py-3 font-medium">
          © 2026 UC METC SILMS. All rights reserved.
        </footer>
      </div>
    </>
  );
};
