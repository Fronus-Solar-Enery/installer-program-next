import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BatchJob from "@/models/BatchJob";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";

// POST - Create a new batch job
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const body = await request.json();
    const { type, installerIds, installerCodes } = body;

    if (!type) {
      return ApiResponse.error("type is required", 400);
    }

    let finalInstallerIds: string[] = [];

    // Support both installerIds and installerCodes
    if (installerCodes && Array.isArray(installerCodes) && installerCodes.length > 0) {
      // Look up installer IDs from codes
      const installers = await Installer.find({
        installerCode: { $in: installerCodes }
      }).select("_id").lean();
      
      finalInstallerIds = installers.map(i => i._id.toString());
      
      if (finalInstallerIds.length === 0) {
        return ApiResponse.error("No installers found with the provided codes", 404);
      }
      
      console.log(`✓ Found ${finalInstallerIds.length} installers for codes: ${installerCodes.join(", ")}`);
    } else if (installerIds && Array.isArray(installerIds) && installerIds.length > 0) {
      finalInstallerIds = installerIds;
    } else {
      return ApiResponse.error(
        "Either installerIds or installerCodes array is required",
        400
      );
    }

    if (finalInstallerIds.length === 0) {
      return ApiResponse.error("No installers to process", 400);
    }

    // Delete any existing pending jobs of the same type for this user to prevent duplicates
    await BatchJob.deleteMany({
      createdBy: session.user.id,
      type,
      status: "pending",
    });

    console.log(
      `✓ Cleaned up pending ${type} jobs for user ${session.user.id}`
    );

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

// GET - Fetch all batch jobs for current user (or all if admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Filter by status if provided
    const limit = parseInt(searchParams.get("limit") || "50");
    const activeOnly = searchParams.get("activeOnly") === "true"; // Only pending/processing

    // Build query
    const query: Record<string, unknown> = {};

    // Non-admins can only see their own jobs
    if (session.user.role !== TeamRole.ADMIN) {
      query.createdBy = session.user.id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter active jobs only (pending, processing, or recently completed within 10 seconds)
    if (activeOnly) {
      // Include recently completed jobs (within last 10 seconds)
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
      ) // Only select needed fields
      .lean();

    // Add progress percentage to each job
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

// DELETE - Cancel or permanently delete a batch job
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const action = searchParams.get("action") || "cancel"; // 'cancel' or 'delete'

    if (!jobId) {
      return ApiResponse.error("Job ID is required", 400);
    }

    // Fetch the batch job
    const job = await BatchJob.findById(jobId);

    if (!job) {
      return ApiResponse.error("Batch job not found", 404);
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
      // Only allow deletion of completed, failed, or cancelled jobs
      if (job.status === "pending" || job.status === "processing") {
        return ApiResponse.error(
          "Cannot delete a job that is still running. Cancel it first.",
          400
        );
      }

      await BatchJob.findByIdAndDelete(jobId);
      console.log(`✓ Permanently deleted batch job ${jobId}`);

      return ApiResponse.success(
        { jobId },
        "Batch job deleted successfully"
      );
    }

    // Handle cancellation (default action)
    // Check if job can be cancelled
    if (job.status === "completed") {
      return ApiResponse.error("Cannot cancel a completed job", 400);
    }

    if (job.status === "failed") {
      return ApiResponse.error("Job is already failed", 400);
    }

    // Mark job as failed (cancelled)
    job.status = "failed";
    job.completedAt = new Date();

    // Add cancellation note to metadata
    const errors = (job.metadata?.errors as string[]) || [];
    errors.push("Job cancelled by user");
    job.metadata = { ...job.metadata, errors };

    await job.save();

    console.log(`✓ Cancelled batch job ${jobId}`);

    return ApiResponse.success(
      { jobId },
      "Batch job cancelled successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
