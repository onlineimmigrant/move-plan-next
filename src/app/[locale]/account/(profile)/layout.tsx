'use client';

import AccountSidebar from '@/components/AccountSidebar';
import AccountTopBar from '@/components/AccountTopBar';
import { SidebarProvider } from '@/context/SidebarContext';

export default function ProfileSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        {/* Top Bar with Logo and Menu Toggle */}
        <AccountTopBar />
        
        <div className="flex flex-1">
          {/* Sidebar Navigation */}
          <AccountSidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
