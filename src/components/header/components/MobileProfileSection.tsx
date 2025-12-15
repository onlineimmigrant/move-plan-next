import React from 'react';
import { Disclosure } from '@headlessui/react';
import LocalizedLink from '@/components/LocalizedLink';
import { 
  Cog6ToothIcon, 
  VideoCameraIcon, 
  CpuChipIcon, 
  ArrowLeftOnRectangleIcon,
  UserIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface MobileProfileSectionProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  translations: any;
  setIsOpen: (isOpen: boolean) => void;
  handleContactModal: () => void;
  handleLogout: () => void;
  handleLoginModal: () => void;
}

/**
 * MobileProfileSection - Profile/Login section for mobile menu
 * Displays collapsible profile menu with admin or user options
 */
const MobileProfileSectionComponent: React.FC<MobileProfileSectionProps> = ({
  isLoggedIn,
  isAdmin,
  translations,
  setIsOpen,
  handleContactModal,
  handleLogout,
  handleLoginModal,
}) => {
  if (!isLoggedIn) {
    return (
      <div className="border-t border-gray-200/50 mt-6 pt-6">
        <button
          type="button"
          onClick={handleLoginModal}
          className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
          aria-label={translations.openLoginModal}
        >
          <div className="flex items-center space-x-3">
            <div className="text-left">
              <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                {translations.login}
              </span>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                {translations.signIn}
              </p>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <Disclosure>
      {({ open }) => (
        <div className="mt-6">
          <Disclosure.Button
            className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
            aria-label="Toggle profile menu"
          >
            <div className="flex items-center space-x-3">
              <div className="text-left">
                <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                  {isAdmin ? 'Admin' : translations.profile}
                </span>
              </div>
            </div>
            <div className="transition-colors duration-200">
              {open ? (
                <MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              ) : (
                <PlusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              )}
            </div>
          </Disclosure.Button>
          <Disclosure.Panel className="mt-3 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-hide">
            {isAdmin ? (
              <>
                <LocalizedLink
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Dashboard
                    </span>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Manage your account settings
                    </p>
                  </div>
                </LocalizedLink>
                
                <button
                  type="button"
                  onClick={handleContactModal}
                  className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Tickets
                    </span>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Get help and support
                    </p>
                  </div>
                </button>
                
                <LocalizedLink
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <VideoCameraIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Meetings
                    </span>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Schedule and manage meetings
                    </p>
                  </div>
                </LocalizedLink>
                
                <LocalizedLink
                  href="/admin/ai/management"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CpuChipIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      AI Agents
                    </span>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      Manage AI models and agents
                    </p>
                  </div>
                </LocalizedLink>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full p-4 text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.logout}
                    </span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <LocalizedLink
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.account}
                    </span>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.accountSettings}
                    </p>
                  </div>
                </LocalizedLink>
                <button
                  type="button"
                  onClick={handleContactModal}
                  className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.contact}
                    </span>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.getHelpSupport}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full p-4 text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                      {translations.logout}
                    </span>
                  </div>
                </button>
              </>
            )}
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
};

export const MobileProfileSection = React.memo(MobileProfileSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.isLoggedIn === nextProps.isLoggedIn &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});
