'use client';

import React from 'react';
import { useLegalNoticeTranslations } from './useLegalNoticeTranslations';
import { useSettings } from '@/context/SettingsContext';
import CloseButton from '@/ui/CloseButton';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ isOpen, onClose }) => {
  const t = useLegalNoticeTranslations();
  const { settings } = useSettings();

  if (!isOpen) return null;

  const legalNotice = settings?.legal_notice;
  const hasData = legalNotice?.enabled && (
    legalNotice.company_name ||
    legalNotice.legal_form ||
    legalNotice.registered_address ||
    legalNotice.registration_number ||
    legalNotice.vat_number
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/95 backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-gray-900">{t.legalNotice}</h2>
          <CloseButton onClick={onClose} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!hasData ? (
            <p className="text-gray-500 text-center py-8">{t.noInformation}</p>
          ) : (
            <>
              {legalNotice?.company_name && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.companyName}</h3>
                  <p className="text-base text-gray-900">{legalNotice.company_name}</p>
                </div>
              )}

              {legalNotice?.legal_form && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.legalForm}</h3>
                  <p className="text-base text-gray-900">{legalNotice.legal_form}</p>
                </div>
              )}

              {legalNotice?.registered_address && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.registeredAddress}</h3>
                  <p className="text-base text-gray-900 whitespace-pre-line">{legalNotice.registered_address}</p>
                </div>
              )}

              {legalNotice?.registration_number && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.registrationNumber}</h3>
                  <p className="text-base text-gray-900">{legalNotice.registration_number}</p>
                </div>
              )}

              {legalNotice?.vat_number && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.vatNumber}</h3>
                  <p className="text-base text-gray-900">{legalNotice.vat_number}</p>
                </div>
              )}

              {legalNotice?.managing_directors && legalNotice.managing_directors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.managingDirectors}</h3>
                  <ul className="text-base text-gray-900 space-y-1">
                    {legalNotice.managing_directors.map((director: string, index: number) => (
                      <li key={index}>{director}</li>
                    ))}
                  </ul>
                </div>
              )}

              {legalNotice?.contact_email && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.contactEmail}</h3>
                  <p className="text-base text-gray-900">
                    <a href={`mailto:${legalNotice.contact_email}`} className="text-blue-600 hover:underline">
                      {legalNotice.contact_email}
                    </a>
                  </p>
                </div>
              )}

              {legalNotice?.contact_phone && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.contactPhone}</h3>
                  <p className="text-base text-gray-900">
                    <a href={`tel:${legalNotice.contact_phone}`} className="text-blue-600 hover:underline">
                      {legalNotice.contact_phone}
                    </a>
                  </p>
                </div>
              )}

              {legalNotice?.trade_registry && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.tradeRegistry}</h3>
                  <p className="text-base text-gray-900">{legalNotice.trade_registry}</p>
                </div>
              )}

              {legalNotice?.professional_licenses && legalNotice.professional_licenses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.professionalLicenses}</h3>
                  <ul className="text-base text-gray-900 space-y-1">
                    {legalNotice.professional_licenses.map((license: string, index: number) => (
                      <li key={index}>{license}</li>
                    ))}
                  </ul>
                </div>
              )}

              {legalNotice?.regulatory_bodies && legalNotice.regulatory_bodies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.regulatoryBodies}</h3>
                  <ul className="text-base text-gray-900 space-y-1">
                    {legalNotice.regulatory_bodies.map((body: string, index: number) => (
                      <li key={index}>{body}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalNoticeModal;
