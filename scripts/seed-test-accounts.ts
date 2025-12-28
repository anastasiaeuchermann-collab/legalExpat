/**
 * Seed Test Accounts
 *
 * This script creates test accounts for both expat and provider user types.
 * Run with: npm run seed-test
 */

import { supabaseAdmin } from "../lib/supabase/admin";
import bcrypt from "bcryptjs";

const TEST_ACCOUNTS = {
  expat: {
    email: "expat@test.com",
    password: "Test1234!",
    name: "John Expat",
    role: "expat",
    profile: {
      nationality: "American",
      country_of_origin: "United States",
      residence_status: "blue_card",
      location: "Berlin, Germany",
      city: "Berlin",
      phone_number: "+49 123 456 7890",
      preferred_languages: ["English", "German"],
      years_in_germany: "2-5",
    },
  },
  provider: {
    email: "provider@test.com",
    password: "Test1234!",
    name: "Dr. Anna Schmidt",
    role: "provider",
    profile: {
      professional_title: "Rechtsanwältin",
      law_firm_name: "Schmidt Legal Services",
      bar_association_number: "RAK-2024-001",
      years_of_experience: "5-10",
      phone_number: "+49 30 123 456 789",
      specializations: ["immigration_visa", "employment_law", "tax_law"],
      languages: [
        { language: "German", proficiency: "native" },
        { language: "English", proficiency: "fluent" },
      ],
      accepting_new_clients: true,
      response_time: "24h",
      hourly_rate: 150,
      initial_consultation_fee: 100,
      pricing_notes: "First 30-minute consultation is free for new clients.",
      verification_status: "verified", // Pre-verified for testing
    },
  },
};

async function seedTestAccounts() {
  console.log("🌱 Starting test account seeding...\n");

  try {
    // 1. Create Expat Test Account
    console.log("Creating expat test account...");
    const expatPasswordHash = await bcrypt.hash(
      TEST_ACCOUNTS.expat.password,
      10
    );

    // Check if expat already exists
    const { data: rawExistingExpat } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", TEST_ACCOUNTS.expat.email)
      .single();

    const existingExpat = rawExistingExpat as { id: string } | null;

    let expatUserId: string;

    if (existingExpat) {
      console.log("  ⚠️  Expat account already exists, updating...");
      expatUserId = existingExpat.id;

      await supabaseAdmin
        .from("users")
        // @ts-ignore - Supabase type inference issue
        .update({
          name: TEST_ACCOUNTS.expat.name,
          password_hash: expatPasswordHash,
          email_verified: true,
          is_active: true,
          verification_token: null,
          verification_token_expires: null,
        })
        .eq("id", expatUserId);
    } else {
      const { data: newExpat, error: expatError } = await supabaseAdmin
        .from("users")
        // @ts-ignore - Supabase type inference issue
        .insert({
          email: TEST_ACCOUNTS.expat.email,
          name: TEST_ACCOUNTS.expat.name,
          password_hash: expatPasswordHash,
          role: TEST_ACCOUNTS.expat.role,
          email_verified: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (expatError) {
        throw new Error(`Failed to create expat user: ${expatError.message}`);
      }

      expatUserId = (newExpat as { id: string }).id;
      console.log("  ✓ Expat user created");
    }

    // Create/Update expat profile
    const { data: existingExpatProfile } = await supabaseAdmin
      .from("expat_profiles")
      .select("id")
      .eq("id", expatUserId)
      .single();

    if (existingExpatProfile) {
      await supabaseAdmin
        .from("expat_profiles")
        // @ts-ignore - Supabase type inference issue
        .update({
          ...TEST_ACCOUNTS.expat.profile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", expatUserId);
      console.log("  ✓ Expat profile updated");
    } else {
      await supabaseAdmin
        .from("expat_profiles")
        // @ts-ignore - Supabase type inference issue
        .insert({
          id: expatUserId,
          ...TEST_ACCOUNTS.expat.profile,
        });
      console.log("  ✓ Expat profile created");
    }

    console.log(
      `  ✅ Expat account ready: ${TEST_ACCOUNTS.expat.email} / ${TEST_ACCOUNTS.expat.password}\n`
    );

    // 2. Create Provider Test Account
    console.log("Creating provider test account...");
    const providerPasswordHash = await bcrypt.hash(
      TEST_ACCOUNTS.provider.password,
      10
    );

    // Check if provider already exists
    const { data: rawExistingProvider } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", TEST_ACCOUNTS.provider.email)
      .single();

    const existingProvider = rawExistingProvider as { id: string } | null;

    let providerUserId: string;

    if (existingProvider) {
      console.log("  ⚠️  Provider account already exists, updating...");
      providerUserId = existingProvider.id;

      await supabaseAdmin
        .from("users")
        // @ts-ignore - Supabase type inference issue
        .update({
          name: TEST_ACCOUNTS.provider.name,
          password_hash: providerPasswordHash,
          email_verified: true,
          is_active: true,
          verification_token: null,
          verification_token_expires: null,
        })
        .eq("id", providerUserId);
    } else {
      const { data: newProvider, error: providerError } = await supabaseAdmin
        .from("users")
        // @ts-ignore - Supabase type inference issue
        .insert({
          email: TEST_ACCOUNTS.provider.email,
          name: TEST_ACCOUNTS.provider.name,
          password_hash: providerPasswordHash,
          role: TEST_ACCOUNTS.provider.role,
          email_verified: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (providerError) {
        throw new Error(
          `Failed to create provider user: ${providerError.message}`
        );
      }

      providerUserId = (newProvider as { id: string }).id;
      console.log("  ✓ Provider user created");
    }

    // Create/Update provider profile
    const { data: existingProviderProfile } = await supabaseAdmin
      .from("provider_profiles")
      .select("id")
      .eq("id", providerUserId)
      .single();

    if (existingProviderProfile) {
      await supabaseAdmin
        .from("provider_profiles")
        // @ts-ignore - Supabase type inference issue
        .update({
          ...TEST_ACCOUNTS.provider.profile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", providerUserId);
      console.log("  ✓ Provider profile updated");
    } else {
      await supabaseAdmin
        .from("provider_profiles")
        // @ts-ignore - Supabase type inference issue
        .insert({
          id: providerUserId,
          business_name: TEST_ACCOUNTS.provider.profile.law_firm_name,
          description: `Experienced ${TEST_ACCOUNTS.provider.profile.professional_title} specializing in immigration and employment law.`,
          ...TEST_ACCOUNTS.provider.profile,
          location: "Berlin, Germany",
          city: "Berlin",
          education: "Law Degree from Humboldt University",
          accepts_online_meetings: true,
          accepts_in_person_meetings: true,
        });
      console.log("  ✓ Provider profile created");
    }

    console.log(
      `  ✅ Provider account ready: ${TEST_ACCOUNTS.provider.email} / ${TEST_ACCOUNTS.provider.password}\n`
    );

    console.log("🎉 Test account seeding completed!\n");
    console.log("=" .repeat(60));
    console.log("TEST CREDENTIALS:");
    console.log("=" .repeat(60));
    console.log("\n📧 Expat Account:");
    console.log(`   Email: ${TEST_ACCOUNTS.expat.email}`);
    console.log(`   Password: ${TEST_ACCOUNTS.expat.password}`);
    console.log(`   Status: Email verified, Active\n`);
    console.log("📧 Provider Account:");
    console.log(`   Email: ${TEST_ACCOUNTS.provider.email}`);
    console.log(`   Password: ${TEST_ACCOUNTS.provider.password}`);
    console.log(`   Status: Email verified, Active, Verified\n`);
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("❌ Error seeding test accounts:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding function
seedTestAccounts();
