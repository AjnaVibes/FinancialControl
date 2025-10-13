import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Financial Control</h1>
        <p className="text-gray-600">Ir al <Link className="underline" href="/dashboard">Dashboard</Link></p>
      </div>
    </div>
  );
}
