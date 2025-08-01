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

const fieldClasses = "w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-xl text-gray-900 placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-light shadow-sm hover:border-gray-300 hover:shadow-md hover:bg-white/70";

export const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  className = ''
}) => (
  <div className="space-y-3">
    <label className="block text-sm font-light text-gray-700 mb-2">{label}</label>
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
  <div className="space-y-3">
    <label className="block text-sm font-light text-gray-700 mb-2">{label}</label>
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
  <div className="space-y-3">
    <label className="block text-sm font-light text-gray-700 mb-2">{label}</label>
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
  <div className={`flex items-center bg-white/60 backdrop-blur-sm border border-sky-200/60 rounded-xl p-4 hover:bg-white/80 hover:border-sky-300/60 transition-all duration-300 group shadow-sm ${className}`}>
    <input
      type="checkbox"
      id={name}
      name={name}
      checked={checked || false}
      onChange={(e) => onChange(name, e.target.checked)}
      className="h-5 w-5 text-sky-500 focus:ring-sky-500/30 border-sky-300 rounded-md transition-all duration-300 bg-white/80 shadow-sm"
    />
    <label htmlFor={name} className="ml-3 text-sm font-light text-sky-900/80 cursor-pointer group-hover:text-sky-800 transition-colors duration-300">
      {label}
    </label>
  </div>
);
