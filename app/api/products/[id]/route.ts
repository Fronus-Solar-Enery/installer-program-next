import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import InstallerReward from "@/models/InstallerReward";
import { TeamRole } from "@/models/TeamMember";
import { updateProductSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";

// UPDATE product
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext) => {
    try {
      const validation = await validateBody(request, updateProductSchema);
      if (!validation.success) return validation.response;

      await dbConnect();

      const { id } = await context.params;
      const product = await Product.findById(id);

      if (!product) {
        return ApiResponse.notFound("Product not found");
      }

      Object.assign(product, validation.data);
      await product.save();

      return ApiResponse.success(product, "Product updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] }
);

// DELETE product (blocked if any reward references it — deactivate instead)
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext) => {
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

      await product.deleteOne();

      return ApiResponse.success(null, "Product deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] }
);
