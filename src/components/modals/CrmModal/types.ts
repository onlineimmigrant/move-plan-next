/**
 * CRM Modal Types
 *
 * Defines types for the CRM modal system
 */

export type CrmTab = 'accounts' | 'customers' | 'leads' | 'team-members' | 'reviews' | 'testimonials';

export interface CrmModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CrmTab;
  organizationId?: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  organization_id: string;
  role?: string | null;
  user_status?: string | null;
  is_student?: boolean;
  is_site_creator?: boolean;
  is_service_provider?: boolean;
  service_title?: string | null;
  hourly_rate?: number | null;
  is_available_for_booking?: boolean;
  team?: TeamProfile;
  customer?: CustomerProfile;
}

export interface TeamProfile {
  is_team_member: boolean;
  image: string;
  job_title: string;
  pseudonym: string;
  department: string;
  description: string;
  bio: string;
  experience_years: number | null;
  years_of_experience: string;
  education: string;
  certifications: string;
  achievements: string;
  skills: string[] | string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  portfolio_url: string;
  is_featured: boolean;
  display_order: number;
  assigned_sections: string[];
}

export interface CustomerProfile {
  // Lead fields
  is_lead?: boolean;
  lead_source?: string; // "website", "referral", "cold-call", "linkedin", "event"
  lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_score?: number; // 1-10
  lead_notes?: string;
  converted_at?: string;
  
  // Customer fields
  is_customer: boolean;
  image: string | null;
  rating: number;
  company: string;
  job_title: string;
  pseudonym: string | null;
  description: string;
  is_featured: boolean;
  company_logo: string | null;
  linkedin_url: string | null;
  project_type: string;
  display_order: number;
  
  // Testimonial fields
  testimonial_text: string;
  testimonial_date: string | null;
  testimonial_status?: 'draft' | 'submitted' | 'approved' | 'published';
  testimonial_approved_by?: string;
  testimonial_approved_at?: string;
  testimonial_views?: number;
  
  assigned_sections: string[];
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  submitted_at: string;
  is_visible_to_user: boolean;
  is_approved_by_admin: boolean;
  product_id: number | null;
  product_name: string | null;
  user_id: string | null;
  user_name: string | null;
  user_surname: string | null;
  organization_id: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface TestimonialProfile {
  id: string;
  testimonial_text: string;
  rating: number;
  is_featured: boolean;
  display_order: number;
  testimonial_date: string;
  author_name: string;
  author_title: string;
  author_company: string;
  author_image: string | null;
}