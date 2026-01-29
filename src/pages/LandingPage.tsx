import React from 'react';
import { useNavigate } from 'react-router-dom';
import coopLogo from '../assets/Coop.jpeg';
import {
  ArrowRight,
  Box,
  Key,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  Bell,
  MessageCircle,
  LogIn,
  ChevronLeft,
  Package,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Box className="w-8 h-8" />,
      title: 'Locker Management',
      description:
        'Complete locker registration, rental renewals, and maintenance tracking system',
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: 'Sales & Inventory',
      description:
        'Modern POS system with real-time inventory tracking for uniforms and accessories',
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: 'Key Services',
      description:
        'Streamlined key duplication requests with approval workflows',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Member Management',
      description:
        'Comprehensive member profiles with linked services and history',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Billing & Payments',
      description: 'Unified billing system for all services and transactions',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Reports & Analytics',
      description:
        'Detailed insights into sales, inventory, and cooperative performance',
    },
  ];

  const benefits = [
    'Centralized platform for all cooperative services',
    'Real-time tracking and automated reporting',
    'Role-based access control for security',
    'Mobile-responsive design for any device',
    'Intuitive interface requiring minimal training',
    'Comprehensive audit trails and records',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-green-900 text-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-slate-900/80 border-b border-purple-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={coopLogo}
              alt="UC METC Logo" 
              className="w-10 h-10 rounded-full hover:scale-110 transition-transform"
            />
            <h1 className="text-2xl font-bold text-green-400">
              UC METC SILMS
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/announcements')}
              className="flex items-center space-x-2 text-slate-300 hover:text-green-400 transition-colors font-medium group"
              title="View Announcements"
            >
              <Bell size={20} className="group-hover:scale-110 transition-transform" />
              <span>Announcements</span>
            </button>
            <button
              onClick={() => navigate('/community')}
              className="flex items-center space-x-2 text-slate-300 hover:text-purple-400 transition-colors font-medium group"
              title="Join Community"
            >
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span>Community</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 font-semibold group"
              title="Login to Account"
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              UC METC SILMS
              <br />
              <span className="text-purple-400">
                System & Locker
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Comprehensive management system for University of Cebu Maritimer Education Training Center. Manage inventory, locker services, and staff operations with ease.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center space-x-3 bg-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 font-semibold text-lg group"
            >
              <span>Get Started Now</span>
              <ArrowRight
                size={24}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            {[
              {
                icon: '🔒',
                title: 'Secure',
                desc: 'Role-based access control',
              },
              {
                icon: '⚡',
                title: 'Fast',
                desc: 'Real-time data updates',
              },
              {
                icon: '📊',
                title: 'Smart',
                desc: 'Comprehensive analytics',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm hover:bg-slate-800/80 transition-all"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-800/50 border-y border-purple-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Features
            </h3>
            <p className="text-slate-300 text-lg">
              Everything you need to manage your cooperative efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-8 hover:bg-slate-900/80 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl md:text-5xl font-bold mb-8">
                Why Choose
                <br />
                <span className="text-purple-400">
                  UC METC SILMS
                </span>
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start space-x-4 group">
                    <div className="mt-1 p-1 bg-gradient-to-br from-green-500 to-purple-500 rounded-full group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <span className="text-lg text-slate-200">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-2xl blur-2xl"></div>
              <div className="relative bg-slate-900/80 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="h-3 bg-green-500 rounded-full w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded-full w-full"></div>
                  <div className="h-3 bg-slate-700 rounded-full w-5/6"></div>
                  <div className="mt-6 space-y-2">
                    <div className="h-2 bg-green-500/50 rounded w-1/2"></div>
                    <div className="h-2 bg-slate-700 rounded w-full"></div>
                    <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-purple-700/50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h3>
          <p className="text-xl text-slate-300 mb-8">
            Join the University of Cebu - METC Multipurpose Cooperative and
            streamline your operations today.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center space-x-3 bg-purple-600 text-white px-10 py-4 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 font-semibold text-lg group"
          >
            <span>Login to Your Account</span>
            <ArrowRight
              size={24}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-700/50 py-12 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Features
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Pricing
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Security
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Documentation
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Support
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Guides
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  About
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Blog
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Careers
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Privacy
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Terms
                </li>
                <li className="hover:text-green-400 cursor-pointer transition-colors">
                  Contact
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-purple-700/50 pt-8">
            <p className="text-center text-slate-400 text-sm">
              © 2026 University of Cebu - Maritimer Education Training Center. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
