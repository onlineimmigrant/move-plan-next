/**
 * Formats HTML with proper indentation based on depth
 * @param html - The HTML string to format
 * @param indentType - 'spaces' or 'tabs'
 * @param indentSize - Number of spaces (2 or 4) when indentType is 'spaces'
 * @param lineEnding - 'lf' or 'crlf'
 * @returns Formatted HTML string
 */
export const formatHTML = (
  html: string,
  indentType: 'spaces' | 'tabs' = 'spaces',
  indentSize: 2 | 4 = 2,
  lineEnding: 'lf' | 'crlf' = 'lf'
): string => {
  const tab = indentType === 'tabs' ? '\t' : ' '.repeat(indentSize);
  const newLine = lineEnding === 'crlf' ? '\r\n' : '\n';
  let result = '';
  let indent = 0;

  // Inline elements that shouldn't trigger indentation changes
  const inlineElements = ['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'code', 'small', 'mark', 'del', 'ins', 'sub', 'sup', 'abbr', 'cite', 'kbd', 'var', 'samp', 'q', 'time', 'data'];
  
  // Self-closing elements
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  
  // Block elements that should always be on their own line
  const blockElements = ['div', 'p', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'form', 'fieldset', 'legend', 'blockquote', 'pre', 'address', 'figure', 'figcaption'];

  // Split HTML into tokens (tags and text)
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];

  tokens.forEach((token, index) => {
    if (token.startsWith('<')) {
      // It's a tag
      const isClosing = token.startsWith('</');
      const isSelfClosing = token.endsWith('/>') || selfClosing.some(tag => 
        new RegExp(`<${tag}[\\s>]`, 'i').test(token)
      );
      const tagMatch = token.match(/<\/?([a-zA-Z0-9]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isInline = inlineElements.includes(tagName);
      const isBlock = blockElements.includes(tagName);

      if (isClosing) {
        // Closing tag
        if (isBlock || !isInline) {
          indent = Math.max(0, indent - 1);
          // Add newline before closing tag if it's a block element
          const prevToken = tokens[index - 1];
          const prevIsTag = prevToken && prevToken.startsWith('<');
          if (prevIsTag || isBlock) {
            result += newLine + tab.repeat(indent) + token;
          } else {
            result += token;
          }
        } else {
          result += token;
        }
      } else if (isSelfClosing) {
        // Self-closing tag
        if (isBlock) {
          result += newLine + tab.repeat(indent) + token;
        } else {
          result += token;
        }
      } else {
        // Opening tag
        if (isBlock || !isInline) {
          result += newLine + tab.repeat(indent) + token;
          indent++;
        } else {
          result += token;
        }
      }
    } else {
      // Text content
      const trimmed = token.trim();
      if (trimmed) {
        // Check context to determine if text should be inline or on new line
        const prevToken = tokens[index - 1];
        const nextToken = tokens[index + 1];
        
        const prevIsInlineOpening = prevToken && prevToken.startsWith('<') && !prevToken.startsWith('</') &&
          inlineElements.some(tag => new RegExp(`<${tag}[\\s>]`, 'i').test(prevToken));
        
        const nextIsInlineClosing = nextToken && nextToken.startsWith('</') &&
          inlineElements.some(tag => new RegExp(`</${tag}>`, 'i').test(nextToken));
        
        const prevIsBlockOpening = prevToken && prevToken.startsWith('<') && !prevToken.startsWith('</') &&
          blockElements.some(tag => new RegExp(`<${tag}[\\s>]`, 'i').test(prevToken));
        
        // If text comes after a block opening tag, indent it
        if (prevIsBlockOpening && !prevIsInlineOpening) {
          result += newLine + tab.repeat(indent) + trimmed;
        } else {
          result += trimmed;
        }
      }
    }
  });

  return result.trim();
};
