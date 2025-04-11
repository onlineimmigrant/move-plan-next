import React, { useState, useEffect } from "react";

interface EditColumnModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tableName: string;
  apiEndpoint: string;
  columnName: string;
  currentDataType: string;
  onEditSuccess: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const EditColumnModal: React.FC<EditColumnModalProps> = ({
  isOpen,
  setIsOpen,
  tableName,
  apiEndpoint,
  columnName,
  currentDataType,
  onEditSuccess,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const [newColumnName, setNewColumnName] = useState("");
  const [dataType, setDataType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dataTypes = [
    "text",
    "integer",
    "bigint",
    "numeric",
    "boolean",
    "date",
    "timestamp",
  ];

  // Update state when props change (e.g., when a new column is selected)
  useEffect(() => {
    if (isOpen) {
      console.log("EditColumnModal opened with columnName:", columnName, "currentDataType:", currentDataType);
      setNewColumnName(columnName || "");
      setDataType(currentDataType || "text");
      setError(null);
    }
  }, [isOpen, columnName, currentDataType]);

  const handleEditColumn = async () => {
    if (!newColumnName) {
      setError("Column name is required.");
      return;
    }

    // Validate column name (e.g., no spaces, only lowercase letters, numbers, and underscores)
    if (!/^[a-z0-9_]+$/.test(newColumnName)) {
      setError("Column name must contain only lowercase letters, numbers, and underscores (e.g., my_column).");
      return;
    }

    try {
      // Rename the column if the name has changed
      if (newColumnName !== columnName) {
        const renameQuery = `ALTER TABLE public.${tableName} RENAME COLUMN ${columnName} TO ${newColumnName}`;
        console.log("Rename query:", renameQuery);
        const res = await fetch(`${apiEndpoint}?action=execute-sql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: renameQuery }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Error renaming column in ${tableName}: ${errorData.error}`);
        }
      }

      // Change the data type if it has changed
      if (dataType !== currentDataType) {
        let alterQuery = `ALTER TABLE public.${tableName} ALTER COLUMN ${newColumnName} TYPE ${dataType}`;
        
        // Only include the USING clause for specific type conversions where necessary
        const needsUsingClause = (fromType: string, toType: string) => {
          const conversionsRequiringUsing = [
            { from: "text", to: "integer" },
            { from: "text", to: "numeric" },
            { from: "text", to: "boolean" },
            { from: "text", to: "date" },
            { from: "text", to: "timestamp" },
            { from: "integer", to: "text" },
            { from: "numeric", to: "text" },
            { from: "boolean", to: "text" },
            { from: "date", to: "text" },
            { from: "timestamp", to: "text" },
          ];
          return conversionsRequiringUsing.some(
            (conv) => conv.from === fromType.toLowerCase() && conv.to === toType.toLowerCase()
          );
        };

        if (needsUsingClause(currentDataType, dataType)) {
          alterQuery += ` USING (${newColumnName}::${dataType})`;
        }

        console.log("Alter type query:", alterQuery);
        const res = await fetch(`${apiEndpoint}?action=execute-sql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: alterQuery }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Error changing data type in ${tableName}: ${errorData.error}`);
        }
      }

      onEditSuccess();
      setIsOpen(false);
      setError(null);
    } catch (err: any) {
      console.error("Error in handleEditColumn:", err);
      setError(err.message || "Failed to edit column: An unexpected error occurred.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Column</h2>
          <button
            onClick={() => {
              setIsOpen(false);
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
            value={newColumnName}
            onChange={(e) => {
              setNewColumnName(e.target.value.toLowerCase());
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
            onClick={handleEditColumn}
            className={primaryButtonClass}
            disabled={!newColumnName}
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
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

export default EditColumnModal;