import React, { useState, useEffect } from "react";
import { Item, ForeignKeyOption } from "./types";
import { useRouter } from "next/navigation";

interface ForeignKeyModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedItem: Item | null;
  field: string;
  foreignKeyOptions: { [key: string]: ForeignKeyOption[] };
  tableName: string;
  apiEndpoint: string;
  onChange: (id: string, field: string, newValue: string) => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const ForeignKeyModal: React.FC<ForeignKeyModalProps> = ({
  isOpen,
  setIsOpen,
  selectedItem,
  field,
  foreignKeyOptions,
  tableName,
  apiEndpoint,
  onChange,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const router = useRouter();
  const [relatedRecord, setRelatedRecord] = useState<Item | null>(null);
  const [relatedTable, setRelatedTable] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedRecord = async () => {
      if (!selectedItem || !field || !isOpen) {
        console.log("Skipping fetch: missing selectedItem, field, or modal is not open", {
          selectedItem,
          field,
          isOpen,
        });
        return;
      }

      const value = selectedItem[field]?.toString();
      if (!value) {
        console.log("Skipping fetch: no value for field", { field, value });
        return;
      }

      // Determine the related table (e.g., product_id -> product)
      const relatedTableName = field.endsWith("_id") ? field.replace("_id", "") : field;
      setRelatedTable(relatedTableName);

      console.log("Fetching related record:", { tableName, field, value });

      try {
        const res = await fetch("/api/related-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableName, field, value }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch related record");
        }

        const { data } = await res.json();
        console.log("Fetched related record:", data);
        setRelatedRecord(data);
        setNewValue(value);
      } catch (err: any) {
        console.error("Error fetching related record:", err);
        setError(err.message || "Failed to fetch related record");
      }
    };

    fetchRelatedRecord();
  }, [selectedItem, field, isOpen, tableName]);

  const handleChange = async () => {
    if (!selectedItem || !field || newValue === selectedItem[field]?.toString()) {
      console.log("Skipping change: no change in value or missing data", {
        selectedItem,
        field,
        newValue,
        currentValue: selectedItem ? selectedItem[field]?.toString() : null,
      });
      setIsOpen(false);
      return;
    }

    console.log("Updating foreign key:", { id: selectedItem.id, field, newValue });

    try {
      const res = await fetch(apiEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id, [field]: newValue }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error updating ${tableName}: ${errorData.error}`);
      }

      onChange(selectedItem.id, field, newValue);
      setIsOpen(false);
      setError(null);
    } catch (err: any) {
      console.error("Error updating foreign key:", err);
      setError(err.message || "Failed to update foreign key");
    }
  };

  const handleOpenTable = () => {
    if (relatedTable) {
      console.log("Navigating to related table:", `/admin/${relatedTable}`);
      router.push(`/admin/${relatedTable}`);
    }
  };

  if (!isOpen || !selectedItem) {
    console.log("Modal not rendered: not open or no selected item", { isOpen, selectedItem });
    return null;
  }

  if (!relatedRecord) {
    console.log("Modal not rendered: no related record", { relatedRecord });
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm text-gray-700">
              Referencing record from public.{relatedTable}:
            </h2>
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
          {error && (
            <div className="mb-4 max-h-32 overflow-y-auto text-red-600 text-sm">
              <p>{error}</p>
            </div>
          )}
          {!error && <p className="text-sm text-gray-700">Loading related record...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm text-gray-700">
            Referencing record from public.{relatedTable}:
          </h2>
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
          {Object.entries(relatedRecord).map(([key, value]) => (
            <div key={key} className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{key}</span>
              <span className="text-sm text-gray-900">{value?.toString() || ""}</span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Change related record
          </label>
          <select
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="border border-gray-300 p-2 text-sm rounded-md w-full focus:ring-2 focus:ring-gray-400 focus:outline-none"
          >
            <option value="">Select...</option>
            {foreignKeyOptions[field]?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <div className="mb-4 max-h-32 overflow-y-auto text-red-600 text-sm">
            <p>{error}</p>
          </div>
        )}
        <div className="flex justify-between items-center">
          <button
            onClick={handleOpenTable}
            className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
          >
            Open table
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleChange}
              className={primaryButtonClass}
              disabled={newValue === selectedItem[field]?.toString()}
            >
              Save
            </button>
            <button
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
    </div>
  );
};

export default ForeignKeyModal;