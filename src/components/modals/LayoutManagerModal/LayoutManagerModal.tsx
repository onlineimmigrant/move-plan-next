/**
 * LayoutManagerModal - Modern page layout management
 * Features: Drag-drop, multiple views, keyboard shortcuts, theme integration
 * Matching SiteMapModal design patterns (125/100)
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Square3Stack3DIcon,
  Bars3Icon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useLayoutManager } from './context';
import { 
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  EmptyState,
} from '../_shared';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/context/SettingsContext';
import { useLayoutData, useSectionReorder, useBlogPostData, type BlogPost } from './hooks';
import { SectionGrid, BlogPostGrid } from './components';
import Button from '@/ui/Button';

type TabId = 'list' | 'grid' | 'posts';

type DragEndEvent = any; // from @dnd-kit/core

// Section type labels for better readability
const SECTION_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  brand: 'Brands',
  article_slider: 'Article Slider',
  contact: 'Contact',
  faq: 'FAQ',
  reviews: 'Reviews',
  help_center: 'Help Center',
  real_estate: 'Real Estate',
  pricing_plans: 'Pricing Plans'
};

// Helper to format page name for display
const formatPageName = (page: string) => {
  return page
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
  page: string; // url_page field
  data: any;
}

interface SortableItemProps {
  section: PageSection;
}

function SortableItem({ section }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Type badge colors - matching HeaderEditModal style
  const typeColors = {
    hero: 'bg-purple-100 text-purple-700 border-purple-300',
    template_section: 'bg-blue-100 text-blue-700 border-blue-300',
    heading_section: 'bg-green-100 text-green-700 border-green-300'
  };

  const typeLabels = {
    hero: 'Hero',
    template_section: 'Template',
    heading_section: 'Heading'
  };

  // Get section type for template sections
  const getSectionTypeLabel = () => {
    if (section.type === 'template_section' && section.data?.section_type) {
      return SECTION_TYPE_LABELS[section.data.section_type] || section.data.section_type;
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-shadow ${
        isDragging ? 'shadow-xl border-blue-400 ring-2 ring-blue-200' : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* Preview Link */}
      <a
        href={`/${section.page}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'absolute top-2 right-2',
          'p-1.5 rounded-md',
          'bg-white/80 dark:bg-gray-700/80',
          'border border-gray-200 dark:border-gray-600',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          'hover:bg-gray-50 dark:hover:bg-gray-600',
          'z-10'
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Open page in new tab"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </a>

      {/* Drag Handle - matching HeaderEditModal style */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
        aria-label="Drag to reorder"
        type="button"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      {/* Section Type Badge */}
      <span
        className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${
          typeColors[section.type]
        }`}
      >
        {typeLabels[section.type]}
      </span>

      {/* Section Title and Details */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{section.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">#{section.order + 1}</span>
          {section.page && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-purple-600 font-medium">{formatPageName(section.page)}</span>
            </>
          )}
          {getSectionTypeLabel() && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-blue-600 font-medium">{getSectionTypeLabel()}</span>
            </>
          )}
        </div>
      </div>

      {/* Section Icon */}
      <div className="flex-shrink-0 text-gray-400">
        {section.type === 'hero' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
        {section.type === 'template_section' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        )}
        {section.type === 'heading_section' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function LayoutManagerModal() {
  const {
    isOpen,
    isLoading: contextLoading,
    isSaving,
    organizationId,
    sections: contextSections,
    closeModal,
    fetchPageLayout,
    updateSectionOrder,
    reorderSections
  } = useLayoutManager();

  // Theme integration
  const themeColors = useThemeColors();
  const primaryColorName = themeColors.raw?.primary?.color || 'sky';
  const primary = themeColors.cssVars.primary;
  
  // Settings for organization logo
  const { settings } = useSettings();

  // Use custom hooks
  const {
    sections,
    isLoading,
    error,
    stats,
    loadSections,
    saveSectionOrder
  } = useLayoutData(isOpen, organizationId);

  const {
    posts,
    setPosts,
    isLoading: postsLoading,
    error: postsError,
    sortBy,
    setSortBy,
    savePostOrder
  } = useBlogPostData(organizationId, isOpen);

  const {
    localSections,
    handleDragEnd,
    updateSections,
    resetSections
  } = useSectionReorder(sections);

  // Handle blog post reordering
  const handlePostDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPosts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, [setPosts]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Callback functions
  const handleSave = useCallback(async () => {
    if (!organizationId) return;

    setSaveError(null);
    try {
      // Save both sections and posts
      if (activeTab === 'posts') {
        await savePostOrder(posts);
      } else {
        await saveSectionOrder(localSections);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save page layout:', error);
      setSaveError('Failed to save page layout. Please try again.');
    }
  }, [organizationId, saveSectionOrder, localSections, savePostOrder, posts, activeTab, closeModal]);

  const handleCancel = useCallback(() => {
    // Reset local state
    resetSections(sections);
    setSaveError(null);
    setSearchQuery('');
    closeModal();
  }, [resetSections, sections, closeModal]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
      // Number keys 1-3 for tab switching
      if (['1', '2', '3'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const tabs: TabId[] = ['list', 'grid', 'posts'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, handleCancel]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      loadSections();
    }
  }, [isOpen, organizationId, loadSections]);

  // Update local sections when data changes
  useEffect(() => {
    updateSections(sections);
  }, [sections, updateSections]);

  // Filter sections based on search
  const filteredSections = searchQuery
    ? localSections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.data?.section_type && 
          SECTION_TYPE_LABELS[section.data.section_type]?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : localSections;

  // Group sections by page (url_page field)
  const groupedByPage = filteredSections.reduce((acc, section) => {
    const pageName = section.page || 'home';
    if (!acc[pageName]) {
      acc[pageName] = [];
    }
    acc[pageName].push(section);
    return acc;
  }, {} as Record<string, PageSection[]>);

  // Get unique page names sorted alphabetically
  const pageNames = Object.keys(groupedByPage).sort();

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'posts') {
      return (
        <BlogPostGrid
          posts={posts}
          onDragEnd={handlePostDragEnd}
          primaryColor={primary.base}
          primaryHoverColor={primary.hover}
          organizationLogo={settings?.image}
        />
      );
    }
    
    if (activeTab === 'grid') {
      return <SectionGrid sections={filteredSections} primaryColor={primaryColorName} primaryColorCSS={primary.base} grouped={true} />;
    }

    // List view (default) - drag and drop with grouping by page
    return (
      <div className="space-y-6">
        {pageNames.map((pageName) => (
          <div key={pageName}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primary.base }}></div>
                <h3 className="text-sm font-semibold text-gray-700">
                  {formatPageName(pageName)} Page
                </h3>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {groupedByPage[pageName].length} sections
              </span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groupedByPage[pageName].map((section) => section.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {groupedByPage[pageName].map((section) => (
                    <SortableItem key={section.id} section={section} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
    );
  };

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={handleCancel}
      size="large"
      enableDrag={true}
      enableResize={true}
      ariaLabel="Layout Manager Modal"
      className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl"
    >
      <StandardModalHeader
        title="Layout Manager"
        icon={Square3Stack3DIcon}
        iconColor={primary.base}
        onClose={handleCancel}
        className="bg-white/30 dark:bg-gray-800/30 rounded-t-2xl"
      />

      {/* Tab Navigation Panel - Below Header */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30">
        <button
          onClick={() => setActiveTab('list')}
          onMouseEnter={() => setHoveredCard('list')}
          onMouseLeave={() => setHoveredCard(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-md whitespace-nowrap"
          style={
            activeTab === 'list'
              ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: `0 4px 12px ${primary.base}40`,
                }
              : {
                  backgroundColor: 'transparent',
                  color: hoveredCard === 'list' ? primary.hover : primary.base,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: hoveredCard === 'list' ? `${primary.base}80` : `${primary.base}40`,
                }
          }
        >
          <Bars3Icon className="w-4 h-4" />
          List
          {stats && activeTab === 'list' && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
              {stats.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('grid')}
          onMouseEnter={() => setHoveredCard('grid')}
          onMouseLeave={() => setHoveredCard(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-md whitespace-nowrap"
          style={
            activeTab === 'grid'
              ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: `0 4px 12px ${primary.base}40`,
                }
              : {
                  backgroundColor: 'transparent',
                  color: hoveredCard === 'grid' ? primary.hover : primary.base,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: hoveredCard === 'grid' ? `${primary.base}80` : `${primary.base}40`,
                }
          }
        >
          <Squares2X2Icon className="w-4 h-4" />
          Grid
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          onMouseEnter={() => setHoveredCard('posts')}
          onMouseLeave={() => setHoveredCard(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-md whitespace-nowrap"
          style={
            activeTab === 'posts'
              ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: `0 4px 12px ${primary.base}40`,
                }
              : {
                  backgroundColor: 'transparent',
                  color: hoveredCard === 'posts' ? primary.hover : primary.base,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: hoveredCard === 'posts' ? `${primary.base}80` : `${primary.base}40`,
                }
          }
        >
          <DocumentTextIcon className="w-4 h-4" />
          Posts
          {posts.length > 0 && activeTab === 'posts' && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
              {posts.length}
            </span>
          )}
        </button>

        {/* Sort Dropdown for Posts Tab */}
        {activeTab === 'posts' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            >
              <option value="order">Order</option>
              <option value="subsection">Subsection</option>
              <option value="created_on">Created Date</option>
              <option value="last_modified">Last Modified</option>
            </select>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex-1 flex items-center gap-2 ml-auto max-w-xs">
          {activeTab !== 'posts' && (
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Badge */}
        {activeTab !== 'posts' && stats && (
          <div className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {stats.total} sections
          </div>
        )}
        {activeTab === 'posts' && posts.length > 0 && (
          <div className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {posts.length} posts
          </div>
        )}
      </div>

      <StandardModalBody>
        {/* Content Area */}
        {isLoading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSections.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No sections found" : "No page sections found"}
            message={searchQuery ? "Try a different search term" : "Add sections to your page to manage their layout"}
          />
        ) : (
          renderContent()
        )}

        {/* Error Display */}
        {saveError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saveError}
          </div>
        )}
      </StandardModalBody>

      {/* Custom Footer with Glass Morphism */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/30 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || isLoading || localSections.length === 0}
        >
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>
    </StandardModalContainer>
  );
}

