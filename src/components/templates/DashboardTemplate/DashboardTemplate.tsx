import { ReactNode } from 'react';
export function DashboardTemplate({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode; }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container-prose py-4 flex items-center justify-between">
          <div className="font-semibold">Financial Control</div>
          <nav className="flex gap-4 text-sm">
            <a className="hover:underline" href="/dashboard">Dashboard</a>
            <a className="hover:underline" href="/dashboard/projects">Proyectos</a>
            <a className="hover:underline" href="/dashboard/settings">Ajustes</a>
          </nav>
        </div>
      </header>
      <main className="container-prose py-8">
        {(title || actions) && (
          <div className="mb-6 flex items-center justify-between">
            {title && <h1 className="text-3xl font-bold">{title}</h1>}
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
