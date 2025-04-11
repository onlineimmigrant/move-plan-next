// components/DynamicReportComponent/SelectReportFields.tsx
import React from "react";
import { useSettings } from "@/context/SettingsContext";

interface SelectReportFieldsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fields: string[];
  selectedFields: string[];
  setSelectedFields: (fields: string[]) => void;
}

const SelectReportFields: React.FC<SelectReportFieldsProps> = ({
  isOpen,
  setIsOpen,
  fields,
  selectedFields,
  setSelectedFields,
}) => {
  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
      <div className="py-1">
        {fields.map((field) => (
          <button
            key={field}
            onClick={() => toggleField(field)}
            style={
              selectedFields.includes(field)
                ? { backgroundColor: "var(--primary-color)" }
                : {}
            }
            className={`block w-full text-left px-4 py-2 text-xs ${
              selectedFields.includes(field) ? "text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {field}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectReportFields;