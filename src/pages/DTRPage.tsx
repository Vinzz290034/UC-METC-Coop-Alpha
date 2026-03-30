import React, { useState, useEffect } from 'react';
import { Clock, Download, Filter, Users } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { DTRRecord } from '../types';

export const DTRPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { dtrRecords, addDTRRecord, updateDTRRecord } = useAppStore();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStaff, setFilterStaff] = useState('');

  // Get unique staff members from DTR records
  const staffMembers = Array.from(new Set(dtrRecords.map(r => r.staffName)));

  // Filter records by date and staff
  const filteredRecords = dtrRecords.filter((record) => {
    const dateMatch = !filterDate || record.date === filterDate;
    const staffMatch = !filterStaff || record.staffName === filterStaff;
    return dateMatch && staffMatch;
  });

  // Calculate statistics
  const totalPresent = filteredRecords.filter(r => r.status !== 'absent').length;
  const totalAbsent = filteredRecords.filter(r => r.status === 'absent').length;
  const totalLate = filteredRecords.filter(r => r.status === 'late').length;
  const averageHours = filteredRecords.length > 0
    ? (filteredRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / filteredRecords.length / 60).toFixed(2)
    : '0';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'present':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    return timeStr;
  };

  const exportToCSV = () => {
    const headers = ['Staff Name', 'Date', 'Time In', 'Time Out', 'Duration (mins)', 'Status'];
    const data = filteredRecords.map((record) => [
      record.staffName,
      record.date,
      formatTime(record.timeIn),
      formatTime(record.timeOut),
      record.duration || '--',
      record.status,
    ]);

    const csv = [
      headers.join(','),
      ...data.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dtr-records-${filterDate}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Daily Time Record (DTR)</h1>
              <p className="text-slate-600 mt-2">Manage staff attendance and time tracking</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <p className="text-sm font-medium text-green-700 mb-2">Present</p>
            <p className="text-3xl font-bold text-green-900">{totalPresent}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
            <p className="text-sm font-medium text-yellow-700 mb-2">Late</p>
            <p className="text-3xl font-bold text-yellow-900">{totalLate}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
            <p className="text-sm font-medium text-red-700 mb-2">Absent</p>
            <p className="text-3xl font-bold text-red-900">{totalAbsent}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <p className="text-sm font-medium text-blue-700 mb-2">Avg Hours</p>
            <p className="text-3xl font-bold text-blue-900">{averageHours}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Filter size={20} className="text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Staff
              </label>
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Staff</option>
                {staffMembers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* DTR Records Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center space-x-2">
            <Users size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Attendance Records {filteredRecords.length > 0 && `(${filteredRecords.length})`}
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Staff Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {record.staffName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                        {formatTime(record.timeIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.timeOut ? (
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                          {formatTime(record.timeOut)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not yet timed out</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {record.duration ? `${record.duration} mins` : '--'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {record.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-slate-500">No DTR records found for the selected filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Records:</span>
                <span className="font-semibold text-slate-900">{filteredRecords.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Attendance Rate:</span>
                <span className="font-semibold text-green-600">
                  {filteredRecords.length > 0
                    ? `${((totalPresent / filteredRecords.length) * 100).toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tardiness Rate:</span>
                <span className="font-semibold text-yellow-600">
                  {filteredRecords.length > 0
                    ? `${((totalLate / filteredRecords.length) * 100).toFixed(1)}%`
                    : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Staff Count</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Staff:</span>
                <span className="font-semibold text-slate-900">{staffMembers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Checked In Today:</span>
                <span className="font-semibold text-green-600">{totalPresent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Absent:</span>
                <span className="font-semibold text-red-600">{totalAbsent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
