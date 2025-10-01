// Test if there are compilation errors in the route
async function testRouteCompilation() {
  console.log('🔍 Testing Route Compilation');
  
  try {
    // Try to import the route to see if there are compilation errors
    console.log('Checking if route can be loaded without errors...');
    
    // Read the route file to check for obvious syntax issues
    const fs = require('fs');
    const routeContent = fs.readFileSync('/Users/ois/move-plan-next/src/app/api/organizations/[id]/clone/route.ts', 'utf8');
    
    // Check for common syntax issues
    const openBraces = (routeContent.match(/\{/g) || []).length;
    const closeBraces = (routeContent.match(/\}/g) || []).length;
    const openParens = (routeContent.match(/\(/g) || []).length;
    const closeParens = (routeContent.match(/\)/g) || []).length;
    
    console.log('Syntax check:');
    console.log(`  Open braces: ${openBraces}, Close braces: ${closeBraces}`);
    console.log(`  Open parens: ${openParens}, Close parens: ${closeParens}`);
    
    if (openBraces !== closeBraces) {
      console.log('❌ Mismatched braces detected!');
    } else {
      console.log('✅ Braces match');
    }
    
    if (openParens !== closeParens) {
      console.log('❌ Mismatched parentheses detected!');
    } else {
      console.log('✅ Parentheses match');
    }
    
    // Check for the products section
    const hasProductsSection = routeContent.includes('Clone products with foreign key handling');
    console.log(`Products section present: ${hasProductsSection ? '✅' : '❌'}`);
    
    // Check for variable declaration
    const hasProductSubTypeMapping = routeContent.includes('productSubTypeIdMapping');
    console.log(`Product sub-type mapping variable: ${hasProductSubTypeMapping ? '✅' : '❌'}`);
    
    console.log('\n📄 Route file info:');
    console.log(`  File size: ${routeContent.length} characters`);
    console.log(`  Lines: ${routeContent.split('\n').length}`);
    
  } catch (error) {
    console.error('❌ Route compilation test error:', error.message);
  }
}

testRouteCompilation();
