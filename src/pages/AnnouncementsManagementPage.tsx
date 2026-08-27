import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, Bell, Image as ImageIcon, X, Sparkles, Calendar, Clock, Camera, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { uploadToCloudinary, getThumbnailUrl } from '../utils/cloudinary';
import { GALLERY_IMAGE_URLS } from '../constants/cloudinaryGallery';

interface Announcement {
  id: string;
  title: string;
  date: string;
  author_name: string;
  content: string;
  category: string;
  image_url?: string;
}

interface RecentActivityItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  short_description: string;
  full_description: string;
  photographers: string[];
  editor: string;
  gallery_images: string[];
  color_theme?: string;
}

interface PaginatedGalleryProps {
  images: string[];
  onImageClick: (images: string[], index: number) => void;
}

const PaginatedGallery: React.FC<PaginatedGalleryProps> = ({ images, onImageClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentImages = images.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Gallery Photos ({images.length}) • Page {currentPage} of {totalPages}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center space-x-1"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <span className="text-xs font-semibold text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {currentImages.map((img, idx) => {
          const globalIndex = startIndex + idx;
          return (
            <div
              key={globalIndex}
              onClick={() => onImageClick(images, globalIndex)}
              className="aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200/80 relative group cursor-pointer shadow-xs hover:shadow-md hover:border-emerald-500 transition-all"
            >
              <img
                src={getThumbnailUrl(img, 300)}
                alt={`Gallery ${globalIndex + 1}`}
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).src = img; }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-default-1',
    title: 'MEMBERSHIP APPLICATION PROCESS GUIDE',
    category: 'Registration',
    date: '2026-07-07',
    author_name: 'Vince Andrew Santoya',
    content: `Welcome to the UC METC Multipurpose Cooperative! To help you smoothly navigate your application, please follow this step-by-step process:

Step 1: Submit Your Online Request
Click the "Join Now!" button on the portal dashboard. This will instantly submit your request, and your application profile will be reflected in our system as "Pending."

Step 2: Settle Fees at the Coop Office
Proceed directly to the Coop Office to complete your financial onboarding. You will need to settle:

▸ ₱200.00 for the Membership Fee
▸ Your initial contribution amount for your Share Capital

Step 3: Attend the Membership Orientation
Right after your payment is processed, Ms. Lamoste will conduct the official membership orientation briefing to welcome you and walk you through your exclusive cooperative benefits.

Thank you, and we look forward to having you as a member part of the UC Coop family!`,
  },
  {
    id: 'ann-default-2',
    title: 'System Scheduled Maintenance',
    category: 'Maintenance',
    date: '2026-07-01',
    author_name: 'Coop Admin',
    content: 'Please be advised that the portal will undergo scheduled maintenance on Saturday, 10:00 PM to 12:00 AM. Ordering and kiosk payment services may be temporarily unavailable.',
  }
];

const DEFAULT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'act-default-1',
    title: '11TH GENERAL ASSEMBLY 2026',
    subtitle: "Shaping Our Cooperative's Future Together",
    date: 'March 21, 2026',
    time: '1:00 PM - 5:00 PM',
    short_description: 'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare.',
    full_description: "The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative's strategic direction for the upcoming year.\n\nKey highlights included the approval of new sustainability initiatives, the introduction of enhanced member benefits, and the unanimous election of the new board of directors. The assembly also featured presentations on financial performance, showcasing the cooperative's growth and stability. Members actively participated in workshops focused on cooperative principles, community engagement, and future development plans. The event concluded with a commitment to transparency, member empowerment, and continued excellence in serving the UC METC community.",
    photographers: ['Vince Andrew Santoya', 'Kisses Peñera'],
    editor: 'Vince Andrew Santoya',
    gallery_images: [...GALLERY_IMAGE_URLS],
  }
];

export const AnnouncementsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'announcements' | 'activities'>(() => {
    const saved = localStorage.getItem('announcements_management_active_tab');
    return (saved === 'activities' || saved === 'announcements') ? saved : 'announcements';
  });

  const handleTabChange = (tab: 'announcements' | 'activities') => {
    setActiveTab(tab);
    localStorage.setItem('announcements_management_active_tab', tab);
  };

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Maintenance',
    image_url: '',
  });

  // Recent Activities state
  const [activities, setActivities] = useState<RecentActivityItem[]>(DEFAULT_ACTIVITIES);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<RecentActivityItem | null>(null);
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const formatDateToReadable = (isoDateStr: string): string => {
    if (!isoDateStr) return '';
    const dateObj = new Date(isoDateStr + 'T00:00:00');
    if (isNaN(dateObj.getTime())) return isoDateStr;
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const format24hTo12h = (time24: string): string => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const minute = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${minute} ${period}`;
  };

  const [activityFormData, setActivityFormData] = useState({
    title: '',
    subtitle: '',
    rawDate: '',
    date: '',
    startTime: '',
    endTime: '',
    time: '',
    short_description: '',
    full_description: '',
    photographers: '',
    editor: '',
    color_theme: 'emerald',
    gallery_images: [] as string[],
  });

  // Lightbox enlargement state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImagesList, setPreviewImagesList] = useState<string[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);

  const openImagePreview = (images: string[], index: number) => {
    setPreviewImagesList(images);
    setPreviewImageIndex(index);
    setPreviewImage(images[index]);
  };

  const handleNextPreview = () => {
    if (previewImagesList.length === 0) return;
    const nextIdx = (previewImageIndex + 1) % previewImagesList.length;
    setPreviewImageIndex(nextIdx);
    setPreviewImage(previewImagesList[nextIdx]);
  };

  const handlePrevPreview = () => {
    if (previewImagesList.length === 0) return;
    const prevIdx = (previewImageIndex - 1 + previewImagesList.length) % previewImagesList.length;
    setPreviewImageIndex(prevIdx);
    setPreviewImage(previewImagesList[prevIdx]);
  };

  // Check if user is admin or staff
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      showNotification('Access denied. Admin or staff only.', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, showNotification]);

  // Load announcements from API
  const fetchAnnouncements = async () => {
    if (!user?.id) return;
    try {
      setAnnouncements(prev => {
        if (prev.length === 0) setLoading(true);
        return prev;
      });
      const data = await apiClient.getAnnouncements(user.id);
      if (data && Array.isArray(data) && data.length > 0) {
        setAnnouncements(data);
      } else {
        setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      }
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error);
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);
    } finally {
      setLoading(false);
    }
  };

  // Load activities from API
  const fetchActivities = async () => {
    if (!user?.id) return;
    try {
      setActivities(prev => {
        if (prev.length === 0) setActivityLoading(true);
        return prev;
      });
      const data = await apiClient.getActivities(user.id);
      if (data && Array.isArray(data) && data.length > 0) {
        const transformed: RecentActivityItem[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle || '',
          date: item.date || '',
          time: item.time || '',
          short_description: item.short_description || item.shortDescription || '',
          full_description: item.full_description || item.fullDescription || item.short_description || '',
          photographers: Array.isArray(item.photographers) ? item.photographers : (typeof item.photographers === 'string' ? JSON.parse(item.photographers || '[]') : []),
          editor: item.editor || '',
          color_theme: item.color_theme || item.colorTheme || 'emerald',
          gallery_images: (() => {
            const raw = Array.isArray(item.gallery_images) ? item.gallery_images : (typeof item.gallery_images === 'string' ? JSON.parse(item.gallery_images || '[]') : []);
            const clean = raw.filter((url: string) => url && typeof url === 'string' && !url.includes('dph4hxexg') && !url.includes('doas4qcdo'));
            return clean.length > 0 ? clean : [...GALLERY_IMAGE_URLS];
          })(),
        }));
        setActivities(transformed);
      } else {
        setActivities(DEFAULT_ACTIVITIES);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities(DEFAULT_ACTIVITIES);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      fetchAnnouncements();
      fetchActivities();
    }
  }, [user]);

  const categories = ['Maintenance', 'Services', 'Inventory', 'Registration', 'Events', 'General'];

  // --- Announcement Handlers ---
  const handleCreateAnnouncement = async () => {
    if (!user?.id) return;
    if (!formData.title || !formData.content) {
      showNotification('Title and content are required', 'error');
      return;
    }

    try {
      const newAnn = await apiClient.createAnnouncement(
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          image_url: formData.image_url,
        },
        user.id
      );

      setAnnouncements([newAnn, ...announcements]);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', category: 'Maintenance', image_url: '' });
      showNotification('Announcement created successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to create announcement:', error);
      showNotification(error?.message || 'Failed to create announcement', 'error');
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!user?.id || !editingAnnouncement) return;

    try {
      const updated = await apiClient.updateAnnouncement(
        editingAnnouncement.id,
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          image_url: formData.image_url,
        },
        user.id
      );

      setAnnouncements(announcements.map(a => a.id === editingAnnouncement.id ? updated : a));
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', category: 'Maintenance', image_url: '' });
      showNotification('Announcement updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to update announcement:', error);
      showNotification(error?.message || 'Failed to update announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!user?.id) return;

    try {
      await apiClient.deleteAnnouncement(id, user.id);
      setAnnouncements(announcements.filter(a => a.id !== id));
      setShowDeleteModal(null);
      showNotification('Announcement deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to delete announcement:', error);
      showNotification(error?.message || 'Failed to delete announcement', 'error');
    }
  };

  const startEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      image_url: ann.image_url || '',
    });
  };

  const startCreateActivity = () => {
    setEditingActivity(null);
    setActivityFormData({
      title: '',
      subtitle: '',
      rawDate: '',
      date: '',
      startTime: '',
      endTime: '',
      time: '',
      short_description: '',
      full_description: '',
      photographers: '',
      editor: '',
      color_theme: 'emerald',
      gallery_images: [],
    });
    setShowActivityModal(true);
  };

  const startEditActivity = (act: RecentActivityItem) => {
    setEditingActivity(act);
    let parsedRawDate = '';
    if (act.date) {
      const parsed = new Date(act.date);
      if (!isNaN(parsed.getTime())) {
        parsedRawDate = parsed.toISOString().split('T')[0];
      }
    }
    setActivityFormData({
      title: act.title,
      subtitle: act.subtitle || '',
      rawDate: parsedRawDate,
      date: act.date || '',
      startTime: '',
      endTime: '',
      time: act.time || '',
      short_description: act.short_description || '',
      full_description: act.full_description || act.short_description || '',
      photographers: (act.photographers || []).join(', '),
      editor: act.editor || '',
      color_theme: act.color_theme || 'emerald',
      gallery_images: act.gallery_images || [],
    });
    setShowActivityModal(true);
  };

  const handleSaveActivity = async () => {
    if (!user?.id || isSavingActivity) return;
    if (!activityFormData.title.trim() || !activityFormData.short_description.trim()) {
      showNotification('Title and short description are required', 'error');
      return;
    }

    const payload = {
      title: activityFormData.title.trim(),
      subtitle: activityFormData.subtitle.trim(),
      date: activityFormData.date.trim(),
      time: activityFormData.time.trim(),
      shortDescription: activityFormData.short_description.trim(),
      fullDescription: activityFormData.full_description.trim() || activityFormData.short_description.trim(),
      photographers: activityFormData.photographers.split(',').map(s => s.trim()).filter(Boolean),
      editor: activityFormData.editor.trim(),
      colorTheme: activityFormData.color_theme,
      galleryImages: activityFormData.gallery_images,
    };

    try {
      setIsSavingActivity(true);
      if (editingActivity) {
        const updated = await apiClient.updateActivity(editingActivity.id, payload, user.id);
        setActivities(activities.map(a => a.id === editingActivity.id ? {
          ...updated,
          short_description: updated.short_description || updated.shortDescription,
          full_description: updated.full_description || updated.fullDescription,
          gallery_images: updated.gallery_images || updated.galleryImages || [],
        } : a));
        showNotification('Activity updated successfully!', 'success');
      } else {
        const created = await apiClient.createActivity(payload, user.id);
        setActivities([{
          ...created,
          short_description: created.short_description || created.shortDescription,
          full_description: created.full_description || created.fullDescription,
          gallery_images: created.gallery_images || created.galleryImages || [],
        }, ...activities]);
        showNotification('Activity created successfully!', 'success');
      }
      setShowActivityModal(false);
    } catch (error: any) {
      console.error('Failed to save activity:', error);
      showNotification(error?.message || 'Failed to save activity', 'error');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!user?.id) return;

    try {
      await apiClient.deleteActivity(id, user.id);
      setActivities(activities.filter(a => a.id !== id));
      setShowDeleteActivityModal(null);
      showNotification('Activity deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to delete activity:', error);
      showNotification(error?.message || 'Failed to delete activity', 'error');
    }
  };

  const handleAddGalleryImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingGalleryImg(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadToCloudinary(file, 'announcements');
        if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
          newUrls.push(url);
        }
      }
      if (newUrls.length > 0) {
        setActivityFormData(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, ...newUrls],
        }));
        showNotification(`${newUrls.length} photo(s) added to activity gallery!`, 'success');
      }
    } catch (error) {
      console.error('Error uploading gallery image:', error);
      showNotification('Failed to upload some gallery images', 'error');
    } finally {
      setUploadingGalleryImg(false);
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setActivityFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const categoryColors: { [key: string]: string } = {
    'Maintenance': 'border-l-orange-500 bg-orange-50/40',
    'Services': 'border-l-blue-500 bg-blue-50/40',
    'Inventory': 'border-l-green-500 bg-green-50/40',
    'Registration': 'border-l-purple-500 bg-purple-50/40',
    'Events': 'border-l-pink-500 bg-pink-50/40',
    'General': 'border-l-gray-500 bg-gray-50/40',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Content Management
            </h1>
            <p className="text-slate-600 mt-1">Publish and update announcements & recent activities for students</p>
          </div>

          <div className="flex items-center space-x-3">
            {activeTab === 'announcements' ? (
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setFormData({ title: '', content: '', category: 'Maintenance', image_url: '' });
                  setShowCreateModal(true);
                }}
                className="flex items-center space-x-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                <span>New Announcement</span>
              </button>
            ) : (
              <button
                onClick={startCreateActivity}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                <span>New Activity</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-3 mb-6 border-b border-purple-200 pb-3">
          <button
            onClick={() => handleTabChange('announcements')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-purple-600'
            }`}
          >
            <Bell size={18} />
            <span>Announcements ({announcements.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('activities')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm ${
              activeTab === 'activities'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-emerald-600'
            }`}
          >
            <Sparkles size={18} />
            <span>Recent Activities ({activities.length})</span>
          </button>
        </div>

        {/* TAB 1: SYSTEM ANNOUNCEMENTS */}
        <div className={activeTab === 'announcements' ? 'space-y-4' : 'hidden'}>
          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <Bell size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 text-lg font-bold">No announcements yet.</p>
              <p className="text-slate-500 text-sm">Click "New Announcement" to create one.</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-2xl p-6 border-l-4 ${categoryColors[announcement.category] || 'border-l-purple-500'} shadow-md hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {announcement.category}
                      </span>
                      <span className="text-slate-500 text-xs font-medium">{announcement.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{announcement.title}</h3>
                    {announcement.image_url && (
                      <div className="my-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center max-h-52 max-w-md shadow-xs">
                        <img 
                          src={announcement.image_url} 
                          alt={announcement.title} 
                          className="max-h-52 w-auto max-w-full object-contain p-1.5 hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <p className="text-slate-600 mb-3 whitespace-pre-line text-left text-sm leading-relaxed">{announcement.content}</p>
                    <p className="text-xs text-slate-400 font-medium">by {announcement.author_name}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => startEditAnnouncement(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit announcement"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete announcement"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TAB 2: RECENT ACTIVITIES */}
        <div className={activeTab === 'activities' ? 'space-y-6' : 'hidden'}>
            {activityLoading ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Loading recent activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <Sparkles size={48} className="mx-auto text-emerald-400 mb-4" />
                <p className="text-slate-600 text-lg font-bold">No recent activities found.</p>
                <p className="text-slate-500 text-sm">Click "New Activity" to publish a cooperative event.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-100 shadow-md hover:shadow-xl transition-all duration-300 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
                        <Calendar size={14} />
                        <span>{activity.date || 'Event Date'}</span>
                        {activity.time && (
                          <>
                            <span>•</span>
                            <Clock size={14} />
                            <span>{activity.time}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">{activity.title}</h3>
                      {activity.subtitle && (
                        <p className="text-emerald-700 font-bold text-sm mt-0.5">{activity.subtitle}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditActivity(activity)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-200"
                        title="Edit Activity"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setShowDeleteActivityModal(activity.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-200"
                        title="Delete Activity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <p className="text-slate-700 text-sm leading-relaxed text-justify">{activity.short_description}</p>
                    {activity.full_description && activity.full_description !== activity.short_description && (
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer font-bold text-emerald-600 hover:underline">View Full Write-up</summary>
                        <p className="mt-2 text-slate-600 leading-relaxed text-justify whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">{activity.full_description}</p>
                      </details>
                    )}
                  </div>

                  {/* Photographers / Editor Credits */}
                  {(activity.photographers?.length > 0 || activity.editor) && (
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {activity.photographers?.length > 0 && (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Camera size={14} className="text-emerald-600" />
                          <span>Photos By: {activity.photographers.join(', ')}</span>
                        </div>
                      )}
                      {activity.editor && (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <UserCheck size={14} className="text-purple-600" />
                          <span>Edited By: {activity.editor}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gallery Thumbnails with 5-photo Pagination & Enlargement */}
                  {activity.gallery_images && activity.gallery_images.length > 0 && (
                    <PaginatedGallery
                      images={activity.gallery_images}
                      onImageClick={openImagePreview}
                    />
                  )}
                </div>
              ))
            )}
          </div>

      </div>

      {/* ANNOUNCEMENT MODAL */}
      {(showCreateModal || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Image Attachment (Optional)</label>
                {formData.image_url ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden group max-h-48">
                    <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-md transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors bg-purple-50/20">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingImage(true);
                          const url = await uploadToCloudinary(file, 'announcements');
                          if (url) {
                            setFormData({ ...formData, image_url: url });
                            showNotification('Image uploaded to Cloudinary!', 'success');
                          }
                        } catch (err) {
                          console.error('Upload failed:', err);
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      className="hidden"
                      id="ann-image-file"
                    />
                    <label htmlFor="ann-image-file" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                      {uploadingImage ? (
                        <span className="text-purple-600 font-bold text-sm">Uploading...</span>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-purple-600" />
                          <span className="text-sm font-bold text-slate-800">Click to upload image</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md flex items-center justify-center space-x-2"
              >
                <Save size={18} />
                <span>{editingAnnouncement ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY CREATE / EDIT MODAL */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center space-x-2">
              <Sparkles className="text-emerald-600" size={24} />
              <span>{editingActivity ? 'Edit Activity Post' : 'New Recent Activity Post'}</span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={activityFormData.title}
                    onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={activityFormData.subtitle}
                    onChange={(e) => setActivityFormData({ ...activityFormData, subtitle: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Calendar & Time Selection Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Event Date (Calendar)
                  </label>
                  <input
                    type="date"
                    value={activityFormData.rawDate}
                    onChange={(e) => {
                      const newRaw = e.target.value;
                      const formatted = formatDateToReadable(newRaw);
                      setActivityFormData(prev => ({
                        ...prev,
                        rawDate: newRaw,
                        date: formatted || prev.date,
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-semibold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={activityFormData.startTime}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setActivityFormData(prev => {
                        const formattedStart = format24hTo12h(newStart);
                        const formattedEnd = format24hTo12h(prev.endTime);
                        const timeStr = formattedStart && formattedEnd 
                          ? `${formattedStart} - ${formattedEnd}` 
                          : (formattedStart || formattedEnd || prev.time);
                        return {
                          ...prev,
                          startTime: newStart,
                          time: timeStr,
                        };
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-semibold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={activityFormData.endTime}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setActivityFormData(prev => {
                        const formattedStart = format24hTo12h(prev.startTime);
                        const formattedEnd = format24hTo12h(newEnd);
                        const timeStr = formattedStart && formattedEnd 
                          ? `${formattedStart} - ${formattedEnd}` 
                          : (formattedEnd || formattedStart || prev.time);
                        return {
                          ...prev,
                          endTime: newEnd,
                          time: timeStr,
                        };
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-semibold cursor-pointer"
                  />
                </div>
              </div>

              {/* Formatted Date & Time Live Preview */}
              {(activityFormData.date || activityFormData.time) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-emerald-600" />
                    <span>{activityFormData.date || 'No date set'}</span>
                    {activityFormData.time && (
                      <>
                        <span>•</span>
                        <Clock size={16} className="text-emerald-600" />
                        <span>{activityFormData.time}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-600 uppercase font-semibold">Live Preview</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Short Description *</label>
                <textarea
                  value={activityFormData.short_description}
                  onChange={(e) => setActivityFormData({ ...activityFormData, short_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Write-up / Extended Description</label>
                <textarea
                  value={activityFormData.full_description}
                  onChange={(e) => setActivityFormData({ ...activityFormData, full_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Photographers (Comma-separated)</label>
                  <input
                    type="text"
                    value={activityFormData.photographers}
                    onChange={(e) => setActivityFormData({ ...activityFormData, photographers: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Editor(s) (Comma-separated)</label>
                  <input
                    type="text"
                    value={activityFormData.editor}
                    onChange={(e) => setActivityFormData({ ...activityFormData, editor: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Event Card Color Theme
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'emerald', label: 'Emerald', hex: '#16a34a', borderClass: 'border-[#16a34a]' },
                    { id: 'purple', label: 'Purple', hex: '#7c3aed', borderClass: 'border-[#7c3aed]' },
                    { id: 'blue', label: 'Blue', hex: '#2563eb', borderClass: 'border-[#2563eb]' },
                    { id: 'amber', label: 'Amber', hex: '#d97706', borderClass: 'border-[#d97706]' },
                    { id: 'rose', label: 'Rose', hex: '#e11d48', borderClass: 'border-[#e11d48]' },
                    { id: 'slate', label: 'Dark Slate', hex: '#1e293b', borderClass: 'border-[#1e293b]' },
                  ].map((theme) => {
                    const isSelected = (activityFormData.color_theme || 'emerald') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setActivityFormData(prev => ({ ...prev, color_theme: theme.id }))}
                        className={`flex items-center space-x-2 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected ? `${theme.borderClass} bg-slate-50 shadow-xs ring-2 ring-emerald-400/30` : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full shadow-xs shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: theme.hex }}>
                          {isSelected && '✓'}
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gallery Images Uploader */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Gallery Photos ({activityFormData.gallery_images.length})
                </label>

                {/* Upload Button */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingGalleryImg}
                    onChange={handleAddGalleryImageFile}
                    className="hidden"
                    id="activity-gallery-file-input"
                  />
                  <label
                    htmlFor="activity-gallery-file-input"
                    className="inline-flex items-center space-x-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-all shadow-xs"
                  >
                    {uploadingGalleryImg ? (
                      <span className="animate-pulse">Uploading photos to Cloudinary...</span>
                    ) : (
                      <>
                        <ImageIcon size={16} />
                        <span>Upload Gallery Photos</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Gallery Images List */}
                {activityFormData.gallery_images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                    {activityFormData.gallery_images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-slate-900 border border-slate-300">
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-all shadow-md"
                          title="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowActivityModal(false)}
                disabled={isSavingActivity}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivity}
                disabled={isSavingActivity}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSavingActivity ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{editingActivity ? 'Updating Post...' : 'Publishing Activity...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{editingActivity ? 'Update Activity' : 'Publish Activity'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {(showDeleteModal || showDeleteActivityModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Confirm Delete</h2>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => { setShowDeleteModal(null); setShowDeleteActivityModal(null); }}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteModal) handleDeleteAnnouncement(showDeleteModal);
                  if (showDeleteActivityModal) handleDeleteActivity(showDeleteActivityModal);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-all z-10"
            title="Close"
          >
            <X size={24} />
          </button>

          {previewImagesList.length > 1 && (
            <>
              <button
                onClick={handlePrevPreview}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all z-10 active:scale-95"
                title="Previous Image"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={handleNextPreview}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all z-10 active:scale-95"
                title="Next Image"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={previewImage}
              alt="Enlarged Preview"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            {previewImagesList.length > 0 && (
              <span className="text-white/80 text-xs font-semibold mt-3 bg-black/50 px-3.5 py-1 rounded-full backdrop-blur-md">
                Image {previewImageIndex + 1} of {previewImagesList.length}
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
