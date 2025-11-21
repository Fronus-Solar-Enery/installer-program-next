"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";

interface BatchJobData {
  _id: string;
  type: "GOOGLE_CONTACTS_CREATE" | "GOOGLE_CONTACTS_DELETE";
  status: "pending" | "processing" | "completed" | "failed";
  totalItems: number;
  processedItems: number;
  successCount: number;
  failedCount: number;
  currentBatch?: number;
  totalBatches?: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: {
    installerIds?: string[];
    errors?: string[];
    [key: string]: unknown;
  };
}

interface BatchJobContextType {
  activeJobs: BatchJobData[];
  startJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
  isPolling: boolean;
}

const BatchJobContext = createContext<BatchJobContextType | undefined>(
  undefined
);

export function useBatchJobs() {
  const ctx = useContext(BatchJobContext);
  if (!ctx)
    throw new Error("useBatchJobs must be used within BatchJobProvider");
  return ctx;
}

interface BatchJobProviderProps {
  children: React.ReactNode;
}

export function BatchJobProvider({ children }: BatchJobProviderProps) {
  const { isAuthenticated } = useRoleGuard({ autoRedirect: false });
  const [activeJobs, setActiveJobs] = useState<BatchJobData[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Store completed timestamps without forcing rerenders
  const completedTimestampsRef = useRef<Map<string, number>>(new Map());

  // Stable fetch function — ZERO dependencies
  const fetchActiveJobs = useCallback(async () => {
    try { 
      if (document.visibilityState === "hidden" || !isAuthenticated) return;

      const res = await fetch("/api/batch-jobs?activeOnly=true");
      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data = await res.json();
      if (!data.success) return;

      const jobs = data.data.jobs || [];
      const now = Date.now();

      // update completion timestamps in ref only
      jobs.forEach((job: BatchJobData) => {
        if (
          job.status === "completed" &&
          !completedTimestampsRef.current.has(job._id)
        ) {
          completedTimestampsRef.current.set(job._id, now);
        }
      });

      // clean expired completed jobs (5s visibility window)
      const ts = completedTimestampsRef.current;
      ts.forEach((timestamp, id) => {
        if (now - timestamp > 5000) ts.delete(id);
      });

      const filtered = jobs.filter((job: BatchJobData) => {
        if (job.status === "pending" || job.status === "processing")
          return true;
        if (job.status === "completed") {
          const t = ts.get(job._id);
          return t && now - t < 5000;
        }
        return false;
      });

      setActiveJobs(filtered);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, [isAuthenticated]);

  // Start job
  const startJob = useCallback(
    async (jobId: string) => {
      const res = await fetch("/api/batch-jobs/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) throw new Error("Failed to start job");
      await fetchActiveJobs();
    },
    [fetchActiveJobs]
  );

  const retryJob = useCallback(
    async (jobId: string) => {
      await startJob(jobId);
    },
    [startJob]
  );

  const refreshJobs = useCallback(() => fetchActiveJobs(), [fetchActiveJobs]);

  // Polling logic
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial fetch on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveJobs();
    } else {
      setActiveJobs([]); // Clear jobs if not authenticated
    }
  }, [fetchActiveJobs, isAuthenticated]);

  // Polling logic
  useEffect(() => {
    const hasActive = activeJobs.some(
      (job) => job.status === "pending" || job.status === "processing"
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasActive) {
        // Resume polling immediately
        fetchActiveJobs();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(fetchActiveJobs, 5000);
          setIsPolling(true);
        }
      } else if (document.visibilityState === "hidden") {
        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsPolling(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (hasActive && !intervalRef.current && document.visibilityState === "visible") {
      setIsPolling(true);
      intervalRef.current = setInterval(fetchActiveJobs, 5000);
    }

    if (!hasActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeJobs, fetchActiveJobs]);

  // Auto-cleanup completed jobs
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const completedJob = activeJobs.find((j) => j.status === "completed");
    if (completedJob) {
      const completedTime =
        completedTimestampsRef.current.get(completedJob._id) || Date.now();
      const timeSince = Date.now() - completedTime;
      // Add a small buffer (500ms) to ensure the server/filter logic sees it as expired
      const delay = Math.max(0, 5500 - timeSince); 

      timeoutId = setTimeout(() => {
        fetchActiveJobs();
      }, delay);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeJobs, fetchActiveJobs]);

  const contextValue = React.useMemo(
    () => ({
      activeJobs,
      startJob,
      retryJob,
      refreshJobs,
      isPolling,
    }),
    [activeJobs, startJob, retryJob, refreshJobs, isPolling]
  );

  return (
    <BatchJobContext.Provider value={contextValue}>
      {children}
    </BatchJobContext.Provider>
  );
}
