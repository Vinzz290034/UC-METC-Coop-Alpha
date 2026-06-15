import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Users, Zap, BarChart3, Lock, ShoppingCart, Bell, Facebook, Mail, Phone } from 'lucide-react';
import { COOP_LOGO_URL, UC_METC_LOGO_URL } from '../constants/cloudinaryAssets';

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
  
  @keyframes fade-in-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes hero-fade-scale {
    0% { transform: scale(0.92) translateY(20px); opacity: 0; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  
  .hero-entrance { animation: hero-fade-scale 0.8s ease-out forwards; }
  .fade-in-up-animation { animation: fade-in-up 0.5s ease-out forwards; opacity: 0; }
`;

export const LearnMorePage: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: ShoppingCart,
      title: 'Shop School Essentials',
      description: 'Browse and buy uniforms, equipment, and supplies online. Order now, pick up at the Coop office quick and hassle-free!',
    },
    {
      icon: Bell,
      title: 'Stay in the Loop',
      description: 'Get instant notifications about new products, restocks, campus announcements, and exclusive deals to never miss out!',
    },
    {
      icon: Lock,
      title: 'Manage Your Locker',
      description: 'Rent a locker, renew your rental, and track everything from your phone. Keep your belongings safe and organized.',
    },
    {
      icon: Users,
      title: 'Join the Coop Community',
      description: 'Become a member and enjoy exclusive discounts, priority access to new products, and special member-only perks!',
    },
    {
      icon: BarChart3,
      title: 'Track Your Orders',
      description: 'View your purchase history, check order status, and manage your billing and all your transactions in one place.',
    },
    {
      icon: Zap,
      title: 'Always Available',
      description: 'Shop anytime, anywhere! Our platform is fast, reliable, and works perfectly on your phone, tablet, or computer.',
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
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-400 text-slate-900 overflow-hidden animate-slide-in-right">
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-80 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-green-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-400 to-purple-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-2 xs:px-6 py-2 sm:py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-2 xs:px-4 py-1.5 sm:py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all min-h-0 min-w-0 text-sm sm:text-base font-medium"
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            Back
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div 
        className="text-white py-8 xs:py-12 sm:py-20 bg-cover bg-[center_top] bg-no-repeat relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${UC_METC_LOGO_URL})`
        }}
      >
        <div className="max-w-6xl mx-auto px-4 xs:px-6 text-center relative z-10">
          <h1 className="text-2xl xs:text-4xl sm:text-5xl md:text-6xl font-bold mb-2 xs:mb-6">About UC METC SILMS</h1>
          <p className="text-xs xs:text-base sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            The Sales, Inventory, Locker, and Membership (SILMS) platform for the UC METC Multipurpose Cooperative.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 xs:px-6 py-10 sm:py-20">
        <div className="grid grid-cols-2 gap-4 xs:gap-12 items-center">
          <div>
            <h2 className="text-sm xs:text-2xl sm:text-4xl font-bold text-slate-800 mb-2 xs:mb-6">What We Do</h2>
            <p className="text-[10px] xs:text-sm sm:text-lg text-slate-600 mb-2 xs:mb-4 text-justify leading-snug">
              UC METC SILMS is your one-stop digital platform for everything you need as a UC METC student. We make it easy for you to shop for school essentials, manage your locker, and stay connected with the campus community.
            </p>
            <p className="text-[10px] xs:text-sm sm:text-lg text-slate-600 mb-2 xs:mb-4 text-justify leading-snug">
              Whether you need uniforms, equipment, or supplies, you can browse and order online, then pick up at the Coop office. Plus, become a member to unlock exclusive discounts and special perks!
            </p>
            <p className="text-[10px] xs:text-sm sm:text-lg text-slate-600 text-justify leading-snug">
              We're here to make your student life easier by bringing all cooperative services together in one convenient platform. Shop smart, save time, and focus on what matters most, your education.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-green-100 rounded-2xl p-4 xs:p-12 flex items-center justify-center">
            <div className="text-center">
              <img src={COOP_LOGO_URL} alt="UC METC Logo" className="w-12 h-12 xs:w-24 xs:h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-2 xs:mb-6 shadow-lg" />
              <h3 className="text-xs xs:text-xl sm:text-2xl font-bold text-slate-800 leading-tight">UC METC SILMS</h3>
              <p className="text-[9px] xs:text-sm sm:text-slate-600 mt-1 xs:mt-2 leading-tight">Sales, Inventory, Locker, and <br className="hidden xs:block"/> Membership System</p>
              <p className="text-[7px] xs:text-xs sm:text-slate-500 mt-1 xs:mt-4 leading-tight">UC METC Multipurpose<br className="hidden xs:block"/> Cooperative</p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="bg-slate-100 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-2 xs:px-6">
          <h2 className="text-sm xs:text-2xl sm:text-4xl font-bold text-slate-800 mb-4 sm:mb-12 text-center">Why Students Love UC METC SILMS</h2>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-6">
            {highlights.map((highlight, idx) => (
              <div key={idx} className="bg-white p-1.5 xs:p-3 sm:p-6 rounded-lg shadow flex items-center space-x-1 sm:space-x-4">
                <CheckCircle2 className="text-green-600 flex-shrink-0 w-4 h-4 xs:w-6 xs:h-6 sm:w-8 sm:h-8" />
                <p className="text-[8px] xs:text-xs sm:text-sm font-semibold text-slate-800 leading-tight">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="max-w-6xl mx-auto px-2 xs:px-6 py-10 sm:py-20">
        <h2 className="text-sm xs:text-2xl sm:text-4xl font-bold text-slate-800 mb-4 sm:mb-12 text-center">What You Can Do</h2>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg p-2 xs:p-4 sm:p-8 border border-slate-200 hover:border-green-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-green-100 to-purple-100 w-6 xs:w-10 sm:w-16 h-6 xs:h-10 sm:h-16 rounded-lg flex items-center justify-center mb-1 xs:mb-6">
                  <Icon className="w-3.5 h-3.5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-[9px] xs:text-base sm:text-xl font-bold text-slate-800 mb-0.5 sm:mb-3 leading-tight">{feature.title}</h3>
                <p className="text-[7px] xs:text-xs sm:text-sm text-slate-600 leading-snug">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      </div>

      {/* Footer */}
      <footer className="border-t border-white/20 py-14 px-6 bg-gradient-to-r from-purple-500 to-purple-600">
        <div className="max-w-7xl mx-auto">

          {/* 2/3-Column Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">

            {/* Col 1 — Brand (full width on mobile) */}
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">UC METC SILMS</h3>
              <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
                UC METC Sales, Inventory, Locker, and Membership System is your one-stop platform for shopping school essentials,
                managing locker rentals, and accessing cooperative member benefits designed exclusively for UC METC students.
              </p>
            </div>

            {/* Col 2 — Quick Links */}
            <div className="col-span-1">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-5">Quick Links</h4>
              <ul className="space-y-1 sm:space-y-3">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Announcements', path: '/announcements' },
                  { label: 'Community', path: '/community' },
                  { label: 'Learn More', path: '/learn-more' },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-purple-100 hover:text-green-300 text-xs sm:text-sm transition-colors duration-200 min-h-0 min-w-0 py-0.5 text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Get in Touch */}
            <div className="col-span-1 lg:col-span-1">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-5">Get in Touch</h4>
              <ul className="space-y-1 sm:space-y-3 mb-4 sm:mb-6">
                <li className="flex items-center gap-1.5 sm:gap-3 text-purple-100 text-[10px] xs:text-xs sm:text-sm">
                  <Mail size={13} className="flex-shrink-0 sm:w-4 sm:h-4" />
                  <a href="mailto:ucmetc.ecc@gmail.com" className="hover:text-green-300 transition-colors break-all min-h-0 min-w-0 py-0.5">
                    ucmetc.ecc@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-1.5 sm:gap-3 text-purple-100 text-[10px] xs:text-xs sm:text-sm">
                  <Phone size={13} className="flex-shrink-0 sm:w-4 sm:h-4" />
                  <span className="min-h-0 min-w-0 py-0.5">09695345084</span>
                </li>
              </ul>
              <div className="flex items-center gap-3 sm:gap-5">
                <a
                  href="https://www.facebook.com/profile.php?id=61573124552924"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-300 transition-colors hover:scale-110 duration-300 min-h-0 min-w-0"
                >
                  <Facebook size={16} className="sm:w-6 sm:h-6" />
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
        </div>
      </div>
    </>
  );
};
