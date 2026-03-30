import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
import { ArrowLeft, Bell, Calendar, User, ChevronLeft } from 'lucide-react';

const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(3deg); }
  }
  
  @keyframes fade-in-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes zoom-in {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .float-animation { animation: float 6s ease-in-out infinite; }
  .fade-in-up-animation { animation: fade-in-up 0.7s ease-out forwards; opacity: 0; }
  .zoom-in-animation { animation: zoom-in 0.6s ease-out forwards; opacity: 0; }
  
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
`;

export const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
        rootMargin: '0px 0px -50px 0px',
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

  const announcements = [
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      date: '2026-02-15',
      author: 'Admin',
      content:
        'The UC METC SILMS system will undergo scheduled maintenance on February 15th from 10:00 PM to 12:00 AM. Please plan accordingly.',
      category: 'Maintenance',
    },
    {
      id: 2,
      title: 'New Locker Units Available',
      date: '2026-02-10',
      author: 'Locker Officer',
      content:
        'We are pleased to announce the addition of 50 new locker units to our facility. Members can now request lockers online through the system.',
      category: 'Services',
    },
    {
      id: 3,
      title: 'Updated Uniform Inventory',
      date: '2026-02-05',
      author: 'Inventory Officer',
      content:
        'New maritime uniforms have been added to our inventory. Check out the latest designs in the Sales & Inventory section.',
      category: 'Inventory',
    },
    {
      id: 4,
      title: 'Member Registration Now Open',
      date: '2026-01-28',
      author: 'Admin',
      content:
        'We are now accepting new member registrations. Visit the Members section to learn more about membership benefits.',
      category: 'Registration',
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-400 text-slate-900 overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-100/20 rounded-full blur-3xl float-animation opacity-30"></div>
          <div className="absolute bottom-32 right-20 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl float-animation opacity-40" style={{ animationDelay: '-2s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-200/15 rounded-full blur-3xl opacity-20" style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '-4s' }}></div>
          
          <div className="absolute top-1/4 left-1/2 w-1 h-48 bg-gradient-to-b from-white/30 to-transparent opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/3 w-1 h-64 bg-gradient-to-t from-white/30 to-transparent opacity-20"></div>
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
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 font-semibold group"
              >
                <span>Login</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors mb-8 group font-semibold"
            title="Back to Landing Page"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          {/* Page Header */}
          <div 
            id="page-header"
            data-animate="true"
            className={`mb-12 transition-all duration-700 ${
              visibleElements.has('page-header') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                <Bell size={28} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Announcements</h2>
            </div>
            <p className="text-slate-600 text-lg">
              Stay updated with the latest news and updates from UC METC SILMS
            </p>
          </div>

          {/* Announcements List */}
          <div className="space-y-6">
            {announcements.map((announcement, idx) => (
              <div
                key={announcement.id}
                id={`announcement-${announcement.id}`}
                data-animate="true"
                className={`bg-white/70 border border-white/40 rounded-xl p-8 backdrop-blur-sm hover:bg-white/80 hover:border-green-400 transition-all group ${
                  visibleElements.has(`announcement-${announcement.id}`) ? 'zoom-in-animation' : 'opacity-0 scale-75'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {announcement.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900 group-hover:text-green-600 transition-colors">
                      {announcement.title}
                    </h3>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-6 text-slate-500 text-sm mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{new Date(announcement.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{announcement.author}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-slate-700 leading-relaxed">{announcement.content}</p>
              </div>
            ))}
          </div>

          {/* No More Announcements */}
          <div className="text-center mt-12">
            <p className="text-slate-500">
              No more announcements to display. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
