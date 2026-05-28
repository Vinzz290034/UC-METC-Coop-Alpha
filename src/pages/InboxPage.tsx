import React, { useState, useEffect } from 'react';
import { Mail, Send, Trash2, Star, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { AppDataSync } from '../store/appDataSync';
import type { Message } from '../types';
import { apiClient } from '../services/api';

interface SystemUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const InboxPage: React.FC = () => {
  const { user } = useAuth();
  const { messages, removeMessage, markAsRead, toggleFavorite } = useAppStore();
  const { showNotification, setSidebarOpen } = useUIStore();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const [replyData, setReplyData] = useState({ subject: '', content: '' });
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [animatingStarId, setAnimatingStarId] = useState<string | null>(null);
  const [composeData, setComposeData] = useState({
    recipientType: 'admin' as 'admin' | 'staff' | 'all_users' | 'all_members' | 'all_both' | 'specific_person',
    recipientId: '',
    subject: '',
    content: '',
  });

  // Load all users on mount for name lookups
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = (await apiClient.getUsersForMessaging()) as { users: SystemUser[] };
        const users = response.users || [];
        setAllUsers(users);
      } catch (error) {
        showNotification('Failed to load users', 'error');
      }
    };

    if (allUsers.length === 0) {
      loadUsers();
    }
  }, [allUsers.length, showNotification]);

  // Load messages from API on mount
  useEffect(() => {
    if (user?.id) {
      // Load both inbox and sent messages
      AppDataSync.loadMessagesFromAPI(user.id, 'inbox');
      AppDataSync.loadMessagesFromAPI(user.id, 'sent');
    }
  }, [user?.id]);

  // Auto-reload messages every 3 seconds to catch new messages
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      AppDataSync.loadMessagesFromAPI(user.id, 'inbox');
      AppDataSync.loadMessagesFromAPI(user.id, 'sent');
    }, 3000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const inboxMessages = messages.filter(msg => {
    // Show messages in inbox folder
    if (msg.folder === 'inbox') {
      // Include messages where recipient is this user by ID, or messages sent to this user's role
      return msg.recipientId === user?.id || msg.recipientRole === user?.role;
    }
    // Also include sent messages TO this user (for specific person sends)
    // This catches messages where the backend might not have properly set folder='inbox' for the recipient
    if (msg.folder === 'sent' && msg.recipientId === user?.id) {
      return true;
    }
    return false;
  });
  const sentMessages = messages.filter(msg => msg.folder === 'sent' && msg.senderId === user?.id);
  const displayMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;
  const unreadCount = inboxMessages.filter(m => !m.isRead).length;

  const handleDelete = async (id: string) => {
    try {
      // Delete from backend first
      if (user?.id) {
        await apiClient.deleteMessage(id, user.id);
      }
      // Then remove from local store
      removeMessage(id);
      setSelectedMessage(null);
      showNotification('Message deleted', 'success');
    } catch (error) {
      showNotification('Failed to delete message', 'error');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // Update backend first
      if (user?.id) {
        await apiClient.markMessageAsRead(id, user.id);
      }
      // Then update local state
      markAsRead(id);
    } catch {
      // Still update local state even if API call fails
      markAsRead(id);
    }
  };

  const handleReply = async () => {
    if (!replyData.content.trim()) {
      showNotification('Please enter a reply message', 'error');
      return;
    }

    if (!selectedMessage || !user?.id) return;

    try {
      // Look up sender's actual name
      let senderActualName = selectedMessage.senderName;
      if (selectedMessage.senderId) {
        const sender = allUsers.find(u => u.id === selectedMessage.senderId);
        if (sender) {
          senderActualName = `${sender.first_name} ${sender.last_name}`;
        }
      }

      const messageData = {
        recipientType: selectedMessage.senderRole as any,
        recipientId: selectedMessage.senderId,
        recipientName: senderActualName,
        recipientRole: selectedMessage.senderRole,
        subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
        content: replyData.content,
      };

      await AppDataSync.sendMessageViaAPI(messageData, user.id);
      showNotification(`Reply sent to ${senderActualName}`, 'success');
      setReplyingToMessageId(null);
      setReplyData({ subject: '', content: '' });
    } catch (err: any) {
      showNotification('Failed to send reply', 'error');
      console.error('Reply error:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!composeData.subject.trim() || !composeData.content.trim()) {
      showNotification('Please fill in subject and message', 'error');
      return;
    }

    if (composeData.recipientType === 'specific_person' && !composeData.recipientId) {
      showNotification('Please select a recipient', 'error');
      return;
    }

    if (!user?.id) {
      showNotification('User not authenticated', 'error');
      return;
    }

    try {
      // Get recipient name and role based on recipient type
      let recipientName = '';
      let recipientRole = '';
      
      if (composeData.recipientType === 'specific_person') {
        const recipient = allUsers.find(u => u.id === composeData.recipientId);
        recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : '';
        recipientRole = recipient?.role || '';
      } else {
        // For role-based sends (admin, staff, etc.)
        recipientRole = composeData.recipientType;
        if (composeData.recipientType === 'all_users') {
          recipientName = 'All Users';
          recipientRole = 'user';
        } else if (composeData.recipientType === 'all_members') {
          recipientName = 'All Members';
          recipientRole = 'member';
        } else if (composeData.recipientType === 'all_both') {
          recipientName = 'All Users & Members';
          recipientRole = 'all_both';
        } else {
          // For single roles like 'admin', 'staff'
          recipientName = '';
          recipientRole = composeData.recipientType;
        }
      }

      const messageData = {
        recipientType: composeData.recipientType,
        recipientId: composeData.recipientId,
        recipientName: recipientName,
        recipientRole: recipientRole,
        subject: composeData.subject,
        content: composeData.content,
      };

      await AppDataSync.sendMessageViaAPI(messageData, user.id);
      
      // Refresh messages immediately after sending
      setTimeout(() => {
        AppDataSync.loadMessagesFromAPI(user.id, 'inbox');
        AppDataSync.loadMessagesFromAPI(user.id, 'sent');
      }, 500);
      
      // Determine recipient count for feedback
      let recipientCount = 1;
      if (composeData.recipientType === 'all_users') {
        recipientCount = allUsers.filter(u => u.role === 'user').length;
        showNotification(`Message sent to ${recipientCount} users`, 'success');
      } else if (composeData.recipientType === 'all_members') {
        recipientCount = allUsers.filter(u => u.role === 'member').length;
        showNotification('Message sent to all members', 'success');
      } else if (composeData.recipientType === 'all_both') {
        recipientCount = allUsers.filter(u => u.role === 'user' || u.role === 'member').length;
        showNotification(`Message sent to ${recipientCount} users and members`, 'success');
      } else if (composeData.recipientType === 'specific_person') {
        showNotification(`Message sent to ${recipientName}`, 'success');
      } else {
        showNotification(`Message sent to ${composeData.recipientType}`, 'success');
      }

      setShowCompose(false);
      setActiveTab('sent');
      setComposeData({ recipientType: 'admin', recipientId: '', subject: '', content: '' });
    } catch (err: any) {
      showNotification('Failed to send message', 'error');
      console.error('Send message error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 p-6 animate-slide-in-right">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-black">Inbox</h1>
              </div>
              <p className="text-black">
                {activeTab === 'inbox' ? `${unreadCount} unread messages` : `${sentMessages.length} sent messages`}
              </p>
            </div>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
            >
              <Plus size={20} />
              Compose
            </button>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-black">Inbox</h1>
            </div>
            <p className="text-black text-sm mb-3">
              {activeTab === 'inbox' ? `${unreadCount} unread messages` : `${sentMessages.length} sent messages`}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg text-sm"
              >
                <Plus size={18} />
                Compose
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'inbox'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'sent'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {displayMessages.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{activeTab === 'inbox' ? 'No messages' : 'No sent messages'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {displayMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead && activeTab === 'inbox') {
                          handleMarkAsRead(message.id);
                        }
                      }}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition ${
                        selectedMessage?.id === message.id
                          ? 'bg-purple-50 border-l-4 border-purple-600'
                          : ''
                      } ${!message.isRead && activeTab === 'inbox' ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`font-semibold truncate ${
                                !message.isRead
                                  ? 'text-slate-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              {activeTab === 'inbox' 
                                ? (() => {
                                    // Try to look up sender's actual name from allUsers
                                    if (message.senderId) {
                                      const sender = allUsers.find(u => u.id === message.senderId);
                                      if (sender) return `${sender.first_name} ${sender.last_name}`;
                                    }
                                    // Fallback to senderName
                                    return message.senderName || 'Unknown';
                                  })()
                                : (() => {
                                    if (message.recipientName) return message.recipientName;
                                    if (message.recipientId) {
                                      const recipient = allUsers.find(u => u.id === message.recipientId);
                                      return recipient ? `${recipient.first_name} ${recipient.last_name}` : message.recipientRole;
                                    }
                                    return message.recipientRole || 'Unknown';
                                  })()
                              }
                            </p>
                            {message.isFavorite && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 truncate">
                            {message.subject}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                {/* Message Header */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {(() => {
                        // Helper to get recipient/sender name
                        let displayName = '';
                        if (activeTab === 'sent') {
                          if (selectedMessage.recipientName) {
                            displayName = selectedMessage.recipientName;
                          } else if (selectedMessage.recipientId) {
                            const recipient = allUsers.find(u => u.id === selectedMessage.recipientId);
                            displayName = recipient ? `${recipient.first_name} ${recipient.last_name}` : selectedMessage.recipientRole || 'Unknown';
                          } else {
                            displayName = selectedMessage.recipientRole || 'Unknown';
                          }
                        } else {
                          // For inbox - look up sender's actual name
                          if (selectedMessage.senderId) {
                            const sender = allUsers.find(u => u.id === selectedMessage.senderId);
                            if (sender) {
                              displayName = `${sender.first_name} ${sender.last_name}`;
                            } else {
                              displayName = selectedMessage.senderName || 'Unknown';
                            }
                          } else {
                            displayName = selectedMessage.senderName || 'Unknown';
                          }
                        }
                        return (
                          <>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                              {selectedMessage.subject}
                            </h2>
                            <p className="text-slate-600 mb-1">
                              {activeTab === 'sent' ? 'To:' : 'From:'} <span className="font-semibold">
                                {displayName}
                              </span>
                              <span className="text-xs text-slate-500 ml-2">({activeTab === 'sent' ? selectedMessage.recipientRole : selectedMessage.senderRole})</span>
                            </p>
                            <p className="text-sm text-slate-500">
                              {new Date(selectedMessage.timestamp).toLocaleString()}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={async () => {
                        if (!user?.id || !selectedMessage) return;
                        try {
                          setAnimatingStarId(selectedMessage.id);
                          await toggleFavorite(selectedMessage.id, user.id);
                          showNotification(
                            selectedMessage.isFavorite ? 'Removed from favorites' : 'Added to favorites',
                            'success'
                          );
                          // Clear animation after it completes
                          setTimeout(() => setAnimatingStarId(null), 600);
                        } catch (error) {
                          showNotification('Failed to toggle favorite', 'error');
                          setAnimatingStarId(null);
                        }
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <motion.div
                        animate={
                          animatingStarId === selectedMessage?.id
                            ? { scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] }
                            : { scale: 1, rotate: 0 }
                        }
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            selectedMessage.isFavorite
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-400'
                          }`}
                        />
                      </motion.div>
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="mb-6">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setReplyingToMessageId(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all hover:scale-105"
                  >
                    <Send className="w-4 h-4" />
                    Reply
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>

                {/* Reply Form */}
                {replyingToMessageId === selectedMessage.id && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Reply to {(() => {
                        if (selectedMessage.senderId) {
                          const sender = allUsers.find(u => u.id === selectedMessage.senderId);
                          if (sender) return `${sender.first_name} ${sender.last_name}`;
                        }
                        return selectedMessage.senderName || 'Unknown';
                      })()}
                    </h3>
                    <textarea
                      value={replyData.content}
                      onChange={(e) => setReplyData({ ...replyData, content: e.target.value })}
                      placeholder="Type your reply here..."
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none mb-4"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleReply}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                      <button
                        onClick={() => {
                          setReplyingToMessageId(null);
                          setReplyData({ subject: '', content: '' });
                        }}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 text-lg">
                  {displayMessages.length === 0
                    ? 'No messages to display'
                    : 'Select a message to read'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-scale-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="text-2xl font-bold text-white">Compose Message</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Send to:
                </label>
                <select
                  value={composeData.recipientType}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      recipientType: e.target.value as any,
                      recipientId: '',
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {user?.role === 'admin' || user?.role === 'staff' ? (
                    <>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="all_users">All Users</option>
                      <option value="all_members">All Members</option>
                      <option value="all_both">All Users & Members</option>
                      <option value="specific_person">Specific Person...</option>
                    </>
                  ) : (
                    <>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="specific_person">Specific Person...</option>
                    </>
                  )}
                </select>
              </div>

              {/* Specific Person Selector */}
              {composeData.recipientType === 'specific_person' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Select Recipient:
                  </label>
                  <select
                    value={composeData.recipientId}
                    onChange={(e) =>
                      setComposeData({
                        ...composeData,
                        recipientId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">-- Select a person --</option>
                    {(() => {
                      const filteredUsers = allUsers.filter((u) => u.id !== user?.id && u.role !== 'admin' && u.role !== 'staff');
                      console.log('[InboxPage] All users:', allUsers.length, allUsers);
                      console.log('[InboxPage] Current user:', user?.id, user?.role);
                      console.log('[InboxPage] Filtered users for dropdown:', filteredUsers.length, filteredUsers);
                      return filteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name}
                        </option>
                      ));
                    })()}
                  </select>
                  {allUsers.filter((u) => u.id !== user?.id && u.role !== 'admin' && u.role !== 'staff').length === 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      No users or members available. Please create user accounts first.
                    </p>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subject:
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) =>
                    setComposeData({ ...composeData, subject: e.target.value })
                  }
                  placeholder="Enter message subject"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Message:
                </label>
                <textarea
                  value={composeData.content}
                  onChange={(e) =>
                    setComposeData({ ...composeData, content: e.target.value })
                  }
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
