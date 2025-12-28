import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/users/avatar
 * Upload user avatar
 *
 * TODO: This requires Supabase Storage to be configured
 * For now, this is a placeholder that demonstrates the structure
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // TODO: Upload to Supabase Storage
    // This requires Supabase Storage bucket to be configured
    // For now, return a message about configuration needed

    return NextResponse.json(
      {
        error:
          "Avatar upload requires Supabase Storage to be configured. Please set up a storage bucket named 'avatars' in your Supabase project.",
        message:
          "To enable avatar uploads:\n1. Go to Supabase Dashboard > Storage\n2. Create a new bucket named 'avatars'\n3. Set it to public\n4. Add RLS policies",
      },
      { status: 501 } // Not Implemented
    );

    /*
    // Future implementation when Supabase Storage is configured:

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user avatar_url
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating avatar URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: publicUrl,
    });
    */
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/avatar
 * Delete user avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      // @ts-ignore - Supabase type inference issue
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("Error removing avatar:", error);
      return NextResponse.json(
        { error: "Failed to remove avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Avatar removed successfully",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
