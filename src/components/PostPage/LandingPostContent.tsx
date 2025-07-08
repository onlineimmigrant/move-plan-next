'use client';

import React from 'react';
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

const LandingPostContent: React.FC<LandingPostContentProps> = ({ post }) => {
  // Define a mapping of custom HTML tags to React components
  const componentMap: { [key: string]: React.ComponentType<any> } = {
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
  };

  // Sanitize the HTML content to prevent XSS and allow specific tags/attributes
  const sanitizedContent = sanitizeHtml(post.content, {
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
    },
    transformTags: {
      // Preserve class and map to className
      '*': (tagName, attribs) => {
        if (attribs.class || attribs.className) {
          attribs.className = [attribs.class, attribs.className].filter(Boolean).join(' ').trim();
          delete attribs.class;
        }
        console.log(`Sanitizing tag: ${tagName}`, attribs);
        return { tagName, attribs };
      },
    },
  });

  // Log sanitized content for debugging
  console.log('Sanitized content:', sanitizedContent);

  // Parser options to replace HTML tags with React components
  const options: HTMLReactParserOptions = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.name.toLowerCase() in componentMap) {
        const Component = componentMap[domNode.name.toLowerCase()];
        const attribs = domNode.attribs || {};

        // Define props with specific types
        const props: { [key: string]: any } = { ...attribs };

        // Map class and className to className, preserve className
        if (props.class || props.className) {
          props.className = [props.class, props.className].filter(Boolean).join(' ').trim();
          delete props.class; // Remove class to avoid duplication
          // Do not delete props.className to ensure it's passed to components
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
          console.log('Image props:', props);
        }

        // Handle ImageCarousel and VideoCarousel props
        if (['imagecarousel', 'ImageCarousel', 'videocarousel', 'VideoCarousel'].includes(domNode.name.toLowerCase())) {
          console.log(`${domNode.name} props before rendering:`, props);
        }

        // Handle Link component props
        if (domNode.name.toLowerCase() === 'a' && props.href) {
          props.href = props.href;
        }

        // Safely handle children
        const children = 'children' in domNode && domNode.children
          ? domToReact(domNode.children as DOMNode[], options)
          : undefined;

        console.log(`Rendering component: ${domNode.name}`, props, children);

        return <Component {...props}>{children}</Component>;
      }

      // Log standard HTML elements for debugging
      if (domNode instanceof Element) {
        console.log(`Rendering HTML element: ${domNode.name}`, domNode.attribs);
      }

      // Return undefined to render standard HTML natively
      return undefined;
    },
  };

  // Render with error handling
  try {
    return (
      <div className="relative z-50 w-full min-h-screen bg-gray-50">
        {sanitizedContent ? (
          parse(sanitizedContent, options)
        ) : (
          <div className="text-center text-gray-500 ">No content available.</div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Parsing error:', error);
    return (
      <div className="relative z-50 w-full min-h-screen bg-gray-50">
        <div className="text-center text-red-500">
          Error rendering content: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }
};

export default LandingPostContent;