// User Types
export type UserRole = "expat" | "provider" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpatProfile extends User {
  role: "expat";
  nationality: string;
  residenceStatus: string;
  location: string;
  phoneNumber?: string;
  preferredLanguage: string[];
}

export interface ProviderProfile extends User {
  role: "provider";
  businessName: string;
  description: string;
  specializations: string[];
  languages: string[];
  location: string;
  hourlyRate: number;
  verified: boolean;
  rating: number;
  totalReviews: number;
  licenseNumber?: string;
  yearsOfExperience: number;
  availability: Availability[];
}

// Service Types
export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory =
  | "immigration"
  | "tax"
  | "employment"
  | "real-estate"
  | "family-law"
  | "business-formation"
  | "contract-review"
  | "other";

// Booking Types
export interface Booking {
  id: string;
  expatId: string;
  providerId: string;
  serviceId: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no-show";

// Availability Types
export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded";

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  providerId: string;
  expatId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  bookingId?: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
