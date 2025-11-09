import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountPage from '../page';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';

// Mock dependencies
jest.mock('@/context/AuthContext');
jest.mock('@/lib/StudentContext');
jest.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({ settings: { image: '/logo.png', language: 'en' } }),
}));
jest.mock('@/context/SidebarContext', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ isMobileMenuOpen: false, setIsMobileMenuOpen: jest.fn() }),
}));
jest.mock('next/navigation', () => ({
  usePathname: () => '/account',
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));
jest.mock('@/components/AccountTopBar', () => {
  return function MockAccountTopBar() {
    return <div>Account Top Bar</div>;
  };
});
jest.mock('@/components/modals/ChatWidget/ChatWidget', () => {
  return function MockChatWidget() {
    return <div>Chat Widget</div>;
  };
});
jest.mock('@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountModal', () => {
  return function MockTicketsModal() {
    return <div>Tickets Modal</div>;
  };
});
jest.mock('@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal', () => {
  return function MockMeetingsModal() {
    return <div>Meetings Modal</div>;
  };
});

describe('AccountPage', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseStudentStatus = useStudentStatus as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while authenticating', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isAdmin: false,
      fullName: null,
      isLoading: true,
      error: null,
    });
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    });

    render(<AccountPage />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message when not logged in', async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isAdmin: false,
      fullName: null,
      isLoading: false,
      error: null,
    });
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    });

    render(<AccountPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    });
  });

  it('should display dashboard links for authenticated user', async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: 'test-token' },
      isAdmin: false,
      fullName: 'John Doe',
      isLoading: false,
      error: null,
    });
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    });

    render(<AccountPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  it('should show student link for students', async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: 'test-token' },
      isAdmin: false,
      fullName: 'John Doe',
      isLoading: false,
      error: null,
    });
    mockUseStudentStatus.mockReturnValue({
      isStudent: true,
      isLoading: false,
    });

    render(<AccountPage />);
    
    await waitFor(() => {
      // Student link should be visible
      expect(screen.getByRole('link', { name: /student/i })).toBeInTheDocument();
    });
  });

  it('should show admin link for admins', async () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: 'test-token' },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    });
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    });

    render(<AccountPage />);
    
    await waitFor(() => {
      // Admin link should be visible
      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
    });
  });
});
