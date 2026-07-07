import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, Bell } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface Announcement {
  id: string;
  title: string;
  date: string;
  author_name: string;
  content: string;
  category: string;
}

export const AnnouncementsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Maintenance',
  });

  // Check if user is admin or staff
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      showNotification('Access denied. Admin or staff only.', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, showNotification]);

  // Load announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const data = await apiClient.getAnnouncements(user.id);
        setAnnouncements(data);
      } catch (error: any) {
        console.error('Failed to fetch announcements:', error);
        showNotification('Failed to load announcements', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === 'admin' || user?.role === 'staff') {
      fetchAnnouncements();
    }
  }, [user, showNotification]);

  const categories = ['Maintenance', 'Services', 'Inventory', 'Registration', 'Events', 'General'];

  const handleCreate = async () => {
    if (!formData.title || !formData.content || !user?.id) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      const newAnnouncement = await apiClient.createAnnouncement({
        title: formData.title,
        content: formData.content,
        category: formData.category,
      }, user.id);

      setAnnouncements([newAnnouncement, ...announcements]);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', category: 'Maintenance' });
      showNotification('Announcement created successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to create announcement:', error);
      showNotification(error?.message || 'Failed to create announcement', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement || !formData.title || !formData.content || !user?.id) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      const updatedAnnouncement = await apiClient.updateAnnouncement(
        editingAnnouncement.id,
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
        },
        user.id
      );

      setAnnouncements(announcements.map(ann => 
        ann.id === editingAnnouncement.id ? updatedAnnouncement : ann
      ));
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', category: 'Maintenance' });
      showNotification('Announcement updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to update announcement:', error);
      showNotification(error?.message || 'Failed to update announcement', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;

    try {
      await apiClient.deleteAnnouncement(id, user.id);
      setAnnouncements(announcements.filter(ann => ann.id !== id));
      setShowDeleteModal(null);
      showNotification('Announcement deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to delete announcement:', error);
      showNotification(error?.message || 'Failed to delete announcement', 'error');
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
    });
  };

  const cancelEdit = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '', category: 'Maintenance' });
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
    <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Announcements Management
            </h1>
            <p className="text-slate-600 mt-2">Create and manage system announcements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 shadow-lg hover:scale-105"
          >
            <Plus size={20} />
            <span>New Announcement</span>
          </button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Bell size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 text-lg">No announcements yet.</p>
              <p className="text-slate-500 text-sm">Click "New Announcement" to create one.</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl p-6 border-l-4 ${categoryColors[announcement.category]} shadow-md hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {announcement.category}
                      </span>
                      <span className="text-slate-500 text-sm">{announcement.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{announcement.title}</h3>
                    <p className="text-slate-600 mb-3 whitespace-pre-line text-left">{announcement.content}</p>
                    <p className="text-sm text-slate-500">by {announcement.author_name}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => startEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content"
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  cancelEdit();
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={editingAnnouncement ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
              >
                <Save size={18} />
                <span>{editingAnnouncement ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Delete Announcement</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
