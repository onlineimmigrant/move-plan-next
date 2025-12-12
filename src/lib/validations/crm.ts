/**
 * Zod Validation Schemas for CRM
 * 
 * Runtime validation for forms and API requests
 */

import { z } from 'zod';

/**
 * Account/Profile validation
 */
export const accountSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  city: z.string().max(100).optional().or(z.literal('')),
  postal_code: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  role: z.enum(['user', 'admin']),
  user_status: z.enum(['free_trial', 'paid', 'inactive']).optional(),
  is_student: z.boolean().optional(),
  is_site_creator: z.boolean().optional(),
  is_service_provider: z.boolean().optional(),
  service_title: z.string().max(200).optional().or(z.literal('')),
  hourly_rate: z.number().min(0).max(10000).optional(),
  is_available_for_booking: z.boolean().optional(),
});

/**
 * Team member validation
 */
export const teamMemberSchema = z.object({
  is_team_member: z.boolean(),
  job_title: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  image: z.string().url('Invalid image URL').or(z.literal('')).optional(),
  pseudonym: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  skills: z.array(z.string()).or(z.string()).optional(),
  experience_years: z.number().int().min(0).max(100).optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  twitter_url: z.string().url('Invalid Twitter URL').or(z.literal('')).optional(),
  github_url: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
  portfolio_url: z.string().url('Invalid Portfolio URL').or(z.literal('')).optional(),
  is_featured: z.boolean().optional(),
});

/**
 * Customer/Lead validation
 */
export const customerSchema = z.object({
  is_customer: z.boolean().optional(),
  is_lead: z.boolean().optional(),
  company: z.string().max(200).optional().or(z.literal('')),
  job_title: z.string().max(100).optional().or(z.literal('')),
  image: z.string().url('Invalid image URL').or(z.literal('')).optional(),
  rating: z.number().min(1).max(5).optional(),
  testimonial_text: z.string().max(2000).optional().or(z.literal('')),
  testimonial_date: z.string().optional(),
  testimonial_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  testimonial_rating: z.number().int().min(1).max(5).optional(),
  company_logo: z.string().url('Invalid logo URL').or(z.literal('')).optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  project_type: z.string().max(200).optional().or(z.literal('')),
  // Lead fields
  lead_status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  lead_source: z.string().max(100).optional().or(z.literal('')),
  lead_score: z.number().int().min(0).max(10).optional(),
  lead_notes: z.string().max(2000).optional().or(z.literal('')),
}).refine(
  (data) => {
    // Enforce mutual exclusivity: only one of is_customer or is_lead can be true
    if (data.is_customer && data.is_lead) {
      return false;
    }
    return true;
  },
  {
    message: 'An account cannot be both a customer and a lead',
  }
);

/**
 * Review validation
 */
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional().or(z.literal('')),
  product_id: z.string().uuid('Invalid product ID').optional(),
});

/**
 * Validation helper function
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Type exports for use in components
 */
export type Account = z.infer<typeof accountSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Review = z.infer<typeof reviewSchema>;
