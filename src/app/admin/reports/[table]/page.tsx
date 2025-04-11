// admin/reports/[table]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { useModal } from "@/context/ModalContext";
import ColorsModal from "@/components/ColorsModal";
import { getTableToDisclosure } from "@/lib/sidebarLinks"; // Import to match table disclosure logic

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

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

export default function DefaultReportPage() {
  const params = useParams();
  const { settings } = useSettings();
  const { isPaletteModalOpen, setIsPaletteModalOpen, isMinimized, setIsMinimized } = useModal();
  const urlTableName = params.table as string;
  const tableName = tableNameMapping[urlTableName] || urlTableName;

  const [fields, setFields] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [diagramType, setDiagramType] = useState<"table" | "bar" | "line">("table");
  const [chartData, setChartData] = useState<any>(null);

  // Dynamically generate the table-to-disclosure mapping (same as TablePage)
  const tableToDisclosure = getTableToDisclosure();
  const disclosureSection = tableToDisclosure[urlTableName] || "";
  const formattedDisclosure = disclosureSection
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch table schema and data
  useEffect(() => {
    const fetchData = async () => {
      const { data: schemaData, error: schemaError } = await supabase.rpc("get_column_types", {
        p_table_name: tableName,
      });
      if (schemaError) {
        console.error("Error fetching schema:", schemaError);
        return;
      }
      const fetchedFields = schemaData.map((col: { column_name: string }) => col.column_name);
      setFields(fetchedFields);

      const { data: tableData, error: dataError } = await supabase.from(tableName).select("*");
      if (dataError) {
        console.error("Error fetching data:", dataError);
        return;
      }
      setData(tableData);

      if (fetchedFields.length > 1) {
        const labels = tableData.map((item) => item[fetchedFields[0]]);
        const values = tableData.map((item) => item[fetchedFields[1]]);
        setChartData({
          labels,
          datasets: [
            {
              label: fetchedFields[1],
              data: values,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });
      }
    };
    fetchData();
  }, [tableName]);

  const renderDiagram = () => {
    const options = {
      responsive: true,
      plugins: { legend: { position: "top" as const }, title: { display: true, text: `${tableName} Report` } },
    };

    if (diagramType === "table") {
      return (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {fields.map((field) => (
                <th
                  key={field}
                  className={cn(
                    "border p-2 text-left text-xs font-medium",
                    settings?.primary_color?.name
                      ? `text-${settings.primary_color.name}`
                      : "text-gray-700"
                  )}
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {fields.map((field) => (
                  <td key={field} className="border p-2 text-xs text-gray-600">
                    {item[field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (diagramType === "bar" && chartData) {
      return <Bar data={chartData} options={options} />;
    } else if (diagramType === "line" && chartData) {
      return <Line data={chartData} options={options} />;
    }
    return <p className="text-gray-600 text-center">No data available for chart.</p>;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const element = document.getElementById("report-content");
    if (element) {
      html2canvas(element).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 10, 10, 190, 0);
        doc.save(`${tableName}_report.pdf`);
      });
    }
  };

  const exportToPNG = () => {
    const element = document.getElementById("report-content");
    if (element) {
      html2canvas(element).then((canvas) => {
        const link = document.createElement("a");
        link.download = `${tableName}_report.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
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
          {formattedDisclosure} Table
          <span
            className={cn(
              "",
              settings?.secondary_color?.name
                ? `text-${settings.secondary_color.name}`
                : "text-gray-700"
            )}
          >
            {" "}
            {tableName.charAt(0).toUpperCase() + tableName.slice(1)}
          </span>
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
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setDiagramType("table")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium",
              diagramType === "table"
                ? settings?.primary_color?.name
                  ? `bg-${settings.primary_color.name} text-white`
                  : "bg-gray-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            Table
          </button>
          <button
            onClick={() => setDiagramType("bar")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium",
              diagramType === "bar"
                ? settings?.primary_color?.name
                  ? `bg-${settings.primary_color.name} text-white`
                  : "bg-gray-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            Bar
          </button>
          <button
            onClick={() => setDiagramType("line")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium",
              diagramType === "line"
                ? settings?.primary_color?.name
                  ? `bg-${settings.primary_color.name} text-white`
                  : "bg-gray-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
          >
            Line
          </button>
          <button
            onClick={exportToPDF}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium",
              settings?.secondary_color?.name
                ? `bg-${settings.secondary_color.name} text-white hover:bg-${settings.secondary_color.name}-700`
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            Export to PDF
          </button>
          <button
            onClick={exportToPNG}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium",
              settings?.secondary_color?.name
                ? `bg-${settings.secondary_color.name} text-white hover:bg-${settings.secondary_color.name}-700`
                : "bg-green-600 text-white hover:bg-green-700"
            )}
          >
            Export to PNG
          </button>
        </div>
        <div
          id="report-content"
          className="bg-white p-4 rounded-md border border-gray-200 overflow-x-auto"
        >
          {renderDiagram()}
        </div>
      </div>

      {/* Render the ColorsModal on any page if it's open */}
      {!isMinimized && (
        <ColorsModal
          isOpen={isPaletteModalOpen}
          setIsOpen={setIsPaletteModalOpen}
          setIsMinimized={setIsMinimized}
        />
      )}

      {/* Minimized Modal Button */}
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