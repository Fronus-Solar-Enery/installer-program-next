import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product, { getProducts } from "@/models/Product";
import { TeamRole } from "@/models/TeamMember";
import { productSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody, getSearchParams } from "@/lib/validateRequest";

// GET all products (any authenticated role — dropdowns need this too)
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const includeInactive =
        getSearchParams(request).getBool("includeInactive") &&
        session.user.role === TeamRole.ADMIN;

      const products = await getProducts();
      const filtered = includeInactive
        ? products
        : products.filter((p) => p.active);

      return ApiResponse.success(filtered);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// CREATE product
export const POST = withAuth(
  async (request: NextRequest) => {
    try {
      const validation = await validateBody(request, productSchema);
      if (!validation.success) return validation.response;

      await dbConnect();

      let order = validation.data.order;
      if (order === undefined) {
        const last = await Product.findOne().sort({ order: -1 });
        order = (last?.order ?? -1) + 1;
      }

      const product = await Product.create({ ...validation.data, order });

      return ApiResponse.success(product, "Product created successfully", 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] }
);
