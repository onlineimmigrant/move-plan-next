// components/TheoryPracticeBooksTabs/TabNavigation.tsx
import { Dispatch, SetStateAction } from 'react';

// Define Tab type to match EduProTopicDetail
type Tab = 'theory' | 'practice' | 'studyBooks';

interface TabOption {
  label: string;
  value: Tab;
}

interface TabNavigationProps {
  tabs: TabOption[];
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

export default function TabNavigation({ tabs, activeTab, setActiveTab }: TabNavigationProps) {
  const getSliderPosition = () => {
    const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);
    const positions = ['translate-x-0', 'translate-x-[100%]', 'translate-x-[200%]'];
    return positions[activeIndex] || 'translate-x-0';
  };

  return (
    <div className=" select-none flex justify-center mb-2" role="tablist" aria-label="Course Sections">
      <div className="relative w-full max-w-[480px] h-11 bg-transparent border-2 border-transparent rounded-lg cursor-pointer overflow-hidden px-0.5">
        <div
          className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.33%-2px)] bg-sky-600 rounded-md transition-transform duration-200 ease-in-out transform ${getSliderPosition()}`}
        />
        <div className="relative flex h-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              id={`${tab.value}-tab`}
              role="tab"
              aria-selected={activeTab === tab.value}
              aria-controls={`${tab.value}-panel`}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 flex justify-center cursor-pointer items-center text-sky-600 text-sm sm:text-base mona-sans px-0.5 ${
                activeTab === tab.value ? 'font-semibold text-white z-10' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}