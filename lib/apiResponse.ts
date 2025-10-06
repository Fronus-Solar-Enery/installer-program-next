import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiResponse {
  static success(data: any, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        message: message || 'Success',
        data,
      },
      { status }
    );
  }

  static error(message: string, status = 400, errors?: any) {
    return NextResponse.json(
      {
        success: false,
        message,
        errors,
      },
      { status }
    );
  }

  static validationError(errors: any, message?: string) {
    // Format Zod errors into field-level errors
    const formattedErrors: Record<string, string[]> = {};

    if (Array.isArray(errors)) {
      errors.forEach((error: any) => {
        const path = error.path?.join('.') || 'general';
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(error.message);
      });
    }

    return this.error(
      message || 'Please check the form for errors',
      400,
      formattedErrors
    );
  }

  static unauthorized(message = 'You must be signed in to access this resource') {
    return this.error(message, 401);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return this.error(message, 403);
  }

  static notFound(message = 'The requested resource was not found') {
    return this.error(message, 404);
  }

  static conflict(message = 'This resource already exists') {
    return this.error(message, 409);
  }

  static serverError(message = 'An unexpected error occurred. Please try again later.') {
    return this.error(message, 500);
  }

  static badRequest(message: string, fieldErrors?: Record<string, string[]>) {
    return this.error(message, 400, fieldErrors);
  }
}

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function handleApiError(error: any) {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return ApiResponse.validationError(error.errors);
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const formattedErrors: Record<string, string[]> = {};
    Object.keys(error.errors).forEach((field) => {
      formattedErrors[field] = [error.errors[field].message];
    });
    return ApiResponse.validationError(formattedErrors, 'Please check the form for errors');
  }

  // Handle MongoDB duplicate key error (11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const fieldName = formatFieldName(field);
    const value = error.keyValue[field];

    let message = `${fieldName} "${value}" is already in use`;

    // Specific messages for common fields
    if (field === 'email') {
      message = `An account with email "${value}" already exists`;
    } else if (field === 'installerCode') {
      message = `Installer code "${value}" is already registered`;
    } else if (field === 'cnic') {
      message = `CNIC "${value}" is already registered`;
    } else if (field === 'serialNumber') {
      message = `Serial number "${value}" is already registered`;
    }

    return ApiResponse.conflict(message);
  }

  // Handle Cast errors (invalid MongoDB ObjectId)
  if (error.name === 'CastError') {
    return ApiResponse.badRequest('Invalid ID format provided');
  }

  // Handle network/connection errors
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
    return ApiResponse.serverError('Database connection failed. Please try again later.');
  }

  // Handle authentication errors
  if (error.message?.includes('jwt') || error.message?.includes('token')) {
    return ApiResponse.unauthorized('Your session has expired. Please sign in again.');
  }

  // Generic error handler
  const message = error.message || 'An unexpected error occurred';
  const status = error.statusCode || error.status || 500;

  return ApiResponse.error(message, status);
}

// Helper to extract error message from various error formats
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return extractErrorMessage(error.error);
  return 'An unexpected error occurred';
}

// Helper to extract field errors from API response
export function extractFieldErrors(error: any): Record<string, string[]> | null {
  if (error?.errors && typeof error.errors === 'object') {
    return error.errors;
  }
  return null;
}
