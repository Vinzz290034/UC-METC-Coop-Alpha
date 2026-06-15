import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  MoreVertical,
  UserX,
  Trash2,
  Shield,
  ShieldOff,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { formatNamePart, formatFullName } from '../utils/nameFormatter';

interface User {
  id: string;
  id_number?: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: 'admin' | 'staff' | 'member' | 'user';
  staffType?: 'cashier' | 'locker_officer' | 'inventory_officer';
  course?: string;
  year?: string;
  membership_status?: 'approved' | 'pending' | 'rejected';
  created_at: string;
  is_active?: boolean;
  tour_completed?: boolean;
}

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useUIStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<User | null>(null);

  // User Profile Editing State (for Admins)
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'staff' | 'member' | 'user'>('user');

  const startEditing = (user: User) => {
    setEditFirstName(user.first_name || '');
    setEditMiddleName(user.middle_name || '');
    setEditLastName(user.last_name || '');
    setEditIdNumber(user.id_number || '');
    setEditCourse(user.course || '');
    setEditYear(user.year || '');
    setEditRole(user.role || 'user');
    setIsEditing(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsEditing(false);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
      showNotification('First name and last name are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        first_name: editFirstName.trim(),
        middle_name: editMiddleName.trim(),
        last_name: editLastName.trim(),
        id_number: editIdNumber.trim(),
        course: editCourse.trim(),
        year: editYear.trim(),
        role: editRole,
      };

      const response = await apiClient.updateUser(selectedUser.id, updateData);
      const updatedUser = response.user || { ...selectedUser, ...updateData };

      // Update the user in the main state list
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updatedUser } : u));
      setSelectedUser({ ...selectedUser, ...updatedUser });
      setIsEditing(false);
      showNotification('User profile updated successfully', 'success');
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      showNotification(error?.message || 'Failed to update user profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      const usersData = Array.isArray(response) ? response : (response.users || []);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showNotification('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await apiClient.deleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      showNotification(`User ${user.first_name} ${user.last_name} deleted successfully`, 'success');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      showNotification('Failed to delete user', 'error');
    }
  };

  const handleDeactivateUser = async (user: User) => {
    try {
      await apiClient.freezeMember(user.id);
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_active: false } : u
      ));
      showNotification(`User ${user.first_name} ${user.last_name} deactivated successfully`, 'success');
      setShowDeactivateConfirm(null);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      showNotification('Failed to deactivate user', 'error');
    }
  };

  const handleReactivateUser = async (user: User) => {
    try {
      await apiClient.reactivateUser(user.id);
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_active: true } : u
      ));
      showNotification(`User ${user.first_name} ${user.last_name} reactivated successfully`, 'success');
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      showNotification('Failed to reactivate user', 'error');
    }
  };

  const handleDemoteUser = async (user: User) => {
    try {
      await apiClient.demoteMember(user.id);
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, role: 'user', membership_status: 'rejected' } : u
      ));
      showNotification(`User ${user.first_name} ${user.last_name} demoted successfully`, 'success');
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to demote user:', error);
      showNotification('Failed to demote user', 'error');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.id_number && user.id_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  // Helper function to get display role (show "Member" for approved members)
  const getDisplayRole = (user: User) => {
    if (user.membership_status === 'approved' && user.role === 'user') {
      return 'member';
    }
    return user.role;
  };

  // Only allow admin access
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Manage system users, roles, and account status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="h-6 sm:h-8 w-6 sm:w-8 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Active Users</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {users.filter(u => u.is_active !== false).length}
                </p>
              </div>
              <CheckCircle2 className="h-6 sm:h-8 w-6 sm:w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Members</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {users.filter(u => u.membership_status === 'approved').length}
                </p>
              </div>
              <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="lg:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="member">Member</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course/Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {formatNamePart(user.first_name).charAt(0)}{formatNamePart(user.last_name).charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatFullName(user.first_name, user.last_name, user.middle_name)}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(getDisplayRole(user))}`}>
                          {getDisplayRole(user).charAt(0).toUpperCase() + getDisplayRole(user).slice(1)}
                        </span>
                        {user.staffType && (
                          <div className="text-xs text-gray-500 mt-1">
                            {user.staffType.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.id_number || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.course && user.year ? `${user.course} - ${user.year}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            disabled={user.id === currentUser?.id}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {showActionMenu === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowActionMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                              >
                                <Eye size={16} />
                                View Details
                              </button>
                              
                              {getDisplayRole(user) === 'member' && (
                                <button
                                  onClick={() => handleDemoteUser(user)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-800 hover:bg-purple-50 border-b border-gray-100"
                                >
                                  <ShieldOff size={16} />
                                  Demote Member
                                </button>
                              )}
                              
                              {user.is_active === false ? (
                                <button
                                  onClick={() => handleReactivateUser(user)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 border-b border-gray-100"
                                >
                                  <CheckCircle2 size={16} />
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setShowDeactivateConfirm(user);
                                    setShowActionMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 border-b border-gray-100"
                                >
                                  <UserX size={16} />
                                  Deactivate
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(user);
                                  setShowActionMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No users found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal - Portal */}
      {selectedUser && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 modal-fade-in"
          onClick={closeModal}
          style={{ zIndex: 9999 }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full modal-content-in max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all duration-200 hover:scale-110"
              aria-label="Close modal"
            >
              <X size={20} className="text-slate-700" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 pr-8">
                {isEditing ? 'Edit User Details' : 'User Details'}
              </h2>
              
              {isEditing ? (
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={editMiddleName}
                        onChange={(e) => setEditMiddleName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Email: <strong className="text-slate-700">{selectedUser.email}</strong> (Cannot be changed)</p>
                </div>
              ) : (
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-medium text-purple-600">
                      {formatNamePart(selectedUser.first_name).charAt(0)}{formatNamePart(selectedUser.last_name).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {formatFullName(selectedUser.first_name, selectedUser.last_name, selectedUser.middle_name)}
                    </h3>
                    <p className="text-slate-600">{selectedUser.email}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ID Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="e.g. 123456789"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{selectedUser.id_number || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  {isEditing ? (
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                    >
                      <option value="user">User</option>
                      <option value="member">Member</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(getDisplayRole(selectedUser))}`}>
                      {getDisplayRole(selectedUser).charAt(0).toUpperCase() + getDisplayRole(selectedUser).slice(1)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course & Year</label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editCourse}
                        onChange={(e) => setEditCourse(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Course (e.g. HM, BSIT)"
                      />
                      <input
                        type="text"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Year (e.g. 1st, 2nd)"
                      />
                    </div>
                  ) : (
                    <p className="text-slate-900 font-medium">
                      {selectedUser.course && selectedUser.year ? `${selectedUser.course} - ${selectedUser.year}` : 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Joined Date</label>
                  <p className="text-slate-900 font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUser}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(selectedUser)}
                      className="px-6 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors font-medium"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Delete User</h3>
                  <p className="text-sm text-slate-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-slate-700 mb-6">
                Are you sure you want to permanently delete <strong>{formatFullName(showDeleteConfirm.first_name, showDeleteConfirm.last_name, showDeleteConfirm.middle_name)}</strong>? 
                This will remove all their data from the system.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <UserX className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Deactivate User</h3>
                  <p className="text-sm text-slate-600">Temporarily suspend account access</p>
                </div>
              </div>
              
              <p className="text-slate-700 mb-6">
                Are you sure you want to deactivate <strong>{formatFullName(showDeactivateConfirm.first_name, showDeactivateConfirm.last_name, showDeactivateConfirm.middle_name)}</strong>? 
                They will not be able to access their account until reactivated.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeactivateConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeactivateUser(showDeactivateConfirm)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};