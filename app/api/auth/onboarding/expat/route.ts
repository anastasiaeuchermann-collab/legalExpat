import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { expatProfileSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user role
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!user || user.role !== "expat") {
      return NextResponse.json(
        { error: "Only expat users can complete this profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = expatProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      nationality,
      countryOfOrigin,
      residenceStatus,
      location,
      city,
      phoneNumber,
      preferredLanguages,
    } = validationResult.data;

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("expat_profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from("expat_profiles")
        .update({
          nationality,
          country_of_origin: countryOfOrigin,
          residence_status: residenceStatus,
          location,
          city,
          phone_number: phoneNumber || null,
          preferred_languages: preferredLanguages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Error updating expat profile:", updateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    } else {
      // Create new profile
      const { error: createError } = await supabaseAdmin
        .from("expat_profiles")
        .insert({
          id: session.user.id,
          nationality,
          country_of_origin: countryOfOrigin,
          residence_status: residenceStatus,
          location,
          city,
          phone_number: phoneNumber || null,
          preferred_languages: preferredLanguages,
        });

      if (createError) {
        console.error("Error creating expat profile:", createError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Profile completed successfully!",
        redirectTo: "/dashboard",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Expat onboarding error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
