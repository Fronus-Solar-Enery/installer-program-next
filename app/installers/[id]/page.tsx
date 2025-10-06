'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Copy, Check, Edit, Trash2, ArrowLeft, Award, TrendingUp, Activity as ActivityIcon, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstallerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const installerId = params.id as string;
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  const [loading, setLoading] = useState(true);
  const [installer, setInstaller] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchInstaller();
  }, [installerId]);

  const fetchInstaller = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installers/${installerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch installer');
      }

      setInstaller(data.data.installer);
      setStatistics(data.data.statistics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch installer');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);

      // Fetch installer-specific activities
      const installerActivitiesRes = await fetch(`/api/activities?targetType=Installer&targetId=${installerId}&limit=100`);
      const installerActivitiesData = await installerActivitiesRes.json();

      // Fetch all reward activities for this installer's rewards
      const productsRes = await fetch(`/api/rewards?installer=${installerId}&limit=1000`);
      const productsData = await productsRes.json();

      let allActivities: any[] = [];

      // Add installer activities
      if (installerActivitiesData.success) {
        allActivities = [...installerActivitiesData.data.activities];
      }

      // Fetch reward activities for each product
      if (productsData.success && productsData.data.rewards.length > 0) {
        const rewardIds = productsData.data.rewards.map((r: any) => r._id);

        // Fetch activities for all rewards
        const rewardActivitiesPromises = rewardIds.map((rewardId: string) =>
          fetch(`/api/activities?targetType=InstallerReward&targetId=${rewardId}&limit=100`)
            .then(res => res.json())
        );

        const rewardActivitiesResults = await Promise.all(rewardActivitiesPromises);

        rewardActivitiesResults.forEach((result) => {
          if (result.success) {
            allActivities = [...allActivities, ...result.data.activities];
          }
        });
      }

      // Sort all activities by date (newest first)
      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setActivities(allActivities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch(`/api/rewards?installer=${installerId}&limit=1000`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.rewards);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this installer? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/installers/${installerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Installer deleted successfully!');
        router.push('/installers');
      } else {
        alert(data.error || 'Failed to delete installer');
      }
    } catch (error) {
      console.error('Failed to delete installer:', error);
      alert('An error occurred while deleting the installer');
    }
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copiedText === text;

    return (
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 h-6 w-6"
        onClick={() => copyToClipboard(text)}
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading installer details...</p>
        </div>
      </div>
    );
  }

  if (error || !installer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Installer not found'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/installers')}>
              Back to Installers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/installers')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Installers
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{installer.fullName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Installer Code: {installer.installerCode}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push(`/installers/${installerId}/edit`)}
                variant="default"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Certified Badge */}
        {installer.certified && (
          <div className="mb-6">
            <Badge variant="default" className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700">
              <Award className="h-4 w-4 mr-2" />
              Certified Installer
            </Badge>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Rewards</p>
                    <p className="text-2xl font-semibold">{statistics.totalRewards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">P</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-500">{statistics.pendingRewards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Paid</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-500">{statistics.paidRewards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <span className="text-red-600 dark:text-red-400 font-bold">F</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Failed</p>
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-500">{statistics.failedRewards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Statistics */}
        {statistics && (
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white mb-6">
            <CardHeader>
              <CardTitle className="text-white">Revenue Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm opacity-90">Total Amount</p>
                  <p className="text-2xl font-bold">Rs. {statistics.totalAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Pending Amount</p>
                  <p className="text-2xl font-bold">Rs. {statistics.pendingAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Paid Amount</p>
                  <p className="text-2xl font-bold">Rs. {statistics.paidAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Failed Amount</p>
                  <p className="text-2xl font-bold">Rs. {statistics.failedAmount?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="details" className="mb-6">
          <TabsList>
            <TabsTrigger value="details">
              <Edit className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="activity" onClick={() => activities.length === 0 && fetchActivities()}>
              <ActivityIcon className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="products" onClick={() => products.length === 0 && fetchProducts()}>
              <Package className="h-4 w-4 mr-2" />
              Products ({statistics?.totalRewards || 0})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                      <dd className="mt-1 text-sm">{installer.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">CNIC</dt>
                      <dd className="mt-1 text-sm flex items-center">
                        {installer.cnic}
                        <CopyButton text={installer.cnic} label="CNIC" />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Phone Number</dt>
                      <dd className="mt-1 text-sm flex items-center">
                        {installer.phoneNumber}
                        <CopyButton text={installer.phoneNumber} label="Phone Number" />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">WhatsApp Number</dt>
                      <dd className="mt-1 text-sm flex items-center">
                        {installer.whatsappNumber}
                        <CopyButton text={installer.whatsappNumber} label="WhatsApp Number" />
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">City</dt>
                      <dd className="mt-1 text-sm">{installer.city}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Province</dt>
                      <dd className="mt-1 text-sm">{installer.province}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                      <dd className="mt-1 text-sm">{installer.address}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Training Center</dt>
                      <dd className="mt-1 text-sm">{installer.trainingCenter}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Banking Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Banking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Bank Name</dt>
                      <dd className="mt-1 text-sm">{installer.bankName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Account Number</dt>
                      <dd className="mt-1 text-sm flex items-center">
                        {installer.accountNumber}
                        <CopyButton text={installer.accountNumber} label="Account Number" />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Account Title</dt>
                      <dd className="mt-1 text-sm">{installer.accountTitle}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Installer Code</dt>
                      <dd className="mt-1 text-sm font-mono font-bold flex items-center">
                        {installer.installerCode}
                        <CopyButton text={installer.installerCode} label="Installer Code" />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Certified</dt>
                      <dd className="mt-1 text-sm">
                        {installer.certified ? (
                          <Badge variant="default" className="bg-green-600">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </dd>
                    </div>
                    {installer.companyName && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Company Name</dt>
                        <dd className="mt-1 text-sm">{installer.companyName}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Referrer Information */}
              {installer.referrer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Referrer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Referrer Code</dt>
                        <dd className="mt-1 text-sm flex items-center">
                          {installer.referrer.installerCode}
                          <CopyButton text={installer.referrer.installerCode} label="Referrer Code" />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Referrer Name</dt>
                        <dd className="mt-1 text-sm">{installer.referrer.fullName}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )}

              {/* Registration Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Registration Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Registered By</dt>
                      <dd className="mt-1 text-sm">
                        {installer.registeredBy?.name || 'N/A'} ({installer.registeredBy?.email || 'N/A'})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                      <dd className="mt-1 text-sm">
                        {new Date(installer.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    {installer.updatedAt && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                        <dd className="mt-1 text-sm">
                          {new Date(installer.updatedAt).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <p className="text-center text-muted-foreground py-8">Loading activities...</p>
                ) : activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activities found</p>
                ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activities.map((activity: any, index: number) => (
                      <li key={activity._id}>
                        <div className="relative pb-8">
                          {index !== activities.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-background ${
                                activity.type.includes('REGISTERED') ? 'bg-green-500 dark:bg-green-600' :
                                activity.type.includes('UPDATED') ? 'bg-blue-500 dark:bg-blue-600' :
                                activity.type.includes('DELETED') ? 'bg-red-500 dark:bg-red-600' :
                                activity.type.includes('PAID') ? 'bg-green-500 dark:bg-green-600' :
                                activity.type.includes('FAILED') ? 'bg-red-500 dark:bg-red-600' :
                                'bg-muted'
                              }`}>
                                <ActivityIcon className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm">{activity.description}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  By {activity.performedBy?.name || 'Unknown'}
                                </p>
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                                <time dateTime={activity.createdAt}>
                                  {new Date(activity.createdAt).toLocaleString()}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Installed Products</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <p className="text-center text-muted-foreground py-8">Loading products...</p>
                ) : products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No products found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Product Model</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Reward Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Installation Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product: any) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium">
                            {product.serialNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.productModel}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.cityOfInstallation}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600 dark:text-green-500">
                            Rs. {product.rewardAmount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              product.paymentStatus === 'PAID' ? 'default' :
                              product.paymentStatus === 'PENDING' ? 'secondary' :
                              'destructive'
                            } className={
                              product.paymentStatus === 'PAID' ? 'bg-green-600' :
                              product.paymentStatus === 'PENDING' ? 'bg-yellow-600' :
                              ''
                            }>
                              {product.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.installationDate ? new Date(product.installationDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              onClick={() => router.push(`/rewards/${product._id}`)}
                              className="p-0 h-auto"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
