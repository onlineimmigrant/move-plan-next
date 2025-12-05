// src/components/study-plan/StudyPlanHeader.tsx
import { Dispatch, SetStateAction } from 'react';
import { HiCog, HiX } from 'react-icons/hi';
import Button from '@/ui/Button';
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
      <div className=" flex justify-between items-start">
        <div className=" p-2 rounded-md flex justify-start space-x-2 items-center cursor-pointer">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="text-left flex items-center text-sm text-sky-600 cursor-pointer font-medium hover:text-sky-500"
            title="Edit Study Plan Period"
          >
            
            <HiCog className="w-6 h-6 mr-4" />
            {studyPlanPeriod}
          </button>
        </div>
        <div className="flex justify-end  p-2 space-x-2 items-center cursor-pointer">
          {preference.style === 'flexible' && (
            <>
              <button
                onClick={() => setIsEditingDates(!isEditingDates)}
                className="text-sm text-sky-600 font-medium cursor-pointer hover:text-sky-500"
                title={isEditingDates ? 'Cancel Editing Dates' : 'Edit Lesson Dates'}
              >
                {isEditingDates ? 'Cancel' : 'Dates'}
              </button>
              {isEditingDates && (
                <button
                  onClick={handleSaveDates}
                  className="text-sm text-sky-600 font-medium cursor-pointer hover:text-sky-500"
                  title="Save Lesson Dates"
                >
                  Save Dates
                </button>
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
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="absolute top-4 right-4 sm:left-4  text-gray-600 hover:text-gray-800 transition-colors duration-200"
                aria-label="Close settings modal"
              >
                <HiX className="w-8 h-8 bg-gray-100 hover:bg-gray-50 rounded-full p-1" />
              </button>
              <h1 className="text-lg font-bold text-gray-800 mb-6 text-center">
                Settings
              </h1>
              <form onSubmit={handleSettingsSubmit} className="space-y-16">
                <div>
                  <h2 className="text-base font-semibold text-gray-700 mb-4">
                    Learning Style
                  </h2>
                  <RadioGroup
                    options={['intensive', 'flexible', 'linear']}
                    selected={preference.style}
                    onChange={(value) => setPreference({ ...preference, style: value as any })}
                  />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-700 mb-4">
                    Period
                  </h2>
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
                  variant="start"
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