// src/components/PostPage/LandingPostContent.tsx
'use client';

import React from 'react';
import parse from 'html-react-parser';
//import { EditDeleteButton } from './PostPage'; // Reuse the placeholder

interface LandingPostContentProps {
  post: {
    content: string;
  };
}

const LandingPostContent: React.FC<LandingPostContentProps> = ({ post }) => (
  <div className="w-full">
    {/*<EditDeleteButton href={`/post/${post.slug}/edit/`} title="Edit this post" />*/}
    {parse(post.content)}
  </div>
);

export default LandingPostContent;