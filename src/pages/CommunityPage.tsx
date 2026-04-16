import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Search,
  ChevronLeft,
} from 'lucide-react';

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

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
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

  const communityPosts = [
    {
      id: 1,
      author: 'Juan Santos',
      role: 'Member',
      avatar: '👨‍⚓',
      timestamp: '2 hours ago',
      title: 'Tips for Locker Maintenance',
      content:
        'I recently learned some great tips for maintaining our lockers. Remember to keep your locker clean and report any issues immediately to the locker officer. This helps extend the life of our equipment!',
      likes: 24,
      comments: 5,
      shares: 2,
    },
    {
      id: 2,
      author: 'Maria Cruz',
      role: 'Locker Officer',
      avatar: '👩‍💼',
      timestamp: '4 hours ago',
      title: 'New Locker Assignment Process',
      content:
        'Starting next month, we will implement a new digital locker assignment process. This will make it faster and easier to request and manage lockers. More details coming soon!',
      likes: 45,
      comments: 12,
      shares: 8,
    },
    {
      id: 3,
      author: 'Carlos Reyes',
      role: 'Member',
      avatar: '👨‍🔧',
      timestamp: '6 hours ago',
      title: 'Feedback: Improved Key Services',
      content:
        'I am really impressed with the new key duplication service. The process is much faster now and the quality is excellent. Great work to the key services team!',
      likes: 32,
      comments: 8,
      shares: 3,
    },
    {
      id: 4,
      author: 'Ana De Luna',
      role: 'Inventory Officer',
      avatar: '👩‍🏫',
      timestamp: '8 hours ago',
      title: 'Latest Uniform Collection Available',
      content:
        'Our new maritime uniform collection is now available in the Sales & Inventory section. We have incorporated feedback from our members to improve comfort and durability.',
      likes: 58,
      comments: 15,
      shares: 10,
    },
  ];

  const filteredPosts = communityPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-400 text-slate-900 overflow-hidden animate-slide-in-right">
        
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
                <Users size={28} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Community</h2>
            </div>
            <p className="text-slate-600 text-lg">
              Connect with other members, share experiences, and stay engaged
            </p>
          </div>

          {/* Search Bar */}
          <div 
            id="search-bar"
            data-animate="true"
            className={`mb-8 transition-all duration-700 ${
              visibleElements.has('search-bar') ? 'fade-in-up-animation' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search community posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white/70 border border-white/40 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-400/20 transition-all"
              />
            </div>
          </div>

          {/* Community Posts */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, idx) => (
                <div
                  key={post.id}
                  id={`post-${post.id}`}
                  data-animate="true"
                  className={`bg-white/70 border border-white/40 rounded-xl p-8 backdrop-blur-sm hover:bg-white/80 hover:border-green-400 transition-all ${
                    visibleElements.has(`post-${post.id}`) ? 'zoom-in-animation' : 'opacity-0 scale-75'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-4xl">{post.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-lg text-slate-900">{post.author}</h4>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {post.role}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">{post.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2 text-slate-900">{post.title}</h3>
                    <p className="text-slate-700 leading-relaxed">{post.content}</p>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center space-x-6 pt-4 border-t border-white/20 text-slate-500 text-sm">
                    <button className="flex items-center space-x-2 hover:text-red-400 transition-colors group">
                      <Heart
                        size={18}
                        className="group-hover:fill-red-400 transition-all"
                      />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-green-400 transition-colors">
                      <MessageSquare size={18} />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-purple-400 transition-colors">
                      <Share2 size={18} />
                      <span>{post.shares}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">
                  No posts found matching your search.
                </p>
              </div>
            )}
          </div>

          {/* Join Community CTA */}
          <div className="mt-12 p-8 bg-green-600/20 border border-green-500/30 rounded-xl text-center">
            <h3 className="text-2xl font-bold mb-3">
              Ready to Join the Conversation?
            </h3>
            <p className="text-slate-300 mb-6">
              Login to your account to share posts, interact with the community,
              and stay connected with other members.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all font-semibold"
            >
              <span>Login Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
