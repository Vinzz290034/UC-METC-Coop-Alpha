import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FloatingInput } from '../components/FloatingInput';
import coopLogo from '../assets/Coop.jpeg';
import type { User, UserRole } from '../types';
import { LogIn, Mail, Lock, User as UserIcon, ChevronLeft, Eye, EyeOff, UserPlus } from 'lucide-react';

const DEMO_USERS: Record<string, User> = {
  admin: {
    id: '1',
    email: 'admin@uc-metc.edu.ph',
    name: 'Administrator',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  cashier: {
    id: '2',
    email: 'cashier@uc-metc.edu.ph',
    name: 'Chinnette Lamoste',
    role: 'cashier',
    createdAt: new Date().toISOString(),
  },
  officer: {
    id: '3',
    email: 'officer@uc-metc.edu.ph',
    name: 'Kisses Peñera',
    role: 'locker_officer',
    createdAt: new Date().toISOString(),
  },
};

const COURSES = ['BSMT', 'BSMARE', 'BSNAME', 'HM', 'TOURISM', 'SHS', 'JHS', 'Elementary'];
const YEARS = ['1st', '2nd', '3rd', '4th', '12th', '11th', '10th', '9th', '8th', '7th'];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formType, setFormType] = useState<'login' | 'signup' | 'membership'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign Up States
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Membership Registration States
  const [membershipFullName, setMembershipFullName] = useState('');
  const [membershipEmail, setMembershipEmail] = useState('');
  const [membershipPhone, setMembershipPhone] = useState('');
  const [membershipAddress, setMembershipAddress] = useState('');
  const [membershipCompany, setMembershipCompany] = useState('');
  const [membershipPosition, setMembershipPosition] = useState('');
  const [membershipPassword, setMembershipPassword] = useState('');
  const [membershipConfirmPassword, setMembershipConfirmPassword] = useState('');
  const [showMembershipPassword, setShowMembershipPassword] = useState(false);
  const [showMembershipConfirmPassword, setShowMembershipConfirmPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user: User | null = null;

      if (email === 'admin@uc-metc.edu.ph') {
        user = DEMO_USERS.admin;
      } else if (email === 'cashier@uc-metc.edu.ph') {
        user = DEMO_USERS.cashier;
      } else if (email === 'officer@uc-metc.edu.ph') {
        user = DEMO_USERS.officer;
      } else {
        setError('Invalid credentials. Try admin@uc-metc.edu.ph');
        setLoading(false);
        return;
      }

      if (password !== 'demo123' && password !== '') {
        setError('Invalid password. Use "demo123"');
        setLoading(false);
        return;
      }

      login(user);
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Here you would normally send this data to your backend
    alert('Registration successful! Please sign in with your credentials.');
    setFormType('login');
    setIdNumber('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setCourse('');
    setYear('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleMembershipRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (membershipPassword !== membershipConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (membershipPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Here you would normally send this data to your backend
    alert('Membership registration successful! Please sign in with your credentials.');
    setFormType('login');
    setMembershipFullName('');
    setMembershipEmail('');
    setMembershipPhone('');
    setMembershipAddress('');
    setMembershipCompany('');
    setMembershipPosition('');
    setMembershipPassword('');
    setMembershipConfirmPassword('');
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
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
        <div className="relative">
          <select
            value={value}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer transition-all duration-200 hover:border-slate-400"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            } as React.CSSProperties}
            required={required}
          >
            <option value=""></option>
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
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/src/assets/Background2.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Teal to Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/10 via-blue-400/50 to-purple-900/60"></div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 bg-purple-600 text-white hover:bg-purple-700 transition-all group z-20 p-2 rounded-lg shadow-lg"
        title="Back to Landing Page"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className={`w-full ${formType !== 'login' ? 'max-w-4xl' : 'max-w-md'} relative z-10 page-pop-in`}>
        {/* Card */}
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${formType !== 'login' ? 'flex' : ''} ${formType === 'login' ? 'form-fade-in-scale' : ''}`}>
          {/* Sidebar for Sign Up and Membership */}
          {formType !== 'login' && (
            <div className="hidden sm:flex w-1/3 bg-gradient-to-b from-purple-300 via-purple-400 to-purple-600 flex-col items-center justify-center p-8 relative overflow-hidden sidebar-slide-in">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform translate-y-1/2 -translate-x-1/2"></div>
              </div>
              <div className="relative z-10 text-center">
                <img 
                  src={coopLogo}
                  alt="UC METC Logo" 
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-bold text-white mb-2">UC METC SILMS</h3>
                <p className="text-sm text-white/90">
                  {formType === 'signup' ? 'Create your account and join our community' : 'Register as a cooperative member'}
                </p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`${formType !== 'login' ? 'w-full sm:w-2/3' : 'w-full'} ${formType !== 'login' ? 'content-slide-in' : ''}`}>
            {/* Header Banner for Login */}
            {formType === 'login' && (
              <div className="h-32 bg-gradient-to-r from-purple-300 via-purple-400 to-purple-600 flex items-center justify-center relative overflow-hidden">
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
                  <h2 className="text-sm font-bold text-slate-100">UC METC SILMS</h2>
                </div>
              </div>
            )}

            {/* Form Content */}
            <div className={`p-8 ${formType !== 'login' ? 'animate-fadeIn' : ''}`}>
            {formType === 'login' ? (
              <>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                  Welcome Back!
                </h2>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email/ID Input */}
                  <FloatingInput
                    label="ID Number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  {/* Password Input */}
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

                  {/* Forgot Password Link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
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
                    className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-pulse"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setFormType('signup')}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Membership Registration Link */}
                <div className="text-center text-sm text-slate-600 mt-2">
                  Want to register as a member?{' '}
                  <button
                    onClick={() => setFormType('membership')}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Register Here
                  </button>
                </div>
              </>
            ) : formType === 'signup' ? (
              <>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                  Create Account
                </h2>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* ID Number */}
                    <div>
                      <FloatingInput
                        label="ID Number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* Middle Name */}
                    <div>
                      <FloatingInput
                        label="Middle Name"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>

                    {/* Last Name */}
                  <div>
                      <FloatingInput
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <FloatingInput
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="input-slide-up">
                      <FloatingSelect
                        label="Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        options={YEARS}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Password */}
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
                    <div className="input-slide-up">
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
                    className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 button-pulse"
                  >
                    <UserPlus size={20} />
                    <span>Register</span>
                  </button>
                </form>

                {/* Sign In Link */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setFormType('login');
                      setError('');
                    }}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Sign In
                  </button>
                </div>

                {/* Membership Registration Link */}
                <div className="text-center text-sm text-slate-600 mt-2">
                  Want to register as a member?{' '}
                  <button
                    onClick={() => setFormType('membership')}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Register Here
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                  Coop Member Registration
                </h2>

                <form onSubmit={handleMembershipRegistration} className="space-y-4">
                  {/* Full Name */}
                  <FloatingInput
                    label="Full Name"
                    value={membershipFullName}
                    onChange={(e) => setMembershipFullName(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <FloatingInput
                        label="Email Address"
                        value={membershipEmail}
                        onChange={(e) => setMembershipEmail(e.target.value)}
                        type="email"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <FloatingInput
                        label="Phone Number"
                        value={membershipPhone}
                        onChange={(e) => setMembershipPhone(e.target.value)}
                        type="tel"
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <FloatingInput
                    label="Address"
                    value={membershipAddress}
                    onChange={(e) => setMembershipAddress(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Company/Organization */}
                    <div>
                      <FloatingInput
                        label="Company/Organization"
                        value={membershipCompany}
                        onChange={(e) => setMembershipCompany(e.target.value)}
                        required
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <FloatingInput
                        label="Position/Title"
                        value={membershipPosition}
                        onChange={(e) => setMembershipPosition(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <FloatingInput
                        label="Password"
                        value={membershipPassword}
                        onChange={(e) => setMembershipPassword(e.target.value)}
                        type="password"
                        required
                        showToggle
                        showVisibility={showMembershipPassword}
                        onToggleVisibility={() => setShowMembershipPassword(!showMembershipPassword)}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <FloatingInput
                        label="Confirm Password"
                        value={membershipConfirmPassword}
                        onChange={(e) => setMembershipConfirmPassword(e.target.value)}
                        type="password"
                        required
                        showToggle
                        showVisibility={showMembershipConfirmPassword}
                        onToggleVisibility={() => setShowMembershipConfirmPassword(!showMembershipConfirmPassword)}
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
                    className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 button-pulse"
                  >
                    <UserPlus size={20} />
                    <span>Register as Member</span>
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  Already a member?{' '}
                  <button
                    onClick={() => {
                      setFormType('login');
                      setError('');
                    }}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
