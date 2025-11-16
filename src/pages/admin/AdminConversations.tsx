import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { IconMessages, IconMessageCircle, IconRobot, IconUser, IconSparkles, IconCar, IconClock, IconStar, IconStarFilled } from "@tabler/icons-react";
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

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  rating?: number; // 1-5 estrellas
  feedback?: string; // Comentario del admin
};

type Session = {
  id: string;
  startTime: string;
  endTime?: string;
  status: string;
  messages: Message[];
  lastRecommendations?: {
    cars: any[];
    criteria: any;
    timestamp: string;
  };
};

type DataCall = {
  id: string; // ID del documento en Firestore
  sessionId: string;
  summary: string;
  insights: {
    userProfile: string;
    searchCriteria: string;
    recommendations: string;
    keyPoints: string[];
  };
  createdAt: string;
  adminFeedback?: {
    rating: number; // 1-5
    comment: string;
    createdAt: string;
    adminName: string;
  };
};

export default function AdminConversations() {
  const { userData } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [dataCalls, setDataCalls] = useState<DataCall[]>([]);
  const [ratingMessage, setRatingMessage] = useState<{ sessionId: string; messageIndex: number } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [insightFeedback, setInsightFeedback] = useState({ rating: 0, comment: "" });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    loadSessions();
    loadDataCalls();
  }, []);

  useEffect(() => {
    // Resetear formulario cuando se abre/cierra el modal
    if (!selectedSession) {
      setShowFeedbackForm(false);
      setInsightFeedback({ rating: 0, comment: "" });
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const q = query(collection(db, "sessions"), orderBy("startTime", "desc"));
      const snapshot = await getDocs(q);
      const sessionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // 🔥 ACEPTA TODAS LAS ESTRUCTURAS POSIBLES:
        // 1. conversationData.finalMessages (estructura antigua)
        // 2. finalMessages (directo)
        // 3. messages (estructura nueva)
        let messagesArray = [];
        if (data.conversationData?.finalMessages && Array.isArray(data.conversationData.finalMessages)) {
          messagesArray = data.conversationData.finalMessages;
        } else if (data.finalMessages && Array.isArray(data.finalMessages)) {
          messagesArray = data.finalMessages;
        } else if (data.messages && Array.isArray(data.messages)) {
          messagesArray = data.messages;
        }
        
        console.log(`📊 Sesión ${doc.id}:`, messagesArray.length, "mensajes");
        
        return {
          id: doc.id,
          ...data,
          messages: messagesArray, // Usa el array que exista
        };
      }) as Session[];
      
      console.log("📊 Sesiones cargadas:", sessionsData.length);
      sessionsData.forEach(s => {
        console.log(`  - ${s.id}: ${s.messages?.length || 0} mensajes`);
      });
      
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error cargando sesiones:", error);
      toast.error("Error cargando conversaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadDataCalls = async () => {
    try {
      const q = query(collection(db, "dataCalls"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const dataCallsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, // ID del documento en Firestore
          sessionId: data.sessionId || "",
          summary: data.summary || "",
          insights: data.insights || {
            userProfile: "",
            searchCriteria: "",
            recommendations: "",
            keyPoints: []
          },
          createdAt: data.createdAt || "",
          adminFeedback: data.adminFeedback || undefined,
        } as DataCall;
      });
      setDataCalls(dataCallsData);
    } catch (error) {
      console.error("Error cargando data calls:", error);
    }
  };

  const generateInsights = async (session: Session) => {
    setGeneratingInsights(true);
    try {
      const apiKey = "AIzaSyDnUMpfjOO0H39P0DfkBZRq7pyiLnAql1c";
      
      // Preparar el contexto de la conversación
      const conversationText = session.messages
        .map(m => `${m.role === "user" ? "Usuario" : "Kavi"}: ${m.content}`)
        .join("\n");

      const recommendationsText = session.lastRecommendations
        ? `Recomendaciones: ${session.lastRecommendations.cars.map(c => `${c.make} ${c.model} (${c.year})`).join(", ")}`
        : "Sin recomendaciones";

      const prompt = `Analiza esta conversación de un cliente buscando un auto y genera insights detallados en formato JSON.

Conversación:
${conversationText}

${recommendationsText}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "summary": "Resumen breve de la conversación (2-3 líneas)",
  "userProfile": "Perfil del usuario (edad, necesidad, presupuesto)",
  "searchCriteria": "Criterios de búsqueda específicos",
  "recommendations": "Análisis de las recomendaciones dadas",
  "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();
      let insightsText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      insightsText = insightsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const insights = JSON.parse(insightsText);

      // Guardar en dataCalls
      const dataCall: Omit<DataCall, "id"> = {
        sessionId: session.id,
        summary: insights.summary,
        insights: {
          userProfile: insights.userProfile,
          searchCriteria: insights.searchCriteria,
          recommendations: insights.recommendations,
          keyPoints: insights.keyPoints || []
        },
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "dataCalls"), dataCall);
      
      toast.success("Insights generados correctamente");
      loadDataCalls();
      setSelectedSession(null);
    } catch (error) {
      console.error("Error generando insights:", error);
      toast.error("Error generando insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getDataCallForSession = (sessionId: string) => {
    return dataCalls.find(dc => dc.sessionId === sessionId);
  };

  const handleSaveInsightFeedback = async () => {
    if (!selectedSession || insightFeedback.rating === 0) {
      toast.error("Por favor, selecciona una calificación");
      return;
    }

    try {
      const dataCall = getDataCallForSession(selectedSession.id);
      if (!dataCall) {
        toast.error("No se encontró el insight");
        return;
      }

      // Usar el ID del documento, NO el sessionId
      const dataCallRef = doc(db, "dataCalls", dataCall.id);
      const feedbackData = {
        adminFeedback: {
          rating: insightFeedback.rating,
          comment: insightFeedback.comment,
          createdAt: new Date().toISOString(),
          adminName: userData?.name || "Admin",
        }
      };

      await updateDoc(dataCallRef, feedbackData);

      // Actualizar estado local usando el ID correcto
      setDataCalls(prev => prev.map(dc => 
        dc.id === dataCall.id 
          ? { ...dc, ...feedbackData } 
          : dc
      ));

      setShowFeedbackForm(false);
      setInsightFeedback({ rating: 0, comment: "" });
      toast.success("Feedback guardado exitosamente");
    } catch (error) {
      console.error("Error guardando feedback:", error);
      toast.error("Error guardando feedback");
    }
  };

  const handleRateMessage = async (sessionId: string, messageIndex: number, rating: number) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const updatedMessages = [...session.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        rating,
      };

      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, {
        messages: updatedMessages,
      });

      // Actualizar estado local
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: updatedMessages } : s
      ));

      if (selectedSession?.id === sessionId) {
        setSelectedSession({ ...selectedSession, messages: updatedMessages });
      }

      toast.success(`Calificación guardada: ${rating} estrella${rating > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error guardando calificación:", error);
      toast.error("Error guardando calificación");
    }
  };

  const handleAddFeedback = async (sessionId: string, messageIndex: number, feedback: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const updatedMessages = [...session.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        feedback,
      };

      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, {
        messages: updatedMessages,
      });

      // Actualizar estado local
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: updatedMessages } : s
      ));

      if (selectedSession?.id === sessionId) {
        setSelectedSession({ ...selectedSession, messages: updatedMessages });
      }

      setRatingMessage(null);
      setFeedbackText("");
      toast.success("Feedback guardado exitosamente");
    } catch (error) {
      console.error("Error guardando feedback:", error);
      toast.error("Error guardando feedback");
    }
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
        {/* Header con breadcrumb */}
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
                <BreadcrumbPage>Conversaciones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-gray-400">Cargando conversaciones...</p>
            </div>
          ) : (
            <>
              {/* Header Hero con Gradiente */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <IconMessages className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Historial de Conversaciones</h1>
                    <p className="text-blue-100 mt-1">Gestiona y analiza todas las interacciones con Kavi AI</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-sm text-blue-100">Total</p>
                    <p className="text-3xl font-bold">{sessions.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-sm text-blue-100">Con Insights</p>
                    <p className="text-3xl font-bold">{dataCalls.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-sm text-blue-100">Con Recomendaciones</p>
                    <p className="text-3xl font-bold">{sessions.filter(s => s.lastRecommendations).length}</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards (removido, ahora está en el header) */}
              <div className="hidden grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <IconMessageCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Conversaciones</p>
                      <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <IconSparkles className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Insights Generados</p>
                      <p className="text-2xl font-bold text-gray-900">{dataCalls.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <IconCar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Con Recomendaciones</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sessions.filter(s => s.lastRecommendations).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Lista de conversaciones */}
              <div className="space-y-3">
                {sessions.map((session) => {
                  const dataCall = getDataCallForSession(session.id);
                  const hasInsights = !!dataCall;
                  const messages = session.messages || [];
                  const firstUserMessage = messages.find(m => m.role === "user")?.content || 
                                          messages[0]?.content || 
                                          "Conversación iniciada";

                  return (
                    <Card 
                      key={session.id} 
                      className="p-4 hover:shadow-md transition-all border-l-4 border-l-blue-500"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Info principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <IconClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(session.startTime).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {hasInsights && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">
                                ✓ Con insights
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-1 mb-3">
                            "{firstUserMessage.substring(0, 100)}..."
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <IconMessageCircle className="w-3.5 h-3.5" />
                              {messages.length} mensajes
                            </span>
                            {session.lastRecommendations && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <IconCar className="w-3.5 h-3.5" />
                                {session.lastRecommendations.cars.length} autos
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón */}
                        <Button
                          size="sm"
                          variant={hasInsights ? "outline" : "default"}
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasInsights) {
                              setSelectedSession(session);
                            } else {
                              generateInsights(session);
                            }
                          }}
                          disabled={generatingInsights}
                        >
                          {hasInsights ? (
                            "Ver"
                          ) : (
                            <>
                              <IconSparkles className="w-4 h-4 mr-1" />
                              Insights
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SidebarInset>

      {/* Modal de detalles */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-hidden p-0">
          <VisuallyHidden>
            <DialogTitle>Detalles de la Conversación</DialogTitle>
          </VisuallyHidden>
          {selectedSession && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Header bonito */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Detalles de la Conversación</h2>
                    <div className="flex items-center gap-4 text-sm text-blue-100">
                      <span className="flex items-center gap-1">
                        <IconClock className="w-4 h-4" />
                        {new Date(selectedSession.startTime).toLocaleString('es-MX')}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconMessageCircle className="w-4 h-4" />
                        {selectedSession.messages.length} mensajes
                      </span>
                      {selectedSession.lastRecommendations && (
                        <span className="flex items-center gap-1">
                          <IconCar className="w-4 h-4" />
                          {selectedSession.lastRecommendations.cars.length} autos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Insights */}
              {getDataCallForSession(selectedSession.id) && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <IconSparkles className="w-5 h-5 text-blue-600" />
                    Insights de IA
                  </h3>
                  
                  {(() => {
                    const dataCall = getDataCallForSession(selectedSession.id)!;
                    return (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Resumen</p>
                          <p className="text-gray-800">{dataCall.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-1">Perfil del Usuario</p>
                            <p className="text-sm text-gray-700">{dataCall.insights.userProfile}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-1">Criterios de Búsqueda</p>
                            <p className="text-sm text-gray-700">{dataCall.insights.searchCriteria}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Análisis de Recomendaciones</p>
                          <p className="text-sm text-gray-700">{dataCall.insights.recommendations}</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Puntos Clave</p>
                          <ul className="space-y-1">
                            {dataCall.insights.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Sección de Feedback del Admin */}
                        <div className="border-t-2 border-blue-300 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
                              <IconMessageCircle className="w-5 h-5 text-purple-600" />
                              Feedback del Administrador
                            </h4>
                            {!showFeedbackForm && !dataCall.adminFeedback && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setShowFeedbackForm(true);
                                  setInsightFeedback({ rating: 0, comment: "" });
                                }}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                + Agregar Feedback
                              </Button>
                            )}
                          </div>

                          {dataCall.adminFeedback ? (
                            <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-700">Calificación:</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <IconStarFilled
                                        key={star}
                                        className={`w-5 h-5 ${
                                          star <= dataCall.adminFeedback!.rating
                                            ? "text-yellow-500"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({dataCall.adminFeedback.rating}/5)
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowFeedbackForm(true);
                                    setInsightFeedback({
                                      rating: dataCall.adminFeedback!.rating,
                                      comment: dataCall.adminFeedback!.comment,
                                    });
                                  }}
                                >
                                  Editar
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Comentario:</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                  {dataCall.adminFeedback.comment}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                  <span>Por: {dataCall.adminFeedback.adminName}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(dataCall.adminFeedback.createdAt).toLocaleString('es-MX')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : showFeedbackForm ? (
                            <div className="bg-white rounded-lg p-4 border-2 border-purple-300 space-y-4">
                              <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Calificación del Insight (1-5 estrellas) *
                                </label>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setInsightFeedback(prev => ({ ...prev, rating: star }))}
                                      className="hover:scale-110 transition-transform"
                                    >
                                      {insightFeedback.rating >= star ? (
                                        <IconStarFilled className="w-7 h-7 text-yellow-500" />
                                      ) : (
                                        <IconStar className="w-7 h-7 text-gray-300 hover:text-yellow-400" />
                                      )}
                                    </button>
                                  ))}
                                  {insightFeedback.rating > 0 && (
                                    <span className="ml-2 text-sm text-gray-600 flex items-center">
                                      {insightFeedback.rating}/5
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Comentario sobre el Insight *
                                </label>
                                <Textarea
                                  placeholder="¿Qué tan útil fue este insight? ¿Qué mejorarías? ¿La AI entendió bien al usuario?"
                                  value={insightFeedback.comment}
                                  onChange={(e) => setInsightFeedback(prev => ({ ...prev, comment: e.target.value }))}
                                  className="min-h-[100px]"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveInsightFeedback}
                                  className="bg-purple-600 hover:bg-purple-700"
                                  disabled={insightFeedback.rating === 0 || !insightFeedback.comment.trim()}
                                >
                                  Guardar Feedback
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowFeedbackForm(false);
                                    setInsightFeedback({ rating: 0, comment: "" });
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No hay feedback aún. Haz click en "Agregar Feedback" para evaluar este insight.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Conversación con Calificación */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Conversación y Feedback</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {selectedSession.messages.map((msg, idx) => (
                    <div key={idx}>
                      <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <IconRobot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 max-w-[70%]">
                          <div
                            className={`px-4 py-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString('es-MX')}
                            </p>
                          </div>

                          {/* Sistema de Calificación (solo para respuestas del asistente) */}
                          {msg.role === "assistant" && (
                            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-600">Calificar respuesta:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => handleRateMessage(selectedSession.id, idx, star)}
                                      className="hover:scale-110 transition-transform"
                                    >
                                      {msg.rating && star <= msg.rating ? (
                                        <IconStarFilled className="w-4 h-4 text-yellow-500" />
                                      ) : (
                                        <IconStar className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {msg.rating && (
                                <div className="space-y-2">
                                  {msg.feedback ? (
                                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                      <p className="text-xs font-semibold text-blue-800 mb-1">Tu feedback:</p>
                                      <p className="text-xs text-blue-700">{msg.feedback}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs mt-1"
                                        onClick={() => {
                                          setRatingMessage({ sessionId: selectedSession.id, messageIndex: idx });
                                          setFeedbackText(msg.feedback || "");
                                        }}
                                      >
                                        Editar
                                      </Button>
                                    </div>
                                  ) : ratingMessage?.sessionId === selectedSession.id && ratingMessage?.messageIndex === idx ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        placeholder="¿Qué estuvo bien o mal? (opcional)"
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        className="text-xs h-20"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddFeedback(selectedSession.id, idx, feedbackText)}
                                          className="h-7 text-xs"
                                        >
                                          Guardar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setRatingMessage(null);
                                            setFeedbackText("");
                                          }}
                                          className="h-7 text-xs"
                                        >
                                          Cancelar
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs w-full"
                                      onClick={() => {
                                        setRatingMessage({ sessionId: selectedSession.id, messageIndex: idx });
                                        setFeedbackText("");
                                      }}
                                    >
                                      + Agregar comentario
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <IconUser className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendaciones */}
              {selectedSession.lastRecommendations && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Recomendaciones</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSession.lastRecommendations.cars.map((car: any, idx: number) => (
                      <Card key={idx} className="p-4">
                        <h4 className="font-semibold text-gray-800">
                          {car.make} {car.model}
                        </h4>
                        <p className="text-sm text-gray-600">{car.year}</p>
                        <p className="text-sm text-blue-600 font-medium mt-2">
                          ${car.price?.toLocaleString()}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

