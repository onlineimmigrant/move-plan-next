import React from 'react';

interface BaseFieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (name: string, value: any) => void;
  className?: string;
  placeholder?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'url';
}

interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  options: Array<{ name: string; value: string }>;
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
}

const fieldClasses = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md";

export const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  className = ''
}) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      className={`${fieldClasses} ${className}`}
      placeholder={placeholder}
    />
  </div>
);

export const TextAreaField: React.FC<TextAreaFieldProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  rows = 3,
  placeholder,
  className = ''
}) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
    <textarea
      name={name}
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      rows={rows}
      className={`${fieldClasses} resize-none ${className}`}
      placeholder={placeholder}
    />
  </div>
);

export const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options,
  className = ''
}) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
    <select
      name={name}
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      className={`${fieldClasses} appearance-none cursor-pointer ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  </div>
);

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ 
  label, 
  name, 
  checked, 
  onChange,
  className = ''
}) => (
  <div className={`flex items-center bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-3 hover:from-sky-100 hover:to-blue-100 hover:border-sky-200 transition-all duration-300 group ${className}`}>
    <input
      type="checkbox"
      id={name}
      name={name}
      checked={checked || false}
      onChange={(e) => onChange(name, e.target.checked)}
      className="h-4 w-4 text-sky-500 focus:ring-sky-500/30 border-sky-300 rounded transition-all duration-300 bg-white shadow-sm"
    />
    <label htmlFor={name} className="ml-3 text-xs font-semibold text-sky-900 cursor-pointer group-hover:text-sky-800 transition-colors duration-300">
      {label}
    </label>
  </div>
);
