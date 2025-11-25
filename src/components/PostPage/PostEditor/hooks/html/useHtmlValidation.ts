/**
 * HTML validation hook for the PostEditor
 * Validates HTML structure and provides error reporting
 */

export interface HtmlValidationUtilities {
  validateHtml: () => void;
}

interface UseHtmlValidationProps {
  htmlContent: string;
  setHtmlValidationErrors: (errors: string[]) => void;
  setShowValidationErrors: (show: boolean) => void;
}

/**
 * Validates HTML structure by checking for:
 * - Matching opening/closing tags
 * - Unclosed tags
 * - Improperly nested elements
 * 
 * @example
 * ```tsx
 * const { validateHtml } = useHtmlValidation({
 *   htmlContent,
 *   setHtmlValidationErrors,
 *   setShowValidationErrors
 * });
 * ```
 */
export function useHtmlValidation(props: UseHtmlValidationProps): HtmlValidationUtilities {
  const {
    htmlContent,
    setHtmlValidationErrors,
    setShowValidationErrors,
  } = props;

  const validateHtml = () => {
    const errors: string[] = [];
    const tagStack: { tag: string; position: number }[] = [];
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    // Find all tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(htmlContent)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const position = match.index;
      
      // Skip self-closing tags
      if (selfClosingTags.includes(tagName) || fullTag.endsWith('/>')) {
        continue;
      }
      
      // Closing tag
      if (fullTag.startsWith('</')) {
        if (tagStack.length === 0) {
          errors.push(`Closing tag </${tagName}> has no matching opening tag at position ${position}`);
        } else {
          const lastOpen = tagStack[tagStack.length - 1];
          if (lastOpen.tag === tagName) {
            tagStack.pop();
          } else {
            errors.push(`Expected closing tag </${lastOpen.tag}> but found </${tagName}> at position ${position}`);
          }
        }
      } 
      // Opening tag
      else {
        tagStack.push({ tag: tagName, position });
      }
    }
    
    // Check for unclosed tags
    tagStack.forEach(({ tag, position }) => {
      errors.push(`Unclosed tag <${tag}> at position ${position}`);
    });
    
    setHtmlValidationErrors(errors);
    setShowValidationErrors(true);
    
    // Auto-hide after 3 seconds if no errors
    if (errors.length === 0) {
      setTimeout(() => setShowValidationErrors(false), 3000);
    }
  };

  return { validateHtml };
}
