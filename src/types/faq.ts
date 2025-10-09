// src/types/faq.ts


// src/types/faq.ts
export type FAQ = {
  id: number;
  question: string;
  answer: string;
  section?: string | null;
  display_order?: boolean | null; // Boolean field!
  order?: number | null;
  product_sub_type_id?: number | null;
  organization_id: string | null;
  organisation_id?: string | null; // Support legacy field
  display_home_page?: boolean;
  // Help Center fields
  is_help_center?: boolean;
  help_center_order?: number | null;
  [key: string]: any; // Allow additional fields
};