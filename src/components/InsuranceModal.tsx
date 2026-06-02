import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { apiClient } from '../services/api';
import { I_CARD_URL } from '../constants/cloudinaryAssets';
import { FloatingInput } from './FloatingInput';

interface InsuranceModalProps {
  onClose: () => void;
}

export const InsuranceModal: React.FC<InsuranceModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { showNotification } = useUIStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1 = details & benefits, 2 = registration details form
  
  const [formData, setFormData] = useState({
    fullName: '',
    birthday: '',
    age: '',
    beneficiary: '',
    relation: ''
  });

  // Pre-populate user full name when user is available
  useEffect(() => {
    if (user) {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      setFormData(prev => ({
        ...prev,
        fullName: `${firstName} ${lastName}`.trim()
      }));
    }
  }, [user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDateStr = e.target.value;
    if (!birthDateStr) {
      setFormData(prev => ({ ...prev, birthday: '', age: '' }));
      return;
    }
    
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    
    setFormData(prev => ({
      ...prev,
      birthday: birthDateStr,
      age: computedAge >= 0 ? computedAge.toString() : ''
    }));
  };

  const handleRegisterInterest = () => {
    if (!user?.id) {
      showNotification('Please log in to register for insurance', 'error');
      return;
    }

    // Validation for form details
    if (!formData.fullName.trim() || !formData.birthday || !formData.age || !formData.beneficiary.trim() || !formData.relation.trim()) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
      showNotification('Cooperative members must be between 18 and 65 years old to qualify for insurance coverage.', 'error');
      return;
    }

    setIsProcessing(true);

    // Generate receipt number for insurance
    const receiptNo = `INS-${Date.now()}`;

    // Create order for insurance (payment at office)
    const orderData = {
      items: [
        {
          productId: 'insurance', // Special product for insurance
          productName: 'I-CARD Micro-insurance',
          name: 'I-CARD Micro-insurance',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
          orderType: 'insurance',
          selectedOptions: {
            fullName: formData.fullName.trim(),
            birthday: formData.birthday,
            age: ageNum,
            beneficiary: formData.beneficiary.trim(),
            relation: formData.relation.trim()
          }
        }
      ],
      totalAmount: 100,
      paymentMethod: 'cash',
      referenceNumber: null,
      receiptNo: receiptNo,
      orderType: 'insurance', // Mark this as an insurance order
    };

    // OPTIMISTIC UI: Instantly show success and update UI
    showNotification(
      'Insurance request submitted! Please visit the UC Coop Office to complete payment (₱100).',
      'success'
    );
    window.dispatchEvent(new Event('insurance-registered'));
    onClose();

    // Call API in the background
    apiClient.createOrder(orderData, user.id).catch((error: any) => {
      console.error('Failed to register insurance interest in background:', error);
      showNotification(error?.message || 'Failed to submit insurance request in background', 'error');
      window.dispatchEvent(new Event('insurance-registration-failed'));
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-purple-600">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">I-CARD Micro-insurance</h2>
              <p className="text-purple-100 text-sm">Affordable Protection & Peace of Mind</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-700 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <>
              {/* Insurance Card Image */}
              <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={I_CARD_URL}
                  alt="I-CARD Micro-insurance"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Price */}
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6 text-center">
                <p className="text-green-700 text-lg font-semibold mb-2">Annual Premium</p>
                <p className="text-5xl font-bold text-green-600">₱100</p>
                <p className="text-green-600 text-sm mt-2">per year</p>
              </div>

              {/* Benefits */}
              <div className="bg-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={24} className="text-purple-600" />
                  Coverage Benefits
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-purple-900">Accidental Death Coverage</p>
                      <p className="text-purple-700">₱50,000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-purple-900">Accidental Dismemberment Benefits</p>
                      <p className="text-purple-700">Coverage included</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-purple-900">Total & Permanent Disability Coverage</p>
                      <p className="text-purple-700">₱50,000</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligibility */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={20} className="text-slate-600" />
                  Eligibility
                </h3>
                <p className="text-slate-700">
                  Available for cooperative members aged <span className="font-semibold">18–65 years old</span>.
                </p>
              </div>

              {/* Payment Instructions */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">How to Avail I-CARD Insurance</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <p className="font-semibold">Step 1: Register Your Interest</p>
                  <p>Click the "Register Now" button below to submit your insurance request.</p>
                  
                  <p className="font-semibold mt-4">Step 2: Visit UC Coop Office</p>
                  <p>Go to the UC Coop Office and pay the ₱100 annual premium.</p>
                  
                  <p className="font-semibold mt-4">Step 3: Receive Registration Details</p>
                  <p>After payment, the coop staff will provide you with the registration format and instructions to activate your I-CARD coverage.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5 animate-scale-in">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex gap-3">
                <Shield size={24} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-900 text-sm">Insurance Coverage Details</h4>
                  <p className="text-purple-700 text-xs mt-0.5">
                    Please provide the correct personal information below. This is required to process and approve your Micro-insurance coverage.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <FloatingInput
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    label="Birthday"
                    value={formData.birthday}
                    onChange={handleBirthdayChange}
                    type="date"
                    required
                  />
                  <FloatingInput
                    label="Age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    type="number"
                    required
                  />
                </div>

                <FloatingInput
                  label="Beneficiary"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                  required
                />

                <FloatingInput
                  label="Relation to Beneficiary"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={step === 2 ? () => setStep(1) : onClose}
            className="px-6 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all"
          >
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={step === 1 ? () => setStep(2) : handleRegisterInterest}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              isProcessing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {step === 1 ? 'Register Now' : isProcessing ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
