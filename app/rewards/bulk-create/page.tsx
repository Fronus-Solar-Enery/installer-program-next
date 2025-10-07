'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Download, Trash2, Upload, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PAYMENT_METHOD, PRODUCT_MODELS, BANKS } from "@/lib/constants";

interface RewardCreate {
  timestamp: string;
  teamMemberEmail: string;
  installerName: string;
  installerCode: string;
  referrerCode?: string;
  productModel: string;
  serialNumber: string;
  inverterSerialNumber?: string;
  serialNumberStatus: string;
  cityOfInstallation: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  paymentStatus: string;
  transactionId?: string;
  rewardAmount: string;
  referrerRewardAmount?: string;
  referrerTransactionId?: string;
  sendingDate?: string;
  paymentMethod: string;
  issues: string[];
  isValid: boolean;
}

export default function BulkCreateRewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RewardCreate[]>([]);

  const downloadTemplate = () => {
    const template = [
      {
        'Timestamp': '10/2/2025 17:21:47',
        'Team Member Email': 'user@example.com',
        'Installer Name': 'John Doe',
        'Installer Code': 'IP-0001',
        'Referrer Code': 'REF-001 (optional)',
        'Product Model': 'TP LD-51 Battery',
        'Serial Number': 'SN123456',
        'Inverter Serial Number': 'INV123456 (required for batteries)',
        'Serial Number Status': 'ACTIVE',
        'City of Installation': 'Karachi',
        'Bank Name': 'Habib Bank Ltd',
        'Account Number': '1234567890',
        'Account Title': 'John Doe',
        'Payment Status': 'PENDING',
        'Transaction ID': 'TXN123456 (optional)',
        'Reward Amount': '6500',
        'Referrer Reward Amount': '1000 (required if referrer exists)',
        'Referrer Transaction ID': 'REF_TXN123 (optional)',
        'Sending Date': '07 Oct 2025 (optional)',
        'Payment Method': 'UBANK',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rewards Template');

    ws['!cols'] = [
      { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 35 },
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
    ];

    XLSX.writeFile(wb, 'rewards_bulk_create_template.xlsx');
  };

  const validatePaymentStatus = (status: string): boolean => {
    const validStatuses = ['PAID', 'PENDING', 'FAILED'];
    return validStatuses.includes(status.toUpperCase());
  };

  const validatePaymentMethod = (method: string): boolean => {
    if (!method) return true;
    const normalizedMethod = method.toUpperCase().trim();
    return PAYMENT_METHOD.some(pm =>
      pm.value.toUpperCase() === normalizedMethod ||
      pm.label.toUpperCase() === normalizedMethod
    );
  };

  const normalizePaymentMethod = (method: string): string => {
    if (!method) return '';
    const normalizedInput = method.toUpperCase().trim();
    const matched = PAYMENT_METHOD.find(pm =>
      pm.value.toUpperCase() === normalizedInput ||
      pm.label.toUpperCase() === normalizedInput
    );
    return matched ? matched.value : method;
  };

  const validateProductModel = (model: string): boolean => {
    return PRODUCT_MODELS.some(pm =>
      pm.value === model || pm.label === model
    );
  };

  const normalizeProductModel = (model: string): string => {
    const matched = PRODUCT_MODELS.find(pm =>
      pm.value === model || pm.label === model
    );
    return matched ? matched.value : model;
  };

  const normalizeBankName = (bankName: string): string => {
    if (!bankName) return '';
    const normalizedInput = bankName.toLowerCase().trim();
    const matchedBank = BANKS.find(
      (bank) =>
        bank.label.toLowerCase() === normalizedInput ||
        bank.value.toLowerCase() === normalizedInput ||
        bank.shortcut.toLowerCase() === normalizedInput
    );
    return matchedBank ? matchedBank.label : bankName;
  };

  const validateBankName = (bankName: string): boolean => {
    if (!bankName) return false;
    const normalizedInput = bankName.toLowerCase().trim();
    return BANKS.some(
      (bank) =>
        bank.label.toLowerCase() === normalizedInput ||
        bank.value.toLowerCase() === normalizedInput ||
        bank.shortcut.toLowerCase() === normalizedInput
    );
  };

  const parseTimestamp = (timestampStr: string): string => {
    if (!timestampStr) return '';
    try {
      const date = new Date(timestampStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return '';
    } catch {
      return '';
    }
  };

  const parseSendingDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return '';
    } catch {
      return '';
    }
  };

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const validateReward = (reward: Omit<RewardCreate, 'issues' | 'isValid'>): string[] => {
    const issues: string[] = [];

    // Timestamp validation
    if (!reward.timestamp) {
      issues.push('Timestamp is required');
    }

    // Team member email validation
    if (!reward.teamMemberEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reward.teamMemberEmail)) {
      issues.push('Valid team member email is required');
    }

    // Installer name validation
    if (!reward.installerName || reward.installerName.length < 2) {
      issues.push('Installer name is required');
    }

    // Installer code validation
    if (!reward.installerCode || reward.installerCode.length < 3) {
      issues.push('Installer code is required (min 3 characters)');
    }

    // Product model validation
    if (!reward.productModel) {
      issues.push('Product model is required');
    } else if (!validateProductModel(reward.productModel)) {
      issues.push(`Product model "${reward.productModel}" is not in the approved list`);
    } else {
      // Check if inverter serial is required for batteries
      const productConfig = PRODUCT_MODELS.find(pm => pm.value === reward.productModel);
      if (productConfig?.isBattery && !reward.inverterSerialNumber) {
        issues.push('Inverter serial number is required for battery products');
      }
    }

    // Serial number validation
    if (!reward.serialNumber || reward.serialNumber.length < 3) {
      issues.push('Serial number is required (min 3 characters)');
    }

    // Serial number status validation
    if (!reward.serialNumberStatus) {
      issues.push('Serial number status is required');
    }

    // City of installation validation
    if (!reward.cityOfInstallation || reward.cityOfInstallation.length < 2) {
      issues.push('City of installation is required');
    }

    // Bank name validation
    if (!reward.bankName) {
      issues.push('Bank name is required');
    } else if (!validateBankName(reward.bankName)) {
      issues.push(`Invalid bank name "${reward.bankName}"`);
    }

    // Account number validation
    if (!reward.accountNumber) {
      issues.push('Account number is required');
    }

    // Account title validation
    if (!reward.accountTitle) {
      issues.push('Account title is required');
    }

    // Payment status validation
    if (!reward.paymentStatus) {
      issues.push('Payment status is required');
    } else if (!validatePaymentStatus(reward.paymentStatus)) {
      issues.push(`Invalid payment status "${reward.paymentStatus}" (must be: PAID, PENDING, or FAILED)`);
    }

    // Reward amount validation
    if (!reward.rewardAmount || isNaN(Number(reward.rewardAmount))) {
      issues.push('Valid reward amount is required');
    }

    // Payment method validation
    if (!reward.paymentMethod) {
      issues.push('Payment method is required');
    } else if (!validatePaymentMethod(reward.paymentMethod)) {
      issues.push(`Invalid payment method "${reward.paymentMethod}" (must be: UBANK, UPaisa, or NayaPay)`);
    }

    // Referrer validation
    if (reward.referrerCode && !reward.referrerRewardAmount) {
      issues.push('Referrer reward amount is required when referrer code exists');
    }

    // Sending date validation
    if (reward.sendingDate && !validateDate(reward.sendingDate)) {
      issues.push(`Invalid sending date format "${reward.sendingDate}"`);
    }

    return issues;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedRewards: RewardCreate[] = jsonData.map((row: any) => {
          const rawPaymentMethod = row['Payment Method']?.toString().trim() || '';
          const rawProductModel = row['Product Model']?.toString().trim() || '';
          const rawBankName = row['Bank Name']?.toString().trim() || '';
          const reward = {
            timestamp: parseTimestamp(row['Timestamp']?.toString() || ''),
            teamMemberEmail: row['Team Member Email']?.toString().trim() || '',
            installerName: row['Installer Name']?.toString().trim() || '',
            installerCode: row['Installer Code']?.toString().trim().toUpperCase() || '',
            referrerCode: row['Referrer Code']?.toString().trim().toUpperCase() || undefined,
            productModel: normalizeProductModel(rawProductModel),
            serialNumber: row['Serial Number']?.toString().trim() || '',
            inverterSerialNumber: row['Inverter Serial Number']?.toString().trim() || undefined,
            serialNumberStatus: row['Serial Number Status']?.toString().trim() || '',
            cityOfInstallation: row['City of Installation']?.toString().trim() || '',
            bankName: normalizeBankName(rawBankName),
            accountNumber: row['Account Number']?.toString().trim() || '',
            accountTitle: row['Account Title']?.toString().trim() || '',
            paymentStatus: row['Payment Status']?.toString().toUpperCase().trim() || 'PENDING',
            transactionId: row['Transaction ID']?.toString().trim() || undefined,
            rewardAmount: row['Reward Amount']?.toString().trim() || '',
            referrerRewardAmount: row['Referrer Reward Amount']?.toString().trim() || undefined,
            referrerTransactionId: row['Referrer Transaction ID']?.toString().trim() || undefined,
            sendingDate: parseSendingDate(row['Sending Date']?.toString() || ''),
            paymentMethod: normalizePaymentMethod(rawPaymentMethod),
          };

          const issues = validateReward(reward);

          return {
            ...reward,
            issues,
            isValid: issues.length === 0,
          };
        });

        setPreview(parsedRewards);
        setError('');

        validateAgainstDatabase(parsedRewards);
      } catch (err: any) {
        setError('Failed to parse Excel file: ' + err.message);
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAgainstDatabase = async (rewards: RewardCreate[]) => {
    setValidating(true);
    try {
      const response = await fetch('/api/rewards/validate-bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards }),
      });

      const data = await response.json();

      if (response.ok && data.data?.validatedRewards) {
        setPreview(data.data.validatedRewards);
      }
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleDeleteRow = (index: number) => {
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  const downloadInvalidRecords = () => {
    const invalidRecords = preview.filter(p => !p.isValid);

    if (invalidRecords.length === 0) {
      return;
    }

    const excelData = invalidRecords.map(record => ({
      'Timestamp': record.timestamp,
      'Team Member Email': record.teamMemberEmail,
      'Installer Name': record.installerName,
      'Installer Code': record.installerCode,
      'Referrer Code': record.referrerCode || '',
      'Product Model': record.productModel,
      'Serial Number': record.serialNumber,
      'Inverter Serial Number': record.inverterSerialNumber || '',
      'Serial Number Status': record.serialNumberStatus,
      'City of Installation': record.cityOfInstallation,
      'Bank Name': record.bankName,
      'Account Number': record.accountNumber,
      'Account Title': record.accountTitle,
      'Payment Status': record.paymentStatus,
      'Transaction ID': record.transactionId || '',
      'Reward Amount': record.rewardAmount,
      'Referrer Reward Amount': record.referrerRewardAmount || '',
      'Referrer Transaction ID': record.referrerTransactionId || '',
      'Sending Date': record.sendingDate || '',
      'Payment Method': record.paymentMethod,
      'ISSUES': record.issues.join(' | '),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invalid Records');

    ws['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 60 },
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `invalid_rewards_create_${timestamp}.xlsx`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (preview.length === 0) {
      setError('No data to upload. Please select a valid Excel file.');
      return;
    }

    const invalidRows = preview.filter(p => !p.isValid);
    if (invalidRows.length > 0) {
      setError(`Cannot upload: ${invalidRows.length} row(s) have validation issues. Please fix them first.`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/rewards/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: preview }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Successfully created ${data.data?.success} reward(s)!`);
        if (data.data?.errors && data.data.errors.length > 0) {
          setError(`Some errors occurred: ${data.data.errors.slice(0, 5).join(', ')}${data.data.errors.length > 5 ? '...' : ''}`);
        }
        setTimeout(() => {
          router.push('/rewards');
        }, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError('Failed to create rewards: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validCount = preview.filter(p => p.isValid).length;
  const invalidCount = preview.filter(p => !p.isValid).length;

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Bulk Feed Rewards"
        description="Upload multiple reward records at once using an Excel file"
        action={
          <Button
            variant="ghost"
            onClick={() => router.push('/rewards')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rewards
          </Button>
        }
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  1. Download the template file and fill in the reward data
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  2. Upload the completed Excel file
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  3. Review the data and fix any validation issues
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  4. Click "Upload All Valid Records" to finalize
                </p>
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Validation Rules:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Timestamp must be in valid date format (e.g., 10/2/2025 17:21:47)</li>
                  <li>Team member email must be valid and exist in the system</li>
                  <li>Installer name must match the installer code in database</li>
                  <li>Installer code must exist in the system</li>
                  <li>Referrer code (if provided) must be an existing installer</li>
                  <li>Product model must be from approved list</li>
                  <li>Serial number must be unique (non-duplicate)</li>
                  <li>Inverter serial number is required for battery products</li>
                  <li>Serial number status is required</li>
                  <li>City of installation is required</li>
                  <li>Bank name must match the approved banks list</li>
                  <li>Account number and account title are required</li>
                  <li>Payment status: PAID, PENDING, or FAILED</li>
                  <li>Reward amount must be a valid number</li>
                  <li>Referrer reward amount required if referrer code exists</li>
                  <li>Payment method: UBANK, UPaisa, or NayaPay</li>
                  <li>Sending date format: "07 Oct 2025" (optional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {validating && (
                  <Alert>
                    <AlertDescription>Validating against database...</AlertDescription>
                  </Alert>
                )}

                {preview.length > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="default">
                        {validCount} Valid
                      </Badge>
                      {invalidCount > 0 && (
                        <Badge variant="destructive">
                          {invalidCount} Invalid
                        </Badge>
                      )}
                    </div>
                    {invalidCount > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadInvalidRecords}
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Invalid Records
                      </Button>
                    )}
                  </div>
                )}

                {preview.length > 0 && (
                  <Button type="submit" disabled={loading || invalidCount > 0 || validating}>
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : `Create ${validCount} Valid Record(s)`}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Data ({preview.length} records)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Team Member</TableHead>
                        <TableHead>Installer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Serial #</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead className="w-12">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((reward, index) => (
                        <TableRow key={index} className={!reward.isValid ? 'bg-destructive/10' : ''}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {reward.isValid ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Invalid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {reward.timestamp ? new Date(reward.timestamp).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate" title={reward.teamMemberEmail}>
                            {reward.teamMemberEmail}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{reward.installerName}</div>
                            <div className="font-mono text-xs text-muted-foreground">{reward.installerCode}</div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" title={reward.productModel}>
                            {reward.productModel}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{reward.serialNumber}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate" title={reward.bankName}>
                            {reward.bankName}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{reward.rewardAmount}</TableCell>
                          <TableCell>
                            <Badge variant={
                              reward.paymentStatus === 'PAID' ? 'default' :
                              reward.paymentStatus === 'FAILED' ? 'destructive' : 'secondary'
                            }>
                              {reward.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reward.issues.length > 0 ? (
                              <div className="space-y-1">
                                {reward.issues.map((issue, i) => (
                                  <div key={i} className="text-xs text-destructive flex items-start gap-1">
                                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{issue}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No issues</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRow(index)}
                              title="Delete row"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
