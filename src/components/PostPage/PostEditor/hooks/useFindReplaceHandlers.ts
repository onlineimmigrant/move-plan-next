import { useState, useEffect, RefObject } from 'react';

export interface FindReplaceHandlers {
  findMatches: (text: string) => number[];
  findNext: () => void;
  findPrevious: () => void;
  replaceCurrent: () => void;
  replaceAll: () => void;
}

export function useFindReplaceHandlers(
  htmlContent: string,
  findText: string,
  replaceText: string,
  caseSensitive: boolean,
  showFindReplace: boolean,
  currentMatchIndex: number,
  setHtmlContent: (content: string) => void,
  setTotalMatches: (count: number) => void,
  setCurrentMatchIndex: (index: number) => void,
  textareaRef: RefObject<HTMLTextAreaElement>,
  lineNumbersRef: RefObject<HTMLDivElement>,
  onContentChange?: (content: string, type: 'html' | 'markdown') => void
): FindReplaceHandlers {
  // Helper function to escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const findMatches = (text: string) => {
    if (!text) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return [];
    }
    
    const content = htmlContent;
    const matches: number[] = [];
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchContent = caseSensitive ? content : content.toLowerCase();
    
    let index = 0;
    while (index < searchContent.length) {
      const foundIndex = searchContent.indexOf(searchText, index);
      if (foundIndex === -1) break;
      matches.push(foundIndex);
      index = foundIndex + 1;
    }
    
    setTotalMatches(matches.length);
    return matches;
  };

  // Find next match
  const findNext = () => {
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    
    // Highlight and scroll to match
    if (textareaRef.current) {
      const start = matches[nextIndex];
      const end = start + findText.length;
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      
      // Calculate the line number and scroll position
      const beforeMatch = htmlContent.substring(0, start);
      const lineNumber = beforeMatch.split('\n').length;
      const lineHeight = 1.8 * 13; // Based on line-height: 1.8 and font-size: 13px
      const scrollPosition = (lineNumber - 3) * lineHeight; // Show match with some context
      
      // Scroll both the textarea's parent container and line numbers
      const container = textareaRef.current.parentElement?.parentElement;
      if (container) {
        container.scrollTop = Math.max(0, scrollPosition);
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }
    }
  };

  // Find previous match
  const findPrevious = () => {
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const prevIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    
    // Highlight and scroll to match
    if (textareaRef.current) {
      const start = matches[prevIndex];
      const end = start + findText.length;
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      
      // Calculate the line number and scroll position
      const beforeMatch = htmlContent.substring(0, start);
      const lineNumber = beforeMatch.split('\n').length;
      const lineHeight = 1.8 * 13; // Based on line-height: 1.8 and font-size: 13px
      const scrollPosition = (lineNumber - 3) * lineHeight; // Show match with some context
      
      // Scroll both the textarea's parent container and line numbers
      const container = textareaRef.current.parentElement?.parentElement;
      if (container) {
        container.scrollTop = Math.max(0, scrollPosition);
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }
    }
  };

  // Replace current match
  const replaceCurrent = () => {
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const start = matches[currentMatchIndex];
    const end = start + findText.length;
    
    const newContent = 
      htmlContent.substring(0, start) + 
      replaceText + 
      htmlContent.substring(end);
    
    setHtmlContent(newContent);
    if (onContentChange) {
      onContentChange(newContent, 'html');
    }
    
    // Move to next match
    setTimeout(() => findNext(), 50);
  };

  // Replace all matches
  const replaceAll = () => {
    if (!findText) return;
    
    const searchText = caseSensitive ? findText : findText.toLowerCase();
    const content = caseSensitive ? htmlContent : htmlContent.toLowerCase();
    
    // Count matches first
    const count = (content.match(new RegExp(escapeRegExp(searchText), 'g')) || []).length;
    
    if (count === 0) return;
    
    // Perform replacement
    let newContent = htmlContent;
    if (caseSensitive) {
      newContent = htmlContent.split(findText).join(replaceText);
    } else {
      // Case-insensitive replacement
      const regex = new RegExp(escapeRegExp(findText), 'gi');
      newContent = htmlContent.replace(regex, replaceText);
    }
    
    setHtmlContent(newContent);
    if (onContentChange) {
      onContentChange(newContent, 'html');
    }
    
    setTotalMatches(0);
    setCurrentMatchIndex(0);
  };

  return {
    findMatches,
    findNext,
    findPrevious,
    replaceCurrent,
    replaceAll,
  };
}
