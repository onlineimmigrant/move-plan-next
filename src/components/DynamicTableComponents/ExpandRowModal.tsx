import React from "react";
import { Item } from "./types";

interface ExpandRowModalProps {
  isExpandModalOpen: boolean;
  setIsExpandModalOpen: (open: boolean) => void;
  selectedItem: Item | null;
  fields: string[];
  unchangeableFields: string[];
  hiddenFields: string[];
  newItem: { [key: string]: string } | undefined; // Allow newItem to be undefined
  handleFormInputChange: (field: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const ExpandRowModal: React.FC<ExpandRowModalProps> = ({
  isExpandModalOpen,
  setIsExpandModalOpen,
  selectedItem,
  fields,
  unchangeableFields,
  hiddenFields,
  newItem,
  handleFormInputChange,
  handleSubmit,
  primaryButtonClass,
  grayButtonClass,
}) => {
  if (!isExpandModalOpen || !selectedItem) return null;

  // Fallback if newItem is undefined
  if (!newItem) {
    console.error("newItem is undefined in ExpandRowModal");
    return null;
  }

  console.log("Rendering ExpandRowModal with newItem:", newItem);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-1/3 bg-white shadow-lg p-6 z-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Edit Row</h2>
        <div className="flex gap-3">
          <button type="button" onClick={handleSubmit} className={primaryButtonClass}>
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsExpandModalOpen(false)}
            className={grayButtonClass}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {fields.map((field) =>
          !unchangeableFields.includes(field) && !hiddenFields.includes(field) && (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-700">{field}</label>
              {field.endsWith("_id") ? (
                <input
                  value={newItem[field] ?? ""}
                  onChange={(e) => handleFormInputChange(field, e.target.value)}
                  className="border border-gray-300 bg-white p-2 text-xs rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-200 w-full"
                />
              ) : (
                <input
                  value={newItem[field] ?? ""}
                  onChange={(e) => handleFormInputChange(field, e.target.value)}
                  className="border border-gray-300 bg-white p-2 text-xs rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-200 w-full"
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ExpandRowModal;