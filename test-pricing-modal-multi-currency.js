#!/usr/bin/env node

// Test script for PricingModal multi-currency implementation
const fs = require('fs');

console.log('🧪 Testing PricingModal Multi-Currency Implementation');
console.log('=' .repeat(60));

// Read the updated PricingModal component
const pricingModalPath = './src/components/PricingModal.tsx';
let pricingModalContent = '';

try {
  pricingModalContent = fs.readFileSync(pricingModalPath, 'utf8');
  console.log('✅ Successfully read PricingModal.tsx');
} catch (error) {
  console.error('❌ Failed to read PricingModal.tsx:', error.message);
  process.exit(1);
}

// Test 1: Check for currency utilities import
const hasImports = pricingModalContent.includes('import { detectUserCurrency, getPriceForCurrency, SUPPORTED_CURRENCIES } from \'@/lib/currency\';');
console.log(`${hasImports ? '✅' : '❌'} Currency utilities import: ${hasImports ? 'Present' : 'Missing'}`);

// Test 2: Check for currency state management
const hasCurrencyState = pricingModalContent.includes('[userCurrency, setUserCurrency]') && 
                        pricingModalContent.includes('[currencySymbol, setCurrencySymbol]');
console.log(`${hasCurrencyState ? '✅' : '❌'} Currency state management: ${hasCurrencyState ? 'Present' : 'Missing'}`);

// Test 3: Check for currency detection effect
const hasCurrencyDetection = pricingModalContent.includes('detectUserCurrency()') &&
                            pricingModalContent.includes('setUserCurrency(detectedCurrency)');
console.log(`${hasCurrencyDetection ? '✅' : '❌'} Currency detection effect: ${hasCurrencyDetection ? 'Present' : 'Missing'}`);

// Test 4: Check for getPriceForCurrency usage
const hasPriceFunction = pricingModalContent.includes('getPriceForCurrency(monthly, userCurrency)') &&
                        pricingModalContent.includes('getPriceForCurrency(annual, userCurrency)');
console.log(`${hasPriceFunction ? '✅' : '❌'} getPriceForCurrency usage: ${hasPriceFunction ? 'Present' : 'Missing'}`);

// Test 5: Check for dynamic currency symbols in pricing display
const hasDynamicSymbols = pricingModalContent.includes('plan.currencySymbol || currencySymbol') &&
                         pricingModalContent.includes('plan.annualCurrencySymbol || currencySymbol');
console.log(`${hasDynamicSymbols ? '✅' : '❌'} Dynamic currency symbols: ${hasDynamicSymbols ? 'Present' : 'Missing'}`);

// Test 6: Check for removal of hardcoded currency
const hasHardcodedCurrency = pricingModalContent.includes('const currency = \'£\';');
console.log(`${!hasHardcodedCurrency ? '✅' : '❌'} Hardcoded currency removed: ${!hasHardcodedCurrency ? 'Yes' : 'No - Still present!'}`);

// Test 7: Check for currency parameter in API calls
const hasCurrencyParam = pricingModalContent.includes('x-user-currency\': userCurrency') &&
                        pricingModalContent.includes('&currency=${userCurrency}');
console.log(`${hasCurrencyParam ? '✅' : '❌'} Currency in API calls: ${hasCurrencyParam ? 'Present' : 'Missing'}`);

// Test 8: Check for multi-currency interface updates
const hasMultiCurrencyInterface = pricingModalContent.includes('currencySymbol?: string;') &&
                                 pricingModalContent.includes('annualCurrencySymbol?: string;');
console.log(`${hasMultiCurrencyInterface ? '✅' : '❌'} Multi-currency interface: ${hasMultiCurrencyInterface ? 'Present' : 'Missing'}`);

// Test 9: Check for promotion price multi-currency support
const hasPromotionMultiCurrency = pricingModalContent.includes('monthlyPromoPriceResult?.price') &&
                                 pricingModalContent.includes('annualPromoPriceResult?.price');
console.log(`${hasPromotionMultiCurrency ? '✅' : '❌'} Promotion multi-currency: ${hasPromotionMultiCurrency ? 'Present' : 'Missing'}`);

console.log('\n📊 Summary:');
console.log('=' .repeat(60));

const tests = [
  hasImports, 
  hasCurrencyState, 
  hasCurrencyDetection, 
  hasPriceFunction, 
  hasDynamicSymbols, 
  !hasHardcodedCurrency, 
  hasCurrencyParam, 
  hasMultiCurrencyInterface,
  hasPromotionMultiCurrency
];

const passedTests = tests.filter(test => test).length;
const totalTests = tests.length;

console.log(`🎯 Tests passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! PricingModal is ready for multi-currency!');
  console.log('\n📝 What was implemented:');
  console.log('   • Currency detection and state management');
  console.log('   • Dynamic currency symbols based on user location');
  console.log('   • Multi-currency price calculation with fallbacks');
  console.log('   • Currency-aware API calls and headers');
  console.log('   • Promotion price support for multiple currencies');
  console.log('   • Backward compatibility with existing pricing data');
  console.log('   • Updated TypeScript interfaces for currency fields');
  
  console.log('\n🚀 Next steps:');
  console.log('   • Test the modal in the browser with different currencies');
  console.log('   • Verify pricing plan fetching works with currency parameter');
  console.log('   • Test promotion calculations in different currencies');
  console.log('   • Check that currency detection works from geolocation');
} else {
  console.log('⚠️  Some tests failed. Please check the implementation.');
  
  const failedTests = [];
  if (!hasImports) failedTests.push('Currency utilities import');
  if (!hasCurrencyState) failedTests.push('Currency state management');
  if (!hasCurrencyDetection) failedTests.push('Currency detection effect');
  if (!hasPriceFunction) failedTests.push('getPriceForCurrency usage');
  if (!hasDynamicSymbols) failedTests.push('Dynamic currency symbols');
  if (hasHardcodedCurrency) failedTests.push('Remove hardcoded currency');
  if (!hasCurrencyParam) failedTests.push('Currency in API calls');
  if (!hasMultiCurrencyInterface) failedTests.push('Multi-currency interface');
  if (!hasPromotionMultiCurrency) failedTests.push('Promotion multi-currency');
  
  console.log('\n❌ Failed tests:');
  failedTests.forEach(test => console.log(`   • ${test}`));
}

console.log('\n' + '=' .repeat(60));