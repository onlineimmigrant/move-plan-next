import React from 'react';
import { Cog6ToothIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface ResizablePanelsProps {
  children: React.ReactNode;
  previewContent: React.ReactNode;
  leftPanelWidth: number;
  isDragging: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onToggleCollapse: () => void;
}

export default function ResizablePanels({
  children,
  previewContent,
  leftPanelWidth,
  isDragging,
  isCollapsed,
  isMobile,
  containerRef,
  onMouseDown,
  onDoubleClick,
  onToggleCollapse
}: ResizablePanelsProps) {
  return (
    <div className={`modal-panels-container ${isDragging ? 'dragging' : ''}`} ref={containerRef}>
      {/* Collapsed Settings Button (Desktop) */}
      {isCollapsed && !isMobile && (
        <div className="modal-collapsed-btn">
          <button
            onClick={onToggleCollapse}
            className="modal-expand-btn"
            title="Open Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Left Panel - Form (Desktop) */}
      {!isCollapsed && !isMobile && (
        <div 
          className={`modal-left-panel ${isDragging ? 'dragging' : ''}`}
          style={{ 
            width: `${leftPanelWidth}%`,
            willChange: isDragging ? 'width' : 'auto',
            contain: isDragging ? 'layout style' : 'none'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-panel-content" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-panel-header">
              <button
                onClick={onToggleCollapse}
                className="modal-minimize-btn"
                title="Minimize to icon"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            </div>

            <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Resize Handle (Desktop only, when not collapsed) */}
      {!isCollapsed && !isMobile && (
        <div
          className={`modal-resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
          title="Drag to resize panels, double-click to reset"
        >
          <div className="modal-resize-indicator">
            <div className="modal-resize-dot"></div>
          </div>
        </div>
      )}

      {/* Right Panel - Live Preview */}
      <div 
        className={`modal-preview-panel ${isDragging ? 'dragging' : ''}`}
        style={{ 
          width: isCollapsed && !isMobile ? '100%' : 
                 isMobile ? '100%' :
                 `${100 - leftPanelWidth}%`,
          willChange: isDragging ? 'width' : 'auto',
          contain: isDragging ? 'layout style' : 'none'
        }}
      >
        {/* Mobile Settings Toggle Button */}
        {isMobile && !isCollapsed && (
          <div className="modal-mobile-toggle">
            <button
              onClick={onToggleCollapse}
              className="modal-mobile-toggle-btn"
              title="Open Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {previewContent}
      </div>
    </div>
  );
}
