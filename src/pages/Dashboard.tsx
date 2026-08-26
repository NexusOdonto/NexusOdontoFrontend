import { DashboardLayout } from '../layouts/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Dashboard</h1>
        <p className="text-slate-600">Bienvenido al panel de control de NexusOdonto</p>
      </div>
    </DashboardLayout>
  );
}
