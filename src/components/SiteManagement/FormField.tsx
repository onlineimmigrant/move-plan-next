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
  disabled?: boolean;
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

const fieldClasses = "w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl text-gray-900 placeholder-gray-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400/60 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300/80 hover:shadow-md hover:bg-white/80 hover:backdrop-blur-md";

export const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  className = '',
  disabled = false
}) => (
  <div className="modal-field-group">
    <label className="modal-label">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={(e) => !disabled && onChange(name, e.target.value)}
      className={`${fieldClasses} ${className} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100/80' : ''}`}
      placeholder={placeholder}
      disabled={disabled}
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
  <div className="modal-field-group">
    <label className="modal-label">{label}</label>
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
  <div className="modal-field-group">
    <label className="modal-label">{label}</label>
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
  <div className={`modal-field-group modal-field-group--compact ${className}`}>
    <div className="flex items-center bg-white/60 backdrop-blur-sm border border-sky-200/60 rounded-xl p-4 hover:bg-white/80 hover:border-sky-300/60 transition-all duration-300 group shadow-sm">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked || false}
        onChange={(e) => onChange(name, e.target.checked)}
        className="h-5 w-5 text-sky-500 focus:ring-sky-500/30 border-sky-300 rounded-md transition-all duration-300 bg-white/80 shadow-sm"
      />
      <label htmlFor={name} className="ml-3 modal-label !mb-0 cursor-pointer group-hover:text-sky-800 transition-colors duration-300">
        {label}
      </label>
    </div>
  </div>
);
