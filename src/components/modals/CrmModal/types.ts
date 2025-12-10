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
  experience_years: string;
  years_of_experience: string;
  education: string;
  certifications: string;
  achievements: string;
  skills: string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  portfolio_url: string;
  is_featured: boolean;
  display_order: string;
  assigned_sections: number[];
}

export interface CustomerProfile {
  image: string | null;
  rating: number;
  company: string;
  job_title: string;
  pseudonym: string | null;
  description: string;
  is_customer: boolean;
  is_featured: boolean;
  company_logo: string | null;
  linkedin_url: string | null;
  project_type: string;
  display_order: number;
  testimonial_date: string | null;
  testimonial_text: string;
  assigned_sections: string[];
}

export interface LeadProfile {
  id: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  interest_level: number;
  notes: string;
  follow_up_date: string | null;
  converted_to_customer: boolean;
  converted_date: string | null;
}

export interface ReviewProfile {
  id: string;
  rating: number;
  review_text: string;
  review_date: string;
  is_published: boolean;
  response_text: string | null;
  response_date: string | null;
  platform: string;
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