import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ShoppingBag,
  ArrowRight,
  Users,
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

export const StudentDashboard: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOfficeOpen, setIsOfficeOpen] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipRequested, setMembershipRequested] = useState(false);

  // Refresh user data on mount to get latest membership status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Define holidays (Philippine holidays and special closures)
  // Format: "YYYY-MM-DD"
  const holidays = [
    // 2026 Holidays
    '2026-01-01', // New Year's Day
    '2026-02-10', // EDSA Revolution
    '2026-02-25', // EDSA Revolution (observed)
    '2026-04-02', // Maundy Thursday
    '2026-04-03', // Good Friday
    '2026-04-04', // Black Saturday
    '2026-04-09', // Day of Valor
    '2026-06-12', // Independence Day
    '2026-08-21', // Ninoy Aquino Day
    '2026-11-01', // All Saints' Day
    '2026-11-30', // Bonifacio Day
    '2026-12-08', // Feast of Immaculate Conception
    '2026-12-25', // Christmas Day
    '2026-12-30', // Rizal Day
    '2026-12-31', // New Year's Eve
  ];

  // Function to check if today is a holiday
  const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    return holidays.includes(dateStr);
  };

  // Function to check if office is currently open
  const checkOfficeStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours + minutes / 60;

    // Office is closed on Sunday (0)
    if (day === 0) {
      setIsOfficeOpen(false);
      return;
    }

    // Office is closed on holidays
    if (isHoliday(now)) {
      setIsOfficeOpen(false);
      return;
    }

    // Check if within office hours: 8 AM - 5 PM (Monday to Friday), 8 AM - 4 PM (Saturday)
    if (day >= 1 && day <= 5) {
      // Monday to Friday: 8 AM - 5 PM
      const isOpenMonToFri = currentTime >= 8 && currentTime < 17;
      setIsOfficeOpen(isOpenMonToFri);
    } else if (day === 6) {
      // Saturday: 8 AM - 4 PM
      const isOpenSat = currentTime >= 8 && currentTime < 16;
      setIsOfficeOpen(isOpenSat);
    } else {
      // Sunday: Closed
      setIsOfficeOpen(false);
    }
  };

  useEffect(() => {
    checkOfficeStatus();
    // Update every second for real-time status
    const timer = setInterval(checkOfficeStatus, 1000);
    return () => clearInterval(timer);
  }, []);

  const banners = [
    {
      title: 'Back to School 2026',
      subtitle: 'Get Your Coop Essentials & Exclusive Discounts',
      date: 'June 15, 2026',
      time: '8:00 AM - 5:00 PM',
      cta: 'Shop Now',
      bg: 'from-green-600/40 to-purple-600/40',
    },
    {
      title: '11th General Assembly',
      subtitle: 'Be Part of Our Cooperative\'s Future',
      date: 'March 21, 2026',
      time: '1:00 PM - 5:00 PM',
      cta: 'Learn More',
      bg: 'from-blue-600/40 to-purple-700/40',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Back to School 2026',
      description: 'Start your semester right! Shop for school essentials, uniforms, and office supplies at discounted cooperative prices. Join our membership drive and get exclusive back-to-school benefits.',
      date: 'TBA',
      icon: ShoppingBag,
      color: 'border-l-green-500',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: '11TH GENERAL ASSEMBLY 2026',
      subtitle: 'Shaping Our Cooperative\'s Future Together',
      date: 'March 21, 2026',
      time: '1:00 PM - 5:00 PM',
      description: 'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative\'s strategic direction for the upcoming year.',
      image: true,
      editor: 'Photo by UC METC Communications Team',
    },
  ];

  const importantInfo = [
    {
      title: 'Office Hours',
      status: 'Open',
      details: [
        'Monday to Friday: 8 AM - 5 PM',
        'Saturday: 8 AM - 4 PM',
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
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            DASHBOARD
          </h1>
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

            {/* Recent Activities Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Recent Activities</h2>
              </div>
              {recentActivities.map((activity) => (
                <div key={activity.id} className="space-y-6">
                  {/* Activity Content Card */}
                  <div className="bg-gradient-to-br from-teal-500/60 to-teal-600/60 rounded-xl p-8 text-white">
                    <h3 className="text-3xl font-bold mb-2">{activity.title}</h3>
                    <p className="text-teal-100 text-lg mb-4">{activity.subtitle}</p>
                    
                    <p className="text-teal-50 leading-relaxed mb-6">
                      {activity.description}
                    </p>
                    
                    <a href="#" className="text-white font-semibold underline hover:no-underline transition-all">
                      See more
                    </a>
                    
                    <div className="mt-4 text-teal-100 text-sm">
                      Edited By | {activity.editor}
                    </div>
                  </div>
                  
                  {/* Activity Image Placeholder */}
                  {activity.image && (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-300 to-pink-300 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">📷</div>
                        <p className="text-slate-600">Event Gallery</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Important Info & Quick Actions */}
          <div className="space-y-6">
            {/* Important Info */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-lg">
              {/* Current Office Status Card */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Current Office Status</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isOfficeOpen 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {isOfficeOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {importantInfo[0].details.map((detail, idx) => (
                    <div key={idx}>
                      <p className="text-slate-600 text-sm">{detail}</p>
                    </div>
                  ))}
                  
                  <div className="flex items-start space-x-3 pt-2 border-t border-slate-200">
                    <MapPin size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-600 text-sm">Next to Clinic</p>
                      <p className="text-slate-600 text-sm">UC Coop Office</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Card */}
            {user?.membership_status === 'approved' ? (
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">✓</div>
                  <h3 className="text-xl font-bold mb-3">Welcome Member!</h3>
                  <p className="text-green-50 text-sm">
                    You are now a part of the UC Coop. Enjoy your exclusive benefits and discounts!
                  </p>
                </div>
              </div>
            ) : membershipRequested ? (
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">✓</div>
                  <h3 className="text-xl font-bold mb-3">Membership Request Pending</h3>
                  <p className="text-green-50 text-sm">
                    Your membership request has been successfully submitted. If needed, you can cancel this transaction at the Coop Office.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <Users size={32} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-lg font-bold mb-2">Become Part of the UC Coop</h3>
                  <p className="text-green-50 text-sm mb-6">Get exclusive member benefits and special discounts on our products.</p>
                  <button 
                    onClick={() => setShowMembershipModal(true)}
                    className="w-full bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 flex items-center justify-center space-x-2">
            
                    <span>Join Now!</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Links - Only for approved members */}
            {user?.membership_status === 'approved' && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/locker')}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 hover:from-purple-500/20 hover:to-green-500/20 transition-all duration-300 text-slate-900 font-medium flex items-center justify-between group">
                  <span>My Locker</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/billing-history')}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 hover:from-purple-500/20 hover:to-green-500/20 transition-all duration-300 text-slate-900 font-medium flex items-center justify-between group">
                  <span>Billing History</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Confirmation Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Membership</h2>
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to request membership? Once approved, you'll gain access to exclusive member benefits and discounts.
            </p>

            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-3">Membership Benefits:</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Discounted prices on specific merchandise and products</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Exclusive member benefits and priority access</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Special events and exclusive activities for members</span>
                </li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMembershipModal(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200"
              >
                No
              </button>
              <button
                onClick={async () => {
                  try {
                    // Create membership request via API
                    await apiClient.createMembershipRequest({
                      user_id: user?.id,
                      name: user ? `${user.first_name} ${user.last_name}` : 'Student',
                      email: user?.email || '',
                      phone: '',
                    });
                    
                    setShowMembershipModal(false);
                    setMembershipRequested(true);
                    showNotification('Membership request submitted successfully!', 'success');
                  } catch (error: any) {
                    console.error('Failed to submit membership request:', error);
                    showNotification(`Failed to submit membership request: ${error?.message || 'Unknown error'}`, 'error');
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
