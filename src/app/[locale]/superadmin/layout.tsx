'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SuperadminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isSuperadmin, isLoading, organizationId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to load before redirecting
    if (isLoading) return;

    if (!isAdmin) {
      router.push('/login');
      return;
    }

    if (!isSuperadmin) {
      router.push('/admin');
      return;
    }
  }, [isAdmin, isSuperadmin, isLoading, router]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render until auth is verified
  if (!isAdmin || !isSuperadmin) {
    return null;
  }

  const navItems = [
    { href: '/superadmin', label: '🏠 Dashboard', exact: true },
    { href: '/superadmin/system-models', label: '🤖 System Models' },
    { href: '/superadmin/organizations', label: '🏢 Organizations' },
    { href: '/superadmin/usage', label: '📊 Usage Analytics' },
    { href: '/superadmin/settings', label: '⚙️ Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Superadmin Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👑</span>
              <div>
                <h1 className="text-2xl font-bold">Superadmin Portal</h1>
                <p className="text-purple-200 text-sm">System-Wide Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">Your Organization</p>
                <p className="text-xs text-purple-200">
                  {organizationId?.substring(0, 8)}...
                </p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href
                : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Superadmin Portal - System-Wide Administration</p>
          <p className="text-xs text-gray-500 mt-1">
            You have cross-tenant access to all organizations
          </p>
        </div>
      </footer>
    </div>
  );
}
