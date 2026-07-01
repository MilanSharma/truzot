/**
 * Database seed script for test data
 * Run with: npx tsx tests/seed.ts
 * Requires local Supabase instance running (supabase start)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user credentials
const TEST_USERS = [
  {
    email: "test@example.com",
    password: "test123",
    name: "Test User",
  },
  {
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
  },
  {
    email: "paid@example.com",
    password: "paid123",
    name: "Paid User",
  },
];

async function createTestUser(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
    },
  });

  if (error) {
    console.error(`Failed to create user ${email}:`, error);
    return null;
  }

  return data.user;
}

async function seedDatabase() {
  console.log("Starting database seed...");

  // Clean up existing test data
  console.log("Cleaning up existing test data...");
  await supabase.from("headshots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("trainings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("waitlist").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("team_invites").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("download_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Create test users
  console.log("Creating test users...");
  const testUser = await createTestUser(TEST_USERS[0].email, TEST_USERS[0].password, TEST_USERS[0].name);
  const adminUser = await createTestUser(TEST_USERS[1].email, TEST_USERS[1].password, TEST_USERS[1].name);
  const paidUser = await createTestUser(TEST_USERS[2].email, TEST_USERS[2].password, TEST_USERS[2].name);

  if (!testUser || !adminUser || !paidUser) {
    throw new Error("Failed to create test users");
  }

  // Set admin role
  await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", adminUser.id);

  // Create test orders
  console.log("Creating test orders...");
  
  // Pending order
  const { data: pendingOrder } = await supabase
    .from("orders")
    .insert({
      id: "pending-order-123",
      user_id: testUser.id,
      email: testUser.email,
      plan: "basic",
      amount: 2900,
      status: "pending",
      storage_path: "test-uploads/pending",
      preferences: {
        shoot_name: "Test Shoot",
        selected_styles: ["auto"],
      },
    })
    .select()
    .single();

  // Paid/Training order
  const { data: trainingOrder } = await supabase
    .from("orders")
    .insert({
      id: "training-order-123",
      user_id: paidUser.id,
      email: paidUser.email,
      plan: "premium",
      amount: 4900,
      status: "training",
      stripe_payment_intent: "pi_test_training",
      storage_path: "test-uploads/training",
      preferences: {
        shoot_name: "Premium Shoot",
        selected_styles: ["auto"],
      },
    })
    .select()
    .single();

  // Generating order
  const { data: generatingOrder } = await supabase
    .from("orders")
    .insert({
      id: "generating-order-123",
      user_id: paidUser.id,
      email: paidUser.email,
      plan: "basic",
      amount: 2900,
      status: "generating",
      stripe_payment_intent: "pi_test_generating",
      storage_path: "test-uploads/generating",
      preferences: {
        shoot_name: "Generating Shoot",
        selected_styles: ["auto"],
      },
    })
    .select()
    .single();

  // Completed order
  const { data: completedOrder } = await supabase
    .from("orders")
    .insert({
      id: "completed-order-123",
      user_id: paidUser.id,
      email: paidUser.email,
      plan: "premium",
      amount: 4900,
      status: "completed",
      stripe_payment_intent: "pi_test_completed",
      storage_path: "test-uploads/completed",
      preferences: {
        shoot_name: "Completed Shoot",
        selected_styles: ["auto"],
      },
    })
    .select()
    .single();

  // Failed order
  const { data: failedOrder } = await supabase
    .from("orders")
    .insert({
      id: "failed-order-123",
      user_id: testUser.id,
      email: testUser.email,
      plan: "basic",
      amount: 2900,
      status: "failed",
      stripe_payment_intent: "pi_test_failed",
      storage_path: "test-uploads/failed",
      preferences: {
        shoot_name: "Failed Shoot",
        selected_styles: ["auto"],
      },
    })
    .select()
    .single();

  // Refunded order
  const { data: refundedOrder } = await supabase
    .from("orders")
    .insert({
      id: "refunded-order-123",
      user_id: testUser.id,
      email: testUser.email,
      plan: "basic",
      amount: 2900,
      status: "refunded",
      stripe_payment_intent: "pi_test_refunded",
      storage_path: "test-uploads/refunded",
      preferences: {
        shoot_name: "Refunded Shoot",
        selected_styles: ["auto"],
      },
    })
    .select()
    .single();

  // Create test trainings
  console.log("Creating test trainings...");
  if (trainingOrder) {
    await supabase.from("trainings").insert({
      order_id: trainingOrder.id,
      status: "processing",
      fal_request_id: "fal-training-123",
    });
  }

  if (generatingOrder) {
    await supabase.from("trainings").insert({
      order_id: generatingOrder.id,
      status: "completed",
      fal_request_id: "fal-training-456",
      model_id: "test-model-id",
    });
  }

  // Create test headshots
  console.log("Creating test headshots...");
  if (completedOrder) {
    for (let i = 0; i < 10; i++) {
      await supabase.from("headshots").insert({
        order_id: completedOrder.id,
        url: `https://example.com/headshot-${i}.jpg`,
        seed: 1000 + i,
        style: "auto",
        is_favorite: i < 3,
      });
    }
  }

  // Create waitlist entry
  console.log("Creating waitlist entry...");
  await supabase.from("waitlist").insert({
    email: "waitlist@example.com",
    discount_code: "TRUZOT-TEST123",
    used: false,
  });

  // Create team invite
  console.log("Creating team invite...");
  await supabase.from("team_invites").insert({
    team_id: testUser.id,
    email: "teammate@example.com",
    status: "pending",
  });

  // Create download token
  console.log("Creating download token...");
  if (completedOrder) {
    await supabase.from("download_tokens").insert({
      id: "test-download-token-123",
      user_id: paidUser.id,
      order_id: completedOrder.id,
      used: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  console.log("Database seed completed successfully!");
  console.log("\nTest Users:");
  console.log(`  Regular: ${TEST_USERS[0].email} / ${TEST_USERS[0].password}`);
  console.log(`  Admin: ${TEST_USERS[1].email} / ${TEST_USERS[1].password}`);
  console.log(`  Paid: ${TEST_USERS[2].email} / ${TEST_USERS[2].password}`);
}

seedDatabase().catch(console.error);
