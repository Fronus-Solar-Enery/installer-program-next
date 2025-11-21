import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BatchJob from "@/models/BatchJob";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import {
  createGoogleContact,
  preloadContactGroups,
  deleteGoogleContact,
} from "@/lib/googleContacts";

interface InstallerDocument {
  _id: string;
  installerCode: string;
  fullName: string;
  referrerCode?: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  trainingCenter: string;
  companyName?: string;
  googleContactId?: string;
}

// POST - Process a batch job (Google Contacts creation/deletion)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return ApiResponse.error("Job ID is required", 400);
    }

    await dbConnect();

    // Fetch the batch job
    const job = await BatchJob.findById(jobId);

    if (!job) {
      return ApiResponse.error("Batch job not found", 404);
    }

    // Verify ownership (unless admin)
    if (
      job.createdBy.toString() !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return ApiResponse.forbidden("You can only process your own batch jobs");
    }

    // Check if job is already processing or completed
    if (job.status === "processing") {
      return ApiResponse.error("Job is already being processed", 400);
    }

    // Allow retrying failed jobs
    if (job.status === "completed") {
      return ApiResponse.error("Job is already completed", 400);
    }

    // Update job status to processing
    job.status = "processing";
    await job.save();

    // Process based on job type
    if (job.type === "GOOGLE_CONTACTS_CREATE") {
      // Process in background (don't await - let it run)
      processGoogleContactsCreate(jobId).catch((error) => {
        console.error(
          `Background job ${jobId} failed:`,
          error instanceof Error ? error.message : error
        );
      });

      return ApiResponse.success(
        { jobId, status: "processing" },
        "Google Contacts creation started in background"
      );
    } else if (job.type === "GOOGLE_CONTACTS_DELETE") {
      // Process in background
      processGoogleContactsDelete(jobId).catch((error) => {
        console.error(
          `Background job ${jobId} failed:`,
          error instanceof Error ? error.message : error
        );
      });

      return ApiResponse.success(
        { jobId, status: "processing" },
        "Google Contacts deletion started in background"
      );
    } else {
      return ApiResponse.error("Unknown job type", 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// Background function to process Google Contacts creation
async function processGoogleContactsCreate(jobId: string) {
  try {
    await dbConnect();

    const job = await BatchJob.findById(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    const installerIds = (job.metadata?.installerIds as string[]) || [];

    if (installerIds.length === 0) {
      job.status = "failed";
      job.metadata = {
        ...job.metadata,
        errors: ["No installer IDs provided"],
      };
      await job.save();
      return;
    }

    // Fetch installers
    const installers = (await Installer.find({
      _id: { $in: installerIds },
    }).lean()) as InstallerDocument[];

    if (installers.length === 0) {
      job.status = "failed";
      job.metadata = {
        ...job.metadata,
        errors: ["No installers found"],
      };
      await job.save();
      return;
    }

    // Pre-fetch contact groups
    const trainingCenters = installers.map((i) => i.trainingCenter);
    const preloadedGroups = await preloadContactGroups(trainingCenters);

    // IDEMPOTENCY CHECK: Filter out installers that already have a googleContactId
    const pendingInstallers = installers.filter((i) => !i.googleContactId);
    const skippedCount = installers.length - pendingInstallers.length;

    if (skippedCount > 0) {
      console.log(
        `[Job ${jobId}] Skipping ${skippedCount} already processed installers.`
      );
      // Update progress to reflect skipped items
      await BatchJob.findByIdAndUpdate(jobId, {
        $inc: { processedItems: skippedCount, successCount: skippedCount },
      });
    }

    if (pendingInstallers.length === 0) {
      console.log(`[Job ${jobId}] All installers already processed.`);
      job.status = "completed";
      job.completedAt = new Date();
      await job.save();
      return;
    }

    // Process in parallel batches with rate limit consideration
    const BATCH_SIZE = 5; // Balanced for performance and rate limit avoidance
    const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay to prevent rate limiting

    console.log(
      `[Job ${jobId}] Processing ${pendingInstallers.length} Google Contacts in batches of ${BATCH_SIZE}`
    );

    // Process contacts in batches
    for (let i = 0; i < pendingInstallers.length; i += BATCH_SIZE) {

      // Check if job has been cancelled (fetch fresh from DB)
      await dbConnect(); // Ensure fresh connection
      const currentJob = await BatchJob.findById(jobId).lean();

      if (!currentJob) {
        console.log(`[Job ${jobId}] Job not found, stopping processing`);
        return;
      }

      if (currentJob.status === "failed") {
        console.log(`[Job ${jobId}] ⚠️ Job cancelled by user, stopping processing`);
        return;
      }

      const batch = pendingInstallers.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(pendingInstallers.length / BATCH_SIZE);

      console.log(
        `[Job ${jobId}] Processing batch ${batchNumber}/${totalBatches} (${batch.length} contacts)`
      );

      // Process all contacts in this batch in parallel
      const batchPromises = batch.map(async (installer, index) => {
        try {
          const googleContactId = await createGoogleContact(
            {
              fullName: installer.fullName,
              phoneNumber: installer.phoneNumber,
              whatsappNumber: installer.whatsappNumber,
              address: installer.address,
              city: installer.city,
              province: installer.province,
              companyName: installer.companyName,
              installerCode: installer.installerCode,
              referrerCode: installer.referrerCode,
              cnic: installer.cnic,
              trainingCenter: installer.trainingCenter,
            },
            preloadedGroups || undefined
          );

          if (googleContactId) {
            // Update installer with Google Contact ID
            await Installer.findByIdAndUpdate(installer._id, {
              googleContactId,
            });

            // Use atomic update to avoid ParallelSaveError
            await BatchJob.findByIdAndUpdate(jobId, {
              $inc: { processedItems: 1, successCount: 1 },
            });

            console.log(
              `[Job ${jobId}] ✓ Created Google contact for ${installer.installerCode}`
            );
          } else {
            throw new Error("Failed to create Google contact");
          }
        } catch (error) {
          console.error(
            `[Job ${jobId}] ✗ Failed to create Google contact for ${installer.installerCode}:`,
            error
          );

          // Add error to metadata and increment counters atomically
          const errorMsg = `${installer.installerCode}: ${error instanceof Error ? error.message : "Unknown error"}`;

          await BatchJob.findByIdAndUpdate(jobId, {
            $inc: { processedItems: 1, failedCount: 1 },
            $push: { "metadata.errors": errorMsg },
          });
        }
      });

      // Wait for all contacts in this batch to complete
      await Promise.allSettled(batchPromises);

      console.log(
        `[Job ${jobId}] ✓ Completed batch ${batchNumber}/${totalBatches}`
      );

      // Add delay between batches (except after the last batch)
      if (i + BATCH_SIZE < pendingInstallers.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    }

    // Mark job as completed
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();

    console.log(
      `[Job ${jobId}] ✓ Completed: ${job.successCount} succeeded, ${job.failedCount} failed`
    );
  } catch (error) {
    console.error(`[Job ${jobId}] Fatal error:`, error);

    try {
      await dbConnect();
      const job = await BatchJob.findById(jobId);
      if (job) {
        job.status = "failed";
        const errors = (job.metadata?.errors as string[]) || [];
        errors.push(
          error instanceof Error ? error.message : "Unknown fatal error"
        );
        job.metadata = { ...job.metadata, errors };
        await job.save();
      }
    } catch (updateError) {
      console.error(`Failed to update job ${jobId} with error:`, updateError);
    }
  }
}

// Background function to process Google Contacts deletion
async function processGoogleContactsDelete(jobId: string) {
  try {
    await dbConnect();

    const job = await BatchJob.findById(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    const googleContacts = (job.metadata?.googleContacts as Array<{
      googleContactId: string;
      installerCode: string;
      fullName: string;
    }>) || [];

    if (googleContacts.length === 0) {
      job.status = "failed";
      job.metadata = {
        ...job.metadata,
        errors: ["No Google Contacts provided"],
      };
      await job.save();
      return;
    }

    console.log(
      `[Job ${jobId}] Found ${googleContacts.length} Google Contacts to delete`
    );

    // Process in parallel batches for faster performance
    const BATCH_SIZE = 3; // Process 3 contacts at a time (avoid rate limits)
    const DELAY_BETWEEN_BATCHES = 3000; // 3 second delay between batches

    console.log(
      `[Job ${jobId}] Deleting ${googleContacts.length} Google Contacts in batches of ${BATCH_SIZE}`
    );

    // Process contacts in batches
    for (let i = 0; i < googleContacts.length; i += BATCH_SIZE) {
      // Check if job has been cancelled (fetch fresh from DB)
      await dbConnect(); // Ensure fresh connection
      const currentJob = await BatchJob.findById(jobId).lean();

      if (!currentJob) {
        console.log(`[Job ${jobId}] Job not found, stopping processing`);
        return;
      }

      if (currentJob.status === "failed") {
        console.log(`[Job ${jobId}] ⚠️ Job cancelled by user, stopping processing`);
        return;
      }

      const batch = googleContacts.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(googleContacts.length / BATCH_SIZE);

      console.log(
        `[Job ${jobId}] Processing batch ${batchNumber}/${totalBatches} (${batch.length} contacts)`
      );

      // Process all contacts in this batch in parallel
      const batchPromises = batch.map(async (contact) => {
        try {
          await deleteGoogleContact(contact.googleContactId);

          // Use atomic update to avoid ParallelSaveError
          await BatchJob.findByIdAndUpdate(jobId, {
            $inc: { processedItems: 1, successCount: 1 },
          });

          console.log(
            `[Job ${jobId}] ✓ Deleted Google contact for ${contact.installerCode}`
          );
        } catch (error) {
          console.error(
            `[Job ${jobId}] ✗ Failed to delete Google contact for ${contact.installerCode}:`,
            error
          );

          // Add error to metadata and increment counters atomically
          const errorMsg = `${contact.installerCode}: ${error instanceof Error ? error.message : "Unknown error"}`;

          await BatchJob.findByIdAndUpdate(jobId, {
            $inc: { processedItems: 1, failedCount: 1 },
            $push: { "metadata.errors": errorMsg },
          });
        }
      });

      // Wait for all contacts in this batch to complete
      await Promise.allSettled(batchPromises);

      console.log(
        `[Job ${jobId}] ✓ Completed batch ${batchNumber}/${totalBatches}`
      );

      // Add delay between batches (except after the last batch)
      if (i + BATCH_SIZE < googleContacts.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    }

    // Mark job as completed
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();

    console.log(
      `[Job ${jobId}] ✓ Completed: ${job.successCount} succeeded, ${job.failedCount} failed`
    );
  } catch (error) {
    console.error(`[Job ${jobId}] Fatal error:`, error);

    try {
      await dbConnect();
      const job = await BatchJob.findById(jobId);
      if (job) {
        job.status = "failed";
        const errors = (job.metadata?.errors as string[]) || [];
        errors.push(
          error instanceof Error ? error.message : "Unknown fatal error"
        );
        job.metadata = { ...job.metadata, errors };
        await job.save();
      }
    } catch (updateError) {
      console.error(`Failed to update job ${jobId} with error:`, updateError);
    }
  }
}
