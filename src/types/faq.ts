// src/types/faq.ts
export type FAQ = {
  id: number;
  question: string;
  answer: string;
  section?: string;
  display_order?: number;
  order?: number;
  product_sub_type_id?: number;
  organization_id: string; // Required
  [key: string]: any;
};