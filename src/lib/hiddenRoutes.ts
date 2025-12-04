// lib/hiddenRoutes.ts
export const hideNavbarFooterPrefixes = [
  '/account/tickets',
  '/account/profile/purchases',
  '/account/profile/payments',
  '/account/edupro/', 
  '/account/profile',
  '/account',
  '/help-center', 
  '/admin', 
  '/login', 
  '/signup', 
  '/register',  
  '/reset-password',
  '/basket',
  '/checkout'
];

// Pages where we hide ONLY footer (keep navbar visible)
export const hideFooterOnlyPrefixes: string[] = [];