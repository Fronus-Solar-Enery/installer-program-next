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
import { BANKS } from "@/lib/constants";

interface InstallerUpload {
  installerCode: string;
  fullName: string;
  referrerCode?: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  trainingCenter: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  issues: string[];
  isValid: boolean;
}

export default function BulkUploadInstallersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InstallerUpload[]>([]);

  const downloadTemplate = () => {
    const template = [
      {
        'Installer Code': 'IP-0001',
        'Full Name': 'John Doe',
        'Referrer Code': 'IP-0000 (optional)',
        'CNIC': '12345-1234567-1',
        'Phone Number': '03001234567',
        'WhatsApp Number': '03001234567',
        'Address': '123 Main Street',
        'City': 'Karachi',
        'Province': 'Sindh',
        'Training Center': 'Center A',
        'Company Name': 'ABC Company (optional)',
        'Bank Name': 'HBL',
        'Account Number': '12345678901234',
        'Account Title': 'John Doe',
        'Certified': 'true',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Installers Template');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 12 },
      { wch: 20 }, { wch: 20 }, { wch: 10 },
    ];

    XLSX.writeFile(wb, 'installers_bulk_upload_template.xlsx');
  };

  const validateCNIC = (cnic: string): boolean => {
    // CNIC format: 12345-1234567-1 (13 digits with dashes)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Pakistan phone format: 03001234567 (11 digits starting with 03)
    const phoneRegex = /^03\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  };

  const validateInstallerCode = (code: string): boolean => {
    // Format: IP-XXXX or similar
    return code && code.length >= 3 && code.length <= 20;
  };

  const normalizeBankName = (bankName: string): string => {
    const normalizedInput = bankName.toLowerCase().trim();
    const matchedBank = BANKS.find(bank =>
      bank.label.toLowerCase() === normalizedInput ||
      bank.value.toLowerCase() === normalizedInput ||
      bank.shortcut.toLowerCase() === normalizedInput
    );
    return matchedBank ? matchedBank.label : bankName;
  };

  const validateBankName = (bankName: string): boolean => {
    const normalizedInput = bankName.toLowerCase().trim();
    return BANKS.some(bank =>
      bank.label.toLowerCase() === normalizedInput ||
      bank.value.toLowerCase() === normalizedInput ||
      bank.shortcut.toLowerCase() === normalizedInput
    );
  };

  const validateInstaller = (installer: Omit<InstallerUpload, 'issues' | 'isValid'>): string[] => {
    const issues: string[] = [];

    // Required field validations
    if (!installer.installerCode || !validateInstallerCode(installer.installerCode)) {
      issues.push('Invalid installer code format');
    }
    if (!installer.fullName || installer.fullName.length < 3) {
      issues.push('Full name must be at least 3 characters');
    }
    if (!installer.cnic || !validateCNIC(installer.cnic)) {
      issues.push('Invalid CNIC format (should be: 12345-1234567-1)');
    }
    if (!installer.phoneNumber || !validatePhoneNumber(installer.phoneNumber)) {
      issues.push('Invalid phone number format (should be: 03XXXXXXXXX)');
    }
    if (!installer.whatsappNumber || !validatePhoneNumber(installer.whatsappNumber)) {
      issues.push('Invalid WhatsApp number format (should be: 03XXXXXXXXX)');
    }
    if (!installer.address || installer.address.length < 5) {
      issues.push('Address must be at least 5 characters');
    }
    if (!installer.city || installer.city.length < 2) {
      issues.push('City is required');
    }
    if (!installer.province || installer.province.length < 2) {
      issues.push('Province is required');
    }
    if (!installer.trainingCenter || installer.trainingCenter.length < 2) {
      issues.push('Training center is required');
    }
    if (!installer.bankName || installer.bankName.length < 2) {
      issues.push('Bank name is required');
    } else if (!validateBankName(installer.bankName)) {
      issues.push(`Bank name "${installer.bankName}" is not in the approved list`);
    }
    if (!installer.accountNumber || installer.accountNumber.length < 10) {
      issues.push('Account number must be at least 10 characters');
    }
    if (!installer.accountTitle || installer.accountTitle.length < 3) {
      issues.push('Account title is required');
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

        const parsedInstallers: InstallerUpload[] = jsonData.map((row: any) => {
          const rawBankName = row['Bank Name']?.toString().trim() || '';
          const installer = {
            installerCode: row['Installer Code']?.toString().trim().toUpperCase() || '',
            fullName: row['Full Name']?.toString().trim() || '',
            referrerCode: row['Referrer Code']?.toString().trim().toUpperCase() || undefined,
            cnic: row['CNIC']?.toString().trim() || '',
            phoneNumber: row['Phone Number']?.toString().trim().replace(/[\s-]/g, '') || '',
            whatsappNumber: row['WhatsApp Number']?.toString().trim().replace(/[\s-]/g, '') || '',
            address: row['Address']?.toString().trim() || '',
            city: row['City']?.toString().trim() || '',
            province: row['Province']?.toString().trim() || '',
            trainingCenter: row['Training Center']?.toString().trim() || '',
            companyName: row['Company Name']?.toString().trim() || undefined,
            bankName: normalizeBankName(rawBankName),
            accountNumber: row['Account Number']?.toString().trim() || '',
            accountTitle: row['Account Title']?.toString().trim() || '',
            certified: row['Certified']?.toString().toLowerCase() === 'true' ? true : false,
          };

          const issues = validateInstaller(installer);

          return {
            ...installer,
            issues,
            isValid: issues.length === 0,
          };
        });

        setPreview(parsedInstallers);
        setError('');

        // Automatically validate against database after parsing
        validateAgainstDatabase(parsedInstallers);
      } catch (err: any) {
        setError('Failed to parse Excel file: ' + err.message);
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAgainstDatabase = async (installers: InstallerUpload[]) => {
    setValidating(true);
    try {
      const response = await fetch('/api/installers/validate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installers }),
      });

      const data = await response.json();

      if (response.ok && data.data?.validatedInstallers) {
        setPreview(data.data.validatedInstallers);
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
      'Installer Code': record.installerCode,
      'Full Name': record.fullName,
      'Referrer Code': record.referrerCode || '',
      'CNIC': record.cnic,
      'Phone Number': record.phoneNumber,
      'WhatsApp Number': record.whatsappNumber,
      'Address': record.address,
      'City': record.city,
      'Province': record.province,
      'Training Center': record.trainingCenter,
      'Company Name': record.companyName || '',
      'Bank Name': record.bankName,
      'Account Number': record.accountNumber,
      'Account Title': record.accountTitle,
      'Certified': record.certified ? 'true' : 'false',
      'ISSUES': record.issues.join(' | '),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invalid Records');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 12 },
      { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 60 },
    ];

    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FFE0E0E0' } },
      };
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `invalid_installers_${timestamp}.xlsx`);
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
      const response = await fetch('/api/installers/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installers: preview }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully uploaded ${data.data.success} installer(s)!`);
        setTimeout(() => {
          router.push('/installers');
        }, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError('Failed to upload installers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validCount = preview.filter(p => p.isValid).length;
  const invalidCount = preview.filter(p => !p.isValid).length;

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Bulk Upload Installers"
        description="Upload multiple installers at once using an Excel file"
        action={
          <Button
            variant="ghost"
            onClick={() => router.push('/installers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Installers
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
                  1. Download the template file and fill in the installer data
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
                  <li>CNIC format: 12345-1234567-1 (13 digits with dashes)</li>
                  <li>Phone numbers: 03XXXXXXXXX (11 digits starting with 03)</li>
                  <li>Installer code must be unique</li>
                  <li>All required fields must be filled</li>
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
                    {loading ? 'Uploading...' : `Upload ${validCount} Valid Record(s)`}
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
                        <TableHead>Installer Code</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>CNIC</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Province</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead className="w-12">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((installer, index) => (
                        <TableRow key={index} className={!installer.isValid ? 'bg-destructive/10' : ''}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {installer.isValid ? (
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
                          <TableCell className="font-mono text-sm">{installer.installerCode}</TableCell>
                          <TableCell>{installer.fullName}</TableCell>
                          <TableCell className="font-mono text-sm">{installer.cnic}</TableCell>
                          <TableCell className="font-mono text-sm">{installer.phoneNumber}</TableCell>
                          <TableCell>{installer.city}</TableCell>
                          <TableCell>{installer.province}</TableCell>
                          <TableCell>{installer.bankName}</TableCell>
                          <TableCell>
                            {installer.issues.length > 0 ? (
                              <div className="space-y-1">
                                {installer.issues.map((issue, i) => (
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
