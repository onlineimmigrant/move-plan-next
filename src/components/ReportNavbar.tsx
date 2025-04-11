// components/ReportNavbar.tsx
import React, { useState, useEffect } from "react";
import IconButton from "./DynamicTableComponents/IconButton";
import {
  TableCellsIcon,
  ViewColumnsIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import SelectReportTable from "./DynamicReportComponent/SelectReportTable";
import SelectReportFields from "./DynamicReportComponent/SelectReportFields";

interface ReportNavbarProps {
  tables: string[];
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  fields: string[];
  selectedFields: string[];
  setSelectedFields: (fields: string[]) => void;
  diagramType: "table" | "bar" | "line";
  setDiagramType: (type: "table" | "bar" | "line") => void;
  reportName: string;
  setReportName: (name: string) => void;
  handleSave: () => void;
  reportData: any[];
  chartData: any;
}

interface ButtonConfig {
  key: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const ReportNavbar: React.FC<ReportNavbarProps> = ({
  tables,
  selectedTable,
  setSelectedTable,
  fields,
  selectedFields,
  setSelectedFields,
  diagramType,
  setDiagramType,
  reportName,
  setReportName,
  handleSave,
  reportData,
  chartData,
}) => {
  const { settings } = useSettings();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [isDiagramMenuOpen, setIsDiagramMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isEditingReportName, setIsEditingReportName] = useState(false);

  // Auto-generate report name when a table is selected
  useEffect(() => {
    if (selectedTable && !reportName) {
      const now = new Date();
      const formattedDate = now.toISOString().replace(/T/, "-").replace(/:/g, "-").split(".")[0];
      setReportName(`${selectedTable}-${formattedDate}`);
    }
  }, [selectedTable, reportName]);

  const defaultButtonClass = "p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200";
  const secondaryButtonClass = "p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200";

  const closeAllOthers = (exclude: string) => {
    const setters = {
      table: setIsTableModalOpen,
      fields: setIsFieldsModalOpen,
      diagram: setIsDiagramMenuOpen,
      export: setIsExportMenuOpen,
    };
    Object.entries(setters).forEach(([key, setter]) => {
      if (key !== exclude) setter(false);
    });
  };

  const actionButtons: ButtonConfig[] = [
    {
      key: "table",
      icon: TableCellsIcon,
      tooltip: "Select Table",
      isActive: isTableModalOpen,
      onClick: () => {
        closeAllOthers("table");
        setIsTableModalOpen(!isTableModalOpen);
      },
    },
    {
      key: "fields",
      icon: ViewColumnsIcon,
      tooltip: "Select Fields",
      isActive: isFieldsModalOpen,
      onClick: () => {
        closeAllOthers("fields");
        setIsFieldsModalOpen(!isFieldsModalOpen);
      },
    },
    {
      key: "diagram",
      icon: ChartBarIcon,
      tooltip: "Diagram Type",
      isActive: isDiagramMenuOpen,
      onClick: () => {
        closeAllOthers("diagram");
        setIsDiagramMenuOpen(!isDiagramMenuOpen);
      },
    },
  ];

  const controlButtons: ButtonConfig[] = [
    {
      key: "save",
      icon: DocumentCheckIcon,
      tooltip: "Save Report",
      isActive: false,
      onClick: handleSave,
      className: secondaryButtonClass,
    },
    {
      key: "export",
      icon: DocumentArrowDownIcon,
      tooltip: "Export",
      isActive: isExportMenuOpen,
      onClick: () => {
        closeAllOthers("export");
        setIsExportMenuOpen(!isExportMenuOpen);
      },
      className: secondaryButtonClass,
    },
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    const element = document.getElementById("report-content");
    if (element) {
      html2canvas(element).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 10, 10, 190, 0);
        doc.save(`${reportName || "custom_report"}.pdf`);
      });
    }
    setIsExportMenuOpen(false);
  };

  const exportToPNG = () => {
    const element = document.getElementById("report-content");
    if (element) {
      html2canvas(element).then((canvas) => {
        const link = document.createElement("a");
        link.download = `${reportName || "custom_report"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
    setIsExportMenuOpen(false);
  };

  const renderButtonGroup = (buttons: ButtonConfig[]) => (
    <div className="flex gap-1 sm:gap-4">
      {buttons.map((button) => (
        <IconButton
          key={button.key}
          onClick={button.onClick}
          icon={button.icon}
          tooltip={button.tooltip}
          isActive={button.isActive}
          className={button.className || defaultButtonClass}
          style={
            button.className === secondaryButtonClass
              ? { color: "#4B5563" } // gray-600
              : { color: "#000000" } // black
          }
        />
      ))}
    </div>
  );

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        {renderButtonGroup(actionButtons)}
        {renderButtonGroup(controlButtons)}
      </div>

      {/* Report Name Display/Edit */}
      {selectedTable && (
        <div className="mb-4">
          {isEditingReportName ? (
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              onBlur={() => setIsEditingReportName(false)}
              autoFocus
              className="block w-full border border-gray-200 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditingReportName(true)}
              className="text-xs font-medium cursor-pointer"
              style={{ color: "#000000" }} // black
            >
              {selectedTable} Report
            </div>
          )}
        </div>
      )}

      {/* Select Table Modal */}
      <SelectReportTable
        isOpen={isTableModalOpen}
        setIsOpen={setIsTableModalOpen}
        tables={tables}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />

      {/* Select Fields Modal */}
      {selectedTable && (
        <SelectReportFields
          isOpen={isFieldsModalOpen}
          setIsOpen={setIsFieldsModalOpen}
          fields={fields}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
        />
      )}

      {/* Diagram Type Dropdown */}
      {isDiagramMenuOpen && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1">
            {["table", "bar", "line"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setDiagramType(type as "table" | "bar" | "line");
                  setIsDiagramMenuOpen(false);
                }}
                style={
                  diagramType === type
                    ? { backgroundColor: "#000000", color: "#FFFFFF" } // black background, white text
                    : { backgroundColor: "#FFFFFF", color: "#000000" } // white background, black text
                }
                className={cn(
                  "block w-full text-left px-4 py-2 text-xs",
                  diagramType !== type && "hover:bg-gray-100"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Export Format Dropdown */}
      {isExportMenuOpen && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg right-0">
          <div className="py-1">
            <button
              onClick={exportToPDF}
              className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
            >
              PDF
            </button>
            <button
              onClick={exportToPNG}
              className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
            >
              PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportNavbar;