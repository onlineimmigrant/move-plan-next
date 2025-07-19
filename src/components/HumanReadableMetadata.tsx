import React from 'react';
import { pageMetadataDefinitions } from '@/lib/page-metadata-definitions';

interface HumanReadableMetadataProps {
  pathname: string;
}

export default function HumanReadableMetadata({ pathname }: HumanReadableMetadataProps) {
  const pageData = pageMetadataDefinitions[pathname];
  
  if (!pageData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Metadata Information</h2>
        <p className="text-red-700">No metadata found for path: {pathname}</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-blue-800 mb-4">📊 Page Metadata Information</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Title */}
        <div className="bg-white rounded border border-blue-100 p-4">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            🏷️ Page Title:
          </label>
          <p className="text-gray-900 font-medium">
            {pageData.title}
          </p>
        </div>

        {/* Description */}
        <div className="bg-white rounded border border-blue-100 p-4">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            📝 Description:
          </label>
          <p className="text-gray-900">
            {pageData.description}
          </p>
        </div>

        {/* Keywords */}
        {pageData.keywords && (
          <div className="bg-white rounded border border-blue-100 p-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              🔍 Keywords:
            </label>
            <p className="text-gray-900">
              {pageData.keywords}
            </p>
          </div>
        )}

        {/* OpenGraph Title */}
        {pageData.openGraph?.title && (
          <div className="bg-white rounded border border-blue-100 p-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              📱 OpenGraph Title:
            </label>
            <p className="text-gray-900">
              {pageData.openGraph.title}
            </p>
          </div>
        )}

        {/* OpenGraph Description */}
        {pageData.openGraph?.description && (
          <div className="bg-white rounded border border-blue-100 p-4 lg:col-span-2">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              📱 OpenGraph Description:
            </label>
            <p className="text-gray-900">
              {pageData.openGraph.description}
            </p>
          </div>
        )}

        {/* OpenGraph Image */}
        {pageData.openGraph?.images?.[0]?.url && (
          <div className="bg-white rounded border border-blue-100 p-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              🖼️ OpenGraph Image:
            </label>
            <p className="text-gray-900 text-sm break-all">
              {pageData.openGraph.images[0].url}
            </p>
          </div>
        )}

        {/* Twitter Card */}
        {pageData.twitter?.card && (
          <div className="bg-white rounded border border-blue-100 p-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              🐦 Twitter Card Type:
            </label>
            <p className="text-gray-900">
              {pageData.twitter.card}
            </p>
          </div>
        )}

        {/* Robots */}
        {pageData.robots && (
          <div className="bg-white rounded border border-blue-100 p-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              🤖 Robots Directive:
            </label>
            <p className="text-gray-900">
              {pageData.robots}
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white rounded border border-blue-100 p-4 lg:col-span-2">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            ℹ️ Additional Information:
          </label>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• This metadata is used for SEO, social media sharing, and search engine indexing</p>
            <p>• OpenGraph tags control how this page appears when shared on social media</p>
            <p>• Twitter cards optimize the display when shared on Twitter</p>
            <p>• Robots directives tell search engines how to index this page</p>
          </div>
        </div>
      </div>
    </div>
  );
}
