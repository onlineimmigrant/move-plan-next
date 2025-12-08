/**
 * SettingsModal - Legal Notice & Footer Disclaimer Settings
 * Features: Company information, regulatory details, footer disclaimer
 */

'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useSettingsModal } from './context';
import Button from '@/ui/Button';
import { toast } from 'react-hot-toast';

export function SettingsModal() {
  const { isOpen, closeModal } = useSettingsModal();
  const { settings, updateSettings } = useSettings();
  const { isAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Legal Notice fields
  const [enabled, setEnabled] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [managingDirectors, setManagingDirectors] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [tradeRegistry, setTradeRegistry] = useState('');
  const [professionalLicenses, setProfessionalLicenses] = useState<string[]>([]);
  const [regulatoryBodies, setRegulatoryBodies] = useState<string[]>([]);
  
  // Footer disclaimer fields
  const [showFooterDisclaimer, setShowFooterDisclaimer] = useState(false);
  const [footerDisclaimer, setFooterDisclaimer] = useState('');

  // Load data from settings
  useEffect(() => {
    console.log('🔄 [SettingsModal] useEffect triggered:', { isOpen, hasLegalNotice: !!settings.legal_notice });
    console.log('📦 [SettingsModal] Current settings.legal_notice:', settings.legal_notice);
    
    if (isOpen) {
      if (settings.legal_notice) {
        const ln = settings.legal_notice;
        console.log('✅ [SettingsModal] Loading legal notice data:', ln);
        
        setEnabled(ln.enabled || false);
        setCompanyName(ln.company_name || '');
        setLegalForm(ln.legal_form || '');
        setRegisteredAddress(ln.registered_address || '');
        setRegistrationNumber(ln.registration_number || '');
        setVatNumber(ln.vat_number || '');
        setManagingDirectors(ln.managing_directors || []);
        setContactEmail(ln.contact_email || '');
        setContactPhone(ln.contact_phone || '');
        setTradeRegistry(ln.trade_registry || '');
        setProfessionalLicenses(ln.professional_licenses || []);
        setRegulatoryBodies(ln.regulatory_bodies || []);
        setShowFooterDisclaimer(ln.show_footer_disclaimer || false);
        setFooterDisclaimer(ln.footer_disclaimer || '');
      } else {
        console.log('⚠️ [SettingsModal] Modal is open but no legal_notice data found - initializing with defaults');
        // Initialize with empty values
        setEnabled(false);
        setCompanyName('');
        setLegalForm('');
        setRegisteredAddress('');
        setRegistrationNumber('');
        setVatNumber('');
        setManagingDirectors([]);
        setContactEmail('');
        setContactPhone('');
        setTradeRegistry('');
        setProfessionalLicenses([]);
        setRegulatoryBodies([]);
        setShowFooterDisclaimer(false);
        setFooterDisclaimer('');
      }
    }
  }, [isOpen, settings.legal_notice]);

  // Handle save
  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    setIsSaving(true);
    try {
      const updatedLegalNotice = {
        enabled,
        company_name: companyName,
        legal_form: legalForm,
        registered_address: registeredAddress,
        registration_number: registrationNumber,
        vat_number: vatNumber,
        managing_directors: managingDirectors.filter(d => d.trim() !== ''),
        contact_email: contactEmail,
        contact_phone: contactPhone,
        trade_registry: tradeRegistry,
        professional_licenses: professionalLicenses.filter(l => l.trim() !== ''),
        regulatory_bodies: regulatoryBodies.filter(r => r.trim() !== ''),
        show_footer_disclaimer: showFooterDisclaimer,
        footer_disclaimer: footerDisclaimer,
      };

      await updateSettings({ legal_notice: updatedLegalNotice });
      toast.success('Settings saved successfully');
      closeModal();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to add/remove array items
  const handleDirectorChange = (index: number, value: string) => {
    const newDirectors = [...managingDirectors];
    newDirectors[index] = value;
    setManagingDirectors(newDirectors);
  };

  const addDirector = () => {
    setManagingDirectors([...managingDirectors, '']);
  };

  const removeDirector = (index: number) => {
    setManagingDirectors(managingDirectors.filter((_, i) => i !== index));
  };

  const handleLicenseChange = (index: number, value: string) => {
    const newLicenses = [...professionalLicenses];
    newLicenses[index] = value;
    setProfessionalLicenses(newLicenses);
  };

  const addLicense = () => {
    setProfessionalLicenses([...professionalLicenses, '']);
  };

  const removeLicense = (index: number) => {
    setProfessionalLicenses(professionalLicenses.filter((_, i) => i !== index));
  };

  const handleRegulatoryBodyChange = (index: number, value: string) => {
    const newBodies = [...regulatoryBodies];
    newBodies[index] = value;
    setRegulatoryBodies(newBodies);
  };

  const addRegulatoryBody = () => {
    setRegulatoryBodies([...regulatoryBodies, '']);
  };

  const removeRegulatoryBody = (index: number) => {
    setRegulatoryBodies(regulatoryBodies.filter((_, i) => i !== index));
  };

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Legal Notice Settings</h2>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Enable Legal Notice (required for UK/EU compliance)
            </label>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., ACME Ltd"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Form
              </label>
              <input
                type="text"
                value={legalForm}
                onChange={(e) => setLegalForm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Limited Liability Company, GmbH, PLC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered Address
              </label>
              <textarea
                value={registeredAddress}
                onChange={(e) => setRegisteredAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full registered address"
              />
            </div>
          </div>

          {/* Registration Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Registration Number
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., GB123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Registry
              </label>
              <input
                type="text"
                value={tradeRegistry}
                onChange={(e) => setTradeRegistry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Handelsregister München HRB 123456"
              />
            </div>
          </div>

          {/* Managing Directors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Managing Directors</h3>
              <button
                type="button"
                onClick={addDirector}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add
              </button>
            </div>
            
            {managingDirectors.map((director, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={director}
                  onChange={(e) => handleDirectorChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name"
                />
                <button
                  type="button"
                  onClick={() => removeDirector(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+44 20 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Professional Licenses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Professional Licenses</h3>
              <button
                type="button"
                onClick={addLicense}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add
              </button>
            </div>
            
            {professionalLicenses.map((license, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={license}
                  onChange={(e) => handleLicenseChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., FCA Authorization Number: 123456"
                />
                <button
                  type="button"
                  onClick={() => removeLicense(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Regulatory Bodies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Regulatory Bodies</h3>
              <button
                type="button"
                onClick={addRegulatoryBody}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add
              </button>
            </div>
            
            {regulatoryBodies.map((body, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => handleRegulatoryBodyChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Financial Conduct Authority (FCA)"
                />
                <button
                  type="button"
                  onClick={() => removeRegulatoryBody(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Disclaimer */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Footer Disclaimer</h3>
            
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <input
                type="checkbox"
                id="showFooterDisclaimer"
                checked={showFooterDisclaimer}
                onChange={(e) => setShowFooterDisclaimer(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="showFooterDisclaimer" className="text-sm font-medium text-gray-700">
                Show disclaimer in footer (e.g., FCA authorization, regulatory information)
              </label>
            </div>

            {showFooterDisclaimer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disclaimer Text (single language)
                </label>
                <textarea
                  value={footerDisclaimer}
                  onChange={(e) => setFooterDisclaimer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Authorized and regulated by the Financial Conduct Authority. FRN: 123456"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This text will appear above the copyright notice in your footer. Single language only (national requirement).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={closeModal}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
