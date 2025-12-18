"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { expatProfileSchema } from "@/lib/validations/auth";
import { z } from "zod";

type FormData = z.infer<typeof expatProfileSchema>;
type FormErrors = Partial<Record<keyof FormData | "root", string>>;

const RESIDENCE_STATUS_OPTIONS = [
  { value: "tourist", label: "Tourist" },
  { value: "student", label: "Student" },
  { value: "work_visa", label: "Work Visa" },
  { value: "blue_card", label: "EU Blue Card" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "citizen", label: "Citizen" },
  { value: "other", label: "Other" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
  { value: "nl", label: "Dutch" },
];

export default function ExpatOnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nationality: "",
    countryOfOrigin: "",
    residenceStatus: "tourist",
    location: "",
    city: "",
    phoneNumber: "",
    preferredLanguages: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLanguageToggle = (languageCode: string) => {
    const updated = selectedLanguages.includes(languageCode)
      ? selectedLanguages.filter((l) => l !== languageCode)
      : [...selectedLanguages, languageCode];
    setSelectedLanguages(updated);
    setFormData((prev) => ({ ...prev, preferredLanguages: updated }));
    // Clear error for languages
    if (errors.preferredLanguages) {
      setErrors((prev) => ({ ...prev, preferredLanguages: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form data
      const validationResult = expatProfileSchema.safeParse(formData);
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

      // Call onboarding API
      const response = await fetch("/api/auth/onboarding/expat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ root: data.error || "Failed to complete profile" });
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push(data.redirectTo || "/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      setErrors({ root: "An unexpected error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Help us personalize your experience by providing more details about
            yourself
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{errors.root}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nationality"
                name="nationality"
                type="text"
                value={formData.nationality}
                onChange={handleInputChange}
                error={errors.nationality}
                required
                placeholder="e.g., American, British"
              />

              <Input
                label="Country of Origin"
                name="countryOfOrigin"
                type="text"
                value={formData.countryOfOrigin}
                onChange={handleInputChange}
                error={errors.countryOfOrigin}
                required
                placeholder="e.g., United States"
              />
            </div>

            <Select
              label="Residence Status in Germany"
              name="residenceStatus"
              value={formData.residenceStatus}
              onChange={handleInputChange}
              error={errors.residenceStatus}
              required
              options={RESIDENCE_STATUS_OPTIONS}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                error={errors.city}
                required
                placeholder="e.g., Berlin"
              />

              <Input
                label="Location/Address"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                error={errors.location}
                required
                placeholder="e.g., Mitte, Berlin"
              />
            </div>

            <Input
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              error={errors.phoneNumber}
              placeholder="+49 123 456 7890"
              helperText="Optional - Include country code"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Languages <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => handleLanguageToggle(lang.value)}
                    className={`px-3 py-2 rounded-md border-2 text-sm transition-all ${
                      selectedLanguages.includes(lang.value)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              {errors.preferredLanguages && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.preferredLanguages}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Select all languages you&apos;re comfortable communicating in
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Saving profile..." : "Complete Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
