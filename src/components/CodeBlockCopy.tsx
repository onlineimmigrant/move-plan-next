'use client';

import { useEffect } from 'react';

export default function CodeBlockCopy() {
  useEffect(() => {
    // Wait for content to be fully rendered
    const timeoutId = setTimeout(() => {
      // Find all code blocks in the post content
      const codeBlocks = document.querySelectorAll('.prose pre, article pre, [class*="post"] pre, .post-content pre, .ProseMirror pre');
      
      // console.log('Found code blocks:', codeBlocks.length);
      
      codeBlocks.forEach((block) => {
        // Skip if button already exists
        if (block.querySelector('.copy-button')) return;
        
        // Create copy button
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.setAttribute('aria-label', 'Copy code');
        button.innerHTML = `
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        `;
        
        // Add click handler
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const code = block.querySelector('code');
          if (!code) return;
          
          try {
            await navigator.clipboard.writeText(code.textContent || '');
            
            // Show success state
            button.classList.add('copied');
            button.innerHTML = `
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            `;
            
            // Reset after 2 seconds
            setTimeout(() => {
              button.classList.remove('copied');
              button.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              `;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy code:', err);
          }
        });
        
        // Add button to code block
        if (block instanceof HTMLElement) {
          block.style.position = 'relative';
          block.appendChild(button);
        }
      });
    }, 500); // Wait 500ms for content to render
    
    return () => clearTimeout(timeoutId);
  }, []);

  return null; // This component only adds functionality, no visual output
}
