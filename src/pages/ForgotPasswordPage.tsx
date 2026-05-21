import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FloatingInput } from '../components/FloatingInput';
import { apiClient } from '../services/api';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
// @ts-ignore
import backgroundImage from '../assets/Background2.jpeg';
import { ChevronLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const navigate = useNavigate();
  const location = useLocation();
  const fromAdminStaff = (location.state as any)?.fromAdminStaff || false;
  
  // Color scheme based on where the request came from
  const backButtonClass = fromAdminStaff
    ? 'bg-slate-700 hover:bg-slate-800'
    : 'bg-purple-600 hover:bg-purple-700';
  const headerGradient = fromAdminStaff
    ? 'from-slate-600 via-slate-700 to-slate-800'
    : 'from-purple-300 via-purple-400 to-purple-600';
  const buttonClass = fromAdminStaff
    ? 'bg-slate-700 hover:bg-slate-800'
    : 'bg-purple-600 hover:bg-purple-700';
  const linkClass = fromAdminStaff
    ? 'text-slate-600 hover:text-slate-700'
    : 'text-purple-600 hover:text-purple-700';
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

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Call API to send reset code
      const response = await apiClient.forgotPassword(email) as any;
      
      setSuccess('Reset code sent to your email! Please check your inbox.');
      
      // Show the reset code in development mode
      if (response.resetCode) {
        console.log('Development Mode - Reset Code:', response.resetCode);
        setSuccess(`Reset code sent to your email! (Dev mode: ${response.resetCode})`);
      }
      
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

      // Call API to reset password
      await apiClient.resetPassword(email, resetCode, newPassword);
      
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || 'Invalid reset code or failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Green to White to Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400/60 via-white/30 to-purple-900/70"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/login')}
        className={`absolute top-6 left-6 flex items-center space-x-2 text-white transition-all group z-20 p-2 rounded-lg shadow-lg ${backButtonClass}`}
        title="Back to Login"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="w-full max-w-md relative z-10 page-pop-in form-fade-in-scale">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Banner */}
          <div className={`h-32 bg-gradient-to-r ${headerGradient} flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform translate-y-1/2 -translate-x-1/2"></div>
            </div>
            <div className="relative z-10 text-center flex flex-col items-center">
              <img 
                src={coopLogo}
                alt="UC METC Logo" 
                className="w-20 h-20 rounded-full mb-2"
              />
              <h3 className="text-sm font-bold text-slate-100">UC METC SILMS</h3>
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
                  {/* Email Input */}
                  <div>
                    <FloatingInput
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      focusColor='purple'
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-semibold py-3 rounded-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 button-pulse ${buttonClass}`}
                  >
                    <Mail size={20} />
                    <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  Remember your password?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className={`font-semibold hover:underline transition-all ${linkClass}`}
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
                  {/* Reset Code Input */}
                  <div>
                    <FloatingInput
                      label="Reset Code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      focusColor='purple'
                      required
                    />
                  </div>

                  {/* New Password Input */}
                    <div>
                    <FloatingInput
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      focusColor='purple'
                      required
                      showToggle
                      showVisibility={showPassword}
                      onToggleVisibility={() => setShowPassword(!showPassword)}
                    />
                  </div>

                  {/* Confirm Password Input */}
                    <div>
                    <FloatingInput
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      focusColor='purple'
                      required
                      showToggle
                      showVisibility={showConfirmPassword}
                      onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-semibold py-3 rounded-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-pulse ${buttonClass}`}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>

                {/* Back Button */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  <button
                    onClick={() => {
                      setStep('email');
                      setError('');
                      setSuccess('');
                      setResetCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className={`font-semibold hover:underline transition-all ${linkClass}`}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
