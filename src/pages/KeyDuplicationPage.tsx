import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { KeyDuplication } from '../types';

export const KeyDuplicationPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const {
    keyDuplications,
    lockerRentals,
    members,
    addKeyDuplication,
    setKeyDuplications,
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState<Partial<KeyDuplication>>({
    reason: 'lost',
    approvalStatus: 'pending',
    releaseStatus: 'pending',
  });

  const handleAddDuplication = () => {
    if (formData.lockerId && formData.memberId) {
      const newDuplication: KeyDuplication = {
        id: Date.now().toString(),
        lockerId: formData.lockerId,
        memberId: formData.memberId,
        reason: (formData.reason as any) || 'lost',
        fee: 150,
        approvalStatus: 'pending',
        releaseStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      addKeyDuplication(newDuplication);
      setFormData({
        reason: 'lost',
        approvalStatus: 'pending',
        releaseStatus: 'pending',
      });
      setShowForm(false);
    }
  };

  const handleApprove = (id: string) => {
    const updated = keyDuplications.map((k) =>
      k.id === id ? { ...k, approvalStatus: 'approved' as const } : k
    );
    setKeyDuplications(updated);
  };

  const handleReject = (id: string) => {
    const updated = keyDuplications.map((k) =>
      k.id === id ? { ...k, approvalStatus: 'rejected' as const } : k
    );
    setKeyDuplications(updated);
  };

  const handleRelease = (id: string) => {
    const updated = keyDuplications.map((k) =>
      k.id === id ? { ...k, releaseStatus: 'released' as const } : k
    );
    setKeyDuplications(updated);
  };

  const filteredDuplications =
    filterStatus === 'all'
      ? keyDuplications
      : keyDuplications.filter(
          (k) =>
            k.approvalStatus === filterStatus ||
            k.releaseStatus === filterStatus
        );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'released':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Key Duplication
            </h1>
            <p className="text-slate-600 mt-2">
              Manage key requests and approvals
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>New Request</span>
          </button>
        </div>

        {/* Add Request Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              Request Key Duplication
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={formData.lockerId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, lockerId: e.target.value })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Locker</option>
                {lockerRentals.map((r) => (
                  <option key={r.id} value={r.lockerId}>
                    Locker {r.lockerId}
                  </option>
                ))}
              </select>

              <select
                value={formData.memberId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                value={formData.reason || 'lost'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reason: e.target.value as any,
                  })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lost">Lost Key</option>
                <option value="spare">Spare Key</option>
                <option value="damaged">Damaged Key</option>
              </select>

              <input
                type="text"
                placeholder="Fee (auto: ₱150)"
                disabled
                value="₱150"
                className="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 text-slate-600"
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddDuplication}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Submit Request
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

        {/* Filters */}
        <div className="flex space-x-3 mb-6">
          {['all', 'pending', 'approved', 'rejected', 'released'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Locker
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Approval
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Release Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDuplications.map((dup) => {
                const member = members.find((m) => m.id === dup.memberId);
                return (
                  <tr
                    key={dup.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {member?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {dup.lockerId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                      {dup.reason}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      ₱{dup.fee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dup.approvalStatus)}`}
                      >
                        {dup.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dup.releaseStatus)}`}
                      >
                        {dup.releaseStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dup.approvalStatus === 'pending' && (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleApprove(dup.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(dup.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                      {dup.approvalStatus === 'approved' &&
                        dup.releaseStatus === 'pending' && (
                          <button
                            onClick={() => handleRelease(dup.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold"
                          >
                            Release Key
                          </button>
                        )}
                      {dup.releaseStatus === 'released' && (
                        <span className="text-xs text-green-600 font-semibold">
                          Released
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDuplications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No key duplication requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
