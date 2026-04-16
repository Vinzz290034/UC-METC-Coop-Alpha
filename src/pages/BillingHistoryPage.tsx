import React, { useState } from 'react';
import { ChevronLeft, Download, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  referenceNumber: string;
  paymentDate?: string;
  paymentMethod?: string;
}

export const BillingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const billingRecords: BillingRecord[] = [
    {
      id: '1',
      date: '2026-04-02',
      description: 'Membership Dues - Semester 2, 2026',
      amount: 500,
      status: 'paid',
      dueDate: '2026-04-15',
      referenceNumber: 'BILL-2026-001',
      paymentDate: '2026-04-03',
      paymentMethod: 'Cash',
    },
    {
      id: '2',
      date: '2026-03-28',
      description: 'Locker Rental Fee - Medium Unit',
      amount: 750,
      status: 'paid',
      dueDate: '2026-04-10',
      referenceNumber: 'BILL-2026-002',
      paymentDate: '2026-03-29',
      paymentMethod: 'Debit Card',
    },
    {
      id: '3',
      date: '2026-05-01',
      description: 'Membership Dues - Semester 2 Renewal',
      amount: 500,
      status: 'pending',
      dueDate: '2026-05-15',
      referenceNumber: 'BILL-2026-003',
    },
    {
      id: '4',
      date: '2026-02-01',
      description: 'Monthly Service Fee',
      amount: 100,
      status: 'overdue',
      dueDate: '2026-02-28',
      referenceNumber: 'BILL-2026-004',
    },
    {
      id: '5',
      date: '2026-01-15',
      description: 'Annual Membership Fee - 2026',
      amount: 1000,
      status: 'paid',
      dueDate: '2026-02-15',
      referenceNumber: 'BILL-2026-005',
      paymentDate: '2026-01-20',
      paymentMethod: 'E-Wallet',
    },
    {
      id: '6',
      date: '2026-03-01',
      description: 'Locker Maintenance Fee',
      amount: 150,
      status: 'paid',
      dueDate: '2026-03-15',
      referenceNumber: 'BILL-2026-006',
      paymentDate: '2026-03-10',
      paymentMethod: 'Cash',
    },
  ];

  const filteredRecords = filterStatus === 'all'
    ? billingRecords
    : billingRecords.filter(b => b.status === filterStatus);

  const statusConfig = {
    paid: {
      color: 'bg-green-100',
      textColor: 'text-green-800',
      icon: CheckCircle,
      label: 'Paid',
      badge: 'bg-green-500/20 text-green-700',
    },
    pending: {
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: Clock,
      label: 'Pending',
      badge: 'bg-yellow-500/20 text-yellow-700',
    },
    overdue: {
      color: 'bg-red-100',
      textColor: 'text-red-800',
      icon: AlertCircle,
      label: 'Overdue',
      badge: 'bg-red-500/20 text-red-700',
    },
  };

  const stats = {
    totalPaid: billingRecords
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0),
    totalPending: billingRecords
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + b.amount, 0),
    totalOverdue: billingRecords
      .filter(b => b.status === 'overdue')
      .reduce((sum, b) => sum + b.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">BILLING HISTORY</h1>
            <p className="text-slate-700">Track your membership dues and service payments</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">₱{stats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {billingRecords.filter(b => b.status === 'paid').length} payments
                </p>
              </div>
              <CheckCircle size={32} className="text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Pending Payment</p>
                <p className="text-3xl font-bold text-yellow-600">₱{stats.totalPending.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {billingRecords.filter(b => b.status === 'pending').length} pending
                </p>
              </div>
              <Clock size={32} className="text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Overdue Payment</p>
                <p className="text-3xl font-bold text-red-600">₱{stats.totalOverdue.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {billingRecords.filter(b => b.status === 'overdue').length} overdue
                </p>
              </div>
              <AlertCircle size={32} className="text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter Billing Records</h2>
          <div className="flex flex-wrap gap-3">
            {['all', 'paid', 'pending', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Billing Records List */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">No billing records found</p>
            </div>
          ) : (
            filteredRecords.map((billing) => {
              const StatusIcon = statusConfig[billing.status].icon;
              return (
                <div
                  key={billing.id}
                  onClick={() => setSelectedBilling(billing)}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className={`p-3 rounded-lg ${statusConfig[billing.status].color}`}>
                            <StatusIcon
                              className={`${statusConfig[billing.status].textColor}`}
                              size={24}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {billing.description}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Issued: {new Date(billing.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">₱{billing.amount.toLocaleString()}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[billing.status].badge}`}>
                          {statusConfig[billing.status].label}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide">Reference</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{billing.referenceNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide">Due Date</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {new Date(billing.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {billing.paymentDate && (
                        <div>
                          <p className="text-xs text-slate-600 uppercase tracking-wide">Paid On</p>
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            {new Date(billing.paymentDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                      {billing.paymentMethod && (
                        <div>
                          <p className="text-xs text-slate-600 uppercase tracking-wide">Method</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">{billing.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-blue-600 font-semibold">ℹ</span>
          </div>
          <div>
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Member Benefit:</span> As a valued UC METC cooperative member, you enjoy flexible payment terms and transparent billing. For payment concerns, please visit the cooperative office during business hours.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBilling && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBilling(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${statusConfig[selectedBilling.status].color}`}
              >
                {React.createElement(statusConfig[selectedBilling.status].icon, {
                  className: statusConfig[selectedBilling.status].textColor,
                  size: 32,
                })}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedBilling.description}</h2>
              <p className="text-3xl font-bold text-slate-900 mt-2">₱{selectedBilling.amount.toLocaleString()}</p>
            </div>

            <div className="space-y-4 mb-6 bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Status</span>
                <span className={`font-bold ${statusConfig[selectedBilling.status].textColor}`}>
                  {statusConfig[selectedBilling.status].label}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-600">Reference Number</span>
                  <span className="font-semibold text-slate-900">{selectedBilling.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-600">Issued Date</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedBilling.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-600">Due Date</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedBilling.dueDate).toLocaleDateString()}
                  </span>
                </div>
                {selectedBilling.paymentDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Payment Date</span>
                    <span className="font-semibold text-green-600">
                      {new Date(selectedBilling.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedBilling.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Payment Method</span>
                    <span className="font-semibold text-slate-900">{selectedBilling.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedBilling(null)}
              className="w-full bg-gradient-to-r from-purple-600 to-green-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-green-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
