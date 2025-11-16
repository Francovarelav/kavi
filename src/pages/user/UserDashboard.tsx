import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserSidebar } from "@/components/user-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function UserDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/user/login");
  };

  if (!userData) {
    return null;
  }

  return (
    <SidebarProvider>
      <UserSidebar 
        user={{
          name: userData.name,
          email: userData.email,
        }}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Dashboard de Vendedor</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid gap-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-2xl font-bold mb-2">Hola User</h2>
              <p className="text-muted-foreground">
                Bienvenido, <span className="font-semibold text-foreground">{userData.name}</span>!
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

