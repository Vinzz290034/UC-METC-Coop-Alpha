import React, { useState } from 'react';
import { ChevronLeft, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LockerPage: React.FC = () => {
  const navigate = useNavigate();
  const [showLockerModal, setShowLockerModal] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [lockerRequested, setLockerRequested] = useState(false);

  const lockerInfo = [
    {
      title: 'Locker Sizes',
      items: [
        'Small: ₱500/semester - Perfect for books and accessories',
        'Medium: ₱750/semester - For general school supplies',
        'Large: ₱1,000/semester - Extra storage for bulky items',
      ],
    },
    {
      title: 'Payment Options',
      items: [
        'Cash payment at UC METC Coop Office',
        'Installment plans available (2-3 months)',
        'Student accounts with approved credit',
      ],
    },
    {
      title: 'Key Features',
      items: [
        '24/7 access during office hours (Monday-Saturday)',
        'Secure storage with master key access by coop staff only',
        'Transferable lease - can pass to friends or family',
        'Refundable deposit: ₱200 (returned upon locker return)',
      ],
    },
  ];

  const guidelines = [
    'Lockers are provided on a first-come, first-served basis',
    'Renew your locker lease before expiration to maintain your locker',
    'Do not lock personal items of other members without permission',
    'Report any damage or maintenance issues immediately to the coop office',
    'UC METC is not responsible for lost or damaged items inside lockers',
    'Prohibited items: Perishable foods, hazardous materials, valuable documents',
    'Locker vacating deadline: Last day of semester by 5 PM',
    'Late pick-up fee: ₱100 per week after deadline',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">LOCKER MANAGEMENT</h1>
            <p className="text-slate-700">Secure storage for your belongings</p>
          </div>
        </div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {lockerInfo.map((section, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span className="text-slate-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Guidelines Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle size={28} className="text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">Locker Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guidelines.map((guideline, idx) => (
              <div key={idx} className="flex items-start space-x-3 pb-4 border-b border-slate-200 md:border-b-0">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-purple-600 text-white text-sm font-bold rounded-full flex-shrink-0 mt-1">
                  {idx + 1}
                </span>
                <p className="text-slate-700">{guideline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!lockerRequested ? (
          <div className="bg-gradient-to-r from-purple-600 to-green-600 rounded-lg shadow-lg p-8 text-white text-center">
            <Lock size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Ready to Avail a Locker?</h2>
            <p className="text-purple-100 mb-6">
              Secure your belongings with UC METC's locker service. Visit our office to complete the application and payment.
            </p>
            <button
              onClick={() => setShowLockerModal(true)}
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300 shadow-lg"
            >
              Request a Locker
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white text-center">
            <CheckCircle size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Locker Request Submitted</h2>
            <p className="text-green-50 mb-6">
              Your locker request has been recorded. Please visit the UC METC Coop Office to finalize your locker assignment and complete the payment.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Locker Request Modal */}
      {showLockerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Locker Request Form</h2>

            {/* Guidelines Section in Modal */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3">📋 Important Guidelines</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Lockers are available on a semester basis</li>
                <li>• Visit the UC METC Office to select your locker size and location</li>
                <li>• Payment must be completed before locker activation</li>
                <li>• Do not share your locker key or combination with others</li>
                <li>• UC METC is not liable for lost or damaged items</li>
              </ul>
            </div>

            {/* Locker Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Preferred Locker Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { size: 'Small', price: 500, desc: 'Books & accessories' },
                  { size: 'Medium', price: 750, desc: 'General supplies' },
                  { size: 'Large', price: 1000, desc: 'Bulky items' },
                ].map((locker) => (
                  <div key={locker.size} className="border-2 border-slate-300 rounded-lg p-4 hover:border-purple-600 cursor-pointer transition-all">
                    <p className="font-semibold text-slate-900">{locker.size}</p>
                    <p className="text-sm text-slate-600 mb-2">{locker.desc}</p>
                    <p className="text-purple-600 font-bold">₱{locker.price}/sem</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-6 border border-yellow-200">
              <h3 className="font-bold text-yellow-900 mb-3">⚠️ Terms and Conditions</h3>
              <div className="space-y-2 text-sm text-yellow-800 mb-4 max-h-32 overflow-y-auto">
                <p>I understand and agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Pay the locker rental fee on schedule</li>
                  <li>Maintain the locker in good condition</li>
                  <li>Follow all UC METC locker guidelines</li>
                  <li>Vacate the locker by the deadline</li>
                  <li>Not hold UC METC responsible for lost items</li>
                </ul>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-slate-900 font-medium">
                  I agree to the locker guidelines and terms
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLockerModal(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (agreeToTerms) {
                    setShowLockerModal(false);
                    setLockerRequested(true);
                  } else {
                    alert('Please agree to the terms and conditions');
                  }
                }}
                disabled={!agreeToTerms}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>

            <p className="text-xs text-slate-600 text-center mt-4">
              After submission, please visit the UC METC Office (Room E-5, Next to Clinic) to finalize your locker assignment and make payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
