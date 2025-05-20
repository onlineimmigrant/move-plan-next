import { useBanner } from '../../context/BannerContext';
import { Banner as BannerType, BannerOpenState } from './types'; // Add BannerOpenState import
import Image from 'next/image';
import Link from 'next/link';

interface BannerProps {
  banner: BannerType;
}

export const Banner = ({ banner }: BannerProps) => {
  const { openBanner, closeBanner, dismissBanner } = useBanner();
  if (banner.isDismissed) return null;

  const handleOpen = () => {
    if (banner.openState) {
      openBanner(banner.id, banner.openState);
    }
  };

  const positionStyles: Record<BannerType['position'], string> = {
    top: 'w-full top-0',
    bottom: 'w-full bottom-0',
    left: 'h-full w-64 left-0',
    right: 'h-full w-64 right-0',
  };

  const openStateStyles: Record<BannerOpenState, string> = {
    full: 'fixed inset-0 w-full h-full',
    'left-half': 'fixed left-0 top-0 w-1/2 h-full',
    'right-half': 'fixed right-0 top-0 w-1/2 h-full',
    'top-half': 'fixed top-0 left-0 w-full h-1/2',
    'bottom-half': 'fixed bottom-0 left-0 w-full h-1/2',
  };

  return (
    <div
      className={`fixed z-55 bg-white shadow-lg transition-all duration-300 ${
        banner.isOpen ? openStateStyles[banner.openState!] : positionStyles[banner.position]
      } flex flex-col items-center justify-center p-4 py-6`}
      role="banner"
      aria-labelledby={`banner-${banner.id}`}
    >
        <div className='flex justify-between items-center space-x-2'>
      {banner.content.icon && (
        <Image
          src={banner.content.icon}
          alt=""
          width={40}
          height={40}
          className="mb-2"
          aria-hidden="true"
        />
      )}

      <p id={`banner-${banner.id}`} className="text-center">
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
        <div
          className="mt-4"
          dangerouslySetInnerHTML={{ __html: banner.content.customContent }}
        />
      )}
      </div>
      {banner.type === 'closed' && (
        <button
          onClick={() => dismissBanner(banner.id)}
          className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-gray-700"
          aria-label="Close banner"
        >
          ✕
        </button>
      )}
      {!banner.isOpen && banner.openState && (
        <button
          onClick={handleOpen}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          aria-label="Open banner"
        >
          Open
        </button>
      )}
      {banner.isOpen && (
        <button
          onClick={() => closeBanner(banner.id)}
          className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-gray-700"
          aria-label="Close expanded banner"
        >
          ✕
        </button>
      )}
    </div>
  );
};