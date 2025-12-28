import { z } from "zod";

// Common profile validation
export const baseProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone_number: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: "Invalid phone number format",
    }),
});

// Expat profile validation
export const expatProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone_number: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: "Invalid phone number format",
    }),
  country_of_origin: z.string().min(1, "Country of origin is required"),
  city: z.string().min(1, "City is required"),
  residence_status: z.enum([
    "blue_card",
    "job_seeker_visa",
    "student_visa",
    "work_permit",
    "eu_citizen",
    "permanent_residence",
    "other",
  ]),
  years_in_germany: z.enum(["<1", "1-2", "2-5", "5+"]),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  avatar_url: z.string().optional(),
});

// Provider profile validation
export const providerProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  professional_title: z.string().min(1, "Professional title is required"),
  law_firm_name: z.string().min(1, "Law firm/organization name is required"),
  bar_association_number: z
    .string()
    .min(1, "Bar association number is required"),
  years_of_experience: z.enum(["<1", "1-3", "3-5", "5-10", "10-20", "20+"]),
  phone_number: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: "Invalid phone number format",
    }),
  specializations: z
    .array(
      z.enum([
        "immigration_visa",
        "tax_law",
        "contract_law",
        "employment_law",
        "company_formation",
        "family_law",
        "real_estate_law",
      ])
    )
    .min(1, "Select at least one specialization"),
  languages: z.array(
    z.object({
      language: z.string(),
      proficiency: z.enum(["native", "fluent", "professional", "basic"]),
    })
  ),
  accepting_new_clients: z.boolean(),
  response_time: z.enum(["24h", "48h", "1week"]),
  hourly_rate: z.number().min(0).optional(),
  initial_consultation_fee: z.number().min(0).optional(),
  pricing_notes: z.string().max(500).optional(),
  avatar_url: z.string().optional(),
});

// Avatar upload validation
export const avatarUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "File size must be less than 5MB",
  }),
});

export type ExpatProfileUpdate = z.infer<typeof expatProfileUpdateSchema>;
export type ProviderProfileUpdate = z.infer<typeof providerProfileUpdateSchema>;
