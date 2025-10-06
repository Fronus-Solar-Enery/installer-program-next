'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Activity, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActivityData {
  _id: string;
  type: string;
  description: string;
  performedBy?: {
    name: string;
  };
  createdAt: string;
  targetName?: string;
  metadata?: {
    changes?: Record<string, { before: string | number | boolean; after: string | number | boolean }>;
    whatsappNumber?: string;
    errorMessage?: string;
  };
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activities?limit=200');
      const data = await response.json();

      if (data.success) {
        setActivities(data.data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('INSTALLER')) return <User className="h-5 w-5" />;
    if (type.includes('REWARD')) return <Activity className="h-5 w-5" />;
    if (type.includes('TEAM')) return <User className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getActivityVariant = (type: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (type.includes('DELETED')) return 'destructive';
    if (type.includes('REGISTERED') || type.includes('PAID')) return 'default';
    if (type.includes('UPDATED')) return 'secondary';
    return 'outline';
  };

  const getActivityBgColor = (type: string) => {
    if (type.includes('DELETED')) return 'bg-destructive/10 text-destructive';
    if (type.includes('REGISTERED') || type.includes('PAID')) return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    if (type.includes('UPDATED')) return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
    if (type.includes('FAILED')) return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
    return 'bg-muted text-muted-foreground';
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter(a => a.type.includes(filter));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'INSTALLER', 'REWARD', 'TEAM', 'WHATSAPP'].map((filterType) => (
                <Button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  variant={filter === filterType ? 'default' : 'outline'}
                  size="sm"
                >
                  {filterType}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">No activities found</div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${getActivityBgColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.description}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.performedBy?.name || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(activity.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {activity.targetName && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Target: {activity.targetName}
                              </p>
                            )}
                          </div>

                          {/* Activity Type Badge */}
                          <Badge variant={getActivityVariant(activity.type)}>
                            {formatActivityType(activity.type)}
                          </Badge>
                        </div>

                        {/* Changes Details */}
                        {activity.metadata?.changes && Object.keys(activity.metadata.changes).length > 0 && (
                          <details className="mt-3">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                              View Changes
                            </summary>
                            <Alert className="mt-2">
                              <AlertDescription>
                                <dl className="space-y-2">
                                  {Object.entries(activity.metadata.changes).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <dt className="font-medium capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                      </dt>
                                      <dd className="ml-4">
                                        <span className="text-destructive line-through">{String(value.before || 'N/A')}</span>
                                        {' → '}
                                        <span className="text-green-600 dark:text-green-400">{String(value.after || 'N/A')}</span>
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </AlertDescription>
                            </Alert>
                          </details>
                        )}

                        {/* WhatsApp Metadata */}
                        {activity.metadata?.whatsappNumber && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {activity.metadata.whatsappNumber}
                            {activity.metadata.errorMessage && (
                              <span className="ml-2 text-destructive">
                                Error: {activity.metadata.errorMessage}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
