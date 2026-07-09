import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { FloatingInput } from '../components/FloatingInput';
import { FloatingSelect } from '../components/FloatingSelect';
import { LoginTransition } from '../components/PageTransition';
import { COOP_LOGO_URL, BACKGROUND_IMAGE_URL } from '../constants/cloudinaryAssets';

import { UserIcon, ChevronLeft, UserPlus } from 'lucide-react';


const COURSES = ['BSMT', 'BSMARE', 'BSNAME', 'HM', 'TOURISM', 'SHS', 'JHS'];

const getValidYearsForCourse = (courseName: string): string[] => {
  if (!courseName) return [];
  if (['BSMT', 'BSMARE', 'BSNAME'].includes(courseName)) {
    return ['1st', '2nd', '3rd'];
  }
  if (['HM', 'TOURISM'].includes(courseName)) {
    return ['1st', '2nd', '3rd', '4th'];
  }
  if (courseName === 'SHS') {
    return ['11th', '12th'];
  }
  if (courseName === 'JHS') {
    return ['7th', '8th', '9th', '10th'];
  }
  return [];
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, logout } = useAuth();
  const { showNotification } = useUIStore();
  
  const [loginMode, setLoginMode] = useState<'selection' | 'admin_staff' | 'student'>('selection');
  const [formType, setFormType] = useState<'login' | 'signup' | 'membership'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [adminStaffEmail, setAdminStaffEmail] = useState('');
  const [adminStaffPassword, setAdminStaffPassword] = useState('');
  const [showAdminStaffPassword, setShowAdminStaffPassword] = useState(false);
  const [adminStaffError, setAdminStaffError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberMeAdmin, setRememberMeAdmin] = useState(false);

  // Sign Up States
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email Verification OTP States
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isMobile, setIsMobile] = useState(false);

  // Auto-select student login on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobileVal = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobileVal);
      if (mobileVal && loginMode === 'selection') {
        setLoginMode('student');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [loginMode]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load saved credentials if "Remember Me" was checked previously
  useEffect(() => {
    const savedStudentId = localStorage.getItem('remember_student_id');
    const savedStudentPass = localStorage.getItem('remember_student_password');
    if (savedStudentId) {
      setEmail(savedStudentId);
      setRememberMe(true);
    }
    if (savedStudentPass) {
      setPassword(savedStudentPass);
    }

    const savedAdminEmail = localStorage.getItem('remember_admin_email');
    const savedAdminPass = localStorage.getItem('remember_admin_password');
    if (savedAdminEmail) {
      setAdminStaffEmail(savedAdminEmail);
      setRememberMeAdmin(true);
    }
    if (savedAdminPass) {
      setAdminStaffPassword(savedAdminPass);
    }
  }, []);

  // Handle query parameters for redirect after signup
  useEffect(() => {
    const mode = searchParams.get('mode') as 'student' | 'admin_staff' | null;
    const form = searchParams.get('form') as 'login' | 'signup' | null;
    const deactivated = searchParams.get('deactivated');
    
    if (mode) {
      setLoginMode(mode);
    }
    if (form && (form === 'login' || form === 'signup')) {
      setFormType(form);
    }
    if (deactivated === 'true') {
      showNotification('Your account has been deactivated. Please contact an administrator for assistance.', 'error');
    }
  }, [searchParams, showNotification]);

  // Handle form type changes
  const handleFormTypeChange = (newFormType: 'login' | 'signup' | 'membership') => {
    setFormType(newFormType);
    setError('');
    
    // Clear form fields when switching form types
    if (newFormType === 'login') {
      // Clear login form
      setEmail('');
      setPassword('');
      setShowPassword(false);
    } else if (newFormType === 'signup') {
      // Clear signup form
      setIdNumber('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setCourse('');
      setYear('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('ID Number and password are required');
        setLoading(false);
        return;
      }

      // For students: email field contains the ID number, so pass as id_number
      // For members: use email field as-is
      if (loginMode === 'student') {
        await login(null, password, email); // email contains ID number for students
      } else {
        await login(email, password); // use email normally for members
      }
      
      if (rememberMe) {
        localStorage.setItem('remember_student_id', email);
        localStorage.setItem('remember_student_password', password);
      } else {
        localStorage.removeItem('remember_student_id');
        localStorage.removeItem('remember_student_password');
      }

      setEmail('');
      setPassword('');
      showNotification('Signed in successfully!', 'success');
      setIsTransitioning(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validate ID number length (exactly 8 digits) for student registrations
    if (loginMode === 'student') {
      if (idNumber.length !== 8) {
        setError('ID Number must be exactly 8 digits');
        setLoading(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate student-specific fields
    if (loginMode === 'student' && (!course || !year)) {
      setError('Please select your course and year');
      setLoading(false);
      return;
    }

    try {
      // Call backend API
      const signupData: any = {
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName || middleName,
        role: 'user',
      };

      // Add ID number and course/year for students
      if (loginMode === 'student') {
        signupData.id_number = idNumber;
        signupData.course = course;
        signupData.year = year;
      }

      await register(signupData);
      
      // Show email verification modal
      setVerificationEmail(email);
      setVerificationError('');
      setVerificationSuccess('');
      setVerificationCode('');
      setShowVerification(true);

      // Clear form
      setIdNumber('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setCourse('');
      setYear('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    setVerificationLoading(true);
    try {
      if (!verificationCode || verificationCode.length !== 6) {
        setVerificationError('Please enter the 6-digit verification code.');
        return;
      }
      await apiClient.verifyEmail(verificationEmail, verificationCode);
      setVerificationSuccess('Email verified! Redirecting to login...');
      setShowVerification(false);
      showNotification('Account verified! Please log in with your credentials.', 'success');
      handleFormTypeChange('login');
    } catch (err: any) {
      setVerificationError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setVerificationError('');
    setVerificationLoading(true);
    try {
      await apiClient.resendVerification(verificationEmail);
      setVerificationSuccess('New code sent! Check your inbox.');
      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleAdminStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStaffError('');
    setLoading(true);

    try {
      if (!adminStaffEmail || !adminStaffPassword) {
        setAdminStaffError('Email and password are required');
        setLoading(false);
        return;
      }

      // Call backend API with email parameter
      await login(adminStaffEmail, adminStaffPassword);
      
      // Check user role from sessionStorage (which was just set by login)
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (!['admin', 'staff'].includes(userData.role)) {
          setAdminStaffError('Only admin and staff can login here. Please use the correct login form.');
          logout();
          setAdminStaffEmail('');
          setAdminStaffPassword('');
          setLoading(false);
          return;
        }
      }
      
      if (rememberMeAdmin) {
        localStorage.setItem('remember_admin_email', adminStaffEmail);
        localStorage.setItem('remember_admin_password', adminStaffPassword);
      } else {
        localStorage.removeItem('remember_admin_email');
        localStorage.removeItem('remember_admin_password');
      }

      setAdminStaffEmail('');
      setAdminStaffPassword('');
      showNotification('Signed in successfully!', 'success');
      setIsTransitioning(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setAdminStaffError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };


  return (
    <div
      className={`min-h-screen flex flex-col items-center p-4 relative ${
        loginMode === 'student' && formType === 'signup'
          ? 'justify-start pt-20 md:justify-center md:pt-6 pb-10'
          : 'justify-start pt-16 md:pt-8'
      }`}
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {isTransitioning && <LoginTransition />}
      
      {/* Email Verification OTP Modal */}
      {showVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-fade-in" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-content-in mx-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-4 sm:p-6 text-white text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-8 sm:h-8"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Verify Your Email</h2>
              <p className="text-purple-100 text-xs sm:text-sm mt-0.5 sm:mt-1">We sent a 6-digit code to</p>
              <p className="font-semibold text-xs sm:text-sm mt-1 bg-white/20 rounded-lg px-2.5 py-0.5 sm:px-3 sm:py-1 inline-block">{verificationEmail}</p>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <form onSubmit={handleVerifyEmail} className="space-y-3 sm:space-y-4">
                {/* OTP Code Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2 text-center">Enter Verification Code</label>
                  <input
                    id="otp-verification-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setVerificationCode(val);
                      setVerificationError('');
                    }}
                    placeholder="000000"
                    className="w-full text-center text-2xl sm:text-3xl font-bold tracking-[0.5em] border-2 border-slate-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-colors text-purple-700"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                {/* Error */}
                {verificationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-700 text-center">
                    {verificationError}
                  </div>
                )}

                {/* Success */}
                {verificationSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-green-700 text-center">
                    {verificationSuccess}
                  </div>
                )}

                {/* Verify Button */}
                <button
                  id="otp-verify-button"
                  type="submit"
                  disabled={verificationLoading || verificationCode.length !== 6}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 rounded-xl transition-all duration-200 active:scale-95 text-sm sm:text-base"
                >
                  {verificationLoading ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* Resend + Cancel */}
                <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5 sm:pt-1">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || verificationLoading}
                    className="text-purple-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerification(false);
                      setVerificationCode('');
                      setVerificationError('');
                      setVerificationSuccess('');
                    }}
                    className="text-slate-500 hover:text-slate-700 hover:underline transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <p className="text-[10px] sm:text-xs text-slate-500 text-center mt-3 sm:mt-4">
                Didn't receive the email? Check your spam folder or resend above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Green to White to Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400/60 via-white/30 to-purple-900/70"></div>
      {/* Back Button */}
      <button
        onClick={() => {
          // If OTP modal is visible, close it first instead of navigating
          if (showVerification) {
            setShowVerification(false);
            setVerificationCode('');
            setVerificationError('');
            setVerificationSuccess('');
            return;
          }
          // Check if mobile (below md breakpoint)
          const isMobile = window.innerWidth < 768;
          
          if (loginMode === 'selection') {
            navigate('/');
          } else if (loginMode === 'admin_staff') {
            setLoginMode('selection');
            setAdminStaffError('');
            setAdminStaffEmail('');
            setAdminStaffPassword('');
          } else if (loginMode === 'student') {
            if (formType === 'login') {
              // On mobile, go directly to landing page
              if (isMobile) {
                navigate('/');
              } else {
                setLoginMode('selection');
              }
            } else {
              handleFormTypeChange('login');
            }
            setError('');
          }
        }}
        className={`absolute top-4 md:top-6 left-4 md:left-6 flex items-center space-x-2 text-white transition-all group z-50 p-2 rounded-lg shadow-lg ${
          loginMode === 'admin_staff'
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
        title="Back"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className={`w-full flex items-center justify-center ${
        loginMode === 'selection'
          ? 'min-h-[500px]'
          : loginMode === 'student' && formType === 'signup'
            ? 'min-h-0'
            : 'mt-4 md:mt-0 min-h-[calc(100vh-8rem)]'
      } ${loginMode === 'student' ? (formType !== 'login' ? 'max-w-md md:max-w-5xl' : 'max-w-md') : ''} relative z-10 page-pop-in animate-fade-in`}>
        {/* Selection Screen */}
        {loginMode === 'selection' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto px-6">
            {/* Admin/Staff Login Box - Hidden on Mobile */}
            <button
              onClick={() => setLoginMode('admin_staff')}
              className="hidden md:block bg-white rounded-lg shadow-lg p-12 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full max-w-sm"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center">
                  <UserIcon size={48} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800">Admin/Staff Login</h3>
                <p className="text-slate-600 text-base">Authorized Personnel Only</p>
                <button className="mt-2 px-12 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-lg">
                  Login
                </button>
              </div>
            </button>

            {/* Student Login Box */}
            <button
              onClick={() => setLoginMode('student')}
              className="bg-white rounded-lg shadow-lg p-12 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full max-w-sm mx-auto"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                  <UserIcon size={48} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800">Student Login</h3>
                <p className="text-slate-600 text-base">Login or register as a student</p>
                <button className="mt-2 px-12 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg">
                  Login
                </button>
              </div>
            </button>
          </div>
        )}

        {/* Admin/Staff Login Form */}
        {loginMode === 'admin_staff' && (
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden form-transition-in animate-scale-in">
            {/* Header Banner */}
            <div className="h-24 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center relative overflow-hidden animate-slide-down">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform translate-y-1/2 -translate-x-1/2"></div>
              </div>
              <div className="relative z-10 text-center flex flex-col items-center">
                <img 
                  src={COOP_LOGO_URL}
                  alt="UC METC Logo" 
                  className="w-16 h-16 rounded-full mb-1"
                />
                <h2 className="text-xs font-bold text-slate-100">UC METC SILMS - Admin/Staff</h2>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-7">
              <h2 className="text-xl font-bold text-center text-slate-800 mb-5">
                Welcome Back!
              </h2>

              <form onSubmit={handleAdminStaffLogin} className="space-y-3.5">
                {/* Email Input */}
                <FloatingInput
                  label="Email Address"
                  value={adminStaffEmail}
                  onChange={(e) => setAdminStaffEmail(e.target.value)}
                  type="email"
                  required
                />

                {/* Password Input */}
                <FloatingInput
                  label="Password"
                  value={adminStaffPassword}
                  onChange={(e) => setAdminStaffPassword(e.target.value)}
                  type="password"
                  required
                  showToggle
                  showVisibility={showAdminStaffPassword}
                  onToggleVisibility={() => setShowAdminStaffPassword(!showAdminStaffPassword)}
                />

                 {/* Remember Me and Forgot Password Link */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMeAdmin}
                      onChange={(e) => setRememberMeAdmin(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                      rememberMeAdmin 
                        ? 'border-slate-800 bg-slate-800 scale-105 shadow-md shadow-slate-700/20' 
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}>
                      <svg 
                        className={`w-3.5 h-3.5 text-white transition-all duration-300 transform ${
                          rememberMeAdmin ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-12 opacity-0'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="font-medium">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password', { state: { fromAdminStaff: true } })}
                    className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Error Message */}
                {adminStaffError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {adminStaffError}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-700 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-pulse"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Note about registration */}
              <div className="mt-6 text-center text-xs text-slate-600">
                <p>Admin and Staff accounts are created by Superadmin only.</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Form */}
        {loginMode === 'student' && (
          <div key={formType} className={`bg-white rounded-lg shadow-lg overflow-hidden ${formType !== 'login' ? 'flex w-full' : 'w-full max-w-md'} form-transition-in animate-scale-in`}>
            {/* Sidebar for Sign Up and Membership */}
            {formType !== 'login' && (
            <div className={`hidden md:flex w-2/5 bg-gradient-to-b from-purple-300 via-purple-400 to-purple-600 flex-col items-center justify-center p-10 relative overflow-hidden sidebar-slide-in animate-slide-in-left`}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform translate-y-1/2 -translate-x-1/2"></div>
              </div>
              <div className="relative z-10 text-center">
                <img 
                  src={COOP_LOGO_URL}
                  alt="UC METC Logo" 
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-bold text-white mb-2">UC METC SILMS</h3>
                <p className="text-sm text-white/90">
                  {formType === 'signup' ? 'Create your account and join our community' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`${formType !== 'login' ? 'w-full md:w-3/5' : 'w-full'} ${formType !== 'login' ? 'content-slide-in animate-slide-in-right' : 'animate-fade-in'}`}>
            {/* Header Banner for Login */}
            {formType === 'login' && (
              <div className="h-20 md:h-24 bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600 flex items-center justify-center relative overflow-hidden animate-slide-down">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform translate-y-1/2 -translate-x-1/2"></div>
                </div>
                <div className="relative z-10 text-center flex flex-col items-center">
                  <img 
                    src={COOP_LOGO_URL}
                    alt="UC METC Logo" 
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full mb-1"
                  />
                  <h2 className="text-xs font-bold text-slate-100">UC METC SILMS</h2>
                </div>
              </div>
            )}

            {/* Form Content */}
            <div className={`${formType === 'login' ? 'p-4 md:p-7' : formType === 'signup' ? 'p-4 sm:p-5 md:p-6' : 'p-5 md:p-8'} ${formType !== 'login' ? 'animate-fadeIn' : ''}`}>
            {formType === 'login' ? (
              <>
                <h2 className="text-lg md:text-xl font-bold text-center text-slate-800 mb-4 md:mb-5">
                  Welcome Back!
                </h2>

                <form onSubmit={handleLogin} className="space-y-3 md:space-y-3.5">
                  {/* Email/ID Input */}
                  <FloatingInput
                    label="ID Number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                      const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                      if (allowed.includes(e.key)) return;
                      // Allow Ctrl/Cmd+A, C, V, X
                      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                      // Block anything that isn't a digit
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    inputMode="numeric"
                    focusColor="purple"
                    required
                  />

                  {/* Password Input */}
                  <FloatingInput
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    focusColor={loginMode === 'student' ? 'purple' : 'purple'}
                    required
                    showToggle
                    showVisibility={showPassword}
                    onToggleVisibility={() => setShowPassword(!showPassword)}
                  />

                  {/* Remember Me and Forgot Password Link */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                        rememberMe 
                          ? 'border-purple-600 bg-purple-600 scale-105 shadow-md shadow-purple-500/20' 
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}>
                        <svg 
                          className={`w-3.5 h-3.5 text-white transition-all duration-300 transform ${
                            rememberMe ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-12 opacity-0'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3.5" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="font-medium">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password', { state: { fromMember: loginMode === 'student' } })}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white font-semibold py-2.5 md:py-3 rounded-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-pulse bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                {/* Sign Up Link */}
                {loginMode === 'student' && (
                  <div className="mt-3 md:mt-4 text-center text-xs text-slate-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => handleFormTypeChange('signup')}
                      className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                    >
                      Sign Up
                    </button>
                  </div>
                )}


              </>
            ) : (
              <>
                {/* Header Banner for Sign Up - Mobile Only */}
                <div className="md:hidden h-24 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 flex items-center px-6 relative overflow-hidden -mx-5 -mt-5 mb-4">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform translate-y-1/2 -translate-x-1/2"></div>
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <img 
                      src={COOP_LOGO_URL}
                      alt="UC METC Logo" 
                      className="w-16 h-16 rounded-full border-2 border-white"
                    />
                    <div className="border-l-2 border-white/50 pl-4">
                      <h2 className="text-xl font-bold text-white">REGISTER</h2>
                      <p className="text-xs text-white/90 mt-0.5">Join UC METC SILMS community</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Title */}
                <h2 className="hidden md:block text-xl font-bold text-center text-slate-800 mb-3">
                  Create Student Account
                </h2>

                <form onSubmit={handleSignUp} className="space-y-3">
                  {/* ID Number - Full width on mobile, half on desktop */}
                  <div className="md:grid md:grid-cols-2 md:gap-2 space-y-3 md:space-y-0">
                    <div>
                      <FloatingInput
                        label="ID Number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        maxLength={8}
                        onKeyDown={(e) => {
                          // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                          const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                          if (allowed.includes(e.key)) return;
                          // Allow Ctrl/Cmd+A, C, V, X
                          if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                          // Block anything that isn't a digit
                          if (!/^\d$/.test(e.key)) e.preventDefault();
                        }}
                        inputMode="numeric"
                        required
                        compact={isMobile}
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <FloatingInput
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        compact={isMobile}
                      />
                    </div>
                  </div>

                  {/* Middle & Last Name — side by side on desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-2 space-y-3 md:space-y-0">
                    <FloatingInput
                      label="Middle Name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      compact={isMobile}
                    />
                    <FloatingInput
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      compact={isMobile}
                    />
                  </div>

                  {/* Email Address - Full width */}
                  <FloatingInput
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    compact={isMobile}
                  />

                  {/* Course and Year - Side by side on all screens */}
                  {loginMode === 'student' && (
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {/* Course Dropdown */}
                      <div>
                        <FloatingSelect
                          label="Course"
                          value={course}
                          onChange={(e) => {
                            const newCourse = e.target.value;
                            setCourse(newCourse);
                            const validYears = getValidYearsForCourse(newCourse);
                            if (!validYears.includes(year)) {
                              setYear(''); // Auto-correct to empty to force alignment!
                            }
                          }}
                          options={COURSES}
                        />
                      </div>

                      {/* Year Dropdown */}
                      <div>
                        <FloatingSelect
                          label="Year"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          options={getValidYearsForCourse(course)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password - Full width on mobile, half on desktop */}
                  <div className="md:grid md:grid-cols-2 md:gap-3 space-y-3 md:space-y-0">
                    <div>
                      <FloatingInput
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                        showToggle
                        showVisibility={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                        compact={isMobile}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <FloatingInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        required
                        showToggle
                        showVisibility={showConfirmPassword}
                        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                        compact={isMobile}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    type="submit"
                    className="w-full text-white font-semibold py-2.5 md:py-3 rounded-lg active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 button-pulse bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus size={20} />
                    <span>Register</span>
                  </button>
                </form>

                {/* Sign In Link */}
                <div className="mt-3 text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => handleFormTypeChange('login')}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Sign in
                  </button>
                </div>

              </>
            )}
            
            {/* Terms and Privacy Disclaimer - Only on Login Form */}
            {formType === 'login' && (
              <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                By signing up or logging in, you consent to UC METC SILMS'{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="underline text-purple-600 hover:text-purple-700"
                >
                  Terms of Use
                </button>
                {' '}and{' '}
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="underline text-purple-600 hover:text-purple-700"
                >
                  Privacy Policy
                </button>
                .
              </div>
            )}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Terms of Use Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4 modal-fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto modal-content-in">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-600">Terms of Use</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">1. Acceptance of Terms</h3>
              <p className="text-slate-700 mb-4">By accessing and using the UC METC System, you accept and agree to be bound by the terms and provision of this agreement.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">2. Use License</h3>
              <p className="text-slate-700 mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on the UC METC System for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc list-inside text-slate-700 mb-4 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the system</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">3. Disclaimer</h3>
              <p className="text-slate-700 mb-4">The materials on UC METC System are provided on an 'as is' basis. UC METC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">4. Limitations</h3>
              <p className="text-slate-700 mb-4">In no event shall UC METC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on UC METC System, even if UC METC or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">5. Accuracy of Materials</h3>
              <p className="text-slate-700 mb-4">The materials appearing on UC METC System could include technical, typographical, or photographic errors. UC METC does not warrant that any of the materials on UC METC System are accurate, complete, or current.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">6. Links</h3>
              <p className="text-slate-700 mb-4">UC METC has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by UC METC of the site. Use of any such linked website is at the user's own risk.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">7. Modifications</h3>
              <p className="text-slate-700 mb-4">UC METC may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">8. Governing Law</h3>
              <p className="text-slate-700 mb-4">These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which UC METC is located, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">9. Contact Information</h3>
              <p className="text-slate-700 mb-4">If you have any questions about these Terms of Use, please contact UC METC through the website.</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4 modal-fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto modal-content-in">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-600">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">1. Introduction</h3>
              <p className="text-slate-700 mb-4">UC METC ("we" or "us" or "our") operates the UC METC System. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our website and the choices you have associated with that data.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">2. Information Collection and Use</h3>
              <p className="text-slate-700 mb-4">We collect several different types of information for various purposes to provide and improve our service to you.</p>
              <ul className="list-disc list-inside text-slate-700 mb-4 ml-4">
                <li>Personal Identity Information: Name, email address, phone number, and address</li>
                <li>Account Information: Login credentials, user role, and organizational affiliation</li>
                <li>Usage Data: Information about how you interact with our system</li>
                <li>Cookies and Tracking Data: We may use cookies to track your activity</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">3. Use of Data</h3>
              <p className="text-slate-700 mb-4">UC METC uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside text-slate-700 mb-4 ml-4">
                <li>To provide and maintain our system</li>
                <li>To notify you about changes to our system</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide support and respond to inquiries</li>
                <li>To gather analysis or valuable information for system improvement</li>
                <li>To monitor the usage of our system</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">4. Security of Data</h3>
              <p className="text-slate-700 mb-4">The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">5. Changes to This Privacy Policy</h3>
              <p className="text-slate-700 mb-4">We may update our privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "effective date" at the top of this policy.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">6. Contact Us</h3>
              <p className="text-slate-700 mb-4">If you have any questions about this privacy policy, please contact us through the UC METC System website or email address provided.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">7. Your Rights</h3>
              <p className="text-slate-700 mb-4">You have the right to request access to, correct, or delete any personal data we hold about you, subject to applicable laws and regulations.</p>

              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">8. Data Retention</h3>
              <p className="text-slate-700 mb-4">We will retain your personal data only for as long as necessary to provide our services and as required by applicable law.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

