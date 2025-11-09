import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountPage from '../page';
import { useAuth } from '@/context/AuthContext';
import { useStudentStatus } from '@/lib/StudentContext';
import { useSettings } from '@/context/SettingsContext';
import { usePathname } from 'next/navigation';

// Mock all dependencies
jest.mock('@/context/AuthContext');
jest.mock('@/lib/StudentContext');
jest.mock('@/context/SettingsContext');
jest.mock('next/navigation');
jest.mock('@/components/accountTranslationLogic/useAccountTranslations', () => ({
  useAccountTranslations: () => ({
    t: {
      account: 'Account',
      hello: 'Hello',
      student: 'Student',
      profile: 'Profile',
      ai: 'AI',
      admin: 'Admin',
      dashboard: 'Dashboard',
      learningPlatform: 'Learning Platform',
      defineAiModel: 'Define AI Model',
      pleaseLogin: 'Please login',
      selectCard: 'Select a card',
    },
  }),
}));
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
jest.mock('@/components/AccountTopBar', () => ({
  __esModule: true,
  default: () => <div data-testid="account-top-bar">Account Top Bar</div>,
}));
jest.mock('@/ui/Loading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));
jest.mock('@/components/account/AccountCards', () => ({
  AccountModalCard: ({ item }: any) => (
    <button data-testid={`modal-card-${item.label}`}>{item.label}</button>
  ),
  AccountLinkCard: ({ item }: any) => (
    <a href={item.href} data-testid={`link-card-${item.label}`}>
      {item.label}
    </a>
  ),
}));
jest.mock('@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="meetings-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="tickets-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
jest.mock('@/context/SidebarContext', () => ({
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseStudentStatus = useStudentStatus as jest.MockedFunction<typeof useStudentStatus>;
const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('AccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/account');
    mockUseSettings.mockReturnValue({
      settings: { image: '/logo.png' },
      isLoading: false,
      error: null,
    } as any);
  });

  it('should render loading state', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isAdmin: false,
      fullName: null,
      isLoading: true,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading account page');
  });

  it('should render login message when no session', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isAdmin: false,
      fullName: null,
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByText('Please login')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render account page with user name', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'John Doe',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Account dashboard');
  });

  it('should render student card when user is student', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'Jane Student',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: true,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByTestId('link-card-Student')).toBeInTheDocument();
  });

  it('should render admin card when user is admin', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: true,
      fullName: 'Admin User',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByTestId('link-card-Admin')).toBeInTheDocument();
  });

  it('should render all basic navigation cards', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'Test User',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByTestId('link-card-Profile')).toBeInTheDocument();
    expect(screen.getByTestId('link-card-AI')).toBeInTheDocument();
    expect(screen.getByTestId('modal-card-Appointments')).toBeInTheDocument();
    expect(screen.getByTestId('modal-card-Tickets')).toBeInTheDocument();
  });

  it('should have proper ARIA landmarks', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'Test User',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Account navigation' })).toBeInTheDocument();
  });

  it('should show select card message on account page', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'Test User',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);
    mockUsePathname.mockReturnValue('/account');

    render(<AccountPage />);
    
    expect(screen.getByText('Select a card')).toBeInTheDocument();
    expect(screen.getByText('Hello, Test User')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('should not show select card message on other pages', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'Test User',
      isLoading: false,
      error: null,
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);
    mockUsePathname.mockReturnValue('/account/profile');

    render(<AccountPage />);
    
    expect(screen.queryByText('Select a card')).not.toBeInTheDocument();
  });

  it('should handle errors from auth', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      isAdmin: false,
      fullName: 'Test User',
      isLoading: false,
      error: 'Authentication error',
    } as any);
    mockUseStudentStatus.mockReturnValue({
      isStudent: false,
      isLoading: false,
    } as any);

    render(<AccountPage />);
    
    // Toast should be rendered with error
    waitFor(() => {
      expect(screen.getByText('Authentication error')).toBeInTheDocument();
    });
  });
});
