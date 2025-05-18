// src/components/study-plan/RadioGroup.tsx
import { Dispatch, SetStateAction } from 'react';

interface RadioGroupProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

const RadioGroup = ({ options, selected, onChange }: RadioGroupProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((style) => (
        <label
          key={style}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <input
            type="radio"
            name="style"
            value={style}
            checked={selected === style}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 text-sky-600 border-gray-300 focus:ring-sky-500 transition-colors duration-200"
          />
          <span className="text-sm font-medium text-gray-700 capitalize hover:text-sky-600 transition-colors duration-200">
            {style}
          </span>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;