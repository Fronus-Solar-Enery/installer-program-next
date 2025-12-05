import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import BatchJob from "@/models/BatchJob";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";

// GET - Fetch batch job status by ID
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const job = await BatchJob.findById(id).lean();

      if (!job) {
        return ApiResponse.notFound("Batch job not found");
      }

      // Users can only see their own jobs (unless admin)
      if (
        job.createdBy.toString() !== session.user.id &&
        session.user.role !== TeamRole.ADMIN
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
);
