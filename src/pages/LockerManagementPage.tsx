import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { Locker, LockerRental } from '../types';

export const LockerManagementPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const {
    lockers,
    lockerRentals,
    members,
    addLocker,
    updateLocker,
    deleteLocker,
    addLockerRental,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'lockers' | 'rentals'>('lockers');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Locker>>({
    lockerId: '',
    location: { building: '', floor: '' },
    size: 'Medium',
    status: 'available',
  });

  const [rentalForm, setRentalForm] = useState<Partial<LockerRental>>({
    lockerId: '',
    memberId: '',
    startDate: new Date().toISOString().split('T')[0],
    renewalCount: 0,
    status: 'active',
  });

  const handleAddLocker = () => {
    if (
      formData.lockerId &&
      formData.location?.building &&
      formData.location?.floor
    ) {
      const newLocker: Locker = {
        id: Date.now().toString(),
        lockerId: formData.lockerId,
        location: formData.location as { building: string; floor: string },
        size: (formData.size as any) || 'Medium',
        status: (formData.status as any) || 'available',
        createdAt: new Date().toISOString(),
      };
      addLocker(newLocker);
      setFormData({
        lockerId: '',
        location: { building: '', floor: '' },
        size: 'Medium',
        status: 'available',
      });
      setShowForm(false);
    }
  };

  const handleAddRental = () => {
    if (rentalForm.lockerId && rentalForm.memberId) {
      const expiryDate = new Date(rentalForm.startDate!);
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const newRental: LockerRental = {
        id: Date.now().toString(),
        lockerId: rentalForm.lockerId,
        memberId: rentalForm.memberId,
        startDate: rentalForm.startDate!,
        expiryDate: expiryDate.toISOString().split('T')[0],
        renewalCount: 0,
        rentalFee: 500,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      addLockerRental(newRental);
      updateLocker(rentalForm.lockerId, { status: 'occupied' });
      setRentalForm({
        lockerId: '',
        memberId: '',
        startDate: new Date().toISOString().split('T')[0],
        renewalCount: 0,
        status: 'active',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'under_maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'for_replacement':
        return 'bg-red-100 text-red-800';
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
              Locker Management
            </h1>
            <p className="text-slate-600 mt-2">
              Manage locker registrations and rentals
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>Add Locker</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('lockers')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'lockers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Locker Registry ({lockers.length})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'rentals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Locker Rentals ({lockerRentals.length})
          </button>
        </div>

        {/* Add Locker Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Register New Locker</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Locker ID"
                value={formData.lockerId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, lockerId: e.target.value })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Building"
                value={formData.location?.building || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      building: e.target.value,
                      floor: formData.location?.floor || '',
                    },
                  })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Floor"
                value={formData.location?.floor || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      building: formData.location?.building || '',
                      floor: e.target.value,
                    },
                  })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.size || 'Medium'}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value as any })
                }
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddLocker}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Locker
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

        {/* Locker List Tab */}
        {activeTab === 'lockers' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Locker ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lockers.map((locker) => (
                  <tr
                    key={locker.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {locker.lockerId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {locker.location.building} - Floor {locker.location.floor}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {locker.size}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(locker.status)}`}
                      >
                        {locker.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => alert(`Locker ${locker.lockerId} - ${locker.location.building} Floor ${locker.location.floor} (${locker.size})`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => alert('Edit functionality coming soon')}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Locker"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteLocker(locker.id)}
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
            {lockers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No lockers registered yet</p>
              </div>
            )}
          </div>
        )}

        {/* Rentals Tab */}
        {activeTab === 'rentals' && (
          <div className="space-y-6">
            {/* Add Rental Form */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Create Locker Rental</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={rentalForm.lockerId || ''}
                  onChange={(e) =>
                    setRentalForm({ ...rentalForm, lockerId: e.target.value })
                  }
                  className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Locker</option>
                  {lockers
                    .filter((l) => l.status === 'available')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lockerId} - {l.location.building}
                      </option>
                    ))}
                </select>
                <select
                  value={rentalForm.memberId || ''}
                  onChange={(e) =>
                    setRentalForm({
                      ...rentalForm,
                      memberId: e.target.value,
                    })
                  }
                  className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.membershipNo})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={rentalForm.startDate || ''}
                  onChange={(e) =>
                    setRentalForm({
                      ...rentalForm,
                      startDate: e.target.value,
                    })
                  }
                  className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleAddRental}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Rental
              </button>
            </div>

            {/* Rentals Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Locker
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lockerRentals.map((rental) => {
                    const member = members.find((m) => m.id === rental.memberId);
                    const locker = lockers.find((l) => l.id === rental.lockerId);
                    return (
                      <tr
                        key={rental.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {locker?.lockerId}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {member?.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {rental.startDate}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {rental.expiryDate}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          ₱{rental.rentalFee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rental.status)}`}
                          >
                            {rental.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {lockerRentals.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">No locker rentals yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
