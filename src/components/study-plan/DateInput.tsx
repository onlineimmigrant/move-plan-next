// src/components/study-plan/DateInput.tsx
import { Dispatch, SetStateAction } from 'react';

interface DateInputProps {
  label: string;
  id: string;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  min?: string;
  max?: string;
}

const DateInput = ({ label, id, value, onChange, min, max }: DateInputProps) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-600 mb-1"
      >
        {label}
      </label>
      <input
        type="date"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200 bg-white hover:bg-gray-50"
      />
    </div>
  );
};

export default DateInput;