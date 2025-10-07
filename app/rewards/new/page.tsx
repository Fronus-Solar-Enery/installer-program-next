'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_MODELS, SERIAL_STATUSES, CITIES } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Register New Reward</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/rewards')}
          >
            ← Back to Rewards
          </Button>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Progress value={(currentStep / 3) * 100} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <div className={`flex-1 ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  1. Validation
                </div>
                <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  2. Product Details
                </div>
                <div className={`flex-1 text-right ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  3. Review
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          {/* Step 1: Validation */}
          {currentStep === 1 && (
            <CardContent className="space-y-6 pt-6">
              <CardTitle>Step 1: Installer & Product Validation</CardTitle>

              {/* Installer Code */}
              <div className="space-y-2">
                <Label htmlFor="installer-code">
                  Installer Code <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="installer-code"
                    type="text"
                    value={installerCode}
                    onChange={(e) => setInstallerCode(e.target.value.toUpperCase())}
                    className="flex-1 uppercase"
                    placeholder="e.g., INS001"
                  />
                  <Button
                    type="button"
                    onClick={validateInstallerCode}
                    disabled={loading || !installerCode}
                  >
                    {loading ? 'Validating...' : 'Validate'}
                  </Button>
                </div>
              </div>

              {installerData && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <h3 className="font-medium text-green-900 mb-2">Installer Found</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-900">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{installerData.fullName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Code:</span>
                        <span className="ml-2 font-medium">{installerData.installerCode}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">City:</span>
                        <span className="ml-2 font-medium">{installerData.city}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <span className="ml-2 font-medium">{installerData.companyName}</span>
                      </div>
                      {installerData.referrer && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Referrer:</span>
                          <span className="ml-2 font-medium text-blue-600">
                            {installerData.referrer.installerCode} - {installerData.referrer.fullName}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">(Will receive Rs. 500)</span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Serial Number - Only show after installer validation */}
              {installerData && (
                <>
              <div className="space-y-2">
                <Label htmlFor="serial-number">
                  Product Serial Number <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="serial-number"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    className="flex-1 uppercase"
                    placeholder="e.g., SN123456"
                  />
                  <Button
                    type="button"
                    onClick={validateSerialNumber}
                    disabled={loading || !serialNumber}
                  >
                    {loading ? 'Checking...' : 'Check'}
                  </Button>
                </div>
                {serialValid && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Serial number is available
                  </p>
                )}
              </div>

                </>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleStep1Next}
                  disabled={!isStep1Complete}
                >
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 2: Product Details */}
          {currentStep === 2 && (
            <CardContent className="space-y-6 pt-6">
              <CardTitle>Step 2: Product & Customer Details</CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Model */}
                <div className="space-y-2">
                  <Label htmlFor="product-model">
                    Product Model <span className="text-destructive">*</span>
                  </Label>
                  <Select value={productModel} onValueChange={setProductModel}>
                    <SelectTrigger id="product-model">
                      <SelectValue placeholder="Select Product Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_MODELS.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label} - Rs. {model.reward.toLocaleString()} {model.isBattery ? '(Battery)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reward Amount (Auto-calculated) */}
                <div className="space-y-2">
                  <Label htmlFor="reward-amount">Reward Amount</Label>
                  <Input
                    id="reward-amount"
                    type="text"
                    value={`Rs. ${rewardAmount.toLocaleString()}`}
                    readOnly
                    className="bg-muted font-medium"
                  />
                </div>

                {/* City of Installation */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City of Installation <span className="text-destructive">*</span>
                  </Label>
                  <Select value={cityOfInstallation} onValueChange={setCityOfInstallation}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Serial Number Status */}
                <div className="space-y-2">
                  <Label htmlFor="serial-status">
                    Serial Number Status <span className="text-destructive">*</span>
                  </Label>
                  <Select value={serialNumberStatus} onValueChange={setSerialNumberStatus}>
                    <SelectTrigger id="serial-status">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERIAL_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inverter Serial Number - Only for battery products */}
                {isBatteryProduct && (
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="inverter-serial">
                      Inverter Serial Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="inverter-serial"
                      type="text"
                      value={inverterSerialNumber}
                      onChange={(e) => setInverterSerialNumber(e.target.value.toUpperCase())}
                      className="uppercase"
                      placeholder="e.g., INV123456"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  onClick={handleStep2Next}
                  disabled={!isStep2Complete}
                >
                  Next →
                </Button>
              </div>
            </CardContent>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <CardContent className="space-y-6 pt-6">
              <CardTitle>Step 3: Review Details</CardTitle>

              {/* Installer Information */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-medium mb-3">Installer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Code:</span>
                    <span className="ml-2 font-medium">{installerData?.installerCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{installerData?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <span className="ml-2 font-medium">{installerData?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">City:</span>
                    <span className="ml-2 font-medium">{installerData?.city}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="ml-2 font-medium">{installerData?.bankName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account:</span>
                    <span className="ml-2 font-medium">{installerData?.accountNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Account Title:</span>
                    <span className="ml-2 font-medium">{installerData?.accountTitle}</span>
                  </div>
                  {installerData?.referrer && (
                    <div className="col-span-2 pt-2 border-t border-border">
                      <span className="text-muted-foreground">Referrer:</span>
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
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-medium mb-3">Product Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Serial Number:</span>
                    <span className="ml-2 font-medium">{serialNumber}</span>
                  </div>
                  {isBatteryProduct && (
                    <div>
                      <span className="text-muted-foreground">Inverter Serial:</span>
                      <span className="ml-2 font-medium">{inverterSerialNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Product Model:</span>
                    <span className="ml-2 font-medium">{productModel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Installer Reward:</span>
                    <span className="ml-2 font-medium text-green-600">Rs. {rewardAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Installation City:</span>
                    <span className="ml-2 font-medium">{cityOfInstallation}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium">{serialNumberStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Installation Date:</span>
                    <span className="ml-2 font-medium">{new Date().toLocaleDateString()} (Auto-generated)</span>
                  </div>
                </div>
              </div>

              {/* Referral Reward Information */}
              {installerData?.referrer && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription>
                    <h3 className="font-medium text-blue-900 mb-3">Referral Reward</h3>
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
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Submitting...' : 'Submit Reward Registration'}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
