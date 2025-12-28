import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  expatProfileUpdateSchema,
  providerProfileUpdateSchema,
} from "@/lib/validations/profile";

/**
 * GET /api/users/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const { data: rawUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, avatar_url")
      .eq("id", session.user.id)
      .single();

    if (userError || !rawUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rawUser as {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar_url: string | null;
    };

    // Get role-specific profile data
    if (user.role === "expat") {
      const { data: expatProfile } = await supabaseAdmin
        .from("expat_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      return NextResponse.json({
        ...user,
        profile: expatProfile,
      });
    } else if (user.role === "provider") {
      const { data: providerProfile } = await supabaseAdmin
        .from("provider_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      return NextResponse.json({
        ...user,
        profile: providerProfile,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get user role
    const { data: rawUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!rawUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rawUser as { role: string };

    // Validate based on role
    if (user.role === "expat") {
      const validationResult = expatProfileUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { name, phone_number, avatar_url, ...profileData } =
        validationResult.data;

      // Update users table
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        // @ts-ignore - Supabase type inference issue
        .update({
          name,
          phone_number,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (userUpdateError) {
        console.error("Error updating user:", userUpdateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }

      // Update expat_profiles table
      const { data: existingProfile } = await supabaseAdmin
        .from("expat_profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (existingProfile) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from("expat_profiles")
          // @ts-ignore - Supabase type inference issue
          .update({
            ...profileData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id);

        if (profileUpdateError) {
          console.error("Error updating expat profile:", profileUpdateError);
          return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
          );
        }
      } else {
        const { error: profileCreateError } = await supabaseAdmin
          .from("expat_profiles")
          // @ts-ignore - Supabase type inference issue
          .insert({
            id: session.user.id,
            ...profileData,
          });

        if (profileCreateError) {
          console.error("Error creating expat profile:", profileCreateError);
          return NextResponse.json(
            { error: "Failed to create profile" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        message: "Profile updated successfully",
      });
    } else if (user.role === "provider") {
      const validationResult = providerProfileUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { name, phone_number, avatar_url, ...profileData } =
        validationResult.data;

      // Update users table
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        // @ts-ignore - Supabase type inference issue
        .update({
          name,
          phone_number,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (userUpdateError) {
        console.error("Error updating user:", userUpdateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }

      // Update provider_profiles table
      const { data: existingProfile } = await supabaseAdmin
        .from("provider_profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (existingProfile) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from("provider_profiles")
          // @ts-ignore - Supabase type inference issue
          .update({
            ...profileData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id);

        if (profileUpdateError) {
          console.error(
            "Error updating provider profile:",
            profileUpdateError
          );
          return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
          );
        }
      } else {
        const { error: profileCreateError } = await supabaseAdmin
          .from("provider_profiles")
          // @ts-ignore - Supabase type inference issue
          .insert({
            id: session.user.id,
            ...profileData,
          });

        if (profileCreateError) {
          console.error(
            "Error creating provider profile:",
            profileCreateError
          );
          return NextResponse.json(
            { error: "Failed to create profile" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        message: "Profile updated successfully",
      });
    }

    return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
