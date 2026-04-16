import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
import {
  ArrowRight,
  Box,
  Key,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Bell,
  MessageCircle,
  LogIn,
  Package,
  Mail,
  Facebook,
  Github,
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
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
      icon: <Box className="w-6 h-6" />,
      title: 'Locker Management',
      description: 'Complete locker registration, rental renewals, and tracking',
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Sales & Inventory',
      description: 'Real-time POS system with inventory optimization',
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: 'Key Services',
      description: 'Streamlined key duplication with approval workflows',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Member Management',
      description: 'Comprehensive profiles with linked services',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Billing & Payments',
      description: 'Unified billing for all cooperative services',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Detailed insights and cooperative performance',
    },
  ];

  const benefits = [
    'Centralized platform for all services',
    'Real-time tracking and automation',
    'Role-based security control',
    'Mobile-responsive design',
    'Intuitive interface',
    'Comprehensive audit trails',
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-400 text-slate-900 overflow-hidden">
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-80 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-green-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-400 to-purple-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Navigation Bar */}
        <nav className={`fixed top-0 w-full z-50 backdrop-blur-md bg-gradient-to-b from-white/40 to-white/10 transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={coopLogo}
                alt="UC METC Logo" 
                className="w-10 h-10 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                UC METC SILMS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors font-medium group"
              >
                <Bell size={18} className="group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Announcements</span>
              </button>
              <button
                onClick={() => navigate('/community')}
                className="flex items-center space-x-2 text-slate-600 hover:text-purple-600 transition-colors font-medium group"
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Community</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 font-semibold group"
              >
                <LogIn size={18} />
                <span>Login</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-40 pb-32 px-6">
          <div className="max-w-6xl mx-auto relative z-10 fade-in-up-animation">
            <div className="text-center">
              <div className="mb-6 inline-block">
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Welcome to the Future of Cooperative Management
                </span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="block">Streamline Your</span>
                <span className="block bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                  <TypingEffect
                    words={['Operations', 'Services', 'Management', 'Success']}
                    className="font-bold inline-block"
                    speed={80}
                    deleteSpeed={40}
                    delayBetweenWords={1500}
                  />
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Modern, intuitive platform for managing UC METC Coop services. Lockers, inventory, billing, and analytics. All in one place.
              </p>

              <div className="flex justify-center gap-6 flex-wrap">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-lg font-semibold text-lg group btn-hover-effect btn-glow-green btn-scale-in"
                >
                  <span>Get Started</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
                </button>

                <button
                  onClick={() => navigate('/learn-more')}
                  className="inline-flex items-center justify-center space-x-3 bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-transparent hover:border-purple-600 transition-all duration-300 group hover:shadow-lg"
                  style={{
                    animation: 'button-scale-in 0.6s ease-out',
                  }}
                >
                  <span>Learn More</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </div>
            </div>

            {/* Feature Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-20">
              {[
                { label: 'Services', value: '6+' },
                { label: 'Members', value: '200+' },
                { label: 'Uptime', value: '99.9%' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  id={`stat-${idx}`}
                  data-animate="true"
                  className={`text-center p-6 rounded-lg bg-white/70 backdrop-blur-sm border border-white/40 hover:border-green-400 transition-all duration-700 ${
                    visibleElements.has(`stat-${idx}`) ? 'zoom-in-animation' : 'opacity-0 scale-75'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
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
                Essential Features
              </h2>
              <p 
                id="features-desc"
                data-animate="true"
                className={`text-xl text-slate-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
                  visibleElements.has('features-desc') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                }`}
              >
                Everything needed to manage your cooperative efficiently and effectively
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  id={`feature-${idx}`}
                  data-animate="true"
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`group relative p-8 rounded-xl bg-white/80 border border-white/40 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                    visibleElements.has(`feature-${idx}`) ? 'zoom-in-animation' : 'opacity-0 scale-75'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform group-hover:shadow-lg group-hover:shadow-green-400/50">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 text-sm group-hover:text-slate-700">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 
                  id="benefits-title"
                  data-animate="true"
                  className={`text-4xl md:text-5xl font-bold mb-8 transition-all duration-700 ${
                    visibleElements.has('benefits-title') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <span className="block mb-2">Why Choose</span>
                  <span className="bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">UC METC SILMS</span>
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, idx) => (
                    <div 
                      key={idx} 
                      id={`benefit-${idx}`}
                      data-animate="true"
                      className={`flex items-center space-x-4 group transition-all duration-700 ${
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
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-purple-400/20 rounded-2xl blur-2xl"></div>
                <div className="relative bg-white/80 border-2 border-white/40 rounded-2xl p-8 shadow-lg">
                  <div className="space-y-4">
                    <div className="h-3 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-5/6"></div>
                    <div className="mt-6 space-y-2">
                      <div className="h-2 bg-green-200 rounded w-1/2"></div>
                      <div className="h-2 bg-slate-200 rounded w-full"></div>
                      <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 py-12 px-6 bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Resources</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li className="hover:text-green-400 cursor-pointer transition-colors">Documentation</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors">Support</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors">FAQ</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li className="hover:text-green-400 cursor-pointer transition-colors">About</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors">Blog</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors">Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li onClick={() => navigate('/privacy-policy')} className="hover:text-green-400 cursor-pointer transition-colors">Privacy</li>
                  <li onClick={() => navigate('/terms-of-use')} className="hover:text-green-400 cursor-pointer transition-colors">Terms</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors">Compliance</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/30 pt-8">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex items-center space-x-6">
                  <a 
                    href="https://www.facebook.com/profile.php?id=61573124552924" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-400 transition-colors hover:scale-110 duration-300"
                  >
                    <Facebook size={24} />
                  </a>
                  <a 
                    href="mailto:ucmetc.ecc@gmail.com" 
                    className="text-white hover:text-green-400 transition-colors hover:scale-110 duration-300"
                  >
                    <Mail size={24} />
                  </a>
                  <a 
                    href="https://github.com/Vinzz290034/UC-METC-Coop-Alpha.git" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-400 transition-colors hover:scale-110 duration-300"
                  >
                    <Github size={24} />
                  </a>
                </div>
                <p className="text-white text-sm">© 2026 UC METC SILMS. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
