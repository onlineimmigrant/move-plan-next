// src/types/faq.ts


// src/types/faq.ts
export type FAQ = {
  id: number;
  question: string;
  answer: string;
  section?: string | null;
  display_order?: number | null;
  order?: number | null;
  product_sub_type_id?: number | null;
  organization_id: string | null;
  organisation_id?: string | null; // Support legacy field
  // Help Center fields
  is_help_center?: boolean;
  help_center_order?: number;
  [key: string]: any; // Allow additional fields
};