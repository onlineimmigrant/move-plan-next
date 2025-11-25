export interface HtmlHistoryUtilities {
  undoHtml: () => void;
  redoHtml: () => void;
}

interface UseHtmlHistoryProps {
  htmlHistory: string[];
  htmlHistoryIndex: number;
  setHtmlContent: (content: string) => void;
  setHtmlHistoryIndex: (index: number) => void;
  onContentChange?: (content: string, type: 'html' | 'markdown') => void;
}

export function useHtmlHistory(props: UseHtmlHistoryProps): HtmlHistoryUtilities {
  const {
    htmlHistory,
    htmlHistoryIndex,
    setHtmlContent,
    setHtmlHistoryIndex,
    onContentChange,
  } = props;

  // Undo function
  const undoHtml = () => {
    if (htmlHistoryIndex > 0) {
      const newIndex = htmlHistoryIndex - 1;
      setHtmlHistoryIndex(newIndex);
      const newContent = htmlHistory[newIndex];
      setHtmlContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'html');
      }
    }
  };

  // Redo function
  const redoHtml = () => {
    if (htmlHistoryIndex < htmlHistory.length - 1) {
      const newIndex = htmlHistoryIndex + 1;
      setHtmlHistoryIndex(newIndex);
      const newContent = htmlHistory[newIndex];
      setHtmlContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'html');
      }
    }
  };

  return {
    undoHtml,
    redoHtml,
  };
}
