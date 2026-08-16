import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Eye, Search, Lock, DollarSign, FileText, CheckCircle2, Download, RefreshCw, X, CheckSquare, AlertTriangle, Calendar, Key, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/api';
import { useUIStore } from '../store/uiStore';
import * as XLSX from 'xlsx';

// Helper: Calculate Academic Semester End Date & weekly late key penalty
// 1st Semester (June - December): Ends Dec 19
// 2nd Semester (January - May): Ends May
const getAcademicSemesterEndDate = (startDate: Date, semesterCount: number = 1): Date => {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth(); // 0-indexed: 0 = Jan, 4 = May, 5 = Jun, 11 = Dec

  const isStarting1stSem = startMonth >= 5;

  let endYear = startYear;
  let endMonth = 11; // 11 = Dec, 4 = May
  let endDay = 19; // Dec 19 for 1st Semester

  for (let i = 1; i <= semesterCount; i++) {
    if (i === 1) {
      if (isStarting1stSem) {
        endMonth = 11; // Dec
        endDay = 19;
        endYear = startYear;
      } else {
        endMonth = 4; // May
        endDay = 31;
        endYear = startYear;
      }
    } else {
      if (endMonth === 11) {
        // Was 1st Semester (ending Dec 19), next is 2nd Semester (ending May of next year)
        endMonth = 4;
        endDay = 31;
        endYear = endYear + 1;
      } else {
        // Was 2nd Semester (ending May), next is 1st Semester (ending Dec 19 of same year)
        endMonth = 11;
        endDay = 19;
        // endYear stays same
      }
    }
  }

  return new Date(endYear, endMonth, endDay, 23, 59, 59, 999);
};

const calculateRentalDates = (paidAtOrCreatedAt: string | undefined, semesterCount: number = 1, initialDeposit: number = 200, isPaid: boolean = true) => {
  const start = paidAtOrCreatedAt ? new Date(paidAtOrCreatedAt) : new Date();
  const end = getAcademicSemesterEndDate(start, semesterCount);

  const isDec = end.getMonth() === 11;
  const endMonthName = isDec ? 'Dec 19' : 'May';
  const formattedEndDate = isDec ? `Dec 19, ${end.getFullYear()}` : `May ${end.getFullYear()}`;

  if (!isPaid) {
    return {
      startDateStr: 'Pending Payment & Key Issuance',
      endDateStr: `End of ${isDec ? '1st Semester (Dec 19)' : '2nd Semester (May)'}`,
      termLabel: `${semesterCount} Semester(s) (Ends ${endMonthName})`,
      totalMonths: 5 * semesterCount,
      daysRemaining: Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      isExpiringSoon: false,
      isExpired: false,
      isPending: true,
      overdueDays: 0,
      overdueWeeks: 0,
      penaltyAmount: 0,
      netDepositRefund: initialDeposit,
    };
  }

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  // Overdue Penalty Calculation: ₱50 penalty per week late (7 days) past term end date
  let overdueDays = 0;
  let overdueWeeks = 0;
  let penaltyAmount = 0;
  let netDepositRefund = initialDeposit;

  if (isExpired) {
    overdueDays = Math.abs(daysRemaining);
    overdueWeeks = Math.max(1, Math.ceil(overdueDays / 7));
    penaltyAmount = Math.min(initialDeposit, overdueWeeks * 50);
    netDepositRefund = Math.max(0, initialDeposit - penaltyAmount);
  }

  return {
    startDateStr: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    endDateStr: formattedEndDate,
    termLabel: `${semesterCount} Semester(s) (Ends ${formattedEndDate})`,
    totalMonths: 5 * semesterCount,
    daysRemaining,
    isExpiringSoon,
    isExpired,
    isPending: false,
    overdueDays,
    overdueWeeks,
    penaltyAmount,
    netDepositRefund,
  };
};

export const LockerManagementPage: React.FC = () => {
  const { showNotification } = useUIStore();

  useEffect(() => {
    fetchLockerSystemData();
  }, []);

  const [lockers, setLockers] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rentals' | 'revenue'>('rentals');
  const [lockerSearch, setLockerSearch] = useState<string>('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [rentalSearch, setRentalSearch] = useState<string>('');
  const [rentalStatusFilter, setRentalStatusFilter] = useState<'all' | 'pending' | 'active' | 'expiring' | 'terminated'>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);

  // Clearance Checkboxes in Modal
  const [isCleanVerified, setIsCleanVerified] = useState<boolean>(false);
  const [isKeyReturned, setIsKeyReturned] = useState<boolean>(false);
  
  const [showAddLockerModal, setShowAddLockerModal] = useState<boolean>(false);
  const [actionKeyInput, setActionKeyInput] = useState<string>('');
  const [showUnverifiedWarningModal, setShowUnverifiedWarningModal] = useState<boolean>(false);
  const [showTerminateConfirmModal, setShowTerminateConfirmModal] = useState<boolean>(false);
  const [targetTerminateId, setTargetTerminateId] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // New Locker Form State
  const [newLockerCode, setNewLockerCode] = useState<string>('');
  const [newLockerBuilding, setNewLockerBuilding] = useState<string>('Machine Shop');
  const [newLockerSize, setNewLockerSize] = useState<string>('Medium');

  const fetchLockerSystemData = async () => {
    try {
      setLoading(true);
      const [lockersRes, rentalsRes] = await Promise.all([
        apiClient.getLockers().catch(() => ({ lockers: [] })),
        apiClient.getLockerRentals().catch(() => ({ rentals: [] })),
      ]);

      let fetchedRentals = rentalsRes.rentals || [];
      try {
        const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
        if (savedGlobal) {
          const globalList = JSON.parse(savedGlobal);
          const existingIds = new Set(fetchedRentals.map((r: any) => r.rental_id || r.id));
          const newEntries = globalList.filter((g: any) => !existingIds.has(g.rental_id || g.id));
          fetchedRentals = [...newEntries, ...fetchedRentals];
        }
      } catch (e) {
        console.error('Error merging global pending lockers:', e);
      }

      setLockers(lockersRes.lockers || []);
      setRentals(fetchedRentals);
    } catch (err) {
      console.error('Error fetching locker management data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Add New Physical Locker
  const handleCreateLocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLockerCode.trim()) return;

    try {
      setActionLoading(true);
      await apiClient.createLocker(newLockerCode.trim());
      showNotification(`Locker ${newLockerCode} registered successfully!`, 'success');
      setNewLockerCode('');
      // setShowAddLockerModal(false);
      fetchLockerSystemData();
    } catch (err: any) {
      alert(err.message || 'Failed to create new locker');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Approve Agreement & Mark Paid (Starts 5-month rental term now!)
  const handleApproveAndMarkPaid = async (rentalId?: string) => {
    try {
      setActionLoading(true);
      const targetId = rentalId || selectedAgreement?.rental_id || selectedAgreement?.id || 'pending-' + Date.now();
      const assignedKey = actionKeyInput.trim() || `KEY-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentTimestamp = new Date().toISOString();
      
      if (typeof targetId === 'string' && !targetId.startsWith('pending-')) {
        try {
          await apiClient.approveLockerRental(targetId, assignedKey);
          await apiClient.markLockerRentalPaid(targetId, 'paid');
        } catch (e) {
          console.warn('Backend API approval warning:', e);
        }
      }

      // Sync state in local pending storage with exact payment timestamp as start date
      try {
        const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
        if (savedGlobal) {
          const list = JSON.parse(savedGlobal);
          const updatedList = list.map((g: any) => {
            const itemKey = g.rental_id || g.id;
            if (itemKey === targetId || g.locker_number === selectedAgreement?.locker_number) {
              return {
                ...g,
                rental_status: 'active',
                payment_status: 'paid',
                key_code: assignedKey,
                created_at: paymentTimestamp,
                paid_at: paymentTimestamp,
                status: 'active'
              };
            }
            return g;
          });
          localStorage.setItem('coop_global_pending_lockers', JSON.stringify(updatedList));
        }

        // Sync individual student pending rental storage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('coop_pending_locker_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              if (item && (item.rental_id === targetId || item.locker_number === selectedAgreement?.locker_number)) {
                item.rental_status = 'active';
                item.payment_status = 'paid';
                item.key_code = assignedKey;
                item.created_at = paymentTimestamp;
                item.paid_at = paymentTimestamp;
                item.status = 'active';
                localStorage.setItem(key, JSON.stringify(item));
              }
            } catch (err) {}
          }
        });
      } catch (e) {
        console.error('Error syncing local storage rental approval:', e);
      }

      showNotification('Locker Rental Agreement APPROVED and PAID!', 'success');
      setSelectedAgreement(null);
      setActionKeyInput('');
      fetchLockerSystemData();
    } catch (err: any) {
      alert(err.message || 'Failed to process locker agreement payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Approve Semester Rental Extension
  const handleApproveExtension = async (rentalId?: string) => {
    try {
      setActionLoading(true);
      const targetId = rentalId || selectedAgreement?.rental_id || selectedAgreement?.id || '';

      // Update localStorage global pending lockers
      const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
      if (savedGlobal) {
        const list = JSON.parse(savedGlobal);
        const updatedList = list.map((g: any) => {
          const itemKey = g.rental_id || g.id;
          if (itemKey === targetId || g.locker_number === selectedAgreement?.locker_number) {
            const addedSems = g.pending_extension_semesters || 1;
            const currentSems = g.semester_count || 1;
            return {
              ...g,
              semester_count: currentSems + addedSems,
              extension_status: 'approved',
              pending_extension_fee: 0,
              pending_extension_semesters: 0,
              payment_status: 'paid',
              rental_status: 'active',
              status: 'active',
            };
          }
          return g;
        });
        localStorage.setItem('coop_global_pending_lockers', JSON.stringify(updatedList));
      }

      // Sync student local storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('coop_pending_locker_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            if (item && (item.rental_id === targetId || item.locker_number === selectedAgreement?.locker_number)) {
              const addedSems = item.pending_extension_semesters || 1;
              const currentSems = item.semester_count || 1;
              item.semester_count = currentSems + addedSems;
              item.extension_status = 'approved';
              item.pending_extension_fee = 0;
              item.pending_extension_semesters = 0;
              item.payment_status = 'paid';
              item.rental_status = 'active';
              item.status = 'active';
              localStorage.setItem(key, JSON.stringify(item));
            }
          } catch (err) {}
        }
      });

      showNotification('Locker Semester Extension APPROVED & Payment Recorded!', 'success');
      setSelectedAgreement(null);
      fetchLockerSystemData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve extension');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Terminate Locker Rental
  const executeTerminateRental = async (rentalId?: string) => {
    try {
      setActionLoading(true);
      const targetId = rentalId || targetTerminateId || selectedAgreement?.rental_id || selectedAgreement?.id || '';
      if (typeof targetId === 'string' && targetId && !targetId.startsWith('pending-')) {
        try {
          await apiClient.terminateLockerRental(targetId);
        } catch (e) {
          console.warn('Backend API terminate warning:', e);
        }
      }

      // Remove from global & student local storage
      try {
        const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
        if (savedGlobal) {
          const list = JSON.parse(savedGlobal);
          const updatedList = list.filter((g: any) => {
            const itemKey = g.rental_id || g.id;
            return itemKey !== targetId && g.locker_number !== selectedAgreement?.locker_number;
          });
          localStorage.setItem('coop_global_pending_lockers', JSON.stringify(updatedList));
        }

        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('coop_pending_locker_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              if (item && (item.rental_id === targetId || item.locker_number === selectedAgreement?.locker_number)) {
                localStorage.removeItem(key);
              }
            } catch (err) {}
          }
        });
      } catch (e) {
        console.error('Error updating localStorage on termination:', e);
      }

      showNotification('Locker rental agreement terminated and locker vacated.', 'success');
      setSelectedAgreement(null);
      setShowTerminateConfirmModal(false);
      setTargetTerminateId('');
      fetchLockerSystemData();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate locker rental');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Lockers
  const filteredLockers = lockers.filter(l => {
    const code = (l.locker_number || l.lockerId || '').toLowerCase();
    const loc = (l.location || '').toLowerCase();
    const floor = (l.floor || '').toLowerCase();

    if (selectedLocationFilter !== 'all' && !loc.includes(selectedLocationFilter.toLowerCase())) {
      return false;
    }
    if (lockerSearch.trim()) {
      const q = lockerSearch.toLowerCase().trim();
      return code.includes(q) || loc.includes(q) || floor.includes(q);
    }
    return true;
  });

  // Filtered Rentals
  const filteredRentals = rentals.filter(r => {
    const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    const code = (r.locker_number || '').toLowerCase();
    const status = (r.status || r.rental_status || '').toLowerCase();
    const dates = calculateRentalDates(r.created_at, r.semester_count || 1);

    if (rentalStatusFilter !== 'all') {
      if (rentalStatusFilter === 'expiring') {
        if (!dates.isExpiringSoon && !dates.isExpired && r.extension_status !== 'pending_extension') return false;
      } else if (status !== rentalStatusFilter) {
        return false;
      }
    }
    if (rentalSearch.trim()) {
      const q = rentalSearch.toLowerCase().trim();
      return name.includes(q) || code.includes(q) || (r.id_number && r.id_number.toLowerCase().includes(q));
    }
    return true;
  });

  // Financial Metrics Calculation (STRICTLY Isolated for Lockers)
  const lockerMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalRentalIncome = 0;
    let totalKeyDeposits = 0;
    let activeRentersCount = 0;
    let pendingRentersCount = 0;
    let expiringSoonCount = 0;

    rentals.forEach(r => {
      const isPaid = r.payment_status === 'paid';
      const rentalFee = parseFloat(r.rental_fee || (250 * (r.semester_count || 1)));
      const depositFee = parseFloat(r.deposit_fee || 200);
      const dates = calculateRentalDates(r.created_at, r.semester_count || 1);

      if (dates.isExpiringSoon || r.extension_status === 'pending_extension') {
        expiringSoonCount += 1;
      }

      if (isPaid || r.status === 'active') {
        totalRentalIncome += rentalFee;
        totalKeyDeposits += depositFee;
        totalRevenue += (rentalFee + depositFee);
        activeRentersCount += 1;
      } else if (r.status === 'pending') {
        pendingRentersCount += 1;
      }
    });

    const occupiedLockers = lockers.filter(l => l.status === 'occupied' || l.status === 'assigned').length;
    const availableLockersCount = lockers.filter(l => l.status === 'available').length;
    const occupancyRate = lockers.length > 0 ? Math.round((occupiedLockers / lockers.length) * 100) : 0;

    return {
      totalRevenue,
      totalRentalIncome,
      totalKeyDeposits,
      activeRentersCount,
      pendingRentersCount,
      expiringSoonCount,
      occupiedLockers,
      availableLockersCount,
      occupancyRate,
    };
  }, [lockers, rentals]);

  // Export Locker Financial Excel Ledger
  const handleExportLockerExcel = () => {
    try {
      const exportData = rentals.map(r => {
        const renterName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.user_id || 'Student';
        const rentalFee = parseFloat(r.rental_fee || 250);
        const depositFee = parseFloat(r.deposit_fee || 200);
        const totalAmount = rentalFee + depositFee;

        return {
          'Agreement Date': r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
          'Locker Code': r.locker_number || 'N/A',
          'Location': r.location || 'Machine Shop',
          'Renter Name': renterName,
          'Student ID': r.id_number || 'N/A',
          'Course & Year': `${r.course || ''} ${r.year || ''}`.trim() || 'N/A',
          'Rental Duration': `${r.semester_count || 1} Semester(s)`,
          'Rental Fee (₱)': rentalFee.toFixed(2),
          'Key Deposit (₱)': depositFee.toFixed(2),
          'Total Paid (₱)': totalAmount.toFixed(2),
          'Payment Status': r.payment_status === 'paid' ? 'PAID' : 'PENDING',
          'Agreement Status': (r.status || 'pending').toUpperCase(),
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Locker Financial Ledger');
      XLSX.writeFile(wb, `UC_METC_Locker_Financial_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Failed to export locker financials:', err);
      alert('Failed to export locker financials Excel report.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">



        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Lock className="text-purple-600" size={32} /> Locker Management Portal
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              UC METC Multipurpose Cooperative Digital Locker Agreements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLockerSystemData}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="Refresh locker data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowAddLockerModal(true)}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus size={20} />
              <span>Register New Locker</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards (Strict Locker Financial Isolation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-purple-200 font-bold uppercase tracking-wider block">Total Locker Revenue</span>
            <strong className="text-3xl font-black mt-1 block">
              ₱{lockerMetrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
            <span className="text-[11px] text-purple-100 mt-2 block font-medium">
              Isolated from store merchandise sales
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Refundable Key Deposits</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">
              ₱{lockerMetrics.totalKeyDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
            <span className="text-[11px] text-slate-500 mt-2 block font-semibold">
              ₱200 held per active renter ({lockerMetrics.activeRentersCount} active)
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Semestral Rental Fees</span>
            <strong className="text-2xl font-black text-emerald-600 mt-1 block">
              ₱{lockerMetrics.totalRentalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
            <span className="text-[11px] text-slate-500 mt-2 block font-semibold">
              Net rental fees collected
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Locker Occupancy</span>
            <strong className="text-2xl font-black text-purple-700 mt-1 block">
              {lockerMetrics.occupancyRate}% <span className="text-xs font-normal text-slate-500">({lockerMetrics.occupiedLockers} / {lockers.length})</span>
            </strong>
            <span className="text-[11px] text-amber-600 mt-2 block font-bold">
              {lockerMetrics.pendingRentersCount} pending approval application(s)
            </span>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full">
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'rentals'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText size={18} />
            <span>1. Rental Agreements ({rentals.length})</span>
            {lockerMetrics.pendingRentersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {lockerMetrics.pendingRentersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'revenue'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign size={18} />
            <span>2. Locker Revenue & Trust Ledger</span>
          </button>
        </div>

        {/* TAB 2: RENTAL AGREEMENTS & SUBMISSIONS */}
        {activeTab === 'rentals' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, ID number, or locker code..."
                  value={rentalSearch}
                  onChange={(e) => setRentalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter Status:</span>
                {(['all', 'pending', 'active', 'expiring', 'terminated'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setRentalStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer capitalize flex items-center gap-1.5 ${
                      rentalStatusFilter === st
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{st === 'expiring' ? 'Expiring Soon' : st}</span>
                    {st === 'expiring' && lockerMetrics.expiringSoonCount > 0 && (
                      <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                        {lockerMetrics.expiringSoonCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rental Submissions Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold text-xs border-b border-slate-200">
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">Renter Name</th>
                    <th className="py-3.5 px-4">Locker Code</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Duration</th>
                    <th className="py-3.5 px-4 text-center">Term Expiry</th>
                    <th className="py-3.5 px-4 text-right">Key Deposit</th>
                    <th className="py-3.5 px-4 text-right">Rental Fee</th>
                    <th className="py-3.5 px-4 text-center">Payment Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRentals.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500">
                        No locker rental agreements found.
                      </td>
                    </tr>
                  ) : (
                    filteredRentals.map((r) => {
                      const renterName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.user_id || 'Student';
                      const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A';
                      const isPaid = r.payment_status === 'paid';
                      const dates = calculateRentalDates(r.created_at, r.semester_count || 1);

                      return (
                        <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{renterName}</div>
                            {r.id_number && <div className="text-[11px] font-mono text-slate-400 font-normal">{r.id_number}</div>}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-purple-900 whitespace-nowrap">
                            {r.locker_number || 'L-00'}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                            {r.location || 'Machine Shop'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                            {r.semester_count || 1} Sem ({dates.endDateStr.includes('Dec') ? 'Dec 19' : 'May'})
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {r.extension_status === 'pending_extension' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1">
                                <RefreshCw size={11} className="animate-spin text-purple-600" /> EXTENSION REQ
                              </span>
                            ) : dates.isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                🔴 EXPIRED
                              </span>
                            ) : dates.isExpiringSoon ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                ⚠️ {dates.daysRemaining} DAYS LEFT
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-600">
                                {dates.endDateStr}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-700 whitespace-nowrap">
                            ₱{parseFloat(r.deposit_fee || 200).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-700 whitespace-nowrap">
                            ₱{parseFloat(r.rental_fee || (250 * (r.semester_count || 1))).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                              isPaid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedAgreement(r);
                                setIsCleanVerified(false);
                                setIsKeyReturned(false);
                              }}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <Eye size={14} /> View Agreement
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LOCKER REVENUE & TRUST LEDGER */}
        {activeTab === 'revenue' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="text-emerald-600" size={24} /> Locker Rental Financial Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete audit trail of all locker fees and refundable key deposits. Fully isolated from main store sales.
                </p>
              </div>

              <button
                onClick={handleExportLockerExcel}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
              >
                <Download size={16} /> Export Locker Financials (Excel)
              </button>
            </div>

            {/* Detailed Ledger Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold text-xs border-b border-slate-200">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Renter Name</th>
                    <th className="py-3.5 px-4">Locker Code</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-right">Semestral Rental Fee</th>
                    <th className="py-3.5 px-4 text-right">Key Deposit (Held)</th>
                    <th className="py-3.5 px-4 text-right">Total Cashier Paid</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rentals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        No financial records found in locker ledger.
                      </td>
                    </tr>
                  ) : (
                    rentals.map((r) => {
                      const renterName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.user_id || 'Student';
                      const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A';
                      const rentalFee = parseFloat(r.rental_fee || 250);
                      const depositFee = parseFloat(r.deposit_fee || 200);
                      const totalAmount = rentalFee + depositFee;
                      const isPaid = r.payment_status === 'paid';

                      return (
                        <tr key={r.id} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {renterName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-purple-900 whitespace-nowrap">
                            {r.locker_number || 'L-00'}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                            {r.location || 'Machine Shop'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                            ₱{rentalFee.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-purple-700 whitespace-nowrap">
                            ₱{depositFee.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap text-base">
                            ₱{totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {(() => {
                              const isPendingTermination = r.status === 'pending_termination' || r.rental_status === 'pending_termination';
                              if (isPendingTermination) {
                                return (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-400 inline-flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-amber-600" /> TERMINATION REQUESTED
                                  </span>
                                );
                              }
                              return (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                                  isPaid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {isPaid ? 'PAID' : 'PENDING'}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: REGISTER NEW LOCKER */}
        {showAddLockerModal && createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Plus size={20} className="text-purple-600" /> Register Physical Locker
                </h3>
                <button onClick={() => setShowAddLockerModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateLocker} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Locker Code / Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. MS-13 - 2159"
                    value={newLockerCode}
                    onChange={(e) => setNewLockerCode(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Building / Location & Intended Course</label>
                  <select
                    value={newLockerBuilding}
                    onChange={(e) => setNewLockerBuilding(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Machine Shop">Machine Shop (BSMARE Exclusive)</option>
                    <option value="Seamanship Lab">Seamanship Lab (BSMT Exclusive)</option>
                    <option value="Basic Ed">Basic Ed (SHS Exclusive)</option>
                    <option value="AVR Building">AVR Building (Open to All Courses)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Locker Size</label>
                  <select
                    value={newLockerSize}
                    onChange={(e) => setNewLockerSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLockerModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold shadow-md transition-all cursor-pointer"
                  >
                    Register Locker
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL: VIEW PRINTABLE DIGITAL AGREEMENT FORM (MATCHING PAPER DOCUMENT WITH STAMPS) */}
        {selectedAgreement && createPortal(
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border-2 border-purple-200 relative animate-modal-pop my-4">

              {/* Close Button Top Right */}
              <button
                onClick={() => setSelectedAgreement(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              {/* Paper Header */}
              <div className="text-center border-b pb-4 relative mb-5">
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                  Locker Rental Agreement
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  University of Cebu - METC Multipurpose Cooperative (UC-METC MPC) &nbsp;|&nbsp; UCMETC Campus, Alumnos, Mambaling, Cebu City | Tel: 410-8811 local 5155
                </p>
              </div>

              {/* Extension Pending Banner */}
              {selectedAgreement.extension_status === 'pending_extension' && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-300 rounded-xl text-purple-950 text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={20} className="text-purple-600 animate-spin flex-shrink-0" />
                    <div>
                      <p className="font-extrabold text-purple-950 text-sm">Semester Extension Requested by Renter</p>
                      <p className="text-[11px] text-purple-800 mt-0.5">
                        Renter requested to extend by +{selectedAgreement.pending_extension_semesters || 1} Semester (+{(selectedAgreement.pending_extension_semesters || 1) * 5} Months). Collect ₱{parseFloat(selectedAgreement.pending_extension_fee || 250).toFixed(2)} semestral rental fee.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApproveExtension(selectedAgreement.rental_id || selectedAgreement.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    Approve Extension (+₱{parseFloat(selectedAgreement.pending_extension_fee || 250).toFixed(2)})
                  </button>
                </div>
              )}

              {/* Pending Termination Alert Banner */}
              {(selectedAgreement.status === 'pending_termination' || selectedAgreement.rental_status === 'pending_termination') && (
                <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-950 text-sm">Locker Termination Requested by Student</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">The student has requested to vacate this locker and return the key. Please verify locker cleanliness (no stains) and key return below before approving termination.</p>
                  </div>
                </div>
              )}

              {/* Two-column body */}
              {(() => {
                const dates = calculateRentalDates(
                  selectedAgreement.paid_at || selectedAgreement.created_at,
                  selectedAgreement.semester_count || 1,
                  parseFloat(selectedAgreement.deposit_fee || 200),
                  selectedAgreement.payment_status === 'paid'
                );
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-800">

                    {/* LEFT: Renter Info + Fees */}
                    <div className="space-y-4">
                      <p className="leading-relaxed text-xs">
                        This Locker Rental Agreement is made and entered into this <strong>{dates.startDateStr}</strong> by and between <strong>UNIVERSITY OF CEBU-METC MULTIPURPOSE COOPERATIVE</strong> and:
                      </p>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 block">Renter Name:</span>
                          <strong className="text-slate-900">{selectedAgreement.first_name || ''} {selectedAgreement.last_name || ''}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Student ID / Course:</span>
                          <strong className="text-slate-900">{selectedAgreement.id_number || 'N/A'} ({selectedAgreement.course || 'METC'})</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Location & Locker Code:</span>
                          <strong className="text-purple-700 font-mono">{selectedAgreement.location || 'Machine Shop'} — {selectedAgreement.locker_number || 'L-00'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Term Duration:</span>
                          <strong className="text-slate-900">{dates.termLabel}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Term Expiry Date:</span>
                          <strong className="text-purple-900 font-bold">{dates.endDateStr}</strong>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-2 text-xs">
                        <h4 className="font-extrabold text-purple-950 uppercase tracking-wider">Rental & Deposit Fees Summary</h4>
                        <div className="flex justify-between">
                          <span>Rental Fee ({selectedAgreement.semester_count || 1} Semester):</span>
                          <strong className="text-slate-900">₱{parseFloat(selectedAgreement.rental_fee || (250 * (selectedAgreement.semester_count || 1))).toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Initial Key Deposit:</span>
                          <strong className="text-slate-900">₱200.00</strong>
                        </div>

                        {dates.isExpired && (
                          <div className="flex justify-between items-center text-red-700 font-bold bg-red-100/70 p-2 rounded-lg border border-red-300 mt-1">
                            <span>Overdue Key Penalty ({dates.overdueWeeks} wk @ ₱50/wk):</span>
                            <span>-₱{dates.penaltyAmount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between border-t border-purple-200 pt-1.5 font-black text-purple-950 text-sm">
                          <span>Net Refundable Key Deposit:</span>
                          <span className={dates.isExpired ? 'text-amber-800' : 'text-emerald-700'}>
                            ₱{dates.netDepositRefund.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Terms & Turnover Verification */}
                    <div className="space-y-4 flex flex-col justify-between">
                      {(dates.isExpired || dates.isExpiringSoon || selectedAgreement.status === 'pending_termination' || selectedAgreement.rental_status === 'pending_termination') && (
                        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2 text-xs animate-fade-in">
                          <h4 className="font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare size={16} className="text-amber-600" /> End of Semester Clearance Verification
                          </h4>
                          <p className="text-[11px] text-amber-900 leading-snug">
                            Verify the following before vacating locker and releasing ₱{dates.netDepositRefund.toFixed(2)} deposit refund:
                          </p>
                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-amber-200">
                              <input
                                type="checkbox"
                                checked={isCleanVerified}
                                onChange={(e) => setIsCleanVerified(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="font-bold text-slate-800 text-xs">Locker Inspected: Clean & Stain-Free</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-amber-200">
                              <input
                                type="checkbox"
                                checked={isKeyReturned}
                                onChange={(e) => setIsKeyReturned(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="font-bold text-slate-800 text-xs">Locker Key Surrendered to Office</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 leading-relaxed">
                        <p className="font-bold text-slate-700 mb-2 uppercase tracking-wide text-[10px]">Terms & Penalty Policy</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>1 Semester duration = 5 Months.</li>
                          <li>Renter must clean locker (no stains/damage) before returning key.</li>
                          <li>Late key returns: <strong>₱50 deduction per week overdue</strong> from ₱200 deposit.</li>
                        </ul>
                      </div>

                      <div className="text-right text-xs border-t border-slate-200 pt-3">
                        <span className="text-slate-400 block text-[10px]">Approved Date:</span>
                        <span className="font-bold text-slate-800">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t">

                {(selectedAgreement.status === 'active' || selectedAgreement.status === 'pending_termination' || selectedAgreement.rental_status === 'pending_termination') && (
                  <button
                    onClick={() => {
                      setTargetTerminateId(selectedAgreement.rental_id || selectedAgreement.id || '');
                      if (!isCleanVerified || !isKeyReturned) {
                        setShowUnverifiedWarningModal(true);
                      } else {
                        setShowTerminateConfirmModal(true);
                      }
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertTriangle size={14} /> Vacate & Refund Deposit (₱{calculateRentalDates(selectedAgreement.created_at, selectedAgreement.semester_count || 1, parseFloat(selectedAgreement.deposit_fee || 200)).netDepositRefund.toFixed(2)})
                  </button>
                )}

                {selectedAgreement.payment_status !== 'paid' && (
                  <button
                    onClick={() => handleApproveAndMarkPaid(selectedAgreement.rental_id || selectedAgreement.id)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare size={16} /> Approve and Paid
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>,
          document.body
        )}

        {/* MODAL: UNVERIFIED CHECKLIST WARNING */}
        {showUnverifiedWarningModal && createPortal(
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-amber-200 text-center animate-modal-pop relative space-y-5">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border-4 border-amber-50">
                <AlertTriangle size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Verification Warning</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Clean locker inspection or key return verification is not checked.
                </p>
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 text-left space-y-2 text-xs text-amber-950 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isCleanVerified ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Locker Clean & Inspection: <strong>{isCleanVerified ? 'Verified ✓' : 'Unchecked ✕'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isKeyReturned ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Locker Key Surrendered: <strong>{isKeyReturned ? 'Verified ✓' : 'Unchecked ✕'}</strong></span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  Do you still want to proceed with terminating & vacating this locker?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnverifiedWarningModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnverifiedWarningModal(false);
                    setShowTerminateConfirmModal(true);
                  }}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL: CUSTOM CONFIRM TERMINATION */}
        {showTerminateConfirmModal && createPortal(
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-modal-pop relative space-y-5">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-50">
                <AlertTriangle size={28} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Terminate & Vacate Locker?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to terminate this locker rental agreement? The key deposit will be marked as refunded and the physical locker will be vacated.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTerminateConfirmModal(false);
                    setTargetTerminateId('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeTerminateRental(targetTerminateId)}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {actionLoading ? 'Terminating...' : 'Confirm Termination'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
};

