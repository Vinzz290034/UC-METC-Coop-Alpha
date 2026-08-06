import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { LANDING_VIDEO_URL } from '../constants/cloudinaryGallery';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import { CashierAnimation } from '../components/CashierAnimation';

const LANDING_VIDEO_SRC =
  import.meta.env.VITE_LANDING_VIDEO_URL || LANDING_VIDEO_URL;
import {
  ArrowRight,
  Key,
  Users,
  DollarSign,
  CheckCircle2,
  Bell,
  MessageCircle,
  LogIn,
  Mail,
  Facebook,
  Lock,
  X,
  Phone,
  Play,
  ShoppingBag,
} from 'lucide-react';
import { TypingEffect } from '../components/TypingEffect';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * { font-family: 'Inter', sans-serif; }

  /* ---- 3D Floating Shapes ---- */
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
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }
  @keyframes slide-up-fade {
    from { transform: translateY(50px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes card-lift {
    from { transform: translateY(60px) scale(0.9); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes shimmer-line {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes counter-up {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes glow-green {
    0%, 100% { box-shadow: 0 0 20px rgba(22,163,74,0.3); }
    50%      { box-shadow: 0 0 40px rgba(22,163,74,0.6), 0 0 80px rgba(22,163,74,0.2); }
  }
  @keyframes glow-purple {
    0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); }
    50%      { box-shadow: 0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.2); }
  }
  @keyframes scan-line {
    0%   { top: 0%; }
    100% { top: 100%; }
  }
  @keyframes border-flow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes tilt-hover {
    0%, 100% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg); }
    25%       { transform: perspective(1000px) rotateX(2deg) rotateY(2deg); }
    75%       { transform: perspective(1000px) rotateX(-2deg) rotateY(-2deg); }
  }

  /* Utility classes */
  .animate-float-a { animation: float3d-a 7s ease-in-out infinite; }
  .animate-float-b { animation: float3d-b 9s ease-in-out infinite; }
  .animate-float-c { animation: float3d-c 6s ease-in-out infinite; }
  .animate-spin-3d { animation: spin3d 12s linear infinite; }
  .animate-orbit   { animation: orbit 5s linear infinite; }

  .slide-up-1 { animation: slide-up-fade 0.8s ease-out 0.1s both; }
  .slide-up-2 { animation: slide-up-fade 0.8s ease-out 0.3s both; }
  .slide-up-3 { animation: slide-up-fade 0.8s ease-out 0.5s both; }
  .slide-up-4 { animation: slide-up-fade 0.8s ease-out 0.7s both; }
  .fade-in-1  { animation: fade-in 0.8s ease-out 0.2s both; }

  .card-enter { animation: card-lift 0.7s cubic-bezier(0.34,1.2,0.64,1) both; }

  /* 3D Card hover effect */
  .card-3d {
    transform-style: preserve-3d;
    transition: transform 0.4s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.4s ease;
  }
  .card-3d:hover {
    transform: perspective(800px) rotateX(-4deg) rotateY(4deg) translateY(-8px);
    box-shadow: 20px 20px 60px rgba(0,0,0,0.4), -5px -5px 20px rgba(255,255,255,0.05);
  }

  /* Feature icon 3D */
  .icon-3d {
    transform-style: preserve-3d;
    transition: transform 0.5s ease;
  }
  .card-3d:hover .icon-3d {
    transform: perspective(200px) rotateY(-15deg) rotateX(10deg) scale(1.15);
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
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer-line 2.5s infinite;
  }

  /* Glowing green button */
  .btn-green-glow {
    background: #16a34a;
    transition: all 0.3s ease;
  }
  .btn-green-glow:hover {
    background: #15803d;
    animation: glow-green 1.5s ease-in-out infinite;
    transform: translateY(-2px);
  }

  /* Purple outline button */
  .btn-purple-outline {
    border: 2px solid #7c3aed;
    color: #7c3aed;
    background: transparent;
    transition: all 0.3s ease;
  }
  .btn-purple-outline:hover {
    background: #7c3aed;
    color: white;
    transform: translateY(-2px);
    animation: glow-purple 1.5s ease-in-out infinite;
  }

  /* Stat card pop */
  .stat-pop {
    animation: counter-up 0.6s cubic-bezier(0.34,1.2,0.64,1) both;
  }

  /* Light card */
  .card-light {
    background: #ffffff;
    border: 1px solid rgba(124,58,237,0.1);
    box-shadow: 0 4px 24px rgba(124,58,237,0.07);
  }

  /* Pulse ring indicator */
  .pulse-ring::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: inherit;
    border: 2px solid #16a34a;
    animation: pulse-ring 2s ease-out infinite;
  }

  /* Scan line effect on hero */
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

  /* Nav backdrop — light */
  .nav-light {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(124,58,237,0.1);
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }

  /* Section dividers */
  .section-divider {
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(22,163,74,0.3), transparent);
    height: 1px;
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #16a34a; }
`;

// ----- 3D Shape Components -----
const Shape3DCube: React.FC<{ size?: number; color: string; className?: string }> = ({
  size = 60,
  color,
  className = '',
}) => (
  <div
    className={`animate-float-a ${className}`}
    style={{ width: size, height: size, transformStyle: 'preserve-3d', perspective: 400 }}
  >
    <div
      style={{
        width: size,
        height: size,
        background: color,
        border: `2px solid rgba(255,255,255,0.2)`,
        borderRadius: 8,
        boxShadow: `0 0 30px ${color}55`,
        transform: 'rotateX(15deg) rotateY(30deg)',
        transformStyle: 'preserve-3d',
        animation: 'spin3d 14s linear infinite',
      }}
    />
  </div>
);

const Shape3DPyramid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-float-b ${className}`}
    style={{
      width: 0,
      height: 0,
      borderLeft: '35px solid transparent',
      borderRight: '35px solid transparent',
      borderBottom: '60px solid rgba(22,163,74,0.5)',
      filter: 'drop-shadow(0 0 20px rgba(22,163,74,0.6))',
    }}
  />
);

const Shape3DSphere: React.FC<{ size?: number; color: string; className?: string }> = ({
  size = 50,
  color,
  className = '',
}) => (
  <div
    className={`animate-float-c rounded-full ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3) 0%, ${color} 50%, rgba(0,0,0,0.4) 100%)`,
      boxShadow: `0 0 40px ${color}66, inset -10px -10px 20px rgba(0,0,0,0.3)`,
    }}
  />
);

const Shape3DRing: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-spin-3d ${className}`}
    style={{
      width: 80,
      height: 80,
      border: '6px solid rgba(124,58,237,0.6)',
      borderRadius: '50%',
      borderTopColor: 'rgba(22,163,74,0.9)',
      boxShadow: '0 0 30px rgba(124,58,237,0.4), inset 0 0 20px rgba(22,163,74,0.2)',
    }}
  />
);

// ----- Main Component -----
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ products: 0, students: 0, members: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getLandingStats() as { products: number; students: number; members: number };
        setStats({ products: data.products || 0, students: data.students || 0, members: data.members || 0 });
      } catch {}
      finally { setStatsLoading(false); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) setVisibleElements((p) => new Set([...p, entry.target.id]));
      }),
      { threshold: 0.1, rootMargin: '50px 0px 50px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      if (cur < lastScrollY) setIsHeaderVisible(true);
      else if (cur > lastScrollY && cur > 100) setIsHeaderVisible(false);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const features = [
    { icon: <ShoppingBag className="w-6 h-6" />, title: 'Shop School Essentials', description: 'Browse uniforms, equipment, and supplies. Order online and pick up at the UC Coop office.', color: '#16a34a' },
    { icon: <Users className="w-6 h-6" />, title: 'Exclusive Member Benefits', description: 'Join the cooperative and unlock special discounts, priority access, and member-only perks.', color: '#7c3aed' },
    { icon: <Lock className="w-6 h-6" />, title: 'Secure Locker Rentals', description: 'Rent a locker, manage renewals, and track your locker status—all from your phone.', color: '#16a34a' },
    { icon: <DollarSign className="w-6 h-6" />, title: 'Easy Payments', description: 'Pay with cash or GCash. Track orders and billing history in one convenient place.', color: '#7c3aed' },
    { icon: <Bell className="w-6 h-6" />, title: 'Stay Updated', description: 'Get instant notifications about new products, restocks, announcements, and exclusive deals.', color: '#16a34a' },
    { icon: <Key className="w-6 h-6" />, title: 'Key Duplication Service', description: 'Request key duplication services directly through the app with easy approval.', color: '#7c3aed' },
  ];

  const benefits = [
    'Member-exclusive discounts on products',
    'Order online, pick up at UC Coop Office',
    'Secure locker rentals with easy management',
    'Mobile-friendly shopping experience',
    'Real-time updates on new arrivals & restocks',
    'Fast checkout and payment options',
  ];

  return (
    <>
      <style>{styles}</style>
      {/* ROOT: Light Background */}
      <div className="relative w-full min-h-screen text-slate-900 overflow-hidden" style={{ background: '#ffffff' }}>

        {/* ── NAVIGATION ── */}
        <nav className={`fixed top-0 left-0 right-0 z-50 nav-light transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={COOP_LOGO_URL} alt="UC METC Logo" className="w-9 h-9 rounded-full ring-2 shadow-lg" style={{ borderColor: 'rgba(124,58,237,0.4)' }} />
              <span className="text-lg sm:text-xl font-bold">
                <span style={{ color: '#16a34a' }}>UC</span>
                <span className="text-slate-800"> METC </span>
                <span style={{ color: '#7c3aed' }}>SILMS</span>
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={() => navigate('/announcements')} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-purple-50 transition-all font-medium">
                <Bell size={16} /><span>Announcements</span>
              </button>
              <button onClick={() => navigate('/community')} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-purple-50 transition-all font-medium">
                <MessageCircle size={16} /><span>Community</span>
              </button>
              <button onClick={() => navigate('/login')} className="flex items-center gap-2 btn-green-glow btn-shimmer text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg">
                <LogIn size={16} /><span>Login</span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors">
              {mobileMenuOpen ? <X size={24} /> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
        <div className={`fixed top-0 right-0 h-full w-72 z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ background: 'rgba(255,255,255,0.98)', borderLeft: '1px solid rgba(124,58,237,0.2)', backdropFilter: 'blur(20px)', boxShadow: '-8px 0 40px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setMobileMenuOpen(false)} className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 transition-colors"><X size={24} /></button>
          <div className="flex flex-col space-y-6 pt-20 px-8">
            {[
              { label: 'Announcements', path: '/announcements', icon: <Bell size={20} /> },
              { label: 'Community', path: '/community', icon: <MessageCircle size={20} /> },
              { label: 'Login', path: '/login', icon: <LogIn size={20} /> },
            ].map((item) => (
              <button key={item.label} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} className="flex items-center gap-3 text-slate-700 hover:text-slate-900 font-semibold text-lg transition-all hover:translate-x-1">
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── HERO SECTION ── */}
        <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 overflow-hidden scan-overlay" style={{ background: 'linear-gradient(160deg, #f9f5ff 0%, #f0fdf4 50%, #faf5ff 100%)' }}>
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.18) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Ambient glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

          {/* 3D floating shapes */}
          <Shape3DCube size={55} color="rgba(124,58,237,0.65)" className="absolute top-24 left-8 sm:left-24" />
          <Shape3DSphere size={45} color="rgba(22,163,74,0.65)" className="absolute top-32 right-8 sm:right-28" />
          <Shape3DPyramid className="absolute bottom-40 left-12 sm:left-32 opacity-60" />
          <Shape3DRing className="absolute bottom-32 right-8 sm:right-20" />
          <Shape3DCube size={35} color="rgba(22,163,74,0.45)" className="absolute top-1/2 left-4 sm:left-16 opacity-50" />
          <Shape3DSphere size={30} color="rgba(124,58,237,0.45)" className="absolute top-1/3 right-4 sm:right-16 opacity-50" />

          {/* Hero content */}
          <div className="relative z-10 max-w-5xl mx-auto text-center mt-16 sm:mt-24">
            <div className="slide-up-1 inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 relative pulse-ring" style={{ position: 'relative' }} />
              <span className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold" style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.35)', color: '#16a34a' }}>
                Your One-Stop Shop for UC METC School Essentials
              </span>
            </div>

            <h1 className="slide-up-2 text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 leading-none tracking-tight">
              <span className="block text-slate-900">Shop Smart,</span>
              <span className="block" style={{ color: '#7c3aed' }}>
                <TypingEffect words={['Study Better', 'Save More', 'Live Easier', 'Succeed Together']} className="font-black inline-block" speed={80} deleteSpeed={40} delayBetweenWords={1800} />
              </span>
            </h1>

            <p className="slide-up-3 text-sm sm:text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get your uniforms, equipment, and school supplies at UC METC Coop.<br className="hidden sm:block" />
              Exclusive member discounts, secure lockers, and hassle-free ordering<br className="hidden sm:block" />
              all in one place.
            </p>

            <div className="slide-up-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button onClick={() => setShowVideoModal(true)} className="btn-green-glow btn-shimmer flex items-center gap-3 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl w-full sm:w-auto justify-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Play size={14} fill="white" />
                </div>
                Watch Video
              </button>
              <button onClick={() => navigate('/learn-more')} className="btn-purple-outline flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base w-full sm:w-auto justify-center" style={{ border: '2px solid #7c3aed' }}>
                Learn More <ArrowRight size={18} />
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-16 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto fade-in-1">
              {[
                { label: 'Products Available', value: statsLoading ? '...' : `${stats.products}+`, color: '#16a34a' },
                { label: 'Registered Students', value: statsLoading ? '...' : `${stats.students}+`, color: '#7c3aed' },
                { label: 'Approved Members', value: statsLoading ? '...' : `${stats.members}+`, color: '#16a34a' },
              ].map((stat, i) => (
                <div key={i} id={`stat-${i}`} data-animate="true" className={`stat-pop rounded-2xl p-4 sm:p-6 text-center bg-white ${visibleElements.has(`stat-${i}`) ? 'stat-pop' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.15}s`, border: `1px solid ${stat.color}28`, boxShadow: `0 4px 20px ${stat.color}18` }}>
                  <div className="text-xl sm:text-3xl lg:text-4xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-medium leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider mx-8 sm:mx-16" />

        {/* ── FEATURES SECTION ── */}
        <section className="relative py-24 px-4 sm:px-6" style={{ background: '#fafafa' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="features-title" data-animate="true" className={`text-3xl sm:text-5xl font-black mb-4 text-slate-900 transition-all duration-700 ${visibleElements.has('features-title') ? 'slide-up-fade' : 'opacity-0 translate-y-10'}`}>
                Everything You Need<br /><span style={{ color: '#7c3aed' }}>For School</span>
              </h2>
              <p id="features-desc" data-animate="true" className={`text-slate-500 text-base sm:text-lg max-w-xl mx-auto transition-all duration-700 delay-100 ${visibleElements.has('features-desc') ? 'slide-up-fade' : 'opacity-0 translate-y-8'}`}>
                From uniforms to lockers, we've got you covered with convenient services for UC METC students.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  id={`feature-${idx}`}
                  data-animate="true"
                  className={`card-3d card-light rounded-2xl p-6 sm:p-8 cursor-default transition-all duration-700 ${visibleElements.has(`feature-${idx}`) ? 'card-enter' : 'opacity-0 translate-y-12'}`}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="icon-3d w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-white" style={{ background: feature.color, boxShadow: `0 8px 24px ${feature.color}44` }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                  <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${feature.color}55, transparent)` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider mx-8 sm:mx-16" />

        {/* ── BENEFITS SECTION ── */}
        <section className="relative py-24 px-4 sm:px-6" style={{ background: '#ffffff' }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 id="benefits-title" data-animate="true" className={`text-3xl sm:text-5xl font-black mb-8 text-slate-900 transition-all duration-700 ${visibleElements.has('benefits-title') ? 'card-enter' : 'opacity-0 translate-y-10'}`}>
                  Why Choose<br /><span style={{ color: '#16a34a' }}>UC METC SILMS?</span>
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} id={`benefit-${idx}`} data-animate="true" className={`flex items-center gap-4 group transition-all duration-600 ${visibleElements.has(`benefit-${idx}`) ? 'fade-in' : 'opacity-0'}`} style={{ animationDelay: `${idx * 0.08}s` }}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#16a34a', boxShadow: '0 0 14px rgba(22,163,74,0.4)' }}>
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                      <span className="text-slate-600 group-hover:text-slate-900 transition-colors font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="benefits-image" data-animate="true" className={`relative transition-all duration-700 ${visibleElements.has('benefits-image') ? 'card-enter' : 'opacity-0 translate-y-10'}`}>
                <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="relative rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 8px 60px rgba(124,58,237,0.1)', background: '#f5f0ff' }}>
                  <CashierAnimation />
                </div>
              </div>
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
                <p className="text-purple-100 text-sm leading-relaxed">Your one-stop platform for shopping school essentials, managing locker rentals, and accessing cooperative member benefits.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-2">
                  {[{ label: 'Home', path: '/' }, { label: 'Announcements', path: '/announcements' }, { label: 'Community', path: '/community' }, { label: 'Learn More', path: '/learn-more' }].map((link) => (
                    <li key={link.label}><button onClick={() => navigate(link.path)} className="text-purple-100 hover:text-green-300 text-sm transition-colors py-0.5 text-left font-medium">{link.label}</button></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Get in Touch</h4>
                <ul className="space-y-3 mb-5">
                  <li><a href="mailto:ucmetc.ecc@gmail.com" className="flex items-center gap-2 text-purple-100 hover:text-green-300 text-sm transition-colors"><Mail size={14} />ucmetc.ecc@gmail.com</a></li>
                  <li><span className="flex items-center gap-2 text-purple-100 text-sm"><Phone size={14} />09695345084</span></li>
                </ul>
                <a href="https://www.facebook.com/profile.php?id=61573124552924" target="_blank" rel="noopener noreferrer" className="text-purple-100 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
            <div className="border-t border-white/20 pt-6 text-center">
              <p className="text-purple-100 text-sm">© 2026 UC METC SILMS. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* ── VIDEO MODAL ── */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ animation: 'fade-in 0.3s ease' }} onClick={() => setShowVideoModal(false)}>
            <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              {/* Close button straddling top-right corner */}
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-0 right-0 z-20 w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                style={{ transform: 'translate(50%, -50%)' }}
              >
                <X size={18} />
              </button>
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(124,58,237,0.5)' }}>
                <div className="relative pt-[56.25%]">
                  <video className="absolute inset-0 w-full h-full" controls autoPlay controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} src={LANDING_VIDEO_SRC}>
                    <source src={LANDING_VIDEO_SRC} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
