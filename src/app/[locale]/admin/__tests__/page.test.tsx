import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboardPage from '../page';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

// Mock all dependencies
jest.mock('@/context/AuthContext');
jest.mock('next/navigation');
jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: {
        base: '#3b82f6',
        lighter: '#60a5fa',
      },
    },
  }),
}));

// Mock components
jest.mock('@/ui/Loading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));
jest.mock('@/components/admin/AdminCards', () => ({
  AdminModalCard: ({ item }: any) => (
    <button data-testid={`modal-card-${item.label}`} onClick={item.onClick}>
      {item.label}
    </button>
  ),
  AdminLinkCard: ({ item }: any) => (
    <a href={item.href} data-testid={`link-card-${item.label}`}>
      {item.label}
    </a>
  ),
}));
jest.mock('@/components/modals/MeetingsModals/MeetingsAdminModal/MeetingsAdminModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="meetings-admin-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin');
  });

  it('should render loading state', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isAdmin: false,
      fullName: null,
      isLoading: true,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading admin dashboard');
  });

  it('should render admin dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Admin dashboard content');
  });

  it('should render all navigation cards', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    expect(screen.getByTestId('link-card-Site')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-Products')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-Pricing Plans')).toBeInTheDocument();
    expect(screen.getByTestId('modal-card-Appointments')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-AI')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-Settings')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-Tickets')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-Account')).toBeInTheDocument();
  });

  it('should have proper ARIA landmarks', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument();
  });

  it('should open meetings modal when Appointments card is clicked', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    const appointmentsButton = screen.getByTestId('modal-card-Appointments');
    fireEvent.click(appointmentsButton);

    await waitFor(() => {
      expect(screen.getByTestId('meetings-admin-modal')).toBeInTheDocument();
    });
  });

  it('should close meetings modal when close button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    // Open modal
    const appointmentsButton = screen.getByTestId('modal-card-Appointments');
    fireEvent.click(appointmentsButton);

    await waitFor(() => {
      expect(screen.getByTestId('meetings-admin-modal')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('meetings-admin-modal')).not.toBeInTheDocument();
    });
  });

  it('should render with correct styling classes', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<AdminDashboardPage />);
    
    const mainContainer = container.querySelector('.min-h-screen.bg-gradient-to-br');
    expect(mainContainer).toBeInTheDocument();
    
    const header = screen.getByText('Admin Dashboard').closest('header');
    expect(header).toHaveClass('border-b');
  });

  it('should have semantic HTML structure', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);

    render(<AdminDashboardPage />);
    
    // Check for semantic elements
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check header is present
    const heading = screen.getByRole('heading', { name: 'Admin Dashboard' });
    expect(heading).toBeInTheDocument();
  });
});
