import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FloatingInput } from '../components/FloatingInput';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
import type { User, UserRole } from '../types';
import { LogIn, Mail, Lock, User as UserIcon, ChevronLeft, Eye, EyeOff, UserPlus } from 'lucide-react';


const COURSES = ['BSMT', 'BSMARE', 'BSNAME', 'HM', 'TOURISM', 'SHS', 'JHS', 'Elementary'];
const YEARS = ['1st', '2nd', '3rd', '4th', '12th', '11th', '10th', '9th', '8th', '7th'];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [formType, setFormType] = useState<'login' | 'signup' | 'membership'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

  // Handle form type changes
  const handleFormTypeChange = (newFormType: 'login' | 'signup' | 'membership') => {
    setFormType(newFormType);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      // Call backend API
      await login(email, password);
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

    try {
      // Call backend API
      await register({
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName || middleName,
        role: 'member',
      });
      
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
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    const handleMembershipRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (membershipPassword !== membershipConfirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (membershipPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Call backend API
      await register({
        email: membershipEmail,
        password: membershipPassword,
        first_name: membershipFullName.split(' ')[0],
        last_name: membershipFullName.split(' ').slice(1).join(' '),
        role: 'member',
      });
      
      // Clear form
      setMembershipFullName('');
      setMembershipEmail('');
      setMembershipPhone('');
      setMembershipAddress('');
      setMembershipCompany('');
      setMembershipPosition('');
      setMembershipPassword('');
      setMembershipConfirmPassword('');
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
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
      {/* Green to White to Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400/60 via-white/30 to-purple-900/70"></div>
      {/* Back Button */}
      <button
        onClick={() => {
          if (formType === 'login') {
            navigate('/');
          } else {
            handleFormTypeChange('login');
          }
        }}
        className="absolute top-6 left-6 flex items-center space-x-2 bg-purple-600 text-white hover:bg-purple-700 transition-all group z-20 p-2 rounded-lg shadow-lg"
        title={formType === 'login' ? 'Back to Landing Page' : 'Back to Login'}
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className={`w-full ${formType !== 'login' ? 'max-w-4xl' : 'max-w-md'} relative z-10 page-pop-in`}>
        {/* Card */}
        <div key={formType} className={`bg-white rounded-lg shadow-lg overflow-hidden ${formType !== 'login' ? 'flex' : ''} form-transition-in`}>
          {/* Sidebar for Sign Up and Membership */}
          {formType !== 'login' && (
            <div className={`hidden sm:flex w-1/3 ${formType === 'membership' ? 'bg-gradient-to-b from-green-300 via-green-400 to-green-600' : 'bg-gradient-to-b from-purple-300 via-purple-400 to-purple-600'} flex-col items-center justify-center p-8 relative overflow-hidden sidebar-slide-in`}>
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
                    onClick={() => handleFormTypeChange('signup')}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Membership Registration Link */}
                <div className="text-center text-sm text-slate-600 mt-2">
                  Want to register as a member?{' '}
                  <button
                    onClick={() => handleFormTypeChange('membership')}
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
                    onClick={() => handleFormTypeChange('login')}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all"
                  >
                    Sign In
                  </button>
                </div>

                {/* Membership Registration Link */}
                <div className="text-center text-sm text-slate-600 mt-2">
                  Want to register as a member?{' '}
                  <button
                    onClick={() => handleFormTypeChange('membership')}
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

                <form onSubmit={handleMembershipRegistration} className="space-y-4 membership-form">
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
                    className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 button-pulse"
                  >
                    <UserPlus size={20} />
                    <span>Register as Member</span>
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  Already a member?{' '}
                  <button
                    onClick={() => handleFormTypeChange('login')}
                    className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all"
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}
            
            {/* Terms and Privacy Disclaimer - Only on Login Form */}
            {formType === 'login' && (
              <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                By signing up or logging in, you consent to UC METC SILMS'{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Terms of Use
                </button>
                {' '}and{' '}
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Privacy Policy
                </button>
                .
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms of Use Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-fade-in">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-fade-in">
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

