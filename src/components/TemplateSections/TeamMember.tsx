'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { FaLinkedin, FaGithub, FaGlobe, FaFileAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { TeamMemberResumeModal } from '@/components/modals/TeamMemberResumeModal';

interface TeamMemberData {
  id: string;
  full_name: string;
  team: {
    // Display fields
    image?: string | null;
    job_title?: string;
    position?: string;
    pseudonym?: string | null;
    department?: string;
    description?: string;
    bio?: string;
    
    // Social links
    linkedin_url?: string | null;
    twitter_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    
    // Skills and experience
    skills?: string[];
    experience_years?: number | null;
    years_of_experience?: number;
    
    // Resume fields
    education?: string;
    certifications?: string[];
    achievements?: string[];
    
    // Metadata
    is_team_member?: boolean;
    is_featured?: boolean;
    display_order?: number;
    assigned_sections?: number[];
  };
}

interface TeamMemberProps {
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

const TeamMember: React.FC<TeamMemberProps> = ({ section }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenResume = (member: TeamMemberData) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMember(null), 300); // Clear after animation
  };

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setError(null);

        // Get current session for API authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('No active session for team members fetch');
          setTeamMembers([]);
          setLoading(false);
          return;
        }

        // Fetch team members through the API route (server-side organization filtering)
        const response = await fetch('/api/team-members', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch team members:', response.status, errorData);
          setError(`Failed to load team members: ${response.status}`);
          return;
        }

        const data = await response.json();
        console.log('Team members data fetched:', data?.length || 0, 'profiles');

        // Filter by assigned sections and featured status (client-side filtering)
        const filtered = (data || []).filter((profile: any) => {
          const team = profile.team;
          if (!team || !team.is_team_member) return false;
          
          // Only show featured team members on the website
          if (!team.is_featured) return false;

          // If no assigned_sections, show in all sections
          if (!team.assigned_sections || team.assigned_sections.length === 0) {
            return true;
          }

          // Check if this section.id is in assigned_sections
          return team.assigned_sections.includes(section.id);
        });

        console.log('Filtered team members for section', section.id, ':', filtered.length);
        setTeamMembers(filtered);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred while loading team members.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
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

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No team members found for this section.
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

  // Get card style classes based on text_style_variant
  const getCardStyles = (variant?: string) => {
    switch (variant) {
      case 'apple':
        return {
          card: 'bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-500 p-8',
          avatar: 'border-4 border-gray-100 shadow-sm',
          name: 'text-2xl font-semibold text-gray-900 tracking-tight',
          title: 'text-sm text-gray-600 mt-2 font-medium',
          description: 'text-sm text-gray-600 leading-relaxed',
          skill: 'px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium',
          socialIcon: 'text-gray-600 hover:text-gray-900 transition-colors p-2.5 rounded-full hover:bg-gray-100',
        };
      
      case 'codedharmony':
        return {
          card: 'relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-purple-500/10 before:via-transparent before:to-blue-500/10 before:rounded-3xl p-0',
          avatar: 'border-0 shadow-none ring-0',
          name: 'text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600',
          title: 'text-sm text-purple-600 mt-2 font-bold uppercase tracking-wider',
          description: 'text-sm text-gray-600 leading-relaxed',
          skill: 'px-4 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all',
          socialIcon: 'text-purple-500 hover:text-pink-500 transition-all p-2.5 rounded-full hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:scale-110',
          layout: 'horizontal', // Special flag for horizontal layout
          avatarSize: 'w-full h-full md:w-64', // Full width/height
          avatarContainer: 'w-full md:w-64 h-64 md:h-auto md:min-h-full', // Container sizing
        };
      
      case 'magazine':
        return {
          card: 'bg-white rounded-none border-l-4 border-black shadow-md hover:shadow-xl transition-all duration-300 p-6 relative overflow-hidden before:absolute before:top-0 before:right-0 before:w-1 before:h-full before:bg-black',
          avatar: 'border-4 border-black shadow-lg',
          name: 'text-2xl font-black text-black uppercase tracking-wider',
          title: 'text-xs text-gray-600 mt-2 uppercase tracking-widest font-bold',
          description: 'text-sm text-gray-800 leading-relaxed font-serif italic',
          skill: 'px-3 py-1 bg-black text-white text-xs rounded-none uppercase tracking-wider font-bold',
          socialIcon: 'text-black hover:text-gray-600 transition-colors p-2 rounded-none hover:bg-gray-100',
        };
      
      case 'startup':
        return {
          card: 'bg-white rounded-2xl border-2 border-blue-500 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6',
          avatar: 'border-4 border-blue-500 shadow-lg',
          name: 'text-xl font-bold text-blue-600',
          title: 'text-sm text-gray-700 mt-1 font-semibold',
          description: 'text-sm text-gray-700',
          skill: 'px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-300 font-semibold',
          socialIcon: 'text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50',
        };
      
      case 'elegant':
        return {
          card: 'bg-gradient-to-br from-slate-50 to-stone-50 rounded-xl border border-stone-200 shadow-md hover:shadow-xl transition-all duration-500 p-8',
          avatar: 'border-4 border-stone-300 shadow-md ring-2 ring-stone-100',
          name: 'text-2xl font-serif text-stone-800',
          title: 'text-sm text-stone-600 mt-2 font-light tracking-wide',
          description: 'text-sm text-stone-700 leading-relaxed font-serif',
          skill: 'px-4 py-1.5 bg-stone-200 text-stone-800 text-xs rounded-sm font-serif',
          socialIcon: 'text-stone-600 hover:text-stone-900 transition-colors p-2 rounded-sm hover:bg-stone-200',
        };
      
      case 'brutalist':
        return {
          card: 'bg-yellow-300 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200 p-6',
          avatar: 'border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          name: 'text-2xl font-black text-black uppercase',
          title: 'text-sm text-black mt-1 font-bold uppercase',
          description: 'text-sm text-black font-bold',
          skill: 'px-3 py-1 bg-white border-2 border-black text-black text-xs rounded-none uppercase font-black',
          socialIcon: 'text-black hover:text-red-600 transition-colors p-2 rounded-none hover:bg-white border-2 border-transparent hover:border-black',
        };
      
      case 'modern':
        return {
          card: 'bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 p-0 border border-gray-700 overflow-hidden',
          avatar: 'border-0 shadow-none ring-0',
          name: 'text-xl font-bold text-white',
          title: 'text-sm text-cyan-400 mt-1 font-medium uppercase tracking-wide',
          description: 'text-sm text-gray-400',
          skill: 'px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs rounded-full font-medium shadow-lg',
          socialIcon: 'text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-full hover:bg-gray-700',
          layout: 'vertical-modern', // Special flag for modern vertical layout
          avatarSize: 'w-full h-48', // Full width, fixed height
          avatarContainer: 'w-full h-48', // Container sizing
          photoStyle: 'grayscale hover:grayscale-0', // Grayscale effect
        };
      
      case 'playful':
        return {
          card: 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl shadow-lg hover:shadow-2xl hover:rotate-1 transition-all duration-300 p-6 border-4 border-white',
          avatar: 'border-4 border-white shadow-lg ring-4 ring-pink-200',
          name: 'text-xl font-black text-purple-600',
          title: 'text-sm text-pink-600 mt-1 font-bold',
          description: 'text-sm text-purple-700 font-medium',
          skill: 'px-3 py-1.5 bg-white text-purple-600 text-xs rounded-full border-2 border-purple-300 font-bold shadow-sm',
          socialIcon: 'text-purple-600 hover:text-pink-600 transition-colors p-2 rounded-full hover:bg-white',
        };
      
      default: // 'default' or no variant
        return {
          card: 'group relative bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 hover:bg-white/50',
          avatar: 'border-4 border-white/80 shadow-md group-hover:shadow-lg transition-shadow',
          name: 'text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors',
          title: 'text-sm text-gray-700 mt-1 font-medium',
          description: 'text-sm text-gray-700',
          skill: 'px-3 py-1 bg-white/60 backdrop-blur-sm text-gray-800 text-xs rounded-full border border-white/80 shadow-sm font-medium',
          socialIcon: 'text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-white/60 backdrop-blur-sm',
        };
    }
  };

  const cardStyles = getCardStyles(section.text_style_variant);

  const responsiveGridClasses = getResponsiveGridClasses(section.grid_columns || 3);

  return (
    <section className="px-4 py-8 min-h-[600px]">
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

        {/* Team Members Grid */}
        <div className={cn('grid gap-8', responsiveGridClasses)}>
          {teamMembers.map((member) => {
            const team = member.team;
            const displayName = team.pseudonym || member.full_name;
            const avatarImage = team.image;
            const isHorizontal = (cardStyles as any).layout === 'horizontal';
            const isVerticalModern = (cardStyles as any).layout === 'vertical-modern';
            const avatarSizeClass = (cardStyles as any).avatarSize || 'w-32 h-32';
            const avatarContainerClass = (cardStyles as any).avatarContainer || '';
            const photoStyle = (cardStyles as any).photoStyle || '';

            return (
              <div
                key={member.id}
                className={cardStyles.card}
              >
                <div className={cn(
                  isHorizontal ? 'flex flex-col md:flex-row items-stretch' : 'flex flex-col'
                )}>
                  {/* Avatar */}
                  {avatarImage && (
                    <div className={cn(
                      'relative overflow-hidden flex items-center justify-center',
                      isHorizontal && avatarContainerClass ? cn(avatarContainerClass, 'bg-gradient-to-br from-purple-100 to-blue-100') : '',
                      isVerticalModern ? '' : !isHorizontal && 'mb-4'
                    )}>
                      <div className={cn(
                        'relative',
                        isHorizontal && avatarContainerClass ? avatarSizeClass : isVerticalModern ? avatarSizeClass : cn('rounded-full overflow-hidden', avatarSizeClass),
                        !isVerticalModern && cardStyles.avatar
                      )}>
                        <Image
                          src={avatarImage}
                          alt={displayName}
                          fill
                          className={cn(
                            isHorizontal && avatarContainerClass ? 'object-contain' : isVerticalModern ? 'object-cover' : 'object-cover',
                            photoStyle,
                            'transition-all duration-300'
                          )}
                          sizes={isHorizontal && avatarContainerClass ? '256px' : isVerticalModern ? '100vw' : '128px'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className={cn(
                    'flex-1',
                    isHorizontal ? 'text-left p-6' : 'text-center p-6'
                  )}>
                    {/* Name and Title */}
                    <div className="mb-4">
                      <h3 className={cardStyles.name}>
                        {displayName}
                      </h3>
                      {team.job_title && (
                        <p className={cardStyles.title}>
                          {team.job_title}
                        </p>
                      )}
                      {team.department && (
                        <p className={cn(cardStyles.title, 'opacity-75 text-xs mt-1')}>
                          {team.department}
                        </p>
                      )}
                    </div>

                    {/* Description/Bio */}
                    {team.description && (
                      <div className={cn(cardStyles.description, 'mb-4 line-clamp-3 prose prose-sm max-w-none', isHorizontal ? '' : 'text-center')}
                           dangerouslySetInnerHTML={{ __html: team.description }}
                      />
                    )}

                    {/* Skills */}
                    {team.skills && team.skills.length > 0 && (
                      <div className={cn('flex flex-wrap gap-2 mb-4', isHorizontal ? '' : 'justify-center')}>
                        {team.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className={cardStyles.skill}
                          >
                            {skill}
                      </span>
                    ))}
                  </div>
                )}

                    {/* Social Links */}
                    <div className={cn('flex gap-3 mt-4', isHorizontal ? '' : 'justify-center')}>
                      {/* Resume/Profile Icon */}
                      <button
                        onClick={() => handleOpenResume(member)}
                        className={cn(cardStyles.socialIcon, 'cursor-pointer')}
                        aria-label="View Resume"
                        title="View Full Profile"
                      >
                        <FaFileAlt size={20} />
                      </button>
                      
                      {team.linkedin_url && (
                        <a
                          href={team.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cardStyles.socialIcon}
                          aria-label="LinkedIn"
                        >
                          <FaLinkedin size={20} />
                        </a>
                      )}
                      {team.twitter_url && (
                        <a
                          href={team.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cardStyles.socialIcon}
                          aria-label="X (Twitter)"
                        >
                          <FaXTwitter size={20} />
                        </a>
                      )}
                      {team.github_url && (
                        <a
                          href={team.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cardStyles.socialIcon}
                          aria-label="GitHub"
                        >
                          <FaGithub size={20} />
                        </a>
                      )}
                      {team.portfolio_url && (
                        <a
                          href={team.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cardStyles.socialIcon}
                          aria-label="Portfolio"
                        >
                          <FaGlobe size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resume Modal */}
      {selectedMember && (
        <TeamMemberResumeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          member={selectedMember}
          variant={section.text_style_variant}
        />
      )}
    </section>
  );
};

export default TeamMember;
