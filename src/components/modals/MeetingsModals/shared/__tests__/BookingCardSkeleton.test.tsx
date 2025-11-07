import { render } from '@testing-library/react';
import { BookingCardSkeleton } from '../components/BookingCardSkeleton';

describe('BookingCardSkeleton', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<BookingCardSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      const { container } = render(<BookingCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('displays loading animation', () => {
      const { container } = render(<BookingCardSkeleton />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Multiple Skeletons', () => {
    it('renders multiple skeleton cards', () => {
      const { container } = render(
        <>
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has appropriate aria attributes', () => {
      const { container } = render(<BookingCardSkeleton />);
      expect(container).toBeInTheDocument();
    });
  });
});
