import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send, Trash2, Star, X, Plus, ChevronLeft, ChevronDown } from 'lucide-react';
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
  const navigate = useNavigate();
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
  const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false);
  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');

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
  // Sort messages so favorites always appear at the top
  const sortedInbox = [...inboxMessages].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });
  const sortedSent = [...sentMessages].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });
  const displayMessages = activeTab === 'inbox' ? sortedInbox : sortedSent;
  const unreadCount = inboxMessages.filter(m => !m.isRead).length;

  // Keep selectedMessage in sync with the store (so star updates are instant)
  useEffect(() => {
    if (selectedMessage) {
      const updated = messages.find(m => m.id === selectedMessage.id);
      if (updated && updated.isFavorite !== selectedMessage.isFavorite) {
        setSelectedMessage(updated);
      }
    }
  }, [messages, selectedMessage]);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-4 sm:py-8 px-4 animate-slide-in-right">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white rounded-xl transition-all duration-200 active:scale-95"
                aria-label="Go back"
              >
                <ChevronLeft size={24} className="text-slate-700" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-wide uppercase">INBOX</h1>
                <p className="text-slate-700 font-medium">
                  {activeTab === 'inbox' ? `${unreadCount} unread messages` : `${sentMessages.length} sent messages`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all duration-200 active:scale-95 shadow-sm border border-purple-100"
            >
              <Plus size={18} />
              Compose
            </button>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
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
                <h1 className="text-xl font-bold text-slate-900 tracking-wide leading-none">INBOX</h1>
                <p className="text-[11px] text-slate-700 mt-1">
                  {activeTab === 'inbox' ? `${unreadCount} unread` : `${sentMessages.length} sent`} messages
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-purple-100 rounded-xl shadow-sm hover:bg-purple-50 hover:shadow-md transition-all duration-200 active:scale-95 text-xs font-bold text-purple-600"
            >
              <Plus size={16} />
              Compose
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-3 sm:gap-4">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95 shadow-sm ${
              activeTab === 'inbox'
                ? 'bg-white text-purple-600 border border-purple-50/50'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95 shadow-sm ${
              activeTab === 'sent'
                ? 'bg-white text-purple-600 border border-purple-50/50'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className={`lg:col-span-1 ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-2xl border border-slate-100/50 shadow-md overflow-hidden">
              {displayMessages.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
                  <p className="font-semibold text-slate-500 text-sm sm:text-base">{activeTab === 'inbox' ? 'No messages' : 'No sent messages'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead && activeTab === 'inbox') {
                          handleMarkAsRead(message.id);
                        }
                      }}
                      className={`p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 transition-all duration-200 ${
                        selectedMessage?.id === message.id
                          ? 'bg-purple-50/80 border-l-4 border-purple-600'
                          : ''
                      } ${!message.isRead && activeTab === 'inbox' ? 'bg-blue-50/60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p
                              className={`text-xs sm:text-sm font-bold truncate ${
                                !message.isRead && activeTab === 'inbox'
                                  ? 'text-slate-900 font-extrabold'
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
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {message.isFavorite && (
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              )}
                              <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                {formatDate(message.timestamp)}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 truncate font-semibold">
                            {message.subject}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {message.content}
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
          <div className={`lg:col-span-2 ${selectedMessage ? 'block' : 'hidden lg:block'}`}>
            {selectedMessage ? (
              <div className="bg-white rounded-2xl border border-slate-100/50 shadow-md p-4 sm:p-6 md:p-8 flex flex-col">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="lg:hidden mb-4 self-start flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all duration-200 shadow-sm border border-slate-200/30"
                >
                  <ChevronLeft size={15} />
                  Back to Messages
                </button>

                {/* Message Header */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
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
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-2 leading-snug break-words">
                              {selectedMessage.subject}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 mb-1">
                              {activeTab === 'sent' ? 'To:' : 'From:'} <span className="font-bold text-slate-800">
                                {displayName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg ml-2 uppercase font-bold tracking-wider">
                                {activeTab === 'sent' ? selectedMessage.recipientRole : selectedMessage.senderRole}
                              </span>
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-500">
                              {new Date(selectedMessage.timestamp).toLocaleString()}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    
                    <button
                      onClick={async () => {
                        if (!user?.id || !selectedMessage) return;
                        const wasFavorite = selectedMessage.isFavorite;
                        // Optimistically update the selected message for instant star feedback
                        setSelectedMessage({ ...selectedMessage, isFavorite: !wasFavorite });
                        setAnimatingStarId(selectedMessage.id);
                        try {
                          await toggleFavorite(selectedMessage.id, user.id);
                          showNotification(
                            wasFavorite ? 'Removed from favorites' : 'Added to favorites',
                            'success'
                          );
                          // Clear animation after it completes
                          setTimeout(() => setAnimatingStarId(null), 600);
                        } catch (error) {
                          // Revert optimistic update on the selected message
                          setSelectedMessage({ ...selectedMessage, isFavorite: wasFavorite });
                          showNotification('Failed to toggle favorite', 'error');
                          setAnimatingStarId(null);
                        }
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-90 flex-shrink-0"
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
                          className={`w-5.5 h-5.5 ${
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
                <div className="mb-6 flex-1 min-h-[150px]">
                  <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-auto">
                  <button
                    onClick={() => setReplyingToMessageId(selectedMessage.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 active:scale-95 text-xs sm:text-sm rounded-xl font-bold transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>

                {/* Reply Form */}
                {replyingToMessageId === selectedMessage.id && (
                  <div className="mt-6 p-4 bg-purple-50/70 rounded-2xl border border-purple-100">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-3">
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
                      className="w-full px-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none mb-3 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleReply}
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all duration-200 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingToMessageId(null);
                          setReplyData({ subject: '', content: '' });
                        }}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100/50 shadow-md p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Mail className="w-16 h-16 mb-4 text-purple-200 animate-pulse" />
                <p className="text-slate-500 font-semibold text-base sm:text-lg">
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
            <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Compose Message</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="w-9 h-9 flex items-center justify-center hover:bg-white/20 rounded-full transition-all duration-200 active:scale-90"
              >
                <X className="w-5.5 h-5.5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Recipient */}
              <div className="relative">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                  Send to:
                </label>
                <button
                  type="button"
                  onClick={() => setRecipientDropdownOpen(!recipientDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-left font-semibold text-slate-700"
                >
                  <span>
                    {(() => {
                      switch (composeData.recipientType) {
                        case 'admin': return 'Admin';
                        case 'staff': return 'Staff';
                        case 'all_users': return 'All Users';
                        case 'all_members': return 'All Members';
                        case 'all_both': return 'All Users & Members';
                        case 'specific_person': return 'Specific Person...';
                        default: return 'Select recipient type';
                      }
                    })()}
                  </span>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${recipientDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {recipientDropdownOpen && (
                  <>
                    {/* Overlay to close the dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setRecipientDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl z-20 py-1.5 animate-scale-in max-h-60 overflow-y-auto">
                      {(user?.role === 'admin' || user?.role === 'staff'
                        ? [
                            { value: 'admin', label: 'Admin' },
                            { value: 'staff', label: 'Staff' },
                            { value: 'all_users', label: 'All Users' },
                            { value: 'all_members', label: 'All Members' },
                            { value: 'all_both', label: 'All Users & Members' },
                            { value: 'specific_person', label: 'Specific Person...' }
                          ]
                        : [
                            { value: 'admin', label: 'Admin' },
                            { value: 'staff', label: 'Staff' },
                            { value: 'specific_person', label: 'Specific Person...' }
                          ]
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setComposeData({
                              ...composeData,
                              recipientType: option.value as any,
                              recipientId: '',
                            });
                            setRecipientDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors duration-150 ${
                            composeData.recipientType === option.value
                              ? 'bg-purple-50 text-purple-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Specific Person Selector */}
              {composeData.recipientType === 'specific_person' && (
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    Select Recipient:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonDropdownOpen(!personDropdownOpen);
                      setPersonSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-left font-semibold text-slate-700"
                  >
                    <span>
                      {(() => {
                        const recipient = allUsers.find(u => u.id === composeData.recipientId);
                        return recipient ? `${recipient.first_name} ${recipient.last_name}` : '-- Select a person --';
                      })()}
                    </span>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${personDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {personDropdownOpen && (
                    <>
                      {/* Overlay to close the dropdown */}
                      <div className="fixed inset-0 z-10" onClick={() => setPersonDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl z-20 py-1.5 animate-scale-in max-h-60 overflow-y-auto">
                        {/* Search Input Box */}
                        <div className="sticky top-0 bg-white z-10 px-3 py-1.5 border-b border-slate-100">
                          <input
                            type="text"
                            value={personSearchQuery}
                            onChange={(e) => setPersonSearchQuery(e.target.value)}
                            placeholder="Search person..."
                            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                            className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 font-medium text-slate-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setComposeData({ ...composeData, recipientId: '' });
                            setPersonDropdownOpen(false);
                            setPersonSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-slate-400 hover:bg-slate-50 font-medium"
                        >
                          -- Select a person --
                        </button>
                        {(() => {
                          const baseFiltered = allUsers.filter((u) => u.id !== user?.id && u.role !== 'admin' && u.role !== 'staff');
                          const query = personSearchQuery.toLowerCase().trim();
                          const searchedUsers = query 
                            ? baseFiltered.filter(u => 
                                `${u.first_name} ${u.last_name}`.toLowerCase().includes(query) ||
                                (u.email && u.email.toLowerCase().includes(query))
                              )
                            : baseFiltered;

                          if (searchedUsers.length === 0) {
                            return (
                              <div className="px-4 py-3 text-xs sm:text-sm text-slate-400 text-center font-medium">
                                No matching people found
                              </div>
                            );
                          }

                          return searchedUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setComposeData({
                                  ...composeData,
                                  recipientId: u.id,
                                });
                                setPersonDropdownOpen(false);
                                setPersonSearchQuery('');
                              }}
                              className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors duration-150 ${
                                composeData.recipientId === u.id
                                  ? 'bg-purple-50 text-purple-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{u.first_name} {u.last_name}</span>
                                <span className="text-[10px] text-slate-400 font-normal leading-none capitalize">{u.role}</span>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                  {allUsers.filter((u) => u.id !== user?.id && u.role !== 'admin' && u.role !== 'staff').length === 0 && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      No users or members available. Please create user accounts first.
                    </p>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                  Subject:
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) =>
                    setComposeData({ ...composeData, subject: e.target.value })
                  }
                  placeholder="Enter message subject"
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                  Message:
                </label>
                <textarea
                  value={composeData.content}
                  onChange={(e) =>
                    setComposeData({ ...composeData, content: e.target.value })
                  }
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-300 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all duration-200 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
