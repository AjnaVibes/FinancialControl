import { StatCardProps } from './StatCard.types';
export function StatCard({ title, value, change, icon, loading=false }: StatCardProps) {
  if (loading) {
    return <div className="card p-6 animate-pulse space-y-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div><div className="h-8 bg-gray-200 rounded w-3/4"></div></div>;
  }
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="text-sm">
              <span className={change.type==='increase' ? 'text-green-600' : 'text-red-600'}>
                {change.type==='increase' ? '▲' : '▼'} {change.value}%
              </span>
            </div>
          )}
        </div>
        {icon && <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>}
      </div>
    </div>
  );
}
