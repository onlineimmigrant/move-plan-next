'use client';

/**
 * AdminModalProviders - Lazy-loaded wrapper for all admin modal context providers
 * This component bundles all admin-only modal contexts into a single chunk
 * that's only loaded for authenticated admin/superadmin users.
 * 
 * Performance impact: ~35 KiB savings for non-admin users
 * Created: 2025-12-17 - Performance optimization
 */

import { PostEditModalProvider } from '@/components/modals/PostEditModal/context';
import { TemplateSectionEditProvider } from '@/components/modals/TemplateSectionModal/context';
import { TemplateHeadingSectionEditProvider } from '@/components/modals/TemplateHeadingSectionModal/context';
import { PageCreationProvider } from '@/components/modals/PageCreationModal/context';
import { SiteMapModalProvider } from '@/components/modals/SiteMapModal/context';
import { GlobalSettingsModalProvider } from '@/components/modals/GlobalSettingsModal/context';
import { HeroSectionEditProvider } from '@/components/modals/HeroSectionModal/context';
import { HeaderEditProvider } from '@/components/modals/HeaderEditModal/context';
import { FooterEditProvider } from '@/components/modals/FooterEditModal/context';
import { LayoutManagerProvider } from '@/components/modals/LayoutManagerModal/context';
import { SettingsModalProvider } from '@/components/modals/SettingsModal/context';
import { ShopModalProvider } from '@/components/modals/ShopModal/context';
import { ProfileDataManagerModalProvider } from '@/components/modals/ProfileDataManagerModal/context';
import { CrmModalProvider } from '@/components/modals/CrmModal/context';
import { VideoStudioProvider } from '@/components/modals/VideoStudioModal/context';

interface AdminModalProvidersProps {
  children: React.ReactNode;
}

/**
 * Wraps children with all admin modal context providers
 * This entire component is lazy-loaded only for admin users
 */
export function AdminModalProviders({ children }: AdminModalProvidersProps) {
  return (
    <HeaderEditProvider>
      <FooterEditProvider>
        <LayoutManagerProvider>
          <SettingsModalProvider>
            <PostEditModalProvider>
              <TemplateSectionEditProvider>
                <TemplateHeadingSectionEditProvider>
                  <HeroSectionEditProvider>
                    <PageCreationProvider>
                      <SiteMapModalProvider>
                        <GlobalSettingsModalProvider>
                          <ShopModalProvider>
                            <ProfileDataManagerModalProvider>
                              <CrmModalProvider>
                                <VideoStudioProvider>
                                  {children}
                                </VideoStudioProvider>
                              </CrmModalProvider>
                            </ProfileDataManagerModalProvider>
                          </ShopModalProvider>
                        </GlobalSettingsModalProvider>
                      </SiteMapModalProvider>
                    </PageCreationProvider>
                  </HeroSectionEditProvider>
                </TemplateHeadingSectionEditProvider>
              </TemplateSectionEditProvider>
            </PostEditModalProvider>
          </SettingsModalProvider>
        </LayoutManagerProvider>
      </FooterEditProvider>
    </HeaderEditProvider>
  );
}
