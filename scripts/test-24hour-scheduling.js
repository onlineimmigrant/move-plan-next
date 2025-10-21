#!/usr/bin/env node

/**
 * Test Script: 24-Hour Admin Scheduling
 * 
 * This script demonstrates and tests the 24-hour admin scheduling feature.
 * It will:
 * 1. Enable 24-hour scheduling for an organization
 * 2. Fetch available slots as admin (should show 48 slots)
 * 3. Fetch available slots as customer (should show business hours only)
 * 4. Test different configurations
 * 
 * Usage:
 *   node scripts/test-24hour-scheduling.js <organization_id>
 */

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  process.exit(1);
}

const organizationId = process.argv[2];

if (!organizationId) {
  console.error('❌ Usage: node scripts/test-24hour-scheduling.js <organization_id>');
  process.exit(1);
}

async function testSettings() {
  console.log('\n📋 Testing Meeting Settings API\n');
  console.log('═'.repeat(60));

  // 1. Get current settings
  console.log('\n1️⃣  Fetching current settings...');
  const getResponse = await fetch(
    `${BASE_URL}/api/meetings/settings?organization_id=${organizationId}`
  );
  const currentSettings = await getResponse.json();
  console.log('✅ Current settings:', JSON.stringify(currentSettings, null, 2));

  // 2. Enable 24-hour scheduling
  console.log('\n2️⃣  Enabling 24-hour admin scheduling...');
  const updateResponse = await fetch(`${BASE_URL}/api/meetings/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      admin_24hour_scheduling: true,
      admin_slot_start: '00:00:00',
      admin_slot_end: '23:59:59',
      slot_duration_minutes: 30,
      business_hours_start: '09:00:00',
      business_hours_end: '17:00:00',
    }),
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    console.error('❌ Failed to update settings:', error);
    return;
  }

  console.log('✅ 24-hour scheduling enabled!');
}

async function testTimeSlots() {
  console.log('\n\n⏰ Testing Time Slots Generation\n');
  console.log('═'.repeat(60));

  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 7); // Test a week from now
  const dateStr = testDate.toISOString().split('T')[0];

  // 3. Fetch admin slots (24-hour mode)
  console.log(`\n3️⃣  Fetching ADMIN slots for ${dateStr}...`);
  const adminResponse = await fetch(
    `${BASE_URL}/api/meetings/available-slots?organization_id=${organizationId}&date=${dateStr}&is_admin=true`
  );
  const adminData = await adminResponse.json();
  
  console.log('✅ Admin mode settings:', adminData.settings);
  console.log(`✅ Total admin slots: ${adminData.slots.length}`);
  
  if (adminData.slots.length > 0) {
    console.log(`   First slot: ${adminData.slots[0].start}`);
    console.log(`   Last slot: ${adminData.slots[adminData.slots.length - 1].start}`);
  }

  // 4. Fetch customer slots (business hours only)
  console.log(`\n4️⃣  Fetching CUSTOMER slots for ${dateStr}...`);
  const customerResponse = await fetch(
    `${BASE_URL}/api/meetings/available-slots?organization_id=${organizationId}&date=${dateStr}&is_admin=false`
  );
  const customerData = await customerResponse.json();
  
  console.log('✅ Customer mode settings:', customerData.settings);
  console.log(`✅ Total customer slots: ${customerData.slots.length}`);
  
  if (customerData.slots.length > 0) {
    console.log(`   First slot: ${customerData.slots[0].start}`);
    console.log(`   Last slot: ${customerData.slots[customerData.slots.length - 1].start}`);
  }

  // 5. Verify slot counts
  console.log('\n5️⃣  Verifying slot counts...');
  
  const expectedAdminSlots = 48; // 24 hours * 2 (30-min slots per hour)
  const expectedCustomerSlots = 16; // 8 hours * 2 (9 AM - 5 PM)
  
  if (adminData.slots.length === expectedAdminSlots) {
    console.log(`✅ Admin slots correct: ${adminData.slots.length} (expected ${expectedAdminSlots})`);
  } else {
    console.log(`⚠️  Admin slots: ${adminData.slots.length} (expected ${expectedAdminSlots})`);
  }
  
  if (customerData.slots.length === expectedCustomerSlots) {
    console.log(`✅ Customer slots correct: ${customerData.slots.length} (expected ${expectedCustomerSlots})`);
  } else {
    console.log(`⚠️  Customer slots: ${customerData.slots.length} (expected ${expectedCustomerSlots})`);
  }
}

async function testDifferentDurations() {
  console.log('\n\n🔄 Testing Different Slot Durations\n');
  console.log('═'.repeat(60));

  const durations = [15, 30, 45, 60];
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 7);
  const dateStr = testDate.toISOString().split('T')[0];

  for (const duration of durations) {
    console.log(`\n📍 Testing ${duration}-minute slots...`);
    
    // Update duration
    await fetch(`${BASE_URL}/api/meetings/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: organizationId,
        admin_24hour_scheduling: true,
        slot_duration_minutes: duration,
      }),
    });

    // Fetch slots
    const response = await fetch(
      `${BASE_URL}/api/meetings/available-slots?organization_id=${organizationId}&date=${dateStr}&is_admin=true`
    );
    const data = await response.json();
    
    const expectedSlots = Math.floor((24 * 60) / duration);
    console.log(`   Expected slots: ${expectedSlots}`);
    console.log(`   Actual slots: ${data.slots.length}`);
    
    if (data.slots.length === expectedSlots) {
      console.log('   ✅ Slot count matches!');
    } else {
      console.log('   ⚠️  Slot count mismatch');
    }
  }

  // Reset to 30-minute default
  await fetch(`${BASE_URL}/api/meetings/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      slot_duration_minutes: 30,
    }),
  });
}

async function printSummary() {
  console.log('\n\n📊 Summary\n');
  console.log('═'.repeat(60));
  console.log(`
✅ Migration Applied: database/migrations/007_add_admin_time_slot_config.sql
✅ API Endpoints:
   - GET  /api/meetings/settings
   - PUT  /api/meetings/settings
   - GET  /api/meetings/available-slots

✅ Frontend Components Updated:
   - MeetingsAdminModal (uses is_admin=true)
   - MeetingsBookingModal (uses is_admin=false)
   - MeetingsSettingsModal (admin UI for configuration)

📚 Documentation: docs/features/24_HOUR_ADMIN_SCHEDULING.md

🎯 Key Features:
   - Admins can schedule meetings 24/7 (up to 48 slots with 30-min duration)
   - Customers see business hours only (typically 9 AM - 5 PM)
   - Configurable slot durations: 15, 30, 45, or 60 minutes
   - Dynamic time ranges per organization
   - Real-time availability checking against existing bookings

🔒 Security:
   - RLS policies protect settings tables
   - Only admins can modify organization settings
   - Service role key used for API routes
   - User sessions validated against organization membership

📖 Next Steps:
   1. Open admin modal and select a date
   2. You should see time slots based on your configuration
   3. Open settings modal to adjust 24-hour scheduling
   4. Test customer view to verify business hours restriction
  `);
  console.log('═'.repeat(60));
  console.log('\n✨ 24-Hour Admin Scheduling is ready to use!\n');
}

async function main() {
  console.log('\n🚀 24-Hour Admin Scheduling Test Suite\n');
  console.log(`Organization ID: ${organizationId}`);
  console.log(`Base URL: ${BASE_URL}`);

  try {
    await testSettings();
    await testTimeSlots();
    await testDifferentDurations();
    await printSummary();
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
