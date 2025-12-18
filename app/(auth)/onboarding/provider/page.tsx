"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { providerProfileSchema } from "@/lib/validations/auth";
import { z } from "zod";

type FormData = z.infer<typeof providerProfileSchema>;
type FormErrors = Partial<Record<keyof FormData | "root", string>>;

const SPECIALIZATION_OPTIONS = [
  { value: "immigration", label: "Immigration Law" },
  { value: "tax", label: "Tax Law" },
  { value: "employment", label: "Employment Law" },
  { value: "family", label: "Family Law" },
  { value: "housing", label: "Housing & Rental Law" },
  { value: "business", label: "Business Law" },
  { value: "contract", label: "Contract Law" },
  { value: "citizenship", label: "Citizenship & Naturalization" },
  { value: "social_security", label: "Social Security Law" },
  { value: "insurance", label: "Insurance Law" },
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

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    description: "",
    specializations: [],
    languages: [],
    location: "",
    city: "",
    yearsOfExperience: 0,
    education: "",
    hourlyRate: undefined,
    acceptsOnlineMeetings: true,
    acceptsInPersonMeetings: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
            ? 0
            : Number(value)
          : value,
    }));

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSpecializationToggle = (spec: string) => {
    const updated = selectedSpecializations.includes(spec)
      ? selectedSpecializations.filter((s) => s !== spec)
      : [...selectedSpecializations, spec];
    setSelectedSpecializations(updated);
    setFormData((prev) => ({ ...prev, specializations: updated }));
    if (errors.specializations) {
      setErrors((prev) => ({ ...prev, specializations: undefined }));
    }
  };

  const handleLanguageToggle = (lang: string) => {
    const updated = selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l) => l !== lang)
      : [...selectedLanguages, lang];
    setSelectedLanguages(updated);
    setFormData((prev) => ({ ...prev, languages: updated }));
    if (errors.languages) {
      setErrors((prev) => ({ ...prev, languages: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form data
      const validationResult = providerProfileSchema.safeParse(formData);
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
      const response = await fetch("/api/auth/onboarding/provider", {
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

      // Success - redirect to pending approval page
      router.push(data.redirectTo || "/onboarding/provider/pending");
    } catch (error) {
      console.error("Onboarding error:", error);
      setErrors({ root: "An unexpected error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Your Provider Profile
          </h1>
          <p className="text-gray-600">
            Tell us about your legal expertise and services
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md inline-block">
            <p className="text-sm text-yellow-800">
              Your profile will be reviewed by our team before activation
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{errors.root}</p>
              </div>
            )}

            <Input
              label="Business/Practice Name"
              name="businessName"
              type="text"
              value={formData.businessName}
              onChange={handleInputChange}
              error={errors.businessName}
              required
              placeholder="e.g., Schmidt Legal Services"
            />

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Professional Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your legal expertise, experience, and approach to helping clients..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Minimum 50 characters - Help clients understand your expertise
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIALIZATION_OPTIONS.map((spec) => (
                  <button
                    key={spec.value}
                    type="button"
                    onClick={() => handleSpecializationToggle(spec.value)}
                    className={`px-3 py-2 rounded-md border-2 text-sm transition-all ${
                      selectedSpecializations.includes(spec.value)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
              {errors.specializations && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.specializations}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
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
              {errors.languages && (
                <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
              )}
            </div>

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
                label="Office Location/Address"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                error={errors.location}
                required
                placeholder="e.g., Mitte, Berlin"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Years of Experience"
                name="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience.toString()}
                onChange={handleInputChange}
                error={errors.yearsOfExperience}
                required
                min="0"
                max="99"
              />

              <Input
                label="Hourly Rate (€)"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate?.toString() || ""}
                onChange={handleInputChange}
                error={errors.hourlyRate}
                placeholder="Optional"
                min="0"
                helperText="Leave empty if you prefer not to display"
              />
            </div>

            <div>
              <label
                htmlFor="education"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Education & Credentials <span className="text-red-500">*</span>
              </label>
              <textarea
                id="education"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="List your degrees, certifications, bar admissions, etc."
                required
              />
              {errors.education && (
                <p className="mt-1 text-sm text-red-600">{errors.education}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Meeting Preferences
              </label>
              <Checkbox
                name="acceptsOnlineMeetings"
                checked={formData.acceptsOnlineMeetings}
                onChange={handleInputChange}
                label="I accept online meetings (video calls)"
              />
              <Checkbox
                name="acceptsInPersonMeetings"
                checked={formData.acceptsInPersonMeetings}
                onChange={handleInputChange}
                label="I accept in-person meetings at my office"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Submitting profile..." : "Submit for Review"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
