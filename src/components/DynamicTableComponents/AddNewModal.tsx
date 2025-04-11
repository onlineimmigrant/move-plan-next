import React, { RefObject } from "react";
import IconButton from "./IconButton";

interface AddNewModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalRef: RefObject<HTMLDivElement>;
  modalPosition: { x: number; y: number };
  handleDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  fields: string[];
  unchangeableFields: string[];
  hiddenFields: string[];
  newItem: { [key: string]: string };
  handleFormInputChange: (field: string, value: string) => void;
  primaryButtonClass: string;
  grayButtonClass: string;
  greenButtonClass: string;
}

const AddNewModal: React.FC<AddNewModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  modalRef,
  modalPosition,
  handleDragStart,
  handleSubmit,
  fields,
  unchangeableFields,
  hiddenFields,
  newItem,
  handleFormInputChange,
  primaryButtonClass,
  grayButtonClass,
  greenButtonClass,
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent shadow flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white p-6 rounded-md border border-gray-200 w-full max-w-lg flex flex-col absolute"
        style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)` }}
      >
        <div
          className="flex items-center justify-between mb-4 cursor-move"
          onMouseDown={handleDragStart}
        >
          <h2 className="text-lg font-semibold">Add New</h2>
          <div className="flex gap-3">
            <button type="button" onClick={handleSubmit} className={greenButtonClass}>
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={grayButtonClass}
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto max-h-[65vh]">
          {fields.map((field) =>
            !unchangeableFields.includes(field) && !hiddenFields.includes(field) && (
              <input
                key={field}
                value={newItem[field] || ""}
                onChange={(e) => handleFormInputChange(field, e.target.value)}
                placeholder={field}
                className="border border-gray-300 bg-white p-2 text-xs rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all duration-200 w-full mb-2"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewModal;