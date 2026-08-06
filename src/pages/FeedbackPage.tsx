import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MessageCircle,
  Sparkles,
  Building2,
  ShoppingBag,
  Lock,
  Smartphone,
  HelpCircle,
  CornerDownRight,
  Plus,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { useNotificationStore } from '../store/notificationStore';
import { formatFullName } from '../utils/nameFormatter';

export interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userStudentId?: string;
  category: 'product' | 'service' | 'locker' | 'app' | 'suggestion' | 'other';
  rating: number;
  subject: string;
  message: string;
  tags?: string[];
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  adminReply?: {
    repliedBy: string;
    message: string;
    repliedAt: string;
  };
}

const STORAGE_KEY = 'uc_metc_feedbacks_v1';

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification, setSidebarOpen } = useUIStore();
  const { addNotification } = useNotificationStore();
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Exclude legacy mock items so stats only compute real submitted data
      return parsed.filter((f: FeedbackItem) => !['FB-1001', 'FB-1002', 'FB-1003'].includes(f.id));
    } catch {
      return [];
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
    } catch (e) {
      // silent catch
    }
  }, [feedbacks]);

  // Form states
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'admin'>(() => {
    return (user?.role === 'admin' || user?.role === 'staff') ? 'admin' : 'submit';
  });
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackItem['category']>('product');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter states for history / admin
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  // Admin reply modal state
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const categoryOptions = [
    { id: 'product', label: 'Merchandise & Products', icon: <ShoppingBag size={18} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'service', label: 'Coop Store & Staff Service', icon: <Building2 size={18} />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'locker', label: 'Locker Rental System', icon: <Lock size={18} />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'app', label: 'Kiosk & Mobile Experience', icon: <Smartphone size={18} />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'suggestion', label: 'Feature Suggestion', icon: <Sparkles size={18} />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'other', label: 'Other / General Inquiry', icon: <HelpCircle size={18} />, color: 'bg-slate-50 text-slate-700 border-slate-200' },
  ];

  const quickTagOptions = [
    'Friendly Staff',
    'Fast Processing',
    'Great Quality',
    'Accurate Sizing',
    'Clean Store',
    'Needs Improvement',
    'Bug Report',
    'Suggestion',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const userNameStr = user?.first_name ? formatFullName(user.first_name, user.last_name) : 'Student Member';

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const newFeedback: FeedbackItem = {
      id: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user?.id || 'guest',
      userName: userNameStr,
      userRole: user?.role || 'user',
      userStudentId: (user as any)?.studentId || '2024-00192',
      category,
      rating,
      subject: subject.trim(),
      message: message.trim(),
      tags: selectedTags,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setFeedbacks(prev => [newFeedback, ...prev]);
    showNotification('Thank you! Your feedback has been submitted successfully.', 'success');

    // Notify Admins & Staff of new student feedback
    addNotification({
      id: `notif_fb_${Date.now()}`,
      user_id: 'admin',
      type: 'feedback_submitted',
      title: 'New Student Feedback Received',
      description: `${userNameStr} submitted feedback: "${subject.trim()}"`,
      link: '/feedback',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // Reset form
    setSubject('');
    setMessage('');
    setRating(5);
    setSelectedTags([]);
    setActiveTab('history');
  };

  const handleAdminReply = (id: string) => {
    if (!replyText.trim()) {
      showNotification('Please enter a response message', 'error');
      return;
    }

    const targetItem = feedbacks.find(item => item.id === id);

    setFeedbacks(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'resolved',
            adminReply: {
              repliedBy: userNameStr,
              message: replyText.trim(),
              repliedAt: new Date().toISOString(),
            },
          };
        }
        return item;
      })
    );

    // Notify Student of admin reply
    if (targetItem) {
      addNotification({
        id: `notif_reply_${Date.now()}`,
        user_id: targetItem.userId,
        type: 'feedback_replied',
        title: 'Coop Admin Replied to your Feedback',
        description: `${userNameStr} replied: "${replyText.trim()}"`,
        link: '/feedback',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    showNotification('Reply submitted to student successfully!', 'success');
    setReplyingId(null);
    setReplyText('');
  };

  const handleStatusChange = (id: string, newStatus: FeedbackItem['status']) => {
    setFeedbacks(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showNotification(`Feedback status updated to ${newStatus}`, 'success');
  };

  // Custom Delete Confirmation Modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteFeedback = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteFeedback = () => {
    if (!deleteConfirmId) return;
    setFeedbacks(prev => prev.filter(f => f.id !== deleteConfirmId));
    showNotification('Feedback item removed successfully', 'success');
    setDeleteConfirmId(null);
  };

  // Metrics
  const totalCount = feedbacks.length;

  // Filtered lists
  const myFeedbacks = feedbacks.filter(f => isAdminOrStaff || f.userId === user?.id || f.userId === 'guest');

  const filteredFeedbacks = feedbacks.filter(f => {
    if (!isAdminOrStaff && f.userId !== user?.id && f.userId !== 'guest') return false;
    
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterRating !== 'all' && String(f.rating) !== filterRating) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.subject.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        f.userName.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden flex items-center gap-3 mb-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-purple-100 rounded-xl shadow-sm hover:bg-purple-50 hover:shadow-md transition-all duration-200 active:scale-95"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-wide leading-none">
              {isAdminOrStaff ? 'Feedback Management' : 'Feedback & Suggestions'}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAdminOrStaff ? 'Moderate and respond to feedback' : 'Share your thoughts with us'}
            </p>
          </div>
        </div>

        {/* Page Title & Hero */}
        <div className="bg-[#3b1d6e] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles size={14} className={isAdminOrStaff ? "text-emerald-400" : "text-amber-400"} />
                {isAdminOrStaff ? "Feedback Moderation & Admin Control" : "Customer Satisfaction & Support"}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                {isAdminOrStaff ? "Feedback Management" : "Feedback & Suggestions"}
              </h1>
              <p className="text-purple-200 text-sm sm:text-base mt-2 max-w-2xl font-medium">
                {isAdminOrStaff
                  ? "Review student feedback, track satisfaction ratings, update resolution statuses, and send official Coop responses."
                  : "Your thoughts help us continuously improve UC METC SILMS store services, product quality, locker rentals, and application experience."}
              </p>
            </div>

            {/* Right Side Card: Admin Stats vs Student Feature Card */}
            {isAdminOrStaff ? (
              <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl min-w-[320px]">
                <div className="text-center">
                  <span className="text-[11px] text-purple-200 block font-semibold uppercase tracking-wider">Total Received</span>
                  <span className="text-2xl font-black text-white">{totalCount}</span>
                </div>
                <div className="text-center border-x border-white/15 px-2">
                  <span className="text-[11px] text-purple-200 block font-semibold uppercase tracking-wider">Pending</span>
                  <span className="text-2xl font-black text-amber-400">
                    {feedbacks.filter(f => f.status === 'pending').length}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-purple-200 block font-semibold uppercase tracking-wider">Resolved</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {feedbacks.filter(f => f.status === 'resolved' || f.status === 'reviewed').length}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center flex-shrink-0 font-black shadow-lg">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">We Value Your Voice</h4>
                  <p className="text-xs text-purple-200 mt-0.5 leading-relaxed font-medium">
                    Every feedback is reviewed directly by UC METC SILMS management to continuously enhance campus services.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nav Tabs for Students */}
          {!isAdminOrStaff && (
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'submit'
                    ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                    : 'bg-white/10 text-purple-100 hover:bg-white/20'
                }`}
              >
                <Plus size={16} /> Submit Feedback
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                    : 'bg-white/10 text-purple-100 hover:bg-white/20'
                }`}
              >
                <MessageSquare size={16} /> My Feedback & Responses ({myFeedbacks.length})
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Submit Feedback Form */}
        {activeTab === 'submit' && (
          <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 sm:p-10 shadow-xl max-w-4xl mx-auto">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                <MessageSquare className="text-purple-600 shrink-0" size={26} />
                Share Your Experience with Us
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                We value your honest feedback! Tell us what we're doing great or how we can improve.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-8">
              {/* Star Rating Selection */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-6 text-center">
                <label className="block text-sm font-extrabold uppercase tracking-wider text-purple-900 mb-3">
                  How would you rate your experience?
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 sm:p-2 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={36}
                          className={
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                              : 'text-slate-300 fill-slate-100'
                          }
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs font-black text-purple-700 uppercase tracking-wide">
                  {rating === 1 && '⭐ 1 - Poor / Needs Attention'}
                  {rating === 2 && '⭐⭐ 2 - Fair / Could Be Better'}
                  {rating === 3 && '⭐⭐⭐ 3 - Good / Satisfactory'}
                  {rating === 4 && '⭐⭐⭐⭐ 4 - Very Good!'}
                  {rating === 5 && '⭐⭐⭐⭐⭐ 5 - Excellent Service!'}
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-sm font-extrabold text-slate-900 mb-3">
                  Feedback Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categoryOptions.map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 shadow-md ring-2 ring-purple-300'
                            : 'border-slate-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${cat.color}`}>{cat.icon}</div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                            {cat.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <label className="block text-sm font-extrabold text-slate-900 mb-2">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Friendly cashier service, Uniform sizing recommendation, App bug..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 font-medium text-sm text-slate-900"
                  required
                />
              </div>

              {/* Detailed Message */}
              <div>
                <label className="block text-sm font-extrabold text-slate-900 mb-2">
                  Detailed Feedback / Suggestion <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Please describe your experience in detail. What did you like? What can we improve?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 font-medium text-sm text-slate-900"
                  required
                />
              </div>

              {/* Quick Highlight Tags */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Add Quick Feedback Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickTagOptions.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Submit Feedback
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Feedback History & Admin View */}
        {(activeTab === 'history' || activeTab === 'admin') && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search feedback subject, student name, or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="product">Merchandise & Products</option>
                    <option value="service">Coop Service</option>
                    <option value="locker">Locker Rentals</option>
                    <option value="app">Kiosk & App</option>
                    <option value="suggestion">Suggestions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <select
                  value={filterRating}
                  onChange={e => setFilterRating(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                  <option value="4">4 Stars ⭐⭐⭐⭐</option>
                  <option value="3">3 Stars ⭐⭐⭐</option>
                  <option value="2">2 Stars ⭐⭐</option>
                  <option value="1">1 Star ⭐</option>
                </select>
              </div>
            </div>

            {/* List View */}
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <MessageCircle size={48} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Feedback Found</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Try adjusting your search query or filters above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map(item => {
                  const catObj = categoryOptions.find(c => c.id === item.category);

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock size={13} /> Pending Review
                    </span>
                  );
                  if (item.status === 'reviewed') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                        <MessageSquare size={13} /> Reviewed
                      </span>
                    );
                  } else if (item.status === 'resolved') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 size={13} /> Responded & Action Taken
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-4"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                            {item.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {item.userName}
                              </span>
                              {item.userStudentId && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  ({item.userStudentId})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                              Submitted on {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {item.id}
                          </span>
                          {statusBadge}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg font-black text-slate-900">{item.subject}</h3>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={16}
                                className={
                                  s <= item.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200 fill-slate-100'
                                }
                              />
                            ))}
                            <span className="text-xs font-black text-amber-900 ml-1">
                              {item.rating}.0
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-700 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          "{item.message}"
                        </p>

                        {/* Category & Tags */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {catObj && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${catObj.color}`}>
                              {catObj.label}
                            </span>
                          )}
                          {item.tags?.map(t => (
                            <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Official Admin Reply Thread (if exists) */}
                      {item.adminReply && (
                        <div className="mt-4 bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                              <CornerDownRight size={14} className="text-purple-600" />
                              Official Response from {item.adminReply.repliedBy}
                            </span>
                            <span className="text-[11px] text-purple-600 font-medium">
                              {new Date(item.adminReply.repliedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-purple-950 font-semibold pl-5">
                            "{item.adminReply.message}"
                          </p>
                        </div>
                      )}

                      {/* Admin Actions Footer */}
                      {isAdminOrStaff && (
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusChange(item.id, 'reviewed')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
                            >
                              Mark Reviewed
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'resolved')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                            >
                              Mark Resolved
                            </button>
                            <button
                              onClick={() => handleDeleteFeedback(item.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setReplyingId(replyingId === item.id ? null : item.id);
                              setReplyText(item.adminReply?.message || '');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <MessageCircle size={14} />
                            {item.adminReply ? 'Edit Reply' : 'Send Admin Reply'}
                          </button>
                        </div>
                      )}

                      {/* Reply Form Box */}
                      {replyingId === item.id && (
                        <div className="bg-slate-50 border-2 border-purple-300 rounded-2xl p-4 mt-3 space-y-3 animate-fade-in">
                          <label className="block text-xs font-extrabold text-slate-900">
                            Write Official Coop Reply to {item.userName}:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Type your response here..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setReplyingId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAdminReply(item.id)}
                              className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-purple-700 text-white hover:bg-purple-800 shadow-xs"
                            >
                              Send Response
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Theme Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center animate-scale-up">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-inner">
              <AlertTriangle size={32} className="text-rose-600" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Feedback Item?</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
              Are you sure you want to delete this feedback item? This action will permanently remove it from the SILMS database.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFeedback}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
