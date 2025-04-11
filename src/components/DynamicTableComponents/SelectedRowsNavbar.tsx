import React from "react";

interface SelectedRowsNavbarProps {
  selectedRows: string[];
  confirmDeleteSelected: () => void;
  grayButtonClass: string;
}

const SelectedRowsNavbar: React.FC<SelectedRowsNavbarProps> = ({
  selectedRows,
  confirmDeleteSelected,
  grayButtonClass,
}) => {
  if (selectedRows.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-2 bg-gray-100 p-2 rounded-md border border-gray-200">
      <button onClick={confirmDeleteSelected} className={grayButtonClass}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0h4m-7 4h12"
          />
        </svg>
        Delete {selectedRows.length} row{selectedRows.length > 1 ? "s" : ""}
      </button>

    </div>
  );
};

export default SelectedRowsNavbar;