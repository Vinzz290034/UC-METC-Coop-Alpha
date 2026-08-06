import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertTriangle, Info, Loader2, Key, ChevronLeft, Menu } from 'lucide-react';
import { apiClient } from '../services/api';
import { useUIStore } from '../store/uiStore';

export const LockerPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSidebarOpen } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRental, setMyRental] = useState<any>(null);
  const [availableLockers, setAvailableLockers] = useState<any[]>([]);
  const [selectedLockerId, setSelectedLockerId] = useState<string>('');
  const [semesterCount, setSemesterCount] = useState<number>(1);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchLockerData = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch my rental
      const rentalRes = await apiClient.getMyLocker();
      if (rentalRes && rentalRes.rental) {
        setMyRental(rentalRes.rental);
      } else {
        setMyRental(null);
        // If no rental, fetch available lockers
        const availableRes = await apiClient.getAvailableLockers();
        setAvailableLockers(availableRes.lockers || []);
      }
    } catch (err: any) {
      console.error('Error fetching locker data:', err);
      setError('Failed to load locker system data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockerData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLockerId) {
      setError('Please select a locker.');
      return;
    }
    if (!termsAgreed) {
      setError('You must agree to the terms and conditions.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await apiClient.applyForLocker(selectedLockerId, semesterCount, true);
      setSuccess('Your locker application has been submitted successfully!');
      setTimeout(() => {
        setSuccess('');
        fetchLockerData();
      }, 2000);
    } catch (err: any) {
      console.error('Error applying for locker:', err);
      setError(err.message || 'Failed to submit locker application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = async () => {
    if (!myRental) return;
    if (!window.confirm('Are you sure you want to request termination of your locker rental? You must clear the locker and return the key to the COOP office.')) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await apiClient.terminateLockerRental(myRental.rental_id);
      setSuccess('Locker rental terminated successfully.');
      setTimeout(() => {
        setSuccess('');
        fetchLockerData();
      }, 2000);
    } catch (err: any) {
      console.error('Error terminating locker rental:', err);
      setError('Failed to terminate locker rental.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate fees
  const rentalFee = 250 * semesterCount;
  const depositFee = 200;
  const totalFee = rentalFee + depositFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Loading locker portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] text-slate-800 p-4 sm:p-6 lg:p-8 animate-slide-in-right">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-slate-700" />
            </button>

            {/* Desktop Back Button */}
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
                <Lock className="text-purple-600" size={28} /> Digital Locker Rental
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">UC METC Multipurpose Cooperative (MPC)</p>
            </div>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 flex items-start gap-3">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-700 flex items-start gap-3">
            <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {myRental ? (
          /* ── MY CURRENT LOCKER STATUS ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-purple-600 p-6 text-white">
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                {myRental.rental_status}
              </span>
              <h2 className="text-3xl font-black mt-3">Locker {myRental.locker_number}</h2>
              <p className="text-sm text-purple-100 font-medium mt-1">
                {myRental.location} — {myRental.floor}
              </p>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Details column */}
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 border-b pb-2">Locker Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Locker Code:</span>
                    <span className="font-bold text-slate-900">{myRental.locker_number}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Locker Size:</span>
                    <span className="font-bold text-slate-900">{myRental.size}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Assigned Key:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Key size={14} className="text-purple-600" />
                      {myRental.key_code || <span className="text-slate-400 font-medium italic">Pending assignment</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Rental Period:</span>
                    <span className="font-bold text-slate-900">{myRental.semester_count} Semester(s)</span>
                  </div>
                  {myRental.start_date && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Start Date:</span>
                      <span className="font-bold text-slate-900">{new Date(myRental.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {myRental.end_date && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">End Date / Expiry:</span>
                      <span className="font-bold text-red-600">{new Date(myRental.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payments & Actions column */}
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 border-b pb-2">Financial Status</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Rental Fee:</span>
                    <span className="font-bold text-slate-900">₱{parseFloat(myRental.rental_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Refundable Deposit:</span>
                    <span className="font-bold text-slate-900">₱{parseFloat(myRental.deposit_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-slate-800 font-bold">Total Amount Due:</span>
                    <span className="font-black text-purple-600 text-base">₱{(parseFloat(myRental.rental_fee) + parseFloat(myRental.deposit_fee)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Payment Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      myRental.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                      myRental.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {myRental.payment_status}
                    </span>
                  </div>
                </div>

                {myRental.rental_status === 'active' && (
                  <button
                    onClick={handleTerminate}
                    disabled={submitting}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                    Request Locker Termination
                  </button>
                )}

                {myRental.rental_status === 'pending' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex gap-2">
                    <Info size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">Application Pending Approval</p>
                      <p className="leading-relaxed">Please proceed to the UC METC MPC Office to pay the rental and deposit fee, sign/conforme your digital agreement, and claim your key.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── APPLICATION FORM ── */
          <form onSubmit={handleApply} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-3">Locker Rental Agreement Form</h2>

            {availableLockers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Lock size={40} className="text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No lockers available</p>
                <p className="text-sm text-slate-500 mt-1">All lockers are currently occupied or under maintenance. Check back later!</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Locker select */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Locker</label>
                  <select
                    value={selectedLockerId}
                    onChange={(e) => setSelectedLockerId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
                  >
                    <option value="">-- Choose Locker --</option>
                    {availableLockers.map((locker) => (
                      <option key={locker.id} value={locker.id}>
                        Locker {locker.locker_number} ({locker.location} — {locker.floor} — Size: {locker.size})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semesters */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Rental Period</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSemesterCount(1)}
                      className={`py-3.5 px-4 rounded-xl border font-bold text-sm transition-all ${
                        semesterCount === 1
                          ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      1 Semester
                    </button>
                    <button
                      type="button"
                      onClick={() => setSemesterCount(2)}
                      className={`py-3.5 px-4 rounded-xl border font-bold text-sm transition-all ${
                        semesterCount === 2
                          ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      2 Semesters
                    </button>
                  </div>
                </div>

                {/* Fees calculator info card */}
                <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                  <h3 className="font-bold text-purple-900 text-sm mb-3">Rental & Deposits Summary</h3>
                  <div className="space-y-2 text-sm text-purple-800">
                    <div className="flex justify-between">
                      <span>Rental Fee ({semesterCount} semester(s)):</span>
                      <span className="font-bold">₱{rentalFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refundable Deposit:</span>
                      <span className="font-bold">₱{depositFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-purple-200 pt-2 font-black text-purple-950 text-base">
                      <span>Total Fees Due:</span>
                      <span>₱{totalFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 text-[11px] text-purple-700 leading-relaxed font-medium">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <span>The ₱200 deposit is fully refundable at the end of the rental period upon return of the locker key and removal of all personal items.</span>
                  </div>
                </div>

                {/* Terms and conditions paper text */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Terms and Conditions</label>
                  <div className="h-44 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p className="font-bold text-slate-800">UC METC Multipurpose Cooperative Locker Rental Terms:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>The Renter shall use the locker solely for the storage of personal belongings.</li>
                      <li>METC COOP is not responsible for any loss or damage to the Renter's belongings.</li>
                      <li>The Renter agrees not to store any prohibited items in the locker, including but not limited to: illegal substances, hazardous materials, flammable materials, and weapons.</li>
                      <li>The Renter is required to clean the locker and remove all dirt, residue, or personal materials at the end of each semester and before surrendering the locker key.</li>
                      <li>The Renter shall not place excessively heavy objects that may cause damage, deformation, or breakage of the locker.</li>
                      <li>Vandalism of any kind is strictly prohibited, including scratching, painting, or defacing the locker.</li>
                      <li>The Renter shall not store items that may cause permanent or difficult-to-remove stains. If Renter is aware that an item may leak, stain, or damage the locker, protective covering must be used.</li>
                      <li>The Renter will be provided with a locker key. The Renter is solely responsible for the security of the key.</li>
                      <li>METC COOP is not responsible for any loss or damage resulting from the loss or theft of the key or padlock.</li>
                      <li>This Agreement may be terminated by either party with one month notice.</li>
                      <li>Upon termination, the Renter shall return the locker key and remove all belongings from the locker.</li>
                      <li>Failure to vacate the locker and return the key upon the end of contract may result in the forfeiture of the deposit fee and disposal of the Renter's belongings.</li>
                      <li>The Facility shall not be liable for any loss or damage to the Renter's belongings stored in the locker, except in cases of gross negligence or willful misconduct on the part of the UC METC COOP.</li>
                    </ol>
                  </div>
                </div>

                {/* Agreement checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-1">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-1 w-4.5 h-4.5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-xs sm:text-sm text-slate-600 font-semibold select-none leading-relaxed">
                    I have read, understood, and agree to follow all the terms and conditions of the Locker Rental Agreement form listed above.
                  </span>
                </label>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || !termsAgreed}
                  className={`w-full py-4 rounded-xl font-bold text-base text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                    termsAgreed
                      ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Confirm & Apply for Locker
                </button>

              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
};
