import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { FIELD_LABELS, EDITABLE_FIELDS } from '@/components/constants/profile';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';

interface Profile {
  id: string;
  uuid: string;
  username: string;
  full_name: string | null;
  created_at: string;
  email: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  role: string | null;
  updated_at: string;
}

interface ProfileTableProps {
  profile: Profile;
  profileEntries: [keyof Profile, string | null][];
  onEdit: (field: keyof Profile, currentValue: string | null) => void;
}

export const ProfileTable: React.FC<ProfileTableProps> = ({ profile, profileEntries, onEdit }) => {
  const { t } = useAccountTranslations();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="Profile information">
        <thead className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
          <tr role="row">
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 z-20 bg-gray-50/80 dark:bg-gray-700/50"
              role="columnheader"
            >
              Field
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              role="columnheader"
            >
              Value
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              role="columnheader"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm divide-y divide-gray-200 dark:divide-gray-700">
          {profileEntries.map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition duration-150" role="row">
              <td 
                className="border-r border-gray-200 dark:border-gray-700 sm:min-w-xs min-w-48 px-6 py-4 text-sm text-gray-900 dark:text-white sticky left-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                role="cell"
              >
                {FIELD_LABELS[key] ?? key}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white" role="cell">
                {value || 'N/A'}
              </td>
              <td className="px-6 py-4 text-sm" role="cell">
                {key !== 'role' && EDITABLE_FIELDS.includes(key) ? (
                  <button
                    onClick={() => onEdit(key, value)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                    aria-label={`Edit ${FIELD_LABELS[key] ?? key}`}
                  >
                    <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{t.edit}</span>
                  </button>
                ) : (
                  <span className="text-gray-400" aria-label="Not editable">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
