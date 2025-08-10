#!/usr/bin/env node

// Test script to verify cookie services API functionality
const https = require('https');
const http = require('http');

const TENANT_ID = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
const API_BASE = 'http://localhost:3000';

// Function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testCookieServicesAPI() {
  console.log('🧪 Testing Cookie Services API...');
  console.log('🏢 Tenant ID:', TENANT_ID);
  
  try {
    // Test getting organization data
    console.log('\n1. Testing GET organization data...');
    const getResponse = await makeRequest(`${API_BASE}/api/organizations/${TENANT_ID}`);
    console.log('Status:', getResponse.status);
    
    if (getResponse.status === 200) {
      console.log('✅ Successfully retrieved organization data');
      console.log('Cookie services count:', getResponse.data?.cookie_services?.length || 0);
      
      if (getResponse.data?.cookie_services?.length > 0) {
        console.log('Sample cookie service:', getResponse.data.cookie_services[0]);
      }
    } else {
      console.log('❌ Failed to retrieve organization data:', getResponse.data);
    }
    
    // Test creating a new cookie service
    console.log('\n2. Testing POST new cookie service...');
    const newService = {
      name: 'Test Cookie Service',
      description: 'Test description for cookie service',
      category_id: 1,
      active: true,
      processing_company: 'Test Company',
      organization_id: TENANT_ID,
      order: 1
    };
    
    const testData = {
      cookie_services: [newService]
    };
    
    const postResponse = await makeRequest(`${API_BASE}/api/organizations/${TENANT_ID}`, {
      method: 'PUT',
      body: testData,
      headers: {
        'Authorization': 'Bearer test-token' // You might need a real token
      }
    });
    
    console.log('Status:', postResponse.status);
    if (postResponse.status === 200) {
      console.log('✅ Successfully created cookie service');
    } else {
      console.log('❌ Failed to create cookie service:', postResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCookieServicesAPI();
