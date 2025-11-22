/**
 * Type definitions for ProductCreditEditModal
 * 
 * Defines interfaces for products, form data, tax codes, and filters
 * matching the database schema and business logic requirements.
 */

/**
 * Product interface matching the database schema
 * Represents a product with all its properties from the 'product' table
 */
export interface Product {
  id: string;
  product_name: string;
  product_description?: string;
  is_displayed: boolean;
  links_to_image?: string; // First image from array
  attrs?: Record<string, any>; // Custom JSON attributes
  product_tax_code?: string;
  stripe_product_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Form data for creating/updating products
 * Used for form state management and validation
 */
export interface ProductFormData {
  product_name: string;
  is_displayed: boolean;
  product_description: string;
  links_to_image: string;
  attributes: string; // JSON string (will be parsed to attrs)
  product_tax_code: string;
}

/**
 * Tax code interface from tax_codes.json
 * ~18,000 tax codes for Stripe integration
 */
export interface TaxCode {
  product_tax_code: string; // e.g., "txcd_10000000"
  description: string;
  tax_category: string;
}

/**
 * Filter state for product list
 * Controls search, filtering, and sorting
 */
export interface ProductFilters {
  searchQuery: string;
  activeTab: 'all' | 'active' | 'archived';
  sortBy: 'name' | 'created' | 'updated';
}

/**
 * Modal component props
 */
export interface ProductCreditEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Toast notification type
 */
export interface Toast {
  message: string;
  type: 'success' | 'error';
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Product list item props
 */
export interface ProductListItemProps {
  product: Product;
  onSelect: () => void;
  onDelete: () => void;
  searchQuery?: string;
}

/**
 * Product detail view props
 */
export interface ProductDetailViewProps {
  product: Product | null;
  formData: ProductFormData;
  isSubmitting: boolean;
  onFormDataChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

/**
 * Tab counts for filter bar
 */
export interface TabCounts {
  all: number;
  active: number;
  archived: number;
}

/**
 * Feature interface matching the database schema
 * Represents a feature from the 'feature' table
 */
export interface Feature {
  id: string;
  created_at: string;
  name: string | null;
  feature_image: string | null;
  content: string | null;
  slug: string | null;
  display_content: boolean | null;
  display_on_product_card: boolean | null;
  type: string | null;
  package: string | null;
  organization_id: string | null;
  order: number | null;
  is_help_center: boolean | null;
}

/**
 * Form data for creating/updating features
 */
export interface FeatureFormData {
  name: string;
  content: string;
  feature_image: string;
  slug: string;
  display_content: boolean;
  display_on_product_card: boolean;
  type: string;
  package: string;
  order: number;
  is_help_center: boolean;
}

/**
 * PricingPlan Feature Association interface
 * Represents the junction table between pricing plans and features
 */
export interface PricingPlanFeature {
  id: string;
  pricingplan_id: string;
  feature_id: string;
  created_at: string | null;
  description: string | null;
}

/**
 * Extended Feature with pricing plan assignment info
 */
export interface FeatureWithAssignment extends Feature {
  assigned_pricing_plans?: string[]; // Array of pricingplan_id's
  pricingplan_features?: PricingPlanFeature[];
}

