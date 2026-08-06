import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import {
  Calendar,
  User,
  ChevronLeft,
  Search,
  Bell,
  MessageCircle,
  LogIn,
  Mail,
  Phone,
  Facebook,
  X,
  Filter,
  LayoutDashboard,
  Megaphone,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';

// ----- CSS & Animations (Matching LandingPage design layout) -----
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
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }
  @keyframes slide-up-fade {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes shimmer-line {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
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

  /* Utility classes */
  .animate-float-a { animation: float3d-a 7s ease-in-out infinite; }
  .animate-float-b { animation: float3d-b 9s ease-in-out infinite; }
  .animate-float-c { animation: float3d-c 6s ease-in-out infinite; }
  .animate-spin-3d { animation: spin3d 12s linear infinite; }

  .slide-up-1 { animation: slide-up-fade 0.8s ease-out 0.1s both; }
  .slide-up-2 { animation: slide-up-fade 0.8s ease-out 0.25s both; }
  .slide-up-3 { animation: slide-up-fade 0.8s ease-out 0.4s both; }
  .slide-up-4 { animation: slide-up-fade 0.8s ease-out 0.55s both; }

  /* Announcement Card hover effect */
  .card-3d {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.3s ease;
  }
  .card-3d:hover {
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

  /* Nav backdrop — light */
  .nav-light {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(124,58,237,0.12);
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
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

export const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const data = (await apiClient.getPublicAnnouncements()) as any[];
        if (data && Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
        } else {
          setAnnouncements([
            {
              id: 'ann-default-1',
              title: 'MEMBERSHIP APPLICATION PROCESS GUIDE',
              category: 'Registration',
              date: '2026-07-07',
              author_name: 'Vince Andrew Santoya',
              author_role: 'Admin',
              content: `Welcome to the UC METC Multipurpose Cooperative! To help you smoothly navigate your application, please follow this step-by-step process:

Step 1: Submit Your Online Request
Click the "Join Now!" button on the portal dashboard. This will instantly submit your request, and your application profile will be reflected in our system as "Pending."

Step 2: Settle Fees at the Coop Office
Proceed directly to the Coop Office to complete your financial onboarding. You will need to settle:

▸ ₱200.00 for the Membership Fee
▸ Your initial contribution amount for your Share Capital

Step 3: Attend the Membership Orientation
Right after your payment is processed, Ms. Lamoste will conduct the official membership orientation briefing to welcome you and walk you through your exclusive cooperative benefits.

Thank you, and we look forward to having you as a member part of the UC Coop family!`,
            },
            {
              id: 'ann-default-2',
              title: 'System Scheduled Maintenance',
              category: 'Maintenance',
              date: '2026-07-01',
              author_name: 'Coop Admin',
              author_role: 'Admin',
              content: 'Please be advised that the portal will undergo scheduled maintenance on Saturday, 10:00 PM to 12:00 AM. Ordering and kiosk payment services may be temporarily unavailable.',
            }
          ]);
        }
      } catch (error) {
        console.error('[AnnouncementsPage] Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
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

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(announcements.map((a) => a.category).filter(Boolean)))];

  // Filter announcements
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesCategory = selectedCategory === 'All' || ann.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ann.title?.toLowerCase().includes(query) ||
      ann.content?.toLowerCase().includes(query) ||
      ann.author_name?.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeStyle = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('registration') || cat.includes('onboard') || cat.includes('membership')) {
      return { bg: 'bg-purple-100 text-purple-700 border-purple-200/80', dot: 'bg-purple-600', line: 'bg-[#7c3aed]' };
    }
    if (cat.includes('urgent') || cat.includes('alert') || cat.includes('notice') || cat.includes('important')) {
      return { bg: 'bg-rose-100 text-rose-700 border-rose-200/80', dot: 'bg-rose-600', line: 'bg-rose-600' };
    }
    if (cat.includes('event') || cat.includes('activity')) {
      return { bg: 'bg-blue-100 text-blue-700 border-blue-200/80', dot: 'bg-blue-600', line: 'bg-blue-600' };
    }
    if (cat.includes('locker') || cat.includes('store') || cat.includes('shop')) {
      return { bg: 'bg-amber-100 text-amber-700 border-amber-200/80', dot: 'bg-amber-600', line: 'bg-amber-600' };
    }
    return { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-600', line: 'bg-emerald-600' };
  };

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
                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 bg-purple-50 rounded-xl font-bold shadow-sm"
              >
                <Bell size={16} className="text-purple-600" />
                <span>Announcements</span>
              </button>
              <button
                onClick={() => navigate('/community')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-purple-50 transition-all font-medium"
              >
                <MessageCircle size={16} />
                <span>Community</span>
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
              className="flex items-center gap-3 text-purple-700 font-bold text-lg transition-all"
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
              <MessageCircle size={20} />
              <span>Community</span>
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
          style={{ background: 'linear-gradient(160deg, #f9f5ff 0%, #f0fdf4 50%, #faf5ff 100%)' }}
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
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-purple-700 bg-white/70 hover:bg-white border border-slate-200/80 hover:border-purple-300 shadow-xs backdrop-blur-md transition-all font-semibold text-sm group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform text-purple-600" />
                <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}</span>
              </button>
            </div>

            {/* Page Header Title */}
            <div className="slide-up-2 text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 bg-purple-100/80 border border-purple-300/50 text-purple-700 shadow-xs">
                <Megaphone size={14} className="text-purple-600" />
                <span>Latest System News & Updates</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4" style={{ color: '#7c3aed' }}>
                Announcements
              </h1>
              
              <p className="text-slate-600 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Stay updated with the latest news, guidelines, service notices, and official announcements from UC METC SILMS.
              </p>
            </div>

            {/* Search & Category Filter Section */}
            <div className="slide-up-3 mb-10 bg-white/80 backdrop-blur-xl border border-purple-500/15 p-4 sm:p-6 rounded-2xl shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-4">
                
                {/* Search Input */}
                <div className="relative w-full md:flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search announcements by title, keyword, or author..."
                    className="w-full pl-11 pr-10 py-3 bg-white/90 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Category Pills Header */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  <Filter size={16} className="text-purple-600 flex-shrink-0 hidden md:block ml-1" />
                  <div className="flex items-center gap-2">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      const count =
                        cat === 'All'
                          ? announcements.length
                          : announcements.filter((a) => a.category?.toLowerCase() === cat.toLowerCase()).length;

                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-102'
                              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          <span>{cat}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Announcements List */}
            <div className="slide-up-4 space-y-6">
              {loading ? (
                /* Skeleton Loader */
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white/80 backdrop-blur-md border border-purple-100 p-6 sm:p-8 rounded-2xl shadow-lg animate-pulse"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-28 h-6 bg-purple-200/60 rounded-full" />
                        <div className="w-32 h-4 bg-slate-200 rounded" />
                      </div>
                      <div className="w-3/4 h-7 bg-slate-300/70 rounded mb-3" />
                      <div className="space-y-2 mb-4">
                        <div className="w-full h-4 bg-slate-200/80 rounded" />
                        <div className="w-5/6 h-4 bg-slate-200/80 rounded" />
                      </div>
                      <div className="w-40 h-4 bg-slate-200/60 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                /* Empty State */
                <div className="text-center py-16 px-6 bg-white/85 backdrop-blur-xl border border-purple-500/15 rounded-2xl shadow-xl">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                    <Megaphone size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No announcements found</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                    {searchQuery || selectedCategory !== 'All'
                      ? 'No announcements match your search or selected filter. Try clearing filters or searching for something else.'
                      : 'There are currently no active announcements. Please check back later!'}
                  </p>
                  {(searchQuery || selectedCategory !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="inline-flex items-center gap-2 btn-purple-outline px-5 py-2.5 rounded-xl text-sm font-semibold"
                    >
                      <RefreshCw size={16} />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Announcements Cards Grid */
                filteredAnnouncements.map((announcement) => {
                  const badgeStyle = getCategoryBadgeStyle(announcement.category);
                  const formattedDate = announcement.date
                    ? new Date(announcement.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <article
                      key={announcement.id}
                      className="card-3d bg-white/85 backdrop-blur-xl border border-purple-500/15 p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden group"
                    >
                      {/* Left Solid Accent Stripe */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${badgeStyle.line} rounded-l-2xl`} />

                      {/* Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${badgeStyle.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                            {announcement.category || 'General'}
                          </span>
                        </div>

                        {/* Date Pill */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                          <Calendar size={13} className="text-purple-600" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 group-hover:text-purple-700 transition-colors leading-snug">
                        {announcement.title}
                      </h2>

                      {/* Author Info Pill */}
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-5 bg-purple-50/60 w-fit px-3 py-1.5 rounded-lg border border-purple-100">
                        <User size={14} className="text-purple-600" />
                        <span>
                          {announcement.author_role && (
                            <span className="capitalize font-bold text-purple-800">
                              {announcement.author_role} •{' '}
                            </span>
                          )}
                          <span className="font-semibold text-slate-700">{announcement.author_name}</span>
                        </span>
                      </div>

                      {/* Image Attachment */}
                      {(announcement.image_url || announcement.image) && (
                        <div className="mb-5 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center max-h-[300px] max-w-xl mx-auto shadow-xs">
                          <img 
                            src={announcement.image_url || announcement.image} 
                            alt={announcement.title} 
                            className="max-h-[290px] w-auto max-w-full object-contain p-2 hover:scale-102 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Content Body */}
                      <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
                        {announcement.content}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Bottom Counter Note */}
            {!loading && filteredAnnouncements.length > 0 && (
              <div className="text-center mt-12">
                <p className="inline-flex items-center gap-2 text-slate-500 text-xs sm:text-sm font-medium bg-white/70 px-4 py-2 rounded-full border border-slate-200/80 backdrop-blur-md">
                  <CheckCircle2 size={16} className="text-green-600" />
                  Showing {filteredAnnouncements.length} of {announcements.length} announcements
                </p>
              </div>
            )}

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
