import React, { useState, useEffect } from 'react';
import { Organization } from './types';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  NewspaperIcon, 
  SparklesIcon, 
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface SiteMapProps {
  organization: Organization;
  session: any;
  onPageSelect?: (url: string) => void;
}

interface SitemapPage {
  url: string;
  lastmod: string;
  priority: number;
  changefreq?: string;
}

interface PageNode {
  name: string;
  path: string;
  url: string;
  priority: number;
  lastmod: string;
  children?: PageNode[];
  type: 'home' | 'static' | 'blog' | 'feature' | 'product';
  level: 1 | 2 | 3;
  category?: string; // Dynamic category based on root path
}

export default function SiteMap({ organization, session, onPageSelect }: SiteMapProps) {
  const [sitemapData, setSitemapData] = useState<PageNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['/']));
  const [stats, setStats] = useState<Record<string, number>>({ total: 0, static: 0, blog: 0, features: 0, products: 0 });

  // Define second-level static pages that can have children
  const SECOND_LEVEL_PAGES = ['/about-us', '/products', '/features', '/blog', '/faq', '/terms', '/support'];

  useEffect(() => {
    fetchSitemapData();
  }, [organization]);

  const fetchSitemapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine the base URL for the selected organization
      const baseUrl = organization.base_url || organization.base_url_local || window.location.origin;
      
      console.log('[SiteMap] Fetching sitemap for organization:', {
        organizationId: organization.id,
        organizationName: organization.name,
        baseUrl
      });

      // Use proxy API to fetch sitemap for this specific organization
      // This avoids CORS issues and ensures we get the right organization's data
      const proxyUrl = `/api/sitemap-proxy?organizationId=${encodeURIComponent(organization.id)}&baseUrl=${encodeURIComponent(baseUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Failed to parse sitemap XML');
      }

      // Extract all URLs from the sitemap
      const urlElements = xmlDoc.querySelectorAll('url');
      const pages: SitemapPage[] = Array.from(urlElements).map(urlEl => {
        const loc = urlEl.querySelector('loc')?.textContent || '';
        const lastmod = urlEl.querySelector('lastmod')?.textContent || new Date().toISOString();
        const priority = parseFloat(urlEl.querySelector('priority')?.textContent || '0.5');
        const changefreq = urlEl.querySelector('changefreq')?.textContent || 'weekly';

        return { url: loc, lastmod, priority, changefreq };
      });

      // Build the tree structure
      const tree = buildPageTree(pages, baseUrl);
      setSitemapData(tree);

      // Set total page count
      setStats({ total: pages.length });

    } catch (err) {
      console.error('Error fetching sitemap:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sitemap');
    } finally {
      setIsLoading(false);
    }
  };

  const categorizePageType = (url: string, baseUrl: string): { type: 'home' | 'static' | 'blog' | 'feature' | 'product', level: 1 | 2 | 3 } => {
    // Extract path from URL
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch {
      // If URL parsing fails, try to extract path manually
      path = url.replace(baseUrl, '');
    }
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remove trailing slash except for root
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Level 1: Home page
    if (path === '/' || path === '') {
      return { type: 'home', level: 1 };
    }
    
    // Level 2: Main static pages
    if (SECOND_LEVEL_PAGES.includes(path)) {
      return { type: 'static', level: 2 };
    }
    
    // Level 3: Blog posts (direct blog articles like /article-name)
    if (path.startsWith('/blog/')) {
      return { type: 'blog', level: 3 };
    }
    
    // Level 3: Features
    if (path.startsWith('/features/')) {
      return { type: 'feature', level: 3 };
    }
    
    // Level 3: Products
    if (path.startsWith('/products/')) {
      return { type: 'product', level: 3 };
    }
    
    // Check if it's a blog post without /blog/ prefix (direct article)
    // These are typically single-level paths like /article-name
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 1 && !SECOND_LEVEL_PAGES.includes(path)) {
      return { type: 'blog', level: 3 };
    }
    
    // Default to static level 2
    return { type: 'static', level: 2 };
  };

  const buildPageTree = (pages: SitemapPage[], baseUrl: string): PageNode[] => {
    // Categorize all pages first
    const categorizedPages = pages.map(page => {
      // Extract path from full URL
      let path = page.url;
      try {
        const urlObj = new URL(page.url);
        path = urlObj.pathname;
      } catch {
        // If URL parsing fails, try to extract path manually
        path = page.url.replace(baseUrl, '');
      }
      
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      // Remove trailing slash except for root
      if (path !== '/' && path.endsWith('/')) {
        path = path.slice(0, -1);
      }

      const { type, level } = categorizePageType(page.url, baseUrl);
      
      // Determine the category based on the root path segment
      let category: string | undefined = undefined;
      const segments = path.split('/').filter(Boolean);
      
      if (segments.length > 0) {
        // For ALL pages (except home), use the first segment as category
        // This allows us to count pages by their top-level section
        category = segments[0];
      }
      
      // Special handling: if it's a blog/feature/product TYPE, 
      // still assign category but we'll handle counting separately
      if (type === 'blog' && !path.startsWith('/blog/') && segments.length === 1) {
        // Direct blog posts without /blog/ prefix should have 'blog' category
        category = 'blog';
      } else if (type === 'feature' && !path.startsWith('/features/')) {
        category = 'features';
      } else if (type === 'product' && !path.startsWith('/products/')) {
        category = 'products';
      }
      
      // Determine the display name
      let name = '';
      if (path === '/' || path === '') {
        name = 'Home';
      } else {
        const segments = path.split('/').filter(Boolean);
        name = segments[segments.length - 1] || path;
        name = name
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      console.log('Page categorized:', { path, type, level, category, name, url: page.url });

      return {
        name,
        path,
        url: page.url,
        priority: page.priority,
        lastmod: page.lastmod,
        type,
        level,
        category,
        children: []
      };
    });

    // Build hierarchical structure based on URL path depth
    const pathMap = new Map<string, PageNode>();
    const nestedPaths = new Set<string>(); // Track which paths are nested under parents
    
    // First pass: create all nodes and store in map
    categorizedPages.forEach(page => {
      pathMap.set(page.path, page);
    });

    // Helper function to determine if a path should use special handling
    const hasSpecialHandling = (path: string): boolean => {
      // Check if it's under /blog/, /features/, or /products/
      return path.startsWith('/blog/') || 
             path.startsWith('/features/') || 
             path.startsWith('/products/');
    };

    // Helper function to find or create parent node
    const findOrCreateParent = (childPath: string, childType: string): string | null => {
      // Special handling for blog posts, features, and products
      if (childPath.startsWith('/blog/')) {
        // Ensure /blog parent exists
        if (!pathMap.has('/blog')) {
          const blogParent: PageNode = {
            name: 'Blog',
            path: '/blog',
            url: baseUrl + '/blog',
            priority: 1.0,
            lastmod: new Date().toISOString(),
            type: 'static',
            level: 2,
            children: []
          };
          pathMap.set('/blog', blogParent);
          console.log('Created /blog parent');
        }
        return '/blog';
      }
      
      if (childPath.startsWith('/features/')) {
        // Ensure /features parent exists
        if (!pathMap.has('/features')) {
          const featuresParent: PageNode = {
            name: 'Features',
            path: '/features',
            url: baseUrl + '/features',
            priority: 1.0,
            lastmod: new Date().toISOString(),
            type: 'static',
            level: 2,
            children: []
          };
          pathMap.set('/features', featuresParent);
          console.log('Created /features parent');
        }
        return '/features';
      }
      
      if (childPath.startsWith('/products/')) {
        // Ensure /products parent exists
        if (!pathMap.has('/products')) {
          const productsParent: PageNode = {
            name: 'Products',
            path: '/products',
            url: baseUrl + '/products',
            priority: 1.0,
            lastmod: new Date().toISOString(),
            type: 'static',
            level: 2,
            children: []
          };
          pathMap.set('/products', productsParent);
          console.log('Created /products parent');
        }
        return '/products';
      }
      
      // Handle direct blog posts (single-level paths that are blog type)
      if (childType === 'blog') {
        if (!pathMap.has('/blog')) {
          const blogParent: PageNode = {
            name: 'Blog',
            path: '/blog',
            url: baseUrl + '/blog',
            priority: 1.0,
            lastmod: new Date().toISOString(),
            type: 'static',
            level: 2,
            children: []
          };
          pathMap.set('/blog', blogParent);
          console.log('Created /blog parent for direct article');
        }
        return '/blog';
      }

      // General hierarchical handling for other paths
      const segments = childPath.split('/').filter(Boolean);
      if (segments.length <= 1) return null; // Top level page
      
      // Get parent path
      segments.pop();
      const parentPath = '/' + segments.join('/');
      
      // If parent exists, return its path
      if (pathMap.has(parentPath)) {
        return parentPath;
      }
      
      // Create virtual parent if it doesn't exist
      const parentName = segments[segments.length - 1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      const virtualParent: PageNode = {
        name: parentName,
        path: parentPath,
        url: baseUrl + parentPath,
        priority: 1.0,
        lastmod: new Date().toISOString(),
        type: 'static',
        level: segments.length === 1 ? 2 : 3,
        children: []
      };
      
      pathMap.set(parentPath, virtualParent);
      console.log('Created virtual parent:', parentPath);
      
      // Recursively ensure parent's parent exists
      const grandParentPath = findOrCreateParent(parentPath, 'static');
      if (grandParentPath) {
        const grandParent = pathMap.get(grandParentPath);
        if (grandParent) {
          if (!grandParent.children) grandParent.children = [];
          if (!grandParent.children.some(c => c.path === parentPath)) {
            grandParent.children.push(virtualParent);
          }
        }
      }
      
      return parentPath;
    };

    // Second pass: build parent-child relationships
    // First, identify which pages will have children (to exclude them from blog auto-grouping)
    const pagesWithChildren = new Set<string>();
    categorizedPages.forEach(page => {
      const segments = page.path.split('/').filter(Boolean);
      if (segments.length > 1) {
        // This page has a potential parent
        const parentSegments = segments.slice(0, -1);
        const parentPath = '/' + parentSegments.join('/');
        pagesWithChildren.add(parentPath);
      }
    });

    // Now build relationships, but don't put pages with children under /blog
    categorizedPages.forEach(page => {
      // If this page has children and was categorized as 'blog', 
      // don't nest it under /blog - keep it at top level
      const hasChildren = pagesWithChildren.has(page.path);
      const shouldSkipBlogNesting = hasChildren && page.type === 'blog';
      
      if (shouldSkipBlogNesting) {
        console.log(`Skipping blog nesting for ${page.path} because it has children`);
        return; // This will be a top-level page
      }
      
      const parentPath = findOrCreateParent(page.path, page.type);
      if (parentPath) {
        nestedPaths.add(page.path); // Mark this page as nested
        const parent = pathMap.get(parentPath);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(page);
          console.log(`Added ${page.path} as child of ${parentPath}`);
        }
      }
    });
    // Recursive function to sort children at all levels
    const sortChildren = (node: PageNode) => {
      if (node.children && node.children.length > 0) {
        // First sort children recursively
        node.children.forEach(sortChildren);
        
        // Then sort current level:
        // 1. Pages with children first (alphabetically)
        // 2. Then pages without children (alphabetically)
        node.children.sort((a, b) => {
          const aHasChildren = (a.children && a.children.length > 0) || false;
          const bHasChildren = (b.children && b.children.length > 0) || false;
          
          if (aHasChildren && !bHasChildren) return -1;
          if (!aHasChildren && bHasChildren) return 1;
          
          return a.name.localeCompare(b.name);
        });
      }
    };

    // Build final tree structure with only top-level nodes
    const tree: PageNode[] = [];
    
    // Add home page (level 1)
    const homePage = pathMap.get('/');
    if (homePage) {
      tree.push(homePage);
    }

    // Add all top-level pages (no parent and not nested)
    pathMap.forEach((page, path) => {
      if (path !== '/' && !nestedPaths.has(path)) {
        const segments = path.split('/').filter(Boolean);
        // Only add if it's a top-level page (single segment) and not already nested
        if (segments.length === 1) {
          tree.push(page);
        }
      }
    });

    // Sort and organize the entire tree
    tree.forEach(sortChildren);
    
    // Sort top level (excluding home)
    const homeNode = tree.shift(); // Remove home temporarily
    tree.sort((a, b) => {
      const aHasChildren = (a.children && a.children.length > 0) || false;
      const bHasChildren = (b.children && b.children.length > 0) || false;
      
      if (aHasChildren && !bHasChildren) return -1;
      if (!aHasChildren && bHasChildren) return 1;
      
      return a.name.localeCompare(b.name);
    });
    if (homeNode) tree.unshift(homeNode); // Add home back at the start

    console.log('Final tree structure:', tree.map(t => ({ 
      path: t.path, 
      level: t.level, 
      childCount: t.children?.length || 0 
    })));

    return tree;
  };

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'home':
        return <HomeIcon className="w-4 h-4" />;
      case 'static':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'blog':
        return <NewspaperIcon className="w-4 h-4" />;
      case 'feature':
        return <SparklesIcon className="w-4 h-4" />;
      case 'product':
        return <ShoppingBagIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 1.0) return 'text-green-600 bg-green-50 border-green-200';
    if (priority >= 0.8) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (priority >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const handlePageClick = (url: string, name: string) => {
    if (onPageSelect) {
      // Update LivePreview on the right side
      onPageSelect(url);
    }
  };

  const renderNode = (node: PageNode, nestingLevel: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    // Calculate left padding based on nesting level (not page.level)
    // Each level adds 24px (1.5rem)
    const paddingLeft = nestingLevel * 24;
    
    // Calculate font weight based on nesting depth
    const fontClass = nestingLevel === 0 ? 'font-bold text-lg' : nestingLevel === 1 ? 'font-semibold' : 'font-normal';

    return (
      <div key={node.path} className="space-y-1">
        <div 
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {/* Expand/Collapse button for pages with children */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.path)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <span className="text-gray-600 font-bold text-sm">−</span>
              ) : (
                <span className="text-gray-600 font-bold text-sm">+</span>
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icon */}
          <div className="flex-shrink-0 text-gray-500">
            {getIconForType(node.type)}
          </div>

          {/* Name and URL */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageClick(node.url, node.name)}
                className={`text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors text-left ${fontClass}`}
                title="Click to preview page"
              >
                {node.name}
              </button>
              {hasChildren && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {node.children!.length}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate" title={node.path}>
              {node.path}
            </div>
          </div>

          {/* Priority badge */}
          <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(node.priority)}`}>
            <SignalIcon className="w-3 h-3 inline mr-1" />
            {node.priority.toFixed(1)}
          </span>

          {/* Last modified */}
          <span className="flex-shrink-0 text-xs text-gray-500 flex items-center gap-1 min-w-[100px]">
            <ClockIcon className="w-3 h-3" />
            {formatDate(node.lastmod)}
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map(child => renderNode(child, nestingLevel + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sitemap...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="text-center py-12">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Sitemap</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchSitemapData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Site Map Tree */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">Site Structure</h2>
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
                  {stats.total} pages
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Visual representation of your site's page hierarchy from sitemap.xml
              </p>
            </div>
            <button
              onClick={fetchSitemapData}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto">
          {sitemapData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No pages found in sitemap
            </div>
          ) : (
            <div className="space-y-1">
              {sitemapData.map(node => renderNode(node))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Home (Level 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Static Page (Level 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <NewspaperIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Blog Post (Level 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Feature (Level 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Product (Level 3)</span>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="text-xs text-gray-600">
              <strong>Hierarchy:</strong>
            </div>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Level 1:</strong> Home page (/) - root of the site</li>
              <li><strong>Level 2:</strong> Main sections (/about-us, /products, /features, /blog, etc.)</li>
              <li><strong>Level 3:</strong> Content pages (blog posts, features, products) - click "+" to expand</li>
            </ul>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <strong>Priority Levels:</strong> Higher priority (1.0) = more important pages for search engines
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
