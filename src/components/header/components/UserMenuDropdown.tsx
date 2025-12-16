import React from 'react';
import { createPortal } from 'react-dom';
import LocalizedLink from '@/components/LocalizedLink';
import { 
  Cog6ToothIcon, 
  VideoCameraIcon, 
  CpuChipIcon, 
  ArrowLeftOnRectangleIcon,
  UserIcon 
} from '@heroicons/react/24/outline';

interface UserMenuDropdownProps {
  isOpen: boolean;
  isAdmin: boolean;
  fixedBannersHeight: number;
  translations: any;
  handleContactModal: () => void;
  handleLogout: () => void;
  cancelCloseTimeout: () => void;
  handleMenuLeave: () => void;
}

/**
 * UserMenuDropdown - Mega dropdown menu for logged-in users
 * Displays profile or admin menu items in a grid layout
 */
const UserMenuDropdownComponent: React.FC<UserMenuDropdownProps> = ({
  isOpen,
  isAdmin,
  fixedBannersHeight,
  translations,
  handleContactModal,
  handleLogout,
  cancelCloseTimeout,
  handleMenuLeave,
}) => {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className={`header-portal fixed left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] transition-all duration-200 mx-4 sm:mx-8 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{
        top: `${fixedBannersHeight + 64}px`,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        pointerEvents: isOpen ? 'auto' : 'none',
        paddingTop: '8px',
        marginTop: '-8px'
      }}
      onMouseEnter={cancelCloseTimeout}
      onMouseLeave={handleMenuLeave}
    >
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {/* Header section - shows menu info */}
          <div className="mb-6 p-4">
            <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
              {isAdmin ? 'Admin' : translations.profile}
            </h3>
            {isAdmin && (
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                Manage your system, content, and settings
              </p>
            )}
          </div>
          
          {/* Menu items in grid */}
          <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {isAdmin ? (
              <>
                {/* Dashboard */}
                <LocalizedLink
                  href="/admin"
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Cog6ToothIcon className="h-12 w-12 text-gray-500 mb-3" />
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Dashboard
                    </h4>
                  </div>
                </LocalizedLink>

                {/* Tickets */}
                <button
                  type="button"
                  onClick={handleContactModal}
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <svg className="h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Tickets
                    </h4>
                  </div>
                </button>

                {/* Meetings */}
                <LocalizedLink
                  href="/admin"
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <VideoCameraIcon className="h-12 w-12 text-gray-500 mb-3" />
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Meetings
                    </h4>
                  </div>
                </LocalizedLink>

                {/* AI Agents */}
                <LocalizedLink
                  href="/admin/ai/management"
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <CpuChipIcon className="h-12 w-12 text-gray-500 mb-3" />
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      AI Agents
                    </h4>
                  </div>
                </LocalizedLink>

                {/* Logout - 5th item */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <ArrowLeftOnRectangleIcon className="h-12 w-12 text-gray-500 mb-3" />
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.logout}
                    </h4>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* Account */}
                <LocalizedLink
                  href="/account"
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <UserIcon className="h-12 w-12 text-gray-500 mb-3" />
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.account}
                    </h4>
                  </div>
                </LocalizedLink>

                {/* Contact */}
                <button
                  type="button"
                  onClick={handleContactModal}
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <svg className="h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.contact}
                    </h4>
                  </div>
                </button>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30"
                >
                  <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <ArrowLeftOnRectangleIcon className="h-12 w-12 text-gray-500 mb-3" />
                    <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.logout}
                    </h4>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const UserMenuDropdown = React.memo(UserMenuDropdownComponent, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.fixedBannersHeight === nextProps.fixedBannersHeight
  );
});
