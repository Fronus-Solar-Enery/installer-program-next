'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AlertCircle, CheckCircle2, Download } from "lucide-react";

interface RewardUpdate {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  paymentStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
}

export default function BulkUploadRewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RewardUpdate[]>([]);

  const downloadTemplate = () => {
    const template = [
      {
        'Serial Number': 'SN123456',
        'Installer Transaction ID': 'TXN001',
        'Referrer Transaction ID': 'TXN002 (optional)',
        'Payment Status': 'PAID',
        'Sending Date': '2025-10-03 (optional)',
        'Payment Method': 'Bank Transfer (optional)',
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

    XLSX.writeFile(wb, 'rewards_bulk_upload_template.xlsx');
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

        const parsedRewards: RewardUpdate[] = jsonData.map((row: any) => ({
          serialNumber: row['Serial Number']?.toString().trim() || '',
          transactionId: row['Installer Transaction ID']?.toString().trim() || '',
          referrerTransactionId: row['Referrer Transaction ID']?.toString().trim() || undefined,
          paymentStatus: row['Payment Status']?.toString().toUpperCase().trim() || 'PENDING',
          sendingDate: row['Sending Date']?.toString().trim() || undefined,
          paymentMethod: row['Payment Method']?.toString().trim() || undefined,
        }));

        setPreview(parsedRewards);
        setError('');
      } catch (err: any) {
        setError('Failed to parse Excel file: ' + err.message);
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (preview.length === 0) {
      setError('No data to upload. Please select a valid Excel file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First, fetch all rewards to match serial numbers with IDs
      const rewardsResponse = await fetch('/api/rewards?limit=1000');
      const rewardsData = await rewardsResponse.json();

      if (!rewardsResponse.ok) {
        throw new Error('Failed to fetch rewards');
      }

      const allRewards = rewardsData.data.rewards;
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Update each reward
      for (const update of preview) {
        try {
          // Find reward by serial number
          const reward = allRewards.find(
            (r: any) => r.serialNumber.toUpperCase() === update.serialNumber.toUpperCase()
          );

          if (!reward) {
            results.failed++;
            results.errors.push(`Serial number ${update.serialNumber} not found`);
            continue;
          }

          // Validate transaction IDs
          if (!update.transactionId) {
            results.failed++;
            results.errors.push(`Serial ${update.serialNumber}: Installer transaction ID is required`);
            continue;
          }

          if (reward.referrer && !update.referrerTransactionId) {
            results.failed++;
            results.errors.push(`Serial ${update.serialNumber}: Referrer transaction ID is required`);
            continue;
          }

          // Update reward
          const response = await fetch(`/api/rewards/${reward._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: update.transactionId,
              referrerTransactionId: update.referrerTransactionId,
              paymentStatus: update.paymentStatus,
              sendingDate: update.sendingDate,
              paymentMethod: update.paymentMethod,
            }),
          });

          if (response.ok) {
            results.success++;
          } else {
            const data = await response.json();
            results.failed++;
            results.errors.push(`Serial ${update.serialNumber}: ${data.error || 'Update failed'}`);
          }
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Serial ${update.serialNumber}: ${err.message}`);
        }
      }

      // Show results
      if (results.success > 0) {
        setSuccess(`Successfully updated ${results.success} reward(s).`);
      }

      if (results.failed > 0) {
        setError(`Failed to update ${results.failed} reward(s):\n${results.errors.join('\n')}`);
      }

      if (results.success > 0 && results.failed === 0) {
        setTimeout(() => {
          router.push('/rewards');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Bulk Upload Reward Payments</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/rewards')}
          >
            ← Back to Rewards
          </Button>
        </div>

        {/* Instructions */}
        <Alert className="bg-blue-50 border-border mb-6">
          <AlertDescription>
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the Excel template below</li>
              <li>Fill in the required fields: Serial Number, Installer Transaction ID, Payment Status</li>
              <li>If the installer has a referrer, Referrer Transaction ID is required</li>
              <li>Optional fields: Sending Date, Payment Method</li>
              <li>Payment Status must be: PENDING, PAID, or FAILED</li>
              <li>Upload the completed Excel file</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Download Template Button */}
        <div className="mb-6">
          <Button
            onClick={downloadTemplate}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Excel Template
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Upload Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
          <div className="mb-6 space-y-2">
            <Label htmlFor="excel-file">
              Select Excel File <span className="text-destructive">*</span>
            </Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              required
            />
          </div>

          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">
                Preview ({preview.length} records)
              </h3>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Installer TID</TableHead>
                      <TableHead>Referrer TID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 10).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.serialNumber}</TableCell>
                        <TableCell>{item.transactionId}</TableCell>
                        <TableCell>{item.referrerTransactionId || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.paymentStatus === 'PAID' ? 'default' :
                              item.paymentStatus === 'FAILED' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {item.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.sendingDate || '-'}</TableCell>
                        <TableCell>{item.paymentMethod || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.length > 10 && (
                  <div className="px-4 py-2 bg-muted text-sm text-muted-foreground">
                    ... and {preview.length - 10} more records
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/rewards')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || preview.length === 0}
            >
              {loading ? 'Processing...' : `Upload ${preview.length} Records`}
            </Button>
          </div>
        </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
