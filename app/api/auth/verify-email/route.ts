import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const { data: user, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, email, email_verified, verification_token_expires, role")
      .eq("verification_token", token)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        {
          message: "Email is already verified",
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // Check if token is expired
    const expiryDate = new Date(user.verification_token_expires);
    if (expiryDate < new Date()) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update user to mark email as verified
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error verifying email:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Email verified successfully!",
        email: user.email,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during verification" },
      { status: 500 }
    );
  }
}

// GET endpoint to resend verification email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user with this email
    const { data: user, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, email, email_verified, verification_token")
      .eq("email", email.toLowerCase())
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Generate new verification token
    const { randomBytes } = await import("crypto");
    const newToken = randomBytes(32).toString("hex");
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours

    // Update user with new token
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        verification_token: newToken,
        verification_token_expires: verificationExpiry.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating verification token:", updateError);
      return NextResponse.json(
        { error: "Failed to resend verification email" },
        { status: 500 }
      );
    }

    // TODO: Send verification email
    // await sendVerificationEmail(email, newToken);
    // For now, just log the verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${newToken}`;
    console.log(`New verification URL for ${email}: ${verificationUrl}`);

    return NextResponse.json(
      {
        message: "Verification email sent successfully!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
