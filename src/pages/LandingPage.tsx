import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { LANDING_VIDEO_URL } from '../constants/cloudinaryGallery';
import { COOP_LOGO_URL, BENEFITS_IMAGE_URL } from '../constants/cloudinaryAssets';

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
  Package,
  Mail,
  Facebook,
  Github,
  Lock,
  X,
  Phone,
} from 'lucide-react';
import { TypingEffect } from '../components/TypingEffect';

const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(3deg); }
  }
  
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-30px) rotate(-5deg); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 40px rgba(22, 163, 74, 0.2), inset 0 0 40px rgba(22, 163, 74, 0.05); }
    50% { box-shadow: 0 0 80px rgba(22, 163, 74, 0.4), inset 0 0 40px rgba(168, 85, 247, 0.1); }
  }
  
  @keyframes glow-pulse-purple {
    0%, 100% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(168, 85, 247, 0.05); }
    50% { box-shadow: 0 0 80px rgba(168, 85, 247, 0.4), inset 0 0 40px rgba(22, 163, 74, 0.1); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes slide-in {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes zoom-in {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes fade-in-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes glow-pulse-scale {
    0%, 100% { opacity: 0.4; box-shadow: 0 0 30px rgba(22, 163, 74, 0.2), 0 0 60px rgba(22, 163, 74, 0.08); }
    50% { opacity: 0.6; box-shadow: 0 0 50px rgba(22, 163, 74, 0.35), 0 0 100px rgba(22, 163, 74, 0.2); }
  }
  
  @keyframes glow-pulse-scale-alt {
    0%, 100% { opacity: 0.3; box-shadow: 0 0 35px rgba(168, 85, 247, 0.2), 0 0 70px rgba(168, 85, 247, 0.08); }
    50% { opacity: 0.5; box-shadow: 0 0 55px rgba(168, 85, 247, 0.35), 0 0 110px rgba(168, 85, 247, 0.2); }
  }
  
  @keyframes hero-scale-in {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes button-scale-in {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes button-lift {
    0% { transform: translateY(0px); }
    100% { transform: translateY(-3px); }
  }

  @keyframes purple-outline-pulse {
    0%, 100% { 
      border-color: rgba(168, 85, 247, 0);
      box-shadow: 0 0 0px rgba(168, 85, 247, 0);
    }
    50% { 
      border-color: rgba(168, 85, 247, 1);
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
    }
  }
  }
  
  @keyframes button-glow {
    0%, 100% { box-shadow: 0 4px 15px rgba(22, 163, 74, 0.2); }
    50% { box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4), 0 0 20px rgba(22, 163, 74, 0.2); }
  }
  
  @keyframes button-glow-purple {
    0%, 100% { box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2); }
    50% { box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.2); }
  }
  
  .btn-scale-in { animation: button-scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .btn-hover-effect { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .btn-hover-effect:hover { transform: translateY(-3px); }
  .btn-glow-green:hover { box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4), 0 0 20px rgba(22, 163, 74, 0.2); }
  .btn-glow-purple:hover { animation: button-glow-purple 1.5s ease-in-out infinite; }
  .zoom-in-animation { animation: zoom-in 0.8s ease-out forwards; }
  
  .blob-pulse-green {
    animation: blob-glow-pulse 5s ease-in-out infinite;
  }
  
  .blob-pulse-purple {
    animation: blob-glow-pulse 5s ease-in-out infinite;
    animation-delay: 2.5s;
  }

  @keyframes blob-glow-pulse {
    0%, 100% {
      opacity: 0.35;
      transform: scale(0.9) translate(0px, 0px);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.15) translate(15px, -15px);
    }
  }
  
  @keyframes hero-fade-scale {
    0% { transform: scale(0.92) translateY(20px); opacity: 0; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  
  .hero-entrance { animation: hero-fade-scale 1.2s ease-out forwards; }
  .fade-in-up-animation { animation: fade-in-up 0.7s ease-out forwards; opacity: 0; }
  .shimmer-effect { position: relative; overflow: hidden; }
  .shimmer-effect::after { 
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 3s infinite;
  }
  
  /* Custom Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 12px;
  }
  
  ::-webkit-scrollbar-track {
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #16a34a 0%, #a855f7 100%);
    border-radius: 6px;
    border: 2px solid rgba(255,255,255,0.1);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #15803d 0%, #9333ea 100%);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }
  
  /* Firefox Scrollbar */
  * {
    scrollbar-color: #16a34a #a855f7 rgba(255,255,255,0.1);
    scrollbar-width: thin;
  }
  
  /* Header scroll animation */
  nav {
    will-change: transform;
  }
`;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const setHoveredFeature = useState<number | null>(null)[1];
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time stats state
  const [stats, setStats] = useState({
    products: 0,
    students: 0,
    members: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch real-time stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await apiClient.getLandingStats() as { products: number; students: number; members: number };
        setStats({
          products: data.products || 0,
          students: data.students || 0,
          members: data.members || 0,
        });
      } catch (error) {
        console.error('Failed to fetch landing stats:', error);
        // Keep default values on error
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px 50px 0px',
      }
    );

    // Observe all elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach((el) => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down (but only after 100px to allow initial navigation)
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const features = [
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Shop School Essentials',
      description: 'Browse uniforms, equipment, and supplies. Order online and pick up at the UC Coop office quick and convenient!',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Exclusive Member Benefits',
      description: 'Join the cooperative and unlock special discounts, priority access, and member-only perks!',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Secure Locker Rentals',
      description: 'Rent a locker for your belongings. Manage renewals and track your locker status all from your phone.',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Easy Payments',
      description: 'Pay with cash or GCash. Track your orders and billing history in one convenient place.',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Stay Updated',
      description: 'Get instant notifications about new products, restocks, announcements, and exclusive deals.',
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: 'Key Duplication Service',
      description: 'Need an extra key? Request key duplication services directly through the app with easy approval.',
    },
  ];

  const benefits = [
    'Member-exclusive discounts on products',
    'Order online, pick up on UC Coop Office',
    'Secure locker rentals with easy management',
    'Mobile-friendly shopping experience',
    'Real-time updates on new arrivals & restocks',
    'Fast checkout and payment options',
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="relative w-full min-h-screen bg-gradient-to-b from-white to-purple-400 text-slate-900 overflow-hidden">
        

        {/* Navigation Bar */}
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-b from-white/40 to-white/10 transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={COOP_LOGO_URL}
                alt="UC METC Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
              />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent truncate max-w-[170px] sm:max-w-none">
                UC METC SILMS
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors font-medium group"
              >
                <Bell size={18} className="group-hover:scale-110 transition-transform" />
                <span>Announcements</span>
              </button>
              <button
                onClick={() => navigate('/community')}
                className="flex items-center space-x-2 text-slate-600 hover:text-purple-600 transition-colors font-medium group"
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                <span>Community</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 font-semibold group"
              >
                <LogIn size={18} />
                <span>Login</span>
              </button>
            </div>
 
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-green-600 transition-colors z-50 flex-shrink-0"
            >
              {mobileMenuOpen ? <X size={24} /> : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
 
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
 
        {/* Mobile Menu Slide-in */}
        <div
          className={`fixed top-0 right-0 h-full w-64 bg-gradient-to-t from-green-500 to-green-600 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-200 transition-all hover:rotate-90 duration-300"
          >
            <X size={28} />
          </button>
 
          {/* Menu Items */}
          <div className="flex flex-col items-end space-y-8 pt-24 pr-8 text-white">
            <button
              onClick={() => {
                navigate('/announcements');
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 text-xl font-medium hover:text-gray-200 transition-all hover:scale-110 hover:translate-x-[-8px] duration-300 group"
            >
              <Bell size={24} className="group-hover:scale-110 transition-transform" />
              <span>Event</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/community');
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 text-xl font-medium hover:text-gray-200 transition-all hover:scale-110 hover:translate-x-[-8px] duration-300 group"
            >
              <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
              <span>Community</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/login');
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 text-xl font-medium hover:text-gray-200 transition-all hover:scale-110 hover:translate-x-[-8px] duration-300 group"
            >
              <LogIn size={24} className="group-hover:scale-110 transition-transform" />
              <span>Login</span>
            </button>
          </div>
        </div>
 
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32 px-4 sm:px-6">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-80 pointer-events-none z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-green-300 rounded-full blur-3xl blob-pulse-green"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-400 to-purple-300 rounded-full blur-3xl blob-pulse-purple" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10 fade-in-up-animation">
            <div className="text-center">
              <div className="mb-4 sm:mb-6 inline-block">
                <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                  Your One-Stop Shop for UC METC School Essentials
                </span>
              </div>
 
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="block">Shop Smart,</span>
                <span className="block bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                  <TypingEffect
                    words={['Study Better', 'Save More', 'Live Easier', 'Succeed Together']}
                    className="font-bold inline-block"
                    speed={80}
                    deleteSpeed={40}
                    delayBetweenWords={1500}
                  />
                </span>
              </h1>
 
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-slate-600 mb-6 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                Get your uniforms, equipment, and school supplies in UC Coop Office. Exclusive member discounts, secure lockers, and hassle-free ordering all in one website.
              </p>
 
              <div className="flex justify-center items-center gap-3 sm:gap-4 lg:gap-6 w-full max-w-md mx-auto px-2">
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm lg:text-base btn-hover-effect btn-glow-green btn-scale-in border-2 border-transparent shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 sm:w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span className="truncate">Watch Video</span>
                </button>
 
                <button
                  onClick={() => navigate('/learn-more')}
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-white text-purple-600 px-3 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm lg:text-base btn-hover-effect border-2 border-purple-200 hover:border-purple-600 btn-scale-in shadow-md hover:shadow-lg"
                >
                  <span className="truncate">Learn More</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Feature Quick Stats */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mt-12 sm:mt-16 lg:mt-20">
              {[
                { label: 'Products Available', value: statsLoading ? '...' : `${stats.products}+` },
                { label: 'Registered Students', value: statsLoading ? '...' : `${stats.students}+` },
                { label: 'Approved Members', value: statsLoading ? '...' : `${stats.members}+` },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  id={`stat-${idx}`}
                  data-animate="true"
                  className={`text-center p-2 sm:p-6 rounded-lg bg-white/70 backdrop-blur-sm border border-white/40 hover:border-green-400 transition-all duration-700 ${
                    visibleElements.has(`stat-${idx}`) ? 'zoom-in-animation' : 'opacity-0 scale-75'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-sm xs:text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent mb-0.5 sm:mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 text-[8px] xs:text-[10px] sm:text-sm font-medium tracking-tight leading-snug">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 
                id="features-title"
                data-animate="true"
                className={`text-4xl md:text-5xl font-bold mb-4 transition-all duration-700 ${
                  visibleElements.has('features-title') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                }`}
              >
                Everything You Need for School
              </h2>
              <p 
                id="features-desc"
                data-animate="true"
                className={`text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
                  visibleElements.has('features-desc') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                }`}
              >
                From uniforms to lockers, we've got you covered with convenient services designed for UC METC students
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  id={`feature-${idx}`}
                  data-animate="true"
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`group relative p-4 sm:p-6 lg:p-8 rounded-xl bg-white/80 border border-white/40 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                    visibleElements.has(`feature-${idx}`) ? 'zoom-in-animation' : 'opacity-0 scale-75'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 text-white group-hover:scale-110 transition-transform group-hover:shadow-lg group-hover:shadow-green-400/50">
                      {feature.icon}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-900">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 group-hover:text-slate-700">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
              <div>
                <h2 
                  id="benefits-title"
                  data-animate="true"
                  className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-8 transition-all duration-700 ${
                    visibleElements.has('benefits-title') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <span className="block mb-1 sm:mb-2">Why Choose</span>
                  <span className="bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">UC METC SILMS</span>
                </h2>
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {benefits.map((benefit, idx) => (
                    <div 
                      key={idx} 
                      id={`benefit-${idx}`}
                      data-animate="true"
                      className={`flex items-center space-x-2 sm:space-x-4 group transition-all duration-700 ${
                        visibleElements.has(`benefit-${idx}`) ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                      }`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-400/50 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={18} className="text-white" />
                      </div>
                      <span className="text-lg text-slate-700 group-hover:text-slate-900 transition-colors">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div 
                id="benefits-image"
                data-animate="true"
                className={`relative transition-all duration-700 ${
                  visibleElements.has('benefits-image') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                }`}
                style={{ animationDelay: '0.2s' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-purple-400/30 rounded-3xl blur-2xl"></div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 bg-gradient-to-br from-white/20 to-white/10 p-2">
                  <img 
                    src={BENEFITS_IMAGE_URL} 
                    alt="UC METC SILMS Benefits" 
                    className="w-full h-auto object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 py-8 sm:py-12 lg:py-14 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="max-w-7xl mx-auto">

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">

              {/* Col 1 — Brand */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">UC METC SILMS</h3>
                <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
                  UC METC Sales, Inventory, Locker, and Membership System is your one-stop platform for shopping school essentials,
                  managing locker rentals, and accessing cooperative member benefits designed exclusively for UC METC students.
                </p>
              </div>

              {/* Col 2 — Quick Links */}
              <div className="sm:pl-4 lg:pl-0">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-5">Quick Links</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    { label: 'Home', path: '/' },
                    { label: 'Announcements', path: '/announcements' },
                    { label: 'Community', path: '/community' },
                    { label: 'Learn More', path: '/learn-more' },
                  ].map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.path)}
                        className="text-purple-100 hover:text-green-300 text-xs sm:text-sm transition-colors duration-200"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3 — Get in Touch */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-5">Get in Touch</h4>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <li className="flex items-center gap-2 sm:gap-3 text-purple-100 text-xs sm:text-sm">
                    <Mail size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
                    <a href="mailto:ucmetc.ecc@gmail.com" className="hover:text-green-300 transition-colors break-all">
                      ucmetc.ecc@gmail.com
                    </a>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-purple-100 text-xs sm:text-sm">
                    <Phone size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
                    <span>09695345084</span>
                  </li>
                </ul>
                <div className="flex items-center gap-3 sm:gap-5">
                  <a
                    href="https://github.com/Vinzz290034/UC-METC-Coop-Alpha.git"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-300 transition-colors hover:scale-110 duration-300"
                  >
                    <Github size={18} className="sm:w-6 sm:h-6" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61573124552924"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-300 transition-colors hover:scale-110 duration-300"
                  >
                    <Facebook size={18} className="sm:w-6 sm:h-6" />
                  </a>
                </div>
              </div>

            </div>

            {/* Divider + Copyright */}
            <div className="border-t border-white/20 pt-6 sm:pt-8 text-center">
              <p className="text-purple-100 text-xs sm:text-sm">© 2026 UC METC SILMS. All rights reserved.</p>
            </div>

          </div>
        </footer>

        {/* Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="relative bg-black rounded-2xl shadow-2xl max-w-3xl w-full animate-scale-in">
              {/* Close Button */}
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute -top-4 -right-4 bg-white text-slate-900 rounded-full p-3 hover:bg-slate-100 transition-all hover:scale-110 shadow-lg z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Video Player */}
              <div className="relative pt-[56.25%]">
                <video
                  className="absolute inset-0 w-full h-full rounded-2xl"
                  controls
                  autoPlay
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  src={LANDING_VIDEO_SRC}
                >
                  <source src={LANDING_VIDEO_SRC} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
