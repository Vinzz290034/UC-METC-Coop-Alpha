import React from 'react';
import { useNavigate } from 'react-router-dom';
import coopLogo from '../assets/Coop.jpeg';
import { ArrowLeft, Bell, Calendar, User, ChevronLeft } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();

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
                <Bell size={28} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">Announcements</h2>
            </div>
            <p className="text-slate-300 text-lg">
              Stay updated with the latest news and updates from UC METC SILMS
            </p>
          </div>

          {/* Announcements List */}
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-slate-800/50 border border-purple-700/50 rounded-xl p-8 backdrop-blur-sm hover:bg-slate-800/80 hover:border-green-500/50 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                        {announcement.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-green-400 transition-colors">
                      {announcement.title}
                    </h3>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-6 text-slate-400 text-sm mb-4">
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
                <p className="text-slate-200 leading-relaxed">{announcement.content}</p>
              </div>
            ))}
          </div>

          {/* No More Announcements */}
          <div className="text-center mt-12">
            <p className="text-slate-400">
              No more announcements to display. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
