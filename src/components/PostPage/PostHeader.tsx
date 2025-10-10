'use client';

import React, { memo, useMemo } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { usePostEditModal } from '@/components/modals/PostEditModal/context';
import AdminButtons from './AdminButtons';
import Link from 'next/link';
import IconButton from '@/ui/IconButton';
import RightArrowDynamic from '@/ui/RightArrowDynamic';

// Utility function to convert subsection to slug
const generateSlug = (subsection: string): string => {
  // Lowercase and replace spaces with hyphens
  let slug = subsection.toLowerCase().replace(/\s+/g, '-');

  // Insert hyphens around numbers and between letters and numbers
  slug = slug.replace(/([a-z])(\d)/g, '$1-$2'); // e.g., 'subsection1' → 'subsection-1'
  slug = slug.replace(/(\d)([a-z])/g, '$1-$2'); // e.g., '1989other' → '1989-other'

  // Remove any non-alphanumeric or non-hyphen characters
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Ensure no multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // Trim leading/trailing hyphens
  return slug.replace(/^-+|-+$/g, '');
};

interface PostHeaderProps {
  post: {
    id?: string;
    slug?: string;
    section?: string;
    subsection?: string;
    title: string;
    created_on: string;
    is_with_author: boolean;
    is_company_author: boolean;
    author?: { first_name: string; last_name: string };
    description: string;
    content?: string;
  };
  isAdmin?: boolean;
  showAdminButtons?: boolean;
}

const PostHeader: React.FC<PostHeaderProps> = memo(({ post, isAdmin, showAdminButtons }) => {
  const { settings } = useSettings();

  // Memoize computed values
  const textSizeHeadings = useMemo(() => 'text-sm', []);
  const textColorHover = useMemo(() => 'gray-400', []);
  const brandName = useMemo(() => settings?.site || '', [settings?.site]);

  // Memoize subsection slug and URL
  const { subsectionSlug, subsectionUrl } = useMemo(() => {
    const slug = generateSlug(post.subsection || 'Subsection');
    return {
      subsectionSlug: slug,
      subsectionUrl: `/${slug}/`
    };
  }, [post.subsection]);

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    return new Date(post.created_on).toISOString().split('T')[0];
  }, [post.created_on]);

  // Memoize author display
  const authorDisplay = useMemo(() => {
    if (post.is_with_author && post.author) {
      return `${post.author.first_name} ${post.author.last_name || brandName}`;
    }
    if (post.is_company_author && brandName) {
      return brandName;
    }
    return null;
  }, [post.is_with_author, post.author, post.is_company_author, brandName]);

  return (
    <div className="post-header relative">
      {/* Section and Subsection */}
      <div className={`flex justify-between items-center text-${textColorHover} ${textSizeHeadings} font-light tracking-tight`}>
        <Link href="#">
          <p>{post.section}</p>
        </Link>
      </div>
      <Link href={subsectionUrl}>
        <span className="flex transition-all transition-300 group items-center mt-2 font-medium text-xs text-sky-500 tracking-widest hover:underline">
          {post.subsection}
          <RightArrowDynamic />
        </span>
      </Link>

      {/* Title */}
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl font-nunito">
        {post.title}
      </h1>

      {/* Date and Author Info */}
      <div className="flex items-center gap-4 text-gray-500 font-light">
        {/* Date */}
        <div className="flex items-center gap-1">
          <FiCalendar className="text-gray-400" />
          <time dateTime={post.created_on}>
            {formattedDate}
          </time>
        </div>

        {/* Display Author or Company Name */}
        {authorDisplay && (
          <div className="flex items-center gap-1">
            <FiUser className="text-gray-400" />
            <span>{authorDisplay}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xl sm:text-2xl text-gray-700 mt-6 mb-8">{post.description}</p>

      {/* Optional Divider */}
      <hr className="border-gray-200 mb-8" />
      
      {/* Neomorphism Admin Buttons - Hover/Touch Activated */}
      {isAdmin && showAdminButtons && (
        <AdminButtons post={post} />
      )} 
    </div>
  );
});

PostHeader.displayName = 'PostHeader';

export default PostHeader;