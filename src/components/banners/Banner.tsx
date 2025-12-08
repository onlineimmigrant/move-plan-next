import { useBanner } from '../../context/BannerContext';
import { Banner as BannerType, BannerOpenState } from './types';
import Image from 'next/image';
import { TbChevronCompactDown, TbChevronCompactUp, TbChevronCompactLeft, TbChevronCompactRight } from 'react-icons/tb';
import { useEffect } from 'react';
import Button from '@/ui/Button';
import CloseIcon from '@/ui/CloseIcon';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import dynamic from 'next/dynamic';

// Lazy load BannerTimer (uses framer-motion)
const BannerTimer = dynamic(() => import('./BannerTimer').then(mod => ({ default: mod.BannerTimer })), {
  ssr: false,
  loading: () => null
});

interface BannerProps {
  banner: BannerType;
  index?: number;
}

export const Banner = ({ banner, index = 0 }: BannerProps) => {
  const { openBanner, closeBanner, dismissBanner } = useBanner();

  // Don't render banners without an ID (should never happen for saved banners)
  if (!banner.id) {
    console.warn('Banner component received banner without ID, skipping render');
    return null;
  }

  // Type assertion: after the check above, we know banner.id is defined
  const bannerId: string = banner.id;

  // Check if the banner is expired based on end_date_promotion
  const isBannerExpired = () => {
    if (!banner.end_date_promotion) return false;
    const endDate = new Date(banner.end_date_promotion);
    if (isNaN(endDate.getTime())) return false; // Invalid date
    const currentDate = new Date();
    return endDate < currentDate;
  };

  // If the banner is dismissed or expired, don't render it
  if (banner.isDismissed || isBannerExpired()) return null;

  useEffect(() => {
    const el = document.getElementById(`banner-${bannerId}`);
    if (el) {
      const styles = window.getComputedStyle(el);
      console.log(
        `Banner ${bannerId} computed styles: top=${styles.top}, z-index=${styles.zIndex}, height=${el.offsetHeight}px, position=${styles.position}`
      );
    }
  }, [bannerId]);

  console.log(`Rendering banner ${bannerId}: isFixedAboveNavbar=${banner.isFixedAboveNavbar}, position=${banner.position}, index=${index}`);

  const handleOpen = () => {
    // Only open banner if it has a valid openState
    if (banner.openState && banner.openState !== 'absent') {
      openBanner(bannerId, banner.openState);
    }
  };

  const positionStyles: Record<BannerType['position'], string> = {
    top: banner.isFixedAboveNavbar
      ? `fixed top-[${index * 3}rem] left-0 right-0 z-[110] max-w-[100vw]`
      : `fixed top-0 left-0 right-0 z-[100] max-w-[100vw]`,
    bottom: `fixed bottom-0 left-0 right-0 z-[100] max-w-[100vw]`,
    left: `fixed left-0 top-0 h-full w-64 z-[100]`,
    right: `fixed right-0 top-0 h-full w-64 z-[100]`,
  };

  const openStateStyles: Record<Exclude<BannerOpenState, 'absent'>, string> = {
    full: 'fixed inset-0 w-full h-full overflow-auto z-[110]',
    'left-half': 'fixed left-0 top-0 w-full sm:w-1/3 h-full overflow-auto z-[110]',
    'right-half': 'fixed right-0 top-0 w-full sm:w-1/3 h-full overflow-auto z-[110]',
    'top-half': 'fixed top-0 left-0 w-full h-1/2 overflow-auto z-[110]',
    'bottom-half': 'fixed bottom-0 left-0 w-full h-1/2 overflow-auto z-[110]',
    'left-30': 'fixed left-0 top-0 w-full sm:w-1/3 h-full overflow-auto z-[110]',
    'left-70': 'fixed left-0 top-0 w-full sm:w-2/3 h-full overflow-auto z-[110]',
    'right-30': 'fixed right-0 top-0 w-full sm:w-1/3 h-full overflow-auto z-[110]',
    'right-70': 'fixed right-0 top-0 w-full sm:w-2/3 h-full overflow-auto z-[110]',
    'top-30': 'fixed top-0 left-0 w-full h-1/3 overflow-auto z-[110]',
    'top-70': 'fixed top-0 left-0 w-full h-2/3 overflow-auto z-[110]',
    'bottom-30': 'fixed bottom-0 left-0 w-full h-1/3 overflow-auto z-[110]',
    'bottom-70': 'fixed bottom-0 left-0 w-full h-2/3 overflow-auto z-[110]',
  };

  const getOpenButtonConfig = () => {
    switch (banner.position) {
      case 'top':
        return {
          icon: <TbChevronCompactDown className="w-6 h-6" />,
          className: 'cursor-pointer mt-2 text-sky-500 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500',
          ariaLabel: 'Expand banner downward',
        };
      case 'bottom':
        return {
          icon: <TbChevronCompactUp className="w-6 h-6" />,
          className: 'cursor-pointer mb-2 text-sky-500 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500',
          ariaLabel: 'Expand banner upward',
        };
      case 'left':
        return {
          icon: <TbChevronCompactRight className="w-6 h-6" />,
          className: 'cursor-pointer ml-2 text-sky-500 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500',
          ariaLabel: 'Expand banner to the right',
        };
      case 'right':
        return {
          icon: <TbChevronCompactLeft className="w-6 h-6" />,
          className: 'cursor-pointer mr-2 text-sky-500 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500',
          ariaLabel: 'Expand banner to the left',
        };
      default:
        return {
          icon: <TbChevronCompactDown className="w-6 h-6" />,
          className: 'cursor-pointer mt-2 text-sky-500 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500',
          ariaLabel: 'Open banner',
        };
    }
  };

  const openButtonConfig = getOpenButtonConfig();
  const shouldRenderOpenButton = !banner.isOpen && banner.openState && banner.openState !== 'absent';

  return (
    <div
      className={`transition-all duration-300 ${
        banner.isOpen && banner.openState !== 'absent'
          ? openStateStyles[banner.openState as Exclude<BannerOpenState, 'absent'>]
          : positionStyles[banner.position]
      } flex ${
        banner.position === 'left' || banner.position === 'right' ? 'flex-row sm:flex-col' : 'flex-col'
      } items-center justify-center p-2 ${
        banner.end_date_promotion_is_displayed && banner.end_date_promotion ? 'min-h-[72px] sm:min-h-[48px]' : 'min-h-[48px]'
      } ${banner.content?.banner_background || 'bg-gray-50'}`}
      role="banner"
      aria-labelledby={`banner-${bannerId}`}
      id={`banner-${bannerId}`}
    >
      {shouldRenderOpenButton && banner.position === 'bottom' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {!banner.isOpen && (
        <div
          className={`flex min-w-0 w-full ${
            banner.position === 'left' || banner.position === 'right'
              ? 'flex-row sm:flex-col items-center space-x-2 sm:space-x-0 sm:space-y-2'
              : banner.end_date_promotion_is_displayed && banner.end_date_promotion
              ? 'flex-col sm:flex-row sm:max-w-5xl sm:justify-between sm:items-center sm:space-x-4 sm:space-y-0'
              : 'flex-col sm:flex-row sm:justify-center sm:items-center sm:space-x-4 sm:space-y-0'
          }`} // Conditional justify-center or max-w-5xl justify-between for desktop
        >
          <div
            className={`flex flex-row text-xs sm:text-sm justify-left items-center space-y-0 ${
              banner.content?.banner_content_style || 'space-x-4'
            }`}
          >
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

            <div className="flex flex-col">
              <p id={`banner-${bannerId}-text`} className="break-words">
                {banner.content.text}
              </p>
            </div>

            {banner.content.link && (
              <Button
                variant="link"
                onClick={() => {
                  if (banner.content.link!.isExternal) {
                    window.open(banner.content.link!.url, '_blank', 'noopener,noreferrer');
                  } else {
                    window.location.href = banner.content.link!.url;
                  }
                }}
              >
                {banner.content.link.label}
                <RightArrowDynamic />
              </Button>
            )}

            {banner.content.customContent && (
              <div className="mt-4" dangerouslySetInnerHTML={{ __html: banner.content.customContent }} />
            )}
          </div>

          {/* Timer for desktop (right) and mobile (below) */}
          {banner.end_date_promotion_is_displayed && banner.end_date_promotion && (
            <div className="mt-2 sm:mt-0">
              <BannerTimer endDate={banner.end_date_promotion} textColor="text-gray-500" backgroundColor="bg-transparent" />
            </div>
          )}
        </div>
      )}

      {shouldRenderOpenButton && banner.position === 'top' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {shouldRenderOpenButton && banner.position === 'left' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {shouldRenderOpenButton && banner.position === 'right' && (
        <button
          onClick={handleOpen}
          className={openButtonConfig.className}
          aria-label={openButtonConfig.ariaLabel}
        >
          {openButtonConfig.icon}
        </button>
      )}

      {banner.isOpen && (
        <div className="w-full h-full p-6 prose prose-md max-w-none bg-transparent overflow-auto">
          {banner.landing_content ? (
            <div dangerouslySetInnerHTML={{ __html: banner.landing_content }} />
          ) : (
            <p className="text-gray-500">No landing content available.</p>
          )}
        </div>
      )}

      {banner.type === 'closed' && banner.id && (
        <Button
          variant="close"
          onClick={() => dismissBanner(bannerId)}
          aria-label="Close banner"
        >
          <CloseIcon />
        </Button>
      )}

      {banner.isOpen && banner.id && (
        <Button
          variant="close"
          onClick={() => closeBanner(bannerId)}
          aria-label="Close expanded banner"
        >
          <CloseIcon />
        </Button>
      )}
    </div>
  );
};