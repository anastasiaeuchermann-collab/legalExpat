"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (avatarUrl: string | null) => void;
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  className = "",
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's the "not implemented" message
        if (response.status === 501) {
          setError(
            "Avatar upload requires Supabase Storage configuration. For now, profile photos are disabled."
          );
        } else {
          setError(data.error || "Failed to upload avatar");
        }
        setPreviewUrl("");
        return;
      }

      setAvatarUrl(data.avatarUrl);
      setPreviewUrl("");
      onAvatarChange?.(data.avatarUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("An unexpected error occurred while uploading");
      setPreviewUrl("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!avatarUrl) return;

    setIsUploading(true);
    setError("");

    try {
      const response = await fetch("/api/users/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to remove avatar");
        return;
      }

      setAvatarUrl("");
      setPreviewUrl("");
      onAvatarChange?.(null);
    } catch (err) {
      console.error("Remove error:", err);
      setError("An unexpected error occurred while removing avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || avatarUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Profile photo"
              fill
              className="object-cover"
            />
          ) : (
            <svg
              className="h-12 w-12 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-sm"
            >
              {isUploading ? "Uploading..." : "Choose Photo"}
            </Button>

            {avatarUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={isUploading}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            JPG, PNG or WebP. Max 5MB.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}
    </div>
  );
}
