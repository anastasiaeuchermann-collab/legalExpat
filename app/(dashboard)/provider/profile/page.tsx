"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { providerProfileUpdateSchema } from "@/lib/validations/profile";
import {
  YEARS_OF_EXPERIENCE_OPTIONS,
  SPECIALIZATION_OPTIONS,
  LANGUAGES,
  LANGUAGE_PROFICIENCY_OPTIONS,
  RESPONSE_TIME_OPTIONS,
} from "@/lib/utils/constants";
import { z } from "zod";

type FormData = z.infer<typeof providerProfileUpdateSchema>;
type FormErrors = Partial<Record<keyof FormData | "root", string>>;

type LanguageWithProficiency = {
  language: string;
  proficiency: "native" | "fluent" | "professional" | "basic";
};

export default function ProviderProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "rejected"
  >("pending");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    professional_title: "",
    law_firm_name: "",
    bar_association_number: "",
    years_of_experience: "<1",
    phone_number: "",
    specializations: [],
    languages: [],
    accepting_new_clients: true,
    response_time: "24h",
    hourly_rate: undefined,
    initial_consultation_fee: undefined,
    pricing_notes: "",
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
          setVerificationStatus(
            data.profile?.verification_status || "pending"
          );
          setFormData({
            name: data.name || "",
            professional_title: data.profile?.professional_title || "",
            law_firm_name: data.profile?.law_firm_name || "",
            bar_association_number: data.profile?.bar_association_number || "",
            years_of_experience:
              data.profile?.years_of_experience || "<1",
            phone_number: data.phone_number || "",
            specializations: data.profile?.specializations || [],
            languages: data.profile?.languages || [],
            accepting_new_clients:
              data.profile?.accepting_new_clients ?? true,
            response_time: data.profile?.response_time || "24h",
            hourly_rate: data.profile?.hourly_rate,
            initial_consultation_fee: data.profile?.initial_consultation_fee,
            pricing_notes: data.profile?.pricing_notes || "",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSuccessMessage("");
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData((prev) => {
      const specializations = prev.specializations.includes(
        specialization as any
      )
        ? prev.specializations.filter((s) => s !== specialization)
        : [...prev.specializations, specialization as any];
      return { ...prev, specializations };
    });
    if (errors.specializations) {
      setErrors((prev) => ({ ...prev, specializations: undefined }));
    }
    setSuccessMessage("");
  };

  const handleLanguageAdd = (language: string) => {
    if (!formData.languages.find((l) => l.language === language)) {
      setFormData((prev) => ({
        ...prev,
        languages: [
          ...prev.languages,
          { language, proficiency: "professional" as const },
        ],
      }));
    }
  };

  const handleLanguageRemove = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.language !== language),
    }));
  };

  const handleLanguageProficiencyChange = (
    language: string,
    proficiency: "native" | "fluent" | "professional" | "basic"
  ) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) =>
        l.language === language ? { ...l, proficiency } : l
      ),
    }));
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
      const validationResult = providerProfileUpdateSchema.safeParse(formData);
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Professional Profile
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your professional information and availability
              </p>
            </div>

            {/* Verification Status Badge */}
            <div>
              {verificationStatus === "verified" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
              {verificationStatus === "pending" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  ⏱ Pending Verification
                </span>
              )}
              {verificationStatus === "rejected" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  ✗ Rejected
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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

            {/* Professional Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Professional Details
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
                placeholder="Dr. Max Mustermann"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Professional Title"
                  name="professional_title"
                  type="text"
                  value={formData.professional_title}
                  onChange={handleInputChange}
                  error={errors.professional_title}
                  required
                  placeholder="Rechtsanwalt"
                  helperText="e.g., Rechtsanwalt, Steuerberater"
                />

                <Input
                  label="Law Firm/Organization"
                  name="law_firm_name"
                  type="text"
                  value={formData.law_firm_name}
                  onChange={handleInputChange}
                  error={errors.law_firm_name}
                  required
                  placeholder="Schmidt & Associates"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bar Association Number"
                  name="bar_association_number"
                  type="text"
                  value={formData.bar_association_number}
                  onChange={handleInputChange}
                  error={errors.bar_association_number}
                  required
                  placeholder="12345"
                />

                <Select
                  label="Years of Experience"
                  name="years_of_experience"
                  value={formData.years_of_experience}
                  onChange={handleInputChange}
                  error={errors.years_of_experience}
                  required
                  options={YEARS_OF_EXPERIENCE_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              </div>
            </div>

            {/* Specializations */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Specializations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SPECIALIZATION_OPTIONS.map((spec) => (
                  <button
                    key={spec.value}
                    type="button"
                    onClick={() => handleSpecializationToggle(spec.value)}
                    className={`px-4 py-2 rounded-md border-2 text-sm transition-all text-left ${
                      formData.specializations.includes(spec.value as any)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
              {errors.specializations && (
                <p className="text-sm text-red-600">{errors.specializations}</p>
              )}
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Languages & Proficiency
              </h2>

              {/* Selected Languages */}
              {formData.languages.length > 0 && (
                <div className="space-y-3">
                  {formData.languages.map((lang) => (
                    <div
                      key={lang.language}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
                    >
                      <span className="flex-1 font-medium text-gray-900">
                        {lang.language}
                      </span>
                      <select
                        value={lang.proficiency}
                        onChange={(e) =>
                          handleLanguageProficiencyChange(
                            lang.language,
                            e.target.value as any
                          )
                        }
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        {LANGUAGE_PROFICIENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleLanguageRemove(lang.language)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LANGUAGES.filter(
                    (lang) =>
                      !formData.languages.find((l) => l.language === lang)
                  ).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageAdd(language)}
                      className="px-3 py-2 rounded-md border-2 border-gray-200 bg-white text-gray-700 hover:border-primary-500 text-sm transition-all"
                    >
                      + {language}
                    </button>
                  ))}
                </div>
              </div>
              {errors.languages && (
                <p className="text-sm text-red-600">{errors.languages}</p>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Availability
              </h2>

              <Checkbox
                name="accepting_new_clients"
                checked={formData.accepting_new_clients}
                onChange={handleInputChange}
                label="Currently accepting new clients"
              />

              <Select
                label="Response Time"
                name="response_time"
                value={formData.response_time}
                onChange={handleInputChange}
                error={errors.response_time}
                required
                options={RESPONSE_TIME_OPTIONS}
                helperText="How quickly do you typically respond to inquiries?"
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Pricing
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Hourly Rate (€)"
                  name="hourly_rate"
                  type="number"
                  value={formData.hourly_rate?.toString() || ""}
                  onChange={handleInputChange}
                  error={errors.hourly_rate}
                  placeholder="150"
                  helperText="Optional"
                  min="0"
                />

                <Input
                  label="Initial Consultation Fee (€)"
                  name="initial_consultation_fee"
                  type="number"
                  value={formData.initial_consultation_fee?.toString() || ""}
                  onChange={handleInputChange}
                  error={errors.initial_consultation_fee}
                  placeholder="100"
                  helperText="Optional"
                  min="0"
                />
              </div>

              <div>
                <label
                  htmlFor="pricing_notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pricing Notes
                </label>
                <textarea
                  id="pricing_notes"
                  name="pricing_notes"
                  value={formData.pricing_notes}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Additional pricing information or special offers..."
                />
                {errors.pricing_notes && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.pricing_notes}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.pricing_notes?.length || 0}/500 characters
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
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
