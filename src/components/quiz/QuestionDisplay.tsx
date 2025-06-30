import React, { useState, useRef, useEffect } from 'react';
import parse from 'html-react-parser';

interface QuestionDisplayProps {
  questionText: string;
  correctAnswerCount: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questionText, correctAnswerCount }) => {
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const questionRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure button stays within viewport
  const constrainToViewport = (top: number, left: number) => {
    const buttonWidth = 100; // Approximate button width
    const buttonHeight = 28; // Approximate button height
    const maxX = window.innerWidth - buttonWidth - 10;
    const maxY = window.innerHeight - buttonHeight - 10;

    return {
      top: Math.min(Math.max(top, 10), maxY),
      left: Math.min(Math.max(left, 10), maxX),
    };
  };

  // Handle text selection
  const handleTextSelection = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    const selection = window.getSelection();
    const selectedText = selection?.toString();

    console.log('handleTextSelection: Selected text:', selectedText); // Debug log

    if (selectedText && selectedText.length > 0) {
      let clientX: number, clientY: number;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e instanceof TouchEvent && e.changedTouches?.[0]) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        const rect = questionRef.current?.getBoundingClientRect();
        if (!rect) {
          console.log('handleTextSelection: No valid rect or cursor data');
          setIsAddButtonVisible(false);
          return;
        }
        clientX = rect.left;
        clientY = rect.top;
      }

      console.log('handleTextSelection: ClientX:', clientX, 'ClientY:', clientY);

      const { top, left } = constrainToViewport(
        clientY + window.scrollY + 8,
        clientX + window.scrollX + 8
      );

      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setButtonPosition({ top, left });
      setIsAddButtonVisible(true);
    } else {
      console.log('handleTextSelection: No selected text');
      // Delay hiding to stabilize during fast selections
      hideTimeoutRef.current = setTimeout(() => {
        setIsAddButtonVisible(false);
      }, 500); // Increased to 500ms
    }
  };

  // Dispatch custom event to add text to ChatWidget
  const handleAddToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection?.toString();
    if (selectedText) {
      console.log('handleAddToChat: Adding text:', selectedText);
      const event = new CustomEvent('addToChat', { detail: selectedText });
      window.dispatchEvent(event);
      setIsAddButtonVisible(false);
      // Keep selection active
      // window.getSelection()?.removeAllRanges();
    }
  };

  // Monitor selection changes and clicks
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;

    const handleSelectionChange = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString();
        console.log('selectionchange: Selected text:', selectedText);
        if (!selectedText) {
          hideTimeoutRef.current = setTimeout(() => {
            setIsAddButtonVisible(false);
          }, 500); // Increased to 500ms
        } else {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
          }
          setIsAddButtonVisible(true);
        }
      }, 150); // Increased debounce delay
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (questionRef.current && !questionRef.current.contains(e.target as Node)) {
        console.log('handleClickOutside: Hiding add button');
        hideTimeoutRef.current = setTimeout(() => {
          setIsAddButtonVisible(false);
        }, 500); // Increased to 500ms
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('click', handleClickOutside);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={questionRef}
        className="text-sm sm:text-base font-semibold text-gray-800 leading-relaxed select-text"
        style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {parse(questionText)}
      </div>
      {correctAnswerCount > 1 && (
        <span className="flex justify-end text-sm font-semibold text-sky-600">
          Select {correctAnswerCount}:
        </span>
      )}
      {isAddButtonVisible && (
        <button
          onClick={handleAddToChat}
          className="absolute bg-gray-100 border border-gray-300 text-gray-600 text-xs font-medium px-2 py-1 rounded shadow-sm hover:bg-gray-200 focus:outline-none"
          style={{
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            zIndex: 1000,
          }}
          aria-label="Add selected text to chat"
        >
          Add to Chat
        </button>
      )}
    </div>
  );
};

export default QuestionDisplay;