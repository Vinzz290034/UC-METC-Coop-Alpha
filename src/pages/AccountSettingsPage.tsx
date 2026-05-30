import React, { useEffect, useState } from 'react';
import { User, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

export const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    course: '',
    year: '',
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        id_number: user.id_number || '',
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        course: user.course || '',
        year: user.year || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-white/40 active:bg-white/60 active:scale-95 rounded-xl transition-all duration-200 flex items-center justify-center text-slate-800"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase leading-none">
            ACCOUNT SETTINGS
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-8">
          {/* Your Profile Section */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
              Your Profile
            </h2>

            {/* Profile Picture */}
            <div className="w-full flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-md">
                <User size={48} className="text-slate-400" />
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* ID Number - Only for non-admin/staff users */}
              {user?.role !== 'admin' && user?.role !== 'staff' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                  />
                </div>
              )}

              {/* First Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                />
              </div>

              {/* Middle Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                  placeholder="None"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                />
              </div>

              {/* Course - Only for non-admin/staff users */}
              {user?.role !== 'admin' && user?.role !== 'staff' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Course / Program
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                  />
                </div>
              )}

              {/* Year - Only for non-admin/staff users */}
              {user?.role !== 'admin' && user?.role !== 'staff' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Year Level
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-700 text-sm font-semibold transition-all duration-200 cursor-not-allowed shadow-inner focus:outline-none"
                  />
                </div>
              )}

              {/* Info Note - Only show for regular users */}
              {user?.role === 'user' && (
                <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl flex items-start gap-3 md:col-span-2 mt-2">
                  <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">💡</span>
                  <p className="text-xs sm:text-sm text-purple-800 font-medium leading-relaxed">
                    Your account details are managed directly by the UC Coop Administration. If you need to update any information, please proceed to the UC Coop Office.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
