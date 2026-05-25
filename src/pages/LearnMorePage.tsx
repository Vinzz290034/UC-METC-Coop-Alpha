import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Users, Zap, BarChart3, Lock, ShoppingCart, Bell, Facebook, Mail, Github, Phone } from 'lucide-react';
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div 
        className="text-white py-20 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${UC_METC_LOGO_URL})`
        }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About UC METC SILMS</h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            The Sales, Inventory, Locker, and Membership (SILMS) platform for the University of Cebu Maritime Education and Training Center.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-slate-800 mb-6">What We Do</h2>
            <p className="text-lg text-slate-600 mb-4 text-justify">
              UC METC SILMS is your one-stop digital platform for everything you need as a UC METC student. We make it easy for you to shop for school essentials, manage your locker, and stay connected with the campus community.
            </p>
            <p className="text-lg text-slate-600 mb-4 text-justify">
              Whether you need uniforms, equipment, or supplies, you can browse and order online, then pick up at the Coop office. Plus, become a member to unlock exclusive discounts and special perks!
            </p>
            <p className="text-lg text-slate-600 text-justify">
              We're here to make your student life easier by bringing all cooperative services together in one convenient platform. Shop smart, save time, and focus on what matters most, your education.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-green-100 rounded-2xl p-12 flex items-center justify-center">
            <div className="text-center">
              <img src={COOP_LOGO_URL} alt="UC METC Logo" className="w-32 h-32 rounded-full mx-auto mb-6 shadow-lg" />
              <h3 className="text-2xl font-bold text-slate-800">UC METC SILMS</h3>
              <p className="text-slate-600 mt-2">Sales, Inventory, Locker, and <br/> Membership System</p>
              <p className="text-sm text-slate-500 mt-4">University of Cebu Maritime Education<br/> and Training Center</p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="bg-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-slate-800 mb-12 text-center">Why Students Love UC METC SILMS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {highlights.map((highlight, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
                <CheckCircle2 size={32} className="text-green-600 flex-shrink-0" />
                <p className="font-semibold text-slate-800">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-slate-800 mb-12 text-center">What You Can Do</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg p-8 border border-slate-200 hover:border-green-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-green-100 to-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <Icon size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
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

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

            {/* Col 1 — Brand */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">UC METC SILMS</h3>
              <p className="text-purple-100 text-sm leading-relaxed">
                UC METC Sales, Inventory, Locker, and Membership System is your one-stop platform for shopping school essentials,
                managing locker rentals, and accessing cooperative member benefits designed exclusively for UC METC students.
              </p>
            </div>

            {/* Col 2 — Quick Links */}
            <div className="md:pl-16">
              <h4 className="text-lg font-semibold text-white mb-5">Quick Links</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Announcements', path: '/announcements' },
                  { label: 'Community', path: '/community' },
                  { label: 'Learn More', path: '/learn-more' },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-purple-100 hover:text-green-300 text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Get in Touch */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-5">Get in Touch</h4>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-purple-100 text-sm">
                  <Mail size={16} className="flex-shrink-0" />
                  <a href="mailto:ucmetc.ecc@gmail.com" className="hover:text-green-300 transition-colors">
                    ucmetc.ecc@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-3 text-purple-100 text-sm">
                  <Phone size={16} className="flex-shrink-0" />
                  <span>09695345084</span>
                </li>
              </ul>
              <div className="flex items-center gap-5">
                <a
                  href="https://github.com/Vinzz290034/UC-METC-Coop-Alpha.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-300 transition-colors hover:scale-110 duration-300"
                >
                  <Github size={22} />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61573124552924"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-300 transition-colors hover:scale-110 duration-300"
                >
                  <Facebook size={22} />
                </a>
              </div>
            </div>

          </div>

          {/* Divider + Copyright */}
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-purple-100 text-sm">© 2026 UC METC SILMS. All rights reserved.</p>
          </div>

        </div>
      </footer>
        </div>
      </div>
    </>
  );
};
