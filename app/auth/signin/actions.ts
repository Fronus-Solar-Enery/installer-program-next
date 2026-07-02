"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(email: string, password: string) {
  try {
    // signIn will throw on error, return undefined on success
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // If we get here without error, authentication succeeded
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // Extract the actual error message from the AuthError
      // The message property contains our custom error text
      const errorMessage = error.message || "Authentication failed";

      return {
        success: false,
        error: errorMessage,
      };
    }

    // For other unexpected errors
    return {
      success: false,
      error: "Unable to connect to the server. Please check your internet connection.",
    };
  }
}
