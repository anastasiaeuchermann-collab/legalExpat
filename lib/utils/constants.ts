export const SERVICE_CATEGORIES = [
  { value: "immigration", label: "Immigration Law" },
  { value: "tax", label: "Tax Advisory" },
  { value: "employment", label: "Employment Law" },
  { value: "real-estate", label: "Real Estate Law" },
  { value: "family-law", label: "Family Law" },
  { value: "business-formation", label: "Business Formation" },
  { value: "contract-review", label: "Contract Review" },
  { value: "other", label: "Other Legal Services" },
] as const;

export const LANGUAGES = [
  "English",
  "German",
  "Spanish",
  "French",
  "Italian",
  "Portuguese",
  "Russian",
  "Turkish",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
] as const;

export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
} as const;

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const USER_ROLES = {
  EXPAT: "expat",
  PROVIDER: "provider",
  ADMIN: "admin",
} as const;
