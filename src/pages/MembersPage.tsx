import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Mail } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { Member } from '../types';

export const MembersPage: React.FC = () => {
  const { members, addMember, updateMember, deleteMember } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    email: '',
    phone: '',
    membershipNo: '',
    status: 'active',
  });

  const handleAddMember = () => {
    if (
      formData.name &&
      formData.email &&
      formData.phone &&
      formData.membershipNo
    ) {
      const newMember: Member = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        membershipNo: formData.membershipNo,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      addMember(newMember);
      setFormData({
        name: '',
        email: '',
        phone: '',
        membershipNo: '',
        status: 'active',
      });
      setShowForm(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.membershipNo.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Members</h1>
            <p className="text-slate-600 mt-2">Manage member profiles and records</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>Add Member</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or membership number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add Member Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Register New Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone || ''}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Membership Number"
                value={formData.membershipNo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    membershipNo: e.target.value,
                  })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddMember}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-slate-200 text-slate-900 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Members Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Member Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Membership #
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Phone
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
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">
                    {member.membershipNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {member.phone}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Mail size={18} />
                      </button>
                      <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
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
                  : 'No members registered yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
