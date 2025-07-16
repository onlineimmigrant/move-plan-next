'use client';

import React, { memo, useMemo } from 'react';
import parse, { domToReact, HTMLReactParserOptions, DOMNode, Element } from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/ui/Button';
import DisclosureButton from '@/ui/DisclosureButton';
import ListboxButton from '@/ui/ListboxButton';
import Card from '@/ui/Card';
import Block from '@/ui/Block';
import ImageCarousel from '@/ui/ImageCarousel';
import VideoCarousel from '@/ui/VideoCarousel';
import sanitizeHtml from 'sanitize-html';

interface LandingPostContentProps {
  post: {
    content: string;
    [key: string]: any;
  };
}

const LandingPostContent: React.FC<LandingPostContentProps> = memo(({ post }) => {
  // Memoize component mapping for performance
  const componentMap = useMemo((): { [key: string]: React.ComponentType<any> } => ({
    button: Button,
    Button: Button,
    disclosurebutton: DisclosureButton,
    DisclosureButton: DisclosureButton,
    listboxbutton: ListboxButton,
    ListboxButton: ListboxButton,
    card: Card,
    Card: Card,
    block: Block,
    Block: Block,
    imagecarousel: ImageCarousel,
    ImageCarousel: ImageCarousel,
    videocarousel: VideoCarousel,
    VideoCarousel: VideoCarousel,
    img: Image,
    a: Link,
  }), []);

  // Memoize sanitization configuration
  const sanitizeConfig = useMemo(() => ({
    allowedTags: [
      'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'ul', 'ol', 'li',
      'button', 'Button', 'disclosurebutton', 'DisclosureButton', 'listboxbutton', 'ListboxButton',
      'card', 'Card', 'block', 'Block', 'imagecarousel', 'ImageCarousel',
      'videocarousel', 'VideoCarousel', 'img', 'a', 'strong', 'em', 'br', 'hr',
    ],
    allowedAttributes: {
      '*': ['class', 'className', 'id', 'style', 'variant', 'title', 'images', 'videos', 'imageSrc', 'imageAlt', 'background', 'options'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      button: ['type', 'disabled', 'onClick', 'variant'],
      Button: ['type', 'disabled', 'onClick', 'variant'],
      disclosurebutton: ['type', 'disabled', 'variant'],
      DisclosureButton: ['type', 'disabled', 'variant'],
      listboxbutton: ['options'],
      ListboxButton: ['options'],
      card: ['variant', 'title', 'imageSrc', 'imageAlt'],
      Card: ['variant', 'title', 'imageSrc', 'imageAlt'],
      block: ['variant', 'background'],
      Block: ['variant', 'background'],
      imagecarousel: ['images', 'class', 'className'],
      ImageCarousel: ['images', 'class', 'className'],
      videocarousel: ['videos', 'class', 'className'],
      VideoCarousel: ['videos', 'class', 'className'],
    },      transformTags: {
        '*': (tagName: string, attribs: any) => {
          if (attribs.class || attribs.className) {
            attribs.className = [attribs.class, attribs.className].filter(Boolean).join(' ').trim();
            delete attribs.class;
          }
          return { tagName, attribs };
        },
      },
    }), []);

  // Memoize sanitized content
  const sanitizedContent = useMemo(() => {
    if (!post?.content) return '';
    return sanitizeHtml(post.content, sanitizeConfig);
  }, [post?.content, sanitizeConfig]);

  // Memoize HTML parsing options for performance
  const parseOptions = useMemo((): HTMLReactParserOptions => ({
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.name.toLowerCase() in componentMap) {
        const Component = componentMap[domNode.name.toLowerCase()];
        const attribs = domNode.attribs || {};

        // Define props with specific types
        const props: { [key: string]: any } = { ...attribs };

        // Map class and className to className, preserve className
        if (props.class || props.className) {
          props.className = [props.class, props.className].filter(Boolean).join(' ').trim();
          delete props.class;
        }

        // Handle Button, DisclosureButton, and Card component props (validate variant)
        if (['button', 'Button', 'disclosurebutton', 'DisclosureButton', 'card', 'Card'].includes(domNode.name.toLowerCase()) && props.variant) {
          const validVariants = ['default', 'outline', 'solid', 'ghost', 'shadow', 'primary', 'badge_primary'];
          props.variant = validVariants.includes(props.variant) ? props.variant : 'default';
        }

        // Handle Block component props (validate variant)
        if (['block', 'Block'].includes(domNode.name.toLowerCase()) && props.variant) {
          const validVariants = ['default', 'primary', 'secondary'];
          props.variant = validVariants.includes(props.variant) ? props.variant : 'default';
        }

        // Handle Image component props
        if (domNode.name.toLowerCase() === 'img' && props.src) {
          props.loading = props.loading || 'lazy';
          if (props.width) {
            props.width = parseInt(props.width, 10) || 600;
          }
          if (props.height) {
            props.height = parseInt(props.height, 10) || 400;
          }
        }

        // Handle Link component props
        if (domNode.name.toLowerCase() === 'a' && props.href) {
          props.href = props.href;
        }

        // Safely handle children
        const children = 'children' in domNode && domNode.children && domNode.children.length > 0
          ? domToReact(domNode.children as DOMNode[], parseOptions)
          : undefined;

        return <Component {...props}>{children}</Component>;
      }

      // Return undefined to render standard HTML natively
      return undefined;
    },
  }), [componentMap]);

  if (!post?.content) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center text-gray-500">
        <p>No content available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none prose prose-lg prose-gray dark:prose-invert">
      {parse(sanitizedContent, parseOptions)}
    </div>
  );
});

LandingPostContent.displayName = 'LandingPostContent';

export default LandingPostContent;