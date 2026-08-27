import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import { COMMUNITY_GA_GALLERY_URLS, GALLERY_IMAGE_URLS } from '../constants/cloudinaryGallery';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Bell,
  MessageCircle,
  LogIn,
  LayoutDashboard,
  Mail,
  Phone,
  Facebook,
  X,
  Sparkles,
  ChevronRight,
  ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { apiClient } from '../services/api';

// ----- CSS & Animations (Matching LandingPage layout, light theme, no gradient colors) -----
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

  /* Smooth Card hover effect without text blurriness */
  .card-hover-smooth {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.3s ease;
    will-change: transform;
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    transform: translateZ(0);
  }
  .card-hover-smooth:hover {
    transform: translateY(-4px) translateZ(0);
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

// Community Events Data
const communityEvents = [
  {
    id: 1,
    title: '11TH GENERAL ASSEMBLY 2026',
    subtitle: "Shaping Our Cooperative's Future Together",
    date: 'March 21, 2026',
    time: '1:00 PM - 5:00 PM',
    location: 'AVR 1 UC METC Campus',
    status: 'completed',
    shortDescription:
      'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives.',
    highlights: [
      'Approval of new sustainability initiatives',
      'Introduction of enhanced member benefits',
      'Election of new board of directors',
      'Financial performance presentations',
      'Community engagement workshops',
    ],
    attendees: '150+ Members',
    images: [...COMMUNITY_GA_GALLERY_URLS],
  },
];

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [eventsList, setEventsList] = useState<any[]>(communityEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | number>(communityEvents[0].id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await apiClient.getPublicActivities();
        if (data && Array.isArray(data) && data.length > 0) {
          const transformed = data.map((item: any) => {
            const rawImages = Array.isArray(item.gallery_images)
              ? item.gallery_images
              : (typeof item.gallery_images === 'string' ? JSON.parse(item.gallery_images || '[]') : []);
            const cleanImages = rawImages.filter((url: string) => url && typeof url === 'string' && !url.includes('dph4hxexg') && !url.includes('doas4qcdo'));

            return {
              id: item.id,
              title: item.title,
              subtitle: item.subtitle || item.short_description || item.shortDescription || '',
              date: item.date || '',
              time: item.time || '',
              location: item.location || (item.title?.toLowerCase().includes('ringhop') ? 'SM Seaside Sky Hall' : 'AVR 1 UC METC Campus'),
              status: 'completed',
              shortDescription: item.short_description || item.shortDescription || '',
              highlights: item.title?.toLowerCase().includes('ringhop')
                ? [
                    'Ring conferral ceremony for graduating candidates',
                    'Inspirational messages from faculty and industry mentors',
                    'Formal oath-taking of professional responsibility',
                    'Recognition of academic excellence and achievements',
                    'Celebratory reception with families and loved ones',
                  ]
                : [
                    'Approval of cooperative initiatives',
                    'Community engagement & workshops',
                    'Financial performance presentations',
                    'Election of board of directors',
                  ],
              attendees: item.attendees || (item.title?.toLowerCase().includes('ringhop') ? '300+ Members' : '150+ Members'),
              colorTheme: item.color_theme || item.colorTheme || 'emerald',
              images: cleanImages.length > 0 ? cleanImages : GALLERY_IMAGE_URLS,
            };
          });

          setEventsList(transformed);
          if (transformed.length > 0) {
            setSelectedEventId(transformed[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch community events:', err);
      }
    };
    fetchActivities();
  }, []);

  const selectedEvent = eventsList.find(e => e.id === selectedEventId) || eventsList[0] || communityEvents[0];

  const themeBgMap: Record<string, string> = {
    emerald: 'bg-[#16a34a]',
    purple: 'bg-[#7c3aed]',
    blue: 'bg-[#2563eb]',
    amber: 'bg-[#d97706]',
    rose: 'bg-[#e11d48]',
    slate: 'bg-[#1e293b]',
  };
  const bannerBg = themeBgMap[selectedEvent.colorTheme || 'emerald'] || 'bg-[#16a34a]';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-rotate gallery images
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedEvent.images && selectedEvent.images.length > 0) {
        setCurrentImageIndex((prev) => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1));
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [selectedEvent.images]);

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
                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 bg-purple-50 rounded-xl font-bold shadow-sm"
              >
                <MessageCircle size={16} className="text-purple-600" />
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
              className="flex items-center gap-3 text-purple-700 font-bold text-lg transition-all"
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
                <Sparkles size={14} className="text-purple-600" />
                <span>Cooperative Milestones & Gatherings</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4" style={{ color: '#7c3aed' }}>
                Community Events
              </h1>
              
              <p className="text-slate-600 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Celebrating our cooperative's milestones, general assemblies, and community achievements.
              </p>
            </div>

            {/* Event Selection Tabs */}
            {eventsList.length > 1 && (
              <div className="slide-up-3 flex flex-wrap items-center justify-center gap-3 mb-8">
                {eventsList.map((evt) => {
                  const isSelected = evt.id === selectedEvent.id;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setCurrentImageIndex(0);
                      }}
                      className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white ring-4 ring-purple-600/20 shadow-md scale-105'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {evt.title}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Featured Event Card */}
            <div className="slide-up-4 max-w-5xl mx-auto">
              <div className="card-hover-smooth bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-purple-500/15">
                
                {/* Event Card Solid Banner Header */}
                <div className={`${bannerBg} p-6 sm:p-10 text-white relative overflow-hidden transition-colors duration-500`}>
                  
                  {/* Subtle Background Accent Orbs */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-sm" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-sm" />

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-white/30 backdrop-blur-md">
                        {selectedEvent.status === 'completed' ? 'Recent Event' : 'Upcoming Event'}
                      </span>
                      <span className="bg-white/15 text-green-100 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                        <Users size={14} />
                        <span>{selectedEvent.attendees}</span>
                      </span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-2 text-white leading-tight">
                      {selectedEvent.title}
                    </h2>
                    
                    <p className="text-sm sm:text-xl text-green-100 mb-6 font-medium">
                      {selectedEvent.subtitle}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90 pt-2 border-t border-white/20 text-xs sm:text-sm font-semibold">
                      <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
                        <Calendar className="w-4 h-4 text-green-200" />
                        <span>{selectedEvent.date}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
                        <Clock className="w-4 h-4 text-green-200" />
                        <span>{selectedEvent.time}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
                        <MapPin className="w-4 h-4 text-green-200" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Content Body */}
                <div className="p-6 sm:p-10 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    
                    {/* About & Key Highlights Column */}
                    <div className="md:col-span-6 space-y-6">
                      <div>
                        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Sparkles size={20} className="text-purple-600" />
                          <span>About the Event</span>
                        </h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          {selectedEvent.shortDescription}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-base sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-blue-600" />
                          <span>Key Highlights</span>
                        </h4>
                        <ul className="space-y-3">
                          {selectedEvent.highlights.map((highlight: string, index: number) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                              <span className="text-slate-700 text-sm sm:text-base font-medium leading-normal">
                                {highlight}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Event Gallery Column */}
                    <div className="md:col-span-6 bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                          <ImageIcon size={20} className="text-purple-600" />
                          <span>Event Gallery</span>
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                          {(currentImageIndex % (selectedEvent.images.length || 1)) + 1} of {selectedEvent.images.length}
                        </span>
                      </div>

                      <div className="relative">
                        <div 
                          className="aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 cursor-pointer group relative"
                          onClick={() => setPreviewImage(selectedEvent.images[currentImageIndex % (selectedEvent.images.length || 1)])}
                          title="Click to view full screen"
                        >
                          <img
                            src={selectedEvent.images[currentImageIndex % (selectedEvent.images.length || 1)]}
                            alt={`${selectedEvent.title} - Photo ${(currentImageIndex % (selectedEvent.images.length || 1)) + 1}`}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          />
                        </div>
                        
                        {/* Interactive Gallery Indicators */}
                        {selectedEvent.images.length > 7 ? (
                          <div className="flex items-center justify-center mt-3">
                            <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-1 rounded-full shadow-xs">
                              {(currentImageIndex % (selectedEvent.images.length || 1)) + 1} / {selectedEvent.images.length}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center mt-3 gap-1.5 overflow-hidden py-1">
                            {selectedEvent.images.map((_: string, index: number) => {
                              const isActive = (currentImageIndex % (selectedEvent.images.length || 1)) === index;
                              return (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  style={{
                                    width: isActive ? 20 : 6,
                                    height: 6,
                                    minWidth: 0,
                                    minHeight: 0,
                                    padding: 0,
                                  }}
                                  className={`rounded-full transition-all duration-300 border-0 shrink-0 cursor-pointer ${
                                    isActive
                                      ? 'bg-[#16a34a]'
                                      : 'bg-slate-300 hover:bg-slate-400'
                                  }`}
                                  title={`View photo ${index + 1}`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Teaser Footer Note */}
            <div className="slide-up-4 mt-16 text-center">
              <p className="inline-flex items-center gap-2 text-slate-500 text-sm font-semibold bg-white/80 px-5 py-2.5 rounded-full border border-slate-200 backdrop-blur-md shadow-2xs">
                <Sparkles size={16} className="text-purple-600" />
                <span>More Cooperative Events Coming Soon</span>
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

      {/* Full Screen Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 z-[100] overflow-hidden animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="w-full max-w-6xl flex items-center justify-between text-white pt-2 z-20">
            <span className="text-xs sm:text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
              {currentImageIndex + 1} of {selectedEvent.images.length}
            </span>
            <button
              onClick={() => setPreviewImage(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20 backdrop-blur-md active:scale-95"
              aria-label="Close preview"
            >
              <X size={22} />
            </button>
          </div>

          <div 
            className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-2 sm:my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? selectedEvent.images.length - 1 : prev - 1));
                  setPreviewImage(selectedEvent.images[currentImageIndex === 0 ? selectedEvent.images.length - 1 : currentImageIndex - 1]);
                }}
                className="absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
                title="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="relative p-1 sm:p-1.5 bg-black/40 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center max-w-full max-h-[78vh] sm:max-h-[82vh]">
              <img
                src={previewImage}
                alt="Expanded Event Preview"
                className="max-w-full max-h-[76vh] sm:max-h-[80vh] object-contain rounded-xl animate-scale-in"
              />
            </div>

            {selectedEvent.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1));
                  setPreviewImage(selectedEvent.images[currentImageIndex === selectedEvent.images.length - 1 ? 0 : currentImageIndex + 1]);
                }}
                className="absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
                title="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
};
