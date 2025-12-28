import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validations/auth";
import { randomBytes } from "crypto";

/**
 * User Registration API Route
 * Handles new user signup with email verification
 * Updated: 2024-12-18
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, userType } = validationResult.data;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("users")
      // @ts-ignore - Supabase type inference issue
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        role: userType,
        email_verified: false,
        is_active: userType === "expat", // Expats active immediately, providers need approval
        verification_token: verificationToken,
        verification_token_expires: verificationExpiry.toISOString(),
      })
      .select("id, email, name, role")
      .single();

    if (createError || !newUser) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Type assertion for new user data
    const user = newUser as {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken);
    // For now, we'll just log the verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
    console.log(
      `Verification URL for ${email}: ${verificationUrl}`
    );

    // Return success response
    return NextResponse.json(
      {
        message:
          userType === "provider"
            ? "Registration successful! Please check your email to verify your account. Your account will be activated after admin approval."
            : "Registration successful! Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        requiresVerification: true,
        requiresApproval: userType === "provider",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
