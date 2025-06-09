import { useBanner } from '../../context/BannerContext';
import { Banner as BannerType, BannerOpenState } from './types';
import Image from 'next/image';
import Link from 'next/link';
import { TbChevronCompactDown, TbChevronCompactUp, TbChevronCompactLeft, TbChevronCompactRight } from 'react-icons/tb';
import { useEffect } from 'react';

interface BannerProps {
  banner: BannerType;
  index?: number;
}

export const Banner = ({ banner, index = 0 }: BannerProps) => {
  const { openBanner, closeBanner, dismissBanner } = useBanner();
  if (banner.isDismissed) return null;

  useEffect(() => {
    const el = document.getElementById(`banner-${banner.id}`);
    if (el) {
      const styles = window.getComputedStyle(el);
      console.log(
        `Banner ${banner.id} computed styles: top=${styles.top}, z-index=${styles.zIndex}, height=${el.offsetHeight}px, position=${styles.position}`
      );
    }
  }, [banner.id]);

  console.log(`Rendering banner ${banner.id}: isFixedAboveNavbar=${banner.isFixedAboveNavbar}, position=${banner.position}, index=${index}`);

  const handleOpen = () => {
    if (banner.openState && banner.openState !== 'absent') {
      openBanner(banner.id, banner.openState);
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
      className={`shadow-sm transition-all duration-300 ${
        banner.isOpen && banner.openState !== 'absent'
          ? openStateStyles[banner.openState as Exclude<BannerOpenState, 'absent'>]
          : positionStyles[banner.position]
      } flex ${banner.position === 'left' || banner.position === 'right' ? 'flex-row sm:flex-col' : 'flex-col'} items-center justify-center p-4 min-h-[48px] ${
        banner.content?.banner_background || 'bg-gray-50'
      }`}
      role="banner"
      aria-labelledby={`banner-${banner.id}`}
      id={`banner-${banner.id}`}
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
          className={`flex min-w-0 ${
            banner.position === 'left' || banner.position === 'right'
              ? 'flex-row sm:flex-col items-center space-x-2 sm:space-x-0 sm:space-y-2'
              : 'flex-col items-center space-y-2'
          }`}
        >
          <div
            className={`flex flex-row sm:grid sm:grid-cols-3 justify-left items-center space-y-0 ${
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

            <p id={`banner-${banner.id}-text`} className="break-words">
              {banner.content.text}
            </p>
            {banner.content.link && (
              <Link
                href={banner.content.link.url}
                className="text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500"
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

      {shouldRenderOpenButton && banner.position === 'top' && (
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

      {banner.type === 'closed' && (
        <button
          onClick={() => dismissBanner(banner.id)}
          className="absolute top-2 right-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Close banner"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {banner.isOpen && (
        <button
          onClick={() => closeBanner(banner.id)}
          className="absolute top-2 right-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Close expanded banner"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};