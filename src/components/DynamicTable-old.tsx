//components/DynamicTabel.tsx
"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Item {
  id: string;
  [key: string]: any;
}

interface DynamicTableProps {
  tableName: string;
  apiEndpoint: string;
}

interface FilterCriteria {
  field: string;
  value: string;
}

interface SortCriteria {
  field: string;
  direction: "asc" | "desc";
}

interface ForeignKeyOption {
  id: string;
  name: string;
}

const IconButton = ({
  onClick,
  disabled,
  iconPath,
  tooltip,
}: {
  onClick: () => void;
  disabled?: boolean;
  iconPath: string;
  tooltip: string;
}) => (
  <div className="group relative">
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border border-gray-300 p-1 rounded-md hover:bg-gray-100 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <svg
        className="h-4 w-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
    </button>
    <span className="absolute left-1/2 -translate-x-1/2 top-8 bg-black text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {tooltip}
    </span>
  </div>
);

export default function DynamicTable({ tableName, apiEndpoint }: DynamicTableProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [originalItems, setOriginalItems] = useState<Item[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [fields, setFields] = useState<string[]>([]);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [columnTypes, setColumnTypes] = useState<{ [key: string]: string }>({});
  const [columnDefaults, setColumnDefaults] = useState<{ [key: string]: any }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria | null>(null);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [foreignKeyOptions, setForeignKeyOptions] = useState<{ [key: string]: ForeignKeyOption[] }>({});

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const unchangeableFields = ["id", "created_at", "updated_at"];
  const buttonClass = "px-3 py-1 rounded-md text-xs transition-colors duration-200 flex items-center gap-1";
  const grayButtonClass = `${buttonClass} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  const primaryButtonClass = `${buttonClass} bg-gray-600 text-white hover:bg-gray-700`;

  // Load items, column types, defaults, column order, hidden fields, and existing slugs
  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Failed to fetch ${tableName}`);
        }
        const data = await res.json();
        const fetchedItems = data[tableName] || [];

        if (fetchedItems.length > 0) {
          const dynamicFields = Object.keys(fetchedItems[0]);
          const savedOrder = localStorage.getItem(`${tableName}_columnOrder`);
          const savedHidden = localStorage.getItem(`${tableName}_hiddenFields`);
          setFields(savedOrder ? JSON.parse(savedOrder) : dynamicFields);
          setHiddenFields(savedHidden ? JSON.parse(savedHidden) : []);

          const initialNewItem: { [key: string]: string } = {};
          dynamicFields.forEach((field) => {
            initialNewItem[field] = "";
          });
          setNewItem(initialNewItem);

          // Extract existing slugs
          const slugs = fetchedItems
            .map((item: Item) => item.slug)
            .filter((slug: string | undefined) => slug !== undefined);
          setExistingSlugs(slugs);
        }

        setItems(fetchedItems);
        setOriginalItems(fetchedItems);

        if (data.columnTypes) {
          setColumnTypes(data.columnTypes);
          console.log(`Column types for ${tableName}:`, data.columnTypes);
        } else {
          console.warn("Column types not found in API response, using fallback");
          setColumnTypes({});
        }

        if (data.columnDefaults) {
          setColumnDefaults(data.columnDefaults);
          console.log(`Column defaults for ${tableName}:`, data.columnDefaults);

          const initialNewItem: { [key: string]: string } = {};
          Object.keys(data.columnDefaults).forEach((field) => {
            if (data.columnDefaults[field] !== null && data.columnDefaults[field] !== undefined) {
              initialNewItem[field] = data.columnDefaults[field].toString();
            } else {
              initialNewItem[field] = "";
            }
          });
          setNewItem(initialNewItem);
        } else {
          console.warn("Column defaults not found in API response, using empty defaults");
          setColumnDefaults({});
        }

        const savedSort = localStorage.getItem(`${tableName}_sortOrder`);
        if (savedSort) {
          setSortCriteria(JSON.parse(savedSort));
        }
      } catch (err: any) {
        console.error("Error loading items:", err);
        setError(err.message || "Failed to load data");
      }
    }

    loadItems();
  }, [apiEndpoint, tableName]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload: any) => {
          console.log(`Received ${payload.eventType} event for ${tableName}:`, payload);
          if (payload.eventType === "INSERT") {
            setItems((current) => {
              const updatedItems = [...current];
              if (!updatedItems.some((item) => item.id === payload.new.id)) {
                updatedItems.push(payload.new);
                // Update existing slugs
                if (payload.new.slug) {
                  setExistingSlugs((prev) => [...prev, payload.new.slug]);
                }
              }
              console.log("Updated items after INSERT:", updatedItems);
              return updatedItems;
            });
            setOriginalItems((current) => {
              const updatedItems = [...current];
              if (!updatedItems.some((item) => item.id === payload.new.id)) {
                updatedItems.push(payload.new);
              }
              console.log("Updated originalItems after INSERT:", updatedItems);
              return updatedItems;
            });
          } else if (payload.eventType === "UPDATE") {
            setItems((current) => {
              const updatedItems = current.map((item) =>
                item.id === payload.new.id ? payload.new : item
              );
              console.log("Updated items after UPDATE:", updatedItems);
              return [...updatedItems];
            });
            setOriginalItems((current) => {
              const updatedItems = current.map((item) =>
                item.id === payload.new.id ? payload.new : item
              );
              console.log("Updated originalItems after UPDATE:", updatedItems);
              return [...updatedItems];
            });
          } else if (payload.eventType === "DELETE") {
            setItems((current) => {
              const updatedItems = current.filter((item) => item.id !== payload.old.id);
              console.log("Updated items after DELETE:", updatedItems);
              return [...updatedItems];
            });
            setOriginalItems((current) => {
              const updatedItems = current.filter((item) => item.id !== payload.old.id);
              console.log("Updated originalItems after DELETE:", updatedItems);
              return [...updatedItems];
            });
            setSelectedRows((current) => current.filter((id) => id !== payload.old.id));
            // Remove deleted slug from existingSlugs
            if (payload.old.slug) {
              setExistingSlugs((prev) => prev.filter((slug) => slug !== payload.old.slug));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  // Apply filter and sort
  useEffect(() => {
    let filteredItems = [...originalItems];

    if (filterCriteria) {
      filteredItems = filteredItems.filter((item) =>
        item[filterCriteria.field]?.toString().toLowerCase().includes(filterCriteria.value.toLowerCase())
      );
    }

    if (sortCriteria) {
      filteredItems.sort((a, b) => {
        const aValue = a[sortCriteria.field];
        const bValue = b[sortCriteria.field];
        const type = columnTypes[sortCriteria.field]?.toLowerCase();

        if (type === "integer" || type === "numeric" || type === "bigint") {
          const aNum = aValue !== null && aValue !== undefined ? Number(aValue) : 0;
          const bNum = bValue !== null && bValue !== undefined ? Number(bValue) : 0;
          return sortCriteria.direction === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aStr = aValue?.toString().toLowerCase() || "";
        const bStr = bValue?.toString().toLowerCase() || "";
        return sortCriteria.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    setItems(filteredItems);
  }, [filterCriteria, sortCriteria, originalItems, columnTypes]);

  // Modal dragging
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - modalPosition.x, y: e.clientY - modalPosition.y });
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    setModalPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, dragStart]);

  // Column dragging
  const handleColumnDragStart = (e: React.DragEvent<HTMLTableHeaderCellElement>, field: string) => {
    setDraggedColumn(field);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLTableHeaderCellElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLTableHeaderCellElement>, targetField: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== targetField) {
      const newFields = [...fields];
      const draggedIndex = newFields.indexOf(draggedColumn);
      const targetIndex = newFields.indexOf(targetField);
      newFields.splice(draggedIndex, 1);
      newFields.splice(targetIndex, 0, draggedColumn);
      setFields(newFields);
      localStorage.setItem(`${tableName}_columnOrder`, JSON.stringify(newFields));
    }
    setDraggedColumn(null);
  };

  // Generate slug from product_name
  const generateSlug = (productName: string) => {
    let baseSlug = productName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = baseSlug;
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  };

  // Fetch foreign key options
  const fetchForeignKeyOptions = async (field: string) => {
    if (foreignKeyOptions[field]) {
      return; // Already fetched
    }

    // Infer the related table name (e.g., product_sub_type_id -> product_sub_types)
    const relatedTable = field.endsWith("_id") ? field.replace("_id", "") : field;
    try {
      const { data, error } = await supabase
        .from(relatedTable)
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error(`Error fetching options for ${relatedTable}:`, error);
        setError(error.message || `Failed to fetch options for ${field}`);
        return;
      }

      setForeignKeyOptions((prev) => ({
        ...prev,
        [field]: data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name || item.id.toString(),
        })),
      }));
    } catch (err: any) {
      console.error(`Error fetching options for ${relatedTable}:`, err);
      setError(err.message || `Failed to fetch options for ${field}`);
    }
  };

  // Handle form input changes with slug generation
  const handleFormInputChange = useCallback((field: string, value: string) => {
    setNewItem((prev) => {
      const updatedItem = { ...prev, [field]: value };

      // Generate slug if product_name changes and slug field exists
      if (field === "product_name" && fields.includes("slug")) {
        if (value && value.trim() !== "") {
          const newSlug = generateSlug(value);
          updatedItem.slug = newSlug;
        } else {
          updatedItem.slug = "";
        }
      }

      return updatedItem;
    });
  }, [fields, existingSlugs]);

  // Reset form
  const resetForm = () => {
    const resetItem: { [key: string]: string } = {};
    fields.forEach((field) => {
      if (!unchangeableFields.includes(field)) {
        resetItem[field] = columnDefaults[field] !== null && columnDefaults[field] !== undefined ? columnDefaults[field].toString() : "";
      }
    });
    setNewItem(resetItem);
  };

  // Handle modal submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new item via modal:", newItem);

    const itemToCreate: { [key: string]: any } = {};
    Object.keys(newItem).forEach((field) => {
      const value = newItem[field];
      const type = columnTypes[field]?.toLowerCase();
      if (value === "" && (type === "numeric" || type === "integer" || type === "bigint" || type === "boolean")) {
        itemToCreate[field] = null;
      } else if (type === "boolean" && typeof value === "string") {
        itemToCreate[field] = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false : null;
      } else {
        itemToCreate[field] = value;
      }
    });

    const { id, ...finalItemToCreate } = itemToCreate;

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalItemToCreate),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error(`Error creating ${tableName}:`, data.error);
        setError(data.error || `Failed to create ${tableName}`);
        return;
      }

      const data = await res.json();
      console.log("Created item response:", data);

      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "Failed to create item");
    }
  };

  // Handle delete selected rows with confirmation
  const confirmDeleteSelected = () => {
    if (selectedRows.length > 0) {
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedRows) {
      const res = await fetch(`${apiEndpoint}?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        console.error(`Error deleting ${tableName}:`, data.error);
        setError(data.error || `Failed to delete ${tableName}`);
        return;
      }
    }
    setItems((current) => {
      const updatedItems = current.filter((item) => !selectedRows.includes(item.id));
      console.log("Manually updated items after DELETE:", updatedItems);
      return [...updatedItems];
    });
    setOriginalItems((current) => {
      const updatedItems = current.filter((item) => !selectedRows.includes(item.id));
      console.log("Manually updated originalItems after DELETE:", updatedItems);
      return [...updatedItems];
    });
    setSelectedRows([]);
    setIsDeleteModalOpen(false);
  };

  // Toggle row selection
  const toggleRowSelection = (id: string) => {
    setSelectedRows((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id]
    );
  };

  // Start inline editing
  const startEditing = async (id: string, field: string, value: string) => {
    console.log(`Starting edit for id: ${id}, field: ${field}, value: ${value}`);
    setEditingCell({ id, field });
    setEditValue(value || "");

    // Check if the field is a foreign key (ends with _id)
    if (field.endsWith("_id")) {
      await fetchForeignKeyOptions(field);
    }
  };

  // Save inline edit
  const saveEdit = async (id: string, field: string, originalValue: string) => {
    console.log(`Saving edit for id: ${id}, field: ${field}, originalValue: ${originalValue}, newValue: ${editValue}`);
    if (editValue !== originalValue) {
      const res = await fetch(apiEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: editValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error(`Error updating ${tableName}:`, data.error);
        return;
      }
      setItems((current) => {
        const updatedItems = current.map((item) =>
          item.id === id ? { ...item, [field]: editValue } : item
        );
        console.log("Manually updated items after PATCH:", updatedItems);
        return [...updatedItems];
      });
      setOriginalItems((current) => {
        const updatedItems = current.map((item) =>
          item.id === id ? { ...item, [field]: editValue } : item
        );
        console.log("Manually updated originalItems after PATCH:", updatedItems);
        return [...updatedItems];
      });
    }
    setEditingCell(null);
    setEditValue("");
  };

  // Cancel inline edit
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Set to null
  const setToNull = async (id: string, field: string) => {
    const res = await fetch(apiEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: null }),
    });
    if (!res.ok) {
      const data = await res.json();
      console.error(`Error updating ${tableName}:`, data.error);
      return;
    }
    setItems((current) => {
      const updatedItems = current.map((item) =>
        item.id === id ? { ...item, [field]: null } : item
      );
      console.log("Manually updated items after setToNull:", updatedItems);
      return [...updatedItems];
    });
    setOriginalItems((current) => {
      const updatedItems = current.map((item) =>
        item.id === id ? { ...item, [field]: null } : item
      );
      console.log("Manually updated originalItems after setToNull:", updatedItems);
      return [...updatedItems];
    });
    setEditingCell(null);
    setEditValue("");
  };

  // Hide column
  const hideColumn = (field: string) => {
    const newHiddenFields = [...hiddenFields, field];
    setHiddenFields(newHiddenFields);
    localStorage.setItem(`${tableName}_hiddenFields`, JSON.stringify(newHiddenFields));
  };

  // Toggle column visibility
  const toggleColumnVisibility = (field: string) => {
    const newHiddenFields = hiddenFields.includes(field)
      ? hiddenFields.filter((f) => f !== field)
      : [...hiddenFields, field];
    setHiddenFields(newHiddenFields);
    localStorage.setItem(`${tableName}_hiddenFields`, JSON.stringify(newHiddenFields));
  };

  // Handle filter application
  const applyFilter = (field: string, value: string) => {
    setFilterCriteria({ field, value });
    setIsFilterOpen(false);
  };

  // Clear filter
  const clearFilter = () => {
    setFilterCriteria(null);
    setIsFilterOpen(false);
  };

  // Handle sort application and make permanent
  const applySort = (field: string, direction: "asc" | "desc") => {
    const newSortCriteria = { field, direction };
    setSortCriteria(newSortCriteria);
    localStorage.setItem(`${tableName}_sortOrder`, JSON.stringify(newSortCriteria));
    setOriginalItems([...items]);
    setIsSortOpen(false);
  };

  // Clear sort
  const clearSort = () => {
    setSortCriteria(null);
    localStorage.removeItem(`${tableName}_sortOrder`);
    setIsSortOpen(false);
  };

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Modal for New Item Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
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
                <button type="button" onClick={handleSubmit} className={primaryButtonClass}>
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
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md border border-gray-200 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-sm mb-4">
              Are you sure you want to delete {selectedRows.length} item{selectedRows.length > 1 ? "s" : ""}?
            </p>
            <div className="flex gap-3">
              <button onClick={handleDeleteSelected} className={primaryButtonClass}>
                Yes
              </button>
              <button onClick={() => setIsDeleteModalOpen(false)} className={grayButtonClass}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table with Checkboxes and Inline Editing */}
      <div className="relative">
        {/* Table Navbar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={grayButtonClass}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter
            </button>
            {isFilterOpen && (
              <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-4 w-64">
                <h3 className="text-xs font-semibold mb-2">Filter By</h3>
                <select
                  className="border border-gray-300 p-2 text-xs rounded-md w-full mb-2"
                  onChange={(e) =>
                    setFilterCriteria((prev) => ({
                      ...prev,
                      field: e.target.value,
                      value: prev?.value || "",
                    }))
                  }
                >
                  <option value="">Select Field</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={filterCriteria?.value || ""}
                  onChange={(e) =>
                    setFilterCriteria((prev) => ({
                      ...prev,
                      field: prev?.field || fields[0],
                      value: e.target.value,
                    }))
                  }
                  className="border border-gray-300 p-2 text-xs rounded-md w-full mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => applyFilter(filterCriteria?.field || fields[0], filterCriteria?.value || "")}
                    className={primaryButtonClass}
                  >
                    Apply
                  </button>
                  <button onClick={clearFilter} className={grayButtonClass}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setIsSortOpen(!isSortOpen)} className={grayButtonClass}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
              </svg>
              Sort
            </button>
            {isSortOpen && (
              <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-4 w-64">
                <h3 className="text-xs font-semibold mb-2">Sort By</h3>
                <select
                  className="border border-gray-300 p-2 text-xs rounded-md w-full mb-2"
                  value={sortCriteria?.field || ""}
                  onChange={(e) =>
                    setSortCriteria((prev) => ({
                      ...prev,
                      field: e.target.value,
                      direction: prev?.direction || "asc",
                    }))
                  }
                >
                  <option value="">Select Field</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-300 p-2 text-xs rounded-md w-full mb-2"
                  value={sortCriteria?.direction || "asc"}
                  onChange={(e) =>
                    setSortCriteria((prev) => ({
                      ...prev,
                      field: prev?.field || fields[0],
                      direction: e.target.value as "asc" | "desc",
                    }))
                  }
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => applySort(sortCriteria?.field || fields[0], sortCriteria?.direction || "asc")}
                    className={primaryButtonClass}
                  >
                    Apply
                  </button>
                  <button onClick={clearSort} className={grayButtonClass}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)} className={grayButtonClass}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Columns
            </button>
            {isColumnsMenuOpen && (
              <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-2 w-64 max-h-64 overflow-y-auto">
                <h3 className="text-xs font-semibold mb-2 text-gray-900">Columns</h3>
                {fields.map((field) => (
                  <div key={field} className="flex items-center mb-1">
                    <button onClick={() => toggleColumnVisibility(field)} className="mr-2">
                      <svg
                        className={`h-4 w-4 ${hiddenFields.includes(field) ? "text-gray-300" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        strokeWidth="1.5"
                      >
                        {hiddenFields.includes(field) ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88a3 3 0 104.24 4.24M10.73 5.08A10.43 10.43 0 0112 5c4.48 0 8.27 2.94 9.54 7a11.77 11.77 0 01-2.2 3.68M6.27 6.27A10.43 10.43 0 005 12c1.27 4.06 5.06 7 9.54 7a10.43 10.43 0 003.68-2.2" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                    <span className="text-xs text-gray-600 truncate">{field}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="group relative">
            <button onClick={() => setIsModalOpen(true)} className={primaryButtonClass}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 top-10 bg-black text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Insert
            </span>
          </div>
        </div>

        {/* Navbar for selected rows */}
        {selectedRows.length > 0 && (
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
            <div className="relative group">
              <button className={grayButtonClass}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                Export to .csv
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 top-10 bg-black text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Export
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-white rounded-md border border-gray-200">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-900 border-b border-gray-200">
                <th className="px-2 py-2 text-left text-xs border-r border-gray-200 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === items.length && items.length > 0}
                    onChange={() =>
                      setSelectedRows(
                        selectedRows.length === items.length
                          ? []
                          : items.map((item) => item.id)
                      )
                    }
                  />
                </th>
                {fields.map((field) =>
                  !hiddenFields.includes(field) && (
                    <th
                      key={field}
                      className="group relative px-4 py-2 text-left font-medium text-xs border-r border-gray-200 cursor-move"
                      draggable
                      onDragStart={(e) => handleColumnDragStart(e, field)}
                      onDragOver={handleColumnDragOver}
                      onDrop={(e) => handleColumnDrop(e, field)}
                    >
                      <div className="flex flex-col">
                        <span>{field}</span>
                        <span className="text-gray-500 text-[10px]">{columnTypes[field] || "unknown"}</span>
                      </div>
                      <button
                        onClick={() => hideColumn(field)}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          strokeWidth="1.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88a3 3 0 104.24 4.24M10.73 5.08A10.43 10.43 0 0112 5c4.48 0 8.27 2.94 9.54 7a11.77 11.77 0 01-2.2 3.68M6.27 6.27A10.43 10.43 0 005 12c1.27 4.06 5.06 7 9.54 7a10.43 10.43 0 003.68-2.2" />
                        </svg>
                      </button>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, rowIndex) => {
                if (!inputRefs.current[rowIndex]) {
                  inputRefs.current[rowIndex] = [];
                }
                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    <td className="px-2 py-2 text-xs border-r border-gray-200 w-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.id)}
                        onChange={() => toggleRowSelection(item.id)}
                      />
                    </td>
                    {fields.map((field, colIndex) =>
                      !hiddenFields.includes(field) && (
                        <td
                          key={field}
                          className={`px-4 py-2 text-xs border-r border-gray-200 ${unchangeableFields.includes(field) ? "bg-gray-100" : ""}`}
                          onDoubleClick={() =>
                            !unchangeableFields.includes(field) && startEditing(item.id, field, item[field]?.toString() || "")
                          }
                        >
                          {editingCell?.id === item.id && editingCell?.field === field && !unchangeableFields.includes(field) ? (
                            <div className="flex flex-col gap-2">
                              {field.endsWith("_id") && foreignKeyOptions[field] ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="border border-gray-300 p-1 text-xs rounded-md w-full"
                                >
                                  <option value="">Select...</option>
                                  {foreignKeyOptions[field].map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  ref={(el) => (inputRefs.current[rowIndex][colIndex] = el)}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="border border-gray-300 p-1 text-xs rounded-md w-full"
                                />
                              )}
                              <div className="flex gap-2">
                                <IconButton
                                  onClick={() => saveEdit(item.id, field, item[field]?.toString() || "")}
                                  disabled={editValue === (item[field]?.toString() || "")}
                                  iconPath="M5 13l4 4L19 7"
                                  tooltip="Save"
                                />
                                <IconButton
                                  onClick={cancelEdit}
                                  iconPath="M6 18L18 6M6 6l12 12"
                                  tooltip="Cancel"
                                />
                                <IconButton
                                  onClick={() => setToNull(item.id, field)}
                                  disabled={item[field] === null}
                                  iconPath="M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z"
                                  tooltip="NULL"
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600 block whitespace-nowrap overflow-hidden text-ellipsis">
                              {item[field]?.toString() || ""}
                            </span>
                          )}
                        </td>
                      )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}