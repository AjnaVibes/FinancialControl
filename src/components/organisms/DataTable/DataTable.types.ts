export interface Column<T> { key: string; header: string; cell: (row: T) => React.ReactNode; width?: string; }
export interface DataTableProps<T> {
  data: T[]; columns: Column<T>[]; loading?: boolean; emptyMessage?: string;
}
