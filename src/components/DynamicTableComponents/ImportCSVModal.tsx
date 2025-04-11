import React, { useState, useRef } from "react";
import Papa from "papaparse";

interface ImportCSVModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tableName: string;
  fields: string[];
  unchangeableFields: string[];
  hiddenFields: string[];
  columnTypes: { [key: string]: string };
  apiEndpoint: string;
  onImportSuccess: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  setIsOpen,
  tableName,
  fields,
  unchangeableFields,
  hiddenFields,
  columnTypes,
  apiEndpoint,
  onImportSuccess,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Invalid file format: Please upload a .csv file.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    } else {
      setError("No file selected: Please choose a CSV file to import.");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("No file selected: Please choose a CSV file to import.");
      return;
    }

    try {
      // Parse the CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          try {
            const data = result.data as { [key: string]: string }[];
            if (data.length === 0) {
              setError("The CSV file is empty: Please upload a file with data.");
              return;
            }

            // Validate headers
            const csvHeaders = Object.keys(data[0]);
            const expectedHeaders = fields.filter(
              (field) => !unchangeableFields.includes(field) && !hiddenFields.includes(field)
            );
            const missingHeaders = expectedHeaders.filter(
              (header) => !csvHeaders.includes(header)
            );
            if (missingHeaders.length > 0) {
              setError(
                `Missing required headers: ${missingHeaders.join(
                  ", "
                )}. Expected headers: ${expectedHeaders.join(", ")}.`
              );
              return;
            }

            // Validate data types for each row
            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              for (const field of expectedHeaders) {
                const value = row[field] || "";
                const type = columnTypes[field]?.toLowerCase();

                if (type === "numeric" || type === "integer" || type === "bigint") {
                  if (value && isNaN(Number(value))) {
                    throw new Error(
                      `Invalid data in row ${i + 1}, field "${field}": Expected a number, but got "${value}".`
                    );
                  }
                } else if (type === "boolean") {
                  if (value && !["true", "false"].includes(value.toLowerCase())) {
                    throw new Error(
                      `Invalid data in row ${i + 1}, field "${field}": Expected "true" or "false", but got "${value}".`
                    );
                  }
                } else if (type === "date" || type === "timestamp") {
                  if (value && isNaN(Date.parse(value))) {
                    throw new Error(
                      `Invalid data in row ${i + 1}, field "${field}": Expected a valid date (e.g., YYYY-MM-DD), but got "${value}".`
                    );
                  }
                }
              }
            }

            // Process each row and insert into Supabase
            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              const itemToCreate: { [key: string]: any } = {};
              fields.forEach((field) => {
                if (!unchangeableFields.includes(field) && !hiddenFields.includes(field)) {
                  const value = row[field] || "";
                  const type = columnTypes[field]?.toLowerCase();
                  if (value === "" && (type === "numeric" || type === "integer" || type === "bigint" || type === "date" || type === "timestamp")) {
                    itemToCreate[field] = null;
                  } else if (type === "boolean" && typeof value === "string") {
                    itemToCreate[field] = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false : null;
                  } else {
                    itemToCreate[field] = value;
                  }
                }
              });

              const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemToCreate),
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error importing row ${i + 1}: ${text}`);
              }
            }

            // Successfully imported all rows
            onImportSuccess();
            setIsOpen(false);
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (err: any) {
            setError(err.message || "Failed to import data: An unexpected error occurred.");
          }
        },
        error: (error) => {
          setError(`Error parsing CSV file: ${error.message}. Please ensure the file is a valid CSV.`);
        },
      });
    } catch (err: any) {
      console.error("Error in handleImport:", err);
      setError(err.message || "Failed to import data: An unexpected error occurred.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Import CSV</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="border border-gray-300 bg-white p-2 text-sm rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-200 w-full"
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleImport}
            className={primaryButtonClass}
            disabled={!file}
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setFile(null);
              setError(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
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

export default ImportCSVModal;