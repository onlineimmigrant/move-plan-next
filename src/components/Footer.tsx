'use client';

import React, { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { MenuItem, SubMenuItem } from '@/types/menu';
import ModernLanguageSwitcher from './ModernLanguageSwitcher';
import LocalizedLink from './LocalizedLink';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';

// Static translations for footer
const FOOTER_TRANSLATIONS = {
  en: { 
    allRightsReserved: 'All rights reserved', 
    language: 'Language:', 
    privacySettings: 'Privacy Settings',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    links: 'Links'
  },
  es: { 
    allRightsReserved: 'Todos los derechos reservados', 
    language: 'Idioma:', 
    privacySettings: 'Configuración de privacidad',
    profile: 'Perfil',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    links: 'Enlaces'
  },
  fr: { 
    allRightsReserved: 'Tous droits réservés', 
    language: 'Langue :', 
    privacySettings: 'Paramètres de confidentialité',
    profile: 'Profil',
    logout: 'Se déconnecter',
    login: 'Se connecter',
    register: 'S\'inscrire',
    links: 'Liens'
  },
  de: { 
    allRightsReserved: 'Alle Rechte vorbehalten', 
    language: 'Sprache:', 
    privacySettings: 'Datenschutz-Einstellungen',
    profile: 'Profil',
    logout: 'Abmelden',
    login: 'Anmelden',
    register: 'Registrieren',
    links: 'Links'
  },
  ru: { 
    allRightsReserved: 'Все права защищены', 
    language: 'Язык:', 
    privacySettings: 'Настройки конфиденциальности',
    profile: 'Профиль',
    logout: 'Выйти',
    login: 'Войти',
    register: 'Зарегистрироваться',
    links: 'Ссылки'
  },
  it: { 
    allRightsReserved: 'Tutti i diritti riservati', 
    language: 'Lingua:', 
    privacySettings: 'Impostazioni privacy',
    profile: 'Profilo',
    logout: 'Esci',
    login: 'Accedi',
    register: 'Registrati',
    links: 'Collegamenti'
  },
  pt: { 
    allRightsReserved: 'Todos os direitos reservados', 
    language: 'Idioma:', 
    privacySettings: 'Configurações de privacidade',
    profile: 'Perfil',
    logout: 'Sair',
    login: 'Entrar',
    register: 'Registrar',
    links: 'Links'
  },
  pl: { 
    allRightsReserved: 'Wszelkie prawa zastrzeżone', 
    language: 'Język:', 
    privacySettings: 'Ustawienia prywatności',
    profile: 'Profil',
    logout: 'Wyloguj',
    login: 'Zaloguj',
    register: 'Zarejestruj',
    links: 'Linki'
  },
  zh: { 
    allRightsReserved: '版权所有', 
    language: '语言：', 
    privacySettings: '隐私设置',
    profile: '个人资料',
    logout: '登出',
    login: '登录',
    register: '注册',
    links: '链接'
  },
  ja: { 
    allRightsReserved: '全著作権所有', 
    language: '言语：', 
    privacySettings: 'プライバシー設定',
    profile: 'プロフィール',
    logout: 'ログアウト',
    login: 'ログイン',
    register: '登録',
    links: 'リンク'
  }
};

// Hook to get translations based on current locale
function useFooterTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && FOOTER_TRANSLATIONS[pathLocale as keyof typeof FOOTER_TRANSLATIONS]) 
    ? pathLocale 
    : defaultLanguage;
  
  // Get translations for current locale or fallback to English
  const translations = FOOTER_TRANSLATIONS[currentLocale as keyof typeof FOOTER_TRANSLATIONS] || FOOTER_TRANSLATIONS.en;
  
  return {
    allRightsReserved: translations.allRightsReserved,
    language: translations.language,
    privacySettings: translations.privacySettings,
    profile: translations.profile,
    logout: translations.logout,
    login: translations.login,
    register: translations.register,
    links: translations.links,
    hasTranslations: true
  };
}

interface FooterProps {
  menuItems?: MenuItem[];
}

const Footer: React.FC<FooterProps> = ({ menuItems = [] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const { settings } = useSettings();
  const { setShowSettings } = useCookieSettings();

  // Use translations with fallback
  const translations = useFooterTranslations();
  
  // Get current locale for menu translations
  const currentLocale = getLocaleFromPathname(pathname);
  
  const isAuthenticated = !!session;
  const maxItemsPerColumn = 8;

  // Memoize menu grouping logic
  const { itemsWithSubitems, groupedItemsWithoutSubitems } = useMemo(() => {
    const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
    const itemsWithSubitems = safeMenuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        item.website_submenuitem?.length
    );
    const itemsWithoutSubitems = safeMenuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        !item.website_submenuitem?.length
    );
    const groupedItems: MenuItem[][] = [];
    for (let i = 0; i < itemsWithoutSubitems.length; i += maxItemsPerColumn) {
      groupedItems.push(itemsWithoutSubitems.slice(i, i + maxItemsPerColumn));
    }
    return {
      itemsWithSubitems,
      groupedItemsWithoutSubitems: groupedItems,
    };
  }, [menuItems]);

  // Memoize handlers
  const handleLogout = useMemo(() => () => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleNavigation = useMemo(() => (path: string) => () => router.push(path), [router]);

  const footerBackground = settings?.footer_color || 'neutral-900';

  // Rest of the component remains unchanged
  return (
    <footer className={`bg-${footerBackground} text-white py-12 px-6 md:px-8 min-h-[400px]`} role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowSettings(true)}
            className="text-neutral-400 hover:text-white text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            aria-label={translations.privacySettings}
          >
            {translations.privacySettings}
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5" aria-label="Footer navigation">
          {menuItems.length === 0 ? (
            <span className="text-neutral-500 text-sm">No menu items available</span>
          ) : (
            <>
              {itemsWithSubitems.map((item) => {
                // Get translated content for menu item
                const translatedDisplayName = currentLocale 
                  ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                  : item.display_name;

                return (
                  <div key={item.id} className="col-span-1 min-h-[200px]">
                    <h3 className="text-base font-semibold mb-4">
                      <LocalizedLink
                        href={item.url_name || '#'}
                        className="hover:text-neutral-300 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                      >
                        {translatedDisplayName}
                      </LocalizedLink>
                    </h3>
                    <ul className="space-y-2">
                      {item.website_submenuitem
                        ?.map((subItem) => {
                          // Get translated content for submenu item
                          const translatedSubItemName = currentLocale 
                            ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                            : subItem.name;

                          return (
                            <li key={subItem.id}>
                              <LocalizedLink
                                href={subItem.url_name || '#'}
                                className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                              >
                                {translatedSubItemName}
                              </LocalizedLink>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                );
              })}

              {groupedItemsWithoutSubitems.map((group, index) => (
                <div key={`group-${index}`} className="col-span-1 min-h-[200px]">
                  <h3 className="text-base font-semibold mb-4">
                    <LocalizedLink
                      href={group[0]?.url_name || '#'}
                      className="hover:text-neutral-300 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    >
                      {itemsWithSubitems.length ? '' : translations.links}
                    </LocalizedLink>
                  </h3>
                  <ul className="space-y-2">
                    {group.map((item) => {
                      // Get translated content for menu item
                      const translatedDisplayName = currentLocale 
                        ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                        : item.display_name;

                      return (
                        <li key={item.id}>
                          <LocalizedLink
                            href={item.url_name || '#'}
                            className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          >
                            {translatedDisplayName}
                          </LocalizedLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="col-span-1 min-h-[200px]">
                <h3 className="text-base font-semibold mb-4">{translations.profile}</h3>
                <ul className="space-y-2">
                  {isAuthenticated ? (
                    <li>
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                        aria-label={translations.logout}
                      >
                        {translations.logout}
                      </button>
                    </li>
                  ) : (
                    <>
                      <li>
                        <button
                          type="button"
                          onClick={handleNavigation('/login')}
                          className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          aria-label={translations.login}
                        >
                          {translations.login}
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleNavigation('/register')}
                          className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          aria-label={translations.register}
                        >
                          {translations.register}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}
        </nav>

        <div className="mt-12 border-t border-neutral-500 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <small className="text-xs text-neutral-500">
              © {new Date().getFullYear()} {settings?.site || 'Company'}. {translations.allRightsReserved}.
            </small>
            {settings?.with_language_switch && (
              <ModernLanguageSwitcher openUpward={true} variant="dark" />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);