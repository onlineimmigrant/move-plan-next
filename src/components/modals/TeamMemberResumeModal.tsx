'use client';

import React from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

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

interface TeamMemberResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberData;
  variant?: string;
}

export const TeamMemberResumeModal: React.FC<TeamMemberResumeModalProps> = ({
  isOpen,
  onClose,
  member,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  const team = member.team;
  const displayName = team.pseudonym || member.full_name;

  // Get modal styles based on variant
  const getModalStyles = () => {
    switch (variant) {
      case 'modern':
        return {
          overlay: 'bg-black/80',
          container: 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700',
          header: 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-gray-700',
          title: 'text-white',
          subtitle: 'text-cyan-400',
          section: 'bg-gray-800/50 border border-gray-700',
          text: 'text-gray-300',
          label: 'text-cyan-400',
          socialIcon: 'text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-full hover:bg-gray-700',
        };
      
      case 'elegant':
        return {
          overlay: 'bg-stone-900/70',
          container: 'bg-gradient-to-br from-stone-50 to-slate-100 border border-stone-200',
          header: 'bg-stone-100 border-b border-stone-300',
          title: 'text-stone-900 font-serif',
          subtitle: 'text-stone-600 font-serif italic',
          section: 'bg-white border border-stone-200',
          text: 'text-stone-700 font-serif',
          label: 'text-stone-900 font-serif',
          socialIcon: 'text-stone-600 hover:text-stone-900 transition-colors p-2 rounded-full hover:bg-stone-200',
        };
      
      case 'brutalist':
        return {
          overlay: 'bg-black/90',
          container: 'bg-yellow-400 border-8 border-black',
          header: 'bg-white border-b-8 border-black',
          title: 'text-black font-black uppercase',
          subtitle: 'text-black font-bold uppercase text-xs',
          section: 'bg-white border-4 border-black',
          text: 'text-black font-bold',
          label: 'text-black font-black uppercase',
          socialIcon: 'text-black hover:text-white transition-colors p-2 rounded-full hover:bg-black border-2 border-black',
        };
      
      default:
        return {
          overlay: 'bg-gray-900/50',
          container: 'backdrop-blur-2xl bg-white/50 border-0 shadow-lg',
          header: 'bg-white/60 backdrop-blur-lg border-b border-gray-200',
          title: 'text-gray-900',
          subtitle: 'text-gray-600',
          section: 'bg-white/50 backdrop-blur-sm border border-gray-200/50',
          text: 'text-gray-700',
          label: 'text-gray-900',
          socialIcon: 'text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-white/50',
        };
    }
  };

  const styles = getModalStyles();

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className={cn('absolute inset-0', styles.overlay)} />
      
      {/* Modal Container - Centered on desktop, styled like ChatHelpWidget */}
      <div
        className={cn(
          'relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-out',
          styles.container
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between p-6', styles.header)}>
          <div>
            <h2 className={cn('text-2xl font-bold', styles.title)}>
              {displayName}
            </h2>
            {(team.job_title || team.position) && (
              <p className={cn('text-sm mt-1', styles.subtitle)}>
                {team.job_title || team.position}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              variant === 'brutalist' 
                ? 'hover:bg-black hover:text-white border-2 border-black' 
                : variant === 'modern'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100'
            )}
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Section */}
          <div className={cn('rounded-xl p-6 flex flex-col md:flex-row gap-6', styles.section)}>
            {/* Avatar */}
            {team.image && (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <Image
                    src={team.image}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>
              </div>
            )}

            {/* Bio and Basic Info */}
            <div className="flex-1 space-y-4">
              {team.bio && (
                <div>
                  <h3 className={cn('text-lg font-bold mb-2', styles.label)}>About</h3>
                  <p className={cn('leading-relaxed', styles.text)}>{team.bio}</p>
                </div>
              )}

              {team.years_of_experience && (
                <div>
                  <h3 className={cn('text-lg font-bold mb-2', styles.label)}>Experience</h3>
                  <p className={cn(styles.text)}>
                    {team.years_of_experience} {team.years_of_experience === 1 ? 'year' : 'years'} of professional experience
                  </p>
                </div>
              )}

              {/* Social Links */}
              {(team.linkedin_url || team.github_url || team.twitter_url || team.portfolio_url) && (
                <div>
                  <h3 className={cn('text-lg font-bold mb-3', styles.label)}>Connect</h3>
                  <div className="flex flex-wrap gap-3">
                    {team.linkedin_url && (
                      <a
                        href={team.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialIcon}
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
                        className={styles.socialIcon}
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
                        className={styles.socialIcon}
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
                        className={styles.socialIcon}
                        aria-label="Portfolio"
                      >
                        <FaGlobe size={20} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {team.skills && team.skills.length > 0 && (
            <div className={cn('rounded-xl p-6', styles.section)}>
              <h3 className={cn('text-lg font-bold mb-4', styles.label)}>Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {team.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium',
                      variant === 'brutalist'
                        ? 'bg-white border-3 border-black'
                        : variant === 'modern'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : variant === 'elegant'
                        ? 'bg-stone-200 text-stone-800'
                        : 'bg-blue-100 text-blue-800'
                    )}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {team.education && (
            <div className={cn('rounded-xl p-6', styles.section)}>
              <h3 className={cn('text-lg font-bold mb-3', styles.label)}>Education</h3>
              <p className={cn(styles.text)}>{team.education}</p>
            </div>
          )}

          {/* Certifications */}
          {team.certifications && team.certifications.length > 0 && (
            <div className={cn('rounded-xl p-6', styles.section)}>
              <h3 className={cn('text-lg font-bold mb-4', styles.label)}>Certifications</h3>
              <ul className="space-y-2">
                {team.certifications.map((cert, index) => (
                  <li key={index} className={cn('flex items-start', styles.text)}>
                    <span className={cn(
                      'mr-3 mt-1',
                      variant === 'brutalist' ? 'text-black' : variant === 'modern' ? 'text-cyan-400' : 'text-blue-500'
                    )}>
                      •
                    </span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {team.achievements && team.achievements.length > 0 && (
            <div className={cn('rounded-xl p-6', styles.section)}>
              <h3 className={cn('text-lg font-bold mb-4', styles.label)}>Achievements</h3>
              <ul className="space-y-2">
                {team.achievements.map((achievement, index) => (
                  <li key={index} className={cn('flex items-start', styles.text)}>
                    <span className={cn(
                      'mr-3 mt-1',
                      variant === 'brutalist' ? 'text-black' : variant === 'modern' ? 'text-cyan-400' : 'text-blue-500'
                    )}>
                      🏆
                    </span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
