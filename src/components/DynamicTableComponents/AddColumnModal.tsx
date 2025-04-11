import React, { useState, useRef } from "react";

interface AddColumnModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tableName: string;
  apiEndpoint: string;
  onAddSuccess: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({
  isOpen,
  setIsOpen,
  tableName,
  apiEndpoint,
  onAddSuccess,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const [columnName, setColumnName] = useState("");
  const [dataType, setDataType] = useState("text");
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const dataTypes = [
    "text",
    "integer",
    "bigint",
    "numeric",
    "boolean",
    "date",
    "timestamp",
  ];

  const handleAddColumn = async () => {
    if (!columnName) {
      setError("Column name is required.");
      return;
    }

    // Validate column name (e.g., no spaces, only lowercase letters, numbers, and underscores)
    if (!/^[a-z0-9_]+$/.test(columnName)) {
      setError("Column name must contain only lowercase letters, numbers, and underscores (e.g., my_column).");
      return;
    }

    try {
      const res = await fetch(`${apiEndpoint}?action=add-column`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnName, dataType }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error adding column to ${tableName}: ${text}`);
      }

      onAddSuccess();
      setIsOpen(false);
      setColumnName("");
      setDataType("text");
      setError(null);
    } catch (err: any) {
      console.error("Error in handleAddColumn:", err);
      setError(err.message || "Failed to add column: An unexpected error occurred.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200 max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add New Column</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setColumnName("");
              setDataType("text");
              setError(null);
            }}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Column Name
          </label>
          <input
            type="text"
            placeholder="e.g., new_column"
            value={columnName}
            onChange={(e) => {
              setColumnName(e.target.value.toLowerCase());
              setError(null);
            }}
            className="border border-gray-300 bg-white p-2 text-sm rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-200 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Type
          </label>
          <select
            value={dataType}
            onChange={(e) => {
              setDataType(e.target.value);
              setError(null);
            }}
            className="border border-gray-300 p-2 text-sm rounded-md w-full focus:ring-2 focus:ring-gray-400 focus:outline-none"
          >
            {dataTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <div className="mb-4 max-h-32 overflow-y-auto text-red-600 text-sm">
            <p>{error}</p>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleAddColumn}
            className={primaryButtonClass}
            disabled={!columnName}
          >
            Add Column
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setColumnName("");
              setDataType("text");
              setError(null);
            }}
            className={grayButtonClass}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Ensure the default export is present
export default AddColumnModal;