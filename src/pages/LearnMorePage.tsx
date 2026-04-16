import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Users, Zap, BarChart3, Lock, ShoppingCart, Bell, Facebook, Mail, Github } from 'lucide-react';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
// @ts-ignore
import ucMetcBg from '../assets/UC_metc.jpg';

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
      title: 'Easy Ordering',
      description: 'Browse and purchase products from the cooperative store with a user-friendly interface designed for quick and convenient shopping.',
    },
    {
      icon: Bell,
      title: 'Stay Informed',
      description: 'Receive real-time announcements and important updates directly from UC METC to keep you informed about events and opportunities.',
    },
    {
      icon: Lock,
      title: 'Secure Lockers',
      description: 'Manage your locker rentals with ease - rent, renew, and track your locker status all in one place.',
    },
    {
      icon: Users,
      title: 'Cooperative Membership',
      description: 'Join our cooperative community to access exclusive benefits, member-only pricing, and special privileges.',
    },
    {
      icon: BarChart3,
      title: 'Transaction History',
      description: 'Keep track of all your purchases, payments, and locker rentals with detailed billing information.',
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Experience lightning-fast performance and 99.9% uptime to ensure you never miss out on important updates or services.',
    },
  ];

  const highlights = [
    'Secure Ordering System',
    '500+ Active Users',
    '99.9% Uptime',
    'Real-time Announcements',
    'Easy Membership',
    'Mobile Responsive',
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={coopLogo} alt="UC METC Logo" className="w-10 h-10 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800">UC METC SILMS</h2>
          </div>
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${ucMetcBg})`
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
            <h2 className="text-4xl font-bold text-slate-800 mb-6">Our Mission</h2>
            <p className="text-lg text-slate-600 mb-4 text-justify">
              UC METC SILMS (Sales, Inventory, Locker, and Membership System) is a comprehensive digital platform designed specifically for the University of Cebu Maritime Education and Training Center community.
            </p>
            <p className="text-lg text-slate-600 mb-4 text-justify">
              Our platform empowers students to order products, manage locker rentals, stay updated with important announcements, and explore membership opportunities in our cooperative community.
            </p>
            <p className="text-lg text-slate-600 text-justify">
              We're committed to providing a seamless, integrated experience that streamlines cooperative services and enhances the student experience at UC METC.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-green-100 rounded-2xl p-12 flex items-center justify-center">
            <div className="text-center">
              <img src={coopLogo} alt="UC METC Logo" className="w-32 h-32 rounded-full mx-auto mb-6 shadow-lg" />
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
          <h2 className="text-4xl font-bold text-slate-800 mb-12 text-center">Why Choose UC METC SILMS?</h2>
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
        <h2 className="text-4xl font-bold text-slate-800 mb-12 text-center">Core Features</h2>
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
      <footer className="border-t border-white/20 py-12 px-6 bg-gradient-to-r from-purple-500 to-purple-600">
        <div className="max-w-6xl mx-auto">
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
      </div>
    </>
  );
};
