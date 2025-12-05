import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import BatchJob from "@/models/BatchJob";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";
import { getSearchParams } from "@/lib/validateRequest";

// POST - Create a new batch job
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const body = await request.json();
      const { type, installerIds, installerCodes } = body;

      if (!type) {
        return ApiResponse.badRequest("type is required");
      }

      let finalInstallerIds: string[] = [];

      // Support both installerIds and installerCodes
      if (
        installerCodes &&
        Array.isArray(installerCodes) &&
        installerCodes.length > 0
      ) {
        const installers = await Installer.find({
          installerCode: { $in: installerCodes },
        })
          .select("_id")
          .lean();

        finalInstallerIds = installers.map((i) => i._id.toString());

        if (finalInstallerIds.length === 0) {
          return ApiResponse.notFound(
            "No installers found with the provided codes"
          );
        }

        console.log(`✓ Found ${finalInstallerIds.length} installers for codes`);
      } else if (
        installerIds &&
        Array.isArray(installerIds) &&
        installerIds.length > 0
      ) {
        finalInstallerIds = installerIds;
      } else {
        return ApiResponse.badRequest(
          "Either installerIds or installerCodes array is required"
        );
      }

      if (finalInstallerIds.length === 0) {
        return ApiResponse.badRequest("No installers to process");
      }

      // Delete any existing pending jobs of the same type for this user
      await BatchJob.deleteMany({
        createdBy: session.user.id,
        type,
        status: "pending",
      });

      // Create batch job
      const batchJob = await BatchJob.create({
        type,
        status: "pending",
        totalItems: finalInstallerIds.length,
        processedItems: 0,
        successCount: 0,
        failedCount: 0,
        metadata: {
          installerIds: finalInstallerIds,
        },
        createdBy: session.user.id,
      });

      console.log(
        `✓ Created batch job ${batchJob._id} for ${finalInstallerIds.length} items`
      );

      return ApiResponse.success(
        { jobId: batchJob._id.toString() },
        "Batch job created successfully"
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// GET - Fetch all batch jobs for current user (or all if admin)
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const params = getSearchParams(request);
      const status = params.getString("status");
      const limit = params.getInt("limit", 50);
      const activeOnly = params.getBool("activeOnly");

      // Build query
      const query: Record<string, unknown> = {};

      // Non-admins can only see their own jobs
      if (session.user.role !== TeamRole.ADMIN) {
        query.createdBy = session.user.id;
      }

      if (status) {
        query.status = status;
      }

      // Filter active jobs only
      if (activeOnly) {
        const tenSecondsAgo = new Date(Date.now() - 10000);
        query.$or = [
          { status: { $in: ["pending", "processing"] } },
          {
            status: "completed",
            completedAt: { $gte: tenSecondsAgo },
          },
        ];
      }

      const jobs = await BatchJob.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select(
          "_id type status totalItems processedItems successCount failedCount createdAt updatedAt completedAt metadata.errors"
        )
        .lean();

      const jobsWithProgress = jobs.map((job) => ({
        ...job,
        progressPercentage:
          job.totalItems > 0
            ? Math.round((job.processedItems / job.totalItems) * 100)
            : 0,
      }));

      return ApiResponse.success({
        jobs: jobsWithProgress,
        count: jobsWithProgress.length,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE - Cancel or permanently delete a batch job
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const params = getSearchParams(request);
      const jobId = params.getString("jobId");
      const action = params.getString("action") || "cancel";

      if (!jobId) {
        return ApiResponse.badRequest("Job ID is required");
      }

      const job = await BatchJob.findById(jobId);

      if (!job) {
        return ApiResponse.notFound("Batch job not found");
      }

      // Verify ownership (unless admin)
      if (
        job.createdBy.toString() !== session.user.id &&
        session.user.role !== TeamRole.ADMIN
      ) {
        return ApiResponse.forbidden("You can only manage your own batch jobs");
      }

      // Handle permanent deletion
      if (action === "delete") {
        if (job.status === "pending" || job.status === "processing") {
          return ApiResponse.badRequest(
            "Cannot delete a job that is still running. Cancel it first."
          );
        }

        await BatchJob.findByIdAndDelete(jobId);
        console.log(`✓ Permanently deleted batch job ${jobId}`);

        return ApiResponse.success({ jobId }, "Batch job deleted successfully");
      }

      // Handle cancellation (default action)
      if (job.status === "completed") {
        return ApiResponse.badRequest("Cannot cancel a completed job");
      }

      if (job.status === "failed") {
        return ApiResponse.badRequest("Job is already failed");
      }

      // Mark job as failed (cancelled)
      job.status = "failed";
      job.completedAt = new Date();

      const errors = (job.metadata?.errors as string[]) || [];
      errors.push("Job cancelled by user");
      job.metadata = { ...job.metadata, errors };

      await job.save();

      console.log(`✓ Cancelled batch job ${jobId}`);

      return ApiResponse.success({ jobId }, "Batch job cancelled successfully");
    } catch (error) {
      return handleApiError(error);
    }
  }
);
