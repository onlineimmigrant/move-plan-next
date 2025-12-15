import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getLocaleFromPathname } from '@/utils/menuTranslations';

/**
 * Shared navigation hook for Header and Footer
 * Provides consistent routing and locale detection
 */
export const useNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);

  const navigate = useCallback((url: string) => {
    router.push(url);
  }, [router]);

  const navigateAndClose = useCallback((url: string, onClose?: () => void) => {
    if (onClose) onClose();
    router.push(url);
  }, [router]);

  return {
    router,
    pathname,
    currentLocale,
    navigate,
    navigateAndClose,
  };
};
