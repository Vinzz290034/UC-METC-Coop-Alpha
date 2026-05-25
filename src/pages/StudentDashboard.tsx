import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Users,
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Z_INDEX } from '../constants/zIndex';
import { NotificationBell } from '../components/NotificationBell';
import { GlobalSearch } from '../components/GlobalSearch';
import { WelcomeTour } from '../components/WelcomeTour';
import { InsuranceModal } from '../components/InsuranceModal';
import { GALLERY_IMAGE_URLS } from '../constants/cloudinaryGallery';
import { UC_METC_LOGO_URL, STUDENT_DASHBOARD_BANNER_IMAGE } from '../constants/cloudinaryAssets';

export const StudentDashboard: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification, setSidebarOpen } = useUIStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOfficeOpen, setIsOfficeOpen] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipRequested, setMembershipRequested] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [hasPendingInsurance, setHasPendingInsurance] = useState(false);
  const [hasCompletedInsurance, setHasCompletedInsurance] = useState(false);

  // Check if user has seen the welcome tour
  useEffect(() => {
    if (user?.id) {
      const tourKey = `welcome_tour_completed_${user.id}`;
      const hasSeenTour = localStorage.getItem(tourKey);
      
      if (!hasSeenTour) {
        // Show tour after a short delay for better UX
        const timer = setTimeout(() => {
          setShowWelcomeTour(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id]);

  // Handle tour completion
  const handleTourComplete = () => {
    if (user?.id) {
      const tourKey = `welcome_tour_completed_${user.id}`;
      localStorage.setItem(tourKey, 'true');
      setShowWelcomeTour(false);
    }
  };

  // Check if user has a pending insurance order
  useEffect(() => {
    const checkPendingInsurance = async () => {
      if (user?.id) {
        try {
          const orders = await apiClient.getOrders(user.id) as any[];
          const hasPending = orders.some((order: any) => 
            order.order_type === 'insurance' && 
            order.status === 'pending'
          );
          const hasCompleted = orders.some((order: any) => 
            order.order_type === 'insurance' && 
            order.status === 'completed'
          );
          setHasPendingInsurance(hasPending);
          setHasCompletedInsurance(hasCompleted);
        } catch (error) {
          console.error('Failed to check insurance orders:', error);
        }
      }
    };

    checkPendingInsurance();
    
    const handleInsuranceRegistered = () => {
      checkPendingInsurance();
    };
    window.addEventListener('insurance-registered', handleInsuranceRegistered);
    
    // Poll every 30 seconds
    const interval = setInterval(checkPendingInsurance, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('insurance-registered', handleInsuranceRegistered);
    };
  }, [user?.id]);

  // Refresh user data on mount to get latest membership status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Check if user has a pending membership request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (user?.id && user.membership_status !== 'approved') {
        try {
          console.log('[STUDENT DASHBOARD] Checking membership status for user:', user.id, 'Current status:', user.membership_status);
          const response = await apiClient.checkMyMembershipStatus() as any;
          console.log('[STUDENT DASHBOARD] Membership check response:', response);
          if (response.hasPendingRequest) {
            console.log('[STUDENT DASHBOARD] Setting membershipRequested to true');
            setMembershipRequested(true);
          } else {
            console.log('[STUDENT DASHBOARD] No pending request found');
            setMembershipRequested(false);
          }
        } catch (error) {
          console.error('Failed to check membership status:', error);
        }
      } else {
        console.log('[STUDENT DASHBOARD] Skipping membership check - user:', user?.id, 'status:', user?.membership_status);
      }
    };
    
    // Add a small delay to ensure refreshUser completes first
    const timer = setTimeout(checkPendingRequest, 100);
    return () => clearTimeout(timer);
  }, [user?.id, user?.membership_status]);

  // Fetch announcements on mount with caching
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Check if we have cached announcements (less than 5 minutes old)
        const cachedData = sessionStorage.getItem('announcements');
        const cachedTime = sessionStorage.getItem('announcements_time');
        
        if (cachedData && cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age < 5 * 60 * 1000) { // 5 minutes
            setAnnouncements(JSON.parse(cachedData));
            return;
          }
        }
        
        // Fetch fresh data
        const data = await apiClient.getPublicAnnouncements() as any[];
        setAnnouncements(data);
        
        // Cache the data
        sessionStorage.setItem('announcements', JSON.stringify(data));
        sessionStorage.setItem('announcements_time', Date.now().toString());
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    };
    fetchAnnouncements();
  }, []);

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
    // Update every minute
    const timer = setInterval(() => {
      checkOfficeStatus();
    }, 60000);
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
      image: STUDENT_DASHBOARD_BANNER_IMAGE,
      overlayColor: 'from-purple-900/90 via-purple-800/50 to-transparent',
      action: () => navigate('/merchandise'),
    },
    {
      title: '11th General Assembly',
      subtitle: 'Be Part of Our Cooperative\'s Future',
      date: 'March 21, 2026',
      time: '1:00 PM - 5:00 PM',
      cta: 'Learn More',
      bg: 'from-blue-600/40 to-purple-700/40',
      image: GALLERY_IMAGE_URLS[5],
      overlayColor: 'from-green-900/90 via-green-800/50 to-transparent',
      action: () => {
        const activitiesSection = document.getElementById('recent-activities');
        if (activitiesSection) {
          activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: '11TH GENERAL ASSEMBLY 2026',
      subtitle: 'Shaping Our Cooperative\'s Future Together',
      date: 'March 21, 2026',
      time: '1:00 PM - 5:00 PM',
      shortDescription: 'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative\'s strategic direction for the upcoming year.',
      fullDescription: (
        <>
          <p className="mb-4">
            The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative\'s strategic direction for the upcoming year.
          </p>
          <p>
            Key highlights included the approval of new sustainability initiatives, the introduction of enhanced member benefits, and the unanimous election of the new board of directors. The assembly also featured presentations on financial performance, showcasing the cooperative\'s growth and stability. Members actively participated in workshops focused on cooperative principles, community engagement, and future development plans. The event concluded with a commitment to transparency, member empowerment, and continued excellence in serving the UC METC community.
          </p>
        </>
      ),
      image: true,
      editor: 'Vince Andrew Santoya',
      galleryImages: GALLERY_IMAGE_URLS,
    },
  ];

  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  // Auto-play gallery carousel
  useEffect(() => {
    const galleryTimer = setInterval(() => {
      setCurrentGalleryIndex((prev) => {
        const activity = recentActivities[0];
        if (activity.galleryImages) {
          return prev === activity.galleryImages.length - 1 ? 0 : prev + 1;
        }
        return prev;
      });
    }, 5000);
    
    return () => clearInterval(galleryTimer);
  }, []);

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
  }, [banners.length]);

  return (
    <div className="min-h-screen animate-slide-in-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          {/* Desktop Header - Hidden on Mobile (lg and up) */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                DASHBOARD
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* I-CARD Insurance Button */}
              <button
                onClick={() => !hasPendingInsurance && !hasCompletedInsurance && setShowInsuranceModal(true)}
                disabled={hasPendingInsurance || hasCompletedInsurance}
                className={`px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg text-sm whitespace-nowrap ring-2 ring-purple-400 ring-opacity-50 ${
                  hasPendingInsurance || hasCompletedInsurance
                    ? 'cursor-not-allowed opacity-90' 
                    : 'hover:from-purple-700 hover:to-purple-600 hover:shadow-2xl hover:scale-105 active:scale-95 animate-pulse-slow'
                }`}
                title={
                  hasCompletedInsurance 
                    ? "Insurance already purchased" 
                    : hasPendingInsurance 
                      ? "Insurance order pending" 
                      : "I-CARD Micro-insurance"
                }
              >
                {hasCompletedInsurance 
                  ? '✓ Insured' 
                  : hasPendingInsurance 
                    ? 'Pending Order' 
                    : 'I-CARD Insurance is now Available!'}
              </button>
              {/* Global Search */}
              <GlobalSearch />
              {/* Notification Bell */}
              <NotificationBell />
            </div>
          </div>

          {/* Mobile Header - Shown Only on Mobile (below lg) */}
          <div className="lg:hidden">
            {/* Top Bar - Hamburger and Dashboard */}
            <div className="flex items-center gap-2 mb-4">
              {/* Purple Hamburger Menu */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-slate-800">DASHBOARD</h1>
            </div>
            {/* Mobile Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => !hasPendingInsurance && !hasCompletedInsurance && setShowInsuranceModal(true)}
                disabled={hasPendingInsurance || hasCompletedInsurance}
                className={`px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold text-xs ${
                  hasPendingInsurance || hasCompletedInsurance ? 'opacity-90' : 'hover:from-purple-700 hover:to-purple-600'
                }`}
              >
                {hasCompletedInsurance ? '✓ Insured' : hasPendingInsurance ? 'Pending' : 'I-CARD'}
              </button>
              <GlobalSearch />
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Featured Banner & Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured Banner Carousel */}
            <div className="relative rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border border-purple-600/30 shadow-xl group">
              {/* Banner Slides */}
              <div className="relative w-full h-full">
                {banners.map((banner, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
                      idx === currentImageIndex
                        ? 'translate-x-0'
                        : idx < currentImageIndex
                        ? '-translate-x-full'
                        : 'translate-x-full'
                    }`}
                  >
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${banner.image})` }}
                    />
                    
                    {/* Dynamic Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.overlayColor}`} />
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-center px-8 text-white">
                      <div className="mb-4 inline-flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-purple-900 px-4 py-2 rounded-full w-fit font-semibold text-sm shadow-lg">
                        <span>Featured Event</span>
                      </div>
                      <h2 className="text-3xl font-bold mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)' }}>
                        {banner.title}
                      </h2>
                      <p className="text-white text-lg mb-4" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.6)' }}>
                        {banner.subtitle}
                      </p>
                      <div className="flex items-center space-x-6 text-sm text-white mb-6" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{banner.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} />
                          <span>{banner.time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={banner.action}
                        className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 w-fit group/btn shadow-lg"
                      >
                        <span>{banner.cta}</span>
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
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

            {/* Announcements Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-lg">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
                Announcements
              </h2>
              <div className="space-y-4">
                {announcements.slice(0, 3).map((announcement) => {
                  // Category color mapping
                  const categoryColors: { [key: string]: string } = {
                    'Maintenance': 'border-l-orange-500 bg-orange-50/40',
                    'Services': 'border-l-blue-500 bg-blue-50/40',
                    'Inventory': 'border-l-green-500 bg-green-50/40',
                    'Registration': 'border-l-purple-500 bg-purple-50/40',
                  };
                  const borderColor = categoryColors[announcement.category] || 'border-l-slate-500 bg-slate-50/40';
                  
                  return (
                    <div
                      key={announcement.id}
                      className={`border-l-4 ${borderColor} rounded-lg p-5 hover:shadow-md transition-all duration-300 group cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-full">
                              {announcement.category}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(announcement.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                            {announcement.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{announcement.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          by {announcement.author_role && (
                            <span className="capitalize font-semibold">{announcement.author_role} - </span>
                          )}
                          {announcement.author_name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activities Section */}
            <div id="recent-activities" className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 bg-clip-text text-transparent mb-2">
                  Recent Activities
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-violet-500 mx-auto rounded-full"></div>
              </div>
              {recentActivities.map((activity) => {
                const [showFullText, setShowFullText] = useState(false);
                
                return (
                  <div key={activity.id} className="space-y-3">
                    {/* Activity Content Card */}
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white overflow-hidden">
                      {/* Decorative Circle Elements */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"></div>
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-white/10 rounded-full"></div>
                      <div className="absolute bottom-10 -left-5 w-24 h-24 bg-white/10 rounded-full"></div>
                      <div className="absolute top-1/2 right-10 w-20 h-20 bg-white/5 rounded-full"></div>
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-transparent to-green-700/30"></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <h3 className="text-3xl font-bold mb-2">{activity.title}</h3>
                        <p className="text-green-100 text-lg mb-4">{activity.subtitle}</p>
                        
                        <div className="text-white leading-relaxed mb-6 text-justify">
                          {showFullText ? activity.fullDescription : activity.shortDescription}
                        </div>
                        
                        <button 
                          onClick={() => setShowFullText(!showFullText)}
                          className="text-white font-semibold underline hover:no-underline transition-all"
                        >
                          {showFullText ? 'See less' : 'See more'}
                        </button>
                        
                        <div className="mt-4 text-green-100 text-sm space-y-1">
                          <div>Photo By | Vince Andrew Santoya</div>
                          <div>Photo By | Kisses Peñera</div>
                          <div>Edited By | Vince Andrew Santoya</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Gallery Carousel */}
                    {activity.galleryImages && activity.galleryImages.length > 0 && (
                      <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-100 to-green-100">
                        {/* Main Image */}
                        <div className="relative h-[500px] bg-white">
                          {activity.galleryImages.map((img, idx) => (
                            <img 
                              key={idx}
                              src={img} 
                              alt={`Gallery ${idx + 1}`}
                              loading="lazy"
                              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                                idx === currentGalleryIndex ? 'opacity-100' : 'opacity-0'
                              }`}
                              style={{ 
                                display: Math.abs(idx - currentGalleryIndex) > 2 ? 'none' : 'block'
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Dot Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          {activity.galleryImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentGalleryIndex(idx)}
                              className={`transition-all duration-300 rounded-full ${
                                idx === currentGalleryIndex
                                  ? 'bg-green-500 w-6 h-2.5'
                                  : 'bg-white/50 hover:bg-white/75 w-2.5 h-2.5'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                    className="w-full bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 flex items-center justify-center space-x-2 animate-bounce-in hover:scale-105 hover:shadow-lg active:scale-95">
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

      {/* Membership Confirmation Modal - Portal to body for true fixed positioning */}
      {showMembershipModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: Z_INDEX.MEMBERSHIP_MODAL }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in relative max-h-[90vh] overflow-y-auto"
          >
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Membership</h2>
              
              <p className="text-slate-600 mb-6 text-justify">
                Are you sure you want to request membership? Please note that you need to pay <span className="font-bold text-slate-900">₱200</span> at the <span className="font-bold text-slate-900">UC Coop Office</span> for lifetime membership. Once approved, you'll gain access to exclusive member benefits and discounts.
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
                      showNotification('Membership request submitted! Please pay ₱200 at UC Coop Office.', 'success');
                    } catch (error: any) {
                      console.error('Failed to submit membership request:', error);
                      
                      // Handle specific error cases
                      if (error?.hasPendingRequest) {
                        setMembershipRequested(true);
                        setShowMembershipModal(false);
                        showNotification('You already have a pending membership request.', 'success');
                      } else if (error?.isAlreadyMember) {
                        setShowMembershipModal(false);
                        showNotification('You are already a member!', 'success');
                        refreshUser(); // Refresh to update UI
                      } else {
                        showNotification(error?.message || 'Failed to submit membership request', 'error');
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>,
          document.body
      )}

      {/* Welcome Tour for New Users */}
      {showWelcomeTour && user && (
        <WelcomeTour 
          userName={user.first_name || 'Student'} 
          onComplete={handleTourComplete}
        />
      )}

      {/* Insurance Modal */}
      {showInsuranceModal && (
        <InsuranceModal onClose={() => setShowInsuranceModal(false)} />
      )}
    </div>
  );
};
