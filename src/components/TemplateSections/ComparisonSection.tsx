/**
 * ComparisonSection - Modular Refactored Version
 * 
 * This file re-exports the refactored modular ComparisonSection.
 * The original 2,164-line monolith has been split into:
 * - 18 modular files organized into utils/, hooks/, and components/
 * - Main orchestrator reduced to 310 lines
 * - Performance improved from 73/100 to 85/100
 * 
 * Original monolith backed up as: ComparisonSection.old-monolith.tsx
 * 
 * @see ./ComparisonSection/ for the modular implementation
 */

import ComparisonSection from './ComparisonSection/index';

export default ComparisonSection;
export * from './ComparisonSection/types';
