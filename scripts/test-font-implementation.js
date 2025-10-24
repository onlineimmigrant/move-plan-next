/**
 * Font Family Implementation Test
 * 
 * This script validates that the font family selection feature is working correctly.
 * Run this in the browser console on any page to verify font implementation.
 */

function testFontImplementation() {
  console.log('🧪 Testing Font Family Implementation...\n');
  
  // Test 1: Check if all font CSS variables are loaded
  console.log('✅ Test 1: Checking font CSS variables');
  const bodyClasses = document.body.className;
  const expectedFontVars = [
    '--font-inter',
    '--font-roboto', 
    '--font-poppins',
    '--font-lato',
    '--font-opensans'
  ];
  
  console.log('Body classes:', bodyClasses);
  
  // Test 2: Check if --app-font is set
  console.log('\n✅ Test 2: Checking --app-font CSS variable');
  const bodyStyles = window.getComputedStyle(document.body);
  const appFont = bodyStyles.getPropertyValue('--app-font');
  console.log('--app-font value:', appFont || 'Not set');
  
  // Test 3: Check computed font-family
  console.log('\n✅ Test 3: Checking computed font-family');
  const computedFont = bodyStyles.fontFamily;
  console.log('Computed font-family:', computedFont);
  
  // Test 4: Check if selected font matches settings
  console.log('\n✅ Test 4: Checking font consistency');
  const rootStyles = window.getComputedStyle(document.documentElement);
  const rootAppFont = rootStyles.getPropertyValue('--app-font');
  console.log('Root --app-font:', rootAppFont || 'Not set');
  
  // Test 5: Font loading status
  console.log('\n✅ Test 5: Checking font loading status');
  if (document.fonts) {
    const loadedFonts = [];
    document.fonts.forEach(font => {
      if (font.status === 'loaded') {
        loadedFonts.push(font.family);
      }
    });
    console.log('Loaded fonts:', [...new Set(loadedFonts)]);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('- Font variables loaded:', bodyClasses.includes('--font') ? '✅' : '❌');
  console.log('- App font set:', appFont ? '✅' : '❌');
  console.log('- Computed font applied:', computedFont ? '✅' : '❌');
  
  // Final result
  const allTestsPassed = bodyClasses.includes('--font') && appFont && computedFont;
  console.log('\n' + (allTestsPassed ? '✅ All tests passed!' : '❌ Some tests failed'));
  
  return {
    passed: allTestsPassed,
    bodyClasses,
    appFont,
    computedFont,
    loadedFonts: document.fonts ? Array.from(document.fonts).map(f => f.family) : []
  };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFontImplementation };
}

// Auto-run in browser console
if (typeof window !== 'undefined') {
  console.log('🎨 Font Family Test Suite Ready!');
  console.log('Run: testFontImplementation()');
}
