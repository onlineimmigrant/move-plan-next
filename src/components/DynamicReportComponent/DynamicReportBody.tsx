// components/DynamicReportBody.tsx
import React from "react";
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
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface DynamicReportBodyProps {
  diagramType: "table" | "bar" | "line";
  reportData: any[];
  chartData: any;
  selectedFields: string[];
  reportName: string;
}

const DynamicReportBody: React.FC<DynamicReportBodyProps> = ({
  diagramType,
  reportData,
  chartData,
  selectedFields,
  reportName,
}) => {
  const { settings } = useSettings();

  const renderDiagram = () => {
    const options = {
      responsive: true,
      plugins: { legend: { position: "top" as const }, title: { display: true, text: reportName || "Report Preview" } },
    };

    if (diagramType === "table" && reportData.length > 0) {
      return (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {selectedFields.map((field) => (
                <th
                  key={field}
                  
                  className="border p-2 text-left text-xs font-medium text-gray-700"
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((item, index) => (
              <tr key={index}>
                {selectedFields.map((field) => (
                  <td key={field} className="border p-2 text-xs text-gray-600">
                    {item[field] ?? "N/A"}
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
    return <p className="text-gray-600 text-center text-xs">Select a table and fields to preview the report.</p>;
  };

  return (
    <div
      id="report-content"
      className="bg-white p-4 rounded-md border border-gray-200 overflow-x-auto"
    >
      {renderDiagram()}
    </div>
  );
};

export default DynamicReportBody;