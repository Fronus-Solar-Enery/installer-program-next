import { describe, it, expect } from "vitest";
import { z } from "zod";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";

describe("ApiResponse", () => {
  it("success() returns 200 with a data envelope", async () => {
    const res = ApiResponse.success({ id: 1 }, "ok");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, message: "ok", data: { id: 1 } });
  });

  it("notFound() returns 404, conflict() 409, forbidden() 403", () => {
    expect(ApiResponse.notFound().status).toBe(404);
    expect(ApiResponse.conflict().status).toBe(409);
    expect(ApiResponse.forbidden().status).toBe(403);
  });
});

describe("handleApiError", () => {
  it("maps a ZodError to 400 validation", async () => {
    const err = z.object({ a: z.string() }).safeParse({ a: 1 }).error!;
    const res = handleApiError(err);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
  });

  it("maps a Mongo duplicate-key (11000) to 409", async () => {
    const res = handleApiError({
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: "a@b.com" },
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toContain("a@b.com");
  });

  it("maps a Mongoose ValidationError to 400", async () => {
    const res = handleApiError({
      name: "ValidationError",
      errors: { cnic: { message: "Invalid CNIC" } },
    });
    expect(res.status).toBe(400);
  });

  it("maps a CastError to 400", () => {
    expect(handleApiError({ name: "CastError" }).status).toBe(400);
  });

  it("falls back to 500 for an unknown error", () => {
    expect(handleApiError(new Error("boom")).status).toBe(500);
  });
});
