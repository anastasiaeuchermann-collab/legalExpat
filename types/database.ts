// =============================================
// DATABASE TYPES - Generated from Supabase Schema
// =============================================

// Enum Types
export type UserRole = "expat" | "provider" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type ResidenceStatus = "tourist" | "student" | "work_visa" | "blue_card" | "permanent_resident" | "citizen" | "other";
export type ServiceCategory =
  | "immigration"
  | "visa_support"
  | "work_permit"
  | "tax_filing"
  | "tax_advisory"
  | "employment"
  | "contract_review"
  | "company_formation"
  | "real_estate"
  | "family_law"
  | "residence_permit"
  | "citizenship"
  | "other";
export type PricingType = "fixed" | "hourly" | "tiered";
export type ServiceDelivery = "online" | "in_person" | "hybrid";
export type BookingStatus =
  | "requested"
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "refunded";
export type CancellationInitiator = "expat" | "provider" | "admin" | "system";
export type DocumentType = "identification" | "contract" | "permit" | "other";
export type DocumentVisibility = "private" | "shared_with_provider" | "public";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";
export type PaymentMethodType = "card" | "sepa_debit" | "sofort" | "giropay" | "paypal" | "other";
export type EscrowStatus = "held" | "released_to_provider" | "refunded_to_expat" | "disputed";
export type RefundReason = "requested_by_customer" | "duplicate" | "fraudulent" | "service_not_provided" | "other";
export type ReviewStatus = "pending" | "published" | "flagged" | "removed";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";
export type AttachmentType = "image" | "document" | "video" | "other";

// =============================================
// USER TABLES
// =============================================
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  email_verified: boolean;
  phone_number: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ExpatProfile {
  id: string;
  nationality: string | null;
  country_of_origin: string | null;
  residence_status: ResidenceStatus | null;
  residence_permit_expiry: Date | null;
  location: string | null;
  city: string | null;
  postal_code: string | null;
  preferred_languages: string[];
  date_of_birth: Date | null;
  occupation: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderProfile {
  id: string;
  business_name: string;
  description: string | null;
  specializations: string[];
  languages: string[];

  // Location
  location: string;
  city: string;
  postal_code: string | null;
  address: string | null;

  // Professional info
  license_number: string | null;
  bar_association: string | null;
  years_of_experience: number;
  education: string | null;
  certifications: string[];

  // Pricing
  hourly_rate: number | null;
  consultation_fee: number | null;
  accepts_online_meetings: boolean;
  accepts_in_person_meetings: boolean;

  // Verification
  verification_status: VerificationStatus;
  verification_documents: string[];
  verified_at: Date | null;
  verified_by: string | null;

  // Ratings
  rating: number;
  total_reviews: number;
  total_bookings: number;
  completed_bookings: number;

  // Business
  tax_id: string | null;
  business_registration_number: string | null;
  website_url: string | null;
  linkedin_url: string | null;

  // Availability
  is_accepting_clients: boolean;
  response_time_hours: number;

  created_at: Date;
  updated_at: Date;
}

export interface ProviderAvailability {
  id: string;
  provider_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderBlockedDate {
  id: string;
  provider_id: string;
  blocked_date: Date;
  reason: string | null;
  created_at: Date;
}

// =============================================
// SERVICE TABLES
// =============================================
export interface ServiceCategoryRef {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Service {
  id: string;
  provider_id: string;
  category: ServiceCategory;
  category_id: string | null;

  // Details
  title: string;
  description: string;
  short_description: string | null;

  // Pricing
  pricing_type: PricingType;
  base_price: number | null;
  hourly_rate: number | null;
  currency: string;

  // Duration
  estimated_duration_minutes: number | null;
  duration_label: string | null;

  // Delivery
  delivery_method: ServiceDelivery;

  // Requirements
  required_documents: string[];
  prerequisites: string | null;
  what_to_prepare: string | null;

  // Additional
  included_items: string[];
  excluded_items: string[];
  languages: string[];

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Metadata
  views_count: number;
  bookings_count: number;

  created_at: Date;
  updated_at: Date;
}

export interface ServicePricingTier {
  id: string;
  service_id: string;
  tier_name: string;
  tier_description: string | null;
  price: number;
  features: string[];
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceTag {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

export interface ServiceTagMapping {
  service_id: string;
  tag_id: string;
  created_at: Date;
}

// =============================================
// BOOKING TABLES
// =============================================
export interface Booking {
  id: string;
  booking_number: string;

  // Relationships
  expat_id: string;
  provider_id: string;
  service_id: string;

  // Details
  status: BookingStatus;
  scheduled_date: Date;
  scheduled_time: string;
  scheduled_end_time: string | null;
  duration_minutes: number;

  // Meeting
  meeting_type: ServiceDelivery;
  meeting_url: string | null;
  meeting_location: string | null;
  meeting_notes: string | null;

  // Pricing
  service_price: number;
  platform_fee: number;
  total_amount: number;
  currency: string;

  // Notes
  expat_notes: string | null;
  provider_notes: string | null;
  internal_notes: string | null;

  // Status tracking
  confirmed_at: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  cancelled_by: CancellationInitiator | null;

  // Reminders
  reminder_sent_at: Date | null;
  follow_up_sent_at: Date | null;

  created_at: Date;
  updated_at: Date;
}

export interface BookingDocument {
  id: string;
  booking_id: string;
  uploaded_by: string;

  // Document
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
  file_type: string | null;
  document_type: DocumentType;
  visibility: DocumentVisibility;

  // Metadata
  title: string | null;
  description: string | null;
  notes: string | null;

  // Status
  is_required: boolean;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: Date | null;

  created_at: Date;
  updated_at: Date;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}

// =============================================
// PAYMENT TABLES
// =============================================
export interface Payment {
  id: string;
  payment_number: string;

  // Relationships
  booking_id: string;
  expat_id: string;
  provider_id: string;

  // Stripe
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_charge_id: string | null;

  // Details
  amount: number;
  platform_fee: number;
  provider_amount: number;
  currency: string;

  // Status
  status: PaymentStatus;
  payment_method_type: PaymentMethodType | null;

  // Escrow
  escrow_status: EscrowStatus;
  escrowed_at: Date | null;
  released_at: Date | null;

  // Timestamps
  paid_at: Date | null;
  failed_at: Date | null;
  cancelled_at: Date | null;
  failure_reason: string | null;

  // Metadata
  metadata: Record<string, any> | null;
  description: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface PaymentEvent {
  id: string;
  payment_id: string | null;
  stripe_event_id: string;
  event_type: string;
  event_data: Record<string, any>;
  processed: boolean;
  processed_at: Date | null;
  error_message: string | null;
  created_at: Date;
}

export interface Refund {
  id: string;
  refund_number: string;

  // Relationships
  payment_id: string;
  booking_id: string;

  // Stripe
  stripe_refund_id: string | null;

  // Details
  amount: number;
  currency: string;
  reason: RefundReason;
  description: string | null;

  // Status
  status: PaymentStatus;
  initiated_by: string | null;

  // Timestamps
  refunded_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;

  // Metadata
  metadata: Record<string, any> | null;

  created_at: Date;
  updated_at: Date;
}

export interface ProviderPayout {
  id: string;
  payout_number: string;

  // Relationships
  provider_id: string;

  // Stripe
  stripe_transfer_id: string | null;
  stripe_account_id: string | null;

  // Details
  amount: number;
  currency: string;
  payment_ids: string[];

  // Status
  status: PaymentStatus;

  // Timestamps
  transferred_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;

  // Metadata
  metadata: Record<string, any> | null;
  description: string | null;

  created_at: Date;
  updated_at: Date;
}

// =============================================
// REVIEW TABLES
// =============================================
export interface Review {
  id: string;

  // Relationships
  booking_id: string;
  provider_id: string;
  expat_id: string;
  service_id: string;

  // Review
  rating: number; // 1-5
  title: string | null;
  comment: string;

  // Provider response
  provider_response: string | null;
  provider_responded_at: Date | null;

  // Status
  status: ReviewStatus;
  is_verified_booking: boolean;
  is_featured: boolean;

  // Votes
  helpful_count: number;
  not_helpful_count: number;

  // Moderation
  flagged_at: Date | null;
  flagged_by: string | null;
  flag_reason: string | null;
  moderated_at: Date | null;
  moderated_by: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: Date;
}

// =============================================
// MESSAGE TABLES
// =============================================
export interface MessageThread {
  id: string;
  booking_id: string | null;

  // Participants
  expat_id: string;
  provider_id: string;

  // Status
  is_active: boolean;
  archived_by_expat: boolean;
  archived_by_provider: boolean;

  // Last message
  last_message_at: Date | null;
  last_message_preview: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  thread_id: string;

  // Sender/Receiver
  sender_id: string;
  receiver_id: string;

  // Content
  content: string;
  is_system_message: boolean;

  // Status
  status: MessageStatus;
  read_at: Date | null;
  delivered_at: Date | null;

  // Metadata
  metadata: Record<string, any> | null;

  created_at: Date;
  updated_at: Date;
}

export interface MessageAttachment {
  id: string;
  message_id: string;

  // File
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
  file_type: string | null;
  attachment_type: AttachmentType;

  created_at: Date;
}

// =============================================
// DATABASE TYPE DEFINITIONS
// =============================================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      expat_profiles: {
        Row: ExpatProfile;
        Insert: Omit<ExpatProfile, "created_at" | "updated_at">;
        Update: Partial<Omit<ExpatProfile, "id" | "created_at">>;
      };
      provider_profiles: {
        Row: ProviderProfile;
        Insert: Omit<ProviderProfile, "created_at" | "updated_at">;
        Update: Partial<Omit<ProviderProfile, "id" | "created_at">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Service, "id" | "created_at">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "booking_number" | "created_at" | "updated_at">;
        Update: Partial<Omit<Booking, "id" | "booking_number" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "payment_number" | "created_at" | "updated_at">;
        Update: Partial<Omit<Payment, "id" | "payment_number" | "created_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Review, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
    };
  };
}
