import React from "react";

interface DeleteConfirmationModalProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  selectedRows: string[];
  handleDeleteSelected: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
  redButtonClass: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  selectedRows,
  handleDeleteSelected,
  primaryButtonClass,
  grayButtonClass,
  redButtonClass,
}) => {
  if (!isDeleteModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white shadow-lg rounded-md p-6 w-96 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p className="text-sm mb-4">
          Are you sure you want to delete {selectedRows.length} item{selectedRows.length > 1 ? "s" : ""}?
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={handleDeleteSelected} className={redButtonClass} >
            Delete
          </button>
          <button onClick={() => setIsDeleteModalOpen(false)} className={grayButtonClass}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;