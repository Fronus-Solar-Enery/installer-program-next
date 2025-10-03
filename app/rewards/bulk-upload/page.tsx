'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import * as XLSX from 'xlsx';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Reward Payments</h1>
          <button
            onClick={() => router.push('/rewards')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Rewards
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 Instructions</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Download the Excel template below</li>
            <li>Fill in the required fields: Serial Number, Installer Transaction ID, Payment Status</li>
            <li>If the installer has a referrer, Referrer Transaction ID is required</li>
            <li>Optional fields: Sending Date, Payment Method</li>
            <li>Payment Status must be: PENDING, PAID, or FAILED</li>
            <li>Upload the completed Excel file</li>
          </ol>
        </div>

        {/* Download Template Button */}
        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            📥 Download Excel Template
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 whitespace-pre-line">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Excel File</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Preview ({preview.length} records)
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installer TID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer TID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">{item.serialNumber}</td>
                        <td className="px-4 py-3 text-sm">{item.transactionId}</td>
                        <td className="px-4 py-3 text-sm">{item.referrerTransactionId || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            item.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.sendingDate || '-'}</td>
                        <td className="px-4 py-3 text-sm">{item.paymentMethod || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                    ... and {preview.length - 10} more records
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/rewards')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || preview.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loading ? 'Processing...' : `Upload ${preview.length} Records`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
