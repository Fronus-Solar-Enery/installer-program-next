'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PRODUCT_MODELS, SERIAL_STATUSES, CITIES } from '@/lib/constants';

export default function NewRewardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Validation
  const [installerCode, setInstallerCode] = useState('');
  const [installerData, setInstallerData] = useState<any>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [serialValid, setSerialValid] = useState(false);

  // Step 1.5: Inverter Serial (moved to Step 2 for batteries)
  const [inverterSerialNumber, setInverterSerialNumber] = useState('');

  // Step 2: Product Details
  const [productModel, setProductModel] = useState('');
  const [cityOfInstallation, setCityOfInstallation] = useState('');
  const [serialNumberStatus, setSerialNumberStatus] = useState('');

  // Get selected product details
  const selectedProduct = PRODUCT_MODELS.find(p => p.value === productModel);
  const rewardAmount = selectedProduct?.reward || 0;
  const isBatteryProduct = selectedProduct?.isBattery || false;

  const validateInstallerCode = async () => {
    if (!installerCode) {
      setError('Please enter installer code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/installers?search=${installerCode}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('Installer not found');
      }

      const installer = data.data.installers.find(
        (i: any) => i.installerCode.toUpperCase() === installerCode.toUpperCase()
      );

      if (!installer) {
        throw new Error('Installer not found');
      }

      setInstallerData(installer);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to validate installer');
      setInstallerData(null);
    } finally {
      setLoading(false);
    }
  };

  const validateSerialNumber = async () => {
    if (!serialNumber) {
      setError('Please enter serial number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/rewards?search=${serialNumber}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const exists = data.data.rewards.some(
          (r: any) => r.serialNumber.toUpperCase() === serialNumber.toUpperCase()
        );

        if (exists) {
          throw new Error('Serial number already exists in the system');
        }
      }

      setSerialValid(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to validate serial number');
      setSerialValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Next = () => {
    if (!installerData) {
      setError('Please validate installer code first');
      return;
    }
    if (!serialValid) {
      setError('Please validate serial number first');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!productModel || !cityOfInstallation || !serialNumberStatus) {
      setError('Please fill all required fields');
      return;
    }
    if (isBatteryProduct && !inverterSerialNumber) {
      setError('Please enter inverter serial number for battery product');
      return;
    }
    setError('');
    setCurrentStep(3);
  };

  // Check if Step 1 is complete
  const isStep1Complete = installerData && serialValid;

  // Check if Step 2 is complete
  const isStep2Complete = productModel && cityOfInstallation && serialNumberStatus &&
    (!isBatteryProduct || inverterSerialNumber);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Get current date and time as installation date
      const currentDate = new Date().toISOString();

      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installerCode: installerData.installerCode,
          serialNumber,
          inverterSerialNumber: isBatteryProduct ? inverterSerialNumber : 'N/A',
          productModel,
          cityOfInstallation,
          serialNumberStatus,
          rewardAmount,
          installationDate: currentDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register reward');
      }

      alert('Reward registered successfully!');
      router.push('/rewards');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Register New Reward</h1>
          <button
            onClick={() => router.push('/rewards')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Rewards
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`h-2 rounded-full ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <p className={`mt-2 text-sm font-medium ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
                1. Validation
              </p>
            </div>
            <div className="flex-1 ml-4">
              <div className={`h-2 rounded-full ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <p className={`mt-2 text-sm font-medium ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
                2. Product Details
              </p>
            </div>
            <div className="flex-1 ml-4">
              <div className={`h-2 rounded-full ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <p className={`mt-2 text-sm font-medium ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>
                3. Review
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {/* Step 1: Validation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Installer & Product Validation</h2>

              {/* Installer Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installer Code <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={installerCode}
                    onChange={(e) => setInstallerCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                    placeholder="e.g., INS001"
                  />
                  <button
                    type="button"
                    onClick={validateInstallerCode}
                    disabled={loading || !installerCode}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    {loading ? 'Validating...' : 'Validate'}
                  </button>
                </div>
              </div>

              {installerData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-900 mb-2">✓ Installer Found</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{installerData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Code:</span>
                      <span className="ml-2 font-medium">{installerData.installerCode}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">City:</span>
                      <span className="ml-2 font-medium">{installerData.city}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <span className="ml-2 font-medium">{installerData.companyName}</span>
                    </div>
                    {installerData.referrer && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Referrer:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {installerData.referrer.installerCode} - {installerData.referrer.fullName}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">(Will receive Rs. 500)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Serial Number - Only show after installer validation */}
              {installerData && (
                <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Serial Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                    placeholder="e.g., SN123456"
                  />
                  <button
                    type="button"
                    onClick={validateSerialNumber}
                    disabled={loading || !serialNumber}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    {loading ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {serialValid && (
                  <p className="mt-1 text-sm text-green-600">✓ Serial number is available</p>
                )}
              </div>

                </>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  disabled={!isStep1Complete}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Product Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Product & Customer Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productModel}
                    onChange={(e) => setProductModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Product Model</option>
                    {PRODUCT_MODELS.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label} - Rs. {model.reward.toLocaleString()} {model.isBattery ? '(Battery)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reward Amount (Auto-calculated) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Amount
                  </label>
                  <input
                    type="text"
                    value={`Rs. ${rewardAmount.toLocaleString()}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium"
                  />
                </div>

                {/* City of Installation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City of Installation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={cityOfInstallation}
                    onChange={(e) => setCityOfInstallation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select City</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Serial Number Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={serialNumberStatus}
                    onChange={(e) => setSerialNumberStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Status</option>
                    {SERIAL_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {/* Inverter Serial Number - Only for battery products */}
                {isBatteryProduct && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inverter Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inverterSerialNumber}
                      onChange={(e) => setInverterSerialNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                      placeholder="e.g., INV123456"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  disabled={!isStep2Complete}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Review Details</h2>

              {/* Installer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Installer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Code:</span>
                    <span className="ml-2 font-medium">{installerData?.installerCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{installerData?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Company:</span>
                    <span className="ml-2 font-medium">{installerData?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">City:</span>
                    <span className="ml-2 font-medium">{installerData?.city}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bank:</span>
                    <span className="ml-2 font-medium">{installerData?.bankName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account:</span>
                    <span className="ml-2 font-medium">{installerData?.accountNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Account Title:</span>
                    <span className="ml-2 font-medium">{installerData?.accountTitle}</span>
                  </div>
                  {installerData?.referrer && (
                    <div className="col-span-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Referrer:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {installerData.referrer.installerCode} - {installerData.referrer.fullName}
                      </span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Will receive Rs. 500
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Product Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Serial Number:</span>
                    <span className="ml-2 font-medium">{serialNumber}</span>
                  </div>
                  {isBatteryProduct && (
                    <div>
                      <span className="text-gray-600">Inverter Serial:</span>
                      <span className="ml-2 font-medium">{inverterSerialNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Product Model:</span>
                    <span className="ml-2 font-medium">{productModel}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Installer Reward:</span>
                    <span className="ml-2 font-medium text-green-600">Rs. {rewardAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Installation City:</span>
                    <span className="ml-2 font-medium">{cityOfInstallation}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium">{serialNumberStatus}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Installation Date:</span>
                    <span className="ml-2 font-medium">{new Date().toLocaleDateString()} (Auto-generated)</span>
                  </div>
                </div>
              </div>

              {/* Referral Reward Information */}
              {installerData?.referrer && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-3">💰 Referral Reward</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700">Referrer Code:</span>
                      <span className="ml-2 font-medium text-blue-900">{installerData.referrer.installerCode}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Referrer Name:</span>
                      <span className="ml-2 font-medium text-blue-900">{installerData.referrer.fullName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700">Referral Reward Amount:</span>
                      <span className="ml-2 font-bold text-green-600">Rs. 500</span>
                      <span className="ml-2 text-xs text-blue-600">(Automatically credited for each product registration)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400"
                >
                  {loading ? 'Submitting...' : 'Submit Reward Registration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
