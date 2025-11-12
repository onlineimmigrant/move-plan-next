'use client';

import React, { useEffect, useState } from 'react';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';
import { useLayoutManager } from './context';
import { 
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  LoadingState,
  EmptyState,
  StatusBadge,
  CountBadge,
  type ModalAction
} from '../_shared';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

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

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'heading_section';
  title: string;
  order: number;
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
      className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-shadow ${
        isDragging ? 'shadow-xl border-blue-400 ring-2 ring-blue-200' : 'shadow-sm hover:shadow-md'
      }`}
    >
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
    isLoading,
    isSaving,
    organizationId,
    sections,
    closeModal,
    fetchPageLayout,
    updateSectionOrder,
    reorderSections
  } = useLayoutManager();

  const [localSections, setLocalSections] = useState<PageSection[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchPageLayout(organizationId);
    }
  }, [isOpen, organizationId, fetchPageLayout]);

  // Sync local state with context
  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!organizationId) return;

    setSaveError(null);
    try {
      await updateSectionOrder(organizationId, localSections);
      closeModal();
    } catch (error) {
      console.error('Failed to save page layout:', error);
      setSaveError('Failed to save page layout. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset local state
    setLocalSections(sections);
    setSaveError(null);
    closeModal();
  };

  // Calculate section counts for badge display
  const sectionCounts = {
    hero: localSections.filter((s) => s.type === 'hero').length,
    template: localSections.filter((s) => s.type === 'template_section').length,
    heading: localSections.filter((s) => s.type === 'heading_section').length,
  };

  const primaryAction: ModalAction = {
    label: isSaving ? 'Saving...' : 'Save Layout',
    onClick: handleSave,
    variant: 'primary',
    loading: isSaving,
    disabled: isSaving || isLoading || localSections.length === 0,
  };

  const secondaryAction: ModalAction = {
    label: 'Cancel',
    onClick: handleCancel,
    variant: 'secondary',
    disabled: isSaving,
  };

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={handleCancel}
      size="large"
      enableDrag={true}
      enableResize={true}
      ariaLabel="Layout Manager Modal"
    >
      <StandardModalHeader
        title="Manage Page Layout"
        subtitle="Organize your page sections"
        icon={Square3Stack3DIcon}
        iconColor="text-blue-500"
        onClose={handleCancel}
      />

      <StandardModalBody>
        {/* Info Banner */}
        <div className="mb-4 px-4 py-3 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white">
          <p className="text-sm text-sky-900 font-medium mb-1">
            Organize your page sections
          </p>
          <p className="text-xs text-sky-800">
            Drag and drop sections to reorder them. Changes are reflected immediately after saving.
          </p>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <LoadingState 
            message="Loading page sections..." 
            size="lg"
          />
        ) : localSections.length === 0 ? (
          <EmptyState
            title="No page sections found"
            message="Add sections to your page to manage their layout"
          />
        ) : (
          <>
            {/* Section Type Summary */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Sections:</span>
              <StatusBadge 
                text={`${sectionCounts.hero} Hero`} 
                variant="info"
                dot
              />
              <StatusBadge 
                text={`${sectionCounts.template} Template`} 
                variant="default"
                dot
              />
              <StatusBadge 
                text={`${sectionCounts.heading} Heading`} 
                variant="success"
                dot
              />
              <div className="ml-auto">
                <CountBadge 
                  count={localSections.length} 
                  variant="secondary"
                />
              </div>
            </div>

            {/* Drag and Drop List */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localSections.map((section) => section.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localSections.map((section) => (
                    <SortableItem key={section.id} section={section} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

        {/* Error Display */}
        {saveError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saveError}
          </div>
        )}
      </StandardModalBody>

      <StandardModalFooter
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        align="right"
      />
    </StandardModalContainer>
  );
}
