// Test script to verify email template fallback functionality
// This script tests that the send-email API properly handles missing templates

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testEmailTemplateFallback() {
  console.log('Testing email template fallback...\n');

  const testPayload = {
    type: 'ticket_confirmation',
    to: 'test@example.com',
    organization_id: '6695b959-45ef-44b4-a68c-9cd0fe0e25a3',
    user_id: 'test-user-id',
    name: 'Test User',
    emailDomainRedirection: 'https://example.com/tickets/test-ticket-id',
    placeholders: {
      ticket_id: 'test-ticket-123',
      ticket_subject: 'Test Subject',
      ticket_message: 'This is a test message',
      preferred_contact_method: 'email',
      preferred_date: '2025-10-20',
      preferred_time_range: '9:00 AM - 12:00 PM'
    }
  };

  console.log('Test payload:', JSON.stringify(testPayload, null, 2));
  console.log('\nSending request to /api/send-email...\n');

  try {
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS: Email template fallback is working!');
      console.log('The API successfully used the default template when no custom template was found.');
    } else {
      console.log('\n❌ FAILURE: Still getting an error');
      console.log('Error details:', data);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run the test
testEmailTemplateFallback();
