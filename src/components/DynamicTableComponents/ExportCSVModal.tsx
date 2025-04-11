import React from "react";
import Papa from "papaparse";
import { Item } from "./types";

interface ExportCSVModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedRows: string[];
  items: Item[];
  fields: string[];
  hiddenFields: string[];
  tableName: string;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const ExportCSVModal: React.FC<ExportCSVModalProps> = ({
  isOpen,
  setIsOpen,
  selectedRows,
  items,
  fields,
  hiddenFields,
  tableName,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const handleExport = () => {
    // Filter selected items
    const selectedItems = items.filter((item) => selectedRows.includes(item.id));
    if (selectedItems.length === 0) {
      alert("No rows selected to export.");
      return;
    }

    // Filter fields to exclude hidden ones
    const visibleFields = fields.filter((field) => !hiddenFields.includes(field));

    // Prepare data for CSV
    const csvData = selectedItems.map((item) => {
      const row: { [key: string]: any } = {};
      visibleFields.forEach((field) => {
        row[field] = item[field] !== null && item[field] !== undefined ? item[field].toString() : "";
      });
      return row;
    });

    // Generate CSV
    const csv = Papa.unparse(csvData, {
      header: true,
      columns: visibleFields,
    });

    // Create a downloadable file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tableName}_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Close the modal
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export to CSV</h2>
        <p className="text-sm text-gray-600 mb-4">
          Export {selectedRows.length} selected row{selectedRows.length !== 1 ? "s" : ""} to a CSV file?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleExport}
            className={primaryButtonClass}
            disabled={selectedRows.length === 0}
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={grayButtonClass}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCSVModal;