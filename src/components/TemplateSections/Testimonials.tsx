'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { cn } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TestimonialData {
  id: string;
  full_name: string;
  customer: {
    image?: string | null;
    rating?: number;
    company?: string;
    job_title?: string;
    pseudonym?: string | null;
    description?: string;
    is_customer?: boolean;
    is_featured?: boolean;
    company_logo?: string | null;
    linkedin_url?: string | null;
    project_type?: string;
    display_order?: number;
    testimonial_date?: string | null;
    testimonial_text?: string;
    assigned_sections?: number[];
  };
}

interface TestimonialsProps {
  section: {
    id: number;
    section_title?: string;
    section_description?: string;
    background_color?: string;
    is_gradient?: boolean;
    gradient?: {
      from: string;
      via?: string;
      to: string;
    };
    is_full_width?: boolean;
    grid_columns?: number;
    text_style_variant?: string;
  };
}

const Testimonials: React.FC<TestimonialsProps> = ({ section }) => {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get card styles based on text_style_variant
  const getCardStyles = (variant?: string) => {
    switch (variant) {
      case 'default':
        return {
          card: 'bg-white/40 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-white/20',
          avatar: 'border-2 border-white/30 shadow-md',
          name: 'font-semibold text-gray-900',
          title: 'text-sm text-gray-600',
          testimonial: 'text-gray-700 leading-relaxed italic',
          rating: 'text-yellow-400',
        };
      
      case 'apple':
        return {
          card: 'bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 p-10 border border-gray-100',
          avatar: 'border-0 shadow-sm ring-1 ring-gray-100',
          name: 'text-lg font-medium text-gray-900',
          title: 'text-sm text-gray-500 font-light',
          testimonial: 'text-gray-600 leading-loose font-light',
          rating: 'text-orange-400',
        };
      
      case 'codedharmony':
        return {
          card: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-12 border border-purple-100',
          avatar: 'border-3 border-gradient-to-r from-purple-400 to-pink-400 shadow-lg',
          name: 'text-xl font-thin text-gray-900',
          title: 'text-sm text-purple-600 font-light tracking-wide',
          testimonial: 'text-gray-700 leading-relaxed font-light',
          rating: 'text-purple-400',
        };
      
      case 'magazine':
        return {
          card: 'bg-white rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 p-10',
          avatar: 'border-4 border-black shadow-none',
          name: 'text-xl font-bold uppercase tracking-tight',
          title: 'text-xs uppercase tracking-widest font-bold',
          testimonial: 'text-sm leading-relaxed font-serif',
          rating: 'text-red-500',
        };
      
      case 'startup':
        return {
          card: 'bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 p-8',
          avatar: 'border-2 border-blue-500 shadow-md',
          name: 'text-lg font-bold text-gray-900',
          title: 'text-sm text-blue-600 font-semibold',
          testimonial: 'text-gray-700 leading-relaxed',
          rating: 'text-blue-500',
        };
      
      case 'elegant':
        return {
          card: 'bg-gradient-to-br from-stone-50 to-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-10 border border-stone-200',
          avatar: 'border-2 border-stone-300 shadow-md',
          name: 'text-xl font-serif font-normal text-stone-900',
          title: 'text-sm font-serif text-stone-600 italic',
          testimonial: 'text-stone-700 leading-loose font-serif',
          rating: 'text-amber-500',
        };
      
      case 'brutalist':
        return {
          card: 'bg-yellow-400 rounded-none border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 p-8',
          avatar: 'border-6 border-black shadow-none',
          name: 'text-2xl font-black uppercase tracking-tighter',
          title: 'text-xs uppercase tracking-wider font-bold',
          testimonial: 'text-sm leading-tight font-bold uppercase',
          rating: 'text-black',
        };
      
      case 'modern':
        return {
          card: 'bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 p-8 border border-gray-700',
          avatar: 'border-2 border-cyan-400 shadow-lg shadow-cyan-500/50',
          name: 'text-lg font-bold text-white',
          title: 'text-sm text-cyan-400 font-medium uppercase tracking-wide',
          testimonial: 'text-gray-300 leading-relaxed',
          rating: 'text-cyan-400',
          layout: 'dark',
        };
      
      case 'playful':
        return {
          card: 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl shadow-xl hover:shadow-2xl hover:rotate-1 transition-all duration-300 p-10 border-2 border-purple-200',
          avatar: 'border-4 border-white shadow-lg',
          name: 'text-xl font-extrabold text-purple-900',
          title: 'text-sm text-purple-600 font-bold tracking-wide',
          testimonial: 'text-gray-700 leading-relaxed font-medium',
          rating: 'text-pink-500',
        };
      
      default:
        return {
          card: 'bg-white/40 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-white/20',
          avatar: 'border-2 border-white/30 shadow-md',
          name: 'font-semibold text-gray-900',
          title: 'text-sm text-gray-600',
          testimonial: 'text-gray-700 leading-relaxed italic',
          rating: 'text-yellow-400',
        };
    }
  };

  const cardStyles = getCardStyles(section.text_style_variant);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setError(null);
        
        // Fetch profiles where customer.is_customer = true
        // AND (customer.assigned_sections is null OR customer.assigned_sections contains section.id)
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, customer')
          .not('customer', 'is', null)
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error('Error fetching testimonials:', fetchError);
          
          // Check if it's a column not found error
          if (fetchError.message?.includes('column') && fetchError.message?.includes('customer')) {
            setError('Database migration needed: The "customer" column does not exist in the profiles table. Please run the migration first.');
          } else {
            setError(`Failed to load testimonials: ${fetchError.message || 'Unknown error'}`);
          }
          return;
        }

        // Filter in JavaScript for JSONB conditions
        const filtered = (data || []).filter((profile: any) => {
          const customer = profile.customer;
          if (!customer || !customer.is_customer || !customer.testimonial_text) return false;
          
          // If no assigned_sections, show in all sections
          if (!customer.assigned_sections || customer.assigned_sections.length === 0) {
            return true;
          }
          
          // Check if this section.id is in assigned_sections
          return customer.assigned_sections.includes(section.id);
        });

        setTestimonials(filtered);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred while loading testimonials.');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [section.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              ⚠️ Configuration Required
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="text-left bg-white rounded p-4 text-sm">
              <p className="font-semibold mb-2">To fix this, run the following SQL in Supabase:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">
{`-- Add team column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS team JSONB DEFAULT NULL;

-- Add customer column to profiles table  
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT NULL;`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No testimonials found for this section.
      </div>
    );
  }

  // Generate responsive grid classes
  const getResponsiveGridClasses = (columns: number): string => {
    const gridClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    };
    return gridClasses[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  const responsiveGridClasses = getResponsiveGridClasses(section.grid_columns || 3);

  return (
    <section className="px-4 py-32 min-h-[600px]">
      <div className={cn(
        'mx-auto space-y-12',
        section.is_full_width ? 'w-full' : 'max-w-7xl'
      )}>
        {/* Section Title and Description */}
        {(section.section_title || section.section_description) && (
          <div className="text-center">
            {section.section_title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                {section.section_title}
              </h2>
            )}
            {section.section_description && (
              <p className="mt-4 text-lg text-gray-600">
                {section.section_description}
              </p>
            )}
          </div>
        )}

        {/* Testimonials Grid */}
        <div className={cn('grid gap-8', responsiveGridClasses)}>
          {testimonials.map((testimonial) => {
            const customer = testimonial.customer;
            const displayName = customer.pseudonym || testimonial.full_name;
            const avatarImage = customer.image;
            const rating = customer.rating || 5;
            const isDarkLayout = (cardStyles as any).layout === 'dark';

            return (
              <div
                key={testimonial.id}
                className={cn('flex flex-col', cardStyles.card)}
              >
                {/* Rating */}
                <div className="mb-4">
                  <div className={cn('flex gap-1', cardStyles.rating)}>
                    {[...Array(Math.floor(rating))].map((_, i) => (
                      <FaStar key={`full-${i}`} size={18} />
                    ))}
                    {rating % 1 >= 0.5 && <FaStarHalfAlt size={18} />}
                    {[...Array(5 - Math.floor(rating) - (rating % 1 >= 0.5 ? 1 : 0))].map((_, i) => (
                      <FaRegStar key={`empty-${i}`} size={18} />
                    ))}
                  </div>
                </div>

                {/* Testimonial Text */}
                <div className="flex-grow mb-6">
                  <p className={cardStyles.testimonial}>
                    "{customer.testimonial_text}"
                  </p>
                </div>

                {/* Customer Info */}
                <div className={cn(
                  'flex items-center gap-4 pt-4 border-t',
                  isDarkLayout ? 'border-gray-700' : 'border-gray-100'
                )}>
                  {/* Avatar */}
                  {avatarImage && (
                    <div className={cn(
                      'relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0',
                      cardStyles.avatar
                    )}>
                      <Image
                        src={avatarImage}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}

                  {/* Name and Title/Company */}
                  <div className="flex-grow">
                    <p className={cardStyles.name}>
                      {displayName}
                    </p>
                    {(customer.job_title || customer.company) && (
                      <p className={cardStyles.title}>
                        {[customer.job_title, customer.company]
                          .filter(Boolean)
                          .join(' at ')}
                      </p>
                    )}
                    {customer.project_type && (
                      <p className={cn(
                        'text-xs mt-1',
                        isDarkLayout ? 'text-gray-400' : 'text-gray-500'
                      )}>
                        {customer.project_type}
                      </p>
                    )}
                    {customer.testimonial_date && (
                      <p className={cn(
                        'text-xs mt-1',
                        isDarkLayout ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {new Date(customer.testimonial_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
