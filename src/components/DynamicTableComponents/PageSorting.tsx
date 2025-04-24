import React from "react";
import IconButton from "./IconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PageSortingProps {
  tableName: string;
  itemsPerPage: number | "all";
  setItemsPerPage: (itemsPerPage: number | "all") => void;
  totalItems: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const PageSorting: React.FC<PageSortingProps> = ({
  tableName,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
  currentPage,
  setCurrentPage,
}) => {
  const options = ["All", 1, 5, 10, 20, 50, 100, 200];

  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(totalItems / (itemsPerPage as number));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "All" ? "all" : parseInt(e.target.value, 10);
    setItemsPerPage(value);
    localStorage.setItem(`${tableName}_itemsPerPage`, value.toString());
    setCurrentPage(1);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        <label htmlFor="itemsPerPage" className="hidden sm:block text-xs text-gray-600">
          On page:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage === "all" ? "All" : itemsPerPage}
          onChange={handleChange}
          className="ml-2 sm:ml-0 border border-gray-300 rounded-md p-1 text-xs text-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center sm:gap-1">
        <IconButton
          onClick={handlePrevious}
          disabled={currentPage === 1}
          icon={ChevronLeftIcon} // Updated to use Heroicon
          tooltip="Previous"
        />
        <span className="flex text-xs text-gray-600">
          {currentPage} <span className="ml-2 hidden sm:flex">of {totalPages}</span>
        </span>
        <IconButton
          onClick={handleNext}
          disabled={currentPage === totalPages}
          icon={ChevronRightIcon} // Updated to use Heroicon
          tooltip="Next"
        />
      </div>
    </div>
  );
};

export default PageSorting;