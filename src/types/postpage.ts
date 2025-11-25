/**
 * PostPage Type Definitions
 * 
 * Centralized type definitions for PostPage components.
 * Ensures type safety and consistency across the PostPage architecture.
 */

/**
 * Table of Contents Item
 */
export interface TOCItem {
  /** Heading level (2-6) */
  level: number;
  /** Heading text content */
  text: string;
  /** DOM element ID for scrolling */
  id: string;
  /** Nested child headings */
  children?: TOCItem[];
}

/**
 * Article in a document set
 */
export interface Article {
  /** Unique article identifier */
  id: string;
  /** Article title */
  title: string;
  /** URL slug */
  slug: string;
  /** Display order in document set */
  order: number;
  /** Table of contents items */
  toc: TOCItem[];
}

/**
 * Document Set Structure
 */
export interface DocumentSet {
  /** Document set identifier */
  set: string;
  /** Document set title */
  title: string;
  /** Whether to show article numbers */
  is_numbered?: boolean;
  /** Articles in the set */
  articles: Article[];
}

/**
 * Post Type
 */
export type PostType = 'default' | 'landing' | 'doc_set';

/**
 * Post Metadata
 */
export interface PostMetadata {
  title: string;
  description?: string;
  featured_image?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  category?: string;
}

/**
 * Post Data
 */
export interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  content_type?: 'markdown' | 'html';
  metadata?: PostMetadata;
  featured_image?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Visibility State
 */
export interface VisibilityState {
  /** Whether to show the sidebar TOC */
  showTOC: boolean;
  /** Whether to show the Master TOC */
  showMasterTOC: boolean;
  /** Current post type */
  postType: PostType;
}

/**
 * Reading Progress Data
 */
export interface ReadingProgressData {
  /** Scroll progress percentage (0-100) */
  progress: number;
  /** Estimated reading time in minutes */
  readingTime: number;
  /** Whether reading is complete (≥95%) */
  isComplete: boolean;
  /** Mark article as complete */
  markComplete: () => void;
  /** Reset progress */
  resetProgress: () => void;
}

/**
 * Stored Reading Progress
 */
export interface StoredReadingProgress {
  /** Article slug */
  slug: string;
  /** Progress percentage */
  progress: number;
  /** Last scroll position */
  lastPosition: number;
  /** Total document height */
  totalHeight: number;
  /** Reading time in minutes */
  readingTime: number;
  /** Last read timestamp (ISO string) */
  lastRead: string;
}

/**
 * Web Vitals Metrics
 */
export interface WebVitalsMetrics {
  /** Largest Contentful Paint (ms) */
  LCP?: number;
  /** Interaction to Next Paint (ms) */
  INP?: number;
  /** Cumulative Layout Shift (score) */
  CLS?: number;
  /** First Contentful Paint (ms) */
  FCP?: number;
  /** Time to First Byte (ms) */
  TTFB?: number;
}

/**
 * Performance Status
 */
export type PerformanceStatus = 'good' | 'needs-improvement' | 'poor';

/**
 * Type guard: Check if value is a valid TOCItem
 */
export function isTOCItem(value: unknown): value is TOCItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.level === 'number' &&
    typeof item.text === 'string' &&
    typeof item.id === 'string' &&
    (item.children === undefined || Array.isArray(item.children))
  );
}

/**
 * Type guard: Check if value is a valid Article
 */
export function isArticle(value: unknown): value is Article {
  if (typeof value !== 'object' || value === null) return false;
  const article = value as Record<string, unknown>;
  return (
    typeof article.id === 'string' &&
    typeof article.title === 'string' &&
    typeof article.slug === 'string' &&
    typeof article.order === 'number' &&
    Array.isArray(article.toc)
  );
}

/**
 * Type guard: Check if value is a valid DocumentSet
 */
export function isDocumentSet(value: unknown): value is DocumentSet {
  if (typeof value !== 'object' || value === null) return false;
  const set = value as Record<string, unknown>;
  return (
    typeof set.set === 'string' &&
    typeof set.title === 'string' &&
    Array.isArray(set.articles)
  );
}

/**
 * Type guard: Check if value is a valid PostType
 */
export function isPostType(value: unknown): value is PostType {
  return value === 'default' || value === 'landing' || value === 'doc_set';
}
