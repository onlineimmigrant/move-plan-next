// src/components/PostPage/PostHeader.tsx
'use client';

import React from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import Link from 'next/link';
import IconButton from '@/components/IconButton'; // Adjust path as needed
import { cn } from '@/lib/utils';

interface PostHeaderProps {
  post: {
    section: string;
    subsection: string;
    title: string;
    created_on: string;
    is_with_author: boolean;
    is_company_author: boolean;
    author?: { first_name: string; last_name: string };
    description: string;
  };
  isAdmin?: boolean;
  showMenu?: boolean;
  editHref: string;
  createHref: string;
}

const PostHeader: React.FC<PostHeaderProps> = ({ post, isAdmin, showMenu, editHref, createHref }) => {
  const { settings } = useSettings();

  // Use settings for text size, font weight, and colors with default values
  const textSizeHeadings = settings?.font_size_small?.name || 'text-sm';
  const fontWeight = settings?.primary_font?.default_type ? 'font-normal' : 'font-medium';
  const textColor = settings?.primary_color?.name ? settings.primary_color.name : 'gray-900';
  const textColorHover = settings?.secondary_color?.name ? settings.secondary_color.name : 'gray-400';

  const brandName = settings?.site?.name || 'My Brand'; // Adjust based on your settings schema

  return (
    <div className="post-header relative">

      {/* Section and Subsection */}
      <div className={`flex justify-between items-center text-${textColorHover} ${textSizeHeadings} font-light tracking-tight`}>
        <a href={post.subsection === 'SQE2' ? '/sqe-2/specification/' : '#'}>
          <p>{post.section}</p>
        </a>
      </div>
    <span className='mt-2 font-medium text-xs text-sky-500 tracking-widest'>{post.subsection}</span>
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
            {new Date(post.created_on).toISOString().split('T')[0]}
          </time>
        </div>

        {/* Display Author or Company Name */}
        {post.is_with_author && post.author ? (
          <div className="flex items-center gap-1">
            <FiUser className="text-gray-400" />
            <span>
              {post.author.first_name} {post.author.last_name || brandName}
            </span>
          </div>
        ) : (
          post.is_company_author && brandName && (
            <div className="flex items-center gap-1">
              <FiUser className="text-gray-400" />
              <span>{brandName}</span>
            </div>
          )
        )}
      </div>

      {/* Description */}
      <p className="text-xl sm:text-2xl text-gray-700 mt-6 mb-8">{post.description}</p>

      {/* Hover Menu for Admins */}
      {isAdmin && showMenu && (
        <div className="absolute top-0 right-0 flex space-x-2 z-51">
          <Link href={createHref}>
            <IconButton
              onClick={() => {}} // No-op since Link handles navigation
              icon={PlusIcon}
              tooltip="Create New Post"
            />
          </Link>
          <Link href={editHref}>
            <IconButton
              onClick={() => {}} // No-op since Link handles navigation
              icon={PencilIcon}
              tooltip="Edit This Post"
            />
          </Link>
        </div>
      )}

      {/* Optional Divider */}
      <hr className="border-gray-200 mb-8" />
    </div>
  );
};

export default PostHeader;