import { NextResponse } from 'next/server';

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

  static validationError(errors: any) {
    return this.error('Validation failed', 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return this.error(message, 404);
  }

  static serverError(message = 'Internal server error') {
    return this.error(message, 500);
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    return ApiResponse.validationError(error.errors);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return ApiResponse.error(`${field} already exists`, 409);
  }

  return ApiResponse.serverError(error.message || 'An unexpected error occurred');
}
