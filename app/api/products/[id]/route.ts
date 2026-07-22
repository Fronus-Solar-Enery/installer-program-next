import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import InstallerReward from "@/models/InstallerReward";
import { TeamRole } from "@/models/TeamMember";
import { updateProductSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { logActivity, getChanges } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// UPDATE product
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, updateProductSchema);
      if (!validation.success) return validation.response;

      await dbConnect();

      const { id } = await context.params;
      const product = await Product.findById(id);

      if (!product) {
        return ApiResponse.notFound("Product not found");
      }

      const before = product.toObject() as unknown as Record<string, unknown>;
      Object.assign(product, validation.data);
      await product.save();

      const changes = getChanges(before, validation.data);
      const changedFields = Object.keys(changes);
      if (changedFields.length > 0) {
        await logActivity({
          type: ActivityType.PRODUCT_UPDATED,
          performedBy: session.user.id,
          targetType: "Product",
          targetId: product._id,
          targetName: product.name,
          description: `Updated product "${product.name}": ${changedFields.join(", ")}`,
          metadata: { changes },
          ...getClientInfo(request),
        });
      }

      return ApiResponse.success(product, "Product updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] }
);

// DELETE product (blocked if any reward references it — deactivate instead)
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const product = await Product.findById(id);

      if (!product) {
        return ApiResponse.notFound("Product not found");
      }

      const rewardCount = await InstallerReward.countDocuments({
        productModel: product.name,
      });
      if (rewardCount > 0) {
        return ApiResponse.badRequest(
          "Cannot delete a product with existing rewards referencing it. Deactivate it instead."
        );
      }

      const { _id, name } = product;
      await product.deleteOne();

      await logActivity({
        type: ActivityType.PRODUCT_DELETED,
        performedBy: session.user.id,
        targetType: "Product",
        targetId: _id,
        targetName: name,
        description: `Deleted product "${name}"`,
        ...getClientInfo(request),
      });

      return ApiResponse.success(null, "Product deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] }
);
