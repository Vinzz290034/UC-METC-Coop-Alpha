import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ShoppingBag,
  Bell,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../store/authContext';

export const StudentDashboard: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const banners = [
    {
      title: 'Acquaintance Party 2025',
      subtitle: 'Connect, Celebrate, Create Memories',
      date: 'October 16, 2025',
      time: '5:00 PM - 9:00 PM',
      cta: 'Get Tickets',
      bg: 'from-green-600/40 to-purple-600/40',
    },
    {
      title: 'Back to School 2025',
      subtitle: 'Get Your Coop Essentials',
      date: 'August 1, 2025',
      time: '8:00 AM - 5:00 PM',
      cta: 'Shop Now',
      bg: 'from-purple-600/40 to-purple-700/40',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'ICT Congress 2026 (Early Bird)',
      description: 'Innovating The Future: Empowering Tomorrow\'s Tech Leaders',
      date: '4/22/2026',
      icon: Calendar,
      color: 'border-l-purple-500',
    },
    {
      id: 2,
      title: 'Acquaintance Party 2025',
      description: 'CCS fam, the wait is OVER! 🎉 This Saturday, 28th of September, 6 PM onwards at The Quad.',
      date: '9/28/2025',
      icon: Zap,
      color: 'border-l-green-500',
    },
    {
      id: 3,
      title: 'General Assembly Meeting',
      description: 'Important meeting for all members regarding cooperative policies and updates.',
      date: '10/5/2025',
      icon: Bell,
      color: 'border-l-blue-500',
    },
  ];

  const importantInfo = [
    {
      title: 'Office Hours',
      status: 'Open',
      details: [
        'Monday to Saturday: 7 AM - 11 AM, 1 PM - 5 PM',
        'Sunday & Holidays: Closed',
      ],
    },
    {
      title: 'Location',
      details: [
        'Room E-5 (Near Main Campus)',
        'UC METC Multipurpose Cooperative Office',
      ],
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen p-6 animate-fade-in-long">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-700 text-lg font-medium">
            Welcome back, {user?.first_name}! Here's what's happening in your cooperative.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Featured Banner & Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured Banner Carousel */}
            <div className="relative rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border border-purple-600/30 shadow-xl group">
              {/* Background Image/Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${banners[currentImageIndex].bg} transition-all duration-500`} />
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center px-8 text-white">
                <div className="mb-4 inline-flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-purple-900 px-4 py-2 rounded-full w-fit font-semibold text-sm">
                  <span>Featured Event</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">{banners[currentImageIndex].title}</h2>
                <p className="text-purple-100 text-lg mb-4">{banners[currentImageIndex].subtitle}</p>
                <div className="flex items-center space-x-6 text-sm text-purple-100 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{banners[currentImageIndex].date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>{banners[currentImageIndex].time}</span>
                  </div>
                </div>
                <button className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 w-fit group/btn">
                  <span>{banners[currentImageIndex].cta}</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Upcoming Events Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-lg">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const IconComponent = event.icon;
                  return (
                    <div
                      key={event.id}
                      className={`border-l-4 ${event.color} bg-gradient-to-r from-white/50 to-white/30 rounded-lg p-5 hover:from-white/70 hover:to-white/50 transition-all duration-300 group cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-green-500/20 rounded-lg mt-1">
                            <IconComponent size={20} className="text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-purple-600 font-medium ml-12">
                        <Calendar size={14} />
                        <span>{event.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Important Info & Quick Actions */}
          <div className="space-y-6">
            {/* Important Info */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg space-y-6">
              {importantInfo.map((info, idx) => (
                <div key={idx} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                    {info.title === 'Office Hours' && <Clock size={20} className="text-purple-600" />}
                    {info.title === 'Location' && <MapPin size={20} className="text-green-600" />}
                    <span>{info.title}</span>
                  </h3>
                  <div className="space-y-2">
                    {info.details.map((detail, detailIdx) => (
                      <p key={detailIdx} className="text-sm text-slate-600">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Membership Card */}
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative z-10">
                <ShoppingBag size={32} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold mb-2">Explore Coop Shop</h3>
                <p className="text-green-50 text-sm mb-6">Get exclusive member benefits and special discounts on cooperative products.</p>
                <button className="w-full bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 flex items-center justify-center space-x-2">
                  <ShoppingBag size={18} />
                  <span>Shop Now</span>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 hover:from-purple-500/20 hover:to-green-500/20 transition-all duration-300 text-slate-900 font-medium flex items-center justify-between group">
                  <span>My Locker</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 hover:from-purple-500/20 hover:to-green-500/20 transition-all duration-300 text-slate-900 font-medium flex items-center justify-between group">
                  <span>Billing History</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 hover:from-purple-500/20 hover:to-green-500/20 transition-all duration-300 text-slate-900 font-medium flex items-center justify-between group">
                  <span>Request Key Duplication</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
