import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Users,
  X,
  Shield,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { GALLERY_IMAGE_URLS, COMMUNITY_GA_GALLERY_URLS, RINGHOP_GALLERY_URLS } from '../constants/cloudinaryGallery';
import { STUDENT_DASHBOARD_BANNER_IMAGE } from '../constants/cloudinaryAssets';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImagesList, setPreviewImagesList] = useState<readonly string[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);

  const openImagePreview = (images: readonly string[] | string[], index: number) => {
    setPreviewImagesList(images);
    setPreviewImageIndex(index);
    setPreviewImage(images[index]);
  };
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  // Smart adjacent preloading for Lightbox (preloads next & prev image only to keep RAM minimal)
  useEffect(() => {
    if (previewImage && previewImagesList.length > 0) {
      const nextIdx = (previewImageIndex + 1) % previewImagesList.length;
      const prevIdx = (previewImageIndex - 1 + previewImagesList.length) % previewImagesList.length;
      const imgNext = new Image();
      imgNext.src = previewImagesList[nextIdx];
      const imgPrev = new Image();
      imgPrev.src = previewImagesList[prevIdx];
    }
  }, [previewImage, previewImageIndex, previewImagesList]);

  // Check if user has seen the welcome tour
  useEffect(() => {
    if (user?.id && typeof user.tour_completed === 'boolean') {
      const tourKey = `welcome_tour_completed_${user.id}`;
      const hasSeenTour = localStorage.getItem(tourKey) === 'true' || user.tour_completed;
      
      if (!hasSeenTour) {
        const timer = setTimeout(() => {
          setShowWelcomeTour(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setShowWelcomeTour(false);
        if (localStorage.getItem(tourKey) !== 'true') {
          localStorage.setItem(tourKey, 'true');
        }
        if (!user.tour_completed) {
          apiClient.updateUser(user.id, { tour_completed: true }).catch(err => {
            console.error('Failed to sync tour completion with database:', err);
          });
        }
      }
    }
  }, [user?.id, user?.tour_completed]);

  // Handle tour completion
  const handleTourComplete = async () => {
    if (user?.id) {
      const tourKey = `welcome_tour_completed_${user.id}`;
      localStorage.setItem(tourKey, 'true');
      setShowWelcomeTour(false);
      try {
        await apiClient.updateUser(user.id, { tour_completed: true });
        refreshUser();
      } catch (error) {
        console.error('Failed to save tour completion to database:', error);
      }
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
      setHasPendingInsurance(true);
      checkPendingInsurance();
    };

    const handleInsuranceFailed = () => {
      setHasPendingInsurance(false);
    };

    window.addEventListener('insurance-registered', handleInsuranceRegistered);
    window.addEventListener('insurance-registration-failed', handleInsuranceFailed);
    
    const interval = setInterval(checkPendingInsurance, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('insurance-registered', handleInsuranceRegistered);
      window.removeEventListener('insurance-registration-failed', handleInsuranceFailed);
    };
  }, [user?.id]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const checkPendingRequest = async () => {
      if (user?.id && user.membership_status !== 'approved') {
        try {
          const response = await apiClient.checkMyMembershipStatus() as any;
          if (response.hasPendingRequest) {
            setMembershipRequested(true);
          } else {
            setMembershipRequested(false);
          }
        } catch (error) {
          console.error('Failed to check membership status:', error);
        }
      }
    };
    
    const timer = setTimeout(checkPendingRequest, 100);
    return () => clearTimeout(timer);
  }, [user?.id, user?.membership_status]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await apiClient.getPublicAnnouncements() as any[];
        if (data && data.length > 0) {
          setAnnouncements(data);
          sessionStorage.setItem('announcements', JSON.stringify(data));
          sessionStorage.setItem('announcements_time', Date.now().toString());
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    };
    fetchAnnouncements();
  }, []);

  const holidays = [
    '2026-01-01', '2026-02-10', '2026-02-25', '2026-04-02', '2026-04-03',
    '2026-04-04', '2026-04-09', '2026-06-12', '2026-08-21', '2026-11-01',
    '2026-11-30', '2026-12-08', '2026-12-25', '2026-12-30', '2026-12-31',
  ];

  const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  };

  const checkOfficeStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours + minutes / 60;

    if (day === 0 || isHoliday(now)) {
      setIsOfficeOpen(false);
      return;
    }

    if (day >= 1 && day <= 5) {
      setIsOfficeOpen(currentTime >= 8 && currentTime < 17);
    } else if (day === 6) {
      setIsOfficeOpen(currentTime >= 8 && currentTime < 16);
    } else {
      setIsOfficeOpen(false);
    }
  };

  useEffect(() => {
    checkOfficeStatus();
    const timer = setInterval(checkOfficeStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  const recentActivities = [
    {
      id: 'act-default-1',
      title: '11TH GENERAL ASSEMBLY 2026',
      subtitle: 'Shaping Our Cooperative\'s Future Together',
      date: 'March 21, 2026',
      time: '1:00 PM - 5:00 PM',
      shortDescription: 'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare.',
      fullDescription: (
        <>
          <p className="mb-4 text-justify">
            The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative's strategic direction for the upcoming year.
          </p>
          <p className="mb-4 text-justify">
            Key highlights included the approval of new sustainability initiatives, the introduction of enhanced member benefits, and the unanimous election of the new board of directors. The assembly also featured presentations on financial performance, showcasing the cooperative's growth and stability. Members actively participated in workshops focused on cooperative principles, community engagement, and future development plans. The event concluded with a commitment to transparency, member empowerment, and continued excellence in serving the UC METC community.
          </p>
        </>
      ),
      image: true,
      photographers: ['Vince Andrew Santoya', 'Kisses Peñera'],
      editor: 'Vince Andrew Santoya',
      galleryImages: COMMUNITY_GA_GALLERY_URLS,
    },
    {
      id: 'act-default-2',
      title: 'RINGHOP CEREMONY 2026',
      subtitle: 'Honoring Academic Dedication and Professional Excellence',
      date: 'June 30, 2026',
      time: '3:00 PM - 6:00 PM',
      shortDescription: 'Celebrating the achievements and academic milestone of our maritime students as they receive their official rings.',
      fullDescription: (
        <>
          <p className="mb-4 text-justify">
            The Ringhop Ceremony 2026 marks a memorable milestone for maritime students at UC METC. Graduating cadets and members gather to receive their official rings in a grand celebration honoring academic perseverance, discipline, and professional excellence.
          </p>
        </>
      ),
      image: true,
      photographers: ['Xela Elaine Murro', 'Vince Andrew Santoya'],
      editor: 'Vince Andrew Santoya',
      galleryImages: RINGHOP_GALLERY_URLS,
    },
  ];

  const [recentActivitiesList, setRecentActivitiesList] = useState<any[]>(recentActivities);
  const [expandedActivityIds, setExpandedActivityIds] = useState<Record<string, boolean>>({});

  const ringhopActivity = recentActivitiesList.find((a: any) => a.title?.toLowerCase().includes('ringhop'));
  const ringhopImage = ringhopActivity?.galleryImages?.[0] || RINGHOP_GALLERY_URLS[0];

  const banners = [
    {
      title: ringhopActivity?.title || 'Ringhop Ceremony 2026',
      subtitle: ringhopActivity?.subtitle || 'Honoring Academic Dedication and Professional Excellence',
      date: ringhopActivity?.date || 'June 30, 2026',
      time: ringhopActivity?.time || '3:00 PM - 6:00 PM',
      cta: 'Learn More',
      image: ringhopImage,
      action: () => {
        const activitiesSection = document.getElementById(window.innerWidth < 768 ? 'recent-activities-mobile' : 'recent-activities');
        if (activitiesSection) {
          activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      overlay: 'bg-gradient-to-r from-blue-950/90 via-blue-900/55 to-transparent',
      border: 'border-blue-500/50',
      badgeBg: 'bg-[#2563eb]',
      btnBg: 'bg-[#2563eb] hover:bg-[#1d4ed8]',
    },
    {
      title: 'Back to School 2026',
      subtitle: 'Get Your Coop Essentials & Exclusive Discounts',
      date: 'August 3, 2026',
      time: '',
      cta: 'Shop Now',
      image: STUDENT_DASHBOARD_BANNER_IMAGE,
      action: () => navigate('/merchandise'),
      overlay: 'bg-gradient-to-r from-purple-950/80 via-purple-900/40 to-transparent',
      border: 'border-purple-500/50',
      badgeBg: 'bg-purple-600',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: '11TH GENERAL ASSEMBLY 2026',
      subtitle: 'Shaping Our Cooperative\'s Future Together',
      date: 'March 21, 2026',
      time: '1:00 PM - 5:00 PM',
      cta: 'Learn More',
      image: GALLERY_IMAGE_URLS[5],
      action: () => {
        const activitiesSection = document.getElementById(window.innerWidth < 768 ? 'recent-activities-mobile' : 'recent-activities');
        if (activitiesSection) {
          activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      overlay: 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-transparent',
      border: 'border-emerald-500/50',
      badgeBg: 'bg-[#16a34a]',
      btnBg: 'bg-[#16a34a] hover:bg-[#15803d]',
    },
  ];

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const data = await apiClient.getPublicActivities();
        if (data && Array.isArray(data) && data.length > 0) {
          const transformed = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle || '',
            date: item.date || '',
            time: item.time || '',
            shortDescription: item.short_description || item.shortDescription || '',
            fullDescription: item.full_description || item.fullDescription || item.short_description || '',
            photographers: Array.isArray(item.photographers) ? item.photographers : (typeof item.photographers === 'string' ? JSON.parse(item.photographers || '[]') : []),
            editor: item.editor || '',
            colorTheme: item.color_theme || item.colorTheme || 'emerald',
            galleryImages: (() => {
              const raw = Array.isArray(item.gallery_images) ? item.gallery_images : (typeof item.gallery_images === 'string' ? JSON.parse(item.gallery_images || '[]') : []);
              const clean = raw.filter((url: string) => url && typeof url === 'string' && !url.includes('dph4hxexg') && !url.includes('doas4qcdo'));
              if (clean.length > 0) return clean;
              return item.title?.toLowerCase().includes('ringhop') ? RINGHOP_GALLERY_URLS : GALLERY_IMAGE_URLS;
            })(),
          }));
          setRecentActivitiesList(transformed);
        }
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
      }
    };
    fetchRecentActivities();
  }, []);

  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  useEffect(() => {
    const galleryTimer = setInterval(() => {
      setCurrentGalleryIndex((prev) => {
        const activity = recentActivitiesList[0] || recentActivities[0];
        if (activity && activity.galleryImages) {
          return prev === activity.galleryImages.length - 1 ? 0 : prev + 1;
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(galleryTimer);
  }, [recentActivitiesList]);

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

  const renderFeaturedCarousel = (isMobile: boolean) => {
    const currentBanner = banners[currentImageIndex] || banners[0];
    return (
      <div className={`relative rounded-2xl overflow-hidden ${isMobile ? 'h-56' : 'h-64'} bg-slate-900 border-2 ${currentBanner.border || 'border-purple-500/50'} shadow-lg group transition-colors duration-500`}>
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
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner.image})` }}
              />
              <div className={`absolute inset-0 ${banner.overlay || 'bg-gradient-to-r from-purple-950/80 via-purple-900/40 to-transparent'}`} />
              
              <div className={`relative z-10 h-full flex flex-col justify-center ${isMobile ? 'px-6' : 'px-8'} text-white`}>                <div className={`mb-3 inline-flex items-center space-x-2 ${banner.badgeBg || 'bg-[#16a34a]'} text-white ${isMobile ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'} rounded-full w-fit font-bold shadow-sm`}>
                  <span>Featured Event</span>
                </div>
                <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold mb-1 text-white`}>
                  {banner.title}
                </h2>
                <p className={`${isMobile ? 'text-xs' : 'text-base'} text-slate-200 mb-3 font-medium`}>
                  {banner.subtitle}
                </p>
                <div className={`flex items-center space-x-4 ${isMobile ? 'text-xs mb-3' : 'text-xs mb-5'} text-slate-300`}>
                  <div className="flex items-center space-x-1.5">
                    <Calendar size={14} />
                    <span>{banner.date}</span>
                  </div>
                  {banner.time && (
                    <div className="flex items-center space-x-1.5">
                      <Clock size={14} />
                      <span>{banner.time}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={banner.action}
                  className={`inline-flex items-center justify-center space-x-2 ${banner.btnBg || 'bg-[#16a34a] hover:bg-[#15803d]'} text-white ${isMobile ? 'px-4 py-2 text-xs' : 'px-6 py-2.5 text-sm'} rounded-xl font-bold transition-all duration-200 w-fit cursor-pointer shadow-sm active:scale-95`}
                >
                  <span>{banner.cta}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-20 flex space-x-1.5 items-center">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              style={{
                width: idx === currentImageIndex ? 20 : 6,
                height: 6,
                minWidth: 0,
                minHeight: 0,
                padding: 0,
              }}
              className={`rounded-full transition-all duration-300 border-0 shrink-0 cursor-pointer ${
                idx === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
              }`}
              title={`View banner ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderMembershipCard = (isMobile: boolean) => {
    const paddingClass = isMobile ? "p-5" : "p-6";
    const titleClass = isMobile ? "text-base" : "text-lg";
    const bodyClass = isMobile ? "text-xs" : "text-sm";
    
    if (user?.membership_status === 'approved') {
      return (
        <div className={`relative bg-[#16a34a] rounded-2xl ${paddingClass} text-white shadow-md overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="text-2xl mb-2">✓</div>
            <h3 className={`${titleClass} font-bold mb-1.5`}>Welcome Member!</h3>
            <p className={`text-emerald-50 ${bodyClass} leading-relaxed`}>
              You are now a part of the UC Coop. Enjoy your exclusive benefits and discounts!
            </p>
          </div>
        </div>
      );
    }
    
    if (membershipRequested) {
      return (
        <div className={`relative bg-[#16a34a] rounded-2xl ${paddingClass} text-white shadow-md overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="text-2xl mb-2">✓</div>
            <h3 className={`${titleClass} font-bold mb-1.5`}>Membership Request Pending</h3>
            <p className={`text-emerald-50 ${bodyClass} leading-relaxed`}>
              Your membership request has been successfully submitted. Please pay ₱200 at the Coop Office.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`relative bg-[#16a34a] rounded-2xl ${paddingClass} text-white shadow-md overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10">
          <Users size={28} className="mb-2" />
          <h3 className={`${titleClass} font-bold mb-1.5`}>Become Part of the UC Coop</h3>
          <p className={`text-emerald-50 ${bodyClass} mb-4 leading-relaxed`}>Get exclusive member benefits and special discounts on our products.</p>
          <button 
            onClick={() => setShowMembershipModal(true)}
            className="w-full bg-white text-[#16a34a] py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-all text-sm shadow-sm cursor-pointer active:scale-95">
            <span>Join Now!</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5]">
      {/* Rich Purple-Emerald Background Color Glow Effects & Dot Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] bg-[#7c3aed]/22 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[38rem] h-[38rem] bg-[#16a34a]/22 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[36rem] h-[36rem] bg-purple-600/18 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.35]" 
          style={{ 
            backgroundImage: `radial-gradient(rgba(124, 58, 237, 0.22) 1.2px, transparent 1.2px)`,
            backgroundSize: '28px 28px'
          }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                DASHBOARD
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => !hasPendingInsurance && !hasCompletedInsurance && setShowInsuranceModal(true)}
                disabled={hasPendingInsurance || hasCompletedInsurance}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold transition-all text-xs text-white whitespace-nowrap shrink-0 border border-purple-300/40 shadow-md shadow-purple-500/30 ${
                  hasCompletedInsurance || hasPendingInsurance
                    ? 'bg-[#9333ea] cursor-default'
                    : 'bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#7c3aed] hover:from-[#6d28d9] hover:to-[#8b5cf6] active:scale-95 cursor-pointer ring-2 ring-purple-400/40'
                }`}
              >
                {hasCompletedInsurance ? (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                    <span>Insured</span>
                  </>
                ) : hasPendingInsurance ? (
                  <>
                    <Clock size={15} className="text-amber-300 shrink-0" />
                    <span>Pending Order</span>
                  </>
                ) : (
                  <>
                    <Shield size={15} className="text-emerald-300 shrink-0" />
                    <span>I-CARD Insurance Available!</span>
                    <Sparkles size={13} className="text-amber-300 shrink-0" />
                  </>
                )}
              </button>
              <GlobalSearch />
              <NotificationBell />
            </div>
          </div>

          {/* Mobile Header & Layout */}
          <div className="lg:hidden space-y-4 slide-up-1">
            {/* 1. Mobile Header Row */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">DASHBOARD</h1>
            </div>

            {/* 2. Search & Notification Bell Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <GlobalSearch />
              </div>
              <NotificationBell />
            </div>

            {/* 3. Full-Width Insurance Button */}
            <button
              onClick={() => !hasPendingInsurance && !hasCompletedInsurance && setShowInsuranceModal(true)}
              disabled={hasPendingInsurance || hasCompletedInsurance}
              className={`w-full py-2.5 px-4 rounded-2xl font-extrabold transition-all text-xs text-white shadow-md shadow-purple-500/25 flex items-center justify-center gap-1.5 ${
                hasCompletedInsurance || hasPendingInsurance
                  ? 'bg-[#9333ea] cursor-default'
                  : 'bg-[#9333ea] hover:bg-[#7e22ce] active:scale-95 cursor-pointer'
              }`}
            >
              {hasCompletedInsurance ? (
                <>
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                  <span>✓ Insured</span>
                </>
              ) : hasPendingInsurance ? (
                <>
                  <Clock size={15} className="text-amber-300 shrink-0" />
                  <span>✓ Pending Order</span>
                </>
              ) : (
                <>
                  <Shield size={15} className="text-emerald-300 shrink-0" />
                  <span>I-CARD Insurance is now Available!</span>
                </>
              )}
            </button>

            {/* 4. Current Office Status Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Current Office Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                isOfficeOpen ? 'bg-[#16a34a]' : 'bg-slate-400'
              }`}>
                {isOfficeOpen ? 'Open' : 'Closed'}
              </span>
            </div>

            {/* 5. Featured Carousel */}
            <div>
              {renderFeaturedCarousel(true)}
            </div>

            {/* 6. Membership Card */}
            <div>
              {renderMembershipCard(true)}
            </div>

            {/* 7. Side-by-Side Quick Links */}
            {user?.membership_status === 'approved' && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/locker')}
                  className="w-full text-left px-3.5 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100/80 shadow-xs hover:border-purple-200 transition-all text-slate-900 font-bold text-xs flex items-center justify-between cursor-pointer group"
                >
                  <span className="truncate">My Locker</span>
                  <ArrowRight size={14} className="text-[#7c3aed] shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/billing-history')}
                  className="w-full text-left px-3.5 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100/80 shadow-xs hover:border-purple-200 transition-all text-slate-900 font-bold text-xs flex items-center justify-between cursor-pointer group"
                >
                  <span className="truncate">Billing History</span>
                  <ArrowRight size={14} className="text-[#7c3aed] shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* 8. Announcements Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-[#7c3aed]">
                  Announcements
                </h2>
              </div>
              
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => {
                  const categoryBorderMap: { [key: string]: string } = {
                    'Maintenance': 'border-l-[#ea580c]',
                    'Services': 'border-l-[#2563eb]',
                    'Inventory': 'border-l-[#16a34a]',
                    'Registration': 'border-l-[#7c3aed]',
                  };
                  const borderClass = categoryBorderMap[announcement.category] || 'border-l-slate-400';
                  
                  return (
                    <div
                      key={announcement.id}
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className={`border-l-4 ${borderClass} bg-slate-50/80 hover:bg-purple-50/60 rounded-xl p-3.5 border border-purple-100/80 transition-all cursor-pointer group`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-[#7c3aed] bg-purple-100 rounded-full">
                          {announcement.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#7c3aed] transition-colors mb-1">
                        {announcement.title}
                      </h3>
                      {(announcement.image_url || announcement.image) && (
                        <div className="my-2.5 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center max-h-36 max-w-xs sm:max-w-sm">
                          <img 
                            src={announcement.image_url || announcement.image} 
                            alt={announcement.title} 
                            className="max-h-36 w-auto max-w-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {announcement.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 9. Recent Activities Section */}
            <div id="recent-activities-mobile" className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)] space-y-4">
              <div className="border-b border-purple-100/80 pb-3 mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Recent Activities
                </h2>
              </div>
              {recentActivitiesList.map((activity: any) => {
                const isExpanded = expandedActivityIds[activity.id] || false;
                const toggleExpanded = () => {
                  setExpandedActivityIds(prev => ({ ...prev, [activity.id]: !prev[activity.id] }));
                };

                const themeMap: Record<string, string> = {
                  emerald: 'bg-[#16a34a]',
                  purple: 'bg-[#7c3aed]',
                  blue: 'bg-[#2563eb]',
                  amber: 'bg-[#d97706]',
                  rose: 'bg-[#e11d48]',
                  slate: 'bg-[#1e293b]',
                };
                const themeBg = themeMap[activity.colorTheme || 'emerald'] || 'bg-[#16a34a]';

                return (
                  <div key={activity.id} className="space-y-4">
                    <div className={`${themeBg} rounded-2xl p-5 text-white shadow-md relative overflow-hidden transition-colors duration-300`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 pointer-events-none"></div>
                      <div className="relative z-10">
                        {activity.title && (
                          <h3 className="text-lg font-bold mb-1">{activity.title}</h3>
                        )}
                        {activity.subtitle && (
                          <p className="text-white/80 text-xs mb-3 font-medium">{activity.subtitle}</p>
                        )}

                        <div className="text-white text-xs leading-relaxed text-justify mb-3">
                          {isExpanded ? (
                            typeof activity.fullDescription === 'string' ? (
                              <div className="whitespace-pre-line">{activity.fullDescription}</div>
                            ) : (
                              activity.fullDescription
                            )
                          ) : (
                            activity.shortDescription
                          )}
                        </div>

                        {activity.fullDescription && (
                          <button 
                            onClick={toggleExpanded}
                            className="text-white font-bold text-xs underline cursor-pointer hover:text-white/90 transition-colors mb-3 block"
                          >
                            {isExpanded ? 'See less' : 'See more'}
                          </button>
                        )}

                        <div className="space-y-0.5 text-[11px] text-white/80 font-medium pt-3 border-t border-white/20">
                          {activity.photographers?.map((p: string, idx: number) => (
                            <p key={`ph-${idx}`}>Photo By | {p}</p>
                          ))}
                          {(Array.isArray(activity.editor) ? activity.editor : (typeof activity.editor === 'string' ? activity.editor.split(',') : [])).map((e: any) => String(e).trim()).filter(Boolean).map((ed: string, idx: number) => (
                            <p key={`ed-${idx}`}>Edited By | {ed}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                  {activity.galleryImages && activity.galleryImages.length > 0 && (
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-purple-100/80 shadow-md aspect-[16/9] max-h-[22rem]">
                      {activity.galleryImages.map((imgSrc: string, idx: number) => {
                        const isActive = idx === currentGalleryIndex;
                        const isAdjacent = Math.abs(idx - currentGalleryIndex) <= 1 || (currentGalleryIndex === 0 && idx === activity.galleryImages.length - 1) || (currentGalleryIndex === activity.galleryImages.length - 1 && idx === 0);
                        if (!isAdjacent) return null;
                        return (
                          <div
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                          >
                            <img 
                              src={imgSrc} 
                              alt="Gallery Background"
                              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-105"
                              loading="lazy"
                            />
                            <img 
                              src={imgSrc} 
                              alt="Gallery"
                              onClick={() => openImagePreview(activity.galleryImages, idx)}
                              className="relative z-10 w-full h-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                            />
                          </div>
                        );
                      })}

                      {activity.galleryImages.length > 7 ? (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/75 backdrop-blur-md border border-white/10 px-3.5 py-1 rounded-full text-white text-xs font-bold shadow-lg tracking-wider flex items-center gap-1.5 select-none">
                          <span>{currentGalleryIndex + 1}</span>
                          <span className="text-white/40">/</span>
                          <span className="text-white/70">{activity.galleryImages.length}</span>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full items-center shadow-lg">
                          {activity.galleryImages.map((_: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentGalleryIndex(idx)}
                              style={{
                                width: idx === currentGalleryIndex ? 20 : 6,
                                height: 6,
                                minWidth: 0,
                                minHeight: 0,
                                padding: 0,
                              }}
                              className={`rounded-full transition-all duration-300 border-0 shrink-0 cursor-pointer ${
                                idx === currentGalleryIndex ? 'bg-[#16a34a]' : 'bg-white/50 hover:bg-white/80'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </div>

        {/* Main Desktop Dashboard Layout Grid */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          
          {/* Left Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Featured Event Banner */}
            <div className="slide-up-2">
              {renderFeaturedCarousel(false)}
            </div>

            {/* Announcements Card Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)] hover:shadow-[0_8px_35px_rgba(124,58,237,0.11)] transition-all duration-300 slide-up-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-extrabold text-[#7c3aed]">
                  Announcements
                </h2>
              </div>
              
              <div className="space-y-4">
                {announcements.slice(0, 3).map((announcement) => {
                  const categoryBorderMap: { [key: string]: string } = {
                    'Maintenance': 'border-l-[#ea580c]',
                    'Services': 'border-l-[#2563eb]',
                    'Inventory': 'border-l-[#16a34a]',
                    'Registration': 'border-l-[#7c3aed]',
                  };
                  const borderClass = categoryBorderMap[announcement.category] || 'border-l-slate-400';
                  
                  return (
                    <div
                      key={announcement.id}
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className={`border-l-4 ${borderClass} bg-slate-50/80 hover:bg-purple-50/60 rounded-xl p-4 sm:p-5 border border-purple-100/80 transition-all cursor-pointer group hover:shadow-sm`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 text-xs font-bold text-[#7c3aed] bg-purple-100 rounded-full">
                          {announcement.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#7c3aed] transition-colors mb-1.5">
                        {announcement.title}
                      </h3>
                      {(announcement.image_url || announcement.image) && (
                        <div className="my-2.5 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center max-h-40 max-w-xs sm:max-w-sm">
                          <img 
                            src={announcement.image_url || announcement.image} 
                            alt={announcement.title} 
                            className="max-h-40 w-auto max-w-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-2">
                        {announcement.content}
                      </p>
                      <span className="text-xs text-slate-500 font-medium">
                        by {announcement.author_role ? `${announcement.author_role} - ` : ''}
                        {announcement.author_name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {announcements.length > 3 && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => navigate('/announcements')}
                    className="text-xs sm:text-sm font-bold text-[#7c3aed] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Announcement History</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Recent Activities Section */}
            <div id="recent-activities" className="bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)] hover:shadow-[0_8px_35px_rgba(124,58,237,0.11)] transition-all duration-300 space-y-4 slide-up-4">
              <div className="border-b border-purple-100/80 pb-3 mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Recent Activities
                </h2>
              </div>
              {recentActivitiesList.map((activity) => {
                const isExpanded = expandedActivityIds[activity.id] || false;
                const toggleExpanded = () => {
                  setExpandedActivityIds(prev => ({ ...prev, [activity.id]: !prev[activity.id] }));
                };
                
                const themeMap: Record<string, string> = {
                  emerald: 'bg-[#16a34a]',
                  purple: 'bg-[#7c3aed]',
                  blue: 'bg-[#2563eb]',
                  amber: 'bg-[#d97706]',
                  rose: 'bg-[#e11d48]',
                  slate: 'bg-[#1e293b]',
                };
                const themeBg = themeMap[activity.colorTheme || 'emerald'] || 'bg-[#16a34a]';

                return (
                  <div key={activity.id} className="space-y-4 mb-6">
                    <div className={`${themeBg} rounded-2xl p-6 text-white shadow-md relative overflow-hidden transition-colors duration-300`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 pointer-events-none"></div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-1">{activity.title}</h3>
                        {activity.subtitle && (
                          <p className="text-white/80 text-xs sm:text-sm mb-3 font-medium">{activity.subtitle}</p>
                        )}

                        <div className="text-white text-xs sm:text-sm leading-relaxed text-justify mb-4">
                          {isExpanded ? (
                            typeof activity.fullDescription === 'string' ? (
                              <div className="whitespace-pre-line">{activity.fullDescription}</div>
                            ) : (
                              activity.fullDescription
                            )
                          ) : (
                            activity.shortDescription
                          )}
                        </div>
                        
                        {activity.fullDescription && (
                          <button 
                            onClick={toggleExpanded}
                            className="text-white font-bold text-xs underline cursor-pointer hover:text-white/90 transition-colors mb-4 block"
                          >
                            {isExpanded ? 'See less' : 'See more'}
                          </button>
                        )}

                        <div className="space-y-0.5 text-xs text-white/80 font-medium pt-3 border-t border-white/20">
                          {activity.photographers?.map((p: string, idx: number) => (
                            <p key={`ph-${idx}`}>Photo By | {p}</p>
                          ))}
                          {(Array.isArray(activity.editor) ? activity.editor : (typeof activity.editor === 'string' ? activity.editor.split(',') : [])).map((e: any) => String(e).trim()).filter(Boolean).map((ed: string, idx: number) => (
                            <p key={`ed-${idx}`}>Edited By | {ed}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activity.galleryImages && activity.galleryImages.length > 0 && (
                      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-purple-100/80 shadow-md aspect-[16/9] max-h-[28rem]">
                        {activity.galleryImages.map((imgSrc: string, idx: number) => {
                          const isActive = idx === currentGalleryIndex;
                          const isAdjacent = Math.abs(idx - currentGalleryIndex) <= 1 || (currentGalleryIndex === 0 && idx === activity.galleryImages.length - 1) || (currentGalleryIndex === activity.galleryImages.length - 1 && idx === 0);
                          if (!isAdjacent) return null;
                          return (
                            <div
                              key={idx}
                              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                              }`}
                            >
                              {/* Ambient Blurred Background Copy */}
                              <img 
                                src={imgSrc} 
                                alt="Gallery Background"
                                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-105"
                                loading="lazy"
                              />
                              {/* Main Uncropped Image */}
                              <img 
                                src={imgSrc} 
                                alt="Gallery"
                                onClick={() => openImagePreview(activity.galleryImages, idx)}
                                className="relative z-10 w-full h-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                              />
                            </div>
                          );
                        })}

                        {/* Carousel Indicators Bar */}
                        {activity.galleryImages.length > 7 ? (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/75 backdrop-blur-md border border-white/10 px-3.5 py-1 rounded-full text-white text-xs font-bold shadow-lg tracking-wider flex items-center gap-1.5 select-none">
                            <span>{currentGalleryIndex + 1}</span>
                            <span className="text-white/40">/</span>
                            <span className="text-white/70">{activity.galleryImages.length}</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full items-center shadow-lg">
                            {activity.galleryImages.map((_: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentGalleryIndex(idx)}
                                className={`rounded-full transition-all duration-300 p-0 border-0 ${
                                  idx === currentGalleryIndex ? 'bg-[#16a34a] w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6 slide-up-2">
            
            {/* Current Office Status Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)] hover:shadow-[0_8px_35px_rgba(124,58,237,0.11)] transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100/80">
                <h3 className="text-base font-bold text-slate-900">Current Office Status</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                  isOfficeOpen ? 'bg-[#16a34a]' : 'bg-slate-400'
                }`}>
                  {isOfficeOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              
              <div className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium">
                {importantInfo[0].details.map((detail, idx) => (
                  <p key={idx}>{detail}</p>
                ))}
              </div>

              <div className="flex items-start space-x-2.5 pt-3 border-t border-purple-100/80 text-xs sm:text-sm text-slate-700 font-medium">
                <MapPin size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
                <div>
                  <p>Next to Clinic</p>
                  <p>UC Coop Office</p>
                </div>
              </div>
            </div>

            {/* Membership Card */}
            <div>
              {renderMembershipCard(false)}
            </div>

            {/* Quick Links Card */}
            {user?.membership_status === 'approved' && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-purple-100/80 shadow-[0_4px_25px_rgba(124,58,237,0.06)] hover:shadow-[0_8px_35px_rgba(124,58,237,0.11)] transition-all duration-300 space-y-3">
                <h3 className="text-base font-bold text-slate-900 mb-3">Quick Links</h3>
                <button 
                  onClick={() => navigate('/locker')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 transition-all text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer group"
                >
                  <span>My Locker</span>
                  <ArrowRight size={16} className="text-[#7c3aed] group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/billing-history')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 transition-all text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer group"
                >
                  <span>Billing History</span>
                  <ArrowRight size={16} className="text-[#7c3aed] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Membership Confirmation Modal */}
      {showMembershipModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: Z_INDEX.MEMBERSHIP_MODAL }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scale-in relative">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Request Membership</h2>
            
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              Are you sure you want to request membership? Please note that you need to pay <span className="font-bold text-slate-900">₱200</span> at the <span className="font-bold text-slate-900">UC Coop Office</span> for lifetime membership.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-xs sm:text-sm text-emerald-900 space-y-2">
              <h3 className="font-bold text-emerald-900">Membership Benefits:</h3>
              <ul className="space-y-1.5 text-emerald-800">
                <li className="flex items-start gap-2">
                  <span className="text-[#16a34a] font-bold">✓</span>
                  <span>Discounted prices on specific merchandise and products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#16a34a] font-bold">✓</span>
                  <span>Exclusive member benefits and priority access</span>
                </li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMembershipModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                No
              </button>
              <button
                onClick={() => {
                  setShowMembershipModal(false);
                  setMembershipRequested(true);
                  showNotification('Membership request submitted! Please pay ₱200 at UC Coop Office.', 'success');

                  apiClient.createMembershipRequest({
                    user_id: user?.id,
                    name: user ? `${user.first_name} ${user.last_name}` : 'Student',
                    email: user?.email || '',
                    phone: '',
                  }).catch((error: any) => {
                    console.error('Failed to submit membership request:', error);
                    if (error?.hasPendingRequest) {
                      setMembershipRequested(true);
                    } else if (error?.isAlreadyMember) {
                      showNotification('You are already a member!', 'success');
                      refreshUser();
                    } else {
                      setMembershipRequested(false);
                      showNotification(error?.message || 'Failed to submit membership request', 'error');
                    }
                  });
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Welcome Tour */}
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

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: Z_INDEX.MEMBERSHIP_MODAL + 10 }}
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full animate-scale-in relative border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 text-xs font-bold text-[#7c3aed] bg-purple-100 rounded-full">
                {selectedAnnouncement.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(selectedAnnouncement.date).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              {selectedAnnouncement.title}
            </h2>

            <div className="w-12 h-1 bg-[#7c3aed] rounded-full mb-4"></div>

            {(selectedAnnouncement.image_url || selectedAnnouncement.image) && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center max-h-[220px] max-w-md mx-auto shadow-xs">
                <img
                  src={selectedAnnouncement.image_url || selectedAnnouncement.image}
                  alt={selectedAnnouncement.title}
                  className="max-h-[210px] w-auto max-w-full object-contain rounded-xl hover:scale-102 transition-transform duration-300 cursor-pointer p-1.5"
                  onClick={() => openImagePreview([selectedAnnouncement.image_url || selectedAnnouncement.image], 0)}
                />
              </div>
            )}

            <div className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-line max-h-[45vh] overflow-y-auto pr-2">
              {selectedAnnouncement.content}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#7c3aed] font-bold text-xs">
                {selectedAnnouncement.author_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Published by</p>
                <p className="text-xs font-bold text-slate-800 capitalize">
                  {selectedAnnouncement.author_role ? `${selectedAnnouncement.author_role} - ` : ''}
                  {selectedAnnouncement.author_name}
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full Screen Lightbox Image Preview Modal */}
      {previewImage && createPortal(
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden animate-fade-in"
          style={{ zIndex: Z_INDEX.MEMBERSHIP_MODAL + 50 }}
          onClick={() => setPreviewImage(null)}
        >
          {/* Top Control Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between z-20 text-white pt-2">
            <span className="text-xs sm:text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
              {previewImageIndex + 1} of {previewImagesList.length || 1}
            </span>
            <button
              onClick={() => setPreviewImage(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20 backdrop-blur-md active:scale-95"
              aria-label="Close preview"
            >
              <X size={22} />
            </button>
          </div>

          {/* Main Image Display with Controls */}
          <div 
            className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-2 sm:my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {previewImagesList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIdx = previewImageIndex === 0 ? previewImagesList.length - 1 : previewImageIndex - 1;
                  setPreviewImageIndex(prevIdx);
                  setPreviewImage(previewImagesList[prevIdx]);
                }}
                className="absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
                title="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="relative p-1 sm:p-1.5 bg-black/40 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center max-w-full max-h-[78vh] sm:max-h-[82vh]">
              <img
                src={previewImage}
                alt="Expanded Preview"
                className="max-w-full max-h-[76vh] sm:max-h-[80vh] object-contain rounded-xl animate-scale-in"
              />
            </div>

            {previewImagesList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIdx = previewImageIndex === previewImagesList.length - 1 ? 0 : previewImageIndex + 1;
                  setPreviewImageIndex(nextIdx);
                  setPreviewImage(previewImagesList[nextIdx]);
                }}
                className="absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
                title="Next image"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
