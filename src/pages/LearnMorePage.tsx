import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import {
  ChevronLeft,
  CheckCircle2,
  Users,
  Zap,
  BarChart3,
  Lock,
  ShoppingCart,
  Bell,
  Mail,
  Phone,
  Facebook,
  X,
  Sparkles,
  LogIn,
  LayoutDashboard,
  Info,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../store/authContext';

// ----- CSS & Animations (Matching LandingPage design layout, light theme, no gradient colors) -----
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * { font-family: 'Inter', sans-serif; }

  /* 3D Floating Animations */
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
  @keyframes slide-up-fade {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes shimmer-line {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes scan-line {
    0%   { top: 0%; }
    100% { top: 100%; }
  }

  .animate-float-a { animation: float3d-a 7s ease-in-out infinite; }
  .animate-float-b { animation: float3d-b 9s ease-in-out infinite; }
  .animate-float-c { animation: float3d-c 6s ease-in-out infinite; }
  .animate-spin-3d { animation: spin3d 12s linear infinite; }

  .slide-up-1 { animation: slide-up-fade 0.8s ease-out 0.1s both; }
  .slide-up-2 { animation: slide-up-fade 0.8s ease-out 0.25s both; }
  .slide-up-3 { animation: slide-up-fade 0.8s ease-out 0.4s both; }
  .slide-up-4 { animation: slide-up-fade 0.8s ease-out 0.55s both; }

  /* Smooth Card hover effect */
  .card-hover-smooth {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.3s ease;
  }
  .card-hover-smooth:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px -8px rgba(124, 58, 237, 0.16), 0 8px 16px -4px rgba(0, 0, 0, 0.04);
    border-color: rgba(124, 58, 237, 0.35);
  }

  /* Shimmer on buttons */
  .btn-shimmer {
    position: relative;
    overflow: hidden;
  }
  .btn-shimmer::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: shimmer-line 2.5s infinite;
  }

  /* Solid green button */
  .btn-green-glow {
    background: #16a34a;
    transition: all 0.3s ease;
  }
  .btn-green-glow:hover {
    background: #15803d;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(22,163,74,0.4);
  }

  /* Nav backdrop — light */
  .nav-light {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(124,58,237,0.12);
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  }

  /* Scan line effect */
  .scan-overlay::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(22,163,74,0.3), transparent);
    animation: scan-line 4s linear infinite;
    pointer-events: none;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #16a34a; }
`;

// ----- 3D Shape Components -----
const Shape3DCube: React.FC<{ size?: number; color: string; className?: string }> = ({ size = 50, color, className = '' }) => (
  <div className={`animate-float-a ${className}`} style={{ width: size, height: size, transformStyle: 'preserve-3d', perspective: 400 }}>
    <div style={{
      width: size, height: size, background: color, border: `2px solid rgba(255,255,255,0.3)`,
      borderRadius: 8, boxShadow: `0 0 30px ${color}55`, transform: 'rotateX(15deg) rotateY(30deg)',
      transformStyle: 'preserve-3d', animation: 'spin3d 14s linear infinite',
    }} />
  </div>
);

const Shape3DPyramid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-float-b ${className}`} style={{
    width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent',
    borderBottom: '50px solid rgba(22,163,74,0.5)', filter: 'drop-shadow(0 0 20px rgba(22,163,74,0.5))',
  }} />
);

const Shape3DSphere: React.FC<{ size?: number; color: string; className?: string }> = ({ size = 40, color, className = '' }) => (
  <div className={`animate-float-c rounded-full ${className}`} style={{
    width: size, height: size,
    background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, ${color} 50%, rgba(0,0,0,0.3) 100%)`,
    boxShadow: `0 0 35px ${color}66, inset -8px -8px 16px rgba(0,0,0,0.25)`,
  }} />
);

const Shape3DRing: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-spin-3d ${className}`} style={{
    width: 70, height: 70, border: '5px solid rgba(124,58,237,0.6)', borderRadius: '50%',
    borderTopColor: 'rgba(22,163,74,0.9)', boxShadow: '0 0 25px rgba(124,58,237,0.35)',
  }} />
);

export const LearnMorePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll handler for auto-hiding navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const features = [
    {
      icon: ShoppingCart,
      title: 'Shop School Essentials',
      description: 'Browse and buy uniforms, equipment, and supplies online. Order now, pick up at the Coop office quick and hassle-free!',
      color: '#16a34a',
    },
    {
      icon: Bell,
      title: 'Stay in the Loop',
      description: 'Get instant notifications about new products, restocks, campus announcements, and exclusive deals to never miss out!',
      color: '#7c3aed',
    },
    {
      icon: Lock,
      title: 'Manage Your Locker',
      description: 'Rent a locker, renew your rental, and track everything from your phone. Keep your belongings safe and organized.',
      color: '#16a34a',
    },
    {
      icon: Users,
      title: 'Join the Coop Community',
      description: 'Become a member and enjoy exclusive discounts, priority access to new products, and special member-only perks!',
      color: '#7c3aed',
    },
    {
      icon: BarChart3,
      title: 'Track Your Orders',
      description: 'View your purchase history, check order status, and manage your billing and all your transactions in one place.',
      color: '#16a34a',
    },
    {
      icon: Zap,
      title: 'Always Available',
      description: 'Shop anytime, anywhere! Our platform is fast, reliable, and works perfectly on your phone, tablet, or computer.',
      color: '#7c3aed',
    },
  ];

  const highlights = [
    'Member Discounts',
    'Open to All Students',
    'Fast & Reliable',
    'Real-time Updates',
    'Mobile Friendly',
    'Secure Platform',
  ];

  return (
    <>
      <style>{styles}</style>

      {/* Root Layout */}
      <div className="relative w-full min-h-screen text-slate-900 overflow-hidden" style={{ background: '#ffffff' }}>
        
        {/* ── NAVIGATION BAR ── */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 nav-light transition-transform duration-300 ${
            isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src={COOP_LOGO_URL}
                alt="UC METC Logo"
                className="w-9 h-9 rounded-full ring-2 shadow-lg hover:scale-105 transition-transform"
                style={{ borderColor: 'rgba(124,58,237,0.4)' }}
              />
              <span className="text-lg sm:text-xl font-bold">
                <span style={{ color: '#16a34a' }}>UC</span>
                <span className="text-slate-800"> METC </span>
                <span style={{ color: '#7c3aed' }}>SILMS</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-purple-50 transition-all font-medium"
              >
                <Bell size={16} />
                <span>Announcements</span>
              </button>
              <button
                onClick={() => navigate('/community')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-purple-50 transition-all font-medium"
              >
                <Users size={16} />
                <span>Community</span>
              </button>
              <button
                onClick={() => navigate('/learn-more')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 bg-purple-50 rounded-xl font-bold shadow-sm"
              >
                <Info size={16} className="text-purple-600" />
                <span>Learn More</span>
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 btn-green-glow btn-shimmer text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 btn-green-glow btn-shimmer text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? (
                <X size={24} />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
        )}
        <div
          className={`fixed top-0 right-0 h-full w-72 z-50 transform transition-transform duration-300 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            background: 'rgba(255,255,255,0.98)',
            borderLeft: '1px solid rgba(124,58,237,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 transition-colors p-2"
          >
            <X size={24} />
          </button>
          <div className="flex flex-col space-y-6 pt-20 px-8">
            <button
              onClick={() => {
                navigate('/announcements');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 text-slate-700 hover:text-slate-900 font-semibold text-lg transition-all"
            >
              <Bell size={20} />
              <span>Announcements</span>
            </button>
            <button
              onClick={() => {
                navigate('/community');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 text-slate-700 hover:text-slate-900 font-semibold text-lg transition-all"
            >
              <Users size={20} />
              <span>Community</span>
            </button>
            <button
              onClick={() => {
                navigate('/learn-more');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 text-purple-700 font-bold text-lg transition-all"
            >
              <Info size={20} />
              <span>Learn More</span>
            </button>
            <button
              onClick={() => {
                navigate(isAuthenticated ? '/dashboard' : '/login');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 text-green-600 font-bold text-lg transition-all"
            >
              {isAuthenticated ? <LayoutDashboard size={20} /> : <LogIn size={20} />}
              <span>{isAuthenticated ? 'Dashboard' : 'Login'}</span>
            </button>
          </div>
        </div>

        {/* ── HERO & MAIN CONTENT SECTION ── */}
        <section
          className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 overflow-hidden scan-overlay"
          style={{ background: '#ffffff' }}
        >
          {/* Subtle dot grid pattern */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.18) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Ambient glows */}
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />

          {/* 3D floating shapes */}
          <Shape3DCube size={55} color="rgba(124,58,237,0.65)" className="absolute top-24 left-8 sm:left-24" />
          <Shape3DSphere size={45} color="rgba(22,163,74,0.65)" className="absolute top-32 right-8 sm:right-28" />
          <Shape3DPyramid className="absolute bottom-40 left-12 sm:left-32 opacity-60" />
          <Shape3DRing className="absolute bottom-32 right-8 sm:right-20" />

          {/* Content Wrapper */}
          <div className="relative z-10 max-w-5xl mx-auto">
            
            {/* Top Navigation & Back Button */}
            <div className="slide-up-1 flex items-center justify-between mb-8">
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-purple-700 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-purple-300 shadow-xs backdrop-blur-md transition-all font-semibold text-sm group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform text-purple-600" />
                <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}</span>
              </button>
            </div>

            {/* Page Header Title */}
            <div className="slide-up-2 text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 bg-purple-100/80 border border-purple-300/50 text-purple-700 shadow-xs">
                <Building2 size={14} className="text-purple-600" />
                <span>UC METC Multipurpose Cooperative</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4" style={{ color: '#7c3aed' }}>
                About UC METC SILMS
              </h1>
              
              <p className="text-slate-600 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto">
                The Sales, Inventory, Locker, and Membership (SILMS) platform built exclusively to streamline student services at UC METC.
              </p>
            </div>

            {/* Main Showcase Section */}
            <div className="slide-up-3 mb-16">
              <div className="card-hover-smooth bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-purple-500/15 p-6 sm:p-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Text */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-bold border border-green-200">
                      <ShieldCheck size={14} />
                      <span>Official Cooperative Platform</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
                      What We Do
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      UC METC SILMS is your one-stop digital platform for everything you need as a UC METC student. We make it easy for you to shop for school essentials, manage your locker rentals, and stay connected with the campus community.
                    </p>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      Whether you need uniforms, equipment, or supplies, you can browse and order online, then pick up at the Coop office. Plus, become a member to unlock exclusive member discounts and special perks!
                    </p>
                  </div>

                  {/* Right Card Emblem */}
                  <div className="md:col-span-5 bg-purple-50/80 p-6 sm:p-8 rounded-2xl border border-purple-100 text-center">
                    <img
                      src={COOP_LOGO_URL}
                      alt="UC METC Logo"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-4 shadow-md border-2 border-white ring-4 ring-purple-100"
                    />
                    <h3 className="text-xl font-extrabold text-slate-900">UC METC SILMS</h3>
                    <p className="text-xs text-purple-700 font-semibold mt-1">
                      Sales, Inventory, Locker & Membership System
                    </p>
                    <p className="text-[11px] text-slate-500 mt-3 uppercase tracking-wider font-bold">
                      UC METC Multipurpose Cooperative
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Highlights Section */}
            <div className="slide-up-4 mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                  Why Students Love <span style={{ color: '#7c3aed' }}>UC METC SILMS</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="card-hover-smooth bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Features Grid */}
            <div className="slide-up-4 mb-16">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                  What You Can Do
                </h2>
                <p className="text-slate-600 text-sm sm:text-base mt-2">
                  Explore all the features available to you on the SILMS platform
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="card-hover-smooth bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-7 border border-purple-500/15 shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-xs"
                          style={{
                            background: feature.color === '#16a34a' ? '#f0fdf4' : '#faf5ff',
                            color: feature.color,
                            border: `1px solid ${feature.color}30`,
                          }}
                        >
                          <Icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Counter Note */}
            <div className="slide-up-4 text-center">
              <p className="inline-flex items-center gap-2 text-slate-500 text-sm font-semibold bg-white/80 px-5 py-2.5 rounded-full border border-slate-200 backdrop-blur-md shadow-2xs">
                <Sparkles size={16} className="text-purple-600" />
                <span>Empowering UC METC Cooperative Members</span>
              </p>
            </div>

          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-12 px-4 sm:px-6" style={{ background: '#7c3aed' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-10">
              <div className="col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <img src={COOP_LOGO_URL} alt="Logo" className="w-9 h-9 rounded-full ring-2 ring-white/30" />
                  <span className="font-bold text-lg text-white">UC METC SILMS</span>
                </div>
                <p className="text-purple-100 text-sm leading-relaxed">
                  Your one-stop platform for shopping school essentials, managing locker rentals, and accessing cooperative member benefits.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-2">
                  {[
                    { label: 'Home', path: '/' },
                    { label: 'Announcements', path: '/announcements' },
                    { label: 'Community', path: '/community' },
                    { label: 'Learn More', path: '/learn-more' },
                  ].map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.path)}
                        className="text-purple-100 hover:text-green-300 text-sm transition-colors py-0.5 text-left font-medium"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Get in Touch</h4>
                <ul className="space-y-3 mb-5">
                  <li>
                    <a
                      href="mailto:ucmetc.ecc@gmail.com"
                      className="flex items-center gap-2 text-purple-100 hover:text-green-300 text-sm transition-colors"
                    >
                      <Mail size={14} />
                      ucmetc.ecc@gmail.com
                    </a>
                  </li>
                  <li>
                    <span className="flex items-center gap-2 text-purple-100 text-sm">
                      <Phone size={14} />
                      09695345084
                    </span>
                  </li>
                </ul>
                <a
                  href="https://www.facebook.com/profile.php?id=61573124552924"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-100 hover:text-white transition-colors"
                >
                  <Facebook size={20} />
                </a>
              </div>
            </div>
            <div className="border-t border-white/20 pt-6 text-center">
              <p className="text-purple-100 text-sm">© 2026 UC METC SILMS. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};
