"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { expatProfileUpdateSchema } from "@/lib/validations/profile";
import {
  COUNTRIES,
  GERMAN_CITIES,
  RESIDENCE_STATUS_OPTIONS,
  YEARS_IN_GERMANY_OPTIONS,
  LANGUAGES,
} from "@/lib/utils/constants";
import { z } from "zod";

type FormData = z.infer<typeof expatProfileUpdateSchema>;
type FormErrors = Partial<Record<keyof FormData | "root", string>>;

export default function ExpatProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone_number: "",
    country_of_origin: "",
    city: "",
    residence_status: "eu_citizen",
    years_in_germany: "<1",
    languages: [],
    avatar_url: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || "",
            phone_number: data.phone_number || "",
            country_of_origin: data.profile?.country_of_origin || "",
            city: data.profile?.city || "",
            residence_status: data.profile?.residence_status || "eu_citizen",
            years_in_germany: data.profile?.years_in_germany || "<1",
            languages: data.profile?.languages || [],
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSuccessMessage("");
  };

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => {
      const languages = prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language];
      return { ...prev, languages };
    });
    if (errors.languages) {
      setErrors((prev) => ({ ...prev, languages: undefined }));
    }
    setSuccessMessage("");
  };

  const handleAvatarChange = (avatarUrl: string | null) => {
    setFormData((prev) => ({ ...prev, avatar_url: avatarUrl || "" }));
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // Validate form data
      const validationResult = expatProfileUpdateSchema.safeParse(formData);
      if (!validationResult.success) {
        const fieldErrors: FormErrors = {};
        validationResult.error.errors.forEach((error) => {
          const path = error.path[0] as keyof FormData;
          if (path) {
            fieldErrors[path] = error.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      // Submit to API
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ root: data.error || "Failed to update profile" });
        }
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Profile updated successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error("Profile update error:", error);
      setErrors({ root: "An unexpected error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  if (status === "loading" || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update your personal information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{errors.root}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>

              <AvatarUpload
                currentAvatarUrl={formData.avatar_url}
                onAvatarChange={handleAvatarChange}
              />

              <Input
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                required
                placeholder="John Doe"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                helperText="Email cannot be changed"
              />

              <Input
                label="Phone Number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                error={errors.phone_number}
                placeholder="+49 123 456 7890"
                helperText="Include country code (e.g., +49 for Germany)"
              />
            </div>

            {/* Location & Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Location & Status
              </h2>

              <Select
                label="Country of Origin"
                name="country_of_origin"
                value={formData.country_of_origin}
                onChange={handleInputChange}
                error={errors.country_of_origin}
                required
                options={[
                  { value: "", label: "Select a country" },
                  ...COUNTRIES.map((country) => ({
                    value: country,
                    label: country,
                  })),
                ]}
              />

              <Select
                label="Current City in Germany"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                error={errors.city}
                required
                options={[
                  { value: "", label: "Select a city" },
                  ...GERMAN_CITIES.map((city) => ({
                    value: city,
                    label: city,
                  })),
                ]}
              />

              <Select
                label="Residence Status"
                name="residence_status"
                value={formData.residence_status}
                onChange={handleInputChange}
                error={errors.residence_status}
                required
                options={RESIDENCE_STATUS_OPTIONS}
              />

              <Select
                label="Years in Germany"
                name="years_in_germany"
                value={formData.years_in_germany}
                onChange={handleInputChange}
                error={errors.years_in_germany}
                required
                options={YEARS_IN_GERMANY_OPTIONS}
              />
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Languages Spoken
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGES.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => handleLanguageToggle(language)}
                    className={`px-3 py-2 rounded-md border-2 text-sm transition-all ${
                      formData.languages.includes(language)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
              {errors.languages && (
                <p className="text-sm text-red-600">{errors.languages}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
