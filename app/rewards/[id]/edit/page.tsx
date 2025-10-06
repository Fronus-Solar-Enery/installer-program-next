'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PaymentStatus } from '@/types/rewards';
import { PRODUCT_MODELS, PAYMENT_METHOD } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle } from "lucide-react";

export default function EditRewardPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [reward, setReward] = useState<any>(null);

  // Form fields - all editable fields
  const [serialNumber, setSerialNumber] = useState('');
  const [productModel, setProductModel] = useState('');
  const [inverterSerialNumber, setInverterSerialNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [transactionId, setTransactionId] = useState('');
  const [referrerTransactionId, setReferrerTransactionId] = useState('');
  const [sendingDate, setSendingDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    fetchReward();
  }, [rewardId]);

  const fetchReward = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/rewards/${rewardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reward');
      }

      setReward(data.data);
      // Pre-fill form with existing data
      setSerialNumber(data.data.serialNumber || '');
      setProductModel(data.data.productModel || '');
      setInverterSerialNumber(data.data.inverterSerialNumber || '');
      setPaymentStatus(data.data.paymentStatus);
      setTransactionId(data.data.transactionId || '');
      setReferrerTransactionId(data.data.referrerTransactionId || '');
      setSendingDate(data.data.sendingDate ? new Date(data.data.sendingDate).toISOString().split('T')[0] : '');
      setPaymentMethod(data.data.paymentMethod || '');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reward');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!serialNumber) {
      setError('Serial number is required');
      setLoading(false);
      return;
    }

    if (!productModel) {
      setError('Product model is required');
      setLoading(false);
      return;
    }

    if (!inverterSerialNumber) {
      setError('Inverter serial number is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber,
          productModel,
          inverterSerialNumber,
          paymentStatus,
          transactionId: transactionId || undefined,
          referrerTransactionId: reward?.referrer ? (referrerTransactionId || undefined) : undefined,
          sendingDate: sendingDate || undefined,
          paymentMethod: paymentMethod || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update reward');
      }

      alert('Reward updated successfully!');
      router.push('/rewards');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading reward details...</p>
        </div>
      </div>
    );
  }

  if (!reward) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Alert variant="destructive">
            <AlertDescription>Reward not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Reward Payment Details</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/rewards')}
          >
            ← Back to Rewards
          </Button>
        </div>

        {/* Reward Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reward Information</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Serial Number:</span>
              <span className="ml-2 font-medium">{reward.serialNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Product Model:</span>
              <span className="ml-2 font-medium">{reward.productModel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Installer:</span>
              <span className="ml-2 font-medium">{reward.installer?.installerCode} - {reward.installer?.fullName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reward Amount:</span>
              <span className="ml-2 font-medium text-green-600">Rs. {reward.rewardAmount?.toLocaleString()}</span>
            </div>
            {reward.referrer && (
              <>
                <div>
                  <span className="text-muted-foreground">Referrer:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {reward.referrer.installerCode} - {reward.referrer.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Referrer Reward:</span>
                  <span className="ml-2 font-medium text-green-600">Rs. {reward.referrerRewardAmount || 500}</span>
                </div>
              </>
            )}
          </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Reward Details</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit}>

          <div className="space-y-6">
            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="serial-number">
                Serial Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serial-number"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Enter serial number"
                required
              />
            </div>

            {/* Product Model */}
            <div className="space-y-2">
              <Label htmlFor="product-model">
                Product Model <span className="text-destructive">*</span>
              </Label>
              <Select value={productModel} onValueChange={setProductModel} required>
                <SelectTrigger id="product-model">
                  <SelectValue placeholder="Select product model" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_MODELS.map((product) => (
                    <SelectItem key={product.value} value={product.value}>
                      {product.label} (Rs. {product.reward.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Inverter Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="inverter-serial">
                Inverter Serial Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inverter-serial"
                type="text"
                value={inverterSerialNumber}
                onChange={(e) => setInverterSerialNumber(e.target.value)}
                placeholder="Enter inverter serial number"
                required
              />
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label htmlFor="payment-status">
                Payment Status <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)} required>
                <SelectTrigger id="payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Installer Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="transaction-id">Installer Transaction ID</Label>
              <Input
                id="transaction-id"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
              />
            </div>

            {/* Referrer Transaction ID - Only if referrer exists */}
            {reward.referrer && (
              <div className="space-y-2">
                <Label htmlFor="referrer-transaction-id">Referrer Transaction ID</Label>
                <Input
                  id="referrer-transaction-id"
                  type="text"
                  value={referrerTransactionId}
                  onChange={(e) => setReferrerTransactionId(e.target.value)}
                  placeholder="Enter referrer transaction ID"
                />
              </div>
            )}

            {/* Sending Date */}
            <div className="space-y-2">
              <Label htmlFor="sending-date">Sending Date</Label>
              <Input
                id="sending-date"
                type="date"
                value={sendingDate}
                onChange={(e) => setSendingDate(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD.map(method => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
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
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Reward'}
              </Button>
            </div>
          </div>
        </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
