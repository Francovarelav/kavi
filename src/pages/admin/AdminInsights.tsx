import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconSparkles, IconUser, IconSearch, IconCar, IconBulb, IconTrendingUp, IconThumbUp, IconThumbDown } from "@tabler/icons-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type DataCall = {
  id: string;
  sessionId: string;
  summary: string;
  insights: {
    userProfile: string;
    searchCriteria: string;
    recommendations: string;
    keyPoints: string[];
  };
  createdAt: string;
  feedback?: "positive" | "negative" | null;
};

export default function AdminInsights() {
  const { userData } = useAuth();
  const [dataCalls, setDataCalls] = useState<DataCall[]>([]);
  const [loading, setLoading] = useState(true);

  // Estadísticas agregadas
  const [stats, setStats] = useState({
    totalInsights: 0,
    topSearchCriteria: [] as { criteria: string; count: number }[],
    topBrands: [] as { brand: string; count: number }[],
  });

  useEffect(() => {
    loadDataCalls();
  }, []);

  const loadDataCalls = async () => {
    try {
      const q = query(collection(db, "dataCalls"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const dataCallsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sessionId: data.sessionId || "",
          summary: data.summary || "",
          insights: data.insights || {
            userProfile: "",
            searchCriteria: "",
            recommendations: "",
            keyPoints: []
          },
          createdAt: data.createdAt || ""
        } as DataCall;
      });
      
      setDataCalls(dataCallsData);
      calculateStats(dataCallsData);
    } catch (error) {
      console.error("Error cargando insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (dataCallId: string, feedbackType: "positive" | "negative") => {
    try {
      const dataCallRef = doc(db, "dataCalls", dataCallId);
      await updateDoc(dataCallRef, {
        feedback: feedbackType
      });
      
      // Actualizar estado local
      setDataCalls(prev => prev.map(dc => 
        dc.id === dataCallId ? { ...dc, feedback: feedbackType } : dc
      ));
      
      toast.success(feedbackType === "positive" ? "¡Gracias! Feedback positivo registrado" : "Feedback negativo registrado");
    } catch (error) {
      console.error("Error guardando feedback:", error);
      toast.error("Error guardando feedback");
    }
  };

  const calculateStats = (data: DataCall[]) => {
    // Análisis de criterios de búsqueda más comunes
    const criteriaMap = new Map<string, number>();
    const brandsMap = new Map<string, number>();

    data.forEach(dc => {
      // Extraer criterios
      const criteria = dc.insights.searchCriteria.toLowerCase();
      if (criteria.includes("sedán")) criteriaMap.set("Sedán", (criteriaMap.get("Sedán") || 0) + 1);
      if (criteria.includes("suv")) criteriaMap.set("SUV", (criteriaMap.get("SUV") || 0) + 1);
      if (criteria.includes("pickup")) criteriaMap.set("Pickup", (criteriaMap.get("Pickup") || 0) + 1);
      if (criteria.includes("automático")) criteriaMap.set("Automático", (criteriaMap.get("Automático") || 0) + 1);
      if (criteria.includes("gasolina")) criteriaMap.set("Gasolina", (criteriaMap.get("Gasolina") || 0) + 1);

      // Extraer marcas
      const brands = ["honda", "toyota", "nissan", "mazda", "volkswagen", "ford", "chevrolet"];
      brands.forEach(brand => {
        if (criteria.includes(brand) || dc.insights.recommendations.toLowerCase().includes(brand)) {
          const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
          brandsMap.set(capitalizedBrand, (brandsMap.get(capitalizedBrand) || 0) + 1);
        }
      });
    });

    const topCriteria = Array.from(criteriaMap.entries())
      .map(([criteria, count]) => ({ criteria, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topBrands = Array.from(brandsMap.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalInsights: data.length,
      topSearchCriteria: topCriteria,
      topBrands: topBrands,
    });
  };

  return (
    <SidebarProvider>
      <AdminSidebar 
        user={{
          name: userData?.name || "Admin",
          email: userData?.email || "",
        }}
      />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Insights</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-6 p-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-gray-400">Cargando insights...</p>
            </div>
          ) : (
            <>
              {/* Hero Stats */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <IconSparkles className="w-8 h-8" />
                  <div>
                    <h1 className="text-3xl font-bold">Insights de IA</h1>
                    <p className="text-blue-100">Análisis inteligente de conversaciones</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-sm opacity-80">Total Insights</p>
                    <p className="text-3xl font-bold">{stats.totalInsights}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-sm opacity-80">Criterio más buscado</p>
                    <p className="text-2xl font-bold">
                      {stats.topSearchCriteria[0]?.criteria || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-sm opacity-80">Marca más popular</p>
                    <p className="text-2xl font-bold">
                      {stats.topBrands[0]?.brand || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Criterios de Búsqueda */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconSearch className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Criterios Más Buscados</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.topSearchCriteria.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-300">#{idx + 1}</span>
                          <span className="text-gray-700">{item.criteria}</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {item.count}
                        </span>
                      </div>
                    ))}
                    {stats.topSearchCriteria.length === 0 && (
                      <p className="text-gray-400 text-sm">No hay datos suficientes</p>
                    )}
                  </div>
                </Card>

                {/* Top Marcas */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <IconCar className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Marcas Más Populares</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.topBrands.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-300">#{idx + 1}</span>
                          <span className="text-gray-700">{item.brand}</span>
                        </div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {item.count}
                        </span>
                      </div>
                    ))}
                    {stats.topBrands.length === 0 && (
                      <p className="text-gray-400 text-sm">No hay datos suficientes</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Lista de Insights Recientes */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IconTrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Insights Recientes</h3>
                </div>
                <div className="space-y-4">
                  {dataCalls.slice(0, 10).map((dc) => (
                    <div key={dc.id} className="border-l-4 border-l-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-sm font-medium text-gray-900">{dc.summary}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(dc.createdAt).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <IconUser className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-600">Perfil</span>
                          </div>
                          <p className="text-xs text-gray-700">{dc.insights.userProfile}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <IconSearch className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-600">Búsqueda</span>
                          </div>
                          <p className="text-xs text-gray-700">{dc.insights.searchCriteria}</p>
                        </div>
                      </div>

                      {dc.insights.keyPoints.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <IconBulb className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-600">Puntos Clave</span>
                          </div>
                          <ul className="space-y-1">
                            {dc.insights.keyPoints.slice(0, 3).map((point, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Feedback Buttons */}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs text-gray-500">¿Este insight fue útil?</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={dc.feedback === "positive" ? "default" : "outline"}
                            className={`h-8 px-3 ${dc.feedback === "positive" ? "bg-green-600 hover:bg-green-700" : ""}`}
                            onClick={() => handleFeedback(dc.id, "positive")}
                          >
                            <IconThumbUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={dc.feedback === "negative" ? "default" : "outline"}
                            className={`h-8 px-3 ${dc.feedback === "negative" ? "bg-red-600 hover:bg-red-700" : ""}`}
                            onClick={() => handleFeedback(dc.id, "negative")}
                          >
                            <IconThumbDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dataCalls.length === 0 && (
                    <p className="text-gray-400 text-center py-8">
                      No hay insights generados aún. Ve a "Conversaciones" y genera algunos.
                    </p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

