// scripts/generateTailwindColors.js
const fs = require("fs");
const path = require("path");
// Use the correct subpath for resolveConfig
const resolveConfig = require("tailwindcss/lib/public/resolve-config");
const tailwindConfig = require("../tailwind.config"); // Adjust the path to your tailwind.config.js

// Resolve the full Tailwind configuration
const fullConfig = resolveConfig(tailwindConfig);
const tailwindColors = fullConfig.theme.colors;

// Function to flatten the color object into a key-value map (e.g., { "red-500": "#EF4444" })
const flattenColors = (colors, prefix = "") => {
  const result = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "string") {
      // If it's a color value (e.g., "#EF4444"), add it to the result
      result[prefix ? `${prefix}-${key}` : key] = value;
    } else if (typeof value === "object") {
      // If it's a nested object (e.g., { 500: "#EF4444" }), recurse
      Object.assign(result, flattenColors(value, prefix ? `${prefix}-${key}` : key));
    }
  }
  return result;
};

// Flatten the Tailwind colors
const flattenedColors = flattenColors(tailwindColors);

// Write the result to a JSON file
const outputPath = path.resolve(__dirname, "../src/generated/tailwind-colors.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(flattenedColors, null, 2), "utf-8");

console.log("Tailwind colors generated at:", outputPath);