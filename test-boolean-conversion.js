// Test boolean conversion function
function convertToBoolean(value) {
  console.log('🔍 convertToBoolean called with:');
  console.log('  - value:', JSON.stringify(value));
  console.log('  - type:', typeof value);
  console.log('  - constructor:', value?.constructor?.name);
  console.log('  - toString():', String(value));
  
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    console.log('✅ convertToBoolean returning false for null/undefined/empty');
    return false;
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    console.log('✅ convertToBoolean returning boolean:', value);
    return value;
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    const result = value > 0;
    console.log('✅ convertToBoolean returning for number:', result, 'from', value);
    return result;
  }
  
  // Handle strings
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    console.log('🔍 convertToBoolean processing string:', lowerValue);
    
    // Handle explicit boolean strings
    if (lowerValue === 'true') {
      console.log('✅ convertToBoolean returning true for "true"');
      return true;
    }
    if (lowerValue === 'false') {
      console.log('✅ convertToBoolean returning false for "false"');
      return false;
    }
    
    // Handle numeric strings (including "2")
    if (!isNaN(Number(lowerValue))) {
      const numValue = Number(lowerValue);
      const result = numValue > 0;
      console.log('✅ convertToBoolean returning for numeric string:', result, 'from numeric value:', numValue, 'original string:', lowerValue);
      return result;
    }
    
    // Handle any other string cases
    console.log('⚠️ convertToBoolean processing non-numeric string:', lowerValue);
  }
  
  // Handle objects or arrays (just in case)
  if (typeof value === 'object') {
    console.log('⚠️ convertToBoolean received object:', JSON.stringify(value));
    return false;
  }
  
  // Default fallback
  console.log('⚠️ convertToBoolean returning false as fallback for:', typeof value, value);
  return false;
}

// Test cases that could cause the "2" error
console.log('\n=== Testing problematic "2" value ===');
const result1 = convertToBoolean("2");
console.log('Final result for "2":', result1);

console.log('\n=== Testing other values ===');
const testCases = [
  true,
  false,
  "true",
  "false",
  "1",
  "0",
  1,
  0,
  2,
  "",
  null,
  undefined,
  "invalid"
];

testCases.forEach(testCase => {
  console.log(`\nTesting: ${JSON.stringify(testCase)}`);
  const result = convertToBoolean(testCase);
  console.log(`Result: ${result}\n`);
});
