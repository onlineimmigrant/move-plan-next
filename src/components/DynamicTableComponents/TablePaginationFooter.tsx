// admin/components/TablePaginationFooter.tsx
import { cn } from "@/lib/utils";

interface TablePaginationFooterProps {
  pageSortingComponent?: React.ReactNode;
}

export default function TablePaginationFooter({
  pageSortingComponent,
}: TablePaginationFooterProps) {
  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50",
        "flex justify-end items-center"
      )}
    >
      <div className="w-full max-w-7xl flex justify-end">
        {pageSortingComponent}
      </div>
    </footer>
  );
}