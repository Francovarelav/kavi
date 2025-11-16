import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { IconCar, IconMessages, IconFileAnalytics, IconChartBar } from "@tabler/icons-react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    cars: 0,
    conversations: 0,
    rules: 0,
    insights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [carsSnap, sessionsSnap, rulesSnap, dataCallsSnap] = await Promise.all([
        getDocs(collection(db, "cars")),
        getDocs(collection(db, "sessions")),
        getDocs(collection(db, "rules")),
        getDocs(collection(db, "dataCalls")),
      ]);

      setStats({
        cars: carsSnap.size,
        conversations: sessionsSnap.size,
        rules: rulesSnap.size,
        insights: dataCallsSnap.size,
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (!userData) {
    return null;
  }

  const statsData = [
    { label: "Carros", value: loading ? "..." : stats.cars.toString(), icon: IconCar, color: "text-blue-500" },
    { label: "Conversaciones", value: loading ? "..." : stats.conversations.toString(), icon: IconMessages, color: "text-green-500" },
    { label: "Reglas Activas", value: loading ? "..." : stats.rules.toString(), icon: IconFileAnalytics, color: "text-purple-500" },
    { label: "Insights", value: loading ? "..." : stats.insights.toString(), icon: IconChartBar, color: "text-orange-500" },
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
            {statsData.map((stat) => (
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
