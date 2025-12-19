import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { passwordResetRequestSchema } from "@/lib/validations/auth";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = passwordResetRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user with this email
    const { data: rawUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, email, is_active")
      .eq("email", email.toLowerCase())
      .single();

    // Always return success message even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (findError || !rawUser) {
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, you will receive a password reset link shortly.",
        },
        { status: 200 }
      );
    }

    // Type assertion for user data
    const user = rawUser as {
      id: string;
      email: string;
      is_active: boolean;
    };

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, you will receive a password reset link shortly.",
        },
        { status: 200 }
      );
    }

    // Generate password reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    // Update user with reset token
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetExpiry.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error creating reset token:", updateError);
      return NextResponse.json(
        { error: "Failed to process password reset request" },
        { status: 500 }
      );
    }

    // TODO: Send password reset email
    // await sendPasswordResetEmail(email, resetToken);
    // For now, just log the reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    console.log(`Password reset URL for ${email}: ${resetUrl}`);

    return NextResponse.json(
      {
        message:
          "If an account exists with this email, you will receive a password reset link shortly.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
