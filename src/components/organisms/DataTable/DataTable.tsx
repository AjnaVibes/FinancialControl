import type { DataTableProps } from './DataTable.types';

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  loading = false, 
  emptyMessage = 'No hay datos.' 
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600 dark:text-gray-400">
        Cargando...
      </div>
    );
  }
  
  if (!data.length) {
    return (
      <div className="p-8 text-center border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Wrapper responsive para scroll horizontal en móviles */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.map(c => (
                    <th 
                      key={c.key} 
                      className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {columns.map((c) => (
                      <td 
                        key={c.key} 
                        className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
