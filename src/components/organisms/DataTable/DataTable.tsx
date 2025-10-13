import type { DataTableProps } from './DataTable.types';
export function DataTable<T extends { id: string }>({ data, columns, loading=false, emptyMessage='No hay datos.' }: DataTableProps<T>) {
  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!data.length) return <div className="p-8 text-center border rounded-lg">{emptyMessage}</div>;
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr>{columns.map(c => <th key={c.key} className="text-left font-semibold py-2 border-b">{c.header}</th>)}</tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {columns.map((c) => <td key={c.key} className="py-2 border-b">{c.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
