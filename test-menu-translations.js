// Test script to verify menu translation functionality
const { getTranslatedMenuContent } = require('./src/utils/menuTranslations.ts');

// Test cases
console.log('=== Menu Translation Tests ===\n');

// Test 1: Basic translation functionality
const testTranslations = {
  en: 'Home',
  es: 'Inicio',
  fr: 'Accueil',
  de: 'Startseite'
};

console.log('Test 1: Basic translation');
console.log('English:', getTranslatedMenuContent('Home', testTranslations, 'en'));
console.log('Spanish:', getTranslatedMenuContent('Home', testTranslations, 'es'));
console.log('French:', getTranslatedMenuContent('Home', testTranslations, 'fr'));
console.log('German:', getTranslatedMenuContent('Home', testTranslations, 'de'));
console.log('');

// Test 2: Fallback to default when translation not available
console.log('Test 2: Fallback to default');
console.log('Italian (not available):', getTranslatedMenuContent('Home', testTranslations, 'it'));
console.log('Null locale:', getTranslatedMenuContent('Home', testTranslations, null));
console.log('');

// Test 3: Empty or missing translations object
console.log('Test 3: Missing translations');
console.log('Null translations:', getTranslatedMenuContent('Home', null, 'es'));
console.log('Undefined translations:', getTranslatedMenuContent('Home', undefined, 'es'));
console.log('Empty translations:', getTranslatedMenuContent('Home', {}, 'es'));
console.log('');

// Test 4: Empty translation values
const emptyTranslations = {
  en: 'Home',
  es: '',
  fr: '   ',
  de: 'Startseite'
};

console.log('Test 4: Empty translation values');
console.log('Empty string Spanish:', getTranslatedMenuContent('Home', emptyTranslations, 'es'));
console.log('Whitespace French:', getTranslatedMenuContent('Home', emptyTranslations, 'fr'));
console.log('Valid German:', getTranslatedMenuContent('Home', emptyTranslations, 'de'));
