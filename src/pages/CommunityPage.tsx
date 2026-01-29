import React, { useState } from 'react';
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

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-green-900 text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-slate-900/80 border-b border-purple-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={coopLogo}
              alt="UC METC Logo" 
              className="w-10 h-10 rounded-full"
            />
            <h1 className="text-2xl font-bold text-green-400">
              UC METC SILMS
            </h1>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all font-semibold"
          >
            <span>Login</span>
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-green-400 hover:text-purple-400 transition-colors mb-8 group font-semibold"
            title="Back to Landing Page"
          >
            <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Users size={28} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">Community</h2>
            </div>
            <p className="text-slate-300 text-lg">
              Connect with other members, share experiences, and stay engaged
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search community posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-slate-800/50 border border-purple-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Community Posts */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-800/50 border border-purple-700/50 rounded-xl p-8 backdrop-blur-sm hover:bg-slate-800/80 hover:border-green-500/50 transition-all"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-4xl">{post.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-lg">{post.author}</h4>
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            {post.role}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{post.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <p className="text-slate-200 leading-relaxed">{post.content}</p>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center space-x-6 pt-4 border-t border-purple-700/50 text-slate-400 text-sm">
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
                <p className="text-slate-400 text-lg">
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
  );
};
