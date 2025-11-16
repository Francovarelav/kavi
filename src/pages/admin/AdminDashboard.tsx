import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { IconCar, IconMessages, IconFileAnalytics, IconChartBar } from "@tabler/icons-react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (!userData) {
    return null;
  }

  const stats = [
    { label: "Carros", value: "0", icon: IconCar, color: "text-blue-500" },
    { label: "Conversaciones", value: "0", icon: IconMessages, color: "text-green-500" },
    { label: "Reglas Activas", value: "0", icon: IconFileAnalytics, color: "text-purple-500" },
    { label: "Sugerencias", value: "0", icon: IconChartBar, color: "text-orange-500" },
  ];

  return (
    <SidebarProvider>
      <AdminSidebar 
        user={{
          name: userData.name,
          email: userData.email,
        }}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Dashboard de Administrador</h1>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Bienvenida */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-1">Hola, {userData.name}</h2>
            <p className="text-muted-foreground">Bienvenido al panel de administración de Kaviai</p>
          </Card>

          {/* Métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>

          {/* Gráficas */}
          <ChartAreaInteractive />

          {/* Acciones rápidas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Acciones Rápidas</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card 
                className="p-6 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => navigate("/admin/cars")}
              >
                <IconCar className="h-6 w-6 mb-2 text-blue-500" />
                <h4 className="font-semibold mb-1">Subir Carros</h4>
                <p className="text-sm text-muted-foreground">Importa inventario desde Excel o captura manual</p>
              </Card>
              <Card className="p-6 hover:bg-accent cursor-pointer transition-colors opacity-50">
                <IconFileAnalytics className="h-6 w-6 mb-2 text-purple-500" />
                <h4 className="font-semibold mb-1">Gestionar Reglas</h4>
                <p className="text-sm text-muted-foreground">Configura reglas de IA</p>
              </Card>
              <Card className="p-6 hover:bg-accent cursor-pointer transition-colors opacity-50">
                <IconMessages className="h-6 w-6 mb-2 text-green-500" />
                <h4 className="font-semibold mb-1">Ver Conversaciones</h4>
                <p className="text-sm text-muted-foreground">Revisa interacciones del agente</p>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
