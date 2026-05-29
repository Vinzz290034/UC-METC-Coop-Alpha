import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import { COMMUNITY_GA_GALLERY_URLS } from '../constants/cloudinaryGallery';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes fade-in-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .float-animation { animation: float 4s ease-in-out infinite; }
  .fade-in-up { animation: fade-in-up 0.7s ease-out forwards; }
`;

// Community Events Data
const communityEvents = [
  {
    id: 1,
    title: '11TH GENERAL ASSEMBLY 2026',
    subtitle: 'Shaping Our Cooperative\'s Future Together',
    date: 'March 21, 2026',
    time: '1:00 PM - 5:00 PM',
    location: 'AVR 1 UC METC Campus',
    status: 'completed',
    shortDescription: 'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives.',
    highlights: [
      'Approval of new sustainability initiatives',
      'Introduction of enhanced member benefits',
      'Election of new board of directors',
      'Financial performance presentations',
      'Community engagement workshops'
    ],
    attendees: '150+ Members',
    images: [...COMMUNITY_GA_GALLERY_URLS],
  },
  // Add more future events here
];

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEvent] = useState(communityEvents[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Auto-rotate images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => 
        prev === selectedEvent.images.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [selectedEvent.images.length]);

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-400 text-slate-900 overflow-hidden animate-slide-in-right">
        
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-100/20 rounded-full blur-3xl float-animation opacity-30"></div>
          <div className="absolute bottom-32 right-20 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl float-animation opacity-40" style={{ animationDelay: '-2s' }}></div>
        </div>

        {/* Navigation Bar */}
        <nav className={`fixed top-0 w-full z-50 backdrop-blur-md bg-gradient-to-b from-white/40 to-white/10 transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="max-w-7xl mx-auto px-4 xs:px-6 py-2 sm:py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={COOP_LOGO_URL}
                alt="UC METC Logo" 
                className="w-7 h-7 xs:w-10 xs:h-10 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
              />
              <h1 className="text-sm xs:text-2xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                UC METC SILMS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 xs:px-6 py-1.5 xs:py-2.5 rounded-lg hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 font-semibold min-h-0 min-w-0 text-xs xs:text-base"
              >
                <span>Login</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="relative z-10 pt-16 xs:pt-32 pb-10 sm:pb-20 px-4 xs:px-12 md:px-20">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1 text-slate-600 hover:text-green-600 transition-colors mb-4 sm:mb-8 group font-semibold min-h-0 min-w-0 text-xs xs:text-base px-1 py-0.5"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform sm:w-6 sm:h-6" />
              <span>Back</span>
            </button>

            {/* Page Header */}
            <div className="mb-6 sm:mb-12 text-center fade-in-up">
              <h2 className="text-sm xs:text-5xl md:text-6xl font-bold mb-1 sm:mb-4 text-slate-900">
                Community <span className="text-purple-600">Events</span>
              </h2>
              <p className="text-slate-600 text-[10px] xs:text-xl max-w-2xl mx-auto">
                Celebrating our cooperative's milestones and community achievements
              </p>
            </div>

            {/* Main Event Feature */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/30 fade-in-up">
                
                {/* Event Header */}
                <div className="bg-gradient-to-r from-purple-600 to-green-600 p-3 xs:p-8 text-white relative overflow-hidden">
                  
                  {/* Static Bubbly Background */}
                  <div className="absolute inset-0 bg-green-500">
                    <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                    <div className="absolute bottom-8 left-8 w-24 h-24 bg-white/15 rounded-full"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2 xs:mb-4">
                      <span className="bg-white/20 px-2 xs:px-4 py-1 xs:py-2 rounded-full text-[9px] xs:text-sm font-semibold">
                        {selectedEvent.status === 'completed' ? 'Recent Event' : 'Upcoming Event'}
                      </span>
                    </div>
                    
                    <h1 className="text-sm xs:text-3xl sm:text-5xl font-bold mb-1 xs:mb-2">{selectedEvent.title}</h1>
                    <p className="text-[10px] xs:text-base sm:text-xl text-white/90 mb-2 xs:mb-4">{selectedEvent.subtitle}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 xs:gap-6 text-white/90">
                      <div className="flex items-center space-x-1 xs:space-x-2 text-[9px] xs:text-sm">
                        <Calendar className="w-3.5 h-3.5 xs:w-5 xs:h-5 flex-shrink-0" />
                        <span className="font-medium">{selectedEvent.date}</span>
                      </div>
                      <div className="flex items-center space-x-1 xs:space-x-2 text-[9px] xs:text-sm">
                        <Clock className="w-3.5 h-3.5 xs:w-5 xs:h-5 flex-shrink-0" />
                        <span className="font-medium">{selectedEvent.time}</span>
                      </div>
                      <div className="flex items-center space-x-1 xs:space-x-2 text-[9px] xs:text-sm">
                        <MapPin className="w-3.5 h-3.5 xs:w-5 xs:h-5 flex-shrink-0" />
                        <span className="font-medium">{selectedEvent.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Content (Horizontal 12-Column Grid) */}
                <div className="p-3 xs:p-8">
                  <div className="grid grid-cols-12 gap-4 xs:gap-8">
                    
                    {/* Event Description & Key Highlights */}
                    <div className="col-span-5 lg:col-span-6">
                      <div className="hidden sm:block">
                        <h3 className="text-xs xs:text-2xl font-bold text-slate-900 mb-1.5 xs:mb-4">About the Event</h3>
                        <p className="text-slate-600 text-[10px] xs:text-lg leading-snug mb-3 xs:mb-6 text-justify">
                          {selectedEvent.shortDescription}
                        </p>
                      </div>

                      <div className="mt-0 sm:mt-6">
                        <h4 className="text-[11px] xs:text-xl lg:text-2xl font-bold text-slate-900 mb-1.5 xs:mb-4">Key Highlights</h4>
                        <ul className="space-y-1.5 xs:space-y-3 lg:space-y-4">
                          {selectedEvent.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start space-x-1.5 xs:space-x-3">
                              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gradient-to-r from-purple-500 to-green-500 rounded-full mt-1.5 lg:mt-2.5 flex-shrink-0"></div>
                              <span className="text-slate-600 text-[9px] xs:text-sm lg:text-lg leading-tight lg:leading-relaxed text-left">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Event Images */}
                    <div className="col-span-7 lg:col-span-6">
                      <h3 className="text-xs xs:text-2xl font-bold text-slate-900 mb-1.5 xs:mb-4">Event Gallery</h3>
                      <div className="relative mt-2 xs:mt-4 sm:mt-0">
                        <div className="aspect-video rounded-lg sm:rounded-2xl overflow-hidden shadow-xl">
                          <img 
                            src={selectedEvent.images[currentImageIndex]} 
                            alt={`${selectedEvent.title} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover transition-all duration-500 opacity-100"
                          />
                        </div>
                        
                        {/* Image Indicators */}
                        <div className="flex justify-center mt-2 xs:mt-4 space-x-1 xs:space-x-2">
                          {selectedEvent.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-1.5 h-1.5 xs:w-3 xs:h-3 rounded-full transition-all duration-300 min-h-0 min-w-0 ${
                                index === currentImageIndex
                                  ? 'bg-green-500 scale-125'
                                  : 'bg-slate-300 hover:bg-slate-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Events Teaser */}
              <div className="mt-16 text-center fade-in-up">
                <h3 className="text-xs xs:text-3xl font-bold text-slate-900">-- More Events Coming Soon --</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
