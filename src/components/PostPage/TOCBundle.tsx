/**
 * Combined TOC Components Bundle
 * Reduces Suspense boundaries from 3 to 1
 * Combines TOC, BottomSheetTOC, and MasterTOC into single chunk
 */

'use client';

import { lazy } from 'react';

// Export individual lazy-loaded components for backward compatibility
export const TOC = lazy(() => import('./TOC'));
export const BottomSheetTOC = lazy(() => import('./BottomSheetTOC').then(mod => ({ default: mod.BottomSheetTOC })));
export const MasterTOC = lazy(() => import('./MasterTOC'));
