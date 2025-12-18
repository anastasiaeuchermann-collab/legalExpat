import { z } from "zod";

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    userType: z.enum(["expat", "provider"], {
      required_error: "Please select a user type",
    }),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Password reset request validation schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation validation schema
 */
export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Expat profile completion validation schema
 */
export const expatProfileSchema = z.object({
  nationality: z
    .string()
    .min(1, "Nationality is required")
    .max(100, "Nationality must be less than 100 characters"),
  countryOfOrigin: z
    .string()
    .min(1, "Country of origin is required")
    .max(100, "Country must be less than 100 characters"),
  residenceStatus: z.enum(
    ["tourist", "student", "work_visa", "blue_card", "permanent_resident", "citizen", "other"],
    { required_error: "Please select your residence status" }
  ),
  location: z
    .string()
    .min(1, "Location is required")
    .max(255, "Location must be less than 255 characters"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
      "Invalid phone number format"
    ),
  preferredLanguages: z
    .array(z.string())
    .min(1, "Please select at least one language"),
});

export type ExpatProfileInput = z.infer<typeof expatProfileSchema>;

/**
 * Provider profile completion validation schema
 */
export const providerProfileSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(255, "Business name must be less than 255 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be less than 2000 characters"),
  specializations: z
    .array(z.string())
    .min(1, "Please select at least one specialization"),
  languages: z
    .array(z.string())
    .min(1, "Please select at least one language you speak"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(255, "Location must be less than 255 characters"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  yearsOfExperience: z
    .number()
    .min(0, "Years of experience must be 0 or greater")
    .max(99, "Years of experience must be less than 100"),
  licenseNumber: z
    .string()
    .optional(),
  barAssociation: z
    .string()
    .optional(),
  education: z
    .string()
    .min(1, "Education is required")
    .min(10, "Please provide more details about your education")
    .max(1000, "Education must be less than 1000 characters"),
  hourlyRate: z
    .number()
    .positive("Hourly rate must be greater than 0")
    .optional(),
  acceptsOnlineMeetings: z.boolean(),
  acceptsInPersonMeetings: z.boolean(),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
