export interface Item {
    id: string;
    [key: string]: any;
    field?: string; // Add field property for foreign key modal
  }
  
  export interface DynamicTableProps {
    tableName: string;
    apiEndpoint: string;
  }
  
  export interface FilterCriteria {
    field: string;
    value: string;
  }
  
  export interface SortCriteria {
    field: string;
    direction: "asc" | "desc";
  }
  
  export interface ForeignKeyOption {
    id: string;
    name: string;
  }
  
  export interface EditingCell {
    id: string;
    field: string;
  }