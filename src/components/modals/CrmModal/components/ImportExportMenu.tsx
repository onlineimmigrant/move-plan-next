import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  Code, 
  X, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Profile } from '../types';
import {
  profilesToCSV,
  profilesToJSON,
  csvToProfiles,
  jsonToProfiles,
  generateTemplateData,
  fieldExplanations,
} from '../utils/importExportUtils';

interface ImportExportMenuProps {
  profiles: Profile[];
  organizationId: string;
  onImportComplete: () => void;
  onClose: () => void;
  mode: 'import' | 'export';
  primary: { base: string; hover: string };
}

export default function ImportExportMenu({
  profiles,
  organizationId,
  onImportComplete,
  onClose,
  mode,
  primary,
}: ImportExportMenuProps) {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export handlers
  const handleExportCSV = () => {
    const csv = profilesToCSV(profiles);
    downloadFile(csv, `accounts-export-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = profilesToJSON(profiles);
    downloadFile(json, `accounts-export-${Date.now()}.json`, 'application/json');
  };

  // Download template handlers
  const handleDownloadTemplateCSV = () => {
    const template = generateTemplateData();
    const headers = Object.keys(template);
    const values = Object.values(template);
    const csv = [headers.join(','), values.join(',')].join('\n');
    
    downloadFile(csv, 'account-import-template.csv', 'text/csv');
    
    // Also download explanation as separate file
    downloadFile(fieldExplanations, 'import-instructions.txt', 'text/plain');
  };

  const handleDownloadTemplateJSON = () => {
    const template = generateTemplateData();
    const json = JSON.stringify([template], null, 2);
    downloadFile(json, 'account-import-template.json', 'application/json');
    
    // Also download explanation
    downloadFile(fieldExplanations, 'import-instructions.txt', 'text/plain');
  };

  // Import handlers
  const handleFileSelect = (format: 'csv' | 'json') => {
    const input = fileInputRef.current;
    if (!input) return;
    
    input.accept = format === 'csv' ? '.csv' : '.json';
    input.onchange = (e) => handleFileUpload(e, format);
    input.click();
  };

  const handleFileUpload = async (e: Event, format: 'csv' | 'json') => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      let profilesData: any[] = [];

      if (format === 'csv') {
        const text = await file.text();
        profilesData = csvToProfiles(text);
      } else if (format === 'json') {
        const text = await file.text();
        profilesData = jsonToProfiles(text);
      }

      // Send to API for bulk import
      const response = await fetch('/api/accounts/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: profilesData,
          organizationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResults({
        success: result.imported || 0,
        failed: result.failed || 0,
        errors: result.errors || [],
      });

      if (result.imported > 0) {
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch (error: any) {
      setImportResults({
        success: 0,
        failed: 1,
        errors: [error.message],
      });
    } finally {
      setImporting(false);
      if (target) target.value = '';
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === 'export' ? (
              <Download className="w-6 h-6" style={{ color: primary.base }} />
            ) : (
              <Upload className="w-6 h-6" style={{ color: primary.base }} />
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'export' ? 'Export Accounts' : 'Import Accounts'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Export {profiles.length} account(s) to your preferred format:
              </p>

              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
              >
                <FileText className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">CSV (Comma-Separated Values)</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compatible with Excel, Google Sheets, and most spreadsheet software
                  </p>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
              >
                <Code className="w-8 h-8 text-purple-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">JSON</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    For developers and API integrations
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-2">Before importing:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Download a template file below to see the required format</li>
                      <li>Fill in your account data following the structure</li>
                      <li>Upload the completed file</li>
                      <li>New accounts will be created, existing ones (by email) will be updated</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Download Templates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  1. Download Template
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadTemplateCSV}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-green-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">CSV</span>
                  </button>
                  <button
                    onClick={handleDownloadTemplateJSON}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <Code className="w-8 h-8 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">JSON</span>
                  </button>
                </div>
              </div>

              {/* Upload File */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  2. Upload Completed File
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleFileSelect('csv')}
                    disabled={importing}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-8 h-8 text-green-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {importing ? 'Uploading...' : 'Upload CSV'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleFileSelect('json')}
                    disabled={importing}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-8 h-8 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {importing ? 'Uploading...' : 'Upload JSON'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Import Results */}
              {importResults && (
                <div className={`rounded-lg p-4 ${
                  importResults.success > 0 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex gap-3">
                    {importResults.success > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        importResults.success > 0 
                          ? 'text-green-900 dark:text-green-100' 
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        Import Results
                      </h4>
                      <p className={`text-sm mt-1 ${
                        importResults.success > 0 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        Successfully imported: {importResults.success} account(s)
                        {importResults.failed > 0 && ` | Failed: ${importResults.failed}`}
                      </p>
                      {importResults.errors.length > 0 && (
                        <ul className="mt-2 text-sm space-y-1 text-red-800 dark:text-red-200">
                          {importResults.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
        />
      </div>
    </div>
  );
}
