import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { passwordResetSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    // Validate password data
    const validationResult = passwordResetSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const { data: rawUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, email, password_reset_expires, is_active")
      .eq("password_reset_token", token)
      .single();

    if (findError || !rawUser) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Type assertion for user data
    const user = rawUser as {
      id: string;
      email: string;
      password_reset_expires: string;
      is_active: boolean;
    };

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // Check if token is expired
    const expiryDate = new Date(user.password_reset_expires);
    if (expiryDate < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(validationResult.data.password, 12);

    // Update user password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from("users")
      // @ts-ignore - Supabase type inference issue
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error resetting password:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Password reset successfully! You can now sign in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
