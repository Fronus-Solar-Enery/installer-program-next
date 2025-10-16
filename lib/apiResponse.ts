import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiResponse {
  static success(data: unknown, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        message: message || "Success",
        data,
      },
      { status }
    );
  }

  static error(
    message: string,
    status = 400,
    errors?: Record<string, string[]> | unknown
  ) {
    return NextResponse.json(
      {
        success: false,
        message,
        errors,
      },
      { status }
    );
  }

  static validationError(
    errors:
      | Array<{ path?: (string | number)[]; message: string }>
      | Record<string, string[]>,
    message?: string
  ) {
    // Format Zod errors into field-level errors
    const formattedErrors: Record<string, string[]> = {};

    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const path = error.path?.join(".") || "general";
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(error.message);
      });
    } else {
      return this.error(
        message || "Please check the form for errors",
        400,
        errors
      );
    }

    return this.error(
      message || "Please check the form for errors",
      400,
      formattedErrors
    );
  }

  static unauthorized(
    message = "You must be signed in to access this resource"
  ) {
    return this.error(message, 401);
  }

  static forbidden(
    message = "You do not have permission to perform this action"
  ) {
    return this.error(message, 403);
  }

  static notFound(message = "The requested resource was not found") {
    return this.error(message, 404);
  }

  static conflict(message = "This resource already exists") {
    return this.error(message, 409);
  }

  static serverError(
    message = "An unexpected error occurred. Please try again later."
  ) {
    return this.error(message, 500);
  }

  static badRequest(message: string, fieldErrors?: Record<string, string[]>) {
    return this.error(message, 400, fieldErrors);
  }
}

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

interface MongoError {
  name?: string;
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  message?: string;
  statusCode?: number;
  status?: number;
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return ApiResponse.validationError(error.issues);
  }

  const mongoError = error as MongoError;

  // Handle Mongoose validation errors
  if (mongoError.name === "ValidationError" && mongoError.errors) {
    const formattedErrors: Record<string, string[]> = {};
    Object.keys(mongoError.errors).forEach((field) => {
      formattedErrors[field] = [mongoError.errors![field].message];
    });
    return ApiResponse.validationError(
      formattedErrors,
      "Please check the form for errors"
    );
  }

  // Handle MongoDB duplicate key error (11000)
  if (
    mongoError.code === 11000 &&
    mongoError.keyPattern &&
    mongoError.keyValue
  ) {
    const field = Object.keys(mongoError.keyPattern)[0];
    const fieldName = formatFieldName(field);
    const value = mongoError.keyValue[field];

    let message = `${fieldName} "${value}" is already in use`;

    // Specific messages for common fields
    if (field === "email") {
      message = `An account with email "${value}" already exists`;
    } else if (field === "installerCode") {
      message = `Installer code "${value}" is already registered`;
    } else if (field === "cnic") {
      message = `CNIC "${value}" is already registered`;
    } else if (field === "serialNumber") {
      message = `Serial number "${value}" is already registered`;
    }

    return ApiResponse.conflict(message);
  }

  // Handle Cast errors (invalid MongoDB ObjectId)
  if (mongoError.name === "CastError") {
    return ApiResponse.badRequest("Invalid ID format provided");
  }

  // Handle network/connection errors
  if (
    mongoError.message?.includes("ECONNREFUSED") ||
    mongoError.message?.includes("ETIMEDOUT")
  ) {
    return ApiResponse.serverError(
      "Database connection failed. Please try again later."
    );
  }

  // Handle authentication errors
  if (
    mongoError.message?.includes("jwt") ||
    mongoError.message?.includes("token")
  ) {
    return ApiResponse.unauthorized(
      "Your session has expired. Please sign in again."
    );
  }

  // Generic error handler
  const message = mongoError.message || "An unexpected error occurred";
  const status = mongoError.statusCode || mongoError.status || 500;

  return ApiResponse.error(message, status);
}

// Helper to extract error message from various error formats
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const err = error as { message?: string; error?: unknown };
    if (err.message) return err.message;
    if (err.error) return extractErrorMessage(err.error);
  }
  return "An unexpected error occurred";
}

// Helper to extract field errors from API response
export function extractFieldErrors(
  error: unknown
): Record<string, string[]> | null {
  if (error && typeof error === "object" && "errors" in error) {
    const err = error as { errors: unknown };
    if (typeof err.errors === "object" && err.errors !== null) {
      return err.errors as Record<string, string[]>;
    }
  }
  return null;
}
