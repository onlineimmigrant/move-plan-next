// admin/reports/custom/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { useModal } from "@/context/ModalContext";
import ColorsModal from "@/components/ColorsModal";
import ReportNavbar from "@/components/ReportNavbar";
import DynamicReportBody from "@/components/DynamicReportBody";

const tableNameMapping: { [key: string]: string } = {
  products: "product",
  pricingplans: "pricingplan",
  product_types: "product_type",
  product_sub_types: "product_sub_type",
  features: "feature",
  faq: "faq",
  countries: "countries",
  currencies: "currency",
  todo: "todo",
  item_types: "item_types",
  settings: "settings",
};

interface ReportConfig {
  tableName: string;
  fields: string[];
  diagramType: "table" | "bar" | "line";
  name: string;
}

export default function CustomReportPage() {
  const { settings } = useSettings();
  const { isPaletteModalOpen, setIsPaletteModalOpen, isMinimized, setIsMinimized } = useModal();
  const [tables] = useState<string[]>(Object.values(tableNameMapping));
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [fields, setFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [diagramType, setDiagramType] = useState<"table" | "bar" | "line">("table");
  const [reportName, setReportName] = useState<string>("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([]);

  // Load saved reports
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("savedReports") || "[]");
    setSavedReports(reports);
  }, []);

  // Fetch fields when a table is selected
  useEffect(() => {
    if (selectedTable) {
      const fetchFields = async () => {
        const { data, error } = await supabase.rpc("get_column_types", { p_table_name: selectedTable });
        if (error) {
          console.error("Error fetching fields:", error);
          return;
        }
        setFields(data.map((col: { column_name: string }) => col.column_name));
      };
      fetchFields();
    } else {
      setFields([]);
      setSelectedFields([]);
    }
  }, [selectedTable]);

  // Fetch and process report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedTable && selectedFields.length > 0) {
        const { data, error } = await supabase.from(selectedTable).select(selectedFields.join(", "));
        if (error) {
          console.error("Error fetching report data:", error);
          return;
        }

        setReportData(data);

        if (selectedFields.length >= 2 && (diagramType === "bar" || diagramType === "line")) {
          const labels = data.map((item: any) => item[selectedFields[0]]);
          const values = data.map((item: any) => item[selectedFields[1]]);
          setChartData({
            labels,
            datasets: [
              {
                label: selectedFields[1] || "Count",
                data: values,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          });
        } else {
          setChartData(null);
        }
      } else {
        setReportData([]);
        setChartData(null);
      }
    };
    fetchReportData();
  }, [selectedTable, selectedFields, diagramType]);

  const handleSave = () => {
    if (!reportName || !selectedTable || selectedFields.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }
    const config: ReportConfig = { tableName: selectedTable, fields: selectedFields, diagramType, name: reportName };
    const updatedReports = [...savedReports, config];
    setSavedReports(updatedReports);
    localStorage.setItem("savedReports", JSON.stringify(updatedReports));
    setSelectedTable("");
    setSelectedFields([]);
    setDiagramType("table");
    setReportName("");
    setReportData([]);
    setChartData(null);
  };

  const handleRestoreModal = () => {
    if (setIsMinimized) {
      setIsMinimized(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        <h1
          className={cn(
            "text-sm p-6 pt-4 pb-0 capitalize font-bold",
            settings?.primary_color?.name
              ? `text-${settings.primary_color.name}`
              : "text-gray-700"
          )}
        >
          Constructor
        </h1>
        <span
          className={cn(
            "text-sm p-6 pt-4 pb-0 capitalize font-bold",
            settings?.secondary_color?.name
              ? `text-${settings.secondary_color.name}`
              : "text-gray-700"
          )}
        >
          Report
        </span>
      </div>

      <div className="p-4 bg-gray-50">
        <ReportNavbar
          tables={tables}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          fields={fields}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          diagramType={diagramType}
          setDiagramType={setDiagramType}
          reportName={reportName}
          setReportName={setReportName}
          handleSave={handleSave}
          reportData={reportData}
          chartData={chartData}
        />
        <DynamicReportBody
          diagramType={diagramType}
          reportData={reportData}
          chartData={chartData}
          selectedFields={selectedFields}
          reportName={reportName}
        />
      </div>

      {!isMinimized && (
        <ColorsModal
          isOpen={isPaletteModalOpen}
          setIsOpen={setIsPaletteModalOpen}
          setIsMinimized={setIsMinimized}
        />
      )}

      {isMinimized && (
        <button
          onClick={handleRestoreModal}
          className="fixed bottom-4 right-4 bg-gray-200 px-2 py-1 rounded-full shadow-lg hover:bg-gray-300 z-50"
        >
          <span className="text-sm font-medium">Palette</span>
        </button>
      )}
    </div>
  );
}