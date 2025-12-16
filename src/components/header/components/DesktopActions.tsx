import React from 'react';
import { useState } from 'react';
import LocalizedLink from '@/components/LocalizedLink';
import { ShoppingCartIcon, UserIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { UserMenuDropdown } from './UserMenuDropdown';

interface DesktopActionsProps {
  isMounted: boolean;
  totalItems: number;
  profileItemVisible: boolean;
  isLoggedIn: boolean;
  isDesktop: boolean;
  headerType: string;
  isAdmin: boolean;
  fixedBannersHeight: number;
  headerColor: string;
  headerColorHover: string;
  translations: any;
  cancelCloseTimeout: () => void;
  handleMenuLeave: () => void;
  handleLoginModal: () => void;
  handleContactModal: () => void;
  handleLogout: () => void;
}

/**
 * DesktopActions - Right-side action items for desktop header
 * Includes basket icon and profile/login menu
 */
const DesktopActionsComponent: React.FC<DesktopActionsProps> = ({
  isMounted,
  totalItems,
  profileItemVisible,
  isLoggedIn,
  isDesktop,
  headerType,
  isAdmin,
  fixedBannersHeight,
  headerColor,
  headerColorHover,
  translations,
  cancelCloseTimeout,
  handleMenuLeave,
  handleLoginModal,
  handleContactModal,
  handleLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <div className="absolute right-0 flex items-center space-x-3">
      {/* Basket */}
      {isMounted && totalItems > 0 && (
        <LocalizedLink
          href="/basket"
          className="cursor-pointer relative group/basket"
          aria-label={translations.viewBasket(totalItems)}
        >
          <ShoppingCartIcon 
            className="w-6 h-6 transition-colors duration-200" 
            style={{ color: getColorValue(headerColor) }}
            onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
          />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        </LocalizedLink>
      )}
      
      {/* Profile/Login */}
      {(profileItemVisible || !isDesktop) && isLoggedIn && headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
        <div 
          className="relative"
          onMouseEnter={() => {
            setIsProfileMenuOpen(true);
            cancelCloseTimeout();
          }}
          onMouseLeave={() => {
            setIsProfileMenuOpen(false);
            handleMenuLeave();
          }}
        >
          <button
            type="button"
            className="p-3"
            title={isAdmin ? 'Admin' : translations.profile}
            aria-label={translations.openProfileMenu}
          >
            <UserIcon 
              className="h-6 w-6 transition-colors duration-200" 
              style={{ color: getColorValue(headerColor) }}
              onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
            />
          </button>
          
          {/* Mega menu profile dropdown */}
          <UserMenuDropdown
            isOpen={isProfileMenuOpen}
            isAdmin={isAdmin}
            fixedBannersHeight={fixedBannersHeight}
            translations={translations}
            handleContactModal={handleContactModal}
            handleLogout={handleLogout}
            cancelCloseTimeout={() => {
              setIsProfileMenuOpen(true);
              cancelCloseTimeout();
            }}
            handleMenuLeave={() => {
              setIsProfileMenuOpen(false);
              handleMenuLeave();
            }}
          />
        </div>
      ) : (profileItemVisible || !isDesktop) && headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
        <button
          type="button"
          onClick={handleLoginModal}
          className="cursor-pointer flex items-center justify-center p-3 focus:outline-none transition-colors duration-200"
          title={translations.login}
          aria-label={translations.openLoginModal}
        >
          <ArrowLeftOnRectangleIcon 
            className="h-6 w-6 transition-colors duration-200" 
            style={{ color: getColorValue(headerColor) }}
            onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
          />
        </button>
      ) : null}
    </div>
  );
};

export const DesktopActions = React.memo(DesktopActionsComponent, (prevProps, nextProps) => {
  return (
    prevProps.isMounted === nextProps.isMounted &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.isLoggedIn === nextProps.isLoggedIn &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.headerType === nextProps.headerType &&
    prevProps.profileItemVisible === nextProps.profileItemVisible &&
    prevProps.fixedBannersHeight === nextProps.fixedBannersHeight &&
    prevProps.headerColor === nextProps.headerColor &&
    prevProps.headerColorHover === nextProps.headerColorHover
  );
});
