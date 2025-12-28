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

// Profile-specific constants
export const GERMAN_CITIES = [
  "Berlin",
  "Munich",
  "Hamburg",
  "Frankfurt",
  "Cologne",
  "Stuttgart",
  "Düsseldorf",
  "Dortmund",
  "Essen",
  "Leipzig",
  "Bremen",
  "Dresden",
  "Hannover",
  "Nuremberg",
  "Duisburg",
] as const;

export const RESIDENCE_STATUS_OPTIONS = [
  { value: "blue_card", label: "EU Blue Card" },
  { value: "job_seeker_visa", label: "Job Seeker Visa" },
  { value: "student_visa", label: "Student Visa" },
  { value: "work_permit", label: "Work Permit" },
  { value: "eu_citizen", label: "EU Citizen" },
  { value: "permanent_residence", label: "Permanent Residence" },
  { value: "other", label: "Other" },
];

export const YEARS_IN_GERMANY_OPTIONS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-2", label: "1-2 years" },
  { value: "2-5", label: "2-5 years" },
  { value: "5+", label: "More than 5 years" },
];

export const YEARS_OF_EXPERIENCE_OPTIONS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10-20", label: "10-20 years" },
  { value: "20+", label: "20+ years" },
];

export const LANGUAGE_PROFICIENCY_OPTIONS = [
  { value: "native", label: "Native" },
  { value: "fluent", label: "Fluent" },
  { value: "professional", label: "Professional" },
  { value: "basic", label: "Basic" },
];

export const RESPONSE_TIME_OPTIONS = [
  { value: "24h", label: "Within 24 hours" },
  { value: "48h", label: "Within 48 hours" },
  { value: "1week", label: "Within 1 week" },
];

export const SPECIALIZATION_OPTIONS = [
  { value: "immigration_visa", label: "Immigration & Visa Law" },
  { value: "tax_law", label: "Tax Law" },
  { value: "contract_law", label: "Contract Law" },
  { value: "employment_law", label: "Employment Law" },
  { value: "company_formation", label: "Company Formation" },
  { value: "family_law", label: "Family Law" },
  { value: "real_estate_law", label: "Real Estate Law" },
];

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bangladesh", "Belgium", "Bolivia", "Brazil", "Bulgaria", "Canada",
  "Chile", "China", "Colombia", "Croatia", "Czech Republic", "Denmark",
  "Egypt", "Finland", "France", "Germany", "Ghana", "Greece",
  "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Italy", "Japan", "Jordan", "Kenya", "South Korea", "Lebanon",
  "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania",
  "Russia", "Saudi Arabia", "Serbia", "Singapore", "South Africa", "Spain",
  "Sweden", "Switzerland", "Syria", "Thailand", "Tunisia", "Turkey",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Venezuela", "Vietnam",
] as const;
