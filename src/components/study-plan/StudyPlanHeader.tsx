// src/components/study-plan/StudyPlanHeader.tsx
import { Dispatch, SetStateAction } from 'react';
import { HiCog, HiX } from 'react-icons/hi';
import Button from './Button';
import DateInput from './DateInput';
import RadioGroup from './RadioGroup';
import { StudyPlanPreference } from './types';

interface StudyPlanHeaderProps {
  studyPlanPeriod: string;
  preference: StudyPlanPreference;
  isEditingDates: boolean;
  setIsEditingDates: Dispatch<SetStateAction<boolean>>;
  setIsSettingsModalOpen: Dispatch<SetStateAction<boolean>>;
  handleSaveDates: () => void;
  handleSettingsSubmit: (e: React.FormEvent) => void;
  newStartDate: string;
  setNewStartDate: Dispatch<SetStateAction<string>>;
  newEndDate: string;
  setNewEndDate: Dispatch<SetStateAction<string>>;
  purchaseLimits: { start: Date; end: Date | null } | null;
  setPreference: Dispatch<SetStateAction<StudyPlanPreference>>;
  isSettingsModalOpen: boolean;
}

const StudyPlanHeader = ({
  studyPlanPeriod,
  preference,
  isEditingDates,
  setIsEditingDates,
  setIsSettingsModalOpen,
  handleSaveDates,
  handleSettingsSubmit,
  newStartDate,
  setNewStartDate,
  newEndDate,
  setNewEndDate,
  purchaseLimits,
  setPreference,
  isSettingsModalOpen,
}: StudyPlanHeaderProps) => {
  // Helper function to validate if a date string is valid
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-start">
        <div className="flex justify-start space-x-2 items-center">
          <Button
            onClick={() => setIsSettingsModalOpen(true)}
            className="text-left flex items-center text-xs text-sky-500 font-light hover:underline"
            title="Edit Study Plan Period"
          >
            {studyPlanPeriod}
            <HiCog className="w-6 h-6 ml-1" />
          </Button>
        </div>
        <div className="flex justify-end space-x-2 items-center">
          {preference.style === 'flexible' && (
            <>
              <Button
                onClick={() => setIsEditingDates(!isEditingDates)}
                className="text-xs text-sky-500 font-light hover:underline"
                title={isEditingDates ? 'Cancel Editing Dates' : 'Edit Lesson Dates'}
              >
                {isEditingDates ? 'Cancel' : 'Dates'}
              </Button>
              {isEditingDates && (
                <Button
                  onClick={handleSaveDates}
                  className="text-xs text-sky-500 font-light hover:underline"
                  title="Save Lesson Dates"
                >
                  Save Dates
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-transparent transition-opacity duration-300"
            onClick={() => setIsSettingsModalOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-gradient-to-br from-white to-gray-50 shadow-2xl sm:rounded-l-2xl overflow-auto transform transition-transform duration-300 translate-x-0">
            <div className="relative p-6 sm:p-8">
              <Button
                onClick={() => setIsSettingsModalOpen(false)}
                className="absolute top-4 right-4 sm:left-4  text-gray-600 hover:text-gray-800 transition-colors duration-200"
                aria-label="Close settings modal"
              >
                <HiX className="w-8 h-8 bg-gray-100 hover:bg-gray-50 rounded-full p-1" />
              </Button>
              <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">
                Settings
              </h2>
              <form onSubmit={handleSettingsSubmit} className="space-y-16">
                <div>
                  <h3 className="text-base font-semibold text-gray-700 mb-4">
                    Learning Style
                  </h3>
                  <RadioGroup
                    options={['intensive', 'flexible', 'linear']}
                    selected={preference.style}
                    onChange={(value) => setPreference({ ...preference, style: value as any })}
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-700 mb-4">
                    Period
                  </h3>
                  <div className="space-y-4">
                    <DateInput
                      label="Start Date"
                      id="start-date"
                      value={newStartDate}
                      onChange={setNewStartDate}
                      min={purchaseLimits?.start.toISOString().split('T')[0]}
                      max={purchaseLimits?.end ? purchaseLimits.end.toISOString().split('T')[0] : undefined}
                    />
                    <DateInput
                      label="End Date"
                      id="end-date"
                      value={newEndDate}
                      onChange={setNewEndDate}
                      min={isValidDate(newStartDate) ? new Date(newStartDate).toISOString().split('T')[0] : undefined} // Only set min if newStartDate is valid
                      max={purchaseLimits?.end ? purchaseLimits.end.toISOString().split('T')[0] : undefined}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Save
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudyPlanHeader;