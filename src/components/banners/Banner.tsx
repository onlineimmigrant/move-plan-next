import { useBanner } from '../../context/BannerContext';
import { Banner as BannerType, BannerOpenState } from './types';
import Image from 'next/image';
import Link from 'next/link';
import { TbChevronCompactDown, TbChevronCompactUp, TbChevronCompactLeft, TbChevronCompactRight } from 'react-icons/tb';

interface BannerProps {
  banner: BannerType;
}

export const Banner = ({ banner }: BannerProps) => {
  const { openBanner, closeBanner, dismissBanner } = useBanner();
  if (banner.isDismissed) return null;

  const handleOpen = () => {
    if (banner.openState && banner.openState !== 'absent') {
      openBanner(banner.id, banner.openState);
    }
  };

  const positionStyles: Record<BannerType['position'], string> = {
    top: 'w-full top-0',
    bottom: 'w-full bottom-0',
    left: 'h-full w-64 left-0 top-0',
    right: 'h-full w-64 right-0 top-0',
  };

  const openStateStyles: Record<Exclude<BannerOpenState, 'absent'>, string> = {
    full: 'fixed inset-0 w-full h-full overflow-auto',
    'left-half': 'fixed left-0 top-0 w-full sm:w-1/3 h-full overflow-auto',
    'right-half': 'fixed right-0 top-0 w-full sm:w-1/3 h-full overflow-auto',
    'top-half': 'fixed top-0 left-0 w-full h-1/2 overflow-auto',
    'bottom-half': 'fixed bottom-0 left-0 w-full h-1/2 overflow-auto',
    'left-30': 'fixed left-0 top-0 w-full sm:w-1/3 h-full overflow-auto',
    'left-70': 'fixed left-0 top-0 w-full sm:w-2/3 h-full overflow-auto',
    'right-30': 'fixed right-0 top-0 w-full sm:w-1/3 h-full overflow-auto',
    'right-70': 'fixed right-0 top-0 w-full sm:w-2/3 h-full overflow-auto',
    'top-30': 'fixed top-0 left-0 w-full h-1/3 overflow-auto',
    'top-70': 'fixed top-0 left-0 w-full h-2/3 overflow-auto',
    'bottom-30': 'fixed bottom-0 left-0 w-full h-1/3 overflow-auto',
    'bottom-70': 'fixed bottom-0 left-0 w-full h-2/3 overflow-auto',
  };

  // Define button styles and icons based on position
  const getOpenButtonConfig = () => {
    switch (banner.position) {
      case 'top':
        return {
          icon: <TbChevronCompactDown className="w-6 h-6" />,
          className: 'cursor-pointer mt-2 text-gray-400 hover:text-sky-600',
          ariaLabel: 'Expand banner downward',
        };
      case 'bottom':
        return {
          icon: <TbChevronCompactUp className="w-6 h-6" />,
          className: 'cursor-pointer mb-2 text-sky-600 hover:text-sky-500',
          ariaLabel: 'Expand banner upward',
        };
      case 'left':
        return {
          icon: <TbChevronCompactRight className="w-6 h-6" />,
          className: 'cursor-pointer ml-2 text-sky-600 hover:text-sky-500',
          ariaLabel: 'Expand banner to the right',
        };
      case 'right':
        return {
          icon: <TbChevronCompactLeft className="w-6 h-6" />,
          className: 'cursor-pointer mr-2 text-sky-600 hover:text-sky-500',
          ariaLabel: 'Expand banner to the left',
        };
      default:
        return {
          icon: <TbChevronCompactDown className="w-6 h-6" />,
          className: 'cursor-pointer mt-2 text-sky-600 hover:text-sky-500',
          ariaLabel: 'Open banner',
        };
    }
  };

  const openButtonConfig = getOpenButtonConfig();

  // Check if open button should be rendered
  const shouldRenderOpenButton = !banner.isOpen && banner.openState && banner.openState !== 'absent';

  // Log landing_content and banner_background for debugging
  if (banner.isOpen) {
    console.log('Banner open, landing_content:', banner.landing_content);
    console.log('Banner background:', banner.content?.banner_background);
    console.log('Banner content style:', banner.content?.banner_content_style);
  }

  return (
    <div
      className={`fixed z-[100] shadow-lg  transition-all duration-300 ${
        banner.isOpen && banner.openState !== 'absent'
          ? openStateStyles[banner.openState as Exclude<BannerOpenState, 'absent'>]
          : positionStyles[banner.position]
      } flex ${banner.position === 'left' || banner.position === 'right' ? 'flex-row sm:flex-col' : 'flex-col'} items-center justify-center p-4 py-6 overflow-auto ${
        banner.content?.banner_background || 'bg-gray-50'
      }`}
      role="banner"
      aria-labelledby={`banner-${banner.id}`}
    >
      {/* For bottom position, show open button above content */}
      {shouldRenderOpenButton && banner.position === 'bottom' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {/* Render centered content only when banner is not open */}
      {!banner.isOpen && (
        <div
          className={`flex min-w-0 ${
            banner.position === 'left' || banner.position === 'right'
              ? 'flex-row sm:flex-col items-center space-x-2 sm:space-x-0 sm:space-y-2'
              : 'flex-col items-center space-y-2'
          }`}
        >
          <div className={`flex flex-row justify-left items-center space-y-0 ${banner.content?.banner_content_style || 'space-x-4'}`}>
            {banner.content.icon && (
              <Image
                src={banner.content.icon}
                alt=""
                width={40}
                height={40}
                className=""
                aria-hidden="true"
              />
            )}

            <p id={`banner-${banner.id}`} className="break-words">
              {banner.content.text}
            </p>
            {banner.content.link && (
              <Link
                href={banner.content.link.url}
                className="text-sky-600 hover:underline"
                target={banner.content.link.isExternal ? '_blank' : undefined}
                rel={banner.content.link.isExternal ? 'noopener noreferrer' : undefined}
              >
                {banner.content.link.label}
              </Link>
            )}
            {banner.content.customContent && (
              <div className="mt-4" dangerouslySetInnerHTML={{ __html: banner.content.customContent }} />
            )}
          </div>

          {/* For left position, show open button to the right of content */}
          {shouldRenderOpenButton && banner.position === 'left' && (
            <button
              onClick={handleOpen}
              className={openButtonConfig.className}
              aria-label={openButtonConfig.ariaLabel}
            >
              {openButtonConfig.icon}
            </button>
          )}
        </div>
      )}

      {/* For top position, show open button below content */}
      {shouldRenderOpenButton && banner.position === 'top' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {/* For right position, show open button to the left of content */}
      {shouldRenderOpenButton && banner.position === 'right' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {/* Display landing_content when banner is open */}
      {banner.isOpen && (
        <div className="w-full h-full p-6 prose prose-md max-w-none bg-transparent overflow-auto">
          {banner.landing_content ? (
            <div dangerouslySetInnerHTML={{ __html: banner.landing_content }} />
          ) : (
            <p className="text-gray-500">No landing content available.</p>
          )}
        </div>
      )}

      {banner.type === 'closed' && (
        <button
          onClick={() => dismissBanner(banner.id)}
          className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-gray-700"
          aria-label="Close banner"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {banner.isOpen && (
        <button
          onClick={() => closeBanner(banner.id)}
          className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-gray-700"
          aria-label="Close expanded banner"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};