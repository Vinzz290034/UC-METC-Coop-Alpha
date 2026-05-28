import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { FloatingInput } from '../components/FloatingInput';
import { LoginTransition } from '../components/PageTransition';
import { COOP_LOGO_URL, BACKGROUND_IMAGE_URL } from '../constants/cloudinaryAssets';

import { UserIcon, ChevronLeft, UserPlus } from 'lucide-react';


const COURSES = ['BSMT', 'BSMARE', 'BSNAME', 'HM', 'TOURISM', 'SHS', 'JHS'];

const COLLEGE_YEARS = ['1st', '2nd', '3rd', '4th'];
const SHS_YEARS = ['11th', '12th'];
const JHS_YEARS = ['10th', '9th', '8th', '7th'];

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

  // Sign Up States
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Auto-select student login on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile && loginMode === 'selection') {
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
      
      // Show success notification
      showNotification('Account created successfully! Please log in with your credentials.', 'success');
      
      // Simply switch to login form - no page reload needed!
      handleFormTypeChange('login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
      
      // Check user role from localStorage (which was just set by login)
      const storedUser = localStorage.getItem('user');
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

  // Floating Label Select Component
  const FloatingSelect = ({
    label,
    value,
    onChange,
    options,
    required = false,
  }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    required?: boolean;
  }) => {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {label}
        </label>
        <div className="relative">
          <select
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer transition-all duration-200 hover:border-slate-400"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.6rem center',
              backgroundSize: '1.2em 1.2em',
              paddingRight: '2rem',
            } as React.CSSProperties}
            required={required}
          >
            <option value="" disabled>Select an option</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center p-4 relative ${
        loginMode === 'student' && formType === 'signup'
          ? 'justify-center pt-14 md:pt-6'
          : 'justify-start pt-16 md:pt-8'
      }`}
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {isTransitioning && <LoginTransition />}
      {/* Green to White to Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400/60 via-white/30 to-purple-900/70"></div>
      {/* Back Button */}
      <button
        onClick={() => {
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
        className={`fixed md:absolute top-4 md:top-6 left-4 md:left-6 flex items-center space-x-2 text-white transition-all group z-50 p-2 rounded-lg shadow-lg ${
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
      } ${loginMode === 'student' ? (formType !== 'login' ? 'max-w-5xl' : 'max-w-md') : ''} relative z-10 page-pop-in animate-fade-in`}>
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

                {/* Forgot Password Link */}
                <div className="flex justify-end">
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
            <div className={`${formType === 'login' ? 'p-4 md:p-7' : formType === 'signup' ? 'p-5 md:p-6' : 'p-5 md:p-8'} ${formType !== 'login' ? 'animate-fadeIn' : ''}`}>
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
                    onChange={(e) => setEmail(e.target.value)}
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

                  {/* Forgot Password Link */}
                  <div className="flex justify-end">
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
                        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
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
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <FloatingInput
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Middle & Last Name — side by side on desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-2 space-y-3 md:space-y-0">
                    <FloatingInput
                      label="Middle Name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                    <FloatingInput
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email Address - Full width */}
                  <FloatingInput
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />

                  {/* Course and Year - Side by side on all screens */}
                  {loginMode === 'student' && (
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {/* Course Dropdown */}
                      <div>
                        <FloatingSelect
                          label="Course"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          options={COURSES}
                          required
                        />
                      </div>

                      {/* Year Dropdown */}
                      <div>
                        <FloatingSelect
                          label="Year"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          options={
                            course === 'SHS' ? SHS_YEARS :
                            course === 'JHS' ? JHS_YEARS :
                            COLLEGE_YEARS
                          }
                          required
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

