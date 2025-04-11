// components/DynamicReportComponent/SelectReportTable.tsx
import React from "react";
import { useSettings } from "@/context/SettingsContext";

interface SelectReportTableProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  tables: string[];
  selectedTable: string;
  setSelectedTable: (table: string) => void;
}

const SelectReportTable: React.FC<SelectReportTableProps> = ({
  isOpen,
  setIsOpen,
  tables,
  selectedTable,
  setSelectedTable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
      <div className="py-1">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => {
              setSelectedTable(table);
              setIsOpen(false);
            }}
            style={
              selectedTable === table
                ? { backgroundColor: "var(--primary-color)" }
                : {}
            }
            className={`block w-full text-left px-4 py-2 text-xs ${
              selectedTable === table ? "text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {table}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectReportTable;