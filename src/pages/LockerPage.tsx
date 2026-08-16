import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertTriangle, Info, Loader2, Key, ChevronLeft, Menu, Search, MapPin, ShieldCheck, FileText, CheckSquare, Calendar, RefreshCw, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/api';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';

const DEFAULT_SAMPLE_LOCKERS: any[] = [];

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
      startDateStr: 'Pending Payment & Key Claim',
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

export const LockerPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSidebarOpen, showNotification } = useUIStore();
  const { user } = useAuth();

  const [showTerminateConfirmModal, setShowTerminateConfirmModal] = useState<boolean>(false);
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);
  const [extendSemesters, setExtendSemesters] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRental, setMyRental] = useState<any>(null);
  const [availableLockers, setAvailableLockers] = useState<any[]>([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSize, _setSelectedSize] = useState<string>('all');

  // Form State
  const [selectedLocker, setSelectedLocker] = useState<any>(null);
  const [renterName, setRenterName] = useState<string>('');
  const [renterAddress, setRenterAddress] = useState<string>('');
  const [renterContact, setRenterContact] = useState<string>('');
  const [semesterCount, setSemesterCount] = useState<number>(1);

  // Agreement Checkboxes
  const [agreedLockerDetails, setAgreedLockerDetails] = useState<boolean>(true);
  const [agreedFees, setAgreedFees] = useState<boolean>(true);
  const [agreedConditions, setAgreedConditions] = useState<boolean>(false);
  const [agreedAccess, setAgreedAccess] = useState<boolean>(false);
  const [agreedTermination, setAgreedTermination] = useState<boolean>(false);
  const [agreedLiability, setAgreedLiability] = useState<boolean>(false);
  const [digitalSignature, setDigitalSignature] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Auto-fill user profile info & course location recommendation
  useEffect(() => {
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      setRenterName(fullName);
      setDigitalSignature(fullName);

      // Course-based default location selection
      const c = (user.course || '').toUpperCase();
      if (c.includes('BSMARE') || c.includes('MARINE ENG')) {
        setSelectedLocation('Machine Shop');
      } else if (c.includes('BSMT') || c.includes('TRANSPORT')) {
        setSelectedLocation('Seamanship Lab');
      } else if (c.includes('SHS') || c.includes('SENIOR') || c.includes('HIGH')) {
        setSelectedLocation('Basic Ed');
      }
    }
  }, [user]);

  const fetchLockerData = async () => {
    try {
      setLoading(true);
      setError('');
      const localPendingKey = `coop_pending_locker_${user?.id || 'guest'}`;
      const savedPending = localStorage.getItem(localPendingKey);

      // Fetch current student's rental
      const rentalRes = await apiClient.getMyLocker().catch(() => null);
      if (rentalRes && rentalRes.rental) {
        setMyRental(rentalRes.rental);
      } else if (savedPending) {
        try {
          setMyRental(JSON.parse(savedPending));
        } catch (e) {
          setMyRental(null);
        }
      } else {
        setMyRental(null);
      }

      // Fetch available lockers
      try {
        const availableRes = await apiClient.getAvailableLockers();
        if (availableRes && availableRes.lockers && availableRes.lockers.length > 0) {
          setAvailableLockers(availableRes.lockers);
        } else {
          setAvailableLockers(DEFAULT_SAMPLE_LOCKERS);
        }
      } catch (e) {
        console.warn('Backend locker query returned error, using sample set:', e);
        setAvailableLockers(DEFAULT_SAMPLE_LOCKERS);
      }
    } catch (err: any) {
      console.error('Error fetching locker data:', err);
      setAvailableLockers(DEFAULT_SAMPLE_LOCKERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockerData();
  }, [user]);

  // Determine student course exclusive locker location
  const userCourse = (user?.course || 'BSMT').toUpperCase();
  let allowedLocationKeyword = 'seamanship';
  let courseTargetLabel = 'Seamanship Lab (BSMT Exclusive)';

  if (userCourse.includes('BSMARE') || userCourse.includes('MARE')) {
    allowedLocationKeyword = 'machine shop';
    courseTargetLabel = 'Machine Shop (BSMARE Exclusive)';
  } else if (userCourse.includes('BSMT') || userCourse.includes('MT')) {
    allowedLocationKeyword = 'seamanship';
    courseTargetLabel = 'Seamanship Lab (BSMT Exclusive)';
  } else if (userCourse.includes('SHS') || userCourse.includes('JHS') || userCourse.includes('HIGH')) {
    allowedLocationKeyword = 'basic ed';
    courseTargetLabel = 'Basic Ed (SHS Exclusive)';
  } else {
    allowedLocationKeyword = 'avr';
    courseTargetLabel = 'AVR Building (Open to All Courses)';
  }

  // Filter available lockers strictly based on student's registered course location
  const filteredLockers = availableLockers.filter(locker => {
    const loc = (locker.location || '').toLowerCase();
    const code = (locker.locker_number || locker.lockerId || '').toLowerCase();

    // Strict Course Location Check (Course Exclusive + AVR Building Open to All)
    const matchesCourseLoc = loc.includes(allowedLocationKeyword) || loc.includes('avr');
    if (!matchesCourseLoc) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return code.includes(q) || loc.includes(q);
    }
    return true;
  });

  const handleSelectLocker = (locker: any) => {
    setSelectedLocker(locker);
    setError('');
    setAgreedConditions(false);
    setAgreedAccess(false);
    setAgreedTermination(false);
    setAgreedLiability(false);
    // Scroll down to agreement form smoothly
    setTimeout(() => {
      document.getElementById('locker-rental-agreement-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocker) {
      showNotification('Please search and select an available locker first.', 'error');
      return;
    }
    if (!renterName.trim()) {
      showNotification('Please fill out your full renter name.', 'error');
      return;
    }
    if (!renterContact.trim()) {
      showNotification('Please fill out your contact number.', 'error');
      return;
    }
    if (!renterAddress.trim()) {
      showNotification('Please complete your residing address.', 'error');
      return;
    }
    if (!agreedConditions || !agreedAccess || !agreedTermination || !agreedLiability) {
      showNotification('Please accept all Locker Rental Agreement terms and conditions to proceed.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const rentalFee = 250 * semesterCount;
      const depositFee = 200;
      const totalFee = rentalFee + depositFee;

      const newRentalObj = {
        rental_id: 'pending-' + Date.now(),
        locker_id: selectedLocker.id,
        locker_number: selectedLocker.locker_number || selectedLocker.lockerId || 'SL-109',
        location: selectedLocker.location || 'Seamanship Lab',
        floor: selectedLocker.floor || 'Ground Floor',
        rental_status: 'pending',
        payment_status: 'pending',
        rental_fee: rentalFee,
        deposit_fee: depositFee,
        total_amount: totalFee,
        semester_count: semesterCount,
        created_at: new Date().toISOString(),
        renter_name: renterName,
        contact_number: renterContact,
        address: renterAddress,
        id_number: user?.id_number || '22682702',
        first_name: user?.first_name || renterName.split(' ')[0],
        last_name: user?.last_name || renterName.split(' ').slice(1).join(' '),
        course: user?.course || 'BSMT',
        year: user?.year || '1'
      };

      if (!selectedLocker.id.startsWith('sample-')) {
        try {
          await apiClient.applyForLocker(selectedLocker.id, semesterCount, true);
        } catch (e) {
          console.warn('API applyForLocker warning:', e);
        }
      }

      // Save student pending status
      const localPendingKey = `coop_pending_locker_${user?.id || 'guest'}`;
      localStorage.setItem(localPendingKey, JSON.stringify(newRentalObj));

      // Push to global admin pending rentals list for Locker Management Page
      try {
        const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
        const list = savedGlobal ? JSON.parse(savedGlobal) : [];
        list.unshift(newRentalObj);
        localStorage.setItem('coop_global_pending_lockers', JSON.stringify(list));
      } catch (e) {
        console.error('Failed to save to global pending lockers list', e);
      }

      showNotification('Your Locker Rental Agreement has been submitted! It is now pending approval at the Coop Office.', 'success');
      setMyRental(newRentalObj);
      setSelectedLocker(null);
    } catch (err: any) {
      console.error('Error applying for locker:', err);
      showNotification(err.message || 'Failed to submit locker application.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const executeTerminate = async () => {
    if (!myRental) return;

    try {
      setSubmitting(true);
      setError('');

      const updatedRentalObj = {
        ...myRental,
        status: 'pending_termination',
        rental_status: 'pending_termination',
        termination_requested_at: new Date().toISOString(),
      };

      // Save student local storage with pending_termination status
      const localPendingKey = `coop_pending_locker_${user?.id || 'guest'}`;
      localStorage.setItem(localPendingKey, JSON.stringify(updatedRentalObj));

      // Save/Update in coop_global_pending_lockers
      try {
        const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
        let list = savedGlobal ? JSON.parse(savedGlobal) : [];
        const targetId = myRental.rental_id || myRental.id;
        let found = false;
        list = list.map((g: any) => {
          if ((g.rental_id || g.id) === targetId || g.locker_number === myRental.locker_number) {
            found = true;
            return {
              ...g,
              status: 'pending_termination',
              rental_status: 'pending_termination',
              termination_requested_at: new Date().toISOString(),
            };
          }
          return g;
        });
        if (!found) {
          list.unshift(updatedRentalObj);
        }
        localStorage.setItem('coop_global_pending_lockers', JSON.stringify(list));
      } catch (e) {}

      showNotification('Locker termination request submitted. Please present your key at the COOP office for final approval.', 'success');
      setMyRental(updatedRentalObj);
      setShowTerminateConfirmModal(false);
      fetchLockerData();
    } catch (err: any) {
      console.error('Error terminating locker rental:', err);
      showNotification('Failed to terminate locker rental.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const executeExtendRental = async () => {
    if (!myRental) return;

    try {
      setSubmitting(true);
      setError('');

      const addedSemesters = extendSemesters;
      const addedFee = 250 * addedSemesters;
      const currentSemesters = myRental.semester_count || 1;
      const newTotalSemesters = currentSemesters + addedSemesters;

      const updatedRentalObj = {
        ...myRental,
        semester_count: newTotalSemesters,
        extension_status: 'pending_extension',
        pending_extension_semesters: addedSemesters,
        pending_extension_fee: addedFee,
        extension_requested_at: new Date().toISOString(),
      };

      // Save local student pending storage
      const localPendingKey = `coop_pending_locker_${user?.id || 'guest'}`;
      localStorage.setItem(localPendingKey, JSON.stringify(updatedRentalObj));

      // Save to global pending lockers list
      try {
        const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
        let list = savedGlobal ? JSON.parse(savedGlobal) : [];
        const targetId = myRental.rental_id || myRental.id;
        let found = false;
        list = list.map((g: any) => {
          if ((g.rental_id || g.id) === targetId || g.locker_number === myRental.locker_number) {
            found = true;
            return {
              ...g,
              semester_count: newTotalSemesters,
              extension_status: 'pending_extension',
              pending_extension_semesters: addedSemesters,
              pending_extension_fee: addedFee,
              extension_requested_at: new Date().toISOString(),
            };
          }
          return g;
        });
        if (!found) {
          list.unshift(updatedRentalObj);
        }
        localStorage.setItem('coop_global_pending_lockers', JSON.stringify(list));
      } catch (e) {}

      showNotification(`Semester Extension requested (+${addedSemesters} semester / +${addedSemesters * 5} months)! Please visit the COOP office to pay ₱${addedFee.toFixed(2)}.`, 'success');
      setMyRental(updatedRentalObj);
      setShowExtendModal(false);
    } catch (err: any) {
      console.error('Error extending locker rental:', err);
      showNotification('Failed to submit semester extension request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Fees calculation
  const rentalFee = 250 * semesterCount;
  const depositFee = 200;
  const totalFee = rentalFee + depositFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Loading locker rental portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] text-slate-800 p-4 sm:p-6 lg:p-8 animate-slide-in-right">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-slate-700" />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex p-2.5 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-sm active:scale-95 text-slate-700 cursor-pointer"
              title="Back to Dashboard"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
                <Lock className="text-purple-600" size={28} /> Online Locker Rental Agreement
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">UC METC Multipurpose Cooperative (UC-METC MPC)</p>
            </div>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl text-green-700 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {myRental ? (
          /* ── MY CURRENT ACTIVE / PENDING LOCKER STATUS ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-confirm-pop">
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-xs text-white rounded-full text-xs font-black uppercase tracking-wider">
                    {myRental.status === 'pending_termination' || myRental.rental_status === 'pending_termination'
                      ? 'Termination Requested (Pending Admin Approval)'
                      : myRental.rental_status === 'active' || myRental.status === 'active'
                      ? 'Active Locker Rental'
                      : 'Application Pending Approval'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black mt-3 flex items-center gap-3">
                    Locker {myRental.locker_number}
                  </h2>
                  <p className="text-sm text-purple-100 font-medium mt-1 flex items-center gap-1.5">
                    <MapPin size={16} /> {myRental.location}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-center">
                  <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">Deposit Held</span>
                  <strong className="text-lg font-black text-white">₱{parseFloat(myRental.deposit_fee || 200).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {(() => {
                const dates = calculateRentalDates(
                  myRental.paid_at || myRental.created_at,
                  myRental.semester_count || 1,
                  parseFloat(myRental.deposit_fee || 200),
                  myRental.payment_status === 'paid'
                );
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Details Column */}
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-4 border-b pb-2 flex items-center gap-2">
                          <Lock size={18} className="text-purple-600" /> Rental Agreement Specs
                        </h3>
                        <div className="space-y-3.5 text-sm">
                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Locker Code:</span>
                            <span className="font-bold text-slate-900 font-mono">{myRental.locker_number}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Location:</span>
                            <span className="font-bold text-slate-900">{myRental.location}</span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Duration Term:</span>
                            <span className="font-bold text-slate-900">{dates.termLabel}</span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Start Date:</span>
                            <span className="font-bold text-slate-800">{dates.startDateStr}</span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Term Expiry Date:</span>
                            <span className="font-extrabold text-purple-900">{dates.endDateStr}</span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Term Status:</span>
                            {dates.isPending ? (
                              <span className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-full font-black text-xs uppercase animate-pulse">
                                ⏳ Pending Payment & Key Issuance
                              </span>
                            ) : dates.isExpired ? (
                              <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full font-black text-xs uppercase animate-pulse">
                                🔴 Term Expired ({dates.overdueDays} Days Late)
                              </span>
                            ) : dates.isExpiringSoon ? (
                              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-xs uppercase animate-pulse">
                                ⚠️ Expiring Soon ({dates.daysRemaining} Days Left)
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-black text-xs uppercase">
                                🟢 Active ({dates.daysRemaining} Days Left)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financial Status Column */}
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-4 border-b pb-2 flex items-center gap-2">
                          <FileText size={18} className="text-purple-600" /> Financial & Deposit Summary
                        </h3>
                        <div className="space-y-3.5 text-sm mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Semestral Rental Fee:</span>
                            <span className="font-bold text-slate-900">₱{parseFloat(myRental.rental_fee || 250 * (myRental.semester_count || 1)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Initial Key Deposit:</span>
                            <span className="font-bold text-slate-900">₱200.00</span>
                          </div>

                          {dates.isExpired && (
                            <div className="flex justify-between items-center text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                              <span>Overdue Key Penalty ({dates.overdueWeeks} wk @ ₱50/wk):</span>
                              <span>-₱{dates.penaltyAmount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center border-t pt-2.5">
                            <span className="text-slate-900 font-black">Estimated Net Deposit Refund:</span>
                            <span className={`font-black text-base ${dates.isExpired ? 'text-amber-700' : 'text-emerald-700'}`}>
                              ₱{dates.netDepositRefund.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons & Status Alerts */}
                        {(myRental.payment_status === 'pending' || myRental.rental_status === 'pending' || myRental.status === 'pending') && (
                          <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-purple-300 text-slate-800 text-xs flex items-start gap-3 shadow-md animate-fade-in">
                            <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm mt-0.5">
                              <MapPin size={22} />
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-purple-200/80 pb-2">
                                <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-1.5">
                                  <Info size={16} className="text-purple-600" /> Action Required: Visit COOP Office to Pay & Get Key
                                </h4>
                                <span className="px-2.5 py-0.5 bg-purple-200/80 text-purple-900 font-extrabold text-[10px] rounded-full uppercase tracking-wider self-start sm:self-auto">
                                  Pending Payment & Key Issuance
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed pt-1">
                                Your digital locker agreement has been registered! Please head to the <strong>UC-METC Multipurpose Cooperative (MPC) Office</strong> to complete activation:
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-slate-700 font-semibold text-[11px] bg-white/70 p-3 rounded-xl border border-purple-100 mt-2">
                                <li>Pay Total Amount: <strong className="text-purple-700">₱{(parseFloat(myRental.rental_fee || (250 * (myRental.semester_count || 1))) + parseFloat(myRental.deposit_fee || 200)).toFixed(2)}</strong> (₱{(250 * (myRental.semester_count || 1)).toFixed(2)} semestral rent + ₱200 refundable key deposit).</li>
                                <li>Present your Student ID to COOP staff to collect your physical <strong>Locker Key</strong>.</li>
                                <li>Staff will approve your digital agreement and mark your record <strong>PAID</strong>.</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {(myRental.rental_status === 'pending_termination' || myRental.status === 'pending_termination') && (
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5 shadow-xs">
                            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                            <div>
                              <p className="font-extrabold text-amber-950 text-sm">Termination Requested</p>
                              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">Your request to vacate this locker is pending approval at the COOP office. Clean your locker and present your key to staff to receive your deposit refund (Est. ₱{dates.netDepositRefund.toFixed(2)}).</p>
                            </div>
                          </div>
                        )}

                        {(myRental.rental_status === 'active' || myRental.status === 'active') && myRental.payment_status === 'paid' && (
                          <div className="space-y-3">
                            {myRental.extension_status === 'pending_extension' ? (
                              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                                <Info size={18} className="text-purple-600 flex-shrink-0" />
                                <div>
                                  <p className="font-extrabold text-purple-950">Semester Extension Request Submitted!</p>
                                  <p className="text-[11px] text-purple-800 mt-0.5">Please visit the COOP office to pay the ₱{parseFloat(myRental.pending_extension_fee || 250).toFixed(2)} extension fee for +{myRental.pending_extension_semesters || 1} Semester(s).</p>
                                </div>
                              </div>
                            ) : (dates.isExpiringSoon || dates.isExpired) ? (
                              <button
                                onClick={() => setShowExtendModal(true)}
                                disabled={submitting}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 animate-pulse"
                              >
                                <RefreshCw size={16} /> Extend Rental for Another Semester (+5 Months)
                              </button>
                            ) : null}

                            <button
                              onClick={() => setShowTerminateConfirmModal(true)}
                              disabled={submitting}
                              className="w-full py-3 bg-slate-100 hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Key size={16} /> Turnover Locker & Claim Deposit Refund (Est. ₱{dates.netDepositRefund.toFixed(2)})
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OVERDUE KEY PENALTY WARNING BANNER IF EXPIRED */}
                    {dates.isExpired && (
                      <div className="p-5 bg-gradient-to-r from-red-50 via-amber-50 to-red-50 rounded-2xl border-2 border-red-300 text-red-950 shadow-md space-y-2.5 animate-pulse">
                        <div className="flex items-center gap-2 text-red-900 font-black text-sm border-b border-red-200/80 pb-2">
                          <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
                          ⚠️ Overdue Key Return Penalty Notice (₱50 / Week)
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          Your locker rental term expired <strong>{dates.overdueDays} day(s) ago</strong> ({dates.overdueWeeks} week(s) overdue). Per UC-METC COOP policy, failure to return the locker key on time results in a <strong>₱50 deduction from your ₱200 key deposit for every week overdue</strong>:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                          <div className="p-2.5 bg-white rounded-xl border border-red-200 text-center">
                            <span className="text-[10px] text-slate-400 block font-medium">Initial Deposit</span>
                            <strong className="text-slate-800">₱200.00</strong>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-red-200 text-center">
                            <span className="text-[10px] text-red-500 block font-medium">Overdue ({dates.overdueWeeks} Wk)</span>
                            <strong className="text-red-600">-₱{dates.penaltyAmount.toFixed(2)}</strong>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-center col-span-2">
                            <span className="text-[10px] text-emerald-600 block font-medium">Net Refund Remaining</span>
                            <strong className="text-emerald-700 text-sm">₱{dates.netDepositRefund.toFixed(2)}</strong>
                          </div>
                        </div>
                        <p className="text-[11px] text-red-800 font-bold pt-1">
                          * Please clean your locker and surrender your key at the UC-METC MPC Office immediately to stop further weekly ₱50 deductions!
                        </p>
                      </div>
                    )}

                    {/* ── SEMESTER ENDING & LOCKER CLEARANCE NOTICE BANNER ── */}
                    <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border-2 border-amber-200/80 text-amber-950 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                        <h4 className="font-black text-amber-900 text-sm flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                          End-of-Semester Locker Clearance & Key Return Rules
                        </h4>
                        <span className="px-2.5 py-0.5 bg-amber-200/80 text-amber-900 rounded-full text-[11px] font-extrabold uppercase tracking-wider self-start sm:self-auto">
                          Fixed Academic Semester Term
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        Notice to all locker renters: Locker rentals are valid for the full academic semester term (<strong>1st Sem ends Dec 19th; 2nd Sem ends in May</strong>). When your rental term finishes, or if you choose not to renew:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-[11px]">1</span>
                            <p className="font-extrabold text-amber-950 text-xs">Clean Locker Thoroughly</p>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">Empty all personal belongings and ensure there are <strong>no stains, marks, or sticky residue</strong> inside or outside the locker.</p>
                        </div>

                        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-[11px]">2</span>
                            <p className="font-extrabold text-amber-950 text-xs">Return Key On Time</p>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">Return key at term end date. Late returns incur a <strong>₱50 penalty deduction per week late</strong> from key deposit.</p>
                        </div>

                        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-[11px]">3</span>
                            <p className="font-extrabold text-emerald-950 text-xs">Claim Remaining Deposit</p>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">Upon clean inspection pass and key surrender, remaining key deposit will be released immediately!</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          /* ── SEARCH & RENT WORKFLOW ── */
          <div className="space-y-8">

            {/* ── WELCOME HERO (shown before Step 1) ── */}
            {showWelcome ? (
              <div className="animate-fade-in">
                {/* Hero Banner (Medium Compact Box) */}
                <div className="relative bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 rounded-2xl overflow-hidden p-6 sm:p-8 text-white shadow-lg mb-6">
                  {/* decorative circles */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
                  <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/5 rounded-full" />

                  <div className="relative z-10 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-2.5">
                      <Lock size={12} /> UC-METC MPC Online Locker Rental
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2.5">
                      Rent a Campus Locker Fully Online
                    </h2>
                    <p className="text-purple-100 text-xs sm:text-sm leading-relaxed mb-5 max-w-xl text-justify">
                      UC METC Multipurpose Cooperative now lets you reserve a locker right here on the portal. No need to visit the office first. Search for an available locker, fill out your digital agreement form, then head to the coop office to complete payment and collect your key.
                    </p>
                    <button
                      onClick={() => setShowWelcome(false)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-800 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      <Search size={16} />
                      Search Available Lockers
                    </button>
                  </div>
                </div>

                {/* How It Works */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Info size={20} className="text-purple-600" /> How the Locker Rental Process Works
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Step 1 */}
                    <div className="flex flex-col items-start p-5 bg-purple-50 rounded-2xl border border-purple-100 relative">
                      <span className="w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm mb-3 shadow-md">1</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-1">Search Available Lockers</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Browse available lockers by campus location. Each building is designated to a specific course (BSMARE, BSMT, SHS, or open to all).
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-start p-5 bg-indigo-50 rounded-2xl border border-indigo-100 relative">
                      <span className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm mb-3 shadow-md">2</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-1">Fill Out the Online Agreement Form</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Select a locker and complete the digital Locker Rental Agreement Form — the same official form used at the coop office, now online.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-start p-5 bg-amber-50 rounded-2xl border border-amber-100 relative">
                      <span className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black text-sm mb-3 shadow-md">3</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-1">Pay at the Coop Office</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        After submitting your form online, visit the UC-METC MPC Office to pay the rental fee (₱250/sem) and refundable key deposit (₱200).
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-start p-5 bg-emerald-50 rounded-2xl border border-emerald-100 relative">
                      <span className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-sm mb-3 shadow-md">4</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mb-1">Collect Your Key & Get Stamped</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        The staff will approve your digital agreement, issue your locker key, and mark your record <strong>PAID</strong>. Your locker is now officially yours!
                      </p>
                    </div>
                  </div>

                  {/* Location Guide */}
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h4 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                      <MapPin size={16} className="text-purple-600" /> Campus Locker Locations & Course Eligibility
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                        <p className="font-black text-amber-900 text-xs">Machine Shop</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">BSMARE Exclusive</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                        <p className="font-black text-indigo-900 text-xs">Seamanship Lab</p>
                        <p className="text-[11px] text-indigo-700 mt-0.5">BSMT Exclusive</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                        <p className="font-black text-emerald-900 text-xs">Basic Ed</p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">SHS Exclusive</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                        <p className="font-black text-blue-900 text-xs">AVR Building</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">Open to All Courses</p>
                      </div>
                    </div>
                  </div>

                  {/* Fee Summary */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={20} className="text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">Rental Fees Summary</p>
                        <p className="text-xs text-slate-500">Payable at the UC-METC MPC Office after online form submission</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-medium">1 Semester</p>
                        <p className="font-black text-purple-700">₱450.00</p>
                        <p className="text-[10px] text-slate-400">(₱250 rent + ₱200 deposit)</p>
                      </div>
                      <div className="w-px h-10 bg-slate-200" />
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-medium">2 Semesters</p>
                        <p className="font-black text-purple-700">₱700.00</p>
                        <p className="text-[10px] text-slate-400">(₱500 rent + ₱200 deposit)</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button at bottom */}
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowWelcome(false)}
                      className="inline-flex items-center gap-2.5 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      <Search size={18} />
                      I Understand — Let Me Search for a Locker
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-8">
            {/* Back to Welcome link */}
            <button
              onClick={() => setShowWelcome(true)}
              className="flex items-center gap-1.5 text-sm text-purple-700 hover:text-purple-900 font-bold cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} /> Back to How It Works
            </button>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider">Step 1</span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">Search Available Lockers</h2>
                  <p className="text-sm text-slate-500">Find an unassigned locker across campus before filling up your agreement form.</p>
                </div>

                {/* Course Exclusive Location Badge */}
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-900 shadow-xs">
                  <Lock size={16} className="text-purple-600 flex-shrink-0" />
                  <span>Lockers for <strong>{user?.course || 'BSMT'}</strong> Course</span>
                </div>
              </div>

              {/* Search Bar Input */}
              <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search locker code (e.g. MS-13 - 2159) or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Locker Grid Cards */}
              {filteredLockers.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Lock size={44} className="text-slate-400 mx-auto mb-2" />
                  <p className="font-extrabold text-slate-700 text-base">No available lockers found</p>
                  <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting another location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLockers.map((locker) => {
                    const isSelected = selectedLocker?.id === locker.id;
                    const code = locker.locker_number || locker.lockerId || 'L-00';
                    const location = locker.location || 'Machine Shop';
                    const floor = locker.floor || 'Ground Floor';
                    const size = locker.size || 'Medium';

                    let courseTarget = 'Open to All Courses';
                    let courseBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                    const locLower = location.toLowerCase();
                    if (locLower.includes('machine shop')) {
                      courseTarget = 'BSMARE Course Exclusive';
                      courseBadgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
                    } else if (locLower.includes('seamanship')) {
                      courseTarget = 'BSMT Course Exclusive';
                      courseBadgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-300';
                    } else if (locLower.includes('basic ed')) {
                      courseTarget = 'SHS (Senior High) Exclusive';
                      courseBadgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                    }

                    return (
                      <div
                        key={locker.id}
                        onClick={() => handleSelectLocker(locker)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[11px] font-mono text-purple-700 font-bold uppercase tracking-wider">
                              {location}
                            </span>
                            <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                              Locker {code}
                            </h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-100 text-green-800 border border-green-300">
                            Available
                          </span>
                        </div>

                        <div className="mb-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${courseBadgeColor}`}>
                            {courseTarget}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Rental + Deposit</span>
                            <strong className="text-purple-700 font-black text-sm">₱450.00 <span className="text-[10px] font-normal text-slate-500">/sem</span></strong>
                          </div>
                          <button
                            type="button"
                            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-800 group-hover:bg-purple-600 group-hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Select & Fill Form'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* STEP 2: OFFICIAL LOCKER RENTAL AGREEMENT FORM (MATCHING PAPER DOCUMENT) */}
            {selectedLocker && (
              <form
                id="locker-rental-agreement-form"
                onSubmit={handleApply}
                noValidate
                className="bg-white rounded-2xl border-2 border-purple-200 shadow-2xl overflow-hidden animate-fade-in"
              >
                {/* Paper Header */}
                <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
                  <div className="text-center max-w-2xl mx-auto">
                    <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest block mb-1">
                      Official Form — UC-METC MPC
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                      Locker Rental Agreement
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      University of Cebu - METC Multipurpose Cooperative (UC-METC MPC)
                      <br />
                      UCMETC Campus, Alumnos, Mambaling, Cebu City | Tel: 410-8811 local 5155
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  {/* Preamble Text */}
                  <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    This Locker Rental Agreement is made and entered into this <strong>{new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}</strong> by and between <strong>UNIVERSITY OF CEBU-METC MULTIPURPOSE COOPERATIVE</strong>, located in UC METC Campus at Alumnos, Mambaling, Cebu City, and the Renter specified below.
                  </div>

                  {/* 1. Renter & Locker Details */}
                  <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-slate-50/50 space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b pb-2">
                      <FileText size={18} className="text-purple-600" /> 1. Locker & Renter Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Renter Full Name *</label>
                        <input
                          type="text"
                          value={renterName}
                          onChange={(e) => setRenterName(e.target.value)}
                          placeholder="e.g. ANKE, LIONEL G. GLOBODAS"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Contact Number *</label>
                        <input
                          type="text"
                          value={renterContact}
                          onChange={(e) => setRenterContact(e.target.value)}
                          placeholder="e.g. 09123456789"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-slate-600 font-bold mb-1">Residing Address *</label>
                        <input
                          type="text"
                          value={renterAddress}
                          onChange={(e) => setRenterAddress(e.target.value)}
                          placeholder="e.g. SAN ISIDRO, SAN FERNANDO, CEBU"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Assigned Location</label>
                        <input
                          type="text"
                          value={selectedLocker.location || 'Machine Shop'}
                          readOnly
                          className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Selected Locker Code</label>
                        <input
                          type="text"
                          value={selectedLocker.locker_number || selectedLocker.lockerId || 'MS-13 - 2159'}
                          readOnly
                          className="w-full px-3.5 py-2.5 bg-purple-50 border border-purple-300 rounded-lg font-black text-purple-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Rental Period Selection */}
                  <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-slate-50/50 space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b pb-2">
                      <Calendar size={18} className="text-purple-600" /> 2. Rental Period
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label
                        onClick={() => setSemesterCount(1)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          semesterCount === 1
                            ? 'border-purple-600 bg-purple-50 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="semCount"
                          checked={semesterCount === 1}
                          onChange={() => setSemesterCount(1)}
                          className="mt-1 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <strong className="text-slate-900 block text-sm font-extrabold">1 Semester</strong>
                          <span className="text-xs text-slate-500 block mt-0.5">₱250 rental fee + ₱200 key deposit</span>
                          <span className="text-xs font-black text-purple-700 mt-2 block">Total: ₱450.00</span>
                        </div>
                      </label>

                      <label
                        onClick={() => setSemesterCount(2)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          semesterCount === 2
                            ? 'border-purple-600 bg-purple-50 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="semCount"
                          checked={semesterCount === 2}
                          onChange={() => setSemesterCount(2)}
                          className="mt-1 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <strong className="text-slate-900 block text-sm font-extrabold">2 Semesters (Full Year)</strong>
                          <span className="text-xs text-slate-500 block mt-0.5">₱500 rental fee + ₱200 key deposit</span>
                          <span className="text-xs font-black text-purple-700 mt-2 block">Total: ₱700.00</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 3. Rental & Deposit Fee Details */}
                  <div className="border border-purple-200 rounded-xl p-5 bg-purple-50/80 space-y-3">
                    <h3 className="font-extrabold text-purple-950 text-sm flex items-center justify-between border-b border-purple-200 pb-2">
                      <span>3. Rental and Deposit Fee Summary</span>
                      <span className="text-xs text-purple-700 font-semibold">Official Rate</span>
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm text-purple-900">
                      <div className="flex justify-between items-center">
                        <span>✔ Rental fee good for {semesterCount} semester(s):</span>
                        <strong className="font-black text-slate-900">₱{rentalFee.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>✔ Key Deposit (Fully Refundable upon key return):</span>
                        <strong className="font-black text-slate-900">₱{depositFee.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center border-t border-purple-200 pt-2 font-black text-base text-purple-950">
                        <span>Total Cashier Amount Due:</span>
                        <span className="text-purple-700 text-lg">₱{totalFee.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 to 6. Terms & Agreement Conditions (Checkboxes matching paper form) */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base border-b pb-2">
                      4. Agreement Terms & Operational Conditions
                    </h3>
                    
                    <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreedConditions}
                          onChange={(e) => setAgreedConditions(e.target.checked)}
                          className="mt-1 w-4 h-4 text-purple-600 rounded"
                        />
                        <span>
                          <strong>Other Conditions:</strong> Renter shall use the locker solely for personal belongings. METC COOP is not responsible for loss/damage. Prohibited items (illegal substances, hazardous/flammable materials, weapons) are strictly forbidden. Locker must be cleaned and cleared before surrendering key. Heavy objects or vandalism (scratching, painting) are prohibited.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer border-t pt-3">
                        <input
                          type="checkbox"
                          checked={agreedAccess}
                          onChange={(e) => setAgreedAccess(e.target.checked)}
                          className="mt-1 w-4 h-4 text-purple-600 rounded"
                        />
                        <span>
                          <strong>Access to Locker:</strong> Renter will be provided with a key and is solely responsible for key security. METC COOP is not responsible for any loss resulting from key or padlock loss/theft.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer border-t pt-3">
                        <input
                          type="checkbox"
                          checked={agreedTermination}
                          onChange={(e) => setAgreedTermination(e.target.checked)}
                          className="mt-1 w-4 h-4 text-purple-600 rounded"
                        />
                        <span>
                          <strong>Termination & Deposit Forfeiture:</strong> Agreement may be terminated with 1 month notice. Key must be returned upon termination. Failure to vacate locker and return key at contract end results in <strong>forfeiture of the ₱200 deposit fee</strong> and disposal of belongings.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer border-t pt-3">
                        <input
                          type="checkbox"
                          checked={agreedLiability}
                          onChange={(e) => setAgreedLiability(e.target.checked)}
                          className="mt-1 w-4 h-4 text-purple-600 rounded"
                        />
                        <span>
                          <strong>Liability Disclaimer:</strong> UC METC COOP facility shall not be liable for stored items except in cases of gross negligence or willful misconduct.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLocker(null)}
                      className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer text-center"
                    >
                      Cancel Selection
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:flex-1 py-3.5 sm:py-4 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 leading-snug"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin flex-shrink-0" size={20} />
                      ) : (
                        <CheckSquare size={20} className="flex-shrink-0" />
                      )}
                      <span>Confirm & Submit Locker Rental Agreement</span>
                    </button>
                  </div>

                </div>
              </form>
            )}
            </div>
            )}

          </div>
        )}

        {/* CUSTOM EXTEND SEMESTER RENTAL MODAL */}
        {showExtendModal && createPortal(
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-200 animate-modal-pop relative space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Extend Locker Rental</h3>
                    <p className="text-xs text-slate-500">UC METC MPC Locker Renewal</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Locker Code:</span>
                    <strong className="font-mono text-purple-900">{myRental?.locker_number}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Location:</span>
                    <strong className="text-slate-900">{myRental?.location}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Current Duration:</span>
                    <strong className="text-slate-900">{myRental?.semester_count || 1} Semester(s)</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">
                    Select Extension Duration *
                  </label>
                  <select
                    value={extendSemesters}
                    onChange={(e) => setExtendSemesters(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value={1}>+1 Semester (5 Months) — ₱250.00</option>
                    <option value={2}>+2 Semesters (10 Months) — ₱500.00</option>
                  </select>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-emerald-900">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Key Deposit Carries Over!
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Your existing <strong>₱200 key deposit</strong> remains safely held on file. You only pay the semestral rental fee of <strong>₱{(250 * extendSemesters).toFixed(2)}</strong> at the COOP office!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeExtendRental}
                  disabled={submitting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : `Confirm & Request (+₱${(250 * extendSemesters).toFixed(2)})`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* CUSTOM TERMINATE CONFIRMATION MODAL */}
        {showTerminateConfirmModal && createPortal(
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-modal-pop relative space-y-5">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-50">
                <AlertTriangle size={28} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Turnover Locker & Claim Deposit?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  To vacate your locker and claim your <strong>₱200 key deposit refund</strong>, ensure your locker is empty and <strong>stain-free</strong>, then present your key at the UC-METC MPC Office.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTerminateConfirmModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeTerminate}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm Request Turnover'}
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
