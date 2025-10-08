'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES, CITY_TO_PROVINCE, TRAINING_CENTER, BANKS } from '@/lib/constants';
import { CheckCircle, Circle, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

// Digital payment methods (mobile wallets)
const DIGITAL_PAYMENT_METHODS = ['jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'finja', 'keenu', 'upaisa'];

interface InstallerResponse {
  _id: string;
  cnic?: string;
  installerCode?: string;
}

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
        const existing = data.data.installers.find((i: InstallerResponse) => i.cnic === cnic);
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
        const exists = data.data.installers.find((i: InstallerResponse) => i.installerCode === proposedCode);
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
          (i: InstallerResponse) => i.installerCode?.toUpperCase() === referrerCode.toUpperCase()
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
          data.errors.forEach((err: { path?: string[]; message: string }) => {
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Register New Installer</CardTitle>
            <CardDescription>Complete all steps to register a new installer</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Steps Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step.number
                          ? 'bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600'
                          : currentStep === step.number
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-border text-muted-foreground'
                      }`}>
                        {currentStep > step.number ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <span>{step.number}</span>
                        )}
                      </div>
                      <div className="text-xs mt-2 text-center font-medium text-muted-foreground">
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                        currentStep > step.number ? 'bg-green-500 dark:bg-green-600' : 'bg-muted'
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
                <h2 className="text-lg font-semibold mb-4">Step 1: Personal Information</h2>

                {/* CNIC */}
                <div className="space-y-2">
                  <Label htmlFor="cnic">
                    CNIC <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="cnic"
                      type="text"
                      value={cnicDisplay}
                      onChange={(e) => handleCNICChange(e.target.value)}
                      placeholder="35202-1234567-8"
                      className="flex-1"
                    />
                    <Button
                      onClick={checkCNIC}
                      disabled={loading || cnic.length !== 13}
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Check'}
                    </Button>
                  </div>
                  {cnicChecked && (
                    <p className="text-sm text-green-600 dark:text-green-500 flex items-center">
                      <Check className="h-4 w-4 mr-1" /> CNIC available
                    </p>
                  )}
                </div>

                {cnicChecked && (
                  <>
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={11}
                        placeholder="03001234567"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sameAsPhone"
                            checked={sameAsPhone}
                            onCheckedChange={(checked) => setSameAsPhone(checked as boolean)}
                          />
                          <Label htmlFor="sameAsPhone" className="text-sm font-normal cursor-pointer">
                            Same as phone
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="whatsappNumber"
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => {
                          setWhatsappNumber(e.target.value.replace(/\D/g, ''));
                          setSameAsPhone(false);
                        }}
                        maxLength={11}
                        placeholder="03001234567"
                        disabled={sameAsPhone}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Location & Training */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Step 2: Location & Training</h2>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.sort().map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Province (auto-selected) */}
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    type="text"
                    value={province}
                    disabled
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="Enter complete address"
                  />
                </div>

                {/* Training Center */}
                <div className="space-y-2">
                  <Label htmlFor="trainingCenter">
                    Training Center <span className="text-destructive">*</span>
                  </Label>
                  <Select value={trainingCenter} onValueChange={setTrainingCenter}>
                    <SelectTrigger id="trainingCenter">
                      <SelectValue placeholder="Select Training Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_CENTER.map((tc) => (
                        <SelectItem key={tc.city} value={tc.city}>{tc.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Installer Code (auto-generated or manual) */}
                {trainingCenter && (
                  <div className="space-y-2">
                    <Label htmlFor="installerCode">
                      Installer Code {!settings?.allowInstallerCodeEdit && <span className="text-xs text-muted-foreground">(Auto-generated)</span>}
                    </Label>
                    {settings?.allowInstallerCodeEdit ? (
                      <Input
                        id="installerCode"
                        type="text"
                        value={installerCode}
                        onChange={(e) => setInstallerCode(e.target.value.toUpperCase())}
                        placeholder="Enter installer code"
                      />
                    ) : (
                      <div className="relative">
                        <Input
                          id="installerCode"
                          type="text"
                          value={installerCode}
                          disabled
                          className="font-mono"
                        />
                        {codeGenerating && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    )}
                    {installerCode && !settings?.allowInstallerCodeEdit && (
                      <p className="text-xs text-green-600 dark:text-green-500 flex items-center">
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
                <h2 className="text-lg font-semibold mb-4">Step 3: Banking Details</h2>

                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    Bank / Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={bankName}
                    onValueChange={(value) => {
                      setBankName(value);
                      setAccountNumber('');
                    }}
                  >
                    <SelectTrigger id="bankName">
                      <SelectValue placeholder="Select Bank / Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Digital Payment Methods</SelectLabel>
                        {BANKS.filter(b => b.mobile).map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Commercial Banks</SelectLabel>
                        {BANKS.filter(b => !b.mobile).map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Number */}
                {bankName && (
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">
                      {isDigitalPayment ? 'Mobile Number' : 'Account Number / IBAN'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="accountNumber"
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
                    />
                    {isDigitalPayment && (
                      <p className="text-xs text-muted-foreground">Enter 11-digit mobile number starting with 03</p>
                    )}
                  </div>
                )}

                {/* Account Title */}
                {bankName && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accountTitle">
                        Account Title <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sameAsName"
                          checked={sameAsName}
                          onCheckedChange={(checked) => setSameAsName(checked as boolean)}
                        />
                        <Label htmlFor="sameAsName" className="text-sm font-normal cursor-pointer">
                          Same as installer name
                        </Label>
                      </div>
                    </div>
                    <Input
                      id="accountTitle"
                      type="text"
                      value={accountTitle}
                      onChange={(e) => {
                        setAccountTitle(e.target.value);
                        setSameAsName(false);
                      }}
                      disabled={sameAsName}
                      placeholder="Account holder name"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Additional Info */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Step 4: Additional Information</h2>

                {/* Certified */}
                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-md">
                  <Checkbox
                    id="certified"
                    checked={certified}
                    onCheckedChange={(checked) => setCertified(checked as boolean)}
                  />
                  <Label htmlFor="certified" className="cursor-pointer">
                    Certified Installer
                  </Label>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name (if any)"
                  />
                </div>

                {/* Referrer Code */}
                <div className="space-y-2">
                  <Label htmlFor="referrerCode">
                    Referrer Code <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="referrerCode"
                      type="text"
                      value={referrerCode}
                      onChange={(e) => {
                        setReferrerCode(e.target.value.toUpperCase());
                        setReferrerData(null);
                        setReferrerError('');
                      }}
                      className="flex-1"
                      placeholder="Enter referrer installer code"
                    />
                    <Button
                      onClick={validateReferrerCode}
                      disabled={loading || !referrerCode.trim()}
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                  {referrerData && (
                    <p className="text-sm text-green-600 dark:text-green-500 flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Referrer: {referrerData.fullName} ({referrerData.installerCode})
                    </p>
                  )}
                  {referrerError && (
                    <p className="text-sm text-destructive">{referrerError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Step 5: Review Details</h2>

                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  {/* Personal Info */}
                  <div>
                    <h3 className="font-medium mb-2">Personal Information</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">CNIC</dt>
                        <dd>{cnicDisplay}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Full Name</dt>
                        <dd>{fullName}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Phone</dt>
                        <dd>{phoneNumber}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">WhatsApp</dt>
                        <dd>{whatsappNumber}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Location */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-2">Location & Training</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">City</dt>
                        <dd>{city}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Province</dt>
                        <dd>{province}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">Address</dt>
                        <dd>{address}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Training Center</dt>
                        <dd>{trainingCenter}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Installer Code</dt>
                        <dd className="font-mono font-bold">{installerCode}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Banking */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-2">Banking Details</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">Bank / Payment Method</dt>
                        <dd>{BANKS.find(b => b.value === bankName)?.label}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">{isDigitalPayment ? 'Mobile Number' : 'Account Number'}</dt>
                        <dd>{accountNumber}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">Account Title</dt>
                        <dd>{accountTitle}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Additional */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-2">Additional Information</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground">Certified</dt>
                        <dd>{certified ? 'Yes' : 'No'}</dd>
                      </div>
                      {companyName && (
                        <div>
                          <dt className="font-medium text-muted-foreground">Company</dt>
                          <dd>{companyName}</dd>
                        </div>
                      )}
                      {referrerData && (
                        <div className="col-span-2">
                          <dt className="font-medium text-muted-foreground">Referrer</dt>
                          <dd>{referrerData.fullName} ({referrerData.installerCode})</dd>
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
              <Button
                onClick={handlePrev}
                disabled={currentStep === 1}
                variant="outline"
              >
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !isStep1Valid()) ||
                    (currentStep === 2 && !isStep2Valid()) ||
                    (currentStep === 3 && !isStep3Valid()) ||
                    (currentStep === 4 && !isStep4Valid()) ||
                    codeGenerating
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
