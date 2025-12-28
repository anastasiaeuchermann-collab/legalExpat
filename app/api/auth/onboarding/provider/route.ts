import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { providerProfileSchema } from "@/lib/validations/auth";

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
    const { data: rawUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const user = rawUser as { role: string } | null;

    if (!user || user.role !== "provider") {
      return NextResponse.json(
        { error: "Only provider users can complete this profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = providerProfileSchema.safeParse(body);
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
      businessName,
      description,
      specializations,
      languages,
      location,
      city,
      yearsOfExperience,
      education,
      hourlyRate,
      acceptsOnlineMeetings,
      acceptsInPersonMeetings,
    } = validationResult.data;

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("provider_profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from("provider_profiles")
        // @ts-ignore - Supabase type inference issue
        .update({
          business_name: businessName,
          description,
          specializations,
          languages,
          location,
          city,
          years_of_experience: yearsOfExperience,
          education,
          hourly_rate: hourlyRate || null,
          accepts_online_meetings: acceptsOnlineMeetings,
          accepts_in_person_meetings: acceptsInPersonMeetings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Error updating provider profile:", updateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    } else {
      // Create new profile - provider starts with 'pending' verification status
      const { error: createError } = await supabaseAdmin
        .from("provider_profiles")
        // @ts-ignore - Supabase type inference issue
        .insert({
          id: session.user.id,
          business_name: businessName,
          description,
          specializations,
          languages,
          location,
          city,
          years_of_experience: yearsOfExperience,
          education,
          hourly_rate: hourlyRate || null,
          accepts_online_meetings: acceptsOnlineMeetings,
          accepts_in_person_meetings: acceptsInPersonMeetings,
          verification_status: "pending",
        });

      if (createError) {
        console.error("Error creating provider profile:", createError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message:
          "Profile submitted successfully! Your account is pending admin approval.",
        redirectTo: "/onboarding/provider/pending",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Provider onboarding error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
