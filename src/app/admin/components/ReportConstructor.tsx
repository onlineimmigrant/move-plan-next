// admin/components/ReportConstructor.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bar, Line } from "react-chartjs-2"; // Using Chart.js for diagrams
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

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface ReportConfig {
  tableName: string;
  fields: string[];
  diagramType: "bar" | "line" | "table";
  name: string;
}

export default function ReportConstructor({
  tables,
  onSaveReport,
}: {
  tables: string[];
  onSaveReport: (config: ReportConfig) => void;
}) {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [fields, setFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [diagramType, setDiagramType] = useState<"bar" | "line" | "table">("bar");
  const [reportName, setReportName] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);

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
    }
  }, [selectedTable]);

  // Fetch data for the report preview
  const fetchReportData = async () => {
    if (selectedTable && selectedFields.length > 0) {
      const { data, error } = await supabase.from(selectedTable).select(selectedFields.join(", "));
      if (error) {
        console.error("Error fetching report data:", error);
        return;
      }

      // Process data for chart
      const labels = data.map((item: any) => item[selectedFields[0]]); // X-axis (first field)
      const values = data.map((item: any) => item[selectedFields[1]]); // Y-axis (second field, if exists)

      setReportData({
        labels,
        datasets: [
          {
            label: selectedFields[1] || "Count",
            data: values || data.map(() => 1), // Default to count if only one field
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      });
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedTable, selectedFields]);

  const handleSave = () => {
    if (!reportName || !selectedTable || selectedFields.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }
    const config: ReportConfig = { tableName: selectedTable, fields: selectedFields, diagramType, name: reportName };
    onSaveReport(config);
    setSelectedTable("");
    setSelectedFields([]);
    setDiagramType("bar");
    setReportName("");
    setReportData(null);
  };

  const renderDiagram = () => {
    if (!reportData) return <p>Select a table and fields to preview the report.</p>;

    const options = {
      responsive: true,
      plugins: { legend: { position: "top" as const }, title: { display: true, text: reportName || "Report Preview" } },
    };

    if (diagramType === "bar") {
      return <Bar data={reportData} options={options} />;
    } else if (diagramType === "line") {
      return <Line data={reportData} options={options} />;
    } else {
      return (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>{selectedFields.map((field) => <th key={field} className="border p-2">{field}</th>)}</tr>
          </thead>
          <tbody>
            {reportData.labels.map((label: string, index: number) => (
              <tr key={index}>
                <td className="border p-2">{label}</td>
                {selectedFields.length > 1 && <td className="border p-2">{reportData.datasets[0].data[index]}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="p-4 bg-white rounded-md border border-gray-200">
      <h2 className="text-lg font-bold mb-4">Create a Report</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Report Name</label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Select Table</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">-- Select a Table --</option>
            {tables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>
        {selectedTable && (
          <div>
            <label className="block text-sm font-medium">Select Fields</label>
            <select
              multiple
              value={selectedFields}
              onChange={(e) => setSelectedFields(Array.from(e.target.selectedOptions, (option) => option.value))}
              className="mt-1 block w-full border rounded-md p-2"
            >
              {fields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Diagram Type</label>
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as "bar" | "line" | "table")}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="table">Table</option>
          </select>
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Save Report
        </button>
      </div>
      <div className="mt-6">{renderDiagram()}</div>
    </div>
  );
}