import React, { useState } from "react";

interface DeleteColumnModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tableName: string;
  apiEndpoint: string;
  columnName: string;
  onDeleteSuccess: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const DeleteColumnModal: React.FC<DeleteColumnModalProps> = ({
  isOpen,
  setIsOpen,
  tableName,
  apiEndpoint,
  columnName,
  onDeleteSuccess,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleDeleteColumn = async () => {
    try {
      const sqlQuery = `ALTER TABLE public.${tableName} DROP COLUMN ${columnName}`;
      const { error: deleteError } = await fetch(`${apiEndpoint}?action=execute-sql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery }),
      }).then((res) => res.json());

      if (deleteError) {
        throw new Error(`Error deleting column from ${tableName}: ${deleteError.message}`);
      }

      onDeleteSuccess();
      setIsOpen(false);
      setError(null);
    } catch (err: any) {
      console.error("Error in handleDeleteColumn:", err);
      setError(err.message || "Failed to delete column: An unexpected error occurred.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Delete Column</h2>
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
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete the column <strong>{columnName}</strong> from the table <strong>{tableName}</strong>? This action cannot be undone.
        </p>
        {error && (
          <div className="mb-4 max-h-32 overflow-y-auto text-red-600 text-sm">
            <p>{error}</p>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleDeleteColumn}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
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

export default DeleteColumnModal;