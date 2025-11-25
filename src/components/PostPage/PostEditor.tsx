'use client';

import React, { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { htmlToMarkdown, markdownToHtml, cleanHtml, unescapeMarkdown } from './PostEditor/utils/converters';
import './PostEditor.css';

// Import extracted modules
import { formatHTML, applyStyle, toggleHighlight } from './PostEditor/utils';
import type { EditorMode, PostEditorProps } from './PostEditor/types';
import { getEditorModeLabel } from './PostEditor/types';
import { 
  useLinkHandlers, 
  useImageHandlers, 
  useVideoHandlers, 
  useCarouselHandlers, 
  useSaveHandler, 
  useFindReplaceHandlers, 
  useHtmlEditorUtilities, 
  useEditorModeHandlers,
  useEditorConfig,
  usePostEditorState,
  useEditorKeyboardShortcuts,
  useTouchScrolling
} from './PostEditor/hooks';
import { 
  EditorModeToggle, 
  EditorModals, 
  MarkdownEditorView, 
  TableSubmenu,
  VisualEditorToolbar,
  HtmlEditorToolbar,
  HtmlEditorView,
  CarouselControls,
  VideoControls
} from './PostEditor/components';

const PostEditor: React.FC<PostEditorProps> = ({ 
  onSave, 
  initialContent,
  initialContentType,
  onContentChange, 
  onCodeViewChange,
  onEditorChange,
  postType = 'default',
  initialCodeView,
  mediaConfig,
  onMediaConfigChange
}) => {
  const themeColors = useThemeColors();
  
  // Initialize editor configuration
  const editor = useEditorConfig({
    initialContent,
    onContentChange,
  });
  
  // Initialize all state
  const {
    showTableSubmenu,
    setShowTableSubmenu,
    showFloatingToolbar,
    setShowFloatingToolbar,
    htmlToolbarCollapsed,
    setHtmlToolbarCollapsed,
    autoSaveIndicator,
    setAutoSaveIndicator,
    editorMode,
    setEditorMode,
    hasSetInitialMode,
    isCodeView,
    htmlContent,
    setHtmlContent,
    markdownContent,
    setMarkdownContent,
    showImageGallery,
    setShowImageGallery,
    showVideoGallery,
    setShowVideoGallery,
    showCarouselGallery,
    setShowCarouselGallery,
    showCarouselImagePicker,
    setShowCarouselImagePicker,
    carouselMediaItems,
    setCarouselMediaItems,
    showLinkModal,
    setShowLinkModal,
    currentLinkUrl,
    setCurrentLinkUrl,
    htmlEditorBgColor,
    setHtmlEditorBgColor,
    copySuccess,
    setCopySuccess,
    showContentTypeModal,
    setShowContentTypeModal,
    pendingContentType,
    setPendingContentType,
    htmlValidationErrors,
    setHtmlValidationErrors,
    showValidationErrors,
    setShowValidationErrors,
    htmlHistory,
    setHtmlHistory,
    htmlHistoryIndex,
    setHtmlHistoryIndex,
    showFindReplace,
    setShowFindReplace,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    caseSensitive,
    setCaseSensitive,
    currentMatchIndex,
    setCurrentMatchIndex,
    totalMatches,
    setTotalMatches,
    showBeautifySettings,
    setShowBeautifySettings,
    indentType,
    setIndentType,
    indentSize,
    setIndentSize,
    lineEnding,
    setLineEnding,
    syntaxHighlighting,
    setSyntaxHighlighting,
    lineNumbersRef,
    textareaRef,
    highlightLayerRef,
    initialContentRef,
  } = usePostEditorState({
    initialContentType,
    initialCodeView,
    postType,
  });

  // Wrapper for formatHTML that converts uppercase lineEnding to lowercase
  const formatHTMLWrapper = (html: string, indentType: 'spaces' | 'tabs', indentSize: number, lineEndingType: 'LF' | 'CRLF') => {
    const lowerCaseLineEnding = lineEndingType === 'CRLF' ? 'crlf' : 'lf';
    return formatHTML(html, indentType, indentSize as 2 | 4, lowerCaseLineEnding);
  };

  // Link handlers hook
  const { setLink, handleLinkSave, handleUnlink } = useLinkHandlers(
    editor,
    setShowLinkModal,
    setCurrentLinkUrl
  );

  // Image handlers hook
  const { addImage, handleImageSelect, setImageAlignment, setImageSize } = useImageHandlers(
    editor,
    editorMode,
    markdownContent,
    setMarkdownContent,
    setShowLinkModal,
    setShowImageGallery,
    onContentChange
  );

  // Video handlers hook
  const { addVideo, handleVideoSelect, setVideoAlignment, setVideoSize } = useVideoHandlers(
    editor,
    editorMode,
    markdownContent,
    setMarkdownContent,
    setShowVideoGallery,
    onContentChange
  );

  // Carousel handlers hook
  const { 
    addMediaCarousel, 
    handleCarouselMediaSelect, 
    finishCarouselCreation,
    removeCarouselMediaItem,
    setCarouselAlignment, 
    setCarouselSize 
  } = useCarouselHandlers(
    editor,
    editorMode,
    carouselMediaItems,
    setCarouselMediaItems,
    setShowCarouselGallery,
    setShowCarouselImagePicker
  );

  // Save handler hook
  const { handleSave } = useSaveHandler(
    editor,
    editorMode,
    markdownContent,
    htmlContent,
    indentType,
    indentSize,
    lineEnding,
    onContentChange
  );

  // Find & Replace handlers hook
  const { findMatches, findNext, findPrevious, replaceCurrent, replaceAll } = useFindReplaceHandlers(
    htmlContent,
    findText,
    replaceText,
    caseSensitive,
    showFindReplace,
    currentMatchIndex,
    setHtmlContent,
    setTotalMatches,
    setCurrentMatchIndex,
    textareaRef,
    lineNumbersRef,
    onContentChange
  );

  // HTML Editor utilities hook
  const { 
    copyToClipboard, 
    undoHtml, 
    redoHtml, 
    validateHtml, 
    highlightHtml, 
    toggleComment, 
    handleKeyDown,
    formatHtmlContent,
    minifyHtmlContent
  } = useHtmlEditorUtilities({
    htmlContent,
    htmlHistory,
    htmlHistoryIndex,
    htmlEditorBgColor,
    indentType,
    indentSize,
    lineEnding,
    setHtmlContent,
    setHtmlHistory,
    setHtmlHistoryIndex,
    setCopySuccess,
    setHtmlValidationErrors,
    setShowValidationErrors,
    textareaRef,
    onContentChange,
    formatHTML: formatHTMLWrapper,
  });

  // Editor mode handlers hook
  const {
    switchEditorMode,
    toggleCodeView,
    handleContentTypeChange,
    confirmContentTypeChange,
    cancelContentTypeChange
  } = useEditorModeHandlers({
    editor,
    editorMode,
    postType,
    htmlContent,
    markdownContent,
    indentType,
    indentSize,
    lineEnding,
    setEditorMode,
    setHtmlContent,
    setMarkdownContent,
    setPendingContentType,
    setShowContentTypeModal,
    onCodeViewChange,
    onContentChange,
    markdownToHtml,
    htmlToMarkdown,
    cleanHtml,
    unescapeMarkdown,
    formatHTML: formatHTMLWrapper,
  });

  // Update history when HTML content changes
  // All HTML editor utility functions now provided by useHtmlEditorUtilities hook
  // All editor mode handlers now provided by useEditorModeHandlers hook

  // Update history when HTML content changes
  useEffect(() => {
    if (isCodeView && htmlContent !== htmlHistory[htmlHistoryIndex]) {
      // Add to history
      const newHistory = htmlHistory.slice(0, htmlHistoryIndex + 1);
      newHistory.push(htmlContent);
      
      // Keep only last 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHtmlHistoryIndex(htmlHistoryIndex + 1);
      }
      
      setHtmlHistory(newHistory);
    }
  }, [htmlContent, isCodeView]);

  // Keyboard shortcuts
  useEditorKeyboardShortcuts({
    editor,
    isCodeView,
    showFindReplace,
    setShowFindReplace,
    handleSave,
    undoHtml,
    redoHtml,
  });

  // Track text selection (keeping for future use if needed)
  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateSelection = () => {
      const { from, to, empty } = editor.state.selection;
      // Floating toolbar removed - keeping selection tracking for other features
    };

    editor.on('selectionUpdate', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor]);

  // Update editor content when initialContent prop changes
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentContent = editor.getHTML();
      const newContent = initialContent || '<p>Start writing your post here...</p>';
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent);
      }
    }
  }, [editor, initialContent]);

  // Initialize content based on content type (only on mount or when initialContent actually changes)
  useEffect(() => {
    if (initialContent && initialContentType && initialContent !== initialContentRef.current) {
      initialContentRef.current = initialContent;
      
      if (initialContentType === 'markdown') {
        const cleanedMarkdown = unescapeMarkdown(initialContent);
        setMarkdownContent(cleanedMarkdown);
        
        if (editor && editorMode === 'visual') {
          const htmlFromMarkdown = markdownToHtml(cleanedMarkdown);
          editor.commands.setContent(htmlFromMarkdown);
        }
      } else {
        setHtmlContent(initialContent);
        if (editor && editorMode === 'visual') {
          editor.commands.setContent(initialContent);
        }
      }
    }
  }, [initialContent, initialContentType, editor, editorMode]);

  // Touch scrolling handler for edit mode
  useTouchScrolling(editor);

  if (!editor) return null;

  // Wrapper functions for style utilities with editor pre-applied
  const applyStyleWrapper = (tag: string) => applyStyle(editor, tag);
  const toggleHighlightWrapper = () => toggleHighlight(editor);

  // All editor mode switching functions provided by useEditorModeHandlers hook

  return (
    <div className="post-editor-container">
      <style jsx>{`
        :global(.editor-link) {
          color: ${themeColors.cssVars.primary.base};
          text-decoration: underline;
        }
        :global(.editor-link:hover) {
          opacity: 0.8;
        }
      `}</style>
      <div className="post-editor text-gray-600">
        {/* Editor Mode Toggle Bar - Extracted Component */}
        <EditorModeToggle
          editorMode={editorMode as EditorMode}
          postType={postType}
          initialContentType={initialContentType}
          autoSaveIndicator={autoSaveIndicator}
          switchEditorMode={switchEditorMode}
          handleContentTypeChange={handleContentTypeChange}
        />

        {/* Visual Editor Toolbar - Extracted Component */}
        {(editorMode as EditorMode) === 'visual' && editor && (
          <VisualEditorToolbar
            editor={editor}
            applyStyle={applyStyleWrapper}
            setLink={setLink}
            handleUnlink={handleUnlink}
            addImage={addImage}
            addVideo={addVideo}
            addMediaCarousel={addMediaCarousel}
            toggleHighlight={toggleHighlightWrapper}
            setShowTableSubmenu={setShowTableSubmenu}
            showTableSubmenu={showTableSubmenu}
          />
        )}

        {/* HTML Editor Toolbar - Still needs extraction */}
        {isCodeView && (
          <HtmlEditorToolbar
            htmlContent={htmlContent}
            htmlHistoryIndex={htmlHistoryIndex}
            htmlHistory={htmlHistory}
            htmlEditorBgColor={htmlEditorBgColor}
            syntaxHighlighting={syntaxHighlighting}
            copySuccess={copySuccess}
            showFindReplace={showFindReplace}
            showBeautifySettings={showBeautifySettings}
            indentType={indentType}
            indentSize={indentSize}
            lineEnding={lineEnding}
            editorMode={editorMode}
            postType={postType}
            setHtmlEditorBgColor={setHtmlEditorBgColor}
            setSyntaxHighlighting={setSyntaxHighlighting}
            setShowFindReplace={setShowFindReplace}
            setShowBeautifySettings={setShowBeautifySettings}
            setIndentType={setIndentType}
            setIndentSize={setIndentSize}
            setLineEnding={setLineEnding}
            toggleComment={toggleComment}
            formatHtmlContent={formatHtmlContent}
            minifyHtmlContent={minifyHtmlContent}
            undoHtml={undoHtml}
            redoHtml={redoHtml}
            copyToClipboard={copyToClipboard}
            validateHtml={validateHtml}
            toggleCodeView={toggleCodeView}
            getEditorModeLabel={getEditorModeLabel}
          />
        )}

        {/* Table submenu - Extracted Component */}
        {(editorMode as EditorMode) === 'visual' && showTableSubmenu && editor && (
          <TableSubmenu
            editor={editor}
            applyStyle={applyStyleWrapper}
          />
        )}

        {/* Carousel Controls - Extracted Component */}
        {(editorMode as EditorMode) === 'visual' && editor?.isActive('mediaCarousel') && (
          <CarouselControls
            setCarouselAlignment={setCarouselAlignment}
            setCarouselSize={setCarouselSize}
          />
        )}

        {/* Video Controls - Extracted Component */}
        {(editorMode as EditorMode) === 'visual' && editor && (
          <VideoControls
            editor={editor}
            setVideoAlignment={setVideoAlignment}
            setVideoSize={setVideoSize}
          />
        )}

        {/* All Modals - Extracted Component */}
        <EditorModals
          showImageGallery={showImageGallery}
          showVideoGallery={showVideoGallery}
          showCarouselGallery={showCarouselGallery}
          showCarouselImagePicker={showCarouselImagePicker}
          showLinkModal={showLinkModal}
          showContentTypeModal={showContentTypeModal}
          carouselMediaItems={carouselMediaItems}
          currentLinkUrl={currentLinkUrl}
          initialContentType={initialContentType || 'html'}
          pendingContentType={pendingContentType}
          themeColors={themeColors}
          setShowImageGallery={setShowImageGallery}
          setShowVideoGallery={setShowVideoGallery}
          setShowCarouselGallery={setShowCarouselGallery}
          setShowCarouselImagePicker={setShowCarouselImagePicker}
          setShowLinkModal={setShowLinkModal}
          setCarouselMediaItems={setCarouselMediaItems}
          handleImageSelect={handleImageSelect}
          handleVideoSelect={handleVideoSelect}
          handleCarouselMediaSelect={handleCarouselMediaSelect}
          handleLinkSave={handleLinkSave}
          handleUnlink={handleUnlink}
          removeCarouselMediaItem={removeCarouselMediaItem}
          finishCarouselCreation={finishCarouselCreation}
          cancelContentTypeChange={cancelContentTypeChange}
          confirmContentTypeChange={confirmContentTypeChange}
        />

        {/* Editor Content */}
        <div className="relative">
          {isCodeView ? (
            <HtmlEditorView
              htmlContent={htmlContent}
              htmlEditorBgColor={htmlEditorBgColor}
              syntaxHighlighting={syntaxHighlighting}
              showFindReplace={showFindReplace}
              findText={findText}
              replaceText={replaceText}
              currentMatchIndex={currentMatchIndex}
              totalMatches={totalMatches}
              caseSensitive={caseSensitive}
              validationErrors={htmlValidationErrors}
              showValidationErrors={showValidationErrors}
              textareaRef={textareaRef}
              highlightLayerRef={highlightLayerRef}
              lineNumbersRef={lineNumbersRef}
              setHtmlContent={setHtmlContent}
              setShowFindReplace={setShowFindReplace}
              setFindText={setFindText}
              setReplaceText={setReplaceText}
              setCurrentMatchIndex={setCurrentMatchIndex}
              setCaseSensitive={setCaseSensitive}
              handleKeyDown={handleKeyDown}
              findNext={findNext}
              findPrevious={findPrevious}
              replaceCurrent={replaceCurrent}
              replaceAll={replaceAll}
              highlightHtml={highlightHtml}
              onContentChange={onContentChange}
              onEditorChange={onEditorChange}
              setShowValidationErrors={setShowValidationErrors}
            />
          ) : editorMode === 'markdown' ? (
            <MarkdownEditorView
              markdownContent={markdownContent}
              setMarkdownContent={setMarkdownContent}
              setShowImageGallery={setShowImageGallery}
              onContentChange={onContentChange}
              onEditorChange={onEditorChange}
            />
          ) : (
            <EditorContent
              editor={editor}
              className="prose prose-lg max-w-none p-6 min-h-[500px] focus:outline-none"
            />
          )}
        </div>

        {/* Modals already rendered above */}
      </div>
    </div>
  );
};

export default PostEditor;