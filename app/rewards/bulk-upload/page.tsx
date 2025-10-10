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
import { AlertCircle, CheckCircle2, Download, Trash2, Upload, ArrowLeft, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PAYMENT_METHOD } from "@/lib/constants";

interface RewardUpdate {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  paymentStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
  issues: string[];
  isValid: boolean;
}

export default function BulkUploadRewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RewardUpdate[]>([]);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingInvalid, setDownloadingInvalid] = useState(false);

  const downloadTemplate = () => {
    setDownloadingTemplate(true);
    try {
      const template = [
        {
          'Serial Number': 'SN123456',
          'Installer Transaction ID': 'TXN001',
          'Referrer Transaction ID': 'TXN002 (optional)',
          'Payment Status': 'PAID',
          'Sending Date': '2025-10-03 (optional)',
          'Payment Method': 'UBANK',
        }
      ];

      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rewards Template');

      // Set column widths
      ws['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 25 },
      ];

      XLSX.writeFile(wb, 'rewards_bulk_update_template.xlsx');
    } finally {
      setTimeout(() => setDownloadingTemplate(false), 500);
    }
  };

  const validatePaymentStatus = (status: string): boolean => {
    const validStatuses = ['PAID', 'PENDING', 'FAILED'];
    return validStatuses.includes(status.toUpperCase());
  };

  const validatePaymentMethod = (method: string): boolean => {
    if (!method) return true; // Optional field
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

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return true; // Optional field
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const validateReward = (reward: Omit<RewardUpdate, 'issues' | 'isValid'>): string[] => {
    const issues: string[] = [];

    // Required field validations
    if (!reward.serialNumber || reward.serialNumber.length < 3) {
      issues.push('Serial number is required (min 3 characters)');
    }

    if (!reward.transactionId || reward.transactionId.length < 3) {
      issues.push('Installer transaction ID is required');
    }

    if (!reward.paymentStatus) {
      issues.push('Payment status is required');
    } else if (!validatePaymentStatus(reward.paymentStatus)) {
      issues.push(`Invalid payment status "${reward.paymentStatus}" (must be: PAID, PENDING, or FAILED)`);
    }

    // Optional field validations
    if (reward.sendingDate && !validateDate(reward.sendingDate)) {
      issues.push(`Invalid sending date format "${reward.sendingDate}"`);
    }

    if (reward.paymentMethod && !validatePaymentMethod(reward.paymentMethod)) {
      issues.push(`Invalid payment method "${reward.paymentMethod}" (must be: UBANK, UPaisa, or NayaPay)`);
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        const parsedRewards: RewardUpdate[] = jsonData.map((row) => {
          const rawPaymentMethod = row['Payment Method']?.toString().trim() || '';
          const reward = {
            serialNumber: row['Serial Number']?.toString().trim() || '',
            transactionId: row['Installer Transaction ID']?.toString().trim() || '',
            referrerTransactionId: row['Referrer Transaction ID']?.toString().trim() || undefined,
            paymentStatus: row['Payment Status']?.toString().toUpperCase().trim() || 'PENDING',
            sendingDate: row['Sending Date']?.toString().trim() || undefined,
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

        // Automatically validate against database
        validateAgainstDatabase(parsedRewards);
      } catch (err: unknown) {
        setError('Failed to parse Excel file: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAgainstDatabase = async (rewards: RewardUpdate[]) => {
    setValidating(true);
    try {
      const response = await fetch('/api/rewards/validate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards }),
      });

      const data = await response.json();

      if (response.ok && data.data?.validatedRewards) {
        setPreview(data.data.validatedRewards);
      }
    } catch (err: unknown) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleDeleteRow = (index: number) => {
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  const downloadInvalidRecords = () => {
    setDownloadingInvalid(true);
    try {
      const invalidRecords = preview.filter(p => !p.isValid);

      if (invalidRecords.length === 0) {
        return;
      }

      const excelData = invalidRecords.map(record => ({
        'Serial Number': record.serialNumber,
        'Installer Transaction ID': record.transactionId,
        'Referrer Transaction ID': record.referrerTransactionId || '',
        'Payment Status': record.paymentStatus,
        'Sending Date': record.sendingDate || '',
        'Payment Method': record.paymentMethod || '',
        'ISSUES': record.issues.join(' | '),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invalid Records');

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
        { wch: 20 }, { wch: 25 }, { wch: 60 },
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `invalid_rewards_${timestamp}.xlsx`);
    } finally {
      setTimeout(() => setDownloadingInvalid(false), 500);
    }
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
      const response = await fetch('/api/rewards/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: preview }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Successfully updated ${data.data?.success} reward(s)!`);
        if (data.data?.errors && data.data.errors.length > 0) {
          setError(`Some errors occurred: ${data.data.errors.join(', ')}`);
        }
        setTimeout(() => {
          router.push('/rewards');
        }, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: unknown) {
      setError('Failed to upload rewards: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const validCount = preview.filter(p => p.isValid).length;
  const invalidCount = preview.filter(p => !p.isValid).length;

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Bulk Update Rewards"
        description="Update multiple reward records at once using an Excel file"
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
          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  1. Download the template file and fill in the reward update data
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  2. Upload the completed Excel file
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  3. Review the data and fix any validation issues
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  4. Click &quot;Update All Valid Records&quot; to finalize
                </p>
                <Button onClick={downloadTemplate} variant="outline" disabled={downloadingTemplate}>
                  {downloadingTemplate ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {downloadingTemplate ? 'Downloading...' : 'Download Template'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Validation Rules:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Serial number must exist in the system</li>
                  <li>Transaction IDs are required for PAID status</li>
                  <li>Payment status: PAID, PENDING, or FAILED</li>
                  <li>Payment method: UBANK, UPaisa, or NayaPay (optional)</li>
                  <li>Sending date format: YYYY-MM-DD (optional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upload Form */}
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
                        disabled={downloadingInvalid}
                      >
                        {downloadingInvalid ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloadingInvalid ? 'Downloading...' : 'Download Invalid Records'}
                      </Button>
                    )}
                  </div>
                )}

                {preview.length > 0 && (
                  <Button type="submit" disabled={loading || invalidCount > 0 || validating}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Updating...' : validating ? 'Validating...' : `Update ${validCount} Valid Record(s)`}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Preview Table */}
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
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Ref. Transaction</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
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
                          <TableCell className="font-mono text-sm">{reward.serialNumber}</TableCell>
                          <TableCell className="font-mono text-sm">{reward.transactionId}</TableCell>
                          <TableCell className="font-mono text-sm">{reward.referrerTransactionId || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              reward.paymentStatus === 'PAID' ? 'default' :
                              reward.paymentStatus === 'FAILED' ? 'destructive' : 'secondary'
                            }>
                              {reward.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{reward.paymentMethod || '-'}</TableCell>
                          <TableCell className="text-sm">{reward.sendingDate || '-'}</TableCell>
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
