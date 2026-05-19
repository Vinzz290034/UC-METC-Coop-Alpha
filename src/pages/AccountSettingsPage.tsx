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
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">ACCOUNT SETTINGS</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Your Profile Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Your Profile</h2>

            {/* Profile Picture */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-md">
                  <User size={48} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* ID Number - Only for non-admin/staff users */}
              {user?.role !== 'admin' && user?.role !== 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              )}

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  placeholder=""
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              {/* Course - Only for non-admin/staff users */}
              {user?.role !== 'admin' && user?.role !== 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Course
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              )}

              {/* Year - Only for non-admin/staff users */}
              {user?.role !== 'admin' && user?.role !== 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Info Note - Only show for regular users */}
            {user?.role === 'user' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Your account information is managed by the administration. Please proceed to UC Coop Office if you need to make changes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
