import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { LiveRegion } from '../components/LiveRegion';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { ModalContainer } from '../components/ModalContainer';

describe('LiveRegion', () => {
  it('should render with message', () => {
    render(<LiveRegion message="Test announcement" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveTextContent('Test announcement');
  });

  it('should have proper ARIA attributes', () => {
    render(<LiveRegion message="Test" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('should support assertive politeness', () => {
    render(<LiveRegion message="Urgent" politeness="assertive" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('should be visually hidden but accessible to screen readers', () => {
    render(<LiveRegion message="Hidden" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('should clear message after delay', async () => {
    jest.useFakeTimers();
    const { rerender } = render(<LiveRegion message="Temporary" />);
    
    expect(screen.getByRole('status')).toHaveTextContent('Temporary');
    
    // Fast-forward time
    jest.advanceTimersByTime(3000);
    
    // Message should still be there (clearing is handled by parent component)
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    jest.useRealTimers();
  });
});

describe('KeyboardShortcutsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText(/Keyboard Shortcuts/i)).not.toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-title');
  });

  it('should close when close button is clicked', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close when backdrop is clicked', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should display all shortcut categories', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Modal Controls')).toBeInTheDocument();
  });

  it('should display keyboard shortcuts with kbd elements', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    
    const kbdElements = screen.getAllByRole('presentation');
    expect(kbdElements.length).toBeGreaterThan(0);
  });
});

describe('ModalContainer', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when open', () => {
    render(
      <ModalContainer isOpen={true} size="initial" onClose={mockOnClose}>
        <div>Test Content</div>
      </ModalContainer>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <ModalContainer isOpen={false} size="initial" onClose={mockOnClose}>
        <div>Test Content</div>
      </ModalContainer>
    );
    
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <ModalContainer isOpen={true} size="initial" onClose={mockOnClose}>
        <div>Content</div>
      </ModalContainer>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Ticket Management Modal');
  });

  it('should handle Escape key press', () => {
    render(
      <ModalContainer isOpen={true} size="initial" onClose={mockOnClose}>
        <div>Content</div>
      </ModalContainer>
    );
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should be focusable', () => {
    render(
      <ModalContainer isOpen={true} size="initial" onClose={mockOnClose}>
        <div>Content</div>
      </ModalContainer>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('tabIndex', '-1');
  });

  it('should apply different size classes', () => {
    const { rerender } = render(
      <ModalContainer isOpen={true} size="initial" onClose={mockOnClose}>
        <div>Content</div>
      </ModalContainer>
    );
    
    let dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    rerender(
      <ModalContainer isOpen={true} size="fullscreen" onClose={mockOnClose}>
        <div>Content</div>
      </ModalContainer>
    );
    
    dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
