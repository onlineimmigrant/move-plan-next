'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentLocale, createLocalizedUrl } from '@/lib/navigation-utils';
import { useSettings } from '@/context/SettingsContext';

interface LocalizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  'aria-label'?: string;
}

export default function LocalizedLink({ 
  href, 
  children, 
  className, 
  onClick, 
  title, 
  'aria-label': ariaLabel 
}: LocalizedLinkProps) {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  const defaultLocale = settings?.language || 'en';
  const currentLocale = getCurrentLocale(pathname, defaultLocale);
  
  // Create localized URL that preserves current language
  const localizedHref = createLocalizedUrl(href, currentLocale, defaultLocale);
  
  return (
    <Link 
      href={localizedHref}
      className={className}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
