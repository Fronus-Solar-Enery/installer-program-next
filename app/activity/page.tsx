'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Activity, Clock, User, FileText } from 'lucide-react';

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
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

  const getActivityColor = (type: string) => {
    if (type.includes('DELETED')) return 'text-red-600 bg-red-50';
    if (type.includes('REGISTERED') || type.includes('PAID')) return 'text-green-600 bg-green-50';
    if (type.includes('UPDATED')) return 'text-blue-600 bg-blue-50';
    if (type.includes('FAILED')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter(a => a.type.includes(filter));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-600">Track all system activities and changes</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'INSTALLER', 'REWARD', 'TEAM', 'WHATSAPP'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading activities...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600">No activities found</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
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
                            <p className="mt-1 text-xs text-gray-500">
                              Target: {activity.targetName}
                            </p>
                          )}
                        </div>

                        {/* Activity Type Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.type)}`}>
                          {formatActivityType(activity.type)}
                        </span>
                      </div>

                      {/* Changes Details */}
                      {activity.metadata?.changes && Object.keys(activity.metadata.changes).length > 0 && (
                        <details className="mt-3">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            View Changes
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <dl className="space-y-2">
                              {Object.entries(activity.metadata.changes).map(([key, value]: [string, any]) => (
                                <div key={key} className="text-xs">
                                  <dt className="font-medium text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </dt>
                                  <dd className="ml-4 text-gray-600">
                                    <span className="text-red-600 line-through">{String(value.before || 'N/A')}</span>
                                    {' → '}
                                    <span className="text-green-600">{String(value.after || 'N/A')}</span>
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        </details>
                      )}

                      {/* WhatsApp Metadata */}
                      {activity.metadata?.whatsappNumber && (
                        <div className="mt-2 text-xs text-gray-500">
                          📱 {activity.metadata.whatsappNumber}
                          {activity.metadata.errorMessage && (
                            <span className="ml-2 text-red-600">
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
        </div>
      </div>
    </div>
  );
}
