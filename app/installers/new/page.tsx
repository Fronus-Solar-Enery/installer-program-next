'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { CITIES, CITY_TO_PROVINCE, TRAINING_CENTER, BANKS } from '@/lib/constants';
import { CheckCircle, Circle, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

// Digital payment methods (mobile wallets)
const DIGITAL_PAYMENT_METHODS = ['jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'finja', 'keenu', 'upaisa'];

export default function NewInstallerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - CNIC & Basic Info
  const [cnic, setCnic] = useState('');
  const [cnicDisplay, setCnicDisplay] = useState(''); // Formatted display value
  const [cnicChecked, setCnicChecked] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Step 2 - Location & Training
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [trainingCenter, setTrainingCenter] = useState('');
  const [installerCode, setInstallerCode] = useState('');
  const [codeGenerating, setCodeGenerating] = useState(false);

  // Step 3 - Banking Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [sameAsName, setSameAsName] = useState(true);

  // Step 4 - Additional Info
  const [certified, setCertified] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [referrerCode, setReferrerCode] = useState('');
  const [referrerData, setReferrerData] = useState<any>(null);
  const [referrerError, setReferrerError] = useState('');

  // Settings
  const [settings, setSettings] = useState<any>(null);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  // Sync whatsapp with phone
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsappNumber(phoneNumber);
    }
  }, [sameAsPhone, phoneNumber]);

  // Sync account title with name
  useEffect(() => {
    if (sameAsName) {
      setAccountTitle(fullName);
    }
  }, [sameAsName, fullName]);

  // Auto-select province when city changes
  useEffect(() => {
    if (city) {
      const cityProvince = CITY_TO_PROVINCE[city];
      if (cityProvince) {
        setProvince(cityProvince);
      }
    }
  }, [city]);

  // Generate installer code when training center is selected
  useEffect(() => {
    if (trainingCenter && !settings?.allowInstallerCodeEdit) {
      generateInstallerCode();
    }
  }, [trainingCenter, settings]);

  // Format CNIC as XXXXX-XXXXXXX-X
  const formatCNIC = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const handleCNICChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 13) {
      setCnic(digits);
      setCnicDisplay(formatCNIC(digits));
      setCnicChecked(false);
    }
  };

  const checkCNIC = async () => {
    if (!cnic || cnic.length < 13) {
      toast.error('Please enter a valid 13-digit CNIC');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/installers?search=${cnic}`);
      const data = await response.json();

      if (data.success && data.data.installers.length > 0) {
        const existing = data.data.installers.find((i: any) => i.cnic === cnic);
        if (existing) {
          toast.error('This CNIC is already registered');
          setCnicChecked(false);
          return;
        }
      }

      setCnicChecked(true);
      toast.success('CNIC is available');
    } catch (error) {
      console.error('Error checking CNIC:', error);
      toast.error('Failed to check CNIC');
    } finally {
      setLoading(false);
    }
  };

  const generateInstallerCode = async () => {
    const center = TRAINING_CENTER.find(tc => tc.city === trainingCenter);
    if (!center) return;

    setCodeGenerating(true);
    try {
      // Generate 8 random alphanumeric characters
      const randomPart = Array.from({ length: 8 }, () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join('');

      const proposedCode = `${center.short}${randomPart}`;

      // Check if code exists
      const response = await fetch(`/api/installers?search=${proposedCode}`);
      const data = await response.json();

      if (data.success && data.data.installers.length > 0) {
        const exists = data.data.installers.find((i: any) => i.installerCode === proposedCode);
        if (exists) {
          // Try again with new random part
          setTimeout(generateInstallerCode, 100);
          return;
        }
      }

      setInstallerCode(proposedCode);
      toast.success('Installer code generated');
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate installer code');
    } finally {
      setCodeGenerating(false);
    }
  };

  const validateReferrerCode = async () => {
    if (!referrerCode.trim()) {
      setReferrerData(null);
      setReferrerError('');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/installers?search=${referrerCode}`);
      const data = await response.json();

      if (data.success && data.data.installers.length > 0) {
        const referrer = data.data.installers.find(
          (i: any) => i.installerCode.toUpperCase() === referrerCode.toUpperCase()
        );

        if (referrer) {
          setReferrerData(referrer);
          setReferrerError('');
          toast.success(`Referrer found: ${referrer.fullName}`);
        } else {
          setReferrerData(null);
          setReferrerError('Referrer code not found');
          toast.error('Referrer code not found');
        }
      } else {
        setReferrerData(null);
        setReferrerError('Referrer code not found');
        toast.error('Referrer code not found');
      }
    } catch (error) {
      console.error('Error validating referrer:', error);
      setReferrerError('Failed to validate referrer code');
      toast.error('Failed to validate referrer code');
    } finally {
      setLoading(false);
    }
  };

  // Validation helpers
  const isStep1Valid = () => {
    return cnicChecked && cnic.length === 13 && fullName.trim() && phoneNumber.length === 11 && whatsappNumber.length === 11;
  };

  const isStep2Valid = () => {
    return city && address.trim() && trainingCenter && installerCode.trim();
  };

  const isStep3Valid = () => {
    if (!bankName || !accountTitle.trim()) return false;

    // Validate account number format
    if (isDigitalPayment) {
      // Digital payment requires exactly 11 digits starting with 03
      return accountNumber.length === 11 && accountNumber.startsWith('03');
    } else {
      // Bank account requires at least some value
      return accountNumber.trim().length > 0;
    }
  };

  const isStep4Valid = () => {
    // Step 4 is always valid as all fields are optional
    // But if referrerCode is entered and not yet verified, it's invalid
    if (referrerCode.trim() && !referrerData && !referrerError) {
      return false; // Code entered but not verified
    }
    if (referrerError) {
      return false; // Verification failed
    }
    return true;
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!cnic || !cnicChecked) {
        toast.error('Please check CNIC availability first');
        return;
      }
      if (!fullName || !phoneNumber) {
        toast.error('Please fill all required fields');
        return;
      }
      if (phoneNumber.length !== 11) {
        toast.error('Phone number must be 11 digits');
        return;
      }
      if (whatsappNumber.length !== 11) {
        toast.error('WhatsApp number must be 11 digits');
        return;
      }
    }

    if (currentStep === 2) {
      if (!city || !address || !trainingCenter) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!installerCode) {
        toast.error('Installer code is required');
        return;
      }
    }

    if (currentStep === 3) {
      if (!bankName || !accountNumber || !accountTitle) {
        toast.error('Please fill all banking details');
        return;
      }
      if (isDigitalPayment && accountNumber.length !== 11) {
        toast.error('Mobile number must be 11 digits');
        return;
      }
      if (isDigitalPayment && !accountNumber.startsWith('03')) {
        toast.error('Mobile number must start with 03');
        return;
      }
    }

    if (currentStep === 4) {
      if (referrerCode.trim() && !referrerData) {
        toast.error('Please verify the referrer code or leave it empty');
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        installerCode,
        fullName,
        cnic: cnicDisplay, // Send formatted CNIC with dashes
        phoneNumber,
        whatsappNumber,
        address,
        city,
        province,
        trainingCenter,
        companyName,
        bankName,
        accountNumber,
        accountTitle,
        certified,
        referrerCode: referrerCode.trim() || undefined,
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('/api/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Installer registered successfully!');
        router.push('/installers');
      } else {
        console.error('API Error Response:', data);
        // Show validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => {
            toast.error(`${err.path?.join('.')}: ${err.message}`);
          });
        } else {
          toast.error(data.error || 'Failed to register installer');
        }
      }
    } catch (error) {
      console.error('Error registering installer:', error);
      toast.error('Failed to register installer');
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = BANKS.find(b => b.value === bankName);
  const isDigitalPayment = selectedBank?.mobile || false;

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Location & Training' },
    { number: 3, title: 'Banking Details' },
    { number: 4, title: 'Additional Info' },
    { number: 5, title: 'Review' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Register New Installer</h1>

          {/* Steps Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep > step.number
                        ? 'bg-green-500 border-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span>{step.number}</span>
                      )}
                    </div>
                    <div className="text-xs mt-2 text-center font-medium text-gray-600">
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Personal Information</h2>

                {/* CNIC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cnicDisplay}
                      onChange={(e) => handleCNICChange(e.target.value)}
                      placeholder="35202-1234567-8"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={checkCNIC}
                      disabled={loading || cnic.length !== 13}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Check'}
                    </button>
                  </div>
                  {cnicChecked && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" /> CNIC available
                    </p>
                  )}
                </div>

                {cnicChecked && (
                  <>
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={11}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          WhatsApp Number
                        </label>
                        <label className="flex items-center text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={sameAsPhone}
                            onChange={(e) => setSameAsPhone(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                          />
                          Same as phone
                        </label>
                      </div>
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => {
                          setWhatsappNumber(e.target.value.replace(/\D/g, ''));
                          setSameAsPhone(false);
                        }}
                        maxLength={11}
                        placeholder="03001234567"
                        disabled={sameAsPhone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Location & Training */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Location & Training</h2>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select City</option>
                    {CITIES.sort().map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Province (auto-selected) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    value={province}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter complete address"
                  />
                </div>

                {/* Training Center */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Center <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trainingCenter}
                    onChange={(e) => setTrainingCenter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Training Center</option>
                    {TRAINING_CENTER.map((tc) => (
                      <option key={tc.city} value={tc.city}>{tc.city}</option>
                    ))}
                  </select>
                </div>

                {/* Installer Code (auto-generated or manual) */}
                {trainingCenter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Installer Code {!settings?.allowInstallerCodeEdit && <span className="text-xs text-gray-500">(Auto-generated)</span>}
                    </label>
                    {settings?.allowInstallerCodeEdit ? (
                      <input
                        type="text"
                        value={installerCode}
                        onChange={(e) => setInstallerCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter installer code"
                      />
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={installerCode}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-800 font-mono"
                        />
                        {codeGenerating && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                          </div>
                        )}
                      </div>
                    )}
                    {installerCode && !settings?.allowInstallerCodeEdit && (
                      <p className="mt-1 text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Code generated based on training center
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Banking Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Banking Details</h2>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank / Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setAccountNumber(''); // Reset account number when bank changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Bank / Payment Method</option>
                    <optgroup label="Digital Payment Methods">
                      {BANKS.filter(b => b.mobile).map((bank) => (
                        <option key={bank.value} value={bank.value}>{bank.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Commercial Banks">
                      {BANKS.filter(b => !b.mobile).map((bank) => (
                        <option key={bank.value} value={bank.value}>{bank.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Account Number */}
                {bankName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isDigitalPayment ? 'Mobile Number' : 'Account Number / IBAN'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => {
                        if (isDigitalPayment) {
                          setAccountNumber(e.target.value.replace(/\D/g, ''));
                        } else {
                          setAccountNumber(e.target.value);
                        }
                      }}
                      maxLength={isDigitalPayment ? 11 : undefined}
                      placeholder={isDigitalPayment ? '03XXXXXXXXX' : 'IBAN or Account Number'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {isDigitalPayment && (
                      <p className="mt-1 text-xs text-gray-500">Enter 11-digit mobile number starting with 03</p>
                    )}
                  </div>
                )}

                {/* Account Title */}
                {bankName && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Account Title <span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={sameAsName}
                          onChange={(e) => setSameAsName(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                        />
                        Same as installer name
                      </label>
                    </div>
                    <input
                      type="text"
                      value={accountTitle}
                      onChange={(e) => {
                        setAccountTitle(e.target.value);
                        setSameAsName(false);
                      }}
                      disabled={sameAsName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                      placeholder="Account holder name"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Additional Info */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Additional Information</h2>

                {/* Certified */}
                <div className="flex items-center p-4 bg-gray-50 rounded-md">
                  <input
                    type="checkbox"
                    id="certified"
                    checked={certified}
                    onChange={(e) => setCertified(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                  />
                  <label htmlFor="certified" className="ml-3 text-sm font-medium text-gray-700">
                    Certified Installer
                  </label>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter company name (if any)"
                  />
                </div>

                {/* Referrer Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referrer Code <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referrerCode}
                      onChange={(e) => {
                        setReferrerCode(e.target.value.toUpperCase());
                        setReferrerData(null);
                        setReferrerError('');
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter referrer installer code"
                    />
                    <button
                      onClick={validateReferrerCode}
                      disabled={loading || !referrerCode.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                  {referrerData && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Referrer: {referrerData.fullName} ({referrerData.installerCode})
                    </p>
                  )}
                  {referrerError && (
                    <p className="mt-1 text-sm text-red-600">{referrerError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 5: Review Details</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  {/* Personal Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Personal Information</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">CNIC</dt>
                        <dd className="text-gray-900">{cnicDisplay}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Full Name</dt>
                        <dd className="text-gray-900">{fullName}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Phone</dt>
                        <dd className="text-gray-900">{phoneNumber}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">WhatsApp</dt>
                        <dd className="text-gray-900">{whatsappNumber}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Location */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Location & Training</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">City</dt>
                        <dd className="text-gray-900">{city}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Province</dt>
                        <dd className="text-gray-900">{province}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-gray-500">Address</dt>
                        <dd className="text-gray-900">{address}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Training Center</dt>
                        <dd className="text-gray-900">{trainingCenter}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Installer Code</dt>
                        <dd className="text-gray-900 font-mono font-bold">{installerCode}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Banking */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Banking Details</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">Bank / Payment Method</dt>
                        <dd className="text-gray-900">{BANKS.find(b => b.value === bankName)?.label}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">{isDigitalPayment ? 'Mobile Number' : 'Account Number'}</dt>
                        <dd className="text-gray-900">{accountNumber}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-gray-500">Account Title</dt>
                        <dd className="text-gray-900">{accountTitle}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Additional */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Additional Information</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">Certified</dt>
                        <dd className="text-gray-900">{certified ? 'Yes' : 'No'}</dd>
                      </div>
                      {companyName && (
                        <div>
                          <dt className="font-medium text-gray-500">Company</dt>
                          <dd className="text-gray-900">{companyName}</dd>
                        </div>
                      )}
                      {referrerData && (
                        <div className="col-span-2">
                          <dt className="font-medium text-gray-500">Referrer</dt>
                          <dd className="text-gray-900">{referrerData.fullName} ({referrerData.installerCode})</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isStep1Valid()) ||
                  (currentStep === 2 && !isStep2Valid()) ||
                  (currentStep === 3 && !isStep3Valid()) ||
                  (currentStep === 4 && !isStep4Valid()) ||
                  codeGenerating
                }
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
