import React from 'react';
import LocalizedLink from '@/components/LocalizedLink';
import { 
  UserIcon, 
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  VideoCameraIcon,
  CpuChipIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

interface UserMenuProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  profileItemVisible: boolean;
  isDesktop: boolean;
  headerType: string;
  fixedBannersHeight: number;
  headerColor: string;
  headerColorHover: string;
  translations: any;
  onLogout: () => void;
  onContactModal: () => void;
  onLoginModal: () => void;
  cancelCloseTimeout: () => void;
  handleMenuLeave: () => void;
}

/**
 * UserMenu component - Profile dropdown with admin/user actions
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const UserMenuComponent: React.FC<UserMenuProps> = ({
  isLoggedIn,
  isAdmin,
  profileItemVisible,
  isDesktop,
  headerType,
  fixedBannersHeight,
  headerColor,
  headerColorHover,
  translations: t,
  onLogout,
  onContactModal,
  onLoginModal,
  cancelCloseTimeout,
  handleMenuLeave,
}) => {
  if ((headerType === 'ring_card_mini' || headerType === 'mini') && (!profileItemVisible && isDesktop)) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={onLoginModal}
        className="cursor-pointer flex items-center justify-center p-3 focus:outline-none transition-colors duration-200"
        title={t.login}
        aria-label={t.openLoginModal}
      >
        <ArrowRightOnRectangleIcon 
          className="h-6 w-6 transition-colors duration-200" 
          style={{ color: getColorValue(headerColor) }}
          onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
          onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
        />
      </button>
    );
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={cancelCloseTimeout}
      onMouseLeave={handleMenuLeave}
    >
      <button
        type="button"
        className="p-3"
        title={isAdmin ? 'Admin' : t.profile}
        aria-label={t.openProfileMenu}
      >
        <UserIcon 
          className="h-6 w-6 transition-colors duration-200" 
          style={{ color: getColorValue(headerColor) }}
          onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
          onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
        />
      </button>
      
      {/* Mega menu profile dropdown */}
      <div 
        className="fixed left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mx-4 sm:mx-8"
        style={{
          top: `${fixedBannersHeight + 64 + 16}px`,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }}
        onMouseEnter={cancelCloseTimeout}
        onMouseLeave={handleMenuLeave}
      >
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="px-6 py-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="mb-6 p-4">
              <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                {isAdmin ? 'Admin' : t.profile}
              </h3>
              {isAdmin && (
                <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                  Manage your system, content, and settings
                </p>
              )}
            </div>
            
            {/* Menu items grid */}
            <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {isAdmin ? (
                <>
                  <LocalizedLink href="/admin" className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <Cog6ToothIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        Dashboard
                      </h4>
                    </div>
                  </LocalizedLink>

                  <button type="button" onClick={onContactModal} className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <svg className="h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        Tickets
                      </h4>
                    </div>
                  </button>

                  <LocalizedLink href="/admin" className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <VideoCameraIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        Meetings
                      </h4>
                    </div>
                  </LocalizedLink>

                  <LocalizedLink href="/admin/ai/management" className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <CpuChipIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        AI Agents
                      </h4>
                    </div>
                  </LocalizedLink>

                  <button type="button" onClick={onLogout} className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <ArrowLeftOnRectangleIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        {t.logout}
                      </h4>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <LocalizedLink href="/account" className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <UserIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        {t.account}
                      </h4>
                    </div>
                  </LocalizedLink>

                  <button type="button" onClick={onContactModal} className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <svg className="h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        {t.contact}
                      </h4>
                    </div>
                  </button>

                  <button type="button" onClick={onLogout} className="block rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105 w-full text-left border border-gray-200/30">
                    <div className="relative w-full h-48 flex flex-col items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <ArrowLeftOnRectangleIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h4 className="text-base font-medium text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                        {t.logout}
                      </h4>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized export to prevent unnecessary re-renders
export const UserMenu = React.memo(UserMenuComponent, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return (
    prevProps.isLoggedIn === nextProps.isLoggedIn &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.profileItemVisible === nextProps.profileItemVisible &&
    prevProps.isDesktop === nextProps.isDesktop &&
    prevProps.headerType === nextProps.headerType &&
    prevProps.fixedBannersHeight === nextProps.fixedBannersHeight &&
    prevProps.headerColor === nextProps.headerColor &&
    prevProps.headerColorHover === nextProps.headerColorHover
  );
});
