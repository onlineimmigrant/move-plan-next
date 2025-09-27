/**
 * Test script to verify activity logging is working for all organization operations
 * This is a quick verification that the activity logging has been added to all endpoints
 */

const fs = require('fs');
const path = require('path');

function checkFileForActivityLogging(filePath, expectedActivities) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n=== Checking ${path.basename(filePath)} ===`);
  console.log(`File path: ${filePath}`);
  
  // Check if logActivity is imported (more flexible check)
  const hasImport = content.includes('logActivity') && content.includes('import');
  const importLine = content.split('\n').find(line => line.includes('logActivity') && line.includes('import'));
  console.log(`Import line found: ${importLine || 'Not found'}`);
  console.log(`✓ Import logActivity: ${hasImport ? '✅' : '❌'}`);
  
  // Check for each expected activity
  expectedActivities.forEach(activity => {
    const hasActivity = content.includes(`action: '${activity}'`);
    console.log(`✓ ${activity} activity: ${hasActivity ? '✅' : '❌'}`);
  });
  
  // Count total logActivity calls
  const logActivityCalls = (content.match(/logActivity\(/g) || []).length;
  console.log(`✓ Total logActivity calls: ${logActivityCalls}`);
  
  return {
    hasImport,
    activities: expectedActivities.map(activity => ({
      activity,
      present: content.includes(`action: '${activity}'`)
    })),
    totalCalls: logActivityCalls
  };
}

// Check all organization API endpoints
const results = {};

// 1. Check create endpoint
results.create = checkFileForActivityLogging(
  './src/app/api/organizations/create/route.ts',
  ['created']
);

// 2. Check update endpoint  
results.update = checkFileForActivityLogging(
  './src/app/api/organizations/[id]/route.ts',
  ['updated']
);

// 3. Check deploy endpoint
results.deploy = checkFileForActivityLogging(
  './src/app/api/organizations/deploy/route.ts', 
  ['deployed']
);

// Summary
console.log('\n=== SUMMARY ===');
const allEndpoints = Object.keys(results);
const allGood = allEndpoints.every(endpoint => {
  const result = results[endpoint];
  return result.hasImport && result.activities.every(a => a.present);
});

console.log(`Overall Status: ${allGood ? '✅ ALL GOOD' : '❌ ISSUES FOUND'}`);

allEndpoints.forEach(endpoint => {
  const result = results[endpoint];
  const status = result.hasImport && result.activities.every(a => a.present) ? '✅' : '❌';
  console.log(`${endpoint}: ${status}`);
});

console.log('\n=== ACTIVITY LOGGER STATUS ===');
const activityLoggerExists = fs.existsSync('./src/lib/activityLogger.ts');
console.log(`Activity Logger exists: ${activityLoggerExists ? '✅' : '❌'}`);

if (activityLoggerExists) {
  const loggerContent = fs.readFileSync('./src/lib/activityLogger.ts', 'utf8');
  const hasLogActivity = loggerContent.includes('export async function logActivity');
  const hasGetOrgName = loggerContent.includes('export async function getOrganizationName');
  console.log(`logActivity function: ${hasLogActivity ? '✅' : '❌'}`);
  console.log(`getOrganizationName function: ${hasGetOrgName ? '✅' : '❌'}`);
}
