import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BatchJob from "@/models/BatchJob";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";

// GET - Fetch batch job status by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const jobId = params.id;

    const job = await BatchJob.findById(jobId).lean();

    if (!job) {
      return ApiResponse.error("Batch job not found", 404);
    }

    // Users can only see their own jobs (unless admin)
    if (
      job.createdBy.toString() !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return ApiResponse.forbidden("You can only view your own batch jobs");
    }

    // Calculate progress percentage
    const progressPercentage =
      job.totalItems > 0
        ? Math.round((job.processedItems / job.totalItems) * 100)
        : 0;

    return ApiResponse.success({
      ...job,
      progressPercentage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
