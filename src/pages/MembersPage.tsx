import React, { useState, useEffect } from 'react';
import { Check, X, Edit2, Mail, Clock, Send, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { apiClient } from '../services/api';
import { formatNamePart, formatFullName } from '../utils/nameFormatter';

interface PendingRequest {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  requestedAt?: string;
  created_at?: string;
  status: 'pending';
}

interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  membership_status: string;
  status: string;
  created_at: string;
  membership_approved_at?: string;
}

interface EmailState {
  isOpen: boolean;
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  isSending: boolean;
  animatingIcon: boolean;
}

interface EditState {
  isOpen: boolean;
  member: ApiUser | null;
  first_name: string;
  last_name: string;
  email: string;
  isSaving: boolean;
  isDeleting: boolean;
  animatingIcon: boolean;
}

interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  actionType?: 'delete';
}

interface MessageModal {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const MembersPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { } = useAppStore();
  const { showNotification } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [databaseMembers, setDatabaseMembers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  
  // Email modal state
  const [emailState, setEmailState] = useState<EmailState>({
    isOpen: false,
    to: '',
    recipientName: '',
    subject: '',
    body: '',
    isSending: false,
    animatingIcon: false
  });

  // Edit modal state
  const [editState, setEditState] = useState<EditState>({
    isOpen: false,
    member: null,
    first_name: '',
    last_name: '',
    email: '',
    isSaving: false,
    isDeleting: false,
    animatingIcon: false
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
    onCancel: () => {},
    isLoading: false
  });

  // Message modal state
  const [messageModal, setMessageModal] = useState<MessageModal>({
    isOpen: false,
    message: '',
    type: 'success',
    onClose: () => {}
  });

  // Load members from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load pending membership requests
        try {
          const requestsResponse = await apiClient.getPendingMembershipRequests() as any;
          const requests = requestsResponse.requests || [];
          setPendingRequests(requests);
        } catch (err) {
          console.error('Failed to load pending requests:', err);
        }

        // Load active members
        try {
          const response = await apiClient.getUsers() as any;
          const users = Array.isArray(response) ? response : (response.users || response);
          const members = users.filter((user: ApiUser) => user.membership_status === 'approved');
          setDatabaseMembers(members);
        } catch (err) {
          console.error('Failed to load members:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApproveMember = async (request: PendingRequest) => {
    try {
      setApprovingId(request.id);
      
      console.log('=== APPROVE MEMBERSHIP DEBUG ===');
      console.log('Request object:', JSON.stringify(request, null, 2));
      console.log('Request ID:', request.id);
      
      // Approve the membership request through the API
      console.log('Calling approveMembershipRequest with ID:', request.id);
      
      const response = await apiClient.approveMembershipRequest(request.id);
      console.log('Approval response:', response);
      
      // Remove from pending requests in state
      const updated = pendingRequests.filter((r) => r.id !== request.id);
      setPendingRequests(updated);
      console.log('Removed request from pending list');
      
      // Refresh members list to show the newly approved member
      try {
        const usersResponse = await apiClient.getMembers() as any;
        console.log('getMembers API response:', usersResponse);
        
        const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.users || usersResponse);
        console.log('Parsed users array:', users);
        
        const members = users.filter((user: ApiUser) => user.membership_status === 'approved');
        console.log('Filtered members (membership_status=approved):', members);
        setDatabaseMembers(members);
      } catch (refreshError) {
        console.error('Failed to refresh members:', refreshError);
        throw refreshError;
      }
      
      console.log('=== APPROVAL SUCCESS ===');
      showNotification(`${formatNamePart(request.name)} has been approved as a member!`, 'success');
    } catch (error: any) {
      console.error('APPROVAL ERROR - Full error object:', error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error toString:', error?.toString());
      
      let errorMsg = 'Unknown error occurred';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (error?.error) {
        errorMsg = error.error;
      }
      
      console.error('Extracted error message:', errorMsg);
      showNotification(`Failed to approve membership: ${errorMsg}`, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectMember = async (requestId: string) => {
    try {
      // Reject the membership request through the API
      await apiClient.rejectMembershipRequest(requestId);
      
      // Remove from pending requests
      const updated = pendingRequests.filter((r) => r.id !== requestId);
      setPendingRequests(updated);
      
      showNotification('Membership request rejected', 'success');
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      showNotification(`Failed to reject membership request: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  // Icon animation handlers
  const animateIcon = (type: 'email' | 'edit') => {
    if (type === 'email') {
      setEmailState(prev => ({ ...prev, animatingIcon: true }));
      setTimeout(() => setEmailState(prev => ({ ...prev, animatingIcon: false })), 300);
    } else {
      setEditState(prev => ({ ...prev, animatingIcon: true }));
      setTimeout(() => setEditState(prev => ({ ...prev, animatingIcon: false })), 300);
    }
  };

  // Email handlers
  const openEmailModal = (memberEmail: string, memberName: string) => {
    animateIcon('email');
    setEmailState({
      isOpen: true,
      to: memberEmail,
      recipientName: memberName,
      subject: `Message to ${memberName}`,
      body: '',
      isSending: false,
      animatingIcon: false
    });
  };

  const closeEmailModal = () => {
    setEmailState({
      isOpen: false,
      to: '',
      recipientName: '',
      subject: '',
      body: '',
      isSending: false,
      animatingIcon: false
    });
  };

  const sendEmail = async () => {
    // Validate required fields
    if (!emailState.subject) {
      showNotification('Please fill in the subject', 'error');
      return;
    }
    if (!emailState.body) {
      showNotification('Please fill in the body', 'error');
      return;
    }

    try {
      setEmailState(prev => ({ ...prev, isSending: true }));
      
      // Call the email API endpoint
      await apiClient.sendEmail({
        to: emailState.to,
        subject: emailState.subject,
        body: emailState.body
      });
      
      showNotification(`Email sent successfully to ${emailState.recipientName}`, 'success');
      closeEmailModal();
    } catch (error: any) {
      console.error('Failed to send email:', error);
      showNotification(`Failed to send email: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setEmailState(prev => ({ ...prev, isSending: false }));
    }
  };

  // Edit member handlers
  const openEditModal = (member: ApiUser) => {
    animateIcon('edit');
    setEditState({
      isOpen: true,
      member,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      isSaving: false,
      isDeleting: false,
      
      
      animatingIcon: false
    });
  };

  const closeEditModal = () => {
    setEditState({
      isOpen: false,
      member: null,
      first_name: '',
      last_name: '',
      email: '',
      isSaving: false,
      isDeleting: false,
      
      
      animatingIcon: false
    });
  };

  const saveChanges = async () => {
    if (!editState.member || !editState.first_name || !editState.last_name || !editState.email) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      setEditState(prev => ({ ...prev, isSaving: true }));
      
      // Call API to update user
      await apiClient.updateUser(editState.member.id, {
        first_name: editState.first_name,
        last_name: editState.last_name,
        email: editState.email
      });

      // Update local state
      setDatabaseMembers(members =>
        members.map(m =>
          m.id === editState.member!.id
            ? {
                ...m,
                first_name: editState.first_name,
                last_name: editState.last_name,
                email: editState.email
              }
            : m
        )
      );

      setMessageModal({
        isOpen: true,
        message: 'Member updated successfully',
        type: 'success',
        onClose: () => {
          setMessageModal(prev => ({ ...prev, isOpen: false }));
          closeEditModal();
        }
      });
    } catch (error: any) {
      console.error('Failed to update member:', error);
      setMessageModal({
        isOpen: true,
        message: `Failed to update member: ${error?.message || 'Unknown error'}`,
        type: 'error',
        onClose: () => setMessageModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setEditState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const deleteMember = async () => {
    if (!editState.member) return;

    setConfirmationModal({
      isOpen: true,
      title: `Are you sure you want to remove ${formatFullName(editState.member.first_name, editState.member.last_name)} from the members list? They will be demoted to a regular user.`,
      onConfirm: async () => {
        await confirmDeleteMember();
      },
      onCancel: () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      },
      isLoading: false
    });
  };

  const confirmDeleteMember = async () => {
    if (!editState.member) return;

    try {
      setConfirmationModal(prev => ({ ...prev, isLoading: true }));
      setEditState(prev => ({ ...prev, isDeleting: true }));
      
      // Call API to demote member to user
      await apiClient.demoteMember(editState.member.id);

      // Update local state - change role to 'user' and membership_status to 'pending'
      setDatabaseMembers(members =>
        members.map(m =>
          m.id === editState.member!.id
            ? { ...m, role: 'user', membership_status: 'pending' }
            : m
        )
      );

      setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      setMessageModal({
        isOpen: true,
        message: `${formatFullName(editState.member.first_name, editState.member.last_name)} has been demoted to a regular user`,
        type: 'success',
        onClose: () => {
          setMessageModal(prev => ({ ...prev, isOpen: false }));
          closeEditModal();
        }
      });
    } catch (error: any) {
      console.error('Failed to demote member:', error);
      
      setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      setMessageModal({
        isOpen: true,
        message: `Failed to demote member: ${error?.message || 'Unknown error'}`,
        type: 'error',
        onClose: () => setMessageModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setEditState(prev => ({ ...prev, isDeleting: false }));
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    }
  }


  const filteredMembers = databaseMembers.filter(
    (m) =>
      m.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Members</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Manage member profiles and records</p>
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Clock size={24} className="text-amber-600" />
              <h2 className="text-2xl font-bold text-slate-900">Pending Membership Requests</h2>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                {pendingRequests.length}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-amber-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-slate-200 hover:bg-amber-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatNamePart(request.name)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request.created_at && !isNaN(new Date(request.created_at).getTime()) 
                          ? new Date(request.created_at).toLocaleDateString()
                          : request.requestedAt && !isNaN(new Date(request.requestedAt).getTime())
                            ? new Date(request.requestedAt).toLocaleDateString()
                            : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openEmailModal(request.email, formatNamePart(request.name))}
                            disabled={approvingId === request.id}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send Email"
                          >
                            <Mail size={18} />
                          </button>
                          <button
                            onClick={() => handleApproveMember(request)}
                            disabled={approvingId === request.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve"
                          >
                            {approvingId === request.id ? (
                              <div className="animate-spin">⏳</div>
                            ) : (
                              <Check size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectMember(request.id)}
                            disabled={approvingId === request.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 mt-8">
          <input
            type="text"
            placeholder="Search by name, email, or membership number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
            }}
            className="w-full px-6 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200"
          />
        </div>

        {/* Active Members Table */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Active Members</h2>
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <p className="text-slate-500">Loading members...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Member Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatFullName(member.first_name, member.last_name)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.membership_approved_at 
                          ? new Date(member.membership_approved_at).toLocaleDateString()
                          : new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => openEmailModal(member.email, formatFullName(member.first_name, member.last_name))}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Send Email"
                          >
                            <Mail 
                              size={18} 
                              style={{
                                animation: emailState.animatingIcon && emailState.to === member.email ? 'iconPulse 0.3s ease-out' : 'none',
                                transformOrigin: 'center'
                              }}
                            />
                          </button>
                          <button 
                            onClick={() => openEditModal(member)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
                            title="Edit"
                          >
                            <Edit2 
                              size={18}
                              style={{
                                animation: editState.animatingIcon && editState.member?.id === member.id ? 'iconPulse 0.3s ease-out' : 'none',
                                transformOrigin: 'center'
                              }}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">
                    {searchTerm
                      ? 'No members found matching your search'
                      : 'No active members yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Compose Modal */}
      {emailState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4 modal-fade-in">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col modal-content-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Compose Email</h3>
              <button
                onClick={closeEmailModal}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={emailState.recipientName}
                  readOnly
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={emailState.subject}
                  onChange={(e) =>
                    setEmailState(prev => ({ ...prev, subject: e.target.value }))
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
                  }}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  placeholder="Type your message here..."
                  value={emailState.body}
                  onChange={(e) =>
                    setEmailState(prev => ({ ...prev, body: e.target.value }))
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
                  }}
                  rows={10}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={closeEmailModal}
                disabled={emailState.isSending}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailState.isSending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                {emailState.isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editState.isOpen && editState.member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4 modal-fade-in">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col modal-content-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Edit Member</h3>
              <button
                onClick={closeEditModal}
                disabled={editState.isSaving || editState.isDeleting}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editState.first_name}
                  onChange={(e) =>
                    setEditState(prev => ({ ...prev, first_name: e.target.value }))
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
                  }}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200"
                  disabled={editState.isSaving || editState.isDeleting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editState.last_name}
                  onChange={(e) =>
                    setEditState(prev => ({ ...prev, last_name: e.target.value }))
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
                  }}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200"
                  disabled={editState.isSaving || editState.isDeleting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editState.email}
                  onChange={(e) =>
                    setEditState(prev => ({ ...prev, email: e.target.value }))
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
                  }}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200"
                  disabled={editState.isSaving || editState.isDeleting}
                />
              </div>

              {/* Member Info Display */}
              <div className="bg-slate-50 p-4 rounded-lg mt-6 space-y-2">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Role:</span> {editState.member.role}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Status:</span> {editState.member.status}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Joined:</span> {editState.member.membership_approved_at 
                    ? new Date(editState.member.membership_approved_at).toLocaleDateString()
                    : new Date(editState.member.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="space-y-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              {/* Delete and Main Actions */}
              <div className="flex justify-between gap-3">
                <button
                  onClick={deleteMember}
                  disabled={editState.isSaving || editState.isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {editState.isDeleting ? 'Deleting...' : 'Delete Member'}
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={closeEditModal}
                    disabled={editState.isSaving || editState.isDeleting}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={editState.isSaving || editState.isDeleting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editState.isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 modal-content-in">
            <p className="text-slate-900 text-center mb-6">{confirmationModal.title}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmationModal.onCancel}
                disabled={confirmationModal.isLoading}
                className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                disabled={confirmationModal.isLoading}
                className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmationModal.actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmationModal.actionType === 'freeze'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : confirmationModal.actionType === 'demote'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmationModal.isLoading ? 'Confirming...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 modal-content-in">
            <p className={`text-center mb-6 ${messageModal.type === 'success' ? 'text-slate-900' : 'text-red-600'}`}>
              {messageModal.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={messageModal.onClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
